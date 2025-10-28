(function () {
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
            ? n.choices.map((c) => ({ text: c.label ?? c.text ?? "", to: c.target ?? c.to ?? "" }))
            : [],
        };
      });
      return {
        title: data?.meta?.title || data.title || "Adventure",
        start: data?.meta?.start || data.start || "start",
        nodes,
      };
    }
    // Already engine-like
    if (data.nodes && !Array.isArray(data.nodes)) return data;
    return null;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const fileEl = document.getElementById("play-file-import");
    if (!fileEl) return;
    fileEl.addEventListener("change", (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const obj = JSON.parse(reader.result);
          if (window.Validator?.validateGameSpec && Array.isArray(obj?.nodes)) {
            const v = window.Validator.validateGameSpec(obj);
            if (!v.ok) {
              alert("ゲームJSONの検証に失敗しました:\n- " + v.errors.join("\n- "));
              return;
            }
          }
          const engine = window.Converters?.normalizeSpecToEngine
            ? window.Converters.normalizeSpecToEngine(obj)
            : normalizeSpecToEngine(obj);
          if (!engine) {
            alert("対応していない形式です");
            return;
          }
          StorageUtil.saveJSON("agp_game_data", engine);
          alert("ゲームJSONを読み込みました。ページを再読み込みします。");
          location.reload();
        } catch (e) {
          console.error(e);
          alert("ゲームJSONの読み込みに失敗しました");
        }
      };
      reader.readAsText(file);
      ev.target.value = "";
    });
  });
})();
