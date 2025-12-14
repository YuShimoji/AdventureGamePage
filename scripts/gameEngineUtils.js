(function () {
  // GameEngineUtils - ユーティリティ関数群
  // アイテムアイコン取得、アクション実行、エフェクト実行などの純粋関数

  class GameEngineUtils {
    static getItemIcon(item) {
      const type = item.type || item.category || 'item';
      const icons = {
        weapon: '⚔️',
        armor: '🛡️',
        consumable: '🧪',
        key: '🗝️',
        tool: '🔧',
        book: '📖',
        treasure: '💎',
      };
      return icons[type] || '📦';
    }

    static executeAction(action, state, itemsData, saveProgress) {
      if (!action || !action.type) return;

      try {
        switch (action.type) {
          case 'add_item':
            this.executeAddItemAction(action, state, itemsData, saveProgress);
            break;
          case 'remove_item':
            this.executeRemoveItemAction(action, state, itemsData, saveProgress);
            break;
          case 'use_item':
            this.executeUseItemAction(action, state, itemsData, saveProgress);
            break;
          case 'clear_inventory':
            this.executeClearInventoryAction(state, saveProgress);
            break;
          case 'set_variable':
            this.executeSetVariableAction(action, state, saveProgress);
            break;
          case 'play_bgm':
            if (window.AudioManager && typeof window.AudioManager.playBGM === 'function') {
              window.AudioManager.playBGM(action.url, {
                volume: action.volume,
                loop: action.loop,
                fadeIn: action.fadeIn,
                crossfade: action.crossfade,
              });
            }
            break;
          case 'stop_bgm':
            if (window.AudioManager && typeof window.AudioManager.stopBGM === 'function') {
              window.AudioManager.stopBGM(action.fadeOut !== false);
            }
            break;
          case 'play_sfx':
            if (window.AudioManager && typeof window.AudioManager.playSFX === 'function') {
              window.AudioManager.playSFX(action.url, {
                volume: action.volume,
                loop: action.loop,
              });
            }
            break;
          case 'stop_sfx':
            if (window.AudioManager && typeof window.AudioManager.stopAllSFX === 'function') {
              window.AudioManager.stopAllSFX();
            }
            break;
          default:
            console.warn(`Unknown action type: ${action.type}`);
        }
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
      }
    }

    static executeAddItemAction(action, state, itemsData, saveProgress) {
      const addQuantity = action.quantity || 1;
      const addSuccess = state.playerState.inventory.items.some(item => item.id === action.itemId);
      if (!addSuccess) {
        // Add new item if not exists
        const itemData = itemsData.find(item => item.id === action.itemId);
        if (itemData) {
          state.playerState.inventory.items.push({
            ...itemData,
            quantity: addQuantity,
            icon: this.getItemIcon(itemData),
          });
        }
      } else {
        // Increase quantity if exists
        const existingItem = state.playerState.inventory.items.find(
          item => item.id === action.itemId
        );
        if (existingItem) {
          existingItem.quantity += addQuantity;
        }
      }
      saveProgress();
      document.dispatchEvent(
        new CustomEvent('agp-inventory-changed', {
          detail: { action: 'add', itemId: action.itemId, quantity: addQuantity },
        })
      );
    }

    static executeRemoveItemAction(action, state, itemsData, saveProgress) {
      const removeQuantity = action.quantity || 1;
      const itemIndex = state.playerState.inventory.items.findIndex(
        item => item.id === action.itemId
      );
      if (itemIndex !== -1) {
        const item = state.playerState.inventory.items[itemIndex];
        if (item.quantity <= removeQuantity) {
          state.playerState.inventory.items.splice(itemIndex, 1);
        } else {
          item.quantity -= removeQuantity;
        }
        saveProgress();
        document.dispatchEvent(
          new CustomEvent('agp-inventory-changed', {
            detail: { action: 'remove', itemId: action.itemId, quantity: removeQuantity },
          })
        );
      }
    }

    static executeUseItemAction(action, state, itemsData, saveProgress) {
      const useItem = state.playerState.inventory.items.find(item => item.id === action.itemId);
      if (!useItem || useItem.quantity <= 0) {
        console.warn(`Cannot use item ${action.itemId}: not found or no quantity`);
        return;
      }

      // Consume item if specified
      if (action.consume !== false) {
        // Default to true
        if (useItem.quantity <= 1) {
          const index = state.playerState.inventory.items.indexOf(useItem);
          state.playerState.inventory.items.splice(index, 1);
        } else {
          useItem.quantity -= 1;
        }
      }

      // Execute effect
      if (action.effect) {
        this.executeEffect(action.effect, state);
      }

      saveProgress();
      document.dispatchEvent(
        new CustomEvent('agp-inventory-changed', {
          detail: { action: 'use', itemId: action.itemId, quantity: 1 },
        })
      );
    }

    static executeClearInventoryAction(state, saveProgress) {
      state.playerState.inventory.items = [];
      saveProgress();
      document.dispatchEvent(
        new CustomEvent('agp-inventory-changed', {
          detail: { action: 'clear' },
        })
      );
    }

    static executeSetVariableAction(action, state, saveProgress) {
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
    }

    static executeEffect(effect, state) {
      if (!effect || !effect.type) return;

      switch (effect.type) {
        case 'show_text':
          if (effect.text) {
            setTimeout(() => {
              if (window.ToastManager) {
                ToastManager.info(effect.text);
              } else {
                alert(effect.text);
              }
            }, 500);
          }
          break;
        case 'set_variable': {
          if (!state || !state.playerState || !effect.key) break;
          if (!state.playerState.variables || typeof state.playerState.variables !== 'object') {
            state.playerState.variables = {};
          }
          const op = effect.operation || 'set';
          const current = state.playerState.variables[effect.key] ?? 0;
          let value = effect.value;
          if (op !== 'set') {
            const numCur = typeof current === 'number' ? current : parseFloat(current) || 0;
            const numVal = typeof value === 'number' ? value : parseFloat(value) || 0;
            switch (op) {
              case 'add':
                value = numCur + numVal;
                break;
              case 'subtract':
                value = numCur - numVal;
                break;
              case 'multiply':
                value = numCur * (numVal || 1);
                break;
              case 'divide':
                value = numVal !== 0 ? numCur / numVal : numCur;
                break;
              default:
                value = effect.value;
            }
          } else if (value === undefined) {
            value = true;
          }
          state.playerState.variables[effect.key] = value;
          break;
        }
        case 'set_flag': {
          if (!state || !state.playerState || !effect.flag) break;
          if (!state.playerState.flags || typeof state.playerState.flags !== 'object') {
            state.playerState.flags = {};
          }
          state.playerState.flags[effect.flag] = effect.value !== undefined ? effect.value : true;
          break;
        }
        case 'heal': {
          if (!state || !state.playerState) break;
          if (!state.playerState.variables || typeof state.playerState.variables !== 'object') {
            state.playerState.variables = {};
          }
          const key = effect.key || 'health';
          const current = state.playerState.variables[key];
          const curNum = typeof current === 'number' ? current : parseFloat(current) || 0;
          const add =
            typeof effect.value === 'number' ? effect.value : parseFloat(effect.value) || 10;
          const max =
            typeof effect.maxHealth === 'number'
              ? effect.maxHealth
              : parseFloat(effect.maxHealth) || 100;
          state.playerState.variables[key] = Math.min(curNum + add, max);
          break;
        }
        default:
          console.warn(`Unknown effect type: ${effect.type}`);
      }
    }

    static migrateInventory(inventory, itemsData) {
      if (Array.isArray(inventory) && inventory.length > 0 && typeof inventory[0] === 'string') {
        // Old format: array of item IDs, convert to new format
        return {
          items: inventory.map(itemId => {
            const itemData = itemsData.find(item => item.id === itemId);
            return itemData
              ? { ...itemData, quantity: 1, icon: this.getItemIcon(itemData) }
              : {
                  id: itemId,
                  name: `不明なアイテム (${itemId})`,
                  description: '',
                  quantity: 1,
                  type: 'item',
                  usable: false,
                  icon: '❓',
                };
          }),
          maxSlots: 20,
        };
      } else if (!inventory || typeof inventory !== 'object') {
        return { items: [], maxSlots: 20 };
      } else if (!inventory.items) {
        return { items: [], maxSlots: inventory.maxSlots || 20 };
      }
      return inventory;
    }

    static createSaveData(gameData, state, getNode) {
      const now = Date.now();
      const gameDuration = now - (state.playerState.history?.[0]?.timestamp || now);
      return {
        title: gameData.title,
        timestamp: now,
        slotName: `Save ${new Date().toLocaleString()}`,
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
          version: '1.0',
        },
      };
    }
  }

  window.GameEngineUtils = GameEngineUtils;
})();
