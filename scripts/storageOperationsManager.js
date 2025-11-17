(function () {
  // Storage Operations Manager - Handles storage bridge, shortcuts, and operations
  const KEY_SIMPLE = 'agp_manuscript_simple';
  const KEY_FULL = 'agp_manuscript_full';

  function exec(cmd) { document.execCommand(cmd, false, undefined); }

  function bridgeEnabled(){
    const be = window.APP_CONFIG?.storage?.backend;
    return (be && be !== 'localStorage') || !!window.APP_CONFIG?.storage?.useBridge;
  }

  window.StorageOperationsManager = {
    init: function() {
      this.initStorageOperations();
      console.log('StorageOperationsManager initialized');
    },

    // Storage operations
    initStorageOperations: function() {
      // Keyboard shortcuts
      if (window.APP_CONFIG?.ui?.shortcutsEnabled) {
        document.addEventListener('keydown', (e) => {
          if (!e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
          const k = e.key?.toLowerCase();
          if (k === 'b') { e.preventDefault(); exec('bold'); }
          else if (k === 'i') { e.preventDefault(); exec('italic'); }
          else if (k === 'u') { e.preventDefault(); exec('underline'); }
        });
      }

      // Simple save/load (plain text)
      const editorEl = document.getElementById('editor');
      const titleInputEl = document.getElementById('title-input');
      const charCountEl = document.getElementById('char-count');

      const btnSaveSimple = document.getElementById('btn-save-simple');
      if (btnSaveSimple && editorEl) {
        btnSaveSimple.addEventListener('click', async () => {
          const text = editorEl.innerText || '';
          if (bridgeEnabled() && window.StorageBridge) {
            await window.StorageBridge.saveSimple(text);
          } else {
            StorageUtil.saveText(KEY_SIMPLE, text);
          }
          alert('シンプル保存しました');
        });
      } else if (window.APP_CONFIG?.debug?.showConsoleLogs) {
        console.warn('StorageOperationsManager: btn-save-simple or editor not found');
      }

      const btnLoadSimple = document.getElementById('btn-load-simple');
      if (btnLoadSimple && editorEl) {
        btnLoadSimple.addEventListener('click', async () => {
          if (bridgeEnabled() && window.StorageBridge) {
            const t = await window.StorageBridge.loadSimple();
            editorEl.innerText = t || '';
          } else {
            editorEl.innerText = StorageUtil.loadText(KEY_SIMPLE, '');
          }
          if (window.AdminEditor && window.AdminEditor.updateCharCount && charCountEl) {
            window.AdminEditor.updateCharCount(editorEl, charCountEl);
          }
        });
      } else if (window.APP_CONFIG?.debug?.showConsoleLogs) {
        console.warn('StorageOperationsManager: btn-load-simple or editor not found');
      }

      // Full save/load (HTML + meta)
      const btnSaveFull = document.getElementById('btn-save-full');
      if (btnSaveFull && editorEl && titleInputEl) {
        btnSaveFull.addEventListener('click', async () => {
          const now = new Date().toISOString();
          const obj = {
            title: titleInputEl.value || (window.APP_CONFIG?.strings?.defaultTitle ?? ''),
            html: editorEl.innerHTML,
            text: editorEl.innerText || '',
            meta: { savedAt: now, theme: window.Theme?.loadTheme?.() }
          };
          if (bridgeEnabled() && window.StorageBridge) { await window.StorageBridge.saveFull(obj); }
          else { StorageUtil.saveJSON(KEY_FULL, obj); }
          alert('完全保存しました');
        });
      } else if (window.APP_CONFIG?.debug?.showConsoleLogs) {
        console.warn('StorageOperationsManager: btn-save-full, editor, or title-input not found');
      }

      const btnLoadFull = document.getElementById('btn-load-full');
      if (btnLoadFull && editorEl && titleInputEl) {
        btnLoadFull.addEventListener('click', async () => {
          const obj = (bridgeEnabled() && window.StorageBridge)
            ? await window.StorageBridge.loadFull()
            : StorageUtil.loadJSON(KEY_FULL);
          if (!obj) { alert('完全保存データがありません'); return; }
          titleInputEl.value = obj.title || (window.APP_CONFIG?.strings?.defaultTitle ?? '');
          editorEl.innerHTML = obj.html || '';
          if (window.AdminEditor && window.AdminEditor.updateCharCount && charCountEl) {
            window.AdminEditor.updateCharCount(editorEl, charCountEl);
          }
        });
      } else if (window.APP_CONFIG?.debug?.showConsoleLogs) {
        console.warn('StorageOperationsManager: btn-load-full, editor, or title-input not found');
      }

      // Export / Import
      const btnExport = document.getElementById('btn-export');
      if (btnExport && editorEl && titleInputEl) {
        btnExport.addEventListener('click', async () => {
          const fallback = { title: titleInputEl.value || (window.APP_CONFIG?.strings?.defaultTitle ?? ''), html: editorEl.innerHTML, text: editorEl.innerText || '' };
          const obj = (bridgeEnabled() && window.StorageBridge)
            ? (await window.StorageBridge.loadFull()) || fallback
            : (StorageUtil.loadJSON(KEY_FULL) || fallback);
          const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(obj.title || 'manuscript').replace(/[^\w\-一-龯ぁ-ゔァ-ヴー]/g, '_')}.json`; a.click();
          URL.revokeObjectURL(a.href);
        });
      } else if (window.APP_CONFIG?.debug?.showConsoleLogs) {
        console.warn('StorageOperationsManager: btn-export, editor, or title-input not found');
      }
    }
  };
})();
