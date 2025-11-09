(function(){
  function readUIRefs(){
    return {
      dirtyBanner: document.getElementById('ne-dirty-banner'),
      btnSave: document.getElementById('ne-save'),
      sel: document.getElementById('ne-node-select'),
      startSel: document.getElementById('ne-start-select'),
      id: document.getElementById('ne-node-id'),
      title: document.getElementById('ne-node-title'),
      text: document.getElementById('ne-node-text'),
      image: document.getElementById('ne-node-image'),
      choices: document.getElementById('ne-choices'),
      actions: document.getElementById('ne-actions'),
      unresolvedPanel: document.getElementById('ne-unresolved-panel'),
      unresolvedList: document.getElementById('ne-unresolved-list'),
      exportMulti: document.getElementById('ne-export-multiselect'),
      exportSelectAll: document.getElementById('ne-export-select-all'),
      exportSelectNone: document.getElementById('ne-export-select-none'),
      exportPartial: document.getElementById('ne-export-partial'),
      previewTitle: document.getElementById('ne-preview-title'),
      previewText: document.getElementById('ne-preview-text'),
      previewImage: document.getElementById('ne-preview-image'),
      previewChoices: document.getElementById('ne-preview-choices'),
      previewRefresh: document.getElementById('ne-preview-refresh'),
      previewToggle: document.getElementById('ne-preview-toggle'),
      gamePreview: document.getElementById('ne-game-preview'),
      mermaidPreview: document.getElementById('ne-mermaid-preview'),
      modalMermaidView: document.getElementById('ne-modal-mermaid-view'),
      parallelPreviewTitle: document.getElementById('ne-parallel-preview-title'),
      parallelPreviewText: document.getElementById('ne-parallel-preview-text'),
      parallelPreviewImage: document.getElementById('ne-parallel-preview-image'),
      parallelPreviewChoices: document.getElementById('ne-parallel-preview-choices'),
      parallelPreviewRefresh: document.getElementById('ne-parallel-refresh'),
      parallelPreviewToggle: document.getElementById('ne-parallel-toggle'),
      parallelGamePreview: document.getElementById('ne-parallel-game-preview'),
      parallelMermaidPreview: document.getElementById('ne-parallel-mermaid-preview'),
      parallelMermaidView: document.getElementById('ne-parallel-mermaid-view')
    };
  }

  window.NodeEditorUIRefs = {
    readUIRefs
  };
})();
