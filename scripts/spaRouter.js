(function () {
  // SPA Router - Single Page Application routing and view management

  let currentView = 'index';
  let viewContainer = null;

  const VIEWS = {
    index: {
      title: 'Adventure Game Page',
      render: renderIndexView,
      scripts: []
    },
    learn: {
      title: '学ぶ',
      render: renderLearnView,
      scripts: []
    },
    admin: {
      title: '管理',
      render: renderAdminView,
      scripts: [
        'scripts/admin-boot.js',
        'scripts/admin.editor.js',
        'scripts/admin.core.js'
      ]
    },
    play: {
      title: 'プレイ',
      render: renderPlayView,
      scripts: [
        'scripts/play.core.js',
        'scripts/play.save.js',
        'scripts/play.inventory.js',
        'scripts/play.input.js',
        'scripts/play.modal.js',
        'scripts/play.js'
      ]
    }
  };

  function init(container) {
    viewContainer = container;
    
    // Handle hash changes
    window.addEventListener('hashchange', handleRouteChange);
    
    // Handle initial route
    handleRouteChange();
    
    // Intercept navigation links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#!/"]');
      if (link) {
        e.preventDefault();
        navigateTo(link.getAttribute('href').substring(3));
      }
    });
  }

  function handleRouteChange() {
    const hash = window.location.hash.substring(2); // Remove #!
    const viewId = hash || 'index';
    
    if (VIEWS[viewId]) {
      loadView(viewId);
    } else {
      loadView('index');
    }
  }

  function navigateTo(viewId) {
    window.location.hash = `!/${viewId}`;
  }

  async function loadView(viewId) {
    if (!VIEWS[viewId] || !viewContainer) return;

    const view = VIEWS[viewId];
    currentView = viewId;

    // Update document title
    document.title = view.title;

    // Clear previous view
    viewContainer.innerHTML = '';

    // Update body class
    document.body.className = `${viewId}-page`;

    // Render new view
    const content = await view.render();
    viewContainer.innerHTML = content;

    // Load view-specific scripts
    if (view.scripts && view.scripts.length > 0) {
      await loadScripts(view.scripts);
    }

    // Dispatch view-loaded event
    document.dispatchEvent(new CustomEvent('spa-view-loaded', {
      detail: { viewId: viewId }
    }));
  }

  function loadScripts(scriptPaths) {
    return Promise.all(scriptPaths.map(path => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = path;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }));
  }

  // View renderers
  function renderIndexView() {
    return `
      <section class="hero" style="padding: 80px 16px; text-align: center;">
        <div class="container">
          <h2 style="font-size: 42px; margin: 0 0 16px; font-weight: 700;">AdventureGamePage Studio</h2>
          <p class="muted" style="margin: 0 0 32px; font-size: 18px; line-height: 1.6;">
            分岐シナリオを設計・管理・検証するための<br>
            内製クリエイティブワークスペース。
          </p>
          <div style="display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
            <a class="btn btn-accent" href="#!/learn" style="padding: 12px 24px; font-size: 16px;">
              📖 ドキュメント
            </a>
            <a class="btn" href="#!/admin" style="padding: 12px 24px; font-size: 16px;">
              ✏️ エディタを起動
            </a>
            <a class="btn" href="#!/play" style="padding: 12px 24px; font-size: 16px;">
              ▶️ プレイテスト
            </a>
          </div>
        </div>
      </section>

      <section class="container" style="margin-top: 64px;">
        <h3 style="font-size: 28px; margin: 0 0 24px; text-align: center;">コア機能</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
          <div class="card">
            <h4 style="margin: 0 0 12px; font-size: 20px;">ノードベースエディタ</h4>
            <p class="muted" style="margin: 0; line-height: 1.7;">
              直感的なUIで分岐シナリオを作成。リアルタイムプレビューで即座に確認できます。
            </p>
          </div>
          <div class="card">
            <h4 style="margin: 0 0 12px; font-size: 20px;">即座プレイテスト</h4>
            <p class="muted" style="margin: 0; line-height: 1.7;">
              作成したシナリオをその場でプレイ可能。セーブ/ロード機能も完備。
            </p>
          </div>
          <div class="card">
            <h4 style="margin: 0 0 12px; font-size: 20px;">拡張可能設計</h4>
            <p class="muted" style="margin: 0; line-height: 1.7;">
              モジュール設計により、機能追加やカスタマイズが容易です。
            </p>
          </div>
        </div>
      </section>
    `;
  }

  function renderLearnView() {
    return `
      <div class="container narrow" style="margin-top: 32px;">
        <h2 style="font-size: 32px; margin: 0 0 24px;">学ぶ</h2>
        <div class="card" style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 16px; font-size: 24px;">サンプルゲーム</h3>
          <p class="muted" style="margin: 0 0 16px;">
            以下のサンプルゲームを試して、AdventureGamePageの機能を体験してみましょう。
          </p>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="btn btn-accent" onclick="loadSample('sample-game.json')">
              サンプル1を読み込む
            </button>
            <button class="btn" onclick="loadSample('sample-game-valid.json')">
              サンプル2を読み込む
            </button>
          </div>
        </div>

        <div class="card">
          <h3 style="margin: 0 0 16px; font-size: 24px;">ドキュメント</h3>
          <ul style="margin: 0; padding-left: 24px; line-height: 2;">
            <li><a href="#" class="link">はじめに</a></li>
            <li><a href="#" class="link">ノードエディタの使い方</a></li>
            <li><a href="#" class="link">分岐とアクションの設定</a></li>
            <li><a href="#" class="link">エクスポートとインポート</a></li>
            <li><a href="#" class="link">プレイテストガイド</a></li>
          </ul>
        </div>
      </div>

      <script>
        function loadSample(filename) {
          fetch(filename)
            .then(r => r.json())
            .then(data => {
              localStorage.setItem('agp_game_data', JSON.stringify(data));
              window.location.hash = '!/play';
            })
            .catch(e => alert('サンプルの読み込みに失敗しました: ' + e.message));
        }
      </script>
    `;
  }

  function renderAdminView() {
    return `
      <div style="display: flex; height: calc(100vh - 60px);">
        <aside class="sidebar" style="width: 280px; padding: 16px; background: var(--surface); border-right: 1px solid var(--border); overflow-y: auto;">
          <h3 style="margin: 0 0 16px; font-size: 16px;">ツール</h3>
          <div id="sidebar-content"></div>
        </aside>
        
        <main style="flex: 1; padding: 16px; overflow-y: auto;">
          <div id="editor" class="editor" contenteditable="true" spellcheck="false" 
               style="min-height: calc(100vh - 140px); padding: 24px; outline: none;"></div>
          <div id="admin-panels"></div>
        </main>
      </div>
    `;
  }

  function renderPlayView() {
    return `
      <div style="display: flex; flex-direction: column; height: calc(100vh - 60px);">
        <main id="game-container" style="flex: 1; padding: 24px; overflow-y: auto; max-width: 800px; margin: 0 auto; width: 100%;">
          <h2 id="game-title" style="margin: 0 0 16px; font-size: 28px;">サンプルアドベンチャー</h2>
          <div id="story-content" style="margin-bottom: 24px; line-height: 1.8; font-size: 16px;"></div>
          <div id="game-image" style="margin-bottom: 24px; text-align: center;" hidden></div>
          <div id="choices-container" style="display: flex; flex-direction: column; gap: 12px;"></div>
        </main>

        <div id="play-modals"></div>
      </div>
    `;
  }

  // Public API
  window.SPARouter = {
    init: init,
    navigateTo: navigateTo,
    getCurrentView: () => currentView
  };
})();
