from flask import request, jsonify
from . import chuyennganh_bp
from models import ChuyenNganh, Khoa, db
from auth import login_required, role_required

@chuyennganh_bp.route('/chuyennganh', methods=['POST'])
@login_required
@role_required(2)
def add_chuyennganh():
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400

    data = request.get_json(silent=True)
    if data is None:
        return jsonify({'error': 'Invalid JSON format'}), 400

    if 'major_code' not in data or 'name' not in data or 'faculty_id' not in data:
        return jsonify({"error": "Missing required field: major_code, name, faculty_id"}), 400

    if not isinstance(data['major_code'], str):
        return jsonify({"error": "major_code must be a string"}), 400
    if not isinstance(data['name'], str):
        return jsonify({"error": "name must be a string"}), 400
    if not isinstance(data['faculty_id'], int) or isinstance(data['faculty_id'], bool):
        return jsonify({"error": "faculty_id must be an integer"}), 400

    major_code = data['major_code'].strip()
    name = data['name'].strip()
    faculty_id = data['faculty_id']

    if not major_code:
        return jsonify({"error": "major_code cannot be empty"}), 400
    if not name:
        return jsonify({"error": "name cannot be empty"}), 400

    if len(major_code) > 50:
        return jsonify({"error": "major_code exceeds maximum length"}), 400
    if len(name) > 150:
        return jsonify({"error": "name exceeds maximum length"}), 400

    if not Khoa.query.get(faculty_id):
        return jsonify({"error": "faculty_id does not exist"}), 400

    if ChuyenNganh.query.filter_by(major_code=major_code).first():
        return jsonify({"error": "Duplicate major_code"}), 400

    try:
        new_item = ChuyenNganh(
            major_code=major_code,
            name=name,
            faculty_id=faculty_id
        )
        db.session.add(new_item)
        db.session.commit()
        return jsonify({"message": "ChuyenNganh created successfully", "chuyennganh": new_item.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@chuyennganh_bp.route('/chuyennganh/<int:id>', methods=['PUT'])
@login_required
@role_required(2)
def update_chuyennganh(id):
    item = ChuyenNganh.query.get(id)
    if not item:
        return jsonify({"error": "ChuyenNganh not found"}), 404

    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400

    data = request.get_json(silent=True)
    if data is None:
        return jsonify({'error': 'Invalid JSON format'}), 400

    if not data:
        return jsonify({"error": "No data provided"}), 400

    update_major_code = None
    update_name = None
    update_faculty_id = None

    if 'major_code' in data:
        if not isinstance(data['major_code'], str):
            return jsonify({"error": "major_code must be a string"}), 400
        update_major_code = data['major_code'].strip()
        if not update_major_code:
            return jsonify({"error": "major_code cannot be empty"}), 400
        if len(update_major_code) > 50:
            return jsonify({"error": "major_code exceeds maximum length"}), 400
        if update_major_code != item.major_code and ChuyenNganh.query.filter_by(major_code=update_major_code).first():
            return jsonify({"error": "Duplicate major_code"}), 400

    if 'name' in data:
        if not isinstance(data['name'], str):
            return jsonify({"error": "name must be a string"}), 400
        update_name = data['name'].strip()
        if not update_name:
            return jsonify({"error": "name cannot be empty"}), 400
        if len(update_name) > 150:
            return jsonify({"error": "name exceeds maximum length"}), 400

    if 'faculty_id' in data:
        if not isinstance(data['faculty_id'], int) or isinstance(data['faculty_id'], bool):
            return jsonify({"error": "faculty_id must be an integer"}), 400
        update_faculty_id = data['faculty_id']
        if not Khoa.query.get(update_faculty_id):
            return jsonify({"error": "faculty_id does not exist"}), 400

    try:
        if update_name is not None:
            item.name = update_name
        if update_major_code is not None:
            item.major_code = update_major_code
        if update_faculty_id is not None:
            item.faculty_id = update_faculty_id

        db.session.commit()
        return jsonify({"message": "ChuyenNganh updated successfully", "chuyennganh": item.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@chuyennganh_bp.route('/chuyennganh/<int:id>', methods=['DELETE'])
@login_required
@role_required(2)
def delete_chuyennganh(id):
    item = ChuyenNganh.query.get(id)
    if not item:
        return jsonify({"error": "ChuyenNganh not found"}), 404

    from models import Lop
    if Lop.query.filter_by(major_id=id).first():
        return jsonify({"error": "Không thể xóa Chuyên ngành vì vẫn còn lớp học thuộc chuyên ngành này."}), 400

    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "ChuyenNganh deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
