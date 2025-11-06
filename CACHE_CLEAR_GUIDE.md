# キャッシュクリア手順

## 問題
修正したコードが反映されない場合、ブラウザとサーバーのキャッシュが原因の可能性があります。

## 解決手順

### 1. ブラウザのハードリフレッシュ
**Windows/Linux:**
- `Ctrl + Shift + R`
- または `Ctrl + F5`

**Mac:**
- `Cmd + Shift + R`

### 2. 開発者ツールでキャッシュ無効化
1. `F12`キーで開発者ツールを開く
2. `Network`タブを開く
3. `Disable cache`にチェックを入れる
4. 開発者ツールを開いたままページをリロード

### 3. ブラウザキャッシュの完全クリア
**Chrome/Edge:**
1. `Ctrl + Shift + Delete`
2. 「キャッシュされた画像とファイル」を選択
3. 時間範囲: 「全期間」
4. 「データを削除」

**Firefox:**
1. `Ctrl + Shift + Delete`
2. 「キャッシュ」を選択
3. 「今すぐ消去」

### 4. Live Serverの再起動
VSCode使用時:
1. VSCodeのステータスバーで「Port: 5500」をクリック
2. 「Stop Live Server」
3. 右クリック → 「Open with Live Server」で再起動

### 5. npm startで確認（推奨）
Live Serverではなく、プロジェクトのdev-serverを使用:

```bash
# 既存のサーバーを停止
# Ctrl+C で停止

# 新しいターミナルで起動
npm start
```

→ http://127.0.0.1:8080/admin.html にアクセス

## 確認ポイント

### play.cssが更新されているか確認
1. `F12`で開発者ツールを開く
2. `Sources`タブ → `styles/play.css`を開く
3. 3行目を確認:

```css
/* 正しい（新） */
.scene { white-space: pre-wrap; font-size: 18px; margin-bottom: 16px; color: var(--text-color, #e9e9e9); }

/* 間違い（古） */
.scene { white-space: pre-wrap; font-size: 18px; margin-bottom: 16px; color: #1a1a1a; }
```

### savePreview.jsが更新されているか確認
1. `F12`で開発者ツールを開く
2. `Sources`タブ → `scripts/savePreview.js`を開く
3. 158行目付近を確認:

```javascript
// 正しい（新）
// CRITICAL: フォーカスを先に移動してから aria-hidden を設定

// 間違い（古）
// 即座に状態とDOM属性を更新（再呼び出し防止）
```

## トラブルシューティング

### 問題: 保存プレビューパネルが閉じない
- `F12` → `Console`タブでエラーを確認
- `admin.core.js`の383-389行目のイベントハンドラが設定されているか確認

### 問題: テキストが暗い
- `Elements`タブで`.scene`要素を選択
- `Styles`パネルで`color`プロパティの値を確認
- `var(--text-color, #e9e9e9)`になっているか確認

### 最終手段: プライベートモードで確認
1. `Ctrl + Shift + N` (Chrome) または `Ctrl + Shift + P` (Firefox)
2. プライベートウィンドウで http://127.0.0.1:8080/admin.html にアクセス
3. キャッシュが完全にクリアされた状態で確認可能
