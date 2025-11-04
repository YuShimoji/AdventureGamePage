# Changelog

All notable changes to this project will be documented in this file.

## [2025-11-04]

- docs: OpenSpecに盲点提案と今後のタスクまとめを追加 [#42, #43]
  - `docs/issues/42-blind-spot-proposals.md`: セキュリティ/パフォーマンス/アクセシビリティ/機能拡張の盲点提案
  - `docs/issues/43-future-tasks-summary.md`: 高優先度タスクの一覧表
  - プロジェクトの今後の方向性整理

## [2025-10-30]

- feat(play): マルチセッション保存システム実装 [#32]
  - 複数セーブスロット管理（作成/削除/名前変更/コピー）
  - スロットごとのメタデータ保存（最終更新日時/プレイ時間/現在位置/進行度）
  - UIパネル追加（💾ボタンで開閉、読み込み/上書き/削除操作）
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
