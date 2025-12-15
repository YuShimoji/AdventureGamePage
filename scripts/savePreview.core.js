(function () {
  // SavePreview Core Module - Main panel manager class
  class SavePreviewPanelManager {
    constructor() {
      this.panelId = 'preview-panel';
      this.listId = 'preview-list';
      this.panel = null;
      this.listEl = null;
      this.overlay = null;
      this.state = {
        isOpen: false,
        selected: new Set(),
        controls: {}
      };
      this.initialized = false;
      this.listenersAttached = false;
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
          console.debug('[DEBUG] SavePreviewPanelManager already initialized');
          return;
        }

        // ページコンテキストチェック: adminページでのみ初期化
        if (!this.isAdminPage) {
          console.debug('[DEBUG] SavePreviewPanelManager skipped: not admin page');
          return;
        }

        console.debug('[DEBUG] SavePreviewPanelManager.initialize() called');

        // 必須要素の確認
        if (!this.getElements()) {
          console.error('[DEBUG] SavePreviewPanelManager] Required elements not found');
          throw new Error('Required DOM elements not found');
        }

        console.debug('[DEBUG] Elements found, ensuring overlay...');
        this.ensureOverlay();

        console.debug('[DEBUG] Attaching listeners...');
        this.attachListeners();

        this.initialized = true;
        console.debug('[DEBUG] SavePreviewPanelManager initialization complete');

        // 初期化後の状態確認
        console.debug('[DEBUG] Final panel state after initialization:');
        console.debug('[DEBUG] panel.hidden:', this.panel?.hidden);
        console.debug('[DEBUG] panel.dataset.state:', this.panel?.dataset?.state);
        console.debug('[DEBUG] panel.classList:', this.panel?.classList?.toString());
        console.debug('[DEBUG] overlay.isOpen():', this.overlay?.isOpen());

        // 初期状態を強制的に設定
        this.forceInitialState();

      } catch (error) {
        console.error('[DEBUG] SavePreviewPanelManager initialization failed:', error);
        this.initialized = false;
        throw error;
      }
    }

    // 初期状態を強制的に設定（安全策）
    forceInitialState() {
      if (!this.panel) return;

      // パネルを必ず非表示に
      this.panel.setAttribute('hidden', '');
      this.panel.setAttribute('inert', ''); // 完全に非対話化
      this.panel.dataset.state = 'closed';
      this.panel.classList.remove('is-open');
      this.panel.setAttribute('aria-hidden', 'true');

      console.debug('[DEBUG] Force initial state applied');
      console.debug('[DEBUG] panel.hidden:', this.panel.hidden);
      console.debug('[DEBUG] panel.dataset.state:', this.panel.dataset.state);
    }

    // DOM要素の取得
    getElements() {
      this.panel = document.getElementById(this.panelId);
      this.listEl = document.getElementById(this.listId);
      this.state.controls = {
        openBtn: document.getElementById("btn-quick-preview"),
        closeBtn: document.getElementById("preview-close"),
        refreshBtn: document.getElementById("preview-refresh"),
        typeSel: document.getElementById("preview-filter-type"),
        sortSel: document.getElementById("preview-sort"),
        searchInput: document.getElementById("preview-search"),
        tagSel: document.getElementById("preview-filter-tag"),
        dateFromInput: document.getElementById("preview-date-from"),
        dateToInput: document.getElementById("preview-date-to"),
        compareBtn: document.getElementById("snapshot-compare-btn"),
        delSelBtn: document.getElementById("preview-delete-selected"),
        snapBtn: document.getElementById("snapshot-create"),
        snapLabel: document.getElementById("snapshot-label")
      };
      return this.panel && this.listEl;
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
        this.renderList(items);
      } catch (e) {
        console.error("savePreview.refresh error", e);
      }
    }
  }

  // Export for other modules
  window.SavePreviewPanelManager = SavePreviewPanelManager;
})();
