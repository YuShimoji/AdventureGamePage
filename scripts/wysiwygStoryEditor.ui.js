(function(){
  // WYSIWYG Story Editor UI - UI generation, toolbar, properties panel

  function createEditorUI(state) {
    state.editorContainer.innerHTML = `
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
        <div class="story-properties-panel" hidden>
          <div class="properties-content"></div>
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

    const canvas = state.editorContainer.querySelector('.story-canvas');
    if (canvas) {
      canvas.tabIndex = 0;
      canvas.style.outline = 'none';
    }

    initToolbar(state);
  }

  function initToolbar(state) {
    const toolbar = state.editorContainer.querySelector('.wysiwyg-toolbar');
    if (!toolbar) return;

    toolbar.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;

      switch (action) {
        case 'add-node':
          addNodeAtCenter(state);
          break;
        case 'save':
          if (window.WYSIWYGStoryEditorCore) {
            window.WYSIWYGStoryEditorCore.saveStory();
          }
          break;
        case 'export':
          if (window.WYSIWYGStoryEditorCore) {
            window.WYSIWYGStoryEditorCore.exportStory();
          }
          break;
      }
    });
  }

  function addNodeAtCenter(state) {
    const canvas = state.canvas;
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2 + canvas.scrollLeft;
    const centerY = rect.height / 2 + canvas.scrollTop;

    if (window.WYSIWYGStoryEditorCore) {
      window.WYSIWYGStoryEditorCore.addNode(centerX, centerY);
    }
    if (window.WYSIWYGStoryEditorCanvas) {
      window.WYSIWYGStoryEditorCanvas.renderCanvas(state);
    }
  }

  function initDragAndDrop(state) {
    const paletteItems = state.editorContainer.querySelectorAll('.palette-item');

    paletteItems.forEach(item => {
      item.addEventListener('dragstart', handlePaletteDragStart);
    });

    state.canvas.addEventListener('dragover', handleCanvasDragOver);
    state.canvas.addEventListener('drop', (e) => handleCanvasDrop(e, state));
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

  function handleCanvasDrop(e, state) {
    e.preventDefault();

    const canvas = state.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + canvas.scrollLeft;
    const y = e.clientY - rect.top + canvas.scrollTop;

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));

      if (data.type === 'palette-item') {
        handlePaletteDrop(data.itemType, x, y, state);
      }
    } catch (err) {
      console.warn('Invalid drop data:', err);
    }
  }

  function handlePaletteDrop(itemType, x, y, state) {
    const targetNode = window.WYSIWYGStoryEditorCanvas?.getNodeAtPosition(x, y, state);

    if (!targetNode) return;

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

    if (window.WYSIWYGStoryEditorCanvas) {
      window.WYSIWYGStoryEditorCanvas.renderCanvas(state);
    }
  }

  function addChoiceToNode(node, x, y) {
    if (!node.choices) node.choices = [];
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

  function createContextMenu(state) {
    state.contextMenu = document.createElement('div');
    state.contextMenu.className = 'context-menu';
    state.contextMenu.innerHTML = `
      <div class="context-menu-item" data-action="add-node">ノードを追加</div>
      <div class="context-menu-item" data-action="edit-node">ノードを編集</div>
      <div class="context-menu-item" data-action="delete-node">ノードを削除</div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item" data-action="set-start">開始ノードに設定</div>
    `;
    state.contextMenu.style.position = 'absolute';
    state.contextMenu.style.display = 'none';
    state.contextMenu.style.zIndex = '1000';
    state.editorContainer.appendChild(state.contextMenu);

    document.addEventListener('click', () => {
      if (state.contextMenu) {
        state.contextMenu.style.display = 'none';
      }
    });
  }

  function editNode(node, state) {
    const propertiesPanel = state.editorContainer.querySelector('.story-properties-panel');
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
              <button class="btn btn-ghost btn-sm remove-choice-btn" data-index="${index}">削除</button>
            </div>
          `).join('')}
        </div>
        <button class="btn add-choice-btn">選択肢を追加</button>
      </div>
      <div class="property-actions">
        <button class="btn btn-primary save-node-btn">保存</button>
        <button class="btn close-properties-btn">キャンセル</button>
      </div>
    `;

    propertiesPanel.hidden = false;
    propertiesContent._editingNode = node;

    // Event listeners
    propertiesContent.querySelector('.node-id').addEventListener('input', (e) => {
      node.id = e.target.value;
      if (window.WYSIWYGStoryEditorCanvas) {
        window.WYSIWYGStoryEditorCanvas.renderCanvas(state);
      }
    });

    propertiesContent.querySelector('.node-title').addEventListener('input', (e) => {
      node.title = e.target.value;
      if (window.WYSIWYGStoryEditorCanvas) {
        window.WYSIWYGStoryEditorCanvas.renderCanvas(state);
      }
    });

    propertiesContent.querySelector('.node-text').addEventListener('input', (e) => {
      node.text = e.target.value;
      if (window.WYSIWYGStoryEditorCanvas) {
        window.WYSIWYGStoryEditorCanvas.renderCanvas(state);
      }
    });

    propertiesContent.querySelector('.add-choice-btn').addEventListener('click', () => {
      node.choices.push({ label: '', target: '' });
      editNode(node, state);
    });

    propertiesContent.querySelectorAll('.remove-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index, 10);
        node.choices.splice(index, 1);
        editNode(node, state);
      });
    });

    propertiesContent.querySelector('.save-node-btn').addEventListener('click', () => {
      propertiesPanel.hidden = true;
      if (window.WYSIWYGStoryEditorCanvas) {
        window.WYSIWYGStoryEditorCanvas.renderCanvas(state);
      }
    });

    propertiesContent.querySelector('.close-properties-btn').addEventListener('click', () => {
      propertiesPanel.hidden = true;
    });
  }

  // Expose UI module
  window.WYSIWYGStoryEditorUI = {
    createEditorUI,
    createContextMenu,
    initDragAndDrop,
    editNode
  };

})();
