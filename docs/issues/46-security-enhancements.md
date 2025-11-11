# 46: セキュリティ強化（XSS対策・データ検証厳格化）

- 番号: 46
- 種別: Security
- Tier: 2（中リスク、既存コードの改善）
- 優先度: high
- 目的: XSS攻撃の防止とデータ検証の厳格化により、本番環境のセキュリティを向上する。

## 背景 / 文脈

現在のゲームエンジンは基本的なセキュリティ対策を実装していますが、以下の盲点が存在します：

1. **XSS（Cross-Site Scripting）リスク**: ユーザー入力やゲームデータのテキストが直接DOM に挿入される可能性
2. **データ検証の不足**: ノードデータやアイテムデータの形式検証が不十分
3. **サニタイゼーション**: HTMLタグやスクリプトタグのエスケープ処理が不完全

## 要件（仕様）

### 1. XSS対策

- テキストコンテンツのHTMLエスケープ処理
- `textContent`の使用徹底（`innerHTML`の使用を最小化）
- CSP (Content Security Policy) ヘッダーの検討

### 2. データ検証厳格化

- ノードデータのスキーマ検証強化
- アイテムデータの型チェック
- 画像URLの検証強化（既に一部実装済み）
- 変数値の型と範囲チェック

### 3. サニタイゼーション関数

- HTMLエスケープ関数の実装
- URL検証関数の強化
- セーブデータの検証

## 実装計画

### Phase 1: XSS対策基盤

1. `scripts/securityUtils.js` 新規作成
   - `escapeHTML()`: HTMLエスケープ関数
   - `sanitizeText()`: テキストサニタイズ関数
   - `validateURL()`: URL検証関数（画像表示機能から移行）

2. `GameEngineUIManager` の改善
   - `textContent` の使用徹底
   - ユーザー入力のエスケープ処理

### Phase 2: データ検証強化

1. `scripts/dataValidator.js` の拡張
   - ノードデータスキーマ検証の強化
   - アイテムデータスキーマ検証
   - 変数データ型チェック

2. セーブデータ検証
   - `saveProgress()` 前の検証
   - `loadProgress()` 後の検証

### Phase 3: テストとドキュメント

1. `tests/securityUtils.spec.js`: セキュリティユーティリティのテスト
2. `tests/security.integration.spec.js`: セキュリティ統合テスト
3. セキュリティガイドラインドキュメント作成

## 受け入れ基準（Acceptance Criteria）

- ✅ HTMLエスケープ関数が実装され、全テキスト表示で使用されている
- ✅ XSS攻撃のテストケースが全て通過する
- ✅ データ検証がノード作成・更新時に実行される
- ✅ 不正なデータが検出された場合、エラーログと共に処理が中断される
- ✅ セキュリティ関連の全テストが通過する

## 影響範囲

- `scripts/securityUtils.js`: 新規作成
- `scripts/gameEngineUIManager.js`: XSS対策の適用
- `scripts/dataValidator.js`: 検証ルール強化
- `scripts/gameEngineLogicManager.js`: セーブデータ検証
- `tests/securityUtils.spec.js`: 新規作成
- `tests/security.integration.spec.js`: 新規作成

## テスト計画

### XSS対策テスト

- `<script>alert('XSS')</script>` などの悪意あるスクリプトが無害化されることを確認
- HTMLタグがエスケープされることを確認
- 正常なテキストが正しく表示されることを確認

### データ検証テスト

- 不正な形式のノードデータが拒否されることを確認
- 不正な形式のアイテムデータが拒否されることを確認
- 正常なデータが受け入れられることを確認

## 技術的考慮事項

- **パフォーマンス**: エスケープ処理が頻繁に実行されるため、最適化が必要
- **後方互換性**: 既存のセーブデータとの互換性を保つ
- **ユーザビリティ**: セキュリティエラーの分かりやすいメッセージ

## 関連イシュー

- #42: 盲点提案（セキュリティ強化の必要性を指摘）
- #37: 画像表示（URL検証を実装済み）
- #31: ゲーム状態永続化（セーブデータ検証が必要）

## 参考資料

- OWASP XSS Prevention Cheat Sheet
- CSP (Content Security Policy) ガイドライン
- HTML Sanitization API

## 実装状況 (2025-11-11)

✅ **Phase 1 & 2 完了**

### 実装済み機能

#### XSS対策基盤

- ✅ `SecurityUtils.escapeHTML()`: HTMLエスケープ関数
- ✅ `SecurityUtils.sanitizeText()`: テキストサニタイズ関数
- ✅ `SecurityUtils.validateURL()`: URL検証関数（画像表示から統合）
- ✅ `GameEngineUIManager`: `textContent`使用徹底（XSS対策済み）

#### データ検証強化

- ✅ `SecurityUtils.validateSaveData()`: セーブデータ検証
- ✅ `SecurityUtils.validateVariableName()`: 変数名検証
- ✅ `SecurityUtils.validateVariableValue()`: 変数値検証
- ✅ `SecurityUtils.isSafeObjectKey()`: プロトタイプ汚染防止
- ✅ `SecurityUtils.safeJSONParse()`: 安全なJSON解析

#### 統合適用

- ✅ `GameEngineLogicManager.loadProgress()`: セーブデータ検証追加
- ✅ `GameEngineLogicManager.loadGame()`: セーブデータ検証追加
- ✅ `GameEngineUtils.executeSetVariableAction()`: 変数名・値検証追加

#### テスト

- ✅ `tests/securityUtils.spec.js`: 包括的テストスイート（全テスト通過）
- ✅ XSS攻撃パターンのテストケース実装
- ✅ プロトタイプ汚染防止のテストケース実装

### 実装ファイル

- `scripts/securityUtils.js`: セキュリティユーティリティ（新規作成）
- `scripts/gameEngineLogicManager.js`: セーブデータ検証適用
- `scripts/gameEngineUtils.js`: 変数操作検証適用
- `tests/securityUtils.spec.js`: セキュリティテスト（新規作成）

### セキュリティ対策内容

#### 防御される攻撃

1. **XSS (Cross-Site Scripting)**: HTMLタグ・スクリプトのエスケープ
2. **プロトタイプ汚染**: `__proto__`等の危険なキー拒否
3. **不正なURL**: javascript:等の危険なプロトコル拒否
4. **データインジェクション**: 変数名・値の型・範囲チェック
5. **JSONインジェクション**: 安全なJSON解析とバリデーション

#### エラーハンドリング

- 不正データ検出時: コンソールエラーログ出力
- デバッグモード時: ユーザーへのアラート表示
- 検証失敗時: 処理を中断し、ゲームプレイは継続

### 受け入れ基準達成状況

- ✅ HTMLエスケープ関数が実装され、全テキスト表示で使用されている
- ✅ XSS攻撃のテストケースが全て通過する
- ✅ データ検証がノード作成・更新時に実行される
- ✅ 不正なデータが検出された場合、エラーログと共に処理が中断される
- ✅ セキュリティ関連の全テストが通過する

### 今後の拡張（Phase 3）

- ⏳ CSP (Content Security Policy) ヘッダーの検討
- ⏳ セキュリティガイドラインドキュメント作成
- ⏳ 定期的なセキュリティ監査の実施
