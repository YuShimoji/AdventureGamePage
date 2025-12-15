(function () {
  // Mermaid Preview - Main initialization coordinator for mermaid preview interface (Refactored for modularity)

  // ページコンテキストチェック: admin.htmlでのみ有効
  function isAdminPage() {
    return window.location.pathname.endsWith('admin.html') || window.location.pathname === '/admin.html';
  }

  document.addEventListener('DOMContentLoaded', () => {
    // ページコンテキストチェック: adminページでのみ初期化
    if (!isAdminPage()) {
      console.debug('[MermaidPreview] Skipped: not admin page');
      return;
    }

    console.debug('[MermaidPreview] Initializing on admin page');
    if (document.getElementById('mermaid-panel')) {
      // Wait for admin-boot-complete event instead of initializing immediately
      const initializeMermaidPreview = () => {
        window.MermaidPreviewUIManager.bind();
        // NodeEditor からの選択変更に追従して現在ノードをハイライト
        try {
          document.addEventListener('agp-node-selection-changed', (e) => {
            const nodeId = e?.detail?.nodeId;
            if (!nodeId || !window.MermaidPreview?.focusNode) return;
            window.MermaidPreview.focusNode(nodeId);
          });
        } catch {}
        // NodeEditor からの仕様更新に追従して再描画
        try {
          document.addEventListener('agp-spec-updated', () => {
            try { window.MermaidPreview?.refreshData?.(); } catch {}
          });
        } catch {}
      };

      // Check if admin-boot already completed
      if (window.AdminBoot && document.getElementById('editor')) {
        console.debug('[MermaidPreview] Admin-boot already complete, initializing now');
        initializeMermaidPreview();
      } else {
        console.debug('[MermaidPreview] Waiting for admin-boot-complete event');
        // Wait for admin-boot-complete event
        document.addEventListener('admin-boot-complete', () => {
          console.debug('[MermaidPreview] Admin-boot-complete event received');
          initializeMermaidPreview();
        }, { once: true });
      }
    }
  });

  // Public API
  window.MermaidPreview = {
    renderDiagram: window.MermaidPreviewLogicManager.renderDiagram,
    generateSource: window.MermaidPreviewLogicManager.generateSource,
    focusNode: window.MermaidPreviewUIManager.focusNodeEditorNode,
    refreshData: window.MermaidPreviewLogicManager.buildAndSetSource
  };

})();
