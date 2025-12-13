(function () {
  // WYSIWYG Story Editor Conditions - Condition editor modal

  function createConditionEditorModal(state) {
    const modal = document.createElement('div');
    modal.id = 'condition-editor-modal';
    modal.className = 'condition-editor-modal';
    modal.innerHTML = `
      <div class="condition-editor-overlay">
        <div class="condition-editor-content">
          <div class="condition-editor-header">
            <h3>条件分岐エディタ</h3>
            <button class="btn btn-ghost btn-sm" id="condition-editor-close">✕</button>
          </div>
          <div class="condition-editor-body">
            <div class="condition-builder">
              <div class="condition-rule">
                <select class="condition-variable">
                  <option value="">変数を選択...</option>
                  <option value="inventory">インベントリ</option>
                  <option value="flags">フラグ</option>
                  <option value="variables">変数</option>
                </select>
                <select class="condition-operator">
                  <option value="has">持っている</option>
                  <option value="not_has">持っていない</option>
                  <option value="equals">等しい</option>
                  <option value="not_equals">等しくない</option>
                  <option value="greater">より大きい</option>
                  <option value="less">より小さい</option>
                </select>
                <input type="text" class="condition-value" placeholder="値" />
              </div>
              <div class="condition-actions">
                <button class="btn" id="add-condition-rule">条件を追加</button>
                <button class="btn" id="remove-condition-rule">条件を削除</button>
              </div>
            </div>
            <div class="condition-outcomes">
              <h4>分岐先</h4>
              <div class="outcome-item">
                <label>条件が真の場合:</label>
                <select class="outcome-true">
                  <option value="">ノードを選択...</option>
                </select>
              </div>
              <div class="outcome-item">
                <label>条件が偽の場合:</label>
                <select class="outcome-false">
                  <option value="">ノードを選択...</option>
                </select>
              </div>
            </div>
          </div>
          <div class="condition-editor-footer">
            <button class="btn btn-primary" id="condition-editor-save">保存</button>
            <button class="btn" id="condition-editor-cancel">キャンセル</button>
          </div>
        </div>
      </div>
    `;

    modal.style.display = 'none';
    document.body.appendChild(modal);

    initConditionEditorEvents(state);
  }

  function initConditionEditorEvents(state) {
    const modal = document.getElementById('condition-editor-modal');
    const closeBtn = document.getElementById('condition-editor-close');
    const saveBtn = document.getElementById('condition-editor-save');
    const cancelBtn = document.getElementById('condition-editor-cancel');
    const addRuleBtn = document.getElementById('add-condition-rule');
    const removeRuleBtn = document.getElementById('remove-condition-rule');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => saveCondition(state));
    }

    if (addRuleBtn) {
      addRuleBtn.addEventListener('click', addConditionRule);
    }

    if (removeRuleBtn) {
      removeRuleBtn.addEventListener('click', removeConditionRule);
    }

    const overlay = modal.querySelector('.condition-editor-overlay');
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) {
          modal.style.display = 'none';
        }
      });
    }
  }

  function showConditionEditor(node, state) {
    const modal = document.getElementById('condition-editor-modal');
    if (!modal) return;

    const nodeOptions = state.currentStory.nodes
      .map(n => `<option value="${n.id}">${n.title} (${n.id})</option>`)
      .join('');

    const trueSelect = modal.querySelector('.outcome-true');
    const falseSelect = modal.querySelector('.outcome-false');

    if (trueSelect)
      trueSelect.innerHTML = `<option value="">ノードを選択...</option>${nodeOptions}`;
    if (falseSelect)
      falseSelect.innerHTML = `<option value="">ノードを選択...</option>${nodeOptions}`;

    loadConditionData(node);

    modal._editingNode = node;
    modal.style.display = 'flex';
  }

  function loadConditionData(node) {
    // Load existing condition data into the editor
    // Implementation for populating the condition editor with existing rules

    const modal = document.getElementById('condition-editor-modal');
    if (!modal || !node) return;

    const builder = modal.querySelector('.condition-builder');
    if (!builder) return;

    const actionsEl = builder.querySelector('.condition-actions');
    const ruleEls = Array.from(builder.querySelectorAll('.condition-rule'));
    ruleEls.forEach((el, idx) => {
      if (idx > 0) el.remove();
    });

    const conditions = Array.isArray(node.conditions) ? node.conditions : [];
    const normalized = conditions.length > 0 ? conditions : [{}];

    const ensureRuleElement = index => {
      const currentRules = builder.querySelectorAll('.condition-rule');
      if (currentRules[index]) return currentRules[index];
      if (!actionsEl) return null;

      const rule = document.createElement('div');
      rule.className = 'condition-rule';
      rule.innerHTML = `
      <select class="condition-variable">
        <option value="">変数を選択...</option>
        <option value="inventory">インベントリ</option>
        <option value="flags">フラグ</option>
        <option value="variables">変数</option>
      </select>
      <select class="condition-operator">
        <option value="has">持っている</option>
        <option value="not_has">持っていない</option>
        <option value="equals">等しい</option>
        <option value="not_equals">等しくない</option>
        <option value="greater">より大きい</option>
        <option value="less">より小さい</option>
      </select>
      <input type="text" class="condition-value" placeholder="値" />
    `;
      builder.insertBefore(rule, actionsEl);
      return rule;
    };

    normalized.forEach((cond, idx) => {
      const ruleEl = ensureRuleElement(idx);
      if (!ruleEl) return;

      const variableEl = ruleEl.querySelector('.condition-variable');
      const operatorEl = ruleEl.querySelector('.condition-operator');
      const valueEl = ruleEl.querySelector('.condition-value');

      const variable = (cond && cond.variable) || '';
      const operator = (cond && cond.operator) || '';
      const value = (cond && cond.value) || '';

      if (variableEl) variableEl.value = variable;
      if (operatorEl) operatorEl.value = operator;
      if (valueEl) valueEl.value = value;
    });

    const trueSelect = modal.querySelector('.outcome-true');
    const falseSelect = modal.querySelector('.outcome-false');

    const firstCond = normalized[0] || {};
    const trueOutcome = firstCond.trueOutcome || firstCond.target || '';
    const falseOutcome = firstCond.falseOutcome || '';

    if (trueSelect) trueSelect.value = trueOutcome;
    if (falseSelect) falseSelect.value = falseOutcome;
  }

  function saveCondition(state) {
    const modal = document.getElementById('condition-editor-modal');
    const node = modal._editingNode;
    if (!node) return;

    const trueOutcome = modal.querySelector('.outcome-true').value;
    const falseOutcome = modal.querySelector('.outcome-false').value;

    const rules = Array.from(modal.querySelectorAll('.condition-rule'))
      .map(ruleEl => {
        const variable = ruleEl.querySelector('.condition-variable')?.value || '';
        const operator = ruleEl.querySelector('.condition-operator')?.value || '';
        const value = ruleEl.querySelector('.condition-value')?.value || '';

        return {
          variable,
          operator,
          value,
          trueOutcome,
          falseOutcome,
        };
      })
      .filter(r => r.variable || r.operator || r.value || r.trueOutcome || r.falseOutcome);

    node.conditions = rules;

    modal.style.display = 'none';

    if (window.WYSIWYGStoryEditorCanvas) {
      window.WYSIWYGStoryEditorCanvas.renderCanvas(state);
    }
  }

  function addConditionRule() {
    const modal = document.getElementById('condition-editor-modal');
    const builder = modal?.querySelector('.condition-builder');
    if (!builder) return;

    const rule = document.createElement('div');
    rule.className = 'condition-rule';
    rule.innerHTML = `
      <select class="condition-variable">
        <option value="">変数を選択...</option>
        <option value="inventory">インベントリ</option>
        <option value="flags">フラグ</option>
        <option value="variables">変数</option>
      </select>
      <select class="condition-operator">
        <option value="has">持っている</option>
        <option value="not_has">持っていない</option>
        <option value="equals">等しい</option>
        <option value="not_equals">等しくない</option>
        <option value="greater">より大きい</option>
        <option value="less">より小さい</option>
      </select>
      <input type="text" class="condition-value" placeholder="値" />
    `;

    builder.insertBefore(rule, builder.querySelector('.condition-actions'));
  }

  function removeConditionRule() {
    const modal = document.getElementById('condition-editor-modal');
    const rules = modal ? modal.querySelectorAll('.condition-rule') : [];
    if (rules.length > 1) {
      rules[rules.length - 1].remove();
    }
  }

  // Expose conditions module
  window.WYSIWYGStoryEditorConditions = {
    createConditionEditorModal,
    showConditionEditor,
  };
})();
