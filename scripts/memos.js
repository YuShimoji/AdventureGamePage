(function () {
  const KEY_MEMOS = window.APP_CONFIG?.storage?.keys?.memos || "agp_memos";

  function readMemos() {
    return StorageUtil.loadJSON(KEY_MEMOS, []);
  }
  function writeMemos(list) {
    StorageUtil.saveJSON(KEY_MEMOS, list);
  }
  function uid() {
    return "m_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function sortMemos(list, mode) {
    const arr = [...list];
    switch (mode) {
      case "createdAt_asc":
        arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "createdAt_desc":
        arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "rank_asc":
        arr.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
        break;
      case "rank_desc":
        arr.sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));
        break;
      default:
        arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return arr;
  }

  function render(listEl, memos) {
    listEl.innerHTML = "";
    memos.forEach((m) => {
      const wrap = document.createElement("div");
      wrap.className = "memo-item";
      const head = document.createElement("div");
      head.className = "memo-head";

      const title = document.createElement("strong");
      title.textContent = m.label || "メモ";
      const meta = document.createElement("span");
      meta.className = "memo-meta";
      meta.textContent = new Date(m.createdAt).toLocaleString();

      const actions = document.createElement("div");
      actions.className = "memo-actions";
      const rankLabel = document.createElement("span");
      rankLabel.textContent = "順位";
      const rankInput = document.createElement("input");
      rankInput.type = "number";
      rankInput.value = m.rank ?? 0;
      rankInput.min = 0;
      rankInput.step = 1;
      const delBtn = document.createElement("button");
      delBtn.className = "btn";
      delBtn.textContent = "削除";

      actions.append(rankLabel, rankInput, delBtn);
      head.append(title, meta, actions);

      const body = document.createElement("div");
      body.textContent = m.text || "";

      wrap.append(head, body);
      listEl.appendChild(wrap);

      rankInput.addEventListener("change", () => {
        const val = Number(rankInput.value) || 0;
        m.rank = val;
        persistUpdate(m);
      });
      delBtn.addEventListener("click", () => {
        removeMemo(m.id);
      });
    });
  }

  function persistUpdate(updated) {
    const list = readMemos();
    const idx = list.findIndex((x) => x.id === updated.id);
    if (idx >= 0) {
      list[idx] = updated;
      writeMemos(list);
    }
  }

  function addMemo(label, text) {
    const list = readMemos();
    list.push({
      id: uid(),
      label: label || "メモ",
      text: text || "",
      rank: 0,
      createdAt: new Date().toISOString(),
    });
    writeMemos(list);
  }

  function removeMemo(id) {
    const list = readMemos().filter((m) => m.id !== id);
    writeMemos(list);
    refresh();
  }

  function refresh() {
    const panel = document.getElementById("memos-panel");
    const listEl = document.getElementById("memos-list");
    const sortSel = document.getElementById("memos-sort");
    if (!panel || !listEl || !sortSel) return;
    const sorted = sortMemos(readMemos(), sortSel.value);
    render(listEl, sorted);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const panel = document.getElementById("memos-panel");
    const openBtn = document.getElementById("btn-quick-memos");
    const closeBtn = document.getElementById("memos-close");
    const addBtn = document.getElementById("memo-add");
    const quoteBtn = document.getElementById("memo-quote");
    const labelIn = document.getElementById("memo-label");
    const textIn = document.getElementById("memo-text");
    const sortSel = document.getElementById("memos-sort");

    if (!panel) return;

    let lastFocused = null;

    function openPanel() {
      if (!panel.hidden) return;
      lastFocused = document.activeElement;
      panel.hidden = false;
      panel.removeAttribute("aria-hidden");
      panel.removeAttribute("inert");
      if (openBtn) {
        openBtn.setAttribute("aria-expanded", "true");
      }
      refresh();

      // 初期フォーカス: ラベル入力か最初のフォーカス可能要素
      const firstFocusable =
        (labelIn && typeof labelIn.focus === "function" && labelIn) ||
        panel.querySelector(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
      if (firstFocusable && typeof firstFocusable.focus === "function") {
        try {
          firstFocusable.focus();
        } catch {}
      }
    }

    function closePanel() {
      if (panel.hidden) return;
      panel.hidden = true;
      panel.setAttribute("aria-hidden", "true");
      panel.setAttribute("inert", "");
      if (openBtn) {
        openBtn.setAttribute("aria-expanded", "false");
      }
      const target =
        (lastFocused && typeof lastFocused.focus === "function" && lastFocused) ||
        openBtn;
      if (target && typeof target.focus === "function") {
        try {
          target.focus();
        } catch {}
      }
    }

    function toggle() {
      if (panel.hidden) {
        openPanel();
      } else {
        closePanel();
      }
    }

    if (openBtn) {
      openBtn.setAttribute("aria-expanded", "false");
      openBtn.addEventListener("click", toggle);
    }
    if (closeBtn)
      closeBtn.addEventListener("click", () => {
        closePanel();
      });
    if (addBtn)
      addBtn.addEventListener("click", () => {
        addMemo(labelIn.value.trim(), textIn.value.trim());
        labelIn.value = "";
        textIn.value = "";
        refresh();
      });
    if (quoteBtn)
      quoteBtn.addEventListener("click", () => {
        // Try to get selection from the editor
        let selected = "";
        try {
          const sel = window.getSelection();
          selected = sel ? sel.toString() : "";
        } catch {}
        // Fallback: if selection is empty, try pulling plain text from #editor
        if (!selected) {
          const ed = document.getElementById("editor");
          if (ed) selected = (ed.innerText || "").slice(0, 160);
        }
        if (!selected) {
          return;
        }
        const quote = `> ${selected.replace(/\n/g, "\n> ")}\n`;
        textIn.value = (textIn.value ? textIn.value + "\n" : "") + quote;
      });
    if (sortSel) sortSel.addEventListener("change", refresh);

    // 初期表示時に設定が許可なら準備
    if (window.APP_CONFIG?.ui?.showMemos) {
      refresh();
    }
  });

  window.Memos = { add: addMemo, remove: removeMemo, refresh };
})();
