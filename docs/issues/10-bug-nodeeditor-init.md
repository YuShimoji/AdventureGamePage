# Issue 10: ノード編集（MVP）が初期化されない

- 種別: bug
- 作成日: 2025-09-28
- 状態: resolved

## 現象
- admin.html のサイドバー「ノード編集（MVP）」で「取込（agp_game_data）」を押しても、UIが一切更新されない。

## 期待
- 既存ゲームデータを取り込み、開始ノード/ノード選択のプルダウンにノード一覧が表示される。

## 原因
- `scripts/nodeEditor.js` に DOMContentLoaded での初期バインドが欠落しており、`#ne-load` ボタン等のイベントリスナが登録されていなかった。

## 修正
- `scripts/nodeEditor.js`
  - DOMContentLoaded で `bindUI()` を呼ぶブートストラップを追加。
  - 初期描画時に `refreshNodeList()` / `refreshExportList()` / `refreshUnresolvedPanel()` / `setDirty(false)` を呼ぶようにした。
  - `refreshExportList()` を新規実装。

該当コミット: ローカルファイル反映済み（外部Push不可ポリシーのためローカルのみ）

## 再発防止
- ブラウザ起動時に**必ず**初期化関数が走ることをテスト項目に追加（`docs/test_plan.md` 更新済）。
- Mocha テストでは UI バインドの E2E は難しいため、ユーティリティのユニット化と UI 存在チェックの簡易スモークを追加予定。

## 確認手順
1. admin.html を開く
2. サイドバーの「ゲームJSONインポート」でゲーム仕様JSONをインポート（`agp_game_data` に保存される）
3. 「取込（agp_game_data）」を押下
4. 「開始ノード」「ノード選択」に一覧が表示され、編集できることを確認
