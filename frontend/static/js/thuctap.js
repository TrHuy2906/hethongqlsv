let internshipsList = [];
let studentsList = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentUser();
    await loadStudentsList();
    loadInternships();
    if (currentUser && currentUser.role === 0) {
        loadMyInternship();
    }
    setupEventListeners();
});

async function loadStudentsList() {
    try {
        const res = await fetch('/students');
        if (res.ok) {
            studentsList = await res.json();
            populateStudentSelect();
        }
    } catch (e) {
        console.warn('Lỗi tải danh sách sinh viên:', e);
    }
}

function populateStudentSelect() {
    const sel = document.getElementById('internshipStudentSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Chọn sinh viên --</option>';
    studentsList.forEach(s => {
        sel.innerHTML += `<option value="${s.id}">${s.name} (${s.student_code || 'MSV' + s.id} - ${s.class || ''})</option>`;
    });
}


async function loadMyInternship() {
    const card = document.getElementById('studentInternshipCard');
    const content = document.getElementById('myInternshipContent');
    if (!card || !content) return;
    card.style.display = 'block';

    try {
        const res = await fetch('/internships/my');
        const data = await res.json();

        if (!data.internship) {
            content.innerHTML = `<p style="color: var(--text-muted);">${data.error || data.message || 'Bạn chưa có thông tin thực tập trong hệ thống.'}</p>`;
            const act = document.getElementById('studentInternshipActionBtns');
            if (act) {
                act.innerHTML = '<button class="px-3.5 py-1.5 rounded-xl bg-ictu-600 hover:bg-ictu-700 text-white text-xs font-bold flex items-center gap-1.5" id="studentRegisterInternshipBtn"><span class="material-symbols-outlined text-[16px]">add</span><span>Đăng Ký Thực Tập</span></button>';
                document.getElementById('studentRegisterInternshipBtn')?.addEventListener('click', openAddInternshipModal);
            }
            return;
        }

        const it = data.internship;
        content.innerHTML = `
            <div style="font-size: 14px; line-height: 1.8;">
                <div><i class="fa-solid fa-building" style="width: 20px; color: var(--primary);"></i> <strong>Công ty:</strong> ${it.company_name}</div>
                <div><i class="fa-solid fa-briefcase" style="width: 20px; color: var(--primary);"></i> <strong>Vị trí:</strong> ${it.position || 'Chưa cập nhật'}</div>
                <div><i class="fa-solid fa-calendar-days" style="width: 20px; color: var(--primary);"></i> <strong>Thời gian:</strong> ${it.start_date || '...'} đến ${it.end_date || '...'}</div>
                ${it.evaluation ? `<div style="margin-top: 10px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px;"><strong>Đánh giá của đơn vị:</strong><br>${it.evaluation}</div>` : ''}
            </div>
        `;
    } catch (e) {
        content.innerHTML = '<p style="color: var(--danger);">Lỗi tải thông tin thực tập</p>';
    }
}


async function loadInternships() {
    const tbody = document.getElementById('internshipsTableBody');
    const search = document.getElementById('internshipSearchInput')?.value.trim() || '';

    try {
        const res = await fetch(`/internships?student_name=${encodeURIComponent(search)}`);
        if (!res.ok) return;
        internshipsList = await res.json();
        updateInternshipStats();

        if (internshipsList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="px-6 py-8 text-center text-slate-400">Không tìm thấy thông tin thực tập nào.</td></tr>';
            return;
        }

        const canManage = currentUser && (currentUser.role === 1 || currentUser.role === 2);
        const isAdmin = currentUser && currentUser.role === 2;

        tbody.innerHTML = internshipsList.map(it => {
            const hasEval = it.evaluation && it.evaluation.trim().length > 0;
            const evalBadge = hasEval
                ? `<div class="text-xs text-slate-700 bg-emerald-50/80 border border-emerald-200/80 rounded-lg p-2 leading-relaxed"><span class="font-bold text-emerald-700 flex items-center gap-1 mb-0.5"><span class="material-symbols-outlined text-[13px]">verified</span>Đạt yêu cầu:</span>${it.evaluation}</div>`
                : '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><span class="material-symbols-outlined text-[12px]">schedule</span>Đang thực tập</span>';

            return `
                <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-6 py-3.5 font-mono text-xs font-bold text-slate-600">${it.internship_code || 'TT' + it.id}</td>
                    <td class="px-6 py-3.5">
                        <div class="font-bold text-slate-900">${it.student_name || 'N/A'}</div>
                        <div class="text-[11px] text-slate-400 font-mono">${it.student_code || ''}</div>
                    </td>
                    <td class="px-6 py-3.5 font-medium text-slate-600">${it.student_class || 'N/A'}</td>
                    <td class="px-6 py-3.5">
                        <div class="font-bold text-ictu-700 flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[16px] text-ictu-500">business</span>
                            <span>${it.company_name}</span>
                        </div>
                    </td>
                    <td class="px-6 py-3.5 text-xs text-slate-700">${it.position ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">${it.position}</span>` : '<span class="text-slate-400">--</span>'}</td>
                    <td class="px-6 py-3.5 text-xs text-slate-600 whitespace-nowrap">${it.start_date || '<span class="text-slate-400">--</span>'}</td>
                    <td class="px-6 py-3.5 text-xs text-slate-600 whitespace-nowrap">${it.end_date || '<span class="text-slate-400">--</span>'}</td>
                    <td class="px-6 py-3.5 max-w-xs">${evalBadge}</td>
                    ${canManage ? `
                        <td class="px-6 py-3.5 text-right whitespace-nowrap">
                            <div class="flex items-center justify-end gap-1.5">
                                <button class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-ictu-600 hover:text-ictu-700 transition-all shadow-xs" onclick="openEditInternshipModal(${it.id})" title="Chỉnh sửa"><span class="material-symbols-outlined text-[16px]">edit</span></button>
                                ${isAdmin ? `<button class="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all shadow-xs" onclick="deleteInternship(${it.id})" title="Xóa"><span class="material-symbols-outlined text-[16px]">delete</span></button>` : ''}
                            </div>
                        </td>
                    ` : '<td class="px-6 py-3.5 text-slate-400 text-center">--</td>'}
                </tr>
            `;
        }).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-6 py-8 text-center text-rose-500">Lỗi tải dữ liệu thực tập</td></tr>';
    }
}

function updateInternshipStats() {
    const totalEl = document.getElementById('statTotalInternships');
    const ongoingEl = document.getElementById('statOngoingInternships');
    const evaluatedEl = document.getElementById('statEvaluatedInternships');
    const companiesEl = document.getElementById('statCompaniesCount');

    if (totalEl) totalEl.textContent = internshipsList.length;

    const evaluatedCount = internshipsList.filter(it => it.evaluation && it.evaluation.trim().length > 0).length;
    if (evaluatedEl) evaluatedEl.textContent = evaluatedCount;
    if (ongoingEl) ongoingEl.textContent = internshipsList.length - evaluatedCount;

    const uniqueCompanies = new Set(internshipsList.map(it => (it.company_name || '').trim().toLowerCase()).filter(Boolean));
    if (companiesEl) companiesEl.textContent = uniqueCompanies.size;
}

window.exportInternshipsToCsv = function() {
    if (!internshipsList || internshipsList.length === 0) {
        showToast('Không có dữ liệu thực tập để xuất', 'error');
        return;
    }
    const headers = ['Mã TT', 'Sinh Viên', 'MSV', 'Lớp', 'Công Ty Thực Tập', 'Vị Trí', 'Thời Gian Bắt Đầu', 'Thời Gian Kết Thúc', 'Đánh Giá'];
    const rows = internshipsList.map(it => [
        `"${it.internship_code || 'TT' + it.id}"`,
        `"${(it.student_name || '').replace(/"/g, '""')}"`,
        `"${it.student_code || ''}"`,
        `"${it.student_class || ''}"`,
        `"${(it.company_name || '').replace(/"/g, '""')}"`,
        `"${(it.position || '').replace(/"/g, '""')}"`,
        `"${it.start_date || ''}"`,
        `"${it.end_date || ''}"`,
        `"${(it.evaluation || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh_sach_thuc_tap_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Xuất tệp CSV thành công!', 'success');
};

window.openEditInternshipModal = function(id) {
    const it = internshipsList.find(item => item.id === id);
    if (!it) return;

    document.getElementById('internshipId').value = it.id;
    document.getElementById('internshipModalTitle').textContent = 'Chỉnh Sửa Thông Tin Thực Tập';
    document.getElementById('studentSelectGroup').style.display = 'none';
    document.getElementById('internshipCompanyInput').value = it.company_name;
    document.getElementById('internshipPositionInput').value = it.position || '';
    document.getElementById('internshipStartDate').value = it.start_date || '';
    document.getElementById('internshipEndDate').value = it.end_date || '';
    document.getElementById('internshipEvaluation').value = it.evaluation || '';

    document.getElementById('internshipModal')?.classList.add('active');
};

window.deleteInternship = async function(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa thông tin thực tập này không?')) return;
    try {
        const res = await fetch(`/internships/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
            showToast('Xóa thông tin thực tập thành công!', 'success');
            loadInternships();
        } else {
            showToast(data.error || 'Xóa thực tập thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi mạng', 'error');
    }
};

function setupEventListeners() {
    document.getElementById('internshipSearchInput')?.addEventListener('input', debounce(loadInternships, 300));
    document.getElementById('exportInternshipsBtn')?.addEventListener('click', window.exportInternshipsToCsv);

    const openBtn = document.getElementById('openAddInternshipModalBtn');
    const modal = document.getElementById('internshipModal');
    const closeBtn = document.getElementById('closeInternshipModalBtn');
    const cancelBtn = document.getElementById('cancelInternshipModalBtn');
    const form = document.getElementById('internshipForm');

    window.openAddInternshipModal = function() {
        const isStudent = currentUser && currentUser.role === 0;
        document.getElementById('internshipId').value = '';
        document.getElementById('internshipModalTitle').textContent = isStudent ? 'Đăng Ký Thông Tin Thực Tập' : 'Thêm Thông Tin Thực Tập Mới';
        document.getElementById('studentSelectGroup').style.display = isStudent ? 'none' : 'block';
        form?.reset();
        modal?.classList.add('active');
    };

    if (currentUser && currentUser.role === 0) {
        const btnText = document.getElementById('openAddInternshipBtnText');
        if (btnText) btnText.textContent = 'Đăng Ký Thực Tập';
    }

    openBtn?.addEventListener('click', window.openAddInternshipModal);

    closeBtn?.addEventListener('click', () => modal?.classList.remove('active'));
    cancelBtn?.addEventListener('click', () => modal?.classList.remove('active'));

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('internshipId').value;
        const student_id = document.getElementById('internshipStudentSelect').value;
        const company_name = document.getElementById('internshipCompanyInput').value.trim();
        const position = document.getElementById('internshipPositionInput').value.trim();
        const start_date = document.getElementById('internshipStartDate').value;
        const end_date = document.getElementById('internshipEndDate').value;
        const evaluation = document.getElementById('internshipEvaluation').value.trim();

        const isStudent = currentUser && currentUser.role === 0;
        if (!id && !isStudent && !student_id) {
            showToast('Vui lòng chọn sinh viên', 'error');
            return;
        }

        const payload = {
            company_name, position, start_date, end_date, evaluation
        };
        if (!id && !isStudent) payload.student_id = student_id;

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/internships/${id}` : '/internships';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                showToast(id ? 'Cập nhật thực tập thành công!' : (isStudent ? 'Đăng ký thực tập thành công!' : 'Thêm thực tập thành công!'), 'success');
                modal?.classList.remove('active');
                loadInternships();
                if (currentUser && currentUser.role === 0) loadMyInternship();
            } else {
                showToast(data.error || 'Thao tác thất bại', 'error');
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
