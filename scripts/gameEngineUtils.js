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
        treasure: '💎'
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
            icon: this.getItemIcon(itemData)
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
    }

    static executeRemoveItemAction(action, state, itemsData, saveProgress) {
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
    }

    static executeUseItemAction(action, state, itemsData, saveProgress) {
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
        this.executeEffect(action.effect);
      }

      saveProgress();
      document.dispatchEvent(new CustomEvent('agp-inventory-changed', {
        detail: { action: 'use', itemId: action.itemId, quantity: 1 }
      }));
    }

    static executeClearInventoryAction(state, saveProgress) {
      state.playerState.inventory.items = [];
      saveProgress();
      document.dispatchEvent(new CustomEvent('agp-inventory-changed', {
        detail: { action: 'clear' }
      }));
    }

    static executeSetVariableAction(action, state, saveProgress) {
      if (!action.key) return;

      // セキュリティ検証
      if (window.SecurityUtils) {
        // 変数名の検証
        if (!window.SecurityUtils.validateVariableName(action.key)) {
          console.warn(`[Security] Invalid variable name: ${action.key}`);
          return;
        }

        // 安全なオブジェクトキーかチェック
        if (!window.SecurityUtils.isSafeObjectKey(action.key)) {
          console.error(`[Security] Unsafe object key detected: ${action.key}`);
          return;
        }
      }

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

      // 値の検証
      if (window.SecurityUtils && !window.SecurityUtils.validateVariableValue(value)) {
        console.warn(`[Security] Invalid variable value for key ${action.key}:`, value);
        return;
      }

      state.playerState.variables[action.key] = value;
      saveProgress();
    }

    static executeEffect(effect) {
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

    static migrateInventory(inventory, itemsData) {
      if (Array.isArray(inventory) && inventory.length > 0 && typeof inventory[0] === 'string') {
        // Old format: array of item IDs, convert to new format
        return {
          items: inventory.map(itemId => {
            const itemData = itemsData.find(item => item.id === itemId);
            return itemData ? { ...itemData, quantity: 1, icon: this.getItemIcon(itemData) } : { id: itemId, name: `不明なアイテム (${itemId})`, description: '', quantity: 1, type: 'item', usable: false, icon: '❓' };
          }),
          maxSlots: 20
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
          version: '1.0'
        }
      };
    }

    static clonePlayerState(playerState) {
      if (!playerState || typeof playerState !== 'object') {
        return {
          inventory: { items: [], maxSlots: 20 },
          flags: {},
          variables: {},
          history: []
        };
      }

      const inventory = playerState.inventory || {};

      return {
        inventory: {
          items: Array.isArray(inventory.items)
            ? inventory.items.map(item => ({ ...item }))
            : [],
          maxSlots: inventory.maxSlots ?? 20
        },
        flags: { ...(playerState.flags || {}) },
        variables: { ...(playerState.variables || {}) },
        history: Array.isArray(playerState.history) ? playerState.history.slice() : []
      };
    }

    static sanitizeNodeList(list, nodes) {
      if (!Array.isArray(list)) return [];
      if (!nodes || typeof nodes !== 'object') return list.slice();
      return list.filter((id) => typeof id === 'string' && nodes[id]);
    }

    static createProgressPayload(gameData, state) {
      if (!gameData || !state) return null;
      const now = Date.now();
      const history = Array.isArray(state.history) ? state.history.slice() : [];
      const forward = Array.isArray(state.forward) ? state.forward.slice() : [];
      const playerState = this.clonePlayerState(state.playerState);

      const metadata = {
        updatedAt: now,
        startNode: gameData.start || 'start',
        nodesVisited: history.length + 1,
        inventoryCount: playerState.inventory.items.length,
        flagsCount: Object.keys(playerState.flags).length,
        variablesCount: Object.keys(playerState.variables).length
      };

      return this.normalizeProgressPayload({
        version: '2.0.0',
        formatVersion: 2,
        title: gameData.title,
        timestamp: now,
        nodeId: state.nodeId,
        history,
        forward,
        playerState,
        metadata
      });
    }

    static normalizeProgressPayload(payload) {
      if (!payload || typeof payload !== 'object') return null;
      const normalizedPlayerState = this.clonePlayerState(payload.playerState);
      return {
        version: payload.version || '2.0.0',
        formatVersion: payload.formatVersion || 2,
        title: payload.title || 'Unknown Game',
        nodeId: payload.nodeId,
        timestamp: payload.timestamp || Date.now(),
        history: Array.isArray(payload.history) ? payload.history.slice() : [],
        forward: Array.isArray(payload.forward) ? payload.forward.slice() : [],
        playerState: normalizedPlayerState,
        metadata: { ...(payload.metadata || {}) }
      };
    }

    static toLegacyProgress(payload) {
      const normalized = this.normalizeProgressPayload(payload);
      if (!normalized) return null;
      return {
        title: normalized.title,
        nodeId: normalized.nodeId,
        history: normalized.history.slice(),
        forward: normalized.forward.slice(),
        playerState: this.clonePlayerState(normalized.playerState)
      };
    }

    static fromLegacyProgress(data) {
      if (!data || typeof data !== 'object') return null;
      const now = Date.now();
      return this.normalizeProgressPayload({
        version: '2.0.0',
        formatVersion: 2,
        title: data.title,
        nodeId: data.nodeId,
        history: Array.isArray(data.history) ? data.history.slice() : [],
        forward: Array.isArray(data.forward) ? data.forward.slice() : [],
        playerState: data.playerState,
        timestamp: data.timestamp || now,
        metadata: {
          migratedFrom: 'legacy',
          migratedAt: now
        }
      });
    }

    static restoreStateFromPayload(state, payload, gameData, itemsData = []) {
      if (!state || !payload || !gameData) return;
      const normalized = this.normalizeProgressPayload(payload);
      if (!normalized) return;

      const nodes = gameData.nodes || {};
      const startNode = gameData.start || 'start';
      const validNodeId = (normalized.nodeId && nodes[normalized.nodeId]) ? normalized.nodeId : startNode;

      state.nodeId = validNodeId;
      state.history = this.sanitizeNodeList(normalized.history, nodes);
      state.forward = this.sanitizeNodeList(normalized.forward, nodes);

      const migratedInventory = this.migrateInventory(normalized.playerState.inventory, itemsData);
      const playerHistory = this.sanitizeNodeList(normalized.playerState.history, nodes);

      state.playerState = {
        inventory: {
          items: migratedInventory.items.map(item => ({ ...item })),
          maxSlots: migratedInventory.maxSlots
        },
        flags: { ...(normalized.playerState.flags || {}) },
        variables: { ...(normalized.playerState.variables || {}) },
        history: playerHistory
      };
    }

    static checkConditions(conditions, state) {
      if (!conditions || !Array.isArray(conditions)) return true;

      for (const cond of conditions) {
        switch (cond.type) {
          case 'has_item':
            if (!state.playerState.inventory.items.some(item => item.id === cond.itemId && item.quantity >= (cond.minQuantity || 1))) return false;
            break;
          case 'inventory_empty':
            if (state.playerState.inventory.items.length > 0) return false;
            break;
          case 'variable_exists':
            if (!(cond.key in state.playerState.variables)) return false;
            break;
          case 'variable_equals':
            if (state.playerState.variables[cond.key] !== cond.value) return false;
            break;
          case 'variable_not_equals':
            if (state.playerState.variables[cond.key] === cond.value) return false;
            break;
          case 'variable_greater_than':
            if (!(state.playerState.variables[cond.key] > cond.value)) return false;
            break;
          case 'variable_less_than':
            if (!(state.playerState.variables[cond.key] < cond.value)) return false;
            break;
          case 'variable_greater_equal':
            if (!(state.playerState.variables[cond.key] >= cond.value)) return false;
            break;
          case 'variable_less_equal':
            if (!(state.playerState.variables[cond.key] <= cond.value)) return false;
            break;
          default:
            console.warn(`Unknown condition type: ${cond.type}`);
            return false;
        }
      }
      return true;
    }
  }

  const GameEnginePersistence = {
    PRIMARY_PREFIX: 'agp_progress_v2',
    LEGACY_KEY: 'agp_progress',
    INDEX_KEY: 'agp_progress_index',

    getPrimaryKey(title) {
      const base = (title || 'default').toString().toLowerCase();
      const slug = base
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'default';
      return `${this.PRIMARY_PREFIX}_${slug}`;
    },

    savePrimary(payload) {
      const normalized = GameEngineUtils.normalizeProgressPayload(payload);
      if (!normalized || !normalized.title) return false;
      normalized.timestamp = normalized.timestamp || Date.now();
      normalized.metadata = {
        ...(normalized.metadata || {}),
        savedAt: Date.now()
      };

      const key = this.getPrimaryKey(normalized.title);
      StorageUtil.saveJSON(key, normalized);

      // Maintain simple index for future enumeration
      const index = StorageUtil.loadJSON(this.INDEX_KEY) || {};
      index[normalized.title] = { key, updatedAt: normalized.metadata.savedAt };
      StorageUtil.saveJSON(this.INDEX_KEY, index);

      const legacy = GameEngineUtils.toLegacyProgress(normalized);
      if (legacy) {
        StorageUtil.saveJSON(this.LEGACY_KEY, legacy);
      }
      return true;
    },

    loadPrimary(title, options = {}) {
      if (!title) return null;
      const key = this.getPrimaryKey(title);
      const payload = StorageUtil.loadJSON(key);
      if (payload && payload.title === title) {
        return GameEngineUtils.normalizeProgressPayload(payload);
      }

      if (options.allowLegacy) {
        const legacy = StorageUtil.loadJSON(this.LEGACY_KEY);
        if (legacy && legacy.title === title) {
          const migrated = GameEngineUtils.fromLegacyProgress(legacy);
          if (migrated) {
            this.savePrimary(migrated);
            return migrated;
          }
        }
      }

      return null;
    },

    clearPrimary(title) {
      if (!title) return;
      const key = this.getPrimaryKey(title);
      StorageUtil.remove(key);
    }
  };

  window.GameEngineUtils = GameEngineUtils;
  window.GameEnginePersistence = GameEnginePersistence;
})();
