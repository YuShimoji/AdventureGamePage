(function () {
  'use strict';

  // Admin Boot Cleanup - Page change and cleanup handling

  function cleanupOnPageChange() {
    // SavePreviewPanelManagerのクリーンアップ
    if (
      window.SavePreviewPanelManager &&
      typeof window.SavePreviewPanelManager.close === 'function'
    ) {
      try {
        window.SavePreviewPanelManager.close({ restoreFocus: false });
        console.log('[AdminBoot] SavePreviewPanelManager cleaned up');
      } catch (e) {
        console.warn('[AdminBoot] SavePreviewPanelManager cleanup failed:', e);
      }
    }

    // MermaidPreview関連のクリーンアップ
    if (
      window.MermaidPreviewUIManager &&
      typeof window.MermaidPreviewUIManager.unbind === 'function'
    ) {
      try {
        window.MermaidPreviewUIManager.unbind();
        console.log('[AdminBoot] MermaidPreviewUIManager cleaned up');
      } catch (e) {
        console.warn('[AdminBoot] MermaidPreviewUIManager cleanup failed:', e);
      }
    }

    // イベントリスナーのクリーンアップ
    try {
      document.removeEventListener('agp-node-selection-changed', window.MermaidPreview?.focusNode);
      document.removeEventListener('agp-spec-updated', window.MermaidPreview?.refreshData);
      console.log('[AdminBoot] Event listeners cleaned up');
    } catch (e) {
      console.warn('[AdminBoot] Event listener cleanup failed:', e);
    }
  }

  function hideAdminElements() {
    const adminElements = [
      'preview-panel',
      'memos-panel',
      'mermaid-fullscreen-modal',
      'playtest-modal',
      'node-editor-modal',
    ];

    adminElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = 'none !important';
        el.hidden = true;
        el.setAttribute('aria-hidden', 'true');
        el.setAttribute('inert', '');
      }
    });

    console.log('[ADMIN-BOOT] Admin elements hidden for non-admin page');
  }

  function setupPageChangeListeners() {
    // ページ変更を検知してクリーンアップ
    let currentPath = window.location.pathname;
    window.addEventListener('popstate', () => {
      if (window.location.pathname !== currentPath) {
        console.log('[AdminBoot] Page changed, cleaning up UI managers');
        cleanupOnPageChange();
        currentPath = window.location.pathname;
      }
    });

    // beforeunloadでもクリーンアップ（念のため）
    window.addEventListener('beforeunload', cleanupOnPageChange);
  }

  function setupNonAdminCleanup() {
    // ページ固有のクリーンアップ（どのページでも実行）
    document.addEventListener('DOMContentLoaded', function () {
      // adminコンテキスト以外では管理要素を強制的に非表示
      if (typeof isAdminContext === 'function' && !isAdminContext()) {
        hideAdminElements();
      } else if (typeof window.isAdminContext === 'function' && !window.isAdminContext()) {
        hideAdminElements();
      }
    });
  }

  // Global exposure
  window.AdminBootCleanup = {
    cleanupOnPageChange,
    hideAdminElements,
    setupPageChangeListeners,
    setupNonAdminCleanup
  };

  // Auto-setup listeners
  setupPageChangeListeners();
  setupNonAdminCleanup();
})();
