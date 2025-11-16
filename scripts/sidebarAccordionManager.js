(function () {
  // Sidebar Accordion Manager - Handles sidebar accordion functionality
  const KEY_ACCORDION_LAST = 'agp_sidebar_open';
  const KEY_ACCORDION_MULTI = 'agp_sidebar_multi_open';
  const KEY_ACCORDION_MULTI_LIST = 'agp_sidebar_open_multi';
  const KEY_ACCORDION_HINT = 'agp_sidebar_hint_state';

  const ACCORDION_HINTS = {
    tools: {
      label: 'ツール / 保存',
      description: '保存やインポートに関する操作をまとめています。',
      items: [
        '保存先の選択はシンプル/完全保存や一覧操作にも反映されます。',
        'エクスポートした JSON はプレイ画面にも読み込めます。',
        '保存一覧から既存データの読み込み・削除ができます。',
      ],
    },
    'editor-settings': {
      label: 'エディタ設定',
      description: 'スクロールや入力エフェクトなどの既定値を調整します。',
      items: [
        '設定を保存するとブラウザに保持され、再読込後も有効です。',
        '安全領域は自動スクロール時の上下マージンを指定します。',
      ],
    },
    'node-editor': {
      label: 'ノード編集（MVP）',
      description: 'シナリオのノード構造を編集し、検証できます。',
      items: [
        'JSONの取込後は検証で未解決ノードを確認できます。',
        '適用保存で `agp_game_data` に反映されます。',
        'エクスポートで部分的なJSONを書き出し、バックアップに利用できます。',
      ],
    },
    'story-workflow': {
      label: 'ストーリー作成フロー',
      description:
        'テキスト執筆からノード編集、分岐プレビュー、プレイテストまでの流れをまとめています。',
      items: [
        'テキスト編集とノード編集を行き来しながらストーリーを構築できます。',
        '分岐プレビューとプレイテストで、導線や演出を確認しながら調整できます。',
      ],
    },
    mermaid: {
      label: '分岐プレビュー（Mermaid）',
      description: 'ノード構造をMermaid図で可視化します。',
      items: [
        '描画範囲や方向を切り替えて全体像と部分図を比較できます。',
        'SVGダウンロードで資料共有用の図を取得できます。',
      ],
    },
  };

  window.SidebarAccordionManager = {
    init: function () {
      this.initSidebarAccordion();
      this.initAccordionHints();
      this.initAccordionModeToggle();
      console.log('SidebarAccordionManager initialized');
    },

    // Sidebar accordion management
    initSidebarAccordion: function () {
      // Sidebar toggle (.show クラスで制御)
      document.getElementById('btn-toggle-sidebar').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        const isShown = sidebar.classList.contains('show');
        sidebar.classList.toggle('show', !isShown);
      });

      // Sidebar accordion (details.agp-accordion): exclusive open + persist last open
      (function initSidebarAccordion() {
        try {
          const accs = Array.from(document.querySelectorAll('details.agp-accordion'));
          if (accs.length === 0) return;
          const KEY = KEY_ACCORDION_LAST;
          let allowMulti = false;
          try {
            allowMulti = localStorage.getItem(KEY_ACCORDION_MULTI) === '1';
          } catch {}
          function closeOthers(except) {
            if (allowMulti) return;
            accs.forEach(o => {
              if (o !== except) o.open = false;
            });
          }
          // restore last open / multi state
          try {
            if (allowMulti) {
              const stored = JSON.parse(localStorage.getItem(KEY_ACCORDION_MULTI_LIST) || '[]');
              if (Array.isArray(stored)) {
                stored.forEach(id => {
                  const el = document.getElementById(id);
                  if (el) el.open = true;
                });
              }
            } else {
              const last = localStorage.getItem(KEY);
              if (last && document.getElementById(last)) {
                accs.forEach(d => {
                  if (d.id !== last) d.open = false;
                });
                document.getElementById(last).open = true;
              }
            }
          } catch {}
          accs.forEach(d => {
            d.addEventListener('toggle', () => {
              if (d.open) {
                closeOthers(d);
                try {
                  if (allowMulti) {
                    const opened = accs
                      .filter(x => x.open)
                      .map(x => x.id || '')
                      .filter(Boolean);
                    localStorage.setItem(KEY_ACCORDION_MULTI_LIST, JSON.stringify(opened));
                  } else {
                    localStorage.setItem(KEY, d.id || '');
                  }
                } catch {}
              } else {
                try {
                  if (allowMulti) {
                    const opened = accs
                      .filter(x => x.open)
                      .map(x => x.id || '')
                      .filter(Boolean);
                    if (opened.length) {
                      localStorage.setItem(KEY_ACCORDION_MULTI_LIST, JSON.stringify(opened));
                    } else {
                      localStorage.removeItem(KEY_ACCORDION_MULTI_LIST);
                    }
                  } else {
                    const anyOpen = accs.some(x => x.open);
                    if (!anyOpen) {
                      localStorage.removeItem(KEY);
                    }
                  }
                } catch {}
              }
            });
          });

          // expose helper for hint toggle
          window.AGPAaccordion = {
            isMulti: () => allowMulti,
            setMulti(next) {
              allowMulti = !!next;
              try {
                if (allowMulti) {
                  const opened = accs
                    .filter(x => x.open)
                    .map(x => x.id || '')
                    .filter(Boolean);
                  localStorage.setItem(KEY_ACCORDION_MULTI, '1');
                  localStorage.setItem(KEY_ACCORDION_MULTI_LIST, JSON.stringify(opened));
                } else {
                  localStorage.setItem(KEY_ACCORDION_MULTI, '0');
                  localStorage.removeItem(KEY_ACCORDION_MULTI_LIST);
                  // close extras keeping first open
                  const firstOpen = accs.find(x => x.open);
                  accs.forEach(o => {
                    if (o !== firstOpen) o.open = false;
                  });
                  if (firstOpen) {
                    localStorage.setItem(KEY, firstOpen.id || '');
                  }
                }
              } catch {}
            },
            getAccordions: () => accs,
          };
        } catch (e) {
          console.warn('initSidebarAccordion failed', e);
        }
      })();
    },

    // Accordion hints
    initAccordionHints: function () {
      try {
        const accordions = Array.from(
          document.querySelectorAll('details.agp-accordion[data-accordion-id]')
        );
        if (accordions.length === 0) return;
        const stored = (() => {
          try {
            return JSON.parse(localStorage.getItem(KEY_ACCORDION_HINT) || '{}');
          } catch {
            return {};
          }
        })();
        accordions.forEach(acc => {
          const id = acc.getAttribute('data-accordion-id');
          const hintCfg = ACCORDION_HINTS[id];
          const hintEl = acc.querySelector(`.accordion-hint[data-hint-for="${id}"]`);
          const toggle = acc.querySelector(`.accordion-hint-toggle[data-accordion-hint="${id}"]`);
          if (!hintCfg || !hintEl || !toggle) return;
          const hintId = hintEl.id || `accordion-hint-${id}`;
          hintEl.id = hintId;
          toggle.setAttribute('aria-controls', hintId);
          const frag = document.createDocumentFragment();
          const heading = document.createElement('strong');
          heading.textContent = hintCfg.label;
          const desc = document.createElement('p');
          desc.textContent = hintCfg.description;
          frag.append(heading, desc);
          if (Array.isArray(hintCfg.items) && hintCfg.items.length) {
            const ul = document.createElement('ul');
            ul.className = 'accordion-hint-list';
            hintCfg.items.forEach(text => {
              const li = document.createElement('li');
              li.textContent = text;
              ul.appendChild(li);
            });
            frag.appendChild(ul);
          }
          hintEl.replaceChildren(frag);

          const initial = stored[id] === true;
          hintEl.hidden = !initial;
          toggle.setAttribute('aria-expanded', String(initial));

          function persist(next) {
            stored[id] = !!next;
            try {
              localStorage.setItem(KEY_ACCORDION_HINT, JSON.stringify(stored));
            } catch {}
          }

          function toggleHint() {
            const next = hintEl.hidden;
            hintEl.hidden = !next;
            toggle.setAttribute('aria-expanded', String(next));
            persist(next);
          }

          toggle.addEventListener('click', toggleHint);
          toggle.addEventListener('keydown', e => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              toggleHint();
            }
          });
        });
      } catch (e) {
        console.warn('initAccordionHints failed', e);
      }
    },

    // Accordion mode toggle
    initAccordionModeToggle: function () {
      try {
        const container = document.querySelector('[data-accordion-mode-toggle]');
        if (!container) return;
        const checkbox = container.querySelector('input[type="checkbox"]');
        if (!checkbox) return;
        const label = container.querySelector('[data-toggle-label]');
        const updateLabel = checked => {
          if (!label) return;
          label.textContent = checked
            ? '複数セクションを同時に開く (ON)'
            : '複数セクションを同時に開く (OFF)';
        };
        const initChecked = (() => {
          try {
            return localStorage.getItem(KEY_ACCORDION_MULTI) === '1';
          } catch {
            return false;
          }
        })();
        checkbox.checked = initChecked;
        updateLabel(initChecked);
        const api = window.AGPAaccordion;
        if (api) {
          api.setMulti(initChecked);
        }
        checkbox.addEventListener('change', () => {
          const next = checkbox.checked;
          updateLabel(next);
          try {
            localStorage.setItem(KEY_ACCORDION_MULTI, next ? '1' : '0');
          } catch {}
          if (api) {
            api.setMulti(next);
          }
        });
      } catch (e) {
        console.warn('initAccordionModeToggle failed', e);
      }
    },
  };
})();
