(function () {
  // UI Adjuster - Adjusts UI elements based on APP_CONFIG settings
  window.UIAdjuster = {
    init: function() {
      this.adjustUI();
      console.log('UIAdjuster initialized');
    },

    // UI adjustments based on APP_CONFIG
    adjustUI: function() {
      // Sticky header
      try {
        const sticky = !!(window.APP_CONFIG?.ui?.stickyHeader);
        document.body.classList.toggle('no-sticky', !sticky);
      } catch {}

      // Icon style
      try {
        if (window.APP_CONFIG?.ui?.iconStyle === 'text') {
          const replacements = [
            ['btn-theme', 'テーマ'],
            ['btn-toggle-sidebar', 'ツール'],
            ['btn-quick-zen', 'Zen'],
            ['btn-quick-sidebar', 'ツール'],
            ['btn-quick-theme', 'テーマ'],
            ['btn-quick-preview', '保存'],
            ['btn-quick-memos', 'メモ']
          ];
          replacements.forEach(([id, label]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = label;
          });
        }
      } catch {}
    }
  };
})();
