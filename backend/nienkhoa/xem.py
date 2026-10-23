from flask import render_template, request, jsonify
from . import nienkhoa_bp
from models import NienKhoa
from auth import login_required, role_required
from sqlalchemy import or_, and_

@nienkhoa_bp.route('/nienkhoa', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_nienkhoa_list():
    accept = request.headers.get('Accept', '')
    if 'text/html' in accept and 'application/json' not in accept:
        return render_template('nienkhoa.html')

    mnk = request.args.get('mnk', '').strip()
    name = request.args.get('name', '').strip()

    query = NienKhoa.query
    conditions = []
    if mnk:
        conditions.append(NienKhoa.cohort_code.ilike(f"%{mnk}%"))
    if name:
        conditions.append(NienKhoa.name.ilike(f"%{name}%"))

    if conditions:
        query = query.filter(and_(*conditions))

    items = query.all()
    return jsonify([item.to_dict() for item in items]), 200

@nienkhoa_bp.route('/nienkhoa/<int:id>', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_nienkhoa_detail(id):
    item = NienKhoa.query.get(id)
    if item:
        return jsonify(item.to_dict()), 200
    return jsonify({'error': 'NienKhoa not found'}), 404
