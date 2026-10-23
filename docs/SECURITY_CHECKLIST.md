# DANH MỤC KIỂM TRA BẢO MẬT HỆ THỐNG (SECURITY CHECKLIST)
**Môn học:** Triển khai và quản trị hệ thống phần mềm  
**Hệ thống:** Quản lý Sinh viên, Đồ án và Thực tập  
**Mục tiêu:** Rà soát và đánh giá an toàn thông tin trên 7 tầng kiến trúc trước khi bàn giao và nghiệm thu.

---

## 1. Phân định Môi trường Thử nghiệm (Local Demo) và Sản xuất (Production)

Trong môn học Triển khai và quản trị hệ thống phần mềm, một hệ thống đạt chuẩn cần phân định rõ ràng giữa:
- **Cấu hình Local Demo:** Tối ưu hóa tính tiện lợi, cho phép sinh viên và giảng viên dễ dàng kiểm tra trực quan (mở phpMyAdmin, mở cổng MySQL ra ngoài, sử dụng mật khẩu minh họa).
- **Cấu hình Production Hardening:** Đóng tất cả các cổng quản trị trực tiếp, sử dụng chứng chỉ SSL/TLS, phân quyền tối thiểu và mã hóa mạnh.

---

## 2. Bảng Danh mục Kiểm tra Bảo mật 7 Tầng (Defense-in-Depth)

| STT | Hạng mục Kiểm tra | Trạng thái Hiện tại | Đánh giá & Giải pháp Đã Triển khai / Khuyến nghị |
| :---: | :--- | :---: | :--- |
| **1** | **Bảo vệ Secret & Biến Môi trường** | **ĐẠT** | Tệp `.env` được khai báo trong `.gitignore`. Không có mật khẩu hoặc token nào bị commit lên Git repository. Tệp `.env.example` chỉ chứa cấu trúc mẫu. |
| **2** | **Bảo mật Container (Non-root Execution)** | **ĐẠT** | Dockerfile tạo và chạy dưới quyền `USER appuser` (UID: 1000). Ngay cả khi ứng dụng bị chiếm quyền điều khiển, kẻ tấn công cũng không thể chiếm quyền root của máy chủ host. |
| **3** | **Cô lập Mạng Môi trường chạy (Network Isolation)** | **ĐẠT** | Tất cả 8 dịch vụ hoạt động bên trong bridge network riêng biệt `hethongqlsv-network`. Dịch vụ backend `web:5000` hoàn toàn không mở cổng ra ngoài máy chủ, chỉ giao tiếp qua Nginx. |
| **4** | **Phòng chống SQL Injection** | **ĐẠT** | Toàn bộ các thao tác truy vấn cơ sở dữ liệu đều sử dụng **SQLAlchemy ORM** với Parameterized Queries chuẩn hóa, loại bỏ hoàn toàn nguy cơ tấn công tiêm mã SQL Injection. |
| **5** | **Băm và Bảo vệ Mật khẩu Người dùng** | **ĐẠT** | Mật khẩu tài khoản trong bảng `user` được mã hóa một chiều an toàn bằng thuật toán băm chuẩn (SHA-256 / Werkzeug Security). Không lưu trữ mật khẩu dạng Plaintext. |
| **6** | **Kiểm soát Truy cập & Phân quyền (RBAC)** | **ĐẠT** | Hệ thống triển khai phân quyền theo 3 vai trò: `QuanTriVien`, `GiangVien`, `SinhVien`. Bổ sung trường `status` (`HoatDong` / `Khoa`) cho phép quản trị viên vô hiệu hóa tài khoản vi phạm ngay lập tức. |
| **7** | **Bảo mật Reverse Proxy (Nginx Hardening)** | **ĐẠT** | Nginx đóng vai trò lá chắn phía trước, ẩn danh các cổng backend, xử lý giới hạn upload `client_max_body_size 16M` ngăn chặn tấn công DoS tràn bộ đệm. |

---

## 3. Đánh giá Rủi ro và Kế hoạch Nâng cấp Production

### 3.1. Phân quyền Người dùng Cơ sở dữ liệu (Database Least Privilege)
- **Hiện trạng:** Ứng dụng Flask đang kết nối bằng tài khoản `root` của MySQL.
- **Rủi ro:** Nếu ứng dụng bị lỗ hổng RCE, kẻ tấn công có quyền quản trị tối cao đối với toàn bộ hệ quản trị MySQL.
- **Khuyến nghị Production:** Chuyển sang tài khoản `app_user` chỉ có quyền `SELECT, INSERT, UPDATE, DELETE` trên `student_db.*` như đã hướng dẫn trong `DATABASE_ADMIN_GUIDE.md`.

### 3.2. Giới hạn Cổng truy cập Dịch vụ Quản trị (Admin Exposure)
- **Hiện trạng:** Các cổng `3309` (MySQL), `8084` (phpMyAdmin), `9092` (Prometheus) và `3002` (Grafana) đang được mở trực tiếp ra máy host để phục vụ chấm điểm và thực hành trực quan.
- **Khuyến nghị Production:** 
  - Đóng cổng `3309` và `8084` trên tường lửa (Firewall) hoặc chỉ cho phép truy cập qua đường hầm an toàn (VPN / SSH Tunnel).
  - Đặt Nginx Reverse Proxy có chứng chỉ SSL/TLS (HTTPS Let's Encrypt) phía trước Grafana và ứng dụng chính.

### 3.3. Bảo mật Tiêu đề HTTP (Security Headers)
Khuyến nghị bổ sung các header an ninh sau vào file cấu hình `nginx/nginx.conf` khi triển khai ra Internet:
```nginx
# Chống Clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Chống MIME-sniffing
add_header X-Content-Type-Options "nosniff" always;

# Kích hoạt XSS Filter của trình duyệt
add_header X-XSS-Protection "1; mode=block" always;

# Chính sách Cookie an toàn
proxy_cookie_path / "/; Secure; HttpOnly; SameSite=Lax";
```

### 3.4. Giới hạn Tài nguyên Container (Resource Limits)
Để ngăn chặn một container bị tấn công DoS dẫn đến treo toàn bộ máy chủ, có thể khai báo giới hạn tài nguyên trong `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '0.50'
      memory: 512M
```
