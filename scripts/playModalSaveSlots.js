(function () {
  // Play Modal Save Slots - Save slots panel management

  let engineRef = null;

  const PlayModalSaveSlots = {
    init(engine) {
      engineRef = engine;
      this.setupSaveSlotsPanel();
    },

    setupSaveSlotsPanel() {
      const saveSlotsPanel = document.getElementById('save-slots-panel');
      const saveSlotsCloseBtn = document.getElementById('save-slots-close');
      const createNewSlotBtn = document.getElementById('create-new-slot');
      const btnSaveSlots = document.getElementById('btn-save-slots');

      if (!saveSlotsPanel || !engineRef) return;

      saveSlotsPanel.setAttribute('role', 'dialog');
      saveSlotsPanel.setAttribute('aria-modal', 'true');
      saveSlotsPanel.setAttribute('aria-labelledby', 'save-slots-header');

      const self = this;

      if (btnSaveSlots) {
        btnSaveSlots.setAttribute('aria-expanded', 'false');
        btnSaveSlots.addEventListener('click', () => self.showSaveSlotsPanel());
      }

      if (saveSlotsCloseBtn) {
        saveSlotsCloseBtn.addEventListener('click', () => self.hideSaveSlotsPanel());
      }

      saveSlotsPanel.addEventListener('click', function (e) {
        if (e.target === saveSlotsPanel) self.hideSaveSlotsPanel();
      });

      if (createNewSlotBtn) {
        createNewSlotBtn.addEventListener('click', () => self.createNewSlot());
      }
    },

    updateSaveSlotsList() {
      const saveSlotsList = document.getElementById('save-slots-list');
      if (!saveSlotsList || !engineRef) return;

      const slots = engineRef.listSlots();
      saveSlotsList.innerHTML = '';

      if (slots.length === 0) {
        saveSlotsList.innerHTML = '<p class="no-data">セーブスロットがありません</p>';
        return;
      }

      const self = this;
      slots.forEach(function (slot) {
        const slotEl = self.createSlotElement(slot);
        saveSlotsList.appendChild(slotEl);
      });
    },

    createSlotElement(slot) {
      const self = this;
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
      metaEl.textContent = lastModified + ' • ' + location + ' (' + progress + '%)';

      infoEl.appendChild(nameEl);
      infoEl.appendChild(metaEl);

      const actionsEl = document.createElement('div');
      actionsEl.className = 'save-slot-actions';

      // Load button
      const loadBtn = document.createElement('button');
      loadBtn.className = 'btn btn-accent';
      loadBtn.textContent = '読み込み';
      loadBtn.addEventListener('click', () => self.loadSlot(slot));

      // Save button
      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn';
      saveBtn.textContent = '上書き保存';
      saveBtn.addEventListener('click', () => self.saveToSlot(slot));

      // Rename button
      const renameBtn = document.createElement('button');
      renameBtn.className = 'btn';
      renameBtn.textContent = '名前変更';
      renameBtn.addEventListener('click', () => self.renameSlot(slot));

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger';
      deleteBtn.textContent = '削除';
      deleteBtn.addEventListener('click', () => self.deleteSlot(slot));

      actionsEl.appendChild(loadBtn);
      actionsEl.appendChild(saveBtn);
      actionsEl.appendChild(renameBtn);
      actionsEl.appendChild(deleteBtn);

      slotEl.appendChild(infoEl);
      slotEl.appendChild(actionsEl);

      return slotEl;
    },

    loadSlot(slot) {
      if (confirm('"' + slot.name + '" を読み込みますか？現在の進行状況は失われます。')) {
        if (engineRef.loadFromSlot(slot.id)) {
          this.hideSaveSlotsPanel();
          ToastManager.success('セーブデータを読み込みました');
        } else {
          this.showError('読み込みに失敗しました', 'セーブデータの読み込みに失敗しました');
        }
      }
    },

    saveToSlot(slot) {
      if (engineRef.saveToSlot(slot.id)) {
        this.updateSaveSlotsList();
        ToastManager.success('上書き保存しました');
      } else {
        this.showError('保存に失敗しました', 'セーブデータの保存に失敗しました');
      }
    },

    renameSlot(slot) {
      const newName = prompt('新しい名前を入力してください:', slot.name);
      if (newName && newName.trim() && newName !== slot.name) {
        if (engineRef.renameSlot(slot.id, newName.trim())) {
          this.updateSaveSlotsList();
        } else {
          this.showError('名前変更に失敗しました', 'セーブスロットの名前変更に失敗しました');
        }
      }
    },

    deleteSlot(slot) {
      if (confirm('"' + slot.name + '" を削除しますか？この操作は取り消せません。')) {
        if (engineRef.deleteSlot(slot.id)) {
          this.updateSaveSlotsList();
        } else {
          this.showError('削除に失敗しました', 'セーブスロットの削除に失敗しました');
        }
      }
    },

    createNewSlot() {
      const slotName = prompt('新しいスロットの名前を入力してください:');
      if (slotName && slotName.trim()) {
        const slotId = 'slot_' + Date.now();
        if (engineRef.createSlot(slotId, slotName.trim())) {
          this.updateSaveSlotsList();
          ToastManager.success('スロット "' + slotName.trim() + '" を作成しました');
        } else {
          this.showError('スロット作成に失敗しました', '新しいセーブスロットの作成に失敗しました');
        }
      }
    },

    showError(message, details) {
      if (window.ErrorHandler) {
        const error = new Error(message);
        window.ErrorHandler.showError(error, { details });
      } else {
        ToastManager.error(message);
      }
    },

    showSaveSlotsPanel() {
      const saveSlotsPanel = document.getElementById('save-slots-panel');
      const btnSaveSlots = document.getElementById('btn-save-slots');

      this.updateSaveSlotsList();
      window.PlayModalFocus.openModalWithFocus(saveSlotsPanel);
      if (btnSaveSlots) {
        btnSaveSlots.setAttribute('aria-expanded', 'true');
      }
    },

    hideSaveSlotsPanel() {
      const saveSlotsPanel = document.getElementById('save-slots-panel');
      const btnSaveSlots = document.getElementById('btn-save-slots');

      window.PlayModalFocus.closeModalWithFocus(saveSlotsPanel);
      if (btnSaveSlots) {
        btnSaveSlots.setAttribute('aria-expanded', 'false');
      }
    },
  };

  // Global exposure
  window.PlayModalSaveSlots = PlayModalSaveSlots;
})();
