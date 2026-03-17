# SP-004: Inventory System

## 概要

プレイヤーのアイテム管理（追加・削除・所持チェック・使用エフェクト実行）を提供する。

## データ構造

```json
{
  "items": [
    { "id": "sword1", "name": "鉄の剣", "quantity": 1, "icon": "weapon", "type": "weapon" }
  ],
  "maxSlots": 20
}
```

旧形式 `["sword", "shield"]` からの自動マイグレーションを備える。

## エンジン API

- `addItem(itemId, quantity?)` — 既存アイテムは数量加算、新規は追加
- `removeItem(itemId, quantity?)` — 数量減算、0 以下で削除
- `hasItem(itemId, minQuantity?)` — 最小数量での所持チェック
- `getItemCount(itemId)` — 指定アイテムの数量取得
- `getInventory()` — `{items, maxSlots, currentSlots}` を返却
- `getInventoryItems()` — items 配列のコピーを返却

## use_item エフェクト

`executeItemEffect(item)` で以下のエフェクトを実行:

- `heal` — HP 回復 (maxHealth でキャップ)
- `set_flag` — フラグ設定
- `set_variable` — 変数設定
- `show_text` — Toast メッセージ表示

## UI

- `#inventory-panel` — インベントリパネル
- `#inventory-list` — アイテムリスト表示
- キーボードショートカット: `I` キーで開閉

## アイテムアイコン

タイプに応じた絵文字アイコンを自動割当: weapon, armor, consumable, key, tool, book, treasure

## 実装ファイル

- `scripts/gameEngineUtils.js` — エンジン側ロジック (executeAction, executeEffect)
- `scripts/play.inventory.js` — UI 側制御
