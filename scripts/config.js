(function () {
  // グローバル設定（ハードコーディング回避用）
  window.APP_CONFIG = {
    editor: {
      placeholder: "入力を開始……",
      startZen: true,
      autoScroll: {
        enabled: true,
        safeTopRatio: 0.2,
        safeBottomRatio: 0.6,
        behavior: "smooth",
      },
      inputFx: {
        enabled: true,
        durationMs: 160,
      },
    },
    ui: {
      showFloatingFormatbar: true,
      showFloatingControls: true,
      showMemos: true,
      showSavePreview: true,
      shortcutsEnabled: true,
    },
    gameplay: {
      keyboardShortcuts: {
        enabled: true,
        choiceNavigation: true,
        headerShortcuts: true,
      },
      autoSave: {
        enabled: false,
        intervalMinutes: 5,
        maxSlots: 10,
      },
      accessibility: {
        screenReaderSupport: true,
        highContrastMode: false,
      },
    },
    storage: {
      backend: "idb",
      useBridge: true,
      keys: {
        simple: "agp_manuscript_simple",
        full: "agp_manuscript_full",
      },
      snapshots: {
        enabled: true,
        prefix: "agp_snap_",
      },
    },
    strings: {
      defaultTitle: "無題",
    },
  };
})();
