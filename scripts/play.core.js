(function () {
  // Play Core Module - Game initialization and engine setup
  window.PlayCore = {
    init: function() {
      const elements = this.getUIElements();
      const game = this.loadGameData();
      const engine = this.createEngine(elements, game);

      // Load progress
      try {
        engine.loadProgress();
      } catch (e) {
        console.error("進行データの読み込みエラー:", e);
        alert("進行データの読み込みに失敗しました。最初から開始します。");
        engine.reset();
      }

      // Initial render
      engine.render();

      return { elements, engine, game };
    },

    getUIElements: function() {
      return {
        titleEl: document.getElementById("game-title"),
        textEl: document.getElementById("scene"),
        choicesEl: document.getElementById("choices"),
        btnRestart: document.getElementById("btn-restart"),
        backBtn: document.getElementById("btn-back"),
        forwardBtn: document.getElementById("btn-forward")
      };
    },

    loadGameData: function() {
      function normalizeSpecToEngine(data) {
        if (!data) return null;
        if (Array.isArray(data.nodes)) {
          const nodes = {};
          data.nodes.forEach((n) => {
            if (!n || !n.id) return;
            nodes[n.id] = {
              title: n.title || "",
              text: n.text || "",
              choices: Array.isArray(n.choices)
                ? n.choices.map((c) => ({
                    text: c.label ?? c.text ?? "",
                    to: c.target ?? c.to ?? "",
                  }))
                : [],
            };
          });
          return {
            title: data?.meta?.title || data.title || "Adventure",
            start: data?.meta?.start || data.start || "start",
            nodes,
          };
        }
        return data;
      }

      const loaded = StorageUtil.loadJSON("agp_game_data");
      const normalize = window.Converters?.normalizeSpecToEngine || normalizeSpecToEngine;
      let game;
      try {
        game = normalize(loaded);
        if (!game && loaded) {
          throw new Error("保存されたゲームデータの形式が無効です。");
        }
        if (!game) {
          game = window.SAMPLE_GAME;
          console.info("サンプルゲームを使用します。");
        }
      } catch (e) {
        console.error("ゲームデータの読み込みエラー:", e);
        alert(`ゲームデータの読み込みに失敗しました: ${e.message}\nサンプルゲームを使用します。`);
        game = window.SAMPLE_GAME;
      }
      return game;
    },

    createEngine: function(elements, game) {
      return GameEngine.createEngine(game, {
        titleEl: elements.titleEl,
        textEl: elements.textEl,
        choicesEl: elements.choicesEl,
        backBtn: elements.backBtn,
        forwardBtn: elements.forwardBtn,
      });
    }
  };
})();
