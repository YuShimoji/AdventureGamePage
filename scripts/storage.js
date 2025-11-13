(function () {
  const isJson = (v) => typeof v === "object" && v !== null;
  const save = (k, v) => localStorage.setItem(k, v);
  const load = (k) => localStorage.getItem(k);
  const remove = (k) => localStorage.removeItem(k);

  function saveJSON(key, obj) {
    try {
      save(key, JSON.stringify(obj));
    } catch (e) {
      console.error("saveJSON", e);
    }
  }
  function loadJSON(key, fallback = null) {
    try {
      const s = load(key);
      return s ? JSON.parse(s) : fallback;
    } catch (e) {
      console.error("loadJSON", e);
      return fallback;
    }
  }
  function saveText(key, text) {
    save(key, text ?? "");
  }
  function loadText(key, fallback = "") {
    return load(key) ?? fallback;
  }

  function removeKey(key) {
    try {
      remove(key);
    } catch (e) {
      console.error("removeKey", e);
    }
  }

  window.StorageUtil = { saveJSON, loadJSON, saveText, loadText, remove: removeKey };
})();
