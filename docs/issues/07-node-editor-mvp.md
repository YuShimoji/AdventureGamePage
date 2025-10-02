# Issue 07: ノード編集UI（MVP）

- 種別: feature
- 作成日: 2025-09-28
- 状態: done

## 目的
管理（admin.html）でゲームデータのドラフト仕様（nodes 配列）を直接編集できる最小のUIを提供し、管理→プレイの往復を高速化する。

## 要件
- `agp_game_data`（ドラフト仕様 or エンジン形式）からの取込み
- ノード CRUD（追加/削除/ID・タイトル・本文編集）
- 選択肢 CRUD（追加/削除/label/target 編集）
- 検証（Validator で errors/warnings を検証パネルへ表示）
- 適用保存（Converters でエンジン形式へ正規化し `agp_game_data` に保存）
- JSON出力（現行のドラフト仕様をダウンロード）

## 完了条件（Acceptance Criteria）
- admin.html のサイドバーに「ノード編集（MVP）」が表示される
- 取込み→編集→検証→適用保存の一連の操作が完了する
- tests: NodeEditorUtils のユニットテストがグリーン

## 実装ポイント
- `scripts/nodeEditor.js`
  - 公開ユーティリティ: `NodeEditorUtils`
  - UI連携: CRUD/検証/保存/出力
- `styles/admin.css`
  - NodeEditor の簡易スタイル
- `tests/nodeEditor.spec.js`
  - `ensureUniqueId`/`upsertNode`/`removeNode`/`addChoice`/`removeChoice`/`normalizeSpec`/`findNodeById`

## 変更ファイル
- `admin.html`（セクション・スクリプト追加）
- `scripts/nodeEditor.js`（新規）
- `styles/admin.css`（スタイル追加）
- `tests/nodeEditor.spec.js`/`tests/test.html`（テスト追加）

## 備考
- 将来的な拡張は Issue 08 に切り出し。
