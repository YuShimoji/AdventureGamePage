(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const titleEl = document.getElementById('game-title');
    const textEl = document.getElementById('scene');
    const choicesEl = document.getElementById('choices');
    const sceneImageEl = document.getElementById('scene-image');
    const btnRestart = document.getElementById('btn-restart');
    const backBtn = document.getElementById('btn-back');
    const forwardBtn = document.getElementById('btn-forward');
    const btnInventory = document.getElementById('btn-inventory');
    const inventoryPanel = document.getElementById('inventory-panel');
    const inventoryClose = document.getElementById('inventory-close');
    const inventoryList = document.getElementById('inventory-list');
    const inventoryCount = document.getElementById('inventory-count');

    function normalizeSpecToEngine(data){
      if(!data) return null;
      if(Array.isArray(data.nodes)){
        const nodes = {};
        data.nodes.forEach(n => {
          if(!n || !n.id) return;
          nodes[n.id] = {
            title: n.title || '',
            text: n.text || '',
            choices: Array.isArray(n.choices) ? n.choices.map(c => ({ text: c.label ?? c.text ?? '', to: c.target ?? c.to ?? '' })) : []
          };
        });
        return {
          title: data?.meta?.title || data.title || 'Adventure',
          start: data?.meta?.start || data.start || 'start',
          nodes
        };
      }
      return data;
    }

    const loaded = StorageUtil.loadJSON('agp_game_data');
    const normalize = (window.Converters?.normalizeSpecToEngine) || normalizeSpecToEngine;
    const game = normalize(loaded) || window.SAMPLE_GAME;

    const engine = GameEngine.createEngine(game, { titleEl, textEl, choicesEl, sceneImageEl, backBtn, forwardBtn });
    engine.loadProgress();
    // 進行が保存されていればそれを復元、なければ初期ノードが使用される
    // engine.reset() は初期化（リスタート）専用
    engine.render();

    btnRestart.addEventListener('click', () => engine.reset());

    // ===== Inventory UI =====
    function updateInventoryUI() {
      if (!engine || typeof engine.getInventory !== 'function') return;
      
      const inventory = engine.getInventory();
      const items = inventory.items || [];
      
      // Update count
      if (inventoryCount) {
        inventoryCount.textContent = `${inventory.currentSlots}/${inventory.maxSlots}`;
      }
      
      // Update list
      if (inventoryList) {
        inventoryList.innerHTML = '';
        
        if (items.length === 0) {
          const empty = document.createElement('p');
          empty.className = 'inventory-empty';
          empty.textContent = 'アイテムがありません';
          inventoryList.appendChild(empty);
        } else {
          items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'inventory-item';
            itemEl.setAttribute('role', 'listitem');
            itemEl.setAttribute('tabindex', '0');
            itemEl.setAttribute('aria-label', `${item.name || item.id}、数量 ${item.quantity || 1}${item.description ? `、${item.description}` : ''}`);
            
            const icon = document.createElement('div');
            icon.className = 'inventory-item-icon';
            icon.textContent = item.icon || '📦';
            icon.setAttribute('aria-hidden', 'true');
            
            const info = document.createElement('div');
            info.className = 'inventory-item-info';
            
            const name = document.createElement('p');
            name.className = 'inventory-item-name';
            name.textContent = item.name || item.id;
            
            const desc = document.createElement('p');
            desc.className = 'inventory-item-desc';
            desc.textContent = item.description || '';
            
            info.appendChild(name);
            if (item.description) {
              info.appendChild(desc);
            }
            
            const quantity = document.createElement('span');
            quantity.className = 'inventory-item-quantity';
            quantity.textContent = `×${item.quantity || 1}`;
            quantity.setAttribute('aria-label', `数量 ${item.quantity || 1}`);
            
            itemEl.appendChild(icon);
            itemEl.appendChild(info);
            itemEl.appendChild(quantity);
            inventoryList.appendChild(itemEl);
          });
        }
      }
    }

    // Inventory panel toggle
    if (btnInventory && inventoryPanel) {
      btnInventory.addEventListener('click', () => {
        inventoryPanel.hidden = !inventoryPanel.hidden;
        btnInventory.setAttribute('aria-expanded', !inventoryPanel.hidden);
        if (!inventoryPanel.hidden) {
          updateInventoryUI();
          // Focus first inventory item or close button
          setTimeout(() => {
            const firstItem = inventoryList.querySelector('.inventory-item');
            if (firstItem) {
              firstItem.focus();
            } else {
              inventoryClose?.focus();
            }
          }, 100);
        } else {
          // Return focus to inventory button
          btnInventory.focus();
        }
      });
    }

    if (inventoryClose && inventoryPanel) {
      inventoryClose.addEventListener('click', () => {
        inventoryPanel.hidden = true;
        // Return focus to inventory button
        btnInventory?.focus();
      });
    }

    // Expose inventory update function globally for testing
    window.updateInventoryUI = updateInventoryUI;

    // Inventory keyboard navigation
    inventoryList.addEventListener('keydown', (e) => {
      if (!shouldHandleShortcut(e.target)) return;
      
      const items = Array.from(inventoryList.querySelectorAll('.inventory-item'));
      const currentIndex = items.indexOf(document.activeElement);
      
      if (currentIndex === -1) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          items[prevIndex]?.focus();
          break;
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          items[nextIndex]?.focus();
          break;
        case 'Escape':
          e.preventDefault();
          inventoryPanel.hidden = true;
          btnInventory?.focus();
          break;
      }
    });

    // Keyboard shortcuts: ← 戻る / → 進む / R リスタート / I インベントリ
    function shouldHandleShortcut(target){
      if(!window.APP_CONFIG?.ui?.shortcutsEnabled) return false;
      const el = target;
      if(!el) return true;
      const tag = (el.tagName || '').toUpperCase();
      if(tag === 'INPUT' || tag === 'TEXTAREA') return false;
      if(el.isContentEditable) return false;
      return true;
    }

    // Choice navigation within choices container
    choicesEl.addEventListener('keydown', (e) => {
      if (!shouldHandleShortcut(e.target)) return;
      
      const buttons = Array.from(choicesEl.querySelectorAll('button'));
      const currentIndex = buttons.indexOf(document.activeElement);
      
      if (currentIndex === -1) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
          buttons[prevIndex]?.focus();
          break;
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
          buttons[nextIndex]?.focus();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          document.activeElement?.click();
          break;
      }
    });

    window.addEventListener('keydown', (e) => {
      if(!shouldHandleShortcut(e.target)) return;
      // Back
      if(e.key === 'ArrowLeft'){
        const ok = typeof engine.goBack === 'function' && engine.goBack();
        if(ok){ e.preventDefault(); }
        return;
      }
      // Forward
      if(e.key === 'ArrowRight'){
        const ok = typeof engine.goForward === 'function' && engine.goForward();
        if(ok){ e.preventDefault(); }
        return;
      }
      // Restart
      if(e.key === 'r' || e.key === 'R'){
        if(typeof engine.reset === 'function'){
          engine.reset();
          e.preventDefault();
        }
      }
      // Inventory
      if(e.key === 'i' || e.key === 'I' || e.key === 'z' || e.key === 'Z'){
        if(btnInventory && inventoryPanel){
          inventoryPanel.hidden = !inventoryPanel.hidden;
          if(!inventoryPanel.hidden){
            updateInventoryUI();
          }
          e.preventDefault();
        }
      }
    });

    // Expose engine globally for console testing
    window.gameEngine = engine;
  });
})();
