from flask import request, jsonify, session
from database import db
from models import DiemMonHoc, Student, Lecturer
from auth import login_required, role_required, get_current_lecturer
from . import diem_bp

def validate_score(val, field_name):
    """Kiểm tra điểm số phải trong khoảng 0.0 đến 10.0."""
    if val is None or val == '':
        return None, None
    try:
        score = float(val)
        if score < 0.0 or score > 10.0:
            return None, f"Điểm số {field_name} không hợp lệ, yêu cầu nhập trong khoảng 0 - 10"
        return round(score, 2), None
    except (ValueError, TypeError):
        return None, f"Định dạng điểm không hợp lệ cho {field_name}"

# API Thêm điểm môn học mới (CRUD - Create)
@diem_bp.route('/grades', methods=['POST'])
@login_required
@role_required(1, 2)
def add_grade():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data:
        return jsonify({'error': 'Không có dữ liệu gửi lên'}), 400
        
    student_id = data.get('student_id')
    subject_code = (data.get('subject_code') or '').strip().upper()
    subject_name = (data.get('subject_name') or '').strip()
    
    if not student_id:
        return jsonify({'error': 'Vui lòng chọn sinh viên'}), 400
    if not subject_name:
        return jsonify({'error': 'Vui lòng nhập tên môn học'}), 400
    if not subject_code:
        subject_code = 'MH' + ''.join(w[0] for w in subject_name.split() if w)[:4].upper()
        
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'error': 'Không tìm thấy hồ sơ sinh viên'}), 404
        
    # Kiểm tra xem sinh viên đã có điểm môn này trong cùng học kỳ chưa
    semester = data.get('semester') or 'Học kỳ 1 (2025-2026)'
    existing = DiemMonHoc.query.filter_by(
        student_id=student.id,
        subject_code=subject_code,
        semester=semester
    ).first()
    if existing:
        return jsonify({'error': f'Sinh viên {student.name} đã có bảng điểm môn {subject_name} trong học kỳ này'}), 400
        
    # Validate các đầu điểm
    d_cc, err = validate_score(data.get('diem_chuyen_can'), 'Chuyên cần')
    if err: return jsonify({'error': err}), 400
    
    d_gk, err = validate_score(data.get('diem_giua_ky'), 'Giữa kỳ')
    if err: return jsonify({'error': err}), 400
    
    d_ck, err = validate_score(data.get('diem_cuoi_ky'), 'Cuối kỳ')
    if err: return jsonify({'error': err}), 400
    
    try:
        credits = int(data.get('credits', 3))
    except (ValueError, TypeError):
        credits = 3
        
    try:
        so_buoi_nghi = int(data.get('so_buoi_nghi', 0))
    except (ValueError, TypeError):
        so_buoi_nghi = 0
        
    grade = DiemMonHoc(
        student_id=student.id,
        subject_code=subject_code,
        subject_name=subject_name,
        credits=credits,
        diem_chuyen_can=d_cc,
        diem_giua_ky=d_gk,
        diem_cuoi_ky=d_ck,
        so_buoi_nghi=so_buoi_nghi,
        semester=semester
    )
    
    user_role = session.get('role')
    if user_role == 1:
        lec = get_current_lecturer()
        if lec: grade.lecturer_id = lec.id
    elif data.get('lecturer_id'):
        grade.lecturer_id = int(data.get('lecturer_id'))
        
    grade.calculate_grade()
    db.session.add(grade)
    
    # Cập nhật lại GPA cho sinh viên nếu có
    try:
        db.session.commit()
        # Tính lại điểm trung bình tích lũy cho sinh viên
        all_std_grades = DiemMonHoc.query.filter_by(student_id=student.id).all()
        valid = [g for g in all_std_grades if g.diem_tong_ket is not None]
        if valid:
            avg_gpa = round(sum(g.diem_tong_ket * g.credits for g in valid) / sum(g.credits for g in valid), 2)
            student.score = avg_gpa
            db.session.commit()
            
        return jsonify({
            'message': f'Nhập điểm môn {grade.subject_name} cho sinh viên {student.name} thành công!',
            'grade': grade.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Lỗi lưu trữ cơ sở dữ liệu'}), 500

# API Cập nhật điểm môn học (CRUD - Update)
@diem_bp.route('/grades/<int:id>', methods=['PUT', 'POST'])
@login_required
@role_required(1, 2)
def update_grade(id):
    grade = DiemMonHoc.query.get(id)
    if not grade:
        return jsonify({'error': 'Không tìm thấy bản ghi điểm'}), 404
        
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data:
        return jsonify({'error': 'Không có dữ liệu gửi lên'}), 400
        
    if 'subject_name' in data and data['subject_name']:
        grade.subject_name = data['subject_name'].strip()
    if 'subject_code' in data and data['subject_code']:
        grade.subject_code = data['subject_code'].strip().upper()
    if 'credits' in data:
        try: grade.credits = int(data['credits'])
        except (ValueError, TypeError): pass
        
    if 'diem_chuyen_can' in data:
        d_cc, err = validate_score(data['diem_chuyen_can'], 'Chuyên cần')
        if err: return jsonify({'error': err}), 400
        grade.diem_chuyen_can = d_cc
        
    if 'diem_giua_ky' in data:
        d_gk, err = validate_score(data['diem_giua_ky'], 'Giữa kỳ')
        if err: return jsonify({'error': err}), 400
        grade.diem_giua_ky = d_gk
        
    if 'diem_cuoi_ky' in data:
        d_ck, err = validate_score(data['diem_cuoi_ky'], 'Cuối kỳ')
        if err: return jsonify({'error': err}), 400
        grade.diem_cuoi_ky = d_ck
        
    if 'so_buoi_nghi' in data:
        try: grade.so_buoi_nghi = int(data['so_buoi_nghi'])
        except (ValueError, TypeError): pass
        
    grade.calculate_grade()
    
    try:
        db.session.commit()
        # Tính lại điểm trung bình cho sinh viên
        if grade.student:
            valid = [g for g in DiemMonHoc.query.filter_by(student_id=grade.student_id).all() if g.diem_tong_ket is not None]
            if valid:
                grade.student.score = round(sum(g.diem_tong_ket * g.credits for g in valid) / sum(g.credits for g in valid), 2)
                db.session.commit()
                
        return jsonify({
            'message': 'Cập nhật điểm môn học thành công!',
            'grade': grade.to_dict()
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi lưu trữ cơ sở dữ liệu'}), 500

# API Xóa bản ghi điểm môn học (CRUD - Delete, Chỉ Admin)
@diem_bp.route('/grades/<int:id>', methods=['DELETE'])
@login_required
@role_required(2)
def delete_grade(id):
    grade = DiemMonHoc.query.get(id)
    if not grade:
        return jsonify({'error': 'Không tìm thấy bản ghi điểm'}), 404
        
    student = grade.student
    db.session.delete(grade)
    try:
        db.session.commit()
        # Cập nhật lại điểm trung bình sinh viên sau khi xóa
        if student:
            valid = [g for g in DiemMonHoc.query.filter_by(student_id=student.id).all() if g.diem_tong_ket is not None]
            if valid:
                student.score = round(sum(g.diem_tong_ket * g.credits for g in valid) / sum(g.credits for g in valid), 2)
            else:
                student.score = 0.0
            db.session.commit()
            
        return jsonify({'message': 'Đã xóa bản ghi điểm thành công!'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi cơ sở dữ liệu khi xóa điểm'}), 500
