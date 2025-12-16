// Game Engine Test Suite
window.GameEngineTests = {
  // テスト結果
  results: [],
  passed: 0,
  failed: 0,

  // テスト実行
  run: function () {
    console.debug('=== Game Engine Test Suite ===');
    this.results = [];
    this.passed = 0;
    this.failed = 0;

    // 各テスト実行
    this.testBasicFunctionality();
    this.testInventorySystem();
    this.testVariableSystem();
    this.testConditionSystem();
    this.testPersistence();
    this.testAutoSave();

    // 結果表示
    this.showResults();
  },

  // アサート関数
  assert: function (condition, message) {
    if (condition) {
      this.passed++;
      console.debug('✅ PASS:', message);
      this.results.push({ status: 'PASS', message });
    } else {
      this.failed++;
      console.error('❌ FAIL:', message);
      this.results.push({ status: 'FAIL', message });
    }
  },

  assertEqual: function (actual, expected, message) {
    this.assert(actual === expected, `${message} (expected: ${expected}, actual: ${actual})`);
  },

  assertThrows: function (fn, message) {
    try {
      fn();
      this.assert(false, `${message} (expected to throw)`);
    } catch (e) {
      this.assert(true, `${message} (threw: ${e.message})`);
    }
  },

  // 基本機能テスト
  testBasicFunctionality: function () {
    console.debug('--- Basic Functionality Tests ---');

    const testGame = {
      title: 'Test Game',
      start: 'start',
      nodes: {
        start: { title: 'Start', text: 'Start text', choices: [] },
        end: { title: 'End', text: 'End text', choices: [] },
      },
    };

    const elements = {
      titleEl: document.createElement('div'),
      textEl: document.createElement('div'),
      choicesEl: document.createElement('div'),
    };

    const engine = GameEngine.createEngine(testGame, elements);

    this.assert(!!engine, 'Engine should be created');
    this.assertEqual(engine.currentNodeId, 'start', 'Should start at start node');
    this.assert(engine.canGoBack() === false, 'Should not be able to go back at start');

    // ノード遷移テスト
    engine.setNode('end');
    this.assertEqual(engine.currentNodeId, 'end', 'Should navigate to end node');
    this.assert(engine.canGoBack() === true, 'Should be able to go back');
  },

  // インベントリシステムテスト
  testInventorySystem: function () {
    console.debug('--- Inventory System Tests ---');

    const testGame = {
      title: 'Test',
      start: 'start',
      nodes: { start: { title: 'Start', text: 'Text', choices: [] } },
    };
    const elements = {
      titleEl: document.createElement('div'),
      textEl: document.createElement('div'),
      choicesEl: document.createElement('div'),
    };
    const engine = GameEngine.createEngine(testGame, elements);

    // アイテム追加テスト
    const addResult = engine.addItem('sword', 1);
    this.assert(addResult, 'Should add item successfully');
    this.assert(engine.hasItem('sword'), 'Should have sword');
    this.assertEqual(engine.getItemCount('sword'), 1, 'Should have 1 sword');

    // アイテム削除テスト
    const removeResult = engine.removeItem('sword', 1);
    this.assert(removeResult, 'Should remove item successfully');
    this.assert(!engine.hasItem('sword'), 'Should not have sword');

    // インベントリ情報テスト
    const inventory = engine.getInventory();
    this.assert(!!inventory, 'Should return inventory object');
    this.assert(Array.isArray(inventory.items), 'Items should be array');
    this.assertEqual(inventory.currentSlots, 0, 'Should have 0 items');
  },

  // 変数システムテスト
  testVariableSystem: function () {
    console.debug('--- Variable System Tests ---');

    const testGame = {
      title: 'Test',
      start: 'start',
      nodes: { start: { title: 'Start', text: 'Text', choices: [] } },
    };
    const elements = {
      titleEl: document.createElement('div'),
      textEl: document.createElement('div'),
      choicesEl: document.createElement('div'),
    };
    const engine = GameEngine.createEngine(testGame, elements);

    // 変数設定・演算テスト（getPlayerState/setPlayerState 経由）
    const ps1 = engine.getPlayerState();
    const vars1 = { ...(ps1.variables || {}) };
    vars1.score = 100;
    vars1.score =
      (typeof vars1.score === 'number' ? vars1.score : parseFloat(vars1.score) || 0) + 50;
    vars1.health =
      (typeof vars1.health === 'number' ? vars1.health : parseFloat(vars1.health) || 0) - 10;
    engine.setPlayerState({ ...ps1, variables: vars1 });

    const ps2 = engine.getPlayerState();
    this.assertEqual(ps2.variables.score, 150, 'Should update score variable');
    this.assertEqual(ps2.variables.health, -10, 'Should update health variable');
  },

  // 条件システムテスト
  testConditionSystem: function () {
    console.debug('--- Condition System Tests ---');

    const testGame = {
      title: 'Test',
      start: 'start',
      nodes: { start: { title: 'Start', text: 'Text', choices: [] } },
    };
    const elements = {
      titleEl: document.createElement('div'),
      textEl: document.createElement('div'),
      choicesEl: document.createElement('div'),
    };
    const engine = GameEngine.createEngine(testGame, elements);

    function checkConditions(conditions) {
      if (!Array.isArray(conditions) || conditions.length === 0) return true;
      return conditions.every(cond => {
        if (!cond || typeof cond !== 'object') return true;
        switch (cond.type) {
          case 'has_item': {
            const count = typeof cond.count === 'number' ? cond.count : 1;
            return engine.hasItem(cond.itemId, count);
          }
          case 'inventory_empty': {
            const inv = engine.getInventory();
            return Array.isArray(inv.items) && inv.items.length === 0;
          }
          default:
            return false;
        }
      });
    }

    // アイテム条件テスト
    engine.addItem('key', 1);
    this.assert(
      checkConditions([{ type: 'has_item', itemId: 'key' }]),
      'Should pass has_item condition'
    );
    this.assert(
      !checkConditions([{ type: 'has_item', itemId: 'nonexistent' }]),
      'Should fail has_item condition for nonexistent item'
    );

    // インベントリ条件テスト
    this.assert(!checkConditions([{ type: 'inventory_empty' }]), 'Should not be empty');
    const ps = engine.getPlayerState();
    engine.setPlayerState({
      ...ps,
      inventory: {
        ...(ps.inventory || {}),
        items: [],
      },
    });
    this.assert(checkConditions([{ type: 'inventory_empty' }]), 'Should be empty after clear');
  },

  // 永続化テスト
  testPersistence: function () {
    console.debug('--- Persistence Tests ---');

    const testGame = {
      title: 'Test Game',
      start: 'start',
      nodes: { start: { title: 'Start', text: 'Text', choices: [] } },
    };
    const elements = {
      titleEl: document.createElement('div'),
      textEl: document.createElement('div'),
      choicesEl: document.createElement('div'),
    };
    const engine = GameEngine.createEngine(testGame, elements);

    // 状態変更
    engine.addItem('test_item', 1);
    engine.setNode('start'); // 何か変更

    // 新しいエンジンで読み込み
    const newEngine = GameEngine.createEngine(testGame, elements);
    newEngine.loadProgress();

    // 状態が復元されているか確認
    this.assert(newEngine.hasItem('test_item'), 'Item should be persisted');
  },

  // 自動セーブテスト
  testAutoSave: function () {
    console.debug('--- Auto Save Tests ---');

    // 自動セーブ設定が有効な場合のテスト
    if (window.APP_CONFIG?.game?.autoSave?.enabled) {
      const testGame = {
        title: 'Test',
        start: 'start',
        nodes: { start: { title: 'Start', text: 'Text', choices: [] } },
      };
      const elements = {
        titleEl: document.createElement('div'),
        textEl: document.createElement('div'),
        choicesEl: document.createElement('div'),
      };
      const engine = GameEngine.createEngine(testGame, elements);

      // ノード遷移で自動セーブが実行されるはず
      const originalSave = engine.saveProgress;
      let saveCalled = false;
      engine.saveProgress = function () {
        saveCalled = true;
        originalSave.call(this);
      };

      engine.setNode('start'); // 同じノードでも動作するか

      // 非同期なので少し待つ
      setTimeout(() => {
        this.assert(saveCalled, 'Auto save should be called');
      }, 100);
    } else {
      console.debug('Auto save disabled, skipping test');
    }
  },

  // 結果表示
  showResults: function () {
    console.debug('=== Test Results ===');
    console.debug(`Total: ${this.passed + this.failed}`);
    console.debug(`Passed: ${this.passed}`);
    console.debug(`Failed: ${this.failed}`);

    if (this.failed > 0) {
      console.debug('Failed tests:');
      this.results.filter(r => r.status === 'FAIL').forEach(r => console.debug(' -', r.message));
    }

    // DOMに結果表示
    const resultDiv = document.createElement('div');
    resultDiv.id = 'test-results';
    resultDiv.innerHTML = `
      <h3>Test Results</h3>
      <p>Total: ${this.passed + this.failed}, Passed: ${this.passed}, Failed: ${this.failed}</p>
      <details>
        <summary>Detailed Results</summary>
        <ul>
          ${this.results.map(r => `<li class="${r.status.toLowerCase()}">${r.status}: ${r.message}</li>`).join('')}
        </ul>
      </details>
    `;
    resultDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: white;
      border: 1px solid #ccc;
      padding: 10px;
      max-width: 300px;
      z-index: 10000;
      font-family: monospace;
    `;

    document.body.appendChild(resultDiv);
  },
};

// テスト実行関数をグローバルに公開
window.runTests = function () {
  window.GameEngineTests.run();
};
