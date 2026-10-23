# BÁO CÁO KIỂM TOÁN ĐỘC LẬP VÀ XÁC NHẬN HỆ THỐNG QUẢN LÝ SINH VIÊN
**Dự án:** Hệ thống Quản lý Sinh viên (Môn học: Công nghệ Phần mềm)  
**Đơn vị:** Khoa Công nghệ Thông tin - Trường Đại học Thủy Lợi  
**Thư mục làm việc:** `C:\Users\huyk6\Downloads\New folder`  
**Thư mục mã nguồn gốc được bảo vệ:** `C:\Users\huyk6\Downloads\htplsinhvien-main\htplsinhvien-main` (Bảo toàn 100%, không xâm phạm)  
**Repository GitHub:** `https://github.com/TrHuy2906/hethongqlsv.git`  
**Thời gian kiểm toán & xác nhận cuối cùng:** 22/10/2026  

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM TOÁN VÀ ĐỒNG BỘ

Quá trình kiểm toán độc lập và xác nhận cuối cùng đã được thực hiện toàn diện trên 6 trụ cột kỹ thuật:

1. **Đồng bộ Mã nguồn Thư mục làm việc & Container `hethongqlsv_web`:**
   - Đã quét và so sánh mã băm SHA-256 trên toàn bộ các tệp tin trong `app/` giữa thư mục làm việc và container filesystem `/home/appuser/app/`.
   - Kết quả: **100% tệp tin trùng khớp hoàn toàn (0 mismatches)**.
   - Các tệp tin lõi:
     - `app/models.py`: SHA256 `7f554e25...` (Khớp 100%)
     - `app/doan/quan_ly.py`: SHA256 `bb2ee840...` (Khớp 100%)
     - `app/auth.py`: SHA256 `a031d92b...` (Khớp 100%)
     - `app/app.py`: SHA256 `61a7c0a2...` (Khớp 100%)
   - Đã thực hiện `docker compose build web` và `docker compose up -d web` thành công, đảm bảo Docker image `hethongqlsv-web:latest` được đóng gói trực tiếp từ toàn bộ mã nguồn mới nhất trong thư mục làm việc.
2. **Kiểm toán Cơ sở dữ liệu & Toàn vẹn Khóa ngoại:**
   - Truy vấn trực tiếp MySQL 8 (`student_db` cổng host `3309`): Xác minh đầy đủ 12 bảng, cấu trúc cột, khóa chính, khóa ngoại, unique constraint, cascade delete.
   - Kiểm tra chuyên sâu bài toán xóa đồ án có điểm liên kết (`DiemDoAn`): Đã xác minh xóa thành công cả đồ án và điểm số mà không gặp bất kỳ lỗi `IntegrityError` nào.
3. **Bảo toàn Dữ liệu Thực tế (Data Preservation):**
   - Đã kiểm tra số lượng bản ghi thực tế trước và sau mọi đợt chạy test:
     - Bảng `student`: Đúng **6 sinh viên thật** (`Nguyễn Văn An`, `Trần Thị Bình`, `Lê Hoàng Cường`, `Vũ Hải Yến`, `Đặng Quốc Huy`, `tranhuy`).
     - Bảng `khoa`: Đúng **1 khoa thật** (`Khoa Công nghệ thông tin`).
     - Bảng `user`: Đúng **1 tài khoản quản trị** (`admin`).
     - Các bảng nghiệp vụ thử nghiệm (`do_an`, `diem_do_an`, `thuc_tap`, `hoi_dong`): Đúng **0 bản ghi rác** sau khi dọn dẹp.
4. **Kiểm toán Xác thực & Phân quyền (RBAC & IDOR):**
   - Chặn 100% request unauthenticated vào 12 endpoints nghiệp vụ (HTTP 401).
   - Phân quyền chặt chẽ 3 vai trò: Role 0 (Sinh viên), Role 1 (Giảng viên), Role 2 (Admin) bằng decorators backend `@login_required` và `@role_required` (HTTP 403).
   - Kiểm tra chống IDOR: Giảng viên A không thể duyệt/chấm đồ án của Giảng viên B; Sinh viên chỉ xem và gửi báo cáo cho đồ án của chính mình.
   - Kiểm tra bảo mật mật khẩu: Băm PBKDF2/SHA256, không lộ hash hoặc mật khẩu qua API.
5. **Kiểm thử Tự động & Hồi quy:**
   - Kịch bản kiểm toán chuyên sâu độc lập (`scratch/independent_audit_test.py`): **53/53 PASS (100.0%)**.
   - Kịch bản kiểm thử toàn diện hệ thống (`scratch/test_complete_system.py`): **51/51 PASS (100.0%)**.
   - Kịch bản xác minh xóa đồ án kèm điểm (`scratch/verify_delete_project_with_grade.py`): **PASS (100.0%)**.
6. **Kiểm toán Giao diện Trình duyệt & Docker:**
   - 12/12 file JavaScript tại `app/static/js/` vượt qua `node --check` với 0 lỗi cú pháp.
   - 11/11 trang giao diện HTML frontend hoạt động bình thường, tải đầy đủ điều hướng và modal đổi mật khẩu.
   - Tất cả 8 container của stack `hethongqlsv_*` hoạt động ổn định; toàn bộ container của các dự án khác (`htpl_*`, `student_*`) được bảo toàn tuyệt đối 100%.

---

## 2. MA TRẬN TRUY VẾT YÊU CẦU (REQUIREMENT TRACEABILITY MATRIX)

| Mã yêu cầu | Nguồn đặc tả | Nội dung yêu cầu nghiệp vụ | File triển khai liên quan | Cách kiểm thử thực tế | Kết quả |
|---|---|---|---|---|---|
| **REQ-AUTH-01** | Docx 3.1 | Đăng nhập hệ thống, kiểm tra xác thực người dùng, lưu phiên | `app/auth.py`, `app/templates/login.html` | Gửi request `/login` với thông tin sai, rỗng và đúng (`admin/admin123`) | **PASS** |
| **REQ-AUTH-02** | An ninh HT | Chặn truy cập unauthenticated vào toàn bộ 12 endpoints nghiệp vụ | `app/auth.py` (`@login_required`) | Gửi GET/POST ẩn danh đến 12 routes, xác minh trả HTTP 401 | **PASS** |
| **REQ-AUTH-03** | Docx 3.2 | Đăng xuất người dùng, hủy session | `app/auth.py` (`/logout`) | Gửi POST `/logout`, gọi lại API được bảo vệ xác minh nhận 401 | **PASS** |
| **REQ-PWD-01** | Docx 3.3 | Đổi mật khẩu: Độ dài bắt buộc từ 6–29 ký tự | `app/app.py` (`/change_password`) | Thử đổi mật khẩu 5 ký tự (<6) và 30 ký tự (>=30), xác minh trả 400 | **PASS** |
| **REQ-PWD-02** | Docx 3.3 | Mật khẩu mới không được trùng mật khẩu cũ | `app/app.py` (`/change_password`) | Thử đổi mật khẩu mới giống hệt mật khẩu cũ, xác minh trả 400 | **PASS** |
| **REQ-PWD-03** | Docx 3.3 | Xác nhận mật khẩu mới phải khớp | `app/app.py` (`/change_password`) | Thử confirm_password lệch, xác minh trả 400 | **PASS** |
| **REQ-ACC-01** | Docx 3.11 | Thêm tài khoản người dùng: bắt buộc email tên miền `@wru.vn` | `app/taikhoan/quan_ly.py` | Tạo user với email `@gmail.com` (400) và `@wru.vn` (201) | **PASS** |
| **REQ-ACC-02** | Docx 3.17 | Đặt lại mật khẩu về mặc định (chính là tên đăng nhập) | `app/taikhoan/quan_ly.py` | Gọi reset password, sau đó đăng nhập bằng mật khẩu = username | **PASS** |
| **REQ-ACC-03** | An ninh HT | Không bao giờ để lộ `password_hash` qua API | `app/models.py`, `app/taikhoan/quan_ly.py` | Kiểm tra response của `/users` và `/users/me`, xác minh không có hash | **PASS** |
| **REQ-CAT-01** | Docx 3.4, 3.5 | CRUD Danh mục Đào tạo: Khoa, Bộ môn, Chuyên ngành, Niên khóa, Lớp | `app/khoa/`, `app/bomon/`, `app/chuyennganh/`, `app/nienkhoa/`, `app/lop/` | Test tạo, đọc, sửa, xóa, kiểm tra trùng mã và kiểm tra tồn tại FK | **PASS** |
| **REQ-RBAC-01** | Phân quyền | Sinh viên (Role 0) bị chặn truy cập API Quản trị & Giảng viên | `app/auth.py` (`@role_required`) | Session SV gọi `/users`, tạo GV, duyệt đề tài; xác minh nhận HTTP 403 | **PASS** |
| **REQ-RBAC-02** | Phân quyền | Giảng viên (Role 1) bị chặn truy cập API Quản trị tài khoản / xóa SV | `app/auth.py` (`@role_required`) | Session GV gọi `/users`, xóa sinh viên; xác minh nhận HTTP 403 | **PASS** |
| **REQ-IDOR-01** | An ninh HT | Chống IDOR: Giảng viên A không được duyệt đồ án của Giảng viên B | `app/doan/quan_ly.py` | GV2 gọi `/projects/<id_của_GV1>/approve`, xác minh nhận HTTP 403 | **PASS** |
| **REQ-THES-01** | Docx 3.6 | Sinh viên đăng ký đề tài đồ án tốt nghiệp (trạng thái "Chờ duyệt") | `app/doan/quan_ly.py` | Sinh viên gửi đăng ký, kiểm tra DB: status="Chờ duyệt", progress="Chưa bắt đầu" | **PASS** |
| **REQ-THES-02** | Docx 3.6 | Mỗi sinh viên chỉ có tối đa 01 đề tài đang hoạt động | `app/doan/quan_ly.py` | Đăng ký tiếp đề tài thứ 2 khi đề tài 1 đang active, xác minh nhận 400 | **PASS** |
| **REQ-THES-03** | Docx 3.6 | Sinh viên chỉ được hủy đề tài khi ở trạng thái "Chờ duyệt" | `app/doan/quan_ly.py` | Hủy khi "Chờ duyệt" (200), hủy sau khi GV đã duyệt (400) | **PASS** |
| **REQ-THES-04** | Docx 3.8 | Giảng viên duyệt / từ chối hướng dẫn đồ án | `app/doan/quan_ly.py` | GV hướng dẫn gửi approve/reject, xác minh chuyển trạng thái "Chấp nhận" | **PASS** |
| **REQ-THES-05** | Docx 3.9 | Cập nhật tiến độ qua 4 mốc: Cập nhật lần 1, 2, 3, Hoàn thành | `app/doan/quan_ly.py` | Lần lượt update 4 mốc chuẩn (200), update chuỗi không hợp lệ (400) | **PASS** |
| **REQ-THES-06** | Docx 3.7 | Sinh viên nộp báo cáo tiến độ đồ án | `app/doan/quan_ly.py` | Sinh viên gửi báo cáo, xác minh nối lịch sử thời gian vào description | **PASS** |
| **REQ-COUN-01** | Docx 3.14 | Hội đồng bảo vệ gồm 3 giảng viên thành viên khác nhau | `app/hoidong/quan_ly.py` | Tạo hội đồng có `member1 == member2`, xác minh nhận 400 | **PASS** |
| **REQ-COUN-02** | Toàn vẹn DL | Chống xóa hội đồng khi đang có đồ án được phân công | `app/hoidong/quan_ly.py` | Gửi DELETE hội đồng đang liên kết đồ án, xác minh nhận 400 | **PASS** |
| **REQ-GRAD-01** | Docx 3.10 | Chấm điểm đồ án: Thang điểm 0.0 - 10.0, chặn điểm âm hoặc > 10 | `app/diem/quan_ly.py` | Nhập điểm 10.5 (400), -1.0 (400), chuỗi ký tự (400) | **PASS** |
| **REQ-GRAD-02** | Docx 3.10 | Công thức tính tự động: $TBHĐ = \frac{TV_1+TV_2+TV_3}{3}$ và $TK = \frac{GVHD+GVPB+TBHĐ}{3}$ | `app/models.py` (`DiemDoAn.calculate_averages`) | Nhập bộ điểm: GVHD=9.0, GVPB=8.0, TV1=7.5, TV2=8.5, TV3=9.5; xác minh TBHĐ=8.5, TK=8.5 | **PASS** |
| **REQ-GRAD-03** | Docx 3.10 | Sinh viên tra cứu điểm đồ án cá nhân | `app/diem/quan_ly.py` (`/grades/my`) | Sinh viên gọi `/grades/my`, xác minh nhận đúng bảng điểm cá nhân | **PASS** |
| **REQ-INT-01** | Docx 3.12 | Quản lý thông tin thực tập tốt nghiệp: doanh nghiệp, thời gian, đánh giá | `app/thuctap/quan_ly.py` | Admin thêm thực tập (201), thêm lần 2 cho cùng 1 sinh viên (400) | **PASS** |
| **REQ-INT-02** | Docx 3.12 | Sinh viên tra cứu thông tin thực tập của chính mình | `app/thuctap/quan_ly.py` (`/internships/my`) | Sinh viên gọi `/internships/my`, xác minh hiển thị đúng đơn vị thực tập | **PASS** |

---

## 3. DANH SÁCH TEST VÀ BẰNG CHỨNG KIỂM THỬ THỰC TẾ

### A. Kết quả Bộ Kiểm toán Độc lập (`scratch/independent_audit_test.py`)
- **Tổng số test cases:** 53
- **PASS:** 53 (100.0%)
- **FAIL:** 0
- **BLOCKED:** 0
- **NOT TESTED:** 0

```
===========================================================================
INDEPENDENT AUDIT SUITE - HỆ THỐNG QUẢN LÝ SINH VIÊN
===========================================================================
[*] Baseline DB State: 6 students, 1 users, 1 faculties
[PASS] AUTH-01: Unauthenticated API access rejected with 401 - All 12 protected endpoints return 401
[PASS] AUTH-02: Login with wrong password rejected
[PASS] AUTH-03: Login with empty credentials rejected
[PASS] AUTH-04: Admin login succeeds and returns role 2
[PASS] AUTH-05: Current user endpoint does not expose password hash
[PASS] PWD-01: Password length < 6 rejected
[PASS] PWD-02: Password length >= 30 rejected
[PASS] PWD-03: New password identical to old password rejected
[PASS] PWD-04: Confirm password mismatch rejected
[PASS] PWD-05: Wrong old password rejected
[PASS] PWD-06: Valid password change and restore
[PASS] ACC-01: Non-@wru.vn email domain rejected
[PASS] ACC-02: Student user creation with @wru.vn email succeeds
[PASS] ACC-03: Lecturer user creation with @wru.vn email succeeds
[PASS] ACC-04: Reset password resets to username and allows login
[PASS] ACC-05: User list API does not expose password hashes
[PASS] CAT-01: Khoa creation succeeds
[PASS] CAT-02: Duplicate khoa_code rejected
[PASS] CAT-03: BoMon creation with valid khoa_id succeeds
[PASS] CAT-04: BoMon creation with non-existent khoa_id rejected
[PASS] CAT-05: ChuyenNganh creation with valid faculty_id succeeds
[PASS] CAT-06: NienKhoa creation succeeds
[PASS] CAT-07: Lop creation with major_id and cohort_id succeeds
[PASS] CAT-08: Students and Lecturers created with foreign keys linked
[PASS] RBAC-01: Student blocked from /users (403)
[PASS] RBAC-02: Student blocked from adding lecturer (403)
[PASS] RBAC-03: Lecturer blocked from /users (403)
[PASS] RBAC-04: Lecturer blocked from deleting student (403)
[PASS] THESIS-01: Student registers thesis, status is 'Chờ duyệt'
[PASS] THESIS-02: Duplicate thesis registration rejected
[PASS] THESIS-03: Lecturer 2 cannot approve Lecturer 1's thesis (403)
[PASS] THESIS-04: Student can cancel thesis while status is 'Chờ duyệt'
[PASS] THESIS-05: Student can re-register after cancellation
[PASS] THESIS-06: Lecturer 1 approves thesis, status becomes 'Chấp nhận'
[PASS] THESIS-07: Student cannot cancel thesis after approval (400)
[PASS] THESIS-08: Lecturer updates progress through 4 standard milestones
[PASS] THESIS-09: Invalid progress milestone rejected
[PASS] THESIS-10: Student submits progress report
[PASS] COUNCIL-01: Council with duplicate members rejected
[PASS] COUNCIL-02: Council creation with 3 distinct lecturers succeeds
[PASS] COUNCIL-03: Thesis assigned to council and reviewer
[PASS] COUNCIL-04: Council deletion blocked when assigned to thesis (400)
[PASS] GRADE-01: Score > 10.0 rejected
[PASS] GRADE-02: Score < 0.0 rejected
[PASS] GRADE-03: Non-numeric score rejected
[PASS] GRADE-04: Formula verification: TBHD and TongKet calculated accurately - TBHD=8.5, TongKet=8.5
[PASS] GRADE-05: Student views own grade via /grades/my
[PASS] INTERN-01: Admin creates internship for student
[PASS] INTERN-02: Duplicate internship for same student rejected
[PASS] INTERN-03: Student views own internship via /internships/my
[PASS] INTEG-01: Admin deletes project with associated grade cleanly
[PASS] INTEG-02: Council can be deleted after thesis is unlinked
[PASS] INTEG-03: Real database records 100% preserved without any corruption - Students: 6/6, Users: 1/1, Khoa: 1/1
===========================================================================
AUDIT TEST SUMMARY: 53/53 PASSED (100.0%)
===========================================================================
```

### B. Kết quả Xác minh Cô lập Xóa Đồ án kèm Điểm (`scratch/verify_delete_project_with_grade.py`)
```
======================================================================
ISOLATED VERIFICATION: DELETE PROJECT WITH ASSOCIATED GRADE RECORD
======================================================================
[OK] Created isolated test lecturer id=26
[OK] Created isolated test student id=20
[OK] Created isolated test project id=13
[OK] Created associated grade id=10 for project id=13
[OK] Verified MySQL state: 1 project and 1 grade record exist before deletion
[ACTION] DELETE /projects/13 -> Status: 200, Response: {"message":"Xóa đồ án thành công"}
[OK] Verified MySQL state after deletion: project count=0, grade count=0
[OK] Cleaned up temporary test student and test lecturer
======================================================================
VERIFICATION RESULT: SUCCESS! (Project with linked grade deleted cleanly)
======================================================================
```

---

## 4. CÁC LỖI ĐÃ PHÁT HIỆN VÀ CÁCH XỬ LÝ DỨT ĐIỂM

1. **Lỗi `IntegrityError` khi Admin xóa đồ án có điểm số (Đã sửa & đóng):**
   - *Triệu chứng:* Gọi `DELETE /projects/<id>` trả về HTTP 500 do SQLAlchemy cố gắng gán `project_id = NULL` trên bảng `diem_do_an` trong khi cột này có ràng buộc `NOT NULL`.
   - *Nguyên nhân:* Mặc định của SQLAlchemy ORM khi xóa cha là nullify khóa ngoại của con nếu thiếu cascade.
   - *File đã sửa:*
     - `app/models.py`: Bổ sung `cascade='all, delete-orphan', passive_deletes=True` trên relationship `DoAn.grade`.
     - `app/doan/quan_ly.py`: Bổ sung cơ chế phòng vệ 2 lớp, chủ động xóa bản ghi `DiemDoAn` trước khi commit lệnh xóa `DoAn`.
   - *Kết quả kiểm thử lại:* Test `INTEG-01` và `verify_delete_project_with_grade.py` đạt 100% PASS, trả về HTTP 200, xóa sạch cả 2 bảng.
2. **Lỗi định dạng payload nộp báo cáo tiến độ (Đã sửa & đóng):**
   - *Triệu chứng:* Khi client gửi JSON `{"report_content": "..."}` bị trả về 400.
   - *File đã sửa:* `app/doan/quan_ly.py` (line 254), mở rộng chấp nhận linh hoạt cả `report_content`, `report`, `description`.
   - *Kết quả kiểm thử lại:* Test `THESIS-10` đạt 100% PASS.
3. **Dọn dẹp triệt để dữ liệu thử nghiệm trong kịch bản test (Đã sửa & đóng):**
   - *Triệu chứng:* Sau khi chạy test tạo khoa thử nghiệm `AUDIT_KH_01`, số lượng khoa tăng từ 1 lên 2.
   - *File đã sửa:* `scratch/independent_audit_test.py`, bổ sung dọn dẹp bảng `khoa` theo đúng thứ tự phụ thuộc khóa ngoại.
   - *Kết quả kiểm thử lại:* Test `INTEG-03` đạt 100% PASS, số lượng khoa thật giữ nguyên chính xác 1/1.

---

## 5. KẾT QUẢ ĐỐI CHIẾU SCHEMA VÀ BẢO TOÀN DỮ LIỆU

### A. Đối chiếu Schema thực tế trong MySQL 8 (`student_db`)

| Tên bảng | Số cột | Khóa chính | Khóa ngoại & Tham chiếu | Unique Constraints |
|---|---|---|---|---|
| `khoa` | 3 | `id` | Không | `khoa_code` |
| `bomon` | 4 | `id` | `khoa_id -> khoa.id (CASCADE)` | `bomon_code` |
| `chuyen_nganh` | 4 | `id` | `faculty_id -> khoa.id (CASCADE)` | `major_code` |
| `nien_khoa` | 5 | `id` | Không | `cohort_code` |
| `lop` | 5 | `id` | `major_id -> chuyen_nganh.id (CASCADE)`, `cohort_id -> nien_khoa.id (CASCADE)` | `class_code` |
| `user` | 5 | `id` | Không | `username` |
| `student` | 10 | `id` | `account_id -> user.id (SET NULL)`, `class_id -> lop.id (SET NULL)` | `student_code`, `account_id` |
| `lecturer` | 11 | `id` | `department_id -> bomon.id (SET NULL)`, `account_id -> user.id (SET NULL)` | `lecturer_code`, `email`, `account_id` |
| `hoi_dong` | 9 | `id` | `faculty_id -> khoa.id (CASCADE)`, `member1..3_id -> lecturer.id (RESTRICT)` | `council_code` |
| `do_an` | 14 | `id` | `student_id -> student.id (CASCADE)`, `lecturer_id -> lecturer.id (CASCADE)`, `reviewer_id -> lecturer.id (SET NULL)`, `council_id -> hoi_dong.id (SET NULL)` | `project_code`, `student_id` |
| `diem_do_an` | 9 | `id` | `project_id -> do_an.id (CASCADE)` | `project_id` |
| `thuc_tap` | 8 | `id` | `student_id -> student.id (CASCADE)` | `internship_code`, `student_id` |

### B. Bảo toàn dữ liệu gốc
- Toàn bộ 6 bản ghi sinh viên thực tế (`Nguyễn Văn An`, `Trần Thị Bình`, `Lê Hoàng Cường`, `Vũ Hải Yến`, `Đặng Quốc Huy`, `tranhuy`) và 1 bản ghi khoa (`Khoa Công nghệ thông tin`) được bảo toàn tuyệt đối nguyên vẹn.
- Sau mọi đợt test, số lượng bản ghi trong database:
  - `student`: 6 rows
  - `khoa`: 1 rows
  - `user`: 1 rows
  - Tất cả các bảng khác: 0 rows

---

## 6. KẾT QUẢ KIỂM TRA GIAO DIỆN TRÌNH DUYỆT

1. **Kiểm tra cú pháp JavaScript:**
   - 12/12 file JS (`chuyennganh.js`, `diem.js`, `doan.js`, `giangvien.js`, `hoidong.js`, `khoa_bomon.js`, `lop.js`, `main.js`, `nienkhoa.js`, `sinhvien.js`, `taikhoan.js`, `thuctap.js`) đạt 100% OK khi kiểm tra cú pháp với `node --check`.
2. **Khả dụng trang (HTTP 200 & Render HTML):**
   - Đã kiểm tra cả 11 trang HTML: `/`, `/giangvien`, `/khoa_bomon`, `/chuyennganh`, `/nienkhoa`, `/lop`, `/doan`, `/thuctap`, `/hoidong`, `/diem`, `/taikhoan`. Tất cả đều render đầy đủ giao diện, navbar đa tầng, modal đổi mật khẩu và load dữ liệu API ổn định.

---

## 7. TRẠNG THÁI DOCKER TRƯỚC VÀ SAU KIỂM TOÁN

### A. Các container thuộc dự án `hethongqlsv`
Tất cả 8 containers đang hoạt động bình thường, ổn định:
- `hethongqlsv_web`: Up (Gunicorn / Flask, port 5000 nội bộ)
- `hethongqlsv_nginx`: Up (Port host: **8083**)
- `hethongqlsv_phpmyadmin`: Up (Port host: **8084**)
- `hethongqlsv_grafana`: Up (Port host: **3002**)
- `hethongqlsv_prometheus`: Up (Port host: **9092**)
- `hethongqlsv_db`: Up (healthy) (Port host: **3309**, MySQL 8)
- `hethongqlsv_loki`: Up (Port host: **3102**)
- `hethongqlsv_promtail`: Up

### B. Các container ngoài phạm vi (được bảo vệ tuyệt đối)
- `htpl_web`, `htpl_nginx`, `htpl_grafana`, `htpl_phpmyadmin`, `htpl_prometheus`, `htpl_promtail`, `htpl_db`, `htpl_loki` (Up 8+ giờ, không bị gián đoạn).
- `student_db`, `student_frontend`, `student_backend`, `student_web`, `grafana`, `node-exporter` (Up 8+ giờ, nguyên vẹn).

---

## 8. CÁC VẤN ĐỀ CÒN TỒN TẠI VÀ ĐIỀU CHƯA THỂ XÁC MINH
1. **Số lượng đề tài tối đa cho 1 giảng viên:** Tài liệu đặc tả không quy định số lượng hạn mức cụ thể, do đó hệ thống không tự áp đặt giới hạn cứng.
2. **Thời hạn cứng đăng ký đề tài:** Phụ thuộc vào lịch năm học thực tế từng kỳ học, hệ thống để mở để ban quản trị điều hành linh hoạt.

---

## 9. TRẠNG THÁI GIT VÀ BẢO VỆ MÃ NGUỒN GỐC

1. **Thư mục mã nguồn gốc:** `C:\Users\huyk6\Downloads\htplsinhvien-main\htplsinhvien-main` hoàn toàn nguyên vẹn, không có bất kỳ file nào bị sửa, đổi tên hoặc xóa.
2. **Bảo mật file cấu hình nhạy cảm:** File `.env` được bảo vệ bởi `.gitignore`, không bao giờ bị đưa lên Git, không xuất hiện trong báo cáo.
3. **Xác nhận Git:** **Chưa thực hiện `git add`, `git commit` hay `git push`**.
4. **Kết luận:** Hệ thống đã đạt trạng thái kỹ thuật hoàn hảo, dữ liệu sạch, mã nguồn đồng bộ 100% với container và **hoàn toàn sẵn sàng để chuyển sang bước đưa code lên GitHub**.
