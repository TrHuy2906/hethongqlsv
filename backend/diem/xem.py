from flask import jsonify, request, session
from sqlalchemy import func
from database import db
from models import DiemMonHoc, Student, Lecturer, Lop
from auth import login_required, role_required, get_current_student, get_current_lecturer
from . import diem_bp

# API Lấy danh sách bảng điểm môn học (CRUD - Read)
@diem_bp.route('/grades', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_grades():
    user_role = session.get('role')
    query = DiemMonHoc.query.join(Student, DiemMonHoc.student_id == Student.id)
    
    # Sinh viên chỉ xem được điểm của chính mình
    if user_role == 0:
        student = get_current_student()
        if not student:
            return jsonify([])
        query = query.filter(DiemMonHoc.student_id == student.id)
    
    # Lọc theo từ khóa tìm kiếm (Tên SV, Mã SV, Môn học)
    search = request.args.get('search', '').strip()
    if search:
        query = query.filter(
            (Student.name.ilike(f'%{search}%')) |
            (Student.student_code.ilike(f'%{search}%')) |
            (DiemMonHoc.subject_name.ilike(f'%{search}%')) |
            (DiemMonHoc.subject_code.ilike(f'%{search}%'))
        )
    
    # Lọc theo môn học
    subject = request.args.get('subject', '').strip()
    if subject and subject != 'ALL':
        query = query.filter(DiemMonHoc.subject_code == subject)
        
    # Lọc theo lớp học
    class_name = request.args.get('class_name', '').strip()
    if class_name and class_name != 'ALL':
        query = query.filter(Student.class_name == class_name)

    grades = query.order_by(DiemMonHoc.id.desc()).all()
    return jsonify([g.to_dict() for g in grades])

# API Lấy thông tin chi tiết một bản ghi điểm môn học
@diem_bp.route('/grades/<int:id>', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_grade_detail(id):
    grade = DiemMonHoc.query.get(id)
    if not grade:
        return jsonify({'error': 'Không tìm thấy bản ghi điểm'}), 404
        
    user_role = session.get('role')
    if user_role == 0:
        student = get_current_student()
        if not student or grade.student_id != student.id:
            return jsonify({'error': 'Bạn không có quyền xem điểm của sinh viên khác'}), 403
            
    return jsonify(grade.to_dict())

# API Thống kê điểm số tổng quan
@diem_bp.route('/grades/stats', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_grade_stats():
    user_role = session.get('role')
    query = DiemMonHoc.query
    if user_role == 0:
        student = get_current_student()
        if student:
            query = query.filter_by(student_id=student.id)
            
    all_grades = query.all()
    total = len(all_grades)
    
    graded = [g for g in all_grades if g.diem_tong_ket is not None]
    avg_score = round(sum(g.diem_tong_ket for g in graded) / len(graded), 2) if graded else 0.0
    passed = len([g for g in graded if g.diem_tong_ket >= 4.0 and not g.to_dict()['is_banned']])
    excellent = len([g for g in graded if g.diem_tong_ket >= 8.0])
    banned = len([g for g in all_grades if g.to_dict()['is_banned']])
    failed = len([g for g in graded if g.diem_tong_ket < 4.0 or g.to_dict()['is_banned']])
    
    pass_rate = round((passed / len(graded) * 100), 1) if graded else 0.0
    
    return jsonify({
        'total': total,
        'avg_score': avg_score,
        'passed': passed,
        'pass_rate': pass_rate,
        'excellent': excellent,
        'banned': banned,
        'failed': failed
    })

# API Danh sách các môn học duy nhất
@diem_bp.route('/grades/subjects', methods=['GET'])
@login_required
def get_grade_subjects():
    records = db.session.query(DiemMonHoc.subject_code, DiemMonHoc.subject_name).distinct().all()
    return jsonify([{'code': r[0], 'name': r[1]} for r in records])
