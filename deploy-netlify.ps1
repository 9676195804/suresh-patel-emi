#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$node   = "C:\Users\jadha\Documents\trae_projects\emi\node-v20.18.1-win-x64\node.exe"
$npm    = "C:\Users\jadha\Documents\trae_projects\emi\node-v20.18.1-win-x64\npm.cmd"

Write-Host "1️⃣  Installing Netlify CLI (local)…" -ForegroundColor Cyan
& $npm install --no-save netlify-cli@latest

Write-Host "2️⃣  Building project…" -ForegroundColor Cyan
& $npm run build

Write-Host "3️⃣  Preparing deploy bundle…" -ForegroundColor Cyan
if (!(Test-Path public)) { New-Item -ItemType Directory public | Out-Null }
Set-Content -Path public\_redirects -Value "/*    /index.html   200" -NoNewline
Set-Content -Path netlify.toml -Value @"
[build]
  publish = "dist"
  command = "echo 'Already built'"
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
"@

Write-Host "4️⃣  Deploying to Netlify…" -ForegroundColor Cyan
$netlify = "node_modules\.bin\netlify.cmd"
& $netlify deploy --prod --dir=dist --auth=$env:NETLIFY_AUTH_TOKEN --site=$env:NETLIFY_SITE_ID

Write-Host "✅  Done – your site is live!" -ForegroundColor Green