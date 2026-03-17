# SP-015: Experience Slice — 初ゲーム作成からプレイまで

## Slice Identity

- スライス名: First Game Creation → Play
- 対象: admin.html (ノードエディタ) → play.html (ゲームプレイ)
- 主レーン: Experience Slice / UX 逆算
- 関連レーン: Runtime Core, Authoring

## User Operation Sequence

1. admin.html を開く
2. ノードエディタの空状態で「最初のノードを作成」を促される
3. ノードを 2-3 個作成し、選択肢で繋ぐ
4. ヘッダーの「プレイ」ボタンを押す
5. ゲームデータが自動保存され、play.html が開く
6. 作ったゲームをプレイする
7. セーブ → リロード → ロードで継続できる

## Visible Outcome

- admin.html: ノードエディタ空状態に誘導 CTA が表示される
- admin.html: ヘッダーに「プレイ」ボタンがある
- play.html: admin で作ったゲームが即座にプレイできる

## Runtime Contract

- admin のノードエディタ保存時に `agp_game_data` へ書き込み (既存)
- 「プレイ」ボタン押下時にも `agp_game_data` への最新保存を保証
- play.html は `agp_game_data` から読み込み (既存)

## Acceptance Condition

1. admin.html を開いてノードエディタが空の場合、「最初のノードを作成」的な誘導が見える
2. admin.html ヘッダーに「プレイ」ボタンがある
3. ノードを作成後「プレイ」を押すと play.html が開き、作ったゲームが表示される
4. play.html でセーブ → リロード → ロードが動作する

## Out of Scope

- SPA 統合 (別スライス)
- ノードエディタの UX 改善 (別スライス)
- CSS Variables 体系化 (別スライス)
- learn.html → admin.html の導線改善 (このスライスでは扱わない)
