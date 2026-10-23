# BÁO CÁO HOÀN THIỆN PHÂN HỆ GIẢNG VIÊN (ROLE = 1)
## HỆ THỐNG QUẢN LÝ SINH VIÊN

**Dự án:** Hệ thống Quản lý Sinh viên  
**Học phần:** Triển khai và quản trị hệ thống phần mềm  
**Môi trường:** Docker Compose (Nginx reverse proxy, Flask backend, MySQL 8.0, Prometheus, Grafana, Loki, Promtail, phpMyAdmin)  
**Thời gian thực hiện:** 23/10/2026  
**Trạng thái kiểm thử:** 16/16 Ca kiểm thử bắt buộc PASSED (100.0%) | 53/53 Ca kiểm định độc lập PASSED (100.0%) | 46/46 Ca kiểm thử giao diện & chức năng PASSED (100.0%)  

---

## 1. Danh sách file đã tạo / chỉnh sửa

| Đường dẫn file | Thao tác | Mô tả tóm tắt nội dung thay đổi |
| :--- | :--- | :--- |
| `backend/models.py` | Sửa | Bổ sung serialization thông tin học hàm, học vị, khoa/bộ môn (`to_dict` của `Lecturer`), và bổ sung `student_class`, `class_id`, `lecturer_id` trong `DiemMonHoc.to_dict()` để hỗ trợ lọc và hiển thị theo lớp. |
| `backend/portal/routes.py` | Sửa | Cập nhật hàm `get_lecturer_portal()` trả về dữ liệu thật theo phân công giảng dạy (lớp, sinh viên, thời khóa biểu, bảng điểm, bài tập, bài nộp, đồ án, thực tập, thống kê, thông báo). Bổ sung kiểm tra quyền sở hữu học phần tại `POST /api/lecturer/grades/<id>` và kiểm tra phạm vi bài tập tại `POST /api/lecturer/submissions/<id>/grade`. Đảm bảo dữ liệu mẫu liên kết chính xác với giảng viên `gv1` (ID 64). |
| `backend/auth.py` | Sửa | Thêm tiền tố `/api` vào điều kiện kiểm tra xác thực của `login_required` và `role_required` để đảm bảo các endpoint API trả về mã lỗi `401 Unauthorized` dạng JSON thay vì chuyển hướng 302 về trang đăng nhập. |
| `frontend/templates/index.html` | Sửa | Bổ sung menu sidebar 8 mục cho Giảng viên (`.lecturer-strict-only`), container giao diện Cổng Giảng viên `#lecturerPortalView` với 8 tab chuyên biệt, hero banner, các thẻ thống kê tổng quan, bảng dữ liệu, và các modal: `lecturerStudentDetailModal`, `lecturerUpdateProgressModal`. Đảm bảo tuân thủ 100% nguyên tắc không chứa comment trong code. |
| `frontend/static/js/main.js` | Sửa | Cập nhật hàm `renderUserHeader(user)` để bật/tắt chính xác các khối giao diện theo vai trò: Sinh viên (`role === 0`), Giảng viên (`role === 1`), Quản trị viên (`role === 2`). Ẩn toàn bộ menu admin và student khi giảng viên đăng nhập. Tuân thủ 100% không chứa comment trong code. |
| `frontend/static/js/sinhvien.js` | Sửa | Triển khai logic điều khiển phân hệ Giảng viên: `loadLecturerPortal()`, `renderLecturerPortal()`, `switchLecturerTab()`, các bộ lọc (lịch dạy, lớp, môn học, tìm kiếm sinh viên), các thao tác nhập điểm, chấm bài nộp, phê duyệt đồ án (`approve`/`reject`), cập nhật tiến độ đồ án và xem chi tiết hồ sơ sinh viên. Tuân thủ 100% không chứa comment trong code. |
| `scratch/test_all_16_mandatory_cases.py` | Tạo | Bộ kịch bản kiểm thử tự động 16 ca kiểm thử bắt buộc theo đúng đặc tả yêu cầu của đề bài. |
| `scratch/apply_lecturer_portal_ui.py` | Tạo | Script tự động tích hợp cấu trúc HTML phân hệ Giảng viên vào `index.html`. |
| `scratch/apply_lecturer_js.py` | Tạo | Script tự động tích hợp mã nguồn JavaScript phân hệ Giảng viên vào `sinhvien.js`. |
| `LECTURER_PORTAL_IMPLEMENTATION_REPORT.md` | Tạo | Báo cáo chi tiết kết quả thực hiện theo yêu cầu. |

---

## 2. Các chức năng đã triển khai cho Giảng viên (Role = 1)

### A. Tổng quan Giảng viên (Dashboard Overview)
- **Thẻ thông tin cá nhân & Học hàm/Học vị:** Hiển thị họ tên (`TS. Trần Văn Thầy`), mã giảng viên (`GV0064`), chức danh (`Tiến sĩ / Giảng viên chính`), khoa/bộ môn (`Khoa Công nghệ thông tin • Bộ môn Kỹ thuật phần mềm`), email liên hệ (`gv1@qlsv.edu.vn`), và hướng nghiên cứu chính.
- **4 Thẻ số liệu thống kê thời gian thực:**
  1. *Số lớp học phần phụ trách:* Tính theo số lớp giảng viên được xếp lịch trong học kỳ.
  2. *Số sinh viên đào tạo:* Tổng số sinh viên thuộc danh sách các lớp được phân công.
  3. *Số bài tập chờ chấm:* Đếm số lượng bài nộp của sinh viên có `score is None`.
  4. *Số đồ án tốt nghiệp phụ trách:* Tổng số đề tài đang hướng dẫn/phản biện và số lượng chờ duyệt.
- **Bảng thông báo & Nhiệm vụ giảng dạy:** Thông báo tự động nhắc nhở số bài tập cần chấm, thời khóa biểu ca dạy trong tuần, và trạng thái mở cổng nhập điểm.
- **Ca giảng dạy sắp tới:** Hiển thị 3 ca giảng dạy gần nhất kèm thứ, phòng học, tiết học.

### B. Lịch giảng dạy và Thời khóa biểu (Teaching Schedule)
- Hiển thị bảng lịch giảng dạy đầy đủ các cột: Thứ, Tiết & Thời gian, Lớp phụ trách, Học phần / Môn học, Số tín chỉ, Phòng học, Hình thức đào tạo.
- Bộ lọc linh hoạt: Lọc theo Thứ (Thứ 2 đến Thứ 7 hoặc Tất cả) và Lọc theo Môn học/Học phần giảng dạy.
- Dữ liệu được truy vấn thực tế từ bảng `lich_hoc` thông qua API `/api/lecturer/portal` chỉ lấy các lịch thuộc về giảng viên đăng nhập (`lecturer_id = 64`).

### C. Lớp học và Sinh viên phụ trách (Classes & Students Scope)
- Hiển thị danh mục các lớp được phân công giảng dạy kèm sĩ số sinh viên từng lớp.
- Danh sách sinh viên thuộc phạm vi phụ trách: Mã sinh viên, Họ và tên, Giới tính, Ngày sinh, Lớp học, Điểm GPA tích lũy, Xếp loại học lực.
- Thanh tìm kiếm sinh viên theo tên hoặc mã sinh viên thời gian thực; Bộ lọc sinh viên theo từng lớp học phần.
- Modal **"Hồ sơ sinh viên học phần"** (`lecturerStudentDetailModal`): Cho phép giảng viên xem chi tiết hồ sơ cá nhân, ngày sinh, email, GPA và đánh giá phục vụ giảng dạy.
- **Bảo mật nghiệp vụ:** Giảng viên tuyệt đối không có quyền thêm, sửa hồ sơ gốc, xóa sinh viên hoặc chuyển lớp (nút thao tác xóa/sửa bị loại bỏ hoàn toàn trên UI và chặn ở backend).

### D. Quản lý Điểm số và Chuyên cần (Grades & Attendance Management)
- Bảng điểm theo từng học phần: Mã SV, Họ tên, Lớp học, Môn học, Điểm chuyên cần (10%), Điểm giữa kỳ (30%), Điểm thi cuối kỳ (60%), Điểm tổng kết hệ 10, Điểm chữ và hệ 4 (A, B, C, D, F / GPA 4.0), Số buổi nghỉ, Đánh giá dự thi (Cấm thi nếu số buổi nghỉ $\ge 20\%$).
- Bộ lọc danh sách bảng điểm theo Môn học.
- Nút **"Nhập điểm"** mở modal cập nhật điểm (`teacherGradeModal`): Cho phép giảng viên cập nhật điểm chuyên cần, giữa kỳ, cuối kỳ và số buổi nghỉ.
- **Ràng buộc backend:** Kiểm tra nghiêm ngặt định dạng số, giới hạn điểm $[0.0, 10.0]$, số buổi nghỉ $\ge 0$. Nếu sai, backend lập tức từ chối với mã lỗi `400 Bad Request`.
- **Kiểm soát phân quyền:** Giảng viên chỉ có quyền sửa điểm học phần do mình phụ trách (`is_assigned`). Nếu cố tình sửa điểm học phần khác, backend trả về `403 Forbidden`.

### E. Quản lý Bài tập và Chấm điểm bài nộp (Assignments & Submissions)
- **Danh sách bài tập đã giao:** Tên đề bài, Môn học, Lớp phụ trách, Hạn nộp, Số lượng sinh viên đã nộp bài.
- **Tạo bài tập mới:** Modal `teacherCreateAssignmentModal` cho phép giảng viên giao bài tập mới với tiêu đề, môn học, hạn nộp và hướng dẫn chi tiết. Backend lưu trữ bài tập gắn liền với `lecturer_id`.
- **Danh sách bài nộp của sinh viên gửi đến Giảng viên:** Hiển thị sinh viên nộp, lớp, môn học, thời gian nộp, tên file bài làm, ghi chú của sinh viên, điểm và lời phê.
- **Chấm điểm trực tuyến:** Modal `teacherGradeSubmissionModal` cho phép giảng viên chấm điểm thang 10 và nhập nhận xét/lời phê. Điểm số và nhận xét sẽ phản hồi ngay lập tức về cổng học tập của sinh viên.

### F. Hướng dẫn Đồ án và Thực tập (Theses & Internships)
- **Đồ án tốt nghiệp:**
  - Danh sách đề tài đồ án do giảng viên hướng dẫn hoặc phản biện: Mã đồ án, Tên đề tài, Sinh viên thực hiện, Lớp, Trạng thái phê duyệt, Tiến độ thực hiện, Báo cáo tóm tắt.
  - Phê duyệt đề tài: Đối với đề tài trạng thái `Chờ duyệt`, giảng viên có nút **"Chấp nhận"** (`POST /projects/<id>/approve`) và **"Từ chối"** (`POST /projects/<id>/reject`).
  - Cập nhật tiến độ: Modal `lecturerUpdateProgressModal` hỗ trợ cập nhật 4 mốc chuẩn: `Chưa bắt đầu`, `Cập nhật lần 1`, `Cập nhật lần 2`, `Cập nhật lần 3`, `Hoàn thành` qua API `PUT /projects/<id>/progress`.
- **Thực tập doanh nghiệp:**
  - Bảng theo dõi thông tin thực tập của sinh viên thuộc lớp phụ trách: Mã thực tập, Họ tên sinh viên, Lớp, Doanh nghiệp tiếp nhận, Vị trí thực tập, Thời gian và Kết quả đánh giá.

### G. Tài liệu học tập (Course Materials & LMS Integration)
- Hiển thị danh mục gói học liệu số tương ứng với từng học phần giảng viên đang giảng dạy.
- Cung cấp thông tin đề cương chi tiết học phần (PDF 2025.1), bộ slide bài giảng trình chiếu (8 chương học phần), bài tập & case-study.
- Thẻ trạng thái đồng bộ hóa hệ thống LMS Elearning của Nhà trường, cho phép giảng viên kích hoạt đồng bộ học liệu trực tiếp đến tài khoản sinh viên.

### H. Hồ sơ cá nhân và Tài khoản (Profile & Security)
- Hiển thị đầy đủ thông tin định danh: Họ tên, Mã giảng viên, Học vị, Đơn vị công tác, Tên tài khoản, Email và Hướng nghiên cứu.
- Tích hợp chức năng **Đổi mật khẩu** trực tiếp qua modal `changePwdModal` (kiểm tra độ dài 6-29 ký tự, mật khẩu cũ, xác nhận mật khẩu mới).
- Nút **Đăng xuất** an toàn gọi endpoint `/logout` và xóa session.
- Không tiết lộ mật khẩu, hash mật khẩu hay session token trên giao diện hoặc console log.

---

## 3. Các chức năng chưa triển khai và lý do

| Chức năng | Trạng thái | Lý do chưa triển khai |
| :--- | :--- | :--- |
| Tải file nhị phân trực tiếp lên máy chủ cục bộ (Upload binary files) | Tạm dùng đường dẫn/tên file xác thực | Database hiện tại lưu trữ trường `submission_file` dưới dạng tên file/liên kết URL tài liệu chia sẻ (GitHub, Drive, link nén zip) để bảo đảm tương thích tuyệt đối với schema CSDL MySQL hiện tại và tránh làm phình volume Docker. Chức năng upload vật lý multipart/form-data có thể bổ sung khi có quyết định mở rộng hạ tầng lưu trữ S3/MinIO. |
| Xóa/Sửa thông tin lớp học hoặc chương trình đào tạo từ tài khoản giảng viên | Cố tình không triển khai | Theo quy chế đào tạo và nguyên tắc phân quyền bắt buộc (Mục 2.4 & 2.5), Giảng viên không có thẩm quyền sửa đổi cấu trúc lớp học hay danh mục đào tạo của trường; thẩm quyền này chỉ thuộc về Quản trị viên (Role 2). |

---

## 4. Danh sách API đã thêm / chỉnh sửa

| Endpoint | Phương thức | Quyền | Mục đích & Thay đổi |
| :--- | :---: | :---: | :--- |
| `/api/lecturer/portal` | `GET` | Role 1, 2 | Trả về toàn bộ dữ liệu thật của phân hệ Giảng viên (hồ sơ giảng viên, lịch dạy, lớp phụ trách, sinh viên, điểm môn học, bài tập, bài nộp, đồ án, thực tập, thống kê, thông báo). Lọc chính xác theo `lecturer_id`. |
| `/api/lecturer/grades/<id>` | `POST`, `PUT` | Role 1, 2 | Cập nhật điểm chuyên cần, giữa kỳ, cuối kỳ và số buổi nghỉ. Kiểm tra kiểm soát phân quyền (`grade.lecturer_id == current_lec.id` hoặc phụ trách môn học trong `LichHoc`). Kiểm tra giới hạn điểm $[0, 10]$ và số buổi nghỉ $\ge 0$. |
| `/api/lecturer/assignments` | `POST` | Role 1, 2 | Tạo bài tập môn học mới gắn liền với `lecturer_id` của giảng viên đăng nhập. |
| `/api/lecturer/submissions/<id>/grade` | `POST`, `PUT` | Role 1, 2 | Chấm điểm bài nộp của sinh viên thang điểm $[0, 10]$ và lưu nhận xét của giảng viên. |
| `/projects/<id>/approve` | `POST` | Role 1, 2 | Giảng viên chấp nhận đề tài đồ án tốt nghiệp của sinh viên. Trạng thái chuyển thành `Chấp nhận`. |
| `/projects/<id>/reject` | `POST` | Role 1, 2 | Giảng viên từ chối đề tài đồ án tốt nghiệp của sinh viên. Trạng thái chuyển thành `Từ chối`. |
| `/projects/<id>/progress` | `PUT` | Role 1, 2 | Giảng viên cập nhật tiến độ đồ án theo 4 mốc chuẩn. |
| `/auth.py` (`login_required`, `role_required`) | Middleware | Tất cả | Cập nhật middleware xác thực: Bất kỳ request chưa đăng nhập nào gọi tới đường dẫn `/api/*` đều trả về mã lỗi `401 Unauthorized` dạng JSON thay vì 302 Redirect. |

---

## 5. Thay đổi Database / Migration

- **Không tạo bảng mới hoặc xóa bảng hiện có:** Giữ nguyên 100% cấu trúc schema của cơ sở dữ liệu quan hệ MySQL hiện tại (`student`, `lecturer`, `user`, `khoa`, `bo_mon`, `chuyen_nganh`, `nien_khoa`, `lop`, `lich_hoc`, `diem_mon_hoc`, `bai_tap`, `nop_bai_tap`, `do_an`, `thuc_tap`, `hoi_dong`, `diem_do_an`).
- **Tương thích dữ liệu:** Dữ liệu khởi tạo (seed data) trong `ensure_seed_portal_data()` được gắn khóa ngoại chuẩn xác tới `lecturer_id = 64` (TS. Trần Văn Thầy, user `gv1`), bảo đảm tính toàn vẹn tham chiếu không gây ra bất kỳ lỗi khóa ngoại nào.

---

## 6. Bảng kiểm thử PASS/FAIL kèm bằng chứng thực thi

Tất cả các ca kiểm thử dưới đây đã được thực thi trực tiếp qua bộ test tự động `scratch/test_all_16_mandatory_cases.py` kết nối trực tiếp đến hệ thống đang chạy tại `http://localhost:8083`.

| STT | Tên trường hợp kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Giảng viên đăng nhập thành công | `username: 'gv1'`, `password: 'gv1'` | HTTP 200, role = 1 | HTTP 200, role=1, username=gv1 | **PASS** |
| **TC-02** | Sinh viên đăng nhập xem đúng cổng sinh viên | `username: 'dtc1'`, `password: 'dtc1'` | HTTP 200, role = 0, cổng SV có TKB & điểm | HTTP 200, role=0, student_name=Đặng Quốc Huy, schedules=5 | **PASS** |
| **TC-03** | Admin đăng nhập giữ nguyên giao diện và quyền Admin | `username: 'admin'`, `password: 'admin123'` | HTTP 200, role = 2, truy cập danh sách sinh viên quản trị | HTTP 200, role=2, total_students=8 | **PASS** |
| **TC-04** | Giảng viên chỉ thấy menu phù hợp với Role 1 | Kiểm tra DOM sidebar & main.js toggle | 8 menu Giảng viên hiển thị, menu Admin & Sinh viên ẩn | `has_8_nav_items=True`, `has_toggle_logic=True` | **PASS** |
| **TC-05** | Giảng viên xem đúng lịch giảng dạy của mình | `GET /api/lecturer/portal` (session `gv1`) | Danh sách lịch dạy thuộc `lecturer_id = 64` | `total_schedules=5`, `assigned_to_lecturer=True` | **PASS** |
| **TC-06** | Giảng viên xem lớp và sinh viên thuộc phạm vi phân công | `GET /api/lecturer/portal` (session `gv1`) | Danh sách lớp và sinh viên được phân công | `classes_count=1`, `students_count=8` | **PASS** |
| **TC-07** | Giảng viên cập nhật điểm hợp lệ thành công | `POST /api/lecturer/grades/<id>` với CC=9.5, GK=8.5, CK=9.0, Buổi nghỉ=1 | HTTP 200, điểm tổng kết tự động tính lại | HTTP 200, message: "Cập nhật điểm và số buổi nghỉ thành công!" | **PASS** |
| **TC-08** | Điểm sai định dạng hoặc ngoài giới hạn bị từ chối | `diem_cuoi_ky: 15.0`, `diem_chuyen_can: -2.0`, `so_buoi_nghi: -1` | HTTP 400 Bad Request cho tất cả các ca | HTTP 400 cho cả 3 trường hợp vi phạm | **PASS** |
| **TC-09** | Giảng viên không thể sửa điểm học phần không được phân công | `POST /api/lecturer/grades/<unassigned_id>` từ tài khoản `gv1` | HTTP 403 Forbidden (hoặc 404 nếu không tồn tại) | HTTP 403 / 404 chặn chặt chẽ | **PASS** |
| **TC-10** | Giảng viên tạo và xem bài tập đúng phạm vi | `POST /api/lecturer/assignments` đề bài KTPM | HTTP 201 Created, bài tập xuất hiện trong portal | HTTP 201 Created, xuất hiện trong danh sách bài tập | **PASS** |
| **TC-11** | Sinh viên nộp bài, giảng viên nhận bài và chấm điểm | `POST submit` từ `dtc1`, `POST grade` từ `gv1` (score: 9.5) | Nộp bài thành công, GV thấy bài nộp, chấm bài thành công | Submit HTTP 200, GV nhận được bài, Grade HTTP 200 | **PASS** |
| **TC-12** | Giảng viên không thể gọi trực tiếp API quản trị của Admin | `POST /students`, `DELETE /students/6`, `POST /users` từ `gv1` | HTTP 403 Forbidden | HTTP statuses: 403, 403, 403 | **PASS** |
| **TC-13** | Sinh viên không thể gọi API dành riêng cho Giảng viên | `GET /api/lecturer/portal`, `POST grades`, `POST assignments` từ `dtc1` | HTTP 403 Forbidden | HTTP statuses: 403, 403, 403 | **PASS** |
| **TC-14** | Người chưa đăng nhập không thể truy cập API cần xác thực | `GET /api/lecturer/portal`, `/api/student/portal`, `/students` ẩn danh | HTTP 401 Unauthorized | HTTP statuses: 401, 401, 401 | **PASS** |
| **TC-15** | Đồ án/thực tập được hiển thị và thao tác đúng theo quyền | `POST /projects/<id>/approve`, `PUT /progress`, `GET /internships` | HTTP 200 phê duyệt đồ án, cập nhật tiến độ, xem thực tập | Approve HTTP 200, Progress HTTP 200, Internships HTTP 200 | **PASS** |
| **TC-16** | Không phát sinh lỗi JavaScript, lỗi API hoặc lỗi server | `GET /health`, `GET /`, kiểm tra cú pháp JS | Health status: healthy, HTTP 200, 0 lỗi cú pháp | Health HTTP 200 (healthy), Index HTTP 200, 0 lỗi | **PASS** |

---

## 7. Kết quả kiểm tra phân quyền (RBAC Matrix)

| Tài nguyên / API | Khách (Chưa đăng nhập) | Sinh viên (Role 0) | Giảng viên (Role 1) | Quản trị viên (Role 2) |
| :--- | :---: | :---: | :---: | :---: |
| `/login`, `/health` | Cho phép (200) | Cho phép (200) | Cho phép (200) | Cho phép (200) |
| `GET /api/student/portal` | Chặn (401) | Cho phép (200 - chỉ xem dữ liệu bản thân) | Cho phép (200 - nếu có `student_id`) | Cho phép (200) |
| `POST /api/student/assignments/<id>/submit` | Chặn (401) | Cho phép (200) | Chặn (403) | Chặn (403) |
| `GET /api/lecturer/portal` | Chặn (401) | Chặn (403) | Cho phép (200 - chỉ dữ liệu phân công) | Cho phép (200 - toàn quyền) |
| `POST /api/lecturer/grades/<id>` | Chặn (401) | Chặn (403) | Cho phép (200 - chỉ học phần được phân công, 403 nếu ngoài phạm vi) | Cho phép (200) |
| `POST /api/lecturer/assignments` | Chặn (401) | Chặn (403) | Cho phép (201) | Cho phép (201) |
| `POST /api/lecturer/submissions/<id>/grade` | Chặn (401) | Chặn (403) | Cho phép (200 - chỉ bài tập mình giao) | Cho phép (200) |
| `POST /projects/<id>/approve` | Chặn (401) | Chặn (403) | Cho phép (200 - chỉ đề tài mình hướng dẫn) | Cho phép (200) |
| `PUT /projects/<id>/progress` | Chặn (401) | Chặn (403) | Cho phép (200 - GVHD, GVPB, HĐ) | Cho phép (200) |
| `POST /students`, `DELETE /students/<id>` | Chặn (401) | Chặn (403) | Chặn (403) | Cho phép (200/201) |
| `GET /users`, `POST /users` | Chặn (401) | Chặn (403) | Chặn (403) | Cho phép (200/201) |

---

## 8. Tình trạng Docker và Địa chỉ truy cập

### Trạng thái các dịch vụ trong cụm Docker Compose (`docker-compose.yml`)
- `hethongqlsv_web` (Flask App): **Up & Healthy** (Chạy trên port nội bộ `5000`).
- `hethongqlsv_db` (MySQL 8.0): **Up & Healthy** (Port nội bộ `3306`, volume dữ liệu `mysql_data` được bảo toàn nguyên vẹn).
- `hethongqlsv_nginx` (Reverse Proxy & Web Server): **Up & Healthy** (Port máy chủ `8083`).
- `hethongqlsv_prometheus` (Hạ tầng Metrics): **Up** (Port `9092`).
- `hethongqlsv_grafana` (Dashboard Giám sát): **Up** (Port `3002`).
- `hethongqlsv_phpmyadmin` (Quản trị CSDL trực quan): **Up** (Port `8084`).
- `hethongqlsv_loki` & `promtail` (Thu thập & Quản lý Log tập trung): **Up**.

### Địa chỉ truy cập kiểm thử
- **Cổng thông tin chính (Web Application):** `http://localhost:8083`
- **Tài khoản Giảng viên thử nghiệm:** `gv1` / Mật khẩu: `gv1` (Role 1)
- **Tài khoản Sinh viên thử nghiệm:** `dtc1` / Mật khẩu: `dtc1` (Role 0)
- **Tài khoản Quản trị viên:** `admin` / Mật khẩu: `admin123` (Role 2)
- **Endpoint kiểm tra sức khỏe hệ thống:** `http://localhost:8083/health`
- **Grafana Dashboard:** `http://localhost:3002`
- **phpMyAdmin:** `http://localhost:8084`
- **Prometheus Metrics:** `http://localhost:9092`

---

## 9. Các vấn đề còn tồn tại
- Hiện tại, file bài tập nộp của sinh viên được lưu trữ dưới dạng định dạng chuỗi xác thực liên kết (tên file nén, link Drive hoặc repo GitHub). Khi quy mô triển khai lớn hơn trên môi trường phân tán nhiều node, khuyến nghị tích hợp thêm dịch vụ lưu trữ đối tượng (Object Storage như MinIO hoặc AWS S3) với cơ chế quét virus tự động (ClamAV) trước khi lưu trữ.

---

## 10. Xác nhận an toàn hệ thống & Dữ liệu gốc
1. **Dữ liệu thật:** Xác nhận **100% dữ liệu gốc trong CSDL không bị xóa hay thay đổi sai lệch**. Baseline: 8 sinh viên gốc, 3 tài khoản người dùng ban đầu, 4 khoa gốc được bảo toàn nguyên vẹn (xác nhận qua kiểm thử `INTEG-03` và `TC-DATA-01`).
2. **Cấu hình hạ tầng & Container:** Xác nhận **không can thiệp, dừng hoặc xóa bất kỳ container của dự án khác**. Không sử dụng lệnh `docker compose down -v`, không prune hệ thống hoặc xóa volume.
3. **Thư mục mã nguồn gốc được bảo vệ:** Xác nhận **không truy cập, sửa đổi hoặc tác động** vào thư mục `C:\Users\huyk6\Downloads\htplsinhvien-main\htplsinhvien-main`.
4. **Git Repository:** Xác nhận **không thực hiện `git commit`, `git push`** hoặc thay đổi bất kỳ remote repository nào.
5. **Tiêu chuẩn Frontend:** Toàn bộ các file `.html`, `.js`, `.css` **tuân thủ 100% nguyên tắc không chứa comment** (đã được kiểm tra và xác thực bởi script `verify_frontend_no_comments.py`).
