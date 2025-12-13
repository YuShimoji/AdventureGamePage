# Issues (Backlog)

## ✅ 完了済み（フェーズ1）

### マイグレーション機能強化

- プログレスバー・詳細ログ表示
- バックアップ/復元機能
- データバリデーション・自動修復

### スナップショット機能拡張

- 日時範囲フィルタ
- スナップショット比較（差分表示）
- 高度な検索・タグフィルタ

### エラーハンドリング強化

- 統合エラーハンドリング
- 自動リトライ機能
- ユーザーフレンドリーなエラーメッセージ

## ✅ フェーズ2 プレイヤー状態管理（完了 / 優先度: 高）

### インベントリシステム実装

詳細: ./issues/30-player-inventory-system.md

### ゲーム状態永続化

詳細: ./issues/31-game-state-persistence.md

### マルチセッション保存

詳細: ./issues/32-multi-session-save.md

## フェーズ3 UI/UX改善（優先度: 中）

### アクセシビリティ向上

- キーボードナビゲーション（主要フローは一通り対応済み、継続的な調整余地あり）
- スクリーンリーダー対応（プレイシーン/選択肢の `aria-live` など基本対応済み）
- フォーカス管理（モーダル/パネルのトラップと戻り先は実装済み、微調整フェーズ）

### プレイ体験機能（実装済み）

- シーン画像の表示（`node.image` の描画）
- 選択肢条件（`choices[].conditions`）の評価・表示制御
- オーディオアクション（`play_bgm` / `play_sfx` / `stop_bgm` 等）

### レスポンシブデザイン強化

詳細: ./issues/23-admin-responsive.md

### テーマシステム拡張

- 現状: modern.css + ThemeToggle + ThemePanelManager によりダーク/ライト切替とカスタムテーマは概ね実装済み
- 今後: プリセット管理・要素別適用などの拡張を ./issues/33-theme-system-enhancement.md 側で検討

## 既存課題（優先度順）

## 空のエディタで文字数が1になる（解決済み）

詳細: ./issues/01-char-count-initial-one.md （現在の実装では修正済み）

## .html起動が不安定（運用切替）

詳細: ./issues/02-browser-open-unstable.md

## 管理→プレイへのデータ連携（ゲームデータフォーマット定義）

現状: 仕様ドラフト⇄エンジン形式の相互変換（Converters）とラウンドトリップテストは整備済み。プレイ側でも `image` / `conditions` / `audio actions` が適用される。

## カラープリセットの保存/管理強化（プリセット名の保存・削除）

メモ: UI/Storage仕様を検討

## 編集/プレビューの完全一致（同一レンダラの導入検討）

メモ: HTML→レンダリング差異の洗い出し

## 分岐エディタ（Mermaid のテキスト⇄ノード相互変換）

メモ: 相互変換ユーティリティ/UX設計

## キャラクター/組織/所持品などのプロパティ管理

メモ: データモデルの定義

## カラー変更のプリセット保存と要素別適用（背景/文字/リンク/コントロール）

メモ: テーマ適用範囲の定義

## 縦書き機能

メモ: CSS縦書きとエディタ互換性

## AI 補助 Wiki：固有名詞/事件/年表/セリフ抜き出し/タグ/関連語

メモ: MVP設計

## 機能オン/オフのトグル UI とセーフモード

メモ: フラグ設計と回避動作

## Mermaid/PlantUML 図の追加と更新

メモ: ドキュメント更新運用

## テスト計画の継続的更新

メモ: docs/test_plan.md の保守

## Lint/Format 自動化（Husky + lint-staged）検討

メモ: 導入是非を評価

## 開発進捗サマリ（フェーズ2完了、フェーズ3進行中）

### フェーズ2完了内容

- インベントリシステム実装（addItem/removeItem/getInventory等）
- ゲーム状態永続化（saveGame/loadGame/setPlayerState/getPlayerState）
- マルチセッション保存（createSlot/deleteSlot/saveToSlot/loadFromSlot等）
- UI統合（インベントリパネル、セーブスロットパネル、レスポンシブ対応）
- テスト追加（gameEngine.inventory.spec.js 等）

### フェーズ3進行状況

- 管理画面レスポンシブ強化完了（オーバーレイサイドバー、モバイル対応）
- アクセシビリティ向上継続中（モーダル/パネルの `role="dialog"` / フォーカス管理は実装済み）
- テーマシステム拡張ほぼ完了（modern.css + ThemeToggle + ダーク/ライトテーマ + ThemePanelManager）

## 将来検討課題（盲点分析・優先度順）

### セキュリティ強化

- 入力サニタイズ強化（XSS対策）：HTML/CSS入力時の悪意あるスクリプト注入リスク回避
- ストレージ暗号化：localStorageデータの機密保護
- CSPヘッダー導入：コンテンツセキュリティ強化

### 性能最適化

- バンドルサイズ最適化：コード分割・圧縮でロード速度改善
- 画像遅延ロード：play.html画像表示の初期ロード遅延解消

### テスト・CI/CD

- E2Eテスト導入：Playwright/Puppeteerでの統合テスト（Playwright PoC: `npm run test:e2e` / 初回: `npx playwright install chromium`）
- CI/CDパイプライン：GitHub Actionsで自動テスト・デプロイ

### アクセシビリティ拡張

- 国際化（i18n）：英語/多言語対応
- ダークモード自動切替の高度化：現状はprefers-color-scheme + ThemeToggleで実装済み、細かなトグルUIやテーマプリセット拡張を検討

### 保守性向上

- コード品質向上：ESLint/Prettier導入、Husky+lint-staged検討
- 依存ライブラリ更新：セキュリティ脆弱性対応の定期運用

### ドキュメント充実

- APIドキュメント生成：JSDoc/TypeScript導入
- ユーザーマニュアル：プレイ/管理画面の使い方ガイド

### 機能拡張

- オフライン対応：PWA化でネットワーク切断時プレイ継続
- アナリティクス統合：ユーザー行動分析（匿名）で改善指標
