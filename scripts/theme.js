(function () {
  const THEME_KEY = "agp_theme";
  const CUSTOM_PRESETS_KEY = "agp_custom_presets";
  const PRESETS = {
    zenLight: { name: "Zen Light", bg: "#fdfdfc", text: "#111111", accent: "#4a90e2" },
    zenDark: { name: "Zen Dark", bg: "#0f1115", text: "#e6e6e6", accent: "#6aa0ff" },
    sepia: { name: "Sepia", bg: "#f4ecd8", text: "#4b3f2f", accent: "#a06b48" },
    matrix: { name: "Matrix", bg: "#0a0f0a", text: "#00ff66", accent: "#00cc55" },
  };

  function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty("--bg-color", theme.bg);
    root.style.setProperty("--text-color", theme.text);
    root.style.setProperty("--accent-color", theme.accent);
  }

  function loadTheme() {
    const t = StorageUtil.loadJSON(THEME_KEY);
    if (t) return t;
    const prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? PRESETS.zenDark : PRESETS.zenLight;
  }

  function saveTheme(theme) {
    StorageUtil.saveJSON(THEME_KEY, theme);
  }

  function loadCustomPresets() {
    return StorageUtil.loadJSON(CUSTOM_PRESETS_KEY) || {};
  }

  function saveCustomPresets(presets) {
    StorageUtil.saveJSON(CUSTOM_PRESETS_KEY, presets);
  }

  function addCustomPreset(name, theme) {
    const customPresets = loadCustomPresets();
    const key = `custom_${Date.now()}`;
    customPresets[key] = {
      name: name,
      bg: theme.bg,
      text: theme.text,
      accent: theme.accent,
      created: Date.now()
    };
    saveCustomPresets(customPresets);
    return key;
  }

  function removeCustomPreset(key) {
    const customPresets = loadCustomPresets();
    delete customPresets[key];
    saveCustomPresets(customPresets);
  }

  function renameCustomPreset(key, newName) {
    const customPresets = loadCustomPresets();
    if (customPresets[key]) {
      customPresets[key].name = newName;
      saveCustomPresets(customPresets);
    }
  }

  function getAllPresets() {
    const customPresets = loadCustomPresets();
    return { ...PRESETS, ...customPresets };
  }

  function closePanel(panel) {
    panel.hidden = true;
    panel.style.display = 'none';
  }

  function openPanel(panel) {
    panel.hidden = false;
    panel.style.display = 'flex';
  }

  function buildThemePanel(panel) {
    const modalBody = panel.querySelector('.theme-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = "";

    const allPresets = getAllPresets();

    // Presets section
    const presetSection = document.createElement("div");
    presetSection.className = "theme-section";

    const presetTitle = document.createElement("h4");
    presetTitle.textContent = "プリセット";
    presetSection.appendChild(presetTitle);

    const presetGrid = document.createElement("div");
    presetGrid.className = "preset-grid";

    for (const key of Object.keys(allPresets)) {
      const p = allPresets[key];
      const presetCard = document.createElement("div");
      presetCard.className = "preset-card";

      const preview = document.createElement("div");
      preview.className = "preset-preview";
      preview.style.background = p.bg;
      preview.style.color = p.text;
      preview.style.border = `2px solid ${p.accent}`;

      const name = document.createElement("div");
      name.className = "preset-name";
      name.textContent = p.name;

      const actions = document.createElement("div");
      actions.className = "preset-actions";

      const applyBtn = document.createElement("button");
      applyBtn.className = "btn btn-sm";
      applyBtn.textContent = "適用";
      applyBtn.onclick = () => {
        applyTheme(p);
        saveTheme(p);
        closePanel(panel);
      };
      actions.appendChild(applyBtn);

      // Custom preset management
      if (key.startsWith('custom_')) {
        const renameBtn = document.createElement("button");
        renameBtn.className = "btn btn-sm";
        renameBtn.textContent = "名前変更";
        renameBtn.onclick = () => {
          const newName = prompt('新しいプリセット名を入力してください:', p.name);
          if (newName && newName.trim()) {
            renameCustomPreset(key, newName.trim());
            buildThemePanel(panel);
          }
        };
        actions.appendChild(renameBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-sm btn-danger";
        deleteBtn.textContent = "削除";
        deleteBtn.onclick = () => {
          if (confirm(`"${p.name}" を削除しますか？`)) {
            removeCustomPreset(key);
            buildThemePanel(panel);
          }
        };
        actions.appendChild(deleteBtn);
      }

      preview.appendChild(name);
      presetCard.appendChild(preview);
      presetCard.appendChild(actions);
      presetGrid.appendChild(presetCard);
    }
    presetSection.appendChild(presetGrid);
    modalBody.appendChild(presetSection);

    const current = loadTheme();

    // Custom color picker section
    const customSection = document.createElement("div");
    customSection.className = "theme-section";

    const customTitle = document.createElement("h4");
    customTitle.textContent = "カスタム設定";
    customSection.appendChild(customTitle);

    // Preview section
    const previewSection = document.createElement("div");
    previewSection.className = "theme-preview-section";

    const previewTitle = document.createElement("h5");
    previewTitle.textContent = "プレビュー";
    previewSection.appendChild(previewTitle);

    const previewBox = document.createElement("div");
    previewBox.className = "theme-preview-box";
    previewBox.innerHTML = `
      <div class="preview-header" style="background: ${current.accent}; color: white; padding: 8px; font-size: 14px; font-weight: bold;">ヘッダー</div>
      <div class="preview-content" style="background: ${current.bg}; color: ${current.text}; padding: 16px;">
        <p style="margin: 0; font-size: 16px;">これはプレビューテキストです。</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: ${current.text};">選択肢の例:</p>
        <button style="background: ${current.accent}; color: white; border: none; padding: 4px 8px; margin: 4px; border-radius: 4px; cursor: pointer;">選択肢1</button>
        <button style="background: ${current.accent}; color: white; border: none; padding: 4px 8px; margin: 4px; border-radius: 4px; cursor: pointer;">選択肢2</button>
      </div>
    `;
    previewSection.appendChild(previewBox);
    customSection.appendChild(previewSection);

    // Color picker controls
    const controlsSection = document.createElement("div");
    controlsSection.className = "theme-controls";

    // Custom pickers
    const row1 = document.createElement("div");
    row1.className = "theme-row";
    const sw1 = document.createElement("div");
    sw1.className = "swatch";
    sw1.style.background = current.bg;
    row1.appendChild(sw1);
    const inBg = document.createElement("input");
    inBg.type = "color";
    inBg.value = rgbToHex(current.bg);
    inBg.onchange = () => {
      sw1.style.background = inBg.value;
      updatePreview(previewBox, inBg.value, inTx.value, inAc.value);
    };
    row1.appendChild(inBg);
    const lab1 = document.createElement("span");
    lab1.textContent = "背景";
    row1.appendChild(lab1);

    const row2 = document.createElement("div");
    row2.className = "theme-row";
    const sw2 = document.createElement("div");
    sw2.className = "swatch";
    sw2.style.background = current.text;
    row2.appendChild(sw2);
    const inTx = document.createElement("input");
    inTx.type = "color";
    inTx.value = rgbToHex(current.text);
    inTx.onchange = () => {
      sw2.style.background = inTx.value;
      updatePreview(previewBox, inBg.value, inTx.value, inAc.value);
    };
    row2.appendChild(inTx);
    const lab2 = document.createElement("span");
    lab2.textContent = "文字";
    row2.appendChild(lab2);

    const row3 = document.createElement("div");
    row3.className = "theme-row";
    const sw3 = document.createElement("div");
    sw3.className = "swatch";
    sw3.style.background = current.accent;
    row3.appendChild(sw3);
    const inAc = document.createElement("input");
    inAc.type = "color";
    inAc.value = rgbToHex(current.accent);
    inAc.onchange = () => {
      sw3.style.background = inAc.value;
      updatePreview(previewBox, inBg.value, inTx.value, inAc.value);
    };
    row3.appendChild(inAc);
    const lab3 = document.createElement("span");
    lab3.textContent = "アクセント";
    row3.appendChild(lab3);

    controlsSection.appendChild(row1);
    controlsSection.appendChild(row2);
    controlsSection.appendChild(row3);
    customSection.appendChild(controlsSection);

    const row4 = document.createElement("div");
    row4.className = "theme-row";

    // Save as preset button
    const savePresetBtn = document.createElement("button");
    savePresetBtn.className = "btn btn-accent";
    savePresetBtn.textContent = "プリセットとして保存";
    savePresetBtn.onclick = () => {
      const presetName = prompt('プリセットの名前を入力してください:');
      if (presetName && presetName.trim()) {
        const t = { bg: inBg.value, text: inTx.value, accent: inAc.value };
        addCustomPreset(presetName.trim(), t);
        buildThemePanel(panel);
      }
    };
    row4.appendChild(savePresetBtn);

    const applyBtn = document.createElement("button");
    applyBtn.className = "btn";
    applyBtn.textContent = "適用";
    applyBtn.onclick = () => {
      const t = { bg: inBg.value, text: inTx.value, accent: inAc.value };
      applyTheme(t);
      saveTheme(t);
      closePanel(panel);
    };
    row4.appendChild(applyBtn);

    customSection.appendChild(row4);

    // Import/Export section
    const ioSection = document.createElement("div");
    ioSection.className = "theme-section";

    const ioTitle = document.createElement("h4");
    ioTitle.textContent = "設定の管理";
    ioSection.appendChild(ioTitle);

    const ioRow = document.createElement("div");
    ioRow.className = "theme-row";

    const exportBtn = document.createElement("button");
    exportBtn.className = "btn";
    exportBtn.textContent = "エクスポート";
    exportBtn.onclick = exportThemes;
    ioRow.appendChild(exportBtn);

    const importBtn = document.createElement("button");
    importBtn.className = "btn";
    importBtn.textContent = "インポート";
    importBtn.onclick = importThemes;
    ioRow.appendChild(importBtn);

    const resetBtn = document.createElement("button");
    resetBtn.className = "btn btn-danger";
    resetBtn.textContent = "デフォルトに戻す";
    resetBtn.onclick = resetToDefaults;
    ioRow.appendChild(resetBtn);

    ioSection.appendChild(ioRow);
    modalBody.appendChild(ioSection);

    modalBody.appendChild(customSection);
  }

  function updatePreview(previewBox, bg, text, accent) {
    const header = previewBox.querySelector('.preview-header');
    const content = previewBox.querySelector('.preview-content');
    const buttons = previewBox.querySelectorAll('button');

    if (header) header.style.background = accent;
    if (content) {
      content.style.background = bg;
      content.style.color = text;
      const secondaryText = content.querySelector('p:last-child');
      if (secondaryText) secondaryText.style.color = text;
    }
    buttons.forEach(btn => {
      btn.style.background = accent;
      btn.style.color = 'white';
    });
  }

  function exportThemes() {
    try {
      const customPresets = loadCustomPresets();
      const currentTheme = loadTheme();
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

  function importThemes() {
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
          const existingPresets = loadCustomPresets();
          const mergedPresets = { ...existingPresets, ...importData.customPresets };
          saveCustomPresets(mergedPresets);

          // Apply imported current theme if desired
          if (importData.currentTheme && confirm('インポートしたテーマを現在のテーマとして適用しますか？')) {
            applyTheme(importData.currentTheme);
            saveTheme(importData.currentTheme);
          }

          // Rebuild the theme panel to show imported presets
          const panel = document.getElementById("theme-panel");
          if (panel) {
            buildThemePanel(panel);
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

  function resetToDefaults() {
    if (confirm('すべてのカスタムプリセットを削除し、デフォルトのテーマ設定に戻しますか？')) {
      // Clear custom presets
      StorageUtil.saveJSON(CUSTOM_PRESETS_KEY, {});

      // Reset to default theme
      const defaultTheme = PRESETS.zenLight;
      applyTheme(defaultTheme);
      saveTheme(defaultTheme);

      // Rebuild the theme panel
      const panel = document.getElementById("theme-panel");
      if (panel) {
        buildThemePanel(panel);
      }

      alert('デフォルト設定に戻しました');
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Apply theme on load
    applyTheme(loadTheme());

    const panel = document.getElementById("theme-panel");
    const btn = document.getElementById("btn-theme");
    const closeBtn = document.getElementById("theme-close");

    if (panel && btn) {
      buildThemePanel(panel);
      btn.addEventListener("click", () => {
        panel.hidden ? openPanel(panel) : closePanel(panel);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => closePanel(panel));
    }

    // Close modal when clicking outside
    if (panel) {
      panel.addEventListener('click', (e) => {
        if (e.target === panel) closePanel(panel);
      });
    }
  });

  window.Theme = {
    applyTheme,
    loadTheme,
    saveTheme,
    PRESETS,
    loadCustomPresets,
    saveCustomPresets,
    addCustomPreset,
    removeCustomPreset,
    renameCustomPreset,
    getAllPresets,
    exportThemes,
    importThemes,
    resetToDefaults
  };
})();
