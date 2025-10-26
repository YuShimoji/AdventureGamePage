// Game Engine Test Suite
window.GameEngineTests = {
  // テスト結果
  results: [],
  passed: 0,
  failed: 0,

  // テスト実行
  run: function() {
    console.log('=== Game Engine Test Suite ===');
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
  assert: function(condition, message) {
    if (condition) {
      this.passed++;
      console.log('✅ PASS:', message);
      this.results.push({ status: 'PASS', message });
    } else {
      this.failed++;
      console.error('❌ FAIL:', message);
      this.results.push({ status: 'FAIL', message });
    }
  },

  assertEqual: function(actual, expected, message) {
    this.assert(actual === expected, `${message} (expected: ${expected}, actual: ${actual})`);
  },

  assertThrows: function(fn, message) {
    try {
      fn();
      this.assert(false, `${message} (expected to throw)`);
    } catch (e) {
      this.assert(true, `${message} (threw: ${e.message})`);
    }
  },

  // 基本機能テスト
  testBasicFunctionality: function() {
    console.log('--- Basic Functionality Tests ---');

    const testGame = {
      title: "Test Game",
      start: "start",
      nodes: {
        start: { title: "Start", text: "Start text", choices: [] },
        end: { title: "End", text: "End text", choices: [] }
      }
    };

    const elements = {
      titleEl: document.createElement('div'),
      textEl: document.createElement('div'),
      choicesEl: document.createElement('div')
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
  testInventorySystem: function() {
    console.log('--- Inventory System Tests ---');

    const testGame = { title: "Test", start: "start", nodes: { start: { title: "Start", text: "Text", choices: [] } } };
    const elements = { titleEl: document.createElement('div'), textEl: document.createElement('div'), choicesEl: document.createElement('div') };
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
  testVariableSystem: function() {
    console.log('--- Variable System Tests ---');

    const testGame = { title: "Test", start: "start", nodes: { start: { title: "Start", text: "Text", choices: [] } } };
    const elements = { titleEl: document.createElement('div'), textEl: document.createElement('div'), choicesEl: document.createElement('div') };
    const engine = GameEngine.createEngine(testGame, elements);

    // 変数設定テスト
    engine.executeAction({ type: 'set_variable', key: 'score', value: 100 });
    // 変数取得方法が必要だが、現状は直接アクセスできないためスキップ

    // 演算テスト
    engine.executeAction({ type: 'set_variable', key: 'score', operation: 'add', value: 50 });
    engine.executeAction({ type: 'set_variable', key: 'health', operation: 'subtract', value: 10 });

    // 条件チェックテストは次のテストで
  },

  // 条件システムテスト
  testConditionSystem: function() {
    console.log('--- Condition System Tests ---');

    const testGame = { title: "Test", start: "start", nodes: { start: { title: "Start", text: "Text", choices: [] } } };
    const elements = { titleEl: document.createElement('div'), textEl: document.createElement('div'), choicesEl: document.createElement('div') };
    const engine = GameEngine.createEngine(testGame, elements);

    // アイテム条件テスト
    engine.addItem('key', 1);
    this.assert(engine.checkConditions([{ type: 'has_item', itemId: 'key' }]), 'Should pass has_item condition');
    this.assert(!engine.checkConditions([{ type: 'has_item', itemId: 'nonexistent' }]), 'Should fail has_item condition for nonexistent item');

    // インベントリ条件テスト
    this.assert(!engine.checkConditions([{ type: 'inventory_empty' }]), 'Should not be empty');
    engine.clearInventory();
    this.assert(engine.checkConditions([{ type: 'inventory_empty' }]), 'Should be empty after clear');
  },

  // 永続化テスト
  testPersistence: function() {
    console.log('--- Persistence Tests ---');

    const testGame = { title: "Test Game", start: "start", nodes: { start: { title: "Start", text: "Text", choices: [] } } };
    const elements = { titleEl: document.createElement('div'), textEl: document.createElement('div'), choicesEl: document.createElement('div') };
    const engine = GameEngine.createEngine(testGame, elements);

    // 状態変更
    engine.addItem('test_item', 1);
    engine.setNode('start'); // 何か変更

    // 保存
    engine.saveProgress();

    // 新しいエンジンで読み込み
    const newEngine = GameEngine.createEngine(testGame, elements);
    newEngine.loadProgress();

    // 状態が復元されているか確認
    this.assert(newEngine.hasItem('test_item'), 'Item should be persisted');
  },

  // 自動セーブテスト
  testAutoSave: function() {
    console.log('--- Auto Save Tests ---');

    // 自動セーブ設定が有効な場合のテスト
    if (window.APP_CONFIG?.game?.autoSave?.enabled) {
      const testGame = { title: "Test", start: "start", nodes: { start: { title: "Start", text: "Text", choices: [] } } };
      const elements = { titleEl: document.createElement('div'), textEl: document.createElement('div'), choicesEl: document.createElement('div') };
      const engine = GameEngine.createEngine(testGame, elements);

      // ノード遷移で自動セーブが実行されるはず
      const originalSave = engine.saveProgress;
      let saveCalled = false;
      engine.saveProgress = function() { saveCalled = true; originalSave.call(this); };

      engine.setNode('start'); // 同じノードでも動作するか

      // 非同期なので少し待つ
      setTimeout(() => {
        this.assert(saveCalled, 'Auto save should be called');
      }, 100);
    } else {
      console.log('Auto save disabled, skipping test');
    }
  },

  // 結果表示
  showResults: function() {
    console.log('=== Test Results ===');
    console.log(`Total: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);

    if (this.failed > 0) {
      console.log('Failed tests:');
      this.results.filter(r => r.status === 'FAIL').forEach(r => console.log(' -', r.message));
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
  }
};

// テスト実行関数をグローバルに公開
window.runTests = function() {
  window.GameEngineTests.run();
};
