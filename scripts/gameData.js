(function () {
  function download(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function nowISO() {
    try {
      return new Date().toISOString();
    } catch {
      return "";
    }
  }

  // wrapper: use Converters if available
  function engineToSpec(engine) {
    if (window.Converters?.engineToSpec) {
      return window.Converters.engineToSpec(engine);
    }
    if (!engine || !engine.nodes) return null;
    const nodes = Object.entries(engine.nodes).map(([id, n]) => ({
      id,
      title: n.title || "",
      text: n.text || "",
      choices: (n.choices || []).map((c) => ({ id: "", label: c.text || "", target: c.to || "" })),
    }));
    return {
      version: "1.0",
      meta: {
        title: engine.title || "Adventure",
        author: "",
        createdAt: nowISO(),
        updatedAt: nowISO(),
        start: engine.start || "start",
      },
      nodes,
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("btn-export-game");
    if (btn)
      btn.addEventListener("click", () => {
        const titleInput = document.getElementById("title-input");
        const editor = document.getElementById("editor");
        const title =
          (titleInput?.value || "").trim() ||
          (window.APP_CONFIG?.strings?.defaultTitle ?? "Untitled");
        const data = {
          version: "1.0",
          meta: {
            title,
            author: "",
            createdAt: nowISO(),
            updatedAt: nowISO(),
            start: "scene:start",
          },
          nodes: [
            {
              id: "scene:start",
              title,
              text: editor?.innerText || "",
              choices: [],
            },
          ],
        };
        download(data, `${title.replace(/[^\w\-一-龯ぁ-ゔァ-ヴー]/g, "_")}.game.json`);
      });

    const btnCurrent = document.getElementById("btn-export-game-current");
    if (btnCurrent)
      btnCurrent.addEventListener("click", () => {
        const engine = StorageUtil.loadJSON("agp_game_data");
        const spec = engineToSpec(engine || window.SAMPLE_GAME);
        if (!spec) {
          alert("エクスポート可能なゲームデータがありません");
          return;
        }
        const title = spec?.meta?.title || "Adventure";
        download(spec, `${title.replace(/[^\w\-一-龯ぁ-ゔァ-ヴー]/g, "_")}.game.json`);
      });
  });
})();
