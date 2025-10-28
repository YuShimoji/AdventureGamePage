# Issue #29: パフォーマンス最適化

## Goal

必要に応じたパフォーマンス最適化を実装し、ロード時間、メモリ使用、描画パフォーマンスを改善する。

## Current Status

- 基本的な遅延ロード実装済み（scripts/*.js）
- MermaidプレビューはSVG生成が重い場合あり
- IndexedDB移行によりストレージパフォーマンス向上
- エディタ入力時のアニメーションでCPU使用

## ToDo

### Phase 1: ロード最適化 (Priority: High)

- [ ] **スクリプト遅延ロード強化**
  - クリティカルパス外のスクリプトを遅延ロード
  - IntersectionObserverでビューポート内コンポーネントのみロード
  - バンドルサイズ最適化（未使用コード除去）

- [ ] **CSS最適化**
  - 未使用CSS除去
  - クリティカルCSSインライン化
  - CSS圧縮

### Phase 2: メモリ・CPU最適化 (Priority: Medium)

- [ ] **Mermaid描画最適化**
  - SVGキャッシュ実装
  - 描画範囲制限（ビューポート内のみ）
  - Mermaidソース変更時のみ再描画

- [ ] **エディタ入力最適化**
  - デバウンス強化（入力アニメーション）
  - キャレット追従最適化
  - 大きなドキュメントでのスクロール改善

- [ ] **IndexedDBクエリ最適化**
  - インデックス活用
  - クエリ結果キャッシュ
  - バルク操作最適化

### Phase 3: ネットワーク・バンドル最適化 (Priority: Low)

- [ ] **リソース圧縮**
  - JS/CSS圧縮（productionビルド）
  - 画像最適化（未使用）
  - HTTP/2プッシュ設定

- [ ] **キャッシュ戦略**
  - ServiceWorker実装（オフライン対応）
  - HTTPキャッシュヘッダー最適化

## Acceptance Criteria

### ロードパフォーマンス
- [ ] 初期ロード時間: 2秒以内
- [ ] Lighthouseスコア: 90+ (Performance)
- [ ] バンドルサイズ: 500KB以内

### ランタイムパフォーマンス
- [ ] Mermaid描画: 1秒以内
- [ ] エディタ入力: 60fps維持
- [ ] メモリリークなし

## Risk Assessment

Tier: 1 (Low risk - 最適化改善のみ)

## Estimated Effort

Medium (2-3 days)

- Phase 1: 1 day (ロード最適化)
- Phase 2: 1.5 days (メモリ/CPU最適化)
- Phase 3: 0.5 days (ネットワーク最適化)

## Implementation Notes

### 遅延ロード戦略
```javascript
// Lazy load non-critical scripts
const lazyLoadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    document.head.appendChild(script);
  });
};

// Load on interaction
document.getElementById('btn-mermaid').addEventListener('click', () => {
  lazyLoadScript('scripts/mermaidPreview.js');
});
```

### Mermaid最適化
- キャッシュキー: `hash(mermaidSource)`
- ビューポート監視: `IntersectionObserver`
- 描画スキップ: ソース変更検知

### ビルド最適化
- 圧縮ツール: terser, cssnano
- 未使用コード除去: Webpack Tree Shaking

## Dependencies

- 完了済: #27 レスポンシブ改善 (UI変更なし)
- 完了済: #28 データ永続化強化 (IndexedDB活用)

## Testing Strategy

- パフォーマンス測定: Lighthouse CI
- メモリプロファイル: Chrome DevTools
- 手動テスト: 大規模データでの操作確認
- 回帰テスト: 既存機能維持確認

## Related Issues

- #26: UIワークフロー統合 (スクリプト遅延ロード基盤)
- #27: レスポンシブ改善 (モバイルパフォーマンス考慮)
- #28: データ永続化強化 (IndexedDBパフォーマンス向上)
