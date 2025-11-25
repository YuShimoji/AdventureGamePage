(function(){
  // WYSIWYG Story Editor Canvas - Canvas rendering and mouse events

  function initCanvas(state) {
    const canvas = state.canvas;
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => handleMouseDown(e, state));
    canvas.addEventListener('mousemove', (e) => handleMouseMove(e, state));
    canvas.addEventListener('mouseup', (e) => handleMouseUp(e, state));
    canvas.addEventListener('dblclick', (e) => handleDoubleClick(e, state));
  }

  function handleMouseDown(e, state) {
    const canvas = state.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + canvas.scrollLeft;
    const y = e.clientY - rect.top + canvas.scrollTop;

    state.selectedElement = getNodeAtPosition(x, y, state);

    if (state.selectedElement) {
      state.isDragging = true;
      state.dragOffset.x = x - state.selectedElement.x;
      state.dragOffset.y = y - state.selectedElement.y;
      canvas.style.cursor = 'grabbing';
    } else {
      state.selectedElement = null;
    }

    renderCanvas(state);
  }

  function handleMouseMove(e, state) {
    if (!state.isDragging || !state.selectedElement) return;

    const canvas = state.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + canvas.scrollLeft;
    const y = e.clientY - rect.top + canvas.scrollTop;

    state.selectedElement.x = x - state.dragOffset.x;
    state.selectedElement.y = y - state.dragOffset.y;

    renderCanvas(state);
  }

  function handleMouseUp(e, state) {
    state.isDragging = false;
    state.canvas.style.cursor = state.selectedElement ? 'grab' : 'default';
  }

  function handleDoubleClick(e, state) {
    const canvas = state.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + canvas.scrollLeft;
    const y = e.clientY - rect.top + canvas.scrollTop;

    const node = getNodeAtPosition(x, y, state);
    if (node) {
      if (window.WYSIWYGStoryEditorUI) {
        window.WYSIWYGStoryEditorUI.editNode(node, state);
      }
    } else {
      // Create new node at click position
      if (window.WYSIWYGStoryEditorCore) {
        window.WYSIWYGStoryEditorCore.addNode(x - 100, y - 60);
        renderCanvas(state);
      }
    }
  }

  function getNodeAtPosition(x, y, state) {
    for (let i = state.currentStory.nodes.length - 1; i >= 0; i--) {
      const node = state.currentStory.nodes[i];
      if (x >= node.x && x <= node.x + node.width &&
          y >= node.y && y <= node.y + node.height) {
        return node;
      }
    }
    return null;
  }

  function renderCanvas(state) {
    const canvas = state.canvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawConnections(ctx, state);

    state.currentStory.nodes.forEach(node => {
      drawNode(ctx, node, state);
    });
  }

  function drawNode(ctx, node, state) {
    ctx.fillStyle = node === state.selectedElement ? '#e3f2fd' : '#ffffff';
    ctx.strokeStyle = node === state.selectedElement ? '#2196f3' : '#ddd';
    ctx.lineWidth = node === state.selectedElement ? 2 : 1;

    ctx.beginPath();
    ctx.roundRect(node.x, node.y, node.width, node.height, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(node.title, node.x + 8, node.y + 20);

    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    const textPreview = node.text.length > 50 ? node.text.substring(0, 50) + '...' : node.text;
    const lines = wrapText(ctx, textPreview, node.width - 16);
    lines.forEach((line, index) => {
      ctx.fillText(line, node.x + 8, node.y + 40 + (index * 14));
    });

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

    if (node.id === state.currentStory.startNode) {
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

  function drawConnections(ctx, state) {
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;

    state.currentStory.connections.forEach(conn => {
      const fromNode = state.currentStory.nodes.find(n => n.id === conn.from);
      const toNode = state.currentStory.nodes.find(n => n.id === conn.to);

      if (fromNode && toNode) {
        const fromX = fromNode.x + fromNode.width / 2;
        const fromY = fromNode.y + fromNode.height / 2;
        const toX = toNode.x + toNode.width / 2;
        const toY = toNode.y + toNode.height / 2;

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

    return lines.slice(0, 2);
  }

  // Expose canvas module
  window.WYSIWYGStoryEditorCanvas = {
    initCanvas,
    renderCanvas,
    getNodeAtPosition,
    drawNode,
    drawConnections
  };

})();
