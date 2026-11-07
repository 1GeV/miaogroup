$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host 'Node.js 22 or newer is required. Install Node.js LTS, then reopen this window.' -ForegroundColor Yellow
  exit 1
}
& node (Join-Path $PSScriptRoot 'scripts/publish.mjs')
exit $LASTEXITCODE
