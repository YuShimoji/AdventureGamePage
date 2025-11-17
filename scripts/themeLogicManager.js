(function () {
  // ThemeLogicManager - テーマ管理のコアロジック
  // 初期化、テーマ適用、イベントハンドリング

  class ThemeLogicManager {
    constructor() {
      this.uiManager = null;
      this.initialized = false;
    }

    // Initialize theme system
    initialize() {
      if (this.initialized) return;

      if (window.APP_CONFIG?.debug?.showConsoleLogs) {
        console.log('[DEBUG] ThemeLogicManager.initialize() called');
      }

      // Apply theme on load
      ThemeUtils.applyTheme(ThemeUtils.loadTheme());

      // Initialize UI manager
      this.uiManager = new ThemeUIManager();

      const panel = document.getElementById("theme-panel");
      if (panel) {
        this.uiManager.buildThemePanel(panel);
        this.uiManager.attachListeners(panel);
      }

      this.initialized = true;
      if (window.APP_CONFIG?.debug?.showConsoleLogs) {
        console.log('[DEBUG] ThemeLogicManager initialization complete');
      }
    }

    // Get UI manager
    getUIManager() {
      return this.uiManager;
    }

    // Apply and save theme
    applyAndSaveTheme(theme) {
      ThemeUtils.applyTheme(theme);
      ThemeUtils.saveTheme(theme);
    }

    // Get current theme
    getCurrentTheme() {
      return ThemeUtils.loadTheme();
    }

    // Get all presets
    getAllPresets() {
      return ThemeUtils.getAllPresets();
    }

    // Export themes
    exportThemes() {
      ThemeUtils.exportThemes();
    }

    // Import themes
    importThemes() {
      ThemeUtils.importThemes();
    }

    // Reset to defaults
    resetToDefaults() {
      ThemeUtils.resetToDefaults();
    }
  }

  window.ThemeLogicManager = ThemeLogicManager;
})();
