(function(){
  // Mermaid Preview UI Manager - Handles UI state and interactions

  let uiRefs = {};
  const STATUS_CLASSES = ["status-info", "status-ok", "status-warn", "status-error"];

  function setUIRefs(refs) {
    uiRefs = refs || {};
  }
  function getUIRefs() {
    return uiRefs || {};
  }

  function setStatus(message, kind = "info") {
    const { statusEl } = getUIRefs();
    if (!statusEl) return;
    STATUS_CLASSES.forEach((cls) => statusEl.classList.remove(cls));
    const normalizedKind = STATUS_CLASSES.includes(`status-${kind}`) ? kind : "info";
    statusEl.classList.add(`status-${normalizedKind}`);
    statusEl.textContent = message || "";
  }

  function getScope() {
    const { scopeSel } = getUIRefs();
    return scopeSel ? scopeSel.value : "all";
  }
  function getSelectedSeeds() {
    const { seedSel } = getUIRefs();
    if (!seedSel) return [];
    return Array.from(seedSel.selectedOptions).map((o) => o.value);
  }
  function isLabelOn() {
    const { showLbl } = getUIRefs();
    return showLbl ? !!showLbl.checked : true;
  }
  function getDir() {
    const { dirSel } = getUIRefs();
    return dirSel ? dirSel.value : "TD";
  }
  function isMarkUnreachable() {
    const { markUnreach } = getUIRefs();
    return markUnreach ? !!markUnreach.checked : true;
  }
  function getSearchTerm() {
    const { searchInput } = getUIRefs();
    return searchInput ? searchInput.value.trim() : "";
  }
  function getPathStart() {
    const { pathStartSel } = getUIRefs();
    return pathStartSel ? pathStartSel.value : "";
  }
  function getPathGoal() {
    const { pathGoalSel } = getUIRefs();
    return pathGoalSel ? pathGoalSel.value : "";
  }

  function refreshSeedOptions() {
    const { seedSel } = getUIRefs();
    if (!seedSel) return;
    const prev = Array.from(seedSel.selectedOptions).map((o) => o.value);
    seedSel.innerHTML = "";
    try {
      const spec = window.MermaidPreviewLogicManager.getBaseSpec();
      (spec.nodes || []).forEach((n) => {
        if (!n || !n.id) return;
        const opt = document.createElement("option");
        opt.value = n.id;
        opt.textContent = n.id;
        if (prev.includes(n.id)) opt.selected = true;
        seedSel.appendChild(opt);
      });
      if (seedSel.selectedOptions.length === 0) {
        const nodeSelect = document.getElementById("ne-node-select");
        const currentId = nodeSelect?.value;
        if (currentId) {
          for (const opt of seedSel.options) {
            if (opt.value === currentId) {
              opt.selected = true;
              break;
            }
          }
        }
      }
    } catch {}
  }

  function refreshPathSelects(preserve = true) {
    const { pathStartSel, pathGoalSel } = getUIRefs();
    if (!pathStartSel || !pathGoalSel) return;
    const prevStart = preserve ? pathStartSel.value : "";
    const prevGoal = preserve ? pathGoalSel.value : "";
    const spec = window.MermaidPreviewLogicManager.getBaseSpec();
    const nodes = Array.isArray(spec.nodes) ? spec.nodes.slice() : [];
    const nodeSelect = document.getElementById("ne-node-select");
    const currentNodeId = nodeSelect?.value;
    const startFallback =
      spec?.meta?.start && nodes.some((n) => n.id === spec.meta.start)
        ? spec.meta.start
        : currentNodeId && nodes.some((n) => n.id === currentNodeId)
          ? currentNodeId
          : nodes[0]?.id || "";

    function fillSelect(sel, prev, fallback) {
      const current = sel.value;
      const keep = preserve ? current || prev : prev;
      const chosen =
        keep && nodes.some((n) => n.id === keep)
          ? keep
          : fallback && nodes.some((n) => n.id === fallback)
            ? fallback
            : nodes[0]?.id || "";
      const existingScroll = sel.scrollTop;
      sel.innerHTML = "";
      nodes.forEach((n) => {
        const opt = document.createElement("option");
        opt.value = n.id;
        opt.textContent = n.id;
        if (chosen && chosen === n.id) opt.selected = true;
        sel.appendChild(opt);
      });
      if (chosen && sel.value !== chosen) sel.value = chosen;
      sel.scrollTop = existingScroll;
    }

    fillSelect(pathStartSel, prevStart, startFallback);
    const goalFallback =
      prevGoal && nodes.some((n) => n.id === prevGoal)
        ? prevGoal
        : currentNodeId && nodes.some((n) => n.id === currentNodeId)
          ? currentNodeId
          : nodes.length > 1
            ? nodes[1].id
            : startFallback;
    fillSelect(pathGoalSel, prevGoal, goalFallback);
  }

  function collectOptions(overrides) {
    const base = {
      scope: getScope(),
      seeds: getSelectedSeeds(),
      showLabels: isLabelOn(),
      direction: getDir(),
      markUnreachable: isMarkUnreachable(),
      searchTerm: getSearchTerm(),
      pathStart: getPathStart(),
      pathGoal: getPathGoal(),
    };
    return Object.assign({}, base, overrides || {});
  }

  function updateStatusFromLastBuild() {
    const lastBuildMeta = window.MermaidPreviewLogicManager.getLastBuildMeta();
    if (!lastBuildMeta) {
      setStatus("");
      return;
    }
    const parts = [];
    let statusKind = "info";
    if (lastBuildMeta.searchTerm) {
      const hitCount = lastBuildMeta.searchHits ? lastBuildMeta.searchHits.size : 0;
      parts.push(`検索: "${lastBuildMeta.searchTerm}" (${hitCount}件)`);
      if (hitCount === 0) statusKind = "warn";
    }
    if (lastBuildMeta.pathStart && lastBuildMeta.pathGoal) {
      if (lastBuildMeta.pathInfo) {
        const steps = Math.max(0, (lastBuildMeta.pathInfo.nodes?.length || 1) - 1);
        parts.push(
          `最短経路: ${lastBuildMeta.pathStart} → ${lastBuildMeta.pathGoal} (${steps}ステップ)`
        );
        if (steps === 0) statusKind = statusKind === "warn" ? "warn" : "ok";
      } else {
        parts.push(`最短経路なし: ${lastBuildMeta.pathStart} → ${lastBuildMeta.pathGoal}`);
        statusKind = "warn";
      }
    }
    setStatus(parts.join(" / "), statusKind);
  }

  function focusNodeEditorNode(nodeId) {
    let success = false;
    try {
      const sel = document.getElementById("ne-node-select");
      if (sel && Array.from(sel.options).some((o) => o.value === nodeId)) {
        sel.value = nodeId;
        sel.dispatchEvent(new Event("change"));
        const editor = document.getElementById("node-editor");
        if (editor) {
          editor.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        success = true;
      }
    } catch {}
    setStatus(
      success ? `NodeEditorへ移動: ${nodeId}` : `NodeEditorに ${nodeId} が見つかりません`,
      success ? "ok" : "warn"
    );
    return success;
  }

  function bindSvgInteractions() {
    const { view, mainView } = getUIRefs();
    const views = [view, mainView].filter(Boolean);
    views.forEach((currentView) => {
      if (!currentView) return;
      const svg = currentView.querySelector("svg");
      if (!svg) return;
      const nodeGroups = svg.querySelectorAll("g.node");
      nodeGroups.forEach((g) => {
        const sid = g.id;
        const lastBuildMeta = window.MermaidPreviewLogicManager.getLastBuildMeta();
        const originalId = lastBuildMeta?.sanitizeMap?.get(sid);
        if (!originalId) return;
        g.style.cursor = "pointer";
        g.setAttribute("tabindex", "0");
        const handler = (ev) => {
          ev.preventDefault();
          focusNodeEditorNode(originalId);
        };
        g.addEventListener("click", handler);
        g.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            handler(ev);
          }
        });
      });
    });
  }

  function bind() {
    const refs = {
      genBtn: document.getElementById("ne-mermaid-gen"),
      renderBtn: document.getElementById("ne-mermaid-render"),
      src: document.getElementById("ne-mermaid-src"),
      view: document.getElementById("ne-mermaid-view"),
      mainView: document.getElementById("main-mermaid-view"),
      openBtn: document.getElementById("ne-mermaid-open"),
      scopeSel: document.getElementById("ne-mermaid-scope"),
      seedSel: document.getElementById("ne-mermaid-seed"),
      showLbl: document.getElementById("ne-mermaid-show-labels"),
      dirSel: document.getElementById("ne-mermaid-dir"),
      markUnreach: document.getElementById("ne-mermaid-mark-unreachable"),
      copyBtn: document.getElementById("ne-mermaid-copy"),
      dlBtn: document.getElementById("ne-mermaid-download"),
      searchInput: document.getElementById("ne-mermaid-search"),
      searchClear: document.getElementById("ne-mermaid-search-clear"),
      pathStartSel: document.getElementById("ne-mermaid-path-start"),
      pathGoalSel: document.getElementById("ne-mermaid-path-goal"),
      pathApplyBtn: document.getElementById("ne-mermaid-path-apply"),
      statusEl: document.getElementById("ne-mermaid-status"),
      fullscreenBtn: document.getElementById("ne-mermaid-fullscreen"),
    };
    setUIRefs(refs);
    const {
      genBtn,
      renderBtn,
      src,
      view,
      mainView,
      openBtn,
      scopeSel,
      seedSel,
      copyBtn,
      dlBtn,
      searchInput,
      searchClear,
      pathStartSel,
      pathGoalSel,
      pathApplyBtn,
      fullscreenBtn,
    } = refs;
    if (!genBtn || !renderBtn || !src || !view) return;

    if (scopeSel && seedSel) {
      const applySeedEnabled = () => {
        const v = getScope();
        seedSel.disabled = v !== "from_selected";
      };
      scopeSel.addEventListener("change", () => {
        applySeedEnabled();
        if (getScope() === "from_selected") refreshSeedOptions();
        window.MermaidPreviewLogicManager.renderDiagram();
      });
      applySeedEnabled();
    }
    if (seedSel) {
      seedSel.addEventListener("focus", refreshSeedOptions);
      seedSel.addEventListener("change", window.MermaidPreviewLogicManager.renderDiagram);
    }

    genBtn.addEventListener("click", () => {
      window.MermaidPreviewLogicManager.generateSource();
    });
    renderBtn.addEventListener("click", () => {
      window.MermaidPreviewLogicManager.renderDiagram();
    });

    // メインエリアの生成ボタンクリックでプレビューも更新
    if (genBtn) {
      genBtn.addEventListener("click", () => {
        window.MermaidPreviewLogicManager.renderDiagram();
      });
    }

    // フルスクリーンボタンの処理
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener("click", () => {
        const { mainView } = getUIRefs();
        if (!mainView) return;

        const modal = document.getElementById("mermaid-fullscreen-modal");
        const modalView = document.getElementById("mermaid-fullscreen-view");
        if (!modal || !modalView) return;

        const svg = mainView.querySelector("svg");
        if (svg) {
          modalView.innerHTML = svg.outerHTML;
        } else {
          modalView.innerHTML = mainView.innerHTML;
        }
        modal.hidden = false;
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const code = window.MermaidPreviewLogicManager.generateSource();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(code);
          } else {
            if (src) {
              src.select();
              document.execCommand("copy");
            }
          }
          setStatus("Mermaidソースをコピーしました", "ok");
        } catch {
          setStatus("クリップボードコピーに失敗しました", "warn");
        }
      });
    }

    if (dlBtn) {
      dlBtn.addEventListener("click", async () => {
        if (!view.querySelector("svg")) await window.MermaidPreviewLogicManager.renderDiagram();
        const svg = view.querySelector("svg");
        if (!svg) {
          setStatus("先に描画してください", "warn");
          return;
        }
        const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "mermaid-preview.svg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        setStatus("SVGをダウンロードしました", "ok");
      });
    }

    if (openBtn) {
      openBtn.addEventListener("click", () => {
        const code = window.MermaidPreviewLogicManager.generateSource();
        const w = window.open("", "_blank");
        if (!w) return;
        const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Mermaid Preview</title>
<style>html,body{height:100%;margin:0;background:#111;color:#eee;} .wrap{min-height:100%;padding:12px;} .wrap .src{width:100%;height:120px;}
.view{background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:8px;overflow:auto;max-height:calc(100vh - 220px);} .bar{display:flex;gap:8px;margin:8px 0;}
button{padding:6px 10px;border-radius:8px;border:1px solid #444;background:#222;color:#eee;cursor:pointer;}
</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
</head><body><div class="wrap">
<h3>Mermaid Preview</h3>
<div class="bar"><button id="btn-render">描画</button><button id="btn-copy">ソースをコピー</button></div>
<textarea class="src" id="mmd-src"></textarea>
<div class="view" id="mmd-view"></div>
<script>mermaid.initialize({ startOnLoad:false });
const src = document.getElementById('mmd-src'); const view = document.getElementById('mmd-view'); src.value = ${JSON.stringify(code)};
async function render(){ try{ const out = await mermaid.render('mmd-'+Date.now(), src.value); view.innerHTML = out.svg || ''; }catch(e){ console.error(e); view.textContent='Mermaidの描画に失敗しました'; } }
document.getElementById('btn-render').onclick = render; document.getElementById('btn-copy').onclick = ()=>{ src.select(); document.execCommand('copy'); };
render();</script>
</div></body></html>`;
        w.document.open();
        w.document.write(html);
        w.document.close();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        window.MermaidPreviewLogicManager.renderDiagram();
      });
    }
    if (searchClear) {
      searchClear.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        window.MermaidPreviewLogicManager.renderDiagram();
      });
    }

    if (pathStartSel)
      pathStartSel.addEventListener("change", () => {
        window.MermaidPreviewLogicManager.renderDiagram();
      });
    if (pathGoalSel)
      pathGoalSel.addEventListener("change", () => {
        window.MermaidPreviewLogicManager.renderDiagram();
      });
    if (pathApplyBtn)
      pathApplyBtn.addEventListener("click", () => {
        window.MermaidPreviewLogicManager.renderDiagram();
      });

    refreshSeedOptions();
    refreshPathSelects(false);
    setStatus("組み立て前：生成または描画してください");
    window.MermaidPreviewLogicManager.buildAndSetSource();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("mermaid-panel")) bind();
    // NodeEditor からの選択変更に追従して現在ノードをハイライト
    try {
      document.addEventListener('agp-node-selection-changed', (e) => {
        const nodeId = e?.detail?.nodeId;
        if (!nodeId || !window.MermaidPreview?.focusNode) return;
        window.MermaidPreview.focusNode(nodeId);
      });
    } catch {}
    // NodeEditor からの仕様更新に追従して再描画
    try {
      document.addEventListener('agp-spec-updated', () => {
        try { window.MermaidPreview?.refreshData?.(); } catch {}
      });
    } catch {}
  });

  // Expose UI manager
  window.MermaidPreviewUIManager = {
    setUIRefs,
    getUIRefs,
    setStatus,
    getScope,
    getSelectedSeeds,
    isLabelOn,
    getDir,
    isMarkUnreachable,
    getSearchTerm,
    getPathStart,
    getPathGoal,
    refreshSeedOptions,
    refreshPathSelects,
    collectOptions,
    updateStatusFromLastBuild,
    focusNodeEditorNode,
    bindSvgInteractions,
    bind
  };

})();
