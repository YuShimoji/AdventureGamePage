(function () {
  // SavePreviewPanelManager - セーブプレビューパネルの状態管理を分離
  // 根本的な安定化のため、シングルトンクラスでパネル管理を統一

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
    }

    // 初期化 - DOM準備後に一度だけ呼ばれる
    async initialize() {
      try {
        if (this.initialized) {
          console.log('[DEBUG] SavePreviewPanelManager already initialized');
          return;
        }

        console.log('[DEBUG] SavePreviewPanelManager.initialize() called');

        // 必須要素の確認
        if (!this.getElements()) {
          console.error('[DEBUG] SavePreviewPanelManager] Required elements not found');
          throw new Error('Required DOM elements not found');
        }

        console.log('[DEBUG] Elements found, ensuring overlay...');
        this.ensureOverlay();

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

    // 初期状態を強制的に設定（安全策）
    forceInitialState() {
      if (!this.panel) return;

      // パネルを必ず非表示に
      this.panel.setAttribute('hidden', '');
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

    // オーバーレイコントローラの作成
    ensureOverlay() {
      if (!this.panel) return null;
      if (this.overlay) return this.overlay;

      if (!this.panel.hasAttribute("role")) this.panel.setAttribute("role", "dialog");
      if (!this.panel.hasAttribute("aria-modal")) this.panel.setAttribute("aria-modal", "true");
      if (!this.panel.hasAttribute("tabindex")) this.panel.setAttribute("tabindex", "-1");

      this.overlay = {
        lastFocused: null,
        listenersAttached: false,
        open: (options = {}) => {
          if (this.isOpen()) return false;

          // 現在のfocus要素を保存（閉じる時に戻すため）
          this.overlay.lastFocused = document.activeElement;

          this.panel.dataset.state = "open";
          this.panel.classList.add("is-open");
          this.panel.removeAttribute("aria-hidden");
          this.panel.removeAttribute("hidden");
          this.attachOverlayListeners();
          this.state.isOpen = true;
          if (options.focus !== false) {
            setTimeout(() => {
              try {
                // パネル内の最初のfocusable要素にfocus
                const focusableElements = this.panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                const firstFocusable = focusableElements.length > 0 ? focusableElements[0] : this.panel;
                firstFocusable.focus({ preventScroll: true });
              } catch (_) {}
            }, 0);
          }
          return true;
        },
        close: (options = {}) => {
          if (!this.isOpen()) return false;

          // 即座に状態を更新（再呼び出し防止）
          this.state.isOpen = false;
          this.panel.dataset.state = "closed";
          this.detachOverlayListeners();

          // focusを外部に移動
          const restoreFocus = () => {
            if (options.restoreFocus !== false && this.overlay.lastFocused && typeof this.overlay.lastFocused.focus === "function") {
              try {
                this.overlay.lastFocused.focus({ preventScroll: true });
              } catch (_) {
                const openBtn = document.getElementById("btn-quick-preview");
                if (openBtn && typeof openBtn.focus === "function") {
                  openBtn.focus({ preventScroll: true });
                }
              }
            } else {
              const openBtn = document.getElementById("btn-quick-preview");
              if (openBtn && typeof openBtn.focus === "function") {
                openBtn.focus({ preventScroll: true });
              }
            }
          };

          // focus移動後にDOM属性を更新
          requestAnimationFrame(() => {
            restoreFocus();
            requestAnimationFrame(() => {
              this.panel.classList.remove("is-open");
              this.panel.setAttribute("aria-hidden", "true");
              this.panel.setAttribute("hidden", "");
            });
          });

          return true;
        },
        isOpen: () => this.state.isOpen && this.panel.dataset.state === "open" && !this.panel.hasAttribute("hidden")
      };

      this.panel.dataset.state = this.panel.hasAttribute("hidden") ? "closed" : "open";
      this.panel.setAttribute("aria-hidden", this.panel.hasAttribute("hidden") ? "true" : "false");

      return this.overlay;
    }

    // オーバーレイイベントリスナーの設定
    attachOverlayListeners() {
      if (this.overlay.listenersAttached) return;
      document.addEventListener("keydown", this.handleKeydown, true);
      this.panel.addEventListener("mousedown", this.handleBackdrop, true);
      this.overlay.listenersAttached = true;
    }

    // オーバーレイイベントリスナーの解除
    detachOverlayListeners() {
      if (!this.overlay.listenersAttached) return;
      document.removeEventListener("keydown", this.handleKeydown, true);
      this.panel.removeEventListener("mousedown", this.handleBackdrop, true);
      this.overlay.listenersAttached = false;
    }

    // キーボードイベントハンドラ
    handleKeydown = (e) => {
      if (e.key === "Escape" && this.overlay.isOpen()) {
        e.preventDefault();
        this.overlay.close();
      }
    };

    // 背景クリックイベントハンドラ
    handleBackdrop = (e) => {
      if (e.target === this.panel) {
        this.overlay.close({ restoreFocus: true });
      }
    };

    // コントロールイベントリスナーの設定（一度だけ）
    attachListeners() {
      if (this.listenersAttached) return;

      const { controls } = this.state;

      // 開くボタン (admin.js から呼び出される可能性があるため、toggleを使用)
      if (controls.openBtn) {
        controls.openBtn.addEventListener("click", () => {
          // 新しい保存プレビューを優先
          if (window.APP_CONFIG?.ui?.showSavePreview && window.SavePreview) {
            window.SavePreview.toggle();
            return;
          }
          // フォールバック：従来の保存一覧（将来的に削除）
          const savesPanel = document.getElementById('saves-panel');
          if (!savesPanel) return;
          const willOpen = savesPanel.hidden === true;
          savesPanel.hidden = !willOpen;
          if (willOpen && window.renderSaves && typeof window.renderSaves === 'function') {
            window.renderSaves();
          }
        });
      }

      // 閉じるボタン
      if (controls.closeBtn) {
        controls.closeBtn.addEventListener("click", () => this.overlay.close());
      }

      // 更新ボタン
      if (controls.refreshBtn) {
        controls.refreshBtn.addEventListener("click", () => {
          this.state.selected.clear();
          this.updateDeleteSelectedBtn();
          this.refresh();
        });
      }

      // フィルタ/ソートコントロール
      if (controls.typeSel) controls.typeSel.addEventListener("change", () => this.refresh());
      if (controls.sortSel) controls.sortSel.addEventListener("change", () => this.refresh());
      if (controls.searchInput) controls.searchInput.addEventListener("input", () => this.refresh());
      if (controls.tagSel) controls.tagSel.addEventListener("change", () => this.refresh());
      if (controls.dateFromInput) controls.dateFromInput.addEventListener("change", () => this.refresh());
      if (controls.dateToInput) controls.dateToInput.addEventListener("change", () => this.refresh());

      // 比較ボタン
      if (controls.compareBtn) {
        controls.compareBtn.addEventListener("click", () => {
          if (window.SnapshotCompare && window.SnapshotCompare.compareSnapshots) {
            window.SnapshotCompare.compareSnapshots();
          }
        });
      }

      // 選択削除ボタン
      if (controls.delSelBtn) {
        controls.delSelBtn.addEventListener("click", async () => {
          if (this.state.selected.size === 0) return;
          if (!confirm(`選択中の ${this.state.selected.size} 件を削除しますか？`)) return;
          try {
            const ids = Array.from(this.state.selected);
            for (const id of ids) {
              const ok = await window.AdminAPI?.deleteById?.(id);
              if (!ok) console.warn("削除に失敗:", id);
            }
            this.state.selected.clear();
            this.updateDeleteSelectedBtn();
            await this.refresh();
          } catch (e) {
            console.error("delete-selected", e);
            alert("選択削除に失敗しました");
          }
        });
      }

      // スナップショット作成
      if (controls.snapBtn) {
        controls.snapBtn.addEventListener("click", async () => {
          try {
            const conf = window.APP_CONFIG?.storage?.snapshots;
            if (!conf?.enabled) {
              alert("スナップショットは無効化されています");
              return;
            }
            const prefix = conf?.prefix || "agp_snap_";
            const ts = Date.now();
            const rand = Math.random().toString(36).slice(2, 6);
            const id = `${prefix}${ts}_${rand}`;
            const titleEl = document.getElementById("title-input");
            const editor = document.getElementById("editor");
            const now = new Date().toISOString();
            const theme = window.Theme && typeof Theme.loadTheme === "function" ? Theme.loadTheme() : null;
            const obj = {
              title: (titleEl?.value || "").trim() || (window.APP_CONFIG?.strings?.defaultTitle ?? ""),
              html: editor?.innerHTML || "",
              text: editor?.innerText || "",
              meta: {
                savedAt: now,
                theme,
                label: (controls.snapLabel?.value || "").trim(),
                tags: [], // initialize tags array for future extension
              },
            };
            if (window.StorageBridge) {
              await window.StorageBridge.set(id, obj);
            } else {
              const p = window.StorageHub?.getProvider?.();
              const maybe = p?.set?.(id, obj);
              if (maybe && typeof maybe.then === "function") await maybe;
            }
            if (controls.snapLabel) controls.snapLabel.value = "";
            await this.refresh();
            alert("スナップショットを作成しました");
          } catch (e) {
            console.error("snapshot-create", e);
            alert("スナップショットの作成に失敗しました");
          }
        });
      }

      this.listenersAttached = true;
    }

    // パネルを開く
    open(options) {
      if (!this.initialized) return;
      if (!this.overlay.open(options)) return;
      this.refresh();
    }

    // パネルを閉じる
    close(options) {
      if (!this.initialized) return;
      this.overlay.close(options);
      this.state.selected.clear();
      this.updateDeleteSelectedBtn();
    }

    // パネルをトグル
    toggle(options) {
      if (!this.initialized) return;
      if (this.overlay.isOpen()) {
        this.close(options);
      } else {
        this.open(options);
      }
    }

    // 開いているかどうか
    isOpen() {
      return this.initialized && this.overlay.isOpen();
    }

    // ユーティリティ関数
    humanSize(bytes) {
      if (!bytes && bytes !== 0) return "";
      const units = ["B", "KB", "MB", "GB"];
      let i = 0, val = bytes;
      while (val >= 1024 && i < units.length - 1) {
        val /= 1024;
        i++;
      }
      return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
    }

    fmtDate(iso) {
      if (!iso) return "";
      try {
        return new Date(iso).toLocaleString();
      } catch {
        return iso;
      }
    }

    updateDeleteSelectedBtn() {
      const btn = this.state.controls.delSelBtn;
      if (btn) btn.disabled = this.state.selected.size === 0;
    }

    // リストレンダリング
    renderList(items) {
      this.listEl.innerHTML = "";
      if (!items || items.length === 0) {
        const empty = document.createElement("div");
        empty.className = "preview-empty";
        empty.textContent = "保存データが見つかりません";
        this.listEl.appendChild(empty);
        return;
      }
      items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "preview-item";
        const head = document.createElement("div");
        head.className = "preview-head";
        const title = document.createElement("strong");
        title.textContent = item.title || "(無題)";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "preview-select";
        cb.title = "選択";
        cb.addEventListener("change", () => {
          if (cb.checked) this.state.selected.add(item.id);
          else this.state.selected.delete(item.id);
          this.updateDeleteSelectedBtn();
        });
        const meta = document.createElement("span");
        meta.className = "preview-meta";
        const kind = item.kind || item.type || "";
        meta.textContent = [this.fmtDate(item.savedAt), kind, this.humanSize(item.size)]
          .filter(Boolean)
          .join(" / ");
        head.append(cb, title, meta);

        const body = document.createElement("div");
        body.className = "preview-body";
        body.textContent = item.textPreview || item.excerpt || "";
        const actions = document.createElement("div");
        actions.className = "preview-actions";
        const btnLoad = document.createElement("button");
        btnLoad.className = "btn";
        btnLoad.textContent = "読込";
        const btnDel = document.createElement("button");
        btnDel.className = "btn";
        btnDel.textContent = "削除";
        // snapshot: allow label edit and comparison
        let btnLabel = null;
        let btnCompare = null;
        if ((item.kind || item.type) === "snapshot") {
          btnLabel = document.createElement("button");
          btnLabel.className = "btn";
          btnLabel.textContent = "編集";
          btnLabel.addEventListener("click", async () => {
            try {
              let obj = null;
              if (window.StorageBridge && window.StorageBridge.get) {
                obj = await window.StorageBridge.get(item.id);
              } else {
                const p = window.StorageHub?.getProvider?.();
                const maybe = p?.get?.(item.id);
                obj = maybe && typeof maybe.then === "function" ? await maybe : maybe;
              }
              if (!obj || typeof obj !== "object" || !obj.meta) {
                alert("編集に対応していないデータです");
                return;
              }
              const curLabel = obj.meta?.label || "";
              const curTags = (obj.meta?.tags || []).join(", ");

              const newLabel = prompt("新しいラベルを入力", curLabel);
              if (newLabel == null) return; // cancel

              const newTagsStr = prompt("タグをカンマ区切りで入力（例: draft, important）", curTags);
              if (newTagsStr == null) return; // cancel

              obj.meta.label = newLabel.trim();
              obj.meta.tags = newTagsStr
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t);

              if (window.StorageBridge && window.StorageBridge.set) {
                await window.StorageBridge.set(item.id, obj);
              } else {
                const p = window.StorageHub?.getProvider?.();
                const maybe = p?.set?.(id, obj);
                if (maybe && typeof maybe.then === "function") await maybe;
              }
              await this.refresh();
            } catch (e) {
              console.error("edit-snapshot", e);
              alert("編集に失敗しました");
            }
          });

          // Add compare button for snapshots
          btnCompare = document.createElement("button");
          btnCompare.className = "btn";
          btnCompare.textContent = "比較選択";
          btnCompare.setAttribute("data-snapshot-id", item.id);
          btnCompare.addEventListener("click", () => {
            if (window.SnapshotCompare && window.SnapshotCompare.selectSnapshotForComparison) {
              window.SnapshotCompare.selectSnapshotForComparison(item.id);

              // Toggle button appearance
              const selected = window.SnapshotCompare.getSelectedSnapshots();
              if (selected.includes(item.id)) {
                btnCompare.style.background = "var(--accent, #4a9eff)";
                btnCompare.style.color = "#fff";
              } else {
                btnCompare.style.background = "";
                btnCompare.style.color = "";
              }
            }
          });
        }
        actions.append(btnLoad, btnDel);
        if (btnLabel) actions.append(btnLabel);
        if (btnCompare) actions.append(btnCompare);

        btnLoad.addEventListener("click", async () => {
          const ok = await window.AdminAPI?.loadById?.(item.id);
          if (!ok) {
            alert("読込に失敗しました");
            return;
          }
          // close panel after load for better UX
          this.overlay.close({ restoreFocus: false });
        });
        btnDel.addEventListener("click", async () => {
          if (!confirm("この保存データを削除しますか？")) return;
          const ok = await window.AdminAPI?.deleteById?.(item.id);
          if (!ok) {
            alert("削除に失敗しました");
            return;
          }
          this.refresh();
        });

        row.append(head, body, actions);
        this.listEl.appendChild(row);
      });
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

  // シングルトンインスタンス
  const panelManager = new SavePreviewPanelManager();

  // admin-boot.js で初期化されるよう公開
  window.SavePreviewPanelManager = panelManager;

  // レガシーAPIとの互換性維持
  window.SavePreview = {
    refresh: () => panelManager.refresh(),
    open: (options) => panelManager.open(options),
    close: (options) => panelManager.close(options),
    toggle: (options) => panelManager.toggle(options),
    getState: () => ({ ...panelManager.state, selected: Array.from(panelManager.state.selected) })
  };
})();
