(function () {
  // SavePreviewRenderer - レンダリング専用モジュール
  // SavePreviewPanelManagerから分離されたUI生成・レンダリング機能

  class SavePreviewRenderer {
    constructor(listEl) {
      this.listEl = listEl;
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

          // Add compare button for snapshots
          btnCompare = document.createElement("button");
          btnCompare.className = "btn";
          btnCompare.textContent = "比較選択";
          btnCompare.setAttribute("data-snapshot-id", item.id);
        }

        actions.append(btnLoad, btnDel);
        if (btnLabel) actions.append(btnLabel);
        if (btnCompare) actions.append(btnCompare);

        row.append(head, body, actions);
        this.listEl.appendChild(row);
      });
    }

    // 空リストのレンダリング
    renderEmpty() {
      this.listEl.innerHTML = "";
      const empty = document.createElement("div");
      empty.className = "preview-empty";
      empty.textContent = "保存データが見つかりません";
      this.listEl.appendChild(empty);
    }
  }

  // グローバル公開
  window.SavePreviewRenderer = SavePreviewRenderer;

})();
