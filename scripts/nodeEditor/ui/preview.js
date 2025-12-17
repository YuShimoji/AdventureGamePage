(function () {
  // Node Editor Preview - Handles game and mermaid preview rendering

  const { readUIRefs } = window.NodeEditorUIRefs || {};

  let previewMode = 'game'; // 'game' or 'mermaid'
  let parallelPreviewMode = 'game'; // 'game' or 'mermaid'

  function renderImage(container, imageRef, altText) {
    if (!container) return;
    const resolved = window.MediaResolver?.resolveImageRef
      ? window.MediaResolver.resolveImageRef(imageRef)
      : { ok: typeof imageRef === 'string' && imageRef.trim(), src: imageRef };

    if (resolved && resolved.ok && typeof resolved.src === 'string' && resolved.src.trim()) {
      container.innerHTML = '';
      const img = document.createElement('img');
      img.src = resolved.src;
      img.alt = altText || 'Node image';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.onerror = () => {
        try {
          container.innerHTML = '';
          container.hidden = true;
        } catch {}
      };
      container.appendChild(img);
      container.hidden = false;
      return;
    }

    if (resolved && resolved.ok === false && window.APP_CONFIG?.debug?.showConsoleLogs) {
      console.warn('[MediaResolver] Image blocked:', resolved);
    }
    container.innerHTML = '';
    container.hidden = true;
  }

  function updatePreview(node, specData) {
    const { previewTitle, previewText, previewImage, previewChoices, gamePreview, mermaidPreview } =
      readUIRefs();
    if (!node) {
      if (previewTitle) previewTitle.textContent = '';
      if (previewText) previewText.textContent = '';
      if (previewImage) previewImage.hidden = true;
      if (previewChoices) previewChoices.innerHTML = '';
      return;
    }

    // Update game preview
    if (previewTitle) previewTitle.textContent = node.title || '';
    if (previewText) previewText.textContent = node.text || '';
    if (previewImage) {
      renderImage(previewImage, node.image, node.title ? `${node.title} の画像` : 'ノード画像');
    }
    if (previewChoices) {
      previewChoices.innerHTML = '';
      const choices = Array.isArray(node.choices) ? node.choices : [];
      choices.forEach(choice => {
        if (choice && (choice.label || choice.text)) {
          const btn = document.createElement('button');
          btn.className = 'btn';
          btn.textContent = choice.label || choice.text;
          btn.onclick = () => {
            // Navigate to target node if exists
            const targetId = choice.target || choice.to;
            if (targetId && window.NodeEditorUtils.findNodeById(specData.nodes, targetId)) {
              const { sel } = readUIRefs();
              if (sel) {
                sel.value = targetId;
                window.NodeEditorUIManager.renderNodeForm(targetId);
              }
            }
          };
          previewChoices.appendChild(btn);
        }
      });
    }

    // Update Mermaid preview if in mermaid mode
    if (previewMode === 'mermaid' && mermaidPreview && !mermaidPreview.hidden) {
      updateMermaidPreview(specData);
    }
  }

  function updateMermaidPreview(specData) {
    const { modalMermaidView } = readUIRefs();
    if (!modalMermaidView) return;

    // Generate mermaid source for current spec
    const spec = window.NodeEditorUtils.normalizeSpec(specData);
    const code = window.MermaidPreviewLogicManager
      ? window.MermaidPreviewLogicManager.buildMermaidWithOptions({ scope: 'all' })
      : generateSimpleMermaid(spec);

    if (window.mermaid && window.MermaidPreviewLogicManager?.ensureMermaid()) {
      window.mermaid
        .render(`ne-modal-${Date.now()}`, code)
        .then(result => {
          modalMermaidView.innerHTML = result.svg || '';
          window.MermaidPreviewUIManager?.bindSvgInteractions?.();
        })
        .catch(err => {
          console.error('Mermaid render error:', err);
          modalMermaidView.textContent = 'Mermaidレンダリングエラー';
        });
    } else {
      modalMermaidView.textContent = 'Mermaidが利用できません';
    }
  }

  function updateParallelPreview(node, specData) {
    const {
      parallelPreviewTitle,
      parallelPreviewText,
      parallelPreviewImage,
      parallelPreviewChoices,
      parallelGamePreview,
      parallelMermaidPreview,
    } = readUIRefs();
    if (!node) {
      if (parallelPreviewTitle) parallelPreviewTitle.textContent = '';
      if (parallelPreviewText) parallelPreviewText.textContent = '';
      if (parallelPreviewImage) parallelPreviewImage.hidden = true;
      if (parallelPreviewChoices) parallelPreviewChoices.innerHTML = '';
      return;
    }

    // Update game preview
    if (parallelPreviewTitle) parallelPreviewTitle.textContent = node.title || '';
    if (parallelPreviewText) parallelPreviewText.textContent = node.text || '';
    if (parallelPreviewImage) {
      renderImage(
        parallelPreviewImage,
        node.image,
        node.title ? `${node.title} の画像` : 'ノード画像'
      );
    }
    if (parallelPreviewChoices) {
      parallelPreviewChoices.innerHTML = '';
      const choices = Array.isArray(node.choices) ? node.choices : [];
      choices.forEach(choice => {
        if (choice && (choice.label || choice.text)) {
          const btn = document.createElement('button');
          btn.className = 'btn';
          btn.textContent = choice.label || choice.text;
          btn.onclick = () => {
            // Navigate to target node if exists
            const targetId = choice.target || choice.to;
            if (targetId && window.NodeEditorUtils.findNodeById(specData.nodes, targetId)) {
              const { sel } = readUIRefs();
              if (sel) {
                sel.value = targetId;
                window.NodeEditorUIManager.renderNodeForm(targetId);
              }
            }
          };
          parallelPreviewChoices.appendChild(btn);
        }
      });
    }

    // Update Mermaid preview if in mermaid mode
    if (
      parallelPreviewMode === 'mermaid' &&
      parallelMermaidPreview &&
      !parallelMermaidPreview.hidden
    ) {
      updateParallelMermaidPreview(specData);
    }
  }

  function updateParallelMermaidPreview(specData) {
    const { parallelMermaidView } = readUIRefs();
    if (!parallelMermaidView) return;

    // Generate mermaid source for current spec
    const spec = window.NodeEditorUtils.normalizeSpec(specData);
    const code = window.MermaidPreviewLogicManager
      ? window.MermaidPreviewLogicManager.buildMermaidWithOptions({ scope: 'all' })
      : generateSimpleMermaid(spec);

    if (window.mermaid && window.MermaidPreviewLogicManager?.ensureMermaid()) {
      window.mermaid
        .render(`ne-parallel-${Date.now()}`, code)
        .then(result => {
          parallelMermaidView.innerHTML = result.svg || '';
          window.MermaidPreviewUIManager?.bindSvgInteractions?.();
        })
        .catch(err => {
          console.error('Mermaid render error:', err);
          parallelMermaidView.textContent = 'Mermaidレンダリングエラー';
        });
    } else {
      parallelMermaidView.textContent = 'Mermaidが利用できません';
    }
  }

  function toggleParallelPreview(specData) {
    const { parallelGamePreview, parallelMermaidPreview } = readUIRefs();
    if (!parallelGamePreview || !parallelMermaidPreview) return;

    if (parallelPreviewMode === 'game') {
      parallelPreviewMode = 'mermaid';
      parallelGamePreview.hidden = true;
      parallelMermaidPreview.hidden = false;
      updateParallelMermaidPreview(specData);
    } else {
      parallelPreviewMode = 'game';
      parallelMermaidPreview.hidden = true;
      parallelGamePreview.hidden = false;
    }
  }

  function initParallelPreview(specData) {
    const { parallelPreviewRefresh, parallelPreviewToggle } = readUIRefs();
    if (parallelPreviewRefresh) {
      parallelPreviewRefresh.addEventListener('click', () => {
        if (parallelPreviewMode === 'mermaid') {
          updateParallelMermaidPreview(specData);
        } else {
          // Refresh current node preview
          const { sel } = readUIRefs();
          if (sel && sel.value) {
            const node = window.NodeEditorUtils.findNodeById(specData.nodes, sel.value);
            updateParallelPreview(node, specData);
          }
        }
      });
    }
    if (parallelPreviewToggle) {
      parallelPreviewToggle.addEventListener('click', () => toggleParallelPreview(specData));
    }
  }

  function closeParallelView() {
    const container = document.getElementById('editor-container');
    const parallelView = document.getElementById('node-editor-parallel-view');
    if (container) container.classList.remove('node-editor-active');
    if (parallelView) parallelView.hidden = true;
  }

  function togglePreview(specData) {
    const { gamePreview, mermaidPreview } = readUIRefs();
    if (!gamePreview || !mermaidPreview) return;

    if (previewMode === 'game') {
      previewMode = 'mermaid';
      gamePreview.hidden = true;
      mermaidPreview.hidden = false;
      updateMermaidPreview(specData);
    } else {
      previewMode = 'game';
      mermaidPreview.hidden = true;
      gamePreview.hidden = false;
    }
  }

  function initPreview(specData) {
    const { previewRefresh, previewToggle } = readUIRefs();
    if (previewRefresh) {
      previewRefresh.addEventListener('click', () => {
        if (previewMode === 'mermaid') {
          updateMermaidPreview(specData);
        } else {
          // Refresh current node preview
          const { sel } = readUIRefs();
          if (sel && sel.value) {
            const node = window.NodeEditorUtils.findNodeById(specData.nodes, sel.value);
            updatePreview(node, specData);
          }
        }
      });
    }
    if (previewToggle) {
      previewToggle.addEventListener('click', () => togglePreview(specData));
    }
  }

  function initPreviewOnModalOpen(specData) {
    const modal = document.getElementById('node-editor-modal');
    if (!modal) return;

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
          if (!modal.hidden) {
            initPreview(specData);
            // Update preview for current node
            const { sel } = readUIRefs();
            if (sel && sel.value) {
              const node = window.NodeEditorUtils.findNodeById(specData.nodes, sel.value);
              updatePreview(node, specData);
            }
          }
        }
      });
    });
    observer.observe(modal, { attributes: true });
  }

  // Simple fallback mermaid generator
  function generateSimpleMermaid(spec) {
    let code = 'graph TD\n';
    (spec.nodes || []).forEach(n => {
      const id = n.id.replace(/[^a-zA-Z0-9]/g, '_');
      code += `  ${id}["${n.title || n.id}"]\n`;
      (n.choices || []).forEach(c => {
        if (c.target) {
          const targetId = c.target.replace(/[^a-zA-Z0-9]/g, '_');
          code += `  ${id} -->|"${c.label || c.text || ''}"| ${targetId}\n`;
        }
      });
    });
    return code;
  }

  window.NodeEditorPreview = {
    updatePreview,
    updateParallelPreview,
    togglePreview,
    toggleParallelPreview,
    initPreview,
    initParallelPreview,
    initPreviewOnModalOpen,
    closeParallelView,
  };
})();
