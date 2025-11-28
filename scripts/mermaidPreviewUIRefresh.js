(function(){
  // Mermaid Preview UI Refresh Manager - Handles UI updates and refreshes

  const MermaidPreviewUIRefresh = {
    refreshSeedOptions() {
      const { seedSel } = window.MermaidPreviewUIState.getUIRefs();
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
    },

    refreshPathSelects(preserve = true) {
      const { pathStartSel, pathGoalSel } = window.MermaidPreviewUIState.getUIRefs();
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

      const fillSelect = (sel, prev, fallback) => {
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
      };

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
    },

    updateStatusFromLastBuild() {
      const lastBuildMeta = window.MermaidPreviewLogicManager.getLastBuildMeta();
      if (!lastBuildMeta) {
        window.MermaidPreviewUIState.setStatus("");
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
      window.MermaidPreviewUIState.setStatus(parts.join(" / "), statusKind);
    },

    focusNodeEditorNode(nodeId) {
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
      window.MermaidPreviewUIState.setStatus(
        success ? `NodeEditorへ移動: ${nodeId}` : `NodeEditorに ${nodeId} が見つかりません`,
        success ? "ok" : "warn"
      );
      return success;
    }
  };

  // Global exposure
  window.MermaidPreviewUIRefresh = MermaidPreviewUIRefresh;
})();
