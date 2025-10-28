# 40: テスト強化・サンプル充実

- 番号: 40
- 種別: Feature
- Tier: 1（低リスク, ドキュメント/テスト追加）
- 目的: 複雑なサンプルゲームとテストケースを充実させ、安定性と使いやすさを向上させる。

## 背景 / 文脈

現在のサンプルゲームは基本的なノード遷移のみ。より複雑なストーリー、アイテム使用、変数操作、条件分岐を含むサンプルが必要。ユーザーが改造しやすい詳細ドキュメントも必要。

## 要件（仕様）

- 複雑なサンプルゲーム作成（RPG風アドベンチャー）
- テストケース拡充（単体テスト/統合テスト）
- 不具合再検証（既存機能の回帰テスト）
- 改造ガイド作成（ステップバイステップ）

## 受け入れ基準（Acceptance Criteria）

- 3種類以上の複雑サンプルゲーム
- 各機能のテストケース作成
- 不具合0件（再検証）
- 詳細な改造ガイド

## 影響範囲

- `sample-game-rpg.js`: 複雑サンプルゲーム
- `tests/`: テストケース拡充
- `docs/samples/`: サンプル解説
- `docs/guides/`: 改造ガイド

## 実装詳細

### サンプルゲーム構造
```javascript
// RPG風サンプル: 森の冒険
{
  title: "森の冒険者",
  start: "forest_entrance",
  nodes: {
    "forest_entrance": {
      title: "森の入口",
      text: "古い森の入口に立っています。奥から不気味な音が聞こえます。",
      image: "images/forest.jpg",
      choices: [
        {
          label: "奥へ進む",
          target: "forest_path",
          conditions: [{ type: "variable_equals", key: "bravery", operator: ">=", value: 5 }]
        },
        {
          label: "引き返す",
          target: "village"
        }
      ],
      actions: [
        { type: "set_variable", key: "visited_forest", value: true }
      ]
    }
  }
}
```

### テストケース
- 変数操作テスト
- アイテム使用テスト
- 条件分岐テスト
- 永続化テスト

## テスト計画

1. **機能テスト**: 各機能の正常動作確認
2. **統合テスト**: 複雑なストーリーでの動作確認
3. **回帰テスト**: 既存不具合の再発防止
