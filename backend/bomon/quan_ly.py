from flask import request, jsonify
from . import bomon_bp
from models import BoMon, Khoa, db
from auth import login_required, role_required

@bomon_bp.route('/bomon', methods=['POST'])
@login_required
@role_required(2)
def add_bomon():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('bomon_code') or not data.get('khoa_id'):
        return jsonify({"error": "Missing required field: bomon_code, name, khoa_id"}), 400

    bomon_code = data.get('bomon_code').strip()
    name = data.get('name').strip()
    khoa_id = data.get('khoa_id')

    if BoMon.query.filter_by(bomon_code=bomon_code).first():
        return jsonify({"error": "Duplicate bomon_code"}), 400

    if not Khoa.query.get(khoa_id):
        return jsonify({"error": "khoa_id does not exist"}), 400

    try:
        new_bomon = BoMon(
            bomon_code=bomon_code,
            name=name,
            khoa_id=khoa_id
        )
        db.session.add(new_bomon)
        db.session.commit()
        return jsonify({"message": "BoMon created successfully", "bomon": new_bomon.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bomon_bp.route('/bomon/<int:id>', methods=['PUT'])
@login_required
@role_required(2)
def update_bomon(id):
    bomon = BoMon.query.get(id)
    if not bomon:
        return jsonify({"error": "BoMon not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if 'bomon_code' in data and data['bomon_code'] and data['bomon_code'] != bomon.bomon_code:
        if BoMon.query.filter_by(bomon_code=data['bomon_code']).first():
            return jsonify({"error": "Duplicate bomon_code"}), 400

    if 'khoa_id' in data and data['khoa_id'] and data['khoa_id'] != bomon.khoa_id:
        if not Khoa.query.get(data['khoa_id']):
            return jsonify({"error": "khoa_id does not exist"}), 400

    try:
        if 'name' in data and data['name']:
            bomon.name = data['name'].strip()
        if 'bomon_code' in data and data['bomon_code']:
            bomon.bomon_code = data['bomon_code'].strip()
        if 'khoa_id' in data and data['khoa_id']:
            bomon.khoa_id = data['khoa_id']

        db.session.commit()
        return jsonify({"message": "BoMon updated successfully", "bomon": bomon.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bomon_bp.route('/bomon/<int:id>', methods=['DELETE'])
@login_required
@role_required(2)
def delete_bomon(id):
    bomon = BoMon.query.get(id)
    if not bomon:
        return jsonify({"error": "BoMon not found"}), 404

    from models import Lecturer
    if Lecturer.query.filter_by(department_id=id).first():
        return jsonify({"error": "Không thể xóa Bộ môn vì vẫn còn giảng viên thuộc bộ môn này."}), 400

    try:
        db.session.delete(bomon)
        db.session.commit()
        return jsonify({"message": "BoMon deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
