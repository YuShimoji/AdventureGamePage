# DEVELOPMENT_PROTOCOL

本プロジェクトは、中央リポジトリ `shared-workflows` に定義された共通ルールとワークフローを採用します。

- 参照元（Single Source of Truth）
  - https://github.com/YuShimoji/shared-workflows
  - ルール本文: `docs/Windsurf_AI_Collab_Rules_v1.1.md`
- リポジトリ固有の運用メタは `AI_CONTEXT.md` に集約します。

## ブランチ戦略
- `main`: 安定版（保護対象）
- `develop`: 開発統合（任意）
- `feature/*`, `fix/*`, `chore/*`: 機能/修正/整備の作業用ブランチ

## コミット/PR
- Conventional Commits を準用: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:` など
- PR テンプレート（必要に応じて `.github/` 配下に追加）
- CI 通過をマージ条件に設定（推奨）

## GitHub Actions（中央ワークフロー呼び出し）
- `.github/workflows/ci.yml` で中央の Reusable Workflow（smoke）を呼び出し
- `.github/workflows/sync-issues.yml` で `docs/ISSUES.md` と GitHub Issues を同期
- 付帯スクリプト: `scripts/dev-server.js`, `scripts/dev-check.js`

## ドキュメント運用
- バックログ: `docs/ISSUES.md`（見出し `##` ごとにIssueとして同期）
- アーキテクチャ: `docs/architecture*.md`
- テスト計画/報告: `docs/test_plan.md`, `docs/test_report.md`

## セキュリティ/秘密情報
- GitHub Secrets は中央ルールに従って設定
- リポジトリに秘密情報を含めない（CI 用に必要なら Secrets/Variables を使用）

## ローカル開発
- 静的サイト: `index.html` をブラウザで開くか、`py -3 -m http.server 5500`
- テスト: `/tests/test.html`（Mocha+Chai）
- Lint/Format: 必要に応じて導入（Husky/lint-staged 推奨）
