(function () {
  // Utils Manager - Provides common utility functions for admin core
  window.UtilsManager = {
    init: function() {
      console.log('UtilsManager initialized');
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
    }
  };
})();
