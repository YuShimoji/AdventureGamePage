(function () {
  // Play Save/Load Module - Save slot management and auto-save
  const SAVE_SLOTS_KEY_PREFIX = window.APP_CONFIG?.storage?.keys?.saveSlots || "agp_save_slots";
  window.PlaySave = {
    init: function(engine, gameTitle) {
      this.engine = engine;
      this.currentGameTitle = gameTitle;
      this.setupModal();
      this.setupAutoSave();
    },

    setupModal: function() {
      const playSave = this;
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
      const btnImportSave = document.getElementById('btn-import-save');

      // Ensure modal is hidden on initialization
      if (modal) {
        modal.hidden = true;
        modal.style.display = 'none';
      }

      const applyMode = (mode) => {
        if (!modal) return;
        const normalizedMode = mode === 'load' ? 'load' : 'save';
        playSave.currentMode = normalizedMode;
        const isSaveMode = normalizedMode !== 'load';
        if (modalTitle) {
          modalTitle.textContent = isSaveMode ? 'ゲームデータを保存' : 'ゲームデータを読み込み';
        }
        if (savePanel) {
          savePanel.hidden = !isSaveMode;
        }
        if (loadPanel) {
          loadPanel.hidden = isSaveMode;
        }
        if (isSaveMode) {
          if (saveNameInput) {
            saveNameInput.value = '';
            setTimeout(() => {
              if (document.activeElement && document.activeElement.closest('#save-load-modal') === modal) {
                return;
              }
              saveNameInput.focus();
            }, 150);
          }
        } else if (savedGamesList) {
          playSave.loadSavedGames(savedGamesList);
        }
      };

      const showModal = (mode = 'save') => {
        if (!modal) return;
        applyMode(mode);
        modal.hidden = false;
        modal.style.display = 'flex';
        modal.dispatchEvent(new CustomEvent('agp-play-save-shown', {
          bubbles: true,
          detail: { mode: playSave.currentMode }
        }));
      };

      const hideModal = () => {
        if (!modal) return;
        modal.hidden = true;
        modal.style.display = 'none';
        modal.dispatchEvent(new CustomEvent('agp-play-save-hidden', { bubbles: true }));
      };

      playSave.getModalElement = () => modal;
      playSave.showModal = (mode = 'save') => {
        showModal(mode);
      };
      playSave.hideModal = () => {
        hideModal();
      };

      // Legacy compatibility for existing callers
      window.showSaveLoadModal = (type) => {
        playSave.showModal(type);
      };
      window.hideSaveLoadModal = () => {
        playSave.hideModal();
      };

      // Event listeners
      if (btnSave) {
        btnSave.addEventListener('click', () => {
          if (typeof window.showModal === 'function') {
            window.showModal('save');
          } else {
            playSave.showModal('save');
          }
        });
      }
      if (btnLoad) {
        btnLoad.addEventListener('click', () => {
          if (typeof window.showModal === 'function') {
            window.showModal('load');
          } else {
            playSave.showModal('load');
          }
        });
      }
      if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', playSave.hideModal);
      }
      if (saveConfirmBtn) {
        saveConfirmBtn.addEventListener('click', () => {
          const slotName = saveNameInput.value.trim();
          if (slotName) {
            this.saveGameToStorage(this.engine.saveGame(slotName));
            playSave.hideModal();
            alert('ゲームデータを保存しました');
          }
        });
      }
      if (btnImportSave) {
        btnImportSave.addEventListener('click', () => this.importSaveData());
      }

      // Close on backdrop click
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) playSave.hideModal();
        });
      }
    },

    saveGameToStorage: function(saveData) {
      const key = `${SAVE_SLOTS_KEY_PREFIX}_${this.currentGameTitle}`;
      const existing = StorageUtil.loadJSON(key) || [];
      // Remove existing save with same name if exists
      const filtered = existing.filter(s => s.slotName !== saveData.slotName);
      filtered.push(saveData);
      // Keep only last 10 saves
      const recent = filtered.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
      StorageUtil.saveJSON(key, recent);
    },

    loadSavedGames: function(container) {
      const key = `${SAVE_SLOTS_KEY_PREFIX}_${this.currentGameTitle}`;
      const saves = StorageUtil.loadJSON(key) || [];
      container.innerHTML = '';

      if (saves.length === 0) {
        container.innerHTML = '<p class="no-data">保存されたゲームデータがありません</p>';
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
        const duration = metadata.gameDuration ? this.formatDuration(metadata.gameDuration) : '';
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
          if (this.engine.loadGame(save)) {
            playSave.hideModal();
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
            this.loadSavedGames(container);
          }
        });

        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn';
        exportBtn.textContent = 'エクスポート';
        exportBtn.addEventListener('click', () => {
          this.exportSaveData(save);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn';
        deleteBtn.textContent = '削除';
        deleteBtn.addEventListener('click', () => {
          if (confirm(`"${save.slotName}" を削除しますか？`)) {
            const updated = saves.filter(s => s !== save);
            StorageUtil.saveJSON(key, updated);
            this.loadSavedGames(container);
          }
        });

        actions.appendChild(loadBtn);
        actions.appendChild(renameBtn);
        actions.appendChild(exportBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(info);
        item.appendChild(actions);
        container.appendChild(item);
      });
    },

    formatDuration: function(ms) {
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
    },

    exportSaveData: function(saveData) {
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
    },

    importSaveData: function() {
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
            const key = `${SAVE_SLOTS_KEY_PREFIX}_${this.currentGameTitle}`;
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
            alert(`セーブデータをインポートしました: ${finalSlotName}`);
          } catch (error) {
            console.error('Import failed:', error);
            alert('インポートに失敗しました。ファイル形式が正しいか確認してください。');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    },

    setupAutoSave: function() {
      let autoSaveIntervalId = null;
      let lastAutoSaveTime = 0;

      const enableAutoSave = (intervalMinutes) => {
        if (!intervalMinutes || intervalMinutes <= 0) return;

        const intervalMs = intervalMinutes * 60 * 1000;

        if (autoSaveIntervalId) {
          clearInterval(autoSaveIntervalId);
        }

        autoSaveIntervalId = setInterval(() => {
          performAutoSave();
        }, intervalMs);

        console.log(`Auto-save enabled: every ${intervalMinutes} minutes`);
      };

      const stopAutoSave = () => {
        if (autoSaveIntervalId) {
          clearInterval(autoSaveIntervalId);
          autoSaveIntervalId = null;
          console.log('Auto-save disabled');
        }
      };

      const performAutoSave = () => {
        const now = Date.now();
        const timeSinceLastSave = now - lastAutoSaveTime;
        const minIntervalMs = 60 * 1000; // 最低1分の間隔

        if (timeSinceLastSave < minIntervalMs) return;

        const slotName = `Auto-save ${new Date().toLocaleTimeString()}`;
        const saveData = this.engine.saveGame(slotName);
        this.saveGameToStorage(saveData);

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
      };

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
    }
  };
})();
