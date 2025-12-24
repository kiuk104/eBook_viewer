# Local Server Start Script
# Run in PowerShell: .\start_server.ps1

# Set output encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  eBook Viewer Local Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check current directory
$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Gray
Write-Host ""

# Check Python installation
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python version: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Python is not installed." -ForegroundColor Red
    Write-Host "Please install Python or use another method." -ForegroundColor Yellow
    exit 1
}

# Port configuration
$port = 8000
Write-Host "Server port: $port" -ForegroundColor Yellow
Write-Host ""

# Check if port is in use
$portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "Warning: Port $port is already in use." -ForegroundColor Yellow
    Write-Host "Do you want to use a different port? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "Y" -or $response -eq "y") {
        $port = Read-Host "Enter the port number to use"
    } else {
        Write-Host "Using existing port. Conflicts may occur." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open the following URL in your browser:" -ForegroundColor Green
Write-Host "  http://localhost:$port/ebook_viewer.html" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host ""
Write-Host "Press Ctrl + C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start server
python -m http.server $port

