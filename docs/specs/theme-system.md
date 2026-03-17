# SP-008: Theme System

## 概要

ダーク/ライトテーマ切替、カスタムテーマ、プリセット管理を提供する。

## 機能

### テーマ切替
- OS の `prefers-color-scheme` に連動した自動切替
- 手動トグル (ThemeToggle)
- `data-theme` 属性による CSS 切替

### カスタムテーマ
- CSS 変数によるテーマ定義
- ThemePanelManager によるプリセット管理
- カラーカスタマイズ UI

### CSS 変数 (modern.css)
- `--bg-primary`, `--text-primary` — 基本色
- `--border`, `--surface-hover`, `--surface-active` — UI 表面
- `--muted-text`, `--text-secondary` — テキストバリアント

## ストレージ

- `agp_theme` — テーマデータ
- `agp_theme_mode` — ダーク/ライトモード

## 実装ファイル

- `scripts/theme-manager.js` — テーマ状態管理
- `scripts/themeToggle.js` — トグル制御
- `scripts/themeUIManager.js` — UI コンポーネント
- `scripts/themePanelManager.js` — パネル制御
- `scripts/themeUtils.js` — ユーティリティ
- `scripts/themeLogicManager.js` — ロジック
- `styles/modern.css` — CSS 変数定義
