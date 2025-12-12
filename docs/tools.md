# Tools & Setup Guide

本プロジェクトで推奨するツール群と使い分け、導入方法のメモです。

## ダイアグラム
- Mermaid（推奨）
  - Windsurf/VSCode でプレビュー可能。
  - 仕様策定時のフローチャート/シーケンス/クラス図。
  - 例は `docs/architecture.md` を参照。
- PlantUML
  - VSCode 拡張（`jebbs.plantuml`）で利用。
  - 画像化したい場合や詳細な図式化が必要な場合。

## カンバン/Issue 管理
- GitHub Projects（推奨）
  - 公式で安定、権限/通知が統合。
- VSCode 拡張
  - Kanbn, Vibe Kanban など。ローカルで軽くボード運用したい場合。

## ドキュメント生成
- まずは Markdown を中心に。
- JS の API が増えたら JSDoc コメント + TypeDoc を検討。
- C/C++/混在の場合は Doxygen の導入を検討。

## Lint/Format
- Prettier を使用。保存時フォーマットを `.vscode/settings.json` で設定済み。
- 将来的に Husky + lint-staged でコミット前の自動フォーマットを導入検討。

## 将来の拡張と実験機能
- 実験機能はフラグでオン/オフ（UI から切替可能）
- 既存機能と干渉しない設計（独立モジュール・依存注入）
- 影響範囲とテスト手順は `docs/ISSUES.md` に追記
