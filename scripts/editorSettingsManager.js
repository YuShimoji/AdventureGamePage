(function () {
  // Editor Settings Manager - Handles editor settings panel and auto-scroll configurations
  window.EditorSettingsManager = {
    init: function() {
      this.initEditorSettings();
      console.log('EditorSettingsManager initialized');
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
    }
  };
})();
