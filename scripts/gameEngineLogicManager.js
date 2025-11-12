(function () {
  // GameEngineLogicManager - コアゲームロジック
  // ステート管理、ナビゲーション、インベントリ管理、セーブ/ロード

  class GameEngineLogicManager {
    constructor(gameData, state, itemsData) {
      this.gameData = gameData;
      this.state = state;
      this.itemsData = itemsData;
      this.autoSaveTimeoutId = null;
    }

    // ノード設定
    setNode(id, executeAction, render, saveProgress) {
      if (!this.gameData.nodes[id]) {
        console.warn("Unknown node:", id);
        return;
      }
      // push current to history when moving to a different node
      if (this.state.nodeId && this.state.nodeId !== id) {
        this.state.history.push(this.state.nodeId);
      }
      // normal navigation clears forward stack
      this.state.forward = [];

      // Execute actions before setting the new node
      const node = this.gameData.nodes[id];
      if (node && Array.isArray(node.actions)) {
        node.actions.forEach(action => {
          executeAction(action);
        });
      }

      this.state.nodeId = id;

      // Update player history for wiki unlock etc.
      if (!this.state.playerState.history.includes(id)) {
        this.state.playerState.history.push(id);
      }

      render();
      
      // Auto-save with debounce if enabled
      if (window.APP_CONFIG?.game?.autoSave?.enabled) {
        const delayMs = window.APP_CONFIG.game.autoSave.delayMs || 0;
        
        // Clear any pending auto-save
        if (this.autoSaveTimeoutId) {
          clearTimeout(this.autoSaveTimeoutId);
        }
        
        // Schedule auto-save with debounce
        this.autoSaveTimeoutId = setTimeout(() => {
          try {
            saveProgress();
            if (window.APP_CONFIG?.debug?.showConsoleLogs) {
              console.log('[AutoSave] Game progress saved');
            }
          } catch (error) {
            console.warn('[AutoSave] Failed to save progress:', error);
          }
        }, delayMs);
      }
    }

    // 現在のノード取得
    getNode() {
      return this.gameData.nodes[this.state.nodeId];
    }

    // 戻る可能か
    canGoBack() {
      return Array.isArray(this.state.history) && this.state.history.length > 0;
    }

    // 戻る
    goBack(render, saveProgress) {
      if (!this.canGoBack()) return false;
      const prev = this.state.history.pop();
      if (!this.gameData.nodes[prev]) {
        return false;
      }
      const cur = this.state.nodeId;
      // move current into forward stack
      this.state.forward.push(cur);
      this.state.nodeId = prev;
      render();
      saveProgress();
      return true;
    }

    // 進む可能か
    canGoForward() {
      return Array.isArray(this.state.forward) && this.state.forward.length > 0;
    }

    // 進む
    goForward(render, saveProgress) {
      if (!this.canGoForward()) return false;
      const next = this.state.forward.pop();
      if (!this.gameData.nodes[next]) {
        return false;
      }
      // move current into history
      if (this.state.nodeId) this.state.history.push(this.state.nodeId);
      this.state.nodeId = next;
      render();
      saveProgress();
      return true;
    }

    // リセット
    reset(saveProgress, render) {
      this.state.nodeId = this.gameData.start || "start";
      this.state.history = [];
      this.state.forward = [];
      this.state.playerState = {
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

    // プログレス保存
    saveProgress() {
      const hist = Array.isArray(this.state.history) ? this.state.history.slice() : [];
      const fwd = Array.isArray(this.state.forward) ? this.state.forward.slice() : [];
      const progressData = {
        title: this.gameData.title,
        nodeId: this.state.nodeId,
        history: hist,
        forward: fwd,
        playerState: JSON.parse(JSON.stringify(this.state.playerState)) // Deep copy
      };
      StorageUtil.saveJSON('agp_progress', progressData);
    }

    // プログレスのロード
    loadProgress() {
      const p = StorageUtil.loadJSON('agp_progress');
      if (!p || p.title !== this.gameData.title) {
        return;
      }

      // セキュリティ検証
      if (window.SecurityUtils) {
        const validation = window.SecurityUtils.validateSaveData(p);
        if (!validation.valid) {
          console.error('[Security] Invalid save data detected:', validation.errors);
          if (window.APP_CONFIG?.debug?.enabled) {
            alert('セーブデータに不正な内容が含まれています。詳細はコンソールを確認してください。');
          }
          return;
        }
      }

      if (p.nodeId && this.gameData.nodes[p.nodeId]) {
        this.state.nodeId = p.nodeId;
      }
      const hist = Array.isArray(p.history) ? p.history.filter((id) => !!this.gameData.nodes[id]) : [];
      const fwd = Array.isArray(p.forward) ? p.forward.filter((id) => !!this.gameData.nodes[id]) : [];
      this.state.history = hist;
      this.state.forward = fwd;

      // Load player state if available
      if (p.playerState) {
        this.state.playerState = {
          inventory: GameEngineUtils.migrateInventory(p.playerState.inventory, this.itemsData),
          flags: p.playerState.flags || {},
          variables: p.playerState.variables || {},
          history: Array.isArray(p.playerState.history) ? p.playerState.history : []
        };
      }
    }

    // ゲームセーブ
    saveGame(slotName) {
      return GameEngineUtils.createSaveData(this.gameData, this.state, () => this.getNode());
    }

    // ゲームロード
    loadGame(saveData) {
      if (!saveData || saveData.title !== this.gameData.title) return false;

      // セキュリティ検証
      if (window.SecurityUtils) {
        const validation = window.SecurityUtils.validateSaveData(saveData);
        if (!validation.valid) {
          console.error('[Security] Invalid save data detected:', validation.errors);
          if (window.APP_CONFIG?.debug?.enabled) {
            alert('セーブデータに不正な内容が含まれています。読み込みを中止します。');
          }
          return false;
        }
      }

      this.state.nodeId = saveData.nodeId;
      this.state.history = Array.isArray(saveData.history) ? saveData.history : [];
      this.state.forward = Array.isArray(saveData.forward) ? saveData.forward : [];

      if (saveData.playerState) {
        this.state.playerState = {
          inventory: GameEngineUtils.migrateInventory(saveData.playerState.inventory, this.itemsData),
          flags: saveData.playerState.flags || {},
          variables: saveData.playerState.variables || {},
          history: Array.isArray(saveData.playerState.history) ? saveData.playerState.history : []
        };
      }

      return true;
    }

    // インベントリ管理
    addItem(itemId, quantity = 1) {
      if (!itemId || quantity <= 0) return false;

      // Find item data
      const itemData = this.itemsData.find(item => item.id === itemId);
      if (!itemData) {
        console.warn(`Item data not found for: ${itemId}`);
        return false;
      }

      // Check if item already exists in inventory
      const existingItem = this.state.playerState.inventory.items.find(item => item.id === itemId);

      if (existingItem) {
        // Increase quantity
        existingItem.quantity += quantity;
      } else {
        // Check slot limit
        if (this.state.playerState.inventory.items.length >= this.state.playerState.inventory.maxSlots) {
          console.warn('Inventory is full');
          return false;
        }

        // Add new item
        const newItem = {
          ...itemData,
          quantity: quantity,
          icon: GameEngineUtils.getItemIcon(itemData)
        };
        this.state.playerState.inventory.items.push(newItem);
      }

      this.saveProgress();
      // Emit inventory change event
      document.dispatchEvent(new CustomEvent('agp-inventory-changed', {
        detail: { action: 'add', itemId, quantity }
      }));
      return true;
    }

    removeItem(itemId, quantity = 1) {
      if (!itemId || quantity <= 0) return false;

      const itemIndex = this.state.playerState.inventory.items.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return false;

      const item = this.state.playerState.inventory.items[itemIndex];

      if (item.quantity <= quantity) {
        // Remove item completely
        this.state.playerState.inventory.items.splice(itemIndex, 1);
      } else {
        // Decrease quantity
        item.quantity -= quantity;
      }

      this.saveProgress();
      // Emit inventory change event
      document.dispatchEvent(new CustomEvent('agp-inventory-changed', {
        detail: { action: 'remove', itemId, quantity }
      }));
      return true;
    }

    useItem(itemId) {
      if (!this.hasItem(itemId, 1)) return false;

      const itemData = this.itemsData.find(item => item.id === itemId);
      if (!itemData || !itemData.effect) {
        console.warn(`No effect defined for item ${itemId}`);
        return false;
      }

      const action = { type: 'use_item', itemId, effect: itemData.effect };
      GameEngineUtils.executeAction(action, this.state, this.itemsData, this.saveProgress.bind(this));
      return true;
    }

    hasItem(itemId, minQuantity = 1) {
      if (!itemId) return false;
      const item = this.state.playerState.inventory.items.find(item => item.id === itemId);
      return item && item.quantity >= minQuantity;
    }

    getItemCount(itemId) {
      if (!itemId) return 0;
      const item = this.state.playerState.inventory.items.find(item => item.id === itemId);
      return item ? item.quantity : 0;
    }

    getInventory() {
      return {
        items: this.state.playerState.inventory.items.slice(), // Return copy
        maxSlots: this.state.playerState.inventory.maxSlots,
        currentSlots: this.state.playerState.inventory.items.length
      };
    }

    getInventoryItems() {
      return this.state.playerState.inventory.items.slice(); // Return copy with full item data
    }

    // プレイヤーステート管理
    getPlayerState() {
      return JSON.parse(JSON.stringify(this.state.playerState));
    }

    setPlayerState(newState) {
      if (newState && typeof newState === 'object') {
        this.state.playerState = {
          inventory: GameEngineUtils.migrateInventory(newState.inventory, this.itemsData),
          flags: newState.flags || this.state.playerState.flags,
          variables: newState.variables || this.state.playerState.variables,
          history: Array.isArray(newState.history) ? newState.history : this.state.playerState.history
        };
        this.saveProgress();
      }
    }

    // セーブスロット管理
    createSlot(slotId, name = '') {
      const existing = window.StorageUtil.loadJSON('agp_save_slots') || {};
      if (existing[slotId]) {
        console.warn(`Slot ${slotId} already exists`);
        return false;
      }

      const saveData = this.saveGame(name);
      const now = new Date().toISOString();
      existing[slotId] = {
        id: slotId,
        name: name || `Save ${new Date().toLocaleString()}`,
        gameState: saveData,
        meta: {
          created: now,
          modified: now,
          playTime: saveData.metadata?.gameDuration || 0,
          currentLocation: this.getNode()?.title || 'Unknown',
          progress: Math.round((saveData.metadata?.nodesVisited || 0) / Object.keys(this.gameData.nodes).length * 100),
          version: '1.0'
        }
      };
      window.StorageUtil.saveJSON('agp_save_slots', existing);
      return true;
    }

    deleteSlot(slotId) {
      const existing = window.StorageUtil.loadJSON('agp_save_slots') || {};
      if (!existing[slotId]) return false;
      delete existing[slotId];
      window.StorageUtil.saveJSON('agp_save_slots', existing);
      return true;
    }

    listSlots() {
      const existing = window.StorageUtil.loadJSON('agp_save_slots') || {};
      return Object.values(existing);
    }

    saveToSlot(slotId) {
      const existing = window.StorageUtil.loadJSON('agp_save_slots') || {};
      if (!existing[slotId]) {
        console.warn(`Slot ${slotId} does not exist`);
        return false;
      }

      const saveData = this.saveGame(existing[slotId].name);
      existing[slotId].gameState = saveData;
      existing[slotId].meta.modified = new Date().toISOString();
      existing[slotId].meta.playTime = saveData.metadata?.gameDuration || 0;
      existing[slotId].meta.currentLocation = this.getNode()?.title || 'Unknown';
      existing[slotId].meta.progress = Math.round((saveData.metadata?.nodesVisited || 0) / Object.keys(this.gameData.nodes).length * 100);

      window.StorageUtil.saveJSON('agp_save_slots', existing);
      return true;
    }

    loadFromSlot(slotId) {
      const existing = window.StorageUtil.loadJSON('agp_save_slots') || {};
      if (!existing[slotId]) return false;

      const saveData = existing[slotId].gameState;
      return this.loadGame(saveData);
    }

    renameSlot(slotId, newName) {
      const existing = window.StorageUtil.loadJSON('agp_save_slots') || {};
      if (!existing[slotId]) return false;
      existing[slotId].name = newName;
      existing[slotId].meta.modified = new Date().toISOString();
      window.StorageUtil.saveJSON('agp_save_slots', existing);
      return true;
    }

    getSlotInfo(slotId) {
      const existing = window.StorageUtil.loadJSON('agp_save_slots') || {};
      return existing[slotId] || null;
    }

    copySlot(fromId, toId, newName = '') {
      const existing = window.StorageUtil.loadJSON('agp_save_slots') || {};
      if (!existing[fromId]) return false;
      if (existing[toId]) {
        console.warn(`Slot ${toId} already exists`);
        return false;
      }

      existing[toId] = {
        ...existing[fromId],
        id: toId,
        name: newName || `Copy of ${existing[fromId].name}`,
        meta: {
          ...existing[fromId].meta,
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        }
      };
      window.StorageUtil.saveJSON('agp_save_slots', existing);
      return true;
    }
  }

  window.GameEngineLogicManager = GameEngineLogicManager;
})();
