# SP-007: Storage Provider Abstraction

## 概要

IndexedDB と LocalStorage を統一的に扱うストレージ抽象化レイヤー。

## アーキテクチャ

- `storage.js` — 基本抽象 (`StorageUtil.saveJSON` / `loadJSON`)
- `storageProvider.js` — IndexedDB/LocalStorage プロバイダ実装
- `storageProviders.js` — プロバイダバリアント
- `storageBridge.js` — システム間ブリッジ
- `storageOperationsManager.js` — 操作管理

## データバリデーション

`dataValidator.js` によるデータ整合性チェック:
- スキーマバリデーション
- 自動修復機能

## データマイグレーション

`dataMigration.js` による旧形式からの自動移行。

## ストレージキー体系

`APP_CONFIG.storage.keys` で一元管理:
- `agp_manuscript_simple` / `agp_manuscript_full` — 原稿
- `agp_game_data` — ゲームデータ
- `agp_game_progress` — 進行状態
- `agp_save_slots` — セーブスロット
- `agp_items` / `agp_characters` / `agp_lore` — ゲームアセット
- `agp_state` / `agp_theme` / `agp_theme_mode` — UI 状態
- `agp_editor_settings` — エディタ設定
- `agp_memos` — メモ

スナップショットプレフィックス: `agp_snap_`

## 実装ファイル

- `scripts/storage.js`, `storageProvider.js`, `storageProviders.js`
- `scripts/storageBridge.js`, `storageOperationsManager.js`
- `scripts/dataMigration.js`, `dataValidator.js`
