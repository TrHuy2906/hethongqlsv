from flask import request, jsonify, session
from database import db
from models import User, Student, Lecturer
from auth import login_required, role_required
from . import taikhoan_bp

# API Thêm tài khoản mới (Chỉ Admin)
@taikhoan_bp.route('/users', methods=['POST'])
@login_required
@role_required(2)
def add_user():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data or 'username' not in data:
        return jsonify({'error': 'Tên đăng nhập không được để trống'}), 400

    username = data.get('username', '').strip()
    if not username:
        return jsonify({'error': 'Tên đăng nhập không được để trống'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Tên tài khoản đã tồn tại trong hệ thống'}), 400

    try:
        role = int(data.get('role', 0))
        if role not in (0, 1, 2):
            return jsonify({'error': 'Vai trò (role) không hợp lệ, phải là 0 (Sinh viên), 1 (Giảng viên) hoặc 2 (Quản trị viên)'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Vai trò (role) không hợp lệ'}), 400

    email = data.get('email', '').strip()
    if email:
        if not email.endswith('@wru.vn'):
            return jsonify({'error': 'Email yêu cầu phải đúng định dạng tên miền @wru.vn'}), 400

    # Mật khẩu mặc định là mã/tên tài khoản nếu không truyền mật khẩu
    password = data.get('password', '').strip() or username

    full_name = data.get('full_name', '').strip() or None
    new_user = User(
        username=username,
        role=role,
        email=email if email else None,
        status='HoatDong',
        full_name=full_name
    )
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.flush()

    # Đồng bộ với hồ sơ Sinh viên / Giảng viên khi tạo tài khoản từ trang Quản lý Tài khoản
    student_id = data.get('student_id')
    if role == 0:
        if student_id:
            try:
                st = Student.query.get(int(student_id))
                if st and not st.account_id:
                    st.account_id = new_user.id
            except (ValueError, TypeError):
                pass
        elif data.get('full_name'):
            full_name = data.get('full_name').strip()
            class_name = (data.get('class_name') or '').strip()
            class_id = data.get('class_id')
            if class_id:
                try:
                    class_id = int(class_id)
                    from models import Lop
                    lop_obj = Lop.query.get(class_id)
                    if lop_obj and not class_name:
                        class_name = lop_obj.name
                except (ValueError, TypeError):
                    class_id = None
            if not class_name:
                from models import Lop
                first_lop = Lop.query.first()
                if first_lop:
                    class_id = first_lop.id
                    class_name = first_lop.name
                else:
                    class_name = "Chưa phân lớp"

            existing_st = Student.query.filter_by(student_code=username).first()
            if existing_st:
                if not existing_st.account_id:
                    existing_st.account_id = new_user.id
            else:
                new_student = Student(
                    name=full_name,
                    student_code=username,
                    class_name=class_name,
                    class_id=class_id,
                    email=email if email else None,
                    score=float(data.get('score', 0.0)),
                    account_id=new_user.id
                )
                db.session.add(new_student)

    lecturer_id = data.get('lecturer_id')
    if role == 1:
        if lecturer_id:
            try:
                lec = Lecturer.query.get(int(lecturer_id))
                if lec and not lec.account_id:
                    lec.account_id = new_user.id
            except (ValueError, TypeError):
                pass
        elif data.get('full_name'):
            full_name = data.get('full_name').strip()
            dept_id = data.get('department_id')
            if dept_id:
                try:
                    dept_id = int(dept_id)
                except (ValueError, TypeError):
                    dept_id = None
            if not dept_id:
                from models import BoMon
                first_bm = BoMon.query.first()
                if first_bm:
                    dept_id = first_bm.id

            existing_lec = Lecturer.query.filter_by(lecturer_code=username).first()
            if existing_lec:
                if not existing_lec.account_id:
                    existing_lec.account_id = new_user.id
            else:
                new_lec = Lecturer(
                    name=full_name,
                    lecturer_code=username,
                    email=email if email else None,
                    phone=data.get('phone'),
                    department_id=dept_id,
                    specialization=data.get('specialization', 'Công nghệ thông tin'),
                    education_level=data.get('education_level', 'Thạc sĩ'),
                    account_id=new_user.id
                )
                db.session.add(new_lec)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi lưu trữ dữ liệu vào hệ thống'}), 500

    return jsonify({
        'message': 'Thêm tài khoản thành công',
        'user': new_user.to_dict()
    }), 201

# API Đặt lại mật khẩu về mặc định (chính là tên đăng nhập)
@taikhoan_bp.route('/users/<int:id>/reset_password', methods=['POST'])
@login_required
@role_required(2)
def reset_password(id):
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'Không tìm thấy tài khoản'}), 404

    # Đặt lại mật khẩu mặc định là mã tài khoản (username) theo UseCase 3.11
    user.set_password(user.username)
    try:
        db.session.commit()
        return jsonify({'message': f'Đã đặt lại mật khẩu của tài khoản {user.username} về mặc định (chính là username)'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi cơ sở dữ liệu khi đặt lại mật khẩu'}), 500

# API Cập nhật thông tin tài khoản (Chỉ Admin)
@taikhoan_bp.route('/users/<int:id>', methods=['PUT'])
@login_required
@role_required(2)
def update_user(id):
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'Không tìm thấy tài khoản'}), 404

    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data:
        return jsonify({'error': 'Không có dữ liệu gửi lên'}), 400

    # Kiểm tra email nếu có cập nhật
    if 'email' in data:
        email = (data.get('email') or '').strip()
        if email:
            if not email.endswith('@wru.vn'):
                return jsonify({'error': 'Email yêu cầu phải đúng định dạng tên miền @wru.vn'}), 400
            existing = User.query.filter(User.email == email, User.id != id).first()
            if existing:
                return jsonify({'error': 'Email này đã được sử dụng bởi tài khoản khác'}), 400
            user.email = email
        else:
            user.email = None

    # Cập nhật họ tên
    if 'full_name' in data:
        fn = (data.get('full_name') or '').strip()
        user.full_name = fn if fn else None

    # Cập nhật vai trò (Role)
    if 'role' in data and data['role'] is not None and data['role'] != '':
        try:
            new_role = int(data['role'])
            if new_role not in (0, 1, 2):
                return jsonify({'error': 'Vai trò không hợp lệ'}), 400
            # Bảo vệ Admin cuối cùng: Không được giáng cấp Quản trị viên cuối cùng
            if user.role == 2 and new_role != 2:
                admin_count = User.query.filter_by(role=2).count()
                if admin_count <= 1:
                    return jsonify({'error': 'Không thể thay đổi vai trò của Quản trị viên cuối cùng trong hệ thống'}), 400
            user.role = new_role
        except (ValueError, TypeError):
            return jsonify({'error': 'Vai trò không hợp lệ'}), 400

    # Cập nhật trạng thái nếu có
    if 'status' in data:
        new_status = data.get('status')
        if new_status in ('HoatDong', 'Khoa'):
            if user.role == 2 and new_status == 'Khoa':
                if session.get('user_id') == id:
                    return jsonify({'error': 'Không thể tự khóa tài khoản của chính mình'}), 400
                active_admin_count = User.query.filter_by(role=2, status='HoatDong').count()
                if active_admin_count <= 1:
                    return jsonify({'error': 'Không thể khóa Quản trị viên đang hoạt động duy nhất'}), 400
            user.status = new_status

    try:
        db.session.commit()
        return jsonify({'message': 'Cập nhật tài khoản thành công', 'user': user.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi lưu trữ dữ liệu vào hệ thống'}), 500

# API Xóa tài khoản
@taikhoan_bp.route('/users/<int:id>', methods=['DELETE'])
@login_required
@role_required(2)
def delete_user(id):
    if session.get('user_id') == id:
        return jsonify({'error': 'Không thể tự xóa tài khoản của chính mình đang đăng nhập'}), 400

    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'Không tìm thấy tài khoản'}), 404

    # Bảo vệ Quản trị viên cuối cùng: Không xóa Admin cuối cùng
    if user.role == 2:
        admin_count = User.query.filter_by(role=2).count()
        if admin_count <= 1:
            return jsonify({'error': 'Không thể xóa tài khoản Quản trị viên cuối cùng trong hệ thống'}), 400

    # Gỡ liên kết hồ sơ sinh viên hoặc giảng viên trước khi xóa tài khoản
    st = Student.query.filter_by(account_id=id).first()
    if st:
        st.account_id = None
    lec = Lecturer.query.filter_by(account_id=id).first()
    if lec:
        lec.account_id = None

    db.session.delete(user)
    try:
        db.session.commit()
        return jsonify({'message': 'Xóa tài khoản thành công'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Không thể xóa tài khoản đang được liên kết với dữ liệu khác'}), 400

# API Khóa / Mở khóa tài khoản (Chỉ Admin)
@taikhoan_bp.route('/users/<int:id>/status', methods=['POST', 'PUT'])
@login_required
@role_required(2)
def toggle_user_status(id):
    if session.get('user_id') == id:
        return jsonify({'error': 'Không thể tự khóa tài khoản của chính mình'}), 400
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'Không tìm thấy tài khoản'}), 404
    data = request.get_json(silent=True) or {}
    new_status = data.get('status')
    if not new_status or new_status not in ('HoatDong', 'Khoa'):
        new_status = 'Khoa' if getattr(user, 'status', 'HoatDong') == 'Khoa' else 'Khoa' if getattr(user, 'status', 'HoatDong') == 'HoatDong' else 'HoatDong'

    if user.role == 2 and new_status == 'Khoa':
        active_admin_count = User.query.filter_by(role=2, status='HoatDong').count()
        if active_admin_count <= 1:
            return jsonify({'error': 'Không thể khóa Quản trị viên đang hoạt động duy nhất'}), 400

    user.status = new_status
    try:
        db.session.commit()
        action_text = "khóa" if user.status == 'Khoa' else "kích hoạt mở khóa"
        return jsonify({
            'message': f'Đã {action_text} tài khoản {user.username} thành công!',
            'status': user.status
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi cập nhật trạng thái tài khoản'}), 500

