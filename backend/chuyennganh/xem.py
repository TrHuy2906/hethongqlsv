from flask import request, jsonify
from . import chuyennganh_bp
from models import ChuyenNganh, db
from auth import login_required, role_required

@chuyennganh_bp.route('/chuyennganh', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_chuyennganh_list():
    try:
        search_name = request.args.get('name', '').strip().lower()
        search_code = request.args.get('mcn', '').strip()

        query = ChuyenNganh.query
        if search_name:
            query = query.filter(db.func.lower(ChuyenNganh.name).like(f"%{search_name}%"))
        if search_code:
            query = query.filter(ChuyenNganh.major_code == search_code)

        items = query.all()
        return jsonify([item.to_dict() for item in items]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chuyennganh_bp.route('/chuyennganh/<int:id>', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_chuyennganh_by_id(id):
    try:
        item = ChuyenNganh.query.get(id)
        if not item:
            return jsonify({"error": "ChuyenNganh not found"}), 404
        return jsonify(item.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
