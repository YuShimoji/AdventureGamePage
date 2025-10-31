# 16: Mermaid 分岐プレビュー拡張 (Phase 2)

## 背景 / 目的
Phase 1 で分岐プレビューの利便性を高めたが、大規模なシナリオを扱う際に以下の課題が残っている。

- ノード数が多いときに目的のノードを素早く探しづらい。
- 開始ノードから目的ノードまでの経路を把握しづらい。
- プレビュー図と NodeEditor の連携が弱く、図から編集対象へ遷移する導線がない。

Phase 2 ではこれらを解消し、図を使った探索・編集体験を向上させる。

## スコープ
- UI 拡張: `admin.html` に検索・経路強調 UI を追加。
- ロジック拡張: `scripts/mermaidPreview.js` に検索フィルタ、最短経路強調、ノードクリックから `NodeEditor` へのフォーカス連携を実装。
- ドキュメント更新: この Issue ドキュメント、`CHANGELOG.md`、PR 説明。

## 機能詳細
### 検索フィルタ
- キーワード入力（ID/タイトル/本文/選択肢ラベルを部分一致）。
- 一致ノードのみハイライト & それ以外をフェード（Mermaid `class` を利用）。
- 該当ノードが 1 件の場合は生成時に自動で最短経路強調にも利用可能（任意設定）。

### 最短経路の強調
- UI から「開始」ノードと「目標」ノードを選択。既定は `meta.start` → 検索対象ノード。
- BFS で最短経路を算出し、そのノードとエッジに専用クラス (`path`) を付与。
- 経路が存在しない場合は警告表示。

### ノードクリックで NodeEditor へジャンプ
- Mermaid SVG の各ノードに `data-node-id` を埋め込み。
- クリックで `NodeEditor` のノード選択 (`#ne-node-select`) を該当ノードへ変更し、フォームをレンダリング。
- クリック時にプレビュー側で軽いハイライトも行う。

## UI 案
- 検索: `input#ne-mermaid-search`, `button#ne-mermaid-search-clear`。
- 最短経路: `select#ne-mermaid-path-start`, `select#ne-mermaid-path-goal`, `button#ne-mermaid-path-apply`。
- フィードバック領域: `div#ne-mermaid-status` にメッセージを表示。

## 実装メモ
- Mermaid 生成時にフィルタ結果や経路情報を `buildMermaidWithOptions()` に渡す。
- 検索結果は `classDef faded` 等で透明化、ヒットは `highlight` クラスで強調。
- 最短経路アルゴリズム: BFS で親参照を保持し逆順復元。
- ノードクリック時に `document.getElementById('ne-node-select').value = nodeId;` 後に `dispatchEvent(new Event('change'))`。
- SVG 再描画ごとにイベントハンドラを再バインド。

## 実装タスク
- [ ] `admin.html` に検索UI・経路選択UI・ステータス領域を追加
- [ ] `styles/admin.css` に検索/経路/ステータス用スタイルとハイライト/フェードクラスを追加
- [ ] `scripts/mermaidPreview.js` に検索フィルタ・最短経路計算・ノードクリックハンドラを実装
- [ ] `scripts/nodeEditor.js` でノード選択変更イベントを公開し、Mermaidプレビューとの連携を強化
- [ ] `scripts/admin.js` で NodeEditor からのイベントを受け取り、プレビュー更新とNode選択同期を実装
- [ ] `scripts/dev-check.js` を更新し、Phase2機能のスモークチェックを追加（必要に応じて）
- [ ] ドキュメント（本Issue、`CHANGELOG.md` など）を更新し、受け入れ基準とテスト手順を確定
- [ ] 手動テスト（受け入れ基準に準拠）と `node scripts/dev-check.js` の実行結果を記録

## 受け入れ基準 (Acceptance Criteria)
- [x] キーワード検索で該当ノード・エッジのみ強調され、その他がフェードする。
- [x] 最短経路を指定すると、該当ノード・エッジが強調される。経路がない場合はメッセージを表示。
- [x] 図上のノードをクリックすると、NodeEditor の該当ノードフォームが開く。
- [x] Phase 1 で提供済みの機能（方向切替、到達不能強調、コピー／SVG DL）が影響を受けない。

## テスト手順
1. サンプルデータ (`sample-game-unreachable.json` 等) を `NodeEditor` に取り込み。
2. 検索
   - 検索ボックスに `forest` を入力 → ノード `forest` が強調し、それ以外がフェード。
   - クリアボタンで元に戻る。
3. 最短経路
   - 開始 `start`, 目標 `secret` → 経路がない旨のメッセージ。
   - 目標を `forest` に変更 → `start → forest` が強調。
4. ノードクリック
   - プレビュー図上で `forest` ノードをクリック → `NodeEditor` の選択が `forest` になり、フォームへスクロール。
5. 回帰
   - 既存の「生成」「描画」「コピー」「SVGダウンロード」「別ウィンドウ」機能が正常に動作。

## 実装サマリ
- `admin.html` に検索フィールド、最短経路指定 UI、ステータス表示領域を追加。
- `styles/admin.css` にステータス表示用クラスを追加し、フィードバックの視認性を向上。
- `scripts/mermaidPreview.js` に検索一致判定、最短経路計算（BFS）、ノードクリックから `NodeEditor` へのフォーカス移動、状態表示ロジック、Mermaid API 補助関数を実装。
- `scripts/nodeEditor.js` を拡張し、ノード選択変更／仕様更新イベントを発火して Mermaid 側と連携。
- `scripts/admin.js` で NodeEditor イベントをハンドリングし、Mermaid プレビューの再構築とノードフォーカスを実現。

## 検証結果
- `node scripts/dev-check.js` を実行し、アプリケーションのスモークチェックが通過。
- 上記テスト手順を手動実施し、検索・最短経路・ノードジャンプの各機能が動作。
- 既存の Mermaid 操作（生成・描画・コピー・SVG ダウンロード・別ウィンドウ表示）が維持されていることを確認。

## ロールアウト / 今後
- Phase 2 完了後、図の編集操作（ノード追加・移動）など双方向編集を Phase 3 で検討。
