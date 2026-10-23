from flask import request, jsonify
from . import khoa_bp
from models import Khoa, db
from auth import login_required, role_required

@khoa_bp.route('/khoa', methods=['POST'])
@login_required
@role_required(2)
def add_khoa():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('khoa_code'):
        return jsonify({"error": "Missing required field: khoa_code, name"}), 400

    khoa_code = data.get('khoa_code').strip()
    name = data.get('name').strip()

    if Khoa.query.filter_by(khoa_code=khoa_code).first():
        return jsonify({"error": "Duplicate khoa_code"}), 400

    try:
        new_khoa = Khoa(
            khoa_code=khoa_code,
            name=name,
            dean=data.get('dean', '').strip() or None
        )
        db.session.add(new_khoa)
        db.session.commit()
        return jsonify({"message": "Khoa created successfully", "khoa": new_khoa.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@khoa_bp.route('/khoa/<int:id>', methods=['PUT'])
@login_required
@role_required(2)
def update_khoa(id):
    khoa = Khoa.query.get(id)
    if not khoa:
        return jsonify({"error": "Khoa not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if 'khoa_code' in data and data['khoa_code'] and data['khoa_code'] != khoa.khoa_code:
        if Khoa.query.filter_by(khoa_code=data['khoa_code']).first():
            return jsonify({"error": "Duplicate khoa_code"}), 400

    try:
        if 'name' in data and data['name']:
            khoa.name = data['name'].strip()
        if 'khoa_code' in data and data['khoa_code']:
            khoa.khoa_code = data['khoa_code'].strip()
        if 'dean' in data:
            khoa.dean = data['dean'].strip() if data['dean'] else None

        db.session.commit()
        return jsonify({"message": "Khoa updated successfully", "khoa": khoa.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@khoa_bp.route('/khoa/<int:id>', methods=['DELETE'])
@login_required
@role_required(2)
def delete_khoa(id):
    khoa = Khoa.query.get(id)
    if not khoa:
        return jsonify({"error": "Khoa not found"}), 404

    from models import BoMon, ChuyenNganh, HoiDong
    if BoMon.query.filter_by(khoa_id=id).first():
        return jsonify({"error": "Không thể xóa Khoa vì còn có Bộ môn trực thuộc. Vui lòng chuyển hoặc xóa các bộ môn liên quan trước."}), 400
    if ChuyenNganh.query.filter_by(faculty_id=id).first():
        return jsonify({"error": "Không thể xóa Khoa vì còn có Chuyên ngành đào tạo trực thuộc."}), 400
    if HoiDong.query.filter_by(faculty_id=id).first():
        return jsonify({"error": "Không thể xóa Khoa vì đang có Hội đồng bảo vệ trực thuộc."}), 400

    try:
        db.session.delete(khoa)
        db.session.commit()
        return jsonify({"message": "Khoa deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
