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
      document.getElementById('btn-save-simple').addEventListener('click', async () => {
        if (bridgeEnabled() && window.StorageBridge) {
          await window.StorageBridge.saveSimple(document.getElementById('editor').innerText || '');
        } else {
          StorageUtil.saveText(KEY_SIMPLE, document.getElementById('editor').innerText || '');
        }
        alert('シンプル保存しました');
      });
      document.getElementById('btn-load-simple').addEventListener('click', async () => {
        if (bridgeEnabled() && window.StorageBridge) {
          const t = await window.StorageBridge.loadSimple();
          document.getElementById('editor').innerText = t || '';
        } else {
          document.getElementById('editor').innerText = StorageUtil.loadText(KEY_SIMPLE, '');
        }
        if (window.AdminEditor && window.AdminEditor.updateCharCount) {
          window.AdminEditor.updateCharCount(document.getElementById('editor'), document.getElementById('char-count'));
        }
      });

      // Full save/load (HTML + meta)
      document.getElementById('btn-save-full').addEventListener('click', async () => {
        const now = new Date().toISOString();
        const obj = {
          title: document.getElementById('title-input').value || (window.APP_CONFIG?.strings?.defaultTitle ?? ''),
          html: document.getElementById('editor').innerHTML,
          text: document.getElementById('editor').innerText || '',
          meta: { savedAt: now, theme: window.Theme?.loadTheme?.() }
        };
        if (bridgeEnabled() && window.StorageBridge) { await window.StorageBridge.saveFull(obj); }
        else { StorageUtil.saveJSON(KEY_FULL, obj); }
        alert('完全保存しました');
      });
      document.getElementById('btn-load-full').addEventListener('click', async () => {
        const obj = (bridgeEnabled() && window.StorageBridge)
          ? await window.StorageBridge.loadFull()
          : StorageUtil.loadJSON(KEY_FULL);
        if (!obj) { alert('完全保存データがありません'); return; }
        document.getElementById('title-input').value = obj.title || (window.APP_CONFIG?.strings?.defaultTitle ?? '');
        document.getElementById('editor').innerHTML = obj.html || '';
        if (window.AdminEditor && window.AdminEditor.updateCharCount) {
          window.AdminEditor.updateCharCount(document.getElementById('editor'), document.getElementById('char-count'));
        }
      });

      // Export / Import
      document.getElementById('btn-export').addEventListener('click', async () => {
        const fallback = { title: document.getElementById('title-input').value || (window.APP_CONFIG?.strings?.defaultTitle ?? ''), html: document.getElementById('editor').innerHTML, text: document.getElementById('editor').innerText || '' };
        const obj = (bridgeEnabled() && window.StorageBridge)
          ? (await window.StorageBridge.loadFull()) || fallback
          : (StorageUtil.loadJSON(KEY_FULL) || fallback);
        const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(obj.title || 'manuscript').replace(/[^\w\-一-龯ぁ-ゔァ-ヴー]/g, '_')}.json`; a.click();
        URL.revokeObjectURL(a.href);
      });
    }
  };
})();
