(function(){
  // Node Editor - Main initialization coordinator for node editor interface (Refactored for modularity)

  // Bootstrapping
  document.addEventListener('DOMContentLoaded', () => {
    if(!document.getElementById('node-editor')) return;
    const normalizedSpec = window.NodeEditorUtils.normalizeSpec(window.NodeEditorUIManager.getSpecData());
    window.NodeEditorUIManager.setSpecData(normalizedSpec);
    window.NodeEditorLogicManager.bindUI();
    window.NodeEditorUIManager.refreshNodeList();
    window.NodeEditorUIManager.refreshExportList();
    window.NodeEditorUIManager.refreshNodeIdDatalist();
    window.NodeEditorUIManager.refreshUnresolvedPanel();
    window.NodeEditorUIManager.setDirty(false);
  });

  // Expose API
  window.NodeEditorAPI = {
    getSpec: () => window.NodeEditorUtils.normalizeSpec(window.NodeEditorUIManager.getSpecData()),
    getSelectedNodeId: () => {
      const { sel } = window.NodeEditorUIManager.readUIRefs();
      return (sel && sel.value) || '';
    },
    selectNode: (id) => {
      const { sel } = window.NodeEditorUIManager.readUIRefs();
      if (!sel || !window.NodeEditorUtils.findNodeById(window.NodeEditorUIManager.getSpecData().nodes, id)) return false;
      sel.value = id;
      window.NodeEditorUIManager.renderNodeForm(id);
      return true;
    },
    createNode: (baseId = 'node:new') => {
      const specData = window.NodeEditorUIManager.getSpecData();
      const ids = (specData.nodes || []).map(n => n.id);
      const nid = window.NodeEditorUtils.ensureUniqueId(baseId, ids);
      const node = { id: nid, title: '', text: '', choices: [] };
      window.NodeEditorUtils.upsertNode(specData.nodes, node);
      window.NodeEditorUIManager.refreshNodeList(nid);
      window.NodeEditorUIManager.refreshExportList();
      window.NodeEditorUIManager.refreshNodeIdDatalist();
      window.NodeEditorUIManager.setDirty(true);
      window.NodeEditorUIManager.refreshUnresolvedPanel();
      window.NodeEditorUIManager.notifySpecUpdated();
      return nid;
    },
    updateNodeText: (id, textVal) => {
      const n = window.NodeEditorUtils.findNodeById(window.NodeEditorUIManager.getSpecData().nodes, id);
      if (!n) return false;
      n.text = textVal || '';
      const { sel, text } = window.NodeEditorUIManager.readUIRefs();
      if (text && sel && sel.value === id) {
        text.value = n.text;
      }
      window.NodeEditorUIManager.setDirty(true);
      window.NodeEditorUIManager.notifySpecUpdated();
      return true;
    },
    addChoiceToNode: (id, choice) => {
      const n = window.NodeEditorUtils.findNodeById(window.NodeEditorUIManager.getSpecData().nodes, id);
      if (!n) return false;
      window.NodeEditorUtils.addChoice(n, choice || { label: '', target: '' });
      window.NodeEditorUIManager.renderChoices(n);
      window.NodeEditorUIManager.setDirty(true);
      window.NodeEditorUIManager.refreshUnresolvedPanel();
      window.NodeEditorUIManager.notifySpecUpdated();
      return true;
    },
    addActionToNode: (id, action) => {
      const n = window.NodeEditorUtils.findNodeById(window.NodeEditorUIManager.getSpecData().nodes, id);
      if (!n) return false;
      if (!Array.isArray(n.actions)) n.actions = [];
      n.actions.push(action);
      window.NodeEditorUIManager.renderActions(n);
      window.NodeEditorUIManager.setDirty(true);
      window.NodeEditorUIManager.notifySpecUpdated();
      return true;
    }
  };

})();
