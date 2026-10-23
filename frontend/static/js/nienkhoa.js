document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.getElementById('nienkhoaTableBody');
    const searchInput = document.getElementById('nkSearchInput');
    const statusFilter = document.getElementById('statusFilter');
    const modal = document.getElementById('nkModal');
    const form = document.getElementById('nkForm');

    let nienkhoaList = [];
    const currentYear = new Date().getFullYear();

    async function loadNienKhoa() {
        try {
            const res = await fetch('/nienkhoa', {
                headers: { 'Accept': 'application/json' }
            });
            if (res.status === 401) { window.location.href = '/login'; return; }
            if (res.ok) {
                nienkhoaList = await res.json();
                filterAndRender();
                updateStats();
            }
        } catch (e) {
            console.error('Error loading nienkhoa:', e);
        }
    }

    function updateStats() {
        const totalEl = document.getElementById('statTotalCohorts');
        const activeEl = document.getElementById('statActiveCohorts');
        const gradEl = document.getElementById('statGraduatedCohorts');
        const avgEl = document.getElementById('statAvgDuration');

        if (totalEl) totalEl.textContent = nienkhoaList.length;

        const activeCount = nienkhoaList.filter(item => item.end_year >= currentYear).length;
        const gradCount = nienkhoaList.filter(item => item.end_year < currentYear).length;

        if (activeEl) activeEl.textContent = activeCount;
        if (gradEl) gradEl.textContent = gradCount;

        if (avgEl && nienkhoaList.length > 0) {
            const sumDuration = nienkhoaList.reduce((acc, curr) => acc + (curr.end_year - curr.start_year), 0);
            avgEl.textContent = (sumDuration / nienkhoaList.length).toFixed(1);
        }
    }

    function filterAndRender() {
        const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const status = statusFilter ? statusFilter.value : 'ALL';

        const filtered = nienkhoaList.filter(item => {
            const matchSearch = !search ||
                item.name.toLowerCase().includes(search) ||
                item.cohort_code.toLowerCase().includes(search) ||
                String(item.start_year).includes(search) ||
                String(item.end_year).includes(search);

            const isGraduated = item.end_year < currentYear;
            const matchStatus = status === 'ALL' ||
                (status === 'ACTIVE' && !isGraduated) ||
                (status === 'GRADUATED' && isGraduated);

            return matchSearch && matchStatus;
        });

        renderTable(filtered);
    }

    function renderTable(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 24px;">Không tìm thấy niên khóa nào</td></tr>';
            return;
        }

        data.forEach(item => {
            const isGraduated = item.end_year < currentYear;
            const statusHtml = isGraduated ?
                '<span class="score-poor" style="padding: 2px 8px; border-radius: 10px; font-size: 11px;"><i class="fa-solid fa-graduation-cap"></i> Đã tốt nghiệp</span>' :
                '<span class="score-good" style="padding: 2px 8px; border-radius: 10px; font-size: 11px;"><i class="fa-solid fa-spinner"></i> Đang đào tạo</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>${item.cohort_code}</code></td>
                <td><strong>${item.name}</strong></td>
                <td>${item.start_year}</td>
                <td>${item.end_year}</td>
                <td>${statusHtml}</td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn-secondary admin-only" style="padding: 3px 8px; font-size: 11px;" onclick="editNienKhoa(${item.id})" title="Sửa niên khóa">
                            <i class="fa-solid fa-pen"></i> Sửa
                        </button>
                        <button class="btn-secondary admin-only" style="padding: 3px 8px; font-size: 11px; color: var(--danger); border-color: rgba(239, 68, 68, 0.4);" onclick="deleteNienKhoa(${item.id}, '${item.name.replace(/'/g, "\\'")}')" title="Xóa niên khóa">
                            <i class="fa-solid fa-trash"></i> Xóa
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    if (searchInput) searchInput.addEventListener('input', filterAndRender);
    if (statusFilter) statusFilter.addEventListener('change', filterAndRender);

    document.getElementById('openNKModalBtn')?.addEventListener('click', () => {
        document.getElementById('nkModalTitle').textContent = 'Thêm Niên Khóa Mới';
        form.reset();
        document.getElementById('nkId').value = '';
        modal.classList.add('active');
    });

    const closeModal = () => modal?.classList.remove('active');
    document.getElementById('nkModalCloseBtn')?.addEventListener('click', closeModal);
    document.getElementById('nkModalCancelBtn')?.addEventListener('click', closeModal);

    window.editNienKhoa = (id) => {
        const item = nienkhoaList.find(x => x.id === id);
        if (item) {
            document.getElementById('nkModalTitle').textContent = 'Cập Nhật Niên Khóa';
            document.getElementById('nkId').value = item.id;
            document.getElementById('nkCode').value = item.cohort_code;
            document.getElementById('nkName').value = item.name;
            document.getElementById('nkStartYear').value = item.start_year;
            document.getElementById('nkEndYear').value = item.end_year;
            modal.classList.add('active');
        }
    };

    window.deleteNienKhoa = async (id, name) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa niên khóa "${name}" không?\nLưu ý: Các lớp học thuộc niên khóa này có thể bị ảnh hưởng.`)) {
            return;
        }
        try {
            const res = await fetch(`/nienkhoa/${id}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' }
            });
            const data = await res.json();
            if (res.ok) {
                if (window.showToast) window.showToast('Xóa niên khóa thành công', 'success');
                else alert('Xóa niên khóa thành công');
                loadNienKhoa();
            } else {
                if (window.showToast) window.showToast(data.error || 'Lỗi khi xóa niên khóa', 'error');
                else alert(data.error || 'Lỗi khi xóa niên khóa');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Lỗi máy chủ khi xóa niên khóa', 'error');
            else alert('Lỗi máy chủ khi xóa niên khóa');
        }
    };

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('nkId').value;
        const payload = {
            cohort_code: document.getElementById('nkCode').value.trim(),
            name: document.getElementById('nkName').value.trim(),
            start_year: parseInt(document.getElementById('nkStartYear').value),
            end_year: parseInt(document.getElementById('nkEndYear').value)
        };

        if (payload.start_year >= payload.end_year) {
            if (window.showToast) window.showToast('Năm bắt đầu phải nhỏ hơn năm kết thúc', 'error');
            else alert('Năm bắt đầu phải nhỏ hơn năm kết thúc');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const origHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
        }

        try {
            const res = await fetch(id ? `/nienkhoa/${id}` : '/nienkhoa', {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                if (window.showToast) window.showToast(data.message || 'Lưu niên khóa thành công', 'success');
                closeModal();
                loadNienKhoa();
            } else {
                if (window.showToast) window.showToast(data.error || 'Lỗi khi lưu niên khóa', 'error');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Lỗi máy chủ khi lưu niên khóa', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origHtml;
            }
        }
    });

    loadNienKhoa();
});
