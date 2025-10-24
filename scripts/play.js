(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const titleEl = document.getElementById('game-title');
    const textEl = document.getElementById('scene');
    const choicesEl = document.getElementById('choices');
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

    const engine = GameEngine.createEngine(game, { titleEl, textEl, choicesEl, backBtn, forwardBtn });
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
            
            const icon = document.createElement('div');
            icon.className = 'inventory-item-icon';
            icon.textContent = item.icon || '📦';
            
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
        if (!inventoryPanel.hidden) {
          updateInventoryUI();
        }
      });
    }

    if (inventoryClose && inventoryPanel) {
      inventoryClose.addEventListener('click', () => {
        inventoryPanel.hidden = true;
      });
    }

    // Expose inventory update function globally for testing
    window.updateInventoryUI = updateInventoryUI;

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
      if(e.key === 'i' || e.key === 'I'){
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
