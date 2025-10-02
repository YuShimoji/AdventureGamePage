(function () {
  const THEME_KEY = 'agp_theme';
  const PRESETS = {
    zenLight: { name: 'Zen Light', bg: '#fdfdfc', text: '#111111', accent: '#4a90e2' },
    zenDark: { name: 'Zen Dark', bg: '#0f1115', text: '#e6e6e6', accent: '#6aa0ff' },
    sepia: { name: 'Sepia', bg: '#f4ecd8', text: '#4b3f2f', accent: '#a06b48' },
    matrix: { name: 'Matrix', bg: '#0a0f0a', text: '#00ff66', accent: '#00cc55' },
  };

  function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--bg-color', theme.bg);
    root.style.setProperty('--text-color', theme.text);
    root.style.setProperty('--accent-color', theme.accent);
  }

  function loadTheme() {
    const t = StorageUtil.loadJSON(THEME_KEY);
    if (t) return t;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? PRESETS.zenDark : PRESETS.zenLight;
  }

  function saveTheme(theme) {
    StorageUtil.saveJSON(THEME_KEY, theme);
  }

  function closePanel(panel) { panel.hidden = true; }
  function openPanel(panel) { panel.hidden = false; }

  function buildThemePanel(panel) {
    panel.innerHTML = '';
    const h = document.createElement('h3'); h.textContent = 'テーマ設定'; panel.appendChild(h);

    // Presets
    const presetRow = document.createElement('div'); presetRow.className = 'theme-row';
    const presetTitle = document.createElement('div'); presetTitle.textContent = 'プリセット:'; presetRow.appendChild(presetTitle);
    const presetList = document.createElement('div'); presetList.className = 'preset-list';
    for (const key of Object.keys(PRESETS)) {
      const p = PRESETS[key];
      const b = document.createElement('button');
      b.className = 'preset-btn'; b.textContent = p.name;
      b.onclick = () => { applyTheme(p); saveTheme(p); };
      presetList.appendChild(b);
    }
    presetRow.appendChild(presetList);
    panel.appendChild(presetRow);

    const current = loadTheme();

    // Custom pickers
    const row1 = document.createElement('div'); row1.className = 'theme-row';
    const sw1 = document.createElement('div'); sw1.className = 'swatch'; sw1.style.background = current.bg; row1.appendChild(sw1);
    const inBg = document.createElement('input'); inBg.type = 'color'; inBg.value = rgbToHex(current.bg); row1.appendChild(inBg);
    const lab1 = document.createElement('span'); lab1.textContent = '背景'; row1.appendChild(lab1);

    const row2 = document.createElement('div'); row2.className = 'theme-row';
    const sw2 = document.createElement('div'); sw2.className = 'swatch'; sw2.style.background = current.text; row2.appendChild(sw2);
    const inTx = document.createElement('input'); inTx.type = 'color'; inTx.value = rgbToHex(current.text); row2.appendChild(inTx);
    const lab2 = document.createElement('span'); lab2.textContent = '文字'; row2.appendChild(lab2);

    const row3 = document.createElement('div'); row3.className = 'theme-row';
    const sw3 = document.createElement('div'); sw3.className = 'swatch'; sw3.style.background = current.accent; row3.appendChild(sw3);
    const inAc = document.createElement('input'); inAc.type = 'color'; inAc.value = rgbToHex(current.accent); row3.appendChild(inAc);
    const lab3 = document.createElement('span'); lab3.textContent = 'アクセント'; row3.appendChild(lab3);

    const row4 = document.createElement('div'); row4.className = 'theme-row';
    const saveBtn = document.createElement('button'); saveBtn.className = 'btn btn-accent'; saveBtn.textContent = '保存';
    saveBtn.onclick = () => {
      const t = { bg: inBg.value, text: inTx.value, accent: inAc.value };
      applyTheme(t); saveTheme(t);
    };
    row4.appendChild(saveBtn);

    const closeBtn = document.createElement('button'); closeBtn.className = 'btn'; closeBtn.textContent = '閉じる'; closeBtn.onclick = () => closePanel(panel);
    row4.appendChild(closeBtn);

    panel.append(row1, row2, row3, row4);
  }

  function rgbToHex(c) {
    // Accepts formats like #RRGGBB or rgb(...) already
    if (c.startsWith('#')) return c;
    const m = c.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
    if (!m) return '#000000';
    const [r, g, b] = [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0'));
    return `#${r}${g}${b}`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Apply theme on load
    applyTheme(loadTheme());

    const panel = document.getElementById('theme-panel');
    const btn = document.getElementById('btn-theme');
    if (panel && btn) {
      buildThemePanel(panel);
      btn.addEventListener('click', () => { panel.hidden ? openPanel(panel) : closePanel(panel); });
    }
  });

  window.Theme = { applyTheme, loadTheme, saveTheme, PRESETS };
})();
