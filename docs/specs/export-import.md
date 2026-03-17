# SP-014: Export/Import & Data Migration

## 概要

ゲームデータの JSON エクスポート/インポート、旧データのマイグレーションウィザード。

## エクスポート/インポート

`scripts/exportImport.js` が管理:
- ゲームデータの JSON ファイルダウンロード
- JSON ファイルからのインポート
- ラウンドトリップ互換性

`scripts/importManager.js`:
- インポートハンドリング
- ドラッグ&ドロップ対応

## データマイグレーション

`scripts/migrationWizard.js` が旧 localStorage データの移行を支援:
- プログレスバー・詳細ログ表示
- データプレビュー・手動実行
- バックアップ/復元機能 (createBackup/restoreFromBackup)

## データ変換

`scripts/converters.js`:
- 仕様ドラフト形式 ⇄ エンジン形式の相互変換

## 実装ファイル

- `scripts/exportImport.js`
- `scripts/importManager.js`
- `scripts/migrationWizard.js`
- `scripts/converters.js`
