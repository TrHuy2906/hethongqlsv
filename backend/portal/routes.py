from datetime import datetime
from flask import request, jsonify, session
from . import portal_bp
from database import db
from models import Student, Lecturer, Lop, User, LichHoc, DiemMonHoc, BaiTap, NopBaiTap
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

def ensure_seed_portal_data():
    if LichHoc.query.count() == 0:
        lops = Lop.query.all()
        target_lop = None
        for l in lops:
            if '61' in l.class_code or 'K61' in (l.name or ''):
                target_lop = l
                break
        if not target_lop and lops:
            target_lop = lops[0]
        lop_id = target_lop.id if target_lop else None

        lecturers = Lecturer.query.all()
        gv_thay = None
        for g in lecturers:
            if 'Thầy' in g.name or g.account_id == 79:
                gv_thay = g
                break
        if not gv_thay and lecturers:
            gv_thay = lecturers[0]
        gv_id = gv_thay.id if gv_thay else None

        sample_schedules = [
            LichHoc(
                class_id=lop_id,
                lecturer_id=gv_id,
                subject_code='PM01',
                subject_name='Phát triển phần mềm chuyên nghiệp',
                day_of_week='Thứ 2',
                period='Tiết 1-3 (07:00 - 09:15)',
                room='P.402-A1',
                credits=3,
                semester='Học kỳ 1 (2025-2026)',
                study_type='Lý thuyết & Thực hành'
            ),
            LichHoc(
                class_id=lop_id,
                lecturer_id=gv_id,
                subject_code='CSDL02',
                subject_name='Cơ sở dữ liệu nâng cao',
                day_of_week='Thứ 3',
                period='Tiết 4-6 (09:30 - 11:45)',
                room='Lab 3-C2',
                credits=3,
                semester='Học kỳ 1 (2025-2026)',
                study_type='Thực hành phòng máy'
            ),
            LichHoc(
                class_id=lop_id,
                lecturer_id=gv_id,
                subject_code='KTPM03',
                subject_name='Kiến trúc và Thiết kế phần mềm',
                day_of_week='Thứ 4',
                period='Tiết 1-3 (07:00 - 09:15)',
                room='P.305-B2',
                credits=4,
                semester='Học kỳ 1 (2025-2026)',
                study_type='Lý thuyết & Đồ án'
            ),
            LichHoc(
                class_id=lop_id,
                lecturer_id=gv_id,
                subject_code='AI04',
                subject_name='Trí tuệ nhân tạo & Học máy',
                day_of_week='Thứ 5',
                period='Tiết 7-9 (13:00 - 15:15)',
                room='Lab 5-C2',
                credits=3,
                semester='Học kỳ 1 (2025-2026)',
                study_type='Thực hành & Dự án'
            ),
            LichHoc(
                class_id=lop_id,
                lecturer_id=gv_id,
                subject_code='ATTT05',
                subject_name='An toàn & Bảo mật hệ thống thông tin',
                day_of_week='Thứ 6',
                period='Tiết 4-6 (09:30 - 11:45)',
                room='P.201-A2',
                credits=3,
                semester='Học kỳ 1 (2025-2026)',
                study_type='Lý thuyết & Case-study'
            )
        ]
        db.session.bulk_save_objects(sample_schedules)
        db.session.commit()

    if DiemMonHoc.query.count() == 0:
        student = Student.query.get(6)
        if not student:
            student = Student.query.first()
        if student:
            sample_grades = [
                DiemMonHoc(
                    student_id=student.id,
                    subject_code='PM01',
                    subject_name='Phát triển phần mềm chuyên nghiệp',
                    credits=3,
                    diem_chuyen_can=9.5,
                    diem_giua_ky=8.5,
                    diem_cuoi_ky=9.0,
                    diem_tong_ket=8.9,
                    so_buoi_nghi=1,
                    tong_so_buoi=15
                ),
                DiemMonHoc(
                    student_id=student.id,
                    subject_code='CSDL02',
                    subject_name='Cơ sở dữ liệu nâng cao',
                    credits=3,
                    diem_chuyen_can=10.0,
                    diem_giua_ky=9.0,
                    diem_cuoi_ky=9.5,
                    diem_tong_ket=9.4,
                    so_buoi_nghi=0,
                    tong_so_buoi=15
                ),
                DiemMonHoc(
                    student_id=student.id,
                    subject_code='KTPM03',
                    subject_name='Kiến trúc và Thiết kế phần mềm',
                    credits=4,
                    diem_chuyen_can=8.5,
                    diem_giua_ky=8.0,
                    diem_cuoi_ky=8.5,
                    diem_tong_ket=8.35,
                    so_buoi_nghi=2,
                    tong_so_buoi=15
                ),
                DiemMonHoc(
                    student_id=student.id,
                    subject_code='AI04',
                    subject_name='Trí tuệ nhân tạo & Học máy',
                    credits=3,
                    diem_chuyen_can=9.0,
                    diem_giua_ky=8.5,
                    diem_cuoi_ky=8.8,
                    diem_tong_ket=8.73,
                    so_buoi_nghi=1,
                    tong_so_buoi=15
                ),
                DiemMonHoc(
                    student_id=student.id,
                    subject_code='ATTT05',
                    subject_name='An toàn & Bảo mật hệ thống thông tin',
                    credits=3,
                    diem_chuyen_can=7.0,
                    diem_giua_ky=7.5,
                    diem_cuoi_ky=7.8,
                    diem_tong_ket=7.63,
                    so_buoi_nghi=2,
                    tong_so_buoi=15
                ),
                DiemMonHoc(
                    student_id=student.id,
                    subject_code='MMT06',
                    subject_name='Mạng máy tính nâng cao',
                    credits=3,
                    diem_chuyen_can=5.0,
                    diem_giua_ky=6.0,
                    diem_cuoi_ky=6.5,
                    diem_tong_ket=6.2,
                    so_buoi_nghi=4,
                    tong_so_buoi=15
                )
            ]
            db.session.bulk_save_objects(sample_grades)
            db.session.commit()

    gv_thay = Lecturer.query.filter_by(name='TS. Trần Văn Thầy').first() or Lecturer.query.get(64) or Lecturer.query.first()
    gv_id = gv_thay.id if gv_thay else None
    if gv_id:
        unassigned_grades = DiemMonHoc.query.filter_by(lecturer_id=None).all()
        for ug in unassigned_grades:
            ug.lecturer_id = gv_id
        if unassigned_grades:
            db.session.commit()

    if BaiTap.query.count() == 0:
        lop = Lop.query.first()
        lop_id = lop.id if lop else None
        student = Student.query.get(6) or Student.query.first()

        b1 = BaiTap(
            title='Xây dựng sơ đồ kiến trúc Microservices và RESTful API',
            subject_name='Kiến trúc và Thiết kế phần mềm',
            class_id=lop_id,
            lecturer_id=gv_id,
            deadline='23:59 28/10/2026',
            description='Thiết kế kiến trúc hệ thống phân tán bao gồm API Gateway, Auth Service, Core Service và vẽ biểu đồ Sequence diagram luồng xác thực token JWT.'
        )
        b2 = BaiTap(
            title='Thiết kế CSDL quan hệ chuẩn hóa 3NF và viết Store Procedure',
            subject_name='Cơ sở dữ liệu nâng cao',
            class_id=lop_id,
            lecturer_id=gv_id,
            deadline='23:59 30/10/2026',
            description='Chuẩn hóa lược đồ cơ sở dữ liệu lên dạng chuẩn 3NF và viết thủ tục lưu trữ tính điểm trung bình tích lũy cho toàn bộ sinh viên trong niên khóa.'
        )
        b3 = BaiTap(
            title='Triển khai CI/CD Pipeline và Docker Containerization',
            subject_name='Phát triển phần mềm chuyên nghiệp',
            class_id=lop_id,
            lecturer_id=gv_id,
            deadline='23:59 05/11/2026',
            description='Đóng gói ứng dụng web vào Docker container và thiết lập kịch bản tự động kiểm thử với GitHub Actions.'
        )
        b4 = BaiTap(
            title='Huấn luyện mô hình Convolutional Neural Network (CNN) nhận diện ảnh',
            subject_name='Trí tuệ nhân tạo & Học máy',
            class_id=lop_id,
            lecturer_id=gv_id,
            deadline='23:59 12/11/2026',
            description='Sử dụng TensorFlow/PyTorch xây dựng mạng CNN huấn luyện trên tập dữ liệu ảnh CIFAR-10 đạt độ chính xác trên 85%.'
        )
        db.session.add_all([b1, b2, b3, b4])
        db.session.commit()

        if student:
            sub = NopBaiTap(
                assignment_id=b1.id,
                student_id=student.id,
                submission_file='kien_truc_microservices_sv06.pdf',
                submission_note='Em đã hoàn thành thiết kế kiến trúc hệ thống và biểu đồ luồng dữ liệu, kèm link mã nguồn GitHub trong tệp.',
                score=9.0,
                feedback='Bài làm rất chi tiết, phân chia ranh giới dịch vụ rõ ràng và vẽ đúng chuẩn UML!'
            )
            db.session.add(sub)
            db.session.commit()
    elif gv_id:
        for bt in BaiTap.query.all():
            if bt.lecturer_id is None or bt.lecturer_id == 33:
                bt.lecturer_id = gv_id
        db.session.commit()

    from models import DoAn, ThucTap
    if DoAn.query.count() == 0 and gv_id:
        sv6 = Student.query.get(6)
        sv1 = Student.query.get(1) or Student.query.first()
        if sv6:
            da1 = DoAn(
                project_code='DA_SV0006_2026',
                name='Nghiên cứu kiến trúc Microservices & Distributed Caching với Redis',
                student_id=sv6.id,
                lecturer_id=gv_id,
                status='Chấp nhận',
                progress='Cập nhật lần 2',
                description='Thiết kế hệ thống phân tán chịu tải cao, tích hợp Redis cache và cơ chế phân tán dữ liệu.',
                defense_date='2026-12-28'
            )
            db.session.add(da1)
        if sv1 and sv1.id != (sv6.id if sv6 else None):
            da2 = DoAn(
                project_code='DA_SV0001_2026',
                name='Ứng dụng Học sâu phát hiện bất thường và tấn công an ninh mạng',
                student_id=sv1.id,
                lecturer_id=gv_id,
                status='Chờ duyệt',
                progress='Chưa bắt đầu',
                description='Ứng dụng Autoencoder và mạng nơ-ron tích chập phân tích lưu lượng mạng phát hiện tấn công DDoS.'
            )
            db.session.add(da2)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

    if ThucTap.query.count() == 0:
        sv6 = Student.query.get(6)
        if sv6:
            tt1 = ThucTap(
                internship_code='TT_SV0006_2026',
                student_id=sv6.id,
                company_name='Tập đoàn Công nghệ FPT Software',
                position='Thực tập sinh Phát triển Phần mềm Backend',
                start_date=datetime.strptime('2026-06-01', '%Y-%m-%d').date(),
                end_date=datetime.strptime('2026-09-01', '%Y-%m-%d').date(),
                evaluation='Đang thực tập - Đánh giá tốt'
            )
            db.session.add(tt1)
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()

@portal_bp.route('/api/student/portal', methods=['GET'])
@login_required
def get_student_portal():
    ensure_seed_portal_data()
    role = session.get('role', 0)
    student = None
    requested_id = request.args.get('student_id')
    if requested_id and role in (1, 2):
        student = Student.query.get(int(requested_id))
    if not student:
        student = get_current_student()
    if not student:
        student = Student.query.get(6) or Student.query.first()
    if not student:
        return jsonify({'error': 'Không tìm thấy hồ sơ sinh viên'}), 404

    schedules_query = LichHoc.query
    if student.class_id:
        schedules_query = schedules_query.filter(
            (LichHoc.class_id == student.class_id) | (LichHoc.class_id.is_(None))
        )
    schedules = [s.to_dict() for s in schedules_query.all()]

    grades_list = DiemMonHoc.query.filter_by(student_id=student.id).all()
    grades = [g.to_dict() for g in grades_list]

    subject_names = [g.subject_name for g in grades_list]
    assignments_query = BaiTap.query
    if student.class_id:
        assignments_query = assignments_query.filter(
            (BaiTap.class_id == student.class_id) | 
            (BaiTap.class_id.is_(None)) | 
            (BaiTap.subject_name.in_(subject_names))
        )
    assignments = [b.to_dict(student_id=student.id) for b in assignments_query.all()]

    classmates = []
    if student.class_id:
        mates = Student.query.filter_by(class_id=student.class_id).all()
        classmates = [{
            'id': m.id,
            'name': m.name,
            'student_code': m.student_code,
            'gender': m.gender,
            'score': round(m.score, 2)
        } for m in mates]

    total_credits = sum(g['credits'] for g in grades)
    valid_grades = [g for g in grades if g['diem_tong_ket'] is not None]
    if valid_grades:
        sum_weighted = sum(g['diem_tong_ket'] * g['credits'] for g in valid_grades)
        sum_credits = sum(g['credits'] for g in valid_grades)
        term_gpa = round(sum_weighted / max(1, sum_credits), 2)
    else:
        term_gpa = round(student.score, 2)

    total_absences = sum(g['so_buoi_nghi'] for g in grades)
    total_sessions = sum(g['tong_so_buoi'] for g in grades)

    lop_info = None
    if student.lop:
        lop_info = {
            'id': student.lop.id,
            'class_code': student.lop.class_code,
            'name': student.lop.name,
            'advisor': student.lop.advisor or 'ThS. Trần Quốc Huy',
            'monitor': student.lop.monitor or student.name,
            'major_name': student.lop.major.name if student.lop.major else 'Công nghệ thông tin',
            'cohort_name': student.lop.cohort.name if student.lop.cohort else 'Khóa 61'
        }
    else:
        lop_info = {
            'class_code': '61PM1',
            'name': student.class_name,
            'advisor': 'ThS. Trần Quốc Huy',
            'monitor': student.name,
            'major_name': 'Kỹ thuật phần mềm',
            'cohort_name': 'Khóa 61'
        }

    return jsonify({
        'student': {
            'id': student.id,
            'name': student.name,
            'student_code': student.student_code or f'SV{student.id:04d}',
            'class_name': student.class_name,
            'class_id': student.class_id,
            'score': round(student.score, 2),
            'dob': student.dob.isoformat() if student.dob else '15/09/2003',
            'gender': student.gender or 'Nam',
            'email': student.email or f"{student.student_code or 'sv'}@qlsv.edu.vn",
            'account_username': student.account.username if student.account else None,
            'lop': lop_info
        },
        'schedules': schedules,
        'grades': grades,
        'assignments': assignments,
        'classmates': classmates,
        'summary': {
            'total_credits': total_credits,
            'term_gpa': term_gpa,
            'cumulative_gpa': round(student.score, 2),
            'total_absences': total_absences,
            'total_sessions': total_sessions,
            'attendance_rate': round(max(0.0, 100.0 - (total_absences / max(1, total_sessions) * 100)), 1),
            'passed_courses': len([g for g in grades if g['diem_tong_ket'] and g['diem_tong_ket'] >= 4.0]),
            'banned_courses': len([g for g in grades if g['is_banned']])
        }
    }), 200

@portal_bp.route('/api/student/assignments/<int:assignment_id>/submit', methods=['POST'])
@login_required
def submit_assignment(assignment_id):
    student = get_current_student()
    if not student:
        student = Student.query.get(6) or Student.query.first()
    if not student:
        return jsonify({'error': 'Không tìm thấy thông tin sinh viên'}), 404

    assignment = BaiTap.query.get(assignment_id)
    if not assignment:
        return jsonify({'error': 'Không tìm thấy bài tập'}), 404

    data = request.get_json(silent=True) or {}
    submission_file = data.get('submission_file', '').strip()
    submission_note = data.get('submission_note', '').strip()

    if not submission_file:
        return jsonify({'error': 'Vui lòng nhập tên tệp bài làm hoặc liên kết nộp bài'}), 400

    sub = NopBaiTap.query.filter_by(assignment_id=assignment.id, student_id=student.id).first()
    if not sub:
        sub = NopBaiTap(
            assignment_id=assignment.id,
            student_id=student.id,
            submission_file=submission_file,
            submission_note=submission_note,
            submitted_at=datetime.utcnow()
        )
        db.session.add(sub)
    else:
        sub.submission_file = submission_file
        sub.submission_note = submission_note
        sub.submitted_at = datetime.utcnow()

    db.session.commit()
    lecturer_name = assignment.lecturer.name if (assignment and assignment.lecturer) else 'Giảng viên phụ trách'
    return jsonify({
        'message': f'Nộp bài tập thành công! Bài làm của bạn đã được gửi trực tiếp đến tài khoản của Thầy/Cô {lecturer_name}.',
        'submission': sub.to_dict(),
        'lecturer_name': lecturer_name,
        'subject_name': assignment.subject_name
    }), 200

@portal_bp.route('/api/lecturer/portal', methods=['GET'])
@login_required
def get_lecturer_portal():
    ensure_seed_portal_data()
    role = session.get('role', 0)
    if role not in (1, 2):
        return jsonify({'error': 'Chỉ giảng viên hoặc quản trị viên mới có quyền truy cập'}), 403

    lecturer = None
    req_id = request.args.get('lecturer_id')
    if req_id and role == 2:
        lecturer = Lecturer.query.get(int(req_id))
    if not lecturer:
        lecturer = get_current_lecturer()
    if not lecturer:
        lecturer = Lecturer.query.get(64) or Lecturer.query.first()

    lecturer_id = lecturer.id if lecturer else None

    from models import DoAn, ThucTap

    if role == 2 and not req_id:
        schedules = [s.to_dict() for s in LichHoc.query.all()]
        assignments = [b.to_dict() for b in BaiTap.query.all()]
        grades = [g.to_dict() for g in DiemMonHoc.query.all()]
        submissions = [s.to_dict() for s in NopBaiTap.query.order_by(NopBaiTap.id.desc()).all()]
        theses = [d.to_dict() for d in DoAn.query.all()]
        internships = [t.to_dict() for t in ThucTap.query.all()]
    else:
        schedules = [s.to_dict() for s in LichHoc.query.filter_by(lecturer_id=lecturer_id).all()]
        my_assignments = BaiTap.query.filter_by(lecturer_id=lecturer_id).all()
        if not my_assignments:
            my_assignments = BaiTap.query.all()
        assignments = [b.to_dict() for b in my_assignments]
        subj_codes = list(set([s['subject_code'] for s in schedules if s.get('subject_code')]))
        grades = [g.to_dict() for g in DiemMonHoc.query.filter(
            (DiemMonHoc.lecturer_id == lecturer_id) | 
            (DiemMonHoc.subject_code.in_(subj_codes))
        ).all()]
        assignment_ids = [b['id'] for b in assignments]
        submissions = [s.to_dict() for s in NopBaiTap.query.filter(NopBaiTap.assignment_id.in_(assignment_ids)).order_by(NopBaiTap.id.desc()).all()]
        
        theses_query = DoAn.query.filter(
            (DoAn.lecturer_id == lecturer_id) | 
            (DoAn.reviewer_id == lecturer_id)
        ).all()
        theses = [d.to_dict() for d in theses_query]
        internships = [t.to_dict() for t in ThucTap.query.all()]

    class_ids = list(set([s['class_id'] for s in schedules if s.get('class_id')]))
    if class_ids:
        taught_lops = Lop.query.filter(Lop.id.in_(class_ids)).all()
        students_query = Student.query.filter(Student.class_id.in_(class_ids)).all()
    else:
        taught_lops = Lop.query.all()
        students_query = Student.query.all()

    classes_data = []
    for lp in taught_lops:
        st_count = Student.query.filter_by(class_id=lp.id).count()
        classes_data.append({
            'id': lp.id,
            'class_code': lp.class_code,
            'name': lp.name,
            'student_count': st_count
        })

    students_data = [s.to_dict() for s in students_query]

    pending_subs = len([sub for sub in submissions if sub.get('score') is None])
    pending_theses = len([th for th in theses if th.get('status') == 'Chờ duyệt'])

    stats = {
        'total_classes': len(classes_data),
        'total_students': len(students_data),
        'pending_submissions': pending_subs,
        'theses_count': len(theses),
        'pending_theses': pending_theses,
        'internships_count': len(internships)
    }

    announcements = [
        {
            'id': 1,
            'title': 'Nhắc nhở chấm bài tập học phần',
            'content': f'Có {pending_subs} bài tập của sinh viên đang chờ Thầy/Cô chấm điểm và gửi phản hồi.' if pending_subs > 0 else 'Tất cả các bài nộp hiện tại đã được chấm điểm đầy đủ.',
            'type': 'warning' if pending_subs > 0 else 'info',
            'time': 'Hôm nay'
        },
        {
            'id': 2,
            'title': 'Thời khóa biểu giảng dạy học kỳ 1 (2025-2026)',
            'content': f'Thầy/Cô hiện phụ trách {len(schedules)} ca giảng dạy trong tuần. Vui lòng kiểm tra phòng học và lịch thực hành.',
            'type': 'info',
            'time': 'Đầu tuần'
        },
        {
            'id': 3,
            'title': 'Quản lý điểm thi và chuyên cần',
            'content': 'Đã mở cổng nhập điểm chuyên cần, giữa kỳ và điểm thi kết thúc học phần. Quy chế yêu cầu hoàn tất trước tuần 16.',
            'type': 'success',
            'time': 'Tuần này'
        }
    ]

    return jsonify({
        'lecturer': lecturer.to_dict() if lecturer else None,
        'teaching_schedule': schedules,
        'classes': classes_data,
        'students': students_data,
        'grades': grades,
        'assignments': assignments,
        'submissions': submissions,
        'theses': theses,
        'internships': internships,
        'stats': stats,
        'announcements': announcements
    }), 200

@portal_bp.route('/api/lecturer/submissions/<int:submission_id>/grade', methods=['POST', 'PUT'])
@login_required
def grade_assignment_submission(submission_id):
    role = session.get('role', 0)
    if role not in (1, 2):
        return jsonify({'error': 'Bạn không có quyền chấm bài tập'}), 403

    sub = NopBaiTap.query.get(submission_id)
    if not sub:
        return jsonify({'error': 'Không tìm thấy bài nộp'}), 404

    if role == 1:
        current_lec = get_current_lecturer()
        if not current_lec or (sub.assignment and sub.assignment.lecturer_id != current_lec.id):
            return jsonify({'error': 'Bạn không được phân công chấm bài tập của giảng viên khác'}), 403

    data = request.get_json(silent=True) or {}
    score = data.get('score')
    feedback = data.get('feedback', '').strip()

    if score is not None and score != '':
        try:
            val = float(score)
            if 0.0 <= val <= 10.0:
                sub.score = val
            else:
                return jsonify({'error': 'Điểm bài tập phải nằm trong thang điểm 0 - 10'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Điểm số không hợp lệ'}), 400

    if feedback is not None:
        sub.feedback = feedback

    db.session.commit()
    student_name = sub.student.name if sub.student else 'Sinh viên'
    return jsonify({
        'message': f'Chấm điểm và phản hồi bài nộp của sinh viên {student_name} thành công!',
        'submission': sub.to_dict()
    }), 200

@portal_bp.route('/api/lecturer/grades/<int:grade_id>', methods=['PUT', 'POST'])
@login_required
def update_grade(grade_id):
    role = session.get('role', 0)
    if role not in (1, 2):
        return jsonify({'error': 'Bạn không có quyền chỉnh sửa điểm số'}), 403

    grade = DiemMonHoc.query.get(grade_id)
    if not grade:
        return jsonify({'error': 'Không tìm thấy bản ghi điểm môn học'}), 404

    data = request.get_json(silent=True) or {}

    if role == 1:
        current_lec = get_current_lecturer()
        if not current_lec:
            return jsonify({'error': 'Hồ sơ giảng viên chưa liên kết với tài khoản này'}), 403
        
        is_assigned = (grade.lecturer_id == current_lec.id)
        if not is_assigned:
            teaches = LichHoc.query.filter_by(lecturer_id=current_lec.id, subject_code=grade.subject_code).first()
            if teaches:
                is_assigned = True
                if not grade.lecturer_id:
                    grade.lecturer_id = current_lec.id

        if not is_assigned:
            return jsonify({'error': 'Bạn không được phân công giảng dạy học phần này nên không thể chỉnh sửa điểm'}), 403

    if 'diem_chuyen_can' in data and data['diem_chuyen_can'] is not None and data['diem_chuyen_can'] != '':
        try:
            val = float(data['diem_chuyen_can'])
            if 0.0 <= val <= 10.0:
                grade.diem_chuyen_can = val
            else:
                return jsonify({'error': 'Điểm chuyên cần không hợp lệ, yêu cầu từ 0 đến 10'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Định dạng điểm chuyên cần không hợp lệ'}), 400

    if 'diem_giua_ky' in data and data['diem_giua_ky'] is not None and data['diem_giua_ky'] != '':
        try:
            val = float(data['diem_giua_ky'])
            if 0.0 <= val <= 10.0:
                grade.diem_giua_ky = val
            else:
                return jsonify({'error': 'Điểm giữa kỳ không hợp lệ, yêu cầu từ 0 đến 10'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Định dạng điểm giữa kỳ không hợp lệ'}), 400

    if 'diem_cuoi_ky' in data and data['diem_cuoi_ky'] is not None and data['diem_cuoi_ky'] != '':
        try:
            val = float(data['diem_cuoi_ky'])
            if 0.0 <= val <= 10.0:
                grade.diem_cuoi_ky = val
            else:
                return jsonify({'error': 'Điểm thi cuối kỳ không hợp lệ, yêu cầu từ 0 đến 10'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Định dạng điểm thi cuối kỳ không hợp lệ'}), 400

    if 'so_buoi_nghi' in data and data['so_buoi_nghi'] is not None and data['so_buoi_nghi'] != '':
        try:
            val = int(data['so_buoi_nghi'])
            if val >= 0:
                grade.so_buoi_nghi = val
            else:
                return jsonify({'error': 'Số buổi nghỉ không hợp lệ, yêu cầu số nguyên không âm'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Định dạng số buổi nghỉ không hợp lệ'}), 400

    grade.calculate_grade()
    db.session.commit()
    return jsonify({
        'message': 'Cập nhật điểm và số buổi nghỉ thành công!',
        'grade': grade.to_dict()
    }), 200

@portal_bp.route('/api/lecturer/assignments', methods=['POST'])
@login_required
def create_assignment():
    role = session.get('role', 0)
    if role not in (1, 2):
        return jsonify({'error': 'Bạn không có quyền tạo bài tập'}), 403

    lecturer = get_current_lecturer()
    lecturer_id = lecturer.id if lecturer else None

    data = request.get_json(silent=True) or {}
    title = data.get('title', '').strip()
    subject_name = data.get('subject_name', '').strip()
    deadline = data.get('deadline', '').strip()
    description = data.get('description', '').strip()
    class_id = data.get('class_id')

    if not title or not subject_name or not deadline:
        return jsonify({'error': 'Vui lòng nhập đủ tên bài tập, môn học và hạn nộp'}), 400

    bt = BaiTap(
        title=title,
        subject_name=subject_name,
        deadline=deadline,
        description=description,
        class_id=int(class_id) if class_id else None,
        lecturer_id=lecturer_id
    )
    db.session.add(bt)
    db.session.commit()
    return jsonify({
        'message': 'Tạo bài tập mới thành công!',
        'assignment': bt.to_dict()
    }), 201

@portal_bp.route('/api/schedules', methods=['GET'])
@login_required
def get_all_schedules():
    ensure_seed_portal_data()
    class_id = request.args.get('class_id')
    lecturer_id = request.args.get('lecturer_id')
    query = LichHoc.query
    if class_id:
        query = query.filter_by(class_id=int(class_id))
    if lecturer_id:
        query = query.filter_by(lecturer_id=int(lecturer_id))
    schedules = [s.to_dict() for s in query.all()]
    return jsonify(schedules), 200
