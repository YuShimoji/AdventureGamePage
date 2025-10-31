(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const titleEl = document.getElementById("game-title");
    const textEl = document.getElementById("scene");
    const choicesEl = document.getElementById("choices");
    const btnRestart = document.getElementById("btn-restart");
    const backBtn = document.getElementById("btn-back");
    const forwardBtn = document.getElementById("btn-forward");

    function normalizeSpecToEngine(data) {
      if (!data) return null;
      if (Array.isArray(data.nodes)) {
        const nodes = {};
        data.nodes.forEach((n) => {
          if (!n || !n.id) return;
          nodes[n.id] = {
            title: n.title || "",
            text: n.text || "",
            choices: Array.isArray(n.choices)
              ? n.choices.map((c) => ({
                  text: c.label ?? c.text ?? "",
                  to: c.target ?? c.to ?? "",
                }))
              : [],
          };
        });
        return {
          title: data?.meta?.title || data.title || "Adventure",
          start: data?.meta?.start || data.start || "start",
          nodes,
        };
      }
      return data;
    }

    const loaded = StorageUtil.loadJSON("agp_game_data");
    const normalize = window.Converters?.normalizeSpecToEngine || normalizeSpecToEngine;
    let game;
    try {
      game = normalize(loaded);
      if (!game && loaded) {
        throw new Error("保存されたゲームデータの形式が無効です。");
      }
      if (!game) {
        game = window.SAMPLE_GAME;
        console.info("サンプルゲームを使用します。");
      }
    } catch (e) {
      console.error("ゲームデータの読み込みエラー:", e);
      alert(`ゲームデータの読み込みに失敗しました: ${e.message}\nサンプルゲームを使用します。`);
      game = window.SAMPLE_GAME;
    }

    const engine = GameEngine.createEngine(game, {
      titleEl,
      textEl,
      choicesEl,
      backBtn,
      forwardBtn,
    });
    try {
      engine.loadProgress();
    } catch (e) {
      console.error("進行データの読み込みエラー:", e);
      alert("進行データの読み込みに失敗しました。最初から開始します。");
      engine.reset();
    }
    // 進行が保存されていればそれを復元、なければ初期ノードが使用される
    // engine.reset() は初期化（リスタート）専用
    engine.render();

    // Node transition event listener for item acquisition
    document.addEventListener('agp-node-selection-changed', (e) => {
      const nodeId = e.detail?.nodeId;
      if (nodeId === 'key' && !engine.hasItem('rusty_key')) {
        // Add rusty key when entering the key node
        engine.addItem('rusty_key');
        setTimeout(() => {
          alert('錆びた鍵を手に入れた！');
        }, 500);
      }
    });

    btnRestart.addEventListener("click", () => engine.reset());

    // Keyboard shortcuts: ← 戻る / → 進む / R リスタート
    function shouldHandleShortcut(target) {
      if (!window.APP_CONFIG?.gameplay?.keyboardShortcuts?.enabled) return false;
      const el = target;
      if (!el) return true;
      const tag = (el.tagName || "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA") return false;
      if (el.isContentEditable) return false;
      return true;
    }
    window.addEventListener("keydown", (e) => {
      if (!shouldHandleShortcut(e.target)) return;
      // Back
      if (e.key === "ArrowLeft") {
        const ok = typeof engine.goBack === "function" && engine.goBack();
        if (ok) {
          e.preventDefault();
        }
        return;
      }
      // Forward
      if (e.key === "ArrowRight") {
        const ok = typeof engine.goForward === "function" && engine.goForward();
        if (ok) {
          e.preventDefault();
        }
        return;
      }
      // Header button shortcuts (if enabled)
      if (window.APP_CONFIG?.gameplay?.keyboardShortcuts?.headerShortcuts) {
        if (e.key === "s" || e.key === "S") {
          // Save shortcut
          e.preventDefault();
          if (btnSave) btnSave.click();
          return;
        }
        if (e.key === "l" || e.key === "L") {
          // Load shortcut
          e.preventDefault();
          if (btnLoad) btnLoad.click();
          return;
        }
        if (e.key === "i" || e.key === "I") {
          // Inventory shortcut
          e.preventDefault();
          if (btnInventory) btnInventory.click();
          return;
        }
      }
      // Restart
      if (e.key === "r" || e.key === "R") {
        if (typeof engine.reset === "function") {
          engine.reset();
          e.preventDefault();
        }
      }
    });

    // Save/Load Modal Management
    const modal = document.getElementById('save-load-modal');
    const modalTitle = document.getElementById('modal-title');
    const savePanel = document.getElementById('save-panel');
    const loadPanel = document.getElementById('load-panel');
    const saveNameInput = document.getElementById('save-name');
    const saveConfirmBtn = document.getElementById('btn-save-confirm');
    const savedGamesList = document.getElementById('saved-games-list');
    const modalCloseBtn = document.getElementById('modal-close');
    const btnSave = document.getElementById('btn-save');
    const btnLoad = document.getElementById('btn-load');
    const btnInventory = document.getElementById('btn-inventory');
    const btnBack = document.getElementById('btn-back');
    const btnForward = document.getElementById('btn-forward');
    const btnRestart = document.getElementById('btn-restart');
    const btnTheme = document.getElementById('btn-theme');
    const btnImportSave = document.getElementById('btn-import-save');
    const inventoryPanel = document.getElementById('inventory-panel');
    const inventoryCloseBtn = document.getElementById('inventory-close');
    const inventoryList = document.getElementById('inventory-list');

    // Mobile menu elements
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileBtnSave = document.getElementById('mobile-btn-save');
    const mobileBtnLoad = document.getElementById('mobile-btn-load');
    const mobileBtnInventory = document.getElementById('mobile-btn-inventory');
    const mobileBtnBack = document.getElementById('mobile-btn-back');
    const mobileBtnForward = document.getElementById('mobile-btn-forward');
    const mobileBtnRestart = document.getElementById('mobile-btn-restart');
    const mobileBtnTheme = document.getElementById('mobile-btn-theme');
    const mobileFileImport = document.getElementById('mobile-play-file-import');

    // Screen reader support elements
    const sceneStatus = document.getElementById('scene-status');
    const gameStatus = document.getElementById('game-status');

    let currentGameTitle = game.title;

    // Ensure modal is hidden on initialization
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
    }
    if (inventoryPanel) {
      inventoryPanel.hidden = true;
      inventoryPanel.style.display = 'none';
    }

    // Modal functions
    function showModal(isSaveMode) {
      if (!modal) return;
      modalTitle.textContent = isSaveMode ? 'ゲームデータを保存' : 'ゲームデータを読み込み';
      savePanel.hidden = !isSaveMode;
      loadPanel.hidden = isSaveMode;
      if (isSaveMode) {
        saveNameInput.value = '';
        saveNameInput.focus();
      } else {
        loadSavedGames();
      }
      modal.hidden = false;
      modal.style.display = 'flex';
    }

    function hideModal() {
      if (modal) {
        modal.hidden = true;
        modal.style.display = 'none';
      }
    }

    function saveGameToStorage(saveData) {
      const key = `agp_save_slots_${currentGameTitle}`;
      const existing = StorageUtil.loadJSON(key) || [];
      // Remove existing save with same name if exists
      const filtered = existing.filter(s => s.slotName !== saveData.slotName);
      filtered.push(saveData);
      // Keep only last 10 saves
      const recent = filtered.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
      StorageUtil.saveJSON(key, recent);
    }

    function loadSavedGames() {
      const key = `agp_save_slots_${currentGameTitle}`;
      const saves = StorageUtil.loadJSON(key) || [];
      savedGamesList.innerHTML = '';

      if (saves.length === 0) {
        savedGamesList.innerHTML = '<p class="no-data">保存されたゲームデータがありません</p>';
        return;
      }

      saves.sort((a, b) => b.timestamp - a.timestamp).forEach(save => {
        const item = document.createElement('div');
        item.className = 'saved-game-item';

        const info = document.createElement('div');
        info.className = 'saved-game-info';

        const name = document.createElement('div');
        name.className = 'saved-game-name';
        name.textContent = save.slotName;

        const meta = document.createElement('div');
        meta.className = 'saved-game-meta';
        const saveDate = new Date(save.timestamp).toLocaleString();
        const metadata = save.metadata || {};
        const duration = metadata.gameDuration ? formatDuration(metadata.gameDuration) : '';
        const stats = metadata.nodesVisited ? ` (${metadata.nodesVisited}ノード, ${metadata.inventoryCount}アイテム)` : '';
        meta.textContent = `${saveDate}${duration ? ` • ${duration}` : ''}${stats}`;

        const lastNode = document.createElement('div');
        lastNode.className = 'saved-game-last-node';
        if (metadata.lastNodeText) {
          lastNode.textContent = `「${metadata.lastNodeText}${metadata.lastNodeText.length >= 100 ? '...' : ''}」`;
        }

        info.appendChild(name);
        info.appendChild(meta);
        if (lastNode.textContent) info.appendChild(lastNode);

        const actions = document.createElement('div');
        actions.className = 'saved-game-actions';

        const loadBtn = document.createElement('button');
        loadBtn.className = 'btn btn-accent';
        loadBtn.textContent = '読み込み';
        loadBtn.addEventListener('click', () => {
          if (engine.loadGame(save)) {
            hideModal();
            alert('ゲームデータを読み込みました');
          } else {
            alert('ゲームデータの読み込みに失敗しました');
          }
        });

        const renameBtn = document.createElement('button');
        renameBtn.className = 'btn';
        renameBtn.textContent = '名前変更';
        renameBtn.addEventListener('click', () => {
          const newName = prompt('新しいセーブ名を入力してください:', save.slotName);
          if (newName && newName.trim() && newName !== save.slotName) {
            save.slotName = newName.trim();
            StorageUtil.saveJSON(key, saves);
            loadSavedGames();
          }
        });

        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn';
        exportBtn.textContent = 'エクスポート';
        exportBtn.addEventListener('click', () => {
          exportSaveData(save);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn';
        deleteBtn.textContent = '削除';
        deleteBtn.addEventListener('click', () => {
          if (confirm(`"${save.slotName}" を削除しますか？`)) {
            const updated = saves.filter(s => s !== save);
            StorageUtil.saveJSON(key, updated);
            loadSavedGames();
          }
        });

        actions.appendChild(loadBtn);
        actions.appendChild(renameBtn);
        actions.appendChild(exportBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(info);
        item.appendChild(actions);
        savedGamesList.appendChild(item);
      });
    }

    function formatDuration(ms) {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        return `${hours}時間${minutes % 60}分`;
      } else if (minutes > 0) {
        return `${minutes}分`;
      } else {
        return `${seconds}秒`;
      }
    }

    function exportSaveData(saveData) {
      try {
        const exportData = {
          ...saveData,
          exportedAt: Date.now(),
          exportVersion: '1.0'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${saveData.slotName.replace(/[^a-z0-9]/gi, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('セーブデータをエクスポートしました');
      } catch (error) {
        console.error('Export failed:', error);
        alert('エクスポートに失敗しました');
      }
    }

    function importSaveData() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importData = JSON.parse(e.target.result);

            // Validate import data
            if (!importData.title || !importData.slotName || !importData.timestamp) {
              throw new Error('Invalid save data format');
            }

            // Check if slot name already exists
            const key = `agp_save_slots_${currentGameTitle}`;
            const existing = StorageUtil.loadJSON(key) || [];
            const existingNames = existing.map(s => s.slotName);

            let finalSlotName = importData.slotName;
            if (existingNames.includes(finalSlotName)) {
              const newName = prompt('同じ名前のセーブデータが存在します。新しい名前を入力してください:', `${finalSlotName} (imported)`);
              if (!newName || !newName.trim()) return;
              finalSlotName = newName.trim();
            }

            // Add imported data
            const saveData = {
              ...importData,
              slotName: finalSlotName,
              imported: true,
              importTimestamp: Date.now()
            };

            existing.push(saveData);
            StorageUtil.saveJSON(key, existing);
            loadSavedGames();

            alert(`セーブデータをインポートしました: ${finalSlotName}`);
          } catch (error) {
            console.error('Import failed:', error);
            alert('インポートに失敗しました。ファイル形式が正しいか確認してください。');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }

    // Inventory Panel Management
    function showInventoryPanel() {
      updateInventoryList();
      if (inventoryPanel) {
        inventoryPanel.hidden = false;
        inventoryPanel.style.display = 'block';
        // Prevent background scrolling on mobile
        if (window.innerWidth <= 768) {
          document.body.style.overflow = 'hidden';
        }
      }
    }

    function hideInventoryPanel() {
      if (inventoryPanel) {
        inventoryPanel.hidden = true;
        inventoryPanel.style.display = 'none';
        // Restore scrolling
        document.body.style.overflow = '';
      }
    }

    function updateInventoryList() {
      if (!inventoryList) return;

      const inventory = engine.getInventory();
      inventoryList.innerHTML = '';

      if (inventory.items.length === 0) {
        inventoryList.innerHTML = '<p class="no-items">所持品がありません</p>';
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
              // TODO: Implement item usage logic based on item effects
              alert(`"${item.name}" を使用しました`);
              // For now, just remove one from inventory
              engine.removeItem(item.id, 1);
              updateInventoryList();
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
              engine.removeItem(item.id, quantityToDrop);
              updateInventoryList();
            }
          }
        });

        actionsEl.appendChild(dropBtn);

        itemEl.appendChild(iconEl);
        itemEl.appendChild(infoEl);
        itemEl.appendChild(quantityEl);
        itemEl.appendChild(actionsEl);

        inventoryList.appendChild(itemEl);
      });

      // Update inventory count display
      const countDisplay = document.querySelector('.inventory-count');
      if (countDisplay) {
        countDisplay.textContent = `${inventory.currentSlots}/${inventory.maxSlots}`;
      }
    }

    // Event listeners setup
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        showSaveLoadModal('save');
        announceToScreenReader('セーブ画面を開きました', 'assertive');
      });
    }

    if (btnLoad) {
      btnLoad.addEventListener('click', () => {
        showSaveLoadModal('load');
        announceToScreenReader('ロード画面を開きました', 'assertive');
      });
    }

    if (btnInventory) {
      btnInventory.addEventListener('click', () => {
        showInventoryPanel();
        announceGameAction('inventoryOpened');
      });
    }

    if (btnBack) {
      btnBack.addEventListener('click', () => {
        if (engine.goBack()) {
          announceGameAction('back');
        }
      });
    }

    if (btnForward) {
      btnForward.addEventListener('click', () => {
        if (engine.goForward()) {
          announceGameAction('forward');
        }
      });
    }

    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        if (confirm('ゲームを最初から開始しますか？')) {
          engine.restartGame();
          announceGameAction('restarted');
        }
      });
    }

    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        // Theme panel toggle logic
        const panel = document.getElementById("theme-panel");
        if (panel) {
          if (panel.hidden) {
            panel.hidden = false;
            panel.style.display = 'flex';
            announceToScreenReader('テーマ設定パネルを開きました', 'assertive');
          } else {
            panel.hidden = true;
            panel.style.display = 'none';
            announceToScreenReader('テーマ設定パネルを閉じました', 'assertive');
          }
        }
      });
    }

    if (btnImportSave) {
      btnImportSave.addEventListener('click', importSaveData);
    }

    // Mobile menu functionality
    function openMobileMenu() {
      if (mobileMenuOverlay) {
        mobileMenuOverlay.hidden = false;
        mobileMenuOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
      }
    }

    function closeMobileMenu() {
      if (mobileMenuOverlay) {
        mobileMenuOverlay.hidden = true;
        mobileMenuOverlay.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
      }
    }

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', openMobileMenu);
    }

    if (mobileMenuClose) {
      mobileMenuClose.addEventListener('click', closeMobileMenu);
    }

    if (mobileMenuOverlay) {
      mobileMenuOverlay.addEventListener('click', (e) => {
        if (e.target === mobileMenuOverlay) closeMobileMenu();
      });
    }

    // Mobile menu button handlers - delegate to desktop buttons
    if (mobileBtnSave) mobileBtnSave.addEventListener('click', () => { btnSave.click(); closeMobileMenu(); });
    if (mobileBtnLoad) mobileBtnLoad.addEventListener('click', () => { btnLoad.click(); closeMobileMenu(); });
    if (mobileBtnInventory) mobileBtnInventory.addEventListener('click', () => { btnInventory.click(); closeMobileMenu(); });
    if (mobileBtnBack) mobileBtnBack.addEventListener('click', () => { btnBack.click(); closeMobileMenu(); });
    if (mobileBtnForward) mobileBtnForward.addEventListener('click', () => { btnForward.click(); closeMobileMenu(); });
    if (mobileBtnRestart) mobileBtnRestart.addEventListener('click', () => { btnRestart.click(); closeMobileMenu(); });
    if (mobileBtnTheme) mobileBtnTheme.addEventListener('click', () => { btnTheme.click(); closeMobileMenu(); });

    // Mobile file import handler
    if (mobileFileImport) {
      mobileFileImport.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          const fileInput = document.getElementById('play-file-import');
          if (fileInput) {
            // Copy the file to the desktop file input to trigger existing logic
            fileInput.files = e.target.files;
            fileInput.dispatchEvent(new Event('change'));
          }
        }
        closeMobileMenu();
      });
    }

    // Inventory event listeners
    if (btnInventory) {
      btnInventory.addEventListener('click', showInventoryPanel);
    }

    if (inventoryCloseBtn) {
      inventoryCloseBtn.addEventListener('click', hideInventoryPanel);
    }

    if (inventoryPanel) {
      inventoryPanel.addEventListener('click', (e) => {
        if (e.target === inventoryPanel) hideInventoryPanel();
      });
    }

    // Listen for inventory changes to update UI
    document.addEventListener('agp-inventory-changed', () => {
      // Update inventory UI if panel is currently open
      if (inventoryPanel && !inventoryPanel.hidden) {
        updateInventoryList();
      }
      // Update inventory count in header if exists
      const inventoryCountBtn = document.querySelector('.inventory-count-btn');
      if (inventoryCountBtn) {
        const inventory = engine.getInventory();
        inventoryCountBtn.textContent = inventory.currentSlots;
      }
    });

    // Screen reader support functions
    function announceToScreenReader(message, priority = 'polite') {
      const target = priority === 'assertive' ? gameStatus : sceneStatus;
      if (target) {
        target.textContent = message;
        // Clear the message after a delay to allow re-announcement
        setTimeout(() => {
          target.textContent = '';
        }, 1000);
      }
    }

    function updateSceneStatus(sceneText, choiceCount) {
      if (sceneStatus) {
        const statusText = `シーン: ${sceneText.substring(0, 100)}${sceneText.length > 100 ? '...' : ''}. ${choiceCount}個の選択肢があります。`;
        sceneStatus.textContent = statusText;
      }
    }

    function announceGameAction(action) {
      const messages = {
        saved: 'ゲームデータを保存しました',
        loaded: 'ゲームデータを読み込みました',
        restarted: 'ゲームを最初から開始しました',
        back: '前の選択に戻りました',
        forward: '次の選択に進みました',
        themeChanged: 'テーマを変更しました',
        inventoryOpened: 'インベントリを開きました',
        inventoryClosed: 'インベントリを閉じました'
      };
      announceToScreenReader(messages[action] || action, 'assertive');
    }

    let autoSaveIntervalId = null;
    let lastAutoSaveTime = 0;

    function enableAutoSave(intervalMinutes) {
      if (!intervalMinutes || intervalMinutes <= 0) return;

      const intervalMs = intervalMinutes * 60 * 1000;

      if (autoSaveIntervalId) {
        clearInterval(autoSaveIntervalId);
      }

      autoSaveIntervalId = setInterval(() => {
        performAutoSave();
      }, intervalMs);

      console.log(`Auto-save enabled: every ${intervalMinutes} minutes`);
    }

    function stopAutoSave() {
      if (autoSaveIntervalId) {
        clearInterval(autoSaveIntervalId);
        autoSaveIntervalId = null;
        console.log('Auto-save disabled');
      }
    }

    function performAutoSave() {
      const now = Date.now();
      const timeSinceLastSave = now - lastAutoSaveTime;
      const minIntervalMs = 60 * 1000; // 最低1分の間隔

      if (timeSinceLastSave < minIntervalMs) return;

      const slotName = `Auto-save ${new Date().toLocaleTimeString()}`;
      const saveData = engine.saveGame(slotName);
      saveGameToStorage(saveData);

      lastAutoSaveTime = now;

      // Dispatch auto-save event (for future GIF animation)
      document.dispatchEvent(new CustomEvent('agp-auto-save', {
        detail: {
          slotName,
          timestamp: saveData.timestamp,
          saveData
        }
      }));

      console.log(`Auto-saved: ${slotName}`);
    }

    const autoSaveToggle = document.getElementById('auto-save-toggle');
    const autoSaveIntervalInput = document.getElementById('auto-save-interval');

    if (autoSaveToggle && autoSaveIntervalInput) {
      autoSaveToggle.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        const interval = parseFloat(autoSaveIntervalInput.value) || 5;
        if (enabled) {
          enableAutoSave(interval);
        } else {
          stopAutoSave();
        }
      });

      autoSaveIntervalInput.addEventListener('change', () => {
        if (!autoSaveToggle.checked) return;
        const interval = parseFloat(autoSaveIntervalInput.value);
        if (!interval || interval <= 0) {
          stopAutoSave();
          autoSaveToggle.checked = false;
          return;
        }
        enableAutoSave(interval);
      });
    }

    // Mobile swipe gesture support
    function addSwipeGestures() {
      let touchStartX = 0;
      let touchStartY = 0;
      let touchEndX = 0;
      let touchEndY = 0;

      const minSwipeDistance = 50;
      const maxVerticalDistance = 100;

      function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Check if swipe is more horizontal than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < maxVerticalDistance) {
          if (deltaX > 0) {
            // Swipe right - go back
            const ok = typeof engine.goBack === "function" && engine.goBack();
            if (ok) {
              // Visual feedback
              const feedback = document.createElement('div');
              feedback.textContent = '← 戻る';
              feedback.style.cssText = `
                position: fixed;
                top: 50%;
                left: 20px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                z-index: 1000;
                pointer-events: none;
                animation: fadeOut 1s forwards;
              `;
              document.body.appendChild(feedback);
              setTimeout(() => feedback.remove(), 1000);
            }
          } else {
            // Swipe left - go forward
            const ok = typeof engine.goForward === "function" && engine.goForward();
            if (ok) {
              // Visual feedback
              const feedback = document.createElement('div');
              feedback.textContent = '進む →';
              feedback.style.cssText = `
                position: fixed;
                top: 50%;
                right: 20px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                z-index: 1000;
                pointer-events: none;
                animation: fadeOut 1s forwards;
              `;
              document.body.appendChild(feedback);
              setTimeout(() => feedback.remove(), 1000);
            }
          }
        }
      }

      document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
      }, { passive: true });
    }

    // Add swipe gestures for mobile
    if ('ontouchstart' in window) {
      addSwipeGestures();
    }

    // Advanced keyboard navigation and accessibility
    let currentFocusIndex = -1;
    let focusableElements = [];

    function updateFocusableElements() {
      focusableElements = Array.from(document.querySelectorAll(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      )).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && el.offsetParent !== null;
      });
    }

    function navigateChoices(direction) {
      const choiceButtons = document.querySelectorAll('.choices .btn');
      if (choiceButtons.length === 0) return;

      const currentChoiceIndex = Array.from(choiceButtons).indexOf(document.activeElement);
      let nextChoiceIndex;

      if (direction === 'next') {
        nextChoiceIndex = (currentChoiceIndex + 1) % choiceButtons.length;
      } else {
        nextChoiceIndex = currentChoiceIndex <= 0 ? choiceButtons.length - 1 : currentChoiceIndex - 1;
      }

      choiceButtons[nextChoiceIndex].focus();
      announceToScreenReader(`選択肢 ${nextChoiceIndex + 1}: ${choiceButtons[nextChoiceIndex].textContent}`, 'polite');
    }

    // Enhanced keyboard event handling
    document.addEventListener('keydown', (e) => {
      const activeElement = document.activeElement;

      // ESC key handling for all overlays
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal:not([hidden]), .inventory-panel:not([hidden]), .mobile-menu-overlay:not([hidden])');
        if (openModal) {
          if (openModal.classList.contains('modal')) {
            hideModal();
            announceToScreenReader('モーダルを閉じました', 'assertive');
          } else if (openModal.classList.contains('inventory-panel')) {
            hideInventoryPanel();
            announceGameAction('inventoryClosed');
          } else if (openModal.classList.contains('mobile-menu-overlay')) {
            closeMobileMenu();
          }
          e.preventDefault();
          return;
        }
      }

      // Choice navigation with arrow keys
      if (activeElement && activeElement.closest('.choices')) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          navigateChoices('next');
          e.preventDefault();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          navigateChoices('prev');
          e.preventDefault();
        }
      }

      // Number keys for choice selection (1-9)
      if (/^[1-9]$/.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const choiceIndex = parseInt(e.key) - 1;
        const choiceButtons = document.querySelectorAll('.choices .btn');
        if (choiceButtons[choiceIndex]) {
          choiceButtons[choiceIndex].click();
          announceToScreenReader(`選択肢 ${e.key} を選択しました`, 'assertive');
          e.preventDefault();
        }
      }
    });

    // Initialize focus management
    updateFocusableElements();
    document.addEventListener('focusin', () => {
      setTimeout(updateFocusableElements, 0);
    });

    // Listen for scene render events to update live regions
    document.addEventListener('agp-scene-rendered', (e) => {
      const { nodeText, choiceCount, nodeId } = e.detail;

      // Update scene status for screen readers
      updateSceneStatus(nodeText, choiceCount);

      // Announce scene change to screen readers
      announceToScreenReader(`シーンが変更されました。${nodeText.substring(0, 100)}${nodeText.length > 100 ? '...' : ''}`, 'assertive');

      // Update page title for better navigation context
      if (game && game.title) {
        document.title = `${game.title} - ${nodeId}`;
      }
    });

    // Listen for auto-save events to announce to screen readers
    document.addEventListener('agp-auto-save', (e) => {
      announceToScreenReader('ゲームが自動保存されました', 'polite');
    });

    // Modal focus management
    let previousActiveElement = null;

    function trapFocusInModal(modal) {
      if (!modal) return () => {};

      const focusableElements = modal.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return () => {};

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Store the currently focused element before opening modal
      previousActiveElement = document.activeElement;

      function handleTabKey(e) {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          // Shift + Tab: move to previous element
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: move to next element
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }

      function handleEscapeKey(e) {
        if (e.key === 'Escape') {
          closeModal(modal);
        }
      }

      // Focus first element when modal opens
      setTimeout(() => {
        if (firstElement && typeof firstElement.focus === 'function') {
          firstElement.focus();
        }
      }, 100);

      // Add event listeners
      modal.addEventListener('keydown', handleTabKey);
      modal.addEventListener('keydown', handleEscapeKey);

      // Return cleanup function
      return () => {
        modal.removeEventListener('keydown', handleTabKey);
        modal.removeEventListener('keydown', handleEscapeKey);

        // Restore focus to previously active element
        if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
          previousActiveElement.focus();
        }
      };
    }

    function closeModal(modal) {
      if (!modal) return;

      // Find the close button or method
      const closeBtn = modal.querySelector('.modal-close, .modal-close-btn');
      if (closeBtn) {
        closeBtn.click();
      } else {
        // Fallback: hide the modal
        modal.hidden = true;
        modal.style.display = 'none';
        announceToScreenReader('モーダルを閉じました', 'assertive');
      }
    }

    // Enhanced modal opening functions with focus management
    function openModalWithFocus(modal) {
      if (!modal) return;

      modal.hidden = false;
      modal.style.display = 'flex';

      // Prevent background scrolling
      document.body.style.overflow = 'hidden';

      // Set up focus trap
      const cleanup = trapFocusInModal(modal);

      // Store cleanup function for later use
      modal._focusCleanup = cleanup;

      // Announce modal opening
      const title = modal.querySelector('h2, h3');
      if (title) {
        announceToScreenReader(`${title.textContent}を開きました`, 'assertive');
      }
    }

    function closeModalWithFocus(modal) {
      if (!modal) return;

      modal.hidden = true;
      modal.style.display = 'none';

      // Restore scrolling
      document.body.style.overflow = '';

      // Clean up focus trap
      if (modal._focusCleanup) {
        modal._focusCleanup();
        modal._focusCleanup = null;
      }

      // Announce modal closing
      announceToScreenReader('モーダルを閉じました', 'assertive');
    }

    // Override existing modal functions to include focus management
    const originalShowModal = window.showModal || (() => {});
    window.showModal = function(type) {
      showSaveLoadModal(type);
      const modal = document.getElementById('save-load-modal');
      if (modal) {
        openModalWithFocus(modal);
      }
    };

    // Update existing modal close handlers to use focus management
    const modalCloseBtn = document.getElementById('modal-close');
    if (modalCloseBtn) {
      const originalClick = modalCloseBtn.onclick || (() => {});
      modalCloseBtn.addEventListener('click', () => {
        originalClick();
        const modal = document.getElementById('save-load-modal');
        closeModalWithFocus(modal);
      });
    }

    // Theme panel focus management
    const themeCloseBtn = document.querySelector('#theme-panel .modal-close-btn');
    if (themeCloseBtn) {
      themeCloseBtn.addEventListener('click', () => {
        const themePanel = document.getElementById('theme-panel');
        closeModalWithFocus(themePanel);
      });
    }

    // Save Slots Panel Management
    const saveSlotsPanel = document.getElementById('save-slots-panel');
    const saveSlotsCloseBtn = document.getElementById('save-slots-close');
    const saveSlotsList = document.getElementById('save-slots-list');
    const createNewSlotBtn = document.getElementById('create-new-slot');
    const btnSaveSlots = document.getElementById('btn-save-slots');

    function showSaveSlotsPanel() {
      updateSaveSlotsList();
      if (saveSlotsPanel) {
        saveSlotsPanel.hidden = false;
        saveSlotsPanel.style.display = 'block';
        // Prevent background scrolling on mobile
        if (window.innerWidth <= 768) {
          document.body.style.overflow = 'hidden';
        }
      }
    }

    function hideSaveSlotsPanel() {
      if (saveSlotsPanel) {
        saveSlotsPanel.hidden = true;
        saveSlotsPanel.style.display = 'none';
        // Restore scrolling
        document.body.style.overflow = '';
      }
    }

    function updateSaveSlotsList() {
      if (!saveSlotsList) return;

      const slots = engine.listSlots();
      saveSlotsList.innerHTML = '';

      if (slots.length === 0) {
        saveSlotsList.innerHTML = '<p class="no-data">セーブスロットがありません</p>';
        return;
      }

      slots.forEach(slot => {
        const slotEl = document.createElement('div');
        slotEl.className = 'save-slot-item';

        const infoEl = document.createElement('div');
        infoEl.className = 'save-slot-info';

        const nameEl = document.createElement('div');
        nameEl.className = 'save-slot-name';
        nameEl.textContent = slot.name;

        const metaEl = document.createElement('div');
        metaEl.className = 'save-slot-meta';
        const lastModified = new Date(slot.meta.modified).toLocaleString();
        const progress = slot.meta.progress || 0;
        const location = slot.meta.currentLocation || 'Unknown';
        metaEl.textContent = `${lastModified} • ${location} (${progress}%)`;

        infoEl.appendChild(nameEl);
        infoEl.appendChild(metaEl);

        const actionsEl = document.createElement('div');
        actionsEl.className = 'save-slot-actions';

        const loadBtn = document.createElement('button');
        loadBtn.className = 'btn btn-accent';
        loadBtn.textContent = '読み込み';
        loadBtn.addEventListener('click', () => {
          if (confirm(`"${slot.name}" を読み込みますか？現在の進行状況は失われます。`)) {
            if (engine.loadFromSlot(slot.id)) {
              hideSaveSlotsPanel();
              alert('セーブデータを読み込みました');
            } else {
              alert('読み込みに失敗しました');
            }
          }
        });

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn';
        saveBtn.textContent = '上書き保存';
        saveBtn.addEventListener('click', () => {
          if (engine.saveToSlot(slot.id)) {
            updateSaveSlotsList();
            alert('上書き保存しました');
          } else {
            alert('保存に失敗しました');
          }
        });

        const renameBtn = document.createElement('button');
        renameBtn.className = 'btn';
        renameBtn.textContent = '名前変更';
        renameBtn.addEventListener('click', () => {
          const newName = prompt('新しい名前を入力してください:', slot.name);
          if (newName && newName.trim() && newName !== slot.name) {
            if (engine.renameSlot(slot.id, newName.trim())) {
              updateSaveSlotsList();
            } else {
              alert('名前変更に失敗しました');
            }
          }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.textContent = '削除';
        deleteBtn.addEventListener('click', () => {
          if (confirm(`"${slot.name}" を削除しますか？この操作は取り消せません。`)) {
            if (engine.deleteSlot(slot.id)) {
              updateSaveSlotsList();
            } else {
              alert('削除に失敗しました');
            }
          }
        });

        actionsEl.appendChild(loadBtn);
        actionsEl.appendChild(saveBtn);
        actionsEl.appendChild(renameBtn);
        actionsEl.appendChild(deleteBtn);

        slotEl.appendChild(infoEl);
        slotEl.appendChild(actionsEl);
        saveSlotsList.appendChild(slotEl);
      });
    }

    // Event listeners for save slots
    if (btnSaveSlots) {
      btnSaveSlots.addEventListener('click', showSaveSlotsPanel);
    }

    if (saveSlotsCloseBtn) {
      saveSlotsCloseBtn.addEventListener('click', hideSaveSlotsPanel);
    }

    if (saveSlotsPanel) {
      saveSlotsPanel.addEventListener('click', (e) => {
        if (e.target === saveSlotsPanel) hideSaveSlotsPanel();
      });
    }

    if (createNewSlotBtn) {
      createNewSlotBtn.addEventListener('click', () => {
        const slotName = prompt('新しいスロットの名前を入力してください:');
        if (slotName && slotName.trim()) {
          const slotId = `slot_${Date.now()}`;
          if (engine.createSlot(slotId, slotName.trim())) {
            updateSaveSlotsList();
            alert(`スロット "${slotName.trim()}" を作成しました`);
          } else {
            alert('スロット作成に失敗しました');
          }
        }
      });
    }
