(function () {
  // 状態管理
  const state = {
    panel: null,
    listEl: null,
    isOpen: false,
    selected: new Set(),
    controls: {}
  };

  // UI要素の取得
  function getElements() {
    state.panel = document.getElementById("preview-panel");
    state.listEl = document.getElementById("preview-list");
    state.controls = {
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
    return state.panel && state.listEl;
  }

  // ユーティリティ関数
  function humanSize(bytes) {
    if (!bytes && bytes !== 0) return "";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0, val = bytes;
    while (val >= 1024 && i < units.length - 1) {
      val /= 1024;
      i++;
    }
    return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  }

  function fmtDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  function updateDeleteSelectedBtn() {
    const btn = state.controls.delSelBtn;
    if (btn) btn.disabled = state.selected.size === 0;
  }

  // パネル状態の管理
  function openPanel() {
    if (!state.panel) return;
    state.panel.hidden = false;
    state.isOpen = true;
    refresh();
  }

  function closePanel() {
    if (!state.panel) return;
    state.panel.hidden = true;
    state.isOpen = false;
    state.selected.clear();
    updateDeleteSelectedBtn();
  }

  function togglePanel() {
    if (state.isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function renderList(listEl, items) {
    listEl.innerHTML = "";
    if (!items || items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "preview-empty";
      empty.textContent = "保存データが見つかりません";
      listEl.appendChild(empty);
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
        if (cb.checked) state.selected.add(item.id);
        else state.selected.delete(item.id);
        updateDeleteSelectedBtn();
      });
      const meta = document.createElement("span");
      meta.className = "preview-meta";
      const kind = item.kind || item.type || "";
      meta.textContent = [fmtDate(item.savedAt), kind, humanSize(item.size)]
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
              const maybe = p?.set?.(item.id, obj);
              if (maybe && typeof maybe.then === "function") await maybe;
            }
            await refresh();
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
        const panel = document.getElementById("preview-panel");
        if (panel) panel.hidden = true;
      });
      btnDel.addEventListener("click", async () => {
        if (!confirm("この保存データを削除しますか？")) return;
        const ok = await window.AdminAPI?.deleteById?.(item.id);
        if (!ok) {
          alert("削除に失敗しました");
          return;
        }
        refresh();
      });

      row.append(head, body, actions);
      listEl.appendChild(row);
    });
  }

  async function refresh() {
    if (!state.listEl) return;
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
      renderList(state.listEl, items);
    } catch (e) {
      console.error("savePreview.refresh error", e);
    }
  }

document.addEventListener("DOMContentLoaded", () => {
  if (!window.APP_CONFIG?.ui?.showSavePreview) return; // feature flag

  if (!getElements()) return;

  // イベントリスナーの設定
  const { controls } = state;

  // 開くボタン (admin.jsからも呼ばれる可能性があるので、直接openPanelを使用)
  if (controls.openBtn) {
    controls.openBtn.addEventListener("click", () => {
      // admin.jsで既に処理されている可能性があるので、toggleを使用
      togglePanel();
    });
  }

  // 閉じるボタン
  if (controls.closeBtn) {
    controls.closeBtn.addEventListener("click", closePanel);
  }

  // 更新ボタン
  if (controls.refreshBtn) {
    controls.refreshBtn.addEventListener("click", () => {
      state.selected.clear();
      updateDeleteSelectedBtn();
      refresh();
    });
  }

  // フィルタ/ソートコントロール
  if (controls.typeSel) controls.typeSel.addEventListener("change", refresh);
  if (controls.sortSel) controls.sortSel.addEventListener("change", refresh);
  if (controls.searchInput) controls.searchInput.addEventListener("input", refresh);
  if (controls.tagSel) controls.tagSel.addEventListener("change", refresh);
  if (controls.dateFromInput) controls.dateFromInput.addEventListener("change", refresh);
  if (controls.dateToInput) controls.dateToInput.addEventListener("change", refresh);

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
      if (state.selected.size === 0) return;
      if (!confirm(`選択中の ${state.selected.size} 件を削除しますか？`)) return;
      try {
        const ids = Array.from(state.selected);
        for (const id of ids) {
          const ok = await window.AdminAPI?.deleteById?.(id);
          if (!ok) console.warn("削除に失敗:", id);
        }
        state.selected.clear();
        updateDeleteSelectedBtn();
        await refresh();
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
        await refresh();
        alert("スナップショットを作成しました");
      } catch (e) {
        console.error("snapshot-create", e);
        alert("スナップショットの作成に失敗しました");
      }
    });
  }

  // 初期状態
  if (!state.panel.hidden) {
    refresh();
  }
});

// パブリックAPI
window.SavePreview = {
  refresh,
  open: openPanel,
  close: closePanel,
  toggle: togglePanel,
  getState: () => ({ ...state, selected: Array.from(state.selected) })
};
})();
