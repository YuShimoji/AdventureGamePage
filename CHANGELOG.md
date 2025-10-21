# Changelog

All notable changes to this project will be documented in this file.

## [2025-10-20]

- fix(mermaid): Mermaid CDN追加と初期化で分岐プレビューの描画を修正

- feat(ui): 管理画面のUIを洗練、アイコン導入、ボタン統一、アクセシビリティ向上 [#25]

- feat(admin): モダン・ミニマル・スタイリッシュなデザインシステムを導入 [#24]
- feat(admin): JSONボタンの統合と名称変更（シンプル保存→クイック保存、ボタン階層の明確化） [#24]
- feat(admin): Mermaid「生成・描画」を統合、フルスクリーンモーダルを追加 [#24]
- style: カラーシステム、タイポグラフィ、ボタンバリアント、カードスタイルを刷新 [#24]
- style: トースト通知スタイルとアニメーション、アコーディオンホバー効果を追加 [#24]
- feat(admin): レスポンシブデザインを追加し、モバイルデバイスでの表示と操作性を向上 [#23]

## [2025-10-08]

- feat(admin): サイドバー各セクションへヒントトグルと説明パネルを追加し、操作ガイダンスを拡充 [#22]
- feat(admin): アコーディオンの複数同時展開モードを追加し、排他/非排他を切り替え可能に [#22]
- style(admin): ヒントトグルと説明パネル、モードトグルUIのスタイルを整備 [#22]

## [2025-10-07]

- feat(admin): 管理画面サイドバーをアコーディオン化（details/summary、独占開閉、開状態の永続化） [#21]
- style(admin): セクション見出しの強調、余白調整、折りたたみ時の見通し向上 [#21]
- refactor(admin.html): 検証パネル（`#validation-panel`）をノード編集セクション内へ配置 [#21]
- fix(admin): ルート `admin.html` に NodeEditor 依存スクリプト（`converters.js`, `validator.js`, `nodeEditor.js`, `savePreview.js`）を追加 [#21]
- feat(admin): ゲームJSONインポート完了時に NodeEditor の「取込（agp_game_data）」を自動実行 [#21]
- test: Fallback `expect` に `to.throw` と `to.not.throw` を追加し、a11y テストの安定性を向上 [#21]

## [2025-10-03]

- feat(play) 進む機能を追加（フォワードスタック、`canGoForward()`/`goForward()`、進行保存/復元対応） [#14]
- docs: README に進む機能と手動テスト手順を追記 [#14]
- tests: `tests/gameEngine.forward.spec.js` を追加、`tests/test.html` に登録 [#14]
- fix(admin) 保存プレビューのトグル不具合を修正（🗂 2回目クリックで閉じる） [#19]
- fix(admin) インポート(JSON) のファイルダイアログが開かない問題を修正 [#19]
- fix(admin) プレースホルダ表示を `data-empty` 制御に変更し安定化 [#19]
- feat(play) プレイ画面ショートカット（← 戻る / → 進む / R リスタート）を追加 [#15]
- docs: README にショートカットの説明を追記 [#15]
- docs: `docs/issues/15-play-shortcuts.md` を追加 [#15]

## [2025-10-02]

- feat(play) 戻る機能を追加（履歴スタック、`canGoBack()`/`goBack()`、進行保存/復元対応） [#12]
- docs: README に戻る機能と手動テスト手順を追記 [#12]
- tests: `tests/gameEngine.back.spec.js` を追加、`tests/test.html` に登録 [#12]
