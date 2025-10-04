(function () {
  function createEngine(gameData, elements) {
    const state = { nodeId: gameData.start || 'start', history: [], forward: [] };

    function setNode(id) {
      if (!gameData.nodes[id]) {
        console.warn('Unknown node:', id);
        return;
      }
      // push current to history when moving to a different node
      if (state.nodeId && state.nodeId !== id) {
        state.history.push(state.nodeId);
      }
      // normal navigation clears forward stack
      state.forward = [];
      state.nodeId = id;
      render();
      saveProgress();
    }

    function getNode() { return gameData.nodes[state.nodeId]; }

    function canGoBack() { return Array.isArray(state.history) && state.history.length > 0; }

    function goBack() {
      if (!canGoBack()) return false;
      const prev = state.history.pop();
      if (!gameData.nodes[prev]) { return false; }
      const cur = state.nodeId;
      // move current into forward stack
      state.forward.push(cur);
      state.nodeId = prev;
      render();
      saveProgress();
      return true;
    }

    function canGoForward() { return Array.isArray(state.forward) && state.forward.length > 0; }

    function goForward() {
      if (!canGoForward()) return false;
      const next = state.forward.pop();
      if (!gameData.nodes[next]) { return false; }
      // move current into history
      if (state.nodeId) state.history.push(state.nodeId);
      state.nodeId = next;
      render();
      saveProgress();
      return true;
    }

    function render() {
      if (elements.titleEl) elements.titleEl.textContent = gameData.title || 'Adventure';
      const node = getNode();
      elements.textEl.textContent = node.text || '';
      elements.choicesEl.innerHTML = '';
      (node.choices || []).forEach((c) => {
        const b = document.createElement('button'); b.className = 'btn'; b.textContent = c.text;
        b.onclick = () => setNode(c.to);
        elements.choicesEl.appendChild(b);
      });
      // Update back/forward button state if provided
      if (elements && elements.backBtn) { elements.backBtn.disabled = !canGoBack(); }
      if (elements && elements.forwardBtn) { elements.forwardBtn.disabled = !canGoForward(); }
    }

    function saveProgress() {
      const hist = Array.isArray(state.history) ? state.history.slice() : [];
      const fwd = Array.isArray(state.forward) ? state.forward.slice() : [];
      StorageUtil.saveJSON('agp_progress', { title: gameData.title, nodeId: state.nodeId, history: hist, forward: fwd });
    }
    function loadProgress() {
      const p = StorageUtil.loadJSON('agp_progress');
      if (p && p.title === gameData.title) {
        if (p.nodeId && gameData.nodes[p.nodeId]) {
          state.nodeId = p.nodeId;
        }
        const hist = Array.isArray(p.history) ? p.history.filter((id) => !!gameData.nodes[id]) : [];
        const fwd = Array.isArray(p.forward) ? p.forward.filter((id) => !!gameData.nodes[id]) : [];
        state.history = hist;
        state.forward = fwd;
      }
    }
    function reset() { state.nodeId = gameData.start || 'start'; state.history = []; state.forward = []; saveProgress(); render(); }

    // optional back button wiring
    if (elements && elements.backBtn) {
      elements.backBtn.addEventListener('click', () => { goBack(); });
    }
    if (elements && elements.forwardBtn) {
      elements.forwardBtn.addEventListener('click', () => { goForward(); });
    }

    return { render, setNode, loadProgress, reset, canGoBack, goBack, canGoForward, goForward };
  }

  window.GameEngine = { createEngine };
})();
