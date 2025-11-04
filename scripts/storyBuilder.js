(function(){
  function ready(){
    const palette = document.getElementById('sb-palette');
    const editor = document.getElementById('editor');
    const actionsEl = document.getElementById('ne-actions');
    const choicesEl = document.getElementById('ne-choices');

    if(!palette && !editor) return;

    function getSelectedOrCreate(){
      const api = window.NodeEditorAPI; if(!api) return '';
      let id = api.getSelectedNodeId && api.getSelectedNodeId();
      if(!id){ id = api.createNode && api.createNode('node'); api.selectNode && api.selectNode(id); }
      return id;
    }

    function handleBlock(type){
      const api = window.NodeEditorAPI; if(!api) return;
      const id = getSelectedOrCreate(); if(!id) return;
      switch(type){
        case 'new_node': {
          const nid = api.createNode('node');
          api.selectNode(nid);
          break;
        }
        case 'choice':
          api.addChoiceToNode(id, { label:'', target:'' });
          break;
        case 'add_item':
          api.addActionToNode(id, { type:'add_item', itemId:'', quantity:1 });
          break;
        case 'use_item':
          api.addActionToNode(id, { type:'use_item', itemId:'', quantity:1, consume:true, effect:{ type:'show_text', text:'' } });
          break;
        case 'set_variable':
          api.addActionToNode(id, { type:'set_variable', key:'', operation:'set', value:0 });
          break;
        case 'clear_inventory':
          api.addActionToNode(id, { type:'clear_inventory' });
          break;
      }
    }

    function makeDraggable(el){
      if(!el) return;
      el.setAttribute('draggable','true');
      el.addEventListener('dragstart', (e)=>{
        const t = el.getAttribute('data-sb-block')||'';
        e.dataTransfer.setData('application/x-sb-block', t);
        e.dataTransfer.setData('text/plain', t);
        e.dataTransfer.effectAllowed = 'copy';
      });
      el.addEventListener('click', ()=>{
        const t = el.getAttribute('data-sb-block')||'';
        handleBlock(t);
      });
    }

    if(palette){
      Array.from(palette.querySelectorAll('[data-sb-block]')).forEach(makeDraggable);
    }

    function bindDropZone(zone, accept){
      if(!zone) return;
      zone.addEventListener('dragover', (e)=>{ e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
      zone.addEventListener('drop', (e)=>{
        e.preventDefault();
        const t = e.dataTransfer.getData('application/x-sb-block') || e.dataTransfer.getData('text/plain');
        if(!t) return;
        if(accept === 'choices' && t === 'choice'){ handleBlock('choice'); }
        else if(accept === 'actions' && t !== 'choice'){ handleBlock(t); }
      });
    }

    bindDropZone(actionsEl, 'actions');
    bindDropZone(choicesEl, 'choices');

    function findNode(spec, id){
      const nodes = (spec && Array.isArray(spec.nodes)) ? spec.nodes : [];
      return nodes.find(n=>n && n.id===id) || null;
    }

    document.addEventListener('agp-node-selection-changed', (e)=>{
      try{
        const id = e && e.detail && e.detail.nodeId; if(!id || !editor) return;
        const spec = window.NodeEditorAPI && window.NodeEditorAPI.getSpec && window.NodeEditorAPI.getSpec();
        const n = findNode(spec, id); if(!n) return;
        editor.innerText = n.text || '';
        setTimeout(()=>{ editor.focus(); }, 50);
      } catch{}
    });

    if(editor){
      let t = 0;
      editor.addEventListener('input', ()=>{
        clearTimeout(t);
        t = setTimeout(()=>{
          const id = window.NodeEditorAPI && window.NodeEditorAPI.getSelectedNodeId && window.NodeEditorAPI.getSelectedNodeId();
          if(id){ window.NodeEditorAPI.updateNodeText && window.NodeEditorAPI.updateNodeText(id, editor.innerText || ''); }
        }, 150);
      });
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
