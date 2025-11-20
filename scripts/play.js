(function () {
  // Main play.js - UI rendering and coordination after modularization
  function renderEmptyStateForNoGameData(error) {
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
      <div class="card">
        <h2 style="margin-top: 0;">ゲームデータがまだ登録されていません</h2>
        <p class="muted">
          管理画面でゲームを作成して保存するか、ゲームJSONファイルを読み込んでください。
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px;">
          <a href="admin.html" class="btn">管理画面を開く</a>
          <button id="empty-load-json" class="btn btn-ghost">ゲームJSONを読み込む</button>
        </div>
        <p class="muted" style="margin-top: 12px;">
          既にJSONファイルがある場合は、上部の「ゲームJSON読込」ボタンからインポートできます。
        </p>
      </div>
    `;

    const importBtn = document.getElementById('empty-load-json');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('play-file-import') || document.getElementById('mobile-play-file-import');
        if (fileInput && typeof fileInput.click === 'function') {
          fileInput.click();
        } else {
          alert('ゲームJSON読込用の入力が見つかりませんでした。');
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    try {
      // Initialize core modules
      const { elements, engine, game } = window.PlayCore.init();
      console.log("PlayCore.init returned:", { elements, engine, game });

      // Initialize feature modules
      window.PlaySave.init(engine, game.title);
      window.PlayInventory.init(engine);
      window.PlayInput.init(engine);

      // Ensure modal is hidden on initialization
      const saveLoadModal = window.PlaySave.getModalElement?.() || document.getElementById('save-load-modal');

      // Setup basic UI interactions
      if (elements.btnRestart) {
        elements.btnRestart.addEventListener("click", () => engine.reset());
      }

      // Node transition event listener for item acquisition (sample)
      document.addEventListener('agp-node-selection-changed', (e) => {
        const nodeId = e.detail?.nodeId;
        if (nodeId === 'key' && !engine.hasItem('rusty_key')) {
          // Add rusty key when entering the key node
          engine.addItem('rusty_key');
          setTimeout(() => {
            alert('錆びた鍵を手に入れた！');
          }, 500);
        }
      });

      // Setup theme button
      const btnTheme = document.getElementById('btn-theme');
      if (btnTheme) {
        btnTheme.addEventListener('click', () => {
          // Theme panel toggle logic
          const panel = document.getElementById("theme-panel");
          if (panel) {
            if (panel.hidden) {
              panel.hidden = false;
              panel.style.display = 'flex';
              window.PlayInput.announceGameAction('themeChanged');
            } else {
              panel.hidden = true;
              panel.style.display = 'none';
            }
          }
        });
      }

      console.log('Play modules initialized successfully');

      // Additional UI/event hooks below require engine context
      document.addEventListener('agp-auto-save', () => {
        window.PlayInput.announceToScreenReader?.('ゲームが自動保存されました', 'polite');
      });

      // Modal & focus management is delegated to PlayModal
      if (window.PlayModal && typeof window.PlayModal.init === 'function') {
        window.PlayModal.init({ engine });
      }
  } catch (error) {
    if (error && error.code === 'NO_GAME_DATA') {
      if (window.APP_CONFIG?.debug?.showConsoleLogs) {
        console.info('[PLAY] No game data on play.html; rendering empty state UI.', error);
      }
      renderEmptyStateForNoGameData(error);
      return;
    }
    console.error('Play initialization failed:', error);
    alert(`プレイヤー初期化に失敗しました: ${error.message}`);
  }
  });

  // ページ固有のクリーンアップ（どのページでも実行）
  document.addEventListener('DOMContentLoaded', function() {
    // play.html以外ではプレイ要素を強制的に非表示
    if (!(window.location.pathname.endsWith('play.html') || window.location.pathname === '/play.html')) {
      const playElements = [
        'save-slots-panel', 'inventory-panel', 'save-load-modal'
      ];

      playElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.display = 'none !important';
          el.hidden = true;
          el.setAttribute('aria-hidden', 'true');
          el.setAttribute('inert', '');
        }
      });

      console.log('[PLAY] Play elements hidden for non-play page');
    }
  });

})();
