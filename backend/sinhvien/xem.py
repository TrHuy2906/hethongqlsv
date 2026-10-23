from flask import jsonify, request
from models import Student
from auth import login_required, role_required
from . import sinhvien_bp

# API Lấy danh sách sinh viên
@sinhvien_bp.route('/students', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_students():
    query = Student.query
    
    msv = request.args.get('msv', '').strip()
    name = request.args.get('name', '').strip()
    
    if msv:
        query = query.filter(Student.student_code == msv)
    if name:
        query = query.filter(Student.name.ilike(f'%{name}%'))
        
    students = query.order_by(Student.id.desc()).all()
    return jsonify([s.to_dict() for s in students])

# API Lấy thông tin 1 sinh viên
@sinhvien_bp.route('/students/<int:id>', methods=['GET'])
@login_required
@role_required(0, 1, 2)
def get_student(id):
    student = Student.query.get(id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    return jsonify(student.to_dict())
