(function(){
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
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          modal.style.display = 'none';
        }
      });
    }
  }

  function showConditionEditor(node, state) {
    const modal = document.getElementById('condition-editor-modal');
    if (!modal) return;

    const nodeOptions = state.currentStory.nodes.map(n => 
      `<option value="${n.id}">${n.title} (${n.id})</option>`
    ).join('');

    const trueSelect = modal.querySelector('.outcome-true');
    const falseSelect = modal.querySelector('.outcome-false');

    if (trueSelect) trueSelect.innerHTML = `<option value="">ノードを選択...</option>${nodeOptions}`;
    if (falseSelect) falseSelect.innerHTML = `<option value="">ノードを選択...</option>${nodeOptions}`;

    if (node.conditions && node.conditions.length > 0) {
      loadConditionData(node);
    }

    modal._editingNode = node;
    modal.style.display = 'flex';
  }

  function loadConditionData(node) {
    // Load existing condition data into the editor
    // Implementation for populating the condition editor with existing rules
  }

  function saveCondition(state) {
    const modal = document.getElementById('condition-editor-modal');
    const node = modal._editingNode;
    if (!node) return;

    const variable = modal.querySelector('.condition-variable').value;
    const operator = modal.querySelector('.condition-operator').value;
    const value = modal.querySelector('.condition-value').value;
    const trueOutcome = modal.querySelector('.outcome-true').value;
    const falseOutcome = modal.querySelector('.outcome-false').value;

    if (!node.conditions) node.conditions = [];

    node.conditions.push({
      variable,
      operator,
      value,
      trueOutcome,
      falseOutcome
    });

    modal.style.display = 'none';
    
    if (window.WYSIWYGStoryEditorCanvas) {
      window.WYSIWYGStoryEditorCanvas.renderCanvas(state);
    }
  }

  function addConditionRule() {
    const builder = document.querySelector('.condition-builder');
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

    builder.insertBefore(rule, document.querySelector('.condition-actions'));
  }

  function removeConditionRule() {
    const rules = document.querySelectorAll('.condition-rule');
    if (rules.length > 1) {
      rules[rules.length - 1].remove();
    }
  }

  // Expose conditions module
  window.WYSIWYGStoryEditorConditions = {
    createConditionEditorModal,
    showConditionEditor
  };

})();
