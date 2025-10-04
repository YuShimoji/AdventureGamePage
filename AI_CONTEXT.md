# AI_CONTEXT

本ドキュメントは、本プロジェクト固有の状況・決定事項・進捗を記録する運用ハブです。中央ルールは `shared-workflows` を参照してください。

- 中央リポジトリ（Single Source of Truth）
  - https://github.com/YuShimoji/shared-workflows
  - ルール: `docs/Windsurf_AI_Collab_Rules_v1.1.md`

## プロジェクト概要
- リポジトリ: AdventureGamePage（静的Web: index/admin/play）
- 目的: ゼンライク編集・保存（IndexedDB優先）・簡易プレイ
- 言語/ツール: HTML/CSS/JS（Vanilla）

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

## 次の一手（提案）
- 旧 localStorage データの移行ウィザード
- スナップショット機能の本実装と検索/タグ
- play 側のセーブ/ロードを Provider 抽象化へ統合
