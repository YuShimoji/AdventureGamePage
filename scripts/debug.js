// Debug UI functionality
(function () {
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
      console.debug(`アイテム追加: ${itemId} - ${success ? '成功' : '失敗'}`);
      if (window.updateInventoryUI) window.updateInventoryUI();
    }
  }

  function debugRemoveItem() {
    const itemId = prompt('アイテムIDを入力:', 'sword');
    if (itemId && window.gameEngine?.removeItem) {
      const success = window.gameEngine.removeItem(itemId, 1);
      console.debug(`アイテム削除: ${itemId} - ${success ? '成功' : '失敗'}`);
      if (window.updateInventoryUI) window.updateInventoryUI();
    }
  }

  function debugClearInventory() {
    if (!window.gameEngine?.getPlayerState || !window.gameEngine?.setPlayerState) return;
    try {
      const ps = window.gameEngine.getPlayerState();
      const next = {
        ...ps,
        inventory: {
          ...(ps.inventory || {}),
          items: [],
        },
      };
      window.gameEngine.setPlayerState(next);
      console.debug('インベントリクリア完了');
      if (window.updateInventoryUI) window.updateInventoryUI();
    } catch (e) {
      console.error('インベントリクリア失敗:', e);
    }
  }

  function debugSave() {
    if (!window.gameEngine?.getPlayerState || !window.gameEngine?.setPlayerState) return;
    try {
      const ps = window.gameEngine.getPlayerState();
      window.gameEngine.setPlayerState(ps);
      console.debug('ゲーム保存完了');
    } catch (e) {
      console.error('ゲーム保存失敗:', e);
    }
  }

  function debugLoad() {
    if (window.gameEngine?.loadProgress) {
      window.gameEngine.loadProgress();
      console.debug('ゲーム読み込み完了');
      if (window.updateInventoryUI) window.updateInventoryUI();
    }
  }

  function debugReset() {
    if (window.gameEngine?.reset) {
      window.gameEngine.reset();
      console.debug('ゲームリセット完了');
      if (window.updateInventoryUI) window.updateInventoryUI();
    }
  }

  function debugJumpNode() {
    const nodeId = document.getElementById('debug-node-id')?.value;
    if (nodeId && window.gameEngine?.setNode) {
      try {
        window.gameEngine.setNode(nodeId);
        console.debug(`ノードジャンプ: ${nodeId}`);
      } catch (e) {
        console.error(`ノードジャンプ失敗: ${nodeId}`, e);
      }
    }
  }

  function debugShowState() {
    if (window.gameEngine) {
      console.debug('ゲーム状態:', {
        currentNode: window.gameEngine.currentNodeId || '不明',
        hasBack: window.gameEngine.canGoBack?.() || false,
        hasForward: window.gameEngine.canGoForward?.() || false,
        inventory: window.gameEngine.getInventory?.() || {},
      });
    }
  }

  function debugShowInventory() {
    if (window.gameEngine?.getInventory) {
      console.debug('インベントリ:', window.gameEngine.getInventory());
    }
  }

  function debugSetVariable() {
    const key = prompt('変数キー:', 'score');
    if (!key) return;
    const value = prompt('値:', '0');
    if (value === null) return;
    const operation = prompt('操作 (set/add/subtract/multiply/divide):', 'set');

    if (!window.gameEngine?.getPlayerState || !window.gameEngine?.setPlayerState) return;

    try {
      const ps = window.gameEngine.getPlayerState();
      const vars = ps.variables && typeof ps.variables === 'object' ? { ...ps.variables } : {};
      const op = operation || 'set';
      const raw = isNaN(value) ? value : parseFloat(value);
      const current = vars[key] ?? 0;
      let nextValue = raw;

      if (op !== 'set') {
        const curNum = typeof current === 'number' ? current : parseFloat(current) || 0;
        const valNum = typeof raw === 'number' ? raw : parseFloat(raw) || 0;
        switch (op) {
          case 'add':
            nextValue = curNum + valNum;
            break;
          case 'subtract':
            nextValue = curNum - valNum;
            break;
          case 'multiply':
            nextValue = curNum * (valNum || 1);
            break;
          case 'divide':
            nextValue = valNum !== 0 ? curNum / valNum : curNum;
            break;
          default:
            nextValue = raw;
        }
      }

      vars[key] = nextValue;
      window.gameEngine.setPlayerState({
        ...ps,
        variables: vars,
      });

      console.debug(`変数操作: ${key} ${op} ${value}`);
      if (window.ToastManager) {
        ToastManager.success(`変数を設定しました: ${key} = ${String(nextValue)}`);
      } else {
        alert(`変数を設定しました: ${key} = ${String(nextValue)}`);
      }
    } catch (e) {
      console.error('変数設定エラー:', e);
      if (window.ToastManager) {
        ToastManager.error('変数設定に失敗しました');
      } else {
        alert('変数設定に失敗しました');
      }
    }
  }

  function debugShowVariables() {
    if (window.gameEngine) {
      try {
        const ps = window.gameEngine.getPlayerState ? window.gameEngine.getPlayerState() : {};
        const vars = ps.variables || {};
        console.debug('現在の変数:', vars);
        if (window.ToastManager) {
          ToastManager.info(`現在の変数:\n${JSON.stringify(vars, null, 2)}`);
        } else {
          alert(`現在の変数:\n${JSON.stringify(vars, null, 2)}`);
        }
      } catch (e) {
        console.error('変数取得エラー:', e);
        if (window.ToastManager) {
          ToastManager.error('変数取得に失敗しました');
        } else {
          alert('変数取得に失敗しました');
        }
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

  console.debug('デバッグUIが有効化されました (🔧ボタン)');
})();
