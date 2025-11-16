(function () {
  // Global string table and helper utilities for i18n-ready UI text management
  // NOTE: This module is intentionally dependency-free so it can be loaded very early.

  var DICTIONARY = {
    defaultLang: 'ja',
    ja: {
      editor: {
        placeholder: '入力を開始……',
      },
      strings: {
        defaultTitle: '無題',
      },
      workflow: {
        title: 'ストーリー作成フロー',
        heading: 'ストーリー作成の手順',
        hintLabel: 'ストーリー作成フローのヒント',
        steps: {
          writeText: '1. テキストを書く',
          editNodes: '2. ノード構造を編集',
          previewBranches: '3. 分岐を確認（Mermaid）',
          playtest: '4. プレイテスト',
          aiImprove: '5. AIで改善点を確認',
          fromSample: 'サンプルから始める',
        },
      },
    },
    en: {
      editor: {
        placeholder: 'Start typing...',
      },
      strings: {
        defaultTitle: 'Untitled',
      },
      workflow: {
        title: 'Story creation flow',
        heading: 'Story creation steps',
        hintLabel: 'Hint for story creation flow',
        steps: {
          writeText: '1. Write text',
          editNodes: '2. Edit node structure',
          previewBranches: '3. Preview branches (Mermaid)',
          playtest: '4. Playtest',
          aiImprove: '5. Review with AI',
          fromSample: 'Start from sample',
        },
      },
    },
  };

  function getCurrentLang() {
    try {
      var appLang = window.APP_CONFIG && window.APP_CONFIG.lang;
      if (appLang && DICTIONARY[appLang]) return appLang;
    } catch (e) {
      // fall back
    }
    return DICTIONARY.defaultLang || 'ja';
  }

  function resolveKey(path, lang) {
    if (!path || typeof path !== 'string') return undefined;
    var parts = path.split('.');
    var cur = DICTIONARY[lang];
    for (var i = 0; i < parts.length; i += 1) {
      if (!cur || typeof cur !== 'object') return undefined;
      cur = cur[parts[i]];
    }
    if (typeof cur === 'string') return cur;
    return undefined;
  }

  window.AG_STRINGS = DICTIONARY;

  window.AGStrings = {
    getCurrentLang: getCurrentLang,
    /**
     * Translate a dotted key using the current APP_CONFIG.lang.
     * Falls back to default language, and finally returns the key itself.
     */
    t: function (key, options) {
      var lang = (options && options.lang) || getCurrentLang();
      var value = resolveKey(key, lang) || resolveKey(key, DICTIONARY.defaultLang);
      return value || key;
    },
  };
})();
