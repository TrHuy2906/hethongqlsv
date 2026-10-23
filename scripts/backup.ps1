# ==============================================================================
# HETHONGQLSV - DATABASE BACKUP SCRIPT (POWERSHELL)
# Mon hoc: Trien khai va quan tri he thong phan mem
# ==============================================================================

[CmdletBinding()]
param (
    [string]$ContainerName = "hethongqlsv_db",
    [string]$DbName = "student_db",
    [string]$DbUser = "root",
    [string]$DbPassword = $env:DB_PASSWORD,
    [string]$BackupDir = ""
)

$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path

# 1. Tu dong doc mat khau tu .env neu chua co trong bien moi truong
if (-not $DbPassword) {
    $envFile = Join-Path $ProjectRoot ".env"
    if (Test-Path $envFile) {
        $envLines = Get-Content $envFile
        foreach ($line in $envLines) {
            if ($line -match "^\s*DB_PASSWORD\s*=\s*(.*)$") {
                $DbPassword = $matches[1].Trim()
                break
            }
        }
    }
}
if (-not $DbPassword) {
    $DbPassword = "rootpassword"
}

# 2. Xac dinh thu muc backup
if (-not $BackupDir) {
    $BackupDir = Join-Path $ProjectRoot "backups"
}
if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "[INFO] Da tao thu muc sao luu: $BackupDir" -ForegroundColor Cyan
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path -Path $BackupDir -ChildPath "${DbName}_backup_${Timestamp}.sql"

Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "BAT DAU SAO LUU CO SO DU LIEU: $DbName" -ForegroundColor Green
Write-Host "Container mục tiêu : $ContainerName" -ForegroundColor White
Write-Host "File đích          : $BackupFile" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Green

$ContainerStatus = docker inspect --format="{{.State.Status}}" $ContainerName 2>$null
if ($ContainerStatus -ne "running") {
    Write-Host "[ERROR] Container '$ContainerName' hien khong chay (Status: $ContainerStatus)" -ForegroundColor Red
    exit 1
}

try {
    # Run mysqldump with MYSQL_PWD env to keep passwords out of process tables
    $cmd = "docker exec -i -e MYSQL_PWD=$DbPassword $ContainerName mysqldump --opt --single-transaction --default-character-set=utf8mb4 -u $DbUser $DbName"
    
    Invoke-Expression $cmd | Out-File -FilePath $BackupFile -Encoding utf8

    if ((Test-Path -Path $BackupFile) -and ((Get-Item $BackupFile).Length -gt 1024)) {
        $FileSizeKb = [math]::Round(((Get-Item $BackupFile).Length / 1KB), 2)
        Write-Host "[SUCCESS] Sao luu thanh cong!" -ForegroundColor Green
        Write-Host "  - File: $BackupFile" -ForegroundColor Cyan
        Write-Host "  - Size: $FileSizeKb KB" -ForegroundColor Cyan
        exit 0
    } else {
        Write-Host "[ERROR] File sao luu bi trong hoac gap su co!" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "[ERROR] Sao luu gap ngoai le: $_" -ForegroundColor Red
    exit 1
}
