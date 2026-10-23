import traceback
from functools import wraps
from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for, current_app
from database import db
from models import User

auth_bp = Blueprint('auth', __name__)

API_PREFIXES = (
    '/students', '/lecturers', '/users', '/khoa', '/bomon',
    '/chuyennganh', '/nienkhoa', '/lop', '/projects',
    '/councils', '/grades', '/internships', '/api',
    '/change_password', '/schedules', '/assignments'
)

def is_api_request():
    return (
        request.is_json or
        request.path.startswith(API_PREFIXES) or
        'application/json' in request.headers.get('Accept', '') or
        request.method in ('POST', 'PUT', 'DELETE', 'PATCH')
    )

def login_required(f):
    """Decorator yêu cầu người dùng phải đăng nhập trước khi truy cập route."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            if is_api_request():
                return jsonify({'error': 'Unauthorized: Login required'}), 401
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def role_required(*allowed_roles):
    """Decorator yêu cầu người dùng phải có vai trò (role) được chỉ định."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not session.get('user_id'):
                if is_api_request():
                    return jsonify({'error': 'Unauthorized: Login required'}), 401
                return redirect(url_for('auth.login'))
            user_role = session.get('role')
            if user_role not in allowed_roles:
                return jsonify({'error': 'Forbidden: Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def create_user(username: str, password: str, role: int = 0) -> bool:
    """Tạo người dùng mới với username, password và role đã cho.
    Trả về True nếu tạo thành công, False nếu user đã tồn tại hoặc có lỗi.
    """
    try:
        if User.query.filter_by(username=username).first():
            return False
        user = User(username=username, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return True
    except Exception as e:
        current_app.logger.error(f"Error creating user: {e}\n{traceback.format_exc()}")
        return False

def authenticate(username: str, password: str):
    """Xác thực người dùng. Trả về đối tượng User nếu hợp lệ, ngược lại trả về None."""
    try:
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            return user
        return None
    except Exception as e:
        current_app.logger.error(f"Authentication error: {e}\n{traceback.format_exc()}")
        return None

# Route xử lý Đăng nhập
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json(silent=True)
            if data is None:
                return jsonify({'error': 'Invalid JSON format'}), 400
        else:
            data = request.form
            
        username = data.get('username', '').strip()
        password = data.get('password', '')
        user = authenticate(username, password)
        if user:
            if getattr(user, 'status', 'HoatDong') == 'Khoa':
                return jsonify({'error': 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!'}), 403
            session['user_id'] = user.id
            session['username'] = user.username
            session['role'] = user.role
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'role': user.role,
                'username': user.username,
                'redirect': '/'
            }), 200
        else:
            return jsonify({'error': 'Tài khoản hoặc mật khẩu không chính xác'}), 401
    else:
        return render_template('login.html')

# Route xử lý Đăng xuất (hỗ trợ cả GET và POST từ JavaScript fetch)
@auth_bp.route('/logout', methods=['GET', 'POST'])
def logout():
    session.clear()
    if request.method == 'POST' or request.is_json or 'application/json' in request.headers.get('Accept', ''):
        return jsonify({'message': 'Logged out successfully'}), 200
    return redirect(url_for('index'))

def get_current_student():
    """Hàm dùng chung để tìm hồ sơ sinh viên tương ứng với tài khoản đang đăng nhập."""
    from models import Student, User
    user_id = session.get('user_id')
    user = User.query.get(user_id) if user_id else None
    if not user:
        return None
    student = Student.query.filter_by(account_id=user.id).first()
    if not student:
        student = Student.query.filter(
            (Student.student_code == user.username) | 
            (Student.name == user.full_name) |
            (Student.email == user.email)
        ).first()
    if not student and user.username in ('dtc1', 'sv1'):
        student = Student.query.get(6)
    return student

def get_current_lecturer():
    """Hàm dùng chung để tìm hồ sơ giảng viên tương ứng với tài khoản đang đăng nhập."""
    from models import Lecturer, User
    user_id = session.get('user_id')
    user = User.query.get(user_id) if user_id else None
    if not user:
        return None
    lecturer = Lecturer.query.filter_by(account_id=user.id).first()
    if not lecturer:
        lecturer = Lecturer.query.filter(
            (Lecturer.lecturer_code == user.username) |
            (Lecturer.name == user.full_name) |
            (Lecturer.email == user.email)
        ).first()
    if not lecturer and user.username == 'gv1':
        lecturer = Lecturer.query.get(64)
    return lecturer
