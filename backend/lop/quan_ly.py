from flask import request, jsonify
from . import lop_bp
from models import Lop, ChuyenNganh, NienKhoa, db
from auth import login_required, role_required

@lop_bp.route('/lop', methods=['POST'])
@login_required
@role_required(2)
def add_lop():
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400

    data = request.get_json(silent=True)
    if data is None:
        return jsonify({'error': 'Invalid JSON format'}), 400

    if 'class_code' not in data or 'name' not in data or 'major_id' not in data or 'cohort_id' not in data:
        return jsonify({"error": "Missing required field: class_code, name, major_id, cohort_id"}), 400

    if not isinstance(data['class_code'], str):
        return jsonify({"error": "class_code must be a string"}), 400
    if not isinstance(data['name'], str):
        return jsonify({"error": "name must be a string"}), 400
    if not isinstance(data['major_id'], int) or isinstance(data['major_id'], bool):
        return jsonify({"error": "major_id must be an integer"}), 400
    if not isinstance(data['cohort_id'], int) or isinstance(data['cohort_id'], bool):
        return jsonify({"error": "cohort_id must be an integer"}), 400

    class_code = data['class_code'].strip()
    name = data['name'].strip()
    major_id = data['major_id']
    cohort_id = data['cohort_id']

    if not class_code:
        return jsonify({"error": "class_code cannot be empty"}), 400
    if not name:
        return jsonify({"error": "name cannot be empty"}), 400

    if len(class_code) > 50:
        return jsonify({"error": "class_code exceeds maximum length"}), 400
    if len(name) > 150:
        return jsonify({"error": "name exceeds maximum length"}), 400

    if not ChuyenNganh.query.get(major_id):
        return jsonify({"error": "major_id does not exist"}), 400
    if not NienKhoa.query.get(cohort_id):
        return jsonify({"error": "cohort_id does not exist"}), 400

    if Lop.query.filter_by(class_code=class_code).first():
        return jsonify({"error": "Duplicate class_code"}), 400

    try:
        new_item = Lop(
            class_code=class_code,
            name=name,
            major_id=major_id,
            cohort_id=cohort_id,
            advisor=data.get('advisor', '').strip() if data.get('advisor') else None,
            monitor=data.get('monitor', '').strip() if data.get('monitor') else None
        )
        db.session.add(new_item)
        db.session.commit()
        return jsonify({"message": "Lop created successfully", "lop": new_item.to_dict()}), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

@lop_bp.route('/lop/<int:id>', methods=['PUT'])
@login_required
@role_required(2)
def update_lop(id):
    item = Lop.query.get(id)
    if not item:
        return jsonify({"error": "Lop not found"}), 404

    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400

    data = request.get_json(silent=True)
    if data is None:
        return jsonify({'error': 'Invalid JSON format'}), 400

    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid data format, expected JSON object'}), 400

    if not data:
        return jsonify({"message": "Lop updated successfully", "lop": item.to_dict()}), 200

    update_class_code = None
    update_name = None
    update_major_id = None
    update_cohort_id = None

    if 'class_code' in data:
        if not isinstance(data['class_code'], str):
            return jsonify({"error": "class_code must be a string"}), 400
        update_class_code = data['class_code'].strip()
        if not update_class_code:
            return jsonify({"error": "class_code cannot be empty"}), 400
        if len(update_class_code) > 50:
            return jsonify({"error": "class_code exceeds maximum length"}), 400
        if update_class_code != item.class_code and Lop.query.filter_by(class_code=update_class_code).first():
            return jsonify({"error": "Duplicate class_code"}), 400

    if 'name' in data:
        if not isinstance(data['name'], str):
            return jsonify({"error": "name must be a string"}), 400
        update_name = data['name'].strip()
        if not update_name:
            return jsonify({"error": "name cannot be empty"}), 400
        if len(update_name) > 150:
            return jsonify({"error": "name exceeds maximum length"}), 400

    if 'major_id' in data:
        if not isinstance(data['major_id'], int) or isinstance(data['major_id'], bool):
            return jsonify({"error": "major_id must be an integer"}), 400
        update_major_id = data['major_id']
        if not ChuyenNganh.query.get(update_major_id):
            return jsonify({"error": "major_id does not exist"}), 400

    if 'cohort_id' in data:
        if not isinstance(data['cohort_id'], int) or isinstance(data['cohort_id'], bool):
            return jsonify({"error": "cohort_id must be an integer"}), 400
        update_cohort_id = data['cohort_id']
        if not NienKhoa.query.get(update_cohort_id):
            return jsonify({"error": "cohort_id does not exist"}), 400

    try:
        if update_name is not None:
            item.name = update_name
        if update_class_code is not None:
            item.class_code = update_class_code
        if update_major_id is not None:
            item.major_id = update_major_id
        if update_cohort_id is not None:
            item.cohort_id = update_cohort_id
        if 'advisor' in data:
            item.advisor = data['advisor'].strip() if data['advisor'] else None
        if 'monitor' in data:
            item.monitor = data['monitor'].strip() if data['monitor'] else None

        db.session.commit()
        return jsonify({"message": "Lop updated successfully", "lop": item.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

@lop_bp.route('/lop/<int:id>', methods=['DELETE'])
@login_required
@role_required(2)
def delete_lop(id):
    item = Lop.query.get(id)
    if not item:
        return jsonify({"error": "Lop not found"}), 404

    from models import Student
    if Student.query.filter((Student.class_id == id) | (Student.class_name == item.name)).first():
        return jsonify({"error": "Không thể xóa Lớp vì vẫn còn sinh viên đang theo học trong lớp này."}), 400

    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Lop deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
