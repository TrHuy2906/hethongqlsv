from datetime import datetime
from flask import request, jsonify
from database import db
from models import HoiDong, Khoa, Lecturer, DoAn
from auth import login_required, role_required
from . import hoidong_bp

# API Thêm mới hội đồng bảo vệ (Chỉ Admin)
@hoidong_bp.route('/councils', methods=['POST'])
@login_required
@role_required(2)
def add_council():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data:
        return jsonify({'error': 'Không có dữ liệu gửi lên'}), 400

    council_code = data.get('council_code', '').strip()
    name = data.get('name', '').strip()
    faculty_id = data.get('faculty_id')
    m1 = data.get('member1_id')
    m2 = data.get('member2_id')
    m3 = data.get('member3_id')

    if not council_code or not name or not faculty_id or not m1 or not m2 or not m3:
        return jsonify({'error': 'Vui lòng nhập đầy đủ mã hội đồng, tên hội đồng, khoa và 3 giảng viên thành viên'}), 400

    try:
        faculty_id = int(faculty_id)
        m1 = int(m1)
        m2 = int(m2)
        m3 = int(m3)
    except (ValueError, TypeError):
        return jsonify({'error': 'ID khoa hoặc giảng viên không hợp lệ'}), 400

    # Ràng buộc nghiệp vụ: 3 giảng viên trong hội đồng KHÔNG ĐƯỢC trùng nhau
    if m1 == m2 or m2 == m3 or m1 == m3:
        return jsonify({'error': '3 giảng viên thành viên trong hội đồng không được trùng nhau'}), 400

    if HoiDong.query.filter_by(council_code=council_code).first():
        return jsonify({'error': 'Mã hội đồng đã tồn tại'}), 400

    if not Khoa.query.get(faculty_id):
        return jsonify({'error': 'Khoa không tồn tại'}), 400

    for idx, mid in enumerate([m1, m2, m3], 1):
        if not Lecturer.query.get(mid):
            return jsonify({'error': f'Giảng viên thành viên {idx} không tồn tại'}), 400

    defense_date = None
    date_str = data.get('defense_date')
    if date_str:
        try:
            defense_date = datetime.strptime(date_str.strip(), '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Định dạng ngày bảo vệ không hợp lệ, phải là YYYY-MM-DD'}), 400

    location = data.get('location', '').strip() or None

    new_council = HoiDong(
        council_code=council_code,
        name=name,
        faculty_id=faculty_id,
        defense_date=defense_date,
        location=location,
        member1_id=m1,
        member2_id=m2,
        member3_id=m3
    )

    db.session.add(new_council)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi cơ sở dữ liệu khi tạo hội đồng'}), 500

    return jsonify({
        'message': 'Thêm mới hội đồng thành công',
        'council': new_council.to_dict()
    }), 201

# API Cập nhật hội đồng bảo vệ (Chỉ Admin)
@hoidong_bp.route('/councils/<int:id>', methods=['PUT'])
@login_required
@role_required(2)
def update_council(id):
    council = HoiDong.query.get(id)
    if not council:
        return jsonify({'error': 'Không tìm thấy hội đồng bảo vệ'}), 404

    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data:
        return jsonify({'error': 'Không có dữ liệu cập nhật'}), 400

    if 'name' in data and data['name']:
        council.name = data['name'].strip()

    if 'council_code' in data and data['council_code']:
        new_code = data['council_code'].strip()
        existing = HoiDong.query.filter_by(council_code=new_code).first()
        if existing and existing.id != council.id:
            return jsonify({'error': 'Mã hội đồng đã tồn tại'}), 400
        council.council_code = new_code

    if 'faculty_id' in data and data['faculty_id']:
        try:
            fid = int(data['faculty_id'])
            if not Khoa.query.get(fid):
                return jsonify({'error': 'Khoa không tồn tại'}), 400
            council.faculty_id = fid
        except (ValueError, TypeError):
            return jsonify({'error': 'ID khoa không hợp lệ'}), 400

    m1 = int(data.get('member1_id')) if data.get('member1_id') else council.member1_id
    m2 = int(data.get('member2_id')) if data.get('member2_id') else council.member2_id
    m3 = int(data.get('member3_id')) if data.get('member3_id') else council.member3_id

    if m1 == m2 or m2 == m3 or m1 == m3:
        return jsonify({'error': '3 giảng viên thành viên trong hội đồng không được trùng nhau'}), 400

    for idx, mid in enumerate([m1, m2, m3], 1):
        if not Lecturer.query.get(mid):
            return jsonify({'error': f'Giảng viên thành viên {idx} không tồn tại'}), 400

    council.member1_id = m1
    council.member2_id = m2
    council.member3_id = m3

    if 'defense_date' in data:
        date_str = data.get('defense_date')
        if date_str:
            try:
                council.defense_date = datetime.strptime(date_str.strip(), '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Định dạng ngày bảo vệ không hợp lệ, phải là YYYY-MM-DD'}), 400
        else:
            council.defense_date = None

    if 'location' in data:
        council.location = data.get('location', '').strip() or None

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi cơ sở dữ liệu khi cập nhật hội đồng'}), 500

    return jsonify({
        'message': 'Cập nhật hội đồng thành công',
        'council': council.to_dict()
    }), 200

# API Xóa hội đồng bảo vệ (Chỉ Admin)
@hoidong_bp.route('/councils/<int:id>', methods=['DELETE'])
@login_required
@role_required(2)
def delete_council(id):
    council = HoiDong.query.get(id)
    if not council:
        return jsonify({'error': 'Không tìm thấy hội đồng bảo vệ'}), 404

    # Kiểm tra xem hội đồng có đang được phân công cho đề tài nào không
    if DoAn.query.filter_by(council_id=id).first():
        return jsonify({'error': 'Không thể xóa hội đồng đang được phân công cho đồ án'}), 400

    db.session.delete(council)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Không thể xóa hội đồng do ràng buộc dữ liệu'}), 400

    return jsonify({'message': 'Xóa hội đồng thành công'}), 200
