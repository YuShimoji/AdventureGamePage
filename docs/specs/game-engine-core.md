# SP-003: Game Engine Core

## 概要

ノード遷移・選択肢評価・アクション実行・履歴管理を担うコアエンジン。

## エントリポイント

`createEngine(gameData, elements)` ファクトリ関数でエンジンインスタンスを生成する。

## 公開 API

### ナビゲーション

- `render()` — 現在ノードを UI に描画
- `setNode(id)` — 指定ノードへ遷移し、アクション実行・描画
- `goBack()` / `canGoBack()` — 履歴スタックによる後退
- `goForward()` / `canGoForward()` — 前進スタック
- `reset()` — 開始ノードに戻り、全状態をクリア
- `currentNodeId` — 現在ノード ID (読み取り専用)

### プレイヤー状態

- `getPlayerState()` / `setPlayerState(state)` — 状態の取得・置換
- `saveGame(slotName)` / `loadGame(saveData)` — セーブデータの作成・復元

### インベントリ

- `addItem(itemId, quantity?)` / `removeItem(itemId, quantity?)`
- `hasItem(itemId, minQuantity?)` / `getItemCount(itemId)`
- `getInventory()` / `getInventoryItems()` / `getItemsData()`

### セーブスロット

- `createSlot(slotId, name?)` / `deleteSlot(slotId)`
- `listSlots()` / `saveToSlot(slotId)` / `loadFromSlot(slotId)`
- `renameSlot(slotId, newName)` / `getSlotInfo(slotId)` / `copySlot(fromId, toId, newName?)`

## 条件評価 (Conditions)

選択肢に `conditions` 配列がある場合、全条件が満たされた選択肢のみ表示する。

| 条件タイプ | フィールド | 説明 |
|-----------|-----------|------|
| `has_item` | `itemId`, `count?` | アイテム所持チェック |
| `item_count` | `itemId`, `operator`, `count` | 数量比較 |
| `inventory_empty` | - | インベントリが空か |
| `inventory_full` | - | インベントリが満杯か |
| `variable_exists` | `key` | 変数の存在チェック |
| `variable_equals` | `key`, `operator`, `value` | 変数値の比較 |

比較演算子: `>=`, `>`, `<=`, `<`, `==`, `!=`, `===`, `!==`

## アクションタイプ

ノード遷移時に自動実行されるアクション:

| アクション | フィールド | 説明 |
|-----------|-----------|------|
| `add_item` | `itemId`, `quantity?` | アイテム追加 |
| `remove_item` | `itemId`, `quantity?` | アイテム削除 |
| `use_item` | `itemId`, `consume?`, `effect?` | アイテム使用 + エフェクト実行 |
| `clear_inventory` | - | インベントリ全消去 |
| `set_variable` | `key`, `value`, `operation?` | 変数設定 (set/add/subtract/multiply/divide) |
| `play_bgm` | `url`, `volume?`, `loop?`, `fadeIn?` | BGM 再生 |
| `stop_bgm` | `fadeOut?` | BGM 停止 |
| `play_sfx` | `url`, `volume?`, `loop?` | SE 再生 |
| `stop_sfx` | - | SE 全停止 |

## エフェクトタイプ

use_item のエフェクトとして実行される処理:

| エフェクト | フィールド | 説明 |
|-----------|-----------|------|
| `show_text` | `text` | Toast メッセージ表示 |
| `set_variable` | `key`, `value`, `operation?` | 変数設定 |
| `set_flag` | `flag`, `value?` | フラグ設定 |
| `heal` | `key?`, `value?`, `maxHealth?` | HP 回復 |

## カスタムイベント

- `agp-inventory-changed` — インベントリ変更時
- `agp-scene-rendered` — シーン描画完了時 (detail: nodeText, choiceCount, nodeId)
- `agp-auto-save` — 自動セーブ時

## 実装ファイル

- `scripts/gameEngine.js` — ファクトリ
- `scripts/gameEngineLogicManager.js` — ロジック・状態管理
- `scripts/gameEngineUIManager.js` — UI 描画
- `scripts/gameEngineUtils.js` — アクション・エフェクト実行
