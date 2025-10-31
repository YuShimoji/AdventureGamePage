# 33: デバッグUI実装（フローティングツールバー）

- 番号: 33
- 種別: Feature
- Tier: 1（低リスク, UI追加のみ）
- 目的: Console直打ち不要のデバッグ機能をフローティングUIで提供し、開発効率を向上する。

## 背景 / 文脈

現在のデバッグは全てConsole経由で行うため、開発時に不便。play.htmlにコンパクトなフローティングデバッグUIを追加して、以下の機能をボタンクリックで実行できるようにする。

## 要件（仕様）

- **UI構成**: 右下固定の小さなデバッグボタン（🔧）を配置
- **展開**: クリックでコンパクトなツールバーが展開
- **機能階層**:
  - インベントリ操作（追加/削除/確認）
  - ゲーム状態操作（セーブ/ロード/リセット）
  - ノード操作（指定ノードへジャンプ）
  - 開発者ツール（コンソールログ表示切替）
- **表示条件**: `APP_CONFIG.debug.enabled = true` の場合のみ表示
- **コンパクト性**: デフォルト非表示、クリックで展開

## 受け入れ基準（Acceptance Criteria）

- デバッグボタンが右下に固定表示される
- 各機能がボタンクリックで実行可能
- Console APIとの互換性維持
- 本番環境では非表示

## 影響範囲

- `play.html`: デバッグUIのHTML追加
- `styles/play.css`: デバッグUIのスタイル
- `scripts/play.js`: デバッグ機能の実装
- `config.js`: デバッグ有効化設定

## 実装詳細

```javascript
// デバッグ機能例
window.debugAddItem = (id, qty) => gameEngine.addItem(id, qty);
window.debugJumpTo = (nodeId) => gameEngine.setNode(nodeId);
window.debugSave = () => gameEngine.saveProgress();
window.debugLoad = () => gameEngine.loadProgress();
```

## テスト計画

- デバッグUIの表示/非表示切り替え
- 各デバッグ機能の動作確認
- コンソールとの連携確認
