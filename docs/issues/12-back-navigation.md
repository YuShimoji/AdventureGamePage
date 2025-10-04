# 12: プレイ画面に「戻る」機能を追加

- 番号: 12
- 種別: Feature
- Tier: 1（低リスク, UI とクライアントサイドのみ）
- 目的: ユーザーが 1 手前のノードに戻れるようにし、分岐確認や誤操作のリカバリを容易にする。

## 背景 / 文脈

`play.html` は現在「リスタート」はあるが、ひとつ前に戻る操作がない。執筆検証やプレイ体験の向上のため、簡易な履歴スタックを導入する。

## 要件（仕様）

- エンジンに履歴スタックを追加し、以下の API を提供する。
  - `canGoBack(): boolean` … 戻れる場合に true。
  - `goBack(): boolean` … 戻れた場合 true を返し、前ノードへ遷移して保存・再描画する。
- `setNode(id)` は現在ノードを履歴スタックへ push してから遷移する。
- `reset()` は履歴スタックをクリアし、開始ノードへ遷移する。
- 進行保存 `agp_progress` には `history: string[]` を追加保存し、`loadProgress()` で復元する（後方互換: 旧形式 `{ nodeId }` でも動作）。
- `play.html` に「戻る」ボタンを追加し、可能なときのみ有効化する。

## 受け入れ基準（Acceptance Criteria）

- プレイ中に 2 ノード以上遷移後、「戻る」で直前のノードに戻る。
- 開始直後は「戻る」ボタンが無効化されている。
- リロード後も履歴が復元され、「戻る」で直前ノードに戻れる。
- 既存の機能（進行保存、リスタート、JSON読込）は動作を維持する。
- ブラウザテストがグリーン（新規: `gameEngine.back.spec.js`）。

## 影響範囲

- `scripts/gameEngine.js`（API 追加・内部状態拡張）
- `scripts/play.js`（UI 配線）
- `play.html`（ボタン追加）
- `tests/test.html`（新テスト読み込み）
- `tests/gameEngine.back.spec.js`（新規）
- `README.md`（記載更新）

## リスク / 留意点

- 既存の保存データ互換性: `loadProgress()` は `history` 欠如時に空配列で初期化。
- `setNode()` 経由と `goBack()` 直呼びの整合性: `goBack()` は `setNode()` を呼ばず、履歴 push を避けて戻す。

## テスト計画（抜粋）

- ユニット: `GameEngine` の `canGoBack()`/`goBack()`/保存復元。
- 結合: `play.js` でボタン有効化が描画後に反映されること（手動確認手順も README に記載）。

## 実装タスク

- エンジン実装, UI 追加, 配線, テスト作成, テストランナー更新, README 更新。
