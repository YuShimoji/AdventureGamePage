(function () {
  const isJson = (v) => typeof v === 'object' && v !== null;
  const save = (k, v) => localStorage.setItem(k, v);
  const load = (k) => localStorage.getItem(k);

  function saveJSON(key, obj) {
    try { save(key, JSON.stringify(obj)); } catch (e) { console.error('saveJSON', e); }
  }
  function loadJSON(key, fallback = null) {
    try {
      const s = load(key);
      return s ? JSON.parse(s) : fallback;
    } catch (e) {
      console.error('loadJSON', e); return fallback;
    }
  }
  function saveText(key, text) { save(key, text ?? ''); }
  function loadText(key, fallback = '') { return load(key) ?? fallback; }

  window.StorageUtil = { saveJSON, loadJSON, saveText, loadText };
})();
