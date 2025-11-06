(function () {
  // Admin API Manager - Provides API for loading and deleting saves by ID
  const KEY_SIMPLE = 'agp_manuscript_simple';
  const KEY_FULL = 'agp_manuscript_full';

  function bridgeEnabled(){
    const be = window.APP_CONFIG?.storage?.backend;
    return (be && be !== 'localStorage') || !!window.APP_CONFIG?.storage?.useBridge;
  }

  window.AdminAPIManager = {
    init: function() {
      this.initAdminAPI();
      console.log('AdminAPIManager initialized');
    },

    // Admin API
    initAdminAPI: function() {
      function applyFull(obj){
        document.getElementById('title-input').value = obj.title || (window.APP_CONFIG?.strings?.defaultTitle ?? '');
        document.getElementById('editor').innerHTML = obj.html || '';
        if (window.AdminEditor && window.AdminEditor.updateCharCount) {
          window.AdminEditor.updateCharCount(document.getElementById('editor'), document.getElementById('char-count'));
        }
      }
      function applySimple(text){
        document.getElementById('editor').innerText = text || '';
        if (window.AdminEditor && window.AdminEditor.updateCharCount) {
          window.AdminEditor.updateCharCount(document.getElementById('editor'), document.getElementById('char-count'));
        }
      }
      async function loadById(id){
        const { simple, full } = (window.APP_CONFIG?.storage?.keys) || { simple: KEY_SIMPLE, full: KEY_FULL };
        try {
          if (bridgeEnabled() && window.StorageBridge) {
            if (id === full){ const obj = await window.StorageBridge.loadFull(); if(!obj) return false; applyFull(obj); return true; }
            if (id === simple){ const t = await window.StorageBridge.loadSimple(); applySimple(t); return true; }
            const v = await window.StorageBridge.get(id);
            if(v && typeof v === 'object' && v.html){ applyFull(v); return true; }
            if(v && typeof v === 'object' && 'text' in v){ applySimple(v.text); return true; }
            if(typeof v === 'string'){ applySimple(v); return true; }
            return false;
          } else {
            if(id === full){ const obj = StorageUtil.loadJSON(KEY_FULL); if(!obj) return false; applyFull(obj); return true; }
            if(id === simple){ const text = StorageUtil.loadText(KEY_SIMPLE, ''); applySimple(text); return true; }
            const p = window.StorageHub?.getProvider?.();
            const v = p?.get?.(id);
            if(v && typeof v === 'object' && v.html){ applyFull(v); return true; }
            if(v && typeof v === 'object' && 'text' in v){ applySimple(v.text); return true; }
            if(typeof v === 'string'){ applySimple(v); return true; }
            return false;
          }
        } catch(e){ console.error('loadById', e); return false; }
      }
      async function deleteById(id){
        try {
          if (bridgeEnabled() && window.StorageBridge) { await window.StorageBridge.remove(id); return true; }
          if(window.StorageHub?.getProvider){ const r = window.StorageHub.getProvider().remove(id); if (r && typeof r.then === 'function') await r; return true; }
          localStorage.removeItem(id); return true;
        } catch(e){ console.error('deleteById', e); return false; }
      }
      window.AdminAPI = { loadById, deleteById };
    }
  };
})();
