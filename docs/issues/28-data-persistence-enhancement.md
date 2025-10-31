# Issue #28: データ永続化強化 (IndexedDB完全移行 & エクスポート/インポート改善)

## Goal

現在のLocalStorage/IndexedDB混在をIndexedDB完全移行し、エクスポート/インポート機能を強化してデータ永続性とポータビリティを向上させる。

## Current Status

- ストレージプロバイダ: IndexedDB (推奨) と LocalStorage (fallback)
- エクスポート: JSON出力、部分エクスポート (サブグラフ)
- インポート: JSONファイル読込、自動適用
- 問題点: LocalStorage使用継続、インポート時の上書き確認なし、複数ファイル同時インポート不可

## ToDo

### Phase 1: IndexedDB完全移行 (Priority: High)

- [ ] **LocalStorage廃止**
  - 既存LocalStorageデータをIndexedDBに移行
  - プロバイダ選択UIからLocalStorageオプション除去
  - 移行スクリプト作成（初回起動時自動実行）

- [ ] **IndexedDB構造最適化**
  - データベースバージョンアップ（v2）
  - インデックス追加（保存日時、サイズ、タイプ）
  - エラー処理強化（容量不足、クォータ超過）

### Phase 2: エクスポート機能改善 (Priority: High)

- [ ] **複数データ同時エクスポート**
  - 一括エクスポート機能追加（全保存データ）
  - エクスポートフィルタ（タイプ、日付範囲）
  - 圧縮オプション（ZIP形式）

- [ ] **エクスポート形式拡張**
  - メタデータ追加（バージョン、作成日時、チェックサム）
  - バックアップ形式（完全復元可能）
  - CSV/TSV出力（データ分析用）

### Phase 3: インポート機能改善 (Priority: High)

- [ ] **安全なインポート処理**
  - 上書き確認ダイアログ
  - 競合解決オプション（上書き/スキップ/リネーム）
  - インポート前検証（フォーマットチェック）

- [ ] **バッチインポート**
  - 複数ファイル同時選択
  - 進捗表示と中断機能
  - エラーレポート（失敗ファイル一覧）

- [ ] **インポート履歴**
  - インポートログ保存
  - ロールバック機能（最後のインポート取り消し）

## Acceptance Criteria

### IndexedDB移行
- [ ] LocalStorageデータ自動移行完了
- [ ] 新規保存はすべてIndexedDB
- [ ] ストレージ選択UIからLocalStorage除去
- [ ] 移行成功率100%（データ損失なし）

### エクスポート改善
- [ ] 複数データ同時エクスポート可能
- [ ] エクスポートファイルにメタデータ含む
- [ ] フィルタ/圧縮オプション実装

### インポート改善
- [ ] 安全な上書き確認
- [ ] 複数ファイルバッチインポート
- [ ] 競合解決とロールバック機能

## Risk Assessment

Tier: 2 (Medium risk - データ移行とストレージ変更)

## Estimated Effort

High (3-4 days)

- Phase 1: 1.5 days (IndexedDB移行)
- Phase 2: 1 day (エクスポート改善)
- Phase 3: 1.5 days (インポート改善)

## Implementation Notes

### IndexedDB移行戦略
```javascript
// 移行関数例
async function migrateToIndexedDB() {
  const localData = localStorage.getItem('agp_saved_games');
  if (localData) {
    await idbProvider.save('migrated_backup', JSON.parse(localData));
    localStorage.removeItem('agp_saved_games');
  }
}
```

### エクスポート拡張
- 新規API: `exportMultiple(filters)` - フィルタ条件で複数エクスポート
- メタデータ: `{version: "1.0", timestamp: Date.now(), checksum: hash}`

### インポート強化
- UI追加: インポート設定モーダル
- バリデーション: JSONスキーマチェック
- 履歴: IndexedDBにインポートログ保存

## Dependencies

- 完了済: #26 UIワークフロー統合 (ストレージ統合)
- 関連: #27 レスポンシブ改善 (UI変更なし)

## Testing Strategy

- 移行テスト: LocalStorage→IndexedDBデータ完全移行確認
- エクスポートテスト: 複数データ/フィルタ/圧縮機能検証
- インポートテスト: 競合解決/バッチ/ロールバックテスト
- 回帰テスト: 既存保存/読込機能維持確認

## Related Issues

- #26: UIワークフロー統合 (ストレージ統合基盤)
- #29: パフォーマンス最適化 (IndexedDB使用で改善)
