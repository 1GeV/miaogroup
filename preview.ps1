param(
  [int]$Port = 4321
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host 'Node.js LTS is required for the local Astro preview.' -ForegroundColor Yellow
  Write-Host 'Install it from https://nodejs.org/, reopen PowerShell, then run this script again.'
  exit 1
}

if (-not (Test-Path 'node_modules')) {
  Write-Host 'Installing website dependencies...'
  npm install
}

Write-Host "Preview: http://localhost:$Port/miaogroup/" -ForegroundColor Cyan
Write-Host 'Press Ctrl+C to stop the preview server.'
npm run dev -- --host 127.0.0.1 --port $Port
