(function(){
  // Bridge that maps Admin UI calls to active StorageProvider
  const PTR_SIMPLE = 'agp_bridge_last_simple_id';
  const PTR_FULL = 'agp_bridge_last_full_id';

  function getProvider(){ return window.StorageProviders?.Registry?.getActive?.(); }

  async function saveSimple(text){
    const p = getProvider(); if(!p || !p.isAvailable()) throw new Error('No provider');
    const rec = { id: undefined, type: 'manuscript', kind: 'simple', title: (window.APP_CONFIG?.strings?.defaultTitle||''), text: text||'', html: undefined, meta: { theme: window.Theme?.loadTheme?.() } };
    const id = await p.save(rec);
    try { localStorage.setItem(PTR_SIMPLE, id); } catch{}
    return id;
  }
  async function loadSimple(){
    const p = getProvider(); if(!p || !p.isAvailable()) return '';
    let id = null; try { id = localStorage.getItem(PTR_SIMPLE); } catch{}
    if(!id){
      // fallback to latest simple
      const list = await p.list();
      const item = (list||[]).find(x=>x.kind==='simple') || (list||[]).find(x=>x.textPreview!=null);
      if(!item) return '';
      id = item.id;
    }
    const rec = await p.load(id); return (rec && rec.text) || '';
  }

  async function saveFull(obj){
    const p = getProvider(); if(!p || !p.isAvailable()) throw new Error('No provider');
    const rec = { ...obj, type: 'manuscript', kind: 'full' };
    const id = await p.save(rec);
    try { localStorage.setItem(PTR_FULL, id); } catch{}
    return id;
  }
  async function loadFull(){
    const p = getProvider(); if(!p || !p.isAvailable()) return null;
    let id = null; try { id = localStorage.getItem(PTR_FULL); } catch{}
    if(!id){
      const list = await p.list();
      const item = (list||[]).find(x=>x.kind==='full');
      if(!item) return null; id = item.id;
    }
    return await p.load(id);
  }
  async function get(id){ const p=getProvider(); if(!p||!p.isAvailable()) return null; return await p.load(id); }
  async function remove(id){ const p=getProvider(); if(!p||!p.isAvailable()) return; return await p.remove(id); }

  window.StorageBridge = { saveSimple, loadSimple, saveFull, loadFull, get, remove };
})();
