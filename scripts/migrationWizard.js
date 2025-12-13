// Data Migration Wizard
// Provides user-controlled migration from legacy data to extended schema

function getMigrationKeys() {
  const keys = window.APP_CONFIG?.storage?.keys || {};
  return {
    manuscriptFull: keys.full || 'agp_manuscript_full',
    items: keys.items || 'agp_items',
    characters: keys.characters || 'agp_characters',
    lore: keys.lore || 'agp_lore',
    state: keys.state || 'agp_state',
    backupLegacy: keys.backupLegacy || 'agp_backup_legacy',
  };
}

function showMigrationWizard() {
  if (typeof localStorage === 'undefined') return;

  const keys = getMigrationKeys();

  // Check if legacy data exists and migration not done
  const legacyData = localStorage.getItem(keys.manuscriptFull);
  if (!legacyData || localStorage.getItem(keys.items)) return;

  // Create wizard overlay
  const overlay = document.createElement('div');
  overlay.id = 'migration-wizard-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.8); z-index: 10000;
    display: flex; align-items: center; justify-content: center;
  `;

  const wizard = document.createElement('div');
  wizard.style.cssText = `
    background: var(--surface, #fff); color: var(--text-color, #000);
    padding: 24px; border-radius: 12px; max-width: 500px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  `;

  wizard.innerHTML = `
    <h2 style="margin-top: 0;">データ移行ウィザード</h2>
    <p>古い保存データを新しい形式に移行します。この処理により、既存のデータをアイテム・キャラクター・Wiki・プレイヤー状態として整理できます。</p>

    <div id="migration-preview" style="margin: 16px 0; padding: 12px; background: rgba(0,0,0,0.1); border-radius: 8px; max-height: 200px; overflow: auto;">
      <p><strong>検出されたデータ:</strong></p>
      <ul id="migration-details"></ul>
    </div>

    <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
      <button id="migration-skip" class="btn">後で</button>
      <button id="migration-start" class="btn btn-accent">移行開始</button>
    </div>
  `;

  overlay.appendChild(wizard);
  document.body.appendChild(overlay);

  // Preview migration data
  previewMigration();

  // Event handlers
  document.getElementById('migration-skip').addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('migration-start').addEventListener('click', async () => {
    // Create backup before migration
    const backupCreated = createBackup();

    // Show progress UI
    wizard.innerHTML = `
      <h2 style="margin-top: 0;">データ移行中...</h2>
      <div style="margin: 20px 0;">
        <div style="background: rgba(0,0,0,0.1); border-radius: 8px; height: 24px; overflow: hidden;">
          <div id="migration-progress-bar" style="background: var(--accent, #4a9eff); height: 100%; width: 0%; transition: width 0.3s;"></div>
        </div>
        <p id="migration-status" style="margin-top: 8px; font-size: 14px; color: var(--muted);">準備中...</p>
      </div>
      <div id="migration-log" style="max-height: 200px; overflow: auto; padding: 12px; background: rgba(0,0,0,0.05); border-radius: 8px; font-family: monospace; font-size: 12px;"></div>
    `;

    const result = await performMigrationWithProgress();

    if (result.success) {
      wizard.innerHTML = `
        <h2 style="margin-top: 0;">✅ 移行完了</h2>
        <p>データ移行が完了しました。新しい形式でデータを管理できます。</p>
        
        <div style="margin: 16px 0; padding: 12px; background: rgba(0,200,0,0.1); border-radius: 8px;">
          <p><strong>変換結果:</strong></p>
          <ul style="margin: 8px 0; padding-left: 20px;">
            <li>アイテム: ${result.stats.items}件</li>
            <li>キャラクター: ${result.stats.characters}件</li>
            <li>Wikiエントリ: ${result.stats.lore}件</li>
            <li>プレイヤー状態: 1件</li>
          </ul>
        </div>

        ${backupCreated ? `<p style="font-size: 12px; color: var(--muted);">バックアップが作成されました: ${keys.backupLegacy}</p>` : ''}

        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
          <button id="migration-close" class="btn btn-accent">閉じる</button>
        </div>
      `;
      document.getElementById('migration-close').addEventListener('click', () => {
        overlay.remove();
      });
    } else {
      wizard.innerHTML = `
        <h2 style="margin-top: 0;">❌ 移行失敗</h2>
        <p>移行中にエラーが発生しました。</p>
        
        <div style="margin: 16px 0; padding: 12px; background: rgba(200,0,0,0.1); border-radius: 8px;">
          <p><strong>エラー詳細:</strong></p>
          <pre style="white-space: pre-wrap; font-size: 12px;">${result.error}</pre>
        </div>

        ${backupCreated ? '<p style="font-size: 12px; color: var(--muted);">バックアップから復元できます。</p>' : ''}

        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
          ${backupCreated ? '<button id="migration-restore" class="btn">バックアップから復元</button>' : ''}
          <button id="migration-close" class="btn">閉じる</button>
        </div>
      `;

      if (backupCreated) {
        document.getElementById('migration-restore').addEventListener('click', () => {
          restoreFromBackup();
          if (window.ToastManager) {
            ToastManager.success('バックアップから復元しました。');
          } else {
            alert('バックアップから復元しました。');
          }
          overlay.remove();
        });
      }

      document.getElementById('migration-close').addEventListener('click', () => {
        overlay.remove();
      });
    }
  });
}

function previewMigration() {
  const keys = getMigrationKeys();
  const legacyData = localStorage.getItem(keys.manuscriptFull);
  if (!legacyData) return;

  try {
    const parsed = JSON.parse(legacyData);
    const details = document.getElementById('migration-details');

    const items = extractItemsFromText(parsed.text || parsed.html || '');
    const characters = extractCharactersFromText(parsed.text || parsed.html || '');
    const lore = extractLoreFromText(parsed.text || parsed.html || '');

    details.innerHTML = `
      <li>アイテム: ${items.length}件</li>
      <li>キャラクター: ${characters.length}件</li>
      <li>Wikiエントリ: ${lore.length}件</li>
      <li>プレイヤー状態: 1件（新規作成）</li>
    `;
  } catch (e) {
    console.error('Preview failed:', e);
    document.getElementById('migration-details').innerHTML = '<li>プレビュー生成失敗</li>';
  }
}

function createBackup() {
  try {
    const keys = getMigrationKeys();
    const legacyData = localStorage.getItem(keys.manuscriptFull);
    if (!legacyData) return false;

    const backupKey = keys.backupLegacy;
    const backup = {
      data: legacyData,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem(backupKey, JSON.stringify(backup));
    console.log('Backup created successfully:', backupKey);
    return true;
  } catch (e) {
    console.error('Backup creation failed:', e);
    return false;
  }
}

function restoreFromBackup() {
  try {
    const keys = getMigrationKeys();
    const backupKey = keys.backupLegacy;
    const backupStr = localStorage.getItem(backupKey);
    if (!backupStr) return false;

    const backup = JSON.parse(backupStr);
    localStorage.setItem(keys.manuscriptFull, backup.data);

    // Clear migrated data
    localStorage.removeItem(keys.items);
    localStorage.removeItem(keys.characters);
    localStorage.removeItem(keys.lore);
    localStorage.removeItem(keys.state);

    console.log('Restored from backup successfully');
    return true;
  } catch (e) {
    console.error('Restore failed:', e);
    return false;
  }
}

function updateProgress(percent, status, logMessage) {
  const progressBar = document.getElementById('migration-progress-bar');
  const statusEl = document.getElementById('migration-status');
  const logEl = document.getElementById('migration-log');

  if (progressBar) progressBar.style.width = `${percent}%`;
  if (statusEl) statusEl.textContent = status;
  if (logEl && logMessage) {
    const timestamp = new Date().toLocaleTimeString();
    logEl.innerHTML += `<div>[${timestamp}] ${logMessage}</div>`;
    logEl.scrollTop = logEl.scrollHeight;
  }
}

async function performMigrationWithProgress() {
  const keys = getMigrationKeys();
  const result = {
    success: false,
    stats: { items: 0, characters: 0, lore: 0 },
    error: null,
  };

  try {
    updateProgress(10, 'レガシーデータ読み込み中...', 'データ取得開始');
    const legacyData = localStorage.getItem(keys.manuscriptFull);
    if (!legacyData) {
      throw new Error('レガシーデータが見つかりません');
    }

    const parsed = JSON.parse(legacyData);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('データ形式が不正です');
    }
    updateProgress(20, 'データ解析完了', 'データ構造を確認しました');

    // Simulate async for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    // Migrate items
    updateProgress(30, 'アイテム変換中...', 'アイテムデータを抽出しています');
    const items = extractItemsFromText(parsed.text || parsed.html || '');
    localStorage.setItem(keys.items, JSON.stringify({ items }));
    result.stats.items = items.length;
    updateProgress(
      45,
      `アイテム変換完了 (${items.length}件)`,
      `${items.length}件のアイテムを保存しました`
    );

    await new Promise(resolve => setTimeout(resolve, 200));

    // Migrate characters
    updateProgress(55, 'キャラクター変換中...', 'キャラクターデータを抽出しています');
    const characters = extractCharactersFromText(parsed.text || parsed.html || '');
    localStorage.setItem(keys.characters, JSON.stringify({ characters }));
    result.stats.characters = characters.length;
    updateProgress(
      70,
      `キャラクター変換完了 (${characters.length}件)`,
      `${characters.length}件のキャラクターを保存しました`
    );

    await new Promise(resolve => setTimeout(resolve, 200));

    // Migrate lore
    updateProgress(80, 'Wiki変換中...', 'Wikiエントリを抽出しています');
    const lore = extractLoreFromText(parsed.text || parsed.html || '');
    localStorage.setItem(keys.lore, JSON.stringify({ lore }));
    result.stats.lore = lore.length;
    updateProgress(
      90,
      `Wiki変換完了 (${lore.length}件)`,
      `${lore.length}件のWikiエントリを保存しました`
    );

    await new Promise(resolve => setTimeout(resolve, 200));

    // Migrate state
    updateProgress(95, 'プレイヤー状態作成中...', '初期状態を設定しています');
    const state = {
      inventory: {},
      flags: {},
      variables: { migratedFromLegacy: true, migrationDate: new Date().toISOString() },
      history: parsed.history || [],
    };
    localStorage.setItem(keys.state, JSON.stringify({ state }));
    updateProgress(100, '移行完了！', 'すべてのデータ変換が完了しました');

    result.success = true;
    console.log('Migration completed successfully:', result.stats);
    return result;
  } catch (e) {
    console.error('Migration failed:', e);
    result.error = e.message || '不明なエラーが発生しました';
    updateProgress(0, '移行失敗', `エラー: ${result.error}`);
    return result;
  }
}

// Helper functions (duplicated from dataMigration.js for independence)
function extractItemsFromText(text) {
  const items = [];
  const itemPatterns = [
    { regex: /剣|刀|武器/g, type: 'weapon' },
    { regex: /薬|ポーション/g, type: 'consumable' },
    { regex: /鎧|盾/g, type: 'armor' },
  ];

  itemPatterns.forEach(({ regex, type }) => {
    const matches = text.match(regex);
    if (matches) {
      matches.forEach((match, index) => {
        items.push({
          id: `${type}${index + 1}`,
          name: match,
          type,
          description: `${match} - 自動抽出されたアイテム。`,
          properties: {},
        });
      });
    }
  });

  return items;
}

function extractCharactersFromText(text) {
  const characters = [];
  const namePatterns = /[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g;
  const matches = text.match(namePatterns) || [];

  matches.forEach((name, index) => {
    characters.push({
      id: `char${index + 1}`,
      name,
      type: 'npc',
      description: `${name} - 自動抽出されたキャラクター。`,
      stats: { hp: 50, attack: 5, defense: 5 },
      relationships: [],
    });
  });

  return characters;
}

function extractLoreFromText(text) {
  const lore = [];
  const sections = text.split(/\n\s*\n/);

  sections.forEach((section, index) => {
    if (
      section.includes('歴史') ||
      section.includes('伝説') ||
      section.includes('王国') ||
      section.includes('古代')
    ) {
      lore.push({
        id: `lore${index + 1}`,
        title: `抽出されたロア ${index + 1}`,
        content: section,
        tags: ['auto-extracted'],
        related: [],
      });
    }
  });

  return lore;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.MigrationWizard = { showMigrationWizard };
}
