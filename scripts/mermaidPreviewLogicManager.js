(function(){
  // Mermaid Preview Logic Manager - Handles core business logic for graph building and rendering

  let lastBuildMeta = null;
  const renderCache = new Map(); // Cache for rendered SVG

  function buildAndSetSource(overrides) {
    const { src, view, mainView } = window.MermaidPreviewUIManager.getUIRefs();
    window.MermaidPreviewUIManager.refreshSeedOptions();
    window.MermaidPreviewUIManager.refreshPathSelects(true);
    const opts = window.MermaidPreviewUIManager.collectOptions(overrides);
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
    window.MermaidPreviewUIManager.updateStatusFromLastBuild();
    return { opts, code };
  }

  async function renderDiagram() {
    const { view, mainView } = window.MermaidPreviewUIManager.getUIRefs();
    try {
      const { code } = buildAndSetSource();
      if (!ensureMermaid()) {
        window.MermaidPreviewUIManager.setStatus(
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
        window.MermaidPreviewUIManager.bindSvgInteractions();
        window.MermaidPreviewUIManager.updateStatusFromLastBuild();
        return;
      }
      const out = await window.mermaid.render(`mmd-${Date.now()}`, code);
      const svgHtml = out.svg || "";
      // Cache the result
      renderCache.set(cacheKey, svgHtml);
      if (view) view.innerHTML = svgHtml;
      if (mainView) mainView.innerHTML = svgHtml;
      window.MermaidPreviewUIManager.bindSvgInteractions();
      window.MermaidPreviewUIManager.updateStatusFromLastBuild();
    } catch (e) {
      console.error("Mermaid render error", e);
      const errorMsg = "Mermaidの描画に失敗しました";
      if (view) view.textContent = errorMsg;
      if (mainView) mainView.textContent = errorMsg;
      window.MermaidPreviewUIManager.setStatus(errorMsg, "error");
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

    const adjacency = window.MermaidPreviewUtils.buildAdjacency(nodes);
    const searchHits = window.MermaidPreviewUtils.collectSearchHits(nodes, searchTerm);
    const applySearchHighlight = !!(searchTerm && searchHits.size);
    const normalizedPathStart = pathStart && idSet.has(pathStart) ? pathStart : "";
    const normalizedPathGoal = pathGoal && idSet.has(pathGoal) ? pathGoal : "";
    const pathInfo =
      normalizedPathStart && normalizedPathGoal
        ? window.MermaidPreviewUtils.computeShortestPath(adjacency, normalizedPathStart, normalizedPathGoal)
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
        const sid = window.MermaidPreviewUtils.sanitizeId(id);
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
      const sid = window.MermaidPreviewUtils.sanitizeId(n.id);
      sanitizeMap.set(sid, n.id);
      const title = window.MermaidPreviewUtils.escapeText(n.title || "");
      const label = title ? `${n.id}\n${title}` : n.id;
      lines.push(`  ${sid}["${label}"]`);
      const outs = Array.isArray(n.choices) ? n.choices : [];
      if (outs.length === 0) deadEnds.add(n.id);
    });

    // Edges and unresolved placeholders
    nodes.forEach((n) => {
      if (!n || !n.id) return;
      const sid = window.MermaidPreviewUtils.sanitizeId(n.id);
      const outs = Array.isArray(n.choices) ? n.choices : [];
      outs.forEach((c) => {
        const tgt = c?.target ?? c?.to;
        if (!tgt) return;
        const tid = window.MermaidPreviewUtils.sanitizeId(tgt);
        const elabel = showLabels ? window.MermaidPreviewUtils.escapeText(c?.label ?? c?.text ?? "") : "";
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
          lines.push(`  ${phantom}("? ${window.MermaidPreviewUtils.escapeText(tgt)}")`);
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
      const ph = Array.from(new Set(unresolvedTargets.map((t) => `unresolved__${window.MermaidPreviewUtils.sanitizeId(t)}`)));
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
        window.mermaid.initialize({ startOnLoad: false, cursor: 'pointer' });
      } catch {}
      ensureMermaid._inited = true;
    }
    return true;
  }

  function getLastBuildMeta() {
    return lastBuildMeta;
  }

  // Expose logic manager
  window.MermaidPreviewLogicManager = {
    buildAndSetSource,
    renderDiagram,
    generateSource,
    getBaseSpec,
    getScopedSpec,
    buildMermaidWithOptions,
    ensureMermaid,
    getLastBuildMeta
  };

})();
