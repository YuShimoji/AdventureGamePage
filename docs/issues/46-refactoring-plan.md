# Issue #46: 根本的リファクタリング計画

## 概要
プロジェクト内の巨大ファイル（特にadmin.js: 1103行）をモジュール化し、疎結合で保守性の高い構造に変更する。

## 背景
- admin.js: 1103行 - 複数の責務が混在（UI制御、テーマ、サイドバー、保存、エディタ設定等）
- 保守性の低下: 単一ファイルが大きすぎて理解・修正が困難
- テストの難しさ: モノリシックな構造のためユニットテストが書きにくい
- 再利用性の欠如: 機能が密結合しており他のコンテキストで再利用不可

## 目標
1. **疎結合**: 各モジュールが独立して機能し、相互依存を最小化
2. **単一責任原則**: 1ファイル1責務、300行以下を目標
3. **テスタビリティ**: ユニットテスト可能な構造
4. **再利用性**: 他のプロジェクトでも利用可能なモジュール設計

## Phase 1: admin.js のモジュール分割

### 現状分析
admin.js の責務:
- エディタ管理（文字カウント、入力効果、自動スクロール）
- サイドバー制御（アコーディオン、ヒント表示）
- テーマ管理（テーマパネル、色選択）
- 保存システム（保存一覧、保存/読込）
- フローティングパネル（ドラッグ、最小化、位置保存）
- キーボードショートカット
- エディタ設定パネル

### 分割案

#### 1. `admin.core.js` (約100行)
- エントリーポイント
- 各モジュールの初期化調整
- グローバルエラーハンドリング

```javascript
window.AdminCore = {
  init() {
    // 各モジュールを順次初期化
    AdminEditor.init();
    AdminSidebar.init();
    AdminTheme.init();
    AdminSave.init();
    AdminFloatingPanel.init();
    AdminShortcuts.init();
  }
};
```

#### 2. `admin.editor.js` (約200行)
- エディタDOM操作
- 文字カウント
- プレースホルダー制御
- 入力効果（Ink overlay）
- 自動スクロール

#### 3. `admin.sidebar.js` (約250行)
- サイドバートグル
- アコーディオン制御
- ヒント表示システム
- マルチセクション制御

#### 4. `admin.theme.js` (約200行)
- テーマパネルUI構築
- テーマ選択
- ダークモード切替
- カスタムカラー管理

#### 5. `admin.save.js` (約150行)
- 保存一覧レンダリング
- 保存/読込/削除操作
- プロバイダー連携

#### 6. `admin.floating-panel.js` (約150行)
- フローティングパネルのドラッグ
- 最小化/最大化
- 位置の永続化
- ドロップダウン管理

#### 7. `admin.editor-settings.js` (約120行)
- エディタ設定パネル
- 自動スクロール設定
- 入力効果設定
- 設定の永続化

#### 8. `admin.shortcuts.js` (約30行)
- キーボードショートカット登録
- Ctrl+B/I/U等

### モジュール間通信

イベントベースの疎結合通信を採用:

```javascript
// 例: エディタからの通知
document.dispatchEvent(new CustomEvent('admin:editor:changed', {
  detail: { charCount: 1234 }
}));

// 例: サイドバーでの受信
document.addEventListener('admin:editor:changed', (e) => {
  console.log('Characters:', e.detail.charCount);
});
```

### 依存関係管理

```
admin.html
├── admin.core.js (coordinator)
├── admin.editor.js
├── admin.sidebar.js
├── admin.theme.js
├── admin.save.js
├── admin.floating-panel.js
├── admin.editor-settings.js
└── admin.shortcuts.js
```

## Phase 2: savePreview.js のリファクタリング

### 現状分析
savePreview.js: 582行
- パネル管理（開閉、フォーカス）
- オーバーレイ制御
- リスト表示
- フィルタ/ソート
- スナップショット機能

### 分割案

#### 1. `savePreview.core.js` (約100行)
- PanelManagerクラス（初期化、状態管理）
- 公開API

#### 2. `savePreview.overlay.js` (約100行)
- Overlay制御クラス
- フォーカス管理
- キーボード/マウスイベント

#### 3. `savePreview.list.js` (約150行)
- リストレンダリング
- アイテム表示

#### 4. `savePreview.filter.js` (約100行)
- フィルタ/ソート/検索ロジック
- コントロール読み取り

#### 5. `savePreview.snapshot.js` (約130行)
- スナップショット作成
- ラベル編集
- 比較選択

## Phase 3: テストカバレッジ拡充

各モジュールに対応するテストファイルを作成:
- `tests/admin.editor.spec.js`
- `tests/admin.sidebar.spec.js`
- `tests/admin.theme.spec.js`
- 等々

## Phase 4: ドキュメント整備

各モジュールに JSDoc コメントを追加:
- 関数の目的
- パラメータ型
- 戻り値
- 使用例

## 実装スケジュール

### Sprint 1 (2-3時間)
- [ ] `docs/issues/46-refactoring-plan.md` 作成
- [ ] admin.js → admin.core.js + admin.editor.js 分割
- [ ] admin.html script タグ更新
- [ ] テスト実行、動作確認
- [ ] コミット・プッシュ

### Sprint 2 (2-3時間)
- [ ] admin.sidebar.js 分離
- [ ] admin.theme.js 分離
- [ ] テスト実行、動作確認
- [ ] コミット・プッシュ

### Sprint 3 (2-3時間)
- [ ] admin.save.js 分離
- [ ] admin.floating-panel.js 分離
- [ ] admin.editor-settings.js 分離
- [ ] admin.shortcuts.js 分離
- [ ] テスト実行、動作確認
- [ ] コミット・プッシュ

### Sprint 4 (2-3時間)
- [ ] savePreview.js モジュール分割
- [ ] テスト実行、動作確認
- [ ] コミット・プッシュ

### Sprint 5 (1-2時間)
- [ ] ユニットテスト追加
- [ ] JSDoc コメント追加
- [ ] ドキュメント整備
- [ ] 最終テスト
- [ ] PR作成

## 成功基準
- [ ] 全ファイルが300行以下
- [ ] 既存機能が100%動作
- [ ] 全自動テストがパス
- [ ] ESLint エラー 0件
- [ ] 各モジュールがイベント駆動で疎結合
- [ ] ユニットテストカバレッジ 60%以上

## リスク管理
- **リスク**: 既存機能の破壊
  - **軽減策**: 各スプリント後に全機能テスト
- **リスク**: モジュール間の依存関係の複雑化
  - **軽減策**: イベントベースの通信で疎結合を維持
- **リスク**: パフォーマンス劣化
  - **軽減策**: 初期化コストの測定、必要に応じて遅延ロード

## 参考資料
- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- [Event-driven programming](https://en.wikipedia.org/wiki/Event-driven_programming)
- [Module pattern in JavaScript](https://www.patterns.dev/posts/module-pattern)
