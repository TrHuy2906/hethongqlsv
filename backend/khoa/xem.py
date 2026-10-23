from flask import request, jsonify
from . import khoa_bp
from models import Khoa, db
from auth import login_required, role_required

@khoa_bp.route('/khoa', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_khoa_list():
    try:
        search_name = request.args.get('name', '').strip().lower()
        search_code = request.args.get('mk', '').strip()

        query = Khoa.query
        if search_name:
            query = query.filter(db.func.lower(Khoa.name).like(f"%{search_name}%"))
        if search_code:
            query = query.filter(Khoa.khoa_code == search_code)

        khoas = query.all()
        return jsonify([k.to_dict() for k in khoas]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@khoa_bp.route('/khoa/<int:id>', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_khoa_by_id(id):
    try:
        khoa = Khoa.query.get(id)
        if not khoa:
            return jsonify({"error": "Khoa not found"}), 404
        return jsonify(khoa.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
