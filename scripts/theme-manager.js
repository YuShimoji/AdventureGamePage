// scripts/theme-manager.js - 拡張可能なテーマ管理システム
(function () {
  'use strict';

  window.ThemeManager = {
    themes: {},
    currentTheme: 'default',
    isDarkMode: false,

    // テーマ定義
    registerTheme: function (name, theme) {
      this.themes[name] = theme;
    },

    // デフォルトテーマ
    init: function () {
      this.registerTheme('default', {
        name: 'デフォルト',
        colors: {
          primary: '#4fc3f7',
          secondary: '#ff8a65',
          accent: '#81c784',
          background: '#ffffff',
          surface: '#f5f5f5',
          text: '#212121',
          textSecondary: '#757575',
          border: '#e0e0e0',
          shadow: 'rgba(0,0,0,0.1)',
          success: '#4caf50',
          warning: '#ff9800',
          error: '#f44336'
        },
        borderRadius: '8px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      });

      this.registerTheme('dark', {
        name: 'ダーク',
        colors: {
          primary: '#64b5f6',
          secondary: '#ffab91',
          accent: '#a5d6a7',
          background: '#121212',
          surface: '#1e1e1e',
          text: '#ffffff',
          textSecondary: '#b0b0b0',
          border: '#333333',
          shadow: 'rgba(0,0,0,0.3)',
          success: '#81c784',
          warning: '#ffb74d',
          error: '#ef5350'
        },
        borderRadius: '8px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      });

      // 初期テーマ適用
      this.loadUserPreferences();
      this.applyTheme();
    },

    // ユーザーの設定を読み込み
    loadUserPreferences: function () {
      const saved = localStorage.getItem('agp_theme_preferences');
      if (saved) {
        try {
          const prefs = JSON.parse(saved);
          this.currentTheme = prefs.theme || 'default';
          this.isDarkMode = prefs.darkMode || false;
          if (prefs.customColors) {
            this.applyCustomColors(prefs.customColors);
          }
        } catch (e) {
          console.warn('テーマ設定読み込み失敗:', e);
        }
      }

      // システムのダークモード設定を考慮
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.isDarkMode = true;
      }
    },

    // カスタム色を適用
    applyCustomColors: function (customColors) {
      const theme = this.themes[this.currentTheme];
      if (theme && customColors) {
        Object.assign(theme.colors, customColors);
      }
    },

    // テーマを適用
    applyTheme: function () {
      const theme = this.themes[this.currentTheme];
      if (!theme) return;

      const root = document.documentElement;
      const colors = theme.colors;

      // CSSカスタムプロパティを設定
      root.style.setProperty('--primary', colors.primary);
      root.style.setProperty('--secondary', colors.secondary);
      root.style.setProperty('--accent', colors.accent);
      root.style.setProperty('--background', colors.background);
      root.style.setProperty('--surface', colors.surface);
      root.style.setProperty('--text-color', colors.text);
      root.style.setProperty('--text-secondary', colors.textSecondary);
      root.style.setProperty('--border', colors.border);
      root.style.setProperty('--shadow', colors.shadow);
      root.style.setProperty('--success', colors.success);
      root.style.setProperty('--warning', colors.warning);
      root.style.setProperty('--error', colors.error);
      root.style.setProperty('--radius', theme.borderRadius);
      root.style.setProperty('--font-family', theme.fontFamily);

      // ダークモードクラス適用
      document.body.classList.toggle('dark-mode', this.isDarkMode);

      // イベント発火
      document.dispatchEvent(new CustomEvent('agp-theme-changed', {
        detail: { theme: this.currentTheme, isDark: this.isDarkMode }
      }));
    },

    // テーマ切り替え
    setTheme: function (themeName) {
      if (this.themes[themeName]) {
        this.currentTheme = themeName;
        this.savePreferences();
        this.applyTheme();
      }
    },

    // ダークモード切り替え
    toggleDarkMode: function () {
      this.isDarkMode = !this.isDarkMode;
      this.savePreferences();
      this.applyTheme();
    },

    // 設定保存
    savePreferences: function () {
      const prefs = {
        theme: this.currentTheme,
        darkMode: this.isDarkMode,
        timestamp: Date.now()
      };
      localStorage.setItem('agp_theme_preferences', JSON.stringify(prefs));
    },

    // カスタムテーマ作成
    createCustomTheme: function (name, baseTheme = 'default') {
      const base = this.themes[baseTheme];
      if (!base) return null;

      const custom = JSON.parse(JSON.stringify(base));
      custom.name = name;
      custom.isCustom = true;

      this.registerTheme(name, custom);
      return custom;
    },

    // 利用可能なテーマ一覧取得
    getAvailableThemes: function () {
      return Object.keys(this.themes).map(name => ({
        name,
        displayName: this.themes[name].name,
        isCustom: this.themes[name].isCustom || false
      }));
    },

    // 現在のテーマ設定取得
    getCurrentTheme: function () {
      return {
        name: this.currentTheme,
        isDark: this.isDarkMode,
        config: this.themes[this.currentTheme]
      };
    }
  };

  // 初期化
  document.addEventListener('DOMContentLoaded', () => {
    window.ThemeManager.init();
  });

})();
