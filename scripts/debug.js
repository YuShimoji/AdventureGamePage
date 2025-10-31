// Debug UI functionality
(function() {
  // Check if debug mode is enabled
  const isDebugEnabled = window.APP_CONFIG?.debug?.enabled === true;
  const debugUI = document.getElementById('debug-ui');

  if (!isDebugEnabled || !debugUI) return;

  debugUI.hidden = false;

  const debugToggle = document.getElementById('debug-toggle');
  const debugPanel = document.getElementById('debug-panel');
  const debugClose = document.getElementById('debug-close');

  // Toggle debug panel
  debugToggle?.addEventListener('click', () => {
    debugPanel.hidden = !debugPanel.hidden;
  });

  debugClose?.addEventListener('click', () => {
    debugPanel.hidden = true;
  });

  // Debug functions
  function debugAddItem() {
    const itemId = prompt('アイテムIDを入力:', 'sword');
    if (itemId && window.gameEngine?.addItem) {
      const success = window.gameEngine.addItem(itemId, 1);
      console.log(`アイテム追加: ${itemId} - ${success ? '成功' : '失敗'}`);
      if (window.updateInventoryUI) window.updateInventoryUI();
    }
  }

  function debugRemoveItem() {
    const itemId = prompt('アイテムIDを入力:', 'sword');
    if (itemId && window.gameEngine?.removeItem) {
      const success = window.gameEngine.removeItem(itemId, 1);
      console.log(`アイテム削除: ${itemId} - ${success ? '成功' : '失敗'}`);
      if (window.updateInventoryUI) window.updateInventoryUI();
    }
  }

  function debugClearInventory() {
    if (window.gameEngine?.clearInventory) {
      window.gameEngine.clearInventory();
      console.log('インベントリクリア完了');
      if (window.updateInventoryUI) window.updateInventoryUI();
    }
  }

  function debugSave() {
    if (window.gameEngine?.saveProgress) {
      window.gameEngine.saveProgress();
      console.log('ゲーム保存完了');
    }
  }

  function debugLoad() {
    if (window.gameEngine?.loadProgress) {
      window.gameEngine.loadProgress();
      console.log('ゲーム読み込み完了');
      if (window.updateInventoryUI) window.updateInventoryUI();
    }
  }

  function debugReset() {
    if (window.gameEngine?.reset) {
      window.gameEngine.reset();
      console.log('ゲームリセット完了');
      if (window.updateInventoryUI) window.updateInventoryUI();
    }
  }

  function debugJumpNode() {
    const nodeId = document.getElementById('debug-node-id')?.value;
    if (nodeId && window.gameEngine?.setNode) {
      try {
        window.gameEngine.setNode(nodeId);
        console.log(`ノードジャンプ: ${nodeId}`);
      } catch (e) {
        console.error(`ノードジャンプ失敗: ${nodeId}`, e);
      }
    }
  }

  function debugShowState() {
    if (window.gameEngine) {
      console.log('ゲーム状態:', {
        currentNode: window.gameEngine.currentNodeId || '不明',
        hasBack: window.gameEngine.canGoBack?.() || false,
        hasForward: window.gameEngine.canGoForward?.() || false,
        inventory: window.gameEngine.getInventory?.() || {}
      });
    }
  }

  function debugShowInventory() {
    if (window.gameEngine?.getInventory) {
      console.log('インベントリ:', window.gameEngine.getInventory());
    }
  }

  function debugSetVariable() {
    const key = prompt('変数キー:', 'score');
    if (!key) return;
    const value = prompt('値:', '0');
    if (value === null) return;
    const operation = prompt('操作 (set/add/subtract/multiply/divide):', 'set');

    if (window.gameEngine?.executeAction) {
      const action = {
        type: 'set_variable',
        key: key,
        value: isNaN(value) ? value : parseFloat(value),
        operation: operation || 'set'
      };
      // デバッグ用のアクション実行
      try {
        window.gameEngine.executeAction(action);
        console.log(`変数操作: ${key} ${operation} ${value}`);
        alert(`変数を設定しました: ${key} = ${value}`);
      } catch (e) {
        console.error('変数設定エラー:', e);
        alert('変数設定に失敗しました');
      }
    }
  }

  function debugShowVariables() {
    if (window.gameEngine) {
      try {
        const state = window.gameEngine.getState ? window.gameEngine.getState() : {};
        const vars = state.variables || {};
        console.log('現在の変数:', vars);
        alert(`現在の変数:\n${JSON.stringify(vars, null, 2)}`);
      } catch (e) {
        console.error('変数取得エラー:', e);
        alert('変数取得に失敗しました');
      }
    }
  }

  // Bind button events
  document.getElementById('debug-add-item')?.addEventListener('click', debugAddItem);
  document.getElementById('debug-remove-item')?.addEventListener('click', debugRemoveItem);
  document.getElementById('debug-clear-inventory')?.addEventListener('click', debugClearInventory);
  document.getElementById('debug-save')?.addEventListener('click', debugSave);
  document.getElementById('debug-load')?.addEventListener('click', debugLoad);
  document.getElementById('debug-reset')?.addEventListener('click', debugReset);
  document.getElementById('debug-jump-node')?.addEventListener('click', debugJumpNode);
  document.getElementById('debug-show-state')?.addEventListener('click', debugShowState);
  document.getElementById('debug-show-inventory')?.addEventListener('click', debugShowInventory);
  document.getElementById('debug-set-variable')?.addEventListener('click', debugSetVariable);
  document.getElementById('debug-show-variables')?.addEventListener('click', debugShowVariables);

  console.log('デバッグUIが有効化されました (🔧ボタン)');
})();
