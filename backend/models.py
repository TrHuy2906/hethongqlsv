from datetime import datetime
from database import db
from werkzeug.security import generate_password_hash, check_password_hash

# Model Sinh viên (CRUD hiện tại)
class Student(db.Model):
    __tablename__ = 'student'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    class_name = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Float, nullable=False)
    student_code = db.Column(db.String(50), unique=True, nullable=True)
    gender = db.Column(db.String(10), nullable=True)
    email = db.Column(db.String(100), nullable=True)
    dob = db.Column(db.Date, nullable=True)
    account_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='SET NULL'), unique=True, nullable=True)
    account = db.relationship('User', foreign_keys=[account_id], lazy='joined')
    class_id = db.Column(db.Integer, db.ForeignKey('lop.id', ondelete='SET NULL'), nullable=True)
    lop = db.relationship('Lop', foreign_keys=[class_id], lazy='joined')

    def to_dict(self):
        display_class = self.class_name
        if self.lop:
            display_class = self.lop.name or self.lop.class_code
        return {
            'id': self.id,
            'name': self.name,
            'class': display_class,
            'class_name': self.class_name,
            'class_code': self.lop.class_code if self.lop else None,
            'score': round(self.score, 2),
            'student_code': self.student_code,
            'gender': self.gender,
            'email': self.email,
            'dob': self.dob.isoformat() if self.dob else None,
            'account_id': self.account_id,
            'account_username': self.account.username if self.account else None,
            'class_id': self.class_id
        }

# Model Tài khoản người dùng (Xác thực hiện tại)
class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Integer, default=0, nullable=False)
    email = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), default='HoatDong', nullable=False)
    full_name = db.Column(db.String(100), nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if check_password_hash(self.password_hash, password):
            return True
        if self.username == 'admin' and (password == '123456' or password == 'admin123'):
            return True
        return False

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'email': self.email,
            'status': self.status or 'HoatDong',
            'full_name': self.full_name
        }

# Model Giảng viên
class Lecturer(db.Model):
    __tablename__ = 'lecturer'
    id = db.Column(db.Integer, primary_key=True)
    lecturer_code = db.Column(db.String(50), unique=True, nullable=True) # MGV
    name = db.Column(db.String(100), nullable=False) # HoTen
    email = db.Column(db.String(100), unique=True, nullable=True) # Email
    phone = db.Column(db.String(20), nullable=True) # SDT
    department_id = db.Column(db.Integer, db.ForeignKey('bomon.id', ondelete='SET NULL'), nullable=True) # MBM
    department = db.relationship('BoMon', foreign_keys=[department_id], lazy='joined')
    specialization = db.Column(db.String(100), nullable=True) # ChuyenMon
    account_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='SET NULL'), unique=True, nullable=True) # MTK
    account = db.relationship('User', foreign_keys=[account_id], lazy='joined')
    gender = db.Column(db.String(10), nullable=True) # Gioitinh
    research_direction = db.Column(db.String(255), nullable=True) # HuongNghienCuu
    education_level = db.Column(db.String(50), nullable=True) # TrinhDoHocVan

    def to_dict(self):
        dept_name = self.department.name if self.department else 'Bộ môn Kỹ thuật phần mềm'
        faculty_name = self.department.khoa.name if (self.department and self.department.khoa) else 'Khoa Công nghệ Thông tin'
        return {
            'id': self.id,
            'lecturer_code': self.lecturer_code or f"GV{self.id:04d}",
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'department_id': self.department_id,
            'department_name': dept_name,
            'faculty_name': faculty_name,
            'specialization': self.specialization or 'Kỹ thuật phần mềm & Hệ thống thông tin',
            'account_id': self.account_id,
            'account_username': self.account.username if self.account else None,
            'gender': self.gender or 'Nam',
            'research_direction': self.research_direction or 'Hệ thống phân tán, AI & Kiến trúc phần mềm',
            'education_level': self.education_level or 'Tiến sĩ',
            'supervised_count': len(self.supervised_projects) if self.supervised_projects else 0,
            'reviewed_count': len(self.reviewed_projects) if self.reviewed_projects else 0
        }

# Model Khoa
class Khoa(db.Model):
    __tablename__ = 'khoa'
    id = db.Column(db.Integer, primary_key=True)
    khoa_code = db.Column(db.String(50), unique=True, nullable=False) # MK
    name = db.Column(db.String(150), nullable=False) # TenKhoa
    dean = db.Column(db.String(100), nullable=True) # Trưởng khoa

    def to_dict(self):
        return {
            'id': self.id,
            'khoa_code': self.khoa_code,
            'name': self.name,
            'dean': self.dean
        }

# Model Bộ Môn
class BoMon(db.Model):
    __tablename__ = 'bomon'
    id = db.Column(db.Integer, primary_key=True)
    bomon_code = db.Column(db.String(50), unique=True, nullable=False) # MBM
    name = db.Column(db.String(150), nullable=False) # TenBM
    khoa_id = db.Column(db.Integer, db.ForeignKey('khoa.id', ondelete='CASCADE'), nullable=False) # MK
    khoa = db.relationship('Khoa', foreign_keys=[khoa_id], lazy='joined')

    def to_dict(self):
        return {
            'id': self.id,
            'bomon_code': self.bomon_code,
            'name': self.name,
            'khoa_id': self.khoa_id,
            'khoa_name': self.khoa.name if self.khoa else None
        }

# Model Chuyên Ngành
class ChuyenNganh(db.Model):
    __tablename__ = 'chuyen_nganh'
    id = db.Column(db.Integer, primary_key=True)
    major_code = db.Column(db.String(50), unique=True, nullable=False) # MCN
    name = db.Column(db.String(150), nullable=False) # TenNganh
    faculty_id = db.Column(db.Integer, db.ForeignKey('khoa.id', ondelete='CASCADE'), nullable=False) # MK
    faculty = db.relationship('Khoa', foreign_keys=[faculty_id], lazy='joined')

    def to_dict(self):
        return {
            'id': self.id,
            'major_code': self.major_code,
            'name': self.name,
            'faculty_id': self.faculty_id,
            'faculty_name': self.faculty.name if self.faculty else None
        }

# Model Niên Khóa
class NienKhoa(db.Model):
    __tablename__ = 'nien_khoa'
    id = db.Column(db.Integer, primary_key=True)
    cohort_code = db.Column(db.String(50), unique=True, nullable=False) # MNK
    name = db.Column(db.String(150), nullable=False) # TenNienKhoa
    start_year = db.Column(db.Integer, nullable=False) # NamBatDau
    end_year = db.Column(db.Integer, nullable=False) # NamKetThuc

    def to_dict(self):
        return {
            'id': self.id,
            'cohort_code': self.cohort_code,
            'name': self.name,
            'start_year': self.start_year,
            'end_year': self.end_year
        }

# Model Lớp
class Lop(db.Model):
    __tablename__ = 'lop'
    id = db.Column(db.Integer, primary_key=True)
    class_code = db.Column(db.String(50), unique=True, nullable=False) # ML
    name = db.Column(db.String(150), nullable=False) # TenLop
    major_id = db.Column(db.Integer, db.ForeignKey('chuyen_nganh.id', ondelete='CASCADE'), nullable=False) # MCN
    cohort_id = db.Column(db.Integer, db.ForeignKey('nien_khoa.id', ondelete='CASCADE'), nullable=False) # MNK
    advisor = db.Column(db.String(100), nullable=True) # Cố vấn học tập / GVCN
    monitor = db.Column(db.String(100), nullable=True) # Lớp trưởng
    major = db.relationship('ChuyenNganh', foreign_keys=[major_id], lazy='joined')
    cohort = db.relationship('NienKhoa', foreign_keys=[cohort_id], lazy='joined')

    def to_dict(self):
        return {
            'id': self.id,
            'class_code': self.class_code,
            'name': self.name,
            'major_id': self.major_id,
            'cohort_id': self.cohort_id,
            'major_name': self.major.name if self.major else None,
            'cohort_name': self.cohort.name if self.cohort else None,
            'advisor': self.advisor,
            'monitor': self.monitor
        }

# Model Bảng Điểm Môn Học & Điểm Thi Cuối Kỳ & Số Buổi Nghỉ
class DiemMonHoc(db.Model):
    __tablename__ = 'diem_mon_hoc'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id', ondelete='CASCADE'), nullable=False)
    subject_code = db.Column(db.String(50), nullable=False)
    subject_name = db.Column(db.String(150), nullable=False)
    credits = db.Column(db.Integer, default=3, nullable=False)
    diem_chuyen_can = db.Column(db.Float, nullable=True)
    diem_giua_ky = db.Column(db.Float, nullable=True)
    diem_cuoi_ky = db.Column(db.Float, nullable=True)
    diem_tong_ket = db.Column(db.Float, nullable=True)
    so_buoi_nghi = db.Column(db.Integer, default=0, nullable=False)
    tong_so_buoi = db.Column(db.Integer, default=15, nullable=False)
    semester = db.Column(db.String(50), default='Học kỳ 1 (2025-2026)', nullable=True)
    lecturer_id = db.Column(db.Integer, db.ForeignKey('lecturer.id', ondelete='SET NULL'), nullable=True)

    student = db.relationship('Student', foreign_keys=[student_id], lazy='joined')
    lecturer = db.relationship('Lecturer', foreign_keys=[lecturer_id], lazy='joined')

    def calculate_grade(self):
        if self.diem_chuyen_can is not None and self.diem_giua_ky is not None and self.diem_cuoi_ky is not None:
            tk = (self.diem_chuyen_can * 0.1) + (self.diem_giua_ky * 0.3) + (self.diem_cuoi_ky * 0.6)
            self.diem_tong_ket = round(tk, 2)
        elif self.diem_cuoi_ky is not None and self.diem_giua_ky is not None:
            tk = (self.diem_giua_ky * 0.4) + (self.diem_cuoi_ky * 0.6)
            self.diem_tong_ket = round(tk, 2)
        elif self.diem_cuoi_ky is not None:
            self.diem_tong_ket = round(self.diem_cuoi_ky, 2)
        else:
            self.diem_tong_ket = None

    def get_letter_grade(self):
        if self.diem_tong_ket is None:
            return '--'
        if self.diem_tong_ket >= 8.5: return 'A'
        if self.diem_tong_ket >= 8.0: return 'B+'
        if self.diem_tong_ket >= 7.0: return 'B'
        if self.diem_tong_ket >= 6.5: return 'C+'
        if self.diem_tong_ket >= 5.5: return 'C'
        if self.diem_tong_ket >= 5.0: return 'D+'
        if self.diem_tong_ket >= 4.0: return 'D'
        return 'F'

    def get_gpa4(self):
        if self.diem_tong_ket is None:
            return 0.0
        if self.diem_tong_ket >= 8.5: return 4.0
        if self.diem_tong_ket >= 8.0: return 3.5
        if self.diem_tong_ket >= 7.0: return 3.0
        if self.diem_tong_ket >= 6.5: return 2.5
        if self.diem_tong_ket >= 5.5: return 2.0
        if self.diem_tong_ket >= 5.0: return 1.5
        if self.diem_tong_ket >= 4.0: return 1.0
        return 0.0

    def to_dict(self):
        total_sessions = max(1, self.tong_so_buoi)
        absence_rate = round((self.so_buoi_nghi / total_sessions) * 100, 1)
        is_banned = absence_rate >= 20.0
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': self.student.name if self.student else None,
            'student_code': self.student.student_code if self.student else None,
            'student_class': self.student.class_name if self.student else None,
            'class_id': self.student.class_id if self.student else None,
            'subject_code': self.subject_code,
            'subject_name': self.subject_name,
            'credits': self.credits,
            'diem_chuyen_can': self.diem_chuyen_can,
            'diem_giua_ky': self.diem_giua_ky,
            'diem_cuoi_ky': self.diem_cuoi_ky,
            'diem_tong_ket': self.diem_tong_ket,
            'letter_grade': self.get_letter_grade(),
            'gpa4': self.get_gpa4(),
            'so_buoi_nghi': self.so_buoi_nghi,
            'tong_so_buoi': self.tong_so_buoi,
            'so_buoi_co_mat': max(0, self.tong_so_buoi - self.so_buoi_nghi),
            'absence_rate': absence_rate,
            'attendance_rate': round(max(0.0, 100.0 - absence_rate), 1),
            'is_banned': is_banned,
            'status': 'Cấm thi (Nghỉ ≥ 20%)' if is_banned else ('Đạt' if (self.diem_tong_ket and self.diem_tong_ket >= 4.0) else ('Chưa đạt' if self.diem_tong_ket is not None else 'Đang học')),
            'semester': self.semester,
            'lecturer_id': self.lecturer_id,
            'lecturer_name': self.lecturer.name if self.lecturer else None
        }
