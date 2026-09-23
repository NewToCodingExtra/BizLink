# BizLink stop script: Frees ports used by Laravel, Vite, MySQL, and Meilisearch
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"

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
          Write-Host "   Port $port PID $procId already freed"
        }
      }
    }
  }
}

Write-Host "1) Stopping Laravel, Vite, and Meilisearch servers..."
Stop-ListenersOnPort -Ports @(8000, 5173, 5174, 5175, 7700)

Write-Host "2) Stopping MySQL server (Port 3307)..."
Stop-ListenersOnPort -Ports @(3307)

$hot = Join-Path $backend "public\hot"
if (Test-Path $hot) {
  Remove-Item $hot -Force
  Write-Host "3) Removed stale backend/public/hot"
}

Write-Host "All BizLink services stopped successfully."
