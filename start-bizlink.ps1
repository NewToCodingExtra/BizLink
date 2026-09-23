# BizLink dev startup: MySQL 3307 (isolated) + Laravel API + Vite frontend
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

Write-Host "2) Laravel API on :8000 (multi-worker so feed+stories load in parallel)..."
$xamppPhp = "C:\xampp\php\php.exe"
$apiUp = netstat -ano | Select-String "127.0.0.1:8000.*LISTENING"
if (!$apiUp) {
  # PHP_CLI_SERVER_WORKERS lets the built-in server answer concurrent API
  # calls instead of queueing them one-by-one (was the slow-feed cause).
  Start-Process -FilePath "cmd.exe" -ArgumentList @('/c', "set PHP_CLI_SERVER_WORKERS=5 && `"$xamppPhp`" artisan serve --host=127.0.0.1 --port=8000") -WorkingDirectory $backend -WindowStyle Hidden -RedirectStandardOutput C:\temp\bizlink-api.log -RedirectStandardError C:\temp\bizlink-api-err.log
  Start-Sleep -Seconds 6
} else {
  Write-Host "   API already running - restart it to pick up multi-worker mode:"
  Write-Host "   Get-Process php | Stop-Process; then re-run this script."
}
Invoke-RestMethod http://127.0.0.1:8000/api/health | ConvertTo-Json

Write-Host "3) Frontend..."
Write-Host "   cd frontend; npm run dev  (http://localhost:5173)"
Write-Host "   Demo logins: demo@bizlink.ph / password123, brand@bizlink.ph / password123"
Write-Host "   Google OAuth needs GOOGLE_CLIENT_ID/SECRET in backend/.env"
