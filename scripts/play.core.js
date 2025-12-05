(function () {
  // Play Core Module - Game initialization and engine setup
  window.PlayCore = {
    init: function () {
      const elements = this.getUIElements();
      const game = this.loadGameData();
      const engine = this.createEngine(elements, game);

      // Load progress
      try {
        engine.loadProgress();
      } catch (e) {
        console.error('進行データの読み込みエラー:', e);
        if (window.ToastManager) {
          ToastManager.error('進行データの読み込みに失敗しました。最初から開始します。');
        } else {
          alert('進行データの読み込みに失敗しました。最初から開始します。');
        }
        engine.reset();
      }

      // Initial render
      engine.render();

      return { elements, engine, game };
    },

    getUIElements: function () {
      return {
        titleEl: document.getElementById('game-title'),
        textEl: document.getElementById('scene'),
        choicesEl: document.getElementById('choices'),
        btnRestart: document.getElementById('btn-restart'),
        backBtn: document.getElementById('btn-back'),
        forwardBtn: document.getElementById('btn-forward'),
      };
    },

    loadGameData: function () {
      const GAME_DATA_KEY = window.APP_CONFIG?.storage?.keys?.gameData || 'agp_game_data';
      function normalizeSpecToEngine(data) {
        if (!data) return null;
        if (Array.isArray(data.nodes)) {
          const nodes = {};
          data.nodes.forEach(n => {
            if (!n || !n.id) return;
            nodes[n.id] = {
              title: n.title || '',
              text: n.text || '',
              choices: Array.isArray(n.choices)
                ? n.choices.map(c => ({
                    text: c.label ?? c.text ?? '',
                    to: c.target ?? c.to ?? '',
                  }))
                : [],
            };
          });
          return {
            title: data?.meta?.title || data.title || 'Adventure',
            start: data?.meta?.start || data.start || 'start',
            nodes,
          };
        }
        return data;
      }

      const loaded = StorageUtil.loadJSON(GAME_DATA_KEY);
      console.log('Loaded game data from storage:', loaded);
      const normalize = window.Converters?.normalizeSpecToEngine || normalizeSpecToEngine;
      console.log('Using normalize function:', normalize);
      let game;
      try {
        game = normalize(loaded);
        console.log('Normalized game data:', game);
        if (!game && loaded) {
          const invalidError = new Error('保存されたゲームデータの形式が無効です。');
          invalidError.code = 'INVALID_GAME_DATA';
          throw invalidError;
        }
        if (!game) {
          const noDataError = new Error(
            'ゲームデータが保存されていません。管理画面でゲームを作成してください。'
          );
          noDataError.code = 'NO_GAME_DATA';
          throw noDataError;
        }
      } catch (e) {
        if (e && e.code === 'NO_GAME_DATA') {
          if (window.APP_CONFIG?.debug?.showConsoleLogs) {
            console.info(
              '[PLAY] No game data found in storage (expected for first-time users).',
              e
            );
          }
        } else {
          console.error('ゲームデータの読み込みエラー:', e);
        }
        const wrapped = new Error(`ゲームデータの読み込みに失敗しました: ${e.message}`);
        if (e && e.code) {
          wrapped.code = e.code;
        }
        throw wrapped;
      }
      console.log('Final game data:', game);
      return game;
    },

    createEngine: function (elements, game) {
      console.log('Creating engine with game data:', game);
      console.log('Game data start property:', game?.start);
      return GameEngine.createEngine(game, {
        titleEl: elements.titleEl,
        textEl: elements.textEl,
        choicesEl: elements.choicesEl,
        backBtn: elements.backBtn,
        forwardBtn: elements.forwardBtn,
      });
    },
  };
})();
