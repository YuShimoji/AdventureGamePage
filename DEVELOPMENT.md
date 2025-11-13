# Adventure Game Page - 開発者向けドキュメント

## 🚀 開発環境セットアップ

### 必要環境
- Node.js 14.0.0 以上
- npm または yarn
- モダンブラウザ（Chrome 80+, Firefox 75+, Safari 13+, Edge 80+）

### インストール
```bash
# リポジトリをクローン
git clone https://github.com/YuShimoji/AdventureGamePage.git
cd AdventureGamePage

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev

# ブラウザで開く
# http://127.0.0.1:8080/ (または自動検出されたポート)
```

### 利用可能なスクリプト
```bash
# 開発サーバー起動
npm run dev

# テスト実行
npm run test

# CI環境向けテスト
npm run test:ci

# スモークテスト（サーバー起動確認）
npm run smoke

# コード品質チェック
npm run check

# コードフォーマット
npm run format

# リンター実行
npm run lint
```

## 📁 プロジェクト構造

```
AdventureGamePage/
├── index.html              # スタートページ
├── admin.html              # 管理画面（エディタ）
├── play.html               # プレイ画面
├── test-rpg.html           # テスト・デモ画面
├── styles/                 # CSSスタイル
│   ├── common.css         # 共通スタイル・CSS変数
│   ├── admin.css          # 管理画面スタイル
│   └── play.css           # プレイ画面スタイル
├── scripts/                # JavaScriptモジュール
│   ├── config.js          # グローバル設定
│   ├── admin-boot.js      # 管理画面初期化ブートストラップ
│   ├── admin.js           # 管理画面メインスクリプト
│   ├── gameEngine.js      # ゲームエンジン
│   ├── nodeEditor.js      # ノードエディタ
│   ├── play.js            # プレイ画面スクリプト
│   ├── debug.js           # デバッグUI
│   ├── tests.js           # テストスイート
│   ├── theme.js           # テーマ管理
│   └── storage*.js        # ストレージ関連
├── docs/                   # ドキュメント
│   ├── guides/            # 作成ガイド
│   └── issues/            # 機能開発履歴
└── tests/                  # テストファイル
    └── test.html          # ブラウザテスト実行環境
```

## 🔧 開発ワークフロー

### 1. 機能開発の流れ
1. Issue を作成（または既存のものを使用）
2. ブランチを作成: `git checkout -b feature/your-feature-name`
3. コードを実装
4. テストを追加・実行: `npm run test`
5. コードフォーマット: `npm run format`
6. コミット: `git commit -m "feat: add your feature"`
7. PR を作成

### 2. コード品質
- **ESLint**: コード品質チェック
- **Prettier**: 自動コードフォーマット
- **EditorConfig**: エディタ設定統一

### 3. テスト
- ブラウザベースの統合テスト
- ユニットテスト（主要関数）
- クロスブラウザ互換性テスト

### 4. コミットメッセージ
```bash
feat: 新機能の追加
fix: バグ修正
docs: ドキュメント更新
style: スタイル修正（機能変更なし）
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・ツール・補助ファイルの変更
```

## 🎯 主要コンポーネント

### ゲームエンジン (`gameEngine.js`)
- ノードベースの分岐管理
- アイテム・インベントリシステム
- 変数システム（数値・文字列・真偽値）
- 条件分岐とアクション実行
- 永続化（localStorage）

### ノードエディタ (`nodeEditor.js`)
- JSONベースのゲーム構造編集
- リアルタイム検証
- Mermaidによる分岐プレビュー
- 部分エクスポート機能

### 管理画面 (`admin.js`)
- ストーリーエディタ
- 自動保存・読込
- 複数ストレージプロバイダ対応
- テーマ切り替え
- メモ機能

### プレイ画面 (`play.js`)
- レスポンシブなゲームプレイ
- アクセシビリティ対応
- デバッグUI
- キーボードショートカット

## 🧪 テスト実行

### ブラウザテスト
```bash
# 開発サーバー起動
npm run dev

# ブラウザでテストページを開く
# http://127.0.0.1:8080/tests/test.html
```

### 自動テスト（CI）
```bash
# 全テスト実行
npm run test:ci

# スモークテストのみ
npm run smoke
```

## 🚢 デプロイ

### 静的ホスティング
プロジェクトは完全に静的ファイルのみで構成されているため、以下のサービスで直接ホスティング可能：

- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

### ビルド不要
```bash
# 直接公開可能なファイル
# - index.html
# - admin.html
# - play.html
# - test-rpg.html
# - styles/*.css
# - scripts/*.js
# - docs/**/*.md
```

## 📋 貢献ガイドライン

### Issue の作成
- バグ報告: 再現手順・期待される動作・実際の動作を記載
- 機能要望: ユースケース・実装イメージを記載
- 明確なタイトルと詳細な説明を心がける

### Pull Request
- 変更内容を明確に記載
- テストが通っていることを確認
- ドキュメント更新を忘れずに
- レビュー依頼前にセルフレビューを行う

### コードスタイル
- ESLint/Prettier の設定に従う
- 関数・変数に適切な名前をつける
- JSDoc コメントを付与（主要関数）
- ブラウザ互換性を考慮

## 🔍 トラブルシューティング

### 管理画面が表示されない
1. ブラウザのコンソールを確認
2. `admin-boot.js` のエラーメッセージを確認
3. DOM要素の存在を確認（F12開発者ツール）

### テストが失敗する
1. Node.js のバージョン確認（14.0.0以上）
2. 依存関係のインストール確認
3. ポート8080が使用可能か確認

### パフォーマンス問題
1. ブラウザの開発者ツールでプロファイリング
2. 大量のノードを持つゲームの分割を検討
3. 画像の最適化を確認

## 📚 関連ドキュメント

- [ユーザーガイド](docs/guides/)
- [API仕様](docs/api/)
- [機能開発履歴](docs/issues/)
- [README](README.md)

---

Happy coding! 🎮
