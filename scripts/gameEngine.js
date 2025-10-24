(function () {
  function createEngine(gameData, elements) {
    const state = { 
      nodeId: gameData.start || 'start', 
      history: [], 
      forward: [],
      inventory: {
        items: [],
        maxSlots: 20
      }
    };

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
      // Accessibility: focus the first choice button if present
      try {
        const first = elements.choicesEl.querySelector('button');
        if (first && typeof first.focus === 'function') first.focus();
      } catch {}
      // Update back/forward button state if provided
      if (elements && elements.backBtn) { elements.backBtn.disabled = !canGoBack(); }
      if (elements && elements.forwardBtn) { elements.forwardBtn.disabled = !canGoForward(); }
    }

    // ===== Inventory Management =====
    function addItem(itemId, quantity = 1) {
      if (!itemId || typeof itemId !== 'string') {
        console.warn('Invalid item ID');
        return false;
      }
      
      const existingItem = state.inventory.items.find(i => i.id === itemId);
      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + quantity;
      } else {
        // Check max slots
        if (state.inventory.items.length >= state.inventory.maxSlots) {
          console.warn('Inventory full');
          return false;
        }
        state.inventory.items.push({
          id: itemId,
          quantity: quantity,
          addedAt: new Date().toISOString()
        });
      }
      saveProgress();
      return true;
    }

    function removeItem(itemId, quantity = 1) {
      if (!itemId || typeof itemId !== 'string') {
        console.warn('Invalid item ID');
        return false;
      }
      
      const itemIndex = state.inventory.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) {
        console.warn('Item not found:', itemId);
        return false;
      }
      
      const item = state.inventory.items[itemIndex];
      item.quantity = (item.quantity || 1) - quantity;
      
      if (item.quantity <= 0) {
        state.inventory.items.splice(itemIndex, 1);
      }
      
      saveProgress();
      return true;
    }

    function hasItem(itemId) {
      return state.inventory.items.some(i => i.id === itemId);
    }

    function getItemCount(itemId) {
      const item = state.inventory.items.find(i => i.id === itemId);
      return item ? (item.quantity || 1) : 0;
    }

    function getInventory() {
      return {
        items: state.inventory.items.slice(), // Return a copy
        maxSlots: state.inventory.maxSlots,
        currentSlots: state.inventory.items.length
      };
    }

    function clearInventory() {
      state.inventory.items = [];
      saveProgress();
    }

    function saveProgress() {
      const hist = Array.isArray(state.history) ? state.history.slice() : [];
      const fwd = Array.isArray(state.forward) ? state.forward.slice() : [];
      const inv = {
        items: state.inventory.items.slice(),
        maxSlots: state.inventory.maxSlots
      };
      StorageUtil.saveJSON('agp_progress', { 
        title: gameData.title, 
        nodeId: state.nodeId, 
        history: hist, 
        forward: fwd,
        inventory: inv
      });
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
        
        // Load inventory
        if (p.inventory) {
          state.inventory.items = Array.isArray(p.inventory.items) ? p.inventory.items.slice() : [];
          state.inventory.maxSlots = p.inventory.maxSlots || 20;
        }
      }
    }
    function reset() { 
      state.nodeId = gameData.start || 'start'; 
      state.history = []; 
      state.forward = []; 
      state.inventory.items = [];
      saveProgress(); 
      render(); 
    }

    // optional back button wiring
    if (elements && elements.backBtn) {
      elements.backBtn.addEventListener('click', () => { goBack(); });
    }
    if (elements && elements.forwardBtn) {
      elements.forwardBtn.addEventListener('click', () => { goForward(); });
    }

    return { 
      render, 
      setNode, 
      loadProgress, 
      reset, 
      canGoBack, 
      goBack, 
      canGoForward, 
      goForward,
      // Inventory API
      addItem,
      removeItem,
      hasItem,
      getItemCount,
      getInventory,
      clearInventory
    };
  }

  window.GameEngine = { createEngine };
})();
