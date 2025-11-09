(function(){
  // WYSIWYG Story Editor - Visual story creation interface

  let currentStory = {
    nodes: [],
    connections: [],
    startNode: null
  };

  let editorContainer = null;
  let canvas = null;
  let contextMenu = null;
  let selectedElement = null;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  function init(containerId) {
    editorContainer = document.getElementById(containerId);
    if (!editorContainer) return false;

    // Create editor UI
    createEditorUI();

    // Initialize canvas
    canvas = editorContainer.querySelector('.story-canvas');
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('dblclick', handleDoubleClick);
    }

    // Initialize context menu
    createContextMenu();

    // Initialize drag and drop
    initDragAndDrop();

    // Create condition editor modal
    createConditionEditorModal();

    return true;
  }

  function createEditorUI() {
    editorContainer.innerHTML = `
      <div class="wysiwyg-sidebar">
        <div class="wysiwyg-palette">
          <h4>パレット</h4>
          <div class="palette-items">
            <div class="palette-item" draggable="true" data-type="choice">
              <span class="palette-icon">➕</span>
              <span class="palette-label">選択肢</span>
            </div>
            <div class="palette-item" draggable="true" data-type="condition">
              <span class="palette-icon">🔀</span>
              <span class="palette-label">条件分岐</span>
            </div>
            <div class="palette-item" draggable="true" data-type="action">
              <span class="palette-icon">⚡</span>
              <span class="palette-label">アクション</span>
            </div>
            <div class="palette-item" draggable="true" data-type="variable">
              <span class="palette-icon">📊</span>
              <span class="palette-label">変数</span>
            </div>
          </div>
        </div>
        <div class="wysiwyg-properties">
          <h4>プロパティ</h4>
          <div id="properties-content"></div>
        </div>
      </div>
      <div class="wysiwyg-main">
        <div class="wysiwyg-toolbar">
          <button class="btn" data-action="add-node" title="ノードを追加">
            <span>+ ノード</span>
          </button>
          <button class="btn" data-action="connect" title="接続">
            <span>🔗 接続</span>
          </button>
          <button class="btn" data-action="delete" title="削除">
            <span>🗑️ 削除</span>
          </button>
          <div class="spacer"></div>
          <button class="btn" data-action="save" title="保存">
            <span>💾 保存</span>
          </button>
          <button class="btn" data-action="export" title="エクスポート">
            <span>📤 エクスポート</span>
          </button>
        </div>
        <div class="story-canvas-container">
          <canvas class="story-canvas" width="2000" height="1500"></canvas>
        </div>
      </div>
    `;

    // Make canvas focusable
    const canvas = editorContainer.querySelector('.story-canvas');
    if (canvas) {
      canvas.tabIndex = 0;
      canvas.style.outline = 'none';
    }

    // Initialize drag and drop
    initDragAndDrop();
  }

  function initDragAndDrop() {
    const paletteItems = editorContainer.querySelectorAll('.palette-item');

    paletteItems.forEach(item => {
      item.addEventListener('dragstart', handlePaletteDragStart);
    });

    canvas.addEventListener('dragover', handleCanvasDragOver);
    canvas.addEventListener('drop', handleCanvasDrop);
  }

  function handlePaletteDragStart(e) {
    const itemType = e.target.closest('.palette-item').dataset.type;
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'palette-item',
      itemType: itemType
    }));
    e.dataTransfer.effectAllowed = 'copy';
  }

  function handleCanvasDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  function handleCanvasDrop(e) {
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + canvas.scrollLeft;
    const y = e.clientY - rect.top + canvas.scrollTop;

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));

      if (data.type === 'palette-item') {
        handlePaletteDrop(data.itemType, x, y);
      }
    } catch (err) {
      console.warn('Invalid drop data:', err);
    }
  }

  function handlePaletteDrop(itemType, x, y) {
    // Find the node at the drop location
    const targetNode = getNodeAtPosition(x, y);

    if (!targetNode) {
      // Dropping on empty canvas - could create a new node or show error
      return;
    }

    switch (itemType) {
      case 'choice':
        addChoiceToNode(targetNode, x, y);
        break;
      case 'condition':
        addConditionToNode(targetNode);
        break;
      case 'action':
        addActionToNode(targetNode);
        break;
      case 'variable':
        addVariableToNode(targetNode);
        break;
    }

    renderCanvas();
  }

  function addChoiceToNode(node, x, y) {
    if (!node.choices) node.choices = [];

    // Calculate position relative to node for visual feedback
    const relativeX = x - node.x;
    const relativeY = y - node.y;

    node.choices.push({
      label: '新しい選択肢',
      target: '',
      x: relativeX,
      y: relativeY
    });
  }

  function addConditionToNode(node) {
    if (!node.conditions) node.conditions = [];

    node.conditions.push({
      type: 'if',
      variable: '',
      operator: 'equals',
      value: '',
      target: ''
    });
  }

  function addActionToNode(node) {
    if (!node.actions) node.actions = [];

    node.actions.push({
      type: 'show_text',
      text: 'アクションを実行しました'
    });
  }

  function addVariableToNode(node) {
    if (!node.variables) node.variables = [];

    node.variables.push({
      name: 'new_variable',
      operation: 'set',
      value: 0
    });
  }

  function createContextMenu() {
    contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.innerHTML = `
      <div class="context-menu-item" data-action="add-node">ノードを追加</div>
      <div class="context-menu-item" data-action="edit-node">ノードを編集</div>
      <div class="context-menu-item" data-action="delete-node">ノードを削除</div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item" data-action="set-start">開始ノードに設定</div>
    `;
    contextMenu.style.position = 'absolute';
    contextMenu.style.display = 'none';
    contextMenu.style.zIndex = '1000';
    editorContainer.appendChild(contextMenu);

    // Hide context menu when clicking elsewhere
    document.addEventListener('click', () => {
      if (contextMenu) {
        contextMenu.style.display = 'none';
      }
    });
  }

  function createConditionEditorModal() {
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

    // Add event listeners
    initConditionEditorEvents();
  }

  function initConditionEditorEvents() {
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
      saveBtn.addEventListener('click', saveCondition);
    }

    if (addRuleBtn) {
      addRuleBtn.addEventListener('click', addConditionRule);
    }

    if (removeRuleBtn) {
      removeRuleBtn.addEventListener('click', removeConditionRule);
    }

    // Close modal when clicking overlay
    const overlay = modal.querySelector('.condition-editor-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          modal.style.display = 'none';
        }
      });
    }
  }

  function showConditionEditor(node) {
    const modal = document.getElementById('condition-editor-modal');
    if (!modal) return;

    // Populate node options
    const nodeOptions = currentStory.nodes.map(n => `<option value="${n.id}">${n.title} (${n.id})</option>`).join('');

    const trueSelect = modal.querySelector('.outcome-true');
    const falseSelect = modal.querySelector('.outcome-false');

    if (trueSelect) trueSelect.innerHTML = `<option value="">ノードを選択...</option>${nodeOptions}`;
    if (falseSelect) falseSelect.innerHTML = `<option value="">ノードを選択...</option>${nodeOptions}`;

    // Load existing conditions if any
    if (node.conditions && node.conditions.length > 0) {
      loadConditionData(node);
    }

    modal._editingNode = node;
    modal.style.display = 'flex';
  }

  function loadConditionData(node) {
    // Implementation for loading existing condition data
    // This would populate the condition editor with existing rules
  }

  function saveCondition() {
    const modal = document.getElementById('condition-editor-modal');
    const node = modal._editingNode;
    if (!node) return;

    // Collect condition data
    const variable = modal.querySelector('.condition-variable').value;
    const operator = modal.querySelector('.condition-operator').value;
    const value = modal.querySelector('.condition-value').value;
    const trueOutcome = modal.querySelector('.outcome-true').value;
    const falseOutcome = modal.querySelector('.outcome-false').value;

    // Save condition to node
    if (!node.conditions) node.conditions = [];

    node.conditions.push({
      variable,
      operator,
      value,
      trueOutcome,
      falseOutcome
    });

    modal.style.display = 'none';
    renderCanvas();
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

  function initToolbar() {
    const toolbar = editorContainer.querySelector('.wysiwyg-toolbar');
    if (!toolbar) return;

    toolbar.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;

      switch (action) {
        case 'add-node':
          addNodeAtCenter();
          break;
        case 'save':
          saveStory();
          break;
        case 'export':
          exportStory();
          break;
      }
    });
  }

  function addNodeAtCenter() {
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2 + canvas.scrollLeft;
    const centerY = rect.height / 2 + canvas.scrollTop;

    const nodeId = generateNodeId();
    const newNode = {
      id: nodeId,
      title: '新しいノード',
      text: 'ここにストーリーの内容を入力してください。',
      x: centerX,
      y: centerY,
      width: 200,
      height: 120,
      choices: []
    };

    currentStory.nodes.push(newNode);
    renderCanvas();
  }

  function generateNodeId() {
    let counter = 1;
    while (currentStory.nodes.some(n => n.id === `node_${counter}`)) {
      counter++;
    }
    return `node_${counter}`;
  }

  function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + canvas.scrollLeft;
    const y = e.clientY - rect.top + canvas.scrollTop;

    // Check if clicking on a node
    selectedElement = getNodeAtPosition(x, y);

    if (selectedElement) {
      isDragging = true;
      dragOffset.x = x - selectedElement.x;
      dragOffset.y = y - selectedElement.y;
      canvas.style.cursor = 'grabbing';
    } else {
      selectedElement = null;
    }

    renderCanvas();
  }

  function handleMouseMove(e) {
    if (!isDragging || !selectedElement) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + canvas.scrollLeft;
    const y = e.clientY - rect.top + canvas.scrollTop;

    selectedElement.x = x - dragOffset.x;
    selectedElement.y = y - dragOffset.y;

    renderCanvas();
  }

  function handleMouseUp(e) {
    isDragging = false;
    canvas.style.cursor = selectedElement ? 'grab' : 'default';
  }

  function handleDoubleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + canvas.scrollLeft;
    const y = e.clientY - rect.top + canvas.scrollTop;

    const node = getNodeAtPosition(x, y);
    if (node) {
      editNode(node);
    } else {
      // Create new node at click position
      const nodeId = generateNodeId();
      const newNode = {
        id: nodeId,
        title: '新しいノード',
        text: 'ここにストーリーの内容を入力してください。',
        x: x - 100, // Center the node on the click
        y: y - 60,
        width: 200,
        height: 120,
        choices: []
      };

      currentStory.nodes.push(newNode);
      renderCanvas();
    }
  }

  function getNodeAtPosition(x, y) {
    // Check nodes in reverse order (topmost first)
    for (let i = currentStory.nodes.length - 1; i >= 0; i--) {
      const node = currentStory.nodes[i];
      if (x >= node.x && x <= node.x + node.width &&
          y >= node.y && y <= node.y + node.height) {
        return node;
      }
    }
    return null;
  }

  function editNode(node) {
    const propertiesPanel = editorContainer.querySelector('.story-properties-panel');
    const propertiesContent = propertiesPanel.querySelector('.properties-content');

    propertiesContent.innerHTML = `
      <div class="property-group">
        <label>ノードID</label>
        <input type="text" class="node-id" value="${node.id}" />
      </div>
      <div class="property-group">
        <label>タイトル</label>
        <input type="text" class="node-title" value="${node.title}" />
      </div>
      <div class="property-group">
        <label>本文</label>
        <textarea class="node-text" rows="4">${node.text}</textarea>
      </div>
      <div class="property-group">
        <label>選択肢</label>
        <div class="choices-list">
          ${node.choices.map((choice, index) => `
            <div class="choice-item">
              <input type="text" class="choice-label" value="${choice.label || ''}" placeholder="選択肢のテキスト" />
              <input type="text" class="choice-target" value="${choice.target || ''}" placeholder="ターゲットノードID" />
              <button class="btn btn-ghost btn-sm" onclick="removeChoice(${index})">削除</button>
            </div>
          `).join('')}
        </div>
        <button class="btn" onclick="addChoice()">選択肢を追加</button>
      </div>
      <div class="property-actions">
        <button class="btn btn-primary" onclick="saveNodeProperties()">保存</button>
        <button class="btn" onclick="closeProperties()">キャンセル</button>
      </div>
    `;

    propertiesPanel.hidden = false;

    // Add event listeners
    propertiesContent.querySelector('.node-id').addEventListener('input', (e) => {
      node.id = e.target.value;
      renderCanvas();
    });

    propertiesContent.querySelector('.node-title').addEventListener('input', (e) => {
      node.title = e.target.value;
      renderCanvas();
    });

    propertiesContent.querySelector('.node-text').addEventListener('input', (e) => {
      node.text = e.target.value;
      renderCanvas();
    });

    // Store reference to current node being edited
    propertiesContent._editingNode = node;
  }

  function renderCanvas() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections first (behind nodes)
    drawConnections(ctx);

    // Draw nodes
    currentStory.nodes.forEach(node => {
      drawNode(ctx, node);
    });
  }

  function drawNode(ctx, node) {
    // Node background
    ctx.fillStyle = node === selectedElement ? '#e3f2fd' : '#ffffff';
    ctx.strokeStyle = node === selectedElement ? '#2196f3' : '#ddd';
    ctx.lineWidth = node === selectedElement ? 2 : 1;

    ctx.beginPath();
    ctx.roundRect(node.x, node.y, node.width, node.height, 8);
    ctx.fill();
    ctx.stroke();

    // Node title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(node.title, node.x + 8, node.y + 20);

    // Node content preview
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    const textPreview = node.text.length > 50 ? node.text.substring(0, 50) + '...' : node.text;
    const lines = wrapText(ctx, textPreview, node.width - 16);
    lines.forEach((line, index) => {
      ctx.fillText(line, node.x + 8, node.y + 40 + (index * 14));
    });

    // Choice count indicator
    if (node.choices && node.choices.length > 0) {
      ctx.fillStyle = '#4caf50';
      ctx.beginPath();
      ctx.arc(node.x + node.width - 15, node.y + 15, 8, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.choices.length.toString(), node.x + node.width - 15, node.y + 19);
      ctx.textAlign = 'left';
    }

    // Start node indicator
    if (node.id === currentStory.startNode) {
      ctx.fillStyle = '#ff9800';
      ctx.beginPath();
      ctx.arc(node.x + 15, node.y + 15, 8, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('▶', node.x + 15, node.y + 20);
      ctx.textAlign = 'left';
    }
  }

  function drawConnections(ctx) {
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;

    currentStory.connections.forEach(conn => {
      const fromNode = currentStory.nodes.find(n => n.id === conn.from);
      const toNode = currentStory.nodes.find(n => n.id === conn.to);

      if (fromNode && toNode) {
        const fromX = fromNode.x + fromNode.width / 2;
        const fromY = fromNode.y + fromNode.height / 2;
        const toX = toNode.x + toNode.width / 2;
        const toY = toNode.y + toNode.height / 2;

        // Draw arrow
        drawArrow(ctx, fromX, fromY, toX, toY);
      }
    });
  }

  function drawArrow(ctx, fromX, fromY, toX, toY) {
    const headlen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Arrow head
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.slice(0, 2); // Limit to 2 lines for preview
  }

  function saveStory() {
    // Convert visual story to game spec format
    const spec = convertToGameSpec();
    if (window.NodeEditorAPI) {
      // Update the node editor with the new spec
      window.NodeEditorUIManager.setSpecData(spec);
      window.NodeEditorUIManager.refreshNodeList();
      alert('ストーリーを保存しました');
    }
  }

  function exportStory() {
    const spec = convertToGameSpec();
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function convertToGameSpec() {
    return {
      version: '1.0',
      meta: {
        title: 'Visual Story',
        start: currentStory.startNode
      },
      nodes: currentStory.nodes.map(node => ({
        id: node.id,
        title: node.title,
        text: node.text,
        choices: node.choices
      }))
    };
  }

  function loadStory(spec) {
    if (!spec || !spec.nodes) return;

    currentStory.nodes = spec.nodes.map(node => ({
      ...node,
      x: Math.random() * 1000 + 100,
      y: Math.random() * 600 + 100,
      width: 200,
      height: 120
    }));

    currentStory.startNode = spec.meta?.start;
    renderCanvas();
  }

  // Global functions for property panel
  window.addChoice = function() {
    const propertiesContent = editorContainer.querySelector('.properties-content');
    const node = propertiesContent._editingNode;
    if (!node) return;

    node.choices.push({ label: '', target: '' });
    editNode(node); // Re-render properties
  };

  window.removeChoice = function(index) {
    const propertiesContent = editorContainer.querySelector('.properties-content');
    const node = propertiesContent._editingNode;
    if (!node) return;

    node.choices.splice(index, 1);
    editNode(node); // Re-render properties
  };

  window.saveNodeProperties = function() {
    const propertiesPanel = editorContainer.querySelector('.story-properties-panel');
    propertiesPanel.hidden = true;
    renderCanvas();
  };

  window.closeProperties = function() {
    const propertiesPanel = editorContainer.querySelector('.story-properties-panel');
    propertiesPanel.hidden = true;
  };

  // Expose WYSIWYG editor
  window.WYSIWYGStoryEditor = {
    init,
    loadStory,
    saveStory,
    exportStory,
    getCurrentStory: () => currentStory
  };

})();
