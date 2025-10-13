$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$file = Join-Path $repoRoot 'admin.html'
$content = Get-Content -LiteralPath $file

if ($content -match 'id="ne-mermaid-search"') {
  Write-Host 'phase2 patch: already applied'
  exit 0
}

$labelLine = ($content | Select-String -SimpleMatch 'id="ne-mermaid-mark-unreachable"' | Select-Object -First 1)
if (-not $labelLine) { throw 'ターゲットとなるレイアウト設定ブロックが見つかりません' }
$startIndex = [int]$labelLine.LineNumber - 1
$closingCount = 0
$insertIndex = $null
for ($i = $startIndex; $i -lt $content.Length; $i++) {
  if ($content[$i].Trim() -eq '</div>') {
    $closingCount++
    if ($closingCount -eq 2) {
      $insertIndex = $i + 1
      break
    }
  }
}
if ($insertIndex -eq $null) { throw '挿入位置が特定できませんでした' }

$block = @(
'          <div class="field">',
'            <span>検索</span>',
'            <div class="ne-row" style="gap:8px;">',
'              <input id="ne-mermaid-search" type="search" placeholder="ノードID / タイトル / 本文 / 選択肢ラベル" style="flex:1;" />',
'              <button id="ne-mermaid-search-clear" class="btn">クリア</button>',
'            </div>',
'          </div>',
'          <div class="field">',
'            <span>最短経路</span>',
'            <div class="ne-row" style="gap:8px;">',
'              <select id="ne-mermaid-path-start" style="flex:1;"></select>',
'              <select id="ne-mermaid-path-goal" style="flex:1;"></select>',
'              <button id="ne-mermaid-path-apply" class="btn">経路適用</button>',
'            </div>',
'          </div>',
'          <div class="field">',
'            <span>ステータス</span>',
'            <div id="ne-mermaid-status" class="muted" style="min-height:1.6em; display:flex; align-items:center;"></div>',
'          </div>'
)

$head = if ($insertIndex -gt 0) { $content[0..($insertIndex-1)] } else { @() }
$tail = if ($insertIndex -lt $content.Length) { $content[$insertIndex..($content.Length-1)] } else { @() }
$updated = @($head + $block + $tail)
Set-Content -LiteralPath $file -Value $updated -Encoding utf8
Write-Host 'phase2 patch: admin.html updated'
