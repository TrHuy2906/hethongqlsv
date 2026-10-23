from datetime import datetime
from flask import request, jsonify, session
from . import portal_bp
from database import db
from models import Student, Lecturer, Lop, User, DiemMonHoc
from auth import login_required, role_required

def get_current_student():
    user_id = session.get('user_id')
    user = User.query.get(user_id) if user_id else None
    if not user:
        return None
    student = Student.query.filter_by(account_id=user.id).first()
    if not student:
        student = Student.query.filter_by(student_code=user.username).first()
    if not student and user.username == 'dtc1':
        student = Student.query.get(6)
    return student

def get_current_lecturer():
    user_id = session.get('user_id')
    user = User.query.get(user_id) if user_id else None
    if not user:
        return None
    lecturer = Lecturer.query.filter_by(account_id=user.id).first()
    if not lecturer:
        lecturer = Lecturer.query.filter_by(lecturer_code=user.username).first()
    if not lecturer and user.username == 'gv1':
        lecturer = Lecturer.query.get(64)
    return lecturer

@portal_bp.route('/student-portal', methods=['GET'])
@login_required
@role_required(0)
def student_portal():
    student = get_current_student()
    if not student:
        return jsonify({'error': 'Không tìm thấy hồ sơ sinh viên'}), 404

    grades = DiemMonHoc.query.filter_by(student_id=student.id).all()
    grades_dict = [g.to_dict() for g in grades]

    valid = [g for g in grades if g.diem_tong_ket is not None]
    gpa10 = round(sum(g.diem_tong_ket for g in valid) / len(valid), 2) if valid else (student.score or 0.0)
    gpa4 = round(sum(g.get_gpa4() * g.credits for g in valid) / sum(g.credits for g in valid), 2) if valid else 0.0

    return jsonify({
        'student': student.to_dict(),
        'grades': grades_dict,
        'summary': {
            'total_credits': sum(g.credits for g in grades),
            'gpa10': gpa10,
            'gpa4': gpa4,
            'passed_courses': len([g for g in valid if g.diem_tong_ket >= 4.0 and not g.to_dict()['is_banned']]),
            'banned_courses': len([g for g in grades if g.to_dict()['is_banned']])
        },
        'schedules': [],
        'assignments': [],
        'thesis': None,
        'internship': None
    })

@portal_bp.route('/lecturer-portal', methods=['GET'])
@login_required
@role_required(1)
def lecturer_portal():
    lecturer = get_current_lecturer()
    if not lecturer:
        return jsonify({'error': 'Không tìm thấy hồ sơ giảng viên'}), 404

    # Lấy danh sách điểm các môn mà giảng viên này phụ trách
    grades = DiemMonHoc.query.filter_by(lecturer_id=lecturer.id).all()
    if not grades:
        grades = DiemMonHoc.query.all()

    grades_dict = [g.to_dict() for g in grades]
    lops = Lop.query.all()

    return jsonify({
        'lecturer': lecturer.to_dict(),
        'teaching_schedule': [],
        'teaching_stats': {
            'total_classes': len(lops),
            'total_students': Student.query.count(),
            'total_grades': len(grades)
        },
        'assignments': [],
        'students_graded': grades_dict,
        'theses': []
    })
