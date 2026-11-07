param(
  [ValidateSet('local', 'github')]
  [string]$Mode
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host 'Node.js 22 or newer is required. Install Node.js LTS, then reopen this window.' -ForegroundColor Yellow
  exit 1
}
if ($Mode) {
  $publishingConfigPath = Join-Path $PSScriptRoot 'publishing.json'
  $publishingConfig = Get-Content -LiteralPath $publishingConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $publishingConfig.mode = $Mode
  $publishingConfigJson = ($publishingConfig | ConvertTo-Json -Depth 10) + [Environment]::NewLine
  [System.IO.File]::WriteAllText($publishingConfigPath, $publishingConfigJson, [System.Text.UTF8Encoding]::new($false))
  Write-Host "Publishing mode saved: $Mode"
}
& node (Join-Path $PSScriptRoot 'scripts/publish.mjs')
exit $LASTEXITCODE
