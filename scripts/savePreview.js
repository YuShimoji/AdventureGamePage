(function(){
  function humanSize(bytes){
    if(!bytes && bytes !== 0) return '';
    const units = ['B','KB','MB','GB'];
    let i=0, val=bytes;
    while(val>=1024 && i<units.length-1){ val/=1024; i++; }
    return `${val.toFixed(val<10 && i>0 ? 1 : 0)} ${units[i]}`;
  }

  const selected = new Set();
  function updateDeleteSelectedBtn(){
    const btn = document.getElementById('preview-delete-selected');
    if(btn) btn.disabled = selected.size === 0;
  }

  function fmtDate(iso){
    if(!iso) return '';
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  }

  function renderList(listEl, items){
    listEl.innerHTML = '';
    if(!items || items.length===0){
      const empty = document.createElement('div');
      empty.className = 'preview-empty';
      empty.textContent = '保存データが見つかりません';
      listEl.appendChild(empty);
      return;
    }
    items.forEach(item => {
      const row = document.createElement('div'); row.className = 'preview-item';
      const head = document.createElement('div'); head.className = 'preview-head';
      const title = document.createElement('strong'); title.textContent = item.title || '(無題)';
      const cb = document.createElement('input'); cb.type='checkbox'; cb.className='preview-select'; cb.title='選択';
      cb.addEventListener('change', () => { if(cb.checked) selected.add(item.id); else selected.delete(item.id); updateDeleteSelectedBtn(); });
      const meta = document.createElement('span'); meta.className = 'preview-meta';
      const kind = item.kind || item.type || '';
      meta.textContent = [fmtDate(item.savedAt), kind, humanSize(item.size)].filter(Boolean).join(' / ');
      head.append(cb, title, meta);

      const body = document.createElement('div'); body.className = 'preview-body';
      body.textContent = item.textPreview || item.excerpt || '';
      const actions = document.createElement('div'); actions.className = 'preview-actions';
      const btnLoad = document.createElement('button'); btnLoad.className = 'btn'; btnLoad.textContent = '読込';
      const btnDel = document.createElement('button'); btnDel.className = 'btn'; btnDel.textContent = '削除';
      // snapshot: allow label edit and comparison
      let btnLabel = null;
      let btnCompare = null;
      if((item.kind || item.type) === 'snapshot'){
        btnLabel = document.createElement('button'); btnLabel.className='btn'; btnLabel.textContent='編集';
        btnLabel.addEventListener('click', async () => {
          try {
            let obj = null;
            if(window.StorageBridge && window.StorageBridge.get){ obj = await window.StorageBridge.get(item.id); }
            else {
              const p = window.StorageHub?.getProvider?.();
              const maybe = p?.get?.(item.id);
              obj = (maybe && typeof maybe.then === 'function') ? await maybe : maybe;
            }
            if(!obj || typeof obj !== 'object' || !obj.meta){ alert('編集に対応していないデータです'); return; }
            const curLabel = obj.meta?.label || '';
            const curTags = (obj.meta?.tags || []).join(', ');

            const newLabel = prompt('新しいラベルを入力', curLabel);
            if(newLabel == null) return; // cancel

            const newTagsStr = prompt('タグをカンマ区切りで入力（例: draft, important）', curTags);
            if(newTagsStr == null) return; // cancel

            obj.meta.label = newLabel.trim();
            obj.meta.tags = newTagsStr.split(',').map(t => t.trim()).filter(t => t);

            if(window.StorageBridge && window.StorageBridge.set){ await window.StorageBridge.set(item.id, obj); }
            else {
              const p = window.StorageHub?.getProvider?.();
              const maybe = p?.set?.(item.id, obj);
              if(maybe && typeof maybe.then === 'function') await maybe;
            }
            await refresh();
          } catch(e){ console.error('edit-snapshot', e); alert('編集に失敗しました'); }
        });

        // Add compare button for snapshots
        btnCompare = document.createElement('button');
        btnCompare.className = 'btn';
        btnCompare.textContent = '比較選択';
        btnCompare.setAttribute('data-snapshot-id', item.id);
        btnCompare.addEventListener('click', () => {
          if (window.SnapshotCompare && window.SnapshotCompare.selectSnapshotForComparison) {
            window.SnapshotCompare.selectSnapshotForComparison(item.id);
            
            // Toggle button appearance
            const selected = window.SnapshotCompare.getSelectedSnapshots();
            if (selected.includes(item.id)) {
              btnCompare.style.background = 'var(--accent, #4a9eff)';
              btnCompare.style.color = '#fff';
            } else {
              btnCompare.style.background = '';
              btnCompare.style.color = '';
            }
          }
        });
      }
      actions.append(btnLoad, btnDel);
      if(btnLabel) actions.append(btnLabel);
      if(btnCompare) actions.append(btnCompare);

      btnLoad.addEventListener('click', async () => {
        const ok = await window.AdminAPI?.loadById?.(item.id);
        if(!ok){ alert('読込に失敗しました'); return; }
        // close panel after load for better UX
        const panel = document.getElementById('preview-panel');
        if(panel) panel.hidden = true;
      });
      btnDel.addEventListener('click', async () => {
        if(!confirm('この保存データを削除しますか？')) return;
        const ok = await window.AdminAPI?.deleteById?.(item.id);
        if(!ok){ alert('削除に失敗しました'); return; }
        refresh();
      });

      row.append(head, body, actions);
      listEl.appendChild(row);
    });
  }

  async function refresh(){
    const listEl = document.getElementById('preview-list');
    if(!listEl) return;
    try {
      let items = [];
      if (window.StorageBridge) {
        items = await window.StorageBridge.list();
      } else {
        const provider = window.StorageHub?.getProvider?.();
        const maybe = provider ? provider.list() : [];
        items = (maybe && typeof maybe.then === 'function') ? await maybe : maybe;
      }
      // apply filter/sort from controls if available
      try {
        const opts = window.PreviewUtils?.readControls?.();
        if(opts && window.PreviewUtils){
          items = window.PreviewUtils.filterItems(items, opts.type);
          items = window.PreviewUtils.searchItems(items, opts.search);
          items = window.PreviewUtils.filterByTag(items, opts.tag);
          items = window.PreviewUtils.filterByDateRange(items, opts.dateFrom, opts.dateTo);
          items = window.PreviewUtils.sortItems(items, opts.sort);
        }
      } catch(e){ /* non-fatal */ }
      renderList(listEl, items);
    } catch (e){
      console.error('savePreview.refresh error', e);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if(!window.APP_CONFIG?.ui?.showSavePreview) return; // feature flag

    const panel = document.getElementById('preview-panel');
    const openBtn = document.getElementById('btn-quick-preview');
    const closeBtn = document.getElementById('preview-close');
    const refreshBtn = document.getElementById('preview-refresh');
    const snapBtn = document.getElementById('snapshot-create');
    const snapLabel = document.getElementById('snapshot-label');
    const typeSel = document.getElementById('preview-filter-type');
    const sortSel = document.getElementById('preview-sort');
    const searchInput = document.getElementById('preview-search');
    const tagSel = document.getElementById('preview-filter-tag');
    const dateFromInput = document.getElementById('preview-date-from');
    const dateToInput = document.getElementById('preview-date-to');
    const compareBtn = document.getElementById('snapshot-compare-btn');
    const delSelBtn = document.getElementById('preview-delete-selected');

    if(!panel) return;

    async function toggle(){ panel.hidden = !panel.hidden; if(!panel.hidden) await refresh(); }

    if(openBtn) openBtn.addEventListener('click', toggle);
    if(closeBtn) closeBtn.addEventListener('click', () => { panel.hidden = true; });
    if(refreshBtn) refreshBtn.addEventListener('click', () => { selected.clear(); updateDeleteSelectedBtn(); refresh(); });
    if(typeSel) typeSel.addEventListener('change', () => { refresh(); });
    if(sortSel) sortSel.addEventListener('change', () => { refresh(); });
    if(searchInput) searchInput.addEventListener('input', () => { refresh(); });
    if(tagSel) tagSel.addEventListener('change', () => { refresh(); });
    if(dateFromInput) dateFromInput.addEventListener('change', () => { refresh(); });
    if(dateToInput) dateToInput.addEventListener('change', () => { refresh(); });
    if(compareBtn) compareBtn.addEventListener('click', () => {
      if (window.SnapshotCompare && window.SnapshotCompare.compareSnapshots) {
        window.SnapshotCompare.compareSnapshots();
      }
    });
    if(delSelBtn) delSelBtn.addEventListener('click', async () => {
      if(selected.size === 0) return;
      if(!confirm(`選択中の ${selected.size} 件を削除しますか？`)) return;
      try{
        const ids = Array.from(selected);
        for(const id of ids){
          const ok = await window.AdminAPI?.deleteById?.(id);
          if(!ok) console.warn('削除に失敗:', id);
        }
        selected.clear();
        updateDeleteSelectedBtn();
        await refresh();
      } catch(e){ console.error('delete-selected', e); alert('選択削除に失敗しました'); }
    });

    // Snapshot create
    if(snapBtn){
      snapBtn.addEventListener('click', async () => {
        try {
          const conf = window.APP_CONFIG?.storage?.snapshots;
          if(!conf?.enabled){ alert('スナップショットは無効化されています'); return; }
          const prefix = conf?.prefix || 'agp_snap_';
          const ts = Date.now();
          const rand = Math.random().toString(36).slice(2,6);
          const id = `${prefix}${ts}_${rand}`;
          const titleEl = document.getElementById('title-input');
          const editor = document.getElementById('editor');
          const now = new Date().toISOString();
          const theme = (window.Theme && typeof Theme.loadTheme === 'function') ? Theme.loadTheme() : null;
          const obj = {
            title: (titleEl?.value || '').trim() || (window.APP_CONFIG?.strings?.defaultTitle ?? ''),
            html: editor?.innerHTML || '',
            text: editor?.innerText || '',
            meta: {
              savedAt: now,
              theme,
              label: (snapLabel?.value || '').trim(),
              tags: [] // initialize tags array for future extension
            }
          };
          if(window.StorageBridge){ await window.StorageBridge.set(id, obj); }
          else {
            const p = window.StorageHub?.getProvider?.();
            const maybe = p?.set?.(id, obj);
            if(maybe && typeof maybe.then === 'function') await maybe;
          }
          if(snapLabel) snapLabel.value = '';
          await refresh();
          alert('スナップショットを作成しました');
        } catch(e){ console.error('snapshot-create', e); alert('スナップショットの作成に失敗しました'); }
      });
    }

    // If feature enabled and panel is visible by default (optional), refresh.
    if(!panel.hidden){ refresh(); }
  });

  window.SavePreview = { refresh };
})();
