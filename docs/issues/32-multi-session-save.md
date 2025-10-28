# Issue: マルチセッション保存

- 種別: feature
- 優先度: high
- フェーズ: 2
- 画面: `play.html`, `scripts/gameEngine.js`

## 概要
複数のセーブスロット（セッション）を管理し、ユーザーが異なるプレイスルーや分岐を保存・切り替えられるようにします。

## 背景
現在の永続化機能（#31）では単一のセーブデータのみを管理します。ユーザーが複数のストーリー分岐を試したり、異なるプレイスタイルで遊ぶために、複数セーブスロット機能が必要です。

## 要件

### 機能要件
- 複数セーブスロット（デフォルト3-5スロット）
- スロットごとのメタデータ管理
- スロット間のコピー
- スロットの削除・初期化
- スロット一覧表示とプレビュー

### データ構造
```javascript
{
  saves: {
    'slot_1': {
      id: 'slot_1',
      name: 'メインプレイ',
      gameState: { /* #31参照 */ },
      meta: {
        created: '2025-10-24T14:00:00Z',
        modified: '2025-10-24T15:30:00Z',
        playTime: 7200,
        currentLocation: '城下町',
        progress: 45,  // %
        thumbnail: 'data:image/png;base64,...'  // オプション
      }
    },
    'slot_2': {
      id: 'slot_2',
      name: '悪役ルート',
      gameState: { /* ... */ },
      meta: { /* ... */ }
    }
  },
  activeSlot: 'slot_1',
  slotConfig: {
    maxSlots: 5,
    autoSaveSlot: 'auto_save'
  }
}
```

### API設計
```javascript
// GameEngine拡張
GameEngine.prototype.createSlot = async function(slotId, name) { ... }
GameEngine.prototype.deleteSlot = async function(slotId) { ... }
GameEngine.prototype.listSlots = async function() { ... }
GameEngine.prototype.setActiveSlot = function(slotId) { ... }
GameEngine.prototype.getActiveSlot = function() { ... }
GameEngine.prototype.copySlot = async function(fromId, toId) { ... }
GameEngine.prototype.renameSlot = async function(slotId, newName) { ... }
GameEngine.prototype.getSlotInfo = async function(slotId) { ... }
```

### UI要件

#### セーブスロット選択画面
- スロット一覧（カード形式）
- 各スロットの情報表示
  - スロット名
  - 最終保存日時
  - プレイ時間
  - 現在位置
  - 進行度（%）
  - サムネイル（オプション）
- 空きスロット（新規作成）
- スロット操作ボタン
  - ロード
  - 削除
  - コピー
  - 名前変更

#### ゲーム中のスロット管理
- 現在のスロット表示
- スロット切り替えダイアログ
- 保存確認（別スロットへの切り替え時）

## 実装ステップ

### Step 1: スロット管理API実装
1. `scripts/gameEngine.js` にスロット管理メソッド追加
2. スロットデータの構造設計
3. `StorageBridge` 経由での操作

### Step 2: UI実装
1. `play.html` にスロット選択画面追加
2. スロット一覧表示コンポーネント
3. スロット操作ダイアログ
4. `styles/play.css` にスタイル追加

### Step 3: スロット切り替え機能
1. アクティブスロットの管理
2. 切り替え時の状態保存
3. 競合検出（同時編集の防止）

### Step 4: 自動保存スロット
1. 専用自動保存スロット
2. 定期的な自動保存
3. 自動保存からの復元

### Step 5: エクスポート/インポート
1. スロットのエクスポート（JSON）
2. スロットのインポート
3. バックアップ機能

### Step 6: テスト
1. ユニットテスト（`tests/gameEngine.slots.spec.js`）
2. 統合テスト（複数スロット操作）
3. エッジケーステスト（容量制限、同時アクセス）

## 受け入れ条件
- [ ] 複数セーブスロットが作成できる
- [ ] スロット間で切り替えができる
- [ ] スロットの名前変更ができる
- [ ] スロットの削除ができる
- [ ] スロットのコピーができる
- [ ] スロット一覧が見やすく表示される
- [ ] 自動保存スロットが機能する
- [ ] エクスポート/インポートが動作する
- [ ] テストが全て通過する

## 技術的考慮事項

### ストレージ容量管理
- スロット数の制限
- 古いスロットの自動削除（オプション）
- 容量警告とクリーンアップUI

### データ整合性
- スロット間の競合防止
- トランザクション管理
- ロールバック機能

### パフォーマンス
- 大量スロットでも高速表示
- 遅延読み込み（プレビュー情報のみ先読み）
- キャッシング

### UX考慮
- 誤削除防止（確認ダイアログ）
- スロット名の自動提案
- プレイ時間の可視化
- 進行度の視覚的表現

## スロットメタデータの自動生成
```javascript
function generateSlotMeta(gameState) {
  return {
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    playTime: gameState.playTime || 0,
    currentLocation: getCurrentNodeTitle(gameState.currentNode),
    progress: calculateProgress(gameState),
    thumbnail: generateThumbnail(gameState)  // オプション
  };
}
```

## 容量見積もり
- 1スロットあたり: ~100-500KB（アイテム数による）
- 5スロット: ~2.5MB
- IndexedDB推奨（LocalStorageは制約あり）

## 関連イシュー
- #30: インベントリシステム実装
- #31: ゲーム状態永続化
- #05: 保存アーキテクチャ

## 将来的な拡張
- クラウド同期（オプション）
- スロット共有（エクスポート/共有リンク）
- 実績システムとの連携
- プレイスタイル分析

## 参考資料
- ゲームセーブシステムのUXパターン
- RPGのセーブスロット設計
- Web Storageのベストプラクティス
