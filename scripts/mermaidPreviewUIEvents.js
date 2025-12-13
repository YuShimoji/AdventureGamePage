(function () {
  // Mermaid Preview UI Events Manager - Handles event binding and interactions

  const MermaidPreviewUIEvents = {
    bindSvgInteractions() {
      const { view, mainView } = window.MermaidPreviewUIState.getUIRefs();
      const views = [view, mainView].filter(Boolean);
      views.forEach(currentView => {
        if (!currentView) return;
        const svg = currentView.querySelector('svg');
        if (!svg) return;
        const nodeGroups = svg.querySelectorAll('g.node');
        nodeGroups.forEach(g => {
          const sid = g.id;
          const lastBuildMeta = window.MermaidPreviewLogicManager.getLastBuildMeta();
          const originalId = lastBuildMeta?.sanitizeMap?.get(sid);
          if (!originalId) return;
          g.style.cursor = 'pointer';
          g.setAttribute('tabindex', '0');
          const handler = ev => {
            ev.preventDefault();
            window.MermaidPreviewUIRefresh.focusNodeEditorNode(originalId);
          };
          g.addEventListener('click', handler);
          g.addEventListener('keydown', ev => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault();
              handler(ev);
            }
          });
        });
      });
    },

    // UI binding for buttons and controls
    bindButtons() {
      const refs = window.MermaidPreviewUIState.getUIRefs();
      const { genBtn, renderBtn, src, view, scopeSel, seedSel } = refs;

      if (!genBtn || !renderBtn || !src || !view) return;

      // Scope and seed selection
      if (scopeSel && seedSel) {
        const applySeedEnabled = () => {
          const v = window.MermaidPreviewUIState.getScope();
          seedSel.disabled = v !== 'from_selected';
        };
        scopeSel.addEventListener('change', () => {
          applySeedEnabled();
          if (window.MermaidPreviewUIState.getScope() === 'from_selected')
            window.MermaidPreviewUIRefresh.refreshSeedOptions();
          window.MermaidPreviewLogicManager.renderDiagram();
        });
        applySeedEnabled();
      }

      if (seedSel) {
        seedSel.addEventListener('focus', window.MermaidPreviewUIRefresh.refreshSeedOptions);
        seedSel.addEventListener('change', window.MermaidPreviewLogicManager.renderDiagram);
      }

      // Generation and rendering buttons
      genBtn.addEventListener('click', () => {
        window.MermaidPreviewLogicManager.generateSource();
      });
      renderBtn.addEventListener('click', () => {
        window.MermaidPreviewLogicManager.renderDiagram();
      });

      // Main area generation button also updates preview
      if (genBtn) {
        genBtn.addEventListener('click', () => {
          window.MermaidPreviewLogicManager.renderDiagram();
        });
      }
    },

    // Fullscreen functionality
    bindFullscreen() {
      const { fullscreenBtn } = window.MermaidPreviewUIState.getUIRefs();

      let lastFocused = null;
      let keydownHandler = null;

      function closeModal() {
        const modal = document.getElementById('mermaid-fullscreen-modal');
        if (!modal) return;

        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        modal.removeAttribute('tabindex');

        if (keydownHandler) {
          document.removeEventListener('keydown', keydownHandler, true);
          keydownHandler = null;
        }

        const target =
          (lastFocused && typeof lastFocused.focus === 'function' && lastFocused) || fullscreenBtn;
        if (target && typeof target.focus === 'function') {
          try {
            target.focus();
          } catch {}
        }
      }

      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
          const { mainView } = window.MermaidPreviewUIState.getUIRefs();
          if (!mainView) return;

          const modal = document.getElementById('mermaid-fullscreen-modal');
          const modalView = document.getElementById('mermaid-fullscreen-view');
          if (!modal || !modalView) return;

          const svg = mainView.querySelector('svg');
          if (svg) {
            modalView.innerHTML = svg.outerHTML;
          } else {
            modalView.innerHTML = mainView.innerHTML;
          }

          lastFocused = document.activeElement;

          if (!modal.hasAttribute('role')) modal.setAttribute('role', 'dialog');
          if (!modal.hasAttribute('aria-modal')) modal.setAttribute('aria-modal', 'true');

          modal.hidden = false;
          modal.setAttribute('aria-hidden', 'false');
          if (!modal.hasAttribute('tabindex')) modal.setAttribute('tabindex', '-1');

          const closeBtn = document.getElementById('mermaid-fullscreen-close');
          const focusTarget =
            (closeBtn && typeof closeBtn.focus === 'function' && closeBtn) || modal;
          if (focusTarget && typeof focusTarget.focus === 'function') {
            try {
              focusTarget.focus();
            } catch {}
          }

          keydownHandler = e => {
            if (e.key === 'Escape') {
              e.preventDefault();
              closeModal();
            }
          };
          document.addEventListener('keydown', keydownHandler, true);

          // Close on backdrop click
          modal.addEventListener(
            'click',
            ev => {
              if (ev.target === modal) {
                closeModal();
              }
            },
            { once: true }
          );
        });
      }

      // Fullscreen modal close button
      const fullscreenCloseBtn = document.getElementById('mermaid-fullscreen-close');
      if (fullscreenCloseBtn) {
        fullscreenCloseBtn.addEventListener('click', () => {
          closeModal();
        });
      }
    },

    // Inline panel toggle functionality
    bindInlinePanel() {
      const { toggleBtn, inlinePanel, inlineContent } = window.MermaidPreviewUIState.getUIRefs();

      if (toggleBtn && inlinePanel && inlineContent) {
        toggleBtn.addEventListener('click', () => {
          const isHidden = inlinePanel.hidden;
          const isCollapsed = inlinePanel.classList.contains('collapsed');

          if (isHidden) {
            // パネルを表示
            inlinePanel.hidden = false;
            inlinePanel.classList.remove('collapsed');
            inlinePanel.dataset.state = 'expanded';
            inlineContent.hidden = false;
            toggleBtn.textContent = '閉じる';
            toggleBtn.setAttribute('aria-expanded', 'true');
            toggleBtn.setAttribute('aria-label', '分岐プレビューを閉じる');
          } else if (isCollapsed) {
            // collapsed → 展開
            inlinePanel.classList.remove('collapsed');
            inlinePanel.dataset.state = 'expanded';
            inlineContent.hidden = false;
            toggleBtn.textContent = '閉じる';
            toggleBtn.setAttribute('aria-expanded', 'true');
          } else {
            // 展開 → 非表示
            inlinePanel.hidden = true;
            inlinePanel.classList.add('collapsed');
            inlinePanel.dataset.state = 'collapsed';
            inlineContent.hidden = true;
            toggleBtn.textContent = '開く';
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.setAttribute('aria-label', '分岐プレビューを開く');
          }
        });
      }
    },

    // Copy and download functionality
    bindCopyDownload() {
      const { copyBtn, dlBtn, view, src } = window.MermaidPreviewUIState.getUIRefs();

      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          const code = window.MermaidPreviewLogicManager.generateSource();
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(code);
            } else {
              if (src) {
                src.select();
                document.execCommand('copy');
              }
            }
            window.MermaidPreviewUIState.setStatus('Mermaidソースをコピーしました', 'ok');
          } catch {
            window.MermaidPreviewUIState.setStatus('クリップボードコピーに失敗しました', 'warn');
          }
        });
      }

      if (dlBtn) {
        dlBtn.addEventListener('click', async () => {
          if (!view.querySelector('svg')) await window.MermaidPreviewLogicManager.renderDiagram();
          const svg = view.querySelector('svg');
          if (!svg) {
            window.MermaidPreviewUIState.setStatus('先に描画してください', 'warn');
            return;
          }
          const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'mermaid-preview.svg';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
          window.MermaidPreviewUIState.setStatus('SVGをダウンロードしました', 'ok');
        });
      }
    },

    // Open in new window functionality
    bindOpenInNewWindow() {
      const { openBtn } = window.MermaidPreviewUIState.getUIRefs();

      if (openBtn) {
        openBtn.addEventListener('click', () => {
          const code = window.MermaidPreviewLogicManager.generateSource();
          const w = window.open('', '_blank');
          if (!w) return;
          const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Mermaid Preview</title>
<style>html,body{height:100%;margin:0;background:#111;color:#eee;} .wrap{min-height:100%;padding:12px;} .wrap .src{width:100%;height:120px;}
.view{background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:8px;overflow:auto;max-height:calc(100vh - 220px);} .bar{display:flex;gap:8px;margin:8px 0;}
button{padding:6px 10px;border-radius:8px;border:1px solid #444;background:#222;color:#eee;cursor:pointer;}
</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
</head><body><div class="wrap">
<h3>Mermaid Preview</h3>
<div class="bar"><button id="btn-render">描画</button><button id="btn-copy">ソースをコピー</button></div>
<textarea class="src" id="mmd-src"></textarea>
<div class="view" id="mmd-view"></div>
<script>mermaid.initialize({ startOnLoad:false });
const src = document.getElementById('mmd-src'); const view = document.getElementById('mmd-view'); src.value = ${JSON.stringify(code)};
async function render(){ try{ const out = await mermaid.render('mmd-'+Date.now(), src.value); view.innerHTML = out.svg || ''; }catch(e){ console.error(e); view.textContent='Mermaidの描画に失敗しました'; } }
document.getElementById('btn-render').onclick = render; document.getElementById('btn-copy').onclick = ()=>{ src.select(); document.execCommand('copy'); };
render();</script>
</div></body></html>`;
          w.document.open();
          w.document.write(html);
          w.document.close();
        });
      }
    },

    // Search functionality
    bindSearch() {
      const { searchInput, searchClear } = window.MermaidPreviewUIState.getUIRefs();

      if (searchInput) {
        searchInput.addEventListener('input', () => {
          window.MermaidPreviewLogicManager.renderDiagram();
        });
      }
      if (searchClear) {
        searchClear.addEventListener('click', () => {
          if (searchInput) searchInput.value = '';
          window.MermaidPreviewLogicManager.renderDiagram();
        });
      }
    },

    // Path finding functionality
    bindPathFinding() {
      const { pathStartSel, pathGoalSel, pathApplyBtn } = window.MermaidPreviewUIState.getUIRefs();

      if (pathStartSel) {
        pathStartSel.addEventListener('change', () => {
          window.MermaidPreviewLogicManager.renderDiagram();
        });
      }
      if (pathGoalSel) {
        pathGoalSel.addEventListener('change', () => {
          window.MermaidPreviewLogicManager.renderDiagram();
        });
      }
      if (pathApplyBtn) {
        pathApplyBtn.addEventListener('click', () => {
          window.MermaidPreviewLogicManager.renderDiagram();
        });
      }
    },
  };

  // Global exposure
  window.MermaidPreviewUIEvents = MermaidPreviewUIEvents;
})();
