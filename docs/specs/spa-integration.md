# SP-012: SPA Integration

## 概要

複数 HTML ページ (index, admin, play, learn, features) から SPA への段階的移行。

## フェーズ

### Phase A: 共通ヘッダー/フッター/テーマ共通化 (構想済み)
- `scripts/header.js` によるランタイムヘッダー生成
- `APP_CONFIG.nav` でページ配列定義
- HTML 直書きヘッダーの段階的削除

### Phase B: ルーター導入 (未着手)
- hash ベースルーティング (`#!/{page}`)
- `scripts/spaRouter.js` の統合
- 各ページのメインセクションをコンポーネント化
- 遅延読込

### Phase C: ページ統合 (未着手)
- 既存ページを `index.html` に統合 (`<section data-route>`)
- URL 互換のためのリダイレクト提供

### Phase D: 旧ページ整理 (未着手)
- リンク置換・404 対策・ドキュメント更新

## 現状

- 各ページは独立した HTML ファイル
- `spaRouter.js` (8.9K) は実装済みだが統合されていない
- 共通ヘッダーはまだ手動で各ページに記述

## 実装ファイル

- `scripts/spaRouter.js` — hash ベース SPA ルーター
- `scripts/headerManager.js` — ヘッダー管理
