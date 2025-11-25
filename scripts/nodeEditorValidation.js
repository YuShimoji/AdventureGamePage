(function(){
  // Node Editor Validation - Validation logic extracted from nodeEditorLogicManager

  function validateSpec(){
    if(window.Validator?.validateGameSpec){
      const v = window.Validator.validateGameSpec(window.NodeEditorUIManager.getSpecData());
      try {
        const panel = document.getElementById('validation-panel');
        const listEl = document.getElementById('validation-list');
        if(panel && listEl){
          listEl.innerHTML = '';
          (v.errors||[]).forEach(msg => {
            const li = document.createElement('li');
            li.className = 'err';
            li.textContent = msg;
            listEl.appendChild(li);
          });
          const warnDetails = Array.isArray(v.warningDetails) ? v.warningDetails : [];
          warnDetails.filter(w => w && w.code !== 'WARN_UNRESOLVED_TARGET').forEach(w => {
            const li = document.createElement('li');
            li.className = 'warn';
            li.textContent = w.message;
            listEl.appendChild(li);
          });
          panel.hidden = (listEl.children.length === 0);
        }
      } catch(e){ console.warn('validateSpec UI update failed', e); }
      window.NodeEditorUIManager.refreshUnresolvedPanel();
    } else {
      performBasicValidation();
    }
  }

  function performBasicValidation(){
    const specData = window.NodeEditorUIManager.getSpecData();
    const errors = [];
    const warnings = [];

    if(!specData?.meta?.start){
      errors.push('開始ノードが設定されていません');
    } else if(!specData.nodes?.some(n => n.id === specData.meta.start)){
      errors.push(`開始ノード "${specData.meta.start}" が見つかりません`);
    }

    specData.nodes?.forEach(node => {
      if(!node.title && !node.text){
        warnings.push(`ノード "${node.id}" にタイトルと本文がありません`);
      }
      node.choices?.forEach((choice, idx) => {
        if(!choice.target && !choice.to){
          errors.push(`ノード "${node.id}" の選択肢 ${idx + 1} にターゲットが設定されていません`);
        }
      });
    });

    if(specData?.meta?.start){
      const reachable = new Set();
      const queue = [specData.meta.start];
      reachable.add(specData.meta.start);

      while(queue.length){
        const current = queue.shift();
        const node = specData.nodes?.find(n => n.id === current);
        node?.choices?.forEach(choice => {
          const target = choice.target || choice.to;
          if(target && !reachable.has(target) && specData.nodes?.some(n => n.id === target)){
            reachable.add(target);
            queue.push(target);
          }
        });
      }

      specData.nodes?.forEach(node => {
        if(node.id && !reachable.has(node.id)){
          warnings.push(`ノード "${node.id}" は開始ノードから到達できません`);
        }
      });
    }

    const panel = document.getElementById('validation-panel');
    const listEl = document.getElementById('validation-list');
    if(panel && listEl){
      listEl.innerHTML = '';
      errors.forEach(msg => {
        const li = document.createElement('li');
        li.className = 'err';
        li.textContent = msg;
        listEl.appendChild(li);
      });
      warnings.forEach(msg => {
        const li = document.createElement('li');
        li.className = 'warn';
        li.textContent = msg;
        listEl.appendChild(li);
      });
      panel.hidden = (listEl.children.length === 0);
    }
  }

  function validateField(fieldName, value, nodeId){
    const errors = [];
    const warnings = [];

    switch(fieldName){
      case 'id':
        if(!value || !value.trim()){
          errors.push('ノードIDは必須です');
        } else if(window.NodeEditorUIManager.getSpecData().nodes?.some(n => n.id === value.trim() && n.id !== nodeId)){
          errors.push('ノードIDが重複しています');
        }
        break;
      case 'title':
        if(!value || !value.trim()){
          warnings.push('ノードにタイトルを設定することを推奨します');
        }
        break;
      case 'text':
        if(!value || !value.trim()){
          warnings.push('ノードに本文を設定することを推奨します');
        }
        break;
      case 'choice_target':
        if(!value || !value.trim()){
          errors.push('選択肢のターゲットは必須です');
        } else if(!window.NodeEditorUIManager.getSpecData().nodes?.some(n => n.id === value.trim())){
          warnings.push(`ターゲット "${value.trim()}" のノードが見つかりません`);
        }
        break;
    }

    return { errors, warnings };
  }

  function updateValidationStatus(){
    const validationPanel = document.getElementById('validation-panel');
    if(validationPanel && !validationPanel.hidden){
      validateSpec();
    }
  }

  // Expose validation module
  window.NodeEditorValidation = {
    validateSpec,
    performBasicValidation,
    validateField,
    updateValidationStatus
  };

})();
