# Test Report (MVP)

日付: 2025-09-25（追記）

## 対象
- index.html / admin.html / play.html
- 保存プレビュー（設定ON時）

## 実行概要
- ローカルHTTPサーバー（`py -3 -m http.server 5500`）を起動
- ブラウザで `http://127.0.0.1:5500/index.html` にアクセス
- ナビゲーションから各ページへ遷移
- テーマパネルの動作確認
- 管理画面: 入力/装飾/保存/読込/エクスポート/インポート
- ショートカット: Ctrl+B/Ctrl+I/Ctrl+U の適用確認
- 保存プレビュー（`APP_CONFIG.ui.showSavePreview=true`）: 一覧/更新/読込/削除
- プレイ画面: サンプルプレイ/選択肢/リスタート
 - ゲームJSON: 管理でエクスポート/再エクスポート、管理でインポート、プレイでインポート
 - バリデーション強化: 未解決target/到達不能/行き止まり/重複ID/型エラー
 - 保存プレビュー: フィルタ（種類: simple/full/snapshot）と並び順（日時/サイズ）

## 結果
- 目視確認で UI は正常レンダリング。
- コンソールエラー: 重大なものはなし（想定）
- ショートカットはWindows/Chromeで動作を確認。
- 保存プレビュー: シンプル/完全の保存を行った後、一覧に表示。読込でエディタへ反映、削除で項目が除去されることを確認。
- ゲームJSON（管理）:
  - エディタ内容からのエクスポート（.game.json）成功
  - 現在の `agp_game_data` からの再エクスポート成功（ドラフト仕様）
  - ドラフト仕様のインポート→エンジン形式に正規化→`agp_game_data` 保存を確認
- ゲームJSON（プレイ）:
  - ヘッダーから JSON をインポート→`agp_game_data` に保存→自動リロード後、プレイに反映されることを確認
- known issue: `document.execCommand` は非推奨API。将来対応要。

### 追加結果（2025-09-27）
- バリデーション（強化）:
  - 妥当な仕様はエラーなし
  - 未解決target は警告として表示（詳細は構造化: path/code/message）
  - 開始ノード未存在はエラー、到達不能ノード/行き止まりノードは警告
- 保存プレビュー（フィルタ/ソート）:
  - 種類セレクトで simple/full/snapshot の切替が反映
  - 並び順で日時/サイズの昇降が反映

### 追加結果（2025-09-27 夜）
- NodeEditor（MVP）:
  - 取込（`agp_game_data`）→ドラフト仕様へ正規化→ノード一覧に表示
  - ノードの追加/削除/ID変更/タイトル/本文/選択肢の編集が可能
  - 「検証」: `validator.js` による結果（エラー/警告）を検証パネルに表示
  - 「適用保存」: エンジン形式に変換し `agp_game_data` に保存（プレイで反映）
  - 「JSON出力」: 現在のドラフト仕様をダウンロード
- ユニットテスト:
  - NodeEditorUtils（ensureUniqueId / upsertNode / removeNode / addChoice / removeChoice / normalizeSpec / findNodeById）を追加
  - Headless Edge で合計 21 tests / 0 failures を確認

## 追加メモ
- 将来の「管理→プレイ」データ連携は Issue 化済み。
- IndexedDBProvider はスケルトン（実験的）。backend切替は `APP_CONFIG.storage.backend`。
