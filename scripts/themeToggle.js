/**
 * Theme Toggle Manager
 * Manages dark/light theme switching with OS preference detection
 */
(function() {
  'use strict';

  const STORAGE_KEY = window.APP_CONFIG?.storage?.keys?.themeMode || 'agp_theme_mode';
  const THEME_DARK = 'dark';
  const THEME_LIGHT = 'light';
  const THEME_AUTO = 'auto';

  let currentTheme = THEME_AUTO;
  let mediaQuery = null;

  /**
   * Get OS preferred color scheme
   * @returns {string} 'dark' or 'light'
   */
  function getOSPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return THEME_LIGHT;
    }
    return THEME_DARK;
  }

  /**
   * Get saved theme preference
   * @returns {string|null} Saved theme or null
   */
  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      console.warn('[ThemeToggle] Failed to read theme from storage:', e);
      return null;
    }
  }

  /**
   * Save theme preference
   * @param {string} theme Theme to save
   */
  function saveTheme(theme) {
    try {
      if (theme === THEME_AUTO) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, theme);
      }
    } catch (e) {
      console.warn('[ThemeToggle] Failed to save theme to storage:', e);
    }
  }

  /**
   * Apply theme to document
   * @param {string} theme Theme to apply ('dark', 'light', or 'auto')
   */
  function applyTheme(theme) {
    const html = document.documentElement;
    
    // Remove existing theme attributes
    html.removeAttribute('data-theme');
    html.classList.remove('dark-theme', 'light-theme');
    
    let effectiveTheme = theme;
    if (theme === THEME_AUTO) {
      effectiveTheme = getOSPreference();
    }
    
    // Apply theme
    html.setAttribute('data-theme', effectiveTheme);
    html.classList.add(`${effectiveTheme}-theme`);
    
    // Update meta theme-color for mobile browsers
    updateMetaThemeColor(effectiveTheme);
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme: effectiveTheme, preference: theme }
    }));

    console.log(`[ThemeToggle] Applied theme: ${effectiveTheme} (preference: ${theme})`);
  }

  /**
   * Update meta theme-color for mobile browsers
   * @param {string} theme Current effective theme
   */
  function updateMetaThemeColor(theme) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.content = theme === THEME_LIGHT ? '#ffffff' : '#1e1e1e';
  }

  /**
   * Set theme
   * @param {string} theme Theme to set ('dark', 'light', or 'auto')
   */
  function setTheme(theme) {
    if (![THEME_DARK, THEME_LIGHT, THEME_AUTO].includes(theme)) {
      console.warn(`[ThemeToggle] Invalid theme: ${theme}`);
      return;
    }
    
    currentTheme = theme;
    saveTheme(theme);
    applyTheme(theme);
  }

  /**
   * Toggle between dark and light themes
   * @returns {string} New theme
   */
  function toggle() {
    const effectiveTheme = getEffectiveTheme();
    const newTheme = effectiveTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    setTheme(newTheme);
    return newTheme;
  }

  /**
   * Get current theme preference
   * @returns {string} Current theme preference ('dark', 'light', or 'auto')
   */
  function getTheme() {
    return currentTheme;
  }

  /**
   * Get effective theme (resolved from auto if needed)
   * @returns {string} 'dark' or 'light'
   */
  function getEffectiveTheme() {
    if (currentTheme === THEME_AUTO) {
      return getOSPreference();
    }
    return currentTheme;
  }

  /**
   * Check if dark theme is active
   * @returns {boolean} True if dark theme
   */
  function isDark() {
    return getEffectiveTheme() === THEME_DARK;
  }

  /**
   * Check if light theme is active
   * @returns {boolean} True if light theme
   */
  function isLight() {
    return getEffectiveTheme() === THEME_LIGHT;
  }

  /**
   * Handle OS preference change
   */
  function handleOSPreferenceChange() {
    if (currentTheme === THEME_AUTO) {
      applyTheme(THEME_AUTO);
    }
  }

  /**
   * Initialize theme toggle
   */
  function init() {
    // Load saved preference
    const saved = getSavedTheme();
    currentTheme = saved || THEME_AUTO;
    
    // Apply initial theme
    applyTheme(currentTheme);
    
    // Listen for OS preference changes
    if (window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleOSPreferenceChange);
      } else if (mediaQuery.addListener) {
        // Legacy support
        mediaQuery.addListener(handleOSPreferenceChange);
      }
    }

    console.log('[ThemeToggle] Initialized with theme:', currentTheme);
  }

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API
  window.ThemeToggle = {
    setTheme,
    getTheme,
    getEffectiveTheme,
    toggle,
    isDark,
    isLight,
    DARK: THEME_DARK,
    LIGHT: THEME_LIGHT,
    AUTO: THEME_AUTO
  };
})();
