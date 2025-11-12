(function() {
  // Play Debug UI - Developer debugging tools for play mode
  
  window.PlayDebug = {
    engine: null,
    panel: null,
    button: null,

    init: function(engine) {
      if (!window.APP_CONFIG?.debug?.enabled) {
        console.log('[PlayDebug] Debug mode disabled, skipping initialization');
        return;
      }

      this.engine = engine;
      this.createUI();
      this.setupEventListeners();
      this.exposeDebugAPI();
      
      console.log('[PlayDebug] Debug UI initialized');
    },

    createUI: function() {
      // Create debug toggle button
      this.button = document.createElement('button');
      this.button.id = 'debug-toggle-btn';
      this.button.className = 'debug-toggle-btn';
      this.button.innerHTML = '🔧';
      this.button.title = 'デバッグツールを開く';
      this.button.setAttribute('aria-label', 'デバッグツールを開く');
      document.body.appendChild(this.button);

      // Create debug panel
      this.panel = document.createElement('div');
      this.panel.id = 'debug-panel';
      this.panel.className = 'debug-panel';
      this.panel.setAttribute('role', 'dialog');
      this.panel.setAttribute('aria-label', 'デバッグツール');
      this.panel.hidden = true;
      
      this.panel.innerHTML = `
        <div class="debug-panel-header">
          <span class="debug-panel-title">🔧 デバッグツール</span>
          <button id="debug-panel-close" class="debug-panel-btn" title="閉じる" aria-label="閉じる">✕</button>
        </div>
        <div class="debug-panel-content">
          <div class="debug-section">
            <h4>ゲーム状態</h4>
            <div class="debug-btn-group">
              <button id="debug-save" class="btn btn-sm">💾 保存</button>
              <button id="debug-load" class="btn btn-sm">📂 読込</button>
              <button id="debug-reset" class="btn btn-sm">🔄 リセット</button>
            </div>
            <div id="debug-state-info" class="debug-info"></div>
          </div>

          <div class="debug-section">
            <h4>インベントリ</h4>
            <div class="debug-input-group">
              <input id="debug-item-id" type="text" placeholder="アイテムID" class="debug-input" />
              <input id="debug-item-qty" type="number" value="1" min="1" class="debug-input" style="width: 60px;" />
            </div>
            <div class="debug-btn-group">
              <button id="debug-add-item" class="btn btn-sm btn-accent">➕ 追加</button>
              <button id="debug-remove-item" class="btn btn-sm">➖ 削除</button>
              <button id="debug-show-inv" class="btn btn-sm">📦 確認</button>
            </div>
          </div>

          <div class="debug-section">
            <h4>ノード操作</h4>
            <div class="debug-input-group">
              <input id="debug-node-id" type="text" placeholder="ノードID" class="debug-input" />
              <button id="debug-jump-node" class="btn btn-sm btn-accent">🔀 ジャンプ</button>
            </div>
            <div id="debug-node-info" class="debug-info"></div>
          </div>

          <div class="debug-section">
            <h4>変数操作</h4>
            <div class="debug-input-group">
              <input id="debug-var-key" type="text" placeholder="変数名" class="debug-input" />
              <input id="debug-var-value" type="text" placeholder="値" class="debug-input" />
            </div>
            <div class="debug-btn-group">
              <button id="debug-set-var" class="btn btn-sm btn-accent">🔧 設定</button>
              <button id="debug-get-var" class="btn btn-sm">🔍 取得</button>
              <button id="debug-show-vars" class="btn btn-sm">📋 全表示</button>
            </div>
          </div>

          <div class="debug-section">
            <h4>ログ</h4>
            <div class="debug-btn-group">
              <button id="debug-toggle-logs" class="btn btn-sm">📝 コンソールログ切替</button>
              <button id="debug-clear-logs" class="btn btn-sm">🗑️ ログクリア</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(this.panel);
      this.updateStateInfo();
    },

    setupEventListeners: function() {
      // Toggle panel
      this.button.addEventListener('click', () => {
        this.panel.hidden = !this.panel.hidden;
        if (!this.panel.hidden) {
          this.updateStateInfo();
        }
      });

      // Close panel
      document.getElementById('debug-panel-close').addEventListener('click', () => {
        this.panel.hidden = true;
      });

      // Game state operations
      document.getElementById('debug-save').addEventListener('click', () => {
        this.engine.saveProgress();
        this.log('✅ ゲーム保存完了');
        this.updateStateInfo();
      });

      document.getElementById('debug-load').addEventListener('click', () => {
        this.engine.loadProgress();
        this.log('✅ ゲーム読込完了');
        this.updateStateInfo();
      });

      document.getElementById('debug-reset').addEventListener('click', () => {
        if (confirm('ゲームをリセットしますか？')) {
          this.engine.reset();
          this.log('✅ ゲームリセット完了');
          this.updateStateInfo();
        }
      });

      // Inventory operations
      document.getElementById('debug-add-item').addEventListener('click', () => {
        const itemId = document.getElementById('debug-item-id').value.trim();
        const qty = parseInt(document.getElementById('debug-item-qty').value) || 1;
        if (!itemId) {
          this.log('⚠️ アイテムIDを入力してください', 'warn');
          return;
        }
        this.engine.addItem(itemId, qty);
        this.log(`✅ アイテム追加: ${itemId} x${qty}`);
      });

      document.getElementById('debug-remove-item').addEventListener('click', () => {
        const itemId = document.getElementById('debug-item-id').value.trim();
        const qty = parseInt(document.getElementById('debug-item-qty').value) || 1;
        if (!itemId) {
          this.log('⚠️ アイテムIDを入力してください', 'warn');
          return;
        }
        this.engine.removeItem(itemId, qty);
        this.log(`✅ アイテム削除: ${itemId} x${qty}`);
      });

      document.getElementById('debug-show-inv').addEventListener('click', () => {
        const inv = this.engine.getState().inventory || {};
        console.table(inv);
        this.log(`📦 インベントリ: ${Object.keys(inv).length}件`, 'info');
      });

      // Node operations
      document.getElementById('debug-jump-node').addEventListener('click', () => {
        const nodeId = document.getElementById('debug-node-id').value.trim();
        if (!nodeId) {
          this.log('⚠️ ノードIDを入力してください', 'warn');
          return;
        }
        try {
          this.engine.setNode(nodeId);
          this.log(`✅ ノードジャンプ: ${nodeId}`);
          this.updateStateInfo();
        } catch (error) {
          this.log(`❌ エラー: ${error.message}`, 'error');
        }
      });

      // Variable operations
      document.getElementById('debug-set-var').addEventListener('click', () => {
        const key = document.getElementById('debug-var-key').value.trim();
        const value = document.getElementById('debug-var-value').value;
        if (!key) {
          this.log('⚠️ 変数名を入力してください', 'warn');
          return;
        }
        this.engine.setVariable(key, value);
        this.log(`✅ 変数設定: ${key} = ${value}`);
      });

      document.getElementById('debug-get-var').addEventListener('click', () => {
        const key = document.getElementById('debug-var-key').value.trim();
        if (!key) {
          this.log('⚠️ 変数名を入力してください', 'warn');
          return;
        }
        const value = this.engine.getVariable(key);
        this.log(`📋 変数取得: ${key} = ${JSON.stringify(value)}`, 'info');
      });

      document.getElementById('debug-show-vars').addEventListener('click', () => {
        const vars = this.engine.getState().variables || {};
        console.table(vars);
        this.log(`📋 変数: ${Object.keys(vars).length}件`, 'info');
      });

      // Log operations
      document.getElementById('debug-toggle-logs').addEventListener('click', () => {
        window.APP_CONFIG.debug.showConsoleLogs = !window.APP_CONFIG.debug.showConsoleLogs;
        this.log(`📝 コンソールログ: ${window.APP_CONFIG.debug.showConsoleLogs ? 'ON' : 'OFF'}`, 'info');
      });

      document.getElementById('debug-clear-logs').addEventListener('click', () => {
        console.clear();
        this.log('🗑️ コンソールクリア完了', 'info');
      });

      // Update node info on state change
      document.addEventListener('agp-node-selection-changed', () => {
        if (!this.panel.hidden) {
          this.updateStateInfo();
        }
      });
    },

    updateStateInfo: function() {
      if (!this.engine) return;

      const state = this.engine.getState();
      const stateInfo = document.getElementById('debug-state-info');
      const nodeInfo = document.getElementById('debug-node-info');

      if (stateInfo) {
        stateInfo.innerHTML = `
          <div class="debug-info-item"><strong>現在ノード:</strong> ${state.nodeId || 'N/A'}</div>
          <div class="debug-info-item"><strong>アイテム数:</strong> ${Object.keys(state.inventory || {}).length}</div>
          <div class="debug-info-item"><strong>変数数:</strong> ${Object.keys(state.variables || {}).length}</div>
        `;
      }

      if (nodeInfo) {
        nodeInfo.innerHTML = `
          <div class="debug-info-item"><strong>履歴:</strong> ${state.history?.length || 0}件</div>
        `;
      }
    },

    exposeDebugAPI: function() {
      // Expose debug functions to window for console access
      window.debugAddItem = (id, qty = 1) => {
        this.engine.addItem(id, qty);
        console.log(`[Debug] Added item: ${id} x${qty}`);
      };

      window.debugRemoveItem = (id, qty = 1) => {
        this.engine.removeItem(id, qty);
        console.log(`[Debug] Removed item: ${id} x${qty}`);
      };

      window.debugJumpTo = (nodeId) => {
        this.engine.setNode(nodeId);
        console.log(`[Debug] Jumped to node: ${nodeId}`);
      };

      window.debugSetVar = (key, value) => {
        this.engine.setVariable(key, value);
        console.log(`[Debug] Set variable: ${key} = ${value}`);
      };

      window.debugGetVar = (key) => {
        const value = this.engine.getVariable(key);
        console.log(`[Debug] Get variable: ${key} = ${JSON.stringify(value)}`);
        return value;
      };

      window.debugSave = () => {
        this.engine.saveProgress();
        console.log('[Debug] Game saved');
      };

      window.debugLoad = () => {
        this.engine.loadProgress();
        console.log('[Debug] Game loaded');
      };

      window.debugState = () => {
        const state = this.engine.getState();
        console.log('[Debug] Current state:', state);
        return state;
      };

      console.log('[PlayDebug] Debug API exposed: debugAddItem, debugRemoveItem, debugJumpTo, debugSetVar, debugGetVar, debugSave, debugLoad, debugState');
    },

    log: function(message, type = 'log') {
      if (window.APP_CONFIG?.debug?.showConsoleLogs) {
        console[type](`[Debug] ${message}`);
      }
      // Could also show in UI toast notification
    }
  };
})();
