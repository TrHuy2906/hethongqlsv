from flask import request, jsonify, session
from database import db
from models import DiemDoAn, DoAn, Lecturer, Student
from auth import login_required, role_required
from . import diem_bp

def validate_score(val, field_name):
    """Kiểm tra điểm số phải trong khoảng 0 đến 10."""
    if val is None or val == '':
        return None, None
    try:
        score = float(val)
        if score < 0.0 or score > 10.0:
            return None, f"Điểm số không hợp lệ cho {field_name}, yêu cầu nhập trong khoảng 0-10"
        return round(score, 2), None
    except (ValueError, TypeError):
        return None, f"Định dạng điểm không hợp lệ cho {field_name}"

# API Cập nhật/Nhập điểm đồ án (UseCase 3.10)
@diem_bp.route('/grades/<int:project_id>', methods=['POST', 'PUT'])
@login_required
@role_required(1, 2)
def save_grade(project_id):
    project = DoAn.query.get(project_id)
    if not project:
        return jsonify({'error': 'Không tìm thấy đồ án'}), 404

    user_role = session.get('role')
    if user_role == 1:
        lecturer = Lecturer.query.filter_by(account_id=session.get('user_id')).first()
        if not lecturer:
            return jsonify({'error': 'Chưa liên kết hồ sơ giảng viên'}), 403
        # Giảng viên phải là GVHD, GVPB hoặc thành viên hội đồng
        is_assigned = (
            project.lecturer_id == lecturer.id or
            project.reviewer_id == lecturer.id or
            (project.council and (
                project.council.member1_id == lecturer.id or
                project.council.member2_id == lecturer.id or
                project.council.member3_id == lecturer.id
            ))
        )
        if not is_assigned:
            return jsonify({'error': 'Bạn không thuộc danh sách giảng viên chấm điểm cho đồ án này'}), 403

    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data:
        return jsonify({'error': 'Không có dữ liệu điểm gửi lên'}), 400

    grade = DiemDoAn.query.filter_by(project_id=project_id).first()
    if not grade:
        grade = DiemDoAn(project_id=project_id)
        db.session.add(grade)

    # Validate các đầu điểm
    score_fields = [
        ('diem_gvhd', 'Điểm giảng viên hướng dẫn'),
        ('diem_gvpb', 'Điểm giảng viên phản biện'),
        ('diem_tv1', 'Điểm thành viên hội đồng 1'),
        ('diem_tv2', 'Điểm thành viên hội đồng 2'),
        ('diem_tv3', 'Điểm thành viên hội đồng 3')
    ]

    for key, label in score_fields:
        if key in data and data[key] is not None and data[key] != '':
            s_val, s_err = validate_score(data[key], label)
            if s_err:
                return jsonify({'error': s_err}), 400
            setattr(grade, key, s_val)
        elif key in data and (data[key] is None or data[key] == '') and user_role == 2:
            setattr(grade, key, None)


    # Tự động tính điểm trung bình hội đồng và điểm tổng kết
    grade.calculate_averages()

    # Cập nhật điểm tổng kết vào điểm sinh viên nếu có
    if grade.diem_tong_ket is not None and project.student:
        project.student.score = grade.diem_tong_ket

    try:
        db.session.commit()
        return jsonify({
            'message': 'Lưu điểm đồ án thành công',
            'grade': grade.to_dict()
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi cơ sở dữ liệu khi lưu điểm đồ án'}), 500

# API Xóa điểm đồ án (Chỉ Admin)
@diem_bp.route('/grades/<int:project_id>', methods=['DELETE'])
@login_required
@role_required(2)
def delete_grade(project_id):
    grade = DiemDoAn.query.filter_by(project_id=project_id).first()
    if not grade:
        return jsonify({'error': 'Không tìm thấy bản ghi điểm'}), 404

    db.session.delete(grade)
    try:
        db.session.commit()
        return jsonify({'message': 'Xóa bản ghi điểm thành công'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi khi xóa bản ghi điểm'}), 500
