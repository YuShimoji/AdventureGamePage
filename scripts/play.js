(function () {
  // Main play.js - UI rendering and coordination after modularization
  function debugLog(...args) {
    if (window.APP_CONFIG?.debug?.showConsoleLogs) {
      console.log(...args);
    }
  }

  function renderEmptyStateForNoGameData() {
    const sceneEl = document.getElementById('scene');
    const choicesEl = document.getElementById('choices');

    if (choicesEl) {
      choicesEl.innerHTML = '';
      choicesEl.setAttribute('aria-hidden', 'true');
    }

    if (!sceneEl) {
      return;
    }

    sceneEl.innerHTML = `
      <div class="play-empty-state">
        <svg class="empty-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        </svg>
        <h2>ゲームデータがありません</h2>
        <p>
          管理画面でゲームを作成するか、<br>
          JSONファイルをインポートしてください。
        </p>
        <div class="actions">
          <a href="admin.html" class="btn btn-primary">管理画面を開く</a>
          <button id="empty-load-json" class="btn">JSONをインポート</button>
        </div>
      </div>
    `;

    const importBtn = document.getElementById('empty-load-json');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        const fileInput =
          document.getElementById('play-file-import') ||
          document.getElementById('mobile-play-file-import');
        if (fileInput && typeof fileInput.click === 'function') {
          fileInput.click();
        } else {
          ToastManager.error('ゲームJSON読込用の入力が見つかりませんでした。');
        }
      });
    }
  }

  function initPlayPage() {
    // Initialize core modules
    const { elements, engine, game } = window.PlayCore.init();
    debugLog('PlayCore.init returned:', { elements, engine, game });

    // Initialize feature modules
    window.PlaySave.init(engine, game.title);
    window.PlayInventory.init(engine);
    window.PlayInput.init(engine);
    if (window.PlayModal && typeof window.PlayModal.init === 'function') {
      window.PlayModal.init({ engine });
    }

    // Ensure modal is hidden on initialization
    const saveLoadModal =
      window.PlaySave.getModalElement?.() || document.getElementById('save-load-modal');
    if (saveLoadModal) {
      saveLoadModal.hidden = true;
      saveLoadModal.style.display = 'none';
    }

    // Setup basic UI interactions
    if (elements.btnRestart) {
      elements.btnRestart.addEventListener('click', () => engine.reset());
    }

    // Node transition event listener for item acquisition (sample)
    document.addEventListener('agp-node-selection-changed', e => {
      const nodeId = e.detail?.nodeId;
      if (nodeId === 'key' && !engine.hasItem('rusty_key')) {
        // Add rusty key when entering the key node
        engine.addItem('rusty_key');
        setTimeout(() => {
          ToastManager.success('錆びた鍵を手に入れた！');
        }, 500);
      }
    });

    // Setup theme button
    const btnTheme = document.getElementById('btn-theme');
    if (btnTheme) {
      btnTheme.setAttribute('aria-expanded', 'false');
    }

    // Additional UI/event hooks below require engine context
    document.addEventListener('agp-auto-save', () => {
      window.PlayInput.announceToScreenReader?.('ゲームが自動保存されました', 'polite');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    try {
      initPlayPage();
    } catch (error) {
      if (error && error.code === 'NO_GAME_DATA') {
        if (window.APP_CONFIG?.debug?.showConsoleLogs) {
          console.info('[PLAY] No game data on play.html; rendering empty state UI.', error);
        }
        renderEmptyStateForNoGameData();
        return;
      }
      console.error('Play initialization failed:', error);
      ToastManager.error(`プレイヤー初期化に失敗しました: ${error.message}`);
    }
  });

  // ページ固有のクリーンアップ（どのページでも実行）
  document.addEventListener('DOMContentLoaded', function () {
    // play.html以外ではプレイ要素を強制的に非表示
    if (
      !(window.location.pathname.endsWith('play.html') || window.location.pathname === '/play.html')
    ) {
      const playElements = ['save-slots-panel', 'inventory-panel', 'save-load-modal'];

      playElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.display = 'none';
          el.hidden = true;
          el.setAttribute('aria-hidden', 'true');
          el.setAttribute('inert', '');
        }
      });

      debugLog('[PLAY] Play elements hidden for non-play page');
    }
  });
})();
