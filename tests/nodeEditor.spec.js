describe('NodeEditorUtils', function(){
  const { ensureUniqueId, findNodeById, upsertNode, removeNode, addChoice, removeChoice, normalizeSpec } = window.NodeEditorUtils || {};

  it('ensureUniqueId generates non-colliding id', function(){
    const id = ensureUniqueId('node', ['node','node-1']);
    expect(id).to.equal('node-2');
  });

  it('upsertNode inserts and updates nodes', function(){
    const nodes = [];
    upsertNode(nodes, { id:'a', title:'A' });
    expect(nodes).to.have.length(1);
    upsertNode(nodes, { id:'a', title:'A2' });
    expect(nodes[0].title).to.equal('A2');
  });

  it('removeNode removes by id', function(){
    const nodes = [{id:'a'},{id:'b'}];
    removeNode(nodes, 'a');
    expect(nodes.map(n=>n.id)).to.deep.equal(['b']);
  });

  it('addChoice/removeChoice works', function(){
    const node = { id:'a', choices:[] };
    addChoice(node, { label:'Go', target:'b' });
    expect(node.choices[0]).to.deep.include({ label:'Go', target:'b' });
    removeChoice(node, 0);
    expect(node.choices).to.have.length(0);
  });

  it('normalizeSpec ensures defaults', function(){
    const s = normalizeSpec({});
    expect(s.version).to.equal('1.0');
    expect(s.meta.title).to.exist;
    expect(s.meta.start).to.equal('start');
    expect(Array.isArray(s.nodes)).to.equal(true);
  });

  it('findNodeById finds node', function(){
    const nodes = [{id:'x'},{id:'y'}];
    const n = findNodeById(nodes, 'y');
    expect(n && n.id).to.equal('y');
  });

  it('moveChoice reorders choices', function(){
    const node = { id:'a', choices:[{label:'1'},{label:'2'},{label:'3'}] };
    NodeEditorUtils.moveChoice(node, 0, 2);
    expect(node.choices.map(c=>c.label)).to.deep.equal(['2','3','1']);
  });

  it('renameReferences updates targets across nodes', function(){
    const spec = { nodes:[
      { id:'a', choices:[{label:'go b', target:'b'}] },
      { id:'b', choices:[] },
    ]};
    const count = NodeEditorUtils.renameReferences(spec, 'b', 'c');
    expect(count).to.equal(1);
    expect(spec.nodes[0].choices[0].target).to.equal('c');
  });

  it('computeUnresolvedTargets lists missing targets', function(){
    const spec = { nodes:[
      { id:'start', choices:[{label:'to x', target:'x'}] },
      { id:'a', choices:[] }
    ]};
    const list = NodeEditorUtils.computeUnresolvedTargets(spec);
    expect(list).to.have.length(1);
    expect(list[0].target).to.equal('x');
  });

  it('collectSubgraph collects reachable nodes from seeds', function(){
    const spec = { version:'1.0', meta:{title:'T', start:'a'}, nodes:[
      { id:'a', choices:[{label:'ab', target:'b'}] },
      { id:'b', choices:[{label:'bc', target:'c'}] },
      { id:'c', choices:[] },
      { id:'d', choices:[] },
    ]};
    const sub = NodeEditorUtils.collectSubgraph(spec, ['b']);
    const ids = sub.nodes.map(n=>n.id).sort();
    expect(ids).to.deep.equal(['b','c']);
    expect(sub.meta.start).to.equal('b');
  });
});
