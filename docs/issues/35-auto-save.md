# 35: 自動セーブ機能実装

- 番号: 35
- 種別: Feature
- Tier: 1（低リスク, 既存機能拡張）
- 目的: ノード遷移時に自動的にゲーム状態を保存し、クラッシュ時のデータ損失を防ぐ。

## 背景 / 文脈

現在のセーブは手動のみ。ユーザーが忘れてセーブしない場合や、ブラウザクラッシュ時にデータが失われるリスクがある。ノード遷移ごとに自動保存することでデータ保護を強化する。

## 要件（仕様）

- `setNode()` 呼び出し時に自動的に `saveProgress()` を実行
- 設定で自動セーブの有効/無効を切り替え可能
- 自動セーブ時はパフォーマンス影響を最小限に（非同期推奨）
- エラー時は警告ログを出力するが処理を停止しない

## 受け入れ基準（Acceptance Criteria）

- ノード遷移ごとに自動保存される
- `APP_CONFIG.game.autoSave.enabled` で制御可能
- ブラウザクラッシュ後も状態が復元される
- 手動セーブとの競合がない

## 影響範囲

- `scripts/gameEngine.js`: `setNode()` に自動セーブ追加
- `scripts/config.js`: 自動セーブ設定追加
- `tests/gameEngine.spec.js`: 自動セーブテスト追加

## 実装詳細

```javascript
// config.js
game: {
  autoSave: {
    enabled: true,
    delayMs: 100  // 連続遷移時の負荷軽減
  }
}

// gameEngine.js
function setNode(id) {
  // ... 既存処理 ...
  executeNodeActions(gameData.nodes[id]);
  render();
  
  // 自動セーブ
  if (window.APP_CONFIG?.game?.autoSave?.enabled) {
    setTimeout(() => saveProgress(), window.APP_CONFIG.game.autoSave.delayMs || 0);
  }
}
```

## テスト計画

- 自動セーブ有効時のノード遷移確認
- 自動セーブ無効時の動作確認
- 連続遷移時のパフォーマンス確認

## 実装状況 (2025-11-11)

✅ **実装完了**

### 実装済み機能

- ✅ ノード遷移時の自動セーブ（`setNode()`内で実装）
- ✅ `APP_CONFIG.game.autoSave.enabled` による有効/無効制御
- ✅ `APP_CONFIG.game.autoSave.delayMs` によるデバウンス機能
- ✅ エラーハンドリング（保存失敗時は警告ログのみ、処理は継続）
- ✅ 連続遷移時の負荷軽減（デバウンスにより最後の遷移のみ保存）
- ✅ テストスイート: `tests/gameEngine.autoSave.spec.js` (全テスト通過)

### 実装ファイル

- `scripts/gameEngineLogicManager.js`: `setNode()`メソッドにオートセーブロジック追加
- `scripts/config.js`: オートセーブ設定（enabled: true, delayMs: 100）
- `tests/gameEngine.autoSave.spec.js`: 包括的テストスイート

### 動作仕様

1. **自動保存タイミング**: ノード遷移時（`setNode()`呼び出し後）
2. **デバウンス**: 連続遷移時は最後の遷移のみ保存（delayMs後に実行）
3. **エラー処理**: 保存失敗時は警告ログを出力するが、ゲームプレイは継続
4. **設定変更**: `APP_CONFIG.game.autoSave.enabled = false` で無効化可能

### 受け入れ基準達成状況

- ✅ `setNode()` 呼び出し時に自動的に `saveProgress()` を実行
- ✅ 設定で自動セーブの有効/無効を切り替え可能
- ✅ 自動セーブ時はパフォーマンス影響を最小限に（非同期推奨）
- ✅ エラー時は警告ログを出力するが処理を停止しない
