let usersList = [];

function layTenVietTat(hoTen) {
    if (!hoTen) return 'ND';
    const words = hoTen.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
    }
    return hoTen.substring(0, 2).toUpperCase();
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentUser();
    if (!currentUser || currentUser.role !== 2) {
        showToast('Bạn không có quyền truy cập trang Quản trị tài khoản', 'error');
        setTimeout(() => window.location.href = '/', 1000);
        return;
    }
    loadUsers();
    setupEventListeners();
});

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    const search = document.getElementById('userSearchInput')?.value.trim() || '';
    const role = document.getElementById('roleFilter')?.value || '';

    let url = `/users?username=${encodeURIComponent(search)}`;
    if (role !== '') url += `&role=${encodeURIComponent(role)}`;

    try {
        const res = await fetch(url);
        if (!res.ok) return;
        usersList = await res.json();


        capNhatKpiCards(usersList);

        if (usersList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;"><i class="fa-solid fa-user-slash" style="font-size: 28px; margin-bottom: 8px; display: block;"></i>Không tìm thấy tài khoản người dùng phù hợp.</td></tr>';
            return;
        }

        const roleBadges = {
            0: '<span class="score-average" style="padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;"><i class="fa-solid fa-graduation-cap"></i> Sinh viên (0)</span>',
            1: '<span class="score-good" style="padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;"><i class="fa-solid fa-chalkboard-user"></i> Giảng viên (1)</span>',
            2: '<span class="score-excellent" style="padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;"><i class="fa-solid fa-shield-halved"></i> Quản trị viên (2)</span>'
        };

        const avatarGradients = [
            'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            'linear-gradient(135deg, #10b981, #047857)',
            'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            'linear-gradient(135deg, #f59e0b, #b45309)',
            'linear-gradient(135deg, #ec4899, #be185d)'
        ];

        tbody.innerHTML = usersList.map((u, idx) => {
            const isMe = currentUser && currentUser.id === u.id;
            const initials = layTenVietTat(u.full_name || u.username);
            const avatarBg = avatarGradients[idx % avatarGradients.length];
            const isLocked = u.status === 'Khoa';

            let unitDisplay = '';
            if (u.role === 2) {
                unitDisplay = '<span style="color: var(--text-muted); font-size: 12px;"><i class="fa-solid fa-shield"></i> Hệ thống Quản trị</span>';
            } else if (u.unit_info) {
                unitDisplay = `<span class="score-good" style="padding: 2px 8px; border-radius: 10px; font-size: 11px;"><i class="fa-solid fa-link"></i> ${u.unit_info}</span>`;
            } else if (u.linked_profile) {
                unitDisplay = `<span class="score-good" style="padding: 2px 8px; border-radius: 10px; font-size: 11px;"><i class="fa-solid fa-link"></i> ${u.linked_profile}</span>`;
            } else {
                const targetPage = u.role === 0 ? 'Sinh viên' : 'Giảng viên';
                unitDisplay = `<span class="score-poor" style="padding: 2px 8px; border-radius: 10px; font-size: 11px;" title="Vào trang ${targetPage} để liên kết mã #${u.id}"><i class="fa-solid fa-triangle-exclamation"></i> Chưa liên kết</span>`;
            }

            const statusBadge = isLocked
                ? '<span class="score-poor" style="padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;"><i class="fa-solid fa-lock"></i> Bị khóa</span>'
                : '<span class="score-excellent" style="padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Hoạt động</span>';

            const toggleStatusBtn = !isMe ? (
                isLocked
                    ? `<button class="btn-secondary" style="padding: 4px 10px; font-size: 12px; margin-right: 6px; color: var(--success); border-color: rgba(16, 185, 129, 0.4);" onclick="toggleUserStatus(${u.id}, 'HoatDong')" title="Mở khóa tài khoản"><i class="fa-solid fa-lock-open"></i> Mở khóa</button>`
                    : `<button class="btn-secondary" style="padding: 4px 10px; font-size: 12px; margin-right: 6px; color: var(--warning); border-color: rgba(245, 158, 11, 0.4);" onclick="toggleUserStatus(${u.id}, 'Khoa')" title="Khóa tạm thời tài khoản"><i class="fa-solid fa-lock"></i> Khóa</button>`
            ) : '';

            return `
                <tr style="${isLocked ? 'opacity: 0.75;' : ''}">
                    <td><code>#${u.id}</code></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 34px; height: 34px; border-radius: 50%; background: ${avatarBg}; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                                ${initials}
                            </div>
                            <div>
                                <div style="font-weight: 700; color: var(--text-main); font-size: 13px;">${u.full_name || u.username}</div>
                                <div style="font-size: 11px; color: var(--text-muted); font-family: monospace;">
                                    @${u.username} ${isMe ? '<span style="color: var(--primary); font-weight: bold;">(Bạn)</span>' : ''}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>${roleBadges[u.role] || u.role}</td>
                    <td>${unitDisplay}</td>
                    <td>${u.email ? `<code style="font-size: 12px;">${u.email}</code>` : '<span style="color: var(--text-dim); font-size: 11px; font-style: italic;">Chưa có email</span>'}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
                            <button class="btn-secondary" style="padding: 4px 10px; font-size: 12px; margin-right: 2px; color: var(--primary); border-color: rgba(99, 102, 241, 0.4);" onclick="openEditUserModal(${u.id})" title="Chỉnh sửa tài khoản">
                                <i class="fa-solid fa-pen-to-square"></i> Sửa
                            </button>
                            <button class="btn-secondary" style="padding: 4px 10px; font-size: 12px; margin-right: 2px;" onclick="resetUserPassword(${u.id}, '${u.username}')" title="Đặt lại mật khẩu về mặc định (chính là tên đăng nhập)">
                                <i class="fa-solid fa-rotate-left"></i> Đặt lại MK
                            </button>
                            ${toggleStatusBtn}
                            ${!isMe ? `
                                <button class="btn-secondary" style="padding: 4px 10px; font-size: 12px; color: var(--danger); border-color: rgba(239, 68, 68, 0.4);" onclick="deleteUserAccount(${u.id}, '${u.username}')" title="Xóa tài khoản">
                                    <i class="fa-solid fa-trash"></i> Xóa
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7" style="color: var(--danger); text-align: center; padding: 24px;">Lỗi tải dữ liệu tài khoản từ máy chủ.</td></tr>';
    }
}

function capNhatKpiCards(users) {
    const elTotal = document.getElementById('kpiTotalUsers');
    const elStudent = document.getElementById('kpiStudentUsers');
    const elLecturer = document.getElementById('kpiLecturerUsers');
    const elAdmin = document.getElementById('kpiAdminUsers');

    if (elTotal) elTotal.textContent = users.length;
    if (elStudent) elStudent.textContent = users.filter(u => u.role === 0).length;
    if (elLecturer) elLecturer.textContent = users.filter(u => u.role === 1).length;
    if (elAdmin) elAdmin.textContent = users.filter(u => u.role === 2).length;
}

window.toggleUserStatus = async function(id, newStatus) {
    const actionName = newStatus === 'Khoa' ? 'khóa' : 'mở khóa';
    if (!confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản #${id} không?`)) return;

    try {
        const res = await fetch(`/users/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message || `Đã ${actionName} tài khoản thành công!`, 'success');
            loadUsers();
        } else {
            showToast(data.error || 'Cập nhật trạng thái thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi mạng khi kết nối máy chủ', 'error');
    }
};

window.resetUserPassword = async function(id, username) {
    if (!confirm(`Xác nhận đặt lại mật khẩu của tài khoản "${username}" về mặc định (chính là "${username}")?`)) return;
    try {
        const res = await fetch(`/users/${id}/reset_password`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message || `Đã đặt lại mật khẩu cho tài khoản ${username}`, 'success');
        } else {
            showToast(data.error || 'Đặt lại mật khẩu thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi mạng', 'error');
    }
};

window.deleteUserAccount = async function(id, username) {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}" không? Hành động này không thể hoàn tác!`)) return;
    try {
        const res = await fetch(`/users/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
            showToast('Xóa tài khoản thành công!', 'success');
            loadUsers();
        } else {
            showToast(data.error || 'Xóa tài khoản thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi mạng', 'error');
    }
};

window.openEditUserModal = function(id) {
    const u = usersList.find(item => item.id === id);
    if (!u) return;

    const modal = document.getElementById('editUserModal');
    if (!modal) return;

    document.getElementById('editUserId').value = u.id;
    document.getElementById('editUsernameInput').value = u.username;
    document.getElementById('editFullNameInput').value = u.full_name || '';
    document.getElementById('editEmailInput').value = u.email || '';
    document.getElementById('editRoleSelect').value = String(u.role);
    document.getElementById('editStatusSelect').value = u.status || 'HoatDong';

    modal.classList.add('active');
};

function setupEventListeners() {
    document.getElementById('userSearchInput')?.addEventListener('input', debounce(loadUsers, 250));
    document.getElementById('roleFilter')?.addEventListener('change', loadUsers);

    const openBtn = document.getElementById('openAddUserModalBtn');
    const modal = document.getElementById('userModal');
    const closeBtn = document.getElementById('closeUserModalBtn');
    const cancelBtn = document.getElementById('cancelUserModalBtn');
    const form = document.getElementById('userForm');

    let unlinkedProfiles = [];
    let classList = [];
    let deptList = [];

    async function loadCatalogOptions() {
        try {
            const [lopRes, bmRes] = await Promise.all([
                fetch('/lop', { headers: { 'Accept': 'application/json' } }),
                fetch('/bomon')
            ]);
            if (lopRes.ok) classList = await lopRes.json();
            if (bmRes.ok) deptList = await bmRes.json();

            const classSelect = document.getElementById('userClassSelect');
            if (classSelect) {
                classSelect.innerHTML = '<option value="">-- Chọn lớp học --</option>' +
                    classList.map(c => `<option value="${c.id}">${c.class_code} - ${c.name}</option>`).join('');
            }

            const deptSelect = document.getElementById('userDeptSelect');
            if (deptSelect) {
                deptSelect.innerHTML = '<option value="">-- Chọn bộ môn --</option>' +
                    deptList.map(b => `<option value="${b.id}">${b.bomon_code} - ${b.name}</option>`).join('');
            }
        } catch (e) {
            console.error('Error loading catalogs:', e);
        }
    }

    async function updateProfileSyncOptions() {
        const role = document.getElementById('roleSelect')?.value;
        const group = document.getElementById('profileSyncGroup');
        const select = document.getElementById('linkProfileSelect');
        const help = document.getElementById('profileSyncHelpText');
        const fnGroup = document.getElementById('fullNameGroup');
        const classGroup = document.getElementById('userClassGroup');
        const deptGroup = document.getElementById('userDeptGroup');
        if (!group || !select) return;

        if (role === '2') {
            group.style.display = 'none';
            if (fnGroup) fnGroup.style.display = 'none';
            if (classGroup) classGroup.style.display = 'none';
            if (deptGroup) deptGroup.style.display = 'none';
            select.innerHTML = '<option value="">-- Quản trị viên không cần hồ sơ --</option>';
            return;
        }

        group.style.display = 'block';
        if (fnGroup) fnGroup.style.display = 'block';
        select.innerHTML = '<option value="">Đang tải danh sách hồ sơ...</option>';

        if (role === '0') {
            if (classGroup) classGroup.style.display = 'block';
            if (deptGroup) deptGroup.style.display = 'none';
            if (help) help.textContent = 'Chọn sinh viên có sẵn để liên kết hoặc để trống để tạo sinh viên mới';
            try {
                const res = await fetch('/students');
                const data = await res.json();
                unlinkedProfiles = (data || []).filter(s => !s.account_id);
                select.innerHTML = '<option value="">-- Tạo hồ sơ sinh viên mới đồng bộ --</option>' +
                    unlinkedProfiles.map(s => `<option value="${s.id}">Liên kết SV: ${s.name} (${s.student_code || 'Chưa có MSV'} - ${s.class || ''})</option>`).join('');
            } catch (e) {
                select.innerHTML = '<option value="">-- Không thể tải danh sách sinh viên --</option>';
            }
        } else if (role === '1') {
            if (classGroup) classGroup.style.display = 'none';
            if (deptGroup) deptGroup.style.display = 'block';
            if (help) help.textContent = 'Chọn giảng viên có sẵn để liên kết hoặc để trống để tạo giảng viên mới';
            try {
                const res = await fetch('/lecturers');
                const data = await res.json();
                unlinkedProfiles = (data || []).filter(l => !l.account_id);
                select.innerHTML = '<option value="">-- Tạo hồ sơ giảng viên mới đồng bộ --</option>' +
                    unlinkedProfiles.map(l => `<option value="${l.id}">Liên kết GV: ${l.name} (${l.lecturer_code || 'Chưa có MGV'})</option>`).join('');
            } catch (e) {
                select.innerHTML = '<option value="">-- Không thể tải danh sách giảng viên --</option>';
            }
        }
    }

    document.getElementById('roleSelect')?.addEventListener('change', updateProfileSyncOptions);
    document.getElementById('linkProfileSelect')?.addEventListener('change', () => {
        const role = document.getElementById('roleSelect')?.value;
        const val = document.getElementById('linkProfileSelect')?.value;
        const fnInput = document.getElementById('fullNameInput');
        const usernameInput = document.getElementById('usernameInput');
        const emailInput = document.getElementById('emailInput');
        const classGroup = document.getElementById('userClassGroup');
        const deptGroup = document.getElementById('userDeptGroup');

        if (!val) {
            if (fnInput) fnInput.value = '';
            if (role === '0' && classGroup) classGroup.style.display = 'block';
            if (role === '1' && deptGroup) deptGroup.style.display = 'block';
            return;
        }

        const profile = unlinkedProfiles.find(p => p.id === parseInt(val));
        if (!profile) return;

        if (fnInput) fnInput.value = profile.name || '';
        if (role === '0') {
            if (profile.student_code && usernameInput) usernameInput.value = profile.student_code;
            if (profile.email && emailInput) emailInput.value = profile.email;
            if (classGroup) classGroup.style.display = 'none';
        } else if (role === '1') {
            if (profile.lecturer_code && usernameInput) usernameInput.value = profile.lecturer_code;
            if (profile.email && emailInput) emailInput.value = profile.email;
            if (deptGroup) deptGroup.style.display = 'none';
        }
    });

    openBtn?.addEventListener('click', async () => {
        form?.reset();
        await loadCatalogOptions();
        await updateProfileSyncOptions();
        modal?.classList.add('active');
    });

    closeBtn?.addEventListener('click', () => modal?.classList.remove('active'));
    cancelBtn?.addEventListener('click', () => modal?.classList.remove('active'));


    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('usernameInput').value.trim();
        const role = document.getElementById('roleSelect').value;
        const email = document.getElementById('emailInput').value.trim();
        const password = document.getElementById('passwordInput').value.trim();
        const profileId = document.getElementById('linkProfileSelect')?.value;
        let fullName = document.getElementById('fullNameInput')?.value.trim();
        if (!fullName && !profileId && (role === '0' || role === '1')) {
            fullName = (role === '0' ? 'Sinh viên ' : 'Giảng viên ') + username;
        }
        const classId = document.getElementById('userClassSelect')?.value;
        const deptId = document.getElementById('userDeptSelect')?.value;

        if (email && !email.endsWith('@wru.vn')) {
            showToast('Email yêu cầu phải đúng định dạng tên miền @wru.vn', 'error');
            return;
        }

        const payload = {
            username,
            role: parseInt(role),
            email,
            password,
            full_name: fullName || undefined
        };

        if (role === '0') {
            if (profileId) {
                payload.student_id = parseInt(profileId);
            } else if (classId) {
                payload.class_id = parseInt(classId);
            }
        } else if (role === '1') {
            if (profileId) {
                payload.lecturer_id = parseInt(profileId);
            } else if (deptId) {
                payload.department_id = parseInt(deptId);
            }
        }

        const saveBtn = document.getElementById('saveUserBtn');
        const origBtnHtml = saveBtn ? saveBtn.innerHTML : '';
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
        }

        try {
            const res = await fetch('/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                const effectivePwd = password || '123456';
                const linkMsg = profileId ? ' và liên kết hồ sơ thành công!' : ' và đồng bộ tạo hồ sơ thành công!';
                showToast(`Tạo tài khoản${linkMsg} Tên đăng nhập: ${username} | Mật khẩu: ${effectivePwd}`, 'success');
                modal?.classList.remove('active');
                loadUsers();
            } else {
                showToast(data.error || data.message || 'Tạo tài khoản thất bại', 'error');
            }
        } catch (e) {
            showToast('Lỗi mạng khi kết nối máy chủ', 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = origBtnHtml;
            }
        }
    });


    const changePwdForm = document.getElementById('changePwdForm');
    const changePwdModal = document.getElementById('changePwdModal');
    const openChangePwdBtn = document.getElementById('openChangePwdBtn');
    const closeChangePwdBtn = document.getElementById('closeChangePwdBtn');
    const cancelChangePwdBtn = document.getElementById('cancelChangePwdBtn');

    openChangePwdBtn?.addEventListener('click', () => {
        changePwdForm?.reset();
        changePwdModal?.classList.add('active');
    });
    closeChangePwdBtn?.addEventListener('click', () => changePwdModal?.classList.remove('active'));
    cancelChangePwdBtn?.addEventListener('click', () => changePwdModal?.classList.remove('active'));

    changePwdForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const old_password = document.getElementById('oldPasswordInput').value;
        const new_password = document.getElementById('newPasswordInput').value;
        const confirm_password = document.getElementById('confirmPasswordInput').value;

        const submitBtn = changePwdForm.querySelector('button[type="submit"]');
        const origHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang đổi...';
        }

        try {
            const res = await fetch('/change_password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ old_password, new_password, confirm_password })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message || 'Đổi mật khẩu thành công!', 'success');
                changePwdModal?.classList.remove('active');
            } else {
                showToast(data.error || 'Đổi mật khẩu thất bại', 'error');
            }
        } catch (err) {
            showToast('Lỗi kết nối máy chủ', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origHtml;
            }
        }
    });

    const editModal = document.getElementById('editUserModal');
    const closeEditBtn = document.getElementById('closeEditUserModalBtn');
    const cancelEditBtn = document.getElementById('cancelEditUserModalBtn');
    const editForm = document.getElementById('editUserForm');

    closeEditBtn?.addEventListener('click', () => editModal?.classList.remove('active'));
    cancelEditBtn?.addEventListener('click', () => editModal?.classList.remove('active'));

    editForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editUserId').value;
        const fullName = document.getElementById('editFullNameInput').value.trim();
        const email = document.getElementById('editEmailInput').value.trim();
        const role = parseInt(document.getElementById('editRoleSelect').value);
        const status = document.getElementById('editStatusSelect').value;

        if (email && !email.endsWith('@wru.vn')) {
            showToast('Email yêu cầu phải đúng định dạng tên miền @wru.vn', 'error');
            return;
        }

        const saveBtn = document.getElementById('saveEditUserBtn');
        const origBtnHtml = saveBtn ? saveBtn.innerHTML : '';
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
        }

        try {
            const res = await fetch(`/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: fullName,
                    email: email || '',
                    role: role,
                    status: status
                })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message || 'Cập nhật tài khoản thành công!', 'success');
                editModal?.classList.remove('active');
                loadUsers();
            } else {
                showToast(data.error || 'Cập nhật tài khoản thất bại', 'error');
            }
        } catch (err) {
            showToast('Lỗi mạng khi kết nối máy chủ', 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = origBtnHtml;
            }
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
