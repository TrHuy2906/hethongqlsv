from flask import request, jsonify
from . import giangvien_bp
from models import Lecturer, db
from auth import login_required, role_required

@giangvien_bp.route('/lecturers', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_lecturers():
    try:
        search_name = request.args.get('name', '').strip().lower()
        search_code = request.args.get('mgv', '').strip()
        
        query = Lecturer.query
        if search_name:
            query = query.filter(db.func.lower(Lecturer.name).like(f"%{search_name}%"))
        if search_code:
            query = query.filter(Lecturer.lecturer_code == search_code)
            
        lecturers = query.all()
        return jsonify([l.to_dict() for l in lecturers]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@giangvien_bp.route('/lecturers/<int:id>', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_lecturer_by_id(id):
    try:
        lecturer = Lecturer.query.get(id)
        if not lecturer:
            return jsonify({"error": "Lecturer not found"}), 404
        return jsonify(lecturer.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
