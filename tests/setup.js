(function () {
  // Minimal APP_CONFIG for tests
  window.APP_CONFIG = window.APP_CONFIG || {};
  APP_CONFIG.storage = APP_CONFIG.storage || {};
  APP_CONFIG.storage.backend = 'localStorage';
  APP_CONFIG.storage.keys = { simple: 'test_simple', full: 'test_full' };
  APP_CONFIG.storage.snapshots = { enabled: true, prefix: 'test_snap_' };

  window.TestHelpers = {
    clearTestStorage() {
      const { simple, full } = APP_CONFIG.storage.keys;
      localStorage.removeItem(simple);
      localStorage.removeItem(full);
      const prefix = APP_CONFIG.storage.snapshots.prefix;
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('agp_progress');
      localStorage.removeItem('agp_game_progress');
      localStorage.removeItem('agp_game_data');
    },
    makeEls() {
      const titleEl = document.createElement('h1');
      const textEl = document.createElement('article');
      const choicesEl = document.createElement('div');
      document.body.appendChild(titleEl);
      document.body.appendChild(textEl);
      document.body.appendChild(choicesEl);
      return { titleEl, textEl, choicesEl };
    },
  };
})();
