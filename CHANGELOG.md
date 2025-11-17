# Changelog

All notable changes to this project will be documented in this file.

## [2025-11-14]

- fix/ui: モダンなミニマルアイコンへ移行（Lucide）と統合アプリ安定化
  - app.html: タブの絵文字を Lucide アイコンへ置換（`data-lucide` + `lucide.createIcons()`）
  - admin.html / admin-debug.html: ヘッダーアイコンを Lucide に統一、初期化を `createIcons` に変更
  - scripts/header.js: `icon-button` は Lucideが存在すれば `<i data-lucide>` を使用、なければ絵文字にフォールバック
  - features.html / play.html / admin.html: 統合ページ埋め込み時（`window.EMBEDDED_APP`）はヘッダー/ヘッド生成を抑止し、二重ヘッダーで高さが伸びる不具合を解消
  - app.html: タブ変換のフォールバック強化（Lucide未読み込み時はラベル文字を表示）。クリック取得は `currentTarget` を使用
  - エラー解消: `window.lucide.createIcon is not a function`

## [2025-11-13]

- feat: UI表示安定化と名称統一、フォント調整、ドキュメント更新 [#UI-Improvements]
  - 管理画面ヘッダー表示を「Zenライクエディタ」から「ストーリーエディタ」に統一
  - テーマパネルをモーダル構造化（ヘッダー＋サブタイトル＋クローズボタン、ARIA属性追加）
  - 共通スタイルでフォント縮小（本文14px, ヘッダー16px, ボタン13px）、ゴーストボタン配色調整
  - フローティング操作ラベルを「表示切替」「サイドバー」「テーマ」に統一
  - コード内`zen-mode`クラスを`compact-view`に統一、`startZen`設定を`startCompactView`に変更
  - README, docs/, CHANGELOG.md のZen関連表記を一括更新
  - UI要素確認テスト追加（tests/ui-elements.spec.js）
  - これにより、UIの整合性とドキュメントの一貫性が向上

## [2025-11-12]

- fix: プレイページ表示問題とエディタツールパネル問題を修正
  - `play.html`: 欠落していた`play.input.js`と`play.js`を追加
    - PlayCore、PlaySave、PlayInventory、PlayInputモジュールが正しく初期化されるようになった
    - プレイページが真っ黒だった問題を解決
  - `admin.css`: floating-panelのスタイル問題を修正
    - floating-panel内の.floating-controlsがposition:fixedで画面外に配置されていた問題を修正
    - パネル内のコントロールにはposition:relativeを適用
    - エディタのツールパネルが正しく表示されるようになった

- feat: 1ページ内表示切り替え機能を実装 (SPA風ナビゲーション)
  - `app.html`: SPA風の統合アプリページを新規作成
    - タブナビゲーションで各機能をシームレスに切り替え
    - ホーム、機能一覧、プレイ、管理、学習ページを統合
    - 動的コンテンツローディング実装
    - URLハッシュによるルーティング対応
  - `index.html`: 統合アプリへのリンクを追加
    - 「統合アプリ起動」ボタンを追加
  - これにより、ページ遷移なしで全機能にアクセス可能になりました

- feat: デバッグUI実装 (Issue #33)
  - `scripts/play.debug.js`: 開発者向けデバッグツールUIを新規作成
    - フローティングデバッグボタン（🔧）を右下に配置
    - ゲーム状態操作（保存/読込/リセット）
    - インベントリ操作（アイテム追加/削除/確認）
    - ノード操作（指定ノードへジャンプ）
    - 変数操作（設定/取得/全表示）
    - ログ操作（コンソールログ切替/クリア）
    - デバッグAPI公開（window.debugAddItem等）
  - `styles/play.css`: デバッグUIのスタイル追加
    - コンパクトなパネルデザイン
    - レスポンシブ対応（モバイル最適化）
  - `play.html`: `play.debug.js`スクリプトを追加
  - `play.js`: PlayDebug.init()を統合
  - `APP_CONFIG.debug.enabled = true`の場合のみ表示
  - これにより、Console経由での操作が不要になり、開発効率が向上しました

- feat: 機能一覧ページとインベントリデモ機能追加 [#30]
  - `features.html`: 実装済み機能を一覧表示する専用ページを作成
    - ゲームエンジン機能（オートセーブ、変数システム、戻る/進む、マルチセッション、ショートカット）
    - エディター機能（ストーリービルダー、Mermaidプレビュー、自動スクロール、レスポンシブ）
    - セキュリティ・品質機能（セキュリティ強化、パフォーマンス最適化、アクセシビリティ）
    - テスト・開発ツール
    - 実装予定機能の表示
  - `index.html`: ナビゲーションに「機能一覧」リンクを追加
  - `play.html`: `play.inventory.js` と `play.save.js` のスクリプトを追加
  - `sampleData.js`: アイテム取得デモ用にノードアクションを追加
    - アイテムにアイコン（絵文字）、usable、quantity プロパティを追加
    - left ノードで回復薬を取得
    - key ノードで錆びた鍵を取得
    - forest ノードで松明を取得
  - `docs/issues/30-inventory-system.md`: インベントリシステムの仕様を文書化
  - これにより、ユーザーは実装済み機能を一覧で確認し、実際にプレイ画面でアイテム取得とインベントリ機能をテストできます

## [2025-11-11]

- feat(security): セキュリティ強化（XSS対策・データ検証厳格化） [#46]
  - `SecurityUtils`: 新規作成（HTMLエスケープ、テキストサニタイズ、URL検証、セーブデータ検証等）
  - XSS対策: HTMLタグ・スクリプトのエスケープ処理実装
  - プロトタイプ汚染防止: `__proto__`等の危険なキー拒否
  - `GameEngineLogicManager`: セーブデータ検証追加（loadProgress/loadGame）
  - `GameEngineUtils`: 変数名・値の検証追加（executeSetVariableAction）
  - `tests/securityUtils.spec.js`: 包括的セキュリティテスト追加（XSS攻撃パターン・プロトタイプ汚染防止等）
  - 不正データ検出時はエラーログ出力、デバッグモードではアラート表示
- feat(gameEngine): オートセーブ機能を実装 [#35]
  - `GameEngineLogicManager.setNode`: ノード遷移時の自動セーブをデバウンス付きで実装
  - `APP_CONFIG.game.autoSave`: 有効/無効切り替えと遅延時間設定が可能
  - エラーハンドリング強化（保存失敗時も処理継続）
  - `tests/gameEngine.spec.js`: オートセーブ有効/無効時のテスト追加
  - 連続遷移時のパフォーマンス影響を最小化
- feat(gameEngine): 変数システム条件分岐を完成 [#38]
  - `GameEngineUtils.checkConditions`: 変数関連の条件を追加（variable_exists, variable_equals, variable_not_equals, variable_greater_than, variable_less_than, variable_greater_equal, variable_less_equal）
  - `tests/gameEngine.variables.spec.js`: 包括的テストスイート追加（設定・操作・条件分岐・永続化を網羅）
  - すべてのテストが成功し、変数システムが完全に動作
- docs: 開発項目サマリー作成
  - `development_summary.md`: 直近の開発項目と今後の開発予定項目を表形式で整理

## [2025-11-07]

- feat(merge): merge conflicts resolved and latest changes integrated [closes #12]
  - Resolved conflicts in admin.html and scripts/mermaidPreview.js
  - Integrated modularized script updates from remote branch
  - Updated script loading order in admin.html

## [2025-11-04]

- fix: 3つの重大なバグを緊急修正
  - `admin.js`: try-catch構文エラー修正（管理画面読み込み失敗の原因）
  - `savePreview.js`: パネルclose処理改善（状態の即座更新、requestAnimationFrame使用）
  - `play.core.js`: 二重DOMContentLoadedリスナー削除（プレイモード初期化フリーズの原因）
  - プレイモード真っ黒問題、保存プレビュー閉じない問題を解決
- docs: OpenSpecに盲点提案と今後のタスクまとめを追加 [#42, #43]
  - `docs/issues/42-blind-spot-proposals.md`: セキュリティ/パフォーマンス/アクセシビリティ/機能拡張の盲点提案
  - `docs/issues/43-future-tasks-summary.md`: 高優先度タスクの一覧表
  - プロジェクトの今後の方向性整理
- docs: エディターのストーリー作成支援機能検討を追加 [#44]
  - `docs/issues/44-editor-story-creation-support.md`: テンプレート/自動生成/AI支援機能の提案
- feat(editor): ストーリービルダー（根幹ブロックUI）を追加 [#45]
  - `admin.html`: ストーリービルダーパレット（ボタンクリック/ドラッグ&ドロップ）
  - `scripts/storyBuilder.js`: ノード選択と本文ワンクリック編集の同期、DnDで選択肢/アクション追加
  - `scripts/nodeEditor.js`: NodeEditorAPI拡張（create/select/update/addChoice/addAction）
  - `tests/nodeEditor.api.spec.js`: APIのユニットテストを追加

## [2025-10-30]

- feat(play): マルチセッション保存システム実装 [#32]
  - 複数セーブスロット管理（作成/削除/名前変更/コピー）
  - スロットごとのメタデータ保存（最終更新日時/プレイ時間/現在位置/進行度）
  - UIパネル追加（ボタンで開閉、読み込み/上書き/削除操作）
  - レスポンシブデザイン対応
- fix(admin): 管理画面モーダル表示制御強化
  - Mermaid/ノードエディタ/プレイテスト各モーダルのhidden属性対応
  - 初期状態での表示制御安定化
- fix(index): トップページヒーロー文言刷新
  - 内製エディタ向けトーンに変更（"AdventureGamePage Studio"）
  - CTA文言更新（ドキュメント/エディタを起動/プレイテスト）
- feat(admin): レスポンシブデザイン強化 [#23]
  - タブレット/モバイル対応（1024px/768px/480pxブレークポイント）
  - サイドバーオーバーレイ表示（モバイル時）
  - タッチデバイス最適化（ボタンサイズ/iOSズーム防止）
  - ランドスケープ対応（低高さ時）
- test: `tests/gameEngine.slots.spec.js` と `tests/gameEngine.persistence.spec.js` を追加 [#32, #31]

## [2025-10-23]

- feat(perf): パフォーマンス最適化 - 遅延ロード & Mermaidキャッシュ [#29]
  - 非クリティカルスクリプトの遅延ロード実装（LazyLoader.js）
  - Mermaid描画キャッシュ（SHA-256ハッシュキー）
  - 初期ロード時間短縮とランタイム最適化
- feat(play): アクセシビリティ改善 - 選択肢自動フォーカス [#16]
  - ノード遷移後最初の選択肢ボタンに自動フォーカス
  - キーボード操作性向上（Tab/Enter操作）
  - 選択肢なしノードでも例外なし
- feat(editor): エディタ自動スクロール・入力アニメーション [#11]
  - キャレット自動追従（安全領域維持）
  - 入力/削除時フェードアニメーション（設定ON/OFF）
  - 設定パネルからカスタマイズ可能
- feat(node-editor): NodeEditor拡張 - Mermaidプレビュー & JSON Diff [#8]
  - Mermaid分岐グラフプレビュー（既存実装活用）
  - 保存時の変更差分表示（apply/cancel）
  - JSON Diff表示で変更内容確認

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
