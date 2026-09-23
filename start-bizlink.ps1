# BizLink dev startup: MySQL 3307 (isolated) + Laravel + frontend Vite (Inertia)
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

Write-Host "1) MySQL 3307 (C:\temp\bizlink-mysql)..."
$listening = netstat -ano | Select-String "127.0.0.1:3307.*LISTENING"
if (!$listening) {
  Start-Process -FilePath "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" -ArgumentList "--datadir=C:\temp\bizlink-mysql\data", "--port=3307", "--mysqlx-port=33070", "--bind-address=127.0.0.1", "--server-id=99", "--log-error=C:\temp\bizlink-mysql\error.log" -WindowStyle Hidden
  Start-Sleep -Seconds 8
}
netstat -ano | Select-String "3307" | Select-Object -First 3

Write-Host "2) Laravel on :8000 (multi-worker for parallel requests)..."
$xamppPhp = "C:\xampp\php\php.exe"
$apiUp = netstat -ano | Select-String "127.0.0.1:8000.*LISTENING"
if (!$apiUp) {
  # PHP_CLI_SERVER_WORKERS lets the built-in server answer concurrent
  # calls instead of queueing them one-by-one (was the slow-feed cause).
  Start-Process -FilePath "cmd.exe" -ArgumentList @('/c', "set PHP_CLI_SERVER_WORKERS=5 && `"$xamppPhp`" artisan serve --host=127.0.0.1 --port=8000") -WorkingDirectory $backend -WindowStyle Hidden -RedirectStandardOutput C:\temp\bizlink-api.log -RedirectStandardError C:\temp\bizlink-api-err.log
  Start-Sleep -Seconds 6
} else {
  Write-Host "   Laravel already running - restart it to pick up multi-worker mode:"
  Write-Host "   Get-Process php | Stop-Process; then re-run this script."
}
try {
  Invoke-RestMethod http://127.0.0.1:8000/api/health | ConvertTo-Json
} catch {
  Write-Host "   Health check skipped (API may still be warming up)."
}

Write-Host "3) Frontend Vite (Inertia assets for Laravel on :8000)..."
$viteUp = netstat -ano | Select-String ":5173.*LISTENING"
if (!$viteUp) {
  Start-Process -FilePath "cmd.exe" -ArgumentList @('/c', "npm run dev") -WorkingDirectory $frontend -WindowStyle Hidden -RedirectStandardOutput C:\temp\bizlink-vite.log -RedirectStandardError C:\temp\bizlink-vite-err.log
  Start-Sleep -Seconds 4
} else {
  Write-Host "   Vite already listening on :5173"
}

Write-Host ""
Write-Host "Open http://localhost:8000  (Laravel serves pages; Vite HMR via public/hot)"
Write-Host "Demo: demo@bizlink.ph / password123, brand@bizlink.ph / password123"
Write-Host "Google OAuth needs GOOGLE_CLIENT_ID/SECRET in backend/.env"
