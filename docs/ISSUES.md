# Issues (Backlog)

## 完了済み

### Phase 1: コア安定化 (完了)
- マイグレーション機能強化 (プログレスバー・バックアップ/復元・バリデーション)
- スナップショット機能拡張 (日時フィルタ・比較・検索)
- エラーハンドリング統一 (errorHandler.js)

### Phase 2: プレイヤー状態管理 (完了)
- インベントリシステム (addItem/removeItem + UI + ショートカット)
- ゲーム状態永続化 (saveGame/loadGame)
- マルチセッション保存 (セーブスロット)

### Phase 3: モジュラリティ改善 (完了)
- NodeEditor UI モジュール分割
- savePreview / mermaidPreview 分割
- play.modal 分離

### メディアポリシー B' (完了)
- MediaResolver SSOT 実装
- 外部URL既定OFF、相対パス+DataURL許可

## Phase 4: UI/UX改善 (進行中)

### テーマシステム (実装済み)
- ダーク/ライト切替 + OS prefers-color-scheme 連動
- カスタムテーマ + ThemePanelManager
- 詳細: docs/specs/theme-system.md

### アクセシビリティ (一部実装済み)
- キーボードナビゲーション (選択肢矢印キー・数字キー直接選択)
- フォーカストラップ (playModalFocus.js)
- スクリーンリーダー基本対応 (aria-label, role="dialog")
- 未実装: i18n、aria-live拡充
- 詳細: docs/specs/accessibility.md

### レスポンシブデザイン強化
- 詳細: docs/issues/23-admin-responsive.md

## 既存課題 (優先度順)

### UI モダナイズ
- WritingPage の CSS Variables / Accordion パターンを参考にした統一設計
- 現状: modern.css + common.css のブリッジ方式
- 目標: CSS 変数の一元化、コンポーネント指向への段階移行

### SPA 統合
- Phase A: 共通ヘッダー/テーマ共通化 (構想済み)
- Phase B: hash ルーター統合 (spaRouter.js 実装済み、未統合)
- 詳細: docs/specs/spa-integration.md

### テスト自動化
- `npm test` が HTTP 200 スモークテストのみ
- Mocha spec を CI で評価する仕組みが未整備
- Playwright E2E PoC は整備済み

### Mermaid CDN 依存
- 現在 CDN から読み込み
- ローカル同梱への移行を検討中

## 将来検討課題

### セキュリティ
- CSP ヘッダー導入
- ストレージ暗号化

### パフォーマンス
- バンドルサイズ最適化 (コード分割・圧縮)
- 画像遅延ロード

### 機能拡張
- PWA 化 (オフライン対応)
- AI 補助 Wiki (固有名詞/事件/年表)
- 縦書き機能
- キャラクター/組織プロパティ管理

### 保守性
- TypeScript 導入検討
- 依存ライブラリ更新の定期運用
