(function () {
  // グローバル設定（ハードコーディング回避用）
  // 言語は APP_CONFIG.lang で管理し、文字列は AGStrings 経由で取得する
  var hasAGStrings = !!(window.AGStrings && typeof window.AGStrings.t === 'function');

  window.APP_CONFIG = {
    // 初期言語（将来的にUIから切り替え可能にする想定）
    lang: 'ja',
    editor: {
      placeholder: hasAGStrings ? window.AGStrings.t('editor.placeholder') : '入力を開始……',
      startZen: false,
      autoScroll: {
        enabled: true,
        safeTopRatio: 0.2,
        safeBottomRatio: 0.6,
        behavior: 'smooth',
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
      // ヘッダー固定のON/OFF（falseで固定解除）
      stickyHeader: false,
      // アイコン表現: 'emoji' | 'text'
      iconStyle: 'text',
    },
    storage: {
      backend: 'idb',
      useBridge: true,
      keys: {
        simple: 'agp_manuscript_simple',
        full: 'agp_manuscript_full',
        gameData: 'agp_game_data',
        gameProgress: 'agp_game_progress',
        saveSlots: 'agp_save_slots',
        theme: 'agp_theme',
        sidebarState: 'agp_sidebar_state',
        sidebarOpen: 'agp_sidebar_open',
        sidebarMultiOpen: 'agp_sidebar_multi_open',
        sidebarOpenMulti: 'agp_sidebar_open_multi',
        sidebarHintState: 'agp_sidebar_hint_state',
        editorSettings: 'agp_editor_settings',
        floatingPanel: 'agp_floating_panel',
        memos: 'agp_memos',
        audioSettings: 'agp_audio_settings',
      },
      snapshots: {
        enabled: true,
        prefix: 'agp_snap_',
      },
    },
    strings: {
      defaultTitle: hasAGStrings ? window.AGStrings.t('strings.defaultTitle') : '無題',
    },
    debug: {
      enabled: true, // 開発時にtrueに設定してデバッグUIを表示
      showConsoleLogs: true,
    },
    game: {
      autoSave: {
        enabled: true, // ノード遷移時の自動セーブ
        delayMs: 100, // 連続遷移時の負荷軽減
      },
    },
    gameplay: {
      keyboardShortcuts: {
        // プレイ画面全体のキーボードショートカット有効/無効
        enabled: true,
        // ヘッダー系ショートカット（S=保存, L=読込, I=インベントリ）の有効/無効
        headerShortcuts: true,
        // 選択肢リスト内でのキーボードナビゲーション（矢印キー/数字キー）
        choiceNavigation: true,
      },
    },
  };
})();
