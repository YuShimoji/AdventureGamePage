(function () {
  // Main play.js - UI rendering and coordination after modularization
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      // Initialize core modules
      const { elements, engine, game } = await window.PlayCore.init();

      // Initialize feature modules
      window.PlaySave.init(engine, game.title);
      window.PlayInventory.init(engine);
      window.PlayInput.init(engine);

      // Setup basic UI interactions
      if (elements.btnRestart) {
        elements.btnRestart.addEventListener("click", () => engine.reset());
      }

      // Node transition event listener for item acquisition (sample)
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

      // Setup theme button
      const btnTheme = document.getElementById('btn-theme');
      if (btnTheme) {
        btnTheme.addEventListener('click', () => {
          // Theme panel toggle logic
          const panel = document.getElementById("theme-panel");
          if (panel) {
            if (panel.hidden) {
              panel.hidden = false;
              panel.style.display = 'flex';
              window.PlayInput.announceGameAction('themeChanged');
            } else {
              panel.hidden = true;
              panel.style.display = 'none';
            }
          }
        });
      }

      console.log('Play modules initialized successfully');

      // Additional UI/event hooks below require engine context
      document.addEventListener('agp-auto-save', () => {
        window.PlayInput.announceToScreenReader?.('ゲームが自動保存されました', 'polite');
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
      btnSaveSlots.setAttribute('aria-expanded', 'false');
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

    // Inventory event listeners
    if (btnInventory) {
      btnInventory.setAttribute('aria-expanded', 'false');
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
  } catch (error) {
    console.error('Play initialization failed:', error);
    alert(`プレイヤー初期化に失敗しました: ${error.message}`);
  }
  });
})();
