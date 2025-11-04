describe('NodeEditorAPI', function(){
  function ensureDom(){
    // minimal DOM elements required by render functions with correct types
    const defs = [
      { id:'ne-node-select', tag:'select' },
      { id:'ne-start-select', tag:'select' },
      { id:'ne-node-id', tag:'input' },
      { id:'ne-node-title', tag:'input' },
      { id:'ne-node-text', tag:'textarea' },
      { id:'ne-node-image', tag:'input' },
      { id:'ne-choices', tag:'div' },
      { id:'ne-actions', tag:'div' },
      { id:'ne-unresolved-panel', tag:'div' },
      { id:'ne-unresolved-list', tag:'ul' },
      { id:'ne-export-multiselect', tag:'select', attrs:{ multiple:'multiple', size:'6' } },
      { id:'ne-export-select-all', tag:'button' },
      { id:'ne-export-select-none', tag:'button' },
      { id:'ne-export-partial', tag:'button' },
    ];
    defs.forEach(d => {
      if(!document.getElementById(d.id)){
        const el = document.createElement(d.tag);
        el.id = d.id;
        if(d.attrs){ Object.entries(d.attrs).forEach(([k,v]) => el.setAttribute(k, v)); }
        document.body.appendChild(el);
      }
    });
  }

  it('exposes API methods', function(){
    expect(window.NodeEditorAPI).to.exist;
    expect(typeof NodeEditorAPI.getSpec).to.equal('function');
    expect(typeof NodeEditorAPI.createNode).to.equal('function');
    expect(typeof NodeEditorAPI.selectNode).to.equal('function');
    expect(typeof NodeEditorAPI.updateNodeText).to.equal('function');
    expect(typeof NodeEditorAPI.addChoiceToNode).to.equal('function');
    expect(typeof NodeEditorAPI.addActionToNode).to.equal('function');
  });

  it('can create/select/update node and add choice/action', function(){
    ensureDom();
    const id = NodeEditorAPI.createNode('t-node');
    expect(id).to.exist;
    expect(NodeEditorAPI.selectNode(id)).to.equal(true);

    // Update text
    expect(NodeEditorAPI.updateNodeText(id, 'Hello Story')).to.equal(true);
    const spec = NodeEditorAPI.getSpec();
    const node = (spec.nodes || []).find(n => n.id === id);
    expect(node && node.text).to.equal('Hello Story');

    // Add choice
    const choicesEl = document.getElementById('ne-choices');
    const beforeChoices = choicesEl.children.length;
    expect(NodeEditorAPI.addChoiceToNode(id, { label:'Next', target:'' })).to.equal(true);
    expect(choicesEl.children.length).to.equal(beforeChoices + 1);

    // Add action
    const actionsEl = document.getElementById('ne-actions');
    const beforeActions = actionsEl.children.length;
    expect(NodeEditorAPI.addActionToNode(id, { type:'set_variable', key:'flag', operation:'set', value:true })).to.equal(true);
    expect(actionsEl.children.length).to.equal(beforeActions + 1);

    // Selection API
    expect(NodeEditorAPI.getSelectedNodeId()).to.equal(id);
  });
});
