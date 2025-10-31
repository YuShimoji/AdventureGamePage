# 38: 変数システム実装

- 番号: 38
- 種別: Feature
- Tier: 2（中リスク, 状態管理追加）
- 目的: 汎用変数システムを実装し、複雑なストーリー分岐と状態管理を可能にする。

## 背景 / 文脈

現在の条件分岐はアイテムベースのみ。変数システムにより、数値カウンター、フラグ、ストリング変数などを管理し、より複雑なゲームロジックを実現できる。

## 要件（仕様）

- 変数の型: number, string, boolean
- 変数操作アクション: set_variable, increment, decrement
- 条件分岐: variable_equals, variable_greater_than, variable_exists
- 変数永続化（localStorage）
- ノードエディタでの設定UI

## 受け入れ基準（Acceptance Criteria）

- 変数の設定・取得が可能
- アクションでの変数操作が可能
- 条件分岐での変数チェックが可能
- 変数値がゲーム再開後も保持される
- ノードエディタで変数操作を設定可能

## 影響範囲

- `scripts/gameEngine.js`: 変数管理ロジック
- `scripts/nodeEditor.js`: 変数設定UI
- `tests/gameEngine.spec.js`: 変数テスト追加

## 実装詳細

```javascript
// 変数データ構造
state.variables = {
  'score': 100,
  'visited_forest': true,
  'player_name': 'Hero'
}

// アクション例
{
  type: 'set_variable',
  key: 'score',
  value: 150,
  operation: 'set' // set, add, subtract, multiply, divide
}

// 条件例
{
  type: 'variable_equals',
  key: 'score',
  value: 100,
  operator: '===' // ===, !==, >, <, >=, <=
}
```

## テスト計画

- 変数設定・取得の確認
- 演算操作の確認
- 条件分岐での変数チェック確認
- 永続化の確認
