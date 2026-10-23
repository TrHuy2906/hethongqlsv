from flask import jsonify, request, session
from models import HoiDong, DoAn
from auth import login_required, role_required, get_current_student, get_current_lecturer
from . import hoidong_bp

# API Lấy danh sách hội đồng bảo vệ
@hoidong_bp.route('/councils', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_councils():
    query = HoiDong.query
    
    code = request.args.get('code', '').strip()
    name = request.args.get('name', '').strip()
    faculty_id = request.args.get('faculty_id')
    
    if code:
        query = query.filter(HoiDong.council_code.ilike(f'%{code}%'))
    if name:
        query = query.filter(HoiDong.name.ilike(f'%{name}%'))
    if faculty_id:
        try:
            query = query.filter(HoiDong.faculty_id == int(faculty_id))
        except ValueError:
            pass
            
    councils = query.order_by(HoiDong.id.desc()).all()
    return jsonify([c.to_dict() for c in councils])

# API Lấy thông tin chi tiết 1 hội đồng
@hoidong_bp.route('/councils/<int:id>', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_council(id):
    council = HoiDong.query.get(id)
    if not council:
        return jsonify({'error': 'Không tìm thấy hội đồng bảo vệ'}), 404
    return jsonify(council.to_dict())

# API Lấy hội đồng liên quan đến tài khoản đăng nhập (Sinh viên / Giảng viên)
@hoidong_bp.route('/councils/my', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_my_councils():
    user_role = session.get('role')

    if user_role == 0: # Sinh viên: Hội đồng chấm đồ án của mình
        student = get_current_student()
        if not student:
            return jsonify({'council': None, 'message': 'Chưa liên kết hồ sơ sinh viên'}), 200
        project = DoAn.query.filter_by(student_id=student.id).first()
        if not project or not project.council:
            return jsonify({'council': None, 'message': 'Chưa được phân công hội đồng bảo vệ'}), 200
        return jsonify({'council': project.council.to_dict()}), 200

    elif user_role == 1: # Giảng viên: Các hội đồng mà giảng viên là thành viên
        lecturer = get_current_lecturer()
        if not lecturer:
            return jsonify({'councils': [], 'message': 'Chưa liên kết hồ sơ giảng viên'}), 200
        councils = HoiDong.query.filter(
            (HoiDong.member1_id == lecturer.id) |
            (HoiDong.member2_id == lecturer.id) |
            (HoiDong.member3_id == lecturer.id)
        ).all()
        return jsonify({'councils': [c.to_dict() for c in councils]}), 200

    councils = HoiDong.query.order_by(HoiDong.id.desc()).all()
    return jsonify({'councils': [c.to_dict() for c in councils]}), 200
