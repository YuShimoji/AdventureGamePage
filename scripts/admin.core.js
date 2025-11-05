(function () {
  // Admin Core Module - Main initialization coordinator for admin interface
  const KEY_SIMPLE = 'agp_manuscript_simple';
  const KEY_FULL = 'agp_manuscript_full';
  const KEY_ACCORDION_LAST = 'agp_sidebar_open';
  const KEY_ACCORDION_MULTI = 'agp_sidebar_multi_open';
  const KEY_ACCORDION_MULTI_LIST = 'agp_sidebar_open_multi';
  const KEY_ACCORDION_HINT = 'agp_sidebar_hint_state';

  const ACCORDION_HINTS = {
    tools: {
      label: 'ツール / 保存',
      description: '保存やインポートに関する操作をまとめています。',
      items: [
        '保存先の選択はシンプル/完全保存や一覧操作にも反映されます。',
        'エクスポートした JSON はプレイ画面にも読み込めます。',
        '保存一覧から既存データの読み込み・削除ができます。'
      ]
    },
    'editor-settings': {
      label: 'エディタ設定',
      description: 'スクロールや入力エフェクトなどの既定値を調整します。',
      items: [
        '設定を保存するとブラウザに保持され、再読込後も有効です。',
        '安全領域は自動スクロール時の上下マージンを指定します。'
      ]
    },
    'node-editor': {
      label: 'ノード編集（MVP）',
      description: 'シナリオのノード構造を編集し、検証できます。',
      items: [
        'JSONの取込後は検証で未解決ノードを確認できます。',
        '適用保存で `agp_game_data` に反映されます。',
        'エクスポートで部分的なJSONを書き出し、バックアップに利用できます。'
      ]
    },
    mermaid: {
      label: '分岐プレビュー（Mermaid）',
      description: 'ノード構造をMermaid図で可視化します。',
      items: [
        '描画範囲や方向を切り替えて全体像と部分図を比較できます。',
        'SVGダウンロードで資料共有用の図を取得できます。'
      ]
    }
  };

  // Utility functions
  function exportJSON(obj, filename = 'manuscript.json') {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    URL.revokeObjectURL(a.href);
  }

  function exec(cmd) { document.execCommand(cmd, false, undefined); }

  window.AdminCore = {
    init: function() {
      this.setupCore();
      console.log('AdminCore initialized');
    },

    setupCore: function() {
      // Initialize all admin modules
      if (window.AdminEditor) {
        window.AdminEditor.init();
      }

      // Sidebar management
      this.initSidebarAccordion();
      this.initAccordionHints();
      this.initAccordionModeToggle();

      // Save/load functionality
      this.initSaveLoad();

      // Theme panel
      this.initThemePanel();

      // Floating panel
      this.initFloatingPanel();

      // Editor settings
      this.initEditorSettings();

      // Auto-scroll and animations
      this.initAutoScrollAndAnimations();

      // Storage operations
      this.initStorageOperations();

      // Import functionality
      this.initImport();

      // Admin API
      this.initAdminAPI();

      // UI adjustments
      this.adjustUI();
    },

    // Sidebar accordion management
    initSidebarAccordion: function() {
      // Sidebar toggle
      document.getElementById('btn-toggle-sidebar').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.hidden = !sidebar.hidden;
        sidebar.classList.toggle('show', !sidebar.hidden);
      });

      // Sidebar accordion (details.agp-accordion): exclusive open + persist last open
      (function initSidebarAccordion(){
        try {
          const accs = Array.from(document.querySelectorAll('details.agp-accordion'));
          if(accs.length === 0) return;
          const KEY = KEY_ACCORDION_LAST;
          let allowMulti = false;
          try { allowMulti = localStorage.getItem(KEY_ACCORDION_MULTI) === '1'; } catch{}
          function closeOthers(except){
            if(allowMulti) return;
            accs.forEach(o => { if(o !== except) o.open = false; });
          }
          // restore last open / multi state
          try {
            if(allowMulti){
              const stored = JSON.parse(localStorage.getItem(KEY_ACCORDION_MULTI_LIST) || '[]');
              if(Array.isArray(stored)){
                stored.forEach(id => { const el = document.getElementById(id); if(el) el.open = true; });
              }
            } else {
              const last = localStorage.getItem(KEY);
              if(last && document.getElementById(last)){
                accs.forEach(d => { if(d.id !== last) d.open = false; });
                document.getElementById(last).open = true;
              }
            }
          } catch{}
          accs.forEach(d => {
            d.addEventListener('toggle', () => {
              if(d.open){
                closeOthers(d);
                try {
                  if(allowMulti){
                    const opened = accs.filter(x => x.open).map(x => x.id || '').filter(Boolean);
                    localStorage.setItem(KEY_ACCORDION_MULTI_LIST, JSON.stringify(opened));
                  } else {
                    localStorage.setItem(KEY, d.id || '');
                  }
                } catch{}
              } else {
                try {
                  if(allowMulti){
                    const opened = accs.filter(x => x.open).map(x => x.id || '').filter(Boolean);
                    if(opened.length){ localStorage.setItem(KEY_ACCORDION_MULTI_LIST, JSON.stringify(opened)); }
                    else { localStorage.removeItem(KEY_ACCORDION_MULTI_LIST); }
                  } else {
                    const anyOpen = accs.some(x => x.open);
                    if(!anyOpen){ localStorage.removeItem(KEY); }
                  }
                } catch{}
              }
            });
          });

          // expose helper for hint toggle
          window.AGPAaccordion = {
            isMulti: () => allowMulti,
            setMulti(next){
              allowMulti = !!next;
              try {
                if(allowMulti){
                  const opened = accs.filter(x => x.open).map(x => x.id || '').filter(Boolean);
                  localStorage.setItem(KEY_ACCORDION_MULTI, '1');
                  localStorage.setItem(KEY_ACCORDION_MULTI_LIST, JSON.stringify(opened));
                } else {
                  localStorage.setItem(KEY_ACCORDION_MULTI, '0');
                  localStorage.removeItem(KEY_ACCORDION_MULTI_LIST);
                  // close extras keeping first open
                  const firstOpen = accs.find(x => x.open);
                  accs.forEach(o => { if(o !== firstOpen) o.open = false; });
                  if(firstOpen){ localStorage.setItem(KEY, firstOpen.id || ''); }
                }
              } catch{}
            },
            getAccordions: () => accs
          };
        } catch(e){ console.warn('initSidebarAccordion failed', e); }
      })();
    },

    // Accordion hints
    initAccordionHints: function() {
      try {
        const accordions = Array.from(document.querySelectorAll('details.agp-accordion[data-accordion-id]'));
        if(accordions.length === 0) return;
        const stored = (() => {
          try { return JSON.parse(localStorage.getItem(KEY_ACCORDION_HINT) || '{}'); } catch { return {}; }
        })();
        accordions.forEach(acc => {
          const id = acc.getAttribute('data-accordion-id');
          const hintCfg = ACCORDION_HINTS[id];
          const hintEl = acc.querySelector(`.accordion-hint[data-hint-for="${id}"]`);
          const toggle = acc.querySelector(`.accordion-hint-toggle[data-accordion-hint="${id}"]`);
          if(!hintCfg || !hintEl || !toggle) return;
          const hintId = hintEl.id || `accordion-hint-${id}`;
          hintEl.id = hintId;
          toggle.setAttribute('aria-controls', hintId);
          const frag = document.createDocumentFragment();
          const heading = document.createElement('strong'); heading.textContent = hintCfg.label;
          const desc = document.createElement('p'); desc.textContent = hintCfg.description;
          frag.append(heading, desc);
          if(Array.isArray(hintCfg.items) && hintCfg.items.length){
            const ul = document.createElement('ul'); ul.className = 'accordion-hint-list';
            hintCfg.items.forEach(text => { const li = document.createElement('li'); li.textContent = text; ul.appendChild(li); });
            frag.appendChild(ul);
          }
          hintEl.replaceChildren(frag);

          const initial = stored[id] === true;
          hintEl.hidden = !initial;
          toggle.setAttribute('aria-expanded', String(initial));

          function persist(next){
            stored[id] = !!next;
            try { localStorage.setItem(KEY_ACCORDION_HINT, JSON.stringify(stored)); } catch{}
          }

          function toggleHint(){
            const next = hintEl.hidden;
            hintEl.hidden = !next;
            toggle.setAttribute('aria-expanded', String(next));
            persist(next);
          }

          toggle.addEventListener('click', toggleHint);
          toggle.addEventListener('keydown', (e) => {
            if(e.key === ' ' || e.key === 'Enter'){
              e.preventDefault();
              toggleHint();
            }
          });
        });
      } catch(e){ console.warn('initAccordionHints failed', e); }
    },

    // Accordion mode toggle
    initAccordionModeToggle: function() {
      try {
        const container = document.querySelector('[data-accordion-mode-toggle]');
        if(!container) return;
        const checkbox = container.querySelector('input[type="checkbox"]');
        if(!checkbox) return;
        const label = container.querySelector('[data-toggle-label]');
        const updateLabel = (checked) => {
          if(!label) return;
          label.textContent = checked ? '複数セクションを同時に開く (ON)' : '複数セクションを同時に開く (OFF)';
        };
        const initChecked = (() => {
          try { return localStorage.getItem(KEY_ACCORDION_MULTI) === '1'; } catch { return false; }
        })();
        checkbox.checked = initChecked;
        updateLabel(initChecked);
        const api = window.AGPAaccordion;
        if(api){ api.setMulti(initChecked); }
        checkbox.addEventListener('change', () => {
          const next = checkbox.checked;
          updateLabel(next);
          try { localStorage.setItem(KEY_ACCORDION_MULTI, next ? '1' : '0'); } catch{}
          if(api){ api.setMulti(next); }
        });
      } catch(e){ console.warn('initAccordionModeToggle failed', e); }
    },

    // Save/load functionality
    initSaveLoad: function() {
      const btnOpenList = document.getElementById('btn-saves-list');
      const btnCloseList = document.getElementById('saves-close');
      const btnRefreshList = document.getElementById('saves-refresh');
      const savesPanel = document.getElementById('saves-panel');
      const savesList = document.getElementById('saves-list');

      async function renderSaves() {
        try {
          const reg = window.StorageProviders?.Registry;
          if (!reg) { savesList.innerHTML = '<div class="muted">保存機能が無効です</div>'; return; }
          const p = reg.getActive();
          if (!p || !p.isAvailable()) { savesList.innerHTML = '<div class="muted">利用可能な保存先がありません</div>'; return; }
          const list = await p.list();
          savesList.innerHTML = '';
          list.forEach(item => {
            const row = document.createElement('div'); row.className = 'memo-item';
            const head = document.createElement('div'); head.className = 'memo-head';
            const title = document.createElement('strong'); title.textContent = item.title || (window.APP_CONFIG?.strings?.defaultTitle ?? '');
            const meta = document.createElement('span'); meta.className = 'memo-meta';
            meta.textContent = `${new Date(item.savedAt).toLocaleString()} • ${item.provider} • ${Math.round((item.size||0)/1024)}KB`;
            const actions = document.createElement('div'); actions.className='memo-actions';
            const openBtn = document.createElement('button'); openBtn.className='btn'; openBtn.textContent='開く';
            const expBtn = document.createElement('button'); expBtn.className='btn'; expBtn.textContent='エクスポート';
            const delBtn = document.createElement('button'); delBtn.className='btn'; delBtn.textContent='削除';
            actions.append(openBtn, expBtn, delBtn);
            head.append(title, meta, actions);
            const body = document.createElement('div'); body.textContent = item.textPreview || '';
            row.append(head, body);
            savesList.appendChild(row);

            openBtn.addEventListener('click', async () => {
              try {
                const rec = await p.load(item.id); if (!rec) return;
                const titleInput = document.getElementById('title-input');
                const editor = document.getElementById('editor');
                titleInput.value = rec.title || (window.APP_CONFIG?.strings?.defaultTitle ?? '');
                if (rec.html) { editor.innerHTML = rec.html; } else { editor.innerText = rec.text || ''; }
                if (window.AdminEditor && window.AdminEditor.updateCharCount) {
                  window.AdminEditor.updateCharCount(editor, document.getElementById('char-count'));
                }
              } catch(e){ console.error(e); }
            });
            expBtn.addEventListener('click', async () => {
              try {
                const rec = await p.load(item.id); if (!rec) return;
                const name = `${(rec.title||'manuscript').replace(/[^\w\-一-龯ぁ-ゔァ-ヴー]/g, '_')}_${(rec.meta?.savedAt||'').slice(0,19).replace(/[:T]/g,'-')}.json`;
                const blob = new Blob([JSON.stringify(rec, null, 2)], { type: 'application/json' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
              } catch(e){ console.error(e); }
            });
            delBtn.addEventListener('click', async () => {
              if (!confirm('この保存を削除しますか？')) return;
              try { await p.remove(item.id); renderSaves(); } catch(e){ console.error(e); }
            });
          });
        } catch(e){ console.error('renderSaves', e); }
      }

      if (btnOpenList) btnOpenList.addEventListener('click', () => { savesPanel.hidden = false; renderSaves(); });
      if (btnCloseList) btnCloseList.addEventListener('click', () => { savesPanel.hidden = true; });
      if (btnRefreshList) btnRefreshList.addEventListener('click', () => { renderSaves(); });

      // Format bar buttons
      document.querySelectorAll('#formatbar [data-cmd]').forEach((b) => {
        b.addEventListener('click', () => exec(b.getAttribute('data-cmd')));
      });

      // Quick controls
      const btnQuickZen = document.getElementById('btn-quick-zen');
      const btnQuickSidebar = document.getElementById('btn-quick-sidebar');
      const btnQuickTheme = document.getElementById('btn-quick-theme');
      const btnQuickPreview = document.getElementById('btn-quick-preview');
      const btnQuickMore = document.getElementById('btn-quick-more');
      const btnQuickMemos = document.getElementById('btn-quick-memos');
      const dropdown = document.getElementById('floating-controls-dropdown');
      const panelHandle = document.getElementById('floating-panel-handle');

      const closeDropdown = () => { if (dropdown && !dropdown.hidden) dropdown.hidden = true; };
      if (btnQuickZen) btnQuickZen.addEventListener('click', () => document.body.classList.toggle('zen-mode'));
      if (btnQuickSidebar) btnQuickSidebar.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        const hidden = sidebar.hidden;
        sidebar.hidden = !hidden; sidebar.classList.toggle('show', !sidebar.hidden);
      });
      if (btnQuickTheme) btnQuickTheme.addEventListener('click', () => {
        const themePanel = document.getElementById('theme-panel');
        themePanel.hidden = !themePanel.hidden;
      });
      if (btnQuickMore && dropdown) {
        btnQuickMore.addEventListener('click', (e) => {
          e.stopPropagation();
          const willOpen = dropdown.hidden;
          closeDropdown();
          if (willOpen) {
            dropdown.hidden = false;
          }
        });
        document.addEventListener('click', (e) => {
          if (dropdown && !dropdown.hidden && !e.target.closest('.floating-controls-group')) {
            closeDropdown();
          }
        });
      }

      // Preview functionality check
      if (btnQuickPreview && !(window.APP_CONFIG?.ui?.showSavePreview)) {
        // Keep button visible as fallback for savesPanel
      }
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
      title.textContent = 'テーマ設定';
      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn btn-ghost btn-sm';
      closeBtn.textContent = '✕';
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
    },

    // Floating panel management
    initFloatingPanel: function() {
      const panel = document.getElementById('floating-panel');
      const header = panel?.querySelector('.floating-panel-header');
      const minimizeBtn = document.getElementById('floating-panel-minimize');
      const closeBtn = document.getElementById('floating-panel-close');
      const content = panel?.querySelector('.floating-panel-content');

      if(!panel || !header) return;

      let isDragging = false;
      let startX, startY, startLeft, startTop;

      // Load saved position and state
      const saved = localStorage.getItem('agp_floating_panel');
      if(saved) {
        try {
          const state = JSON.parse(saved);
          if(state.position) {
            panel.style.left = state.position.left + 'px';
            panel.style.top = state.position.top + 'px';
            panel.style.right = 'auto'; // Override default right positioning
          }
          if(state.minimized) {
            panel.classList.add('minimized');
          }
          if(state.hidden) {
            panel.classList.add('hidden');
            const panelHandle = document.getElementById('floating-panel-handle');
            if(panelHandle) panelHandle.hidden = false;
          } else {
            const panelHandle = document.getElementById('floating-panel-handle');
            if(panelHandle) panelHandle.hidden = true;
          }
        } catch(e) { console.warn('Failed to load floating panel state', e); }
      }

      // Drag functionality
      header.addEventListener('mousedown', (e) => {
        if(e.target.closest('.floating-panel-controls')) return; // Don't drag when clicking controls

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = panel.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        panel.classList.add('dragging');
        document.body.style.userSelect = 'none';
      });

      document.addEventListener('mousemove', (e) => {
        if(!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const newLeft = startLeft + deltaX;
        const newTop = startTop + deltaY;

        // Keep panel within viewport bounds
        const maxLeft = window.innerWidth - panel.offsetWidth - 10;
        const maxTop = window.innerHeight - (panel.classList.contains('minimized') ? header.offsetHeight : panel.offsetHeight) - 10;

        panel.style.left = Math.max(10, Math.min(newLeft, maxLeft)) + 'px';
        panel.style.top = Math.max(10, Math.min(newTop, maxTop)) + 'px';
        panel.style.right = 'auto';
      });

      document.addEventListener('mouseup', () => {
        if(isDragging) {
          isDragging = false;
          panel.classList.remove('dragging');
          document.body.style.userSelect = '';

          // Save position
          savePanelState();
        }
      });

      // Minimize/Maximize
      if(minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
          panel.classList.toggle('minimized');
          closeDropdown();
          savePanelState();
        });
      }

      // Close/Open
      if(closeBtn) {
        closeBtn.addEventListener('click', () => {
          panel.classList.add('hidden');
          const panelHandle = document.getElementById('floating-panel-handle');
          if(panelHandle) panelHandle.hidden = false;
          closeDropdown();
          savePanelState();
        });
      }

      const panelHandle = document.getElementById('floating-panel-handle');
      if(panelHandle) {
        panelHandle.addEventListener('click', () => {
          panel.classList.remove('hidden');
          panelHandle.hidden = true;
          closeDropdown();
          savePanelState();
        });
      }

      // Save panel state
      function savePanelState() {
        const rect = panel.getBoundingClientRect();
        const state = {
          position: {
            left: rect.left,
            top: rect.top
          },
          minimized: panel.classList.contains('minimized'),
          hidden: panel.classList.contains('hidden')
        };
        localStorage.setItem('agp_floating_panel', JSON.stringify(state));
      }

      // Handle window resize to keep panel in bounds
      window.addEventListener('resize', () => {
        const rect = panel.getBoundingClientRect();
        const maxLeft = window.innerWidth - panel.offsetWidth - 10;
        const maxTop = window.innerHeight - panel.offsetHeight - 10;

        if(rect.left > maxLeft) {
          panel.style.left = maxLeft + 'px';
        }
        if(rect.top > maxTop) {
          panel.style.top = maxTop + 'px';
        }

        savePanelState();
      });
    },

    // Editor settings panel
    initEditorSettings: function() {
      const elAuto = document.getElementById('cfg-autoscroll-enabled');
      const elTop = document.getElementById('cfg-safe-top');
      const elBottom = document.getElementById('cfg-safe-bottom');
      const lblTop = document.getElementById('cfg-safe-top-label');
      const lblBottom = document.getElementById('cfg-safe-bottom-label');
      const elInk = document.getElementById('cfg-ink-enabled');
      const elInkDur = document.getElementById('cfg-ink-duration');
      const lblInkDur = document.getElementById('cfg-ink-duration-label');
      const btnSave = document.getElementById('cfg-save');
      const btnReset = document.getElementById('cfg-reset');
      if(!elAuto || !elTop || !elBottom || !elInk || !elInkDur || !btnSave || !btnReset) return;

      function setLabels(){
        lblTop && (lblTop.textContent = `${Math.round((elTop.valueAsNumber||20))}%`);
        lblBottom && (lblBottom.textContent = `${Math.round((elBottom.valueAsNumber||60))}%`);
        lblInkDur && (lblInkDur.textContent = `${Math.round((elInkDur.valueAsNumber||160))}ms`);
      }

      // load current to UI
      const autoCfg = window.APP_CONFIG?.editor?.autoScroll || {};
      const fxCfg = window.APP_CONFIG?.editor?.inputFx || {};
      elAuto.checked = !!autoCfg.enabled;
      elTop.value = String(Math.round((autoCfg.safeTopRatio ?? 0.20)*100));
      elBottom.value = String(Math.round((autoCfg.safeBottomRatio ?? 0.60)*100));
      elInk.checked = !!fxCfg.enabled;
      elInkDur.value = String(fxCfg.durationMs ?? 160);
      setLabels();

      elTop.addEventListener('input', setLabels);
      elBottom.addEventListener('input', setLabels);
      elInkDur.addEventListener('input', setLabels);

      function applyFromUI(){
        // guard bounds
        let topPct = Math.max(5, Math.min(40, elTop.valueAsNumber||20));
        let bottomPct = Math.max(55, Math.min(90, elBottom.valueAsNumber||60));
        if(topPct >= bottomPct - 5){ bottomPct = Math.min(90, topPct + 5); }
        elTop.value = String(Math.round(topPct));
        elBottom.value = String(Math.round(bottomPct));
        setLabels();
        const newAuto = { enabled: !!elAuto.checked, safeTopRatio: topPct/100, safeBottomRatio: bottomPct/100, behavior: window.APP_CONFIG.editor.autoScroll.behavior || 'smooth' };
        const newFx = { enabled: !!elInk.checked, durationMs: Math.max(0, elInkDur.valueAsNumber||160) };
        // mutate existing objects to keep references used by listeners
        Object.assign(window.APP_CONFIG.editor.autoScroll, newAuto);
        Object.assign(autoCfg, newAuto);
        Object.assign(window.APP_CONFIG.editor.inputFx, newFx);
        Object.assign(fxCfg, newFx);
        // persist
        try { window.StorageUtil?.saveJSON?.('agp_editor_ui_cfg', { autoScroll: newAuto, inputFx: newFx }); } catch{}
      }

      btnSave.addEventListener('click', applyFromUI);
      btnReset.addEventListener('click', () => {
        elAuto.checked = true;
        elTop.value = '20';
        elBottom.value = '60';
        elInk.checked = true;
        elInkDur.value = '160';
        applyFromUI();
      });
    },

    // Auto-scroll and input animations
    initAutoScrollAndAnimations: function() {
      function debounce(fn, ms){ let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), ms); }; }
      function getCaretRect(){
        try {
          const sel = window.getSelection(); if(!sel || sel.rangeCount===0) return null;
          const range = sel.getRangeAt(0);
          let rect = range.getBoundingClientRect();
          if(rect && (rect.width>0 || rect.height>0)) return rect;
          // fallback: zero-width marker
          const temp = document.createElement('span'); temp.textContent = '\u200b';
          const clone = range.cloneRange(); clone.collapse(true); clone.insertNode(temp);
          rect = temp.getBoundingClientRect(); temp.parentNode && temp.parentNode.removeChild(temp);
          return rect;
        } catch { return null; }
      }
      // prepare overlay for Anime.js pulse
      const inkOverlay = document.createElement('div');
      inkOverlay.className = 'ink-overlay';
      inkOverlay.setAttribute('aria-hidden','true');
      inkOverlay.setAttribute('contenteditable','false');
      const editor = document.getElementById('editor');
      if (editor) {
        editor.appendChild(inkOverlay);
      }
      function ensureCaretVisible(){
        if(!window.APP_CONFIG?.editor?.autoScroll?.enabled) return;
        const rect = getCaretRect(); if(!rect) return;
        const scroller = document.scrollingElement || document.documentElement;
        const viewTop = scroller.scrollTop;
        const viewH = scroller.clientHeight || window.innerHeight;
        const caretY = rect.top + (window.scrollY || viewTop);
        const topBound = viewTop + viewH * (window.APP_CONFIG.editor.autoScroll.safeTopRatio ?? 0.25);
        const bottomBound = viewTop + viewH * (window.APP_CONFIG.editor.autoScroll.safeBottomRatio ?? 0.75);
        let target = null;
        if(caretY < topBound){ target = Math.max(0, caretY - viewH * 0.35); }
        else if(caretY > bottomBound){ target = Math.max(0, caretY - viewH * 0.65); }
        if(target!=null){ window.scrollTo({ top: target, behavior: window.APP_CONFIG.editor.autoScroll.behavior || 'auto' }); }
      }
      const debouncedEnsure = debounce(ensureCaretVisible, 80);
      document.addEventListener('selectionchange', debouncedEnsure);
      if (editor) {
        editor.addEventListener('keydown', (e)=>{
          if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageDown','PageUp','Home','End','Enter','Backspace','Delete'].includes(e.key)){
            setTimeout(debouncedEnsure, 0);
          }
        });
        function applyInk(kind){
          if(!window.APP_CONFIG?.editor?.inputFx?.enabled) return;
          const dur = Math.max(60, window.APP_CONFIG.editor.inputFx.durationMs ?? 160);
          // Prefer Anime.js pulse overlay (stable)
          if(window.anime && inkOverlay){
            // compute caret position relative to editor for gradient focus
            const crect = getCaretRect();
            const ed = editor.getBoundingClientRect();
            let x = ed.width * 0.5, y = ed.height * 0.5;
            if(crect){ x = (crect.left + crect.width/2) - ed.left; y = (crect.top + crect.height/2) - ed.top; }
            const px = Math.max(0, Math.min(1, x / Math.max(1, ed.width)));
            const py = Math.max(0, Math.min(1, y / Math.max(1, ed.height)));
            inkOverlay.style.setProperty('--ink-x', `${(px*100).toFixed(2)}%`);
            inkOverlay.style.setProperty('--ink-y', `${(py*100).toFixed(2)}%`);
            try { window.anime.remove(inkOverlay); } catch{}
            inkOverlay.style.opacity = 0;
            const peak = kind==='out' ? 0.08 : 0.16;
            window.anime({
              targets: inkOverlay,
              opacity: [0, peak, 0],
              duration: Math.round(dur*1.6),
              easing: 'easeInOutSine'
            });
            return;
          }
          // Fallback: simple CSS class toggle
          const cls = kind==='out' ? 'ink-out' : 'ink-in';
          editor.style.setProperty('--ink-dur', `${dur}ms`);
          editor.classList.remove('ink-in','ink-out');
          void editor.offsetWidth; // restart
          editor.classList.add(cls);
          setTimeout(()=> editor.classList.remove(cls), dur+20);
        }
        editor.addEventListener('input', (e)=>{
          debouncedEnsure();
          const t = e.inputType || '';
          if(t.startsWith('delete')) applyInk('out'); else applyInk('in');
        });
      }
    },

    // Storage operations
    initStorageOperations: function() {
      // Keyboard shortcuts
      if (window.APP_CONFIG?.ui?.shortcutsEnabled) {
        document.addEventListener('keydown', (e) => {
          if (!e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
          const k = e.key?.toLowerCase();
          if (k === 'b') { e.preventDefault(); exec('bold'); }
          else if (k === 'i') { e.preventDefault(); exec('italic'); }
          else if (k === 'u') { e.preventDefault(); exec('underline'); }
        });
      }

      // Storage bridge toggle
      function bridgeEnabled(){
        const be = window.APP_CONFIG?.storage?.backend;
        return (be && be !== 'localStorage') || !!window.APP_CONFIG?.storage?.useBridge;
      }

      // Simple save/load (plain text)
      document.getElementById('btn-save-simple').addEventListener('click', async () => {
        if (bridgeEnabled() && window.StorageBridge) {
          await window.StorageBridge.saveSimple(document.getElementById('editor').innerText || '');
        } else {
          StorageUtil.saveText(KEY_SIMPLE, document.getElementById('editor').innerText || '');
        }
        alert('シンプル保存しました');
      });
      document.getElementById('btn-load-simple').addEventListener('click', async () => {
        if (bridgeEnabled() && window.StorageBridge) {
          const t = await window.StorageBridge.loadSimple();
          document.getElementById('editor').innerText = t || '';
        } else {
          document.getElementById('editor').innerText = StorageUtil.loadText(KEY_SIMPLE, '');
        }
        if (window.AdminEditor && window.AdminEditor.updateCharCount) {
          window.AdminEditor.updateCharCount(document.getElementById('editor'), document.getElementById('char-count'));
        }
      });

      // Full save/load (HTML + meta)
      document.getElementById('btn-save-full').addEventListener('click', async () => {
        const now = new Date().toISOString();
        const obj = {
          title: document.getElementById('title-input').value || (window.APP_CONFIG?.strings?.defaultTitle ?? ''),
          html: document.getElementById('editor').innerHTML,
          text: document.getElementById('editor').innerText || '',
          meta: { savedAt: now, theme: window.Theme?.loadTheme?.() }
        };
        if (bridgeEnabled() && window.StorageBridge) { await window.StorageBridge.saveFull(obj); }
        else { StorageUtil.saveJSON(KEY_FULL, obj); }
        alert('完全保存しました');
      });
      document.getElementById('btn-load-full').addEventListener('click', async () => {
        const obj = (bridgeEnabled() && window.StorageBridge)
          ? await window.StorageBridge.loadFull()
          : StorageUtil.loadJSON(KEY_FULL);
        if (!obj) { alert('完全保存データがありません'); return; }
        document.getElementById('title-input').value = obj.title || (window.APP_CONFIG?.strings?.defaultTitle ?? '');
        document.getElementById('editor').innerHTML = obj.html || '';
        if (window.AdminEditor && window.AdminEditor.updateCharCount) {
          window.AdminEditor.updateCharCount(document.getElementById('editor'), document.getElementById('char-count'));
        }
      });

      // Export / Import
      document.getElementById('btn-export').addEventListener('click', async () => {
        const fallback = { title: document.getElementById('title-input').value || (window.APP_CONFIG?.strings?.defaultTitle ?? ''), html: document.getElementById('editor').innerHTML, text: document.getElementById('editor').innerText || '' };
        const obj = (bridgeEnabled() && window.StorageBridge)
          ? (await window.StorageBridge.loadFull()) || fallback
          : (StorageUtil.loadJSON(KEY_FULL) || fallback);
        exportJSON(obj, `${(obj.title || 'manuscript').replace(/[^\w\-一-龯ぁ-ゔァ-ヴー]/g, '_')}.json`);
      });
    },

    // Import functionality
    initImport: function() {
      // JSON import
      (function initJsonImport(){
        const input = document.getElementById('file-import');
        if(input){
          input.addEventListener('change', (ev) => {
            const file = ev.target.files && ev.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const obj = JSON.parse(reader.result);
                document.getElementById('title-input').value = obj.title || (window.APP_CONFIG?.strings?.defaultTitle ?? '');
                document.getElementById('editor').innerHTML = obj.html || '';
                if (bridgeEnabled() && window.StorageBridge) { window.StorageBridge.saveFull(obj); }
                else { StorageUtil.saveJSON(KEY_FULL, obj); }
                if (window.AdminEditor && window.AdminEditor.updateCharCount) {
                  window.AdminEditor.updateCharCount(document.getElementById('editor'), document.getElementById('char-count'));
                }
                alert('インポートしました');
              } catch (e) { alert('JSON の読み込みに失敗しました'); }
            };
            reader.readAsText(file);
            ev.target.value = '';
          });
          // ラベルクリック時のフォールバック（確実にダイアログを開く）
          try {
            const label = document.querySelector('label.file-label');
            if(label){
              label.addEventListener('click', (e)=>{
                if(e.target !== input){ e.preventDefault(); input.click(); }
              });
            }
          } catch {}
        }
      })();

      // Ensure Game JSON import UI exists
      function __ensureGameImportUI(){
        try {
          let container = document.querySelector('#node-editor .ne-actions');
          // ensure hidden file input early
          let input = document.getElementById('file-import-game');
          if(!input){
            input = document.createElement('input');
            input.type = 'file'; input.accept = 'application/json'; input.id = 'file-import-game';
            input.style.display = 'none';
            (container || document.body).appendChild(input);
            try { console.debug('[admin] added hidden #file-import-game'); } catch{}
          }
          if(!container){
            // retry shortly to attach visible controls when sidebar DOM is ready
            setTimeout(__ensureGameImportUI, 200);
            return;
          }
          // ensure a visible button
          let btn = document.getElementById('ne-import-game-btn');
          if(!btn){
            btn = document.createElement('button');
            btn.id = 'ne-import-game-btn';
            btn.className = 'btn';
            btn.type = 'button';
            btn.textContent = 'ゲームJSONインポート';
            btn.title = 'ゲーム仕様のJSONを取り込みます';
            btn.addEventListener('click', () => input && input.click());
            container.appendChild(btn);
            try { console.debug('[admin] added import button in NodeEditor actions'); } catch{}
          }
          // optional: label fallback
          if(!container.querySelector('label.file-label[data-kind="game-import"]')){
            const label = document.createElement('label');
            label.className = 'btn file-label';
            label.setAttribute('data-kind','game-import');
            label.title = 'ゲーム仕様のJSONを取り込みます';
            label.textContent = 'ゲームJSONインポート';
            label.addEventListener('click', (e)=>{ e.preventDefault(); input && input.click(); });
            container.appendChild(label);
            try { console.debug('[admin] added label fallback for game import'); } catch{}
          }
          // header fallback
          const header = document.querySelector('.header-actions');
          if(header && !document.getElementById('ne-import-game-btn-header')){
            const hbtn = document.createElement('button');
            hbtn.id = 'ne-import-game-btn-header';
            hbtn.className = 'btn';
            hbtn.type = 'button';
            hbtn.textContent = 'ゲームJSONインポート';
            hbtn.title = 'ゲーム仕様のJSONを取り込みます';
            hbtn.addEventListener('click', () => input && input.click());
            header.appendChild(hbtn);
            try { console.debug('[admin] added header fallback button for game import'); } catch{}
          }
        } catch(e){ console.warn('ensureGameImportUI failed', e); }
      }
      __ensureGameImportUI();
      try {
        const tgl = document.getElementById('btn-toggle-sidebar');
        if(tgl){ tgl.addEventListener('click', () => setTimeout(__ensureGameImportUI, 0)); }
      } catch{}

      // Game JSON import
      (function initGameSpecImport(){
        const inputGame = document.getElementById('file-import-game');
        if(!inputGame) return;
        inputGame.addEventListener('change', (ev) => {
          const file = ev.target.files && ev.target.files[0]; if(!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const spec = JSON.parse(reader.result);
              // validate
              if(window.Validator?.validateGameSpec){
                const v = window.Validator.validateGameSpec(spec);
                // show panel
                try {
                  const panel = document.getElementById('validation-panel');
                  const listEl = document.getElementById('validation-list');
                  if(panel && listEl){
                    listEl.innerHTML = '';
                    (v.errors||[]).forEach(msg => { const li=document.createElement('li'); li.className='err'; li.textContent = msg; listEl.appendChild(li); });
                    (v.warnings||[]).forEach(msg => { const li=document.createElement('li'); li.className='warn'; li.textContent = msg; listEl.appendChild(li); });
                    panel.hidden = !( (v.errors&&v.errors.length) || (v.warnings&&v.warnings.length) );
                  }
                } catch(e){ /* non-blocking */ }
                if(!v.ok){ alert('ゲームJSONの検証に失敗しました:\n- ' + v.errors.join('\n- ')); return; }
                if(v.warnings && v.warnings.length){ console.warn('GameSpec warnings:', v.warnings); }
              }
              // Convert to engine format
              const engineData = (window.Converters?.normalizeSpecToEngine)
                ? window.Converters.normalizeSpecToEngine(spec)
                : (function(){
                    const title = spec?.meta?.title || spec?.title || (window.APP_CONFIG?.strings?.defaultTitle ?? '');
                    const start = spec?.meta?.start || spec?.start || 'start';
                    const nodesArr = Array.isArray(spec?.nodes) ? spec.nodes : [];
                    const nodes = {};
                    nodesArr.forEach(n => { if(!n || !n.id) return; nodes[n.id] = { title: n.title || '', text: n.text || '', choices: Array.isArray(n.choices) ? n.choices.map(c => ({ text: c.label ?? c.text ?? '', to: c.target ?? c.to ?? '' })) : [] }; });
                    return { title, start, nodes };
                  })();
              StorageUtil.saveJSON('agp_game_data', engineData);
              try { document.getElementById('ne-load')?.click(); } catch{}
              alert('ゲームJSONをインポートしました（プレイ画面/NodeEditorで使用されます）');
            } catch(e){ console.error(e); alert('ゲームJSON の読み込み/変換に失敗しました'); }
          };
          reader.readAsText(file);
          ev.target.value = '';
        });
      })();
    },

    // Admin API
    initAdminAPI: function() {
      function applyFull(obj){
        document.getElementById('title-input').value = obj.title || (window.APP_CONFIG?.strings?.defaultTitle ?? '');
        document.getElementById('editor').innerHTML = obj.html || '';
        if (window.AdminEditor && window.AdminEditor.updateCharCount) {
          window.AdminEditor.updateCharCount(document.getElementById('editor'), document.getElementById('char-count'));
        }
      }
      function applySimple(text){
        document.getElementById('editor').innerText = text || '';
        if (window.AdminEditor && window.AdminEditor.updateCharCount) {
          window.AdminEditor.updateCharCount(document.getElementById('editor'), document.getElementById('char-count'));
        }
      }
      async function loadById(id){
        const { simple, full } = (window.APP_CONFIG?.storage?.keys) || { simple: KEY_SIMPLE, full: KEY_FULL };
        try {
          if (bridgeEnabled() && window.StorageBridge) {
            if (id === full){ const obj = await window.StorageBridge.loadFull(); if(!obj) return false; applyFull(obj); return true; }
            if (id === simple){ const t = await window.StorageBridge.loadSimple(); applySimple(t); return true; }
            const v = await window.StorageBridge.get(id);
            if(v && typeof v === 'object' && v.html){ applyFull(v); return true; }
            if(v && typeof v === 'object' && 'text' in v){ applySimple(v.text); return true; }
            if(typeof v === 'string'){ applySimple(v); return true; }
            return false;
          } else {
            if(id === full){ const obj = StorageUtil.loadJSON(KEY_FULL); if(!obj) return false; applyFull(obj); return true; }
            if(id === simple){ const text = StorageUtil.loadText(KEY_SIMPLE, ''); applySimple(text); return true; }
            const p = window.StorageHub?.getProvider?.();
            const v = p?.get?.(id);
            if(v && typeof v === 'object' && v.html){ applyFull(v); return true; }
            if(v && typeof v === 'object' && 'text' in v){ applySimple(v.text); return true; }
            if(typeof v === 'string'){ applySimple(v); return true; }
            return false;
          }
        } catch(e){ console.error('loadById', e); return false; }
      }
      async function deleteById(id){
        try {
          if (bridgeEnabled() && window.StorageBridge) { await window.StorageBridge.remove(id); return true; }
          if(window.StorageHub?.getProvider){ const r = window.StorageHub.getProvider().remove(id); if (r && typeof r.then === 'function') await r; return true; }
          localStorage.removeItem(id); return true;
        } catch(e){ console.error('deleteById', e); return false; }
      }
      window.AdminAPI = { loadById, deleteById };
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
