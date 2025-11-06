(function(){
  // Node Editor Utilities - Pure utility functions for node manipulation and validation

  function ensureUniqueId(baseId, existingIds){
    const set = new Set(existingIds || []);
    if(!set.has(baseId)) return baseId;
    let i = 1;
    while(set.has(`${baseId}-${i}`)) i++;
    return `${baseId}-${i}`;
  }

  function findNodeById(nodes, id){ return (nodes||[]).find(n => n && n.id === id) || null; }

  function upsertNode(nodes, node){
    const idx = (nodes||[]).findIndex(n => n && n.id === node.id);
    if(idx >= 0){ nodes[idx] = node; } else { nodes.push(node); }
    return nodes;
  }

  function removeNode(nodes, id){
    const idx = (nodes||[]).findIndex(n => n && n.id === id);
    if(idx >= 0) nodes.splice(idx, 1);
    return nodes;
  }

  function addChoice(node, choice){
    node.choices = Array.isArray(node.choices) ? node.choices : [];
    node.choices.push({ id: choice?.id || '', label: choice?.label || '', target: choice?.target || '' });
    return node.choices;
  }

  function removeChoice(node, index){
    if(!Array.isArray(node.choices)) return [];
    if(index>=0 && index<node.choices.length) node.choices.splice(index,1);
    return node.choices;
  }

  function moveChoice(node, fromIndex, toIndex){
    if(!Array.isArray(node.choices)) return [];
    const len = node.choices.length;
    if(fromIndex<0 || fromIndex>=len) return node.choices;
    if(toIndex<0 || toIndex>=len) return node.choices;
    const [item] = node.choices.splice(fromIndex,1);
    node.choices.splice(toIndex,0,item);
    return node.choices;
  }

  function renameReferences(spec, oldId, newId){
    let count = 0;
    const nodes = (spec && Array.isArray(spec.nodes)) ? spec.nodes : [];
    nodes.forEach(n => {
      const arr = Array.isArray(n.choices) ? n.choices : [];
      arr.forEach(c => { if(c && c.target === oldId){ c.target = newId; count++; } });
    });
    return count;
  }

  function normalizeSpec(spec){
    const s = spec && typeof spec === 'object' ? spec : {};
    s.version = s.version || '1.0';
    s.meta = s.meta || { title:'Adventure', start:'start' };
    s.meta.title = s.meta.title || 'Adventure';
    s.meta.start = s.meta.start || 'start';
    s.nodes = Array.isArray(s.nodes) ? s.nodes : [];
    return s;
  }

  function computeUnresolvedTargets(spec){
    const out = [];
    const nodes = (spec && Array.isArray(spec.nodes)) ? spec.nodes : [];
    nodes.forEach(n => {
      const arr = Array.isArray(n.choices) ? n.choices : [];
      arr.forEach((c, idx) => {
        if(!c || !c.target) return;
        if(!findNodeById(nodes, c.target)) out.push({ fromId: n.id, index: idx, target: c.target });
      });
    });
    return out;
  }

  // Partial export: collect reachable subgraph from seed IDs
  function collectSubgraph(spec, seedIds){
    const base = normalizeSpec(JSON.parse(JSON.stringify(spec||{})));
    const nodes = base.nodes;
    const idMap = new Map(nodes.map((n,i)=>[n.id, i]));
    const seen = new Set();
    const queue = [];
    (seedIds||[]).forEach(id => { if(idMap.has(id)){ seen.add(id); queue.push(id); } });
    while(queue.length){
      const cur = queue.shift();
      const n = nodes[idMap.get(cur)];
      (n.choices||[]).forEach(c => { if(c && c.target && idMap.has(c.target) && !seen.has(c.target)){ seen.add(c.target); queue.push(c.target); } });
    }
    const filtered = nodes.filter(n => seen.has(n.id));
    return { version: base.version || '1.0', meta: { ...(base.meta||{}), start: (seedIds && seedIds[0]) || base.meta?.start || (filtered[0]?.id || 'start') }, nodes: filtered };
  }

  // Expose utilities
  window.NodeEditorUtils = { ensureUniqueId, findNodeById, upsertNode, removeNode, addChoice, removeChoice, moveChoice, renameReferences, computeUnresolvedTargets, collectSubgraph, normalizeSpec };

})();
