(function(){
  // Pure utilities for testing and internal logic
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

  // UI integration
  let specData = { version:'1.0', meta:{ title:'Adventure', start:'start' }, nodes: [] };
  let dirty = false;

  function readUIRefs(){
    return {
      sel: document.getElementById('ne-node-select'),
      startSel: document.getElementById('ne-start-select'),
      id: document.getElementById('ne-node-id'),
      title: document.getElementById('ne-node-title'),
      text: document.getElementById('ne-node-text'),
      choices: document.getElementById('ne-choices'),
      dirtyBanner: document.getElementById('ne-dirty-banner'),
      btnSave: document.getElementById('ne-save'),
      unresolvedPanel: document.getElementById('ne-unresolved-panel'),
      unresolvedList: document.getElementById('ne-unresolved-list'),
      exportMulti: document.getElementById('ne-export-multiselect'),
      exportSelectAll: document.getElementById('ne-export-select-all'),
      exportSelectNone: document.getElementById('ne-export-select-none'),
      exportPartial: document.getElementById('ne-export-partial'),
    };
  }

  function setDirty(v){
    dirty = !!v;
    const { dirtyBanner, btnSave } = readUIRefs();
    if(dirtyBanner) dirtyBanner.hidden = !dirty;
    if(btnSave) btnSave.disabled = !dirty;
  }

  function refreshNodeList(selectedId){
    const { sel } = readUIRefs(); if(!sel) return;
    sel.innerHTML = '';
    (specData.nodes||[]).forEach(n => {
      const opt = document.createElement('option'); opt.value = n.id; opt.textContent = n.id; sel.appendChild(opt);
    });
    if(selectedId && findNodeById(specData.nodes, selectedId)) sel.value = selectedId;
    else if(sel.options.length>0) sel.value = sel.options[0].value;
    renderNodeForm(sel.value);
    refreshStartSelect();
    notifySpecUpdated();
  }

  function renderNodeForm(nodeId){
    const { id, title, text, choices } = readUIRefs();
    const n = findNodeById(specData.nodes, nodeId);
    if(!n){ id.value = ''; title.value=''; text.value=''; choices.innerHTML=''; notifySelectionChanged(''); return; }
    id.value = n.id || '';
    title.value = n.title || '';
    text.value = n.text || '';
    renderChoices(n);
    notifySelectionChanged(n.id || '');
  }

  function renderChoices(node){
    const { choices } = readUIRefs();
    choices.innerHTML = '';
    const arr = Array.isArray(node.choices) ? node.choices : [];
    arr.forEach((c, idx) => {
      const row = document.createElement('div'); row.className = 'ne-choice-row';
      const label = document.createElement('input'); label.type='text'; label.placeholder='ラベル'; label.value = c.label || '';
      const target = document.createElement('input'); target.type='text'; target.placeholder='target:id'; target.value = c.target || '';
      target.setAttribute('list', 'ne-node-id-list');
      const del = document.createElement('button'); del.className = 'btn'; del.textContent = '削除';
      const up = document.createElement('button'); up.className = 'btn'; up.textContent = '↑';
      const down = document.createElement('button'); down.className = 'btn'; down.textContent = '↓';
      label.addEventListener('input', () => { c.label = label.value; setDirty(true); notifySpecUpdated(); });
      function applyTargetValidity(){
        const known = !!findNodeById(specData.nodes, target.value);
        const invalid = !!target.value && !known;
        row.classList.toggle('invalid', invalid);
      }
      target.addEventListener('input', () => { c.target = target.value; applyTargetValidity(); setDirty(true); refreshUnresolvedPanel(); notifySpecUpdated(); });
      del.addEventListener('click', () => { removeChoice(node, idx); renderChoices(node); setDirty(true); refreshUnresolvedPanel(); notifySpecUpdated(); });
      up.addEventListener('click', () => { moveChoice(node, idx, Math.max(0, idx-1)); renderChoices(node); setDirty(true); notifySpecUpdated(); });
      down.addEventListener('click', () => { moveChoice(node, idx, Math.min(arr.length-1, idx+1)); renderChoices(node); setDirty(true); notifySpecUpdated(); });
      row.append(label, target, up, down, del);
      choices.appendChild(row);
      applyTargetValidity();
    });
  }

  function refreshStartSelect(){
    const { startSel } = readUIRefs(); if(!startSel) return;
    startSel.innerHTML = '';
    (specData.nodes||[]).forEach(n => {
      const opt = document.createElement('option'); opt.value = n.id; opt.textContent = n.id; startSel.appendChild(opt);
    });
    if(specData?.meta?.start && findNodeById(specData.nodes, specData.meta.start)) startSel.value = specData.meta.start;
  }

  function refreshNodeIdDatalist(){
    const dl = document.getElementById('ne-node-id-list'); if(!dl) return;
    dl.innerHTML = '';
    (specData.nodes||[]).forEach(n => { const opt = document.createElement('option'); opt.value = n.id; dl.appendChild(opt); });
  }

  function refreshExportList(){
    const { exportMulti } = readUIRefs(); if(!exportMulti) return;
    exportMulti.innerHTML = '';
    (specData.nodes||[]).forEach(n => { const opt = document.createElement('option'); opt.value = n.id; opt.textContent = n.id; exportMulti.appendChild(opt); });
  }

  async function loadFromStorage(){
    try {
      if(dirty && !confirm('未保存の変更があります。破棄して取り込みますか？')) return;
      const raw = window.StorageUtil?.loadJSON?.('agp_game_data', null) || null;
      if(!raw){ alert('agp_game_data が見つかりません。プレイ用JSONをインポートしてください。'); return; }
      let spec = null;
      if(Array.isArray(raw.nodes)){
        // spec-like already
        spec = normalizeSpec(raw);
      } else {
        // engine -> spec
        spec = window.Converters?.engineToSpec ? window.Converters.engineToSpec(raw) : null;
        if(!spec) throw new Error('engineToSpec 変換に失敗');
      }
      specData = normalizeSpec(spec);
      refreshNodeList(specData.meta?.start || (specData.nodes[0]?.id));
      refreshExportList();
      refreshNodeIdDatalist();
      refreshUnresolvedPanel();
      setDirty(false);
      alert('ノード編集に取込みました');
      notifySpecUpdated();
    } catch(e){ console.error('NodeEditor.load', e); alert('取込に失敗しました'); }
  }

  function validateSpec(){
    if(window.Validator?.validateGameSpec){
      const v = window.Validator.validateGameSpec(specData);
      try {
        const panel = document.getElementById('validation-panel');
        const listEl = document.getElementById('validation-list');
        if(panel && listEl){
          listEl.innerHTML = '';
          // エラーのみ表示（警告は未解決targetパネルで可視化）
          (v.errors||[]).forEach(msg => { const li=document.createElement('li'); li.className='err'; li.textContent = msg; listEl.appendChild(li); });
          // 未解決以外の警告はここに表示
          const warnDetails = Array.isArray(v.warningDetails) ? v.warningDetails : [];
          warnDetails.filter(w => w && w.code !== 'WARN_UNRESOLVED_TARGET').forEach(w => {
            const li=document.createElement('li'); li.className='warn'; li.textContent = w.message; listEl.appendChild(li);
          });
          panel.hidden = (listEl.children.length === 0);
        }
      } catch{}
      // 警告はalertも出さず、未解決targetパネルを更新
      refreshUnresolvedPanel();
    } else {
      alert('Validator が見つかりません');
    }
  }

  function saveToStorage(){
    try {
      const engine = window.Converters?.normalizeSpecToEngine ? window.Converters.normalizeSpecToEngine(specData) : null;
      if(!engine) throw new Error('normalizeSpecToEngine 変換に失敗');
      window.StorageUtil?.saveJSON?.('agp_game_data', engine);
      setDirty(false);
      alert('適用保存しました（play.html で反映）');
    } catch(e){ console.error('NodeEditor.save', e); alert('適用保存に失敗しました'); }
  }

  function exportJson(){
    try {
      const blob = new Blob([JSON.stringify(specData, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'game-spec.json'; a.click();
      URL.revokeObjectURL(a.href);
    } catch(e){ console.error('NodeEditor.export', e); alert('JSON出力に失敗しました'); }
  }

  function bindUI(){
    const btnLoad = document.getElementById('ne-load');
    const btnSave = document.getElementById('ne-save');
    const btnValidate = document.getElementById('ne-validate');
    const btnExport = document.getElementById('ne-export');
    const btnAddNode = document.getElementById('ne-add-node');
    const btnRemoveNode = document.getElementById('ne-remove-node');
    const btnAddChoice = document.getElementById('ne-add-choice');

    const { sel, startSel, id, title, text } = readUIRefs();

    if(btnLoad) btnLoad.addEventListener('click', loadFromStorage);
    if(btnValidate) btnValidate.addEventListener('click', validateSpec);
    if(btnSave) btnSave.addEventListener('click', saveToStorage);
    if(btnExport) btnExport.addEventListener('click', exportJson);

    if(sel) sel.addEventListener('change', () => renderNodeForm(sel.value));
    if(startSel) startSel.addEventListener('change', () => { if(!specData.meta) specData.meta = {}; specData.meta.start = startSel.value; setDirty(true); notifySpecUpdated(); });

    if(btnAddNode) btnAddNode.addEventListener('click', () => {
      const ids = (specData.nodes||[]).map(n => n.id);
      const base = 'node:new';
      const nid = ensureUniqueId(base, ids);
      const node = { id: nid, title: '', text: '', choices: [] };
      upsertNode(specData.nodes, node);
      refreshNodeList(nid);
      refreshExportList();
      refreshNodeIdDatalist();
      setDirty(true);
      refreshUnresolvedPanel();
      notifySpecUpdated();
    });

    if(btnRemoveNode) btnRemoveNode.addEventListener('click', () => {
      const { sel } = readUIRefs(); if(!sel || !sel.value) return;
      if(!confirm(`ノード ${sel.value} を削除しますか？`)) return;
      removeNode(specData.nodes, sel.value);
      refreshNodeList(specData.nodes[0]?.id);
      refreshExportList();
      refreshNodeIdDatalist();
      setDirty(true);
      refreshUnresolvedPanel();
      notifySpecUpdated();
    });

    if(id) id.addEventListener('change', () => {
      const { sel } = readUIRefs(); const curId = sel.value; const node = findNodeById(specData.nodes, curId); if(!node) return;
      const ids = (specData.nodes||[]).filter(n=>n!==node).map(n => n.id);
      let nv = id.value.trim(); if(!nv) nv = ensureUniqueId('node:new', ids);
      // 重複IDの場合は自動でユニーク化
      if(ids.includes(nv)) nv = ensureUniqueId(nv, ids);
      if(nv !== node.id){
        // start の更新（もし同一なら）
        if(specData?.meta?.start === node.id){ specData.meta.start = nv; }
        // 参照更新（target）
        const oldId = node.id; const newId = nv;
        let refCount = 0;
        try { refCount = renameReferences(specData, oldId, newId); } catch{}
        if(refCount>0){
          const ok = confirm(`IDを変更しました。${refCount} 件の参照(target)を更新します。よろしいですか？`);
          if(!ok){ // revert references if user cancels
            renameReferences(specData, newId, oldId);
          }
        }
        node.id = nv;
        refreshNodeList(nv);
        refreshExportList();
        refreshNodeIdDatalist();
        refreshUnresolvedPanel();
        // 入力欄にも反映
        const { id: idInput } = readUIRefs(); if(idInput) idInput.value = nv;
        setDirty(true);
        notifySpecUpdated();
      }
    });
    if(text) text.addEventListener('input', () => {
      const { sel } = readUIRefs(); const node = findNodeById(specData.nodes, sel.value); if(!node) return; node.text = text.value;
      setDirty(true);
      notifySpecUpdated();
    });

    if(btnAddChoice) btnAddChoice.addEventListener('click', () => {
      const { sel } = readUIRefs(); const node = findNodeById(specData.nodes, sel.value); if(!node) return;
      addChoice(node, { label:'', target:'' });
      renderChoices(node);
      setDirty(true);
      notifySpecUpdated();
    });

    // Partial export UI bindings
    const { exportMulti, exportSelectAll, exportSelectNone, exportPartial } = readUIRefs();
    if(exportSelectAll) exportSelectAll.addEventListener('click', () => { if(!exportMulti) return; for(const opt of exportMulti.options){ opt.selected = true; } });
    if(exportSelectNone) exportSelectNone.addEventListener('click', () => { if(!exportMulti) return; for(const opt of exportMulti.options){ opt.selected = false; } });
    if(exportPartial) exportPartial.addEventListener('click', () => {
      if(!exportMulti) return;
      const seed = Array.from(exportMulti.selectedOptions).map(o => o.value);
      if(seed.length === 0){ alert('少なくとも1つノードを選択してください'); return; }
      const sub = collectSubgraph(specData, seed);
      try {
        const blob = new Blob([JSON.stringify(sub, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'game-spec.partial.json'; a.click(); URL.revokeObjectURL(a.href);
      } catch(e){ console.error('exportPartial', e); alert('部分エクスポートに失敗しました'); }
    });

    // Keyboard shortcuts (when focus is within node-editor)
    document.addEventListener('keydown', (ev) => {
      const root = document.getElementById('node-editor'); if(!root) return;
      const within = root.contains(document.activeElement) || root.matches(':focus-within');
      if(!within) return;
      if(ev.ctrlKey && ev.key === 's'){ ev.preventDefault(); saveToStorage(); }
      else if(ev.ctrlKey && ev.key === 'Enter'){ ev.preventDefault(); btnAddNode?.click(); }
      else if(ev.altKey && ev.key === 'Enter'){ ev.preventDefault(); btnAddChoice?.click(); }
      else if(!ev.ctrlKey && !ev.altKey && ev.key === 'Delete'){ ev.preventDefault(); btnRemoveNode?.click(); }
    });
  }

  // Unresolved targets summary
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
  function refreshUnresolvedPanel(){
    const { unresolvedPanel, unresolvedList } = readUIRefs(); if(!unresolvedPanel || !unresolvedList) return;
    const items = computeUnresolvedTargets(specData);
    unresolvedList.innerHTML = '';
    items.forEach(it => {
      const li = document.createElement('li');
      li.textContent = `${it.fromId} → ${it.target} (#${it.index+1})`;
      li.addEventListener('click', () => {
        const { sel } = readUIRefs(); if(sel){ sel.value = it.fromId; renderNodeForm(it.fromId); }
      });
      unresolvedList.appendChild(li);
    });
    unresolvedPanel.hidden = items.length === 0;
  }

  function emitEvent(name, detail){
    try { document.dispatchEvent(new CustomEvent(name, { detail })); } catch{}
  }

  function notifySelectionChanged(nodeId){ emitEvent('agp-node-selection-changed', { nodeId }); }
  function notifySpecUpdated(){ emitEvent('agp-spec-updated', {}); }

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

  // Bootstrapping
  document.addEventListener('DOMContentLoaded', () => {
    if(!document.getElementById('node-editor')) return;
    specData = normalizeSpec(specData);
    bindUI();
    refreshNodeList();
    refreshExportList();
    refreshNodeIdDatalist();
    refreshUnresolvedPanel();
    setDirty(false);
  });

  // Expose utils for tests
  window.NodeEditorUtils = { ensureUniqueId, findNodeById, upsertNode, removeNode, addChoice, removeChoice, moveChoice, renameReferences, computeUnresolvedTargets, collectSubgraph, normalizeSpec };
  // Lightweight public API for other panels (e.g., Mermaid preview)
  window.NodeEditorAPI = { getSpec: () => normalizeSpec(specData) };

})();
