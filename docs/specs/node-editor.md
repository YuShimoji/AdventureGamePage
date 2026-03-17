# SP-006: Node Editor

## 概要

管理画面でのノード CRUD、選択肢・条件・アクション編集、Mermaid 図プレビューを提供する。

## 機能

### ノード管理
- ノードの作成・編集・削除
- タイトル・本文・画像 URL の編集
- ノード ID によるリンク管理

### 選択肢編集
- 選択肢ラベル・遷移先 (target) の設定
- 条件 (conditions) 配列の編集
- 選択肢の追加・削除・並び替え

### アクション編集
- ノードアクション (actions) の設定
- 対応アクションタイプ: add_item, remove_item, use_item, clear_inventory, set_variable, play_bgm, stop_bgm, play_sfx, stop_sfx

### バリデーション
- データ整合性チェック (`nodeEditorValidation.js`)
- 到達不能ノード検出
- 循環参照チェック

### Mermaid プレビュー
- ノード構造をリアルタイムで Mermaid 図として表示
- フルスクリーンモーダル表示

## アーキテクチャ

Manager パターンで分割:
- `nodeEditor.js` — オーケストレータ
- `nodeEditorLogicManager.js` — CRUD ロジック・状態管理
- `nodeEditorUIManager.js` — UI コンポーネント描画
- `nodeEditorValidation.js` — バリデーションルール
- `nodeEditor/ui/forms.js` — フォームコントロール
- `nodeEditor/ui/preview.js` — リアルタイムプレビュー
- `nodeEditor/ui/readUIRefs.js` — DOM 参照一元管理

## メディア統合

画像 URL 入力時に MediaResolver (B' ポリシー) でバリデーション。違反時は警告表示。
