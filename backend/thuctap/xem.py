from flask import jsonify, request, session
from models import ThucTap, Student
from auth import login_required, role_required, get_current_student
from . import thuctap_bp

# API Lấy danh sách thực tập (Hỗ trợ tìm kiếm theo tên SV, MSV, công ty)
@thuctap_bp.route('/internships', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_internships():
    query = ThucTap.query.join(Student)
    
    student_name = request.args.get('student_name', '').strip()
    student_code = request.args.get('student_code', '').strip()
    company = request.args.get('company', '').strip()

    if student_name:
        query = query.filter(Student.name.ilike(f'%{student_name}%'))
    if student_code:
        query = query.filter(Student.student_code.ilike(f'%{student_code}%'))
    if company:
        query = query.filter(ThucTap.company_name.ilike(f'%{company}%'))

    internships = query.order_by(ThucTap.id.desc()).all()
    return jsonify([i.to_dict() for i in internships])

# API Lấy chi tiết 1 bản ghi thực tập
@thuctap_bp.route('/internships/<int:id>', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_internship(id):
    internship = ThucTap.query.get(id)
    if not internship:
        return jsonify({'error': 'Không tìm thấy thông tin thực tập'}), 404
    return jsonify(internship.to_dict())

# API Sinh viên / Giảng viên xem thông tin thực tập
@thuctap_bp.route('/internships/my', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_my_internship():
    user_id = session.get('user_id')
    user_role = session.get('role')

    if user_role == 0:
        student = get_current_student()
        if not student:
            return jsonify({'error': 'Chưa liên kết hồ sơ sinh viên'}), 404

        internship = ThucTap.query.filter_by(student_id=student.id).first()
        if not internship:
            return jsonify({'message': 'Bạn chưa có thông tin thực tập', 'internship': None}), 200

        return jsonify({'internship': internship.to_dict()}), 200

    elif user_role == 1:
        return jsonify({'message': 'Giảng viên tra cứu thực tập qua danh sách chung', 'internship': None}), 200

    return jsonify({'message': 'Thông tin thực tập cá nhân', 'internship': None}), 200

