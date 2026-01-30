# Cursor Settings Sync Script
# Run in PowerShell: .\scripts\sync_cursor_all.ps1
#
# This script syncs Cursor settings, keybindings, snippets, and extensions between devices
# Note: Chat history is excluded due to large file size
# Usage:
#   - First time: Set your cloud folder path (Google Drive, OneDrive, etc.)
#   - Run this script to backup/restore Cursor settings

# Set output encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cursor Settings Sync" -ForegroundColor Cyan
Write-Host "  (Settings + Keybindings + Snippets + Extensions)" -ForegroundColor Cyan
Write-Host "  (Chat History excluded - use sync_cursor_chat.ps1)" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cursor paths
$cursorAppData = "$env:APPDATA\Cursor"
$cursorUserFolder = "$cursorAppData\User"

# Files and folders to sync
$syncItems = @{
    "Settings" = @{
        "Path" = "$cursorUserFolder\settings.json"
        "CloudPath" = "settings.json"
        "Required" = $false
        "Description" = "Cursor settings"
    }
    "Keybindings" = @{
        "Path" = "$cursorUserFolder\keybindings.json"
        "CloudPath" = "keybindings.json"
        "Required" = $false
        "Description" = "Keyboard shortcuts"
    }
    "Snippets" = @{
        "Path" = "$cursorUserFolder\snippets"
        "CloudPath" = "snippets"
        "Required" = $false
        "Description" = "Code snippets"
        "IsDirectory" = $true
    }
    # ChatHistory excluded due to large file size
    # "ChatHistory" = @{
    #     "Path" = "$cursorUserFolder\globalStorage\state.vscdb"
    #     "CloudPath" = "chat_history.vscdb"
    #     "Required" = $false
    #     "Description" = "Chat conversation history"
    # }
    "Extensions" = @{
        "Path" = "$cursorUserFolder\extensions"
        "CloudPath" = "extensions_list.txt"
        "Required" = $false
        "Description" = "Installed extensions list"
        "IsDirectory" = $true
        "IsList" = $true
    }
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

# Function to get extension list
function Get-ExtensionList {
    $extensionsPath = "$cursorUserFolder\extensions"
    if (-not (Test-Path $extensionsPath)) {
        return @()
    }
    
    $extensions = @()
    Get-ChildItem -Path $extensionsPath -Directory | ForEach-Object {
        $packageJson = Join-Path $_.FullName "package.json"
        if (Test-Path $packageJson) {
            $package = Get-Content $packageJson | ConvertFrom-Json
            $extensions += "$($package.publisher).$($package.name)"
        }
    }
    return $extensions
}

# Function to install extensions from list
function Install-ExtensionsFromList {
    param([string]$extensionsListFile)
    
    if (-not (Test-Path $extensionsListFile)) {
        Write-Host "Extension list file not found." -ForegroundColor Yellow
        return
    }
    
    $extensions = Get-Content $extensionsListFile
    Write-Host "Installing extensions..." -ForegroundColor Yellow
    
    foreach ($ext in $extensions) {
        if ($ext.Trim() -ne "") {
            Write-Host "  Installing: $ext" -ForegroundColor Gray
            & cursor --install-extension $ext 2>&1 | Out-Null
        }
    }
    
    Write-Host "Extensions installation completed." -ForegroundColor Green
}

# Menu
Write-Host "Select an action:" -ForegroundColor Cyan
Write-Host "  1. Backup All (Copy local → cloud)" -ForegroundColor White
Write-Host "  2. Restore All (Copy cloud → local)" -ForegroundColor White
Write-Host "  3. Backup Selected Items" -ForegroundColor White
Write-Host "  4. Restore Selected Items" -ForegroundColor White
Write-Host "  5. Show sync status" -ForegroundColor White
Write-Host "  6. Change cloud folder" -ForegroundColor White
Write-Host "  7. Exit" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Enter choice (1-7)"

switch ($choice) {
    "1" {
        # Backup All
        Write-Host ""
        Write-Host "Backing up all Cursor data to cloud..." -ForegroundColor Yellow
        Write-Host ""
        
        $backupCount = 0
        foreach ($itemName in $syncItems.Keys) {
            $item = $syncItems[$itemName]
            $localPath = $item.Path
            $cloudPath = Join-Path $cloudFolder $item.CloudPath
            
            if (-not (Test-Path $localPath)) {
                Write-Host "[SKIP] $itemName - Not found" -ForegroundColor Gray
                continue
            }
            
            try {
                if ($item.IsDirectory) {
                    if ($item.IsList) {
                        # For extensions, save list only
                        $extensions = Get-ExtensionList
                        $extensions | Out-File $cloudPath -Encoding UTF8
                        Write-Host "[OK] $itemName - Extension list saved ($($extensions.Count) extensions)" -ForegroundColor Green
                    } else {
                        # Copy directory
                        if (Test-Path $cloudPath) {
                            Remove-Item $cloudPath -Recurse -Force
                        }
                        Copy-Item $localPath $cloudPath -Recurse -Force
                        Write-Host "[OK] $itemName - Directory backed up" -ForegroundColor Green
                    }
                } else {
                    # Copy file
                    Copy-Item $localPath $cloudPath -Force
                    $fileSize = (Get-Item $cloudPath).Length / 1KB
                    Write-Host "[OK] $itemName - Backed up ($([math]::Round($fileSize, 2)) KB)" -ForegroundColor Green
                }
                $backupCount++
            } catch {
                Write-Host "[ERROR] $itemName - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "Backup completed! ($backupCount items)" -ForegroundColor Green
    }
    
    "2" {
        # Restore All
        Write-Host ""
        Write-Host "Restoring all Cursor data from cloud..." -ForegroundColor Yellow
        Write-Host "Warning: This will replace your local settings!" -ForegroundColor Red
        
        $confirm = Read-Host "Continue? (Y/N)"
        if ($confirm -ne "Y" -and $confirm -ne "y") {
            Write-Host "Restore cancelled." -ForegroundColor Yellow
            exit 0
        }
        
        Write-Host ""
        Write-Host "Please close Cursor before restoring. Press Enter when ready..." -ForegroundColor Yellow
        Read-Host
        
        $restoreCount = 0
        foreach ($itemName in $syncItems.Keys) {
            $item = $syncItems[$itemName]
            $localPath = $item.Path
            $cloudPath = Join-Path $cloudFolder $item.CloudPath
            
            if (-not (Test-Path $cloudPath)) {
                Write-Host "[SKIP] $itemName - No backup found" -ForegroundColor Gray
                continue
            }
            
            try {
                # Create parent directory if needed
                $parentDir = Split-Path $localPath -Parent
                if (-not (Test-Path $parentDir)) {
                    New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
                }
                
                if ($item.IsDirectory) {
                    if ($item.IsList) {
                        # For extensions, install from list
                        Install-ExtensionsFromList $cloudPath
                        Write-Host "[OK] $itemName - Extensions restored" -ForegroundColor Green
                    } else {
                        # Copy directory
                        if (Test-Path $localPath) {
                            Remove-Item $localPath -Recurse -Force
                        }
                        Copy-Item $cloudPath $localPath -Recurse -Force
                        Write-Host "[OK] $itemName - Directory restored" -ForegroundColor Green
                    }
                } else {
                    # Copy file
                    Copy-Item $cloudPath $localPath -Force
                    Write-Host "[OK] $itemName - Restored" -ForegroundColor Green
                }
                $restoreCount++
            } catch {
                Write-Host "[ERROR] $itemName - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "Restore completed! ($restoreCount items)" -ForegroundColor Green
        Write-Host "Please restart Cursor to apply changes." -ForegroundColor Yellow
    }
    
    "3" {
        # Backup Selected
        Write-Host ""
        Write-Host "Select items to backup:" -ForegroundColor Cyan
        $index = 1
        $itemList = @()
        foreach ($itemName in $syncItems.Keys) {
            $item = $syncItems[$itemName]
            $exists = Test-Path $item.Path
            $status = if ($exists) { "[EXISTS]" } else { "[NOT FOUND]" }
            Write-Host "  $index. $itemName $status - $($item.Description)" -ForegroundColor $(if ($exists) { "White" } else { "Gray" })
            $itemList += $itemName
            $index++
        }
        Write-Host ""
        $selected = Read-Host "Enter item numbers (comma-separated, e.g., 1,2,3)"
        
        $selectedIndices = $selected -split ',' | ForEach-Object { [int]$_.Trim() - 1 }
        
        Write-Host ""
        foreach ($idx in $selectedIndices) {
            if ($idx -ge 0 -and $idx -lt $itemList.Count) {
                $itemName = $itemList[$idx]
                $item = $syncItems[$itemName]
                $localPath = $item.Path
                $cloudPath = Join-Path $cloudFolder $item.CloudPath
                
                if (-not (Test-Path $localPath)) {
                    Write-Host "[SKIP] $itemName - Not found" -ForegroundColor Yellow
                    continue
                }
                
                try {
                    if ($item.IsDirectory) {
                        if ($item.IsList) {
                            $extensions = Get-ExtensionList
                            $extensions | Out-File $cloudPath -Encoding UTF8
                            Write-Host "[OK] $itemName - Backed up" -ForegroundColor Green
                        } else {
                            if (Test-Path $cloudPath) {
                                Remove-Item $cloudPath -Recurse -Force
                            }
                            Copy-Item $localPath $cloudPath -Recurse -Force
                            Write-Host "[OK] $itemName - Backed up" -ForegroundColor Green
                        }
                    } else {
                        Copy-Item $localPath $cloudPath -Force
                        Write-Host "[OK] $itemName - Backed up" -ForegroundColor Green
                    }
                } catch {
                    Write-Host "[ERROR] $itemName - $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
    }
    
    "4" {
        # Restore Selected
        Write-Host ""
        Write-Host "Select items to restore:" -ForegroundColor Cyan
        $index = 1
        $itemList = @()
        foreach ($itemName in $syncItems.Keys) {
            $item = $syncItems[$itemName]
            $cloudPath = Join-Path $cloudFolder $item.CloudPath
            $exists = Test-Path $cloudPath
            $status = if ($exists) { "[EXISTS]" } else { "[NOT FOUND]" }
            Write-Host "  $index. $itemName $status - $($item.Description)" -ForegroundColor $(if ($exists) { "White" } else { "Gray" })
            $itemList += $itemName
            $index++
        }
        Write-Host ""
        $selected = Read-Host "Enter item numbers (comma-separated, e.g., 1,2,3)"
        
        $confirm = Read-Host "This will replace local files. Continue? (Y/N)"
        if ($confirm -ne "Y" -and $confirm -ne "y") {
            Write-Host "Restore cancelled." -ForegroundColor Yellow
            exit 0
        }
        
        $selectedIndices = $selected -split ',' | ForEach-Object { [int]$_.Trim() - 1 }
        
        Write-Host ""
        Write-Host "Please close Cursor before restoring. Press Enter when ready..." -ForegroundColor Yellow
        Read-Host
        
        foreach ($idx in $selectedIndices) {
            if ($idx -ge 0 -and $idx -lt $itemList.Count) {
                $itemName = $itemList[$idx]
                $item = $syncItems[$itemName]
                $localPath = $item.Path
                $cloudPath = Join-Path $cloudFolder $item.CloudPath
                
                if (-not (Test-Path $cloudPath)) {
                    Write-Host "[SKIP] $itemName - No backup found" -ForegroundColor Yellow
                    continue
                }
                
                try {
                    $parentDir = Split-Path $localPath -Parent
                    if (-not (Test-Path $parentDir)) {
                        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
                    }
                    
                    if ($item.IsDirectory) {
                        if ($item.IsList) {
                            Install-ExtensionsFromList $cloudPath
                            Write-Host "[OK] $itemName - Restored" -ForegroundColor Green
                        } else {
                            if (Test-Path $localPath) {
                                Remove-Item $localPath -Recurse -Force
                            }
                            Copy-Item $cloudPath $localPath -Recurse -Force
                            Write-Host "[OK] $itemName - Restored" -ForegroundColor Green
                        }
                    } else {
                        Copy-Item $cloudPath $localPath -Force
                        Write-Host "[OK] $itemName - Restored" -ForegroundColor Green
                    }
                } catch {
                    Write-Host "[ERROR] $itemName - $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
    }
    
    "5" {
        # Show sync status
        Write-Host ""
        Write-Host "=== Sync Status ===" -ForegroundColor Cyan
        Write-Host ""
        
        foreach ($itemName in $syncItems.Keys) {
            $item = $syncItems[$itemName]
            $localPath = $item.Path
            $cloudPath = Join-Path $cloudFolder $item.CloudPath
            
            Write-Host "$itemName ($($item.Description)):" -ForegroundColor White
            
            # Local status
            if (Test-Path $localPath) {
                if ($item.IsDirectory) {
                    $localInfo = Get-ChildItem $localPath -Recurse -ErrorAction SilentlyContinue | Measure-Object
                    Write-Host "  Local: EXISTS ($($localInfo.Count) items)" -ForegroundColor Green
                } else {
                    $localSize = (Get-Item $localPath).Length / 1KB
                    $localDate = (Get-Item $localPath).LastWriteTime
                    Write-Host "  Local: EXISTS ($([math]::Round($localSize, 2)) KB, Modified: $($localDate.ToString('yyyy-MM-dd HH:mm')))" -ForegroundColor Green
                }
            } else {
                Write-Host "  Local: NOT FOUND" -ForegroundColor Red
            }
            
            # Cloud status
            if (Test-Path $cloudPath) {
                if ($item.IsDirectory) {
                    $cloudInfo = Get-ChildItem $cloudPath -Recurse -ErrorAction SilentlyContinue | Measure-Object
                    Write-Host "  Cloud: EXISTS ($($cloudInfo.Count) items)" -ForegroundColor Green
                } else {
                    $cloudSize = (Get-Item $cloudPath).Length / 1KB
                    $cloudDate = (Get-Item $cloudPath).LastWriteTime
                    Write-Host "  Cloud: EXISTS ($([math]::Round($cloudSize, 2)) KB, Modified: $($cloudDate.ToString('yyyy-MM-dd HH:mm')))" -ForegroundColor Green
                }
            } else {
                Write-Host "  Cloud: NOT FOUND" -ForegroundColor Yellow
            }
            
            Write-Host ""
        }
    }
    
    "6" {
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
    
    "7" {
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

