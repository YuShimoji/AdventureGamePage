(function () {
  // ThemeUIManager - テーマパネルのUI管理
  // パネル構築、プレビュー更新、イベントハンドリング

  class ThemeUIManager {
    constructor() {
      this.panel = null;
      this.listenersAttached = false;
    }

    // Close panel
    closePanel(panel) {
      if (
        window.PlayModalFocus &&
        typeof window.PlayModalFocus.closeModalWithFocus === 'function'
      ) {
        window.PlayModalFocus.closeModalWithFocus(panel);
        return;
      }

      panel.hidden = true;
      panel.style.display = 'none';
    }

    // Open panel
    openPanel(panel) {
      if (window.PlayModalFocus && typeof window.PlayModalFocus.openModalWithFocus === 'function') {
        window.PlayModalFocus.openModalWithFocus(panel);
        return;
      }

      panel.hidden = false;
      panel.style.display = 'flex';
    }

    ensurePanelShell(panel) {
      if (!panel) return null;

      let modalBody = panel.querySelector('.theme-modal-body');
      if (modalBody) {
        if (!panel.getAttribute('aria-labelledby')) {
          panel.setAttribute('aria-labelledby', 'theme-panel-title');
        }
        return modalBody;
      }

      panel.innerHTML = '';

      const header = document.createElement('header');
      header.className = 'panel-header';

      const title = document.createElement('h3');
      title.id = 'theme-panel-title';
      title.className = 'panel-title';
      title.textContent = 'テーマ設定';

      const closeBtn = document.createElement('button');
      closeBtn.id = 'theme-close';
      closeBtn.className = 'btn-icon modal-close-btn';
      closeBtn.title = '閉じる';
      closeBtn.setAttribute('aria-label', 'テーマ設定を閉じる');
      closeBtn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

      header.appendChild(title);
      header.appendChild(closeBtn);

      modalBody = document.createElement('div');
      modalBody.className = 'panel-body theme-modal-body';

      panel.appendChild(header);
      panel.appendChild(modalBody);
      panel.setAttribute('aria-labelledby', 'theme-panel-title');

      return modalBody;
    }

    // Build theme panel UI
    buildThemePanel(panel) {
      const modalBody = this.ensurePanelShell(panel);
      if (!modalBody) return;

      modalBody.innerHTML = '';

      const allPresets = ThemeUtils.getAllPresets();

      // Presets section
      const presetSection = document.createElement('div');
      presetSection.className = 'theme-section';

      const presetTitle = document.createElement('h4');
      presetTitle.textContent = 'プリセット';
      presetSection.appendChild(presetTitle);

      const presetGrid = document.createElement('div');
      presetGrid.className = 'preset-grid';

      for (const key of Object.keys(allPresets)) {
        const p = allPresets[key];
        const presetCard = document.createElement('div');
        presetCard.className = 'preset-card';

        const preview = document.createElement('div');
        preview.className = 'preset-preview';
        preview.style.background = p.bg;
        preview.style.color = p.text;
        preview.style.border = `2px solid ${p.accent}`;

        const name = document.createElement('div');
        name.className = 'preset-name';
        name.textContent = p.name;

        const actions = document.createElement('div');
        actions.className = 'preset-actions';

        const applyBtn = document.createElement('button');
        applyBtn.className = 'btn btn-sm';
        applyBtn.textContent = '適用';
        applyBtn.onclick = () => {
          ThemeUtils.applyTheme(p);
          ThemeUtils.saveTheme(p);
          this.closePanel(panel);
        };
        actions.appendChild(applyBtn);

        // Custom preset management
        if (key.startsWith('custom_')) {
          const renameBtn = document.createElement('button');
          renameBtn.className = 'btn btn-sm';
          renameBtn.textContent = '名前変更';
          renameBtn.onclick = () => {
            const newName = prompt('新しいプリセット名を入力してください:', p.name);
            if (newName && newName.trim()) {
              ThemeUtils.renameCustomPreset(key, newName.trim());
              this.buildThemePanel(panel);
            }
          };
          actions.appendChild(renameBtn);

          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'btn btn-sm btn-danger';
          deleteBtn.textContent = '削除';
          deleteBtn.onclick = () => {
            if (confirm(`"${p.name}" を削除しますか？`)) {
              ThemeUtils.removeCustomPreset(key);
              this.buildThemePanel(panel);
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

      const current = ThemeUtils.loadTheme();

      // Custom color picker section
      const customSection = document.createElement('div');
      customSection.className = 'theme-section';

      const customTitle = document.createElement('h4');
      customTitle.textContent = 'カスタム設定';
      customSection.appendChild(customTitle);

      // Preview section
      const previewSection = document.createElement('div');
      previewSection.className = 'theme-preview-section';

      const previewTitle = document.createElement('h5');
      previewTitle.textContent = 'プレビュー';
      previewSection.appendChild(previewTitle);

      const previewBox = document.createElement('div');
      previewBox.className = 'theme-preview-box';
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
      const controlsSection = document.createElement('div');
      controlsSection.className = 'theme-controls';

      // Custom pickers
      const row1 = document.createElement('div');
      row1.className = 'theme-row';
      const sw1 = document.createElement('div');
      sw1.className = 'swatch';
      sw1.style.background = current.bg;
      row1.appendChild(sw1);
      const inBg = document.createElement('input');
      inBg.type = 'color';
      inBg.value = ThemeUtils.rgbToHex(current.bg);
      inBg.onchange = () => {
        sw1.style.background = inBg.value;
        this.updatePreview(previewBox, inBg.value, inTx.value, inAc.value);
      };
      row1.appendChild(inBg);
      const lab1 = document.createElement('span');
      lab1.textContent = '背景';
      row1.appendChild(lab1);

      const row2 = document.createElement('div');
      row2.className = 'theme-row';
      const sw2 = document.createElement('div');
      sw2.className = 'swatch';
      sw2.style.background = current.text;
      row2.appendChild(sw2);
      const inTx = document.createElement('input');
      inTx.type = 'color';
      inTx.value = ThemeUtils.rgbToHex(current.text);
      inTx.onchange = () => {
        sw2.style.background = inTx.value;
        this.updatePreview(previewBox, inBg.value, inTx.value, inAc.value);
      };
      row2.appendChild(inTx);
      const lab2 = document.createElement('span');
      lab2.textContent = '文字';
      row2.appendChild(lab2);

      const row3 = document.createElement('div');
      row3.className = 'theme-row';
      const sw3 = document.createElement('div');
      sw3.className = 'swatch';
      sw3.style.background = current.accent;
      row3.appendChild(sw3);
      const inAc = document.createElement('input');
      inAc.type = 'color';
      inAc.value = ThemeUtils.rgbToHex(current.accent);
      inAc.onchange = () => {
        sw3.style.background = inAc.value;
        this.updatePreview(previewBox, inBg.value, inTx.value, inAc.value);
      };
      row3.appendChild(inAc);
      const lab3 = document.createElement('span');
      lab3.textContent = 'アクセント';
      row3.appendChild(lab3);

      controlsSection.appendChild(row1);
      controlsSection.appendChild(row2);
      controlsSection.appendChild(row3);
      customSection.appendChild(controlsSection);

      const row4 = document.createElement('div');
      row4.className = 'theme-row';

      // Save as preset button
      const savePresetBtn = document.createElement('button');
      savePresetBtn.className = 'btn btn-accent';
      savePresetBtn.textContent = 'プリセットとして保存';
      savePresetBtn.onclick = () => {
        const presetName = prompt('プリセットの名前を入力してください:');
        if (presetName && presetName.trim()) {
          const t = { bg: inBg.value, text: inTx.value, accent: inAc.value };
          ThemeUtils.addCustomPreset(presetName.trim(), t);
          this.buildThemePanel(panel);
        }
      };
      row4.appendChild(savePresetBtn);

      const applyBtn = document.createElement('button');
      applyBtn.className = 'btn';
      applyBtn.textContent = '適用';
      applyBtn.onclick = () => {
        const t = { bg: inBg.value, text: inTx.value, accent: inAc.value };
        ThemeUtils.applyTheme(t);
        ThemeUtils.saveTheme(t);
        this.closePanel(panel);
      };
      row4.appendChild(applyBtn);

      customSection.appendChild(row4);

      // Import/Export section
      const ioSection = document.createElement('div');
      ioSection.className = 'theme-section';

      const ioTitle = document.createElement('h4');
      ioTitle.textContent = '設定の管理';
      ioSection.appendChild(ioTitle);

      const ioRow = document.createElement('div');
      ioRow.className = 'theme-row';

      const exportBtn = document.createElement('button');
      exportBtn.className = 'btn';
      exportBtn.textContent = 'エクスポート';
      exportBtn.onclick = ThemeUtils.exportThemes.bind(ThemeUtils);
      ioRow.appendChild(exportBtn);

      const importBtn = document.createElement('button');
      importBtn.className = 'btn';
      importBtn.textContent = 'インポート';
      importBtn.onclick = ThemeUtils.importThemes.bind(ThemeUtils);
      ioRow.appendChild(importBtn);

      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn btn-danger';
      resetBtn.textContent = 'デフォルトに戻す';
      resetBtn.onclick = ThemeUtils.resetToDefaults.bind(ThemeUtils);
      ioRow.appendChild(resetBtn);

      ioSection.appendChild(ioRow);
      modalBody.appendChild(ioSection);

      modalBody.appendChild(customSection);
    }

    // Update preview box with new colors
    updatePreview(previewBox, bg, text, accent) {
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

    // Attach event listeners
    attachListeners(panel) {
      if (this.listenersAttached) return;

      if (window.PlayModalFocus && typeof window.PlayModalFocus.openModalWithFocus === 'function') {
        this.listenersAttached = true;
        return;
      }

      const btn = document.getElementById('btn-theme');
      const closeBtn = document.getElementById('theme-close');

      if (panel && btn) {
        btn.addEventListener('click', () => {
          panel.hidden ? this.openPanel(panel) : this.closePanel(panel);
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closePanel(panel));
      }

      // Close modal when clicking outside
      if (panel) {
        panel.addEventListener('click', e => {
          if (e.target === panel) this.closePanel(panel);
        });
      }

      this.listenersAttached = true;
    }
  }

  window.ThemeUIManager = ThemeUIManager;
})();
