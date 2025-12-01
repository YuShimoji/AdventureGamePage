(function () {
  function normalizeSpecToEngine(data) {
    if (!data) return null;
    if (Array.isArray(data.nodes)) {
      const nodes = {};
      data.nodes.forEach(n => {
        if (!n || !n.id) return;
        const choices = Array.isArray(n.choices)
          ? n.choices.map(c => {
              const choice = {
                text: c.label ?? c.text ?? '',
                to: c.target ?? c.to ?? '',
              };
              if (Array.isArray(c.conditions)) {
                // 条件付き選択肢はそのまま保持
                choice.conditions = c.conditions.map(cond => ({ ...cond }));
              }
              return choice;
            })
          : [];

        const node = {
          title: n.title || '',
          text: n.text || '',
          choices,
        };

        // 画像など追加フィールドはそのまま引き継ぐ
        if (n.image !== undefined) node.image = n.image;

        // ノードアクションもそのまま保持（インベントリ操作・変数操作など）
        if (Array.isArray(n.actions)) {
          node.actions = n.actions.map(a => ({ ...a }));
        }

        nodes[n.id] = node;
      });
      return {
        title: data?.meta?.title || data.title || 'Adventure',
        start: data?.meta?.start || data.start || 'start',
        nodes,
      };
    }
    return data;
  }

  function engineToSpec(engine) {
    if (!engine || !engine.nodes) return null;
    const nodes = Object.entries(engine.nodes).map(([id, n]) => {
      const choices = (n.choices || []).map(c => {
        const choice = {
          id: '',
          label: c.text || '',
          target: c.to || '',
        };
        if (Array.isArray(c.conditions)) {
          choice.conditions = c.conditions.map(cond => ({ ...cond }));
        }
        return choice;
      });

      const node = {
        id,
        title: n.title || '',
        text: n.text || '',
        choices,
      };

      // image / actions も可能な限り spec に戻す
      if (n.image !== undefined) node.image = n.image;
      if (Array.isArray(n.actions)) {
        node.actions = n.actions.map(a => ({ ...a }));
      }

      return node;
    });
    return {
      version: '1.0',
      meta: {
        title: engine.title || 'Adventure',
        author: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        start: engine.start || 'start',
      },
      nodes,
    };
  }

  window.Converters = { normalizeSpecToEngine, engineToSpec };
})();
