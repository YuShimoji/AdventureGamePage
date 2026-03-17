# SP-005: Save/Load & Multi-Session Slots

## 概要

ゲーム状態の永続化、マルチスロットセーブ、セーブプレビューパネルを提供する。

## セーブデータ構造

```json
{
  "title": "Game Title",
  "timestamp": 1699564000000,
  "slotName": "Save 1",
  "nodeId": "scene:current",
  "history": ["scene:start", "scene:next"],
  "forward": [],
  "playerState": {
    "inventory": { "items": [...], "maxSlots": 20 },
    "flags": { "intro_done": true },
    "variables": { "gold": 100 },
    "history": [...]
  },
  "metadata": {
    "gameDuration": 5400000,
    "nodesVisited": 42,
    "choicesMade": 15,
    "inventoryCount": 12,
    "lastNodeText": "...",
    "version": "1.0"
  }
}
```

## セーブスロット API

- `createSlot(slotId, name?)` — 新規スロット作成
- `deleteSlot(slotId)` — スロット削除
- `listSlots()` — 全スロット一覧 (メタデータ付き)
- `saveToSlot(slotId)` — 既存スロットの上書き
- `loadFromSlot(slotId)` — スロットからのロード
- `renameSlot(slotId, newName)` — リネーム
- `copySlot(fromId, toId, newName?)` — スロット複製

## ストレージキー

`APP_CONFIG.storage.keys` で設定可能:
- `saveSlots` → `agp_save_slots` (既定)
- `gameProgress` → `agp_game_progress` (既定)

スロットキーはゲームタイトルで分離: `${saveSlots}_${gameTitle}`

## 自動セーブ

`APP_CONFIG.game.autoSave.enabled` が true の場合、ノード遷移時に `agp-auto-save` イベントを発火。

## セーブプレビューパネル (Admin)

- `SavePreviewPanelManager` — オーバーレイ管理、フィルタ・ソート・検索・日付範囲
- スナップショット作成・比較・エクスポート/インポート
- バッチ削除 (チェックボックス選択)

## セーブスロットパネル (Play)

- `PlayModalSaveSlots` — スロット一覧 UI
- スロットごとに保存・ロード・リネーム・削除
- フォーカス管理 (`PlayModalFocus`) 対応

## 実装ファイル

- `scripts/play.save.js` — セーブ/ロード調整
- `scripts/saveLoadManager.js` — ストレージ操作
- `scripts/savePreview.js` + `.core.js` + `.controls.js` + `.overlay.js` + `.renderer.js` — プレビューパネル
- `scripts/savePreviewPanelManager.js` — パネル状態管理
- `scripts/playModalSaveSlots.js` — スロットモーダル
