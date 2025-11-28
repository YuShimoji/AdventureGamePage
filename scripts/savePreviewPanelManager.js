(function () {
  // SavePreviewPanelManager - 状態管理と初期化専用モジュール
  // 分割されたSavePreviewモジュールの統合マネージャー

  class SavePreviewPanelManager {
    constructor() {
      this.panelId = 'preview-panel';
      this.listId = 'preview-list';
      this.panel = null;
      this.listEl = null;
      this.overlay = null;
      this.renderer = null;
      this.controls = null;
      this.state = {
        isOpen: false,
        selected: new Set(),
        controls: {}
      };
      this.initialized = false;
      // ページコンテキスト: admin.htmlでのみ有効
      this.isAdminPage = this.checkIfAdminPage();
    }

    // ページコンテキストチェック: admin.htmlでのみ有効
    checkIfAdminPage() {
      return window.location.pathname.endsWith('admin.html') || window.location.pathname === '/admin.html';
    }

    async initialize() {
      try {
        if (this.initialized) {
          console.log('[DEBUG] SavePreviewPanelManager already initialized');
          return;
        }

        // ページコンテキストチェック: adminページでのみ初期化
        if (!this.isAdminPage) {
          console.log('[DEBUG] SavePreviewPanelManager skipped: not admin page');
          return;
        }

        console.log('[DEBUG] SavePreviewPanelManager.initialize() called');

        // 必須要素の確認
        if (!this.getElements()) {
          console.error('[DEBUG] SavePreviewPanelManager] Required elements not found');
          throw new Error('Required DOM elements not found');
        }

        // 分割モジュールの初期化
        this.initializeModules();

        console.log('[DEBUG] Attaching listeners...');
        this.attachListeners();

        this.initialized = true;
        console.log('[DEBUG] SavePreviewPanelManager initialization complete');

        // 初期化後の状態確認
        console.log('[DEBUG] Final panel state after initialization:');
        console.log('[DEBUG] panel.hidden:', this.panel?.hidden);
        console.log('[DEBUG] panel.dataset.state:', this.panel?.dataset?.state);
        console.log('[DEBUG] panel.classList:', this.panel?.classList?.toString());
        console.log('[DEBUG] overlay.isOpen():', this.overlay?.isOpen());

        // 初期状態を強制的に設定
        this.forceInitialState();

      } catch (error) {
        console.error('[DEBUG] SavePreviewPanelManager initialization failed:', error);
        this.initialized = false;
        throw error;
      }
    }

    // 分割モジュールの初期化
    initializeModules() {
      // オーバーレイモジュールの初期化
      this.overlay = new window.SavePreviewOverlay(this.panel);
      this.overlay.initialize();

      // レンダラーモジュールの初期化
      this.renderer = new window.SavePreviewRenderer(this.listEl);

      // コントロールモジュールの初期化
      this.controls = new window.SavePreviewControls(this);
    }

    // 初期状態を強制的に設定
    forceInitialState() {
      if (!this.panel) return;

      // パネルを必ず非表示に
      this.panel.setAttribute('hidden', '');
      this.panel.setAttribute('inert', '');
      this.panel.dataset.state = 'closed';
      this.panel.classList.remove('is-open');
      this.panel.setAttribute('aria-hidden', 'true');

      console.log('[DEBUG] Force initial state applied');
      console.log('[DEBUG] panel.hidden:', this.panel.hidden);
      console.log('[DEBUG] panel.dataset.state:', this.panel.dataset.state);
    }

    // DOM要素の取得
    getElements() {
      this.panel = document.getElementById(this.panelId);
      this.listEl = document.getElementById(this.listId);
      return this.panel && this.listEl;
    }

    // コントロールイベントリスナーの設定
    attachListeners() {
      this.controls.attachListeners();
    }

    // パネルを開く
    open(options) {
      if (!this.initialized || !this.isAdminPage) return;
      if (!this.overlay.open(options)) return;
      this.refresh();
    }

    // パネルを閉じる
    close(options) {
      if (!this.initialized || !this.isAdminPage) return;
      this.overlay.close(options);
      this.state.selected.clear();
      this.updateDeleteSelectedBtn();
    }

    // パネルをトグル
    toggle(options) {
      if (!this.initialized || !this.isAdminPage) return;
      if (this.overlay.isOpen()) {
        this.close(options);
      } else {
        this.open(options);
      }
    }

    // 開いているかどうか
    isOpen() {
      return this.initialized && this.isAdminPage && this.overlay.isOpen();
    }

    // 削除選択ボタンの更新
    updateDeleteSelectedBtn() {
      const btn = this.state.controls.delSelBtn;
      if (btn) btn.disabled = this.state.selected.size === 0;
    }

    // リフレッシュ
    async refresh() {
      if (!this.initialized) return;
      try {
        let items = [];
        if (window.StorageBridge) {
          items = await window.StorageBridge.list();
        } else {
          const provider = window.StorageHub?.getProvider?.();
          const maybe = provider ? provider.list() : [];
          items = maybe && typeof maybe.then === "function" ? await maybe : maybe;
        }
        // apply filter/sort from controls if available
        try {
          const opts = window.PreviewUtils?.readControls?.();
          if (opts && window.PreviewUtils) {
            items = window.PreviewUtils.filterItems(items, opts.type);
            items = window.PreviewUtils.searchItems(items, opts.search);
            items = window.PreviewUtils.filterByTag(items, opts.tag);
            items = window.PreviewUtils.filterByDateRange(items, opts.dateFrom, opts.dateTo);
            items = window.PreviewUtils.sortItems(items, opts.sort);
          }
        } catch (e) {
          /* non-fatal */
        }
        this.renderer.renderList(items);
      } catch (e) {
        console.error("savePreview.refresh error", e);
      }
    }
  }

  // シングルトンインスタンス
  const panelManager = new SavePreviewPanelManager();

  // admin-boot.js で初期化されるよう公開（adminページでのみ）
  if (window.location.pathname.endsWith('admin.html') || window.location.pathname === '/admin.html') {
    window.SavePreviewPanelManager = panelManager;
  }

  // レガシーAPIとの互換性維持
  if (window.location.pathname.endsWith('admin.html') || window.location.pathname === '/admin.html') {
    window.SavePreview = {
      refresh: () => panelManager.refresh(),
      open: (options) => panelManager.open(options),
      close: (options) => panelManager.close(options),
      toggle: (options) => panelManager.toggle(options),
      getState: () => ({ ...panelManager.state, selected: Array.from(panelManager.state.selected) })
    };
  }

})();
