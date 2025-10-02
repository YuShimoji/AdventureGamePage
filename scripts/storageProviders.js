(function(){
  // Storage Provider Architecture
  // Interface (informal): provider = {
  //   id: 'local'|'idb',
  //   isAvailable(): boolean,
  //   save(record): Promise<string>, // returns id
  //   load(id): Promise<object|null>,
  //   list(): Promise<Array<object>>, // [{id,title,savedAt,provider,size,textPreview}]
  //   remove(id): Promise<void>,
  //   clear(): Promise<void>
  // }

  const ACTIVE_KEY = 'agp_storage_provider_active';

  function uid(){ return 'ms_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8); }
  function estimateSizeBytes(obj){
    try { return new Blob([JSON.stringify(obj)]).size; } catch { return (JSON.stringify(obj)||'').length; }
  }
  function previewText(s, n=100){ if(!s) return ''; return s.slice(0, n); }

  // LocalStorage Provider
  const LS_INDEX_KEY = 'agp_ms_index';
  const LS_PREFIX = 'agp_ms_';

  function lsReadIndex(){ return StorageUtil.loadJSON(LS_INDEX_KEY, []); }
  function lsWriteIndex(arr){ StorageUtil.saveJSON(LS_INDEX_KEY, arr); }

  const LocalProvider = {
    id: 'local',
    isAvailable(){ try { localStorage.setItem('__agp_t', '1'); localStorage.removeItem('__agp_t'); return true; } catch { return false; } },
    async save(record){
      const rec = {...record};
      rec.id = rec.id || uid();
      rec.meta = {...(rec.meta||{}), provider: this.id, savedAt: new Date().toISOString() };
      const key = LS_PREFIX + rec.id;
      StorageUtil.saveJSON(key, rec);
      const idx = lsReadIndex();
      if(!idx.includes(rec.id)){ idx.push(rec.id); lsWriteIndex(idx); }
      return rec.id;
    },
    async load(id){ return StorageUtil.loadJSON(LS_PREFIX+id); },
    async list(){
      const idx = lsReadIndex();
      const list = [];
      for(const id of idx){
        const rec = StorageUtil.loadJSON(LS_PREFIX+id);
        if(rec){
          list.push({
            id,
            title: rec.title || (window.APP_CONFIG?.strings?.defaultTitle||'') ,
            savedAt: (rec.meta&&rec.meta.savedAt)||'',
            provider: this.id,
            kind: rec.kind || 'full',
            size: estimateSizeBytes(rec),
            textPreview: previewText(rec.text||rec.html?.replace(/<[^>]+>/g,'')||'')
          });
        }
      }
      return list.sort((a,b)=> new Date(b.savedAt)-new Date(a.savedAt));
    },
    async remove(id){
      const idx = lsReadIndex().filter(x=>x!==id); lsWriteIndex(idx);
      localStorage.removeItem(LS_PREFIX+id);
    },
    async clear(){
      const idx = lsReadIndex();
      idx.forEach(id=> localStorage.removeItem(LS_PREFIX+id));
      lsWriteIndex([]);
    }
  };

  // IndexedDB Provider (idb)
  const DB_NAME = 'agp_db';
  const DB_VERSION = 1;
  const STORE = 'manuscripts';

  function openDB(){
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (ev) => {
        const db = ev.target.result;
        if(!db.objectStoreNames.contains(STORE)){
          const os = db.createObjectStore(STORE, { keyPath: 'id' });
          os.createIndex('savedAt', 'meta.savedAt');
          os.createIndex('title', 'title');
        }
      };
      req.onsuccess = ()=> resolve(req.result);
      req.onerror = ()=> reject(req.error);
    });
  }
  function dbTx(db, mode){ return db.transaction(STORE, mode).objectStore(STORE); }

  const IDBProvider = {
    id: 'idb',
    isAvailable(){ return !!window.indexedDB; },
    async save(record){
      const rec = {...record}; rec.id = rec.id || uid();
      rec.meta = {...(rec.meta||{}), provider: this.id, savedAt: new Date().toISOString() };
      const db = await openDB();
      await new Promise((resolve, reject)=>{
        const req = dbTx(db,'readwrite').put(rec);
        req.onsuccess = ()=> resolve();
        req.onerror = ()=> reject(req.error);
      });
      db.close();
      return rec.id;
    },
    async load(id){
      const db = await openDB();
      const rec = await new Promise((resolve, reject)=>{
        const req = dbTx(db,'readonly').get(id);
        req.onsuccess = ()=> resolve(req.result||null);
        req.onerror = ()=> reject(req.error);
      });
      db.close();
      return rec;
    },
    async list(){
      const db = await openDB();
      const all = await new Promise((resolve, reject)=>{
        const req = dbTx(db,'readonly').getAll();
        req.onsuccess = ()=> resolve(req.result||[]);
        req.onerror = ()=> reject(req.error);
      });
      db.close();
      return all.map(rec => ({
        id: rec.id,
        title: rec.title || (window.APP_CONFIG?.strings?.defaultTitle||''),
        savedAt: (rec.meta&&rec.meta.savedAt)||'',
        provider: this.id,
        kind: rec.kind || 'full',
        size: estimateSizeBytes(rec),
        textPreview: previewText(rec.text||rec.html?.replace(/<[^>]+>/g,'')||'')
      })).sort((a,b)=> new Date(b.savedAt)-new Date(a.savedAt));
    },
    async remove(id){
      const db = await openDB();
      await new Promise((resolve, reject)=>{
        const req = dbTx(db,'readwrite').delete(id);
        req.onsuccess = ()=> resolve();
        req.onerror = ()=> reject(req.error);
      });
      db.close();
    },
    async clear(){
      const db = await openDB();
      await new Promise((resolve, reject)=>{
        const req = dbTx(db,'readwrite').clear();
        req.onsuccess = ()=> resolve();
        req.onerror = ()=> reject(req.error);
      });
      db.close();
    }
  };

  const Registry = {
    providers: {},
    register(p){ this.providers[p.id]=p; },
    get(id){ return this.providers[id]; },
    all(){ return Object.values(this.providers); },
    getActiveName(){ return localStorage.getItem(ACTIVE_KEY) || (IDBProvider.isAvailable()? 'idb':'local'); },
    setActiveName(name){ localStorage.setItem(ACTIVE_KEY, name); },
    getActive(){ return this.get(this.getActiveName()); }
  };

  Registry.register(LocalProvider);
  Registry.register(IDBProvider);

  window.StorageProviders = { Registry, LocalProvider, IDBProvider };
})();
