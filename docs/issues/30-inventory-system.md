# 30: インベントリシステム実装

- 番号: 30
- 種別: Feature
- Tier: 2（中リスク, 新機能追加）
- 目的: プレイヤーのアイテム取得・使用・表示・永続化機能を実装し、ゲームの没入感を高める
- **ステータス**: ✅ UI実装完了 / デモ機能追加完了 (2025-11-12)

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

## 実装完了報告 (2025-11-12)

### 実装内容

✅ **UIコンポーネント完成**
- `play.html`: インベントリパネル、リスト、アイテム表示UI
- `scripts/play.inventory.js`: パネル表示/非表示、アイテムリスト更新、使用ボタン処理
- `play.js`: インベントリボタンのイベントリスナー統合

✅ **デモ機能追加**
- `sampleData.js`: アイテムにアイコン(🔑🧪🔥)、usable、quantityプロパティを追加
- ノードアクションでアイテム自動取得:
  - `left` ノード → 回復薬 🧪
  - `key` ノード → 錆びた鍵 🔑
  - `forest` ノード → 松明 🔥

✅ **機能一覧ページ作成**
- `features.html`: 実装済み機能を一覧表示する専用ページ
- インベントリシステムを「実装予定」セクションに表示
- `index.html`: ナビゲーションに機能一覧リンクを追加

✅ **ドキュメント整備**
- `README.md`: クイックリンクセクションに機能一覧を追加
- `CHANGELOG.md`: 本日の実装内容を記録

### 実動作確認方法

1. 開発サーバーを起動: `npm start`
2. `play.html` にアクセス
3. サンプルゲームで以下のルートを進む:
   - 「扉を開ける」→ 「左へ進む」→ 回復薬 🧪 取得
   - 「鍵を手に入れる」→ 錆びた鍵 🔑 取得
   - 「窓の外を見る」→ 「窓から出る」→ 松明 🔥 取得
4. ヘッダーの「I」ボタンでインベントリパネルを開く
5. アイテムリスト、アイコン、数量、説明文が表示されることを確認
6. 「使用」ボタンで消費可能なアイテム（回復薬、松明）を使用できることを確認

### テスト結果

- ✅ 全テストスイート成功 (`npm test`)
- ✅ インベントリUIの表示/非表示動作確認
- ✅ アイテム取得アクションの動作確認
- ✅ デモサンプルでの実動作確認完了

### 次のステップ (今後の改善)

- アイテム使用時の効果処理実装
- スロット上限チェックとエラーハンドリング
- インベントリのソート/フィルタ機能
- アイテムの詳細表示モーダル
- ドラッグ&ドロップによる並び替え
