let gradesList = [];
let projectsList = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentUser();
    await loadProjects();
    await loadGrades();
    if (currentUser && currentUser.role === 0) {
        loadMyGrade();
    }
    const urlParams = new URLSearchParams(window.location.search);
    const projId = urlParams.get('project_id');
    const councilId = urlParams.get('council_id');

    if (councilId) {
        // Lọc theo hội đồng
        try {
            const cRes = await fetch(`/councils/${councilId}`);
            if (cRes.ok) {
                const cData = await cRes.json();
                const searchInput = document.getElementById('gradeSearchInput');
                if (searchInput && cData.council_code) {
                    searchInput.value = cData.council_code;
                    showToast(`Đang lọc đề tài thuộc Hội đồng ${cData.council_code}`, 'info');
                }
            }
        } catch (e) {}
    }

    if (projId && currentUser && (currentUser.role === 1 || currentUser.role === 2)) {
        openEditGradeModal(parseInt(projId));
    }
    setupEventListeners();
});

async function loadProjects() {
    try {
        const res = await fetch('/projects');
        if (res.ok) {
            projectsList = await res.json();
            populateProjectSelect();
        }
    } catch (e) {
    }
}

function populateProjectSelect() {
    const sel = document.getElementById('gradeProjectSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Chọn đồ án cần chấm điểm --</option>';
    projectsList.forEach(p => {
        let isMine = false;
        if (currentUser && currentUser.role === 1) {
            isMine = (currentUser.lecturer_id && (p.lecturer_id === currentUser.lecturer_id || p.reviewer_id === currentUser.lecturer_id)) ||
                     (currentUser.full_name && (p.lecturer_name === currentUser.full_name || p.reviewer_name === currentUser.full_name));
        }
        const tag = isMine ? ' [Phụ trách]' : '';
        sel.innerHTML += `<option value="${p.id}">${p.project_code} - ${p.name} (SV: ${p.student_name || 'N/A'})${tag}</option>`;
    });
}

async function loadMyGrade() {
    const card = document.getElementById('studentGradeCard');
    const content = document.getElementById('myGradeContent');
    if (!card || !content) return;
    card.style.display = 'block';

    try {
        const res = await fetch('/grades/my');
        const data = await res.json();

        if (!data.grade) {
            content.innerHTML = `<p class="text-xs text-slate-500 italic py-2">${data.error || data.message || 'Chưa có dữ liệu điểm bảo vệ cho đồ án của bạn.'}</p>`;
            return;
        }

        const g = data.grade;
        let rankBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Đang cập nhật</span>';
        if (g.diem_tong_ket !== null) {
            if (g.diem_tong_ket >= 9.0) rankBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">Xuất Sắc</span>';
            else if (g.diem_tong_ket >= 8.0) rankBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300">Giỏi</span>';
            else if (g.diem_tong_ket >= 7.0) rankBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300">Khá</span>';
            else if (g.diem_tong_ket >= 5.0) rankBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Trung Bình</span>';
            else rankBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">Chưa Đạt</span>';
        }

        content.innerHTML = `
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điểm GV Hướng Dẫn</div>
                    <div class="text-2xl font-black text-ictu-600 mt-1">${g.diem_gvhd !== null ? g.diem_gvhd : '--'}</div>
                </div>
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điểm GV Phản Biện</div>
                    <div class="text-2xl font-black text-indigo-600 mt-1">${g.diem_gvpb !== null ? g.diem_gvpb : '--'}</div>
                </div>
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TB Hội Đồng</div>
                    <div class="text-2xl font-black text-amber-600 mt-1">${g.diem_tbhd !== null ? g.diem_tbhd : '--'}</div>
                </div>
                <div class="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-center flex flex-col items-center justify-center">
                    <div class="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">Điểm Tổng Kết</div>
                    <div class="text-3xl font-black text-emerald-700 mt-0.5">${g.diem_tong_ket !== null ? g.diem_tong_ket : '--'}</div>
                    <div class="mt-1.5">${rankBadge}</div>
                </div>
            </div>
        `;
    } catch (e) {
        content.innerHTML = '<p class="text-xs text-rose-500">Lỗi tải bảng điểm</p>';
    }
}

async function loadGrades() {
    const tbody = document.getElementById('gradesTableBody');
    const search = document.getElementById('gradeSearchInput')?.value.trim() || '';

    try {
        const res = await fetch(`/grades?project_code=${encodeURIComponent(search)}`);
        if (!res.ok) return;
        gradesList = await res.json();
        updateGradeStats();

        if (gradesList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="px-6 py-8 text-center text-slate-400">Chưa có bản ghi điểm nào.</td></tr>';
            return;
        }

        const canGrade = currentUser && (currentUser.role === 1 || currentUser.role === 2);

        tbody.innerHTML = gradesList.map(g => {
            let finalBadge = '<span class="text-slate-300 font-mono text-xs">--</span>';
            if (g.diem_tong_ket !== null && g.diem_tong_ket !== undefined) {
                const val = parseFloat(g.diem_tong_ket);
                if (val >= 8.0) {
                    finalBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="material-symbols-outlined text-[12px]">star</span>${val}</span>`;
                } else if (val >= 6.5) {
                    finalBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">${val}</span>`;
                } else if (val >= 5.0) {
                    finalBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">${val}</span>`;
                } else {
                    finalBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">${val}</span>`;
                }
            }

            return `
                <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-4 py-3.5 font-mono text-xs font-bold text-ictu-600">
                        <a href="/doan?search=${encodeURIComponent(g.project_code || '')}" class="hover:underline flex items-center gap-1" title="Xem đề tài ở trang đồ án">
                            <span>${g.project_code || 'N/A'}</span>
                            <span class="material-symbols-outlined text-[13px] text-slate-400">open_in_new</span>
                        </a>
                    </td>
                    <td class="px-4 py-3.5 font-bold text-slate-900 max-w-xs">${g.project_name || 'N/A'}</td>
                    <td class="px-4 py-3.5">
                        <div class="font-bold text-slate-800">${g.student_name || 'N/A'}</div>
                        <div class="text-[11px] text-slate-400 font-mono">${g.student_code || ''}</div>
                    </td>
                    <td class="px-4 py-3.5 text-center font-bold text-slate-700">${g.diem_gvhd !== null ? g.diem_gvhd : '<span class="text-slate-300">--</span>'}</td>
                    <td class="px-4 py-3.5 text-center font-bold text-slate-700">${g.diem_gvpb !== null ? g.diem_gvpb : '<span class="text-slate-300">--</span>'}</td>
                    <td class="px-4 py-3.5 text-center text-xs text-slate-600">${g.diem_tv1 !== null ? g.diem_tv1 : '<span class="text-slate-300">--</span>'}</td>
                    <td class="px-4 py-3.5 text-center text-xs text-slate-600">${g.diem_tv2 !== null ? g.diem_tv2 : '<span class="text-slate-300">--</span>'}</td>
                    <td class="px-4 py-3.5 text-center text-xs text-slate-600">${g.diem_tv3 !== null ? g.diem_tv3 : '<span class="text-slate-300">--</span>'}</td>
                    <td class="px-4 py-3.5 text-center font-bold text-amber-600">${g.diem_tbhd !== null ? g.diem_tbhd : '<span class="text-slate-300">--</span>'}</td>
                    <td class="px-4 py-3.5 text-center">${finalBadge}</td>
                    ${canGrade ? `
                        <td class="px-4 py-3.5 text-right whitespace-nowrap">
                            <button class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-ictu-600 hover:text-ictu-700 transition-all shadow-xs" onclick="openEditGradeModal(${g.project_id})" title="Nhập / Sửa điểm">
                                <span class="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                        </td>
                    ` : '<td class="px-4 py-3.5 text-slate-400 text-center lecturer-only">--</td>'}
                </tr>
            `;
        }).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="11" class="px-6 py-8 text-center text-rose-500">Lỗi tải danh sách điểm</td></tr>';
    }
}

function updateGradeStats() {
    const totalEl = document.getElementById('statTotalGraded');
    const excEl = document.getElementById('statExcellentGrades');
    const passEl = document.getElementById('statPassedGrades');
    const avgEl = document.getElementById('statAverageGrade');

    const gradedItems = gradesList.filter(g => g.diem_tong_ket !== null && g.diem_tong_ket !== undefined);

    if (totalEl) totalEl.textContent = gradedItems.length;
    if (excEl) excEl.textContent = gradedItems.filter(g => parseFloat(g.diem_tong_ket) >= 8.0).length;
    if (passEl) passEl.textContent = gradedItems.filter(g => {
        const val = parseFloat(g.diem_tong_ket);
        return val >= 5.0 && val < 8.0;
    }).length;

    if (avgEl) {
        if (gradedItems.length > 0) {
            const sum = gradedItems.reduce((acc, g) => acc + parseFloat(g.diem_tong_ket), 0);
            avgEl.textContent = (sum / gradedItems.length).toFixed(2);
        } else {
            avgEl.textContent = '0.0';
        }
    }
}

window.exportGradesToCsv = function() {
    if (!gradesList || gradesList.length === 0) {
        showToast('Không có dữ liệu điểm để xuất', 'error');
        return;
    }
    const headers = ['Mã ĐA', 'Tên Đồ Án', 'Sinh Viên', 'MSV', 'Điểm GVHD', 'Điểm GVPB', 'TV1', 'TV2', 'TV3', 'TB Hội Đồng', 'Điểm Tổng Kết'];
    const rows = gradesList.map(g => [
        `"${g.project_code || ''}"`,
        `"${(g.project_name || '').replace(/"/g, '""')}"`,
        `"${(g.student_name || '').replace(/"/g, '""')}"`,
        `"${g.student_code || ''}"`,
        `"${g.diem_gvhd !== null ? g.diem_gvhd : ''}"`,
        `"${g.diem_gvpb !== null ? g.diem_gvpb : ''}"`,
        `"${g.diem_tv1 !== null ? g.diem_tv1 : ''}"`,
        `"${g.diem_tv2 !== null ? g.diem_tv2 : ''}"`,
        `"${g.diem_tv3 !== null ? g.diem_tv3 : ''}"`,
        `"${g.diem_tbhd !== null ? g.diem_tbhd : ''}"`,
        `"${g.diem_tong_ket !== null ? g.diem_tong_ket : ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bang_diem_do_an_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Xuất tệp CSV thành công!', 'success');
};

window.openEditGradeModal = async function(projectId) {
    let g = gradesList.find(item => item.project_id === projectId);
    if (!g) {
        try {
            const res = await fetch(`/grades/${projectId}`);
            if (res.ok) g = await res.json();
        } catch (e) {}
    }
    const sel = document.getElementById('gradeProjectSelect');
    if (sel) {
        sel.value = projectId;
        sel.disabled = true;
    }

    document.getElementById('scoreGvhd').value = (g && g.diem_gvhd !== null && g.diem_gvhd !== undefined) ? g.diem_gvhd : '';
    document.getElementById('scoreGvpb').value = (g && g.diem_gvpb !== null && g.diem_gvpb !== undefined) ? g.diem_gvpb : '';
    document.getElementById('scoreTv1').value = (g && g.diem_tv1 !== null && g.diem_tv1 !== undefined) ? g.diem_tv1 : '';
    document.getElementById('scoreTv2').value = (g && g.diem_tv2 !== null && g.diem_tv2 !== undefined) ? g.diem_tv2 : '';
    document.getElementById('scoreTv3').value = (g && g.diem_tv3 !== null && g.diem_tv3 !== undefined) ? g.diem_tv3 : '';

    document.getElementById('gradeModal')?.classList.add('active');
};

function setupEventListeners() {
    document.getElementById('gradeSearchInput')?.addEventListener('input', debounce(loadGrades, 300));
    document.getElementById('exportGradesBtn')?.addEventListener('click', window.exportGradesToCsv);

    const openBtn = document.getElementById('openEnterGradeModalBtn');
    const modal = document.getElementById('gradeModal');
    const closeBtn = document.getElementById('closeGradeModalBtn');
    const cancelBtn = document.getElementById('cancelGradeModalBtn');
    const form = document.getElementById('gradeForm');

    openBtn?.addEventListener('click', () => {
        const sel = document.getElementById('gradeProjectSelect');
        if (sel) sel.disabled = false;
        form?.reset();
        modal?.classList.add('active');
    });

    closeBtn?.addEventListener('click', () => modal?.classList.remove('active'));
    cancelBtn?.addEventListener('click', () => modal?.classList.remove('active'));

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const projectId = document.getElementById('gradeProjectSelect').value;
        if (!projectId) {
            showToast('Vui lòng chọn đồ án', 'error');
            return;
        }

        const diem_gvhd = document.getElementById('scoreGvhd').value;
        const diem_gvpb = document.getElementById('scoreGvpb').value;
        const diem_tv1 = document.getElementById('scoreTv1').value;
        const diem_tv2 = document.getElementById('scoreTv2').value;
        const diem_tv3 = document.getElementById('scoreTv3').value;


        for (const [val, label] of [
            [diem_gvhd, 'Điểm GVHD'],
            [diem_gvpb, 'Điểm GVPB'],
            [diem_tv1, 'Điểm TV1'],
            [diem_tv2, 'Điểm TV2'],
            [diem_tv3, 'Điểm TV3']
        ]) {
            if (val !== '') {
                const num = parseFloat(val);
                if (isNaN(num) || num < 0 || num > 10) {
                    showToast(`${label} không hợp lệ, phải từ 0 đến 10!`, 'error');
                    return;
                }
            }
        }

        const payload = {
            diem_gvhd: diem_gvhd !== '' ? parseFloat(diem_gvhd) : null,
            diem_gvpb: diem_gvpb !== '' ? parseFloat(diem_gvpb) : null,
            diem_tv1: diem_tv1 !== '' ? parseFloat(diem_tv1) : null,
            diem_tv2: diem_tv2 !== '' ? parseFloat(diem_tv2) : null,
            diem_tv3: diem_tv3 !== '' ? parseFloat(diem_tv3) : null
        };

        try {
            const res = await fetch(`/grades/${projectId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                showToast('Lưu điểm đồ án thành công!', 'success');
                modal?.classList.remove('active');
                loadGrades();
                if (currentUser && currentUser.role === 0) loadMyGrade();
            } else {
                showToast(data.error || 'Lưu điểm thất bại', 'error');
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
