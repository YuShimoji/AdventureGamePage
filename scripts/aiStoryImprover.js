(function () {
  // AI Story Improvement Assistant

  const IMPROVEMENT_RULES = {
    nodeQuality: {
      title: 'ノードの品質チェック',
      checks: [
        {
          name: 'タイトル必須',
          test: node => !node.title || node.title.trim().length === 0,
          message: 'ノードにタイトルを設定してください',
          severity: 'warning',
        },
        {
          name: '本文必須',
          test: node => !node.text || node.text.trim().length === 0,
          message: 'ノードに本文を設定してください',
          severity: 'warning',
        },
        {
          name: '本文の長さ',
          test: node => node.text && node.text.length > 500,
          message:
            '本文が長すぎる可能性があります。読者が集中できる長さに分割することを検討してください',
          severity: 'info',
        },
        {
          name: '本文の長さ（短すぎ）',
          test: node => node.text && node.text.length < 10,
          message: '本文が短すぎる可能性があります。より詳細な説明を追加すると良いでしょう',
          severity: 'info',
        },
      ],
    },
    choiceQuality: {
      title: '選択肢の品質チェック',
      checks: [
        {
          name: '選択肢ラベル必須',
          test: (node, choice) => !choice.label || choice.label.trim().length === 0,
          message: '選択肢にラベルを設定してください',
          severity: 'error',
        },
        {
          name: 'ターゲット必須',
          test: (node, choice) => !choice.target && !choice.to,
          message: '選択肢にターゲットノードを設定してください',
          severity: 'error',
        },
        {
          name: '選択肢の多様性',
          test: node => {
            if (!node.choices || node.choices.length < 2) return false;
            const labels = node.choices.map(c => (c.label || '').toLowerCase());
            return labels.some(label => labels.filter(l => l === label).length > 1);
          },
          message: '選択肢が重複している可能性があります。より多様な選択肢を検討してください',
          severity: 'info',
        },
      ],
    },
    storyStructure: {
      title: 'ストーリー構造チェック',
      checks: [
        {
          name: 'デッドエンド検出',
          test: node => !node.choices || node.choices.length === 0,
          message:
            'このノードはデッドエンドです。選択肢を追加するか、ストーリーの終わりとして明確にしてください',
          severity: 'warning',
        },
        {
          name: '孤立ノード',
          test: (node, nodes, spec) => {
            // Check if node is reachable from start
            if (node.id === spec.meta?.start) return false;
            const reachable = new Set();
            const queue = [spec.meta?.start].filter(Boolean);
            reachable.add(spec.meta?.start);

            while (queue.length) {
              const currentId = queue.shift();
              const currentNode = nodes.find(n => n.id === currentId);
              if (currentNode && currentNode.choices) {
                currentNode.choices.forEach(choice => {
                  const target = choice.target || choice.to;
                  if (target && !reachable.has(target) && nodes.some(n => n.id === target)) {
                    reachable.add(target);
                    queue.push(target);
                  }
                });
              }
            }

            return !reachable.has(node.id);
          },
          message:
            'このノードは開始ノードから到達できません。ストーリーに接続するか、削除を検討してください',
          severity: 'warning',
        },
      ],
    },
    engagement: {
      title: 'エンゲージメントチェック',
      checks: [
        {
          name: '選択肢の数',
          test: node => node.choices && node.choices.length > 4,
          message:
            '選択肢が多すぎる可能性があります。プレイヤーの選択を難しくしないよう検討してください',
          severity: 'info',
        },
        {
          name: '選択肢の数（少なすぎ）',
          test: node => !node.choices || node.choices.length === 0,
          message: '選択肢がない場合、プレイヤーの選択の自由度が失われます',
          severity: 'warning',
        },
        {
          name: '感情表現',
          test: node => {
            const text = (node.text || '').toLowerCase();
            const emotionWords = ['感動', '驚き', '喜び', '悲しみ', '怒り', '恐怖', '興奮', '安堵'];
            return !emotionWords.some(word => text.includes(word));
          },
          message: '感情表現を加えるとストーリーがより魅力的になります',
          severity: 'info',
        },
      ],
    },
  };

  function analyzeStory(spec) {
    if (!spec || !spec.nodes) return { suggestions: [] };

    const suggestions = [];
    const nodes = spec.nodes;

    nodes.forEach(node => {
      // Node quality checks
      IMPROVEMENT_RULES.nodeQuality.checks.forEach(check => {
        if (check.test(node)) {
          suggestions.push({
            type: 'node',
            nodeId: node.id,
            category: 'nodeQuality',
            rule: check.name,
            message: check.message,
            severity: check.severity,
          });
        }
      });

      // Choice quality checks
      if (node.choices) {
        node.choices.forEach((choice, index) => {
          IMPROVEMENT_RULES.choiceQuality.checks.forEach(check => {
            if (check.test(node, choice)) {
              suggestions.push({
                type: 'choice',
                nodeId: node.id,
                choiceIndex: index,
                category: 'choiceQuality',
                rule: check.name,
                message: check.message,
                severity: check.severity,
              });
            }
          });
        });
      }

      // Story structure checks
      IMPROVEMENT_RULES.storyStructure.checks.forEach(check => {
        if (check.test(node, nodes, spec)) {
          suggestions.push({
            type: 'structure',
            nodeId: node.id,
            category: 'storyStructure',
            rule: check.name,
            message: check.message,
            severity: check.severity,
          });
        }
      });

      // Engagement checks
      IMPROVEMENT_RULES.engagement.checks.forEach(check => {
        if (check.test(node)) {
          suggestions.push({
            type: 'engagement',
            nodeId: node.id,
            category: 'engagement',
            rule: check.name,
            message: check.message,
            severity: check.severity,
          });
        }
      });
    });

    // Sort by severity
    const severityOrder = { error: 0, warning: 1, info: 2 };
    suggestions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return { suggestions };
  }

  function generateSuggestions(spec) {
    const analysis = analyzeStory(spec);

    // Group suggestions by category
    const grouped = {};
    analysis.suggestions.forEach(suggestion => {
      if (!grouped[suggestion.category]) {
        grouped[suggestion.category] = [];
      }
      grouped[suggestion.category].push(suggestion);
    });

    // Generate improvement suggestions
    const improvements = [];

    // Overall story statistics
    const stats = {
      totalNodes: spec.nodes?.length || 0,
      totalChoices: spec.nodes?.reduce((sum, node) => sum + (node.choices?.length || 0), 0) || 0,
      deadEnds: spec.nodes?.filter(node => !node.choices || node.choices.length === 0).length || 0,
      avgChoicesPerNode: 0,
    };

    if (stats.totalNodes > 0) {
      stats.avgChoicesPerNode = (stats.totalChoices / stats.totalNodes).toFixed(1);
    }

    improvements.push({
      title: 'ストーリー統計',
      description: `ノード数: ${stats.totalNodes}, 選択肢数: ${stats.totalChoices}, 平均選択肢数: ${stats.avgChoicesPerNode}, デッドエンド: ${stats.deadEnds}`,
      priority: 'info',
    });

    // Category-specific suggestions
    if (grouped.nodeQuality) {
      improvements.push({
        title: 'ノード品質の改善',
        description: `${grouped.nodeQuality.length}件の改善点があります。タイトルと本文が適切に設定されているか確認してください。`,
        priority: grouped.nodeQuality.some(s => s.severity === 'error') ? 'high' : 'medium',
        items: grouped.nodeQuality.slice(0, 5).map(s => `${s.nodeId}: ${s.message}`),
      });
    }

    if (grouped.choiceQuality) {
      improvements.push({
        title: '選択肢品質の改善',
        description: `${grouped.choiceQuality.length}件の改善点があります。選択肢に明確なラベルとターゲットが設定されているか確認してください。`,
        priority: grouped.choiceQuality.some(s => s.severity === 'error') ? 'high' : 'medium',
        items: grouped.choiceQuality
          .slice(0, 5)
          .map(s => `${s.nodeId}の選択肢${s.choiceIndex + 1}: ${s.message}`),
      });
    }

    if (grouped.storyStructure) {
      improvements.push({
        title: 'ストーリー構造の改善',
        description: `${grouped.storyStructure.length}件の改善点があります。全てのノードがアクセス可能で、デッドエンドが適切に設計されているか確認してください。`,
        priority: 'medium',
        items: grouped.storyStructure.slice(0, 5).map(s => `${s.nodeId}: ${s.message}`),
      });
    }

    if (grouped.engagement) {
      improvements.push({
        title: 'エンゲージメントの改善',
        description: `${grouped.engagement.length}件の改善点があります。プレイヤーが感情的に関与できるようなストーリーになっているか確認してください。`,
        priority: 'low',
        items: grouped.engagement.slice(0, 5).map(s => `${s.nodeId}: ${s.message}`),
      });
    }

    // General suggestions based on stats
    if (stats.totalNodes < 5) {
      improvements.push({
        title: 'ストーリーの拡張',
        description:
          'ストーリーが短すぎる可能性があります。より多くのノードを追加して深みを出すことを検討してください。',
        priority: 'info',
      });
    }

    if (stats.avgChoicesPerNode < 1.5) {
      improvements.push({
        title: '選択肢の追加',
        description:
          '選択肢が少ないノードが多いようです。プレイヤーの選択の自由度を高めるため、選択肢を追加することを検討してください。',
        priority: 'info',
      });
    }

    if (stats.deadEnds > stats.totalNodes * 0.3) {
      improvements.push({
        title: 'デッドエンドの削減',
        description:
          'デッドエンドが多すぎる可能性があります。ストーリーの再プレイ性を高めるため、デッドエンドを減らすことを検討してください。',
        priority: 'info',
      });
    }

    return improvements;
  }

  function showImprovementSuggestions(spec) {
    const improvements = generateSuggestions(spec);

    // Create modal to show suggestions
    const modal = document.createElement('div');
    modal.className = 'improvement-suggestions-modal';
    modal.innerHTML = `
      <div class="improvement-overlay">
        <div class="improvement-content">
          <div class="improvement-header">
            <h3>AIストーリー改善提案</h3>
            <button class="btn btn-ghost btn-sm" id="improvement-close">✕</button>
          </div>
          <div class="improvement-body">
            <div class="improvement-list">
              ${improvements
                .map(
                  imp => `
                <div class="improvement-item priority-${imp.priority}">
                  <div class="improvement-title">
                    <span class="improvement-priority">${getPriorityIcon(imp.priority)}</span>
                    ${imp.title}
                  </div>
                  <div class="improvement-description">${imp.description}</div>
                  ${imp.items ? `<ul class="improvement-details">${imp.items.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}
                </div>
              `
                )
                .join('')}
            </div>
          </div>
          <div class="improvement-footer">
            <button class="btn" id="improvement-apply">改善を適用</button>
            <button class="btn btn-primary" id="improvement-close-bottom">閉じる</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    const closeBtn = modal.querySelector('#improvement-close');
    const closeBottomBtn = modal.querySelector('#improvement-close-bottom');
    const applyBtn = modal.querySelector('#improvement-apply');

    [closeBtn, closeBottomBtn].forEach(btn => {
      if (btn) btn.addEventListener('click', () => modal.remove());
    });

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        // Apply some automatic improvements
        applyAutomaticImprovements(spec);
        modal.remove();
        ToastManager.success('自動改善を適用しました');
      });
    }

    // Close on overlay click
    const overlay = modal.querySelector('.improvement-overlay');
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) modal.remove();
      });
    }
  }

  function getPriorityIcon(priority) {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  }

  function applyAutomaticImprovements(spec) {
    if (!spec.nodes) return;

    // Apply basic improvements
    spec.nodes.forEach(node => {
      // Add default titles if missing
      if (!node.title || node.title.trim().length === 0) {
        node.title = `シーン ${node.id}`;
      }

      // Add default text if missing
      if (!node.text || node.text.trim().length === 0) {
        node.text = 'ここにストーリーの内容を入力してください。';
      }

      // Ensure choices have labels
      if (node.choices) {
        node.choices.forEach(choice => {
          if (!choice.label || choice.label.trim().length === 0) {
            choice.label = choice.target || choice.to || '次へ';
          }
        });
      }
    });

    // Update the UI
    if (window.NodeEditorUIManager) {
      window.NodeEditorUIManager.setSpecData(spec);
      window.NodeEditorUIManager.refreshNodeList();
    }
  }

  // Expose AI improvement assistant
  window.AIStoryImprover = {
    analyzeStory,
    generateSuggestions,
    showImprovementSuggestions,
    applyAutomaticImprovements,
  };
})();
