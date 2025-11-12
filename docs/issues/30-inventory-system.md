# 30: インベントリシステム実装

- 番号: 30
- 種別: Feature
- Tier: 2（中リスク, 新機能追加）
- 目的: プレイヤーのアイテム取得・使用・表示・永続化機能を実装し、ゲームの没入感を高める

## 背景 / 文脈

現在のゲームエンジンにアイテム管理の基盤はあるが、UIと完全な機能が未実装。インベントリシステムを追加することで、RPG要素を強化。

## 要件（仕様）

- アイテムデータ: {id, name, description, quantity, type, usable}
- UI: インベントリパネル（開閉可能）、アイテムリスト、数量表示、使用ボタン
- アクション: add_item, remove_item, use_item, clear_inventory
- 永続化: セーブデータにinventory保存
- 制限: maxSlots (デフォルト20)

## 受け入れ基準（Acceptance Criteria）

- アイテム取得時、inventoryに追加
- UIでアイテム表示、使用可能
- 使用時、効果実行、数量減少
- セーブ/ロードで永続化
- スロット上限チェック

## 影響範囲

- `scripts/gameEngineLogicManager.js`: addItem/removeItem/useItem/getInventory
- `scripts/play.inventory.js`: UI管理
- `play.html`: インベントリパネル追加
- `tests/gameEngine.inventory.spec.js`: テスト追加

## 実装詳細

### アイテムデータ構造

```javascript
{
  id: 'sword',
  name: '剣',
  description: '鋭い剣',
  quantity: 1,
  type: 'weapon',
  usable: true
}
```

### UI

play.htmlに<div id="inventory-panel">追加。

play.inventory.jsで表示/操作。

### アクション

gameEngineUtils.jsにexecuteAddItemAction等。

## テスト計画

- add_item/remove_item/use_item アクション実行確認
- UI表示/操作確認
- 永続化確認
- スロット上限確認
