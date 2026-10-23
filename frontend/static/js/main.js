const avatarGradients = [
    'linear-gradient(135deg, #0284c7, #4f46e5)',
    'linear-gradient(135deg, #2563eb, #06b6d4)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #14b8a6, #0284c7)'
];

function getAvatarGradient(name) {
    let hash = 0;
    if (!name) return avatarGradients[0];
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return avatarGradients[hash % avatarGradients.length];
}

function getInitials(name) {
    if (!name) return 'SV';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'SV';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAcademicRank(score) {
    if (score >= 9.0) return { label: 'Xuất sắc', css: 'score-excellent', icon: 'fa-crown', code: 'EXCELLENT' };
    if (score >= 8.0) return { label: 'Giỏi', css: 'score-good', icon: 'fa-award', code: 'GOOD' };
    if (score >= 6.5) return { label: 'Khá', css: 'score-good', icon: 'fa-thumbs-up', code: 'FAIR' };
    if (score >= 5.0) return { label: 'Trung bình', css: 'score-average', icon: 'fa-check', code: 'AVERAGE' };
    return { label: 'Yếu', css: 'score-poor', icon: 'fa-triangle-exclamation', code: 'POOR' };
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'success' ? 'check_circle' : (type === 'error' ? 'cancel' : 'info');
    const color = type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#0284c7');

    toast.innerHTML = `
        <span class="material-symbols-outlined text-[20px]" style="color: ${color};">${icon}</span>
        <div style="font-size: 13px; font-weight: 600; color: #1e293b;">${message}</div>
    `;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

async function checkHealth() {
    try {
        const res = await fetch('/health');
        const badge = document.getElementById('systemHealthBadge');
        const text = document.getElementById('systemHealthText');
        if (!badge || !text) return;
        if (res.ok) {
            badge.style.background = '#ecfdf5';
            badge.style.color = '#047857';
            badge.style.borderColor = '#a7f3d0';
            text.textContent = 'Hệ thống Trực tuyến';
        } else {
            badge.style.background = '#fef2f2';
            badge.style.color = '#b91c1c';
            badge.style.borderColor = '#fecaca';
            text.textContent = 'Mất kết nối CSDL';
        }
    } catch (err) {
        const badge = document.getElementById('systemHealthBadge');
        const text = document.getElementById('systemHealthText');
        if (!badge || !text) return;
        badge.style.background = '#fef2f2';
        badge.style.color = '#b91c1c';
        badge.style.borderColor = '#fecaca';
        text.textContent = 'Mất kết nối Backend';
    }
}

let currentUser = null;

async function loadCurrentUser() {
    try {
        const res = await fetch('/users/me');
        if (res.ok) {
            currentUser = await res.json();
            renderUserHeader(currentUser);
        } else if (res.status === 401 && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
    } catch (e) {
    }
}

function renderUserHeader(user) {
    if (!user) return;
    const roleLabels = { 0: 'Sinh viên', 1: 'Giảng viên', 2: 'Quản trị viên' };
    const roleLabel = roleLabels[user.role] || 'Người dùng';

    const userContainer = document.getElementById('headerUserBadge');
    if (userContainer) {
        userContainer.innerHTML = `
            <div class="flex items-center gap-2 bg-ictu-50/80 px-3 py-1 rounded-full border border-ictu-200/60 shadow-xs">
                <span class="material-symbols-outlined text-[18px] text-ictu-600">account_circle</span>
                <span class="text-xs font-bold text-slate-800">${user.username}</span>
                <span class="text-[10px] font-bold bg-ictu-600 text-white px-2 py-0.5 rounded-full">${roleLabel}</span>
            </div>
        `;
    }

    const sideName = document.getElementById('adminSidebarName');
    if (sideName) sideName.textContent = user.full_name || user.username;

    const sideEmail = document.getElementById('adminSidebarEmail');
    if (sideEmail) sideEmail.textContent = user.email || (user.username + '@qlsv.edu.vn');

    const sideRole = document.getElementById('adminSidebarRole');
    if (sideRole) sideRole.textContent = roleLabel;

    const sideAvatar = document.getElementById('adminAvatarInitials');
    if (sideAvatar) sideAvatar.textContent = getInitials(user.full_name || user.username);

    renderDynamicSidebar(user);

    const studentPortalView = document.getElementById('studentPortalView');
    if (studentPortalView) studentPortalView.style.display = (user.role === 0) ? '' : 'none';

    const lecturerPortalView = document.getElementById('lecturerPortalView');
    if (lecturerPortalView) lecturerPortalView.style.display = (user.role === 1) ? '' : 'none';

    const adminStudentManagementView = document.getElementById('adminStudentManagementView');
    if (adminStudentManagementView) {
        adminStudentManagementView.style.display = (user.role === 2) ? '' : 'none';
        if (user.role === 2) {
            loadAdminOverview();
            loadAdminBackups();
        }
    }
}

function renderDynamicSidebar(user) {
    if (!user) return;
    const navContainer = document.querySelector('aside .overflow-y-auto') || document.getElementById('sidebarNavContainer');
    if (!navContainer) return;

    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const activeTab = urlParams.get('tab') || '';

    function makeLink(href, icon, label, isActive, onClickJs = null, extraBadge = '') {
        const activeCls = isActive
            ? 'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-ictu-50 text-ictu-700 shadow-xs border border-ictu-100 transition-colors'
            : 'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-ictu-700 hover:bg-slate-50 transition-colors';
        const iconCls = isActive ? 'material-symbols-outlined text-[19px] text-ictu-600' : 'material-symbols-outlined text-[19px] text-slate-400';
        const clickAttr = onClickJs ? `onclick="${onClickJs}"` : '';

        return `
            <a href="${href}" class="${activeCls}" ${clickAttr}>
                <div class="flex items-center gap-3 min-w-0">
                    <span class="${iconCls}">${icon}</span>
                    <span class="truncate">${label}</span>
                </div>
                ${extraBadge ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-ictu-100/70 text-ictu-700">${extraBadge}</span>` : ''}
            </a>
        `;
    }

    function makeGroupTitle(title) {
        return `<p class="px-3 pt-3 pb-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">${title}</p>`;
    }

    let html = '';

    if (user.role === 0) { // Sinh viên
        const isHome = currentPath === '/' || currentPath === '/index.html';
        html += makeGroupTitle('Cổng Học Tập Sinh Viên');
        html += makeLink(
            isHome ? "javascript:void(0)" : "/?tab=schedule",
            'calendar_month', 'Lịch học & TKB',
            isHome && (!activeTab || activeTab === 'schedule'),
            isHome ? "window.switchStudentTab && window.switchStudentTab('schedule'); return false;" : null
        );
        html += makeLink(
            isHome ? "javascript:void(0)" : "/?tab=grades",
            'military_tech', 'Bảng điểm môn học',
            isHome && activeTab === 'grades',
            isHome ? "window.switchStudentTab && window.switchStudentTab('grades'); return false;" : null
        );
        html += makeLink(
            isHome ? "javascript:void(0)" : "/?tab=attendance",
            'event_available', 'Chuyên cần & Buổi nghỉ',
            isHome && activeTab === 'attendance',
            isHome ? "window.switchStudentTab && window.switchStudentTab('attendance'); return false;" : null
        );
        html += makeLink(
            isHome ? "javascript:void(0)" : "/?tab=assignments",
            'assignment', 'Bài tập & Nộp bài',
            isHome && activeTab === 'assignments',
            isHome ? "window.switchStudentTab && window.switchStudentTab('assignments'); return false;" : null
        );
        html += makeLink(
            isHome ? "javascript:void(0)" : "/?tab=classmates",
            'groups', 'Lớp học của tôi',
            isHome && activeTab === 'classmates',
            isHome ? "window.switchStudentTab && window.switchStudentTab('classmates'); return false;" : null
        );

        html += makeGroupTitle('Tốt Nghiệp & Thực Tập');
        html += makeLink('/doan', 'menu_book', 'Đồ án tốt nghiệp', currentPath.includes('/doan'));
        html += makeLink('/thuctap', 'business_center', 'Thực tập doanh nghiệp', currentPath.includes('/thuctap'));
        html += makeLink('/hoidong', 'diversity_3', 'Hội đồng bảo vệ', currentPath.includes('/hoidong'));
        html += makeLink('/diem', 'grade', 'Điểm đồ án tốt nghiệp', currentPath.includes('/diem'));

    } else if (user.role === 1) { // Giảng viên
        const isHome = currentPath === '/' || currentPath === '/index.html';
        html += makeGroupTitle('Cổng Giảng Dạy & Lớp Học');
        html += makeLink(
            isHome ? "javascript:void(0)" : "/",
            'dashboard', 'Tổng quan giảng viên',
            isHome && (!activeTab || activeTab === 'overview'),
            isHome ? "window.switchLecturerTab && window.switchLecturerTab('overview'); return false;" : null
        );
        html += makeLink(
            isHome ? "javascript:void(0)" : "/?tab=schedule",
            'calendar_month', 'Lịch giảng dạy & TKB',
            isHome && activeTab === 'schedule',
            isHome ? "window.switchLecturerTab && window.switchLecturerTab('schedule'); return false;" : null
        );
        html += makeLink(
            isHome ? "javascript:void(0)" : "/?tab=students",
            'groups', 'Lớp học & Sinh viên',
            isHome && activeTab === 'students',
            isHome ? "window.switchLecturerTab && window.switchLecturerTab('students'); return false;" : null
        );
        html += makeLink(
            isHome ? "javascript:void(0)" : "/?tab=grades",
            'military_tech', 'Điểm số & Chuyên cần',
            isHome && activeTab === 'grades',
            isHome ? "window.switchLecturerTab && window.switchLecturerTab('grades'); return false;" : null
        );
        html += makeLink(
            isHome ? "javascript:void(0)" : "/?tab=assignments",
            'assignment', 'Bài tập & Bài nộp',
            isHome && activeTab === 'assignments',
            isHome ? "window.switchLecturerTab && window.switchLecturerTab('assignments'); return false;" : null
        );
        html += makeLink(
            isHome ? "javascript:void(0)" : "/?tab=docs",
            'description', 'Tài liệu học tập',
            isHome && activeTab === 'docs',
            isHome ? "window.switchLecturerTab && window.switchLecturerTab('docs'); return false;" : null
        );

        html += makeGroupTitle('Đào Tạo & Tốt Nghiệp');
        html += makeLink('/doan', 'menu_book', 'Hướng dẫn Đồ án', currentPath.includes('/doan'));
        html += makeLink('/thuctap', 'business_center', 'Theo dõi Thực tập', currentPath.includes('/thuctap'));
        html += makeLink('/hoidong', 'diversity_3', 'Hội đồng chấm thi', currentPath.includes('/hoidong'));
        html += makeLink('/diem', 'grade', 'Nhập điểm đồ án', currentPath.includes('/diem'));
        html += makeLink('/giangvien', 'co_present', 'Danh bạ Giảng viên', currentPath.includes('/giangvien'));

    } else { // Quản trị viên (Role 2)
        html += makeGroupTitle('Hệ Thống Quản Lý');
        html += makeLink('/', 'group', 'Quản lý sinh viên', currentPath === '/' || currentPath === '/index.html');
        html += makeLink('/giangvien', 'co_present', 'Quản lý giảng viên', currentPath.includes('/giangvien'));
        html += makeLink('/doan', 'assignment', 'Đồ án tốt nghiệp', currentPath.includes('/doan'));
        html += makeLink('/thuctap', 'work', 'Thực tập doanh nghiệp', currentPath.includes('/thuctap'));
        html += makeLink('/hoidong', 'groups', 'Hội đồng chấm thi', currentPath.includes('/hoidong'));
        html += makeLink('/diem', 'military_tech', 'Điểm số & Học lực', currentPath.includes('/diem'));

        html += makeGroupTitle('Danh Mục Đào Tạo');
        html += makeLink('/khoa_bomon', 'apartment', 'Khoa & Bộ môn', currentPath.includes('/khoa_bomon'));
        html += makeLink('/chuyennganh', 'account_tree', 'Chuyên ngành', currentPath.includes('/chuyennganh'));
        html += makeLink('/nienkhoa', 'calendar_today', 'Niên khóa', currentPath.includes('/nienkhoa'));
        html += makeLink('/lop', 'class', 'Lớp học', currentPath.includes('/lop'));

        html += makeGroupTitle('Quản Trị & Hạ Tầng');
        html += makeLink('/taikhoan', 'manage_accounts', 'Quản lý tài khoản', currentPath.includes('/taikhoan'));
        html += `
            <a href="http://localhost:3002" target="_blank" class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-amber-700 hover:bg-amber-50/70 transition-colors">
                <span class="material-symbols-outlined text-[19px] text-amber-500">monitoring</span>
                <span>Grafana Dashboard</span>
            </a>
            <a href="http://localhost:9092" target="_blank" class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50/70 transition-colors">
                <span class="material-symbols-outlined text-[19px] text-rose-500">query_stats</span>
                <span>Prometheus Metrics</span>
            </a>
            <a href="http://localhost:8084" target="_blank" class="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-cyan-700 hover:bg-cyan-50/70 transition-colors">
                <span class="material-symbols-outlined text-[19px] text-cyan-500">database</span>
                <span>phpMyAdmin</span>
            </a>
        `;
    }

    navContainer.innerHTML = html;
}

async function handleLogout() {
    try {
        const res = await fetch('/logout', { method: 'POST' });
        showToast('Đã đăng xuất thành công', 'success');
        setTimeout(() => {
            window.location.href = '/login';
        }, 500);
    } catch (e) {
        window.location.href = '/login';
    }
}

async function submitChangePassword(oldPwd, newPwd, confirmPwd) {
    if (!oldPwd || !newPwd || !confirmPwd) {
        showToast('Vui lòng điền đủ 3 trường mật khẩu', 'error');
        return false;
    }
    if (newPwd.length < 6 || newPwd.length > 29) {
        showToast('Độ dài mật khẩu mới phải từ 6 đến 29 ký tự', 'error');
        return false;
    }
    if (newPwd === oldPwd) {
        showToast('Mật khẩu mới không được trùng mật khẩu cũ', 'error');
        return false;
    }
    if (newPwd !== confirmPwd) {
        showToast('Xác nhận mật khẩu mới không khớp', 'error');
        return false;
    }

    try {
        const res = await fetch('/change_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                old_password: oldPwd,
                new_password: newPwd,
                confirm_password: confirmPwd
            })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message || 'Đổi mật khẩu thành công!', 'success');
            return true;
        } else {
            showToast(data.error || 'Đổi mật khẩu thất bại', 'error');
            return false;
        }
    } catch (e) {
        showToast('Lỗi mạng khi đổi mật khẩu', 'error');
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    loadCurrentUser();

    const logoutBtns = document.querySelectorAll('.btn-logout, #logoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    });

    const openChangePwdBtn = document.getElementById('openChangePwdBtn');
    const changePwdModal = document.getElementById('changePwdModal');
    const closeChangePwdBtn = document.getElementById('closeChangePwdBtn');
    const cancelChangePwdBtn = document.getElementById('cancelChangePwdBtn');
    const changePwdForm = document.getElementById('changePwdForm');

    if (openChangePwdBtn && changePwdModal) {
        openChangePwdBtn.addEventListener('click', () => {
            changePwdModal.classList.remove('hidden');
            changePwdModal.classList.add('flex');
            changePwdModal.classList.add('active');
            if (changePwdForm) changePwdForm.reset();
        });
    }
    if (closeChangePwdBtn && changePwdModal) {
        closeChangePwdBtn.addEventListener('click', () => {
            changePwdModal.classList.add('hidden');
            changePwdModal.classList.remove('flex');
            changePwdModal.classList.remove('active');
        });
    }
    if (cancelChangePwdBtn && changePwdModal) {
        cancelChangePwdBtn.addEventListener('click', () => {
            changePwdModal.classList.add('hidden');
            changePwdModal.classList.remove('flex');
            changePwdModal.classList.remove('active');
        });
    }
    if (changePwdForm && changePwdModal) {
        changePwdForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldP = document.getElementById('oldPasswordInput').value;
            const newP = document.getElementById('newPasswordInput').value;
            const confP = document.getElementById('confirmPasswordInput').value;
            const success = await submitChangePassword(oldP, newP, confP);
            if (success) {
                changePwdModal.classList.add('hidden');
                changePwdModal.classList.remove('flex');
                changePwdModal.classList.remove('active');
                changePwdForm.reset();
            }
        });
    }
});

async function loadAdminOverview() {
    try {
        const res = await fetch('/api/admin/overview');
        if (!res.ok) return;
        const data = await res.json();
        const s = data.stats || {};

        const elStudents = document.getElementById('adminKpiStudents');
        if (elStudents) elStudents.textContent = s.total_students || 0;
        const elLecturers = document.getElementById('adminKpiLecturers');
        if (elLecturers) elLecturers.textContent = s.total_lecturers || 0;
        const elUsers = document.getElementById('adminKpiUsers');
        if (elUsers) elUsers.textContent = s.total_users || 0;
        const elUsersActive = document.getElementById('adminKpiUsersActive');
        if (elUsersActive) elUsersActive.textContent = s.total_users_active || 0;

        const elKhoa = document.getElementById('adminKpiKhoa');
        if (elKhoa) elKhoa.textContent = s.total_khoa || 0;
        const elBoMon = document.getElementById('adminKpiBoMon');
        if (elBoMon) elBoMon.textContent = s.total_bomon || 0;
        const elChuyenNganh = document.getElementById('adminKpiChuyenNganh');
        if (elChuyenNganh) elChuyenNganh.textContent = s.total_chuyennganh || 0;
        const elLop = document.getElementById('adminKpiLop');
        if (elLop) elLop.textContent = s.total_lop || 0;
        const elTheses = document.getElementById('adminKpiTheses');
        if (elTheses) elTheses.textContent = s.total_doan || 0;
        const elInternships = document.getElementById('adminKpiInternships');
        if (elInternships) elInternships.textContent = s.total_thuctap || 0;
        const elCouncils = document.getElementById('adminKpiCouncils');
        if (elCouncils) elCouncils.textContent = s.total_hoidong || 0;
        const elAvgScore = document.getElementById('adminKpiAvgScore');
        if (elAvgScore) elAvgScore.textContent = (s.avg_score !== undefined ? s.avg_score : '8.3');
        const elGoodStudents = document.getElementById('adminKpiGoodStudents');
        if (elGoodStudents) elGoodStudents.textContent = (s.good_students !== undefined ? s.good_students : '4');

        const dbStatusBadge = document.getElementById('adminDbStatusBadge');
        if (dbStatusBadge) {
            if (data.system_health && data.system_health.database === 'connected') {
                dbStatusBadge.textContent = 'CSDL Trực Tuyến';
                dbStatusBadge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30';
            } else {
                dbStatusBadge.textContent = 'Mất kết nối CSDL';
                dbStatusBadge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30';
            }
        }
    } catch (e) {
    }
}

async function loadAdminBackups() {
    const tbody = document.getElementById('adminBackupsTableBody');
    if (!tbody) return;
    try {
        const res = await fetch('/api/admin/backups');
        if (!res.ok) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-rose-500">Lỗi khi tải danh sách sao lưu</td></tr>';
            return;
        }
        const backups = await res.json();
        const lastLabel = document.getElementById('adminLastBackupLabel');
        if (lastLabel) {
            if (backups.length > 0) {
                lastLabel.textContent = `${backups[0].filename} (${backups[0].created_at})`;
            } else {
                lastLabel.textContent = 'Chưa có bản sao lưu nào';
            }
        }

        if (backups.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-6 text-center text-slate-400">Chưa có bản sao lưu nào trong thư mục backups. Hãy bấm nút "Tạo bản sao lưu mới" phía trên.</td></tr>';
            return;
        }

        tbody.innerHTML = backups.map(b => `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-4 py-3 font-mono font-bold text-slate-900 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px] text-emerald-600">description</span>
                    <span>${b.filename}</span>
                </td>
                <td class="px-4 py-3 font-semibold text-slate-600">${b.size_formatted}</td>
                <td class="px-4 py-3 text-slate-500 font-mono text-[11px]">${b.created_at}</td>
                <td class="px-4 py-3 text-right">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Khả dụng</span>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center text-rose-500">Lỗi kết nối máy chủ</td></tr>';
    }
}

window.loadAdminBackups = loadAdminBackups;
window.loadAdminOverview = loadAdminOverview;

window.triggerAdminBackup = async function() {
    const btn = document.getElementById('btnAdminTriggerBackup');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span><span>Đang sao lưu...</span>';
    }
    try {
        const res = await fetch('/api/admin/backup', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message || 'Tạo bản sao lưu CSDL thành công!', 'success');
            await loadAdminBackups();
            await loadAdminOverview();
        } else {
            showToast(data.error || 'Sao lưu thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi mạng khi kích hoạt sao lưu', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }
};
