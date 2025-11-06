(function () {
  // Import Manager - Handles JSON import functionality for manuscripts and game specs
  const KEY_FULL = 'agp_manuscript_full';

  function bridgeEnabled(){
    const be = window.APP_CONFIG?.storage?.backend;
    return (be && be !== 'localStorage') || !!window.APP_CONFIG?.storage?.useBridge;
  }

  window.ImportManager = {
    init: function() {
      this.initImport();
      console.log('ImportManager initialized');
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
    }
  };
})();
