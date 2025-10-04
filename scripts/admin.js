(function () {
  const KEY_SIMPLE = 'agp_manuscript_simple';
  const KEY_FULL = 'agp_manuscript_full';

  function updateCharCount(el, counter) {
    let text = el.innerText ?? '';
    // 空のcontenteditableは "\n" を返すことがあるため0扱いにする
    if (text === '\n' || text === '\r\n') text = '';
    counter.textContent = `${text.length} 文字`;
    // プレースホルダ表示制御（data-empty を付与）
    try {
      const t = (text || '').trim();
      if (t.length === 0) { el.setAttribute('data-empty', 'true'); }
      else { el.removeAttribute('data-empty'); }
    } catch {}
  }

  function exec(cmd) { document.execCommand(cmd, false, undefined); }

  function exportJSON(obj, filename = 'manuscript.json') {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    URL.revokeObjectURL(a.href);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    const count = document.getElementById('char-count');
    const sidebar = document.getElementById('sidebar');
    const titleInput = document.getElementById('title-input');
    const themePanel = document.getElementById('theme-panel');
    const providerSelect = document.getElementById('storage-provider-select');
    const savesPanel = document.getElementById('saves-panel');
    const savesList = document.getElementById('saves-list');
    const autoCfg = window.APP_CONFIG?.editor?.autoScroll || {};
    const fxCfg = window.APP_CONFIG?.editor?.inputFx || {};

    // ----- Load persisted editor settings overrides (if any) -----
    try {
      const saved = window.StorageUtil?.loadJSON?.('agp_editor_ui_cfg');
      if(saved){
        if(saved.autoScroll){ Object.assign(window.APP_CONFIG.editor.autoScroll, saved.autoScroll); Object.assign(autoCfg, saved.autoScroll); }
        if(saved.inputFx){ Object.assign(window.APP_CONFIG.editor.inputFx, saved.inputFx); Object.assign(fxCfg, saved.inputFx); }
      }
    } catch(e){ console.warn('load editor cfg override failed', e); }

    // Config & placeholder
    if (window.APP_CONFIG && APP_CONFIG.editor && APP_CONFIG.editor.placeholder) {
      editor.setAttribute('data-placeholder', APP_CONFIG.editor.placeholder);
    }
    if (window.APP_CONFIG?.editor?.startZen) {
      document.body.classList.add('zen-mode');
    }

    // Initialize
    updateCharCount(editor, count);
    editor.addEventListener('input', () => updateCharCount(editor, count));

    // Sidebar toggle
    document.getElementById('btn-toggle-sidebar').addEventListener('click', () => {
      sidebar.hidden = !sidebar.hidden;
      sidebar.classList.toggle('show', !sidebar.hidden);
    });

    // ---------- 保存一覧（Providerベース） ----------
    const btnOpenList = document.getElementById('btn-saves-list');
    const btnCloseList = document.getElementById('saves-close');
    const btnRefreshList = document.getElementById('saves-refresh');

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
          const title = document.createElement('strong'); title.textContent = item.title || (APP_CONFIG?.strings?.defaultTitle ?? '');
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
              titleInput.value = rec.title || (APP_CONFIG?.strings?.defaultTitle ?? '');
              if (rec.html) { editor.innerHTML = rec.html; } else { editor.innerText = rec.text || ''; }
              updateCharCount(editor, count);
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

    // Floating formatbar buttons
    document.querySelectorAll('#formatbar [data-cmd]').forEach((b) => {
      b.addEventListener('click', () => exec(b.getAttribute('data-cmd')));
    });

    // Floating quick controls
    const btnQuickZen = document.getElementById('btn-quick-zen');
    const btnQuickSidebar = document.getElementById('btn-quick-sidebar');
    const btnQuickTheme = document.getElementById('btn-quick-theme');
    const btnQuickPreview = document.getElementById('btn-quick-preview');
    if (btnQuickZen) btnQuickZen.addEventListener('click', () => document.body.classList.toggle('zen-mode'));
    if (btnQuickSidebar) btnQuickSidebar.addEventListener('click', () => {
      const hidden = sidebar.hidden;
      sidebar.hidden = !hidden; sidebar.classList.toggle('show', !sidebar.hidden);
    });
    if (btnQuickTheme) btnQuickTheme.addEventListener('click', () => { themePanel.hidden = !themePanel.hidden; });
    // プレビュー機能が無効ならボタンを隠す
    if (btnQuickPreview && !(window.APP_CONFIG?.ui?.showSavePreview)) {
      btnQuickPreview.style.display = 'none';
    }
    if (btnQuickPreview) {
      btnQuickPreview.addEventListener('click', () => {
        if (!savesPanel) return;
        const willOpen = savesPanel.hidden === true;
        savesPanel.hidden = !willOpen;
        if (willOpen && typeof renderSaves === 'function') { renderSaves(); }
      });
    }

    // ---------- Storage Providers: select active provider ----------
    try {
      if (window.StorageProviders?.Registry && providerSelect) {
        const reg = window.StorageProviders.Registry;
        // 初期アクティブ設定（config優先、なければ既定）
        const cfgBackend = window.APP_CONFIG?.storage?.backend;
        if (cfgBackend && reg.get(cfgBackend)) { reg.setActiveName(cfgBackend); }
        providerSelect.value = reg.getActiveName();
        providerSelect.addEventListener('change', () => {
          reg.setActiveName(providerSelect.value);
        });
      }
    } catch(e) { console.warn('provider select init failed', e); }

    // Keyboard shortcuts (Ctrl+B/I/U)
    if (window.APP_CONFIG?.ui?.shortcutsEnabled) {
      document.addEventListener('keydown', (e) => {
        if (!e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
        const k = e.key?.toLowerCase();
        if (k === 'b') { e.preventDefault(); exec('bold'); }
        else if (k === 'i') { e.preventDefault(); exec('italic'); }
        else if (k === 'u') { e.preventDefault(); exec('underline'); }
      });
    }

    // ---------- Editor settings panel ----------
    (function initEditorSettingsPanel(){
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
    })();

    // ---------- Editor auto-scroll and input animations ----------
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
    editor.appendChild(inkOverlay);
    function ensureCaretVisible(){
      if(!autoCfg.enabled) return;
      const rect = getCaretRect(); if(!rect) return;
      const scroller = document.scrollingElement || document.documentElement;
      const viewTop = scroller.scrollTop;
      const viewH = scroller.clientHeight || window.innerHeight;
      const caretY = rect.top + (window.scrollY || viewTop);
      const topBound = viewTop + viewH * (autoCfg.safeTopRatio ?? 0.25);
      const bottomBound = viewTop + viewH * (autoCfg.safeBottomRatio ?? 0.75);
      let target = null;
      if(caretY < topBound){ target = Math.max(0, caretY - viewH * 0.35); }
      else if(caretY > bottomBound){ target = Math.max(0, caretY - viewH * 0.65); }
      if(target!=null){ window.scrollTo({ top: target, behavior: autoCfg.behavior || 'auto' }); }
    }
    const debouncedEnsure = debounce(ensureCaretVisible, 80);
    document.addEventListener('selectionchange', debouncedEnsure);
    editor.addEventListener('keydown', (e)=>{
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageDown','PageUp','Home','End','Enter','Backspace','Delete'].includes(e.key)){
        setTimeout(debouncedEnsure, 0);
      }
    });
    function applyInk(kind){
      if(!fxCfg.enabled) return;
      const dur = Math.max(60, fxCfg.durationMs ?? 160);
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

    // Storage bridge toggle
    function bridgeEnabled(){
      const be = window.APP_CONFIG?.storage?.backend;
      return (be && be !== 'localStorage') || !!window.APP_CONFIG?.storage?.useBridge;
    }

    // Simple save/load (plain text)
    document.getElementById('btn-save-simple').addEventListener('click', async () => {
      if (bridgeEnabled() && window.StorageBridge) {
        await window.StorageBridge.saveSimple(editor.innerText || '');
      } else {
        StorageUtil.saveText(KEY_SIMPLE, editor.innerText || '');
      }
      alert('シンプル保存しました');
    });
    document.getElementById('btn-load-simple').addEventListener('click', async () => {
      if (bridgeEnabled() && window.StorageBridge) {
        const t = await window.StorageBridge.loadSimple();
        editor.innerText = t || '';
      } else {
        editor.innerText = StorageUtil.loadText(KEY_SIMPLE, '');
      }
      updateCharCount(editor, count);
    });

    // Full save/load (HTML + meta)
    document.getElementById('btn-save-full').addEventListener('click', async () => {
      const now = new Date().toISOString();
      const obj = {
        title: titleInput.value || (APP_CONFIG?.strings?.defaultTitle ?? ''),
        html: editor.innerHTML,
        text: editor.innerText || '',
        meta: { savedAt: now, theme: Theme.loadTheme() },
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
      titleInput.value = obj.title || (APP_CONFIG?.strings?.defaultTitle ?? '');
      editor.innerHTML = obj.html || '';
      updateCharCount(editor, count);
    });

    // Export / Import
    document.getElementById('btn-export').addEventListener('click', async () => {
      const fallback = { title: titleInput.value || (APP_CONFIG?.strings?.defaultTitle ?? ''), html: editor.innerHTML, text: editor.innerText || '' };
      const obj = (bridgeEnabled() && window.StorageBridge)
        ? (await window.StorageBridge.loadFull()) || fallback
        : (StorageUtil.loadJSON(KEY_FULL) || fallback);
      exportJSON(obj, `${(obj.title || 'manuscript').replace(/[^\w\-一-龯ぁ-ゔァ-ヴー]/g, '_')}.json`);
    });
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
              titleInput.value = obj.title || (APP_CONFIG?.strings?.defaultTitle ?? '');
              editor.innerHTML = obj.html || '';
              if (bridgeEnabled() && window.StorageBridge) { window.StorageBridge.saveFull(obj); }
              else { StorageUtil.saveJSON(KEY_FULL, obj); }
              updateCharCount(editor, count);
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

    // Game JSON import (spec -> engine format)
    (function initGameSpecImport(){
      const inputGame = document.getElementById('file-import-game');
      if(!inputGame) return; // admin.html では未配置のため、存在時のみ有効
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
              // 警告はalertせず、NodeEditorの未解決targetパネルでの可視化に委ねる
              if(v.warnings && v.warnings.length){ console.warn('GameSpec warnings:', v.warnings); }
            }
            // Convert to engine format (use Converters)
            const engineData = (window.Converters?.normalizeSpecToEngine)
              ? window.Converters.normalizeSpecToEngine(spec)
              : (function(){
                  const title = spec?.meta?.title || spec?.title || (APP_CONFIG?.strings?.defaultTitle ?? '');
                  const start = spec?.meta?.start || spec?.start || 'start';
                  const nodesArr = Array.isArray(spec?.nodes) ? spec.nodes : [];
                  const nodes = {};
                  nodesArr.forEach(n => { if(!n || !n.id) return; nodes[n.id] = { title: n.title || '', text: n.text || '', choices: Array.isArray(n.choices) ? n.choices.map(c => ({ text: c.label ?? c.text ?? '', to: c.target ?? c.to ?? '' })) : [] }; });
                  return { title, start, nodes };
                })();
            StorageUtil.saveJSON('agp_game_data', engineData);
            alert('ゲームJSONをインポートしました（プレイ画面で使用されます）');
          } catch(e){ console.error(e); alert('ゲームJSON の読み込み/変換に失敗しました'); }
        };
        reader.readAsText(file);
        ev.target.value = '';
      });
    })();

    // Admin API: allow SavePreview to load/delete by id
    function applyFull(obj){
      titleInput.value = obj.title || (APP_CONFIG?.strings?.defaultTitle ?? '');
      editor.innerHTML = obj.html || '';
      updateCharCount(editor, count);
    }
    function applySimple(text){
      editor.innerText = text || '';
      updateCharCount(editor, count);
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
  });
})();
