(function () {
  // Play Inventory Module - Inventory UI and management
  window.PlayInventory = {
    init: function(engine) {
      this.engine = engine;
      this.setupInventoryPanel();
      this.setupInventoryListeners();
    },

    setupInventoryPanel: function() {
      const inventoryPanel = document.getElementById('inventory-panel');
      const inventoryCloseBtn = document.getElementById('inventory-close');
      const inventoryList = document.getElementById('inventory-list');

      const showInventoryPanel = () => {
        this.updateInventoryList(inventoryList);
        if (inventoryPanel) {
          inventoryPanel.hidden = false;
          inventoryPanel.style.display = 'block';
          // Prevent background scrolling on mobile
          if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
          }
        }
      };

      const hideInventoryPanel = () => {
        if (inventoryPanel) {
          inventoryPanel.hidden = true;
          inventoryPanel.style.display = 'none';
          // Restore scrolling
          document.body.style.overflow = '';
        }
      };

      if (inventoryCloseBtn) {
        inventoryCloseBtn.addEventListener('click', hideInventoryPanel);
      }

      if (inventoryPanel) {
        inventoryPanel.addEventListener('click', (e) => {
          if (e.target === inventoryPanel) hideInventoryPanel();
        });
      }

      // Export functions for external use
      this.showInventoryPanel = showInventoryPanel;
      this.hideInventoryPanel = hideInventoryPanel;
    },

    updateInventoryList: function(container) {
      if (!container) return;

      const inventory = this.engine.getInventory();
      container.innerHTML = '';

      if (inventory.items.length === 0) {
        container.innerHTML = '<p class="no-items">所持品がありません</p>';
        return;
      }

      inventory.items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'inventory-item';

        const iconEl = document.createElement('div');
        iconEl.className = 'inventory-item-icon';
        iconEl.textContent = item.icon;

        const infoEl = document.createElement('div');
        infoEl.className = 'inventory-item-info';

        const nameEl = document.createElement('div');
        nameEl.className = 'inventory-item-name';
        nameEl.textContent = item.name;

        const descEl = document.createElement('div');
        descEl.className = 'inventory-item-desc';
        descEl.textContent = item.description || '説明なし';

        infoEl.appendChild(nameEl);
        infoEl.appendChild(descEl);

        const actionsEl = document.createElement('div');
        actionsEl.className = 'inventory-item-actions';

        // Quantity display
        const quantityEl = document.createElement('div');
        quantityEl.className = 'inventory-item-quantity';
        quantityEl.textContent = `×${item.quantity}`;

        // Use button (only for usable items)
        if (item.usable) {
          const useBtn = document.createElement('button');
          useBtn.className = 'btn btn-use';
          useBtn.textContent = '使用';
          useBtn.addEventListener('click', () => {
            if (confirm(`"${item.name}" を使用しますか？`)) {
              // Execute item effect if defined
              if (item.effect && typeof item.effect === 'object') {
                this.executeItemEffect(item);
              }
              alert(`"${item.name}" を使用しました`);
              // Remove one from inventory (consume)
              this.engine.removeItem(item.id, 1);
              this.updateInventoryList(container);
            }
          });
          actionsEl.appendChild(useBtn);
        }

        // Drop button
        const dropBtn = document.createElement('button');
        dropBtn.className = 'btn btn-drop';
        dropBtn.textContent = '捨てる';
        dropBtn.addEventListener('click', () => {
          const maxDroppable = item.quantity;
          const quantityToDrop = maxDroppable === 1 ? 1 : parseInt(prompt(`捨てる個数を入力してください (1-${maxDroppable}):`, '1')) || 0;

          if (quantityToDrop > 0 && quantityToDrop <= maxDroppable) {
            if (confirm(`${quantityToDrop}個の "${item.name}" を捨てますか？`)) {
              this.engine.removeItem(item.id, quantityToDrop);
              this.updateInventoryList(container);
            }
          }
        });

        actionsEl.appendChild(dropBtn);

        itemEl.appendChild(iconEl);
        itemEl.appendChild(infoEl);
        itemEl.appendChild(quantityEl);
        itemEl.appendChild(actionsEl);

        container.appendChild(itemEl);
      });

      // Update inventory count display
      const countDisplay = document.querySelector('.inventory-count');
      if (countDisplay) {
        countDisplay.textContent = `${inventory.currentSlots}/${inventory.maxSlots}`;
      }
    },

    setupInventoryListeners: function() {
      const btnInventory = document.getElementById('btn-inventory');

      if (btnInventory) {
        btnInventory.addEventListener('click', () => {
          this.showInventoryPanel();
        });
      }

      // Listen for inventory changes to update UI
      document.addEventListener('agp-inventory-changed', () => {
        // Update inventory UI if panel is currently open
        const inventoryPanel = document.getElementById('inventory-panel');
        if (inventoryPanel && !inventoryPanel.hidden) {
          const inventoryList = document.getElementById('inventory-list');
          this.updateInventoryList(inventoryList);
        }
        // Update inventory count in header if exists
        const inventoryCountBtn = document.querySelector('.inventory-count-btn');
        if (inventoryCountBtn) {
          const inventory = this.engine.getInventory();
          inventoryCountBtn.textContent = inventory.currentSlots;
        }
      });
    },

    // Execute item effect based on effect type
    executeItemEffect: function(item) {
      if (!item.effect) return;

      const effect = item.effect;
      switch (effect.type) {
        case 'heal':
          // Heal player (if health system exists)
          if (this.engine.setPlayerState) {
            const state = this.engine.getPlayerState();
            const newHealth = Math.min((state.health || 0) + (effect.value || 10), effect.maxHealth || 100);
            this.engine.setPlayerState({ ...state, health: newHealth });
          }
          break;
        case 'set_flag':
          // Set a game flag
          if (this.engine.setPlayerState && effect.flag) {
            const state = this.engine.getPlayerState();
            state.flags = state.flags || {};
            state.flags[effect.flag] = effect.value !== undefined ? effect.value : true;
            this.engine.setPlayerState(state);
          }
          break;
        case 'set_variable':
          // Set a game variable
          if (this.engine.setPlayerState && effect.key) {
            const state = this.engine.getPlayerState();
            state.variables = state.variables || {};
            state.variables[effect.key] = effect.value;
            this.engine.setPlayerState(state);
          }
          break;
        case 'show_text':
          // Show text message
          if (effect.text) {
            alert(effect.text);
          }
          break;
        default:
          console.warn('Unknown item effect type:', effect.type);
      }
    }
  };
})();
