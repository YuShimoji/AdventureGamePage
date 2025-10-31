# Issue: ゲーム状態永続化

- 種別: feature
- 優先度: high
- フェーズ: 2
- 画面: `play.html`, `scripts/gameEngine.js`

## 概要
ゲームの進行状態（現在ノード、訪問履歴、フラグ、変数など）を永続化し、ブラウザリロード後も続きから再開できるようにします。

## 背景
現在、プレイ画面では基本的な進行管理は可能ですが、ブラウザを閉じると進行状態が失われます。ユーザーがいつでも中断・再開できるよう、状態の永続化が必要です。

## 要件

### 保存される状態
```javascript
{
  gameState: {
    currentNode: 'node_id_001',      // 現在位置
    visitedNodes: ['start', 'node_id_001'],  // 訪問済みノード
    flags: {                          // ゲームフラグ
      'met_character_a': true,
      'found_treasure': false
    },
    variables: {                      // ゲーム変数
      'player_hp': 100,
      'gold': 50,
      'karma': 10
    },
    inventory: { /* #30参照 */ },    // インベントリ
    timestamp: '2025-10-24T14:20:00Z',  // 最終保存日時
    playTime: 3600                    // プレイ時間（秒）
  }
}
```

### 機能要件
- 自動保存（ノード遷移時）
- 手動保存（セーブボタン）
- ロード（コンティニューボタン）
- 複数セーブスロット対応（#32で詳細）
- セーブデータのバージョン管理

### API設計
```javascript
// GameEngine拡張
GameEngine.prototype.saveGame = async function() { ... }
GameEngine.prototype.loadGame = async function(slotId) { ... }
GameEngine.prototype.getGameState = function() { ... }
GameEngine.prototype.restoreGameState = function(state) { ... }
GameEngine.prototype.clearGameState = function() { ... }
```

### UI要件
- セーブボタン（明示的保存）
- ロードボタン（ゲーム開始画面）
- 自動保存インジケーター（保存中表示）
- セーブデータ情報表示（日時、プレイ時間、場所）

## 実装ステップ

### Step 1: 状態管理API実装
1. `scripts/gameEngine.js` に状態管理メソッド追加
2. 状態のシリアライズ/デシリアライズ
3. `StorageBridge` 経由での保存・読み込み

### Step 2: 自動保存機能
1. ノード遷移時の自動保存トリガー
2. 保存間隔の設定（デバウンス）
3. エラーハンドリング（保存失敗時の通知）

### Step 3: UI実装
1. `play.html` にセーブ/ロードボタン追加
2. 保存状態インジケーター
3. ロード確認ダイアログ

### Step 4: マイグレーション
1. 旧形式からの移行サポート
2. バージョン管理（データフォーマット変更対応）

### Step 5: テスト
1. ユニットテスト（`tests/gameEngine.persistence.spec.js`）
2. 統合テスト（保存→リロード→ロード）
3. エラーケーステスト（容量不足、破損データ）

## 受け入れ条件
- [ ] ゲーム状態が自動的に保存される
- [ ] 手動保存ボタンが動作する
- [ ] リロード後に続きから再開できる
- [ ] 複数のセーブスロットが管理できる
- [ ] 保存失敗時にユーザーに通知される
- [ ] IndexedDB/LocalStorageの両方で動作する
- [ ] 旧形式のセーブデータが移行される
- [ ] テストが全て通過する

## 技術的考慮事項

### ストレージ容量
- LocalStorage: 5-10MB制限
- IndexedDB: より大きい容量（推奨）
- 容量超過時の警告とクリーンアップ

### データ整合性
- 保存中の中断対策（トランザクション）
- データ破損時のフォールバック
- バックアップ機能

### パフォーマンス
- 非同期保存（UI ブロックなし）
- デバウンス（頻繁な保存を抑制）
- 差分保存（変更箇所のみ）

### セキュリティ
- データ改ざん検証（チェックサム）
- 機密情報の暗号化（オプション）

## データフォーマットバージョン管理
```javascript
{
  version: '2.0.0',
  formatVersion: 2,
  gameState: { /* ... */ },
  _meta: {
    created: '2025-10-24T14:20:00Z',
    modified: '2025-10-24T15:30:00Z',
    appVersion: '1.2.3'
  }
}
```

## 関連イシュー
- #30: インベントリシステム実装
- #32: マルチセッション保存
- #05: 保存アーキテクチャ

## 参考資料
- Web Storage API
- IndexedDB API
- ゲームセーブシステム設計パターン
