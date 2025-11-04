(function() {
  'use strict';

  // Admin Boot Script - エディタ初期化の堅牢化
  // 管理画面のDOM準備と初期化エラーを検知・修正

  const BootError = class extends Error {
    constructor(message, context = {}) {
      super(message);
      this.name = 'BootError';
      this.context = context;
    }
  };

  // ノードエディタ モーダル初期化
  function initNodeEditorModal() {
    try {
      const openBtn = document.getElementById('ne-open-modal');
      const modal = document.getElementById('node-editor-modal');
      const modalContent = document.getElementById('node-editor-modal-content');
      const closeBtn = document.getElementById('node-editor-modal-close');
      const editorSection = document.getElementById('node-editor');

      if (!openBtn || !modal || !modalContent || !closeBtn || !editorSection) {
        return;
      }

      const placeholder = document.createComment('node-editor-original-position');
      let inModal = false;

      openBtn.addEventListener('click', () => {
        if (inModal) return;
        if (editorSection.parentNode) {
          editorSection.parentNode.insertBefore(placeholder, editorSection);
        }
        modalContent.appendChild(editorSection);
        modal.hidden = false;
        inModal = true;
        log('info', 'ノードエディタをモーダルへ移動');
      });

      closeBtn.addEventListener('click', () => {
        if (!inModal) return;
        if (placeholder.parentNode) {
          placeholder.parentNode.insertBefore(editorSection, placeholder);
          placeholder.parentNode.removeChild(placeholder);
        }
        modal.hidden = true;
        inModal = false;
        log('info', 'ノードエディタを元の位置へ復帰');
      });
    } catch (e) {
      log('warn', 'initNodeEditorModal failed', { error: e.message });
    }
  }

  function log(level, message, context = {}) {
    const prefix = '[admin-boot]';
    const msg = `${prefix} ${level.toUpperCase()}: ${message}`;
    if (window.APP_CONFIG?.debug?.enabled && window.APP_CONFIG?.debug?.showConsoleLogs) {
      if (context && Object.keys(context).length > 0) {
        console[level](msg, context);
      } else {
        console[level](msg);
      }
    }
  }

  // DOM要素の存在確認と初期化
  function ensureEditorElements() {
    const requiredElements = [
      { id: 'editor', description: 'メインエディタ' },
      { id: 'char-count', description: '文字数カウンタ' },
      { id: 'sidebar', description: 'サイドバー' },
      { id: 'btn-toggle-sidebar', description: 'サイドバートグルボタン' },
      { id: 'title-input', description: 'タイトル入力' },
      { id: 'btn-save-simple', description: 'シンプル保存ボタン' },
      { id: 'btn-load-simple', description: 'シンプル読込ボタン' }
    ];

    const missing = [];
    const elements = {};

    for (const req of requiredElements) {
      const el = document.getElementById(req.id);
      if (!el) {
        missing.push(req);
      } else {
        elements[req.id] = el;
      }
    }

    if (missing.length > 0) {
      const missingList = missing.map(m => `${m.id} (${m.description})`).join(', ');
      throw new BootError(`必須DOM要素が見つかりません: ${missingList}`, { missing });
    }

    log('info', '必須DOM要素の確認完了');
    return elements;
  }

  // エディタの初期化状態を保証
  function initializeEditor(editor) {
    try {
      // contenteditable属性の確認
      if (!editor.hasAttribute('contenteditable') || editor.getAttribute('contenteditable') !== 'true') {
        editor.setAttribute('contenteditable', 'true');
        log('info', 'contenteditable属性を設定');
      }

      // 最小高さの設定
      const currentMinHeight = editor.style.minHeight;
      if (!currentMinHeight || currentMinHeight === 'auto') {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        editor.style.minHeight = `calc(${vh - 160}px)`;
        log('info', 'エディタの最小高さを設定', { minHeight: editor.style.minHeight });
      }

      // プレースホルダの設定
      const placeholder = window.APP_CONFIG?.editor?.placeholder || '入力を開始……';
      if (!editor.hasAttribute('data-placeholder')) {
        editor.setAttribute('data-placeholder', placeholder);
        log('info', 'プレースホルダを設定', { placeholder });
      }

      // 初期テキストの設定（空の場合）
      if (!editor.textContent.trim()) {
        editor.innerHTML = '<p>ここに本文を入力してください。</p><p><br></p>';
        log('info', '初期テキストを設定');
      }

      // Zenモードの初期設定
      if (window.APP_CONFIG?.editor?.startZen) {
        setTimeout(() => {
          document.body.classList.add('zen-mode');
          log('info', 'Zenモードを有効化');
        }, 100);
      }

      log('info', 'エディタ初期化完了');
      return true;

    } catch (error) {
      throw new BootError('エディタ初期化失敗', { error: error.message, stack: error.stack });
    }
  }

  // 設定の読み込みと適用
  function loadAndApplyConfig() {
    try {
      // 設定ファイルの読み込み（既に読み込まれているはず）
      if (!window.APP_CONFIG) {
        log('warn', 'APP_CONFIGが見つからないため、デフォルト設定を使用');
        window.APP_CONFIG = {
          editor: { placeholder: '入力を開始……', startZen: true },
          ui: { showFloatingFormatbar: true, showFloatingControls: true },
          debug: { enabled: false, showConsoleLogs: true }
        };
      }

      // テーマの適用
      if (window.Theme && window.Theme.loadTheme) {
        try {
          const theme = window.Theme.loadTheme();
          window.Theme.applyTheme(theme);
          log('info', 'テーマ適用完了', { theme });
        } catch (e) {
          log('warn', 'テーマ適用失敗', { error: e.message });
        }
      }

      log('info', '設定読み込み完了');
      return true;

    } catch (error) {
      throw new BootError('設定読み込み失敗', { error: error.message });
    }
  }

  // 初期化のメイン関数
  async function boot() {
    try {
      log('info', '管理画面ブート開始');

      // 1. DOM準備待ち
      if (document.readyState === 'loading') {
        log('info', 'DOM準備待ち');
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
        console.log('[DEBUG] APP_CONFIG.ui.showSavePreview:', window.APP_CONFIG?.ui?.showSavePreview);
        try {
          await window.SavePreviewPanelManager.initialize();
          console.log('[DEBUG] SavePreviewPanelManager initialized successfully');
          console.log('[DEBUG] SavePreviewPanelManager.isOpen():', window.SavePreviewPanelManager.isOpen());

          // パネルの初期状態を確認
          const panel = document.getElementById('preview-panel');
          console.log('[DEBUG] After initialization - panel.hidden:', panel?.hidden);
          console.log('[DEBUG] After initialization - panel.dataset.state:', panel?.dataset?.state);
          console.log('[DEBUG] After initialization - panel.classList:', panel?.classList?.toString());

        } catch (e) {
          console.error('[DEBUG] SavePreviewPanelManager initialization failed:', e);
          log('error', 'SavePreviewPanelManager initialization failed', { error: e.message });

          // 初期化失敗時はadmin.jsの実行をブロック
          const errorMsg = `保存プレビューパネルの初期化に失敗しました: ${e.message}\\n管理画面の機能が制限される可能性があります。`;
          console.error(errorMsg);

          // エラーモーダルを表示し、admin-boot-completeイベントを発火
          showBootError(new Error(errorMsg));

          // admin-boot-completeを発火するが、admin.jsの実行は許可しない
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent('admin-boot-complete', {
              detail: { error: e, config: window.APP_CONFIG, savePreviewFailed: true }
            }));
            console.log('[DEBUG] admin-boot-complete fired with SavePreview failure');
          }, 100);

          return; // 初期化を中止
        }
      } else {
        console.log('[DEBUG] SavePreviewPanelManager not found or disabled:', {
          manager: !!window.SavePreviewPanelManager,
          config: window.APP_CONFIG?.ui?.showSavePreview
        });
      }

      // 5. 初期フォーカス設定（Zenモード以外）
      if (!window.APP_CONFIG?.editor?.startZen) {
        setTimeout(() => {
          elements.editor.focus();
          log('info', '初期フォーカス設定');
        }, 200);
      }

      // 6. 初期化完了イベントの発火
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('admin-boot-complete', {
          detail: { elements, config: window.APP_CONFIG }
        }));
        log('info', '管理画面ブート完了');
      }, 100);

    } catch (error) {
      log('error', 'ブート失敗', { error: error.message, context: error.context });

      // エラーが発生しても admin-boot-complete イベントを発火（admin.js の初期化を許可）
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('admin-boot-complete', {
          detail: { error: error, config: window.APP_CONFIG }
        }));
        log('info', 'admin-boot-complete イベントを発火（エラー時）');
      }, 100);

      // エラーモーダルの表示
      showBootError(error);
    }
  }

  // ブートエラーの表示
  function showBootError(error) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.9); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
    `;

    modal.innerHTML = `
      <div style="background: #161b22; color: #e6edf3; padding: 24px; border-radius: 12px; max-width: 500px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <h2 style="margin: 0 0 16px; color: #f85149;">管理画面初期化エラー</h2>
        <p style="margin: 16px 0; line-height: 1.6;">${error.message}</p>
        <details style="margin: 16px 0;">
          <summary style="cursor: pointer; color: #8b949e;">技術詳細</summary>
          <pre style="margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: auto; font-size: 12px;">${error.stack || error.context || '詳細情報なし'}</pre>
        </details>
        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
          <button onclick="location.reload()" style="padding: 8px 16px; background: #4493f8; color: white; border: none; border-radius: 6px; cursor: pointer;">ページ再読込</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // グローバル公開（デバッグ用）
  window.AdminBoot = {
    boot,
    ensureEditorElements,
    initializeEditor,
    loadAndApplyConfig,
    showBootError
  };

  // 自動起動
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    // 既にDOM準備済みの場合は少し待ってから起動（スクリプト読み込み順序対策）
    setTimeout(boot, 10);
  }

})();
