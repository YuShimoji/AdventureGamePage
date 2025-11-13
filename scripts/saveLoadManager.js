(function () {
  // Save/Load Manager - Handles save/load functionality and UI interactions
  const KEY_SIMPLE = 'agp_manuscript_simple';
  const KEY_FULL = 'agp_manuscript_full';

  function closeDropdown() {
    const dropdown = document.getElementById('floating-controls-dropdown');
    if (dropdown && !dropdown.hidden) dropdown.hidden = true;
  }

  window.SaveLoadManager = {
    init: function() {
      this.initSaveLoad();
      console.log('SaveLoadManager initialized');
    },

    // Save/load functionality
    initSaveLoad: function() {
      const btnOpenList = document.getElementById('btn-saves-list');
      const btnCloseList = document.getElementById('saves-close');
      const btnRefreshList = document.getElementById('saves-refresh');
      const savesPanel = document.getElementById('saves-panel');
      const savesList = document.getElementById('saves-list');

      async function renderSaves() {
        try {
          const reg = window.StorageProviders?.Registry;
          if (!reg) { savesList.innerHTML = '<div class="muted">保存機能が無効です</div>'; return; }
          const p = reg.getActive();
          if (!p || !p.isAvailable()) { savesList.innerHTML = '<div class="muted">利用可能な保存先がありません</div>'; return; }
          const list = await p.list();
          savesList.innerHTML = '';
          list.forEach(item => {
            const row = document.createElement('div'); row.className = 'memo-item';
            const head = document.createElement('div'); head.className = 'memo-head';
            const title = document.createElement('strong'); title.textContent = item.title || (window.APP_CONFIG?.strings?.defaultTitle ?? '');
            const meta = document.createElement('span'); meta.className = 'memo-meta';
            meta.textContent = `${new Date(item.savedAt).toLocaleString()} • ${item.provider} • ${Math.round((item.size||0)/1024)}KB`;
            const actions = document.createElement('div'); actions.className='memo-actions';
            const openBtn = document.createElement('button'); openBtn.className='btn'; openBtn.textContent='開く';
            const expBtn = document.createElement('button'); expBtn.className='btn'; expBtn.textContent='エクスポート';
            const delBtn = document.createElement('button'); delBtn.className='btn'; delBtn.textContent='削除';
            actions.append(openBtn, expBtn, delBtn);
            head.append(title, meta, actions);
            const body = document.createElement('div'); body.textContent = item.textPreview || '';
            row.append(head, body);
            savesList.appendChild(row);

            openBtn.addEventListener('click', async () => {
              try {
                const rec = await p.load(item.id); if (!rec) return;
                const titleInput = document.getElementById('title-input');
                const editor = document.getElementById('editor');
                titleInput.value = rec.title || (window.APP_CONFIG?.strings?.defaultTitle ?? '');
                if (rec.html) { editor.innerHTML = rec.html; } else { editor.innerText = rec.text || ''; }
                if (window.AdminEditor && window.AdminEditor.updateCharCount) {
                  window.AdminEditor.updateCharCount(editor, document.getElementById('char-count'));
                }
              } catch(e){ console.error(e); }
            });
            expBtn.addEventListener('click', async () => {
              try {
                const rec = await p.load(item.id); if (!rec) return;
                const name = `${(rec.title||'manuscript').replace(/[^\w\-一-龯ぁ-ゔァ-ヴー]/g, '_')}_${(rec.meta?.savedAt||'').slice(0,19).replace(/[:T]/g,'-')}.json`;
                const blob = new Blob([JSON.stringify(rec, null, 2)], { type: 'application/json' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
              } catch(e){ console.error(e); }
            });
            delBtn.addEventListener('click', async () => {
              if (!confirm('この保存を削除しますか？')) return;
              try { await p.remove(item.id); renderSaves(); } catch(e){ console.error(e); }
            });
          });
        } catch(e){ console.error('renderSaves', e); }
      }

      if (btnOpenList) btnOpenList.addEventListener('click', () => { savesPanel.hidden = false; renderSaves(); });
      if (btnCloseList) btnCloseList.addEventListener('click', () => { savesPanel.hidden = true; });
      if (btnRefreshList) btnRefreshList.addEventListener('click', () => { renderSaves(); });

      // Format bar buttons
      document.querySelectorAll('#formatbar [data-cmd]').forEach((b) => {
        b.addEventListener('click', () => document.execCommand(b.getAttribute('data-cmd'), false, undefined));
      });

      // Quick controls
      const btnQuickZen = document.getElementById('btn-quick-zen');
      const btnQuickSidebar = document.getElementById('btn-quick-sidebar');
      const btnQuickTheme = document.getElementById('btn-quick-theme');
      const btnQuickPreview = document.getElementById('btn-quick-preview');
      const btnQuickMore = document.getElementById('btn-quick-more');
      const btnQuickMemos = document.getElementById('btn-quick-memos');
      const dropdown = document.getElementById('floating-controls-dropdown');
      const panelHandle = document.getElementById('floating-panel-handle');

      if (btnQuickZen) btnQuickZen.addEventListener('click', () => document.body.classList.toggle('compact-view'));
      if (btnQuickSidebar) btnQuickSidebar.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        const hidden = sidebar.hidden;
        sidebar.hidden = !hidden; sidebar.classList.toggle('show', !sidebar.hidden);
      });
      if (btnQuickTheme) btnQuickTheme.addEventListener('click', () => {
        const themePanel = document.getElementById('theme-panel');
        themePanel.hidden = !themePanel.hidden;
      });
      if (btnQuickMore && dropdown) {
        btnQuickMore.addEventListener('click', (e) => {
          e.stopPropagation();
          const willOpen = dropdown.hidden;
          closeDropdown();
          if (willOpen) {
            dropdown.hidden = false;
          }
        });
        document.addEventListener('click', (e) => {
          if (dropdown && !dropdown.hidden && !e.target.closest('.floating-controls-group')) {
            closeDropdown();
          }
        });
      }

      // Preview functionality - integrate with SavePreviewPanelManager
      if (btnQuickPreview) {
        if (window.SavePreviewPanelManager && window.APP_CONFIG?.ui?.showSavePreview) {
          // Use SavePreviewPanelManager if available
          btnQuickPreview.addEventListener('click', () => {
            if (window.SavePreviewPanelManager.isOpen && window.SavePreviewPanelManager.isOpen()) {
              window.SavePreviewPanelManager.close();
            } else {
              window.SavePreviewPanelManager.open();
            }
          });
        } else {
          // Fallback to savesPanel
          btnQuickPreview.addEventListener('click', () => {
            const savesPanel = document.getElementById('saves-panel');
            if (savesPanel) {
              savesPanel.hidden = false;
              if (this.initSaveLoad && typeof renderSaves === 'function') {
                renderSaves();
              }
            }
          });
        }
      }
    }
  };
})();
