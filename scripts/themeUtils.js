(function () {
  // ThemeUtils - テーマ関連のユーティリティ関数
  // カラーヘルパー、プリセット管理、ストレージ操作

  const THEME_KEY = "agp_theme";
  const CUSTOM_PRESETS_KEY = "agp_custom_presets";
  const PRESETS = {
    zenLight: { name: "Zen Light", bg: "#fdfdfc", text: "#111111", accent: "#4a90e2" },
    zenDark: { name: "Zen Dark", bg: "#0f1115", text: "#e6e6e6", accent: "#6aa0ff" },
    sepia: { name: "Sepia", bg: "#f4ecd8", text: "#4b3f2f", accent: "#a06b48" },
    matrix: { name: "Matrix", bg: "#0a0f0a", text: "#00ff66", accent: "#00cc55" },
  };

  class ThemeUtils {
    static get THEME_KEY() {
      return THEME_KEY;
    }

    static get CUSTOM_PRESETS_KEY() {
      return CUSTOM_PRESETS_KEY;
    }

    static get PRESETS() {
      return PRESETS;
    }

    // RGB color to hex conversion
    static rgbToHex(color) {
      // If already hex, return as is
      if (color.startsWith('#')) return color;

      // Handle rgb() format
      const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      }

      // Fallback
      return color;
    }

    // Apply theme to document
    static applyTheme(theme) {
      const root = document.documentElement;
      root.style.setProperty("--bg-color", theme.bg);
      root.style.setProperty("--text-color", theme.text);
      root.style.setProperty("--accent-color", theme.accent);
    }

    // Load theme from storage
    static loadTheme() {
      const t = StorageUtil.loadJSON(THEME_KEY);
      if (t) return t;
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? PRESETS.zenDark : PRESETS.zenLight;
    }

    // Save theme to storage
    static saveTheme(theme) {
      StorageUtil.saveJSON(THEME_KEY, theme);
    }

    // Load custom presets
    static loadCustomPresets() {
      return StorageUtil.loadJSON(CUSTOM_PRESETS_KEY) || {};
    }

    // Save custom presets
    static saveCustomPresets(presets) {
      StorageUtil.saveJSON(CUSTOM_PRESETS_KEY, presets);
    }

    // Add custom preset
    static addCustomPreset(name, theme) {
      const customPresets = this.loadCustomPresets();
      const key = `custom_${Date.now()}`;
      customPresets[key] = {
        name: name,
        bg: theme.bg,
        text: theme.text,
        accent: theme.accent,
        created: Date.now()
      };
      this.saveCustomPresets(customPresets);
      return key;
    }

    // Remove custom preset
    static removeCustomPreset(key) {
      const customPresets = this.loadCustomPresets();
      delete customPresets[key];
      this.saveCustomPresets(customPresets);
    }

    // Rename custom preset
    static renameCustomPreset(key, newName) {
      const customPresets = this.loadCustomPresets();
      if (customPresets[key]) {
        customPresets[key].name = newName;
        this.saveCustomPresets(customPresets);
      }
    }

    // Get all presets (built-in + custom)
    static getAllPresets() {
      const customPresets = this.loadCustomPresets();
      return { ...PRESETS, ...customPresets };
    }

    // Export themes to JSON file
    static exportThemes() {
      try {
        const customPresets = this.loadCustomPresets();
        const currentTheme = this.loadTheme();
        const exportData = {
          version: '1.0',
          exportedAt: Date.now(),
          currentTheme: currentTheme,
          customPresets: customPresets,
          defaultPresets: PRESETS
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `theme-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('テーマ設定をエクスポートしました');
      } catch (error) {
        console.error('Theme export failed:', error);
        alert('エクスポートに失敗しました');
      }
    }

    // Import themes from JSON file
    static importThemes() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importData = JSON.parse(e.target.result);

            // Validate import data
            if (!importData.version || !importData.customPresets) {
              throw new Error('Invalid theme data format');
            }

            // Import custom presets (merge with existing)
            const existingPresets = this.loadCustomPresets();
            const mergedPresets = { ...existingPresets, ...importData.customPresets };
            this.saveCustomPresets(mergedPresets);

            // Apply imported current theme if desired
            if (importData.currentTheme && confirm('インポートしたテーマを現在のテーマとして適用しますか？')) {
              this.applyTheme(importData.currentTheme);
              this.saveTheme(importData.currentTheme);
            }

            // Rebuild the theme panel to show imported presets
            const panel = document.getElementById("theme-panel");
            if (panel) {
              // Trigger rebuild through UIManager
              if (window.ThemeUIManager && window.ThemeUIManager.buildThemePanel) {
                window.ThemeUIManager.buildThemePanel(panel);
              }
            }

            alert(`テーマ設定をインポートしました\nカスタムプリセット: ${Object.keys(importData.customPresets).length}個`);
          } catch (error) {
            console.error('Theme import failed:', error);
            alert('インポートに失敗しました。ファイル形式が正しいか確認してください。');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }

    // Reset to defaults
    static resetToDefaults() {
      if (confirm('すべてのカスタムプリセットを削除し、デフォルトのテーマ設定に戻しますか？')) {
        // Clear custom presets
        this.saveCustomPresets({});

        // Reset to default theme
        const defaultTheme = PRESETS.zenLight;
        this.applyTheme(defaultTheme);
        this.saveTheme(defaultTheme);

        // Rebuild the theme panel
        const panel = document.getElementById("theme-panel");
        if (panel && window.ThemeUIManager && window.ThemeUIManager.buildThemePanel) {
          window.ThemeUIManager.buildThemePanel(panel);
        }

        alert('デフォルト設定に戻しました');
      }
    }
  }

  window.ThemeUtils = ThemeUtils;
})();
