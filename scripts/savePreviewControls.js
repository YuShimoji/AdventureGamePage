(function () {
  // SavePreviewControls - コントロールイベントハンドリング専用モジュール
  // SavePreviewPanelManagerから分離されたコントロール管理機能

  class SavePreviewControls {
    constructor(panelManager) {
      this.panelManager = panelManager;
      this.listenersAttached = false;
      this.controls = {};
    }

    // コントロール要素の取得
    getControls() {
      return {
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
    }

    // イベントリスナーの設定
    attachListeners() {
      if (this.listenersAttached) return;

      this.controls = this.getControls();
      const { controls } = this;

      // 開くボタン
      if (controls.openBtn) {
        controls.openBtn.addEventListener("click", () => {
          // 新しい保存プレビューを優先
          if (window.APP_CONFIG?.ui?.showSavePreview && window.SavePreview) {
            window.SavePreview.toggle();
            return;
          }
          // フォールバック：従来の保存一覧
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
        controls.closeBtn.addEventListener("click", () => this.panelManager.overlay.close());
      }

      // 更新ボタン
      if (controls.refreshBtn) {
        controls.refreshBtn.addEventListener("click", () => {
          this.panelManager.state.selected.clear();
          this.panelManager.updateDeleteSelectedBtn();
          this.panelManager.refresh();
        });
      }

      // フィルタ/ソートコントロール
      if (controls.typeSel) controls.typeSel.addEventListener("change", () => this.panelManager.refresh());
      if (controls.sortSel) controls.sortSel.addEventListener("change", () => this.panelManager.refresh());
      if (controls.searchInput) controls.searchInput.addEventListener("input", () => this.panelManager.refresh());
      if (controls.tagSel) controls.tagSel.addEventListener("change", () => this.panelManager.refresh());
      if (controls.dateFromInput) controls.dateFromInput.addEventListener("change", () => this.panelManager.refresh());
      if (controls.dateToInput) controls.dateToInput.addEventListener("change", () => this.panelManager.refresh());

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
          if (this.panelManager.state.selected.size === 0) return;
          if (!confirm(`選択中の ${this.panelManager.state.selected.size} 件を削除しますか？`)) return;
          try {
            const ids = Array.from(this.panelManager.state.selected);
            for (const id of ids) {
              const ok = await window.AdminAPI?.deleteById?.(id);
              if (!ok) console.warn("削除に失敗:", id);
            }
            this.panelManager.state.selected.clear();
            this.panelManager.updateDeleteSelectedBtn();
            await this.panelManager.refresh();
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
                tags: [],
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
            await this.panelManager.refresh();
            alert("スナップショットを作成しました");
          } catch (e) {
            console.error("snapshot-create", e);
            alert("スナップショットの作成に失敗しました");
          }
        });
      }

      this.listenersAttached = true;
    }

    // イベントリスナーの解除
    detachListeners() {
      if (!this.listenersAttached) return;

      const { controls } = this;

      // 各コントロールからイベントリスナーを解除
      Object.keys(controls).forEach(key => {
        const el = controls[key];
        if (el && el._handler) {
          el.removeEventListener('click', el._handler);
          el.removeEventListener('change', el._handler);
          el.removeEventListener('input', el._handler);
        }
      });

      this.listenersAttached = false;
    }
  }

  // グローバル公開
  window.SavePreviewControls = SavePreviewControls;

})();
