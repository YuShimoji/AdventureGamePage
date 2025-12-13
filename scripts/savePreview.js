(function () {
  const hasModular =
    window.SavePreviewPanelManager &&
    window.SavePreviewOverlay &&
    window.SavePreviewRenderer &&
    window.SavePreviewControls;

  if (hasModular) {
    console.log('[DEBUG] Using new modular SavePreview system');
    window.SavePreview = window.SavePreview || {
      init: () => window.SavePreviewPanelManager?.init?.(),
      open: () => window.SavePreviewPanelManager?.open?.(),
      close: () => window.SavePreviewPanelManager?.close?.(),
      toggle: () => window.SavePreviewPanelManager?.toggle?.(),
      refresh: () => window.SavePreviewPanelManager?.refresh?.(),
    };
    return;
  }

  window.SavePreview = window.SavePreview || {
    init: () => {},
    open: () => {},
    close: () => {},
    toggle: () => {},
    refresh: () => {},
  };
})();
