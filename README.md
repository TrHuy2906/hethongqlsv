# Hệ Thống Quản Lý Sinh Viên

Dự án Hệ thống Quản lý Sinh viên được xây dựng dựa trên kiến trúc phân tách rõ ràng giữa Backend (Python/Flask) và Frontend, điều phối hoàn toàn qua Docker Compose, phục vụ quản lý đào tạo, sinh viên, giảng viên, đồ án tốt nghiệp, thực tập và hội đồng.

## 1. Mục tiêu
- Cung cấp giải pháp quản lý sinh viên toàn diện theo đúng đặc tả đào tạo.
- Cấu trúc thư mục sạch sẽ, phân tách rõ **Backend**, **Frontend**, **Docs** và **Scripts**.
- Đảm bảo tính sẵn sàng cao, bảo mật, dễ dàng mở rộng và giám sát thời gian thực.

## 2. Công nghệ
- **Backend:** Python 3.9, Flask 3.0, Gunicorn, SQLAlchemy ORM
- **Database:** MySQL 8.0
- **Frontend:** HTML5, Vanilla CSS, JavaScript (Vanilla ES6+), Tailwind CSS, Material Symbols
- **Web Server / Proxy:** Nginx Reverse Proxy
- **Monitoring & Logging:** Prometheus, Grafana, Loki, Promtail
- **Deployment:** Docker & Docker Compose (8 microservices)

## 3. Kiến trúc Hệ thống
Hệ thống tuân theo mô hình Client-Server tiêu chuẩn:
- Client gửi request qua cổng `8083` tới Nginx Reverse Proxy.
- Nginx định tuyến traffic tới Gunicorn Application Server chạy Flask (`backend:5000`).
- Backend phục vụ các API RESTful và render giao diện từ `frontend/`.
- CSDL MySQL lưu trữ dữ liệu an toàn trên volume độc lập.
- Toàn bộ hạ tầng được giám sát tự động bởi Prometheus, Grafana và hệ thống log tập trung Loki/Promtail.

## 4. Cấu trúc Thư Mục Dự Án
```
.
├── backend/                       # Mã nguồn Backend Python / Flask
│   ├── app.py                    # Điểm khởi chạy ứng dụng Flask & Gunicorn
│   ├── auth.py                   # Xác thực, Session & Phân quyền Role
│   ├── database.py               # Kết nối CSDL SQLAlchemy
│   ├── models.py                 # Các Models CSDL (12 bảng)
│   ├── requirements.txt          # Thư viện phụ thuộc Python
│   ├── Dockerfile                # Dockerfile đóng gói Backend
│   └── [modules]/                # Các Blueprint chức năng (sinhvien, doan, diem, ...)
│
├── frontend/                      # Toàn bộ giao diện người dùng
│   ├── templates/                # 12 Template HTML (login, sinhvien, doan, ...)
│   └── static/                   # Tài nguyên tĩnh
│       ├── css/style.css         # CSS tokens, theme & animations
│       └── js/*.js               # Client JavaScript tương tác DOM & API
│
├── docs/                          # Toàn bộ tài liệu quản trị, triển khai & báo cáo
│   ├── DEPLOYMENT_GUIDE.md       # Hướng dẫn triển khai chi tiết
│   ├── DEPLOYMENT_ARCHITECTURE.md# Kiến trúc phân tầng & lưu lượng mạng
│   ├── DATABASE_ADMIN_GUIDE.md   # Quản trị CSDL & Backup định kỳ
│   ├── BACKUP_RESTORE_GUIDE.md   # Hướng dẫn Sao lưu & Phục hồi CSDL
│   ├── MONITORING_GUIDE.md       # Hướng dẫn Giám sát Prometheus & Grafana
│   ├── OPERATIONS_TROUBLESHOOTING.md # Xử lý sự cố & Vận hành
│   ├── SECURITY_CHECKLIST.md     # Danh mục kiểm tra an toàn thông tin
│   ├── FINAL_AUDIT_REPORT.md     # Báo cáo kiểm định tổng thể hệ thống
│   ├── DEPLOYMENT_TEST_REPORT.md # Báo cáo kiểm thử tải & triển khai
│   └── UI_FUNCTIONAL_AUDIT.md    # Báo cáo kiểm định giao diện & chức năng
│
├── scripts/                       # Các kịch bản tự động hóa (PowerShell & Shell)
│   ├── backup.ps1 / backup.sh    # Kịch bản sao lưu CSDL tự động
│   ├── restore.ps1 / restore.sh  # Kịch bản phục hồi CSDL kiểm định
│   └── create_grafana_dashboard.py # Kịch bản khởi tạo Dashboard giám sát
│
├── nginx/                         # Cấu hình Nginx Reverse Proxy
├── prometheus/                    # Cấu hình Prometheus Scrape Targets
├── grafana/                       # Cấu hình Dashboards & Datasources
├── promtail/                      # Cấu hình Promtail Log Shipper
├── backups/                       # Thư mục lưu trữ bản sao lưu SQL
├── .env.example                   # File mẫu cấu hình biến môi trường
├── docker-compose.yml             # Cấu hình điều phối 8 container
└── README.md                      # Hướng dẫn tổng quan dự án
```

## 5. Docker Architecture (8 Containers)
Tất cả container liên kết trong mạng nội bộ bảo mật `hethongqlsv-network`:
- `hethongqlsv_web`: Ứng dụng Flask chạy qua WSGI Gunicorn (2 workers).
- `hethongqlsv_db`: Cơ sở dữ liệu MySQL 8.0 (Healthchecked).
- `hethongqlsv_phpmyadmin`: Trình quản trị CSDL qua giao diện web.
- `hethongqlsv_nginx`: Reverse Proxy định tuyến traffic và thêm Security Headers.
- `hethongqlsv_prometheus`: Server thu thập metrics hệ thống và ứng dụng.
- `hethongqlsv_grafana`: Dashboard trực quan hóa hiệu năng thời gian thực.
- `hethongqlsv_loki` & `hethongqlsv_promtail`: Thu thập, phân tích và lưu trữ log.

## 6. Cách Cài Đặt & Chạy Hệ Thống

**Bước 1: Kiểm tra file cấu hình môi trường `.env`**
File `.env` đã được thiết lập sẵn các cổng dịch vụ độc lập không xung đột.

**Bước 2: Khởi động hệ thống với Docker Compose**
```bash
docker compose up -d --build
```

Hệ thống sẽ tự động build image `backend`, khởi tạo cơ sở dữ liệu và seed dữ liệu mẫu khi chạy lần đầu.

## 7. Danh Sách Cổng Truy Cập (Ports)
| Dịch Vụ | Port Ngoại Vi | Mục Đích Truy Cập |
| :--- | :--- | :--- |
| **Web App (qua Nginx)** | **8083** | **Cổng chính cho người dùng & quản trị** (`http://localhost:8083`) |
| **phpMyAdmin** | **8084** | Quản trị CSDL trực quan (`http://localhost:8084`) |
| **MySQL Database** | **3309** | Kết nối trực tiếp CSDL (root / rootpassword) |
| **Grafana Dashboard** | **3002** | Giám sát hiệu năng hệ thống (`http://localhost:3002`) |
| **Prometheus** | **9092** | Tra cứu Metrics (`http://localhost:9092`) |
| **Loki Log API** | **3102** | Cổng tiếp nhận và truy vấn Log tập trung |

## 8. Ba Commit Mốc Theo Đúng Yêu Cầu Đề Cương (Milestone Commits)
Hệ thống được phát triển và kiểm soát phiên bản theo đúng tiến trình yêu cầu của giảng viên trong đề cương môn học:
1. **Commit 1 (Yêu cầu 3 - Nginx Reverse Proxy):**
   - Triển khai dịch vụ `nginx` (cổng `8083`) đứng trước Flask backend (`5000`).
   - Cấu hình file `nginx/nginx.conf` với đầy đủ các Security Headers: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`.
   - Giấu hoàn toàn cổng nội bộ của Flask Application và MySQL.
2. **Commit 2 (Yêu cầu 4 - Giám sát Prometheus + Grafana):**
   - Tích hợp `prometheus-flask-exporter` mở endpoint `/metrics` trên backend.
   - Cấu hình Prometheus (`monitoring/prometheus.yml`) định kỳ cào dữ liệu hiệu năng (scrape interval 5s).
   - Tích hợp Grafana (`http://localhost:3002`) với dashboard trực quan hóa thời gian thực: CPU, RAM, Request Rate, Response Latency, HTTP Status Codes (200, 4xx, 5xx).
3. **Commit 3 (Yêu cầu 5 - Log tập trung Loki + Promtail & LogQL):**
   - Triển khai Promtail (`monitoring/promtail-config.yml`) tự động đọc Docker container logs.
   - Triển khai Loki (`monitoring/loki-config.yml` - cổng `3102`) tiếp nhận, đánh chỉ mục và lưu trữ log tập trung.
   - Kết nối Loki Datasource trên Grafana và thực thi các câu truy vấn LogQL mẫu phục vụ điều tra sự cố.

## 9. Tài Khoản Đăng Nhập Mặc Định
- **Mật khẩu mặc định toàn hệ thống:** **`123456`** *(Admin hỗ trợ cả `admin123`)*.
- **Quản trị viên (Role 2):** `admin` / `123456` (Toàn quyền hệ thống, CRUD sinh viên, phân quyền, sao lưu).
- **Sinh viên (Role 0):** `dtc1` / `123456` hoặc `sv1` / `123456` (Cổng học tập cá nhân, xem TKB, bảng điểm).
- **Giảng viên (Role 1):** `gv1` / `123456` (Cổng giảng dạy, nhập điểm, giao bài tập).

## 10. Phân Quyền Vai Trò (RBAC)
- `Role 0 (Sinh viên)`: Tra cứu điểm cá nhân, xem thời khóa biểu, nộp bài tập, bị ẩn toàn bộ các nút quản trị.
- `Role 1 (Giảng viên)`: Quản lý lớp phụ trách, chấm điểm môn học, giao bài tập.
- `Role 2 (Quản trị viên)`: Toàn quyền quản trị danh mục, người dùng, sinh viên, giảng viên, sao lưu & phục hồi CSDL.

## 10. Danh Mục Nghiệp Vụ Chuẩn
1. **Xác thực & Người dùng:** Đăng nhập, đăng xuất, đổi mật khẩu (6-29 ký tự, chống trùng mật khẩu cũ, khớp xác nhận), cấp nhanh tài khoản 1-click, đặt lại mật khẩu mặc định, validation email `@wru.vn`.
2. **Sinh viên & Giảng viên:** Quản lý sinh viên (MSV, Lớp, Điểm GPA, Tài khoản), Giảng viên (MGV, Học vị, Bộ môn, Liên kết tài khoản).
3. **Danh mục Đào tạo:** Khoa, Bộ môn, Chuyên ngành, Niên khóa (tự động tính trạng thái đào tạo/tốt nghiệp), Lớp học (GVCN, Lớp trưởng).
4. **Đồ án Tốt nghiệp:** Đăng ký đề tài, hủy đề tài hợp lệ, GV duyệt, 4 mốc tiến độ chuẩn ("Chưa bắt đầu" -> "Cập nhật lần 1" -> "Cập nhật lần 2" -> "Cập nhật lần 3" -> "Hoàn thành"), nộp báo cáo.
5. **Hội đồng & Điểm số:** Hội đồng 3 thành viên độc lập (không trùng nhau), tính TB Hội đồng `(TV1 + TV2 + TV3) / 3`, Điểm Tổng kết `(GVHD + GVPB + TBHĐ) / 3`, kiểm soát khoảng điểm 0.0 - 10.0.
6. **Thực tập Doanh nghiệp:** Quản lý nơi thực tập, vị trí, thời gian, đánh giá, chống trùng lặp thực tập cho cùng một sinh viên.

## 11. Tài Liệu Kỹ Thuật Chi Tiết (Thư mục `docs/`)
- [Hướng dẫn triển khai chi tiết](docs/DEPLOYMENT_GUIDE.md)
- [Kiến trúc phân tầng và bảo mật](docs/DEPLOYMENT_ARCHITECTURE.md)
- [Quản trị cơ sở dữ liệu và bảo toàn dữ liệu](docs/DATABASE_ADMIN_GUIDE.md)
- [Quy trình sao lưu và phục hồi CSDL](docs/BACKUP_RESTORE_GUIDE.md)
- [Giám sát hệ thống với Prometheus và Grafana](docs/MONITORING_GUIDE.md)
- [Quy trình vận hành và xử lý sự cố](docs/OPERATIONS_TROUBLESHOOTING.md)
- [Checklist bảo mật và an toàn thông tin](docs/SECURITY_CHECKLIST.md)
- [Báo cáo kiểm định tổng thể hệ thống](docs/FINAL_AUDIT_REPORT.md)
- [Báo cáo kiểm định giao diện và chức năng UI](docs/UI_FUNCTIONAL_AUDIT.md)
