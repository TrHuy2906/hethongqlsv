let allProjects = [];
let lecturersList = [];
let councilsList = [];
let myProject = null;

document.addEventListener('DOMContentLoaded', async () => {

    await loadCurrentUser();
    await loadMetadata();
    initRoleViews();
    loadAllProjects();
    setupEventListeners();
});

async function loadMetadata() {
    try {
        const [lecRes, couRes] = await Promise.all([
            fetch('/lecturers'),
            fetch('/councils')
        ]);
        if (lecRes.ok) lecturersList = await lecRes.json();
        if (couRes.ok) councilsList = await couRes.json();

        populateLecturerSelects();
        populateCouncilSelects();
    } catch (e) {
        console.warn('Error loading metadata:', e);
    }
}

function populateLecturerSelects() {
    const regLecSelect = document.getElementById('projectLecturerSelect');
    const revSelect = document.getElementById('reviewerSelect');

    if (regLecSelect) {
        regLecSelect.innerHTML = '<option value="">-- Chọn giảng viên hướng dẫn --</option>';
        lecturersList.forEach(l => {
            regLecSelect.innerHTML += `<option value="${l.id}">${l.name} (${l.lecturer_code || 'GV'}${l.specialization ? ' - ' + l.specialization : ''})</option>`;
        });
    }

    if (revSelect) {
        revSelect.innerHTML = '<option value="">-- Chọn GV phản biện --</option>';
        lecturersList.forEach(l => {
            revSelect.innerHTML += `<option value="${l.id}">${l.name} (${l.lecturer_code || 'GV'})</option>`;
        });
    }
}

function populateCouncilSelects() {
    const couSelect = document.getElementById('councilSelect');
    if (couSelect) {
        couSelect.innerHTML = '<option value="">-- Chưa gán hội đồng --</option>';
        councilsList.forEach(c => {
            couSelect.innerHTML += `<option value="${c.id}">${c.council_code} - ${c.name} (${c.faculty_name || ''})</option>`;
        });
    }
}

function initRoleViews() {
    if (!currentUser) return;
    const studentSec = document.getElementById('studentSection');
    const lecturerSec = document.getElementById('lecturerSection');

    if (currentUser.role === 0) {
        studentSec.style.display = 'block';
        loadMyProject();
    } else if (currentUser.role === 1) {
        lecturerSec.style.display = 'block';
        loadLecturerRequests();
        loadLecturerStudents();
    } else if (currentUser.role === 2) {
        studentSec.style.display = 'none';
        lecturerSec.style.display = 'block';
        loadLecturerRequests();
        loadLecturerStudents();
    }
}


async function loadMyProject() {
    const content = document.getElementById('myProjectContent');
    const actionBtns = document.getElementById('studentActionBtns');
    try {
        const res = await fetch('/projects/my');
        const data = await res.json();

        if (!res.ok) {
            if (data.error && data.error.includes('liên kết')) {
                content.innerHTML = `
                    <div style="text-align: center; padding: 24px;">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 36px; color: var(--warning); margin-bottom: 12px;"></i>
                        <h3 style="font-size: 16px; margin-bottom: 8px; color: var(--text-main);">Tài khoản chưa liên kết hồ sơ sinh viên</h3>
                        <p style="color: var(--text-muted); max-width: 500px; margin: 0 auto; font-size: 14px; line-height: 1.6;">
                            ${data.error}.<br>
                            Tài khoản đăng nhập của bạn (ID: <strong>#${currentUser ? currentUser.id : ''}</strong>) chưa được gán vào hồ sơ sinh viên nào trong hệ thống.<br>
                            Vui lòng nhờ Quản trị viên (Admin) vào trang <strong>Sinh viên</strong> để nhập mã User ID này vào hồ sơ sinh viên của bạn.
                        </p>
                    </div>
                `;
                actionBtns.innerHTML = '';
                return;
            }
        }

        myProject = data.project;

        if (!myProject) {
            content.innerHTML = `
                <div style="text-align: center; padding: 24px;">
                    <i class="fa-solid fa-folder-open" style="font-size: 36px; color: var(--text-muted); margin-bottom: 12px;"></i>
                    <p style="color: var(--text-muted); margin-bottom: 16px;">Bạn chưa đăng ký đề tài đồ án tốt nghiệp nào.</p>
                    <button class="btn-primary" id="openRegModalBtn"><i class="fa-solid fa-plus"></i> Đăng Ký Đề Tài Ngay</button>
                </div>
            `;
            actionBtns.innerHTML = '';
            document.getElementById('openRegModalBtn')?.addEventListener('click', openRegisterModal);
            return;
        }

        const statusBadge = getStatusBadge(myProject.status);
        const progressBadge = getProgressBadge(myProject.progress);

        content.innerHTML = `
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
                <div>
                    <h3 style="font-size: 16px; margin-bottom: 8px; color: var(--primary);">${myProject.name}</h3>
                    <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;"><strong>Mã đề tài:</strong> <code>${myProject.project_code}</code></p>
                    <div style="font-size: 14px; line-height: 1.8;">
                        <div><i class="fa-solid fa-chalkboard-user" style="width: 20px; color: var(--primary);"></i> <strong>GV Hướng Dẫn:</strong> ${myProject.lecturer_name || 'Chưa phân công'}</div>
                        <div><i class="fa-solid fa-user-tie" style="width: 20px; color: var(--primary);"></i> <strong>GV Phản Biện:</strong> ${myProject.reviewer_name || 'Chưa phân công'}</div>
                        <div><i class="fa-solid fa-people-group" style="width: 20px; color: var(--primary);"></i> <strong>Hội Đồng:</strong> ${myProject.council_name || 'Chưa gán'}</div>
                        <div><i class="fa-solid fa-calendar-check" style="width: 20px; color: var(--primary);"></i> <strong>Lịch Bảo Vệ:</strong> ${myProject.defense_date ? (myProject.defense_date + ' tại ' + (myProject.defense_location || 'Đang cập nhật')) : 'Chưa có lịch'}</div>
                    </div>
                    ${myProject.description ? `<div style="margin-top: 14px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; font-size: 13px;"><strong>Ghi chú / Báo cáo:</strong><br><pre style="white-space: pre-wrap; font-family: inherit;">${myProject.description}</pre></div>` : ''}
                </div>
                <div style="border-left: 1px solid var(--border-color); padding-left: 20px; display: flex; flex-direction: column; gap: 12px;">
                    <div><strong>Trạng thái duyệt:</strong><br>${statusBadge}</div>
                    <div><strong>Tiến độ hoàn thành:</strong><br>${progressBadge}</div>
                </div>
            </div>
        `;


        let btns = '';
        if (myProject.status === 'Chờ duyệt') {
            btns += `<button class="btn-secondary" id="cancelProjectBtn" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.4);"><i class="fa-solid fa-ban"></i> Hủy Đăng Ký</button>`;
        } else if (myProject.status === 'Chấp nhận') {
            btns += `<button class="btn-primary" id="openReportModalBtn"><i class="fa-solid fa-pen-to-square"></i> Nộp Báo Cáo Tiến Độ</button>`;
        } else if (myProject.status === 'Từ chối') {
            btns += `<button class="btn-primary" id="reRegisterProjectBtn"><i class="fa-solid fa-rotate-right"></i> Đăng Ký Đề Tài Mới</button>`;
        }
        actionBtns.innerHTML = btns;

        document.getElementById('cancelProjectBtn')?.addEventListener('click', () => handleCancelProject(myProject.id));
        document.getElementById('openReportModalBtn')?.addEventListener('click', () => openReportModal(myProject.id));
        document.getElementById('reRegisterProjectBtn')?.addEventListener('click', openRegisterModal);

    } catch (e) {
        content.innerHTML = `<p style="color: var(--danger);">Lỗi tải thông tin đồ án</p>`;
    }
}

async function handleCancelProject(id) {
    if (!confirm('Bạn có chắc chắn muốn hủy đăng ký đề tài này không?')) return;
    try {
        const res = await fetch(`/projects/${id}/cancel`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message || 'Đã hủy đăng ký đồ án thành công!', 'success');
            loadMyProject();
            loadAllProjects();
        } else {
            showToast(data.error || 'Hủy đồ án thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi mạng khi hủy đồ án', 'error');
    }
}

async function openRegisterModal(forAdminOrLecturer = false) {
    const modal = document.getElementById('registerModal');
    if (!modal) return;
    document.getElementById('registerForm')?.reset();

    const titleEl = document.getElementById('registerModalTitle');
    const studentGroup = document.getElementById('projectStudentGroup');
    const studentSel = document.getElementById('projectStudentSelect');
    const lecturerSel = document.getElementById('projectLecturerSelect');

    const isAdminOrLecturer = forAdminOrLecturer || (currentUser && currentUser.role !== 0);

    if (isAdminOrLecturer) {
        if (titleEl) titleEl.textContent = 'Thêm Đồ Án Mới';
        if (studentGroup) studentGroup.style.display = 'block';
        if (studentSel) {
            studentSel.required = true;
            try {
                const res = await fetch('/students');
                if (res.ok) {
                    const students = await res.json();
                    studentSel.innerHTML = '<option value="">-- Chọn sinh viên --</option>' +
                        students.map(s => `<option value="${s.id}">${s.name} (${s.student_code || 'MSV' + s.id})</option>`).join('');
                }
            } catch (e) {}
        }
        if (currentUser && currentUser.role === 1 && currentUser.lecturer_id && lecturerSel) {
            lecturerSel.value = currentUser.lecturer_id;
        }
    } else {
        if (titleEl) titleEl.textContent = 'Đăng Ký Đồ Án Tốt Nghiệp';
        if (studentGroup) studentGroup.style.display = 'none';
        if (studentSel) studentSel.required = false;
    }

    modal.classList.add('active');
}

function openReportModal(projectId) {
    const modal = document.getElementById('reportModal');
    if (modal) {
        document.getElementById('reportProjectId').value = projectId;
        modal.classList.add('active');
        document.getElementById('reportForm')?.reset();
    }
}


async function loadLecturerRequests() {
    const tbody = document.getElementById('requestsTableBody');
    const badge = document.getElementById('requestCount');
    try {
        const res = await fetch('/projects/requests');
        if (!res.ok) return;
        const requests = await res.json();
        if (badge) badge.textContent = requests.length;

        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">Hiện không có yêu cầu hướng dẫn nào chờ duyệt.</td></tr>';
            return;
        }

        tbody.innerHTML = requests.map(r => `
            <tr>
                <td><code>${r.project_code}</code></td>
                <td><strong>${r.name}</strong></td>
                <td>${r.student_name || 'N/A'}<br><small style="color: var(--text-muted);">${r.student_code || ''}</small></td>
                <td>${r.student_class || 'N/A'}</td>
                <td>${r.start_date || 'Mới gửi'}</td>
                <td>
                    <button class="btn-primary" style="padding: 4px 10px; font-size: 12px; margin-right: 6px;" onclick="approveRequest(${r.id})"><i class="fa-solid fa-check"></i> Phê Duyệt</button>
                    <button class="btn-secondary" style="padding: 4px 10px; font-size: 12px; color: var(--danger);" onclick="rejectRequest(${r.id})"><i class="fa-solid fa-xmark"></i> Từ Chối</button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" style="color: var(--danger); text-align: center;">Lỗi tải danh sách yêu cầu</td></tr>';
    }
}

window.approveRequest = async function(id) {
    if (!confirm('Xác nhận đồng ý hướng dẫn sinh viên thực hiện đề tài này?')) return;
    try {
        const res = await fetch(`/projects/${id}/approve`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            showToast('Đã phê duyệt đề tài thành công!', 'success');
            loadLecturerRequests();
            loadLecturerStudents();
            loadAllProjects();
        } else {
            showToast(data.error || 'Phê duyệt thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi mạng', 'error');
    }
};

window.rejectRequest = async function(id) {
    if (!confirm('Bạn có chắc chắn muốn từ chối đề tài này không?')) return;
    try {
        const res = await fetch(`/projects/${id}/reject`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            showToast('Đã từ chối đề tài', 'info');
            loadLecturerRequests();
            loadAllProjects();
        } else {
            showToast(data.error || 'Từ chối thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi mạng', 'error');
    }
};

async function loadLecturerStudents() {
    const tbody = document.getElementById('myStudentsTableBody');
    try {
        const res = await fetch('/projects/my_students');
        if (!res.ok) return;
        const students = await res.json();

        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">Chưa có sinh viên nào đang thực hiện đồ án.</td></tr>';
            return;
        }

        tbody.innerHTML = students.map(p => `
            <tr>
                <td><code>${p.project_code}</code></td>
                <td><strong>${p.name}</strong></td>
                <td>${p.student_name}<br><small style="color: var(--text-muted);">${p.student_code || ''} (${p.student_class || ''})</small></td>
                <td>${getProgressBadge(p.progress)}</td>
                <td>${p.council_name || '<span style="color: var(--text-dim);">Chưa gán</span>'}</td>
                <td>${p.defense_date ? `${p.defense_date} (${p.defense_location || ''})` : '<span style="color: var(--text-dim);">Chưa xếp lịch</span>'}</td>
                <td>
                    <button class="btn-primary" style="padding: 4px 10px; font-size: 12px; margin-right: 6px;" onclick="openProgressModal(${p.id})"><i class="fa-solid fa-pen"></i> Tiến độ</button>
                    <a href="/diem?project_id=${p.id}" class="btn-secondary" style="padding: 4px 10px; font-size: 12px; text-decoration: none;"><i class="fa-solid fa-star"></i> Chấm điểm</a>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7" style="color: var(--danger); text-align: center;">Lỗi tải danh sách đồ án</td></tr>';
    }
}

window.openProgressModal = async function(id) {
    let project = allProjects.find(p => p.id === id);
    if (!project) {
        try {
            const res = await fetch(`/projects/${id}`);
            if (res.ok) project = await res.json();
        } catch (e) {}
    }
    if (!project) return;

    document.getElementById('progressProjectId').value = project.id;
    document.getElementById('progressProjectNameDisplay').textContent = `${project.name} (${project.student_name || 'SV'})`;
    document.getElementById('progressSelect').value = project.progress || 'Chưa bắt đầu';
    document.getElementById('startDateInput').value = project.start_date || '';
    document.getElementById('endDateInput').value = project.end_date || '';
    document.getElementById('defenseDateInput').value = project.defense_date || '';
    document.getElementById('defenseLocationInput').value = project.defense_location || '';
    document.getElementById('councilSelect').value = project.council_id || '';
    document.getElementById('reviewerSelect').value = project.reviewer_id || '';
    document.getElementById('progressNotesInput').value = project.description || '';

    document.getElementById('progressModal')?.classList.add('active');
};


async function loadAllProjects() {
    const tbody = document.getElementById('allProjectsTableBody');
    const search = document.getElementById('projectSearchInput')?.value.trim() || '';
    const status = document.getElementById('statusFilter')?.value || '';
    const progress = document.getElementById('progressFilter')?.value || '';

    let url = `/projects?name=${encodeURIComponent(search)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    if (progress) url += `&progress=${encodeURIComponent(progress)}`;

    try {
        const res = await fetch(url);
        if (!res.ok) return;
        allProjects = await res.json();
        updateProjectStats();

        if (allProjects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="px-6 py-8 text-center text-slate-400">Không tìm thấy đồ án phù hợp.</td></tr>';
            return;
        }

        tbody.innerHTML = allProjects.map(p => {
            const isAdmin = currentUser && currentUser.role === 2;
            const isMySupervisor = currentUser && currentUser.role === 1 && (
                (currentUser.lecturer_id && (p.lecturer_id === currentUser.lecturer_id || p.reviewer_id === currentUser.lecturer_id)) ||
                (currentUser.full_name && (p.lecturer_name === currentUser.full_name || p.reviewer_name === currentUser.full_name))
            );

            const councilLink = p.council_name 
                ? `<a href="/hoidong?code=${encodeURIComponent(p.council_code || '')}" class="inline-flex items-center gap-1 font-bold text-ictu-600 hover:text-ictu-800 transition-colors" title="Bấm để xem hội đồng bảo vệ"><span class="material-symbols-outlined text-[15px]">groups</span><span>${p.council_name}</span></a>`
                : '<span class="text-slate-400 text-xs italic">Chưa gán</span>';

            const gradeBadge = (p.diem_tong_ket !== null && p.diem_tong_ket !== undefined)
                ? `<a href="/diem?project_id=${p.id}" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-xs" title="Xem bảng điểm đồ án"><span class="material-symbols-outlined text-[13px]">grade</span><span>${p.diem_tong_ket}</span></a>`
                : (p.has_grade
                    ? `<a href="/diem?project_id=${p.id}" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Đã chấm</a>`
                    : '<span class="text-slate-300 text-xs font-mono">--</span>');

            return `
                <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-6 py-3.5 font-mono text-xs font-bold text-slate-600">${p.project_code}</td>
                    <td class="px-6 py-3.5">
                        <div class="font-bold text-slate-900">${p.name}</div>
                        ${p.description ? `<div class="text-[11px] text-slate-400 line-clamp-1 italic mt-0.5">${p.description}</div>` : ''}
                    </td>
                    <td class="px-6 py-3.5">
                        <div class="font-bold text-slate-800">${p.student_name || 'N/A'}</div>
                        <div class="text-[11px] text-slate-400 font-mono">${p.student_code || ''}</div>
                    </td>
                    <td class="px-6 py-3.5 font-medium text-slate-700">${p.lecturer_name || 'Chưa phân công'}</td>
                    <td class="px-6 py-3.5">${getStatusBadge(p.status)}</td>
                    <td class="px-6 py-3.5">${getProgressBadge(p.progress)}</td>
                    <td class="px-6 py-3.5 text-xs">${councilLink}</td>
                    <td class="px-6 py-3.5 text-xs text-slate-600 whitespace-nowrap">${p.defense_date ? p.defense_date : '<span class="text-slate-400">--</span>'}</td>
                    <td class="px-6 py-3.5 text-center">${gradeBadge}</td>
                    <td class="px-6 py-3.5 text-right whitespace-nowrap">
                        <div class="flex items-center justify-end gap-1.5">
                            ${(isAdmin || isMySupervisor) ? `<button class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-ictu-600 hover:text-ictu-700 transition-all shadow-xs" onclick="openProgressModal(${p.id})" title="Cập nhật tiến độ / bảo vệ"><span class="material-symbols-outlined text-[16px]">edit</span></button>` : ''}
                            ${isAdmin ? `<button class="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all shadow-xs" onclick="deleteProjectAdmin(${p.id})" title="Xóa đồ án"><span class="material-symbols-outlined text-[16px]">delete</span></button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-6 py-8 text-center text-rose-500">Lỗi tải dữ liệu đồ án</td></tr>';
    }
}

function updateProjectStats() {
    const totalEl = document.getElementById('statTotalProjects');
    const inProgEl = document.getElementById('statInProgressProjects');
    const pendEl = document.getElementById('statPendingProjects');
    const gradEl = document.getElementById('statGradedProjects');

    if (totalEl) totalEl.textContent = allProjects.length;
    if (inProgEl) inProgEl.textContent = allProjects.filter(p => p.status === 'Chấp nhận' && p.progress !== 'Hoàn thành').length;
    if (pendEl) pendEl.textContent = allProjects.filter(p => p.status === 'Chờ duyệt').length;
    if (gradEl) gradEl.textContent = allProjects.filter(p => p.has_grade || (p.diem_tong_ket !== null && p.diem_tong_ket !== undefined)).length;
}

window.exportProjectsToCsv = function() {
    if (!allProjects || allProjects.length === 0) {
        showToast('Không có dữ liệu đồ án để xuất', 'error');
        return;
    }
    const headers = ['Mã ĐA', 'Tên Đề Tài', 'Sinh Viên', 'MSV', 'GV Hướng Dẫn', 'Trạng Thái', 'Tiến Độ', 'Hội Đồng', 'Ngày Bảo Vệ', 'Điểm Tổng Kết'];
    const rows = allProjects.map(p => [
        `"${p.project_code || ''}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.student_name || '').replace(/"/g, '""')}"`,
        `"${p.student_code || ''}"`,
        `"${(p.lecturer_name || '').replace(/"/g, '""')}"`,
        `"${p.status || ''}"`,
        `"${p.progress || ''}"`,
        `"${(p.council_name || '').replace(/"/g, '""')}"`,
        `"${p.defense_date || ''}"`,
        `"${p.diem_tong_ket !== null && p.diem_tong_ket !== undefined ? p.diem_tong_ket : ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh_sach_do_an_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Xuất tệp CSV thành công!', 'success');
};

function getStatusBadge(status) {
    if (status === 'Chấp nhận') return '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="material-symbols-outlined text-[13px]">check_circle</span> Chấp nhận</span>';
    if (status === 'Từ chối') return '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><span class="material-symbols-outlined text-[13px]">cancel</span> Từ chối</span>';
    return '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"><span class="material-symbols-outlined text-[13px]">pending</span> Chờ duyệt</span>';
}

function getProgressBadge(progress) {
    if (progress === 'Hoàn thành') return '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><span class="material-symbols-outlined text-[13px]">task_alt</span> Hoàn thành</span>';
    if (progress && progress.startsWith('Cập nhật')) return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><span class="material-symbols-outlined text-[13px]">update</span> ${progress}</span>`;
    return '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200"><span class="material-symbols-outlined text-[13px]">hourglass_empty</span> Chưa bắt đầu</span>';
}


function setupEventListeners() {

    const tabReqBtn = document.getElementById('tabRequestsBtn');
    const tabMyBtn = document.getElementById('tabMyStudentsBtn');
    const panelReq = document.getElementById('tabRequestsPanel');
    const panelMy = document.getElementById('tabMyStudentsPanel');

    tabReqBtn?.addEventListener('click', () => {
        tabReqBtn.className = 'btn-primary';
        tabMyBtn.className = 'btn-secondary';
        panelReq.style.display = 'block';
        panelMy.style.display = 'none';
    });

    tabMyBtn?.addEventListener('click', () => {
        tabMyBtn.className = 'btn-primary';
        tabReqBtn.className = 'btn-secondary';
        panelReq.style.display = 'none';
        panelMy.style.display = 'block';
    });


    document.getElementById('projectSearchInput')?.addEventListener('input', debounce(loadAllProjects, 300));
    document.getElementById('statusFilter')?.addEventListener('change', loadAllProjects);
    document.getElementById('progressFilter')?.addEventListener('change', loadAllProjects);
    document.getElementById('exportProjectsBtn')?.addEventListener('click', exportProjectsToCsv);


    document.getElementById('openAddProjectModalBtn')?.addEventListener('click', () => openRegisterModal(true));

    document.getElementById('closeRegisterModalBtn')?.addEventListener('click', () => document.getElementById('registerModal')?.classList.remove('active'));
    document.getElementById('cancelRegisterModalBtn')?.addEventListener('click', () => document.getElementById('registerModal')?.classList.remove('active'));
    document.getElementById('closeProgressModalBtn')?.addEventListener('click', () => document.getElementById('progressModal')?.classList.remove('active'));
    document.getElementById('cancelProgressModalBtn')?.addEventListener('click', () => document.getElementById('progressModal')?.classList.remove('active'));
    document.getElementById('closeReportModalBtn')?.addEventListener('click', () => document.getElementById('reportModal')?.classList.remove('active'));
    document.getElementById('cancelReportModalBtn')?.addEventListener('click', () => document.getElementById('reportModal')?.classList.remove('active'));

    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('projectName').value.trim();
        const lecturer_id = document.getElementById('projectLecturerSelect').value;
        const description = document.getElementById('projectDesc').value.trim();
        const studentSelect = document.getElementById('projectStudentSelect');
        const student_id = studentSelect ? studentSelect.value : null;

        const isStaff = currentUser && (currentUser.role === 1 || currentUser.role === 2);

        if (isStaff && !student_id) {
            showToast('Vui lòng chọn sinh viên thực hiện đề tài', 'error');
            return;
        }

        const url = isStaff ? '/projects' : '/projects/register';
        const payload = isStaff
            ? { name, lecturer_id: parseInt(lecturer_id), student_id: parseInt(student_id), description, status: 'Chấp nhận' }
            : { name, lecturer_id: parseInt(lecturer_id), description };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                showToast(isStaff ? 'Thêm đồ án mới thành công!' : 'Đăng ký đề tài thành công! Vui lòng chờ GVHD phê duyệt.', 'success');
                document.getElementById('registerModal')?.classList.remove('active');
                if (currentUser && currentUser.role === 0) loadMyProject();
                loadAllProjects();
                if (isStaff) {
                    loadLecturerRequests();
                    loadLecturerStudents();
                }
            } else {
                showToast(data.error || 'Thao tác đồ án thất bại', 'error');
            }
        } catch (e) {
            showToast('Lỗi mạng khi lưu đề tài', 'error');
        }
    });


    document.getElementById('progressForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('progressProjectId').value;
        const progress = document.getElementById('progressSelect').value;
        const start_date = document.getElementById('startDateInput').value;
        const end_date = document.getElementById('endDateInput').value;
        const defense_date = document.getElementById('defenseDateInput').value;
        const defense_location = document.getElementById('defenseLocationInput').value.trim();
        const council_id = document.getElementById('councilSelect').value;
        const reviewer_id = document.getElementById('reviewerSelect').value;
        const description = document.getElementById('progressNotesInput').value.trim();

        try {
            const res = await fetch(`/projects/${id}/progress`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    progress, start_date, end_date, defense_date, defense_location, council_id, reviewer_id, description
                })
            });
            const data = await res.json();
            if (res.ok) {
                showToast('Cập nhật tiến độ đồ án thành công!', 'success');
                document.getElementById('progressModal')?.classList.remove('active');
                loadLecturerStudents();
                loadAllProjects();
                if (currentUser.role === 0) loadMyProject();
            } else {
                showToast(data.error || 'Cập nhật thất bại', 'error');
            }
        } catch (e) {
            showToast('Lỗi mạng khi cập nhật tiến độ', 'error');
        }
    });


    document.getElementById('reportForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('reportProjectId').value;
        const report = document.getElementById('reportContent').value.trim();

        try {
            const res = await fetch(`/projects/${id}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report })
            });
            const data = await res.json();
            if (res.ok) {
                showToast('Gửi báo cáo tiến độ thành công!', 'success');
                document.getElementById('reportModal')?.classList.remove('active');
                loadMyProject();
            } else {
                showToast(data.error || 'Gửi báo cáo thất bại', 'error');
            }
        } catch (e) {
            showToast('Lỗi mạng', 'error');
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
