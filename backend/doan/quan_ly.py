import time
from datetime import datetime
from flask import request, jsonify, session
from database import db
from models import DoAn, Student, Lecturer, HoiDong
from auth import login_required, role_required, get_current_student, get_current_lecturer
from . import doan_bp

# API Sinh viên đăng ký đề tài & Giảng viên hướng dẫn (UseCase 3.6)
@doan_bp.route('/projects/register', methods=['POST'])
@login_required
@role_required(0, 2)
def register_project():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data:
        return jsonify({'error': 'Không có dữ liệu gửi lên'}), 400

    name = data.get('name', '').strip()
    lecturer_id = data.get('lecturer_id')

    if not name:
        return jsonify({'error': 'Tên đề tài không được để trống'}), 400
    if not lecturer_id:
        return jsonify({'error': 'Vui lòng chọn giảng viên hướng dẫn'}), 400

    try:
        lecturer_id = int(lecturer_id)
        if not Lecturer.query.get(lecturer_id):
            return jsonify({'error': 'Giảng viên hướng dẫn không tồn tại'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'ID giảng viên không hợp lệ'}), 400

    user_role = session.get('role')
    if user_role == 0:
        student = get_current_student()
        if not student:
            return jsonify({'error': 'Hồ sơ sinh viên chưa được liên kết với tài khoản này'}), 400
        student_id = student.id
    else:
        student_id = data.get('student_id')
        if not student_id or not Student.query.get(int(student_id)):
            return jsonify({'error': 'Vui lòng chỉ định sinh viên hợp lệ'}), 400
        student_id = int(student_id)

    # Kiểm tra xem sinh viên đã có đề tài hay chưa
    existing = DoAn.query.filter_by(student_id=student_id).first()
    if existing:
        if existing.status in ('Chờ duyệt', 'Chấp nhận'):
            return jsonify({'error': 'Bạn đã đăng ký đề tài'}), 400
        else: # Nếu trước đó bị 'Từ chối', cho phép cập nhật lại đề tài mới
            existing.name = name
            existing.lecturer_id = lecturer_id
            existing.status = 'Chờ duyệt'
            existing.progress = 'Chưa bắt đầu'
            existing.description = data.get('description', '').strip() or None
            try:
                db.session.commit()
                return jsonify({'message': 'Đăng ký đề tài thành công', 'project': existing.to_dict()}), 200
            except Exception:
                db.session.rollback()
                return jsonify({'error': 'Lỗi cơ sở dữ liệu khi đăng ký lại'}), 500

    student = Student.query.get(student_id)
    code_suffix = student.student_code if (student and student.student_code) else f"S{student_id}"
    project_code = f"DA_{code_suffix}_{int(time.time())}"

    new_project = DoAn(
        project_code=project_code,
        name=name,
        student_id=student_id,
        lecturer_id=lecturer_id,
        status='Chờ duyệt',
        progress='Chưa bắt đầu',
        description=data.get('description', '').strip() or None
    )

    db.session.add(new_project)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi cơ sở dữ liệu khi đăng ký đề tài'}), 500

    return jsonify({
        'message': 'Đăng ký đề tài thành công',
        'project': new_project.to_dict()
    }), 201

# API Sinh viên hủy đăng ký đồ án (UseCase 3.7)
@doan_bp.route('/projects/<int:id>/cancel', methods=['POST'])
@login_required
@role_required(0, 2)
def cancel_project(id):
    project = DoAn.query.get(id)
    if not project:
        return jsonify({'error': 'Không tìm thấy đồ án'}), 404

    user_role = session.get('role')
    if user_role == 0:
        student = get_current_student()
        if not student or project.student_id != student.id:
            return jsonify({'error': 'Bạn không có quyền hủy đồ án của người khác'}), 403

    # Ràng buộc: Cho phép hủy khi đồ án ở trạng thái 'Chờ duyệt' hoặc 'Từ chối'
    if project.status not in ('Chờ duyệt', 'Từ chối'):
        return jsonify({'error': 'Không thể hủy. Đề tài đã được xét duyệt hoặc đã hoàn thành'}), 400

    db.session.delete(project)
    try:
        db.session.commit()
        return jsonify({'message': 'Hủy đăng ký đồ án thành công'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi khi hủy đồ án'}), 500

# API Giảng viên phê duyệt đồ án (UseCase 3.8)
@doan_bp.route('/projects/<int:id>/approve', methods=['POST'])
@login_required
@role_required(1, 2)
def approve_project(id):
    project = DoAn.query.get(id)
    if not project:
        return jsonify({'error': 'Không tìm thấy đồ án'}), 404

    user_role = session.get('role')
    if user_role == 1:
        lecturer = get_current_lecturer()
        if not lecturer or project.lecturer_id != lecturer.id:
            return jsonify({'error': 'Bạn chỉ có quyền phê duyệt sinh viên đăng ký mình hướng dẫn'}), 403

    project.status = 'Chấp nhận'
    try:
        db.session.commit()
        return jsonify({'message': 'Xác nhận đồng ý hướng dẫn đồ án thành công', 'project': project.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi khi phê duyệt đồ án'}), 500

# API Giảng viên từ chối đồ án (UseCase 3.8)
@doan_bp.route('/projects/<int:id>/reject', methods=['POST'])
@login_required
@role_required(1, 2)
def reject_project(id):
    project = DoAn.query.get(id)
    if not project:
        return jsonify({'error': 'Không tìm thấy đồ án'}), 404

    user_role = session.get('role')
    if user_role == 1:
        lecturer = get_current_lecturer()
        if not lecturer or project.lecturer_id != lecturer.id:
            return jsonify({'error': 'Bạn chỉ có quyền từ chối sinh viên đăng ký mình hướng dẫn'}), 403

    project.status = 'Từ chối'
    try:
        db.session.commit()
        return jsonify({'message': 'Đã từ chối hướng dẫn đồ án', 'project': project.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi khi từ chối đồ án'}), 500

# API Cập nhật tiến độ & thông tin bảo vệ đồ án (UseCase 3.9)
@doan_bp.route('/projects/<int:id>/progress', methods=['PUT'])
@login_required
@role_required(1, 2)
def update_project_progress(id):
    project = DoAn.query.get(id)
    if not project:
        return jsonify({'error': 'Không tìm thấy đồ án'}), 404

    user_role = session.get('role')
    if user_role == 1:
        lecturer = get_current_lecturer()
        is_assigned = lecturer and (
            project.lecturer_id == lecturer.id or
            project.reviewer_id == lecturer.id or
            (project.council and (
                project.council.member1_id == lecturer.id or
                project.council.member2_id == lecturer.id or
                project.council.member3_id == lecturer.id
            ))
        )
        if not is_assigned:
            return jsonify({'error': 'Bạn không được phân công hướng dẫn đồ án này'}), 403

    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data:
        return jsonify({'error': 'Không có dữ liệu cập nhật'}), 400

    valid_progress = ['Chưa bắt đầu', 'Cập nhật lần 1', 'Cập nhật lần 2', 'Cập nhật lần 3', 'Hoàn thành']
    if 'progress' in data and data['progress']:
        prog = data['progress'].strip()
        if prog not in valid_progress:
            return jsonify({'error': f'Trạng thái tiến độ không hợp lệ. Phải là một trong: {", ".join(valid_progress)}'}), 400
        project.progress = prog

    # Cập nhật ngày bắt đầu, ngày kết thúc, ngày bảo vệ
    for field in ['start_date', 'end_date', 'defense_date']:
        if field in data:
            val = data.get(field)
            if val:
                try:
                    parsed_d = datetime.strptime(val.strip(), '%Y-%m-%d').date()
                    setattr(project, field, parsed_d)
                except ValueError:
                    return jsonify({'error': f'Định dạng {field} không hợp lệ, phải là YYYY-MM-DD'}), 400
            else:
                setattr(project, field, None)

    if 'defense_location' in data:
        project.defense_location = data.get('defense_location', '').strip() or None

    if 'description' in data:
        project.description = data.get('description', '').strip() or None

    if 'council_id' in data:
        cid = data.get('council_id')
        if cid:
            try:
                cid = int(cid)
                if not HoiDong.query.get(cid):
                    return jsonify({'error': 'Hội đồng không tồn tại'}), 400
                project.council_id = cid
            except ValueError:
                return jsonify({'error': 'council_id không hợp lệ'}), 400
        else:
            project.council_id = None

    if 'reviewer_id' in data:
        rid = data.get('reviewer_id')
        if rid:
            try:
                rid = int(rid)
                if not Lecturer.query.get(rid):
                    return jsonify({'error': 'Giảng viên phản biện không tồn tại'}), 400
                project.reviewer_id = rid
            except ValueError:
                return jsonify({'error': 'reviewer_id không hợp lệ'}), 400
        else:
            project.reviewer_id = None

    try:
        db.session.commit()
        return jsonify({'message': 'Cập nhật thông tin đồ án thành công', 'project': project.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi cơ sở dữ liệu khi cập nhật đồ án'}), 500

# API Sinh viên gửi báo cáo tiến độ
@doan_bp.route('/projects/<int:id>/report', methods=['POST'])
@login_required
@role_required(0, 2)
def submit_report(id):
    project = DoAn.query.get(id)
    if not project:
        return jsonify({'error': 'Không tìm thấy đồ án'}), 404

    user_role = session.get('role')
    if user_role == 0:
        student = get_current_student()
        if not student or project.student_id != student.id:
            return jsonify({'error': 'Bạn chỉ có thể gửi báo cáo cho đồ án của chính mình'}), 403

    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    report_text = data.get('report_content', '').strip() or data.get('report', '').strip() or data.get('description', '').strip()
    if not report_text:
        return jsonify({'error': 'Nội dung báo cáo không được để trống'}), 400

    timestamp = datetime.now().strftime('%d/%m/%Y %H:%M')
    prefix = f"[{timestamp}] "
    if project.description:
        project.description += f"\n{prefix}{report_text}"
    else:
        project.description = f"{prefix}{report_text}"

    try:
        db.session.commit()
        return jsonify({'message': 'Gửi báo cáo tiến độ thành công', 'project': project.to_dict()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi khi lưu báo cáo tiến độ'}), 500

# API Admin / Giảng viên thêm đồ án
@doan_bp.route('/projects', methods=['POST'])
@login_required
@role_required(1, 2)
def add_project_admin():
    data = request.get_json(force=True, silent=True) or request.form.to_dict()
    if not data:
        return jsonify({'error': 'Không có dữ liệu gửi lên'}), 400

    name = data.get('name', '').strip()
    student_id = data.get('student_id')
    lecturer_id = data.get('lecturer_id')

    user_role = session.get('role')
    if user_role == 1 and not lecturer_id:
        lecturer = get_current_lecturer()
        if lecturer:
            lecturer_id = lecturer.id

    if not name or not student_id or not lecturer_id:
        return jsonify({'error': 'Tên đề tài, mã sinh viên và giảng viên hướng dẫn là bắt buộc'}), 400

    try:
        student_id = int(student_id)
        lecturer_id = int(lecturer_id)
    except (ValueError, TypeError):
        return jsonify({'error': 'ID sinh viên hoặc giảng viên không hợp lệ'}), 400

    if not Student.query.get(student_id):
        return jsonify({'error': 'Sinh viên không tồn tại'}), 400
    if not Lecturer.query.get(lecturer_id):
        return jsonify({'error': 'Giảng viên hướng dẫn không tồn tại'}), 400

    if DoAn.query.filter_by(student_id=student_id).first():
        return jsonify({'error': 'Sinh viên này đã có đồ án'}), 400

    project_code = data.get('project_code', '').strip()
    if not project_code:
        project_code = f"DA_{student_id}_{int(time.time())}"
    elif DoAn.query.filter_by(project_code=project_code).first():
        return jsonify({'error': 'Mã đồ án đã tồn tại'}), 400

    new_project = DoAn(
        project_code=project_code,
        name=name,
        student_id=student_id,
        lecturer_id=lecturer_id,
        status=data.get('status', 'Chấp nhận'),
        progress=data.get('progress', 'Chưa bắt đầu'),
        description=data.get('description', '').strip() or None
    )

    db.session.add(new_project)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi cơ sở dữ liệu'}), 500

    return jsonify({'message': 'Thêm đồ án thành công', 'project': new_project.to_dict()}), 201

# API Admin xóa đồ án
@doan_bp.route('/projects/<int:id>', methods=['DELETE'])
@login_required
@role_required(2)
def delete_project_admin(id):
    project = DoAn.query.get(id)
    if not project:
        return jsonify({'error': 'Không tìm thấy đồ án'}), 404

    # Xóa điểm số liên quan nếu có trước khi xóa đồ án
    from models import DiemDoAn
    grade = DiemDoAn.query.filter_by(project_id=id).first()
    if grade:
        db.session.delete(grade)

    db.session.delete(project)
    try:
        db.session.commit()
        return jsonify({'message': 'Xóa đồ án thành công'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Lỗi khi xóa đồ án'}), 500
