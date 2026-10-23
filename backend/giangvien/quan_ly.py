from flask import request, jsonify
from . import giangvien_bp
from models import Lecturer, User, db
from auth import login_required, role_required

@giangvien_bp.route('/lecturers', methods=['POST'])
@login_required
@role_required(2)
def add_lecturer():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({"error": "Missing required field: name"}), 400

    lecturer_code = data.get('lecturer_code')
    account_id = data.get('account_id')
    
    if lecturer_code:
        if Lecturer.query.filter_by(lecturer_code=lecturer_code).first():
            return jsonify({"error": "Duplicate lecturer_code"}), 400
            
    if account_id:
        if not User.query.get(account_id):
            return jsonify({"error": "Invalid account_id, User does not exist"}), 400
        if Lecturer.query.filter_by(account_id=account_id).first():
            return jsonify({"error": "Duplicate account_id, User already linked"}), 400

    auto_create_account = data.get('auto_create_account')
    if (auto_create_account is True or str(auto_create_account).lower() == 'true') and not account_id:
        import time
        raw_uname = (lecturer_code or f"gv{int(time.time())}").strip().lower()
        username = raw_uname
        suffix = 1
        while User.query.filter_by(username=username).first():
            username = f"{raw_uname}_{suffix}"
            suffix += 1
        raw_email = (data.get('email') or '').strip()
        u_email = raw_email if raw_email.endswith('@wru.vn') else None
        user = User(username=username, role=1, email=u_email, full_name=data.get('name', '').strip(), status='HoatDong')
        user.set_password('123456')
        db.session.add(user)
        db.session.flush()
        account_id = user.id
    elif account_id:
        u = User.query.get(account_id)
        if u:
            if not getattr(u, 'full_name', None) or u.full_name == u.username:
                u.full_name = data.get('name', '').strip()
            if data.get('email') and str(data.get('email')).strip().endswith('@wru.vn') and not u.email:
                u.email = data.get('email').strip()

    dept_id = data.get('department_id')
    if not dept_id and data.get('class'):
        raw_dept = str(data.get('class')).strip()
        try:
            dept_id = int(raw_dept)
        except ValueError:
            from models import BoMon
            bm = BoMon.query.filter((BoMon.bomon_code == raw_dept) | (BoMon.name.ilike(f'%{raw_dept}%'))).first()
            if bm:
                dept_id = bm.id

    spec = data.get('specialization') or data.get('score')

    try:
        new_lecturer = Lecturer(
            lecturer_code=lecturer_code,
            name=data.get('name').strip(),
            email=data.get('email'),
            phone=data.get('phone'),
            department_id=dept_id,
            specialization=spec,
            account_id=account_id,
            gender=data.get('gender'),
            research_direction=data.get('research_direction'),
            education_level=data.get('education_level')
        )
        db.session.add(new_lecturer)
        db.session.commit()
        return jsonify({"message": "Lecturer created successfully", "lecturer": new_lecturer.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@giangvien_bp.route('/lecturers/<int:id>', methods=['PUT'])
@login_required
@role_required(2)
def update_lecturer(id):
    lecturer = Lecturer.query.get(id)
    if not lecturer:
        return jsonify({"error": "Lecturer not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if 'lecturer_code' in data and data['lecturer_code'] is not None and data['lecturer_code'] != lecturer.lecturer_code:
        if Lecturer.query.filter_by(lecturer_code=data['lecturer_code']).first():
            return jsonify({"error": "Duplicate lecturer_code"}), 400
            
    if 'account_id' in data and data['account_id'] is not None and data['account_id'] != lecturer.account_id:
        if not User.query.get(data['account_id']):
            return jsonify({"error": "Invalid account_id, User does not exist"}), 400
        if Lecturer.query.filter_by(account_id=data['account_id']).first():
            return jsonify({"error": "Duplicate account_id, User already linked"}), 400

    try:
        if 'name' in data and data['name']:
            lecturer.name = data['name'].strip()
            if lecturer.account_id:
                u = User.query.get(lecturer.account_id)
                if u:
                    u.full_name = lecturer.name
        if 'lecturer_code' in data:
            lecturer.lecturer_code = data['lecturer_code']
        if 'email' in data:
            lecturer.email = data['email']
            if lecturer.account_id:
                u = User.query.get(lecturer.account_id)
                if u and data['email'] and str(data['email']).endswith('@wru.vn'):
                    u.email = data['email']
        if 'phone' in data:
            lecturer.phone = data['phone']
        if 'department_id' in data:
            lecturer.department_id = data['department_id']
        elif 'class' in data and data['class']:
            raw_dept = str(data['class']).strip()
            try:
                lecturer.department_id = int(raw_dept)
            except ValueError:
                from models import BoMon
                bm = BoMon.query.filter((BoMon.bomon_code == raw_dept) | (BoMon.name.ilike(f'%{raw_dept}%'))).first()
                if bm:
                    lecturer.department_id = bm.id
        if 'specialization' in data:
            lecturer.specialization = data['specialization']
        elif 'score' in data:
            lecturer.specialization = str(data['score'])
        if 'account_id' in data:
            lecturer.account_id = data['account_id']
        if 'gender' in data:
            lecturer.gender = data['gender']
        if 'research_direction' in data:
            lecturer.research_direction = data['research_direction']
        if 'education_level' in data:
            lecturer.education_level = data['education_level']

        db.session.commit()
        return jsonify({"message": "Lecturer updated successfully", "lecturer": lecturer.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@giangvien_bp.route('/lecturers/<int:id>', methods=['DELETE'])
@login_required
@role_required(2)
def delete_lecturer(id):
    lecturer = Lecturer.query.get(id)
    if not lecturer:
        return jsonify({"error": "Lecturer not found"}), 404

    # Kiểm tra ràng buộc dữ liệu trước khi xóa
    from models import LichHoc, DoAn, HoiDong, BaiTap, DiemMonHoc
    if LichHoc.query.filter_by(lecturer_id=id).first():
        return jsonify({"error": "Không thể xóa giảng viên đang được phân công lịch giảng dạy"}), 400
    if DoAn.query.filter((DoAn.lecturer_id == id) | (DoAn.reviewer_id == id)).first():
        return jsonify({"error": "Không thể xóa giảng viên đang hướng dẫn hoặc phản biện đồ án tốt nghiệp"}), 400
    if HoiDong.query.filter((HoiDong.member1_id == id) | (HoiDong.member2_id == id) | (HoiDong.member3_id == id)).first():
        return jsonify({"error": "Không thể xóa giảng viên đang là thành viên của hội đồng bảo vệ"}), 400
    if BaiTap.query.filter_by(lecturer_id=id).first():
        return jsonify({"error": "Không thể xóa giảng viên đã tạo bài tập cho sinh viên"}), 400
    if DiemMonHoc.query.filter_by(lecturer_id=id).first():
        return jsonify({"error": "Không thể xóa giảng viên đang phụ trách bảng điểm môn học"}), 400

    if lecturer.account_id:
        lecturer.account_id = None

    try:
        db.session.delete(lecturer)
        db.session.commit()
        return jsonify({"message": "Lecturer deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# API Cấp nhanh tài khoản cho giảng viên (1-click cấp tài khoản đồng bộ)
@giangvien_bp.route('/lecturers/<int:id>/create_account', methods=['POST'])
@login_required
@role_required(2)
def create_lecturer_account(id):
    lecturer = Lecturer.query.get(id)
    if not lecturer:
        return jsonify({"error": "Không tìm thấy thông tin giảng viên"}), 404
    if lecturer.account_id:
        return jsonify({"error": "Giảng viên này đã có tài khoản liên kết"}), 400

    data = request.get_json(force=True, silent=True) or {}
    custom_username = (data.get('username') or '').strip().lower()
    if custom_username:
        if User.query.filter_by(username=custom_username).first():
            return jsonify({'error': f'Tên tài khoản "{custom_username}" đã tồn tại'}), 400
        username = custom_username
    else:
        base_uname = (lecturer.lecturer_code or f"gv{lecturer.id}").strip().lower()
        username = base_uname
        suffix = 1
        while User.query.filter_by(username=username).first():
            username = f"{base_uname}_{suffix}"
            suffix += 1

    email = lecturer.email.strip() if (lecturer.email and lecturer.email.strip().endswith('@wru.vn')) else None
    user = User(
        username=username,
        role=1,
        email=email,
        full_name=lecturer.name,
        status='HoatDong'
    )
    user.set_password('123456') # Mật khẩu mặc định là 123456
    db.session.add(user)
    db.session.flush()

    lecturer.account_id = user.id
    try:
        db.session.commit()
        return jsonify({
            "message": f"Cấp tài khoản thành công! Tên đăng nhập: {username} | Mật khẩu mặc định: 123456",
            "user": user.to_dict(),
            "lecturer": lecturer.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Lỗi lưu trữ dữ liệu"}), 500
