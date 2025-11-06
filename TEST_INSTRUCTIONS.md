# 緊急テスト手順 - キャッシュ問題の完全解決

## 現状
- ローカルファイルは正しく修正されている
- ブラウザのキャッシュが古いファイルを使用している
- `?v=2` パラメータが表示されているがキャッシュが残存

## 最も確実な確認方法：シークレットモード

### ステップ1: シークレットウィンドウを開く
1. ブラウザで `Ctrl + Shift + N` (Chrome/Edge) を押す
2. または `Ctrl + Shift + P` (Firefox)

### ステップ2: URLにアクセス
```
http://127.0.0.1:5500/play.html
http://127.0.0.1:5500/admin.html
```

### ステップ3: 動作確認

#### play.html
- ✅ シーンテキストが**明るい色**で表示される（暗くない）
- ✅ 選択肢ボタンのテキストも明るい色

#### admin.html
- ✅ 右下の「保存」ボタンをクリック → パネルが開く
- ✅ ✕ボタンをクリック → **パネルが閉じる**
- ✅ コンソールにエラーが出ない

---

## 開発者ツールで実際のファイルを確認

### play.htmlで確認すべき内容

1. `F12` → `Sources` タブ
2. `styles/play.css?v=2` を開く
3. **3行目を確認**:

```css
/* 正しい内容（修正済み） */
.scene { white-space: pre-wrap; font-size: 18px; margin-bottom: 16px; color: var(--text-color, #e9e9e9); }

/* 間違った内容（古いキャッシュ） */
.scene { white-space: pre-wrap; font-size: 18px; margin-bottom: 16px; color: #1a1a1a; }
```

**もし `#1a1a1a` と表示されている場合**:
→ ブラウザが古いファイルをキャッシュしています

### admin.htmlで確認すべき内容

1. `F12` → `Sources` タブ
2. `scripts/admin.core.js?v=2` を開く
3. **393行目付近を確認**:

```javascript
// 正しい内容（修正済み）
btnQuickPreview.addEventListener('click', () => {
  if (window.SavePreviewPanelManager.isOpen && window.SavePreviewPanelManager.isOpen()) {
    window.SavePreviewPanelManager.close();
  } else {
    window.SavePreviewPanelManager.open();
  }
});
```

**もしこのコードが見つからない場合**:
→ ブラウザが古いファイルをキャッシュしています

---

## 通常モードでキャッシュを完全削除

### Chrome/Edge
1. `Ctrl + Shift + Delete`
2. 「キャッシュされた画像とファイル」にチェック
3. 時間範囲: **「全期間」**
4. 「データを削除」
5. **ブラウザを完全に閉じる**（✕ボタン）
6. ブラウザを再起動
7. URLにアクセス

### Firefox
1. `Ctrl + Shift + Delete`
2. 「キャッシュ」にチェック
3. 「今すぐ消去」
4. **ブラウザを完全に閉じる**
5. ブラウザを再起動
6. URLにアクセス

---

## Live Serverの問題の可能性

Live Serverがキャッシュしている可能性もあります。

### 対策: Live Serverを完全に停止・再起動

1. VSCodeで `Ctrl + Shift + P`
2. "Live Server: Stop Live Server" を実行
3. **VSCodeを再起動**
4. `admin.html` を右クリック → "Open with Live Server"

---

## それでも解決しない場合

### npm startで別のポートで起動

```bash
npm start
```

→ http://127.0.0.1:8080/play.html と http://127.0.0.1:8080/admin.html にアクセス

**8080ポートで動作すれば**:
→ Live Server (5500) のキャッシュが原因です

---

## 最終確認事項

### Consoleタブで実行
```javascript
// play.htmlで実行
window.getComputedStyle(document.querySelector('.scene')).color
// 期待値: "rgb(233, 233, 233)" (明るい色)
// NG値: "rgb(26, 26, 26)" (暗い色)
```

```javascript
// admin.htmlで実行
window.SavePreviewPanelManager
// 期待値: オブジェクトが表示される
// NG値: undefined
```

---

## スクリーンショット依頼

以下をスクリーンショットで共有してください:

1. **Sourcesタブ**: `play.css?v=2` の3行目
2. **Sourcesタブ**: `admin.core.js?v=2` の393行目付近
3. **Consoleタブ**: 上記のコマンドの実行結果

これで原因を特定できます。
