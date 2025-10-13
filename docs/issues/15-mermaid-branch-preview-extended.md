# 15: Mermaid 分岐プレビュー拡張 (Phase 1)

## 背景 / 目的
`admin.html` の分岐プレビュー（`scripts/mermaidPreview.js`）は基本的な可視化を提供しているが、編集体験をさらに高めるため以下の拡張を行う。

- レイアウト方向の切替（TD/LR/TB/RL）
- MermaidソースのコピーとSVGダウンロード
- 開始ノードから到達不能なノードの視覚的強調

本Issueでは上記のPhase 1を実装し、操作性と視認性を改善する。

## スコープ
- UI: `admin.html` に操作コンポーネント（方向選択、コピー、SVGダウンロード、到達不能強調チェック）を追加。
- ロジック: `scripts/mermaidPreview.js` にオプション対応、到達不能ノードの計算とクラス付け、コピー/ダウンロード処理の実装。
- ドキュメント: 本Issueを追加し、テスト手順を記載。

## 受け入れ基準 (Acceptance Criteria)
- [ ] 方向選択で `flowchart <DIR>` に反映される（TD/LR/TB/RL）。
- [ ] 「到達不能ノードを強調」をONにすると、`scope=all` かつ `meta.start` があるとき、到達不能ノードが `unreachable` クラスで着色される。
- [ ] 「コピー」ボタンでMermaidソースをクリップボードへコピーできる（フォールバックあり）。
- [ ] 「SVGダウンロード」ボタンで現在の描画SVGを `mermaid-preview.svg` として保存できる。
- [ ] 既存の「生成」「描画」「別ウィンドウで開く」動作は維持される。

## 実装メモ
- `buildMermaidWithOptions(opts)` に `direction`, `markUnreachable` を追加。
- 到達不能ノード: `meta.start` からBFSで到達可能集合を作り、差分を `unreachable` として `class` と `classDef` に追加。
- `admin.html` に新規UIを追加し、`scripts/mermaidPreview.js` で要素を参照・バインド。

## テスト手順
1. ローカル起動
   - `node scripts/dev-server.js` で `http://127.0.0.1:8080/admin.html` を開く。
2. 方向切替
   - 「レイアウト」で LR/TB/RL/TD を切替→「生成」→「描画」→ 配置が切り替わること。
3. 到達不能強調
   - `sample-game-unreachable.json` を `NodeEditor` に取り込み（未接続ノードを含む前提）。
   - 対象=「全体」、チェック「到達不能ノードを強調」ON→「生成」「描画」→ unreachable クラス着色が確認できること。
4. コピー
   - 「コピー」押下→ クリップボードへMermaidソースがコピーされること（必要に応じて貼り付け確認）。
5. SVGダウンロード
   - 「描画」後に「SVGダウンロード」→ `mermaid-preview.svg` がダウンロードされ、表示と一致すること。
6. 回帰
   - 既存の「別ウィンドウで開く」が引き続き動作すること。

## ロールアウト
- Phase 1 完了後、Phase 2 では検索フィルタやパス強調、ノード/エッジのインタラクション等を検討。
