(function () {
  // Storage abstraction skeleton
  // Interface-like base (documentation purpose)
  class StorageProvider {
    // Returns list of entries: [{ id, title, savedAt, size, excerpt, type }]
    list() {
      throw new Error("Not implemented");
    }
    // Gets raw data by id
    get() {
      throw new Error("Not implemented");
    }
    // Saves data by id
    set() {
      throw new Error("Not implemented");
    }
    // Removes data by id
    remove() {
      throw new Error("Not implemented");
    }
  }

  // Default implementation backed by localStorage
  class LocalStorageProvider extends StorageProvider {
    constructor(storage) {
      super();
      this.storage = storage || window.localStorage;
    }

    keys() {
      // Known keys used by current app (configurable)
      const simple = window.APP_CONFIG?.storage?.keys?.simple || "agp_manuscript_simple";
      const full = window.APP_CONFIG?.storage?.keys?.full || "agp_manuscript_full";
      return [simple, full];
    }

    list() {
      const items = [];
      const [kSimple, kFull] = this.keys();
      for (const k of [kSimple, kFull]) {
        const raw = this.storage.getItem(k);
        if (!raw) continue;
        if (k === kFull) {
          try {
            const obj = JSON.parse(raw);
            const text = obj.text ?? stripHtml(obj.html ?? "");
            items.push({
              id: k,
              title: obj.title || "(無題)",
              savedAt: obj.meta?.savedAt || null,
              size: byteSize(raw),
              excerpt: toExcerpt(text),
              type: "full",
            });
          } catch (e) {
            console.warn("LocalStorageProvider.list parse error:", e);
          }
        } else if (k === kSimple) {
          const text = raw;
          items.push({
            id: k,
            title: "(シンプル保存)",
            savedAt: null,
            size: byteSize(text),
            excerpt: toExcerpt(text),
            type: "simple",
          });
        }
      }
      // snapshots
      const snapConf = window.APP_CONFIG?.storage?.snapshots;
      const prefix = snapConf?.prefix || "agp_snap_";
      if (snapConf?.enabled) {
        try {
          for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (!key || !key.startsWith(prefix)) continue;
            const raw = this.storage.getItem(key);
            if (!raw) continue;
            try {
              const obj = JSON.parse(raw);
              const text = obj.text ?? stripHtml(obj.html ?? "");
              items.push({
                id: key,
                title: obj.title || "(無題)" + (obj.meta?.label ? ` - ${obj.meta.label}` : ""),
                savedAt: obj.meta?.savedAt || null,
                size: byteSize(raw),
                excerpt: toExcerpt(text),
                type: "snapshot",
              });
            } catch (e) {
              /* ignore broken snapshot */
            }
          }
        } catch (e) {
          console.warn("LocalStorageProvider.snapshot list error", e);
        }
      }
      return items;
    }

    get(id) {
      const raw = this.storage.getItem(id);
      if (!raw) return null;
      const kFull = window.APP_CONFIG?.storage?.keys?.full || "agp_manuscript_full";
      const kSimple = window.APP_CONFIG?.storage?.keys?.simple || "agp_manuscript_simple";
      const prefix = window.APP_CONFIG?.storage?.snapshots?.prefix || "agp_snap_";
      if (id === kFull) {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
      if (id === kSimple) {
        return { text: raw };
      }
      if (id && typeof id === "string" && id.startsWith(prefix)) {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
      return raw;
    }

    set(id, data) {
      const kFull = window.APP_CONFIG?.storage?.keys?.full || "agp_manuscript_full";
      const kSimple = window.APP_CONFIG?.storage?.keys?.simple || "agp_manuscript_simple";
      const prefix = window.APP_CONFIG?.storage?.snapshots?.prefix || "agp_snap_";
      if (id === kFull) {
        this.storage.setItem(id, JSON.stringify(data));
        return;
      }
      if (id === kSimple) {
        this.storage.setItem(id, typeof data === "string" ? data : (data?.text ?? ""));
        return;
      }
      if (id && typeof id === "string" && id.startsWith(prefix)) {
        this.storage.setItem(id, JSON.stringify(data));
        return;
      }
      this.storage.setItem(id, typeof data === "string" ? data : JSON.stringify(data));
    }

    remove(id) {
      this.storage.removeItem(id);
    }
  }

  // Experimental IndexedDB provider (skeleton)
  class IndexedDBProvider extends StorageProvider {
    constructor(dbName = "agp_db", storeName = "manuscripts") {
      super();
      this.dbName = dbName;
      this.storeName = storeName;
      this._opening = null;
      this._db = null;
      if (!("indexedDB" in window)) {
        console.warn("IndexedDB not supported, fallback may be required");
      }
    }

    keys() {
      const simple = window.APP_CONFIG?.storage?.keys?.simple || "agp_manuscript_simple";
      const full = window.APP_CONFIG?.storage?.keys?.full || "agp_manuscript_full";
      return [simple, full];
    }

    async _open() {
      if (this._db) return this._db;
      if (this._opening) return this._opening;
      if (!("indexedDB" in window)) throw new Error("IndexedDB not supported");
      this._opening = new Promise((resolve, reject) => {
        const req = indexedDB.open(this.dbName, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: "id" });
          }
        };
        req.onsuccess = () => {
          this._db = req.result;
          resolve(this._db);
        };
        req.onerror = () => reject(req.error);
      });
      return this._opening;
    }

    async _tx(mode) {
      const db = await this._open();
      return db.transaction(this.storeName, mode).objectStore(this.storeName);
    }

    async list() {
      const items = [];
      try {
        // fetch known keys individually for simplicity
        const [kSimple, kFull] = this.keys();
        for (const k of [kSimple, kFull]) {
          const v = await this.get(k);
          if (!v) continue;
          if (k === kFull) {
            const text = v.text ?? stripHtml(v.html ?? "");
            items.push({
              id: k,
              title: v.title || "(無題)",
              savedAt: v.meta?.savedAt || null,
              size: byteSize(v),
              excerpt: toExcerpt(text),
              type: "full",
            });
          } else if (k === kSimple) {
            const text = typeof v === "string" ? v : (v.text ?? "");
            items.push({
              id: k,
              title: "(シンプル保存)",
              savedAt: null,
              size: byteSize(text),
              excerpt: toExcerpt(text),
              type: "simple",
            });
          }
        }
        // snapshots
        const snapConf = window.APP_CONFIG?.storage?.snapshots;
        const prefix = snapConf?.prefix || "agp_snap_";
        if (snapConf?.enabled) {
          const keys = await this._allKeys();
          for (const key of keys) {
            if (!key || !key.startsWith(prefix)) continue;
            const v = await this.get(key);
            if (!v) continue;
            const text = v.text ?? stripHtml(v.html ?? "");
            items.push({
              id: key,
              title: v.title || "(無題)" + (v.meta?.label ? ` - ${v.meta.label}` : ""),
              savedAt: v.meta?.savedAt || null,
              size: byteSize(v),
              excerpt: toExcerpt(text),
              type: "snapshot",
            });
          }
        }
      } catch (e) {
        console.error("IndexedDBProvider.list", e);
      }
      return items;
    }

    async get(id) {
      try {
        const store = await this._tx("readonly");
        const val = await new Promise((resolve, reject) => {
          const r = store.get(id);
          r.onsuccess = () => resolve(r.result?.value ?? null);
          r.onerror = () => reject(r.error);
        });
        return val;
      } catch (e) {
        console.error("IndexedDBProvider.get", e);
        return null;
      }
    }

    async set(id, data) {
      try {
        const store = await this._tx("readwrite");
        await new Promise((resolve, reject) => {
          const r = store.put({ id, value: data });
          r.onsuccess = () => resolve(true);
          r.onerror = () => reject(r.error);
        });
      } catch (e) {
        console.error("IndexedDBProvider.set", e);
      }
    }

    async remove(id) {
      try {
        const store = await this._tx("readwrite");
        await new Promise((resolve, reject) => {
          const r = store.delete(id);
          r.onsuccess = () => resolve(true);
          r.onerror = () => reject(r.error);
        });
      } catch (e) {
        console.error("IndexedDBProvider.remove", e);
      }
    }

    async _allKeys() {
      try {
        const store = await this._tx("readonly");
        if ("getAllKeys" in store) {
          return await new Promise((resolve, reject) => {
            const r = store.getAllKeys();
            r.onsuccess = () => resolve(r.result || []);
            r.onerror = () => reject(r.error);
          });
        }
        const keys = [];
        await new Promise((resolve, reject) => {
          const req = store.openCursor();
          req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) {
              keys.push(cursor.key);
              cursor.continue();
            } else resolve(true);
          };
          req.onerror = () => reject(req.error);
        });
        return keys;
      } catch (e) {
        console.error("IndexedDBProvider._allKeys", e);
        return [];
      }
    }
  }

  function stripHtml(html) {
    const div = document.createElement("div");
    div.innerHTML = html || "";
    return div.textContent || div.innerText || "";
  }

  function toExcerpt(text, max = 80) {
    const t = (text || "").replace(/\s+/g, " ").trim();
    return t.length > max ? t.slice(0, max) + "…" : t;
  }

  function byteSize(v) {
    try {
      return new Blob([typeof v === "string" ? v : JSON.stringify(v)]).size;
    } catch {
      return v?.length ?? 0;
    }
  }

  // Simple hub for switching providers (future-proof)
  const StorageHub = {
    _provider: null,
    setProvider(p) {
      this._provider = p;
    },
    getProvider() {
      if (this._provider) return this._provider;
      try {
        const backend = window.APP_CONFIG?.storage?.backend || "localStorage";
        if (backend === "indexedDB") this._provider = new IndexedDBProvider();
        else this._provider = new LocalStorageProvider();
      } catch {
        this._provider = new LocalStorageProvider();
      }
      return this._provider;
    },
  };

  window.StorageProviders = { StorageProvider, LocalStorageProvider, IndexedDBProvider };
  window.StorageHub = StorageHub;

  // Bridge to unify async/sync providers and expose convenience APIs
  function _keys() {
    const simple = window.APP_CONFIG?.storage?.keys?.simple || "agp_manuscript_simple";
    const full = window.APP_CONFIG?.storage?.keys?.full || "agp_manuscript_full";
    return { simple, full };
  }
  const StorageBridge = {
    async list() {
      const p = StorageHub.getProvider();
      return await Promise.resolve(p.list());
    },
    async get(id) {
      const p = StorageHub.getProvider();
      return await Promise.resolve(p.get(id));
    },
    async set(id, data) {
      const p = StorageHub.getProvider();
      return await Promise.resolve(p.set(id, data));
    },
    async remove(id) {
      const p = StorageHub.getProvider();
      return await Promise.resolve(p.remove(id));
    },
    async saveSimple(text) {
      const { simple } = _keys();
      return await this.set(simple, typeof text === "string" ? text : (text?.text ?? ""));
    },
    async loadSimple() {
      const { simple } = _keys();
      const v = await this.get(simple);
      return typeof v === "string" ? v : (v?.text ?? "");
    },
    async saveFull(obj) {
      const { full } = _keys();
      return await this.set(full, obj);
    },
    async loadFull() {
      const { full } = _keys();
      const v = await this.get(full);
      return v && typeof v === "object" ? v : null;
    },
  };

  window.StorageBridge = StorageBridge;
})();
