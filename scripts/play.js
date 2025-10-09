(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const titleEl = document.getElementById('game-title');
    const textEl = document.getElementById('scene');
    const choicesEl = document.getElementById('choices');
    const btnRestart = document.getElementById('btn-restart');
    const backBtn = document.getElementById('btn-back');
    const forwardBtn = document.getElementById('btn-forward');

    function normalizeSpecToEngine(data){
      if(!data) return null;
      if(Array.isArray(data.nodes)){
        const nodes = {};
        data.nodes.forEach(n => {
          if(!n || !n.id) return;
          nodes[n.id] = {
            title: n.title || '',
            text: n.text || '',
            choices: Array.isArray(n.choices) ? n.choices.map(c => ({ text: c.label ?? c.text ?? '', to: c.target ?? c.to ?? '' })) : []
          };
        });
        return {
          title: data?.meta?.title || data.title || 'Adventure',
          start: data?.meta?.start || data.start || 'start',
          nodes
        };
      }
      return data;
    }

    const loaded = StorageUtil.loadJSON('agp_game_data');
    const normalize = (window.Converters?.normalizeSpecToEngine) || normalizeSpecToEngine;
    const game = normalize(loaded) || window.SAMPLE_GAME;

    const engine = GameEngine.createEngine(game, { titleEl, textEl, choicesEl, backBtn, forwardBtn });
    engine.loadProgress();
    // 進行が保存されていればそれを復元、なければ初期ノードが使用される
    // engine.reset() は初期化（リスタート）専用
    engine.render();

    btnRestart.addEventListener('click', () => engine.reset());

    // Keyboard shortcuts: ← 戻る / → 進む / R リスタート
    function shouldHandleShortcut(target){
      if(!window.APP_CONFIG?.ui?.shortcutsEnabled) return false;
      const el = target;
      if(!el) return true;
      const tag = (el.tagName || '').toUpperCase();
      if(tag === 'INPUT' || tag === 'TEXTAREA') return false;
      if(el.isContentEditable) return false;
      return true;
    }
    window.addEventListener('keydown', (e) => {
      if(!shouldHandleShortcut(e.target)) return;
      // Back
      if(e.key === 'ArrowLeft'){
        const ok = typeof engine.goBack === 'function' && engine.goBack();
        if(ok){ e.preventDefault(); }
        return;
      }
      // Forward
      if(e.key === 'ArrowRight'){
        const ok = typeof engine.goForward === 'function' && engine.goForward();
        if(ok){ e.preventDefault(); }
        return;
      }
      // Restart
      if(e.key === 'r' || e.key === 'R'){
        if(typeof engine.reset === 'function'){
          engine.reset();
          e.preventDefault();
        }
      }
    });
  });
})();
