(function () {
  function isStr(x) {
    return typeof x === "string" && x.length >= 0;
  }
  function pathMsg(path, msg) {
    return (path ? path + ": " : "") + msg;
  }
  function pushErr(state, path, code, msg) {
    state.errors.push(pathMsg(path, msg));
    state.errorDetails.push({ path, code, message: msg });
  }
  function pushWarn(state, path, code, msg) {
    state.warnings.push(pathMsg(path, msg));
    state.warningDetails.push({ path, code, message: msg });
  }

  function validateGameSpec(spec) {
    const state = { errors: [], warnings: [], errorDetails: [], warningDetails: [] };
    if (typeof spec !== "object" || spec === null) {
      state.errors.push("ルートがオブジェクトではありません");
      return {
        ok: false,
        errors: state.errors,
        warnings: state.warnings,
        errorDetails: state.errorDetails,
        warningDetails: state.warningDetails,
      };
    }

    // meta
    if (spec.meta && typeof spec.meta !== "object") {
      pushErr(state, "meta", "ERR_META_NOT_OBJECT", "meta はオブジェクトである必要があります");
    }
    const start = spec?.meta?.start ?? spec?.start;
    if (!isStr(start))
      pushErr(
        state,
        "meta.start",
        "ERR_START_NOT_STRING",
        "meta.start/start は文字列である必要があります"
      );

    // nodes
    let ids = [];
    if (!Array.isArray(spec.nodes)) {
      pushErr(state, "nodes", "ERR_NODES_NOT_ARRAY", "nodes は配列である必要があります");
    } else {
      const seen = new Set();
      spec.nodes.forEach((n, i) => {
        const p = `nodes[${i}]`;
        if (typeof n !== "object" || n === null) {
          pushErr(state, p, "ERR_NODE_NOT_OBJECT", "オブジェクトではありません");
          return;
        }
        if (!isStr(n.id)) pushErr(state, p + ".id", "ERR_NODE_ID_REQUIRED", "id が必要です");
        else {
          if (seen.has(n.id))
            pushErr(state, p + ".id", "ERR_DUP_NODE_ID", `id '${n.id}' が重複しています`);
          seen.add(n.id);
        }
        if (n.text != null && !isStr(n.text))
          pushErr(state, p + ".text", "ERR_TEXT_NOT_STRING", "text は文字列である必要があります");
        if (n.choices != null && !Array.isArray(n.choices))
          pushErr(
            state,
            p + ".choices",
            "ERR_CHOICES_NOT_ARRAY",
            "choices は配列である必要があります"
          );
      });
      ids = spec.nodes.filter((x) => x && isStr(x.id)).map((x) => x.id);
    }

    // start existence
    if (isStr(start) && ids.length > 0 && !ids.includes(start)) {
      pushErr(
        state,
        "meta.start",
        "ERR_START_NOT_FOUND",
        `開始ノード '${start}' が nodes に存在しません`
      );
    }

    // choices target checks
    if (Array.isArray(spec.nodes)) {
      spec.nodes.forEach((n, i) => {
        if (!n || !isStr(n.id) || !Array.isArray(n.choices)) return;
        n.choices.forEach((c, j) => {
          const pc = `nodes[${i}].choices[${j}]`;
          const tgt = c?.target ?? c?.to;
          if (tgt == null) {
            pushErr(state, pc + ".target", "ERR_TARGET_REQUIRED", "target または to が必要です");
            return;
          }
          if (!isStr(tgt)) {
            pushErr(
              state,
              pc + ".target",
              "ERR_TARGET_NOT_STRING",
              "target/to は文字列である必要があります"
            );
            return;
          }
          if (ids.length > 0 && !ids.includes(tgt))
            pushWarn(state, pc + ".target", "WARN_UNRESOLVED_TARGET", `未解決の遷移先 '${tgt}'`);
        });
      });
    }

    // reachability and dead-end checks
    try {
      if (Array.isArray(spec.nodes) && isStr(start)) {
        const index = new Map();
        spec.nodes.forEach((n) => {
          if (n && isStr(n.id)) index.set(n.id, n);
        });
        const graph = new Map();
        index.forEach((n, id) => {
          const outs = Array.isArray(n.choices)
            ? n.choices.map((c) => c?.target ?? c?.to).filter((x) => isStr(x))
            : [];
          graph.set(id, outs);
        });
        const visited = new Set();
        const q = [];
        if (index.has(start)) {
          visited.add(start);
          q.push(start);
        }
        while (q.length) {
          const cur = q.shift();
          const outs = graph.get(cur) || [];
          for (const to of outs) {
            if (!visited.has(to) && index.has(to)) {
              visited.add(to);
              q.push(to);
            }
          }
        }
        // unreachable nodes
        index.forEach((_, id) => {
          if (!visited.has(id))
            pushWarn(
              state,
              `nodes[id=${id}]`,
              "WARN_UNREACHABLE_NODE",
              `開始ノードから到達できないノード '${id}'`
            );
        });
        // dead ends (no choices)
        index.forEach((n, id) => {
          const outs = graph.get(id) || [];
          if (outs.length === 0)
            pushWarn(
              state,
              `nodes[id=${id}].choices`,
              "WARN_DEAD_END",
              `遷移先のないノード '${id}'`
            );
        });
      }
    } catch (e) {
      /* non-fatal */
    }

    return {
      ok: state.errors.length === 0,
      errors: state.errors,
      warnings: state.warnings,
      errorDetails: state.errorDetails,
      warningDetails: state.warningDetails,
    };
  }

  window.Validator = { validateGameSpec };
})();
