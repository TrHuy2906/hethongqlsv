from flask import jsonify, request, session
from models import DiemDoAn, DoAn, Student, Lecturer
from auth import login_required, role_required, get_current_student, get_current_lecturer
from . import diem_bp

# API Lấy danh sách điểm đồ án (Hỗ trợ tìm kiếm theo sinh viên, đồ án)
@diem_bp.route('/grades', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_grades():
    query = DiemDoAn.query.join(DoAn)
    
    project_code = request.args.get('project_code', '').strip()
    student_code = request.args.get('student_code', '').strip()
    
    if project_code:
        query = query.filter(DoAn.project_code.ilike(f'%{project_code}%'))
    if student_code:
        query = query.join(Student).filter(Student.student_code.ilike(f'%{student_code}%'))

    grades = query.order_by(DiemDoAn.id.desc()).all()
    return jsonify([g.to_dict() for g in grades])

# API Lấy thông tin điểm của một đồ án cụ thể
@diem_bp.route('/grades/<int:project_id>', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_grade_by_project(project_id):
    grade = DiemDoAn.query.filter_by(project_id=project_id).first()
    if not grade:
        return jsonify({'error': 'Chưa có dữ liệu điểm cho đồ án này'}), 404
    return jsonify(grade.to_dict())

# API Sinh viên / Giảng viên xem điểm đồ án
@diem_bp.route('/grades/my', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_my_grade():
    user_id = session.get('user_id')
    user_role = session.get('role')

    if user_role == 0:
        student = get_current_student()
        if not student:
            return jsonify({'error': 'Chưa liên kết hồ sơ sinh viên'}), 404

        project = DoAn.query.filter_by(student_id=student.id).first()
        if not project:
            return jsonify({'message': 'Bạn chưa đăng ký đồ án', 'grade': None}), 200

        grade = DiemDoAn.query.filter_by(project_id=project.id).first()
        if not grade:
            return jsonify({'message': 'Đồ án chưa được chấm điểm', 'grade': None}), 200

        return jsonify({'grade': grade.to_dict()}), 200

    elif user_role == 1:
        lecturer = get_current_lecturer()
        if not lecturer:
            return jsonify({'error': 'Chưa liên kết hồ sơ giảng viên'}), 404
        projects = DoAn.query.filter(
            (DoAn.lecturer_id == lecturer.id) | (DoAn.reviewer_id == lecturer.id)
        ).all()
        p_ids = [p.id for p in projects]
        grades = DiemDoAn.query.filter(DiemDoAn.project_id.in_(p_ids)).all() if p_ids else []
        return jsonify({'grades': [g.to_dict() for g in grades], 'message': 'Danh sách điểm đồ án phụ trách'}), 200

    return jsonify({'message': 'Chức năng dành cho Sinh viên và Giảng viên', 'grade': None}), 200

