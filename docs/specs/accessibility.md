# SP-011: Accessibility (A11y)

## 概要

キーボードナビゲーション、スクリーンリーダー対応、フォーカス管理を提供する。

## 実装済み

### キーボードナビゲーション
- 選択肢間の矢印キー移動 (上下左右)
- 数字キー (1-9) での選択肢直接選択
- Enter/Space での決定
- 戻る/進むボタンのキーボード操作
- インベントリ: `I` キーで開閉

### フォーカス管理
- モーダル/パネルのフォーカストラップ (`playModalFocus.js`)
- ESC キーで閉じる
- モーダル閉じ時の元要素へのフォーカス復帰

### スクリーンリーダー
- 選択肢の `aria-label` (番号付き)
- モーダルの `role="dialog"`
- シーン描画時の `agp-scene-rendered` イベント

### テーマ
- `prefers-color-scheme` 対応
- 高コントラストモードの考慮

## 未実装・改善余地

- 国際化 (i18n): 現在日本語のみ
- `aria-live` リージョンの拡充
- 詳細なキーボードショートカットヘルプ

## 実装ファイル

- `scripts/playModalFocus.js` — フォーカストラップ
- `scripts/play.input.js` — キーボード入力
- `scripts/gameEngineUIManager.js` — 選択肢のA11y属性
