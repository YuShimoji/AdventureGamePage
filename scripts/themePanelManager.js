(function () {
  // Theme Panel Manager - Handles theme selection and customization
  window.ThemePanelManager = {
    init: function() {
      this.initThemePanel();
      console.log('ThemePanelManager initialized');
    },

    // Theme panel initialization
    initThemePanel: function() {
      const themePanel = document.getElementById('theme-panel');
      if (!themePanel) return;

      // Clear existing content
      themePanel.innerHTML = '';

      // Header
      const header = document.createElement('div');
      header.className = 'theme-panel-header';
      const title = document.createElement('h3');
      title.id = 'theme-panel-title';
      title.textContent = 'テーマ設定';
      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn btn-ghost btn-sm';
      closeBtn.textContent = '✕';
      closeBtn.setAttribute('aria-label', 'テーマ設定を閉じる');
      closeBtn.onclick = () => { themePanel.hidden = true; };
      header.appendChild(title);
      header.appendChild(closeBtn);

      // Content
      const content = document.createElement('div');
      content.className = 'theme-panel-content';

      // Theme selection
      const themeSection = document.createElement('div');
      themeSection.className = 'theme-section';
      const themeLabel = document.createElement('h4');
      themeLabel.textContent = 'テーマ';
      const themeSelect = document.createElement('select');
      themeSelect.className = 'theme-select';

      // Populate theme options
      const themes = window.ThemeManager?.getAvailableThemes() || [];
      themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.name;
        option.textContent = theme.displayName;
        if (theme.name === window.ThemeManager?.getCurrentTheme()?.name) {
          option.selected = true;
        }
        themeSelect.appendChild(option);
      });

      themeSelect.onchange = () => {
        window.ThemeManager?.setTheme(themeSelect.value);
      };

      themeSection.appendChild(themeLabel);
      themeSection.appendChild(themeSelect);

      // Dark mode toggle
      const darkModeSection = document.createElement('div');
      darkModeSection.className = 'theme-section';
      const darkLabel = document.createElement('h4');
      darkLabel.textContent = 'ダークモード';
      const darkToggle = document.createElement('label');
      darkToggle.className = 'dark-mode-toggle';
      const darkInput = document.createElement('input');
      darkInput.type = 'checkbox';
      darkInput.checked = window.ThemeManager?.getCurrentTheme()?.isDark || false;
      darkInput.onchange = () => {
        window.ThemeManager?.toggleDarkMode();
      };
      const darkSpan = document.createElement('span');
      darkSpan.textContent = '有効';
      darkToggle.appendChild(darkInput);
      darkToggle.appendChild(darkSpan);

      darkModeSection.appendChild(darkLabel);
      darkModeSection.appendChild(darkToggle);

      // Custom colors section
      const customSection = document.createElement('div');
      customSection.className = 'theme-section';
      const customLabel = document.createElement('h4');
      customLabel.textContent = 'カスタムカラー';
      const colorGrid = document.createElement('div');
      colorGrid.className = 'color-grid';

      const colorKeys = ['primary', 'secondary', 'accent', 'success', 'warning', 'error'];
      const currentTheme = window.ThemeManager?.getCurrentTheme();
      colorKeys.forEach(key => {
        const colorItem = document.createElement('div');
        colorItem.className = 'color-item';
        const colorLabel = document.createElement('span');
        colorLabel.textContent = key;
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = currentTheme?.config?.colors?.[key] || '#000000';
        colorInput.onchange = () => {
          const customColors = {};
          colorKeys.forEach(k => {
            const input = document.querySelector(`input[data-color-key="${k}"]`);
            if (input) customColors[k] = input.value;
          });
          window.ThemeManager?.applyCustomColors(customColors);
          window.ThemeManager?.applyTheme();
        };
        colorInput.setAttribute('data-color-key', key);

        colorItem.appendChild(colorLabel);
        colorItem.appendChild(colorInput);
        colorGrid.appendChild(colorItem);
      });

      customSection.appendChild(customLabel);
      customSection.appendChild(colorGrid);

      // Actions
      const actions = document.createElement('div');
      actions.className = 'theme-actions';
      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn';
      resetBtn.textContent = 'リセット';
      resetBtn.onclick = () => {
        window.ThemeManager?.setTheme('default');
        window.ThemeManager?.toggleDarkMode(); // Reset to light mode
        // Reset custom colors
        colorKeys.forEach(key => {
          const input = document.querySelector(`input[data-color-key="${key}"]`);
          const defaultColor = window.ThemeManager?.themes?.default?.colors?.[key] || '#000000';
          if (input) input.value = defaultColor;
        });
        window.ThemeManager?.applyCustomColors({});
        window.ThemeManager?.applyTheme();
      };

      actions.appendChild(resetBtn);

      content.appendChild(themeSection);
      content.appendChild(darkModeSection);
      content.appendChild(customSection);
      content.appendChild(actions);

      themePanel.appendChild(header);
      themePanel.appendChild(content);
    }
  };
})();
