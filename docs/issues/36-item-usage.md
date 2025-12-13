# 36: アイテム使用システム実装

- 番号: 36
- 種別: Feature
- Tier: 1（低リスク, 既存機能拡張）
- 目的: インベントリ内のアイテムを使用可能にし、ゲームのインタラクティブ性を高める。

## 背景 / 文脈

現在のインベントリは表示のみ。アイテムを使用することでストーリーが分岐したり、効果が発動したりするシステムが必要。ノードエディタでアイテム使用アクションを設定できるようにする。

現状は、ノードアクションとして `use_item` が実装済みであり、ノード到達時アクションとして実行できる。

## 要件（仕様）

- ノードアクションに `use_item` タイプを追加
- 使用時にアイテムを消費（数量減らす）
- 使用効果を定義可能（テキスト表示、フラグ設定など）
- 条件分岐でアイテム使用後の分岐をサポート

## 受け入れ基準（Acceptance Criteria）

- `use_item` アクションでアイテムを消費できる
- 使用効果をカスタマイズできる
- ノードエディタで設定可能
- 存在しないアイテム使用時はエラーにならない

## 影響範囲

- `scripts/gameEngine.js`: `use_item` アクション実装
- `scripts/nodeEditor.js`: アクションエディタ拡張
- `tests/gameEngine.inventory.spec.js`: 使用テスト追加

## 実装状況（現状）

- `scripts/gameEngineUtils.js`: `use_item` を含むアクション実行が実装済み
  - アイテム消費: `consume !== false` のとき 1 個消費
  - 効果: `effect.type === 'show_text'` は Toast/alert 表示
- `scripts/storyBuilder.js`: パレットから `use_item` ブロック追加の雛形が存在

未反映/要確認:

- `tests/` に `use_item` の専用テストが未追加
- ノードエディタUIで `use_item` をどの程度編集できるか（入力UIの整備状況）を確認して docs に反映

## 実装詳細

```javascript
// アクション定義例
{
  type: 'use_item',
  itemId: 'potion',
  consume: true,  // 使用時に消費するか
  effect: {
    type: 'show_text',
    text: 'ポーションを使用しました。HPが回復しました！'
  }
}
```

## テスト計画

- アイテム使用時の消費確認
- 使用効果の発動確認
- 存在しないアイテム使用時の動作確認
