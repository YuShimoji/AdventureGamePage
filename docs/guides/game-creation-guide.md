# AdventureGamePage 改造ガイド

## 概要

このガイドでは、AdventureGamePageの機能を活用して、独自のアドベンチャーゲームを作成・改造する方法を詳しく説明します。

## 1. ゲーム構造の理解

### 基本構造
```javascript
const myGame = {
  title: "マイゲーム",        // ゲームタイトル
  start: "start_node",        // 開始ノードID
  nodes: {                    // ノード定義
    "start_node": {
      title: "スタート",
      text: "ゲーム開始です",
      choices: [
        {
          label: "進む",
          target: "next_node"
        }
      ]
    }
  }
};
```

### ノードの構成要素

| 要素 | 必須 | 説明 |
|------|------|------|
| `id` | ✅ | ノードの一意な識別子 |
| `title` | ✅ | ノードのタイトル（表示用） |
| `text` | ✅ | 本文テキスト（HTML可） |
| `image` | ❌ | 背景画像URL |
| `choices` | ❌ | 選択肢の配列 |
| `actions` | ❌ | ノード到着時のアクション |

## 2. 選択肢の設定

### 基本的な選択肢
```javascript
choices: [
  {
    label: "選択肢のテキスト",
    target: "next_node_id"
  }
]
```

### 条件付き選択肢
```javascript
choices: [
  {
    label: "鍵を使う",
    target: "unlock_door",
    conditions: [
      { type: "has_item", itemId: "key" }
    ]
  },
  {
    label: "力で開ける",
    target: "break_door",
    conditions: [
      { type: "variable_equals", key: "strength", operator: ">=", value: 10 }
    ]
  }
]
```

## 3. アクションの設定

### アイテム操作
```javascript
actions: [
  // アイテム追加
  { type: "add_item", itemId: "sword", quantity: 1 },

  // アイテム削除
  { type: "remove_item", itemId: "potion", quantity: 1 },

  // アイテム使用
  {
    type: "use_item",
    itemId: "potion",
    consume: true,  // 使用時に消費するか
    effect: {
      type: "show_text",
      text: "ポーションを飲んで体力が回復した！"
    }
  },

  // インベントリクリア
  { type: "clear_inventory" }
]
```

### 変数操作
```javascript
actions: [
  // 変数設定
  { type: "set_variable", key: "score", value: 100 },

  // 変数演算
  { type: "set_variable", key: "score", operation: "add", value: 10 },
  { type: "set_variable", key: "health", operation: "subtract", value: 5 },
  { type: "set_variable", key: "level", operation: "multiply", value: 2 }
]
```

## 4. 条件分岐の種類

### アイテム条件
```javascript
conditions: [
  { type: "has_item", itemId: "key" },                    // アイテム所持
  { type: "item_count", itemId: "coin", operator: ">=", count: 10 } // アイテム個数
]
```

### インベントリ条件
```javascript
conditions: [
  { type: "inventory_empty" },     // インベントリが空
  { type: "inventory_full" }       // インベントリが満杯
]
```

### 変数条件
```javascript
conditions: [
  { type: "variable_equals", key: "level", operator: ">=", value: 5 }, // 変数比較
  { type: "variable_exists", key: "visited_forest" }                   // 変数存在
]
```

## 5. 実践例: RPG風ゲーム作成

### ステップ1: 基本構造の作成
```javascript
const myRPG = {
  title: "勇者の冒険",
  start: "village",
  nodes: {}
};
```

### ステップ2: 村ノードの作成
```javascript
myRPG.nodes.village = {
  title: "村の広場",
  text: "あなたは小さな村にいます。冒険の準備をしましょう。",
  image: "images/village.jpg",
  choices: [
    {
      label: "道具屋に行く",
      target: "shop"
    },
    {
      label: "森へ向かう",
      target: "forest",
      conditions: [
        { type: "has_item", itemId: "sword" }
      ]
    }
  ],
  actions: [
    { type: "set_variable", key: "visited_village", value: true }
  ]
};
```

### ステップ3: 道具屋ノード
```javascript
myRPG.nodes.shop = {
  title: "道具屋",
  text: "道具屋のおじさんが品物を並べています。",
  choices: [
    {
      label: "剣を買う (50ゴールド)",
      target: "buy_sword",
      conditions: [
        { type: "variable_equals", key: "gold", operator: ">=", value: 50 },
        { type: "variable_equals", key: "has_sword", value: false }
      ]
    },
    {
      label: "村に戻る",
      target: "village"
    }
  ]
};
```

### ステップ4: 購入処理
```javascript
myRPG.nodes.buy_sword = {
  title: "購入完了",
  text: "剣を購入しました！",
  choices: [
    {
      label: "道具屋に戻る",
      target: "shop"
    }
  ],
  actions: [
    { type: "add_item", itemId: "sword", quantity: 1 },
    { type: "set_variable", key: "gold", operation: "subtract", value: 50 },
    { type: "set_variable", key: "has_sword", value: true }
  ]
};
```

## 6. 高度なテクニック

### 動的テキスト（変数埋め込み）
```javascript
text: `現在のレベル: ${level}, 経験値: ${experience}`
```

### 複合条件
```javascript
conditions: [
  { type: "has_item", itemId: "key" },
  { type: "variable_equals", key: "strength", operator: ">=", value: 5 }
]
```

### ランダムイベント
```javascript
// 確率分岐のシミュレーション
actions: [
  { type: "set_variable", key: "random_value", value: Math.random() }
],
choices: [
  {
    label: "宝箱を見つける",
    target: "treasure",
    conditions: [
      { type: "variable_equals", key: "random_value", operator: "<", value: 0.3 }
    ]
  },
  {
    label: "何もなし",
    target: "continue"
  }
]
```

## 7. デバッグとテスト

### デバッグUIの活用
1. 🔧ボタンクリックでデバッグパネル表示
2. 「変数設定」で変数操作テスト
3. 「ノードジャンプ」で特定のノードへ移動
4. 「状態表示」で現在のゲーム状態確認

### テスト項目
- [ ] すべての選択肢が正しく動作するか
- [ ] 条件分岐が期待通りに動作するか
- [ ] アイテム操作が正しく機能するか
- [ ] 変数操作が正しく機能するか
- [ ] 保存・読み込みが正常に動作するか

## 8. トラブルシューティング

### よくある問題

**Q: 選択肢が表示されない**
A: conditionsが正しく設定されているか確認してください。

**Q: 変数が更新されない**
A: 変数キーが正しいか、operationが適切かを確認してください。

**Q: 画像が表示されない**
A: 画像URLが正しいか、画像ファイルが存在するか確認してください。

**Q: ゲームが正しく保存されない**
A: localStorageが有効か、ゲームデータ構造が正しいか確認してください。

## 9. 応用例

### 時間システム
```javascript
actions: [
  { type: "set_variable", key: "time", operation: "add", value: 1 }
]
```

### スキルシステム
```javascript
conditions: [
  { type: "variable_equals", key: "skill_sword", operator: ">=", value: 3 }
]
```

### マルチエンディング
```javascript
choices: [
  {
    label: "善の道",
    target: "good_ending",
    conditions: [
      { type: "variable_equals", key: "karma", operator: ">", value: 0 }
    ]
  },
  {
    label: "悪の道",
    target: "bad_ending",
    conditions: [
      { type: "variable_equals", key: "karma", operator: "<", value: 0 }
    ]
  }
]
```

このガイドを参考に、ぜひ独自のアドベンチャーゲームを作成してみてください！
