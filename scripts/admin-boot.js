(function () {
  'use strict';

  // Admin Boot Script - Integrated manager using modular components

  const { log, ensureEditorElements, initializeEditor, loadAndApplyConfig, showBootError, initNodeEditorModal } = window.AdminBootUtils || {};

  // 初期化のメイン関数
  async function boot() {
    try {
      log?.('info', '管理画面ブート開始');

      // 1. DOM準備待ち
      if (document.readyState === 'loading') {
        log?.('info', 'DOM準備待ち');
        document.addEventListener('DOMContentLoaded', () => boot());
        return;
      }

      // 2. 必須要素の確認
      const elements = ensureEditorElements();

      // 3. 設定の読み込み
      loadAndApplyConfig();

      // 4. エディタの初期化
      initializeEditor(elements.editor);

      // 4.5 ノードエディタモーダルの初期化
      initNodeEditorModal();

      // 4.6 SavePreviewPanelManagerの初期化（admin.jsより先に実行）
      if (window.SavePreviewPanelManager && window.APP_CONFIG?.ui?.showSavePreview) {
        console.log('[DEBUG] SavePreviewPanelManager found, initializing...');
        try {
          await window.SavePreviewPanelManager.initialize();
          console.log('[DEBUG] SavePreviewPanelManager initialized successfully');
        } catch (e) {
          console.error('[DEBUG] SavePreviewPanelManager initialization failed:', e);
          log?.('error', 'SavePreviewPanelManager initialization failed', { error: e.message });

          const errorMsg = `保存プレビューパネルの初期化に失敗しました: ${e.message}\\n管理画面の機能が制限される可能性があります。`;
          console.error(errorMsg);
          showBootError?.(new Error(errorMsg));

          setTimeout(() => {
            document.dispatchEvent(
              new CustomEvent('admin-boot-complete', {
                detail: { error: e, config: window.APP_CONFIG, savePreviewFailed: true },
              })
            );
          }, 100);

          return;
        }
      }

      // 5. 初期フォーカス設定（Zenモード以外）
      if (!window.APP_CONFIG?.editor?.startZen) {
        setTimeout(() => {
          elements.editor.focus();
          log?.('info', '初期フォーカス設定');
        }, 200);
      }

      // 6. 初期化完了イベントの発火（DOM + EventBus）
      setTimeout(() => {
        const detail = { elements, config: window.APP_CONFIG };

        // Legacy DOM event
        document.dispatchEvent(new CustomEvent('admin-boot-complete', { detail }));

        // EventBus event
        if (window.EventBus) {
          window.EventBus.emit(window.EventBus.Events.ADMIN_BOOT_COMPLETE, detail);
        }

        log?.('info', '管理画面ブート完了');
      }, 100);
    } catch (error) {
      log?.('error', 'ブート失敗', { error: error.message, context: error.context });

      // エラーが発生しても admin-boot-complete イベントを発火
      setTimeout(() => {
        document.dispatchEvent(
          new CustomEvent('admin-boot-complete', {
            detail: { error: error, config: window.APP_CONFIG },
          })
        );
        log?.('info', 'admin-boot-complete イベントを発火（エラー時）');
      }, 100);

      showBootError?.(error);
    }
  }

  // グローバル公開（デバッグ用）
  window.AdminBoot = {
    boot,
    ensureEditorElements: ensureEditorElements || (() => {}),
    initializeEditor: initializeEditor || (() => {}),
    loadAndApplyConfig: loadAndApplyConfig || (() => {}),
    showBootError: showBootError || (() => {}),
  };

  // 自動起動（adminコンテキストでのみ実行）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof isAdminContext === 'function' && isAdminContext()) {
        boot();
      }
    });
  } else {
    setTimeout(() => {
      if (typeof isAdminContext === 'function' && isAdminContext()) {
        boot();
      }
    }, 10);
  }
})();
