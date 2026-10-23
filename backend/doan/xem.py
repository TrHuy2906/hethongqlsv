from flask import jsonify, request, session
from models import DoAn, Student, Lecturer, User
from auth import login_required, role_required, get_current_student, get_current_lecturer
from . import doan_bp

# API Lấy danh sách đồ án (Hỗ trợ tìm kiếm, lọc)
@doan_bp.route('/projects', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_projects():
    query = DoAn.query
    
    code = request.args.get('code', '').strip()
    name = request.args.get('name', '').strip()
    status = request.args.get('status', '').strip()
    progress = request.args.get('progress', '').strip()
    lecturer_id = request.args.get('lecturer_id')
    student_id = request.args.get('student_id')

    if code:
        query = query.filter(DoAn.project_code.ilike(f'%{code}%'))
    if name:
        query = query.filter(DoAn.name.ilike(f'%{name}%'))
    if status:
        query = query.filter(DoAn.status == status)
    if progress:
        query = query.filter(DoAn.progress == progress)
    if lecturer_id:
        try:
            query = query.filter(DoAn.lecturer_id == int(lecturer_id))
        except ValueError:
            pass
    if student_id:
        try:
            query = query.filter(DoAn.student_id == int(student_id))
        except ValueError:
            pass

    projects = query.order_by(DoAn.id.desc()).all()
    return jsonify([p.to_dict() for p in projects])

# API Lấy chi tiết 1 đồ án
@doan_bp.route('/projects/<int:id>', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_project(id):
    project = DoAn.query.get(id)
    if not project:
        return jsonify({'error': 'Không tìm thấy đồ án'}), 404
    return jsonify(project.to_dict())

# API Lấy đồ án của chính sinh viên đang đăng nhập
@doan_bp.route('/projects/my', methods=['GET'])
@login_required
def get_my_project():
    user_role = session.get('role')

    if user_role == 0: # Sinh viên
        student = get_current_student()
        if not student:
            return jsonify({'error': 'Chưa liên kết hồ sơ sinh viên với tài khoản'}), 404
        project = DoAn.query.filter_by(student_id=student.id).first()
        if not project:
            return jsonify({'message': 'Bạn chưa đăng ký đồ án nào', 'project': None}), 200
        return jsonify({'project': project.to_dict()}), 200

    elif user_role == 1: # Giảng viên
        lecturer = get_current_lecturer()
        if not lecturer:
            return jsonify({'error': 'Chưa liên kết hồ sơ giảng viên với tài khoản'}), 404
        projects = DoAn.query.filter(
            (DoAn.lecturer_id == lecturer.id) | (DoAn.reviewer_id == lecturer.id)
        ).all()
        return jsonify({'projects': [p.to_dict() for p in projects]}), 200

    return jsonify({'message': 'Quản trị viên quản lý toàn bộ đồ án', 'project': None, 'projects': []}), 200

# API Lấy danh sách yêu cầu đăng ký đồ án gửi tới giảng viên đang đăng nhập
@doan_bp.route('/projects/requests', methods=['GET'])
@login_required
@role_required(1, 2)
def get_lecturer_requests():
    user_role = session.get('role')

    query = DoAn.query.filter(DoAn.status == 'Chờ duyệt')
    if user_role == 1:
        lecturer = get_current_lecturer()
        if not lecturer:
            return jsonify({'error': 'Chưa liên kết hồ sơ giảng viên'}), 404
        query = query.filter(DoAn.lecturer_id == lecturer.id)

    requests = query.order_by(DoAn.id.desc()).all()
    return jsonify([p.to_dict() for p in requests])

# API Lấy danh sách đồ án giảng viên đang hướng dẫn/phản biện
@doan_bp.route('/projects/my_students', methods=['GET'])
@login_required
@role_required(1, 2)
def get_lecturer_students():
    user_id = session.get('user_id')
    user_role = session.get('role')

    query = DoAn.query.filter(DoAn.status == 'Chấp nhận')
    if user_role == 1:
        lecturer = Lecturer.query.filter_by(account_id=user_id).first()
        if not lecturer:
            return jsonify({'error': 'Chưa liên kết hồ sơ giảng viên'}), 404
        query = query.filter(
            (DoAn.lecturer_id == lecturer.id) | (DoAn.reviewer_id == lecturer.id)
        )

    projects = query.order_by(DoAn.id.desc()).all()
    return jsonify([p.to_dict() for p in projects])
