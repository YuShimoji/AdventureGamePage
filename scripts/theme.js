(function () {
  // Initialize theme system on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    const themeManager = new ThemeLogicManager();
    themeManager.initialize();
  });

  // Public API
  window.Theme = {
    applyTheme: ThemeUtils.applyTheme,
    loadTheme: ThemeUtils.loadTheme,
    saveTheme: ThemeUtils.saveTheme,
    PRESETS: ThemeUtils.PRESETS,
    loadCustomPresets: ThemeUtils.loadCustomPresets,
    saveCustomPresets: ThemeUtils.saveCustomPresets,
    addCustomPreset: ThemeUtils.addCustomPreset,
    removeCustomPreset: ThemeUtils.removeCustomPreset,
    renameCustomPreset: ThemeUtils.renameCustomPreset,
    getAllPresets: ThemeUtils.getAllPresets,
    exportThemes: ThemeUtils.exportThemes,
    importThemes: ThemeUtils.importThemes,
    resetToDefaults: ThemeUtils.resetToDefaults
  };
})();
