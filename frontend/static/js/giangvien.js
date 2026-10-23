
let allLecturers = [];
let departmentsList = [];
let lecturerToDeleteId = null;


async function loadDepartments() {
    try {
        const res = await fetch('/bomon');
        if (res.ok) {
            departmentsList = await res.json();
            populateDepartmentDropdowns();
        }
    } catch (e) {
        console.error('Lỗi tải danh mục bộ môn:', e);
    }
}

function populateDepartmentDropdowns() {
    const filter = document.getElementById('classFilter');
    if (filter) {
        const currentVal = filter.value;
        filter.innerHTML = '<option value="ALL">Tất cả các bộ môn</option>' +
            departmentsList.map(b => `<option value="${b.id}">${b.bomon_code} - ${b.name}</option>`).join('');
        if (currentVal) filter.value = currentVal;
    }

    const select = document.getElementById('lecturerClass');
    if (select) {
        const cur = select.value;
        select.innerHTML = '<option value="">-- Chọn bộ môn --</option>' +
            departmentsList.map(b => `<option value="${b.id}">${b.bomon_code} - ${b.name}</option>`).join('');
        if (cur) select.value = cur;
    }
}


async function loadLecturers() {
    try {
        await loadDepartments();
        const res = await fetch('/lecturers');
        if (!res.ok) throw new Error('Không thể tải dữ liệu giảng viên');
        allLecturers = await res.json();
        updateStats();
        renderLecturers();
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}


function updateStats() {
    const total = allLecturers.length;
    const statTotalEl = document.getElementById('statTotalLecturers');
    if (statTotalEl) statTotalEl.textContent = total;

    const postgradCount = allLecturers.filter(l => {
        const ed = (l.education_level || '').toLowerCase();
        return ed.includes('tiến sĩ') || ed.includes('thạc sĩ') || ed.includes('phó giáo sư') || ed.includes('giáo sư') || ed.includes('ts') || ed.includes('ths');
    }).length;
    const postgradEl = document.getElementById('statPostgrad');
    if (postgradEl) postgradEl.textContent = postgradCount;

    const deptIds = new Set(allLecturers.map(l => l.department_id).filter(Boolean));
    const deptEl = document.getElementById('statTotalDepartments');
    if (deptEl) deptEl.textContent = deptIds.size;

    const withAcc = allLecturers.filter(l => Boolean(l.account_id) || Boolean(l.account_username)).length;
    const accEl = document.getElementById('statWithAccounts');
    if (accEl) accEl.textContent = withAcc;
}


function renderLecturers() {
    const searchInput = document.getElementById('searchInput');
    const classFilter = document.getElementById('classFilter');
    const rankFilter = document.getElementById('rankFilter');
    const sortByEl = document.getElementById('sortBy');

    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const classVal = classFilter ? classFilter.value : 'ALL';
    const rankVal = rankFilter ? rankFilter.value : 'ALL';
    const sortBy = sortByEl ? sortByEl.value : 'ID_DESC';

    let filtered = allLecturers.filter(s => {
        const nameMatch = (s.name || '').toLowerCase().includes(search);
        const codeMatch = (s.lecturer_code || '').toLowerCase().includes(search);
        const specMatch = (s.specialization || '').toLowerCase().includes(search);
        const deptNameMatch = (s.department_name || '').toLowerCase().includes(search);
        const matchesSearch = !search || nameMatch || codeMatch || specMatch || deptNameMatch;

        const matchesDept = (classVal === 'ALL') || (String(s.department_id) === String(classVal));

        let matchesRank = true;
        if (rankVal !== 'ALL') {
            const ed = (s.education_level || '').toLowerCase();
            if (rankVal === 'DOC') {
                matchesRank = ed.includes('tiến sĩ') || ed.includes('phó giáo sư') || ed.includes('giáo sư') || ed.includes('ts');
            } else if (rankVal === 'MAS') {
                matchesRank = ed.includes('thạc sĩ') || ed.includes('ths');
            } else if (rankVal === 'OTH') {
                matchesRank = !ed.includes('tiến sĩ') && !ed.includes('thạc sĩ');
            }
        }

        return matchesSearch && matchesDept && matchesRank;
    });


    filtered.sort((a, b) => {
        if (sortBy === 'ID_DESC') return b.id - a.id;
        if (sortBy === 'NAME_ASC') return (a.name || '').localeCompare(b.name || '', 'vi');
        if (sortBy === 'CODE_ASC') return (a.lecturer_code || '').localeCompare(b.lecturer_code || '');
        return 0;
    });

    const tbody = document.getElementById('lecturerTableBody');
    const empty = document.getElementById('emptyState');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    const isAdmin = currentUser && currentUser.role === 2;

    if (empty) empty.style.display = 'none';
    tbody.innerHTML = filtered.map(s => {
        const initials = getInitials(s.name);
        const avatarBg = getAvatarGradient(s.name);
        const dept = departmentsList.find(b => b.id === s.department_id);
        const deptDisplayName = s.department_name || (dept ? dept.name : (s.department_id ? `Bộ môn #${s.department_id}` : 'Chưa phân bộ môn'));

        return `
            <tr>
                <td>
                    <strong style="color: var(--text-dim); font-size: 13px;">${s.lecturer_code || 'Chưa có'}</strong>
                </td>
                <td>
                    <div class="lecturer-info">
                        <div class="avatar" style="background: ${avatarBg};">${initials}</div>
                        <div>
                            <div class="lecturer-name">${s.name}</div>
                            <div class="lecturer-id">${s.gender || ''} ${s.phone ? `<span style="font-size: 11px; color: var(--text-muted);"><i class="fa-solid fa-phone"></i> ${s.phone}</span>` : ''}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-size: 13px;">
                        <div><i class="fa-solid fa-envelope" style="color: var(--text-muted);"></i> ${s.email || 'Chưa có email'}</div>
                        <div style="margin-top: 5px;">
                            ${s.account_username ? `
                                <span class="score-good" style="padding: 2px 8px; border-radius: 10px; font-size: 11px;" title="Tài khoản đăng nhập">
                                    <i class="fa-solid fa-user-check"></i> TK: <strong>${s.account_username}</strong>
                                </span>
                            ` : (isAdmin ? `
                                <button class="btn-secondary" style="padding: 2px 8px; font-size: 11px; color: var(--primary); border-color: rgba(99, 102, 241, 0.4);" onclick="quickCreateLecturerAccount(${s.id}, '${s.name.replace(/'/g, "\\'")}', '${s.lecturer_code || ''}')" title="Cấp ngay tài khoản đăng nhập cho giảng viên này">
                                    <i class="fa-solid fa-key"></i> Cấp tài khoản
                                </button>
                            ` : '')}
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge-class"><i class="fa-solid fa-building" style="margin-right: 4px; color: var(--primary);"></i> ${deptDisplayName}</span>
                </td>
                <td>
                    <span style="font-size: 13px; font-weight: 500;">
                        ${s.specialization || "Chưa cập nhật"}
                    </span>
                    ${s.research_direction ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;"><i class="fa-solid fa-microscope"></i> ${s.research_direction}</div>` : ''}
                    <div style="margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap;">
                        <a href="/doan?search=${encodeURIComponent(s.name)}" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-ictu-50 text-ictu-700 border border-ictu-200 hover:bg-ictu-100 transition-colors" title="Xem các đồ án giảng viên đang hướng dẫn">
                            <span class="material-symbols-outlined text-[13px]">school</span>
                            <span>HD: ${s.supervised_count || 0} ĐA</span>
                        </a>
                        <a href="/doan?search=${encodeURIComponent(s.name)}" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors" title="Xem các đồ án giảng viên phản biện">
                            <span class="material-symbols-outlined text-[13px]">rate_review</span>
                            <span>PB: ${s.reviewed_count || 0} ĐA</span>
                        </a>
                    </div>
                </td>
                <td>
                    <span class="score-good" style="padding: 2px 8px; border-radius: 10px; font-size: 12px;">
                        <i class="fa-solid fa-graduation-cap"></i> ${s.education_level || "Chưa cập nhật"}
                    </span>
                </td>
                ${isAdmin ? `
                <td style="text-align: right;">
                    <div class="action-btns" style="justify-content: flex-end;">
                        <button class="btn-action edit" onclick="editLecturer(${s.id})" title="Chỉnh sửa" aria-label="Sửa giảng viên ${s.name}">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-action delete" onclick="openDeleteModal(${s.id}, '${s.name.replace(/'/g, "\\'")}')" title="Xóa" aria-label="Xóa giảng viên ${s.name}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
                ` : '<td class="admin-only" style="text-align: right;"></td>'}
            </tr>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentUser();
    const lecturerModal = document.getElementById('lecturerModal');
    const lecturerForm = document.getElementById('lecturerForm');
    const deleteModal = document.getElementById('deleteConfirmModal');

    const scoreInput = document.getElementById('lecturerScore');
    if (scoreInput) {
        scoreInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const preview = document.getElementById('scoreRatingPreview');
            if (!preview) return;
            if (isNaN(val) || val < 0 || val > 10) {
                preview.textContent = 'Điểm không hợp lệ (0-10)';
                preview.style.color = 'var(--danger)';
            } else {
                const rank = getAcademicRank(val);
                preview.textContent = `${rank.label} (${val.toFixed(1)})`;
                preview.style.color = val >= 8 ? 'var(--success)' : (val >= 6.5 ? 'var(--info)' : (val >= 5 ? 'var(--warning)' : 'var(--danger)'));
            }
        });
    }

    const openAddBtn = document.getElementById('openAddModalBtn');
    if (openAddBtn) {
        openAddBtn.addEventListener('click', () => {
            document.getElementById('modalTitle').textContent = 'Thêm Giảng Viên Mới';
            document.getElementById('lecturerId').value = '';
            lecturerForm.reset();
            const statusContainer = document.getElementById('lecturerAccountStatusContainer') || document.getElementById('accountStatusContainer');
            if (statusContainer) {
                statusContainer.innerHTML = `
                    <label style="display: flex; align-items: center; gap: 8px; font-weight: 500; cursor: pointer; margin: 0;">
                        <input type="checkbox" id="autoCreateAccountCheckbox" checked style="width: 16px; height: 16px;">
                        <span>Tự động cấp tài khoản đăng nhập (Tên đăng nhập & Mật khẩu theo Mã GV)</span>
                    </label>
                `;
            }
            document.getElementById('lecturerAccountId').value = '';
            const sp = document.getElementById('scoreRatingPreview');
            if (sp) sp.textContent = '--';
            lecturerModal.classList.add('active');
        });
    }

    function closeModal() {
        if (lecturerModal) lecturerModal.classList.remove('active');
    }

    const modalCloseBtn = document.getElementById('modalCloseBtn');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);

    if (lecturerForm) {
        lecturerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('lecturerId').value;
            const name = document.getElementById('lecturerName').value.trim();
            const class_name = document.getElementById('lecturerClass').value.trim();
            const score = document.getElementById('lecturerScore').value.trim();
            const lecturer_code = document.getElementById('lecturerCode').value.trim() || null;
            const gender = document.getElementById('lecturerGender').value || null;
            const email = document.getElementById('lecturerEmail').value.trim() || null;
            const phone = document.getElementById('lecturerPhone')?.value.trim() || null;
            const research_direction = document.getElementById('lecturerResearch').value.trim() || null;
            const education_level = document.getElementById('lecturerEducation').value.trim() || null;
            const account_id = document.getElementById('lecturerAccountId').value ? parseInt(document.getElementById('lecturerAccountId').value) : null;

            if (!name || !class_name || !score) {
                showToast('Vui lòng kiểm tra lại thông tin hợp lệ!', 'error');
                return;
            }

            const auto_create_account = (document.getElementById('autoCreateAccountCheckbox') || document.getElementById('autoCreateLecturerAccountCheckbox'))?.checked || false;
            const deptId = class_name ? parseInt(class_name) : null;

            const payload = {
                name,
                department_id: deptId,
                class: class_name,
                specialization: score,
                score,
                lecturer_code,
                gender,
                email,
                phone,
                research_direction,
                education_level,
                account_id,
                auto_create_account
            };

            const submitBtn = lecturerForm.querySelector('button[type="submit"]');
            const origHtml = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
            }

            try {
                let res;
                if (id) {
                    res = await fetch(`/lecturers/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    res = await fetch('/lecturers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                const resData = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(resData.error || resData.message || 'Thao tác không thành công');
                }

                showToast(id ? 'Đã cập nhật giảng viên thành công!' : 'Đã thêm giảng viên thành công!', 'success');
                closeModal();
                loadLecturers();
            } catch (err) {
                console.error(err);
                showToast(err.message, 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origHtml;
                }
            }
        });
    }

    function closeDeleteModal() {
        if (deleteModal) deleteModal.classList.remove('active');
        lecturerToDeleteId = null;
    }

    const delCloseBtn = document.getElementById('deleteModalCloseBtn');
    if (delCloseBtn) delCloseBtn.addEventListener('click', closeDeleteModal);
    const delCancelBtn = document.getElementById('deleteCancelBtn');
    if (delCancelBtn) delCancelBtn.addEventListener('click', closeDeleteModal);

    const confirmDelBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDelBtn) {
        confirmDelBtn.addEventListener('click', async () => {
            if (!lecturerToDeleteId) return;
            try {
                const res = await fetch(`/lecturers/${lecturerToDeleteId}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Không thể xóa giảng viên');
                showToast('Đã xóa giảng viên thành công!', 'info');
                closeDeleteModal();
                loadLecturers();
            } catch (err) {
                console.error(err);
                showToast(err.message, 'error');
            }
        });
    }

    const searchEl = document.getElementById('searchInput');
    if (searchEl) searchEl.addEventListener('input', renderLecturers);
    const classF = document.getElementById('classFilter');
    if (classF) classF.addEventListener('change', renderLecturers);
    const rankF = document.getElementById('rankFilter');
    if (rankF) rankF.addEventListener('change', renderLecturers);
    const sortF = document.getElementById('sortBy');
    if (sortF) sortF.addEventListener('change', renderLecturers);

    loadLecturers();
    checkHealth();
    setInterval(checkHealth, 15000);
});

window.editLecturer = function(id) {
    const s = allLecturers.find(item => item.id === id);
    if (!s) return;

    document.getElementById('modalTitle').textContent = `Chỉnh Sửa Giảng Viên #${s.id}`;
    document.getElementById('lecturerId').value = s.id;
    document.getElementById('lecturerName').value = s.name;
    document.getElementById('lecturerClass').value = s.department_id || '';
    document.getElementById('lecturerScore').value = s.specialization || '';
    document.getElementById('lecturerCode').value = s.lecturer_code || '';
    if (document.getElementById('lecturerPhone')) document.getElementById('lecturerPhone').value = s.phone || '';
    document.getElementById('lecturerGender').value = s.gender || '';
    document.getElementById('lecturerEmail').value = s.email || '';
    document.getElementById('lecturerResearch').value = s.research_direction || '';
    document.getElementById('lecturerEducation').value = s.education_level || '';
    const statusContainer = document.getElementById('lecturerAccountStatusContainer') || document.getElementById('accountStatusContainer');
    if (statusContainer) {
        if (s.account_username) {
            statusContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <i class="fa-solid fa-circle-check" style="color: var(--success); font-size: 15px;"></i>
                        <span style="font-size: 13px; margin-left: 6px;">Đã liên kết tài khoản: <strong>${s.account_username}</strong></span>
                    </div>
                    <button type="button" class="btn-secondary" style="font-size: 11px; padding: 3px 8px; color: var(--danger); border-color: rgba(239, 68, 68, 0.4);" onclick="unlinkLecturerAccount(${s.id})">
                        <i class="fa-solid fa-link-slash"></i> Hủy liên kết
                    </button>
                </div>
            `;
        } else {
            statusContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-muted); font-size: 13px;"><i class="fa-solid fa-circle-xmark" style="color: var(--warning);"></i> Chưa có tài khoản đăng nhập</span>
                    <button type="button" class="btn-primary" style="font-size: 12px; padding: 4px 10px;" onclick="quickCreateLecturerAccount(${s.id}, '${s.name.replace(/'/g, "\\'")}', '${s.lecturer_code || ''}')">
                        <i class="fa-solid fa-key"></i> Cấp tài khoản ngay
                    </button>
                </div>
            `;
        }
    }

    const modal = document.getElementById('lecturerModal');
    if (modal) modal.classList.add('active');
};

window.quickCreateLecturerAccount = async function(id, name, code) {
    if (!confirm(`Xác nhận cấp tài khoản đăng nhập cho giảng viên "${name}" (Tên đăng nhập & Mật khẩu mặc định là "${code || 'Mã GV'}")?`)) return;
    try {
        const res = await fetch(`/lecturers/${id}/create_account`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message || 'Cấp tài khoản giảng viên thành công!', 'success');
            loadLecturers();
            const modal = document.getElementById('lecturerModal');
            if (modal && modal.classList.contains('active')) {
                editLecturer(id);
            }
        } else {
            showToast(data.error || 'Cấp tài khoản thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi mạng', 'error');
    }
};

window.unlinkLecturerAccount = async function(id) {
    if (!confirm('Bạn có chắc muốn hủy liên kết tài khoản này khỏi hồ sơ giảng viên không?')) return;
    try {
        const res = await fetch(`/lecturers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account_id: null })
        });
        if (res.ok) {
            showToast('Đã hủy liên kết tài khoản giảng viên', 'success');
            loadLecturers();
            editLecturer(id);
        } else {
            showToast('Lỗi khi hủy liên kết', 'error');
        }
    } catch (e) {
        showToast('Lỗi mạng', 'error');
    }
};

window.openDeleteModal = function(id, name) {
    lecturerToDeleteId = id;
    const nameEl = document.getElementById('deleteLecturerName');
    if (nameEl) nameEl.textContent = name;
    const idEl = document.getElementById('deleteLecturerId');
    if (idEl) idEl.textContent = id;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.classList.add('active');
};

window.quickCreateLecturerAccount = async function(id, name, code) {
    const defaultUsername = (code || `gv${id}`).toLowerCase().trim();
    const promptMsg = `Cấp tài khoản đăng nhập cho giảng viên "${name}":\n\nNhập tên đăng nhập:`;
    const inputUsername = prompt(promptMsg, defaultUsername);
    if (inputUsername === null) return;
    const username = inputUsername.trim() || defaultUsername;

    try {
        const res = await fetch(`/lecturers/${id}/create_account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message || 'Cấp tài khoản thành công!', 'success');
            loadLecturers();
        } else {
            showToast(data.error || 'Lỗi khi cấp tài khoản', 'error');
        }
    } catch (e) {
        showToast('Lỗi máy chủ khi cấp tài khoản', 'error');
    }
};
