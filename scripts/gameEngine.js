(function () {
  function createEngine(gameData, elements) {
    // Load items data if available
    let itemsData = [];
    if (gameData && gameData.items) {
      itemsData = Array.isArray(gameData.items) ? gameData.items : [];
    }

    const state = {
      nodeId: gameData.start || 'start',
      history: [],
      forward: [],
      // Player state management
      playerState: {
        inventory: [], // Array of item IDs
        flags: {}, // Object of boolean/string flags
        variables: {}, // Object of numeric/string variables
        history: [] // Array of visited node IDs for wiki unlock etc.
      }
    };

    function setNode(id) {
      if (!gameData.nodes[id]) {
        console.warn("Unknown node:", id);
        return;
      }
      // push current to history when moving to a different node
      if (state.nodeId && state.nodeId !== id) {
        state.history.push(state.nodeId);
      }
      // normal navigation clears forward stack
      state.forward = [];
      state.nodeId = id;

      // Update player history for wiki unlock etc.
      if (!state.playerState.history.includes(id)) {
        state.playerState.history.push(id);
      }

      render();
      saveProgress();
    }

    function getNode() {
      return gameData.nodes[state.nodeId];
    }

    function canGoBack() {
      return Array.isArray(state.history) && state.history.length > 0;
    }

    function goBack() {
      if (!canGoBack()) return false;
      const prev = state.history.pop();
      if (!gameData.nodes[prev]) {
        return false;
      }
      const cur = state.nodeId;
      // move current into forward stack
      state.forward.push(cur);
      state.nodeId = prev;
      render();
      saveProgress();
      return true;
    }

    function canGoForward() {
      return Array.isArray(state.forward) && state.forward.length > 0;
    }

    function goForward() {
      if (!canGoForward()) return false;
      const next = state.forward.pop();
      if (!gameData.nodes[next]) {
        return false;
      }
      // move current into history
      if (state.nodeId) state.history.push(state.nodeId);
      state.nodeId = next;
      render();
      saveProgress();
      return true;
    }

    function render() {
      if (elements.titleEl) elements.titleEl.textContent = gameData.title || "Adventure";
      const node = getNode();
      elements.textEl.textContent = node.text || "";
      elements.choicesEl.innerHTML = "";
      (node.choices || []).forEach((c, index) => {
        const b = document.createElement("button");
        b.className = "btn";
        b.textContent = c.text;
        b.tabIndex = 0;
        b.setAttribute('data-choice-index', index + 1);
        b.setAttribute('aria-label', `${index + 1}. ${c.text}`);
        b.onclick = () => setNode(c.to);
        elements.choicesEl.appendChild(b);
      });
      // Enhanced accessibility: focus management and keyboard navigation
      try {
        const buttons = elements.choicesEl.querySelectorAll("button");
        if (buttons.length > 0) {
          // Focus the first choice button
          buttons[0].focus();
          // Add keyboard event listeners for choice navigation (if enabled)
          if (window.APP_CONFIG?.gameplay?.keyboardShortcuts?.choiceNavigation) {
            buttons.forEach((button, index) => {
              button.addEventListener('keydown', (e) => {
                const currentIndex = Array.from(buttons).indexOf(button);
                switch (e.key) {
                  case 'ArrowDown':
                  case 'ArrowRight':
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % buttons.length;
                    buttons[nextIndex].focus();
                    break;
                  case 'ArrowUp':
                  case 'ArrowLeft':
                    e.preventDefault();
                    const prevIndex = currentIndex === 0 ? buttons.length - 1 : currentIndex - 1;
                    buttons[prevIndex].focus();
                    break;
                  case 'Enter':
                  case ' ':
                    e.preventDefault();
                    button.click();
                    break;
                  default:
                    // Number keys (1-9) for direct selection
                    const num = parseInt(e.key);
                    if (num >= 1 && num <= 9 && buttons[num - 1]) {
                      e.preventDefault();
                      buttons[num - 1].focus();
                      buttons[num - 1].click();
                    }
                    break;
                }
              });
            });
          }
        }
      } catch {}
      // Update back/forward button state if provided
      if (elements && elements.backBtn) {
        elements.backBtn.disabled = !canGoBack();
      }
      if (elements && elements.forwardBtn) {
        elements.forwardBtn.disabled = !canGoForward();
      }

      // Dispatch render event for accessibility updates
      document.dispatchEvent(new CustomEvent('agp-scene-rendered', {
        detail: {
          nodeText: node.text || '',
          choiceCount: node.choices?.length || 0,
          nodeId: state.nodeId
        }
      }));
    }

    function saveProgress() {
      const hist = Array.isArray(state.history) ? state.history.slice() : [];
      const fwd = Array.isArray(state.forward) ? state.forward.slice() : [];
      const progressData = {
        title: gameData.title,
        nodeId: state.nodeId,
        history: hist,
        forward: fwd,
        playerState: JSON.parse(JSON.stringify(state.playerState)) // Deep copy
      };
      StorageUtil.saveJSON('agp_progress', progressData);
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

        // Load player state if available
        if (p.playerState) {
          state.playerState = {
            inventory: Array.isArray(p.playerState.inventory) ? p.playerState.inventory : [],
            flags: p.playerState.flags || {},
            variables: p.playerState.variables || {},
            history: Array.isArray(p.playerState.history) ? p.playerState.history : []
          };
        }
      }
    }
    function reset() {
      state.nodeId = gameData.start || "start";
      state.history = [];
      state.forward = [];
      state.playerState = {
        inventory: [], 
        flags: {}, 
        variables: {}, 
        history: [] 
      };
      saveProgress();
      render();
    }

    // optional back button wiring
    if (elements && elements.backBtn) {
      elements.backBtn.addEventListener("click", () => {
        goBack();
      });
    }
    if (elements && elements.forwardBtn) {
      elements.forwardBtn.addEventListener("click", () => {
        goForward();
      });
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
      // Player state management API
      getPlayerState: () => JSON.parse(JSON.stringify(state.playerState)),
      setPlayerState: (newState) => {
        if (newState && typeof newState === 'object') {
          state.playerState = {
            inventory: Array.isArray(newState.inventory) ? newState.inventory : state.playerState.inventory,
            flags: newState.flags || state.playerState.flags,
            variables: newState.variables || state.playerState.variables,
            history: Array.isArray(newState.history) ? newState.history : state.playerState.history
          };
          saveProgress();
        }
      },
      // Explicit save/load for save slots
      saveGame: (slotName) => {
        const now = Date.now();
        const gameDuration = now - (state.playerState.history?.[0]?.timestamp || now);
        const saveData = {
          title: gameData.title,
          timestamp: now,
          slotName: slotName || `Save ${new Date().toLocaleString()}`,
          nodeId: state.nodeId,
          history: state.history.slice(),
          forward: state.forward.slice(),
          playerState: JSON.parse(JSON.stringify(state.playerState)),
          // Additional metadata for enhanced save management
          metadata: {
            gameDuration: gameDuration,
            nodesVisited: state.history.length + 1,
            choicesMade: state.history.length,
            inventoryCount: state.playerState.inventory.length,
            lastNodeText: getNode()?.text?.substring(0, 100) || '',
            version: '1.0'
          }
        };
        return saveData;
      },
      loadGame: (saveData) => {
        if (!saveData || saveData.title !== gameData.title) return false;

        state.nodeId = saveData.nodeId;
        state.history = Array.isArray(saveData.history) ? saveData.history : [];
        state.forward = Array.isArray(saveData.forward) ? saveData.forward : [];

        if (saveData.playerState) {
          state.playerState = {
            inventory: Array.isArray(saveData.playerState.inventory) ? saveData.playerState.inventory : [],
            flags: saveData.playerState.flags || {},
            variables: saveData.playerState.variables || {},
            history: Array.isArray(saveData.playerState.history) ? saveData.playerState.history : []
          };
        }

        render();
        saveProgress();
        return true;
      },
      // Inventory management API
      addItem: (itemId) => {
        if (!itemId || state.playerState.inventory.includes(itemId)) return false;
        state.playerState.inventory.push(itemId);
        saveProgress();
        return true;
      },
      removeItem: (itemId) => {
        const index = state.playerState.inventory.indexOf(itemId);
        if (index === -1) return false;
        state.playerState.inventory.splice(index, 1);
        saveProgress();
        return true;
      },
      hasItem: (itemId) => {
        return state.playerState.inventory.includes(itemId);
      },
      getInventoryItems: () => {
        return state.playerState.inventory.map(itemId => {
          const itemData = itemsData.find(item => item.id === itemId);
          return itemData ? { ...itemData, icon: getItemIcon(itemData) } : { id: itemId, name: `不明なアイテム (${itemId})`, description: '', icon: '❓' };
        });
      },
      getItemsData: () => itemsData
    };
  }

  // Inventory management utilities
  function getItemIcon(item) {
    const type = item.type || item.category || 'item';
    const icons = {
      weapon: '⚔️',
      armor: '🛡️',
      consumable: '🧪',
      key: '🗝️',
      tool: '🔧',
      book: '📖',
      treasure: '💎'
    };
    return icons[type] || '📦';
  }

  window.GameEngine = { createEngine };
})();
