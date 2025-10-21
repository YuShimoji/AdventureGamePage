// Data Validation and Integrity Checks
// Provides validation for game data, save data, and storage operations

(function() {
  const DataValidator = {
    // Validate game data structure
    validateGameData(data) {
      const errors = [];
      
      if (!data || typeof data !== 'object') {
        errors.push('データが存在しないか、オブジェクトではありません');
        return { valid: false, errors };
      }

      // Check required fields
      if (!data.title || typeof data.title !== 'string') {
        errors.push('タイトルが不正です');
      }

      if (!data.nodes || typeof data.nodes !== 'object') {
        errors.push('ノードデータが不正です');
      } else {
        // Validate nodes
        const nodeIds = Object.keys(data.nodes);
        if (nodeIds.length === 0) {
          errors.push('ノードが1つも存在しません');
        }

        nodeIds.forEach(id => {
          const node = data.nodes[id];
          if (!node.text && !node.title) {
            errors.push(`ノード ${id} にテキストまたはタイトルがありません`);
          }

          if (node.choices && Array.isArray(node.choices)) {
            node.choices.forEach((choice, index) => {
              if (!choice.to) {
                errors.push(`ノード ${id} の選択肢 ${index} に移動先がありません`);
              } else if (!data.nodes[choice.to]) {
                errors.push(`ノード ${id} の選択肢 ${index} の移動先 ${choice.to} が存在しません`);
              }
            });
          }
        });
      }

      // Validate start node
      if (data.start && !data.nodes[data.start]) {
        errors.push(`開始ノード ${data.start} が存在しません`);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings: []
      };
    },

    // Validate extended schema data (items, characters, lore, state)
    validateExtendedData(type, data) {
      const errors = [];
      const warnings = [];

      if (!data || typeof data !== 'object') {
        errors.push(`${type}データが不正です`);
        return { valid: false, errors, warnings };
      }

      switch (type) {
        case 'items':
          if (!Array.isArray(data.items)) {
            errors.push('アイテムリストが配列ではありません');
          } else {
            data.items.forEach((item, index) => {
              if (!item.id) errors.push(`アイテム ${index} にIDがありません`);
              if (!item.name) warnings.push(`アイテム ${index} (${item.id}) に名前がありません`);
              if (!item.type) warnings.push(`アイテム ${index} (${item.id}) にタイプがありません`);
            });
          }
          break;

        case 'characters':
          if (!Array.isArray(data.characters)) {
            errors.push('キャラクターリストが配列ではありません');
          } else {
            data.characters.forEach((char, index) => {
              if (!char.id) errors.push(`キャラクター ${index} にIDがありません`);
              if (!char.name) warnings.push(`キャラクター ${index} (${char.id}) に名前がありません`);
            });
          }
          break;

        case 'lore':
          if (!Array.isArray(data.lore)) {
            errors.push('Wikiリストが配列ではありません');
          } else {
            data.lore.forEach((entry, index) => {
              if (!entry.id) errors.push(`Wiki ${index} にIDがありません`);
              if (!entry.title) warnings.push(`Wiki ${index} (${entry.id}) にタイトルがありません`);
            });
          }
          break;

        case 'state':
          if (!data.state || typeof data.state !== 'object') {
            errors.push('状態データが不正です');
          } else {
            if (data.state.inventory && typeof data.state.inventory !== 'object') {
              errors.push('インベントリデータが不正です');
            }
            if (data.state.flags && typeof data.state.flags !== 'object') {
              warnings.push('フラグデータが不正です');
            }
          }
          break;

        default:
          errors.push(`不明なデータタイプ: ${type}`);
      }

      return { valid: errors.length === 0, errors, warnings };
    },

    // Check storage quota and availability
    checkStorageHealth() {
      const health = {
        available: true,
        quota: null,
        usage: null,
        percentage: null,
        errors: [],
        warnings: []
      };

      // Check localStorage availability
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
      } catch (e) {
        health.available = false;
        health.errors.push('localStorageが利用できません: ' + e.message);
      }

      // Check quota (if available)
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(estimate => {
          health.quota = estimate.quota;
          health.usage = estimate.usage;
          health.percentage = (estimate.usage / estimate.quota) * 100;

          if (health.percentage > 90) {
            health.warnings.push('ストレージ使用量が90%を超えています');
          } else if (health.percentage > 75) {
            health.warnings.push('ストレージ使用量が75%を超えています');
          }
        });
      }

      return health;
    },

    // Validate and repair corrupted data
    repairData(data, type = 'game') {
      const repaired = JSON.parse(JSON.stringify(data)); // Deep clone
      const repairs = [];

      if (type === 'game') {
        // Ensure required fields
        if (!repaired.title) {
          repaired.title = 'Untitled Game';
          repairs.push('タイトルを補完しました');
        }

        if (!repaired.nodes || typeof repaired.nodes !== 'object') {
          repaired.nodes = {};
          repairs.push('ノードオブジェクトを初期化しました');
        }

        // Ensure start node exists
        if (!repaired.start || !repaired.nodes[repaired.start]) {
          const nodeIds = Object.keys(repaired.nodes);
          if (nodeIds.length > 0) {
            repaired.start = nodeIds[0];
            repairs.push(`開始ノードを ${nodeIds[0]} に設定しました`);
          } else {
            repaired.start = 'start';
            repaired.nodes.start = { title: '開始', text: 'ゲームが開始されます。', choices: [] };
            repairs.push('デフォルトの開始ノードを作成しました');
          }
        }

        // Remove broken choice links
        Object.keys(repaired.nodes).forEach(nodeId => {
          const node = repaired.nodes[nodeId];
          if (node.choices && Array.isArray(node.choices)) {
            const validChoices = node.choices.filter(choice => {
              if (!choice.to || !repaired.nodes[choice.to]) {
                repairs.push(`ノード ${nodeId} の無効な選択肢を削除しました`);
                return false;
              }
              return true;
            });
            node.choices = validChoices;
          }
        });
      }

      return { data: repaired, repairs, success: repairs.length > 0 };
    }
  };

  // Expose globally
  window.DataValidator = DataValidator;
})();
