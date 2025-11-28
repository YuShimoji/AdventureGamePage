(function(){
  // Mermaid Preview UI Manager - Integrated manager using modular components

  function collectOptions(overrides) {
    const base = {
      scope: window.MermaidPreviewUIState.getScope(),
      seeds: window.MermaidPreviewUIState.getSelectedSeeds(),
      showLabels: window.MermaidPreviewUIState.isLabelOn(),
      direction: window.MermaidPreviewUIState.getDir(),
      markUnreachable: window.MermaidPreviewUIState.isMarkUnreachable(),
      searchTerm: window.MermaidPreviewUIState.getSearchTerm(),
      pathStart: window.MermaidPreviewUIState.getPathStart(),
      pathGoal: window.MermaidPreviewUIState.getPathGoal(),
    };
    return Object.assign({}, base, overrides || {});
  }

  function bind() {
    // UI element references setup
    const refs = {
      genBtn: document.getElementById("ne-mermaid-gen"),
      renderBtn: document.getElementById("ne-mermaid-render"),
      src: document.getElementById("ne-mermaid-src"),
      view: document.getElementById("ne-mermaid-view"),
      mainView: document.getElementById("main-mermaid-view"),
      openBtn: document.getElementById("ne-mermaid-open"),
      scopeSel: document.getElementById("ne-mermaid-scope"),
      seedSel: document.getElementById("ne-mermaid-seed"),
      showLbl: document.getElementById("ne-mermaid-show-labels"),
      dirSel: document.getElementById("ne-mermaid-dir"),
      markUnreach: document.getElementById("ne-mermaid-mark-unreachable"),
      copyBtn: document.getElementById("ne-mermaid-copy"),
      dlBtn: document.getElementById("ne-mermaid-download"),
      searchInput: document.getElementById("ne-mermaid-search"),
      searchClear: document.getElementById("ne-mermaid-search-clear"),
      pathStartSel: document.getElementById("ne-mermaid-path-start"),
      pathGoalSel: document.getElementById("ne-mermaid-path-goal"),
      pathApplyBtn: document.getElementById("ne-mermaid-path-apply"),
      statusEl: document.getElementById("ne-mermaid-status"),
      fullscreenBtn: document.getElementById("ne-mermaid-fullscreen"),
      toggleBtn: document.getElementById("ne-mermaid-toggle"),
      inlinePanel: document.getElementById("mermaid-inline-panel"),
      inlineContent: document.getElementById("mermaid-inline-content"),
    };
    window.MermaidPreviewUIState.setUIRefs(refs);

    // Bind all event handlers using modular components
    window.MermaidPreviewUIEvents.bindButtons();
    window.MermaidPreviewUIEvents.bindFullscreen();
    window.MermaidPreviewUIEvents.bindInlinePanel();
    window.MermaidPreviewUIEvents.bindCopyDownload();
    window.MermaidPreviewUIEvents.bindOpenInNewWindow();
    window.MermaidPreviewUIEvents.bindSearch();
    window.MermaidPreviewUIEvents.bindPathFinding();

    // Initialize UI state
    window.MermaidPreviewUIRefresh.refreshSeedOptions();
    window.MermaidPreviewUIRefresh.refreshPathSelects(false);
    window.MermaidPreviewUIState.setStatus("組み立て前：生成または描画してください");
    window.MermaidPreviewLogicManager.buildAndSetSource();
  }

  function unbind() {
    // Note: Individual event unbinding would require storing handler references
    // For now, we clear references and let garbage collection handle cleanup
    window.MermaidPreviewUIState.setUIRefs({});
    console.log('[MermaidPreviewUIManager] Unbound and cleared references');
  }

  // Expose integrated UI manager
  window.MermaidPreviewUIManager = {
    // State management (delegated to UIState)
    setUIRefs: window.MermaidPreviewUIState.setUIRefs,
    getUIRefs: window.MermaidPreviewUIState.getUIRefs,
    setStatus: window.MermaidPreviewUIState.setStatus,

    // State getters (delegated to UIState)
    getScope: window.MermaidPreviewUIState.getScope,
    getSelectedSeeds: window.MermaidPreviewUIState.getSelectedSeeds,
    isLabelOn: window.MermaidPreviewUIState.isLabelOn,
    getDir: window.MermaidPreviewUIState.getDir,
    isMarkUnreachable: window.MermaidPreviewUIState.isMarkUnreachable,
    getSearchTerm: window.MermaidPreviewUIState.getSearchTerm,
    getPathStart: window.MermaidPreviewUIState.getPathStart,
    getPathGoal: window.MermaidPreviewUIState.getPathGoal,

    // UI refresh (delegated to UIRefresh)
    refreshSeedOptions: window.MermaidPreviewUIRefresh.refreshSeedOptions,
    refreshPathSelects: window.MermaidPreviewUIRefresh.refreshPathSelects,
    updateStatusFromLastBuild: window.MermaidPreviewUIRefresh.updateStatusFromLastBuild,
    focusNodeEditorNode: window.MermaidPreviewUIRefresh.focusNodeEditorNode,

    // Interactions (delegated to UIEvents)
    bindSvgInteractions: window.MermaidPreviewUIEvents.bindSvgInteractions,

    // Manager-specific functions
    collectOptions,
    bind,
    unbind
  };

})();
