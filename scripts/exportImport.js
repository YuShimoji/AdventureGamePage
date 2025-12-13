(function () {
  // Enhanced Export/Import functionality with batch operations and conflict resolution

  const EXPORT_VERSION = '1.0';

  // Export multiple records with filtering and compression
  async function exportMultiple(options = {}) {
    const {
      ids = null, // specific IDs or null for all
      filter = {}, // { kind: 'full', dateFrom: '2023-01-01', dateTo: '2023-12-31' }
      compress = false, // ZIP compression
      includeMetadata = true,
    } = options;

    const provider = window.StorageProviders?.Registry?.getActive();
    if (!provider) throw new Error('No storage provider available');

    let records = await provider.list();

    // Apply filters
    if (ids) {
      records = records.filter(r => ids.includes(r.id));
    }
    if (filter.kind) {
      records = records.filter(r => r.kind === filter.kind);
    }
    if (filter.dateFrom) {
      const from = new Date(filter.dateFrom);
      records = records.filter(r => new Date(r.savedAt) >= from);
    }
    if (filter.dateTo) {
      const to = new Date(filter.dateTo);
      records = records.filter(r => new Date(r.savedAt) <= to);
    }

    // Load full records
    const fullRecords = [];
    for (const meta of records) {
      const full = await provider.load(meta.id);
      if (full) fullRecords.push(full);
    }

    const exportData = {
      version: EXPORT_VERSION,
      timestamp: new Date().toISOString(),
      records: fullRecords,
    };

    if (includeMetadata) {
      exportData.metadata = {
        count: fullRecords.length,
        totalSize: fullRecords.reduce((sum, r) => sum + JSON.stringify(r).length, 0),
        filters: options,
      };
    }

    if (compress && window.JSZip) {
      const zip = new window.JSZip();
      zip.file('export.json', JSON.stringify(exportData, null, 2));
      const blob = await zip.generateAsync({ type: 'blob' });
      return { blob, filename: `agp-export-${Date.now()}.zip` };
    } else {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      return { blob, filename: `agp-export-${Date.now()}.json` };
    }
  }

  // Batch import with conflict resolution
  async function importBatch(files, options = {}) {
    const {
      onProgress = () => {},
      onConflict = 'skip', // 'skip', 'overwrite', 'rename'
      dryRun = false,
    } = options;

    const provider = window.StorageProviders?.Registry?.getActive();
    if (!provider) throw new Error('No storage provider available');

    const results = {
      success: [],
      conflicts: [],
      errors: [],
      total: files.length,
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      onProgress(i + 1, files.length);

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Handle both single record and batch format
        const records = data.records || [data];

        for (const record of records) {
          if (!record.id) {
            results.errors.push({ file: file.name, error: 'Missing record ID' });
            continue;
          }

          const existing = await provider.load(record.id);
          let finalRecord = record;

          if (existing) {
            results.conflicts.push({
              id: record.id,
              existing: existing,
              incoming: record,
            });

            if (onConflict === 'rename') {
              finalRecord = { ...record, id: record.id + '_imported_' + Date.now() };
            } else if (onConflict === 'skip') {
              continue;
            }
            // 'overwrite' falls through
          }

          if (!dryRun) {
            await provider.save(finalRecord);
            results.success.push(finalRecord.id);
          }
        }
      } catch (e) {
        results.errors.push({ file: file.name, error: e.message });
      }
    }

    return results;
  }

  // Utility: Download blob
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // UI Integration helpers
  function createExportDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="modal-content card">
        <h3>エクスポート設定</h3>
        <form id="export-form">
          <div class="field">
            <label><input type="checkbox" name="all" checked /> すべてのデータをエクスポート</label>
          </div>
          <div class="field" id="filter-section">
            <label>種類フィルタ</label>
            <select name="kind">
              <option value="">すべて</option>
              <option value="full">完全保存</option>
              <option value="simple">シンプル保存</option>
            </select>
          </div>
          <div class="field">
            <label><input type="checkbox" name="compress" /> ZIP圧縮</label>
          </div>
          <div class="actions">
            <button type="button" class="btn" onclick="this.closest('.modal-overlay').remove()">キャンセル</button>
            <button type="submit" class="btn btn-accent">エクスポート</button>
          </div>
        </form>
      </div>
    `;

    dialog.querySelector('#export-form').addEventListener('submit', async e => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const options = {
        compress: formData.get('compress') === 'on',
      };

      if (!formData.get('all')) {
        options.filter = {
          kind: formData.get('kind') || undefined,
        };
      }

      try {
        const { blob, filename } = await exportMultiple(options);
        downloadBlob(blob, filename);
        dialog.remove();
      } catch (e) {
        ToastManager.error('エクスポート失敗: ' + e.message);
      }
    });

    return dialog;
  }

  function createImportDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="modal-content card">
        <h3>インポート設定</h3>
        <form id="import-form">
          <div class="field">
            <label>ファイル選択</label>
            <input type="file" name="files" multiple accept=".json,.zip" required />
          </div>
          <div class="field">
            <label>競合時の動作</label>
            <select name="conflict">
              <option value="skip">スキップ</option>
              <option value="overwrite">上書き</option>
              <option value="rename">リネーム</option>
            </select>
          </div>
          <div class="field">
            <label><input type="checkbox" name="dryRun" /> ドライラン（確認のみ）</label>
          </div>
          <div id="progress" style="display:none;">
            <progress value="0" max="100"></progress>
            <span id="progress-text">準備中...</span>
          </div>
          <div class="actions">
            <button type="button" class="btn" onclick="this.closest('.modal-overlay').remove()">キャンセル</button>
            <button type="submit" class="btn btn-accent">インポート</button>
          </div>
        </form>
      </div>
    `;

    dialog.querySelector('#import-form').addEventListener('submit', async e => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const files = formData.getAll('files');
      const conflict = formData.get('conflict');
      const dryRun = formData.get('dryRun') === 'on';

      const progressEl = dialog.querySelector('#progress');
      const progressBar = progressEl.querySelector('progress');
      const progressText = dialog.querySelector('#progress-text');

      progressEl.style.display = 'block';

      try {
        const results = await importBatch(files, {
          onProgress: (current, total) => {
            progressBar.value = (current / total) * 100;
            progressText.textContent = `${current}/${total} 処理中...`;
          },
          onConflict: conflict,
          dryRun,
        });

        let message = `完了: ${results.success.length}件成功`;
        if (results.conflicts.length) message += `, ${results.conflicts.length}件競合`;
        if (results.errors.length) message += `, ${results.errors.length}件エラー`;

        if (results.errors.length) {
          ToastManager.error(message);
        } else if (results.conflicts.length) {
          ToastManager.warning(message);
        } else {
          ToastManager.success(message);
        }
        dialog.remove();
      } catch (e) {
        ToastManager.error('インポート失敗: ' + e.message);
      }
    });

    return dialog;
  }

  // Expose API
  window.ExportImport = {
    exportMultiple,
    importBatch,
    downloadBlob,
    createExportDialog,
    createImportDialog,
  };
})();
