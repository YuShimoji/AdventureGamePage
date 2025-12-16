(function () {
  // Minimal APP_CONFIG for tests
  window.APP_CONFIG = window.APP_CONFIG || {};
  APP_CONFIG.storage = APP_CONFIG.storage || {};
  APP_CONFIG.storage.backend = 'localStorage';

  APP_CONFIG.storage.keys = APP_CONFIG.storage.keys || {};
  APP_CONFIG.storage.keys.simple = APP_CONFIG.storage.keys.simple || 'agp_manuscript_simple';
  APP_CONFIG.storage.keys.full = APP_CONFIG.storage.keys.full || 'agp_manuscript_full';
  APP_CONFIG.storage.keys.gameData = APP_CONFIG.storage.keys.gameData || 'agp_game_data';
  APP_CONFIG.storage.keys.gameProgress = APP_CONFIG.storage.keys.gameProgress || 'agp_game_progress';
  APP_CONFIG.storage.keys.saveSlots = APP_CONFIG.storage.keys.saveSlots || 'agp_save_slots';
  APP_CONFIG.storage.keys.items = APP_CONFIG.storage.keys.items || 'agp_items';
  APP_CONFIG.storage.keys.characters = APP_CONFIG.storage.keys.characters || 'agp_characters';
  APP_CONFIG.storage.keys.lore = APP_CONFIG.storage.keys.lore || 'agp_lore';
  APP_CONFIG.storage.keys.state = APP_CONFIG.storage.keys.state || 'agp_state';
  APP_CONFIG.storage.keys.backupLegacy = APP_CONFIG.storage.keys.backupLegacy || 'agp_backup_legacy';

  APP_CONFIG.storage.snapshots = APP_CONFIG.storage.snapshots || {};
  APP_CONFIG.storage.snapshots.enabled = true;
  APP_CONFIG.storage.snapshots.prefix = 'test_snap_';

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
