# Issue #26: UI Stabilization & Workflow Integration

## Goal

包括的なUI安定化とワークフロー統合により、エディタでストーリーを作成しつつプレイモードで確認できる統合的な開発環境を実現する。

## 現状の課題

### 1. アクセシビリティとUI表示問題

- 外部CDN依存による表示不安定性
- アクセシビリティIssue（<summary>内のボタン）
- ブラウザプレビューでのエラー

### 2. ワークフロー分断

- **エディタ**: admin.htmlで執筆・保存
- **プレイ**: play.htmlで別途データロード
- **プレビュー**: 保存一覧パネルで確認のみ
- → 切り替えが煩雑で、ストーリー作成→テストのサイクルが遅い

### 3. データフロー不明瞭

- IndexedDB/LocalStorageへの保存
- プレイ画面でのデータ読み込み
- 保存形式の一貫性

## ToDo

### フェーズ1: UI安定化（Tier 1）

- [x] Lucide CDN削除、Unicodeアイコンに統一
- [x] <summary>内ボタンのアクセシビリティ修正
- [x] Mermaid CDN追加と初期化
- [ ] すべてのページでテーマ機能が正常動作することを確認
- [ ] レスポンシブデザインの最終検証

### フェーズ2: ワークフロー統合（Tier 2）

- [ ] **クイックプレビュー機能**: admin.htmlにプレイモード埋め込み
  - サイドバーに「プレイテスト」セクション追加
  - 現在のエディタ内容を直接プレイ可能に
  - 外部ウィンドウ／インラインモーダルの選択
- [ ] **保存→プレイの自動連携**
  - 保存時にプレイ画面へのリンク生成
  - 「保存してプレイ」ボタン追加
- [ ] **リアルタイムプレビュー**
  - エディタ変更時に自動保存（オプション）
  - Mermaidプレビューの改善

### フェーズ3: データフロー明確化（Tier 1）

- [ ] ストレージAPIの統一
- [ ] 保存形式のバリデーション強化
- [ ] エクスポート/インポートの改善
- [ ] サンプルゲームの更新

### フェーズ4: ドキュメント整備（Tier 1）

- [ ] README.mdの更新（ワークフロー図）
- [ ] 開発者ガイドの作成
- [ ] ユーザーマニュアルの作成

## Acceptance Criteria

### UI安定化

- すべてのページが外部CDN依存なしで動作
- アクセシビリティエラーが0件
- レスポンシブデザインがモバイルでも正常動作

### ワークフロー統合

- admin.htmlから直接プレイテスト可能
- 保存→プレイの移行がシームレス（1クリック）
- リアルタイムプレビューが動作

### データフロー

- 保存形式が一貫
- エクスポート/インポートが正常動作
- エラーハンドリングが適切

## Risk Assessment

**Tier**: 混合（Tier 1: UI/ドキュメント、Tier 2: ワークフロー統合）

- **Tier 1部分**: 低リスク（UI調整、ドキュメント）
- **Tier 2部分**: 中リスク（機能追加、既存コードへの影響）

## Estimated Effort

中規模（3-5日）

- フェーズ1: 1日
- フェーズ2: 2日
- フェーズ3: 1日
- フェーズ4: 1日

## Implementation Notes

### クイックプレビュー実装案

1. **インラインモーダル方式**
   - admin.html内にiframeでplay.htmlを埋め込み
   - postMessageでデータを渡す
   - メリット: 切り替えなしでテスト可能

2. **別ウィンドウ方式**
   - window.open()で新規ウィンドウ
   - URLパラメータでデータID指定
   - メリット: 独立した環境でテスト

3. **ハイブリッド方式**（推奨）
   - ユーザーが選択可能
   - デフォルトはインラインモーダル

### ストレージ統一案

```javascript
// Unified Storage API
class GameStorage {
  async save(key, data) { /* IndexedDB優先、fallback to localStorage */ }
  async load(key) { /* 同上 */ }
  async list() { /* 保存一覧 */ }
  async delete(key) { /* 削除 */ }
}
```

## Related Issues

- #23: Admin Page Responsive Design
- #24: UI Modernization
- #25: UI Polish & Visual Refinement

## References

- [Choices-Driven Development](../choices-driven-development.md)
- [Development Protocol](../../DEVELOPMENT_PROTOCOL.md)
