# SP-010: Mermaid Diagram Preview

## 概要

ノードエディタ内でゲームの分岐構造を Mermaid 図としてリアルタイムプレビューする。

## 機能

- ノード追加・編集・削除に連動したリアルタイム更新
- インラインパネル表示
- フルスクリーンモーダル表示
- ノード間の遷移矢印・選択肢ラベル表示

## アーキテクチャ

Manager パターンで 6 モジュール分割:

- `scripts/mermaidPreview.js` — メインオーケストレータ
- `scripts/mermaidPreviewLogicManager.js` — ロジック (Mermaid 構文生成)
- `scripts/mermaidPreviewUIManager.js` — UI 状態管理
- `scripts/mermaidPreviewUIState.js` — 表示状態
- `scripts/mermaidPreviewUIEvents.js` — イベントハンドリング
- `scripts/mermaidPreviewUIRefresh.js` — UI 更新
- `scripts/mermaidPreviewUtils.js` — ユーティリティ

## 外部依存

Mermaid ライブラリ (CDN)。ローカル同梱への移行を検討中。

## DOM 要素

- `#mermaid-inline-panel` — インラインプレビュー
- `#mermaid-fullscreen-modal` — フルスクリーンモーダル
