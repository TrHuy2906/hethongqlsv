from flask import render_template, request, jsonify
from . import lop_bp
from models import Lop
from auth import login_required, role_required
from sqlalchemy import and_

@lop_bp.route('/lop', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_lop_list():
    accept = request.headers.get('Accept', '')
    if 'text/html' in accept and 'application/json' not in accept:
        return render_template('lop.html')

    ml = request.args.get('ml', '').strip()
    name = request.args.get('name', '').strip()

    query = Lop.query
    conditions = []
    if ml:
        conditions.append(Lop.class_code.ilike(f"%{ml}%"))
    if name:
        conditions.append(Lop.name.ilike(f"%{name}%"))

    if conditions:
        query = query.filter(and_(*conditions))

    items = query.all()
    return jsonify([item.to_dict() for item in items]), 200

@lop_bp.route('/lop/<int:id>', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_lop_detail(id):
    item = Lop.query.get(id)
    if item:
        return jsonify(item.to_dict()), 200
    return jsonify({'error': 'Lop not found'}), 404
