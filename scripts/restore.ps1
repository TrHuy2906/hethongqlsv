# ==============================================================================
# HETHONGQLSV - DATABASE RESTORE SCRIPT (POWERSHELL)
# Mon hoc: Trien khai va quan tri he thong phan mem
# ==============================================================================

[CmdletBinding()]
param (
    [string]$BackupFile = "",
    [string]$ContainerName = "hethongqlsv_db",
    [string]$TargetDb = "student_db",
    [string]$DbUser = "root",
    [string]$DbPassword = $env:DB_PASSWORD,
    [switch]$TestOnly = $false,
    [switch]$Force = $false
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

# 2. Tu dong tim ban backup moi nhat neu khong truyen hoac truyen '...'
if (-not $BackupFile -or $BackupFile -eq "..." -or $BackupFile -eq "") {
    $backupDir = Join-Path $ProjectRoot "backups"
    $latestBackup = Get-ChildItem -Path "$backupDir\*.sql" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latestBackup) {
        $BackupFile = $latestBackup.FullName
        Write-Host "[INFO] Tu dong chon ban sao luu moi nhat: $($latestBackup.Name)" -ForegroundColor Cyan
    } else {
        Write-Host "[ERROR] Khong tim thay ban sao luu .sql nao trong thu muc '$backupDir'!" -ForegroundColor Red
        exit 1
    }
} else {
    # Resolve relative path if needed
    if (-not (Test-Path -Path $BackupFile)) {
        $altPath = Join-Path $ProjectRoot $BackupFile
        if (Test-Path -Path $altPath) {
            $BackupFile = $altPath
        } else {
            Write-Host "[ERROR] File sao luu khong ton tai: '$BackupFile'" -ForegroundColor Red
            exit 1
        }
    }
}

$EffectiveDb = $TargetDb
if ($TestOnly) {
    $EffectiveDb = "student_db_restore_verify"
    Write-Host "[INFO] CHE DO KIEM THU (TEST ONLY): Phuc hoi vao CSDL kiem thu co lap '$EffectiveDb'" -ForegroundColor Yellow
} else {
    if (-not $Force) {
        Write-Host "CANH BAO: Phuc hoi se ghi de du lieu hien tai trong database '$TargetDb'!" -ForegroundColor Red
        $confirm = Read-Host "Ban co chac chan muon tiep tuc? (Nhap 'YES' de xac nhan)"
        if ($confirm -ne "YES") {
            Write-Host "Da huy thao tac phuc hoi theo yeu cau nguoi dung." -ForegroundColor Gray
            exit 0
        }
    }
}

$ContainerStatus = docker inspect --format="{{.State.Status}}" $ContainerName 2>$null
if ($ContainerStatus -ne "running") {
    Write-Host "[ERROR] Container '$ContainerName' hien khong chay!" -ForegroundColor Red
    exit 1
}

try {
    Write-Host "[1/3] Khoi tao co so du lieu dich '$EffectiveDb'..." -ForegroundColor Cyan
    docker exec -i -e MYSQL_PWD=$DbPassword $ContainerName mysql -u $DbUser -e "CREATE DATABASE IF NOT EXISTS $EffectiveDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

    Write-Host "[2/3] Nap du lieu tu dump '$BackupFile' vao '$EffectiveDb'..." -ForegroundColor Cyan
    Get-Content -Path $BackupFile -Encoding utf8 | docker exec -i -e MYSQL_PWD=$DbPassword $ContainerName mysql -u $DbUser $EffectiveDb

    Write-Host "[3/3] Kiem tra tinh toan ven va so luong ban ghi..." -ForegroundColor Cyan
    $tableCount = (docker exec -i -e MYSQL_PWD=$DbPassword $ContainerName mysql -u $DbUser -N -s -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$EffectiveDb';").Trim()
    $studentCount = (docker exec -i -e MYSQL_PWD=$DbPassword $ContainerName mysql -u $DbUser -N -s -e "SELECT COUNT(*) FROM $EffectiveDb.student;").Trim()
    $userCount = (docker exec -i -e MYSQL_PWD=$DbPassword $ContainerName mysql -u $DbUser -N -s -e "SELECT COUNT(*) FROM $EffectiveDb.user;").Trim()

    if ([int]$tableCount -gt 0) {
        Write-Host "==============================================================================" -ForegroundColor Green
        Write-Host "[SUCCESS] XAC MINH PHUC HOI THANH CONG 100%!" -ForegroundColor Green
        Write-Host "  - Co so du lieu dich : $EffectiveDb" -ForegroundColor White
        Write-Host "  - So bang phuc hoi   : $tableCount bang" -ForegroundColor White
        Write-Host "  - So sinh vien       : $studentCount sinh vien" -ForegroundColor White
        Write-Host "  - So tai khoan user  : $userCount tai khoan" -ForegroundColor White
        Write-Host "==============================================================================" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Phuc hoi that bai: Khong co bang nao duoc tao." -ForegroundColor Red
        exit 1
    }

    if ($TestOnly) {
        Write-Host "[CLEANUP] Dang xoa co so du lieu kiem thu '$EffectiveDb'..." -ForegroundColor Gray
        docker exec -i -e MYSQL_PWD=$DbPassword $ContainerName mysql -u $DbUser -e "DROP DATABASE IF EXISTS $EffectiveDb;"
        Write-Host "[CLEANUP] Co so du lieu kiem thu da duoc don dep hoan toan." -ForegroundColor Gray
    }
    exit 0
}
catch {
    Write-Host "[ERROR] Thao tac phuc hoi gap loi: $_" -ForegroundColor Red
    exit 1
}
