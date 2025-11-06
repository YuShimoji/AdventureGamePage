(function () {
  // Mermaid Preview - Main initialization coordinator for mermaid preview interface (Refactored for modularity)

  // Expose API for external use
  window.MermaidPreview = {
    buildMermaid: () => window.MermaidPreviewLogicManager.buildMermaidWithOptions(window.MermaidPreviewUIManager.collectOptions()),
    buildMermaidWithOptions: window.MermaidPreviewLogicManager.buildMermaidWithOptions,
    refreshData: () => {
      window.MermaidPreviewUIManager.refreshSeedOptions();
      window.MermaidPreviewUIManager.refreshPathSelects(true);
      window.MermaidPreviewLogicManager.buildAndSetSource();
    },
    focusNode: (nodeId) => {
      if (!nodeId) return;
      const { pathStartSel, pathGoalSel, searchInput } = window.MermaidPreviewUIManager.getUIRefs();
      if (searchInput) {
        searchInput.value = nodeId;
      }
      if (pathStartSel && !pathStartSel.disabled) {
        pathStartSel.value = nodeId;
      }
      if (pathGoalSel) {
        pathGoalSel.value = nodeId;
      }
      window.MermaidPreviewLogicManager.renderDiagram();
    },
    render: window.MermaidPreviewLogicManager.renderDiagram,
    collectOptions: window.MermaidPreviewUIManager.collectOptions,
    buildAndSetSource: window.MermaidPreviewLogicManager.buildAndSetSource,
  };

})();
