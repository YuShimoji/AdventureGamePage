(function () {
  // Main play.js - UI rendering and coordination after modularization
  function renderEmptyStateForNoGameData(error) {
    const sceneEl = document.getElementById('scene');
    const choicesEl = document.getElementById('choices');

    if (choicesEl) {
      choicesEl.innerHTML = '';
      choicesEl.setAttribute('aria-hidden', 'true');
    }

    if (!sceneEl) {
      return;
    }

    sceneEl.innerHTML = `
      <div class="play-empty-state">
        <svg class="empty-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        </svg>
        <h2>ゲームデータがありません</h2>
        <p>
          管理画面でゲームを作成するか、<br>
          JSONファイルをインポートしてください。
        </p>
        <div class="actions">
          <a href="admin.html" class="btn btn-primary">管理画面を開く</a>
          <button id="empty-load-json" class="btn">JSONをインポート</button>
        </div>
      </div>
    `;

    const importBtn = document.getElementById('empty-load-json');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('play-file-import') || document.getElementById('mobile-play-file-import');
        if (fileInput && typeof fileInput.click === 'function') {
          fileInput.click();
        } else {
          ToastManager.error('ゲームJSON読込用の入力が見つかりませんでした。');
        }
      });
    }
  }

  function initPlayPage() {
    // Initialize core modules
    const { elements, engine, game } = window.PlayCore.init();
    console.log('PlayCore.init returned:', { elements, engine, game });

    // Initialize feature modules
    window.PlaySave.init(engine, game.title);
    window.PlayInventory.init(engine);
    window.PlayInput.init(engine);

    // Ensure modal is hidden on initialization
    const saveLoadModal =
      window.PlaySave.getModalElement?.() || document.getElementById('save-load-modal');

    // Setup basic UI interactions
    if (elements.btnRestart) {
      elements.btnRestart.addEventListener('click', () => engine.reset());
    }

    // Node transition event listener for item acquisition (sample)
    document.addEventListener('agp-node-selection-changed', e => {
      const nodeId = e.detail?.nodeId;
      if (nodeId === 'key' && !engine.hasItem('rusty_key')) {
        // Add rusty key when entering the key node
        engine.addItem('rusty_key');
        setTimeout(() => {
          ToastManager.success('錆びた鍵を手に入れた！');
        }, 500);
      }
    });

    // Setup theme button
    const btnTheme = document.getElementById('btn-theme');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
      });
    }

    // Additional UI/event hooks below require engine context
    document.addEventListener('agp-auto-save', () => {
      window.PlayInput.announceToScreenReader?.('ゲームが自動保存されました', 'polite');
    });

    // Modal management functions
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

    function initModalManagement(saveLoadModal) {
      // Override existing modal functions to include focus management
      const originalShowModal = window.showModal || (() => {});
      window.showModal = function (type = 'save') {
        window.PlaySave.showModal?.(type);
        originalShowModal(type);
      };

      if (saveLoadModal) {
        saveLoadModal.addEventListener('agp-play-save-shown', () =>
          openModalWithFocus(saveLoadModal)
        );
        saveLoadModal.addEventListener('agp-play-save-hidden', () =>
          closeModalWithFocus(saveLoadModal)
        );
      }

      // Theme panel focus management
      const themeCloseBtn = document.querySelector('#theme-panel .modal-close-btn');
      if (themeCloseBtn) {
        themeCloseBtn.addEventListener('click', () => {
          const themePanel = document.getElementById('theme-panel');
          closeModalWithFocus(themePanel);
        });
      }
    }

    // Inventory Panel Management
    const inventoryPanel = document.getElementById('inventory-panel');
    const inventoryCloseBtn = document.getElementById('inventory-close');
    const inventoryList = document.getElementById('inventory-list');
    const btnInventory = document.getElementById('btn-inventory');

    // Set ARIA attributes for inventory panel
    if (inventoryPanel) {
      inventoryPanel.setAttribute('role', 'dialog');
      inventoryPanel.setAttribute('aria-modal', 'true');
      inventoryPanel.setAttribute('aria-labelledby', 'inventory-title');
    }

    function showInventoryPanel() {
      window.PlayInventory.updateInventoryList(inventoryList);
      if (inventoryPanel) {
        openModalWithFocus(inventoryPanel);
        // Update aria-expanded
        if (btnInventory) {
          btnInventory.setAttribute('aria-expanded', 'true');
        }
      }
    }

    function hideInventoryPanel() {
      if (inventoryPanel) {
        closeModalWithFocus(inventoryPanel);
        // Update aria-expanded
        if (btnInventory) {
          btnInventory.setAttribute('aria-expanded', 'false');
        }
      }
    }

    // Save Slots Panel Management
    const saveSlotsPanel = document.getElementById('save-slots-panel');
    const saveSlotsCloseBtn = document.getElementById('save-slots-close');
    const saveSlotsList = document.getElementById('save-slots-list');
    const createNewSlotBtn = document.getElementById('create-new-slot');
    const btnSaveSlots = document.getElementById('btn-save-slots');

    // Set ARIA attributes for save slots panel
    if (saveSlotsPanel) {
      saveSlotsPanel.setAttribute('role', 'dialog');
      saveSlotsPanel.setAttribute('aria-modal', 'true');
      saveSlotsPanel.setAttribute('aria-labelledby', 'save-slots-title');
    }

    function showSaveSlotsPanel() {
      updateSaveSlotsList();
      if (saveSlotsPanel) {
        openModalWithFocus(saveSlotsPanel);
        // Update aria-expanded
        if (btnSaveSlots) {
          btnSaveSlots.setAttribute('aria-expanded', 'true');
        }
      }
    }

    function hideSaveSlotsPanel() {
      if (saveSlotsPanel) {
        closeModalWithFocus(saveSlotsPanel);
        // Update aria-expanded
        if (btnSaveSlots) {
          btnSaveSlots.setAttribute('aria-expanded', 'false');
        }
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
              ToastManager.success('セーブデータを読み込みました');
            } else {
              ToastManager.error('読み込みに失敗しました');
            }
          }
        });

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn';
        saveBtn.textContent = '上書き保存';
        saveBtn.addEventListener('click', () => {
          if (engine.saveToSlot(slot.id)) {
            updateSaveSlotsList();
            ToastManager.success('上書き保存しました');
          } else {
            ToastManager.error('保存に失敗しました');
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
              ToastManager.error('名前変更に失敗しました');
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
              ToastManager.error('削除に失敗しました');
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
      btnSaveSlots.setAttribute('aria-expanded', 'false');
      btnSaveSlots.addEventListener('click', showSaveSlotsPanel);
    }

    if (saveSlotsCloseBtn) {
      saveSlotsCloseBtn.addEventListener('click', hideSaveSlotsPanel);
    }

    if (saveSlotsPanel) {
      saveSlotsPanel.addEventListener('click', e => {
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
            ToastManager.success(`スロット "${slotName.trim()}" を作成しました`);
          } else {
            ToastManager.error('スロット作成に失敗しました');
          }
        }
      });
    }

    // Inventory event listeners
    if (btnInventory) {
      btnInventory.setAttribute('aria-expanded', 'false');
      btnInventory.addEventListener('click', showInventoryPanel);
    }

    if (inventoryCloseBtn) {
      inventoryCloseBtn.addEventListener('click', hideInventoryPanel);
    }

    if (inventoryPanel) {
      inventoryPanel.addEventListener('click', e => {
        if (e.target === inventoryPanel) hideInventoryPanel();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    try {
      initPlayPage();
    } catch (error) {
      if (error && error.code === 'NO_GAME_DATA') {
        if (window.APP_CONFIG?.debug?.showConsoleLogs) {
          console.info('[PLAY] No game data on play.html; rendering empty state UI.', error);
        }
        renderEmptyStateForNoGameData(error);
        return;
      }
      console.error('Play initialization failed:', error);
      ToastManager.error(`プレイヤー初期化に失敗しました: ${error.message}`);
    }
  });

  // ページ固有のクリーンアップ（どのページでも実行）
  document.addEventListener('DOMContentLoaded', function () {
    // play.html以外ではプレイ要素を強制的に非表示
    if (
      !(window.location.pathname.endsWith('play.html') || window.location.pathname === '/play.html')
    ) {
      const playElements = ['save-slots-panel', 'inventory-panel', 'save-load-modal'];

      playElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.display = 'none !important';
          el.hidden = true;
          el.setAttribute('aria-hidden', 'true');
          el.setAttribute('inert', '');
        }
      });

      console.log('[PLAY] Play elements hidden for non-play page');
    }
  });
})();
