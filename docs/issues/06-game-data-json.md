# 06: ゲームデータJSON（管理→プレイ連携）

更新日時: 2025-09-27

## 背景 / 目的

- 管理側で作成した内容を、プレイ側で読み込める JSON 形式としてやり取りできるようにする。
- 将来的に「複数ノードの分岐編集UI」を導入する際の土台とする。

## スコープ

- 仕様ドラフト（docs/specs/game-data-schema.md）へのエクスポート（管理）
- 仕様ドラフトのインポート（管理/プレイ）
- プレイ側の常用データはエンジン形式（辞書ノード）を採用し、相互変換を提供

## 現状（2025-09-25）

- 管理
  - [x] エディタ内容から最小構成のゲームJSON（ドラフト仕様）をエクスポート（scripts/gameData.js）
  - [x] 現在の `agp_game_data`（または内蔵サンプル）をドラフト仕様に再エクスポート
  - [x] ゲームJSON（ドラフト仕様）をインポート→エンジン形式に正規化→`localStorage: agp_game_data` に保存
- プレイ
  - [x] `play.html` に「ゲームJSON読込」UIを追加
  - [x] `scripts/playImport.js` でドラフト仕様JSONをインポート→エンジン形式に正規化→保存→即リロード
  - [x] `scripts/play.js` で `agp_game_data` がドラフト仕様/エンジン形式どちらでも正規化して利用

## 次のタスク（提案）

- [x] 仕様ドラフト JSON Schema に対する簡易バリデーション（必須項目、重複IDなど）
- [x] インポート時の詳細エラー（構造化: path/code/message の提示）
- [x] インポート時の詳細エラー（行番号の推定表示）※ JSON構文エラー時に推定行番号を表示済み
- [x] エンジン形式→ドラフト仕様の再変換時、ノード title の保全（Converters.engineToSpec で対応済み）
- [ ] 管理側で複数ノードの編集UI（MVP）
- [ ] 編集→エンジン形式への反映、エクスポートの整合性テスト
- [ ] play でのロード失敗時のフォールバック/通知改善

## 既知の課題

- title や author などメタ情報の扱い。管理側エディタとゲームデータのどちらを信頼するか要設計。
- 大規模データと画像の扱い（IndexedDBProvider の本実装に委ねる）。

## 参考

- docs/specs/game-data-schema.md
- scripts/gameData.js / scripts/playImport.js / scripts/play.js
