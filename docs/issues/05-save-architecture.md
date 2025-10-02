# Issue: 保存アーキテクチャの再設計（容量制限とプレビュー対応）

- 種別: design
- 優先度: high

## 背景
現状は `localStorage` を利用したプレーンテキスト（シンプル保存）と HTML+メタ（完全保存）の2種のみ。`localStorage` には約5MBの容量制限があり、長文や画像（base64）を扱うには不十分。保存内容のプレビューもなく、読み込みによる確認しかできない。

## 目標
- 容量制限に耐える保存先の選定と分離（ストレージ抽象化）
- 保存内容のプレビューUI（読み込まずに要約/メタを一覧）
- 将来のクラウド連携（GitHub Gist/Drive等）に拡張可能な設計

## 方針案
1. ストレージ抽象化レイヤ
   - `StorageProvider` を定義し、`LocalStorageProvider` / `IndexedDBProvider` / `FileSystemAccessProvider` を差し替え可能に。
2. データモデル分離
   - `Manuscript`（本文）と `Meta`（テーマ/履歴/タグ）を分離。画像等のバイナリは別レイヤへ。
3. プレビュー
   - 保存一覧（id, タイトル, 保存日時, 先頭N文字の抜粋, サイズ）をモーダルで表示。読み込まずに確認可能。
4. 画像対応
   - まずは外部参照（相対パス/URL）を採用。将来は IndexedDB BLOB か File System Access API でバイナリ保存。

## 受け入れ条件
- 既存の保存/読込UIを保ちつつ、保存先を差し替えられる
- プレビューUIで内容が一覧できる

## タスク
- `docs/design/storage-architecture.mmd` にMermaidでクラス図/フロー図を作成
- 抽象インターフェースの雛形を `scripts/storageProvider.js` に追加
- プレビューUIのモックを `admin.html` に追加（非表示フラグ）

## 進捗（2025-09-24）
- [x] 抽象インターフェース雛形を追加: `scripts/storageProvider.js`
  - `StorageProvider` インターフェース、`LocalStorageProvider` 実装、`StorageHub`（プロバイダ切替ハブ）を実装
- [x] プレビューUIモックを追加
  - UI: `admin.html` に `preview-panel` と 🗂 ボタン（`#btn-quick-preview`）
  - スタイル: `styles/admin.css` にプレビューパネル用スタイル
  - ロジック: `scripts/savePreview.js`（`StorageHub` 経由で `list()` を取得・描画）
  - フラグ: `scripts/config.js` に `ui.showSavePreview`（既定: false）
- [x] 設計ドキュメントを追加: `docs/design/storage-architecture.mmd`（クラス図/フロー）

## 次ステップ（提案）
- [ ] `IndexedDBProvider` のスケルトン追加（BLOB/大容量対応の下地）
- [x] プレビューからの操作（「読込」「削除」）ボタン追加（2025-09-25 完了）
- [ ] `LocalStorageProvider.keys()` を設定駆動/名前空間化
- [ ] 完全保存データのサイズと保存日時を確実に更新（保存ハンドラでのメタ更新確認）
 - [x] スナップショット機能（作成/一覧/読込/削除）の追加（2025-09-25 完了）
