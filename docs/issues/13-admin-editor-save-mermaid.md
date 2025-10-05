# Issue #13: Admin: ノード編集/保存プレビュー/Mermaidの組込み修正

## 背景
- 管理画面 `admin.html` における以下の統合を改善する。
  - ノード編集（`scripts/nodeEditor.js`）
  - 保存プレビュー（`scripts/savePreview.js` + `preview-panel`）
  - Mermaid プレビュー（`scripts/mermaidPreview.js` + Mermaid CDN）
- 目的は「編集→可視化→保存→再読込」の往復動線をスムーズにし、MVPの体験を安定化すること。

## 現状の課題
- Mermaid の組込みと依存スクリプトの読込順が不明確で、利用時の初期化失敗や未ロードが起こり得る。
- 保存プレビューの一覧表示において、`type/kind` や `excerpt/textPreview` のプロパティ差異が混在。
- クイックプレビューボタンが旧 UI（保存一覧）と新 UI（保存プレビュー）で分岐しており、挙動が直感的でない。

## 変更方針（このIssueでの対応）
1. スクリプト読込順序の明示化（`admin.html`）
   - `previewUtils.js` → `storageProviders.js` → `storageBridge.js` → `converters.js` → `validator.js` → `nodeEditor.js` → `savePreview.js` → Mermaid CDN → `mermaidPreview.js` → `admin.js`
2. 保存プレビューの互換性改善（`savePreview.js`）
   - メタ表示: `item.kind || item.type` を使用
   - 本文: `item.textPreview || item.excerpt`
   - 欠落していた `items.forEach` と `btnLoad` 生成を復元
3. クイックプレビュー挙動の統一（`admin.js`）
   - フラグ `APP_CONFIG.ui.showSavePreview` が ON のときは `preview-panel` を優先表示し `SavePreview.refresh()` を呼ぶ
   - OFF 時は従来の保存一覧パネルにフォールバック

## 受け入れ条件（Acceptance Criteria）
- `admin.html` のページロード後、コンソールエラーが発生しない。
- `Mermaid` プレビューが「生成→描画→別ウィンドウ」まで一連の操作で動作する。
- `保存プレビュー` で以下が可能：
  - 一覧表示（件数0時は空表示）
  - 読込/削除/スナップショット作成/ラベル編集（スナップショットのみ）
- クイックプレビューボタンで `preview-panel` が開き、`SavePreview.refresh()` が呼ばれる。

## テスト計画（手動）
1. ローカルサーバ起動: `node scripts/dev-server.js`
2. ブラウザで `http://127.0.0.1:8080/admin.html` を開く
3. ノードを追加し、Mermaid を生成/描画/別ウィンドウ
4. タイトルと本文を入力して、完全保存→保存プレビューで読込/削除
5. スナップショットを作成し、ラベル編集→反映確認

## 将来タスク（別Issue）
- Mermaid のテーマ/スタイルカスタマイズ
- Mermaid 逆引き（図からノードへフォーカス）
- ノード編集のドラフト保存と自動復元
