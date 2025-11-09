(function () {
  // Admin Editor Module - Editor DOM operations and input management
  window.AdminEditor = {
    init: function() {
      this.setupEditor();
      this.loadSettings();
      console.log('AdminEditor initialized');
    },

    // Character count and placeholder management
    updateCharCount: function(el, counter) {
      let text = el.innerText ?? '';
      // Empty contenteditable returns "\n", treat as empty
      if (text === '\n' || text === '\r\n') text = '';
      counter.textContent = `${text.length} 文字`;

      // Placeholder control via data-empty attribute
      try {
        const t = (text || '').trim();
        if (t.length === 0) {
          el.setAttribute('data-empty', 'true');
        } else {
          el.removeAttribute('data-empty');
        }
      } catch (e) {
        console.warn('updateCharCount placeholder error:', e);
      }
    },

    // Execute document command
    exec: function(cmd) {
      document.execCommand(cmd, false, undefined);
    },

    // Setup editor DOM operations
    setupEditor: function() {
      const editor = document.getElementById('editor');
      const count = document.getElementById('char-count');

      if (!editor || !count) {
        console.warn('AdminEditor: Editor elements not found');
        return;
      }

      // Initialize WYSIWYG editor
      const wysiwygOpenBtn = document.getElementById('wysiwyg-open');
      const wysiwygLoadBtn = document.getElementById('wysiwyg-load');
      const wysiwygStatus = document.getElementById('wysiwyg-status');

      if (wysiwygOpenBtn) {
        wysiwygOpenBtn.addEventListener('click', () => {
          const container = document.getElementById('editor-container');
          const wysiwygView = document.getElementById('wysiwyg-editor-view');

          // Hide other views
          document.getElementById('editor-main').style.display = 'none';
          document.getElementById('node-editor-parallel-view').hidden = true;

          // Show WYSIWYG view
          wysiwygView.hidden = false;
          container.classList.add('wysiwyg-active');

          // Initialize editor
          if (window.WYSIWYGStoryEditor && window.WYSIWYGStoryEditor.init) {
            const success = window.WYSIWYGStoryEditor.init('wysiwyg-editor-container');
            if (success) {
              if (wysiwygStatus) wysiwygStatus.textContent = 'WYSIWYGエディタが起動しました';
            } else {
              if (wysiwygStatus) wysiwygStatus.textContent = 'エディタの初期化に失敗しました';
            }
          }
        });
      }

      if (wysiwygLoadBtn) {
        wysiwygLoadBtn.addEventListener('click', () => {
          // Load current story from Node Editor
          if (window.NodeEditorAPI && window.WYSIWYGStoryEditor) {
            const spec = window.NodeEditorAPI.getSpec();
            if (spec) {
              window.WYSIWYGStoryEditor.loadStory(spec);
              if (wysiwygStatus) wysiwygStatus.textContent = '現在のストーリーを読み込みました';
            } else {
              if (wysiwygStatus) wysiwygStatus.textContent = '読み込むストーリーがありません';
            }
          }
        });
      }

      // AI Story Improvement
      const aiAnalyzeBtn = document.getElementById('ai-analyze');
      const aiAutoFixBtn = document.getElementById('ai-auto-fix');
      const aiStatus = document.getElementById('ai-status');

      if (aiAnalyzeBtn) {
        aiAnalyzeBtn.addEventListener('click', () => {
          if (window.AIStoryImprover && window.NodeEditorAPI) {
            const spec = window.NodeEditorAPI.getSpec();
            if (spec) {
              window.AIStoryImprover.showImprovementSuggestions(spec);
              if (aiStatus) aiStatus.textContent = '改善提案を表示しました';
            } else {
              if (aiStatus) aiStatus.textContent = '分析するストーリーがありません';
            }
          }
        });
      }

      if (aiAutoFixBtn) {
        aiAutoFixBtn.addEventListener('click', () => {
          if (window.AIStoryImprover && window.NodeEditorAPI) {
            const spec = window.NodeEditorAPI.getSpec();
            if (spec) {
              window.AIStoryImprover.applyAutomaticImprovements(spec);
              if (aiStatus) aiStatus.textContent = '自動改善を適用しました';
            } else {
              if (aiStatus) aiStatus.textContent = '改善するストーリーがありません';
            }
          }
        });
      }

      // Initialize character count
      this.updateCharCount(editor, count);

      // Input event listener for character count updates
      editor.addEventListener('input', () => this.updateCharCount(editor, count));

      // Placeholder configuration
      if (window.APP_CONFIG?.editor?.placeholder) {
        editor.setAttribute('data-placeholder', window.APP_CONFIG.editor.placeholder);
      }

      // Zen mode
      if (window.APP_CONFIG?.editor?.startZen) {
        document.body.classList.add('zen-mode');
      }
    },

    // Load persisted editor settings
    loadSettings: function() {
      try {
        const saved = window.StorageUtil?.loadJSON?.('agp_editor_ui_cfg');
        if (saved) {
          const autoCfg = window.APP_CONFIG?.editor?.autoScroll || {};
          const fxCfg = window.APP_CONFIG?.editor?.inputFx || {};

          if (saved.autoScroll) {
            Object.assign(window.APP_CONFIG.editor.autoScroll, saved.autoScroll);
            Object.assign(autoCfg, saved.autoScroll);
          }
          if (saved.inputFx) {
            Object.assign(window.APP_CONFIG.editor.inputFx, saved.inputFx);
            Object.assign(fxCfg, saved.inputFx);
          }
        }
      } catch (e) {
        console.warn('AdminEditor: Failed to load settings:', e);
      }
    }
  };
})();
