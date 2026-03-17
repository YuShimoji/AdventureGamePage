# 開発進捗レポート (2026-03-17 更新)

## 現在の状況

### 直近の更新 (2026-03-17)

- CLAUDE.md 充実化 (プロジェクト概要・DECISION LOG・Key Paths・Architecture・Rules)
- spec-index.json 新規作成 (14エントリ)
- docs/specs/ に12件の仕様書を新規作成
- AI_CONTEXT.md をレガシー化し CLAUDE.md に統合
- shared-workflows サブモジュール除去

### 完了済みフェーズ

#### Phase 1: コア安定化 (完了)

- マイグレーション機能強化 (プログレスバー・バックアップ/復元・データバリデーション)
- スナップショット機能拡張 (日時フィルタ・比較・検索)
- エラーハンドリング統一 (errorHandler.js)
- ログ出力整理 (APP_CONFIG.debug.showConsoleLogs)
- 手動テスト25項目パス

#### Phase 2: プレイヤー状態管理 (完了)

- インベントリシステム (addItem/removeItem/hasItem + UI + キーボードショートカット)
- ゲーム状態永続化 (saveGame/loadGame/setPlayerState/getPlayerState)
- マルチセッション保存 (createSlot/deleteSlot/saveToSlot/loadFromSlot)
- テスト追加 (gameEngine.inventory.spec.js 等)

#### Phase 3: モジュラリティ改善 (完了)

- NodeEditor UI モジュール分割 (nodeEditorUIManager 738行→172行、77%減)
- 絵文字完全削除、テキストベースラベルに統一
- 単一責任原則の徹底、依存関係の明確化

#### Phase 4: UI/UX改善 (進行中)

- テーマ切替 (ダーク/ライト + OS連動 + カスタムテーマ)
- モーダル/パネルのA11y改善 (フォーカストラップ・ARIA)
- モジュール分割 (savePreview 5分割、mermaidPreview 6分割、play.modal 分離)
- メディアポリシー B' 実装 (外部URL既定OFF)
- UI安定化 (hidden保証・hover改善・テーマトークン拡充)
- アクセシビリティ (キーボードナビ・スクリーンリーダー基本対応)

### 進行中/保留タスク

#### UI全体モダナイズ (進行中)

- 短期: WritingPage の CSS Variables / Accordion パターンを参考にした統一設計
- 中期: SPA統合 Phase B (hash router 本格化)
- 長期: コンポーネント指向CSS/JS整理、モバイル対応

#### テスト自動化 (保留)

- 現状の `npm test` は HTTP 200 スモークテストのみ
- Mocha spec の CI 評価は未実装
- Playwright E2E PoC は整備済み

## 仕様管理

- `docs/spec-index.json` — 14エントリの仕様索引
- `docs/specs/` — 14件の仕様書 (game-data-schema, ui-home-hero, game-engine-core, inventory-system, save-load-system, node-editor, storage-provider, theme-system, media-policy, mermaid-preview, accessibility, spa-integration, error-handling, export-import)

## 技術的メモ

- **モジュール化方針**: 責務単一の小モジュール群 + 接着コード
- **ストレージキー**: `APP_CONFIG.storage.keys` で一元管理
- **エラーハンドリング**: コード付きエラーでUI分岐 (NO_GAME_DATA 等)
- **メディアポリシー**: MediaResolver (B') が SSOT
- **Gitワークフロー**: mainブランチで直接作業 → 即プッシュ
