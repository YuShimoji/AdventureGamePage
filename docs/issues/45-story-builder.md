# 45: ストーリービルダー（根幹ブロックベースUI）

- 番号: 45
- 種別: feature
- 優先度: high
- 目的: ジャンル依存ではなく、分岐・アクション・変数操作などの機能ブロックを基軸に、ノード編集をシームレスに行えるストーリービルダーUIを提供する。

## 背景 / 方針

- 目的は「機能を試すためのテンプレート」ではなく、機能ブロックを直観的に操作できるUIの提供。
- ノードの粒度は柔軟（章/話レベル〜細粒度の選択肢単位まで）。
- 同一画面でノード選択→本文編集→分岐/アクション付与が完結する体験。

## UX要件

- リスト/パレットからの選択。ボタンのドラッグ&ドロップでアクション/選択肢を追加。
- ノードをワンクリック選択で、メインエリア（左側エディター）に本文編集を自動同期。
- アクション/選択肢はエディター内の該当セクション（ne-actions, ne-choices）にドロップで挿入。
- 章/話などの「粒度」は `meta` またはノード `tags` で表現（仕様の互換性維持、ジャンルではなく機能に依存）。

## データモデル（拡張ポリシー）

- 既存の `spec.meta`/`spec.nodes[*]` を維持。
- 任意の分類用に `node.tags?: string[]` を推奨（実装は後続）。
- アクションは既存の `add_item`/`remove_item`/`use_item`/`set_variable` などを継続使用。

## 構成

- Story Builder パレット（`#sb-palette`）
  - new_node, choice, add_item, use_item, set_variable, clear_inventory などの機能ブロック。
  - クリックで選択中ノードへ即時反映。ドラッグ&ドロップで `ne-actions`/`ne-choices` に投下。
- ドロップゾーン
  - `#ne-actions`: choice 以外のブロックを受け付け。
  - `#ne-choices`: choice のみ受け付け。
- メインエディター連携
  - ノード選択イベント（`agp-node-selection-changed`）で本文を反映。
  - 入力（debounce）で `NodeEditorAPI.updateNodeText()` を呼び出し、ノード本文へ即時反映。

## 追加API（NodeEditorAPI）

- `getSpec()` 現在の仕様取得
- `getSelectedNodeId()`/`selectNode(id)` 選択ノードの取得/変更
- `createNode(baseId)` ノード作成（ユニークID付与）
- `updateNodeText(id, text)` 本文更新
- `addChoiceToNode(id, choice)` 選択肢追加
- `addActionToNode(id, action)` アクション追加

## 実装範囲（本チケット）

- [x] NodeEditorAPI の公開関数追加
- [x] `admin.html` にストーリービルダーアコーディオンを追加
- [x] `scripts/storyBuilder.js` でパレット/ドロップ/同期を実装
- [x] APIユニットテスト `tests/nodeEditor.api.spec.js`
- [x] 既存テストとの回帰確認（全通過）

## 今後の拡張

- ノード `tags` のUI編集（章/話/シーン/重要度など）
- ブロックのカスタムプリセット（ユーザー定義）
- 条件ブロック（変数/所持品）と選択肢の連携UI強化
- パレット検索/フィルタ、キーボード操作最適化

## 受け入れ条件（Acceptance Criteria）

- [ ] パレットからクリックまたはD&Dで、選択中ノードにブロック（選択肢/アクション）が追加できる
- [ ] ノード選択で本文がメインエディターに即時反映される
- [ ] エディターへの入力がノード本文に同期される
- [ ] 既存のノード編集機能（保存/検証/エクスポート）が動作を維持
- [ ] ブラウザテストが全てグリーン

## テスト計画

- ユニット: NodeEditorAPI API呼び出し（作成/選択/本文更新/選択肢/アクション追加）
- 統合: admin.html 上でパレット→ドロップで要素が増えることを目視確認
- 回帰: 既存 tests/test.html の全テスト通過
