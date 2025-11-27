(function(){
  // Node Editor Logic Manager - Handles business logic operations
  // Validation logic has been extracted to nodeEditorValidation.js
  const GAME_DATA_KEY = window.APP_CONFIG?.storage?.keys?.gameData || 'agp_game_data';

  async function loadFromStorage(){
    try {
      if(window.NodeEditorUIManager.isDirty() && !confirm('未保存の変更があります。破棄して取り込みますか？')) return;
      const raw = window.StorageUtil?.loadJSON?.(GAME_DATA_KEY, null) || null;
      if(!raw){ alert('ゲームデータが見つかりません。プレイ用JSONをインポートしてください。'); return; }
      let spec = null;
      if(Array.isArray(raw.nodes)){
        spec = window.NodeEditorUtils.normalizeSpec(raw);
      } else {
        spec = window.Converters?.engineToSpec ? window.Converters.engineToSpec(raw) : null;
        if(!spec) throw new Error('engineToSpec 変換に失敗');
      }
      const normalizedSpec = window.NodeEditorUtils.normalizeSpec(spec);
      window.NodeEditorUIManager.setSpecData(normalizedSpec);
      window.NodeEditorUIManager.refreshNodeList(normalizedSpec.meta?.start || (normalizedSpec.nodes[0]?.id));
      window.NodeEditorUIManager.refreshExportList();
      window.NodeEditorUIManager.refreshNodeIdDatalist();
      window.NodeEditorUIManager.refreshUnresolvedPanel();
      window.NodeEditorUIManager.setDirty(false);
      alert('ノード編集に取込みました');
      window.NodeEditorUIManager.notifySpecUpdated();
    } catch(e){ console.error('NodeEditor.load', e); alert('取込に失敗しました'); }
  }

  // Delegate validation to NodeEditorValidation module
  function validateSpec(){
    if(window.NodeEditorValidation?.validateSpec){
      window.NodeEditorValidation.validateSpec();
    }
  }

  function performBasicValidation(){
    if(window.NodeEditorValidation?.performBasicValidation){
      window.NodeEditorValidation.performBasicValidation();
    }
  }

  function validateField(fieldName, value, nodeId){
    if(window.NodeEditorValidation?.validateField){
      return window.NodeEditorValidation.validateField(fieldName, value, nodeId);
    }
    return { errors: [], warnings: [] };
  }

  function updateValidationStatus(){
    if(window.NodeEditorValidation?.updateValidationStatus){
      window.NodeEditorValidation.updateValidationStatus();
    }
  }

  function saveToStorage(){
    try {
      const specData = window.NodeEditorUIManager.getSpecData();
      const engine = window.Converters?.normalizeSpecToEngine ? window.Converters.normalizeSpecToEngine(specData) : null;
      if(!engine) throw new Error('normalizeSpecToEngine 変換に失敗');
      window.StorageUtil?.saveJSON?.('agp_game_data', engine);
      window.NodeEditorUIManager.setDirty(false);
      alert('適用保存しました（play.html で反映）');
    } catch(e){
      console.error('NodeEditor.save', e);
      if(window.ErrorHandler){
        window.ErrorHandler.showError(e, { details: 'ゲームデータの保存に失敗しました' });
      } else {
        alert('適用保存に失敗しました');
      }
    }
  }

  function exportJson(){
    try {
      const specData = window.NodeEditorUIManager.getSpecData();
      const blob = new Blob([JSON.stringify(specData, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'game-spec.json'; a.click();
      URL.revokeObjectURL(a.href);
    } catch(e){
      console.error('NodeEditor.export', e);
      if(window.ErrorHandler){
        window.ErrorHandler.showError(e, { details: 'JSONファイルのエクスポートに失敗しました' });
      } else {
        alert('JSON出力に失敗しました');
      }
    }
  }

  function setupDragAndDrop(){
    const imageDropZone = document.getElementById('ne-image-drop-zone');
    const imageInput = document.getElementById('ne-node-image');

    if(!imageDropZone || !imageInput) return;

    // ドラッグオーバー時の処理
    imageDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      imageDropZone.classList.add('drag-over');
    });

    // ドラッグリーブ時の処理
    imageDropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      imageDropZone.classList.remove('drag-over');
    });

    // ドロップ時の処理
    imageDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      imageDropZone.classList.remove('drag-over');

      const files = e.dataTransfer.files;
      if(files.length > 0) {
        const file = files[0];
        if(file.type.startsWith('image/')) {
          // 画像ファイルの場合、Data URLに変換して入力
          const reader = new FileReader();
          reader.onload = (e) => {
            imageInput.value = e.target.result;
            // 入力イベントをトリガーして保存処理を実行
            imageInput.dispatchEvent(new Event('input'));
            // Success notification
            if(window.ErrorHandler){
              // For success messages, we can use a simple alert or create a success notification
              alert('画像を挿入しました。保存してください。');
            } else {
              alert('画像を挿入しました。保存してください。');
            }
          };
          reader.readAsDataURL(file);
        } else {
          if(window.ErrorHandler){
            const error = new Error('画像ファイルのみドロップ可能です。');
            window.ErrorHandler.showError(error, { details: '対応していないファイル形式がドロップされました' });
          } else {
            alert('画像ファイルのみドロップ可能です。');
          }
        }
      }
    });

    // クリックでファイル選択ダイアログを開く
    imageDropZone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if(file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            imageInput.value = e.target.result;
            imageInput.dispatchEvent(new Event('input'));
            // Success notification
            if(window.ErrorHandler){
              alert('画像を挿入しました。保存してください。');
            } else {
              alert('画像を挿入しました。保存してください。');
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    });
  }

  function bindUI(){
    const btnLoad = document.getElementById('ne-load');
    const btnSave = document.getElementById('ne-save');
    const btnValidate = document.getElementById('ne-validate');
    const btnExport = document.getElementById('ne-export');
    const btnAddNode = document.getElementById('ne-add-node');
    const btnRemoveNode = document.getElementById('ne-remove-node');
    const btnAddChoice = document.getElementById('ne-add-choice');
    const btnOpenModal = document.getElementById('ne-open-modal');

    if(btnOpenModal) btnOpenModal.addEventListener('click', () => {
      window.NodeEditorAPI.openModal();
    });

    const actionMenu = document.getElementById('ne-action-menu');
    if(actionMenu) actionMenu.addEventListener('change', () => {
      const action = actionMenu.value;
      if(!action) return;

      switch(action) {
        case 'load':
          loadFromStorage();
          break;
        case 'save':
          saveToStorage();
          break;
        case 'export':
          exportJson();
          break;
        case 'validate':
          validateSpec();
          break;
      }

      // リセット
      actionMenu.value = '';
    });

    const { sel, startSel, id, title, text, image } = window.NodeEditorUIManager.readUIRefs();

    if(sel) sel.addEventListener('change', () => window.NodeEditorUIManager.renderNodeForm(sel.value));
    if(startSel) startSel.addEventListener('change', () => {
      const specData = window.NodeEditorUIManager.getSpecData();
      if(!specData.meta) specData.meta = {};
      specData.meta.start = startSel.value;
      window.NodeEditorUIManager.setDirty(true);
      window.NodeEditorUIManager.notifySpecUpdated();
    });

    if(btnAddNode) btnAddNode.addEventListener('click', () => {
      const specData = window.NodeEditorUIManager.getSpecData();
      const ids = (specData.nodes||[]).map(n => n.id);
      const base = 'node:new';
      const nid = window.NodeEditorUtils.ensureUniqueId(base, ids);
      const node = { id: nid, title: '', text: '', choices: [] };
      window.NodeEditorUtils.upsertNode(specData.nodes, node);
      window.NodeEditorUIManager.refreshNodeList(nid);
      window.NodeEditorUIManager.refreshExportList();
      window.NodeEditorUIManager.refreshNodeIdDatalist();
      window.NodeEditorUIManager.setDirty(true);
      window.NodeEditorUIManager.refreshUnresolvedPanel();
      window.NodeEditorUIManager.notifySpecUpdated();
    });

    if(btnRemoveNode) btnRemoveNode.addEventListener('click', () => {
      const { sel } = window.NodeEditorUIManager.readUIRefs();
      if(!sel || !sel.value) return;
      if(!confirm(`ノード ${sel.value} を削除しますか？`)) return;
      const specData = window.NodeEditorUIManager.getSpecData();
      window.NodeEditorUtils.removeNode(specData.nodes, sel.value);
      window.NodeEditorUIManager.refreshNodeList(specData.nodes[0]?.id);
      window.NodeEditorUIManager.refreshExportList();
      window.NodeEditorUIManager.refreshNodeIdDatalist();
      window.NodeEditorUIManager.setDirty(true);
      window.NodeEditorUIManager.refreshUnresolvedPanel();
      window.NodeEditorUIManager.notifySpecUpdated();
    });

    if(id) id.addEventListener('change', () => {
      const { sel } = window.NodeEditorUIManager.readUIRefs();
      const specData = window.NodeEditorUIManager.getSpecData();
      const curId = sel.value;
      const node = window.NodeEditorUtils.findNodeById(specData.nodes, curId);
      if(!node) return;
      const ids = (specData.nodes||[]).filter(n=>n!==node).map(n => n.id);
      let nv = id.value.trim();
      if(!nv) nv = window.NodeEditorUtils.ensureUniqueId('node:new', ids);
      // 重複IDの場合は自動でユニーク化
      if(ids.includes(nv)) nv = window.NodeEditorUtils.ensureUniqueId(nv, ids);
      if(nv !== node.id){
        // start の更新（もし同一なら）
        if(specData?.meta?.start === node.id){ specData.meta.start = nv; }
        // 参照更新（target）
        const oldId = node.id;
        const newId = nv;
        let refCount = 0;
        try { refCount = window.NodeEditorUtils.renameReferences(specData, oldId, newId); } catch{}
        if(refCount>0){
          const ok = confirm(`IDを変更しました。${refCount} 件の参照(target)を更新します。よろしいですか？`);
          if(!ok){ // revert references if user cancels
            window.NodeEditorUtils.renameReferences(specData, newId, oldId);
          }
        }
        node.id = nv;
        window.NodeEditorUIManager.refreshNodeList(nv);
        window.NodeEditorUIManager.refreshExportList();
        window.NodeEditorUIManager.refreshNodeIdDatalist();
        window.NodeEditorUIManager.refreshUnresolvedPanel();
        // 入力欄にも反映
        const { id: idInput } = window.NodeEditorUIManager.readUIRefs();
        if(idInput) idInput.value = nv;
        window.NodeEditorUIManager.setDirty(true);
        window.NodeEditorUIManager.notifySpecUpdated();
      }
    });

    if(text) text.addEventListener('input', () => {
      const { sel } = window.NodeEditorUIManager.readUIRefs();
      const specData = window.NodeEditorUIManager.getSpecData();
      const node = window.NodeEditorUtils.findNodeById(specData.nodes, sel.value);
      if(!node) return;
      node.text = text.value;
      window.NodeEditorUIManager.setDirty(true);
      window.NodeEditorUIManager.notifySpecUpdated();
      // Real-time validation
      setTimeout(() => window.NodeEditorLogicManager.updateValidationStatus(), 100);
    });

    if(image) image.addEventListener('input', () => {
      const { sel } = window.NodeEditorUIManager.readUIRefs();
      const specData = window.NodeEditorUIManager.getSpecData();
      const node = window.NodeEditorUtils.findNodeById(specData.nodes, sel.value);
      if(!node) return;
      node.image = image.value.trim() || undefined;
      window.NodeEditorUIManager.setDirty(true);
      window.NodeEditorUIManager.notifySpecUpdated();
      // Real-time validation
      setTimeout(() => window.NodeEditorLogicManager.updateValidationStatus(), 100);
    });

    // ドラッグ&ドロップ処理
    setupDragAndDrop();

    if(btnAddChoice) btnAddChoice.addEventListener('click', () => {
      const { sel } = window.NodeEditorUIManager.readUIRefs();
      const specData = window.NodeEditorUIManager.getSpecData();
      const node = window.NodeEditorUtils.findNodeById(specData.nodes, sel.value);
      if(!node) return;
      window.NodeEditorUtils.addChoice(node, { label:'', target:'' });
      window.NodeEditorUIManager.renderChoices(node);
      window.NodeEditorUIManager.setDirty(true);
      window.NodeEditorUIManager.notifySpecUpdated();
    });

    const actionTypeDropdown = document.getElementById('ne-action-type-dropdown');
    if(actionTypeDropdown) actionTypeDropdown.addEventListener('change', () => {
      const actionType = actionTypeDropdown.value;
      if(!actionType) return;

      const { sel } = window.NodeEditorUIManager.readUIRefs();
      const specData = window.NodeEditorUIManager.getSpecData();
      const node = window.NodeEditorUtils.findNodeById(specData.nodes, sel.value);
      if(!node) return;
      if(!Array.isArray(node.actions)) node.actions = [];

      // アクションタイプに応じたデフォルト値を設定
      let newAction = { type: actionType };
      switch(actionType) {
        case 'add_item':
        case 'remove_item':
          newAction.itemId = '';
          newAction.quantity = 1;
          break;
        case 'use_item':
          newAction.itemId = '';
          newAction.quantity = 1;
          newAction.consume = true;
          newAction.effect = { type: 'show_text', text: '' };
          break;
        case 'set_variable':
          newAction.key = '';
          newAction.operation = 'set';
          newAction.value = 0;
          break;
        case 'play_bgm':
        case 'play_se':
          newAction.url = '';
          newAction.volume = 1.0;
          newAction.loop = actionType.includes('bgm');
          break;
        case 'stop_bgm':
        case 'stop_se':
          newAction.url = '';
          break;
        case 'show_text':
          newAction.effect = { type: 'show_text', text: '' };
          break;
      }

      node.actions.push(newAction);
      window.NodeEditorUIManager.renderActions(node);
      window.NodeEditorUIManager.setDirty(true);
      window.NodeEditorUIManager.notifySpecUpdated();

      // ドロップダウンをリセット
      actionTypeDropdown.value = '';
    });

    // Partial export UI bindings
    const { exportMulti, exportSelectAll, exportSelectNone, exportPartial } = window.NodeEditorUIManager.readUIRefs();
    if(exportSelectAll) exportSelectAll.addEventListener('click', () => { if(!exportMulti) return; for(const opt of exportMulti.options){ opt.selected = true; } });
    if(exportSelectNone) exportSelectNone.addEventListener('click', () => { if(!exportMulti) return; for(const opt of exportMulti.options){ opt.selected = false; } });
    if(exportPartial) exportPartial.addEventListener('click', () => {
      if(!exportMulti) return;
      const seed = Array.from(exportMulti.selectedOptions).map(o => o.value);
      if(seed.length === 0){
        if(window.ErrorHandler){
          const error = new Error('少なくとも1つノードを選択してください');
          window.ErrorHandler.showError(error, { details: '部分エクスポートにはノードの選択が必要です' });
        } else {
          alert('少なくとも1つノードを選択してください');
        }
        return;
      }
      const specData = window.NodeEditorUIManager.getSpecData();
      const sub = window.NodeEditorUtils.collectSubgraph(specData, seed);
      try {
        const blob = new Blob([JSON.stringify(sub, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'game-spec.partial.json'; a.click(); URL.revokeObjectURL(a.href);
      } catch(e){
        console.error('exportPartial', e);
        if(window.ErrorHandler){
          window.ErrorHandler.showError(e, { details: '部分エクスポートに失敗しました' });
        } else {
          alert('部分エクスポートに失敗しました');
        }
      }
    });

    // Keyboard shortcuts (when focus is within node-editor)
    document.addEventListener('keydown', (ev) => {
      const root = document.getElementById('node-editor'); if(!root) return;
      const within = root.contains(document.activeElement) || root.matches(':focus-within');
      if(!within) return;
      if(ev.ctrlKey && ev.key === 's'){ ev.preventDefault(); saveToStorage(); }
      else if(ev.ctrlKey && ev.key === 'Enter'){ ev.preventDefault(); btnAddNode?.click(); }
      else if(ev.altKey && ev.key === 'Enter'){ ev.preventDefault(); btnAddChoice?.click(); }
      else if(!ev.ctrlKey && !ev.altKey && ev.key === 'Delete'){ ev.preventDefault(); btnRemoveNode?.click(); }
    });
  }

  // Expose logic manager
  window.NodeEditorLogicManager = {
    loadFromStorage,
    validateSpec,
    saveToStorage,
    exportJson,
    setupDragAndDrop,
    bindUI,
    performBasicValidation,
    validateField,
    updateValidationStatus
  };

})();
