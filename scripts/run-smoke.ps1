$ErrorActionPreference = 'Stop'

# Determine repo root (parent of this script directory)
$repoRoot = Split-Path -Parent $PSScriptRoot
Write-Host "repoRoot=$repoRoot"

# Start dev server in background at repo root
$logOut = Join-Path $repoRoot 'server.out.txt'
$logErr = Join-Path $repoRoot 'server.err.txt'
if (Test-Path $logOut) { Remove-Item $logOut -Force }
if (Test-Path $logErr) { Remove-Item $logErr -Force }
$proc = Start-Process -FilePath node -ArgumentList 'scripts/dev-server.js' -PassThru -WindowStyle Hidden -WorkingDirectory $repoRoot -RedirectStandardOutput $logOut -RedirectStandardError $logErr

try {
  $ok = $false
  for ($i = 0; $i -lt 30; $i = $i + 1) {
    try {
      Invoke-WebRequest -Uri 'http://127.0.0.1:8080/' -UseBasicParsing -TimeoutSec 2 | Out-Null
      $ok = $true
      break
    } catch { Start-Sleep -Seconds 1 }
  }
  if (-not $ok) { throw 'Server did not start on port 8080' }

  # Quick HTTP checks
  try { (Invoke-WebRequest -Uri 'http://127.0.0.1:8080/' -UseBasicParsing -TimeoutSec 3) | Out-Null; Write-Host 'GET / -> 200' } catch { Write-Host 'GET / -> FAIL' }
  try { (Invoke-WebRequest -Uri 'http://127.0.0.1:8080/index.html' -UseBasicParsing -TimeoutSec 3) | Out-Null; Write-Host 'GET /index.html -> 200' } catch { Write-Host 'GET /index.html -> FAIL' }
  try { (Invoke-WebRequest -Uri 'http://127.0.0.1:8080/admin.html' -UseBasicParsing -TimeoutSec 3) | Out-Null; Write-Host 'GET /admin.html -> 200' } catch { Write-Host 'GET /admin.html -> FAIL' }

  # Run smoke checks
  node scripts/dev-check.js
  if ($LASTEXITCODE -ne 0) { throw 'dev-check failed' }
  Write-Host 'Smoke test passed.'
} finally {
  if ($proc -and -not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force
  }
  Write-Host "Server logs: $logOut, $logErr"
}
