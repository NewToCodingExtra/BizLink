# BuseLink dev startup: MySQL 3307 (isolated) + Laravel API + Vite frontend
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

Write-Host "1) MySQL 3307 (C:\temp\buselink-mysql)..."
$listening = netstat -ano | Select-String "127.0.0.1:3307.*LISTENING"
if (!$listening) {
  Start-Process -FilePath "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" -ArgumentList "--datadir=C:\temp\buselink-mysql\data", "--port=3307", "--mysqlx-port=33070", "--bind-address=127.0.0.1", "--server-id=99", "--log-error=C:\temp\buselink-mysql\error.log" -WindowStyle Hidden
  Start-Sleep -Seconds 8
}
netstat -ano | Select-String "3307" | Select-Object -First 3

Write-Host "2) Laravel API on :8000..."
$apiUp = netstat -ano | Select-String "127.0.0.1:8000.*LISTENING"
if (!$apiUp) {
  Start-Process -FilePath "C:\xampp\php\php.exe" -ArgumentList "artisan", "serve", "--host=127.0.0.1", "--port=8000" -WorkingDirectory $backend -WindowStyle Hidden -RedirectStandardOutput C:\temp\buselink-api.log -RedirectStandardError C:\temp\buselink-api-err.log
  Start-Sleep -Seconds 6
}
Invoke-RestMethod http://127.0.0.1:8000/api/health | ConvertTo-Json

Write-Host "3) Frontend..."
Write-Host "   cd frontend; npm run dev  (http://localhost:5173)"
Write-Host "   Demo logins: demo@buselink.ph / password123, brand@buselink.ph / password123"
Write-Host "   Google OAuth needs GOOGLE_CLIENT_ID/SECRET in backend/.env"
