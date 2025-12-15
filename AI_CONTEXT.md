# AI_CONTEXT

本ドキュメントは、本プロジェクト固有の状況・決定事項・進捗を記録する運用ハブです。中央ルールは `shared-workflows` を参照してください。

- 中央リポジトリ（Single Source of Truth）
  - https://github.com/YuShimoji/shared-workflows
  - ルール: `docs/Windsurf_AI_Collab_Rules_v1.1.md`

## 直近の決定事項（2025-12-13）

- ESLint warnings は「段階導入」で削減（まず高優先の warnings を潰し、対象を拡大）
- `node_modules` は Git 追跡から除外し、`package-lock.json` + `npm ci` 前提へ移行
- 品質ゲート: `npm run lint` は errors=0、`npm test` / `npm run test:ci` は PASS を維持する

## 直近の決定事項（2025-12-15）

- `use_item` の effect（`set_variable` / `set_flag` / `heal`）は UI 側ではなく **ゲームエンジン側（`GameEngineUtils.executeEffect`）で実行**し、挙動の SSOT をエンジンに寄せる
- `executeEffect` は `executeEffect(effect, state)` として `state` を受け取り、`playerState.variables/flags` を更新できる形を前提とする
- `stop_sfx` は `AudioManager.stopAllSFX()` に委譲し、オーディオ制御点を AudioManager に集約する

## プロジェクト概要

- リポジトリ: AdventureGamePage（static-web-app+node-tooling）
- 目的: ゼンライク編集・保存（IndexedDB優先）・簡易プレイ
- 言語/ツール: HTML/CSS/JS（Vanilla）
- 検出結果: `detect-project-type.js` により `static-web-app+node-tooling` と判定（package.json, scripts/, htmlファイル, docs/ 存在）

## 最近の主要決定・状態

- 保存アーキテクチャ抽象化（LocalStorage/IndexedDB）を導入済み
- 共有ワークフロー採用（Reusable CI・Issues同期）
- 既定ブランチ: main（保護推奨）、開発: develop（任意）

## ブランチ運用

- main: 安定版
- develop: 統合（任意）
- topic: `feature/*`, `fix/*`, `chore/*`

## ワークフロー（GitHub Actions）

- `.github/workflows/ci.yml`
  - `YuShimoji/shared-workflows/.github/workflows/ci-smoke.yml@chore/central-init` を呼び出し
  - Node 20 で `scripts/dev-server.js` を起動し、`scripts/dev-check.js` で疎通
- `.github/workflows/sync-issues.yml`
  - `docs/ISSUES.md` の `## 見出し` を Issue として作成/更新/クローズ
  - permissions: `issues: write`, `contents: read`

## 既知のリスク/ToDo

- docs/ISSUES.md の構造は「カテゴリ＋箇条書き」。中央Syncは `##` 見出し単位でIssue化するため、必要に応じて1Issue=1見出しへ再構成を検討
- main の保護設定（レビュー/必須チェック）を有効化する
- **UI/UXモダン化**: 絵文字アイコンをミニマル文字ラベル（ZEN, SB, T, PV, ME）へ置き換え、アクセシビリティ向上（aria-label追加）
- **ヘルプドキュメント整備**: `docs/help/admin-guide.md` に操作ガイドを統合。UI内説明文を段階的にヘルプリンクへ移行
- **プレイ機能**: `node.image` 表示、`choices[].conditions` の評価、audio actions の対応は実装済み
- **node_modules**: Git追跡から除外済み（`package-lock.json` + `npm ci` 前提）

- **use_item のテスト不足**
  - `use_item` の基本挙動（消費/consume:false/存在しないアイテムで例外にならない）および effect（`set_variable` / `set_flag` / `heal`）はテスト追加済み。

- **tests/test.html の依存不足（sinon）**
  - `errorHandler.spec.js` / `migrationWizard.spec.js` / `snapshotCompare.spec.js` 等が `sinon` を使用しているが、`tests/test.html` が sinon を読み込んでいない。
  - 現状の `npm test` は `/tests/test.html` の HTTP 200 を見るスモークテストであり、Mocha の失敗を CI で評価していない点に注意。

- **test-rpg.html の script 参照破損**
  - `scripts/sample-game-basic.js` が存在しない（現状は `scripts/sampleData.js` が該当）。
  - `play.html` と script ロード順が異なり、単体での動作確認が崩れている。

## 次の一手（提案）

## フェーズ1完了（2025-10-22）

- ✅ フェーズ1.1: マイグレーション機能強化

- プログレスバー・詳細ログ表示実装
- バックアップ/復元機能（createBackup/restoreFromBackup）
- dataValidator.js: データバリデーションと自動修復

### ✅ フェーズ1.2: スナップショット機能拡張

- 日時範囲フィルタ（filterByDateRange）実装
- スナップショット比較機能（snapshotCompare.js）: 差分表示
- 高度な検索・タグフィルタ機能

### ✅ フェーズ1.3: エラーハンドリング強化

- errorHandler.js: 統合エラーハンドリング
- 自動リトライ・ユーザーフレンドリーなメッセージ
- 全保存操作にエラーハンドリング適用

## フェーズ2進行中（2025-10-24）

### ✅ フェーズ2.1: インベントリシステム基本実装

- gameEngine.js: インベントリ管理API実装
  - addItem/removeItem/hasItem/getItemCount/getInventory/clearInventory
  - 永続化サポート（saveProgress/loadProgress統合）
  - 最大スロット制限（デフォルト20）
- gameEngine.inventory.spec.js: 包括的ユニットテスト

### ✅ フェーズ2.2: インベントリUI実装

- play.html: インベントリパネル追加
- play.css: インベントリスタイル実装（レスポンシブ対応）
- play.js: インベントリUI制御ロジック
  - 動的アイテム表示
  - キーボードショートカット（I）

### 🚧 フェーズ2.3: ノードエディタ統合（次）

- ノードアクションでアイテム追加/削除
- 条件分岐でアイテム所持チェック

### ✅ フェーズ3: モジュラリティ改善（完了）

- ✅ NodeEditor UI モジュール完全分割
  - `scripts/nodeEditor/ui/readUIRefs.js` - DOM参照の一元管理（41行）
  - `scripts/nodeEditor/ui/forms.js` - renderActions/renderChoices を分離（453行）
  - `scripts/nodeEditor/ui/preview.js` - プレビュー機能を分離（283行）
  - `nodeEditorUIManager.js` - 738行→172行に削減（77%減）
  - `admin.html` - 依存順スクリプト読み込み整理、Mermaid重複削除
  - `docs/REFACTORING_TEST.md` - テスト手順書作成
- 絵文字完全削除
  - すべてのUIボタンから絵文字を削除し、テキストベースのラベルに統一
  - プロフェッショナルな外観を維持しつつ、視覚的なわかりやすさを確保
- 主な改善点
  - 単一責任原則の徹底: 各モジュールが明確な責務を持つ
  - 依存関係の明確化: readUIRefs → forms/preview → UIManager の階層構造
  - テスタビリティ向上: 各モジュールを独立してテスト可能
  - プレビュー表示継続問題の根本対策: MutationObserver の適切な管理
- 次のステップ
  - 開発サーバーでの動作テスト実施中（http://127.0.0.1:8080）
  - nodeEditorLogicManager.js の分割検討

## 次の一手（提案）

- ~~旧 localStorage データの移行ウィザード~~ 完了（migrationWizard.js実装、データプレビュー・手動実行・フィードバック機能付き）
- ~~スナップショット機能の本実装と検索/タグ~~ 完了（searchItems/filterByTag拡張、UI追加、ラベル/タグ編集機能）
- ~~play 側のセーブ/ロードを Provider 抽象化へ統合~~ 完了（play.js/gameEngine.js/playImport.jsをStorageBridge統合、play.htmlに必要なスクリプト追加）
- ~~インベントリシステム実装~~ ✅ 完了（Phase 2.1-2.2）
- 🚧 プレビュー機能のリファクタリングと安定化（進行中）

## 次の中断可能点（再開ガイド）

- 1. 総点検（ハードコード/仮実装/巨大ファイル/命名/責務）を継続し、高優先の修正対象を確定
- 2. docs（ISSUES/HANDOVER/PROGRESS など）を現状コード/実装状況と同期
- 3. 変更をコミットしてリモート main に反映（push後に git status / npm run lint / npm test を二重チェック）

- 4. `tests/test.html` の依存（sinon, gameEngine 関連スクリプト等）を整理し、ブラウザで Mocha が全 spec を実行できる状態にする
- 5. `use_item` の effect テスト（`set_flag` / `heal`）を追加し、エンジン側実装の挙動を固定する
- 6. `test-rpg.html` の欠損 script（sample-game-basic.js）を解消し、`play.html` と同等のロード順に揃える

## 2025-11-10 状況更新（UI安定化・統一方針）

### 実施済み（本セッション）

- **モーダル/オーバーレイの非表示を保証**: CSS に `[hidden] { display: none !important; }` をグローバル追加。` .modal-overlay[hidden]`/`.overlay-panel[hidden]` も明示。
- **hover の白飛び軽減**: `.btn:hover` / `.icon-btn:hover` の `filter: brightness()` を廃止し、段階トーンでの背景色強調に変更。
- **テーマトークン拡充**: `--border` / `--surface-hover` / `--surface-active` / `--muted-text` / `--text-secondary` を追加し、既存CSSから参照可能に。
- **ドキュメント表記の日本語統一**: `learn.html` のタイトル/見出しを「学ぶ」に統一。

### 現状の観測

- プレイ: JSON未ロード時は意図通り「何も表示されない」状態。
- 管理（エディタ）: SavePreview オーバーレイは初期 `hidden`/`closed` でログ上も非表示。表示が続く要素は「インラインの分岐プレビューパネル（collapsedヘッダ部）」である可能性が高い。

### 次のステップ（短期）

- 管理画面の「不要時の見た目最小化」
  - インラインの分岐プレビューは collapsed 時のヘッダのトーン/コントラストを調整（白地×白字を回避）。
  - 仕様確認：初期表示を「ヘッダも最小化（非表示）にする」か「ヘッダは残す（現行）」かを決定。
- 可視性トレース（必要時）
  - `#preview-panel` / `#mermaid-fullscreen-modal` / `#mermaid-inline-panel` の `hidden`/`dataset.state`/computed `display` を計測し、予期せぬ再表示元を特定。

### ヘッダー統一（多ページ構成でも一貫性を担保）

- `scripts/header.js` を追加し、各ページで同一スクリプトを読み込み → ランタイム生成でヘッダーを共通化。
- `APP_CONFIG.nav` にページ配列を定義（ラベル/URL/active判定）。HTML直書きのヘッダーを段階的に削除。

### 単一ページ（SPA）統合方針（段階導入）

1. Phase A: 共通ヘッダー/フッター/テーマの完全共通化（既存複数HTMLを温存）。
2. Phase B: ルーター導入（hashベース `/#!/{page}`）。各ページのメインセクションをコンポーネント化し遅延読込。
3. Phase C: 既存ページを `index.html` に統合（`<section data-route>`）。URL互換のため `meta refresh` or 軽量リダイレクトを提供。
4. Phase D: 旧ページの整理（リンク置換・404対策・ドキュメント更新）。

### テスト計画

- ハードリロードで index/admin/play/learn を個別確認。
- 管理: SavePreview/分岐プレビューの表示条件（クリック起点でのみ開く）を確認、`[hidden]` と `computed display` を検証。
- ボタンhoverの視認性、テーマ切替下でのコントラスト確認。

### 備考

- 既存の `APP_CONFIG.ui.showSavePreview` が true でも、初期表示でオーバーレイは開かない仕様を維持。
- SPA への移行はドキュメントの更新・テスト負荷が大きい。Phase A を先に完遂してから着手推奨。
