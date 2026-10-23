import time
from datetime import datetime
from flask import request, jsonify, session
from database import db
from models import ThucTap, Student
from auth import login_required, role_required, get_current_student
from . import thuctap_bp

# API Thêm mới thông tin thực tập
@thuctap_bp.route('/internships', methods=['POST'])
@login_required
@role_required(0, 1, 2)
def add_internship():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data:
        return jsonify({'error': 'Không có dữ liệu gửi lên'}), 400

    user_role = session.get('role')
    student_id = data.get('student_id')
    if user_role == 0 and not student_id:
        student = get_current_student()
        if student:
            student_id = student.id

    company_name = data.get('company_name', '').strip()

    if not student_id or not company_name:
        return jsonify({'error': 'Thông tin sinh viên và tên công ty là bắt buộc'}), 400

    try:
        student_id = int(student_id)
        student = Student.query.get(student_id)
        if not student:
            return jsonify({'error': 'Sinh viên không tồn tại'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'ID sinh viên không hợp lệ'}), 400

    # Ràng buộc UseCase 3.15: Nếu đã tồn tại thông tin của sinh viên trong thực tập -> thông báo lỗi
    if ThucTap.query.filter_by(student_id=student_id).first():
        return jsonify({'error': 'Sinh viên này đã có thông tin thực tập trong hệ thống'}), 400

    start_date = None
    if data.get('start_date'):
        try:
            start_date = datetime.strptime(data['start_date'].strip(), '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Định dạng ngày bắt đầu không hợp lệ, phải là YYYY-MM-DD'}), 400

    end_date = None
    if data.get('end_date'):
        try:
            end_date = datetime.strptime(data['end_date'].strip(), '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Định dạng ngày kết thúc không hợp lệ, phải là YYYY-MM-DD'}), 400

    internship_code = data.get('internship_code', '').strip()
    if not internship_code:
        internship_code = f"TT_{student.student_code or student_id}_{int(time.time())}"

    new_internship = ThucTap(
        internship_code=internship_code,
        student_id=student_id,
        company_name=company_name,
        position=data.get('position', '').strip() or None,
        start_date=start_date,
        end_date=end_date,
        evaluation=data.get('evaluation', '').strip() or None
    )

    db.session.add(new_internship)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi cơ sở dữ liệu khi thêm thực tập'}), 500

    return jsonify({
        'message': 'Thêm thông tin thực tập thành công',
        'internship': new_internship.to_dict()
    }), 201

# API Cập nhật thông tin thực tập
@thuctap_bp.route('/internships/<int:id>', methods=['PUT'])
@login_required
@role_required(1, 2)
def update_internship(id):
    internship = ThucTap.query.get(id)
    if not internship:
        return jsonify({'error': 'Không tìm thấy thông tin thực tập'}), 404

    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data:
        return jsonify({'error': 'Không có dữ liệu cập nhật'}), 400

    if 'company_name' in data and data['company_name']:
        internship.company_name = data['company_name'].strip()

    if 'position' in data:
        internship.position = data.get('position', '').strip() or None

    if 'evaluation' in data:
        internship.evaluation = data.get('evaluation', '').strip() or None

    if 'start_date' in data:
        if data['start_date']:
            try:
                internship.start_date = datetime.strptime(data['start_date'].strip(), '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Định dạng ngày bắt đầu không hợp lệ, phải là YYYY-MM-DD'}), 400
        else:
            internship.start_date = None

    if 'end_date' in data:
        if data['end_date']:
            try:
                internship.end_date = datetime.strptime(data['end_date'].strip(), '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Định dạng ngày kết thúc không hợp lệ, phải là YYYY-MM-DD'}), 400
        else:
            internship.end_date = None

    try:
        db.session.commit()
        return jsonify({
            'message': 'Cập nhật thông tin thực tập thành công',
            'internship': internship.to_dict()
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi khi cập nhật thông tin thực tập'}), 500

# API Xóa thông tin thực tập (Chỉ Admin)
@thuctap_bp.route('/internships/<int:id>', methods=['DELETE'])
@login_required
@role_required(2)
def delete_internship(id):
    internship = ThucTap.query.get(id)
    if not internship:
        return jsonify({'error': 'Không tìm thấy thông tin thực tập'}), 404

    db.session.delete(internship)
    try:
        db.session.commit()
        return jsonify({'message': 'Xóa thông tin thực tập thành công'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi khi xóa thông tin thực tập'}), 500
