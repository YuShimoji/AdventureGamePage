(function () {
  // SavePreview Controls Module - Handles control event listeners
  class SavePreviewControls {
    constructor(panel, overlay, refreshCallback, state) {
      this.panel = panel;
      this.overlay = overlay;
      this.refresh = refreshCallback;
      this.state = state;
      this.listenersAttached = false;
    }

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

    updateDeleteSelectedBtn() {
      const btn = this.state.controls.delSelBtn;
      if (btn) btn.disabled = this.state.selected.size === 0;
    }
  }

  // Export
  window.SavePreviewControls = SavePreviewControls;
})();
