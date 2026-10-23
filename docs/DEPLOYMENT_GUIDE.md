# HƯỚNG DẪN TRIỂN KHAI VÀ VẬN HÀNH HỆ THỐNG TRÊN WINDOWS
**Môn học:** Triển khai và quản trị hệ thống phần mềm  
**Hệ thống:** Quản lý Sinh viên, Đồ án và Thực tập  
**Môi trường khuyến nghị:** Windows 10/11 Pro / Enterprise (Docker Desktop + WSL2)

---

## 1. Yêu cầu Môi trường (Prerequisites)

Trước khi tiến hành triển khai hệ thống trên máy trạm Windows, cần đảm bảo các điều kiện sau:

1. **Hệ điều hành:** Windows 10 (Build 19041 trở lên) hoặc Windows 11.
2. **Docker Desktop for Windows:**
   - Đã cài đặt và kích hoạt backend **WSL 2** (Windows Subsystem for Linux 2).
   - Kiểm tra phiên bản bằng PowerShell:
     ```powershell
     docker --version
     docker compose version
     ```
3. **PowerShell:** PowerShell 5.1 (mặc định) hoặc PowerShell 7+.
4. **Tài nguyên phần cứng khuyến nghị:**
   - RAM: Tối thiểu 4GB trống (khuyến nghị 8GB+ để chạy đủ 8 container).
   - Ổ cứng: Tối thiểu 10GB dung lượng trống cho Docker images và cơ sở dữ liệu.

---

## 2. Cấu hình Biến Môi trường (.env)

Hệ thống sử dụng cơ chế bảo vệ bí mật thông qua tệp `.env`. Tệp này **đã được cấu hình trong `.gitignore`** để không bao giờ bị đưa lên Git công khai.

### 2.1. Chuẩn bị file .env
Tại thư mục gốc của dự án (`C:\Users\huyk6\Downloads\New folder`), nếu chưa có file `.env`, hãy sao chép từ tệp mẫu `.env.example`:

```powershell
Copy-Item .env.example .env
```

### 2.2. Bảng tham số cấu hình trong .env

| Tên biến | Giá trị mặc định | Giải thích ý nghĩa |
| :--- | :--- | :--- |
| `DB_PASSWORD` | *(Mật khẩu an toàn)* | Mật khẩu tài khoản `root` của MySQL |
| `DB_NAME` | `student_db` | Tên cơ sở dữ liệu chính của hệ thống |
| `DB_PORT` | `3309` | Cổng MySQL ánh xạ ra máy host |
| `WEB_PORT` | `8083` | Cổng Web Nginx tiếp nhận người dùng |
| `PMA_PORT` | `8084` | Cổng giao diện quản trị phpMyAdmin |
| `PROMETHEUS_PORT` | `9092` | Cổng bảng điều khiển Prometheus |
| `GRAFANA_PORT` | `3002` | Cổng hiển thị biểu đồ Grafana |
| `LOKI_PORT` | `3102` | Cổng API của hệ thống lưu trữ log Loki |
| `SECRET_KEY` | *(Chuỗi ngẫu nhiên)* | Khóa ký số phiên làm việc (Session Secret) của Flask |
| `FLASK_ENV` | `production` | Chế độ chạy ứng dụng (`production` tắt debug console) |

> [!WARNING]
> Tuyệt đối không thay đổi các giá trị cổng nếu không có xung đột thực tế trên máy chủ của bạn. Hệ thống đã được thiết kế sẵn các cổng lệch chuẩn để tránh xung đột với IIS (80), MySQL cục bộ (3306), hoặc Grafana mặc định (3000).

---

## 3. Quy trình Khởi chạy Hệ thống Từng bước (Step-by-Step Deployment)

Mở cửa sổ **PowerShell** với quyền thông thường tại thư mục dự án và thực hiện các bước sau:

### Bước 1: Điều hướng vào thư mục dự án
```powershell
Set-Location "C:\Users\huyk6\Downloads\New folder"
```

### Bước 2: Build Image ứng dụng và khởi chạy toàn bộ dịch vụ
```powershell
docker compose up -d --build
```
Lệnh trên sẽ:
- Tự động tải các base images chính hãng từ Docker Hub (`mysql:8.0`, `nginx:alpine`, `prom/prometheus`, `grafana/grafana`, `grafana/loki`, `grafana/promtail`, `phpmyadmin/phpmyadmin`).
- Tự động đóng gói và build image `hethongqlsv_web` từ `./app/Dockerfile`.
- Khởi tạo network `hethongqlsv-network` và volume `hethongqlsv_db_data`.
- Khởi động các container ở chế độ chạy ngầm (`-d`).

### Bước 3: Kiểm tra trạng thái hoạt động (Health status)
```powershell
docker compose ps
```
**Kết quả mong đợi:** Tất cả 8 dịch vụ đều có trạng thái `Up` hoặc `Up (healthy)`.

```text
NAME                     IMAGE                   COMMAND                  SERVICE       STATUS
hethongqlsv_db           mysql:8.0               "docker-entrypoint.s…"   db            Up (healthy)
hethongqlsv_grafana      grafana/grafana         "/run.sh"                grafana       Up
hethongqlsv_loki         grafana/loki:2.9.0      "/usr/bin/loki -conf…"   loki          Up
hethongqlsv_nginx        nginx:alpine            "/docker-entrypoint.…"   nginx         Up
hethongqlsv_phpmyadmin   phpmyadmin/phpmyadmin   "/docker-entrypoint.…"   phpmyadmin    Up
hethongqlsv_prometheus   prom/prometheus         "/bin/prometheus --c…"   prometheus    Up
hethongqlsv_promtail     grafana/promtail:2.9.0  "/usr/bin/promtail -…"   promtail      Up
hethongqlsv_web          newfolder-web           "gunicorn --bind 0.0…"   web           Up
```

---

## 4. Danh sách Địa chỉ Truy cập và Tài khoản Mặc định

Sau khi các container đã `Up`, mở trình duyệt web và truy cập các dịch vụ:

| Dịch vụ | Địa chỉ URL | Tài khoản đăng nhập mặc định | Vai trò |
| :--- | :--- | :--- | :--- |
| **Hệ thống Quản lý Sinh viên** | [http://localhost:8083](http://localhost:8083) | `admin` / *(mật khẩu quản trị)* | Người dùng cuối & Quản trị viên |
| **phpMyAdmin** | [http://localhost:8084](http://localhost:8084) | Server: `db`, User: `root`, Password: `${DB_PASSWORD}` | Quản trị cơ sở dữ liệu |
| **Prometheus** | [http://localhost:9092](http://localhost:9092) | Không yêu cầu đăng nhập | Kiểm tra trạng thái Metrics & Targets |
| **Grafana Dashboard** | [http://localhost:3002](http://localhost:3002) | `admin` / `admin` | Bảng điều khiển giám sát tổng thể |
| **Loki API** | [http://localhost:3102/ready](http://localhost:3102/ready) | N/A (Trả về `ready`) | API máy chủ lưu trữ log |

---

## 5. Cẩm nang Lệnh Quản trị Thường nhật (Daily Operational Commands)

### 5.1. Xem log thời gian thực của toàn bộ hệ thống
```powershell
docker compose logs -f
```

### 5.2. Xem log riêng của một dịch vụ cụ thể
```powershell
# Xem log của dịch vụ Web
docker compose logs -f web

# Xem log của Nginx Reverse Proxy
docker compose logs -f nginx

# Xem 50 dòng log gần nhất của MySQL
docker compose logs --tail 50 db
```

### 5.3. Khởi động lại riêng một dịch vụ mà không ảnh hưởng dịch vụ khác
```powershell
# Khởi động lại dịch vụ web sau khi cập nhật cấu hình
docker compose restart web

# Khởi động lại Grafana
docker compose restart grafana
```

### 5.4. Kiểm tra tài nguyên CPU và RAM của các container
```powershell
docker stats --no-stream
```

### 5.5. Dừng hệ thống an toàn
```powershell
docker compose stop
```
*Lưu ý: Lệnh này tạm dừng các container nhưng bảo lưu toàn bộ dữ liệu và trạng thái container.*

### 5.6. Bật lại hệ thống sau khi máy tính khởi động lại
```powershell
docker compose start
```

---

## 6. Các Cảnh báo Vận hành Tối quan trọng

> [!CAUTION]
> **1. TUYỆT ĐỐI KHÔNG CHẠY `docker compose down -v`:**
> Tham số `-v` sẽ xóa sạch toàn bộ Volume `hethongqlsv_db_data`, dẫn đến **mất vĩnh viễn toàn bộ dữ liệu** sinh viên, giảng viên và đồ án đã nhập!
> Nếu cần dừng và dỡ bỏ container an toàn, chỉ dùng:
> ```powershell
> docker compose down
> ```
> *(Lệnh này dỡ bỏ container và mạng ảo nhưng bảo toàn 100% volume dữ liệu).*

> [!WARNING]
> **2. Không tự sửa file trực tiếp bên trong container:**
> Mọi thay đổi mã nguồn phải thực hiện tại thư mục làm việc trên máy host (`./app`), sau đó đồng bộ hoặc build lại container `web`. Nếu sửa thủ công bên trong container bằng lệnh `docker exec`, thay đổi sẽ biến mất khi container được tái tạo.
