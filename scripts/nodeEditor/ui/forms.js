(function(){
  // Node Editor Forms - Renders node form elements (actions, choices, conditions)

  const { readUIRefs } = window.NodeEditorUIRefs || {};

  function renderActions(node, specData, callbacks){
    const { actions } = readUIRefs(); if(!actions) return;
    const { setDirty, notifySpecUpdated } = callbacks;
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
      const itemIdDropZone = document.createElement('div'); itemIdDropZone.className = 'ne-action-item-drop-zone'; itemIdDropZone.textContent = 'アイテムをドロップ';
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
          ToastManager.info('アイテムIDを挿入しました。');
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
        renderActions(node, specData, callbacks);
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

  function renderChoices(node, specData, callbacks){
    const { choices } = readUIRefs(); if(!choices) return;
    const { setDirty, notifySpecUpdated, refreshUnresolvedPanel } = callbacks;
    choices.innerHTML = '';
    const arr = Array.isArray(node.choices) ? node.choices : [];
    arr.forEach((choice, idx) => {
      const c = choice; // Alias for easier reference
      const row = document.createElement('div'); row.className = 'ne-choice-row';

      const label = document.createElement('input'); label.type='text'; label.placeholder='選択肢のテキスト'; label.value = c.label || c.text || '';
      const target = document.createElement('input'); target.type='text'; target.placeholder='ターゲットノードID'; target.value = c.target || c.to || '';
      target.setAttribute('list', 'ne-node-id-list');

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
        const known = !!window.NodeEditorUtils.findNodeById(specData.nodes, target.value);
        const invalid = !!target.value && !known;
        row.classList.toggle('invalid', invalid);
      }
      target.addEventListener('input', () => { c.target = target.value; applyTargetValidity(); setDirty(true); refreshUnresolvedPanel(); notifySpecUpdated(); });
      del.addEventListener('click', () => { window.NodeEditorUtils.removeChoice(node, idx); renderChoices(node, specData, callbacks); setDirty(true); refreshUnresolvedPanel(); notifySpecUpdated(); });
      up.addEventListener('click', () => { window.NodeEditorUtils.moveChoice(node, idx, Math.max(0, idx-1)); renderChoices(node, specData, callbacks); setDirty(true); notifySpecUpdated(); });
      down.addEventListener('click', () => { window.NodeEditorUtils.moveChoice(node, idx, Math.min(arr.length-1, idx+1)); renderChoices(node, specData, callbacks); setDirty(true); notifySpecUpdated(); });

      row.append(label, target, conditionsContainer, up, down, del);
      conditionsContainer.append(conditionsHeader, conditionsList);
      conditionsHeader.appendChild(conditionsToggle);
      choices.appendChild(row);
      applyTargetValidity();
    });
  }

  window.NodeEditorForms = {
    renderActions,
    renderChoices
  };
})();
