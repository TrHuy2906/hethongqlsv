document.addEventListener('DOMContentLoaded', () => {
    const cnTableBody = document.getElementById('cnTableBody');
    const cnSearchInput = document.getElementById('cnSearchInput');
    const facultyFilter = document.getElementById('facultyFilter');
    const cnModal = document.getElementById('cnModal');
    const cnForm = document.getElementById('cnForm');
    let cnList = [];
    let khoasList = [];

    async function fetchKhoas() {
        try {
            const res = await fetch('/khoa');
            if (res.status === 401) { window.location.href = '/login'; return; }
            khoasList = await res.json();
            populateKhoaDropdown();
            populateFacultyFilter();
            updateStats();
        } catch (e) {
            console.error("Error fetching khoa", e);
        }
    }

    function populateKhoaDropdown() {
        const select = document.getElementById('cnFacultyId');
        if (!select) return;
        select.innerHTML = '<option value="">-- Chọn Khoa Trực Thuộc --</option>';
        khoasList.forEach(k => {
            const opt = document.createElement('option');
            opt.value = k.id;
            opt.textContent = `${k.khoa_code} - ${k.name}`;
            select.appendChild(opt);
        });
    }

    function populateFacultyFilter() {
        if (!facultyFilter) return;
        facultyFilter.innerHTML = '<option value="ALL">Tất cả các Khoa</option>';
        khoasList.forEach(k => {
            const opt = document.createElement('option');
            opt.value = k.id;
            opt.textContent = k.name;
            facultyFilter.appendChild(opt);
        });
    }

    async function fetchChuyenNganh() {
        try {
            const res = await fetch('/chuyennganh');
            if (res.status === 401) { window.location.href = '/login'; return; }
            cnList = await res.json();
            filterAndRender();
            updateStats();
        } catch (e) {
            console.error("Error fetching chuyennganh", e);
        }
    }

    function updateStats() {
        const statTotal = document.getElementById('statTotalMajors');
        const statCntt = document.getElementById('statCnttMajors');
        const statEcon = document.getElementById('statEconMajors');
        const statFaculty = document.getElementById('statFacultyCount');

        if (statTotal) statTotal.textContent = cnList.length;

        const cnttKhoa = khoasList.find(k => k.khoa_code === 'CNTT' || k.name.toLowerCase().includes('công nghệ thông tin'));
        const cnttCount = cnttKhoa ? cnList.filter(c => c.faculty_id === cnttKhoa.id).length : 0;
        if (statCntt) statCntt.textContent = cnttCount;

        const econKhoa = khoasList.find(k => k.khoa_code === 'KTQL' || k.name.toLowerCase().includes('kinh tế'));
        const econCount = econKhoa ? cnList.filter(c => c.faculty_id === econKhoa.id).length : 0;
        if (statEcon) statEcon.textContent = econCount;

        if (statFaculty) statFaculty.textContent = khoasList.length;
    }

    function filterAndRender() {
        const search = cnSearchInput ? cnSearchInput.value.toLowerCase().trim() : '';
        const facVal = facultyFilter ? facultyFilter.value : 'ALL';

        const filtered = cnList.filter(cn => {
            const matchSearch = !search ||
                cn.name.toLowerCase().includes(search) ||
                cn.major_code.toLowerCase().includes(search);

            const matchFac = facVal === 'ALL' || cn.faculty_id === parseInt(facVal);

            return matchSearch && matchFac;
        });

        renderTable(filtered);
    }

    function renderTable(data) {
        if (!cnTableBody) return;
        cnTableBody.innerHTML = '';
        if (data.length === 0) {
            cnTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 24px;">Không tìm thấy chuyên ngành nào</td></tr>';
            return;
        }

        data.forEach(cn => {
            const khoa = khoasList.find(k => k.id === cn.faculty_id);
            const khoaName = khoa ? khoa.name : (cn.faculty_name || 'Chưa rõ');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>${cn.major_code}</code></td>
                <td><strong>${cn.name}</strong></td>
                <td><span class="score-good" style="padding: 2px 8px; border-radius: 10px; font-size: 11px;">${khoaName}</span></td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn-secondary admin-only" style="padding: 3px 8px; font-size: 11px;" onclick="editCN(${cn.id})" title="Sửa chuyên ngành">
                            <i class="fa-solid fa-pen"></i> Sửa
                        </button>
                        <button class="btn-secondary admin-only" style="padding: 3px 8px; font-size: 11px; color: var(--danger); border-color: rgba(239, 68, 68, 0.4);" onclick="deleteCN(${cn.id}, '${cn.name.replace(/'/g, "\\'")}')" title="Xóa chuyên ngành">
                            <i class="fa-solid fa-trash"></i> Xóa
                        </button>
                    </div>
                </td>
            `;
            cnTableBody.appendChild(tr);
        });
    }

    if (cnSearchInput) cnSearchInput.addEventListener('input', filterAndRender);
    if (facultyFilter) facultyFilter.addEventListener('change', filterAndRender);

    document.getElementById('openCNModalBtn')?.addEventListener('click', () => {
        document.getElementById('cnModalTitle').textContent = 'Thêm Chuyên Ngành Mới';
        cnForm.reset();
        document.getElementById('cnId').value = '';
        cnModal.classList.add('active');
    });

    const closeModal = () => cnModal?.classList.remove('active');
    document.getElementById('cnModalCloseBtn')?.addEventListener('click', closeModal);
    document.getElementById('cnModalCancelBtn')?.addEventListener('click', closeModal);

    window.editCN = (id) => {
        const cn = cnList.find(x => x.id === id);
        if (cn) {
            document.getElementById('cnModalTitle').textContent = 'Cập Nhật Chuyên Ngành';
            document.getElementById('cnId').value = cn.id;
            document.getElementById('cnCode').value = cn.major_code;
            document.getElementById('cnName').value = cn.name;
            document.getElementById('cnFacultyId').value = cn.faculty_id;
            cnModal.classList.add('active');
        }
    };

    window.deleteCN = async (id, name) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa chuyên ngành "${name}" không?\nLưu ý: Các lớp học thuộc chuyên ngành này có thể bị ảnh hưởng.`)) {
            return;
        }
        try {
            const res = await fetch(`/chuyennganh/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                if (window.showToast) window.showToast('Xóa chuyên ngành thành công', 'success');
                else alert('Xóa chuyên ngành thành công');
                fetchChuyenNganh();
            } else {
                if (window.showToast) window.showToast(data.error || 'Lỗi khi xóa chuyên ngành', 'error');
                else alert(data.error || 'Lỗi khi xóa chuyên ngành');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Lỗi máy chủ khi xóa chuyên ngành', 'error');
            else alert('Lỗi máy chủ khi xóa chuyên ngành');
        }
    };

    cnForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('cnId').value;
        const payload = {
            major_code: document.getElementById('cnCode').value.trim(),
            name: document.getElementById('cnName').value.trim(),
            faculty_id: parseInt(document.getElementById('cnFacultyId').value)
        };
        const submitBtn = cnForm.querySelector('button[type="submit"]');
        const origHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
        }

        try {
            const res = await fetch(id ? `/chuyennganh/${id}` : '/chuyennganh', {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                if (window.showToast) window.showToast(data.message || 'Lưu thông tin chuyên ngành thành công', 'success');
                closeModal();
                fetchChuyenNganh();
            } else {
                if (window.showToast) window.showToast(data.error || 'Lỗi khi lưu chuyên ngành', 'error');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Lỗi máy chủ khi lưu chuyên ngành', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origHtml;
            }
        }
    });

    async function init() {
        await fetchKhoas();
        await fetchChuyenNganh();
    }
    init();
});
