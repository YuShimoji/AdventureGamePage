# 14: プレイ画面に「進む」機能を追加

- 番号: 14
- 種別: Feature
- Tier: 1（低リスク, UI とクライアントサイドのみ）
- 目的: 戻る操作の後に元の位置へ「進む」ことを可能にし、分岐確認の往復体験を改善する。

## 背景 / 文脈

「戻る」機能が実装済み（#12）。一般的なナビゲーションと同様に「進む」を提供し、誤戻りのリカバリや分岐検証を円滑にする。

## 要件（仕様）

- エンジンにフォワードスタックを追加し、以下の API を提供する。
  - `canGoForward(): boolean` … 進める場合に true。
  - `goForward(): boolean` … 進めた場合 true を返し、次ノードへ遷移して保存・再描画する。
- `setNode(id)` による通常遷移時は、`history.push(current)` した上で `forward` をクリアする（一般的なブラウザ挙動と同様）。
- `goBack()` は `setNode()` を使わずに、`current` を `forward.push(current)` → `history.pop()` を `state.nodeId` に設定して遷移する。
- `goForward()` は `setNode()` を使わずに、`current` を `history.push(current)` → `forward.pop()` を `state.nodeId` に設定して遷移する。
- 進行保存 `agp_progress` には `forward: string[]` も保存し、`loadProgress()` で復元する（後方互換維持）。
- `play.html` に「進む」ボタンを追加し、可能なときのみ有効化する。

## 受け入れ基準（Acceptance Criteria）

- 戻った直後に「進む」で元のノードへ戻れる。
- 通常遷移（選択肢クリック）を行うと、既存のフォワードがクリアされる。
- リロード後も履歴（戻る/進む）が復元される。
- 既存機能（戻る、保存、リスタート、JSON読込）は動作を維持する。
- ブラウザテスト（新規: `gameEngine.forward.spec.js`）がグリーン。

## 影響範囲

- `scripts/gameEngine.js`（API 追加・内部状態拡張）
- `scripts/play.js`（UI 配線）
- `play.html`（ボタン追加）
- `tests/test.html`（新テスト読み込み）
- `tests/gameEngine.forward.spec.js`（新規）
- `README.md`（記載更新）

## リスク / 留意点

- 既存の保存データ互換性: `forward` 欠如時には空配列で初期化。
- `setNode()` と `goBack()/goForward()` の整合: 後者は `setNode()` を呼ばず、履歴・フォワードのpushを自前で行う。

## テスト計画（抜粋）

- ユニット: `canGoForward()`/`goForward()`/保存復元/フォワードクリアの確認。
- 結合: `play.js` でボタン有効化が描画後に反映されることを手動確認（READMEに手順追記）。

## 実装タスク

- エンジン実装, UI追加, 配線, テスト作成, テストランナー更新, README更新, 変更ログ更新。

## 実装完了（2025-10-07）

- 実装: `scripts/gameEngine.js` に `canGoForward()` / `goForward()` を追加し、`state.forward` を導入。通常遷移でフォワードスタックをクリアするよう更新。
- UI: `play.html` に「進む」ボタンを追加し、`scripts/play.js` で戻る/進むボタン状態とショートカット（→キー）を連動。
- 保存/復元: 進行保存 `agp_progress` に `forward` を含め、`loadProgress()` で履歴と共に復元する処理を追加。
- テスト: `tests/gameEngine.forward.spec.js` を作成し、`tests/test.html` へ登録。
- ドキュメント: `README.md` に進む機能の操作手順とショートカットを追記。
