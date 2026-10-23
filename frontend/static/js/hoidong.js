let councilsList = [];
let facultiesList = [];
let lecturersList = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentUser();
    await loadFacultiesAndLecturers();

    // Hỗ trợ lọc theo mã hội đồng từ URL query ?code=
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if (codeParam) {
        const searchInput = document.getElementById('councilSearchInput');
        if (searchInput) searchInput.value = codeParam;
    }

    if (currentUser && (currentUser.role === 0 || currentUser.role === 1)) {
        loadMyCouncils();
    }

    loadCouncils();
    setupEventListeners();
});

async function loadMyCouncils() {
    const section = document.getElementById('myCouncilSection');
    const content = document.getElementById('myCouncilContent');
    const title = document.getElementById('myCouncilTitle');
    if (!section || !content) return;

    try {
        const res = await fetch('/councils/my');
        if (!res.ok) return;
        const data = await res.json();

        if (currentUser.role === 0) {
            // Sinh viên
            if (data.council) {
                const c = data.council;
                section.style.display = 'block';
                if (title) title.textContent = 'Hội Đồng Bảo Vệ Của Bạn';
                content.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                        <div class="space-y-1.5">
                            <div><strong class="text-slate-900">${c.name}</strong> <span class="font-mono text-ictu-600 font-bold">(${c.council_code})</span></div>
                            <div class="text-slate-600"><span class="font-bold text-slate-700">Khoa:</span> ${c.faculty_name || 'N/A'}</div>
                            <div class="text-slate-600"><span class="font-bold text-slate-700">Lịch bảo vệ:</span> <span class="text-indigo-600 font-bold">${c.defense_date || 'Chưa công bố'}</span> tại <span class="font-semibold text-slate-800">${c.location || 'Chưa xếp phòng'}</span></div>
                        </div>
                        <div class="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-100 md:pl-4">
                            <div class="font-bold text-slate-800 mb-1">Hội đồng chấm thi:</div>
                            <div class="text-slate-600 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-ictu-500"></span><strong class="text-slate-700">Chủ tịch:</strong> ${c.member1_name || 'N/A'}</div>
                            <div class="text-slate-600 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span><strong class="text-slate-700">Thư ký:</strong> ${c.member2_name || 'N/A'}</div>
                            <div class="text-slate-600 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><strong class="text-slate-700">Ủy viên:</strong> ${c.member3_name || 'N/A'}</div>
                        </div>
                    </div>
                `;
            }
        } else if (currentUser.role === 1) {
            // Giảng viên
            if (data.councils && data.councils.length > 0) {
                section.style.display = 'block';
                if (title) title.textContent = `Hội Đồng Bạn Tham Gia Chấm Thi (${data.councils.length})`;
                content.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        ${data.councils.map(c => `
                            <div class="p-3.5 rounded-xl border border-ictu-200/80 bg-ictu-50/40 space-y-2">
                                <div class="flex items-center justify-between">
                                    <span class="font-mono font-bold text-ictu-700">${c.council_code}</span>
                                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ictu-100 text-ictu-800">${c.projects_count || 0} Đồ án</span>
                                </div>
                                <div class="font-bold text-slate-900 line-clamp-1">${c.name}</div>
                                <div class="text-[11px] text-slate-600 flex items-center gap-1">
                                    <span class="material-symbols-outlined text-[14px] text-slate-400">calendar_month</span>
                                    <span>${c.defense_date || 'Chưa xếp'} (${c.location || 'Chưa xếp phòng'})</span>
                                </div>
                                <div class="pt-2 border-t border-ictu-100 flex items-center justify-between gap-2">
                                    <button onclick="openCouncilProjectsModal(${c.id})" class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition-colors">Xem đề tài</button>
                                    <a href="/diem?council_id=${c.id}" class="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-colors flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">grade</span>Chấm điểm</a>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }
    } catch (e) {
        console.warn('Lỗi tải hội đồng của tôi:', e);
    }
}

async function loadFacultiesAndLecturers() {
    try {
        const [facRes, lecRes] = await Promise.all([
            fetch('/khoa'),
            fetch('/lecturers')
        ]);
        if (facRes.ok) facultiesList = await facRes.json();
        if (lecRes.ok) lecturersList = await lecRes.json();

        const facFilter = document.getElementById('facultyFilter');
        const facSelect = document.getElementById('councilFacultySelect');
        if (facFilter) {
            facFilter.innerHTML = '<option value="">Tất cả các khoa</option>';
            facultiesList.forEach(f => {
                facFilter.innerHTML += `<option value="${f.id}">${f.name}</option>`;
            });
        }
        if (facSelect) {
            facSelect.innerHTML = '<option value="">-- Chọn khoa --</option>';
            facultiesList.forEach(f => {
                facSelect.innerHTML += `<option value="${f.id}">${f.name} (${f.khoa_code})</option>`;
            });
        }

        populateMemberSelects();
    } catch (e) {
        console.warn('Lỗi tải danh mục:', e);
    }
}

function populateMemberSelects() {
    ['member1Select', 'member2Select', 'member3Select'].forEach((id, idx) => {
        const sel = document.getElementById(id);
        if (!sel) return;
        sel.innerHTML = `<option value="">-- Chọn giảng viên ${idx + 1} --</option>`;
        lecturersList.forEach(l => {
            sel.innerHTML += `<option value="${l.id}">${l.name} (${l.lecturer_code || 'GV'})</option>`;
        });
    });
}

async function loadCouncils() {
    const tbody = document.getElementById('councilsTableBody');
    const search = document.getElementById('councilSearchInput')?.value.trim() || '';
    const facultyId = document.getElementById('facultyFilter')?.value || '';

    let url = `/councils?name=${encodeURIComponent(search)}`;
    if (facultyId) url += `&faculty_id=${encodeURIComponent(facultyId)}`;

    try {
        const res = await fetch(url);
        if (!res.ok) return;
        councilsList = await res.json();
        updateCouncilStats();

        if (councilsList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="px-6 py-8 text-center text-slate-400">Không tìm thấy hội đồng nào.</td></tr>';
            return;
        }

        const isAdmin = currentUser && currentUser.role === 2;
        const canGrade = currentUser && (currentUser.role === 1 || currentUser.role === 2);

        tbody.innerHTML = councilsList.map(c => {
            const pCount = c.projects_count || (c.projects ? c.projects.length : 0);
            const projectsBtn = pCount > 0
                ? `<div class="flex items-center justify-center gap-1.5"><button onclick="openCouncilProjectsModal(${c.id})" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-ictu-50 text-ictu-700 border border-ictu-200 hover:bg-ictu-100 transition-colors" title="Xem danh sách đề tài bảo vệ"><span class="material-symbols-outlined text-[13px]">assignment</span><span>${pCount} đề tài</span></button>${canGrade ? `<a href="/diem?council_id=${c.id}" class="inline-flex items-center p-1 rounded-full text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors" title="Chấm điểm các đề tài"><span class="material-symbols-outlined text-[14px]">grade</span></a>` : ''}</div>`
                : '<span class="text-slate-400 text-xs italic">Chưa gán</span>';

            return `
                <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-6 py-3.5 font-mono text-xs font-bold text-slate-600">${c.council_code}</td>
                    <td class="px-6 py-3.5 font-bold text-slate-900">${c.name}</td>
                    <td class="px-6 py-3.5 font-medium text-slate-700">${c.faculty_name || 'N/A'}</td>
                    <td class="px-6 py-3.5 text-xs text-slate-600 whitespace-nowrap">${c.defense_date ? `<span class="inline-flex items-center gap-1 font-semibold text-slate-700"><span class="material-symbols-outlined text-[14px] text-slate-400">calendar_today</span>${c.defense_date}</span>` : '<span class="text-slate-400">--</span>'}</td>
                    <td class="px-6 py-3.5 text-xs text-slate-600">${c.location ? `<span class="inline-flex items-center gap-1 font-medium text-slate-800"><span class="material-symbols-outlined text-[14px] text-slate-400">room</span>${c.location}</span>` : '<span class="text-slate-400">--</span>'}</td>
                    <td class="px-6 py-3.5 text-xs text-slate-700">${c.member1_name || 'N/A'}</td>
                    <td class="px-6 py-3.5 text-xs text-slate-700">${c.member2_name || 'N/A'}</td>
                    <td class="px-6 py-3.5 text-xs text-slate-700">${c.member3_name || 'N/A'}</td>
                    <td class="px-6 py-3.5 text-center">${projectsBtn}</td>
                    ${isAdmin ? `
                        <td class="px-6 py-3.5 text-right whitespace-nowrap">
                            <div class="flex items-center justify-end gap-1.5">
                                <button class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-ictu-600 hover:text-ictu-700 transition-all shadow-xs" onclick="openEditCouncilModal(${c.id})" title="Chỉnh sửa"><span class="material-symbols-outlined text-[16px]">edit</span></button>
                                <button class="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all shadow-xs" onclick="deleteCouncil(${c.id})" title="Xóa"><span class="material-symbols-outlined text-[16px]">delete</span></button>
                            </div>
                        </td>
                    ` : '<td class="px-6 py-3.5 text-slate-400 text-center admin-only">--</td>'}
                </tr>
            `;
        }).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-6 py-8 text-center text-rose-500">Lỗi tải dữ liệu hội đồng</td></tr>';
    }
}

function updateCouncilStats() {
    const totalEl = document.getElementById('statTotalCouncils');
    const itEl = document.getElementById('statITCouncils');
    const assignedEl = document.getElementById('statAssignedProjects');
    const locEl = document.getElementById('statLocationsCount');

    if (totalEl) totalEl.textContent = councilsList.length;

    if (itEl) {
        itEl.textContent = councilsList.filter(c => {
            const fac = (c.faculty_name || '').toLowerCase();
            return fac.includes('công nghệ thông tin') || fac.includes('cntt');
        }).length;
    }

    if (assignedEl) {
        const totalProjects = councilsList.reduce((acc, c) => acc + (c.projects_count || (c.projects ? c.projects.length : 0)), 0);
        assignedEl.textContent = totalProjects;
    }

    if (locEl) {
        const uniqueLocs = new Set(councilsList.map(c => (c.location || '').trim()).filter(Boolean));
        locEl.textContent = uniqueLocs.size;
    }
}

window.openCouncilProjectsModal = function(id) {
    const c = councilsList.find(item => item.id === id);
    if (!c) return;

    const modal = document.getElementById('councilProjectsModal');
    const titleEl = document.getElementById('councilProjectsModalTitle');
    const listEl = document.getElementById('councilProjectsList');
    const shortcutEl = document.getElementById('councilGradingShortcut');

    if (titleEl) titleEl.textContent = `Đề Tài Thuộc Hội Đồng ${c.council_code} - ${c.name}`;

    const projects = c.projects || [];
    if (projects.length === 0) {
        listEl.innerHTML = '<p class="text-xs text-slate-400 py-4 text-center">Hội đồng này hiện chưa được gán đồ án tốt nghiệp nào.</p>';
    } else {
        listEl.innerHTML = projects.map((p, idx) => `
            <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-colors flex items-center justify-between gap-3">
                <div class="space-y-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-mono text-xs font-bold text-ictu-600">${p.project_code || 'DA' + p.id}</span>
                        <h4 class="text-xs font-bold text-slate-900 truncate">${p.name}</h4>
                    </div>
                    <div class="text-[11px] text-slate-500 flex items-center gap-3">
                        <span><strong>SV:</strong> ${p.student_name || 'N/A'} (${p.student_code || ''})</span>
                        <span><strong>GVHD:</strong> ${p.lecturer_name || 'Chưa có'}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <a href="/diem?project_id=${p.id}" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs" title="Vào bảng điểm đồ án">
                        <span class="material-symbols-outlined text-[14px]">grade</span>
                        <span>Chấm Điểm</span>
                    </a>
                </div>
            </div>
        `).join('');
    }

    if (shortcutEl) {
        shortcutEl.innerHTML = `<a href="/diem?council_id=${c.id}" class="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700"><span class="material-symbols-outlined text-[16px]">grade</span>Chấm điểm tất cả đề tài trong hội đồng này</a>`;
    }

    modal?.classList.add('active');
};

window.exportCouncilsToCsv = function() {
    if (!councilsList || councilsList.length === 0) {
        showToast('Không có dữ liệu hội đồng để xuất', 'error');
        return;
    }
    const headers = ['Mã HĐ', 'Tên Hội Đồng', 'Khoa', 'Ngày Bảo Vệ', 'Địa Điểm', 'Thành Viên 1 (Chủ Tịch)', 'Thành Viên 2 (Thư Ký)', 'Thành Viên 3 (Ủy Viên)', 'Số Lượng Đề Tài'];
    const rows = councilsList.map(c => [
        `"${c.council_code || ''}"`,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.faculty_name || '').replace(/"/g, '""')}"`,
        `"${c.defense_date || ''}"`,
        `"${(c.location || '').replace(/"/g, '""')}"`,
        `"${(c.member1_name || '').replace(/"/g, '""')}"`,
        `"${(c.member2_name || '').replace(/"/g, '""')}"`,
        `"${(c.member3_name || '').replace(/"/g, '""')}"`,
        `"${c.projects_count || (c.projects ? c.projects.length : 0)}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh_sach_hoi_dong_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Xuất tệp CSV thành công!', 'success');
};

function setupEventListeners() {
    document.getElementById('councilSearchInput')?.addEventListener('input', debounce(loadCouncils, 300));
    document.getElementById('facultyFilter')?.addEventListener('change', loadCouncils);
    document.getElementById('exportCouncilsBtn')?.addEventListener('click', window.exportCouncilsToCsv);

    const closeProjBtn = document.getElementById('closeCouncilProjectsModalBtn');
    const closeProjBottomBtn = document.getElementById('closeCouncilProjectsBottomBtn');
    const projModal = document.getElementById('councilProjectsModal');
    closeProjBtn?.addEventListener('click', () => projModal?.classList.remove('active'));
    closeProjBottomBtn?.addEventListener('click', () => projModal?.classList.remove('active'));

    const openAddBtn = document.getElementById('openAddCouncilModalBtn');
    const modal = document.getElementById('councilModal');
    const closeBtn = document.getElementById('closeCouncilModalBtn');
    const cancelBtn = document.getElementById('cancelCouncilModalBtn');

    openAddBtn?.addEventListener('click', () => {
        document.getElementById('councilId').value = '';
        document.getElementById('councilModalTitle').textContent = 'Thêm Mới Hội Đồng Bảo Vệ';
        document.getElementById('councilForm')?.reset();
        modal?.classList.add('active');
    });

    closeBtn?.addEventListener('click', () => modal?.classList.remove('active'));
    cancelBtn?.addEventListener('click', () => modal?.classList.remove('active'));

    document.getElementById('councilForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('councilId').value;
        const council_code = document.getElementById('councilCodeInput').value.trim();
        const name = document.getElementById('councilNameInput').value.trim();
        const faculty_id = document.getElementById('councilFacultySelect').value;
        const defense_date = document.getElementById('councilDefenseDate').value;
        const location = document.getElementById('councilLocation').value.trim();
        const member1_id = document.getElementById('member1Select').value;
        const member2_id = document.getElementById('member2Select').value;
        const member3_id = document.getElementById('member3Select').value;


        if (member1_id === member2_id || member2_id === member3_id || member1_id === member3_id) {
            showToast('3 giảng viên thành viên trong hội đồng không được trùng nhau!', 'error');
            return;
        }

        const payload = {
            council_code, name, faculty_id, defense_date, location, member1_id, member2_id, member3_id
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/councils/${id}` : '/councils';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                showToast(id ? 'Cập nhật hội đồng thành công!' : 'Thêm mới hội đồng thành công!', 'success');
                modal?.classList.remove('active');
                loadCouncils();
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
