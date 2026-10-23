from flask import jsonify, request, session
from models import User, Student, Lecturer
from auth import login_required, role_required
from . import taikhoan_bp

# API Lấy danh sách tài khoản (Chỉ Admin)
@taikhoan_bp.route('/users', methods=['GET'])
@login_required
@role_required(2)
def get_users():
    query = User.query
    username = request.args.get('username', '').strip()
    role = request.args.get('role')
    
    if username:
        query = query.filter(User.username.ilike(f'%{username}%'))
    if role is not None and role != '':
        try:
            query = query.filter(User.role == int(role))
        except ValueError:
            pass
            
    users = query.order_by(User.id.asc()).all()
    res = []
    for u in users:
        d = u.to_dict()
        fn = getattr(u, 'full_name', None)
        if u.role == 0:
            st = Student.query.filter_by(account_id=u.id).first()
            if st:
                d['full_name'] = st.name
                d['student_code'] = st.student_code
                d['class_name'] = st.lop.name if st.lop else st.class_name
                d['unit_info'] = f"Lớp: {st.lop.name if st.lop else st.class_name}"
                d['linked_profile'] = f"{st.name} ({st.student_code or 'ID:' + str(st.id)})"
            else:
                d['full_name'] = fn or u.username
                d['student_code'] = None
                d['class_name'] = None
                d['unit_info'] = 'Chưa liên kết lớp'
                d['linked_profile'] = None
        elif u.role == 1:
            lec = Lecturer.query.filter_by(account_id=u.id).first()
            if lec:
                d['full_name'] = lec.name
                d['lecturer_code'] = lec.lecturer_code
                d['department_name'] = lec.department.name if lec.department else None
                d['unit_info'] = f"Bộ môn: {lec.department.name if lec.department else 'Chưa gán'}"
                d['linked_profile'] = f"{lec.name} ({lec.lecturer_code or 'ID:' + str(lec.id)})"
            else:
                d['full_name'] = fn or u.username
                d['lecturer_code'] = None
                d['department_name'] = None
                d['unit_info'] = 'Chưa liên kết bộ môn'
                d['linked_profile'] = None
        else:
            d['full_name'] = fn or 'Quản Trị Viên'
            d['unit_info'] = 'Hệ thống Quản trị'
            d['linked_profile'] = 'Quản trị viên'
        res.append(d)
    return jsonify(res)

# API Lấy thông tin 1 tài khoản (Chỉ Admin)
@taikhoan_bp.route('/users/<int:id>', methods=['GET'])
@login_required
@role_required(2)
def get_user(id):
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

# API Lấy thông tin tài khoản hiện tại của người dùng đang đăng nhập
@taikhoan_bp.route('/users/me', methods=['GET'])
@login_required
def get_current_user():
    user = User.query.get(session.get('user_id'))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    user_info = user.to_dict()
    from models import Student, Lecturer
    if user.role == 0:
        student = Student.query.filter_by(account_id=user.id).first()
        if student:
            user_info['student_id'] = student.id
            user_info['student_code'] = student.student_code
            user_info['student_name'] = student.name
            user_info['class_name'] = student.class_name
            if not user_info.get('full_name'):
                user_info['full_name'] = student.name
    elif user.role == 1:
        lecturer = Lecturer.query.filter_by(account_id=user.id).first()
        if lecturer:
            user_info['lecturer_id'] = lecturer.id
            user_info['lecturer_code'] = lecturer.lecturer_code
            user_info['lecturer_name'] = lecturer.name
            user_info['department_name'] = lecturer.department.name if lecturer.department else None
            if not user_info.get('full_name'):
                user_info['full_name'] = lecturer.name
    return jsonify(user_info)

