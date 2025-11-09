(function(){
  // Node Editor UI Manager - Handles UI state and rendering

  const { readUIRefs } = window.NodeEditorUIRefs || {};
  if(typeof readUIRefs !== 'function'){
    console.error('NodeEditorUIManager: NodeEditorUIRefs.readUIRefs が見つかりません');
    return;
  }

  const { renderActions: renderActionsForm, renderChoices: renderChoicesForm } = window.NodeEditorForms || {};
  if(!renderActionsForm || !renderChoicesForm){
    console.error('NodeEditorUIManager: NodeEditorForms が見つかりません');
    return;
  }

  const preview = window.NodeEditorPreview || {};
  if(!preview.updatePreview || !preview.updateParallelPreview){
    console.error('NodeEditorUIManager: NodeEditorPreview が見つかりません');
    return;
  }

  let specData = { version:'1.0', meta:{ title:'Adventure', start:'start' }, nodes: [] };
  let dirty = false;

  function setDirty(v){
    dirty = !!v;
    const { dirtyBanner, btnSave } = readUIRefs();
    if(dirtyBanner) dirtyBanner.hidden = !dirty;
    if(btnSave) btnSave.disabled = !dirty;
  }

  function refreshNodeList(selectedId){
    const { sel } = readUIRefs(); if(!sel) return;
    const currentValue = sel.value;
    sel.innerHTML = '<option value="">-- ノードを選択 --</option>';
    (specData.nodes||[]).forEach(n => {
      const opt = document.createElement('option');
      opt.value = n.id;
      opt.textContent = `${n.id} - ${n.title || 'タイトルなし'}`;
      // ドラッグ可能にする
      opt.draggable = true;
      opt.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', n.id);
        e.dataTransfer.effectAllowed = 'copy';
      });
      sel.appendChild(opt);
    });
    if(selectedId && window.NodeEditorUtils.findNodeById(specData.nodes, selectedId)) sel.value = selectedId;
    else if(currentValue && window.NodeEditorUtils.findNodeById(specData.nodes, currentValue)) sel.value = currentValue;
    else if(specData.nodes?.length) sel.value = specData.nodes[0].id;

    if(sel.value) renderNodeForm(sel.value);
    refreshStartSelect();
    notifySpecUpdated();
  }

  function renderNodeForm(nodeId){
    const { id, title, text, image, choices, actions } = readUIRefs();
    const n = window.NodeEditorUtils.findNodeById(specData.nodes, nodeId);
    if(!n){ 
      id.value = ''; title.value=''; text.value=''; image.value=''; 
      choices.innerHTML=''; if(actions) actions.innerHTML=''; 
      notifySelectionChanged(''); 
      preview.updatePreview(null, specData); 
      preview.updateParallelPreview(null, specData); 
      return; 
    }
    id.value = n.id || '';
    title.value = n.title || '';
    text.value = n.text || '';
    image.value = n.image || '';
    const callbacks = { setDirty, notifySpecUpdated, refreshUnresolvedPanel };
    renderChoicesForm(n, specData, callbacks);
    renderActionsForm(n, specData, callbacks);
    notifySelectionChanged(n.id || '');
    preview.updatePreview(n, specData);
    preview.updateParallelPreview(n, specData);
  }

  // Delegate to forms module
  function renderActions(node){ 
    const callbacks = { setDirty, notifySpecUpdated, refreshUnresolvedPanel };
    renderActionsForm(node, specData, callbacks); 
  }
  function renderChoices(node){ 
    const callbacks = { setDirty, notifySpecUpdated, refreshUnresolvedPanel };
    renderChoicesForm(node, specData, callbacks); 
  }

  function refreshStartSelect(){
    const { startSel } = readUIRefs(); if(!startSel) return;
    startSel.innerHTML = '';
    (specData.nodes||[]).forEach(n => {
      const opt = document.createElement('option'); opt.value = n.id; opt.textContent = n.id; startSel.appendChild(opt);
    });
    if(specData?.meta?.start && window.NodeEditorUtils.findNodeById(specData.nodes, specData.meta.start)) startSel.value = specData.meta.start;
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

  function refreshUnresolvedPanel(){
    const { unresolvedPanel, unresolvedList } = readUIRefs(); if(!unresolvedPanel || !unresolvedList) return;
    const items = window.NodeEditorUtils.computeUnresolvedTargets(specData);
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

  function notifySelectionChanged(nodeId){ emitEvent('agp-node-selection-changed', { nodeId }); }
  function notifySpecUpdated(){ emitEvent('agp-spec-updated', {}); }

  function emitEvent(name, detail){
    try { document.dispatchEvent(new CustomEvent(name, { detail })); } catch{}
  }

  // Delegate preview functions to preview module
  function updatePreview(node){ preview.updatePreview(node, specData); }
  function updateParallelPreview(node){ preview.updateParallelPreview(node, specData); }
  function togglePreview(){ preview.togglePreview(specData); }
  function toggleParallelPreview(){ preview.toggleParallelPreview(specData); }
  function initParallelPreview(){ preview.initParallelPreview(specData); }
  function closeParallelView(){ preview.closeParallelView(); }

  // Initialize preview on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    preview.initPreviewOnModalOpen(specData);
  });

  // Expose UI manager
  window.NodeEditorUIManager = {
    readUIRefs,
    setDirty,
    refreshNodeList,
    renderNodeForm,
    renderActions,  // Thin wrapper to forms.js
    renderChoices,  // Thin wrapper to forms.js
    refreshStartSelect,
    refreshNodeIdDatalist,
    refreshExportList,
    refreshUnresolvedPanel,
    notifySelectionChanged,
    notifySpecUpdated,
    getSpecData: () => specData,
    setSpecData: (data) => { specData = data; },
    isDirty: () => dirty,
    updatePreview,  // Thin wrapper to preview.js
    togglePreview,  // Thin wrapper to preview.js
    updateParallelPreview,  // Thin wrapper to preview.js
    toggleParallelPreview,  // Thin wrapper to preview.js
    initParallelPreview,  // Thin wrapper to preview.js
    closeParallelView  // Thin wrapper to preview.js
  };

})();
