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
        inventory: {
          items: [], // Array of item objects: {id, name, description, quantity, type, usable, ...}
          maxSlots: 20
        },
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

      // Execute actions before setting the new node
      const node = gameData.nodes[id];
      if (node && Array.isArray(node.actions)) {
        node.actions.forEach(action => {
          executeAction(action);
        });
      }

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
          // Migrate old inventory format if needed
          let inventory = p.playerState.inventory;
          if (Array.isArray(inventory) && inventory.length > 0 && typeof inventory[0] === 'string') {
            // Old format: array of item IDs, convert to new format
            inventory = {
              items: inventory.map(itemId => {
                const itemData = itemsData.find(item => item.id === itemId);
                return itemData ? { ...itemData, quantity: 1, icon: getItemIcon(itemData) } : { id: itemId, name: `不明なアイテム (${itemId})`, description: '', quantity: 1, type: 'item', usable: false, icon: '❓' };
              }),
              maxSlots: 20
            };
          } else if (!inventory || typeof inventory !== 'object') {
            inventory = { items: [], maxSlots: 20 };
          } else if (!inventory.items) {
            inventory = { items: [], maxSlots: inventory.maxSlots || 20 };
          }

          state.playerState = {
            inventory: inventory,
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
        inventory: {
          items: [],
          maxSlots: 20
        },
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
          let inventory = newState.inventory;
          if (Array.isArray(inventory) && inventory.length > 0 && typeof inventory[0] === 'string') {
            // Migrate old format
            inventory = {
              items: inventory.map(itemId => {
                const itemData = itemsData.find(item => item.id === itemId);
                return itemData ? { ...itemData, quantity: 1, icon: getItemIcon(itemData) } : { id: itemId, name: `不明なアイテム (${itemId})`, description: '', quantity: 1, type: 'item', usable: false, icon: '❓' };
              }),
              maxSlots: 20
            };
          } else if (!inventory || typeof inventory !== 'object') {
            inventory = { items: [], maxSlots: 20 };
          } else if (!inventory.items) {
            inventory = { items: [], maxSlots: inventory.maxSlots || 20 };
          }

          state.playerState = {
            inventory: inventory,
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
            inventoryCount: state.playerState.inventory.items.length,
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
          // Migrate inventory format if needed
          let inventory = saveData.playerState.inventory;
          if (Array.isArray(inventory) && inventory.length > 0 && typeof inventory[0] === 'string') {
            // Old format: array of item IDs
            inventory = {
              items: inventory.map(itemId => {
                const itemData = itemsData.find(item => item.id === itemId);
                return itemData ? { ...itemData, quantity: 1, icon: getItemIcon(itemData) } : { id: itemId, name: `不明なアイテム (${itemId})`, description: '', quantity: 1, type: 'item', usable: false, icon: '❓' };
              }),
              maxSlots: 20
            };
          } else if (!inventory || typeof inventory !== 'object') {
            inventory = { items: [], maxSlots: 20 };
          } else if (!inventory.items) {
            inventory = { items: [], maxSlots: inventory.maxSlots || 20 };
          }

          state.playerState = {
            inventory: inventory,
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
      addItem: (itemId, quantity = 1) => {
        if (!itemId || quantity <= 0) return false;

        // Find item data
        const itemData = itemsData.find(item => item.id === itemId);
        if (!itemData) {
          console.warn(`Item data not found for: ${itemId}`);
          return false;
        }

        // Check if item already exists in inventory
        const existingItem = state.playerState.inventory.items.find(item => item.id === itemId);

        if (existingItem) {
          // Increase quantity
          existingItem.quantity += quantity;
        } else {
          // Check slot limit
          if (state.playerState.inventory.items.length >= state.playerState.inventory.maxSlots) {
            console.warn('Inventory is full');
            return false;
          }

          // Add new item
          const newItem = {
            ...itemData,
            quantity: quantity,
            icon: getItemIcon(itemData)
          };
          state.playerState.inventory.items.push(newItem);
        }

        saveProgress();
        // Emit inventory change event
        document.dispatchEvent(new CustomEvent('agp-inventory-changed', {
          detail: { action: 'add', itemId, quantity }
        }));
        return true;
      },

      removeItem: (itemId, quantity = 1) => {
        if (!itemId || quantity <= 0) return false;

        const itemIndex = state.playerState.inventory.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return false;

        const item = state.playerState.inventory.items[itemIndex];

        if (item.quantity <= quantity) {
          // Remove item completely
          state.playerState.inventory.items.splice(itemIndex, 1);
        } else {
          // Decrease quantity
          item.quantity -= quantity;
        }

        saveProgress();
        // Emit inventory change event
        document.dispatchEvent(new CustomEvent('agp-inventory-changed', {
          detail: { action: 'remove', itemId, quantity }
        }));
        return true;
      },

      hasItem: (itemId, minQuantity = 1) => {
        if (!itemId) return false;
        const item = state.playerState.inventory.items.find(item => item.id === itemId);
        return item && item.quantity >= minQuantity;
      },

      getItemCount: (itemId) => {
        if (!itemId) return 0;
        const item = state.playerState.inventory.items.find(item => item.id === itemId);
        return item ? item.quantity : 0;
      },

      getInventory: () => {
        return {
          items: state.playerState.inventory.items.slice(), // Return copy
          maxSlots: state.playerState.inventory.maxSlots,
          currentSlots: state.playerState.inventory.items.length
        };
      },

      getInventoryItems: () => {
        return state.playerState.inventory.items.slice(); // Return copy with full item data
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

  // Action execution utilities
  function executeAction(action) {
    if (!action || !action.type) return;

    try {
      switch (action.type) {
        case 'add_item':
          const addQuantity = action.quantity || 1;
          const addSuccess = state.playerState.inventory.items.some(item => item.id === action.itemId);
          if (!addSuccess) {
            // Add new item if not exists
            const itemData = itemsData.find(item => item.id === action.itemId);
            if (itemData) {
              state.playerState.inventory.items.push({
                ...itemData,
                quantity: addQuantity,
                icon: getItemIcon(itemData)
              });
            }
          } else {
            // Increase quantity if exists
            const existingItem = state.playerState.inventory.items.find(item => item.id === action.itemId);
            if (existingItem) {
              existingItem.quantity += addQuantity;
            }
          }
          saveProgress();
          document.dispatchEvent(new CustomEvent('agp-inventory-changed', {
            detail: { action: 'add', itemId: action.itemId, quantity: addQuantity }
          }));
          break;

        case 'remove_item':
          const removeQuantity = action.quantity || 1;
          const itemIndex = state.playerState.inventory.items.findIndex(item => item.id === action.itemId);
          if (itemIndex !== -1) {
            const item = state.playerState.inventory.items[itemIndex];
            if (item.quantity <= removeQuantity) {
              state.playerState.inventory.items.splice(itemIndex, 1);
            } else {
              item.quantity -= removeQuantity;
            }
            saveProgress();
            document.dispatchEvent(new CustomEvent('agp-inventory-changed', {
              detail: { action: 'remove', itemId: action.itemId, quantity: removeQuantity }
            }));
          }
          break;

        case 'use_item':
          const useItem = state.playerState.inventory.items.find(item => item.id === action.itemId);
          if (!useItem || useItem.quantity <= 0) {
            console.warn(`Cannot use item ${action.itemId}: not found or no quantity`);
            return;
          }

          // Consume item if specified
          if (action.consume !== false) { // Default to true
            if (useItem.quantity <= 1) {
              const index = state.playerState.inventory.items.indexOf(useItem);
              state.playerState.inventory.items.splice(index, 1);
            } else {
              useItem.quantity -= 1;
            }
          }

          // Execute effect
          if (action.effect) {
            executeEffect(action.effect);
          }

          saveProgress();
          document.dispatchEvent(new CustomEvent('agp-inventory-changed', {
            detail: { action: 'use', itemId: action.itemId, quantity: 1 }
          }));
          break;

        case 'clear_inventory':
          state.playerState.inventory.items = [];
          saveProgress();
          document.dispatchEvent(new CustomEvent('agp-inventory-changed', {
            detail: { action: 'clear' }
          }));
          break;

        case 'set_variable':
          if (action.key) {
            let value = action.value;
            if (action.operation && action.operation !== 'set') {
              const current = state.playerState.variables[action.key] || 0;
              switch (action.operation) {
                case 'add':
                  value = current + (value || 0);
                  break;
                case 'subtract':
                  value = current - (value || 0);
                  break;
                case 'multiply':
                  value = current * (value || 1);
                  break;
                case 'divide':
                  value = value !== 0 ? current / value : current;
                  break;
              }
            }
            state.playerState.variables[action.key] = value;
            saveProgress();
          }
          break;

        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
    }
  }

  function executeEffect(effect) {
    if (!effect || !effect.type) return;

    switch (effect.type) {
      case 'show_text':
        if (effect.text) {
          // Show text as an alert for now, could be enhanced to show in-game message
          setTimeout(() => {
            alert(effect.text);
          }, 500);
        }
        break;

      case 'set_variable':
        // Already handled in set_variable action
        break;

      default:
        console.warn(`Unknown effect type: ${effect.type}`);
    }
  }

  window.GameEngine = { createEngine };
})();
