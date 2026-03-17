# SP-009: Media Policy B'

## 概要

画像・音声のメディア参照ポリシー。相対パスと DataURL を許可し、外部 URL (http/https) は既定でブロックする。

## 方針

- **許可**: 相対パス (`images/foo.png`)、DataURL (`data:image/...`)
- **既定ブロック**: 外部 URL (`https://example.com/img.png`)
- **例外**: `APP_CONFIG.media` で明示的に許可可能

## MediaResolver (SSOT)

`scripts/mediaResolver.js` が唯一の判定点。

### 画像

```javascript
MediaResolver.resolveImageRef(url)
// => { ok: true, src: 'images/foo.png' }
// => { ok: false, reason: 'blocked' }
```

### 音声

```javascript
MediaResolver.resolveAudioUrl(url)
// => { ok: true, src: 'audio/bgm.mp3' }
// => { ok: false, reason: 'blocked' }
```

## 適用箇所

- Play 側: `gameEngineUIManager.js` (node.image), `gameEngineUtils.js` (play_bgm/play_sfx)
- Admin 側: `nodeEditor/ui/preview.js` (画像プレビュー), `nodeEditorLogicManager.js` (URL バリデーション), `nodeEditor/ui/forms.js` (音声 URL バリデーション)
- サンプル: 外部 URL 撤去済み、画像は SVG DataURL、音声は未同梱

## 設定

```javascript
APP_CONFIG.media = {
  allowExternalUrls: false,    // 外部 URL 許可
  allowDataUrls: true,         // DataURL 許可
  maxDataUrlBytes: 5242880     // DataURL 最大サイズ (5MB)
}
```
