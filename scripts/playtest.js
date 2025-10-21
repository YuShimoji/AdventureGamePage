(function(){
  function showStatus(msg, kind = 'info'){
    const status = document.getElementById('playtest-status');
    if(!status) return;
    status.textContent = msg;
    status.className = `muted ${kind}`;
  }

  function getCurrentGameData(){
    // Get current spec from NodeEditor
    const spec = window.NodeEditorAPI?.getSpec?.();
    if(!spec || !spec.nodes || spec.nodes.length === 0){
      return null;
    }
    
    // Validate basic structure
    if(!spec.meta || !spec.meta.start){
      return null;
    }
    
    return spec;
  }

  function openPlaytestInline(){
    const gameData = getCurrentGameData();
    
    if(!gameData){
      showStatus('エラー: プレイ可能なゲームデータがありません。ノードを作成してください。', 'error');
      return;
    }

    // Save to temporary storage
    const tempKey = '__playtest_temp__';
    try {
      window.StorageBridge.save(tempKey, gameData);
      showStatus('プレイテストモードを起動中...', 'info');
      
      // Open modal
      const modal = document.getElementById('playtest-modal');
      const iframe = document.getElementById('playtest-iframe');
      
      if(!modal || !iframe){
        showStatus('エラー: プレイテストUIが見つかりません', 'error');
        return;
      }
      
      // Load play.html in iframe with temp data
      iframe.src = `play.html?autoload=${tempKey}`;
      modal.hidden = false;
      
      showStatus('プレイテスト起動完了', 'ok');
    } catch(e){
      console.error('Playtest error:', e);
      showStatus('エラー: ' + e.message, 'error');
    }
  }

  function openPlaytestWindow(){
    const gameData = getCurrentGameData();
    
    if(!gameData){
      showStatus('エラー: プレイ可能なゲームデータがありません。ノードを作成してください。', 'error');
      return;
    }

    // Save to temporary storage
    const tempKey = '__playtest_temp__';
    try {
      window.StorageBridge.save(tempKey, gameData);
      showStatus('新しいウィンドウでプレイテストを開きます...', 'info');
      
      // Open in new window
      const w = window.open(`play.html?autoload=${tempKey}`, '_blank');
      
      if(!w){
        showStatus('エラー: 新しいウィンドウを開けませんでした。ポップアップブロックを確認してください。', 'error');
      } else {
        showStatus('プレイテスト起動完了（別ウィンドウ）', 'ok');
      }
    } catch(e){
      console.error('Playtest error:', e);
      showStatus('エラー: ' + e.message, 'error');
    }
  }

  function closePlaytestModal(){
    const modal = document.getElementById('playtest-modal');
    const iframe = document.getElementById('playtest-iframe');
    
    if(modal) modal.hidden = true;
    if(iframe) iframe.src = '';
    
    showStatus('', 'info');
  }

  function bind(){
    const inlineBtn = document.getElementById('playtest-inline');
    const windowBtn = document.getElementById('playtest-window');
    const closeBtn = document.getElementById('playtest-modal-close');

    if(inlineBtn){
      inlineBtn.addEventListener('click', openPlaytestInline);
    }

    if(windowBtn){
      windowBtn.addEventListener('click', openPlaytestWindow);
    }

    if(closeBtn){
      closeBtn.addEventListener('click', closePlaytestModal);
    }

    // ESC to close modal
    document.addEventListener('keydown', (ev) => {
      const modal = document.getElementById('playtest-modal');
      if(ev.key === 'Escape' && modal && !modal.hidden){
        closePlaytestModal();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('playtest-panel')){
      bind();
    }
  });

  // Export API
  window.PlaytestAPI = {
    openInline: openPlaytestInline,
    openWindow: openPlaytestWindow,
    close: closePlaytestModal
  };
})();
