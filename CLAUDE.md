# AdventureGamePage

Web ベースのアドベンチャーゲーム作成・プレイプラットフォーム。Vanilla JavaScript / HTML / CSS。

## PROJECT CONTEXT

プロジェクト名: AdventureGamePage
環境: Node.js 14+ / Vanilla JS / Mocha+Chai+Sinon / Playwright E2E
ブランチ戦略: trunk-based (main のみ)
現フェーズ: Phase 4 (Experience Slice) + 仕様整備完了
直近の状態 (2026-03-18):
  - 仕様整備完了: spec-index.json 15エントリ + docs/specs/ 13仕様書
  - SP-015「初ゲーム作成→プレイ」体験スライス進行中 (pct 70%)
    - admin.html「プレイ」ボタン実装済み (保存+play.html新タブ遷移)
    - admin.html サンプル選択モーダル実装済み (basic/RPG→ノードエディタ直接読込)
    - 空状態UI改善済み (サンプル読込ボタン + 新規ノード作成ボタン)
  - 手動検証未実施: サンプル読込→編集→プレイの一気通貫体験
  - 9コミット未push
  - Phase 1-3 完了済み (コア安定化・プレイヤー状態管理・UI/UX改善)

## DECISION LOG

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
| 2025-12-17 | メディア方針 B' (相対パス+DataURL許可、外部URL既定OFF) | A(全許可) / B(相対のみ) / B'(相対+DataURL) | オフライン動作・XSS防止・DataURL必須の三立 |
| 2025-12-17 | SPA統合は Phase A (共通ヘッダー) から段階導入 | 一括SPA化 / 段階導入 | テスト負荷・ドキュメント更新コストが大きい |
| 2025-12-15 | use_item の effect はエンジン側 (executeEffect) で実行 | UI側 / エンジン側 | SSOT をエンジンに寄せる |
| 2025-12-15 | stop_sfx は AudioManager.stopAllSFX() に委譲 | 個別管理 / AudioManager集約 | オーディオ制御点の集約 |
| 2025-12-13 | ESLint warnings は段階導入で削減 | 一括修正 / 段階導入 | まず高優先 warnings を潰し対象を拡大 |
| 2025-12-13 | node_modules は Git追跡から除外 | 追跡維持 / 除外 | package-lock.json + npm ci 前提へ移行 |
| 2026-03-18 | admin.htmlにサンプル直接読込モーダルを追加 | learn.html遷移 / admin内モーダル / admin内インライン | admin内で完結する初回体験が必要。learn.html遷移では編集開始までの導線が途切れる |
| 2026-03-18 | 体験スライス駆動で開発を進める (SP-015) | 機能一覧ベース / 体験スライス | Capability-first原則に基づき、最終ユーザー体験から逆算して基盤欠落を特定する |
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
