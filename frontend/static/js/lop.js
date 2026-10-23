document.addEventListener('DOMContentLoaded', () => {
    const lopTableBody = document.getElementById('lopTableBody');
    const lopSearchInput = document.getElementById('lopSearchInput');
    const majorFilter = document.getElementById('majorFilter');
    const cohortFilter = document.getElementById('cohortFilter');
    const lopModal = document.getElementById('lopModal');
    const lopForm = document.getElementById('lopForm');

    let lopList = [];
    let cnList = [];
    let nkList = [];
    let studentList = [];

    async function fetchStudents() {
        try {
            const res = await fetch('/students', {
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                studentList = await res.json();
            }
        } catch (e) {
            console.error("Error fetching students for enrollment count", e);
        }
    }

    async function fetchChuyenNganh() {
        try {
            const res = await fetch('/chuyennganh', {
                headers: { 'Accept': 'application/json' }
            });
            if (res.status === 401) { window.location.href = '/login'; return; }
            if (res.ok) {
                cnList = await res.json();
                populateChuyenNganhDropdown();
                populateMajorFilter();
            }
        } catch (e) {
            console.error("Error fetching chuyennganh", e);
        }
    }

    async function fetchNienKhoa() {
        try {
            const res = await fetch('/nienkhoa', {
                headers: { 'Accept': 'application/json' }
            });
            if (res.status === 401) { window.location.href = '/login'; return; }
            if (res.ok) {
                nkList = await res.json();
                populateNienKhoaDropdown();
                populateCohortFilter();
            }
        } catch (e) {
            console.error("Error fetching nienkhoa", e);
        }
    }

    function populateChuyenNganhDropdown() {
        const select = document.getElementById('lopMajorId');
        if (!select) return;
        select.innerHTML = '<option value="">-- Chọn Chuyên Ngành --</option>';
        cnList.forEach(cn => {
            const opt = document.createElement('option');
            opt.value = cn.id;
            opt.textContent = `${cn.major_code} - ${cn.name}`;
            select.appendChild(opt);
        });
    }

    function populateMajorFilter() {
        if (!majorFilter) return;
        majorFilter.innerHTML = '<option value="ALL">Tất cả chuyên ngành</option>';
        cnList.forEach(cn => {
            const opt = document.createElement('option');
            opt.value = cn.id;
            opt.textContent = cn.name;
            majorFilter.appendChild(opt);
        });
    }

    function populateNienKhoaDropdown() {
        const select = document.getElementById('lopCohortId');
        if (!select) return;
        select.innerHTML = '<option value="">-- Chọn Niên Khóa --</option>';
        nkList.forEach(nk => {
            const opt = document.createElement('option');
            opt.value = nk.id;
            opt.textContent = `${nk.cohort_code} - ${nk.name}`;
            select.appendChild(opt);
        });
    }

    function populateCohortFilter() {
        if (!cohortFilter) return;
        cohortFilter.innerHTML = '<option value="ALL">Tất cả niên khóa</option>';
        nkList.forEach(nk => {
            const opt = document.createElement('option');
            opt.value = nk.id;
            opt.textContent = nk.name;
            cohortFilter.appendChild(opt);
        });
    }

    async function fetchLop() {
        try {
            const res = await fetch('/lop', {
                headers: { 'Accept': 'application/json' }
            });
            if (res.status === 401) { window.location.href = '/login'; return; }
            if (res.ok) {
                lopList = await res.json();
                filterAndRender();
                updateStats();
            }
        } catch (e) {
            console.error("Error fetching lop", e);
        }
    }

    function updateStats() {
        const statTotal = document.getElementById('statTotalLop');
        const statAdvisor = document.getElementById('statWithAdvisor');
        const statMonitor = document.getElementById('statWithMonitor');
        const statMajors = document.getElementById('statTotalMajors');

        if (statTotal) statTotal.textContent = lopList.length;
        if (statAdvisor) statAdvisor.textContent = lopList.filter(l => l.advisor && l.advisor.trim()).length;
        if (statMonitor) statMonitor.textContent = lopList.filter(l => l.monitor && l.monitor.trim()).length;
        if (statMajors) statMajors.textContent = cnList.length;
    }

    function getStudentCountForClass(lop) {
        if (!studentList || studentList.length === 0) return 0;
        return studentList.filter(s => {
            const cName = (s.class_name || '').toLowerCase().trim();
            const lName = (lop.name || '').toLowerCase().trim();
            const lCode = (lop.class_code || '').toLowerCase().trim();
            return cName === lName || cName === lCode;
        }).length;
    }

    function filterAndRender() {
        const search = lopSearchInput ? lopSearchInput.value.toLowerCase().trim() : '';
        const majorVal = majorFilter ? majorFilter.value : 'ALL';
        const cohortVal = cohortFilter ? cohortFilter.value : 'ALL';

        const filtered = lopList.filter(lop => {
            const matchSearch = !search ||
                lop.name.toLowerCase().includes(search) ||
                lop.class_code.toLowerCase().includes(search) ||
                (lop.advisor && lop.advisor.toLowerCase().includes(search)) ||
                (lop.monitor && lop.monitor.toLowerCase().includes(search));

            const matchMajor = majorVal === 'ALL' || lop.major_id === parseInt(majorVal);
            const matchCohort = cohortVal === 'ALL' || lop.cohort_id === parseInt(cohortVal);

            return matchSearch && matchMajor && matchCohort;
        });

        renderTable(filtered);
    }

    function renderTable(data) {
        if (!lopTableBody) return;
        lopTableBody.innerHTML = '';

        if (data.length === 0) {
            lopTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 24px;">Không tìm thấy lớp học nào</td></tr>';
            return;
        }

        data.forEach(lop => {
            const cn = cnList.find(x => x.id === lop.major_id);
            const cnName = cn ? cn.name : (lop.major_name || 'Chưa rõ');
            const nk = nkList.find(x => x.id === lop.cohort_id);
            const nkName = nk ? nk.name : (lop.cohort_name || 'Chưa rõ');
            const advisorHtml = lop.advisor ? `<i class="fa-solid fa-user-tie" style="color: var(--primary); margin-right: 4px;"></i> ${lop.advisor}` : '<span style="color: var(--text-muted); font-size: 12px;">Chưa phân công</span>';
            const monitorHtml = lop.monitor ? `<i class="fa-solid fa-user-graduate" style="color: var(--warning); margin-right: 4px;"></i> ${lop.monitor}` : '<span style="color: var(--text-muted); font-size: 12px;">Chưa bầu</span>';
            const siSo = getStudentCountForClass(lop);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${lop.class_code}</strong></td>
                <td>${lop.name}</td>
                <td><span class="score-good" style="padding: 2px 8px; border-radius: 10px; font-size: 11px;">${cnName}</span></td>
                <td><span class="badge-class">${nkName}</span></td>
                <td style="text-align: center;"><span class="badge-class" style="font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 2px 8px; border-radius: 9999px;">${siSo} SV</span></td>
                <td>${advisorHtml}</td>
                <td>${monitorHtml}</td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 6px; justify-content: flex-end;">
                        <a href="/?search=${encodeURIComponent(lop.name)}" class="btn-secondary" style="padding: 4px 8px; font-size: 11px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="Xem sinh viên của lớp">
                            <i class="fa-solid fa-users"></i> Xem SV
                        </a>
                        <button class="btn-secondary admin-only" style="padding: 4px 10px; font-size: 12px;" onclick="editLop(${lop.id})" title="Sửa thông tin lớp">
                            <i class="fa-solid fa-pen"></i> Sửa
                        </button>
                        <button class="btn-secondary admin-only" style="padding: 4px 10px; font-size: 12px; color: var(--danger); border-color: rgba(239, 68, 68, 0.4);" onclick="deleteLop(${lop.id}, '${lop.name.replace(/'/g, "\\'")}')" title="Xóa lớp học">
                            <i class="fa-solid fa-trash"></i> Xóa
                        </button>
                    </div>
                </td>
            `;
            lopTableBody.appendChild(tr);
        });
    }

    if (lopSearchInput) lopSearchInput.addEventListener('input', filterAndRender);
    if (majorFilter) majorFilter.addEventListener('change', filterAndRender);
    if (cohortFilter) cohortFilter.addEventListener('change', filterAndRender);

    function exportLopToCSV() {
        if (!lopList || lopList.length === 0) {
            alert('Không có dữ liệu lớp học để xuất');
            return;
        }
        const headers = ["Mã Lớp", "Tên Lớp", "Chuyên Ngành", "Niên Khóa", "Sĩ Số", "Cố Vấn Học Tập", "Lớp Trưởng"];
        const rows = lopList.map(l => {
            const cn = cnList.find(x => x.id === l.major_id);
            const nk = nkList.find(x => x.id === l.cohort_id);
            const siSo = getStudentCountForClass(l);
            return [
                `"${(l.class_code || '').replace(/"/g, '""')}"`,
                `"${(l.name || '').replace(/"/g, '""')}"`,
                `"${(cn ? cn.name : l.major_name || '').replace(/"/g, '""')}"`,
                `"${(nk ? nk.name : l.cohort_name || '').replace(/"/g, '""')}"`,
                siSo,
                `"${(l.advisor || '').replace(/"/g, '""')}"`,
                `"${(l.monitor || '').replace(/"/g, '""')}"`
            ].join(',');
        });
        const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Danh_Sach_Lop_Hoc_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    document.getElementById('exportLopBtn')?.addEventListener('click', exportLopToCSV);

    document.getElementById('openLopModalBtn')?.addEventListener('click', () => {
        document.getElementById('lopModalTitle').textContent = 'Thêm Lớp Mới';
        lopForm.reset();
        document.getElementById('lopId').value = '';
        document.getElementById('lopAdvisor').value = '';
        document.getElementById('lopMonitor').value = '';
        lopModal.classList.add('active');
    });

    const closeModal = () => lopModal?.classList.remove('active');
    document.getElementById('lopModalCloseBtn')?.addEventListener('click', closeModal);
    document.getElementById('lopModalCancelBtn')?.addEventListener('click', closeModal);

    window.editLop = (id) => {
        const lop = lopList.find(x => x.id === id);
        if (lop) {
            document.getElementById('lopModalTitle').textContent = 'Cập Nhật Lớp';
            document.getElementById('lopId').value = lop.id;
            document.getElementById('lopCode').value = lop.class_code;
            document.getElementById('lopName').value = lop.name;
            document.getElementById('lopMajorId').value = lop.major_id;
            document.getElementById('lopCohortId').value = lop.cohort_id;
            document.getElementById('lopAdvisor').value = lop.advisor || '';
            document.getElementById('lopMonitor').value = lop.monitor || '';
            lopModal.classList.add('active');
        }
    };

    window.deleteLop = async (id, name) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa lớp "${name}" không?\nLưu ý: Các sinh viên thuộc lớp này có thể bị mất liên kết lớp.`)) {
            return;
        }
        try {
            const res = await fetch(`/lop/${id}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' }
            });
            const data = await res.json();
            if (res.ok) {
                if (window.showToast) window.showToast('Xóa lớp học thành công', 'success');
                else alert('Xóa lớp học thành công');
                fetchLop();
            } else {
                if (window.showToast) window.showToast(data.error || 'Lỗi khi xóa lớp', 'error');
                else alert(data.error || 'Lỗi khi xóa lớp');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Lỗi máy chủ khi xóa lớp', 'error');
            else alert('Lỗi máy chủ khi xóa lớp');
        }
    };

    lopForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('lopId').value;
        const payload = {
            class_code: document.getElementById('lopCode').value.trim(),
            name: document.getElementById('lopName').value.trim(),
            major_id: parseInt(document.getElementById('lopMajorId').value),
            cohort_id: parseInt(document.getElementById('lopCohortId').value),
            advisor: document.getElementById('lopAdvisor').value.trim() || null,
            monitor: document.getElementById('lopMonitor').value.trim() || null
        };
        const submitBtn = lopForm.querySelector('button[type="submit"]');
        const origHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
        }

        try {
            const res = await fetch(id ? `/lop/${id}` : '/lop', {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                if (window.showToast) window.showToast(data.message || 'Lưu thông tin lớp thành công', 'success');
                closeModal();
                fetchLop();
            } else {
                if (window.showToast) window.showToast(data.error || 'Lỗi khi lưu lớp', 'error');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Lỗi máy chủ khi lưu lớp', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origHtml;
            }
        }
    });

    async function init() {
        await Promise.all([fetchChuyenNganh(), fetchNienKhoa(), fetchStudents()]);
        await fetchLop();
    }
    init();
});
