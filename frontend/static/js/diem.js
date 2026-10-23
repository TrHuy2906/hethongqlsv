let allGrades = [];
let allStudentsList = [];
let editingGradeId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentUser();
    await loadStudentsForSelect();
    await loadGradesData();
    setupEventListeners();
});

async function loadStudentsForSelect() {
    try {
        const res = await fetch('/students');
        if (res.ok) {
            allStudentsList = await res.json();
            const sel = document.getElementById('gradeStudentSelect');
            if (sel) {
                sel.innerHTML = '<option value="">-- Chọn sinh viên --</option>' +
                    allStudentsList.map(s => `<option value="${s.id}">${s.name} (${s.student_code || 'Chưa có MSV'} - ${s.class || s.class_name || 'Lớp'})</option>`).join('');
            }
        }
    } catch (e) {
    }
}

async function loadGradesData() {
    try {
        const res = await fetch('/grades');
        if (res.ok) {
            allGrades = await res.json();
            populateSubjectFilter();
            renderGradesTable(allGrades);
            updateGradeKPIs(allGrades);
        } else {
            showToast('Không thể tải danh sách bảng điểm', 'error');
        }
    } catch (e) {
        showToast('Lỗi mạng khi tải bảng điểm', 'error');
    }
}

function populateSubjectFilter() {
    const sel = document.getElementById('subjectFilter');
    if (!sel) return;
    const currentVal = sel.value;
    const subjects = [...new Set(allGrades.map(g => g.subject_name).filter(Boolean))];
    sel.innerHTML = '<option value="ALL">Tất cả môn học</option>' +
        subjects.map(name => `<option value="${name}">${name}</option>`).join('');
    if (currentVal && subjects.includes(currentVal)) {
        sel.value = currentVal;
    }
}

function updateGradeKPIs(grades) {
    const totalEl = document.getElementById('statTotalGraded');
    const avgEl = document.getElementById('statAverageGrade');
    const passRateEl = document.getElementById('statPassRate');
    const excellentEl = document.getElementById('statExcellentGrades');

    if (totalEl) totalEl.textContent = grades.length;

    const valid = grades.filter(g => g.diem_tong_ket !== null && g.diem_tong_ket !== undefined);
    if (valid.length === 0) {
        if (avgEl) avgEl.textContent = '0.0';
        if (passRateEl) passRateEl.textContent = '0%';
        if (excellentEl) excellentEl.textContent = '0';
        return;
    }

    const avg = valid.reduce((acc, g) => acc + g.diem_tong_ket, 0) / valid.length;
    if (avgEl) avgEl.textContent = avg.toFixed(1);

    const passed = valid.filter(g => g.diem_tong_ket >= 4.0 && !g.is_banned).length;
    const rate = Math.round((passed / valid.length) * 100);
    if (passRateEl) passRateEl.textContent = `${rate}%`;

    const exc = valid.filter(g => g.diem_tong_ket >= 8.0).length;
    if (excellentEl) excellentEl.textContent = exc;
}

function renderGradesTable(data) {
    const tbody = document.getElementById('gradesTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="px-6 py-8 text-center text-slate-400">Không tìm thấy bản ghi điểm môn học nào phù hợp.</td></tr>';
        return;
    }

    const isAdmin = currentUser && currentUser.role === 2;
    const canManage = currentUser && (currentUser.role === 1 || currentUser.role === 2);

    tbody.innerHTML = data.map(g => {
        const isBanned = g.is_banned;
        const tk = g.diem_tong_ket !== null && g.diem_tong_ket !== undefined ? Number(g.diem_tong_ket).toFixed(1) : '--';
        
        let statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Đang học</span>';
        if (isBanned) {
            statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700" title="Nghỉ ≥ 20% tổng số buổi">Cấm thi</span>';
        } else if (g.diem_tong_ket !== null && g.diem_tong_ket !== undefined) {
            if (g.diem_tong_ket >= 8.5) statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Xuất sắc</span>';
            else if (g.diem_tong_ket >= 8.0) statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Giỏi</span>';
            else if (g.diem_tong_ket >= 7.0) statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">Khá</span>';
            else if (g.diem_tong_ket >= 5.5) statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">Trung bình</span>';
            else if (g.diem_tong_ket >= 4.0) statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">Đạt (D)</span>';
            else statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Học lại</span>';
        }

        const letterBadgeColor = {
            'A': 'bg-emerald-100 text-emerald-800 font-extrabold',
            'B+': 'bg-emerald-50 text-emerald-700 font-bold',
            'B': 'bg-cyan-50 text-cyan-700 font-bold',
            'C+': 'bg-indigo-50 text-indigo-700 font-bold',
            'C': 'bg-slate-100 text-slate-700 font-semibold',
            'D+': 'bg-amber-50 text-amber-700 font-semibold',
            'D': 'bg-amber-100 text-amber-800 font-semibold',
            'F': 'bg-rose-100 text-rose-700 font-extrabold'
        }[g.letter_grade] || 'bg-slate-100 text-slate-500';

        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-4 py-3 font-mono font-bold text-slate-700">${g.student_code || 'SV' + g.student_id}</td>
                <td class="px-4 py-3">
                    <strong class="text-slate-900 block">${g.student_name || 'Chưa rõ'}</strong>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">${g.student_class || 'K61'}</span>
                </td>
                <td class="px-4 py-3">
                    <div class="font-semibold text-slate-800">${g.subject_name}</div>
                    <span class="text-[10px] text-slate-400 font-mono">${g.subject_code} • ${g.credits} tín chỉ</span>
                </td>
                <td class="px-4 py-3 text-center font-bold text-slate-700">${g.diem_chuyen_can !== null ? Number(g.diem_chuyen_can).toFixed(1) : '--'}</td>
                <td class="px-4 py-3 text-center font-bold text-slate-700">${g.diem_giua_ky !== null ? Number(g.diem_giua_ky).toFixed(1) : '--'}</td>
                <td class="px-4 py-3 text-center font-bold text-slate-700">${g.diem_cuoi_ky !== null ? Number(g.diem_cuoi_ky).toFixed(1) : '--'}</td>
                <td class="px-4 py-3 text-center">
                    <span class="text-sm font-black text-slate-900">${tk}</span>
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded-md text-xs ${letterBadgeColor}">${g.letter_grade || '--'}</span>
                </td>
                <td class="px-4 py-3 text-center font-bold text-slate-600">${g.gpa4 !== null ? Number(g.gpa4).toFixed(1) : '--'}</td>
                <td class="px-4 py-3 text-center">${statusBadge}</td>
                <td class="px-4 py-3 text-right admin-or-lecturer-only">
                    ${canManage ? `
                        <div class="flex items-center justify-end gap-1.5">
                            <button onclick="openEditGradeModal(${g.id})" class="h-7 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer" title="Sửa điểm">
                                <span class="material-symbols-outlined text-[14px]">edit</span>
                                <span>Sửa</span>
                            </button>
                            ${isAdmin ? `
                                <button onclick="deleteGradeRecord(${g.id}, '${g.subject_name.replace(/'/g, "\\'")}')" class="h-7 px-2 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer" title="Xóa điểm">
                                    <span class="material-symbols-outlined text-[14px]">delete</span>
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function filterGrades() {
    const search = (document.getElementById('gradeSearchInput')?.value || '').toLowerCase().trim();
    const subject = document.getElementById('subjectFilter')?.value || 'ALL';
    const result = document.getElementById('resultFilter')?.value || 'ALL';

    const filtered = allGrades.filter(g => {
        const matchesSearch = !search ||
            (g.student_name && g.student_name.toLowerCase().includes(search)) ||
            (g.student_code && g.student_code.toLowerCase().includes(search)) ||
            (g.subject_name && g.subject_name.toLowerCase().includes(search)) ||
            (g.subject_code && g.subject_code.toLowerCase().includes(search));

        const matchesSubject = (subject === 'ALL') || (g.subject_name === subject);

        let matchesResult = true;
        if (result === 'PASSED') matchesResult = g.diem_tong_ket >= 4.0 && !g.is_banned;
        else if (result === 'EXCELLENT') matchesResult = g.diem_tong_ket >= 8.0 && !g.is_banned;
        else if (result === 'FAILED') matchesResult = (g.diem_tong_ket !== null && g.diem_tong_ket < 4.0) || g.is_banned;
        else if (result === 'BANNED') matchesResult = g.is_banned;

        return matchesSearch && matchesSubject && matchesResult;
    });

    renderGradesTable(filtered);
    updateGradeKPIs(filtered);
}

function setupEventListeners() {
    document.getElementById('gradeSearchInput')?.addEventListener('input', filterGrades);
    document.getElementById('subjectFilter')?.addEventListener('change', filterGrades);
    document.getElementById('resultFilter')?.addEventListener('change', filterGrades);

    // Live preview of calculated final grade in modal
    const scoreInputs = ['scoreChuyenCan', 'scoreGiuaKy', 'scoreCuoiKy'];
    scoreInputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateScorePreview);
    });

    // Open add modal
    document.getElementById('openEnterGradeModalBtn')?.addEventListener('click', () => {
        editingGradeId = null;
        document.getElementById('gradeModalTitle').textContent = 'Nhập Điểm Môn Học Mới';
        document.getElementById('gradeId').value = '';
        document.getElementById('gradeForm').reset();
        document.getElementById('studentSelectGroup').style.display = 'block';
        updateScorePreview();
        document.getElementById('gradeModal').classList.add('active');
    });

    // Close modal
    document.getElementById('closeGradeModalBtn')?.addEventListener('click', () => {
        document.getElementById('gradeModal').classList.remove('active');
    });
    document.getElementById('cancelGradeModalBtn')?.addEventListener('click', () => {
        document.getElementById('gradeModal').classList.remove('active');
    });

    // Form submit
    document.getElementById('gradeForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveGradeRecord();
    });

    // Export Excel/CSV
    document.getElementById('exportGradesBtn')?.addEventListener('click', exportGradesToCSV);
}

function updateScorePreview() {
    const cc = parseFloat(document.getElementById('scoreChuyenCan')?.value);
    const gk = parseFloat(document.getElementById('scoreGiuaKy')?.value);
    const ck = parseFloat(document.getElementById('scoreCuoiKy')?.value);

    const prev10 = document.getElementById('previewGrade10');
    const prevL = document.getElementById('previewGradeLetter');
    const prev4 = document.getElementById('previewGrade4');

    if (isNaN(cc) || isNaN(gk) || isNaN(ck)) {
        if (prev10) prev10.textContent = '--';
        if (prevL) prevL.textContent = '--';
        if (prev4) prev4.textContent = 'Hệ 4: --';
        return;
    }

    const tk = (cc * 0.1) + (gk * 0.3) + (ck * 0.6);
    const final10 = Math.round(tk * 100) / 100;
    if (prev10) prev10.textContent = final10.toFixed(2);

    let letter = 'F';
    let gpa4 = 0.0;
    if (final10 >= 8.5) { letter = 'A'; gpa4 = 4.0; }
    else if (final10 >= 8.0) { letter = 'B+'; gpa4 = 3.5; }
    else if (final10 >= 7.0) { letter = 'B'; gpa4 = 3.0; }
    else if (final10 >= 6.5) { letter = 'C+'; gpa4 = 2.5; }
    else if (final10 >= 5.5) { letter = 'C'; gpa4 = 2.0; }
    else if (final10 >= 5.0) { letter = 'D+'; gpa4 = 1.5; }
    else if (final10 >= 4.0) { letter = 'D'; gpa4 = 1.0; }

    if (prevL) prevL.textContent = letter;
    if (prev4) prev4.textContent = `Hệ 4: ${gpa4.toFixed(1)}`;
}

window.openEditGradeModal = function(id) {
    const g = allGrades.find(item => item.id === id);
    if (!g) return;

    editingGradeId = id;
    document.getElementById('gradeModalTitle').textContent = `Chỉnh Sửa Điểm: ${g.subject_name} (${g.student_name})`;
    document.getElementById('gradeId').value = id;

    const stdSelect = document.getElementById('gradeStudentSelect');
    if (stdSelect) {
        stdSelect.value = g.student_id;
        document.getElementById('studentSelectGroup').style.display = 'none'; // Lock student on edit
    }

    document.getElementById('gradeSubjectName').value = g.subject_name || '';
    document.getElementById('gradeSubjectCode').value = g.subject_code || '';
    document.getElementById('gradeCredits').value = g.credits || 3;
    document.getElementById('scoreSoBuoiNghi').value = g.so_buoi_nghi || 0;

    document.getElementById('scoreChuyenCan').value = g.diem_chuyen_can !== null ? g.diem_chuyen_can : '';
    document.getElementById('scoreGiuaKy').value = g.diem_giua_ky !== null ? g.diem_giua_ky : '';
    document.getElementById('scoreCuoiKy').value = g.diem_cuoi_ky !== null ? g.diem_cuoi_ky : '';

    updateScorePreview();
    document.getElementById('gradeModal').classList.add('active');
};

async function saveGradeRecord() {
    const student_id = document.getElementById('gradeStudentSelect')?.value;
    const subject_name = document.getElementById('gradeSubjectName')?.value.trim();
    const subject_code = document.getElementById('gradeSubjectCode')?.value.trim();
    const credits = document.getElementById('gradeCredits')?.value;
    const so_buoi_nghi = document.getElementById('scoreSoBuoiNghi')?.value;

    const diem_chuyen_can = document.getElementById('scoreChuyenCan')?.value;
    const diem_giua_ky = document.getElementById('scoreGiuaKy')?.value;
    const diem_cuoi_ky = document.getElementById('scoreCuoiKy')?.value;

    const payload = {
        student_id: parseInt(student_id),
        subject_name,
        subject_code,
        credits: parseInt(credits) || 3,
        so_buoi_nghi: parseInt(so_buoi_nghi) || 0,
        diem_chuyen_can: diem_chuyen_can !== '' ? parseFloat(diem_chuyen_can) : null,
        diem_giua_ky: diem_giua_ky !== '' ? parseFloat(diem_giua_ky) : null,
        diem_cuoi_ky: diem_cuoi_ky !== '' ? parseFloat(diem_cuoi_ky) : null
    };

    const isEdit = Boolean(editingGradeId);
    const url = isEdit ? `/grades/${editingGradeId}` : '/grades';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message || (isEdit ? 'Cập nhật điểm thành công!' : 'Nhập điểm mới thành công!'), 'success');
            document.getElementById('gradeModal').classList.remove('active');
            await loadGradesData();
        } else {
            showToast(data.error || 'Lỗi lưu trữ điểm số', 'error');
        }
    } catch (e) {
        showToast('Lỗi mạng khi kết nối máy chủ', 'error');
    }
}

window.deleteGradeRecord = async function(id, name) {
    if (!currentUser || currentUser.role !== 2) {
        showToast('Chỉ Quản trị viên mới có quyền xóa bản ghi điểm', 'error');
        return;
    }
    if (!confirm(`Bạn có chắc muốn xóa bản ghi điểm môn "${name}" này không?`)) return;

    try {
        const res = await fetch(`/grades/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message || 'Đã xóa bản ghi điểm thành công!', 'success');
            await loadGradesData();
        } else {
            showToast(data.error || 'Lỗi khi xóa điểm', 'error');
        }
    } catch (e) {
        showToast('Lỗi mạng khi kết nối máy chủ', 'error');
    }
};

function exportGradesToCSV() {
    if (allGrades.length === 0) {
        showToast('Không có dữ liệu điểm để xuất file', 'warning');
        return;
    }
    const headers = ['STT', 'Mã Sinh Viên', 'Họ Và Tên', 'Lớp', 'Môn Học', 'Số Tín Chỉ', 'Chuyên Cần (10%)', 'Giữa Kỳ (30%)', 'Cuối Kỳ (60%)', 'Điểm Tổng Kết', 'Điểm Chữ', 'GPA Hệ 4', 'Trạng Thái'];
    const rows = allGrades.map((g, idx) => [
        idx + 1,
        `"${g.student_code || ''}"`,
        `"${g.student_name || ''}"`,
        `"${g.student_class || ''}"`,
        `"${g.subject_name || ''}"`,
        g.credits,
        g.diem_chuyen_can !== null ? g.diem_chuyen_can : '',
        g.diem_giua_ky !== null ? g.diem_giua_ky : '',
        g.diem_cuoi_ky !== null ? g.diem_cuoi_ky : '',
        g.diem_tong_ket !== null ? g.diem_tong_ket : '',
        `"${g.letter_grade || ''}"`,
        g.gpa4 !== null ? g.gpa4 : '',
        `"${g.status || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bang_Diem_Mon_Hoc_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đã xuất file bảng điểm Excel/CSV thành công!', 'success');
}
