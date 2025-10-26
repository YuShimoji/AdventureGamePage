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
