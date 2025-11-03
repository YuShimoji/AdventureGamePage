(function(){
  // Pure utilities for testing and internal logic
  function ensureUniqueId(baseId, existingIds){
    const set = new Set(existingIds || []);
    if(!set.has(baseId)) return baseId;
    let i = 1;
    while(set.has(`${baseId}-${i}`)) i++;
    return `${baseId}-${i}`;
  }
  function findNodeById(nodes, id){ return (nodes||[]).find(n => n && n.id === id) || null; }
  function upsertNode(nodes, node){
    const idx = (nodes||[]).findIndex(n => n && n.id === node.id);
    if(idx >= 0){ nodes[idx] = node; } else { nodes.push(node); }
    return nodes;
  }
  function removeNode(nodes, id){
    const idx = (nodes||[]).findIndex(n => n && n.id === id);
    if(idx >= 0) nodes.splice(idx, 1);
    return nodes;
  }
  function addChoice(node, choice){
    node.choices = Array.isArray(node.choices) ? node.choices : [];
    node.choices.push({ id: choice?.id || '', label: choice?.label || '', target: choice?.target || '' });
    return node.choices;
  }
  function removeChoice(node, index){
    if(!Array.isArray(node.choices)) return [];
    if(index>=0 && index<node.choices.length) node.choices.splice(index,1);
    return node.choices;
  }
  function moveChoice(node, fromIndex, toIndex){
    if(!Array.isArray(node.choices)) return [];
    const len = node.choices.length;
    if(fromIndex<0 || fromIndex>=len) return node.choices;
    if(toIndex<0 || toIndex>=len) return node.choices;
    const [item] = node.choices.splice(fromIndex,1);
    node.choices.splice(toIndex,0,item);
    return node.choices;
  }
  function renameReferences(spec, oldId, newId){
    let count = 0;
    const nodes = (spec && Array.isArray(spec.nodes)) ? spec.nodes : [];
    nodes.forEach(n => {
      const arr = Array.isArray(n.choices) ? n.choices : [];
      arr.forEach(c => { if(c && c.target === oldId){ c.target = newId; count++; } });
    });
    return count;
  }
  function normalizeSpec(spec){
    const s = spec && typeof spec === 'object' ? spec : {};
    s.version = s.version || '1.0';
    s.meta = s.meta || { title:'Adventure', start:'start' };
    s.meta.title = s.meta.title || 'Adventure';
    s.meta.start = s.meta.start || 'start';
    s.nodes = Array.isArray(s.nodes) ? s.nodes : [];
    return s;
  }

  // UI integration
  let specData = { version:'1.0', meta:{ title:'Adventure', start:'start' }, nodes: [] };
  let dirty = false;

  function readUIRefs(){
    return {
      dirtyBanner: document.getElementById('ne-dirty-banner'),
      sel: document.getElementById('ne-node-select'),
      startSel: document.getElementById('ne-start-select'),
      id: document.getElementById('ne-node-id'),
      title: document.getElementById('ne-node-title'),
      text: document.getElementById('ne-node-text'),
      image: document.getElementById('ne-node-image'),
      choices: document.getElementById('ne-choices'),
      actions: document.getElementById('ne-actions'),
      unresolvedPanel: document.getElementById('ne-unresolved-panel'),
      unresolvedList: document.getElementById('ne-unresolved-list'),
      exportMulti: document.getElementById('ne-export-multiselect'),
      exportSelectAll: document.getElementById('ne-export-select-all'),
      exportSelectNone: document.getElementById('ne-export-select-none'),
      exportPartial: document.getElementById('ne-export-partial'),
    };
  }

  function setDirty(v){
    dirty = !!v;
    const { dirtyBanner, btnSave } = readUIRefs();
    if(dirtyBanner) dirtyBanner.hidden = !dirty;
    if(btnSave) btnSave.disabled = !dirty;
  }

  function refreshNodeList(selectedId){
    const { sel } = readUIRefs(); if(!sel) return;
    const currentValue = sel.value;
    sel.innerHTML = '<option value="">-- ノードを選択 --</option>';
    (specData.nodes||[]).forEach(n => {
      const opt = document.createElement('option');
      opt.value = n.id;
      opt.textContent = `${n.id} - ${n.title || 'タイトルなし'}`;
      // ドラッグ可能にする
      opt.draggable = true;
      opt.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', n.id);
        e.dataTransfer.effectAllowed = 'copy';
      });
      sel.appendChild(opt);
    });
    if(selectedId && findNodeById(specData.nodes, selectedId)) sel.value = selectedId;
    else if(currentValue && findNodeById(specData.nodes, currentValue)) sel.value = currentValue;
    else if(specData.nodes?.length) sel.value = specData.nodes[0].id;

    if(sel.value) renderNodeForm(sel.value);
    refreshStartSelect();
    notifySpecUpdated();
  }

  function renderNodeForm(nodeId){
    const { id, title, text, image, choices, actions } = readUIRefs();
    const n = findNodeById(specData.nodes, nodeId);
    if(!n){ id.value = ''; title.value=''; text.value=''; image.value=''; choices.innerHTML=''; if(actions) actions.innerHTML=''; notifySelectionChanged(''); return; }
    id.value = n.id || '';
    title.value = n.title || '';
    text.value = n.text || '';
    image.value = n.image || '';
    renderChoices(n);
    renderActions(n);
    notifySelectionChanged(n.id || '');
  }

  function renderActions(node){
    const { actions } = readUIRefs(); if(!actions) return;
    actions.innerHTML = '';
    const arr = Array.isArray(node.actions) ? node.actions : [];
    arr.forEach((action, idx) => {
      const row = document.createElement('div'); row.className = 'ne-action-row';
      
      const typeSel = document.createElement('select'); typeSel.className = 'ne-action-type';
      const types = ['add_item', 'remove_item', 'use_item', 'clear_inventory', 'play_bgm', 'play_sfx', 'stop_bgm', 'stop_sfx'];
      types.forEach(type => {
        const opt = document.createElement('option'); opt.value = type; opt.textContent = type; typeSel.appendChild(opt);
      });
      typeSel.value = action.type || '';
      
      // itemId入力フィールド（ドラッグ&ドロップ対応）
      const itemIdContainer = document.createElement('div'); itemIdContainer.className = 'ne-action-item-container';
      const itemIdLabel = document.createElement('span'); itemIdLabel.textContent = 'アイテムID';
      const itemId = document.createElement('input'); itemId.type='text'; itemId.placeholder='アイテムID'; itemId.value = action.itemId || '';
      const itemIdDropZone = document.createElement('div'); itemIdDropZone.className = 'ne-action-item-drop-zone'; itemIdDropZone.textContent = '📦 アイテムをドロップ';
      itemIdDropZone.title = 'アイテムをドラッグ&ドロップしてIDを挿入';

      itemIdContainer.appendChild(itemIdLabel);
      itemIdContainer.appendChild(itemId);
      itemIdContainer.appendChild(itemIdDropZone);
      row.appendChild(itemIdContainer);

      const quantity = document.createElement('input'); quantity.type='number'; quantity.min='1'; quantity.placeholder='個数'; quantity.value = action.quantity || 1;
      
      // ドラッグ&ドロップイベントリスナー（itemIdDropZone用）
      itemIdDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        itemIdDropZone.classList.add('drag-over');
      });
      itemIdDropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        itemIdDropZone.classList.remove('drag-over');
      });
      itemIdDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        itemIdDropZone.classList.remove('drag-over');
        
        const data = e.dataTransfer.getData('text/plain');
        if(data) {
          itemId.value = data;
          updateAction();
          alert('アイテムIDを挿入しました。');
        }
      });
      
      // クリックでアイテム選択ダイアログを開く
      itemIdDropZone.addEventListener('click', () => {
        const itemIdValue = prompt('アイテムIDを入力してください:');
        if(itemIdValue && itemIdValue.trim()) {
          itemId.value = itemIdValue.trim();
          updateAction();
        }
      });
      
      // オーディオ関連の設定
      const audioUrl = document.createElement('input'); audioUrl.type='url'; audioUrl.placeholder='https://example.com/audio.mp3'; audioUrl.value = action.url || '';
      const audioVolume = document.createElement('input'); audioVolume.type='range'; audioVolume.min='0'; audioVolume.max='1'; audioVolume.step='0.1'; audioVolume.value = action.volume || 1;
      const audioVolumeLabel = document.createElement('span'); audioVolumeLabel.textContent = `音量: ${(action.volume || 1) * 100}%`;
      const audioLoop = document.createElement('label'); audioLoop.className = 'ne-action-loop';
      const audioLoopInput = document.createElement('input'); audioLoopInput.type='checkbox'; audioLoopInput.checked = action.loop !== false;
      audioLoop.appendChild(audioLoopInput); audioLoop.appendChild(document.createTextNode(' ループ再生'));
      const audioFadeIn = document.createElement('label'); audioFadeIn.className = 'ne-action-fadein';
      const audioFadeInInput = document.createElement('input'); audioFadeInInput.type='checkbox'; audioFadeInInput.checked = action.fadeIn !== false;
      audioFadeIn.appendChild(audioFadeInInput); audioFadeIn.appendChild(document.createTextNode(' フェードイン'));
      const audioCrossfade = document.createElement('label'); audioCrossfade.className = 'ne-action-crossfade';
      const audioCrossfadeInput = document.createElement('input'); audioCrossfadeInput.type='checkbox'; audioCrossfadeInput.checked = action.crossfade !== false;
      audioCrossfade.appendChild(audioCrossfadeInput); audioCrossfade.appendChild(document.createTextNode(' クロスフェード'));
      const audioFadeOut = document.createElement('label'); audioFadeOut.className = 'ne-action-fadeout';
      const audioFadeOutInput = document.createElement('input'); audioFadeOutInput.type='checkbox'; audioFadeOutInput.checked = action.fadeOut !== false;
      audioFadeOut.appendChild(audioFadeOutInput); audioFadeOut.appendChild(document.createTextNode(' フェードアウト'));
      
      // use_item専用の設定
      const consumeCheck = document.createElement('label'); consumeCheck.className = 'ne-action-consume';
      const consumeInput = document.createElement('input'); consumeInput.type='checkbox'; consumeInput.checked = action.consume !== false;
      consumeCheck.appendChild(consumeInput); consumeCheck.appendChild(document.createTextNode(' 使用時に消費'));
      
      const effectTypeSel = document.createElement('select'); effectTypeSel.className = 'ne-action-effect-type';
      const effectTypes = ['show_text', 'set_variable', 'custom'];
      effectTypes.forEach(type => {
        const opt = document.createElement('option'); opt.value = type; opt.textContent = type; effectTypeSel.appendChild(opt);
      });
      if (action.effect) {
        effectTypeSel.value = action.effect.type || '';
      }
      
      const effectInput = document.createElement('input'); effectInput.type='text'; effectInput.placeholder='効果内容'; 
      if (action.effect) {
        effectInput.value = action.effect.text || action.effect.key || '';
      }
      
      // set_variable専用の設定
      const variableKey = document.createElement('input'); variableKey.type='text'; variableKey.placeholder='変数キー'; variableKey.value = action.key || '';
      const variableOperation = document.createElement('select'); variableOperation.className = 'ne-action-operation';
      ['set', 'add', 'subtract', 'multiply', 'divide'].forEach(op => {
        const opt = document.createElement('option'); opt.value = op; opt.textContent = op; variableOperation.appendChild(opt);
      });
      variableOperation.value = action.operation || 'set';
      const variableValue = document.createElement('input'); variableValue.type='text'; variableValue.placeholder='値'; variableValue.value = action.value !== undefined ? action.value : '';
      
      const del = document.createElement('button'); del.className = 'btn'; del.textContent = '削除';
      
      function updateAction(){
        action.type = typeSel.value;
        action.itemId = itemId.value;
        action.quantity = parseInt(quantity.value) || 1;
        action.consume = consumeInput.checked;
        
        // オーディオ関連の設定
        if (action.type.startsWith('play_') || action.type.startsWith('stop_')) {
          action.url = audioUrl.value;
          action.volume = parseFloat(audioVolume.value) || 1.0;
          action.loop = audioLoopInput.checked;
          action.fadeIn = audioFadeInInput.checked;
          action.crossfade = audioCrossfadeInput.checked;
          action.fadeOut = audioFadeOutInput.checked;
        }
        
        // 効果設定
        if (!action.effect) action.effect = {};
        action.effect.type = effectTypeSel.value;
        if (effectTypeSel.value === 'show_text') {
          action.effect.text = effectInput.value;
        } else if (effectTypeSel.value === 'set_variable') {
          action.effect.key = effectInput.value;
          action.effect.value = true; // 簡易版
        }
        
        // 変数操作設定
        if (typeSel.value === 'set_variable') {
          action.key = variableKey.value;
          action.operation = variableOperation.value;
          const val = variableValue.value;
          action.value = val === '' ? undefined : (isNaN(val) ? val : parseFloat(val));
        }
        
        setDirty(true);
        notifySpecUpdated();
      }
      
      // イベントリスナー設定
      typeSel.addEventListener('change', () => {
        // use_item選択時は追加フィールドを表示
        const isUseItem = typeSel.value === 'use_item';
        consumeCheck.style.display = isUseItem ? 'block' : 'none';
        effectTypeSel.style.display = isUseItem ? 'block' : 'none';
        effectInput.style.display = isUseItem ? 'block' : 'none';
        
        // set_variable選択時は変数字段を表示
        const isSetVariable = typeSel.value === 'set_variable';
        variableKey.style.display = isSetVariable ? 'block' : 'none';
        variableOperation.style.display = isSetVariable ? 'block' : 'none';
        variableValue.style.display = isSetVariable ? 'block' : 'none';
        
        // オーディオ関連のフィールドを表示
        const isAudioAction = typeSel.value.startsWith('play_') || typeSel.value.startsWith('stop_');
        audioUrl.style.display = isAudioAction ? 'block' : 'none';
        audioVolume.style.display = isAudioAction ? 'block' : 'none';
        audioVolumeLabel.style.display = isAudioAction ? 'block' : 'none';
        audioLoop.style.display = (isAudioAction && typeSel.value.includes('bgm')) ? 'block' : 'none';
        audioFadeIn.style.display = (isAudioAction && typeSel.value === 'play_bgm') ? 'block' : 'none';
        audioCrossfade.style.display = (isAudioAction && typeSel.value === 'play_bgm') ? 'block' : 'none';
        audioFadeOut.style.display = (isAudioAction && typeSel.value === 'stop_bgm') ? 'block' : 'none';
        
        updateAction();
      });
      
      itemId.addEventListener('input', updateAction);
      quantity.addEventListener('input', updateAction);
      consumeInput.addEventListener('change', updateAction);
      effectTypeSel.addEventListener('change', updateAction);
      effectInput.addEventListener('input', updateAction);
      variableKey.addEventListener('input', updateAction);
      variableOperation.addEventListener('change', updateAction);
      variableValue.addEventListener('input', updateAction);
      
      // オーディオ関連のイベントリスナー
      audioUrl.addEventListener('input', updateAction);
      audioVolume.addEventListener('input', () => {
        audioVolumeLabel.textContent = `音量: ${Math.round(audioVolume.value * 100)}%`;
        updateAction();
      });
      audioLoopInput.addEventListener('change', updateAction);
      audioFadeInInput.addEventListener('change', updateAction);
      audioCrossfadeInput.addEventListener('change', updateAction);
      audioFadeOutInput.addEventListener('change', updateAction);
      del.addEventListener('click', () => { 
        node.actions.splice(idx, 1); 
        renderActions(node); 
        setDirty(true); 
        notifySpecUpdated(); 
      });
      
      // 初期表示設定
      const isUseItem = action.type === 'use_item';
      consumeCheck.style.display = isUseItem ? 'block' : 'none';
      effectTypeSel.style.display = isUseItem ? 'block' : 'none';
      effectInput.style.display = isUseItem ? 'block' : 'none';
      
      const isSetVariable = action.type === 'set_variable';
      variableKey.style.display = isSetVariable ? 'block' : 'none';
      variableOperation.style.display = isSetVariable ? 'block' : 'none';
      variableValue.style.display = isSetVariable ? 'block' : 'none';
      
      // オーディオ関連の初期表示設定
      const isAudioAction = action.type.startsWith('play_') || action.type.startsWith('stop_');
      audioUrl.style.display = isAudioAction ? 'block' : 'none';
      audioVolume.style.display = isAudioAction ? 'block' : 'none';
      audioVolumeLabel.style.display = isAudioAction ? 'block' : 'none';
      audioLoop.style.display = (isAudioAction && action.type.includes('bgm')) ? 'block' : 'none';
      audioFadeIn.style.display = (isAudioAction && action.type === 'play_bgm') ? 'block' : 'none';
      audioCrossfade.style.display = (isAudioAction && action.type === 'play_bgm') ? 'block' : 'none';
      audioFadeOut.style.display = (isAudioAction && action.type === 'stop_bgm') ? 'block' : 'none';
      
      row.append(typeSel, itemIdContainer, quantity, consumeCheck, effectTypeSel, effectInput, variableKey, variableOperation, variableValue, audioUrl, audioVolumeLabel, audioVolume, audioLoop, audioFadeIn, audioCrossfade, audioFadeOut, del);
      actions.appendChild(row);
    });
  }

  function renderChoices(node){
    const { choices } = readUIRefs();
    choices.innerHTML = '';
    const arr = Array.isArray(node.choices) ? node.choices : [];
    arr.forEach((c, idx) => {
      const row = document.createElement('div'); row.className = 'ne-choice-row';
      
      const label = document.createElement('input'); label.type='text'; label.placeholder='ラベル'; label.value = c.label || '';
      const target = document.createElement('input'); target.type='text'; target.placeholder='target:id'; target.value = c.target || '';
      target.setAttribute('list', 'ne-node-id-list');
      
      // ドラッグ&ドロップでノードIDを挿入可能にする
      target.addEventListener('dragover', (e) => {
        e.preventDefault();
        target.classList.add('drag-over');
      });
      target.addEventListener('dragleave', (e) => {
        e.preventDefault();
        target.classList.remove('drag-over');
      });
      target.addEventListener('drop', (e) => {
        e.preventDefault();
        target.classList.remove('drag-over');
        const data = e.dataTransfer.getData('text/plain');
        if(data) {
          target.value = data;
          // 入力イベントをトリガー
          target.dispatchEvent(new Event('input'));
          alert('ノードIDを挿入しました。');
        }
      });
      
      // Conditions section
      const conditionsContainer = document.createElement('div'); conditionsContainer.className = 'ne-conditions';
      const conditionsHeader = document.createElement('div'); conditionsHeader.className = 'ne-conditions-header';
      const conditionsToggle = document.createElement('button'); conditionsToggle.className = 'btn btn-sm'; conditionsToggle.textContent = '条件';
      const conditionsList = document.createElement('div'); conditionsList.className = 'ne-conditions-list'; conditionsList.hidden = true;
      
      // Render conditions
      function renderConditions(){
        conditionsList.innerHTML = '';
        const condArr = Array.isArray(c.conditions) ? c.conditions : [];
        condArr.forEach((cond, condIdx) => {
          const condRow = document.createElement('div'); condRow.className = 'ne-condition-row';
          
          const condTypeSel = document.createElement('select'); condTypeSel.className = 'ne-condition-type';
          const condTypes = ['has_item', 'item_count', 'inventory_empty', 'inventory_full', 'variable_equals', 'variable_exists'];
          condTypes.forEach(type => {
            const opt = document.createElement('option'); opt.value = type; opt.textContent = type; condTypeSel.appendChild(opt);
          });
          condTypeSel.value = cond.type || '';
          
          const condItemId = document.createElement('input'); condItemId.type='text'; condItemId.placeholder='itemId/変数キー'; condItemId.value = cond.itemId || cond.key || '';
          const condOperator = document.createElement('select'); condOperator.className = 'ne-condition-operator';
          ['>=', '>', '==', '!=', '<=', '<', '===', '!=='].forEach(op => {
            const opt = document.createElement('option'); opt.value = op; opt.textContent = op; condOperator.appendChild(opt);
          });
          condOperator.value = cond.operator || '>=';
          const condCount = document.createElement('input'); condCount.type='text'; condCount.placeholder='値'; condCount.value = cond.count !== undefined ? cond.count : (cond.value !== undefined ? cond.value : 0);
          const condDel = document.createElement('button'); condDel.className = 'btn btn-sm'; condDel.textContent = '×';
          
          function updateCondition(){
            cond.type = condTypeSel.value;
            if (cond.type.startsWith('variable_')) {
              cond.key = condItemId.value;
              cond.operator = condOperator.value;
              cond.value = condCount.value === '' ? undefined : (isNaN(condCount.value) ? condCount.value : parseFloat(condCount.value));
              delete cond.itemId;
              delete cond.count;
            } else {
              cond.itemId = condItemId.value;
              cond.operator = condOperator.value;
              cond.count = parseInt(condCount.value) || 0;
              delete cond.key;
              delete cond.value;
            }
            setDirty(true);
            notifySpecUpdated();
          }
          
          condTypeSel.addEventListener('change', () => {
            const isVariable = condTypeSel.value.startsWith('variable_');
            const isVariableEquals = condTypeSel.value === 'variable_equals';
            
            condItemId.placeholder = isVariable ? '変数キー' : 'itemId';
            condOperator.style.display = isVariableEquals ? 'block' : 'none';
            condCount.placeholder = isVariable ? '比較値' : '0';
            
            updateCondition();
          });
          
          condItemId.addEventListener('input', updateCondition);
          condOperator.addEventListener('change', updateCondition);
          condCount.addEventListener('input', updateCondition);
          condDel.addEventListener('click', () => { 
            c.conditions.splice(condIdx, 1); 
            renderConditions(); 
            setDirty(true); 
            notifySpecUpdated(); 
          });
          
          // 初期表示設定
          const isVariable = cond.type && cond.type.startsWith('variable_');
          const isVariableEquals = cond.type === 'variable_equals';
          condItemId.placeholder = isVariable ? '変数キー' : 'itemId';
          condOperator.style.display = isVariableEquals ? 'block' : 'none';
          condCount.placeholder = isVariable ? '比較値' : '0';
          
          condRow.append(condTypeSel, condItemId, condOperator, condCount, condDel);
          conditionsList.appendChild(condRow);
        });
        
        // Add condition button
        const addCondBtn = document.createElement('button'); addCondBtn.className = 'btn btn-sm'; addCondBtn.textContent = '+ 条件追加';
        addCondBtn.addEventListener('click', () => {
          if(!Array.isArray(c.conditions)) c.conditions = [];
          c.conditions.push({ type: 'has_item' });
          renderConditions();
          setDirty(true);
          notifySpecUpdated();
        });
        conditionsList.appendChild(addCondBtn);
      }
      
      conditionsToggle.addEventListener('click', () => {
        conditionsList.hidden = !conditionsList.hidden;
        renderConditions();
      });
      
      const del = document.createElement('button'); del.className = 'btn'; del.textContent = '削除';
      const up = document.createElement('button'); up.className = 'btn'; up.textContent = '↑';
      const down = document.createElement('button'); down.className = 'btn'; down.textContent = '↓';
      
      label.addEventListener('input', () => { c.label = label.value; setDirty(true); notifySpecUpdated(); });
      function applyTargetValidity(){
        const known = !!findNodeById(specData.nodes, target.value);
        const invalid = !!target.value && !known;
        row.classList.toggle('invalid', invalid);
      }
      target.addEventListener('input', () => { c.target = target.value; applyTargetValidity(); setDirty(true); refreshUnresolvedPanel(); notifySpecUpdated(); });
      del.addEventListener('click', () => { removeChoice(node, idx); renderChoices(node); setDirty(true); refreshUnresolvedPanel(); notifySpecUpdated(); });
      up.addEventListener('click', () => { moveChoice(node, idx, Math.max(0, idx-1)); renderChoices(node); setDirty(true); notifySpecUpdated(); });
      down.addEventListener('click', () => { moveChoice(node, idx, Math.min(arr.length-1, idx+1)); renderChoices(node); setDirty(true); notifySpecUpdated(); });
      
      row.append(label, target, conditionsContainer, up, down, del);
      conditionsContainer.append(conditionsHeader, conditionsList);
      conditionsHeader.appendChild(conditionsToggle);
      choices.appendChild(row);
      applyTargetValidity();
    });
  }

  function refreshStartSelect(){
    const { startSel } = readUIRefs(); if(!startSel) return;
    startSel.innerHTML = '';
    (specData.nodes||[]).forEach(n => {
      const opt = document.createElement('option'); opt.value = n.id; opt.textContent = n.id; startSel.appendChild(opt);
    });
    if(specData?.meta?.start && findNodeById(specData.nodes, specData.meta.start)) startSel.value = specData.meta.start;
  }

  function refreshNodeIdDatalist(){
    const dl = document.getElementById('ne-node-id-list'); if(!dl) return;
    dl.innerHTML = '';
    (specData.nodes||[]).forEach(n => { const opt = document.createElement('option'); opt.value = n.id; dl.appendChild(opt); });
  }

  function refreshExportList(){
    const { exportMulti } = readUIRefs(); if(!exportMulti) return;
    exportMulti.innerHTML = '';
    (specData.nodes||[]).forEach(n => { const opt = document.createElement('option'); opt.value = n.id; opt.textContent = n.id; exportMulti.appendChild(opt); });
  }

  async function loadFromStorage(){
    try {
      if(dirty && !confirm('未保存の変更があります。破棄して取り込みますか？')) return;
      const raw = window.StorageUtil?.loadJSON?.('agp_game_data', null) || null;
      if(!raw){ alert('agp_game_data が見つかりません。プレイ用JSONをインポートしてください。'); return; }
      let spec = null;
      if(Array.isArray(raw.nodes)){
        // spec-like already
        spec = normalizeSpec(raw);
      } else {
        // engine -> spec
        spec = window.Converters?.engineToSpec ? window.Converters.engineToSpec(raw) : null;
        if(!spec) throw new Error('engineToSpec 変換に失敗');
      }
      specData = normalizeSpec(spec);
      refreshNodeList(specData.meta?.start || (specData.nodes[0]?.id));
      refreshExportList();
      refreshNodeIdDatalist();
      refreshUnresolvedPanel();
      setDirty(false);
      alert('ノード編集に取込みました');
      notifySpecUpdated();
    } catch(e){ console.error('NodeEditor.load', e); alert('取込に失敗しました'); }
  }

  function validateSpec(){
    if(window.Validator?.validateGameSpec){
      const v = window.Validator.validateGameSpec(specData);
      try {
        const panel = document.getElementById('validation-panel');
        const listEl = document.getElementById('validation-list');
        if(panel && listEl){
          listEl.innerHTML = '';
          // エラーのみ表示（警告は未解決targetパネルで可視化）
          (v.errors||[]).forEach(msg => { const li=document.createElement('li'); li.className='err'; li.textContent = msg; listEl.appendChild(li); });
          // 未解決以外の警告はここに表示
          const warnDetails = Array.isArray(v.warningDetails) ? v.warningDetails : [];
          warnDetails.filter(w => w && w.code !== 'WARN_UNRESOLVED_TARGET').forEach(w => {
            const li=document.createElement('li'); li.className='warn'; li.textContent = w.message; listEl.appendChild(li);
          });
          panel.hidden = (listEl.children.length === 0);
        }
      } catch{}
      // 警告はalertも出さず、未解決targetパネルを更新
      refreshUnresolvedPanel();
    } else {
      alert('Validator が見つかりません');
    }
  }

  function saveToStorage(){
    try {
      const engine = window.Converters?.normalizeSpecToEngine ? window.Converters.normalizeSpecToEngine(specData) : null;
      if(!engine) throw new Error('normalizeSpecToEngine 変換に失敗');
      window.StorageUtil?.saveJSON?.('agp_game_data', engine);
      setDirty(false);
      alert('適用保存しました（play.html で反映）');
    } catch(e){ console.error('NodeEditor.save', e); alert('適用保存に失敗しました'); }
  }

  function exportJson(){
    try {
      const blob = new Blob([JSON.stringify(specData, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'game-spec.json'; a.click();
      URL.revokeObjectURL(a.href);
    } catch(e){ console.error('NodeEditor.export', e); alert('JSON出力に失敗しました'); }
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
            alert('画像を挿入しました。保存してください。');
          };
          reader.readAsDataURL(file);
        } else {
          alert('画像ファイルのみドロップ可能です。');
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
            alert('画像を挿入しました。保存してください。');
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

    const { sel, startSel, id, title, text, image } = readUIRefs();

    if(sel) sel.addEventListener('change', () => renderNodeForm(sel.value));
    if(startSel) startSel.addEventListener('change', () => { if(!specData.meta) specData.meta = {}; specData.meta.start = startSel.value; setDirty(true); notifySpecUpdated(); });

    if(btnAddNode) btnAddNode.addEventListener('click', () => {
      const ids = (specData.nodes||[]).map(n => n.id);
      const base = 'node:new';
      const nid = ensureUniqueId(base, ids);
      const node = { id: nid, title: '', text: '', choices: [] };
      upsertNode(specData.nodes, node);
      refreshNodeList(nid);
      refreshExportList();
      refreshNodeIdDatalist();
      setDirty(true);
      refreshUnresolvedPanel();
      notifySpecUpdated();
    });

    if(btnRemoveNode) btnRemoveNode.addEventListener('click', () => {
      const { sel } = readUIRefs(); if(!sel || !sel.value) return;
      if(!confirm(`ノード ${sel.value} を削除しますか？`)) return;
      removeNode(specData.nodes, sel.value);
      refreshNodeList(specData.nodes[0]?.id);
      refreshExportList();
      refreshNodeIdDatalist();
      setDirty(true);
      refreshUnresolvedPanel();
      notifySpecUpdated();
    });

    if(id) id.addEventListener('change', () => {
      const { sel } = readUIRefs(); const curId = sel.value; const node = findNodeById(specData.nodes, curId); if(!node) return;
      const ids = (specData.nodes||[]).filter(n=>n!==node).map(n => n.id);
      let nv = id.value.trim(); if(!nv) nv = ensureUniqueId('node:new', ids);
      // 重複IDの場合は自動でユニーク化
      if(ids.includes(nv)) nv = ensureUniqueId(nv, ids);
      if(nv !== node.id){
        // start の更新（もし同一なら）
        if(specData?.meta?.start === node.id){ specData.meta.start = nv; }
        // 参照更新（target）
        const oldId = node.id; const newId = nv;
        let refCount = 0;
        try { refCount = renameReferences(specData, oldId, newId); } catch{}
        if(refCount>0){
          const ok = confirm(`IDを変更しました。${refCount} 件の参照(target)を更新します。よろしいですか？`);
          if(!ok){ // revert references if user cancels
            renameReferences(specData, newId, oldId);
          }
        }
        node.id = nv;
        refreshNodeList(nv);
        refreshExportList();
        refreshNodeIdDatalist();
        refreshUnresolvedPanel();
        // 入力欄にも反映
        const { id: idInput } = readUIRefs(); if(idInput) idInput.value = nv;
        setDirty(true);
        notifySpecUpdated();
      }
    });
    if(text) text.addEventListener('input', () => {
      const { sel } = readUIRefs(); const node = findNodeById(specData.nodes, sel.value); if(!node) return; node.text = text.value;
      setDirty(true);
      notifySpecUpdated();
    });

    if(image) image.addEventListener('input', () => {
      const { sel } = readUIRefs(); const node = findNodeById(specData.nodes, sel.value); if(!node) return; node.image = image.value.trim() || undefined;
      setDirty(true);
      notifySpecUpdated();
    });

    // ドラッグ&ドロップ処理
    setupDragAndDrop();

    if(btnAddChoice) btnAddChoice.addEventListener('click', () => {
      const { sel } = readUIRefs(); const node = findNodeById(specData.nodes, sel.value); if(!node) return;
      addChoice(node, { label:'', target:'' });
      renderChoices(node);
      setDirty(true);
      notifySpecUpdated();
    });

    const actionTypeDropdown = document.getElementById('ne-action-type-dropdown');
    if(actionTypeDropdown) actionTypeDropdown.addEventListener('change', () => {
      const actionType = actionTypeDropdown.value;
      if(!actionType) return;
      
      const { sel } = readUIRefs(); const node = findNodeById(specData.nodes, sel.value); if(!node) return;
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
      renderActions(node);
      setDirty(true);
      notifySpecUpdated();
      
      // ドロップダウンをリセット
      actionTypeDropdown.value = '';
    });

    // Partial export UI bindings
    const { exportMulti, exportSelectAll, exportSelectNone, exportPartial } = readUIRefs();
    if(exportSelectAll) exportSelectAll.addEventListener('click', () => { if(!exportMulti) return; for(const opt of exportMulti.options){ opt.selected = true; } });
    if(exportSelectNone) exportSelectNone.addEventListener('click', () => { if(!exportMulti) return; for(const opt of exportMulti.options){ opt.selected = false; } });
    if(exportPartial) exportPartial.addEventListener('click', () => {
      if(!exportMulti) return;
      const seed = Array.from(exportMulti.selectedOptions).map(o => o.value);
      if(seed.length === 0){ alert('少なくとも1つノードを選択してください'); return; }
      const sub = collectSubgraph(specData, seed);
      try {
        const blob = new Blob([JSON.stringify(sub, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'game-spec.partial.json'; a.click(); URL.revokeObjectURL(a.href);
      } catch(e){ console.error('exportPartial', e); alert('部分エクスポートに失敗しました'); }
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

  // Unresolved targets summary
  function computeUnresolvedTargets(spec){
    const out = [];
    const nodes = (spec && Array.isArray(spec.nodes)) ? spec.nodes : [];
    nodes.forEach(n => {
      const arr = Array.isArray(n.choices) ? n.choices : [];
      arr.forEach((c, idx) => {
        if(!c || !c.target) return;
        if(!findNodeById(nodes, c.target)) out.push({ fromId: n.id, index: idx, target: c.target });
      });
    });
    return out;
  }
  function refreshUnresolvedPanel(){
    const { unresolvedPanel, unresolvedList } = readUIRefs(); if(!unresolvedPanel || !unresolvedList) return;
    const items = computeUnresolvedTargets(specData);
    unresolvedList.innerHTML = '';
    items.forEach(it => {
      const li = document.createElement('li');
      li.textContent = `${it.fromId} → ${it.target} (#${it.index+1})`;
      li.addEventListener('click', () => {
        const { sel } = readUIRefs(); if(sel){ sel.value = it.fromId; renderNodeForm(it.fromId); }
      });
      unresolvedList.appendChild(li);
    });
    unresolvedPanel.hidden = items.length === 0;
  }

  function emitEvent(name, detail){
    try { document.dispatchEvent(new CustomEvent(name, { detail })); } catch{}
  }

  function notifySelectionChanged(nodeId){ emitEvent('agp-node-selection-changed', { nodeId }); }
  function notifySpecUpdated(){ emitEvent('agp-spec-updated', {}); }

  // Partial export: collect reachable subgraph from seed IDs
  function collectSubgraph(spec, seedIds){
    const base = normalizeSpec(JSON.parse(JSON.stringify(spec||{})));
    const nodes = base.nodes;
    const idMap = new Map(nodes.map((n,i)=>[n.id, i]));
    const seen = new Set();
    const queue = [];
    (seedIds||[]).forEach(id => { if(idMap.has(id)){ seen.add(id); queue.push(id); } });
    while(queue.length){
      const cur = queue.shift();
      const n = nodes[idMap.get(cur)];
      (n.choices||[]).forEach(c => { if(c && c.target && idMap.has(c.target) && !seen.has(c.target)){ seen.add(c.target); queue.push(c.target); } });
    }
    const filtered = nodes.filter(n => seen.has(n.id));
    return { version: base.version || '1.0', meta: { ...(base.meta||{}), start: (seedIds && seedIds[0]) || base.meta?.start || (filtered[0]?.id || 'start') }, nodes: filtered };
  }

  // Bootstrapping
  document.addEventListener('DOMContentLoaded', () => {
    if(!document.getElementById('node-editor')) return;
    specData = normalizeSpec(specData);
    bindUI();
    refreshNodeList();
    refreshExportList();
    refreshNodeIdDatalist();
    refreshUnresolvedPanel();
    setDirty(false);
  });

  // Expose utils for tests
  window.NodeEditorUtils = { ensureUniqueId, findNodeById, upsertNode, removeNode, addChoice, removeChoice, moveChoice, renameReferences, computeUnresolvedTargets, collectSubgraph, normalizeSpec };
  // Lightweight public API for other panels (e.g., Mermaid preview)
  window.NodeEditorAPI = { getSpec: () => normalizeSpec(specData) };

})();
