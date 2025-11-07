(function () {
  let lastBuildMeta = null;
  const renderCache = new Map(); // Cache for rendered SVG

  function sanitizeId(id) {
    return String(id || "").replace(/[^A-Za-z0-9_]/g, "_");
  }
  function escapeText(t) {
    return String(t || "")
      .replace(/[\n\r]+/g, " ")
      .replace(/[|<>`]/g, "");
  }

  function normalizeMatchValue(v) {
    return String(v || "").toLowerCase();
  }

  function buildAdjacency(nodes) {
    const map = new Map();
    nodes.forEach((n) => {
      if (n && n.id) {
        map.set(n.id, []);
      }
    });
    nodes.forEach((n) => {
      if (!n || !n.id) return;
      const outs = Array.isArray(n.choices) ? n.choices : [];
      const list = map.get(n.id);
      outs.forEach((c) => {
        const tgt = c?.target ?? c?.to;
        if (tgt && map.has(tgt)) list.push(tgt);
      });
    });
    return map;
  }

  function collectSearchHits(nodes, term) {
    const hits = new Set();
    const q = normalizeMatchValue(term);
    if (!q) return hits;
    nodes.forEach((n) => {
      if (!n || !n.id) return;
      const fields = [n.id, n.title, n.text];
      const baseMatch = fields.some((v) => normalizeMatchValue(v).includes(q));
      let choiceMatch = false;
      if (!baseMatch) {
        const choices = Array.isArray(n.choices) ? n.choices : [];
        choiceMatch = choices.some((c) => normalizeMatchValue(c?.label).includes(q));
      }
      if (baseMatch || choiceMatch) hits.add(n.id);
    });
    return hits;
  }

  function computeShortestPath(adjacency, startId, goalId) {
    if (!startId || !goalId || !adjacency.has(startId) || !adjacency.has(goalId)) return null;
    if (startId === goalId) return { nodes: [startId], edges: [] };
    const queue = [startId];
    const parent = new Map([[startId, null]]);
    while (queue.length) {
      const cur = queue.shift();
      if (cur === goalId) break;
      const outs = adjacency.get(cur) || [];
      outs.forEach((tgt) => {
        if (!parent.has(tgt)) {
          parent.set(tgt, cur);
          queue.push(tgt);
        }
      });
    }
    if (!parent.has(goalId)) return null;
    const pathNodes = [];
    let cursor = goalId;
    while (cursor) {
      pathNodes.unshift(cursor);
      cursor = parent.get(cursor) || null;
    }
    const pathEdges = [];
    for (let i = 0; i < pathNodes.length - 1; i++) {
      pathEdges.push({ from: pathNodes[i], to: pathNodes[i + 1] });
    }
    return { nodes: pathNodes, edges: pathEdges };
  }

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
      const spec = getBaseSpec();
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
    const spec = getBaseSpec();
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
      if (!currentView || !lastBuildMeta) return;
      const svg = currentView.querySelector("svg");
      if (!svg) return;
      const nodeGroups = svg.querySelectorAll("g.node");
      nodeGroups.forEach((g) => {
        const sid = g.id;
        const originalId = lastBuildMeta.sanitizeMap?.get(sid);
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

  function buildAndSetSource(overrides) {
    const { src, view, mainView } = getUIRefs();
    refreshSeedOptions();
    refreshPathSelects(true);
    const opts = collectOptions(overrides);
    const code = buildMermaidWithOptions(opts);
    if (src) src.value = code;
    if (view && !view.querySelector("svg")) {
      view.innerHTML =
        '<div class="muted">描画（レンダリング）ボタンでプレビューを表示できます。</div>';
    }
    if (mainView && !mainView.querySelector("svg")) {
      mainView.innerHTML =
        '<div class="muted">プレビューがここに表示されます。</div>';
    }
    updateStatusFromLastBuild();
    return { opts, code };
  }

  async function renderDiagram() {
    const { view, mainView } = getUIRefs();
    try {
      const { code } = buildAndSetSource();
      if (!ensureMermaid()) {
        setStatus(
          "Mermaidが未ロードです。ソースをコピーして外部でレンダリングしてください。",
          "warn"
        );
        return;
      }
      // Check cache
      const cacheKey = await crypto.subtle
        .digest("SHA-256", new TextEncoder().encode(code))
        .then((buf) =>
          Array.from(new Uint8Array(buf))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
        );
      if (renderCache.has(cacheKey)) {
        const cachedSvg = renderCache.get(cacheKey);
        if (view) view.innerHTML = cachedSvg;
        if (mainView) mainView.innerHTML = cachedSvg;
        bindSvgInteractions();
        updateStatusFromLastBuild();
        return;
      }
      const out = await window.mermaid.render(`mmd-${Date.now()}`, code);
      const svgHtml = out.svg || "";
      // Cache the result
      renderCache.set(cacheKey, svgHtml);
      if (view) view.innerHTML = svgHtml;
      if (mainView) mainView.innerHTML = svgHtml;
      bindSvgInteractions();
      updateStatusFromLastBuild();
    } catch (e) {
      console.error("Mermaid render error", e);
      const errorMsg = "Mermaidの描画に失敗しました";
      if (view) view.textContent = errorMsg;
      if (mainView) mainView.textContent = errorMsg;
      setStatus(errorMsg, "error");
    }
  }

  function generateSource() {
    return buildAndSetSource().code;
  }

  function getBaseSpec() {
    return window.NodeEditorAPI?.getSpec ? window.NodeEditorAPI.getSpec() : { nodes: [], meta: {} };
  }

  function getScopedSpec(scope, seedIds) {
    const base = getBaseSpec();
    if (scope === "all") return base;
    try {
      const util = window.NodeEditorUtils;
      if (scope === "from_start" && base?.meta?.start) {
        if (util?.collectSubgraph) return util.collectSubgraph(base, [base.meta.start]);
        // fallback: simple BFS
      }
      if (scope === "from_selected" && Array.isArray(seedIds) && seedIds.length > 0) {
        if (util?.collectSubgraph) return util.collectSubgraph(base, seedIds);
      }
    } catch {}
    return base;
  }

  function buildMermaidWithOptions(opts) {
    const {
      scope = "all",
      seeds = [],
      showLabels = true,
      direction = "TD",
      markUnreachable = true,
      searchTerm = "",
      pathStart = "",
      pathGoal = "",
    } = opts || {};
    const spec = getScopedSpec(scope, seeds) || { nodes: [], meta: {} };
    const nodes = Array.isArray(spec.nodes) ? spec.nodes : [];
    const idSet = new Set(nodes.map((n) => n && n.id).filter(Boolean));

    const adjacency = buildAdjacency(nodes);
    const searchHits = collectSearchHits(nodes, searchTerm);
    const applySearchHighlight = !!(searchTerm && searchHits.size);
    const normalizedPathStart = pathStart && idSet.has(pathStart) ? pathStart : "";
    const normalizedPathGoal = pathGoal && idSet.has(pathGoal) ? pathGoal : "";
    const pathInfo =
      normalizedPathStart && normalizedPathGoal
        ? computeShortestPath(adjacency, normalizedPathStart, normalizedPathGoal)
        : null;

    const sanitizeMap = new Map();
    const lines = [`flowchart ${direction || "TD"}`];
    const unresolvedTargets = [];
    const deadEnds = new Set();
    const startId = spec?.meta?.start;
    const nodeClassMap = new Map();
    const addClasses = (rawIds, className) => {
      (rawIds || []).forEach((id) => {
        if (!id) return;
        const sid = sanitizeId(id);
        if (!nodeClassMap.has(sid)) nodeClassMap.set(sid, new Set());
        nodeClassMap.get(sid).add(className);
      });
    };
    const addClassesFromSanitized = (sanitizedIds, className) => {
      (sanitizedIds || []).forEach((sid) => {
        if (!sid) return;
        if (!nodeClassMap.has(sid)) nodeClassMap.set(sid, new Set());
        nodeClassMap.get(sid).add(className);
      });
    };

    const edgeMeta = [];
    const pathEdgeIndices = new Set();
    let edgeCounter = 0;

    // Nodes
    nodes.forEach((n) => {
      if (!n || !n.id) return;
      const sid = sanitizeId(n.id);
      sanitizeMap.set(sid, n.id);
      const title = escapeText(n.title || "");
      const label = title ? `${n.id}\n${title}` : n.id;
      lines.push(`  ${sid}["${label}"]`);
      const outs = Array.isArray(n.choices) ? n.choices : [];
      if (outs.length === 0) deadEnds.add(n.id);
    });

    // Edges and unresolved placeholders
    nodes.forEach((n) => {
      if (!n || !n.id) return;
      const sid = sanitizeId(n.id);
      const outs = Array.isArray(n.choices) ? n.choices : [];
      outs.forEach((c) => {
        const tgt = c?.target ?? c?.to;
        if (!tgt) return;
        const tid = sanitizeId(tgt);
        const elabel = showLabels ? escapeText(c?.label ?? c?.text ?? "") : "";
        if (idSet.has(tgt)) {
          if (elabel) {
            lines.push(`  ${sid} -->|${elabel}| ${tid}`);
          } else {
            lines.push(`  ${sid} --> ${tid}`);
          }
          edgeMeta.push({ from: n.id, to: tgt, index: edgeCounter });
          edgeCounter++;
        } else {
          const phantom = `unresolved__${tid}`;
          lines.push(`  ${phantom}("? ${escapeText(tgt)}")`);
          if (elabel) {
            lines.push(`  ${sid} -. ${elabel} .-> ${phantom}`);
          } else {
            lines.push(`  ${sid} -.-> ${phantom}`);
          }
          edgeCounter++;
          unresolvedTargets.push(tgt);
        }
      });
    });

    // Classes
    if (startId) {
      addClasses([startId], "start");
    }
    if (deadEnds.size > 0) {
      addClasses(Array.from(deadEnds), "deadEnd");
    }
    // Mark unreachable nodes from start when scope is 'all'
    if (markUnreachable && startId && scope === "all") {
      const reachable = new Set();
      const adj = new Map();
      nodes.forEach((n) => {
        const outs = Array.isArray(n.choices) ? n.choices : [];
        adj.set(n.id, outs.map((c) => c?.target ?? c?.to).filter(Boolean));
      });
      const q = [startId];
      reachable.add(startId);
      while (q.length) {
        const cur = q.shift();
        const outs = adj.get(cur) || [];
        for (const t of outs) {
          if (idSet.has(t) && !reachable.has(t)) {
            reachable.add(t);
            q.push(t);
          }
        }
      }
      const unreachable = nodes.map((n) => n.id).filter((id) => !reachable.has(id));
      if (unreachable.length) {
        addClasses(unreachable, "unreachable");
      }
    }

    if (applySearchHighlight) {
      addClasses(Array.from(searchHits), "highlight");
      const faded = nodes.map((n) => n.id).filter((id) => id && !searchHits.has(id));
      if (faded.length) {
        addClasses(faded, "faded");
      }
    }

    const pathNodeSet = new Set();
    if (pathInfo && pathInfo.nodes) {
      pathInfo.nodes.forEach((id) => pathNodeSet.add(id));
      if (pathNodeSet.size) {
        addClasses(Array.from(pathNodeSet), "pathNode");
      }
      const usedEdgeIndices = new Set();
      pathInfo.edges.forEach((edge) => {
        const match = edgeMeta.find(
          (e) => e.from === edge.from && e.to === edge.to && !usedEdgeIndices.has(e.index)
        );
        if (match) {
          pathEdgeIndices.add(match.index);
          usedEdgeIndices.add(match.index);
        }
      });
    }

    if (unresolvedTargets.length > 0) {
      const ph = Array.from(new Set(unresolvedTargets.map((t) => `unresolved__${sanitizeId(t)}`)));
      if (ph.length) {
        addClassesFromSanitized(ph, "unresolved");
      }
    }

    const classes = [];
    nodeClassMap.forEach((set, sid) => {
      classes.push(`  class ${sid} ${Array.from(set).join(",")};`);
    });
    if (classes.length) {
      lines.push("", ...classes);
    }

    // Class definitions (dark theme friendly)
    lines.push(
      "  classDef start fill:#1b3a2b,stroke:#43a047,color:#e8f5e9;",
      "  classDef unresolved fill:#3b2525,stroke:#ef9a9a,color:#ffebee,stroke-dasharray: 5 3;",
      "  classDef deadEnd fill:#2f2f2f,stroke:#9e9e9e,color:#eeeeee;",
      "  classDef unreachable fill:#2b1b1b,stroke:#ff7043,color:#ffccbc,stroke-dasharray: 2 2;",
      "  classDef highlight fill:#1a237e,stroke:#5c6bc0,color:#e8eaf6;",
      "  classDef faded fill:#1a1a1a,stroke:#555,color:#9e9e9e,opacity:0.35;",
      "  classDef pathNode fill:#004d40,stroke:#26a69a,color:#e0f2f1;"
    );

    if (pathEdgeIndices.size) {
      lines.push(
        "",
        ...Array.from(pathEdgeIndices)
          .sort((a, b) => a - b)
          .map((idx) => `  linkStyle ${idx} stroke:#26a69a,stroke-width:3px,color:#e0f2f1;`)
      );
    }

    lastBuildMeta = {
      spec,
      nodes,
      idSet,
      adjacency,
      searchTerm: searchTerm || "",
      searchHits,
      applySearchHighlight,
      pathStart: normalizedPathStart,
      pathGoal: normalizedPathGoal,
      pathInfo,
      pathNodeSet,
      pathEdgeIndices,
      sanitizeMap,
      scope,
      seeds,
      direction,
      markUnreachable,
    };

    return lines.join("\n");
  }

  function ensureMermaid() {
    if (!window.mermaid) return false;
    if (!ensureMermaid._inited) {
      try {
        window.mermaid.initialize({ startOnLoad: false });
      } catch {}
      ensureMermaid._inited = true;
    }
    return true;
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
      // Save initial scope value to prevent auto-render on initialization
      const initialScope = scopeSel.value;
      scopeSel.addEventListener("change", () => {
        const newValue = scopeSel.value;
        if (newValue !== initialScope) {
          applySeedEnabled();
          if (getScope() === "from_selected") refreshSeedOptions();
          renderDiagram();
        } else {
          applySeedEnabled();
        }
      });
      applySeedEnabled();
    }
    if (seedSel) {
      // Save initial seed value to prevent auto-render on initialization
      const initialSeeds = Array.from(seedSel.selectedOptions).map(o => o.value).sort().join(',');
      seedSel.addEventListener("focus", refreshSeedOptions);
      seedSel.addEventListener("change", () => {
        const currentSeeds = Array.from(seedSel.selectedOptions).map(o => o.value).sort().join(',');
        if (currentSeeds !== initialSeeds) {
          renderDiagram();
        }
      });
    }

    genBtn.addEventListener("click", () => {
      generateSource();
    });
    renderBtn.addEventListener("click", () => {
      renderDiagram();
    });

    // メインエリアの生成ボタンクリックでプレビューも更新
    if (genBtn) {
      genBtn.addEventListener("click", () => {
        renderDiagram();
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
        const code = generateSource();
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
        if (!view.querySelector("svg")) await renderDiagram();
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
        const code = generateSource();
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
        renderDiagram();
      });
    }
    if (searchClear) {
      searchClear.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        renderDiagram();
      });
    }

    if (pathStartSel) {
      // Save initial path start value to prevent auto-render on initialization
      const initialPathStart = pathStartSel.value;
      pathStartSel.addEventListener("change", () => {
        const newValue = pathStartSel.value;
        if (newValue !== initialPathStart) {
          renderDiagram();
        }
      });
    }
    if (pathGoalSel) {
      // Save initial path goal value to prevent auto-render on initialization
      const initialPathGoal = pathGoalSel.value;
      pathGoalSel.addEventListener("change", () => {
        const newValue = pathGoalSel.value;
        if (newValue !== initialPathGoal) {
          renderDiagram();
        }
      });
    }
    if (pathApplyBtn)
      pathApplyBtn.addEventListener("click", () => {
        renderDiagram();
      });

    refreshSeedOptions();
    refreshPathSelects(false);
    setStatus("生成ボタンでプレビューを表示できます");

    // Set initial message for main view without triggering render
    if (mainView && !mainView.querySelector("svg")) {
      mainView.innerHTML = '<div class="muted">プレビューがここに表示されます。</div>';
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("mermaid-panel")) {
      // Wait for admin-boot-complete event instead of initializing immediately
      const initializeMermaidPreview = () => {
        bind();
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
      };

      // Check if admin-boot already completed
      if (window.AdminBoot && document.getElementById('editor')) {
        initializeMermaidPreview();
      } else {
        // Wait for admin-boot-complete event
        document.addEventListener('admin-boot-complete', initializeMermaidPreview, { once: true });
      }
    }
  });

  // export for tests if needed
  window.MermaidPreview = {
    buildMermaid: () => buildMermaidWithOptions(collectOptions()),
    buildMermaidWithOptions,
    refreshData: () => {
      refreshSeedOptions();
      refreshPathSelects(true);
      buildAndSetSource();
    },
    focusNode: (nodeId) => {
      if (!nodeId) return;
      const { pathStartSel, pathGoalSel, searchInput } = getUIRefs();
      if (searchInput) {
        searchInput.value = nodeId;
      }
      if (pathStartSel && !pathStartSel.disabled) {
        pathStartSel.value = nodeId;
      }
      if (pathGoalSel) {
        pathGoalSel.value = nodeId;
      }
      renderDiagram();
    },
    render: renderDiagram,
    collectOptions,
    buildAndSetSource,
  };
})();
