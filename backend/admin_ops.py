from flask import Blueprint, jsonify, request, session
from auth import login_required, role_required
from database import db
from models import Student, Lecturer, User, Khoa, BoMon, ChuyenNganh, Lop, NienKhoa, DoAn, ThucTap, HoiDong
from sqlalchemy import text
import os
from datetime import datetime

admin_ops_bp = Blueprint('admin_ops', __name__)

@admin_ops_bp.route('/api/admin/overview', methods=['GET'])
@login_required
@role_required(2)
def get_system_overview():
    try:
        avg_score_val = db.session.query(db.func.avg(Student.score)).scalar() or 0.0
        good_students_cnt = Student.query.filter(Student.score >= 8.0).count()
        stats = {
            'total_students': Student.query.count(),
            'total_lecturers': Lecturer.query.count(),
            'total_users': User.query.count(),
            'total_users_active': User.query.filter_by(status='HoatDong').count(),
            'total_users_locked': User.query.filter_by(status='Khoa').count(),
            'total_khoa': Khoa.query.count(),
            'total_bomon': BoMon.query.count(),
            'total_chuyennganh': ChuyenNganh.query.count(),
            'total_lop': Lop.query.count(),
            'total_nienkhoa': NienKhoa.query.count(),
            'avg_score': round(float(avg_score_val), 1),
            'good_students': good_students_cnt,
            'total_doan': DoAn.query.count(),
            'total_thuctap': ThucTap.query.count(),
            'total_hoidong': HoiDong.query.count()
        }

        db.session.execute(text('SELECT 1'))
        db_status = 'connected'
        sys_status = 'healthy'
    except Exception as e:
        db_status = 'disconnected'
        sys_status = 'unhealthy'
        stats = {}

    return jsonify({
        'stats': stats,
        'system_health': {
            'database': db_status,
            'status': sys_status
        },
        'monitoring_links': {
            'prometheus': 'http://localhost:9092',
            'grafana': 'http://localhost:3002',
            'phpmyadmin': 'http://localhost:8084',
            'health': 'http://localhost:8083/health'
        }
    }), 200

@admin_ops_bp.route('/api/admin/backups', methods=['GET'])
@login_required
@role_required(2)
def list_backups():
    backup_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backups'))
    if not os.path.exists(backup_dir):
        return jsonify([]), 200

    backups = []
    for f in os.listdir(backup_dir):
        if f.endswith('.sql'):
            p = os.path.join(backup_dir, f)
            stat = os.stat(p)
            size_kb = round(stat.st_size / 1024, 2)
            backups.append({
                'filename': f,
                'size_bytes': stat.st_size,
                'size_formatted': f"{size_kb} KB" if size_kb < 1024 else f"{round(size_kb / 1024, 2)} MB",
                'created_at': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
            })

    backups.sort(key=lambda x: x['created_at'], reverse=True)
    return jsonify(backups), 200

@admin_ops_bp.route('/api/admin/backup', methods=['POST'])
@login_required
@role_required(2)
def trigger_backup():
    try:
        backup_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backups'))
        os.makedirs(backup_dir, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"student_db_{timestamp}.sql"
        filepath = os.path.join(backup_dir, filename)

        tables_res = db.session.execute(text("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'")).fetchall()
        tables = [row[0] for row in tables_res]

        dump_lines = [
            f"-- Database Backup for student_db",
            f"-- Backup File: {filename}",
            f"-- Generated At: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "SET FOREIGN_KEY_CHECKS=0;",
            "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';",
            "START TRANSACTION;\n"
        ]

        for tbl in tables:
            dump_lines.append(f"\n-- Structure for table `{tbl}`")
            dump_lines.append(f"DROP TABLE IF EXISTS `{tbl}`;")
            create_res = db.session.execute(text(f"SHOW CREATE TABLE `{tbl}`")).fetchone()
            if create_res:
                dump_lines.append(f"{create_res[1]};\n")

            rows = db.session.execute(text(f"SELECT * FROM `{tbl}`")).mappings().fetchall()
            if rows:
                dump_lines.append(f"-- Dumping data for table `{tbl}`")
                for r in rows:
                    cols = list(r.keys())
                    vals = []
                    for c in cols:
                        v = r[c]
                        if v is None:
                            vals.append("NULL")
                        elif isinstance(v, (int, float)):
                            vals.append(str(v))
                        else:
                            escaped = str(v).replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r")
                            vals.append(f"'{escaped}'")
                    cols_str = ", ".join([f"`{c}`" for c in cols])
                    vals_str = ", ".join(vals)
                    dump_lines.append(f"INSERT INTO `{tbl}` ({cols_str}) VALUES ({vals_str});")

        dump_lines.append("\nCOMMIT;")
        dump_lines.append("SET FOREIGN_KEY_CHECKS=1;\n")

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write("\n".join(dump_lines))

        stat = os.stat(filepath)
        size_kb = round(stat.st_size / 1024, 2)
        return jsonify({
            'message': 'Tạo bản sao lưu thành công',
            'backup': {
                'filename': filename,
                'size_bytes': stat.st_size,
                'size_formatted': f"{size_kb} KB",
                'created_at': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
            }
        }), 201
    except Exception as e:
        return jsonify({'error': f'Lỗi tạo bản sao lưu: {str(e)}'}), 500
