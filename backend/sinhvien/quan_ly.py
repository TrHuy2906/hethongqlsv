from flask import request, jsonify
from database import db
from models import Student
from auth import login_required, role_required
from . import sinhvien_bp

# API Thêm sinh viên mới
@sinhvien_bp.route('/students', methods=['POST'])
@login_required
@role_required(2)
def add_student():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data or 'name' not in data:
        return jsonify({'error': 'Missing student name'}), 400
    
    name = data.get('name', '').strip()
    class_name = (data.get('class') or data.get('class_name', '')).strip()
    try:
        score = float(data.get('score', 0))
    except (ValueError, TypeError):
        score = 0.0

    if not name or not class_name:
        return jsonify({'error': 'Name and class are required'}), 400

    student_code = data.get('student_code')
    if student_code:
        student_code = student_code.strip()
        if Student.query.filter_by(student_code=student_code).first():
            return jsonify({'error': 'Student code already exists'}), 400

    account_id = data.get('account_id')
    if account_id is not None:
        try:
            account_id = int(account_id)
            from models import User
            if not User.query.get(account_id):
                return jsonify({'error': 'Account not found'}), 400
            if Student.query.filter_by(account_id=account_id).first():
                return jsonify({'error': 'Account ID already linked to another student'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid account_id'}), 400

    dob = data.get('dob')
    parsed_dob = None
    if dob:
        try:
            from datetime import datetime
            parsed_dob = datetime.strptime(dob.strip(), '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid dob format, must be YYYY-MM-DD'}), 400

    gender = data.get('gender')
    email = data.get('email')

    class_id = data.get('class_id')
    if class_id is not None:
        try:
            class_id = int(class_id)
            from models import Lop
            if not Lop.query.get(class_id):
                return jsonify({'error': 'Class (lop) not found'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid class_id'}), 400
    elif class_name:
        from models import Lop
        clean_cname = class_name.split(' - ')[0].strip()
        matched_lop = Lop.query.filter(
            (Lop.class_code == clean_cname) | (Lop.name == clean_cname) |
            (Lop.class_code == class_name) | (Lop.name == class_name)
        ).first()
        if matched_lop:
            class_id = matched_lop.id
            class_name = matched_lop.name

    # Tự động cấp tài khoản đăng nhập nếu được yêu cầu
    auto_create_account = data.get('auto_create_account')
    if (auto_create_account is True or str(auto_create_account).lower() == 'true') and not account_id:
        import time
        from models import User
        base_uname = (student_code or f"sv{int(time.time())}").strip().lower()
        username = base_uname
        suffix = 1
        while User.query.filter_by(username=username).first():
            username = f"{base_uname}_{suffix}"
            suffix += 1
        u_email = email.strip() if (email and email.strip().endswith('@wru.vn')) else None
        user = User(username=username, role=0, email=u_email, full_name=name, status='HoatDong')
        user.set_password(username)
        db.session.add(user)
        db.session.flush()
        account_id = user.id
    elif account_id:
        from models import User
        u = User.query.get(account_id)
        if u:
            if not getattr(u, 'full_name', None) or u.full_name == u.username:
                u.full_name = name
            if email and email.strip().endswith('@wru.vn') and not u.email:
                u.email = email.strip()

    new_student = Student(
        name=name, class_name=class_name, score=score,
        student_code=student_code if student_code else None,
        gender=gender.strip() if gender else None,
        email=email.strip() if email else None,
        dob=parsed_dob,
        account_id=account_id,
        class_id=class_id
    )
    db.session.add(new_student)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Database error'}), 500

    return jsonify({
        'message': 'Student added successfully',
        'student': new_student.to_dict()
    }), 201

# API Cập nhật sinh viên
@sinhvien_bp.route('/students/<int:id>', methods=['PUT'])
@login_required
@role_required(2)
def update_student(id):
    student = Student.query.get(id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'name' in data and data['name']:
        student.name = data['name'].strip()
        if student.account_id:
            from models import User
            u = User.query.get(student.account_id)
            if u:
                u.full_name = student.name
    if 'class' in data and data['class']:
        student.class_name = data['class'].strip()
    elif 'class_name' in data and data['class_name']:
        student.class_name = data['class_name'].strip()
    if 'score' in data:
        try:
            student.score = float(data['score'])
        except (ValueError, TypeError):
            pass

    if 'student_code' in data:
        code = data['student_code']
        if code is None:
            student.student_code = None
        else:
            code = code.strip()
            existing = Student.query.filter_by(student_code=code).first()
            if existing and existing.id != student.id:
                return jsonify({'error': 'Student code already exists'}), 400
            student.student_code = code

    if 'account_id' in data:
        acc_id = data['account_id']
        if acc_id is None:
            student.account_id = None
        else:
            try:
                acc_id = int(acc_id)
                from models import User
                if not User.query.get(acc_id):
                    return jsonify({'error': 'Account not found'}), 400
                existing = Student.query.filter_by(account_id=acc_id).first()
                if existing and existing.id != student.id:
                    return jsonify({'error': 'Account ID already linked to another student'}), 400
                student.account_id = acc_id
            except ValueError:
                return jsonify({'error': 'Invalid account_id'}), 400

    if 'dob' in data:
        dob = data['dob']
        if dob is None:
            student.dob = None
        else:
            try:
                from datetime import datetime
                student.dob = datetime.strptime(dob.strip(), '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid dob format, must be YYYY-MM-DD'}), 400

    if 'gender' in data:
        gender = data['gender']
        student.gender = gender.strip() if gender else None

    if 'email' in data:
        email = data['email']
        student.email = email.strip() if email else None
        if student.account_id:
            from models import User
            u = User.query.get(student.account_id)
            if u and student.email and student.email.endswith('@wru.vn'):
                u.email = student.email

    if 'class' in data or 'class_name' in data:
        raw_cname = (data.get('class') or data.get('class_name') or '').strip()
        if raw_cname:
            student.class_name = raw_cname
            if 'class_id' not in data:
                from models import Lop
                clean_cname = raw_cname.split(' - ')[0].strip()
                matched_lop = Lop.query.filter(
                    (Lop.class_code == clean_cname) | (Lop.name == clean_cname) |
                    (Lop.class_code == raw_cname) | (Lop.name == raw_cname)
                ).first()
                if matched_lop:
                    student.class_id = matched_lop.id
                    student.class_name = matched_lop.name

    if 'class_id' in data:
        cid = data['class_id']
        if cid is None:
            student.class_id = None
        else:
            try:
                cid = int(cid)
                from models import Lop
                lop_obj = Lop.query.get(cid)
                if not lop_obj:
                    return jsonify({'error': 'Class (lop) not found'}), 400
                student.class_id = cid
                student.class_name = lop_obj.name
            except ValueError:
                return jsonify({'error': 'Invalid class_id'}), 400

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Database error'}), 500

    return jsonify({
        'message': 'Student updated successfully',
        'student': student.to_dict()
    }), 200

# API Xóa sinh viên
@sinhvien_bp.route('/students/<int:id>', methods=['DELETE'])
@login_required
@role_required(2)
def delete_student(id):
    student = Student.query.get(id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    from models import DoAn, DiemDoAn
    proj = DoAn.query.filter_by(student_id=id).first()
    if proj:
        grade = DiemDoAn.query.filter_by(project_id=proj.id).first()
        if grade and grade.diem_tong_ket is not None:
            return jsonify({'error': 'Không thể xóa sinh viên đã hoàn thành và có điểm bảo vệ đồ án tốt nghiệp'}), 400
        return jsonify({'error': 'Không thể xóa sinh viên đang thực hiện đồ án tốt nghiệp'}), 400

    if student.account_id:
        student.account_id = None

    try:
        db.session.delete(student)
        db.session.commit()
        return jsonify({'message': 'Student deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Database error while deleting'}), 500

# API Cấp nhanh tài khoản cho sinh viên (1-click cấp tài khoản đồng bộ)
@sinhvien_bp.route('/students/<int:id>/create_account', methods=['POST'])
@login_required
@role_required(2)
def create_student_account(id):
    student = Student.query.get(id)
    if not student:
        return jsonify({'error': 'Không tìm thấy thông tin sinh viên'}), 404
    if student.account_id:
        return jsonify({'error': 'Sinh viên này đã có tài khoản liên kết'}), 400

    from models import User
    data = request.get_json(force=True, silent=True) or {}
    custom_username = (data.get('username') or '').strip().lower()
    if custom_username:
        if User.query.filter_by(username=custom_username).first():
            return jsonify({'error': f'Tên tài khoản "{custom_username}" đã tồn tại'}), 400
        username = custom_username
    else:
        base_uname = (student.student_code or f"sv{student.id}").strip().lower()
        username = base_uname
        suffix = 1
        while User.query.filter_by(username=username).first():
            username = f"{base_uname}_{suffix}"
            suffix += 1

    email = student.email.strip() if (student.email and student.email.strip().endswith('@wru.vn')) else None
    user = User(
        username=username,
        role=0,
        email=email,
        full_name=student.name,
        status='HoatDong'
    )
    user.set_password(username) # Mật khẩu mặc định bằng username
    db.session.add(user)
    db.session.flush()

    student.account_id = user.id
    try:
        db.session.commit()
        return jsonify({
            'message': f'Cấp tài khoản thành công! Tên đăng nhập: {username} | Mật khẩu: {username}',
            'user': user.to_dict(),
            'student': student.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Lỗi lưu trữ dữ liệu'}), 500
