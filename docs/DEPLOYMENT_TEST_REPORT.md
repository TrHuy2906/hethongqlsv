# BÁO CÁO KẾT QUẢ KIỂM THỬ VẬN HÀNH HỆ THỐNG (DEPLOYMENT TEST REPORT)
**Môn học:** Triển khai và quản trị hệ thống phần mềm  
**Hệ thống:** Hệ thống Quản lý Sinh viên, Đồ án và Thực tập tốt nghiệp  
**Thời gian thực hiện:** Ngày 22 tháng 10 năm 2026  
**Môi trường thử nghiệm:** Windows 10/11 x64, Docker Desktop (WSL2 Engine), PowerShell 5.1/7+

---

## 1. Mục tiêu và Phạm vi Kiểm thử

Báo cáo này ghi nhận kết quả kiểm thử vận hành thực tế (Operational Acceptance Testing - OAT) nhằm phục vụ công tác nghiệm thu môn học Triển khai và quản trị hệ thống phần mềm.

Các nội dung được kiểm thử thực tế và thu thập bằng chứng gồm:
1. Tính sẵn sàng của hạ tầng Docker và Docker Compose.
2. Khả năng định tuyến và an toàn của Nginx Reverse Proxy.
3. Tính toàn vẹn và bền vững của Cơ sở dữ liệu MySQL 8.0.
4. Cơ chế Sao lưu (Backup) tự động và Phục hồi (Restore) cô lập an toàn.
5. Tính sẵn sàng của chuỗi công cụ Giám sát (Prometheus) và Ghi log tập trung (Loki / Promtail / Grafana).
6. Tính đúng đắn của logic nghiệp vụ và phân quyền người dùng qua giao diện Web.

---

## 2. Bảng Tổng Hợp Kết Quả Kiểm Thử (Executive Summary)

| STT | Phân tầng Kiểm thử | Tổng số ca kiểm thử | Số ca ĐẠT (PASS) | Tỷ lệ thành công | Đánh giá |
| :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | Hạ tầng Container & Mạng Docker | 8 | 8 | **100.0%** | Xuất sắc |
| 2 | Reverse Proxy Nginx & Routing | 6 | 6 | **100.0%** | Xuất sắc |
| 3 | Quản trị CSDL & Tính bền vững Data | 12 | 12 | **100.0%** | Xuất sắc |
| 4 | Sao lưu và Phục hồi Dữ liệu | 4 | 4 | **100.0%** | Xuất sắc |
| 5 | Giám sát (Prometheus / Grafana / Loki) | 6 | 6 | **100.0%** | Xuất sắc |
| 6 | Kiểm thử Nghiệp vụ Giao diện (UI E2E) | 46 | 46 | **100.0%** | Xuất sắc |
| 7 | Kiểm thử Độc lập (Independent Audit) | 53 | 53 | **100.0%** | Xuất sắc |
| **TỔNG CỘNG** | **Toàn bộ hệ thống** | **135** | **135** | **100.0%** | **SẴN SÀNG NGHIỆM THU** |

---

## 3. Bằng chứng Chi tiết Từng Phân tầng Kiểm thử

### 3.1. Tầng 1: Hạ tầng Container và Healthcheck
- **Lệnh kiểm tra:** `docker compose ps`
- **Bằng chứng thu thập:**
  - 8/8 containers đều trong trạng thái `Up`.
  - Container `hethongqlsv_db` đạt trạng thái `healthy` qua câu lệnh `mysqladmin ping`.
  - Container `hethongqlsv_web` khởi động an toàn sau khi database sẵn sàng.
  - Tên container, tên network và volume hoàn toàn đồng nhất với tài liệu thiết kế.

### 3.2. Tầng 2: Nginx Reverse Proxy và Định tuyến Mạng
- **Cổng tiếp nhận:** `http://localhost:8083`
- **Bằng chứng thu thập:**
  - Nginx chuyển tiếp chính xác mọi request vào `web:5000`.
  - Giao diện đăng nhập nạp đầy đủ CSS/JS với mã phản hồi `HTTP 200 OK`.
  - Chuyển hướng người dùng chưa đăng nhập về trang `/login` với mã `HTTP 302 Found`.
  - Kích thước upload lớn nhất hỗ trợ đến 16MB.

### 3.3. Tầng 3: Cơ sở dữ liệu và Tính bền vững
- **Bằng chứng xác minh cấu trúc 12 bảng:**
  ```text
  [bomon, chuyennganh, diem_do_an, do_an, hoi_dong, khoa, lecturer, lop, nienkhoa, student, thuc_tap, user]
  ```
- **Bằng chứng về phân quyền và trạng thái tài khoản:**
  - Bảng `user` được bổ sung trường `status` (`HoatDong`, `Khoa`) và `full_name`.
  - Khóa ngoại liên kết toàn vẹn: Xóa một đồ án đã được xử lý xóa cascade điểm liên quan trong bảng `diem_do_an`, không phát sinh ngoại lệ Database Error.
- **Bằng chứng kiểm thử tính bền vững dữ liệu:**
  - Dữ liệu 8 sinh viên và 3 tài khoản mẫu được lưu trữ trong Docker Volume `hethongqlsv_db_data`.
  - Thực hiện restart container `hethongqlsv_db` và rebuild container `hethongqlsv_web` -> 100% dữ liệu vẫn nguyên vẹn.

### 3.4. Tầng 4: Sao lưu và Phục hồi Dữ liệu (Backup & Test Restore)
- **Kiểm thử Sao lưu tự động:**
  - Script: `scripts/backup.ps1`
  - Kết quả: Xuất file `backups/student_db_backup_20261022_230941.sql` (kích thước: 18.13 KB).
  - Không làm lộ mật khẩu ra màn hình console nhờ biến môi trường nội bộ `MYSQL_PWD`.
  - Header và footer kiểm chứng: Chứa `-- Dump completed on 2026-10-22 16:09:41`.
- **Kiểm thử Phục hồi Cô lập Không phá hủy (`-TestOnly`):**
  - Script: `scripts/restore.ps1 -BackupFile ... -TestOnly`
  - Bằng chứng thực thi:
    ```text
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
  - Cơ sở dữ liệu chính `student_db` không hề bị ảnh hưởng trong suốt quá trình thử nghiệm.

### 3.5. Tầng 5: Giám sát và Ghi log Tập trung
- **Kiểm thử Prometheus:**
  - Endpoint `http://localhost:9092/api/v1/targets` phản hồi:
    - Target `web:5000` (`flask_app`): Trạng thái **UP** (Health: Green).
    - Target `localhost:9090` (`prometheus`): Trạng thái **UP** (Health: Green).
- **Kiểm thử Loki & Promtail:**
  - Loki API `http://localhost:3102/ready` phản hồi: `ready`.
  - Promtail thu thập luồng log từ các container `hethongqlsv_*` và chuyển giao thành công về Loki.
- **Kiểm thử Grafana Dashboard:**
  - URL: `http://localhost:3002` (User: `admin` / Password: `admin`).
  - Nạp tự động qua file Provisioning.
  - Dashboard: **"Hệ thống Quản lý Sinh viên - Giám sát Tổng thể"** (UID: `as2r56`).
  - Cả 6 panel (Flask Health, Scrape Status, Total Requests, HTTP Code Distribution, Rate by Endpoint, Live Logs) đều nhận số liệu thực tế từ hệ thống.

### 3.6. Tầng 6: Kiểm thử Tự động Nghiệp vụ và Giao diện Người dùng
Hệ thống đã trải qua 2 bộ kiểm thử tự động toàn diện:
1. **Bộ kiểm thử `run_functional_ui_test.py` (46 ca kiểm thử):**
   - Đăng nhập/Đăng xuất theo từng vai trò (Quản trị viên, Giảng viên, Sinh viên): 100% PASS.
   - Thao tác CRUD Sinh viên (Thêm, Sửa, Lọc theo lớp, Xóa): 100% PASS.
   - Thao tác CRUD Giảng viên (Thêm, Sửa, Gán khoa bộ môn): 100% PASS.
   - Thao tác CRUD Đồ án và Nhập điểm hội đồng: 100% PASS.
   - Thao tác CRUD Quản lý thực tập tốt nghiệp: 100% PASS.
   - Quản lý tài khoản, đồng bộ họ tên và đổi trạng thái Hoạt động / Khóa: 100% PASS.
   - **Kết quả:** 46/46 PASS (100.0%).
2. **Bộ kiểm thử độc lập `independent_audit_test.py` (53 ca kiểm thử):**
   - Rà soát tính đúng đắn mã phản hồi HTTP, định dạng dữ liệu trả về, bảo vệ truy cập trái quyền và tính toàn vẹn cơ sở dữ liệu.
   - **Kết quả:** 53/53 PASS (100.0%).

---

## 4. Kết Luận và Đánh Giá Nghiệm Thu

Hệ thống Quản lý Sinh viên đã hoàn thành xuất sắc toàn bộ các mục tiêu đặt ra cho môn học **Triển khai và quản trị hệ thống phần mềm**:
- Vận hành hoàn toàn tự động trên nền tảng Docker & Docker Compose.
- Đáp ứng đầy đủ các tiêu chuẩn về an toàn dữ liệu, tính bền vững qua Named Volumes.
- Quy trình sao lưu và phục hồi dữ liệu được tự động hóa và có bằng chứng xác minh độc lập.
- Hệ thống quan sát (Observability) hoàn chỉnh gồm cả Metrics thời gian thực và Centralized Logging.
- Toàn bộ 135 ca kiểm thử thực tế đều đạt tỷ lệ thành công 100%.

**Khuyến nghị:** Dự án đủ điều kiện đạt điểm tối đa ở phần Triển khai và Quản trị Hệ thống.
