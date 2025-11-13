# Issue: プレースホルダ等のハードコーディング解消（i18n/設定分離）

- 種別: enhancement
- 優先度: high
- 画面: `admin.html`

## 背景
エディタのプレースホルダ文言や初期表示状態（表示切替など）がHTMLにハードコーディングされていると、将来のi18nや環境差分対応が困難になる。

## 要件
- プレースホルダや初期状態を `scripts/config.js` に集約。
- i18n対応を見据え、JSONベースの設定/辞書ファイルへ移行可能な構成にする。

## 受け入れ条件
- HTMLに固定文言を埋め込まず、`config.js` から読み込む。
- 将来、多言語辞書に差し替え可能。

## 実装メモ
- `window.APP_CONFIG.editor.placeholder` / `startZen` を参照。
- UI文言は段階的に辞書化。
