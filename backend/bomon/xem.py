from flask import request, jsonify
from . import bomon_bp
from models import BoMon, db
from auth import login_required, role_required

@bomon_bp.route('/bomon', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_bomon_list():
    try:
        search_name = request.args.get('name', '').strip().lower()
        search_code = request.args.get('mbm', '').strip()

        query = BoMon.query
        if search_name:
            query = query.filter(db.func.lower(BoMon.name).like(f"%{search_name}%"))
        if search_code:
            query = query.filter(BoMon.bomon_code == search_code)

        bomon = query.all()
        return jsonify([b.to_dict() for b in bomon]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bomon_bp.route('/bomon/<int:id>', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_bomon_by_id(id):
    try:
        bomon = BoMon.query.get(id)
        if not bomon:
            return jsonify({"error": "BoMon not found"}), 404
        return jsonify(bomon.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
