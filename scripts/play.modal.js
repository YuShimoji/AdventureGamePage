(function () {
  let previousActiveElement = null;
  let engineRef = null;

  function announce(message, priority) {
    const fn = window.PlayInput && window.PlayInput.announceToScreenReader;
    if (typeof fn === 'function') {
      fn(message, priority);
    }
  }

  function trapFocusInModal(modal) {
    if (!modal) return function () {};

    const focusableElements = modal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return function () {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    previousActiveElement = document.activeElement;

    function handleTabKey(e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }

    function handleEscapeKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        window.PlayModal.closeModalWithFocus(modal);
      }
    }

    setTimeout(function () {
      if (firstElement && typeof firstElement.focus === 'function') {
        firstElement.focus();
      }
    }, 100);

    modal.addEventListener('keydown', handleTabKey);
    modal.addEventListener('keydown', handleEscapeKey);

    return function () {
      modal.removeEventListener('keydown', handleTabKey);
      modal.removeEventListener('keydown', handleEscapeKey);

      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    };
  }

  function openModalWithFocus(modal) {
    if (!modal) return;

    modal.hidden = false;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const cleanup = trapFocusInModal(modal);
    modal._focusCleanup = cleanup;

    const title = modal.querySelector('h2, h3');
    if (title) {
      announce(title.textContent + 'を開きました', 'assertive');
    }
  }

  function closeModalWithFocus(modal) {
    if (!modal) return;

    modal.hidden = true;
    modal.style.display = 'none';
    document.body.style.overflow = '';

    if (modal._focusCleanup) {
      modal._focusCleanup();
      modal._focusCleanup = null;
    }

    announce('モーダルを閉じました', 'assertive');
  }

  function setupSaveModal() {
    var saveLoadModal = window.PlaySave && typeof window.PlaySave.getModalElement === 'function'
      ? window.PlaySave.getModalElement()
      : document.getElementById('save-load-modal');

    var originalShowModal = window.showModal || function () {};
    window.showModal = function (type) {
      var mode = typeof type === 'string' ? type : 'save';
      if (window.PlaySave && typeof window.PlaySave.showModal === 'function') {
        window.PlaySave.showModal(mode);
      } else {
        originalShowModal(mode);
      }
    };

    if (saveLoadModal) {
      saveLoadModal.addEventListener('agp-play-save-shown', function () {
        openModalWithFocus(saveLoadModal);
      });
      saveLoadModal.addEventListener('agp-play-save-hidden', function () {
        closeModalWithFocus(saveLoadModal);
      });
    }
  }

  function setupThemePanel() {
    var themePanel = document.getElementById('theme-panel');
    var themeCloseBtn = document.querySelector('#theme-panel .modal-close-btn');
    var btnTheme = document.getElementById('btn-theme');

    if (themeCloseBtn && themePanel) {
      themeCloseBtn.addEventListener('click', function () {
        closeModalWithFocus(themePanel);
      });
    }

    if (btnTheme && themePanel) {
      btnTheme.addEventListener('click', function () {
        var willOpen = themePanel.hidden || themePanel.style.display === 'none';
        if (willOpen) {
          openModalWithFocus(themePanel);
          if (window.PlayInput && typeof window.PlayInput.announceGameAction === 'function') {
            window.PlayInput.announceGameAction('themeChanged');
          }
        } else {
          closeModalWithFocus(themePanel);
        }
      });
    }
  }

  function setupSaveSlotsPanel() {
    var saveSlotsPanel = document.getElementById('save-slots-panel');
    var saveSlotsCloseBtn = document.getElementById('save-slots-close');
    var saveSlotsList = document.getElementById('save-slots-list');
    var createNewSlotBtn = document.getElementById('create-new-slot');
    var btnSaveSlots = document.getElementById('btn-save-slots');

    if (!saveSlotsPanel || !engineRef) return;

    saveSlotsPanel.setAttribute('role', 'dialog');
    saveSlotsPanel.setAttribute('aria-modal', 'true');
    saveSlotsPanel.setAttribute('aria-labelledby', 'save-slots-title');

    function updateSaveSlotsList() {
      if (!saveSlotsList) return;

      var slots = engineRef.listSlots();
      saveSlotsList.innerHTML = '';

      if (slots.length === 0) {
        saveSlotsList.innerHTML = '<p class="no-data">セーブスロットがありません</p>';
        return;
      }

      slots.forEach(function (slot) {
        var slotEl = document.createElement('div');
        slotEl.className = 'save-slot-item';

        var infoEl = document.createElement('div');
        infoEl.className = 'save-slot-info';

        var nameEl = document.createElement('div');
        nameEl.className = 'save-slot-name';
        nameEl.textContent = slot.name;

        var metaEl = document.createElement('div');
        metaEl.className = 'save-slot-meta';
        var lastModified = new Date(slot.meta.modified).toLocaleString();
        var progress = slot.meta.progress || 0;
        var location = slot.meta.currentLocation || 'Unknown';
        metaEl.textContent = lastModified + ' • ' + location + ' (' + progress + '%)';

        infoEl.appendChild(nameEl);
        infoEl.appendChild(metaEl);

        var actionsEl = document.createElement('div');
        actionsEl.className = 'save-slot-actions';

        var loadBtn = document.createElement('button');
        loadBtn.className = 'btn btn-accent';
        loadBtn.textContent = '読み込み';
        loadBtn.addEventListener('click', function () {
          if (confirm('"' + slot.name + '" を読み込みますか？現在の進行状況は失われます。')) {
            if (engineRef.loadFromSlot(slot.id)) {
              hideSaveSlotsPanel();
              alert('セーブデータを読み込みました');
            } else {
              if(window.ErrorHandler){
                const error = new Error('読み込みに失敗しました');
                window.ErrorHandler.showError(error, { details: 'セーブデータの読み込みに失敗しました' });
              } else {
                alert('読み込みに失敗しました');
              }
            }
          }
        });

        var saveBtn = document.createElement('button');
        saveBtn.className = 'btn';
        saveBtn.textContent = '上書き保存';
        saveBtn.addEventListener('click', function () {
          if (engineRef.saveToSlot(slot.id)) {
            updateSaveSlotsList();
            alert('上書き保存しました');
          } else {
            if(window.ErrorHandler){
              const error = new Error('保存に失敗しました');
              window.ErrorHandler.showError(error, { details: 'セーブデータの保存に失敗しました' });
            } else {
              alert('保存に失敗しました');
            }
          }
        });

        var renameBtn = document.createElement('button');
        renameBtn.className = 'btn';
        renameBtn.textContent = '名前変更';
        renameBtn.addEventListener('click', function () {
          var newName = prompt('新しい名前を入力してください:', slot.name);
          if (newName && newName.trim() && newName !== slot.name) {
            if (engineRef.renameSlot(slot.id, newName.trim())) {
              updateSaveSlotsList();
            } else {
              if(window.ErrorHandler){
                const error = new Error('名前変更に失敗しました');
                window.ErrorHandler.showError(error, { details: 'セーブスロットの名前変更に失敗しました' });
              } else {
                alert('名前変更に失敗しました');
              }
            }
          }
        });

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.textContent = '削除';
        deleteBtn.addEventListener('click', function () {
          if (confirm('"' + slot.name + '" を削除しますか？この操作は取り消せません。')) {
            if (engineRef.deleteSlot(slot.id)) {
              updateSaveSlotsList();
            } else {
              if(window.ErrorHandler){
                const error = new Error('削除に失敗しました');
                window.ErrorHandler.showError(error, { details: 'セーブスロットの削除に失敗しました' });
              } else {
                alert('削除に失敗しました');
              }
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

    function showSaveSlotsPanel() {
      updateSaveSlotsList();
      openModalWithFocus(saveSlotsPanel);
      if (btnSaveSlots) {
        btnSaveSlots.setAttribute('aria-expanded', 'true');
      }
    }

    function hideSaveSlotsPanel() {
      closeModalWithFocus(saveSlotsPanel);
      if (btnSaveSlots) {
        btnSaveSlots.setAttribute('aria-expanded', 'false');
      }
    }

    if (btnSaveSlots) {
      btnSaveSlots.setAttribute('aria-expanded', 'false');
      btnSaveSlots.addEventListener('click', showSaveSlotsPanel);
    }

    if (saveSlotsCloseBtn) {
      saveSlotsCloseBtn.addEventListener('click', hideSaveSlotsPanel);
    }

    saveSlotsPanel.addEventListener('click', function (e) {
      if (e.target === saveSlotsPanel) hideSaveSlotsPanel();
    });

    if (createNewSlotBtn) {
      createNewSlotBtn.addEventListener('click', function () {
        var slotName = prompt('新しいスロットの名前を入力してください:');
        if (slotName && slotName.trim()) {
          var slotId = 'slot_' + Date.now();
          if (engineRef.createSlot(slotId, slotName.trim())) {
            updateSaveSlotsList();
            alert('スロット "' + slotName.trim() + '" を作成しました');
          } else {
            if(window.ErrorHandler){
              const error = new Error('スロット作成に失敗しました');
              window.ErrorHandler.showError(error, { details: '新しいセーブスロットの作成に失敗しました' });
            } else {
              alert('スロット作成に失敗しました');
            }
          }
        }
      });
    }
  }

  window.PlayModal = {
    init: function (options) {
      engineRef = options && options.engine ? options.engine : null;
      setupSaveModal();
      setupThemePanel();
      setupSaveSlotsPanel();
    },
    openModalWithFocus: openModalWithFocus,
    closeModalWithFocus: closeModalWithFocus
  };
})();
