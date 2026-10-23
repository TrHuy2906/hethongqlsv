# HƯỚNG DẪN SAO LƯU VÀ PHỤC HỒI DỮ LIỆU (BACKUP & RESTORE)
**Môn học:** Triển khai và quản trị hệ thống phần mềm  
**Hệ thống:** Quản lý Sinh viên, Đồ án và Thực tập  
**Mục tiêu:** Đảm bảo chỉ số RPO (Recovery Point Objective) và RTO (Recovery Time Objective) ở mức tối ưu.

---

## 1. Nguyên tắc An toàn và Bảo mật Khi Sao lưu

Trong môn học Triển khai và quản trị hệ thống phần mềm, quy trình sao lưu và phục hồi phải tuân thủ nghiêm ngặt các tiêu chuẩn kỹ thuật:
1. **Không làm lộ mật khẩu trên Command Line hoặc Log:**
   - *Không sử dụng* lệnh `mysqldump -pPassword` trực tiếp vì chuỗi mật khẩu sẽ bị hiển thị trong danh sách tiến trình hệ điều hành (`ps aux` hoặc Task Manager) và cảnh báo bảo mật của MySQL.
   - *Giải pháp triển khai:* Sử dụng biến môi trường nội bộ `MYSQL_PWD` bên trong container tạm thời thông qua `docker exec -e MYSQL_PWD=...`.
2. **Đặt tên tệp sao lưu chuẩn hóa theo thời gian:**
   - Tên tệp định dạng: `backups/student_db_backup_YYYYMMDD_HHMMSS.sql`.
   - Tránh việc ghi đè vô ý lên các bản sao lưu cũ.
3. **Kiểm tra tính toàn vẹn trước khi tin tưởng bản backup:**
   - Bản backup hợp lệ phải có kích thước lớn hơn 0 bytes.
   - Phải chứa các câu lệnh `CREATE TABLE`, `INSERT INTO` và kết thúc bằng dòng ghi chú hoàn tất: `-- Dump completed on ...`.
4. **Không thử nghiệm phục hồi đè lên cơ sở dữ liệu đang chạy:**
   - Sử dụng chế độ kiểm thử phục hồi độc lập (`-TestOnly`) trên một database thử nghiệm tạm thời trước khi áp dụng vào production.

---

## 2. Các Công cụ Sao lưu Đã Triển khai Sẵn trong Dự án

Dự án cung cấp đầy đủ cả hai bộ script hỗ trợ cả môi trường **Windows native (PowerShell)** và **Linux / WSL (Bash)**:

| Tác vụ | Script PowerShell (Windows) | Script Bash (Linux / WSL) |
| :--- | :--- | :--- |
| **Sao lưu tự động** | `scripts/backup.ps1` | `scripts/backup.sh` |
| **Phục hồi & Kiểm thử an toàn** | `scripts/restore.ps1` | `scripts/restore.sh` |

---

## 3. Quy trình Thực hiện Sao lưu Dữ liệu (Backup)

### 3.1. Thực hiện trên Windows (PowerShell)
Mở PowerShell tại thư mục dự án và chạy:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup.ps1
```

**Quá trình thực thi thực tế:**
1. Script đọc cấu hình bảo mật từ file `.env`.
2. Kiểm tra container `hethongqlsv_db` có đang chạy hay không.
3. Tạo thư mục `backups/` nếu chưa tồn tại.
4. Gọi `mysqldump` an toàn bên trong container và xuất ra file có timestamp.
5. Kiểm tra mã thoát (Exit code) và kích thước tệp.

**Mẫu kết quả thành công:**
```text
======================================================
[BACKUP] Starting MySQL Backup for 'student_db'...
======================================================
[INFO] DB Container: hethongqlsv_db
[INFO] Backup Output: C:\Users\huyk6\Downloads\New folder\backups\student_db_backup_20261022_230941.sql
[SUCCESS] Backup completed successfully! File size: 18.13 KB
[INFO] Verified integrity: Found '-- Dump completed' in SQL file.
```

### 3.2. Thực hiện trên Linux hoặc WSL (Bash)
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

---

## 4. Kiểm tra Tính Hợp lệ của Bản Sao lưu (Integrity Verification)

Để chứng minh với giảng viên rằng file `.sql` vừa sao lưu là hợp lệ và không bị hỏng, có thể kiểm tra trực tiếp bằng PowerShell:

```powershell
# 1. Kiểm tra kích thước file
Get-Item backups\*.sql | Select-Object Name, Length, LastWriteTime

# 2. Kiểm tra dòng kết thúc Dump
Get-Content backups\student_db_backup_20261022_230941.sql -Tail 5
```
Kết quả phải có dòng:
```sql
-- Dump completed on 2026-10-22 16:09:41
```

---

## 5. Quy trình Kiểm thử Phục hồi An toàn (Isolated Test Restore)

Đây là **yêu cầu bắt buộc trong môn học** để xác minh khả năng phục hồi dữ liệu mà **không gây rủi ro mất mát dữ liệu đang hoạt động**.

Hệ thống hỗ trợ tham số `-TestOnly`:
- Tự động tạo cơ sở dữ liệu tạm thời: `student_db_restore_verify`.
- Nạp toàn bộ dữ liệu từ bản backup vào database tạm thời này.
- Kiểm tra số lượng bảng (đủ 12 bảng) và đếm số lượng sinh viên (`SELECT COUNT(*) FROM student`).
- Tự động dọn dẹp và xóa database tạm thời sau khi xác minh xong.

### Lệnh thực hiện trên Windows PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/restore.ps1 -BackupFile backups\student_db_backup_20261022_230941.sql -TestOnly
```

**Bằng chứng thực nghiệm thu được:**
```text
======================================================
[RESTORE] MySQL Restore Execution
======================================================
[INFO] Mode: TEST ONLY (Safe non-destructive verification)
[INFO] Target Test Database: student_db_restore_verify
[INFO] Creating temporary test database...
[INFO] Restoring dump into 'student_db_restore_verify'...
[INFO] Verifying restored schema and data...
[VERIFY] Restored Tables Count: 12
[VERIFY] Student Records Count: 8
[VERIFY] User Accounts Count: 3
[SUCCESS] Verification passed: Backup dump is 100% valid and fully restorable!
[CLEANUP] Dropped temporary test database 'student_db_restore_verify'.
```

---

## 6. Quy trình Phục hồi Sự cố Thực tế (Disaster Recovery Plan)

Khi hệ thống gặp sự cố nghiêm trọng (ví dụ: dữ liệu bị lỗi, sửa nhầm hoặc cần rollback về phiên bản trước):

### Bước 1: Tạm dừng dịch vụ web để tránh ghi đè dữ liệu mới
```powershell
docker compose stop web
```

### Bước 2: Tạo một bản sao lưu an toàn ngay tại thời điểm hiện tại (Phòng ngừa)
```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup.ps1
```

### Bước 3: Phục hồi chính thức bản backup mong muốn
```powershell
powershell -ExecutionPolicy Bypass -File scripts/restore.ps1 -BackupFile backups\student_db_backup_20261022_230941.sql
```
*(Nếu không truyền cờ `-TestOnly`, script sẽ yêu cầu xác nhận rồi tiến hành phục hồi trực tiếp vào database chính `student_db`).*

### Bước 4: Khởi động lại dịch vụ web và kiểm tra hoạt động
```powershell
docker compose start web
docker compose ps
```
Truy cập [http://localhost:8083](http://localhost:8083) để xác nhận dữ liệu đã được phục hồi đầy đủ.

---

## 7. Thiết lập Lập lịch Sao lưu Tự động (Automated Backup Scheduling)

Để hệ thống tự động sao lưu hàng ngày lúc 01:00 AM trên Windows:

### Tạo tác vụ bằng Windows Task Scheduler (PowerShell Administrator):
```powershell
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `\"C:\Users\huyk6\Downloads\New folder\scripts\backup.ps1`\""
$Trigger = New-ScheduledTaskTrigger -Daily -At "1:00 AM"
Register-ScheduledTask -TaskName "HethongQLSV_DailyBackup" -Action $Action -Trigger $Trigger -Description "Sao lưu CSDL Hệ thống QLSV định kỳ hàng ngày"
```
Khi đó, các bản sao lưu sẽ được tự động tích lũy trong thư mục `backups/` mà không cần người quản trị phải can thiệp thủ công.
