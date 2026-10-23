from flask import request, jsonify
from . import nienkhoa_bp
from models import NienKhoa, db
from auth import login_required, role_required

@nienkhoa_bp.route('/nienkhoa', methods=['POST'])
@login_required
@role_required(2)
def add_nienkhoa():
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400

    data = request.get_json(silent=True)
    if data is None:
        return jsonify({'error': 'Invalid JSON format'}), 400

    if 'cohort_code' not in data or 'name' not in data or 'start_year' not in data or 'end_year' not in data:
        return jsonify({"error": "Missing required field: cohort_code, name, start_year, end_year"}), 400

    if not isinstance(data['cohort_code'], str):
        return jsonify({"error": "cohort_code must be a string"}), 400
    if not isinstance(data['name'], str):
        return jsonify({"error": "name must be a string"}), 400
    if not isinstance(data['start_year'], int) or isinstance(data['start_year'], bool):
        return jsonify({"error": "start_year must be an integer"}), 400
    if not isinstance(data['end_year'], int) or isinstance(data['end_year'], bool):
        return jsonify({"error": "end_year must be an integer"}), 400

    cohort_code = data['cohort_code'].strip()
    name = data['name'].strip()
    start_year = data['start_year']
    end_year = data['end_year']

    if not cohort_code:
        return jsonify({"error": "cohort_code cannot be empty"}), 400
    if not name:
        return jsonify({"error": "name cannot be empty"}), 400

    if len(cohort_code) > 50:
        return jsonify({"error": "cohort_code exceeds maximum length"}), 400
    if len(name) > 150:
        return jsonify({"error": "name exceeds maximum length"}), 400

    if NienKhoa.query.filter_by(cohort_code=cohort_code).first():
        return jsonify({"error": "Duplicate cohort_code"}), 400

    try:
        new_item = NienKhoa(
            cohort_code=cohort_code,
            name=name,
            start_year=start_year,
            end_year=end_year
        )
        db.session.add(new_item)
        db.session.commit()
        return jsonify({"message": "NienKhoa created successfully", "nienkhoa": new_item.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@nienkhoa_bp.route('/nienkhoa/<int:id>', methods=['PUT'])
@login_required
@role_required(2)
def update_nienkhoa(id):
    item = NienKhoa.query.get(id)
    if not item:
        return jsonify({"error": "NienKhoa not found"}), 404

    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400

    data = request.get_json(silent=True)
    if data is None:
        return jsonify({'error': 'Invalid JSON format'}), 400

    if not data:
        # Partial update logic allows empty JSON
        return jsonify({"message": "NienKhoa updated successfully", "nienkhoa": item.to_dict()}), 200

    update_cohort_code = None
    update_name = None
    update_start_year = None
    update_end_year = None

    if 'cohort_code' in data:
        if not isinstance(data['cohort_code'], str):
            return jsonify({"error": "cohort_code must be a string"}), 400
        update_cohort_code = data['cohort_code'].strip()
        if not update_cohort_code:
            return jsonify({"error": "cohort_code cannot be empty"}), 400
        if len(update_cohort_code) > 50:
            return jsonify({"error": "cohort_code exceeds maximum length"}), 400
        if update_cohort_code != item.cohort_code and NienKhoa.query.filter_by(cohort_code=update_cohort_code).first():
            return jsonify({"error": "Duplicate cohort_code"}), 400

    if 'name' in data:
        if not isinstance(data['name'], str):
            return jsonify({"error": "name must be a string"}), 400
        update_name = data['name'].strip()
        if not update_name:
            return jsonify({"error": "name cannot be empty"}), 400
        if len(update_name) > 150:
            return jsonify({"error": "name exceeds maximum length"}), 400

    if 'start_year' in data:
        if not isinstance(data['start_year'], int) or isinstance(data['start_year'], bool):
            return jsonify({"error": "start_year must be an integer"}), 400
        update_start_year = data['start_year']

    if 'end_year' in data:
        if not isinstance(data['end_year'], int) or isinstance(data['end_year'], bool):
            return jsonify({"error": "end_year must be an integer"}), 400
        update_end_year = data['end_year']

    try:
        if update_name is not None:
            item.name = update_name
        if update_cohort_code is not None:
            item.cohort_code = update_cohort_code
        if update_start_year is not None:
            item.start_year = update_start_year
        if update_end_year is not None:
            item.end_year = update_end_year

        db.session.commit()
        return jsonify({"message": "NienKhoa updated successfully", "nienkhoa": item.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@nienkhoa_bp.route('/nienkhoa/<int:id>', methods=['DELETE'])
@login_required
@role_required(2)
def delete_nienkhoa(id):
    item = NienKhoa.query.get(id)
    if not item:
        return jsonify({"error": "NienKhoa not found"}), 404

    from models import Lop
    if Lop.query.filter_by(cohort_id=id).first():
        return jsonify({"error": "Không thể xóa Niên khóa vì vẫn còn lớp học thuộc niên khóa này."}), 400

    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "NienKhoa deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
