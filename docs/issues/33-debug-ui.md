# 33: デバッグUI実装（フローティングツールバー）

- 番号: 33
- 種別: Feature
- Tier: 1（低リスク, UI追加のみ）
- 目的: Console直打ち不要のデバッグ機能をフローティングUIで提供し、開発効率を向上する。
- **ステータス**: ✅ 実装完了 (2025-11-12)

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

## 実装完了報告 (2025-11-12)

### 実装内容

✅ **デバッグUIコンポーネント完成**
- `scripts/play.debug.js`: 完全なデバッグツール実装
  - フローティングトグルボタン（🔧）
  - 展開可能なデバッグパネル
  - 5つのセクション（ゲーム状態、インベントリ、ノード操作、変数操作、ログ）
- `styles/play.css`: デバッグUI専用スタイル追加
  - モダンなパネルデザイン
  - レスポンシブ対応（モバイル最適化）
- `play.html`: play.debug.jsスクリプト追加
- `play.js`: PlayDebug.init(engine)で統合

✅ **実装機能詳細**

**ゲーム状態操作**
- 💾 保存: engine.saveProgress()を実行
- 📂 読込: engine.loadProgress()を実行
- 🔄 リセット: engine.reset()を実行
- 現在の状態情報表示（ノードID、アイテム数、変数数）

**インベントリ操作**
- ➕ アイテム追加: engine.addItem(id, qty)
- ➖ アイテム削除: engine.removeItem(id, qty)
- 📦 確認: console.table()でインベントリ表示

**ノード操作**
- 🔀 ノードジャンプ: engine.setNode(nodeId)
- 履歴件数表示

**変数操作**
- 🔧 変数設定: engine.setVariable(key, value)
- 🔍 変数取得: engine.getVariable(key)
- 📋 全変数表示: console.table()で全変数表示

**ログ操作**
- 📝 コンソールログ切替: APP_CONFIG.debug.showConsoleLogs切替
- 🗑️ ログクリア: console.clear()

**デバッグAPI公開**
```javascript
window.debugAddItem(id, qty)
window.debugRemoveItem(id, qty)
window.debugJumpTo(nodeId)
window.debugSetVar(key, value)
window.debugGetVar(key)
window.debugSave()
window.debugLoad()
window.debugState()
```

### 使用方法

1. `APP_CONFIG.debug.enabled = true`を設定（config.js）
2. play.htmlにアクセス
3. 右下の🔧ボタンをクリック
4. デバッグパネルが展開
5. 各機能を使用して開発・デバッグ

### テスト結果

- ✅ デバッグUIの表示/非表示切り替え動作確認
- ✅ 全デバッグ機能の動作確認
- ✅ コンソールAPIとの互換性確認
- ✅ レスポンシブデザイン確認（PC/タブレット/モバイル）
- ✅ APP_CONFIG.debug.enabled制御確認

### 今後の改善案

- トースト通知による操作フィードバック
- デバッグ履歴の保存・再生機能
- パフォーマンスモニタリング（FPS、メモリ使用量）
- ブレークポイント機能
