(function () {
  function createEngine(gameData, elements) {
    const state = { 
      nodeId: gameData.start || 'start', 
      history: [], 
      forward: [],
      inventory: {
        items: [],
        maxSlots: 20
      },
      variables: {} //汎用変数システム
    };

    function setNode(id) {
      if (!gameData.nodes[id]) {
        if (window.APP_CONFIG?.debug?.showConsoleLogs) {
          console.warn('Unknown node:', id);
        }
        return;
      }
      // push current to history when moving to a different node
      if (state.nodeId && state.nodeId !== id) {
        state.history.push(state.nodeId);
      }
      // normal navigation clears forward stack
      state.forward = [];
      state.nodeId = id;
      
      // Execute node actions before rendering
      executeNodeActions(gameData.nodes[id]);
      
      render();
      
      // Auto-save after node transition
      if (window.APP_CONFIG?.game?.autoSave?.enabled) {
        const delay = window.APP_CONFIG.game.autoSave.delayMs || 0;
        setTimeout(() => {
          try {
            saveProgress();
          } catch (e) {
            console.warn('Auto-save failed:', e);
          }
        }, delay);
      }
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
      
      // Scene image
      if (elements.sceneImageEl) {
        if (node.image) {
          elements.sceneImageEl.innerHTML = `<img src="${node.image}" alt="${node.title || 'Scene'}" onerror="this.parentElement.hidden=true">`;
          elements.sceneImageEl.hidden = false;
        } else {
          elements.sceneImageEl.hidden = true;
        }
      }
      
      elements.textEl.textContent = node.text || '';
      elements.choicesEl.innerHTML = '';
      (node.choices || []).forEach((c) => {
        // Check conditions for choice visibility
        if (c.conditions && !checkConditions(c.conditions)) {
          return; // Skip this choice if conditions not met
        }
        
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

    function executeItemEffect(effect) {
      if (!effect || typeof effect !== 'object') return;
      
      switch (effect.type) {
        case 'show_text':
          if (effect.text) {
            // 現在のノードテキストに効果テキストを追加
            const currentNode = getNode();
            if (currentNode) {
              currentNode.text += '\n\n' + effect.text;
              render(); // 再レンダリング
            }
          }
          break;
          
        case 'set_variable':
          if (effect.key !== undefined) {
            const operation = effect.operation || 'set';
            const currentValue = state.variables[effect.key];
            let newValue = effect.value;
            
            switch (operation) {
              case 'set':
                // 直接設定
                break;
              case 'add':
                newValue = (typeof currentValue === 'number' ? currentValue : 0) + (typeof effect.value === 'number' ? effect.value : 0);
                break;
              case 'subtract':
                newValue = (typeof currentValue === 'number' ? currentValue : 0) - (typeof effect.value === 'number' ? effect.value : 0);
                break;
              case 'multiply':
                newValue = (typeof currentValue === 'number' ? currentValue : 0) * (typeof effect.value === 'number' ? effect.value : 0);
                break;
              case 'divide':
                const divisor = typeof effect.value === 'number' ? effect.value : 1;
                if (divisor !== 0) {
                  newValue = (typeof currentValue === 'number' ? currentValue : 0) / divisor;
                }
                break;
              default:
                if (window.APP_CONFIG?.debug?.showConsoleLogs) {
                  console.warn('Unknown variable operation:', operation);
                }
                return;
            }
            
            state.variables[effect.key] = newValue;
            if (window.APP_CONFIG?.debug?.showConsoleLogs) {
              console.log(`変数操作: ${effect.key} ${operation} → ${newValue}`);
            }
          }
          break;
          
        case 'custom':
          // カスタム効果（コールバック関数）
          if (typeof effect.callback === 'function') {
            try {
              effect.callback(state, gameData);
            } catch (e) {
              if (window.APP_CONFIG?.debug?.showConsoleLogs) {
                console.error('Custom effect failed:', e);
              }
            }
          }
          break;
          
        default:
          if (window.APP_CONFIG?.debug?.showConsoleLogs) {
            console.warn('Unknown effect type:', effect.type);
          }
      }
    }

    function checkConditions(conditions) {
      if (!Array.isArray(conditions)) return true;
      
      return conditions.every(condition => {
        if (!condition || typeof condition !== 'object') return true;
        
        switch (condition.type) {
          case 'has_item':
            return condition.itemId ? hasItem(condition.itemId) : true;
            
          case 'item_count':
            const count = condition.itemId ? getItemCount(condition.itemId) : 0;
            const required = condition.count || 0;
            switch (condition.operator || '>=') {
              case '>=': return count >= required;
              case '>': return count > required;
              case '==': return count === required;
              case '!=': return count !== required;
              case '<=': return count <= required;
              case '<': return count < required;
              default: return true;
            }
            
          case 'inventory_empty':
            return state.inventory.items.length === 0;
            
          case 'inventory_full':
            return state.inventory.items.length >= state.inventory.maxSlots;
            
          case 'variable_equals':
            const varValue = state.variables[condition.key];
            const expectedValue = condition.value;
            const operator = condition.operator || '===';
            
            switch (operator) {
              case '===': return varValue === expectedValue;
              case '!==': return varValue !== expectedValue;
              case '>': return (typeof varValue === 'number' && typeof expectedValue === 'number') && varValue > expectedValue;
              case '<': return (typeof varValue === 'number' && typeof expectedValue === 'number') && varValue < expectedValue;
              case '>=': return (typeof varValue === 'number' && typeof expectedValue === 'number') && varValue >= expectedValue;
              case '<=': return (typeof varValue === 'number' && typeof expectedValue === 'number') && varValue <= expectedValue;
              default: return true;
            }
            
          case 'variable_exists':
            return state.variables.hasOwnProperty(condition.key);
            
          default:
            if (window.APP_CONFIG?.debug?.showConsoleLogs) {
              console.warn('Unknown condition type:', condition.type);
            }
            return true;
        }
      });
    }

    function clearInventory() {
      state.inventory.items = [];
      saveProgress();
    }

    // ===== Node Actions =====
    function executeNodeActions(node) {
      if (!node || !Array.isArray(node.actions)) return;
      
      node.actions.forEach(action => {
        try {
          executeAction(action);
        } catch (e) {
          if (window.APP_CONFIG?.debug?.showConsoleLogs) {
            console.error('Failed to execute action:', action, e);
          }
        }
      });
    }

    function executeAction(action) {
      if (!action || typeof action !== 'object') return;
      
      switch (action.type) {
        case 'add_item':
          if (action.itemId) {
            const success = addItem(action.itemId, action.quantity || 1);
            if (!success && action.fallbackText) {
              if (window.APP_CONFIG?.debug?.showConsoleLogs) {
                console.warn('Failed to add item:', action.itemId, action.fallbackText);
              }
            }
          }
          break;
          
        case 'remove_item':
          if (action.itemId) {
            const success = removeItem(action.itemId, action.quantity || 1);
            if (!success && action.fallbackText) {
              if (window.APP_CONFIG?.debug?.showConsoleLogs) {
                console.warn('Failed to remove item:', action.itemId, action.fallbackText);
              }
            }
          }
          break;
          
        case 'use_item':
          if (action.itemId) {
            const hasItem = hasItem(action.itemId);
            if (hasItem) {
              // アイテムを使用（消費）
              if (action.consume !== false) { // デフォルトで消費
                removeItem(action.itemId, action.quantity || 1);
              }
              
              // 使用効果を実行
              executeItemEffect(action.effect);
              
              if (window.APP_CONFIG?.debug?.showConsoleLogs) {
                console.log(`アイテム使用: ${action.itemId}`);
              }
            } else {
              if (window.APP_CONFIG?.debug?.showConsoleLogs) {
                console.warn(`アイテム不足: ${action.itemId}`);
              }
            }
          }
          break;
          
        case 'clear_inventory':
          clearInventory();
          break;

        case 'play_bgm':
          if (action.url && window.AudioManager) {
            const options = {
              volume: action.volume || 1.0,
              loop: action.loop !== false, // デフォルトでループ
              fadeIn: action.fadeIn !== false,
              crossfade: action.crossfade !== false
            };
            window.AudioManager.playBGM(action.url, options);
          }
          break;

        case 'play_sfx':
          if (action.url && window.AudioManager) {
            const options = {
              volume: action.volume || 1.0,
              loop: action.loop || false
            };
            window.AudioManager.playSFX(action.url, options);
          }
          break;

        case 'stop_bgm':
          if (window.AudioManager) {
            window.AudioManager.stopBGM(action.fadeOut !== false);
          }
          break;

        case 'stop_sfx':
          if (window.AudioManager) {
            window.AudioManager.stopAllSFX();
          }
          break;
      }
    }

    function saveProgress() {
      const hist = Array.isArray(state.history) ? state.history.slice() : [];
      const fwd = Array.isArray(state.forward) ? state.forward.slice() : [];
      const inv = {
        items: state.inventory.items.slice(),
        maxSlots: state.inventory.maxSlots
      };
      const vars = { ...state.variables }; // 変数のコピー
      StorageUtil.saveJSON('agp_progress', { 
        title: gameData.title, 
        nodeId: state.nodeId, 
        history: hist, 
        forward: fwd,
        inventory: inv,
        variables: vars
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
        
        // Load variables
        if (p.variables && typeof p.variables === 'object') {
          state.variables = { ...p.variables };
        }
      }
    }
    function reset() { 
      state.nodeId = gameData.start || 'start'; 
      state.history = []; 
      state.forward = []; 
      state.inventory.items = [];
      state.variables = {}; // 変数もリセット
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
