# Cursor Chat History Sync Script
# Run in PowerShell: .\scripts\sync_cursor_chat.ps1
#
# This script syncs Cursor chat history between devices using a cloud folder
# Usage:
#   - First time: Set your cloud folder path (Google Drive, OneDrive, etc.)
#   - Run this script to backup/restore chat history

# Set output encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cursor Chat History Sync" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cursor chat history file path
$cursorAppData = "$env:APPDATA\Cursor"
$chatHistoryFile = "$cursorAppData\User\globalStorage\state.vscdb"
$chatHistoryBackup = "$cursorAppData\User\globalStorage\state.vscdb.backup"

# Check if Cursor chat history exists
if (-not (Test-Path $chatHistoryFile)) {
    Write-Host "Error: Cursor chat history file not found." -ForegroundColor Red
    Write-Host "Path: $chatHistoryFile" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please make sure Cursor is installed and you have used the chat feature." -ForegroundColor Yellow
    exit 1
}

# Get cloud folder path from user or config
$configFile = "$PSScriptRoot\cursor_sync_config.txt"
$cloudFolder = $null

if (Test-Path $configFile) {
    $cloudFolder = Get-Content $configFile -Raw | ForEach-Object { $_.Trim() }
    Write-Host "Using saved cloud folder: $cloudFolder" -ForegroundColor Gray
} else {
    Write-Host "First time setup: Please specify your cloud sync folder" -ForegroundColor Yellow
    Write-Host "Examples:" -ForegroundColor Gray
    Write-Host "  - Google Drive: C:\Users\$env:USERNAME\Google Drive\Cursor_Sync" -ForegroundColor Gray
    Write-Host "  - OneDrive: C:\Users\$env:USERNAME\OneDrive\Cursor_Sync" -ForegroundColor Gray
    Write-Host "  - Dropbox: C:\Users\$env:USERNAME\Dropbox\Cursor_Sync" -ForegroundColor Gray
    Write-Host ""
    $cloudFolder = Read-Host "Enter cloud folder path"
    
    # Create folder if it doesn't exist
    if (-not (Test-Path $cloudFolder)) {
        New-Item -ItemType Directory -Path $cloudFolder -Force | Out-Null
        Write-Host "Created folder: $cloudFolder" -ForegroundColor Green
    }
    
    # Save config
    $cloudFolder | Out-File $configFile -Encoding UTF8
    Write-Host "Configuration saved." -ForegroundColor Green
}

Write-Host ""

# Cloud sync file path
$cloudSyncFile = "$cloudFolder\cursor_chat_history.vscdb"
$cloudSyncBackup = "$cloudFolder\cursor_chat_history_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').vscdb"

# Menu
Write-Host "Select an action:" -ForegroundColor Cyan
Write-Host "  1. Backup (Copy local → cloud)" -ForegroundColor White
Write-Host "  2. Restore (Copy cloud → local)" -ForegroundColor White
Write-Host "  3. Show file info" -ForegroundColor White
Write-Host "  4. Change cloud folder" -ForegroundColor White
Write-Host "  5. Exit" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Enter choice (1-5)"

switch ($choice) {
    "1" {
        # Backup: Local → Cloud
        Write-Host ""
        Write-Host "Backing up chat history to cloud..." -ForegroundColor Yellow
        
        # Create backup of current cloud file
        if (Test-Path $cloudSyncFile) {
            Copy-Item $cloudSyncFile $cloudSyncBackup -Force
            Write-Host "Previous cloud backup saved: $cloudSyncBackup" -ForegroundColor Gray
        }
        
        # Copy local file to cloud
        Copy-Item $chatHistoryFile $cloudSyncFile -Force
        Write-Host "Chat history backed up successfully!" -ForegroundColor Green
        Write-Host "Cloud file: $cloudSyncFile" -ForegroundColor Gray
        
        # Show file size
        $fileSize = (Get-Item $cloudSyncFile).Length / 1MB
        Write-Host "File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray
    }
    
    "2" {
        # Restore: Cloud → Local
        Write-Host ""
        
        if (-not (Test-Path $cloudSyncFile)) {
            Write-Host "Error: No backup found in cloud folder." -ForegroundColor Red
            Write-Host "Path: $cloudSyncFile" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Please backup first (option 1) or check your cloud folder path." -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "Restoring chat history from cloud..." -ForegroundColor Yellow
        Write-Host "Warning: This will replace your local chat history!" -ForegroundColor Red
        
        $confirm = Read-Host "Continue? (Y/N)"
        if ($confirm -ne "Y" -and $confirm -ne "y") {
            Write-Host "Restore cancelled." -ForegroundColor Yellow
            exit 0
        }
        
        # Create backup of current local file
        if (Test-Path $chatHistoryFile) {
            Copy-Item $chatHistoryFile $chatHistoryBackup -Force
            Write-Host "Local backup created: $chatHistoryBackup" -ForegroundColor Gray
        }
        
        # Copy cloud file to local
        Copy-Item $cloudSyncFile $chatHistoryFile -Force
        Write-Host "Chat history restored successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Please restart Cursor to see the restored chat history." -ForegroundColor Yellow
    }
    
    "3" {
        # Show file info
        Write-Host ""
        Write-Host "=== Local Chat History ===" -ForegroundColor Cyan
        if (Test-Path $chatHistoryFile) {
            $localFile = Get-Item $chatHistoryFile
            Write-Host "Path: $chatHistoryFile" -ForegroundColor White
            Write-Host "Size: $([math]::Round($localFile.Length / 1MB, 2)) MB" -ForegroundColor White
            Write-Host "Last Modified: $($localFile.LastWriteTime)" -ForegroundColor White
        } else {
            Write-Host "File not found" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "=== Cloud Backup ===" -ForegroundColor Cyan
        if (Test-Path $cloudSyncFile) {
            $cloudFile = Get-Item $cloudSyncFile
            Write-Host "Path: $cloudSyncFile" -ForegroundColor White
            Write-Host "Size: $([math]::Round($cloudFile.Length / 1MB, 2)) MB" -ForegroundColor White
            Write-Host "Last Modified: $($cloudFile.LastWriteTime)" -ForegroundColor White
        } else {
            Write-Host "No backup found" -ForegroundColor Yellow
        }
    }
    
    "4" {
        # Change cloud folder
        Write-Host ""
        Write-Host "Current cloud folder: $cloudFolder" -ForegroundColor Gray
        Write-Host ""
        $newFolder = Read-Host "Enter new cloud folder path"
        
        if (-not (Test-Path $newFolder)) {
            New-Item -ItemType Directory -Path $newFolder -Force | Out-Null
            Write-Host "Created folder: $newFolder" -ForegroundColor Green
        }
        
        $newFolder | Out-File $configFile -Encoding UTF8
        Write-Host "Cloud folder updated!" -ForegroundColor Green
    }
    
    "5" {
        Write-Host "Exiting..." -ForegroundColor Gray
        exit 0
    }
    
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green

