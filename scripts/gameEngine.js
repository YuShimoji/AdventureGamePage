(function () {
  function createEngine(gameData, elements) {
    const state = { nodeId: gameData.start || 'start' };

    function setNode(id) {
      if (!gameData.nodes[id]) {
        console.warn('Unknown node:', id);
        return;
      }
      state.nodeId = id;
      render();
      saveProgress();
    }

    function getNode() { return gameData.nodes[state.nodeId]; }

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
    }

    function saveProgress() {
      StorageUtil.saveJSON('agp_progress', { title: gameData.title, nodeId: state.nodeId });
    }
    function loadProgress() {
      const p = StorageUtil.loadJSON('agp_progress');
      if (p && p.title === gameData.title && p.nodeId && gameData.nodes[p.nodeId]) {
        state.nodeId = p.nodeId;
      }
    }
    function reset() { state.nodeId = gameData.start || 'start'; saveProgress(); render(); }

    return { render, setNode, loadProgress, reset };
  }

  window.GameEngine = { createEngine };
})();
