(function () {
  // Utils Manager - Provides common utility functions for admin core
  window.UtilsManager = {
    init: function() {
      if (window.APP_CONFIG?.debug?.showConsoleLogs) {
        console.log('UtilsManager initialized');
      }
    },

    // Utility functions
    exportJSON: function(obj, filename = 'manuscript.json') {
      const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
      URL.revokeObjectURL(a.href);
    },

    exec: function(cmd) { document.execCommand(cmd, false, undefined); },

    bridgeEnabled: function(){
      const be = window.APP_CONFIG?.storage?.backend;
      return (be && be !== 'localStorage') || !!window.APP_CONFIG?.storage?.useBridge;
    },

    closeDropdown: function() {
      const dropdown = document.getElementById('floating-controls-dropdown');
      if (dropdown && !dropdown.hidden) dropdown.hidden = true;
    },

    // Accessibility utility for screen readers
    announceToScreenReader: function(message, priority = 'polite') {
      if (!message) return;

      // Create or reuse the announcement element
      let announcer = document.getElementById('screen-reader-announcer');
      if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'screen-reader-announcer';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.style.position = 'absolute';
        announcer.style.left = '-10000px';
        announcer.style.width = '1px';
        announcer.style.height = '1px';
        announcer.style.overflow = 'hidden';
        document.body.appendChild(announcer);
      }

      // Set priority
      announcer.setAttribute('aria-live', priority);

      // Clear and set message
      announcer.textContent = '';
      setTimeout(() => {
        announcer.textContent = message;
      }, 100);
    }
  };
})();
