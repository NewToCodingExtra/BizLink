# BizLink dev startup: MySQL 3307 + Laravel :8000 + frontend Vite :5173 (Inertia) + Meilisearch
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$xamppPhp = "C:\xampp\php\php.exe"

function Stop-ListenersOnPort {
  param([int[]]$Ports)
  foreach ($port in $Ports) {
    $lines = netstat -ano | Select-String ":$port\s+.*LISTENING"
    foreach ($line in $lines) {
      if ($line -match '\s+(\d+)\s*$') {
        $procId = [int]$Matches[1]
        if ($procId -le 0) { continue }
        try {
          $proc = Get-Process -Id $procId -ErrorAction Stop
          Write-Host "   Stopping $($proc.ProcessName) (PID $procId) on :$port"
          Stop-Process -Id $procId -Force -ErrorAction Stop
        } catch {
          Write-Host "   Port $port PID $procId already gone"
        }
      }
    }
  }
}

Write-Host "0) Closing existing Laravel / Vite / Meilisearch runs..."
Stop-ListenersOnPort -Ports @(8000, 5173, 5174, 5175, 7700)
$hot = Join-Path $backend "public\hot"
if (Test-Path $hot) {
  Remove-Item $hot -Force
  Write-Host "   Removed stale backend/public/hot"
}
Start-Sleep -Seconds 1

Write-Host "1) MySQL 3307 (C:\temp\bizlink-mysql)..."
$listening = netstat -ano | Select-String "127.0.0.1:3307.*LISTENING"
if (!$listening) {
  Start-Process -FilePath "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" -ArgumentList "--datadir=C:\temp\bizlink-mysql\data", "--port=3307", "--mysqlx-port=33070", "--bind-address=127.0.0.1", "--server-id=99", "--log-error=C:\temp\bizlink-mysql\error.log" -WindowStyle Hidden
  Start-Sleep -Seconds 8
}

Write-Host "2) Meilisearch on :7700..."
$meiliPath = Join-Path $backend "meilisearch.exe"
if (-not (Test-Path $meiliPath)) {
    Write-Host "   Downloading Meilisearch (one-time setup)..."
    Invoke-WebRequest -Uri "https://github.com/meilisearch/meilisearch/releases/latest/download/meilisearch-windows-amd64.exe" -OutFile $meiliPath
}
Start-Process -FilePath $meiliPath -ArgumentList "--db-path=C:\temp\meilisearch_data" -WindowStyle Hidden
Start-Sleep -Seconds 2

Write-Host "3) Laravel on :8000 (multi-worker for parallel requests)..."
Start-Process -FilePath "cmd.exe" -ArgumentList @('/c', "set PHP_CLI_SERVER_WORKERS=5 && `"$xamppPhp`" artisan serve --host=127.0.0.1 --port=8000") -WorkingDirectory $backend -WindowStyle Hidden -RedirectStandardOutput C:\temp\bizlink-api.log -RedirectStandardError C:\temp\bizlink-api-err.log
Start-Sleep -Seconds 5
try {
  Invoke-RestMethod http://127.0.0.1:8000/api/health | ConvertTo-Json
} catch {
  Write-Host "   Health check skipped (API may still be warming up)."
}

Write-Host "4) Frontend Vite on :5173 (Inertia assets for Laravel)..."
Start-Process -FilePath "cmd.exe" -ArgumentList @('/c', "npm run dev") -WorkingDirectory $frontend -WindowStyle Hidden -RedirectStandardOutput C:\temp\bizlink-vite.log -RedirectStandardError C:\temp\bizlink-vite-err.log
Start-Sleep -Seconds 4
$viteUp = netstat -ano | Select-String "127.0.0.1:5173.*LISTENING"
if (-not $viteUp) {
  $viteUp = netstat -ano | Select-String "\[::1\]:5173.*LISTENING"
}
if ($viteUp) {
  Write-Host "   Vite listening on :5173"
  if (Test-Path $hot) {
    $hotUrl = (Get-Content $hot -Raw).Trim()
    Write-Host "   hot -> $hotUrl"
  }
} else {
  Write-Host "   Vite may still be starting - check C:\temp\bizlink-vite-err.log"
}

Write-Host ""
Write-Host "App URL:  http://localhost:8000   <-- open THIS (not :5173)"
Write-Host "Vite HMR: http://127.0.0.1:5173   (assets only; visiting it shows an info page)"
Write-Host "Meilisearch: http://127.0.0.1:7700"
Write-Host "Demo: demo@bizlink.ph / password123, brand@bizlink.ph / password123"
Write-Host "Google OAuth needs GOOGLE_CLIENT_ID/SECRET in backend/.env"
try {
  Start-Process "http://localhost:8000"
} catch {
  Write-Host "Could not open browser automatically."
}
