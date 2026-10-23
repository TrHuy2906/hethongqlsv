document.addEventListener('DOMContentLoaded', () => {

    const khoaTableBody = document.getElementById('khoaTableBody');
    const khoaSearchInput = document.getElementById('khoaSearchInput');
    const khoaModal = document.getElementById('khoaModal');
    const khoaForm = document.getElementById('khoaForm');
    let khoasList = [];


    const bomonTableBody = document.getElementById('bomonTableBody');
    const bomonSearchInput = document.getElementById('bomonSearchInput');
    const bomonModal = document.getElementById('bomonModal');
    const bomonForm = document.getElementById('bomonForm');
    const bomonKhoaId = document.getElementById('bomonKhoaId');
    let bomonList = [];

    async function fetchKhoas() {
        try {
            const res = await fetch('/khoa');
            if (res.status === 401) { window.location.href = '/login'; return; }
            khoasList = await res.json();
            renderKhoas(khoasList);
            populateKhoaDropdown();
            updateStats();
        } catch (e) {
            console.error("Error fetching khoa", e);
        }
    }

    async function fetchBoMons() {
        try {
            const res = await fetch('/bomon');
            if (res.status === 401) { window.location.href = '/login'; return; }
            bomonList = await res.json();
            renderBoMons(bomonList);
            updateStats();
        } catch (e) {
            console.error("Error fetching bomon", e);
        }
    }

    function updateStats() {
        const statKhoa = document.getElementById('statTotalKhoa');
        const statDean = document.getElementById('statWithDean');
        const statBoMon = document.getElementById('statTotalBoMon');
        const statCntt = document.getElementById('statCnttBoMon');

        if (statKhoa) statKhoa.textContent = khoasList.length;
        if (statDean) statDean.textContent = khoasList.filter(k => k.dean && k.dean.trim()).length;
        if (statBoMon) statBoMon.textContent = bomonList.length;


        const cnttKhoa = khoasList.find(k => k.khoa_code === 'CNTT' || k.name.toLowerCase().includes('công nghệ thông tin'));
        const cnttCount = cnttKhoa ? bomonList.filter(b => b.khoa_id === cnttKhoa.id).length : 0;
        if (statCntt) statCntt.textContent = cnttCount;
    }

    function renderKhoas(data) {
        if (!khoaTableBody) return;
        khoaTableBody.innerHTML = '';
        if (data.length === 0) {
            khoaTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 20px;">Không tìm thấy khoa nào</td></tr>';
            return;
        }

        data.forEach(k => {
            const deanHtml = k.dean ? `<i class="fa-solid fa-user-tie" style="color: var(--primary); margin-right: 4px;"></i> <strong>${k.dean}</strong>` : '<span style="color: var(--text-muted); font-size: 12px;">Chưa bổ nhiệm</span>';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>${k.khoa_code}</code></td>
                <td><strong>${k.name}</strong></td>
                <td>${deanHtml}</td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn-secondary admin-only" style="padding: 3px 8px; font-size: 11px;" onclick="editKhoa(${k.id})" title="Sửa thông tin Khoa">
                            <i class="fa-solid fa-pen"></i> Sửa
                        </button>
                        <button class="btn-secondary admin-only" style="padding: 3px 8px; font-size: 11px; color: var(--danger); border-color: rgba(239, 68, 68, 0.4);" onclick="deleteKhoa(${k.id}, '${k.name.replace(/'/g, "\\'")}')" title="Xóa Khoa">
                            <i class="fa-solid fa-trash"></i> Xóa
                        </button>
                    </div>
                </td>
            `;
            khoaTableBody.appendChild(tr);
        });
    }

    function renderBoMons(data) {
        if (!bomonTableBody) return;
        bomonTableBody.innerHTML = '';
        if (data.length === 0) {
            bomonTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 20px;">Không tìm thấy bộ môn nào</td></tr>';
            return;
        }

        data.forEach(b => {
            const khoa = khoasList.find(k => k.id === b.khoa_id);
            const khoaName = khoa ? khoa.name : (b.khoa_name || 'Chưa rõ');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>${b.bomon_code}</code></td>
                <td><strong>${b.name}</strong></td>
                <td><span class="score-good" style="padding: 2px 8px; border-radius: 10px; font-size: 11px;">${khoaName}</span></td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn-secondary admin-only" style="padding: 3px 8px; font-size: 11px;" onclick="editBoMon(${b.id})" title="Sửa thông tin Bộ môn">
                            <i class="fa-solid fa-pen"></i> Sửa
                        </button>
                        <button class="btn-secondary admin-only" style="padding: 3px 8px; font-size: 11px; color: var(--danger); border-color: rgba(239, 68, 68, 0.4);" onclick="deleteBoMon(${b.id}, '${b.name.replace(/'/g, "\\'")}')" title="Xóa Bộ môn">
                            <i class="fa-solid fa-trash"></i> Xóa
                        </button>
                    </div>
                </td>
            `;
            bomonTableBody.appendChild(tr);
        });
    }

    function populateKhoaDropdown() {
        if (!bomonKhoaId) return;
        bomonKhoaId.innerHTML = '<option value="">-- Chọn Khoa Trực Thuộc --</option>';
        khoasList.forEach(k => {
            const opt = document.createElement('option');
            opt.value = k.id;
            opt.textContent = `${k.khoa_code} - ${k.name}`;
            bomonKhoaId.appendChild(opt);
        });
    }


    khoaSearchInput?.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        const filtered = khoasList.filter(k => k.name.toLowerCase().includes(val) || k.khoa_code.toLowerCase().includes(val) || (k.dean && k.dean.toLowerCase().includes(val)));
        renderKhoas(filtered);
    });

    bomonSearchInput?.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        const filtered = bomonList.filter(b => b.name.toLowerCase().includes(val) || b.bomon_code.toLowerCase().includes(val));
        renderBoMons(filtered);
    });


    document.getElementById('openKhoaModalBtn')?.addEventListener('click', () => {
        document.getElementById('khoaModalTitle').textContent = 'Thêm Khoa Mới';
        khoaForm.reset();
        document.getElementById('khoaId').value = '';
        khoaModal.classList.add('active');
    });

    const closeKhoaModal = () => khoaModal?.classList.remove('active');
    document.getElementById('khoaModalCloseBtn')?.addEventListener('click', closeKhoaModal);
    document.getElementById('khoaModalCancelBtn')?.addEventListener('click', closeKhoaModal);

    window.editKhoa = (id) => {
        const k = khoasList.find(x => x.id === id);
        if (k) {
            document.getElementById('khoaModalTitle').textContent = 'Cập Nhật Khoa';
            document.getElementById('khoaId').value = k.id;
            document.getElementById('khoaCode').value = k.khoa_code;
            document.getElementById('khoaName').value = k.name;
            const deanInput = document.getElementById('khoaDean');
            if (deanInput) deanInput.value = k.dean || '';
            khoaModal.classList.add('active');
        }
    };

    window.deleteKhoa = async (id, name) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa khoa "${name}" không?\nLưu ý: Các bộ môn và chuyên ngành thuộc khoa này cũng có thể bị ảnh hưởng.`)) {
            return;
        }
        try {
            const res = await fetch(`/khoa/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                if (window.showToast) window.showToast('Xóa khoa thành công', 'success');
                else alert('Xóa khoa thành công');
                await fetchKhoas();
                await fetchBoMons();
            } else {
                if (window.showToast) window.showToast(data.error || 'Lỗi khi xóa khoa', 'error');
                else alert(data.error || 'Lỗi khi xóa khoa');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Lỗi máy chủ khi xóa khoa', 'error');
            else alert('Lỗi máy chủ khi xóa khoa');
        }
    };

    khoaForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('khoaId').value;
        const payload = {
            khoa_code: document.getElementById('khoaCode').value.trim(),
            name: document.getElementById('khoaName').value.trim(),
            dean: document.getElementById('khoaDean')?.value.trim() || null
        };
        const submitBtn = khoaForm.querySelector('button[type="submit"]');
        const origHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
        }

        try {
            const res = await fetch(id ? `/khoa/${id}` : '/khoa', {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                if (window.showToast) window.showToast(data.message || 'Lưu thông tin khoa thành công', 'success');
                closeKhoaModal();
                fetchKhoas();
            } else {
                if (window.showToast) window.showToast(data.error || 'Lỗi khi lưu khoa', 'error');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Lỗi máy chủ khi lưu khoa', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origHtml;
            }
        }
    });


    document.getElementById('openBoMonModalBtn')?.addEventListener('click', () => {
        document.getElementById('bomonModalTitle').textContent = 'Thêm Bộ Môn Mới';
        bomonForm.reset();
        document.getElementById('bomonId').value = '';
        bomonModal.classList.add('active');
    });

    const closeBoMonModal = () => bomonModal?.classList.remove('active');
    document.getElementById('bomonModalCloseBtn')?.addEventListener('click', closeBoMonModal);
    document.getElementById('bomonModalCancelBtn')?.addEventListener('click', closeBoMonModal);

    window.editBoMon = (id) => {
        const b = bomonList.find(x => x.id === id);
        if (b) {
            document.getElementById('bomonModalTitle').textContent = 'Cập Nhật Bộ Môn';
            document.getElementById('bomonId').value = b.id;
            document.getElementById('bomonCode').value = b.bomon_code;
            document.getElementById('bomonName').value = b.name;
            document.getElementById('bomonKhoaId').value = b.khoa_id;
            bomonModal.classList.add('active');
        }
    };

    window.deleteBoMon = async (id, name) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa bộ môn "${name}" không?`)) {
            return;
        }
        try {
            const res = await fetch(`/bomon/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
                if (window.showToast) window.showToast('Xóa bộ môn thành công', 'success');
                else alert('Xóa bộ môn thành công');
                fetchBoMons();
            } else {
                if (window.showToast) window.showToast(data.error || 'Lỗi khi xóa bộ môn', 'error');
                else alert(data.error || 'Lỗi khi xóa bộ môn');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Lỗi máy chủ khi xóa bộ môn', 'error');
            else alert('Lỗi máy chủ khi xóa bộ môn');
        }
    };

    bomonForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('bomonId').value;
        const payload = {
            bomon_code: document.getElementById('bomonCode').value.trim(),
            name: document.getElementById('bomonName').value.trim(),
            khoa_id: parseInt(document.getElementById('bomonKhoaId').value)
        };
        const submitBtn = bomonForm.querySelector('button[type="submit"]');
        const origHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
        }

        try {
            const res = await fetch(id ? `/bomon/${id}` : '/bomon', {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                if (window.showToast) window.showToast(data.message || 'Lưu thông tin bộ môn thành công', 'success');
                closeBoMonModal();
                fetchBoMons();
            } else {
                if (window.showToast) window.showToast(data.error || 'Lỗi khi lưu bộ môn', 'error');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Lỗi máy chủ khi lưu bộ môn', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origHtml;
            }
        }
    });


    async function init() {
        await fetchKhoas();
        await fetchBoMons();
    }
    init();
});
