# AdventureGamePage

Web ベースのアドベンチャーゲーム作成・プレイプラットフォーム。Vanilla JavaScript / HTML / CSS。

## PROJECT CONTEXT

プロジェクト名: AdventureGamePage
環境: Node.js 14+ / Vanilla JS / Mocha+Chai+Sinon / Playwright E2E
ブランチ戦略: trunk-based (main のみ)
現フェーズ: Phase 3 (UI/UX改善) + 仕様整備フェーズ
直近の状態 (2026-03-17):
  - Phase 1 (コア安定化) 完了: エラーハンドリング・ログ整理・手動テスト25項目パス
  - Phase 2 (プレイヤー状態管理) 完了: インベントリ・セーブスロット・状態永続化
  - Phase 3 (UI/UX改善) 進行中: テーマ切替・モーダルA11y・モジュール分割済み
  - メディアポリシー B' 実装完了: 外部URL既定OFF、相対パス+DataURL許可
  - CI quality gate + Playwright E2E PoC 整備済み
  - SPA統合: Phase A (共通ヘッダー構想) まで。Phase B (hash router) 未着手
  - 仕様管理: spec-index.json 未整備 → 整備中

## DECISION LOG

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
| 2025-12-17 | メディア方針 B' (相対パス+DataURL許可、外部URL既定OFF) | A(全許可) / B(相対のみ) / B'(相対+DataURL) | オフライン動作・XSS防止・DataURL必須の三立 |
| 2025-12-17 | SPA統合は Phase A (共通ヘッダー) から段階導入 | 一括SPA化 / 段階導入 | テスト負荷・ドキュメント更新コストが大きい |
| 2025-12-15 | use_item の effect はエンジン側 (executeEffect) で実行 | UI側 / エンジン側 | SSOT をエンジンに寄せる |
| 2025-12-15 | stop_sfx は AudioManager.stopAllSFX() に委譲 | 個別管理 / AudioManager集約 | オーディオ制御点の集約 |
| 2025-12-13 | ESLint warnings は段階導入で削減 | 一括修正 / 段階導入 | まず高優先 warnings を潰し対象を拡大 |
| 2025-12-13 | node_modules は Git追跡から除外 | 追跡維持 / 除外 | package-lock.json + npm ci 前提へ移行 |
| 2025-11-10 | shared-workflows サブモジュール解除 | 維持 / 解除 | 死リンク回避、ローカル整備優先 |

## Key Paths

- Entry: `index.html` (LP), `admin.html` (エディタ), `play.html` (プレイヤー)
- Static Pages: `learn.html`, `features.html`, `test-rpg.html`
- Scripts: `scripts/` (130+ JS files)
- Styles: `styles/` (modern.css, admin-modern.css, play-modern.css, common.css, admin.css, play.css)
- Config: `config/quality-gate.json`, `scripts/config.js` (APP_CONFIG)
- Tests: `tests/` (Mocha specs), `scripts/e2e-tests.js` (Playwright)
- Docs: `docs/`
- Specs: `docs/specs/`
- Spec Index: `docs/spec-index.json`
- Samples: `samples/` (state.json, characters.json, items.json, lore.json)
- Sample Games: `sample-game.json`, `sample-game-valid.json`, `sample-game-rpg.js`
- Dist: `dist/` (admin.bundle.js, play.bundle.js, test.bundle.js)

## Architecture

- Vanilla JS (ES5/ES6 IIFE + グローバルオブジェクト)、ビルドツールなし
- Manager パターン: *LogicManager (状態/ルール) + *UIManager (DOM/描画)
- EventBus: CustomEvent ベースの pub/sub
- Storage 抽象化: IndexedDB/LocalStorage (storageProvider.js)
- ゲームエンジン: gameEngine.js (ファクトリ) → LogicManager + UIManager + Utils
- ノードエディタ: nodeEditor → LogicManager + UIManager + Validation + ui/forms + ui/preview
- セーブ/ロード: play.save.js + saveLoadManager + savePreview 系 (5モジュール分割済み)
- テーマ: theme-manager + themeToggle + themeUIManager + themePanelManager
- Mermaid図: mermaidPreview 系 (6モジュール分割済み)
- SPA Router: spaRouter.js (hash ベース、未統合)
- メディア: mediaResolver.js (B' ポリシー SSOT)

## Rules

- Respond in Japanese
- No emoji
- Do NOT read `docs/reports/`, `docs/inbox/` unless explicitly asked
- Use Serena's symbolic tools (find_symbol, get_symbols_overview) instead of reading entire source files
- When exploring code, start with get_symbols_overview, then read only the specific symbols needed
- Keep responses concise — avoid repeating file contents back to the user
- WritingPage / NarrativeGen の UI パターン (CSS Variables, Accordion, Gadget, Manager) を参考にすること
