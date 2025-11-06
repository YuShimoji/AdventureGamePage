(function(){
  // Mermaid Preview Utilities - Pure utility functions for graph processing and rendering

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

  // Expose utilities
  window.MermaidPreviewUtils = { sanitizeId, escapeText, normalizeMatchValue, buildAdjacency, collectSearchHits, computeShortestPath };

})();
