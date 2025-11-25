(function(){
  // WYSIWYG Story Editor Core - State management and initialization

  // Shared state (accessible by other modules)
  const state = {
    currentStory: {
      nodes: [],
      connections: [],
      startNode: null
    },
    editorContainer: null,
    canvas: null,
    contextMenu: null,
    selectedElement: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
  };

  function init(containerId) {
    state.editorContainer = document.getElementById(containerId);
    if (!state.editorContainer) return false;

    // Create editor UI
    if (window.WYSIWYGStoryEditorUI) {
      window.WYSIWYGStoryEditorUI.createEditorUI(state);
    }

    // Initialize canvas
    state.canvas = state.editorContainer.querySelector('.story-canvas');
    if (state.canvas && window.WYSIWYGStoryEditorCanvas) {
      window.WYSIWYGStoryEditorCanvas.initCanvas(state);
    }

    // Initialize context menu
    if (window.WYSIWYGStoryEditorUI) {
      window.WYSIWYGStoryEditorUI.createContextMenu(state);
    }

    // Initialize drag and drop
    if (window.WYSIWYGStoryEditorUI) {
      window.WYSIWYGStoryEditorUI.initDragAndDrop(state);
    }

    // Create condition editor modal
    if (window.WYSIWYGStoryEditorConditions) {
      window.WYSIWYGStoryEditorConditions.createConditionEditorModal(state);
    }

    return true;
  }

  function generateNodeId() {
    let counter = 1;
    while (state.currentStory.nodes.some(n => n.id === `node_${counter}`)) {
      counter++;
    }
    return `node_${counter}`;
  }

  function addNode(x, y, title, text) {
    const nodeId = generateNodeId();
    const newNode = {
      id: nodeId,
      title: title || '新しいノード',
      text: text || 'ここにストーリーの内容を入力してください。',
      x: x,
      y: y,
      width: 200,
      height: 120,
      choices: []
    };

    state.currentStory.nodes.push(newNode);
    return newNode;
  }

  function saveStory() {
    const spec = convertToGameSpec();
    if (window.NodeEditorUIManager) {
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
        start: state.currentStory.startNode
      },
      nodes: state.currentStory.nodes.map(node => ({
        id: node.id,
        title: node.title,
        text: node.text,
        choices: node.choices
      }))
    };
  }

  function loadStory(spec) {
    if (!spec || !spec.nodes) return;

    state.currentStory.nodes = spec.nodes.map(node => ({
      ...node,
      x: Math.random() * 1000 + 100,
      y: Math.random() * 600 + 100,
      width: 200,
      height: 120
    }));

    state.currentStory.startNode = spec.meta?.start;
    
    if (window.WYSIWYGStoryEditorCanvas) {
      window.WYSIWYGStoryEditorCanvas.renderCanvas(state);
    }
  }

  // Expose core module
  window.WYSIWYGStoryEditorCore = {
    init,
    getState: () => state,
    generateNodeId,
    addNode,
    saveStory,
    exportStory,
    loadStory,
    convertToGameSpec
  };

  // Legacy API compatibility
  window.WYSIWYGStoryEditor = {
    init,
    loadStory,
    saveStory,
    exportStory,
    getCurrentStory: () => state.currentStory
  };

})();
