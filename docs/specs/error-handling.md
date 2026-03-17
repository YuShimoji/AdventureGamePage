# SP-013: Error Handling & Toast

## 概要

統合エラーハンドリング、コード付きエラー分類、Toast 通知システム。

## エラーハンドリング

`scripts/errorHandler.js` が統合エラーハンドリングを提供:
- コード付きエラー (NO_GAME_DATA 等) による UI 分岐
- 自動リトライ機能
- ユーザーフレンドリーなメッセージ表示

## Toast 通知

`scripts/toastManager.js` が通知を管理:
- `ToastManager.success(message)` — 成功通知
- `ToastManager.error(message)` — エラー通知
- `ToastManager.info(message)` — 情報通知
- 自動消去タイマー

## 空状態 UI

ゲームデータ未保存時:
- エラーダイアログではなくページ内カード UI を表示
- 「管理画面を開く」「ゲーム JSON を読み込む」誘導ボタン

## 実装ファイル

- `scripts/errorHandler.js` — エラーハンドリング
- `scripts/toastManager.js` — Toast 通知
