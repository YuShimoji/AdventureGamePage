# Issue: インベントリシステム実装

- 種別: feature
- 優先度: high
- フェーズ: 2
- 画面: `play.html`, `scripts/gameEngine.js`

## 概要
プレイヤーが所持アイテムを管理できるインベントリシステムを実装します。アイテムの取得、使用、表示、永続化を行います。

## 背景
現在のゲームエンジンには状態管理の基本機能はありますが、アイテムインベントリの専用機能がありません。プレイヤー体験を向上させるため、アイテム管理機能が必要です。

## 要件

### 基本機能
- アイテムの取得・追加
- アイテムの使用・削除
- アイテム一覧の表示
- アイテム数の管理（スタック可能）

### データ構造
```javascript
{
  inventory: {
    items: [
      {
        id: 'item_key_001',
        name: '鍵',
        description: '古びた鉄の鍵',
        quantity: 1,
        type: 'key_item',
        usable: false
      },
      {
        id: 'item_potion_001',
        name: '回復薬',
        description: 'HPを回復する',
        quantity: 3,
        type: 'consumable',
        usable: true
      }
    ],
    maxSlots: 20
  }
}
```

### API設計
```javascript
// GameEngine拡張
GameEngine.prototype.addItem = function(itemId, quantity = 1) { ... }
GameEngine.prototype.removeItem = function(itemId, quantity = 1) { ... }
GameEngine.prototype.hasItem = function(itemId) { ... }
GameEngine.prototype.getItemCount = function(itemId) { ... }
GameEngine.prototype.getInventory = function() { ... }
```

### UI要件
- インベントリ表示パネル（トグル可能）
- アイテムアイコン/名前/数量表示
- アイテム詳細（説明文）
- 使用可能なアイテムには使用ボタン

## 実装ステップ

### Step 1: データ構造とAPI実装
1. `scripts/gameEngine.js` にインベントリ管理メソッド追加
2. アイテムデータの検証（`scripts/dataValidator.js`）
3. ストレージへの永続化（`StorageBridge`経由）

### Step 2: UI実装
1. `play.html` にインベントリパネルのHTML追加
2. `styles/play.css` にスタイル追加
3. `scripts/play.js` にUI制御ロジック追加

### Step 3: ノードエディタ統合
1. `scripts/nodeEditor.js` でアイテム追加/削除のノードアクションをサポート
2. 条件分岐でアイテム所持チェック機能

### Step 4: テスト
1. ユニットテスト（`tests/gameEngine.inventory.spec.js`）
2. 統合テスト（実際のプレイシナリオ）

## 受け入れ条件
- [ ] アイテムの追加・削除が正常に動作する
- [ ] アイテム数量が正しく管理される
- [ ] インベントリがストレージに保存される
- [ ] UIでアイテム一覧が表示される
- [ ] アイテム使用機能が動作する
- [ ] ノードエディタでアイテム関連アクションが設定できる
- [ ] テストが全て通過する

## 技術的考慮事項
- パフォーマンス: 大量アイテムでも高速動作
- セキュリティ: アイテムデータの改ざん検証
- 互換性: 既存セーブデータとの後方互換性
- 拡張性: 将来的なアイテム属性追加に対応

## 関連イシュー
- #31: ゲーム状態永続化
- #32: マルチセッション保存

## 参考資料
- ゲームエンジン設計パターン
- インベントリUI/UXベストプラクティス
