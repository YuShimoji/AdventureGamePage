# 35: 自動セーブ機能実装

- 番号: 35
- 種別: Feature
- Tier: 1（低リスク, 既存機能拡張）
- 目的: ノード遷移時に自動的にゲーム状態を保存し、クラッシュ時のデータ損失を防ぐ。

## 背景 / 文脈

ノード遷移や状態更新のタイミングで進行データ（progress）が保存されることで、クラッシュ時のデータ損失を防ぐ。

現状は、ノード遷移（`setNode`/戻る/進む/リセット等）で `saveProgress()` が呼ばれる実装になっており、`APP_CONFIG.game.autoSave` は主に通知・負荷軽減（delay）用途として扱う。

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

現状の主な実装箇所:

- `scripts/gameEngineLogicManager.js`: ノード遷移/履歴操作/状態更新で `saveProgress()` を呼び出し
- `scripts/config.js`: `APP_CONFIG.game.autoSave.enabled` / `delayMs`
- `scripts/play.js`: `agp-auto-save` を受けてスクリーンリーダー通知

## 実装詳細

```javascript
// config.js
game: {
  autoSave: {
    enabled: true,
    delayMs: 100  // 連続遷移時の負荷軽減
  }
}

// gameEngineLogicManager.js
// ノード遷移後に saveProgress() を実行
// 連続遷移時の読み上げ通知過多を避けるため、APP_CONFIG.game.autoSave.enabled のとき
// delayMs を用いて debounced に 'agp-auto-save' を発火
```

## テスト計画

- 自動セーブ有効時のノード遷移確認
- 自動セーブ無効時の動作確認
- 連続遷移時のパフォーマンス確認
