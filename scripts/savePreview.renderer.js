(function () {
  // SavePreview Renderer Module - Handles list rendering
  class SavePreviewRenderer {
    constructor(listEl, state) {
      this.listEl = listEl;
      this.state = state;
    }

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
                const maybe = p?.set?.(item.id, obj);
                if (maybe && typeof maybe.then === "function") await maybe;
              }
              this.refresh();
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
  }

  // Export
  window.SavePreviewRenderer = SavePreviewRenderer;
})();
