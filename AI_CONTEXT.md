# AI_CONTEXT (Legacy)

> このファイルはレガシーです。最新のプロジェクト情報は `CLAUDE.md` を参照してください。
> 仕様は `docs/specs/` + `docs/spec-index.json` を参照してください。

## 残存する固有情報 (CLAUDE.md 未統合分)

### GitHub Actions

- `.github/workflows/ci.yml` — Node 20 で dev-server 起動 + dev-check.js で疎通
- `.github/workflows/sync-issues.yml` — `docs/ISSUES.md` の `##` 見出しを Issue として同期

### 品質ゲート

- `npm run lint` は errors=0 を維持
- `npm test` / `npm run test:ci` は PASS を維持
- 現状の `npm test` は HTTP 200 スモークテストのみ (Mocha の失敗を CI で評価していない)

### 既知の技術的課題

- `tests/test.html` の依存不足: sinon 未読込のため一部 spec が動かない
- `test-rpg.html` の script 参照破損: `sample-game-basic.js` が不在 (実態は `sampleData.js`)
- Mermaid は CDN 依存。ローカル同梱への移行を検討中

### CSS トークンブリッジ

静的ページで `common.css` のテーマ変数 (`--bg-color` 等) → `modern.css` トークン (`--bg-primary` 等) へのブリッジを使用。
