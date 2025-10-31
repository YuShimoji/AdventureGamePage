(function(){
  // グローバル設定（ハードコーディング回避用）
  window.APP_CONFIG = {
    editor: {
      placeholder: "入力を開始……",
      startZen: false,
      autoScroll: {
        enabled: true,
        safeTopRatio: 0.20,
        safeBottomRatio: 0.60,
        behavior: 'smooth'
      },
      inputFx: {
        enabled: true,
        durationMs: 160
      }
    },
    ui: {
      showFloatingFormatbar: true,
      showFloatingControls: true,
      showMemos: true,
      showSavePreview: true,
      shortcutsEnabled: true
    },
    storage: {
      backend: 'idb',
      useBridge: true,
      keys: {
        simple: 'agp_manuscript_simple',
        full: 'agp_manuscript_full'
      },
      snapshots: {
        enabled: true,
        prefix: 'agp_snap_'
      }
    },
    strings: {
      defaultTitle: "無題"
    },
    debug: {
      enabled: true, // 開発時にtrueに設定してデバッグUIを表示
      showConsoleLogs: true
    },
    game: {
      autoSave: {
        enabled: true, // ノード遷移時の自動セーブ
        delayMs: 100  // 連続遷移時の負荷軽減
      }
    }
  };
})();
