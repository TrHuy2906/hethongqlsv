
let allStudents = [];
let studentToDeleteId = null;
let catalogLops = [];
let studentPortalData = null;
let teacherPortalData = null;
let currentStudentTab = 'schedule';
let currentTeacherTab = 'students';

async function loadStudentPortal() {
    try {
        const res = await fetch('/api/student/portal');
        if (!res.ok) throw new Error('Không thể tải dữ liệu cổng sinh viên');
        studentPortalData = await res.json();
        renderStudentPortal();
    } catch (e) {
        showToast('Lỗi khi tải thông tin sinh viên', 'error');
    }
}

function renderStudentPortal() {
    if (!studentPortalData) return;
    const s = studentPortalData.student;
    const sum = studentPortalData.summary;

    const heroName = document.getElementById('studentHeroName');
    if (heroName) heroName.textContent = s.name;
    const heroCode = document.getElementById('studentHeroCode');
    if (heroCode) heroCode.textContent = s.student_code;
    const heroClass = document.getElementById('studentHeroClass');
    if (heroClass) heroClass.textContent = `Lớp: ${s.class_name || (s.lop ? s.lop.name : 'Chưa xếp lớp')}`;
    const heroAdvisor = document.getElementById('studentHeroAdvisor');
    if (heroAdvisor) heroAdvisor.textContent = (s.lop && s.lop.advisor) ? s.lop.advisor : 'ThS. Trần Quốc Huy';
    const heroMajor = document.getElementById('studentHeroMajor');
    if (heroMajor) heroMajor.textContent = (s.lop && s.lop.major_name) ? s.lop.major_name : 'Công nghệ thông tin';

    const avatar = document.getElementById('studentHeroAvatar');
    if (avatar) avatar.textContent = getInitials(s.name);

    const gpa10El = document.getElementById('studentSummaryGpa10');
    if (gpa10El) gpa10El.textContent = (sum.term_gpa || 0).toFixed(2);
    const gpa4El = document.getElementById('studentSummaryGpa4');
    if (gpa4El) {
        const g4 = (sum.term_gpa >= 8.5) ? 4.0 : (sum.term_gpa >= 8.0 ? 3.5 : (sum.term_gpa >= 7.0 ? 3.0 : (sum.term_gpa >= 6.5 ? 2.5 : 2.0)));
        gpa4El.textContent = g4.toFixed(1);
    }
    const creditsEl = document.getElementById('studentSummaryCredits');
    if (creditsEl) creditsEl.textContent = `${sum.total_credits} TC`;
    const attEl = document.getElementById('studentSummaryAttendance');
    if (attEl) attEl.textContent = `${sum.attendance_rate}%`;

    renderStudentScheduleTable(studentPortalData.schedules || []);
    renderStudentGradesTable(studentPortalData.grades || []);
    renderStudentAttendanceTable(studentPortalData.grades || []);
    renderStudentAssignmentsList(studentPortalData.assignments || []);
    renderStudentClassmatesTable(studentPortalData.classmates || [], s.lop);
}

function renderStudentScheduleTable(schedules) {
    const tbody = document.getElementById('studentScheduleTableBody');
    if (!tbody) return;
    if (schedules.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">Chưa có lịch học nào được sắp xếp</td></tr>';
        return;
    }
    const dayBadges = {
        'Thứ 2': 'bg-blue-50 text-blue-700 border-blue-200/60',
        'Thứ 3': 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
        'Thứ 4': 'bg-cyan-50 text-cyan-700 border-cyan-200/60',
        'Thứ 5': 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        'Thứ 6': 'bg-amber-50 text-amber-700 border-amber-200/60',
        'Thứ 7': 'bg-purple-50 text-purple-700 border-purple-200/60'
    };
    tbody.innerHTML = schedules.map(sc => {
        const badge = dayBadges[sc.day_of_week] || 'bg-slate-100 text-slate-700 border-slate-200';
        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-6 py-3.5 whitespace-nowrap">
                    <span class="px-2.5 py-1 rounded-lg text-xs font-bold border ${badge}">${sc.day_of_week}</span>
                </td>
                <td class="px-6 py-3.5 whitespace-nowrap font-semibold text-slate-800">
                    <div class="flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                        <span>${sc.period}</span>
                    </div>
                </td>
                <td class="px-6 py-3.5">
                    <div class="font-bold text-slate-900">${sc.subject_name}</div>
                    <span class="text-[11px] text-slate-400 font-mono">${sc.subject_code}</span>
                </td>
                <td class="px-6 py-3.5 text-center font-bold text-slate-700">${sc.credits} TC</td>
                <td class="px-6 py-3.5 whitespace-nowrap">
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                        <span class="material-symbols-outlined text-[14px] text-slate-500">meeting_room</span>
                        <span>${sc.room}</span>
                    </span>
                </td>
                <td class="px-6 py-3.5 whitespace-nowrap">
                    <span class="font-semibold text-slate-800">${sc.lecturer_name}</span>
                </td>
                <td class="px-6 py-3.5 whitespace-nowrap">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">${sc.study_type}</span>
                </td>
            </tr>
        `;
    }).join('');
}

function renderStudentGradesTable(grades) {
    const tbody = document.getElementById('studentGradesTableBody');
    if (!tbody) return;
    if (grades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-6 py-8 text-center text-slate-400">Chưa có bảng điểm môn học</td></tr>';
        return;
    }
    tbody.innerHTML = grades.map(g => {
        const isBanned = g.is_banned;
        const statusBadge = isBanned 
            ? '<span class="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse">Cấm thi</span>'
            : (g.diem_tong_ket !== null && g.diem_tong_ket >= 4.0 
                ? '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Đạt</span>' 
                : '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Đang học</span>');
        
        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-6 py-3.5 font-mono text-slate-500 font-bold">${g.subject_code}</td>
                <td class="px-6 py-3.5 font-bold text-slate-900">${g.subject_name}</td>
                <td class="px-4 py-3.5 text-center font-bold text-slate-600">${g.credits}</td>
                <td class="px-4 py-3.5 text-center font-semibold text-slate-700">${g.diem_chuyen_can !== null ? g.diem_chuyen_can.toFixed(1) : '--'}</td>
                <td class="px-4 py-3.5 text-center font-semibold text-slate-700">${g.diem_giua_ky !== null ? g.diem_giua_ky.toFixed(1) : '--'}</td>
                <td class="px-4 py-3.5 text-center bg-amber-50/70 font-black text-amber-700 text-sm">${g.diem_cuoi_ky !== null ? g.diem_cuoi_ky.toFixed(1) : '--'}</td>
                <td class="px-4 py-3.5 text-center font-black text-slate-900 text-sm">${g.diem_tong_ket !== null ? g.diem_tong_ket.toFixed(2) : '--'}</td>
                <td class="px-4 py-3.5 text-center font-bold text-indigo-600">${g.gpa4 !== null ? g.gpa4.toFixed(1) : '--'}</td>
                <td class="px-4 py-3.5 text-center font-black text-slate-800">${g.letter_grade}</td>
                <td class="px-6 py-3.5 text-center">${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

function renderStudentAttendanceTable(grades) {
    const tbody = document.getElementById('studentAttendanceTableBody');
    if (!tbody) return;
    if (grades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400">Chưa có dữ liệu điểm danh</td></tr>';
        return;
    }
    tbody.innerHTML = grades.map(g => {
        const isBanned = g.is_banned;
        const evaluation = isBanned
            ? `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-300">
                <span class="material-symbols-outlined text-[15px]">warning</span>
                <span>Cảnh báo cấm thi (Vắng ${g.absence_rate}%)</span>
               </span>`
            : `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span class="material-symbols-outlined text-[15px]">check_circle</span>
                <span>Đủ điều kiện dự thi</span>
               </span>`;

        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-6 py-3.5 font-bold text-slate-900">
                    <div>${g.subject_name}</div>
                    <span class="text-[11px] text-slate-400 font-mono">${g.subject_code}</span>
                </td>
                <td class="px-6 py-3.5 text-center font-semibold text-slate-600">${g.tong_so_buoi} buổi</td>
                <td class="px-6 py-3.5 text-center bg-rose-50/60 font-black text-rose-700 text-sm">${g.so_buoi_nghi} buổi</td>
                <td class="px-6 py-3.5 text-center font-bold text-emerald-600">${g.so_buoi_co_mat} buổi</td>
                <td class="px-6 py-3.5 text-center font-bold text-slate-800">${g.attendance_rate}%</td>
                <td class="px-6 py-3.5 text-center">${evaluation}</td>
            </tr>
        `;
    }).join('');
}

function renderStudentAssignmentsList(assignments) {
    const container = document.getElementById('studentAssignmentsList');
    if (!container) return;
    if (assignments.length === 0) {
        container.innerHTML = '<div class="col-span-2 p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200/80">Hiện tại chưa có bài tập nào được giao</div>';
        return;
    }
    container.innerHTML = assignments.map(b => {
        const isSub = b.is_submitted;
        const sub = b.submission;
        const lecName = b.lecturer_name || 'Giảng viên bộ môn';
        return `
            <div class="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:border-indigo-300 transition-all">
                <div class="space-y-2">
                    <div class="flex items-start justify-between gap-3">
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">${b.subject_name}</span>
                        ${isSub 
                            ? '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">check_circle</span> Đã nộp</span>' 
                            : '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">pending</span> Chưa nộp</span>'}
                    </div>
                    <h4 class="text-sm font-bold text-slate-900 leading-snug">${b.title}</h4>
                    <div class="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <span class="material-symbols-outlined text-[16px] text-indigo-500">person</span>
                        <span>Giảng viên giao bài: <strong class="text-slate-800">${lecName}</strong></span>
                    </div>
                    <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">${b.description || 'Không có mô tả chi tiết'}</p>
                    <div class="text-[11px] text-slate-400 flex items-center gap-1 pt-1 font-semibold">
                        <span class="material-symbols-outlined text-[14px] text-rose-500">alarm</span>
                        <span>Hạn nộp: <strong class="text-rose-600">${b.deadline}</strong></span>
                    </div>
                </div>

                ${isSub && sub ? `
                    <div class="p-3 bg-white border border-slate-200/70 rounded-xl text-xs space-y-1.5">
                        <div class="flex justify-between items-center text-slate-500 text-[11px]">
                            <span>Đã nộp lúc: <strong>${sub.submitted_at || 'Vừa xong'}</strong></span>
                            ${sub.score !== null ? `<span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">Điểm số: ${sub.score}/10</span>` : '<span class="text-slate-400">Chờ giảng viên chấm điểm</span>'}
                        </div>
                        <div class="font-medium text-slate-700 truncate"><span class="text-slate-400">Tệp:</span> ${sub.submission_file}</div>
                        ${sub.feedback ? `<div class="text-[11px] text-indigo-700 bg-indigo-50/70 p-2 rounded-lg font-medium border border-indigo-100 flex items-start gap-1.5"><span class="material-symbols-outlined text-[15px] text-indigo-600 shrink-0">comment</span><span>Lời phê của Thầy/Cô ${lecName}: <strong>${sub.feedback}</strong></span></div>` : ''}
                    </div>
                ` : ''}

                <div class="pt-2 flex justify-end">
                    <button type="button" onclick="window.openSubmitAssignmentModal(${b.id}, '${b.title.replace(/'/g, "\\'")}', '${b.subject_name.replace(/'/g, "\\'")}', '${lecName.replace(/'/g, "\\'")}')" class="px-4 py-2 rounded-xl bg-ictu-600 hover:bg-ictu-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
                        <span class="material-symbols-outlined text-[16px]">upload_file</span>
                        <span>${isSub ? 'Nộp lại bài' : 'Nộp bài tập'}</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderStudentClassmatesTable(classmates, lop) {
    const badge = document.getElementById('studentClassBadge');
    if (badge && lop) badge.textContent = `${lop.class_code} - ${lop.name}`;
    const tbody = document.getElementById('studentClassmatesTableBody');
    if (!tbody) return;
    if (classmates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">Không có danh sách lớp</td></tr>';
        return;
    }
    tbody.innerHTML = classmates.map(m => {
        const rank = getAcademicRank(m.score);
        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-6 py-3.5 font-mono text-slate-500 font-bold">${m.student_code || 'SV' + m.id}</td>
                <td class="px-6 py-3.5 font-bold text-slate-900">${m.name}</td>
                <td class="px-6 py-3.5 text-slate-600">${m.gender || 'Nam'}</td>
                <td class="px-6 py-3.5">
                    <span class="badge-score ${rank.css} text-xs font-bold px-2 py-0.5 rounded-lg">
                        ${m.score.toFixed(1)} - ${rank.label}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

window.switchStudentTab = function(tabName) {
    currentStudentTab = tabName;
    if (window.history && window.history.replaceState && (window.location.pathname === '/' || window.location.pathname === '/index.html')) {
        window.history.replaceState(null, '', `/?tab=${tabName}`);
    }
    const tabMap = {
        'schedule': { btn: 'btnTabSchedule', pane: 'paneStudentSchedule', nav: 'sideNavSchedule' },
        'grades': { btn: 'btnTabGrades', pane: 'paneStudentGrades', nav: 'sideNavGrades' },
        'attendance': { btn: 'btnTabAttendance', pane: 'paneStudentAttendance', nav: 'sideNavAttendance' },
        'assignments': { btn: 'btnTabAssignments', pane: 'paneStudentAssignments', nav: 'sideNavAssignments' },
        'classmates': { btn: 'btnTabClassmates', pane: 'paneStudentClassmates', nav: 'sideNavClassmates' }
    };

    Object.keys(tabMap).forEach(key => {
        const item = tabMap[key];
        const btn = document.getElementById(item.btn);
        const pane = document.getElementById(item.pane);
        const nav = document.getElementById(item.nav);

        if (key === tabName) {
            if (btn) {
                btn.className = 'tab-btn-student px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-ictu-600 text-white shadow-sm shadow-ictu-600/30';
            }
            if (pane) pane.classList.remove('hidden');
            if (nav) {
                nav.className = 'student-sidebar-nav flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-ictu-50 text-ictu-700 shadow-xs border border-ictu-100 student-strict-only';
            }
        } else {
            if (btn) {
                btn.className = 'tab-btn-student px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 text-slate-600 hover:text-ictu-600 hover:bg-slate-50';
            }
            if (pane) pane.classList.add('hidden');
            if (nav) {
                nav.className = 'student-sidebar-nav flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-ictu-700 hover:bg-slate-50 transition-colors student-strict-only';
            }
        }
    });

    if (typeof renderDynamicSidebar === 'function' && typeof currentUser !== 'undefined' && currentUser) {
        renderDynamicSidebar(currentUser);
    }
};

window.openSubmitAssignmentModal = function(assignmentId, title, subject, lecturer) {
    const modal = document.getElementById('submitAssignmentModal');
    if (!modal) return;
    document.getElementById('submitAssignmentId').value = assignmentId;
    document.getElementById('submitAssignmentTitle').textContent = title;
    document.getElementById('submitAssignmentSubject').textContent = subject;
    const lecName = lecturer || 'Giảng viên bộ môn';
    const lecEl = document.getElementById('submitAssignmentLecturer');
    if (lecEl) lecEl.textContent = lecName;
    const lecNoticeEl = document.getElementById('submitAssignmentLecturerNotice');
    if (lecNoticeEl) lecNoticeEl.textContent = lecName;
    document.getElementById('submitFileUrl').value = '';
    document.getElementById('submitNotes').value = '';
    modal.classList.add('active');
};


let currentLecturerTab = 'overview';
let lecturerPortalData = null;

async function loadLecturerPortal() {
    try {
        const res = await fetch('/api/lecturer/portal');
        if (!res.ok) return;
        lecturerPortalData = await res.json();
        renderLecturerPortal();
    } catch (e) {
    }
}

function renderLecturerPortal() {
    if (!lecturerPortalData) return;
    const lec = lecturerPortalData.lecturer || {};
    const stats = lecturerPortalData.stats || {};

    const heroAvatar = document.getElementById('lecturerHeroAvatar');
    if (heroAvatar) heroAvatar.textContent = getInitials(lec.name || 'Giảng viên');

    const heroName = document.getElementById('lecturerHeroName');
    if (heroName) heroName.textContent = lec.name || 'TS. Trần Văn Thầy';

    const heroCode = document.getElementById('lecturerHeroCode');
    if (heroCode) heroCode.textContent = lec.lecturer_code || ('GV' + (lec.id || '0064'));

    const heroDegree = document.getElementById('lecturerHeroDegree');
    if (heroDegree) heroDegree.textContent = (lec.degree || 'Tiến sĩ') + ' • ' + (lec.position || 'Giảng viên chính');

    const heroFaculty = document.getElementById('lecturerHeroFaculty');
    if (heroFaculty) heroFaculty.textContent = (lec.faculty_name || 'Khoa Công nghệ thông tin') + ' • ' + (lec.department_name || 'Bộ môn Kỹ thuật phần mềm');

    const heroSpec = document.getElementById('lecturerHeroSpecialization');
    if (heroSpec) heroSpec.textContent = lec.specialization || lec.research_direction || 'Kỹ thuật phần mềm & Hệ thống phân tán';

    const heroEmail = document.getElementById('lecturerHeroEmail');
    if (heroEmail) heroEmail.textContent = lec.email || (currentUser ? currentUser.email : 'gv1@qlsv.edu.vn');

    const heroClasses = document.getElementById('lecturerHeroClasses');
    if (heroClasses) heroClasses.textContent = stats.total_classes || 0;

    const heroStudents = document.getElementById('lecturerHeroStudents');
    if (heroStudents) heroStudents.textContent = stats.total_students || 0;

    const heroPendingSubs = document.getElementById('lecturerHeroPendingSubs');
    if (heroPendingSubs) heroPendingSubs.textContent = stats.pending_submissions || 0;

    const heroTheses = document.getElementById('lecturerHeroTheses');
    if (heroTheses) heroTheses.textContent = stats.theses_count || 0;

    renderLecturerOverview(lecturerPortalData);
    renderLecturerSchedule(lecturerPortalData.teaching_schedule || []);
    renderLecturerStudentsSection(lecturerPortalData);
    renderLecturerGradesSection(lecturerPortalData.grades || []);
    renderLecturerAssignmentsSection(lecturerPortalData);
    renderLecturerThesesSection(lecturerPortalData);
    renderLecturerDocsSection(lecturerPortalData);
    renderLecturerProfile(lec);

    renderTeacherScheduleTable(lecturerPortalData.teaching_schedule || []);
    renderTeacherAssignmentsTable(lecturerPortalData.assignments || []);
    renderTeacherSubmissionsTable(lecturerPortalData.submissions || []);
}

function renderLecturerOverview(data) {
    const list = document.getElementById('lecturerAnnouncementsList');
    if (list) {
        const announcements = data.announcements || [];
        if (announcements.length === 0) {
            list.innerHTML = '<div class="text-center py-6 text-slate-400 text-xs">Hiện tại không có thông báo mới nào</div>';
        } else {
            list.innerHTML = announcements.map(a => {
                const border = a.type === 'warning' ? 'border-amber-200 bg-amber-50/50' : (a.type === 'success' ? 'border-emerald-200 bg-emerald-50/50' : 'border-indigo-100 bg-indigo-50/40');
                const icon = a.type === 'warning' ? 'warning' : (a.type === 'success' ? 'check_circle' : 'info');
                const iconColor = a.type === 'warning' ? 'text-amber-600' : (a.type === 'success' ? 'text-emerald-600' : 'text-indigo-600');
                return `
                    <div class="p-3.5 rounded-xl border ${border} flex items-start gap-3">
                        <span class="material-symbols-outlined text-[20px] ${iconColor} shrink-0 mt-0.5">${icon}</span>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between gap-2">
                                <h4 class="text-xs font-bold text-slate-900 truncate">${a.title}</h4>
                                <span class="text-[10px] text-slate-400 font-semibold shrink-0">${a.time}</span>
                            </div>
                            <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">${a.content}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    const upList = document.getElementById('lecturerUpcomingScheduleList');
    if (upList) {
        const schedules = (data.teaching_schedule || []).slice(0, 3);
        if (schedules.length === 0) {
            upList.innerHTML = '<div class="text-center py-6 text-slate-400 text-xs">Chưa có ca giảng dạy nào sắp tới</div>';
        } else {
            upList.innerHTML = schedules.map(sc => `
                <div class="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-ictu-100 text-ictu-800 border border-ictu-200">${sc.day_of_week}</span>
                        <div>
                            <h5 class="text-xs font-bold text-slate-900">${sc.subject_name}</h5>
                            <span class="text-[11px] text-slate-500 font-medium">Lớp: ${sc.class_name || sc.class_code || 'Toàn khóa'} • ${sc.period}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-bold text-slate-700">
                            <span class="material-symbols-outlined text-[13px] text-slate-400">meeting_room</span>
                            <span>${sc.room}</span>
                        </span>
                    </div>
                </div>
            `).join('');
        }
    }

    const assignCount = document.getElementById('overviewAssignmentsCount');
    if (assignCount) assignCount.textContent = `${(data.assignments || []).length} bài tập`;
}

function renderLecturerSchedule(schedules) {
    const filterSub = document.getElementById('lecturerScheduleSubjectFilter');
    if (filterSub) {
        const currentVal = filterSub.value;
        const subjects = Array.from(new Set(schedules.map(s => s.subject_name).filter(Boolean)));
        filterSub.innerHTML = '<option value="ALL">Tất cả học phần</option>' + 
            subjects.map(s => `<option value="${s}">${s}</option>`).join('');
        if (subjects.includes(currentVal)) filterSub.value = currentVal;
    }
    window.filterLecturerSchedule();
}

window.filterLecturerSchedule = function() {
    if (!lecturerPortalData) return;
    const dayFilter = document.getElementById('lecturerScheduleDayFilter')?.value || 'ALL';
    const subFilter = document.getElementById('lecturerScheduleSubjectFilter')?.value || 'ALL';
    const schedules = lecturerPortalData.teaching_schedule || [];

    const filtered = schedules.filter(s => {
        const matchDay = (dayFilter === 'ALL' || s.day_of_week === dayFilter);
        const matchSub = (subFilter === 'ALL' || s.subject_name === subFilter);
        return matchDay && matchSub;
    });

    const tbody = document.getElementById('lecturerScheduleTableBody');
    if (!tbody) return;
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">Không có lịch giảng dạy phù hợp với bộ lọc</td></tr>';
        return;
    }

    const dayBadges = {
        'Thứ 2': 'bg-blue-50 text-blue-700 border-blue-200',
        'Thứ 3': 'bg-indigo-50 text-indigo-700 border-indigo-200',
        'Thứ 4': 'bg-cyan-50 text-cyan-700 border-cyan-200',
        'Thứ 5': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Thứ 6': 'bg-amber-50 text-amber-700 border-amber-200',
        'Thứ 7': 'bg-purple-50 text-purple-700 border-purple-200'
    };

    tbody.innerHTML = filtered.map(sc => {
        const badge = dayBadges[sc.day_of_week] || 'bg-slate-100 text-slate-700 border-slate-200';
        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-6 py-3.5 whitespace-nowrap">
                    <span class="px-2.5 py-1 rounded-lg text-xs font-bold border ${badge}">${sc.day_of_week}</span>
                </td>
                <td class="px-6 py-3.5 whitespace-nowrap font-semibold text-slate-800">
                    <div class="flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                        <span>${sc.period}</span>
                    </div>
                </td>
                <td class="px-6 py-3.5 font-bold text-slate-900">${sc.class_name || sc.class_code || 'Toàn khóa'}</td>
                <td class="px-6 py-3.5">
                    <div class="font-bold text-slate-900">${sc.subject_name}</div>
                    <span class="text-[11px] text-slate-400 font-mono">${sc.subject_code}</span>
                </td>
                <td class="px-6 py-3.5 text-center font-bold text-slate-700">${sc.credits} TC</td>
                <td class="px-6 py-3.5 whitespace-nowrap">
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                        <span class="material-symbols-outlined text-[14px] text-slate-500">meeting_room</span>
                        <span>${sc.room}</span>
                    </span>
                </td>
                <td class="px-6 py-3.5 whitespace-nowrap">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">${sc.study_type}</span>
                </td>
            </tr>
        `;
    }).join('');
};

function renderLecturerStudentsSection(data) {
    const classes = data.classes || [];
    const classBadge = document.getElementById('lecturerClassesCountBadge');
    if (classBadge) classBadge.textContent = `${classes.length} lớp`;

    const classTbody = document.getElementById('lecturerAssignedClassesTableBody');
    if (classTbody) {
        if (classes.length === 0) {
            classTbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">Chưa được phân công giảng dạy lớp nào</td></tr>';
        } else {
            classTbody.innerHTML = classes.map(c => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-6 py-3.5 font-mono text-xs font-bold text-ictu-700">${c.class_code || ('L' + c.id)}</td>
                    <td class="px-6 py-3.5 font-bold text-slate-900">${c.name}</td>
                    <td class="px-6 py-3.5 text-center font-extrabold text-slate-700">${c.student_count || 0} sinh viên</td>
                    <td class="px-6 py-3.5 text-right">
                        <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Giảng dạy học phần</span>
                    </td>
                </tr>
            `).join('');
        }
    }

    const classFilter = document.getElementById('lecturerStudentClassFilter');
    if (classFilter) {
        const cur = classFilter.value;
        classFilter.innerHTML = '<option value="ALL">Tất cả lớp học</option>' + 
            classes.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        if (cur) classFilter.value = cur;
    }

    window.renderLecturerStudentsTable();
}

window.renderLecturerStudentsTable = function() {
    if (!lecturerPortalData) return;
    const students = lecturerPortalData.students || [];
    const searchVal = (document.getElementById('lecturerStudentSearchInput')?.value || '').toLowerCase().trim();
    const classVal = document.getElementById('lecturerStudentClassFilter')?.value || 'ALL';

    const filtered = students.filter(s => {
        const sName = (s.name || '').toLowerCase();
        const sCode = (s.student_code || '').toLowerCase();
        const sClass = s.class_name || (s.class || '');
        const matchSearch = (!searchVal || sName.includes(searchVal) || sCode.includes(searchVal));
        const matchClass = (classVal === 'ALL' || sClass === classVal);
        return matchSearch && matchClass;
    });

    const tbody = document.getElementById('lecturerAssignedStudentsTableBody');
    if (!tbody) return;
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-8 text-center text-slate-400">Không tìm thấy sinh viên nào trong danh sách phụ trách</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(s => {
        const rank = getAcademicRank(s.score || 0);
        const sCode = s.student_code || ('SV' + String(s.id).padStart(4, '0'));
        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-6 py-3.5 font-mono text-xs font-bold text-slate-600">${sCode}</td>
                <td class="px-6 py-3.5">
                    <div class="font-bold text-slate-900">${s.name}</div>
                    <span class="text-[11px] text-slate-400 font-medium">${s.email || (sCode.toLowerCase() + '@qlsv.edu.vn')}</span>
                </td>
                <td class="px-6 py-3.5 text-slate-700">${s.gender || 'Nam'}</td>
                <td class="px-6 py-3.5 text-slate-600">${s.dob || '--'}</td>
                <td class="px-6 py-3.5 font-semibold text-slate-800">${s.class_name || s.class || 'Chưa xếp lớp'}</td>
                <td class="px-6 py-3.5 text-center font-black text-slate-900 text-sm">${(s.score || 0).toFixed(1)}</td>
                <td class="px-6 py-3.5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${rank.css}">${rank.label}</span>
                </td>
                <td class="px-6 py-3.5 text-right">
                    <button type="button" onclick="window.viewLecturerStudentDetail(${s.id})" class="px-3 py-1.5 rounded-xl border border-ictu-200 bg-ictu-50 hover:bg-ictu-100 text-ictu-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1 ml-auto cursor-pointer">
                        <span class="material-symbols-outlined text-[15px]">visibility</span>
                        <span>Xem hồ sơ</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
};

window.viewLecturerStudentDetail = function(studentId) {
    if (!lecturerPortalData) return;
    const s = (lecturerPortalData.students || []).find(item => item.id === studentId);
    if (!s) return;

    const modal = document.getElementById('lecturerStudentDetailModal');
    if (!modal) return;

    const sCode = s.student_code || ('SV' + String(s.id).padStart(4, '0'));
    const rank = getAcademicRank(s.score || 0);

    const avatar = document.getElementById('lecModalStudentAvatar');
    if (avatar) avatar.textContent = getInitials(s.name);
    const nameEl = document.getElementById('lecModalStudentName');
    if (nameEl) nameEl.textContent = s.name;
    const codeEl = document.getElementById('lecModalStudentCode');
    if (codeEl) codeEl.textContent = sCode;
    const classEl = document.getElementById('lecModalStudentClass');
    if (classEl) classEl.textContent = 'Lớp: ' + (s.class_name || s.class || 'Chưa xếp lớp');
    const genderEl = document.getElementById('lecModalStudentGender');
    if (genderEl) genderEl.textContent = s.gender || 'Nam';
    const dobEl = document.getElementById('lecModalStudentDob');
    if (dobEl) dobEl.textContent = s.dob || '15/09/2003';
    const emailEl = document.getElementById('lecModalStudentEmail');
    if (emailEl) emailEl.textContent = s.email || (sCode.toLowerCase() + '@qlsv.edu.vn');
    const scoreEl = document.getElementById('lecModalStudentScore');
    if (scoreEl) scoreEl.textContent = `${(s.score || 0).toFixed(2)} / 10.0`;
    const rankEl = document.getElementById('lecModalStudentRank');
    if (rankEl) rankEl.textContent = `${rank.label} (Điểm GPA: ${(s.score || 0).toFixed(1)})`;

    modal.classList.add('active');
};

function renderLecturerGradesSection(grades) {
    const subFilter = document.getElementById('lecturerGradeSubjectFilter');
    if (subFilter) {
        const cur = subFilter.value;
        const subjects = Array.from(new Set(grades.map(g => g.subject_name).filter(Boolean)));
        subFilter.innerHTML = '<option value="ALL">Tất cả môn học</option>' + 
            subjects.map(s => `<option value="${s}">${s}</option>`).join('');
        if (subjects.includes(cur)) subFilter.value = cur;
    }
    window.renderLecturerGradesTable();
}

window.renderLecturerGradesTable = function() {
    if (!lecturerPortalData) return;
    const grades = lecturerPortalData.grades || [];
    const subFilter = document.getElementById('lecturerGradeSubjectFilter')?.value || 'ALL';

    const filtered = grades.filter(g => {
        return (subFilter === 'ALL' || g.subject_name === subFilter);
    });

    const tbody = document.getElementById('lecturerGradesTableBody');
    if (!tbody) return;
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="px-6 py-8 text-center text-slate-400">Không có dữ liệu điểm môn học phù hợp</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(g => {
        const isBanned = g.is_banned;
        const statusBadge = isBanned 
            ? '<span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse">Cấm thi</span>'
            : (g.diem_tong_ket !== null && g.diem_tong_ket >= 4.0 
                ? '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Đạt</span>' 
                : '<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Đang học</span>');

        const sName = g.student_name || 'Sinh viên';
        const sCode = g.student_code || ('SV' + g.student_id);
        const sClass = g.student_class || 'Lớp sinh hoạt';
        const subj = g.subject_name || '';

        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-4 py-3.5 font-mono text-xs font-bold text-slate-600">${sCode}</td>
                <td class="px-4 py-3.5 font-bold text-slate-900">${sName}</td>
                <td class="px-4 py-3.5 text-xs text-slate-600">${sClass}</td>
                <td class="px-4 py-3.5">
                    <span class="font-bold text-slate-900 block">${subj}</span>
                    <span class="text-[10px] text-slate-400 font-mono">${g.subject_code}</span>
                </td>
                <td class="px-3 py-3.5 text-center font-semibold text-slate-700">${g.diem_chuyen_can !== null ? g.diem_chuyen_can.toFixed(1) : '--'}</td>
                <td class="px-3 py-3.5 text-center font-semibold text-slate-700">${g.diem_giua_ky !== null ? g.diem_giua_ky.toFixed(1) : '--'}</td>
                <td class="px-3 py-3.5 text-center bg-amber-50/70 font-black text-amber-800 text-sm">${g.diem_cuoi_ky !== null ? g.diem_cuoi_ky.toFixed(1) : '--'}</td>
                <td class="px-3 py-3.5 text-center font-black text-slate-900 text-sm">${g.diem_tong_ket !== null ? g.diem_tong_ket.toFixed(2) : '--'}</td>
                <td class="px-3 py-3.5 text-center font-bold text-indigo-600 text-xs">${g.letter_grade || '--'} / ${g.gpa4 !== null ? g.gpa4.toFixed(1) : '--'}</td>
                <td class="px-3 py-3.5 text-center font-bold text-rose-600">${g.so_buoi_nghi || 0} buổi</td>
                <td class="px-4 py-3.5 text-center">${statusBadge}</td>
                <td class="px-4 py-3.5 text-right">
                    <button type="button" onclick="window.openTeacherGradeModal(${g.id}, '${sName.replace(/'/g, "\'")}', '${subj.replace(/'/g, "\'")}', '${g.diem_chuyen_can !== null ? g.diem_chuyen_can : ''}', '${g.diem_giua_ky !== null ? g.diem_giua_ky : ''}', '${g.diem_cuoi_ky !== null ? g.diem_cuoi_ky : ''}', '${g.so_buoi_nghi || 0}')" class="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 ml-auto cursor-pointer">
                        <span class="material-symbols-outlined text-[15px]">edit_note</span>
                        <span>Nhập điểm</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
};

window.openTeacherGradeModal = function(gradeId, studentName, subjectName, diemCC, diemGK, diemCK, absences) {
    const modal = document.getElementById('teacherGradeModal');
    if (!modal) return;
    document.getElementById('teacherGradeId').value = gradeId;
    document.getElementById('teacherGradeStudentName').textContent = studentName;
    document.getElementById('teacherGradeSubject').textContent = subjectName;
    document.getElementById('teacherGradeAttendance').value = (diemCC !== undefined && diemCC !== null) ? diemCC : '';
    document.getElementById('teacherGradeMidterm').value = (diemGK !== undefined && diemGK !== null) ? diemGK : '';
    document.getElementById('teacherGradeFinalExam').value = (diemCK !== undefined && diemCK !== null) ? diemCK : '';
    document.getElementById('teacherGradeAbsences').value = (absences !== undefined && absences !== null) ? absences : 0;
    updateTeacherGradePreview();
    modal.classList.add('active');
};

function renderLecturerAssignmentsSection(data) {
    const assignments = data.assignments || [];
    const submissions = data.submissions || [];

    const assignTbody = document.getElementById('lecturerAssignmentsTableBody');
    if (assignTbody) {
        if (assignments.length === 0) {
            assignTbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Chưa có bài tập nào được giao</td></tr>';
        } else {
            assignTbody.innerHTML = assignments.map(b => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-6 py-3.5 font-bold text-slate-900">${b.title}</td>
                    <td class="px-6 py-3.5 text-slate-700">${b.subject_name}</td>
                    <td class="px-6 py-3.5 text-slate-600">${b.class_name || 'Toàn khóa'}</td>
                    <td class="px-6 py-3.5 font-semibold text-rose-600">${b.deadline}</td>
                    <td class="px-6 py-3.5 text-center font-bold text-emerald-600">${b.submission_count || 0} bài</td>
                </tr>
            `).join('');
        }
    }

    const subBadge = document.getElementById('lecturerSubmissionsCountBadge');
    if (subBadge) subBadge.textContent = `${submissions.length} bài nộp`;

    const subTbody = document.getElementById('lecturerSubmissionsTableBody');
    if (subTbody) {
        if (submissions.length === 0) {
            subTbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">Chưa có bài nộp nào từ sinh viên</td></tr>';
        } else {
            subTbody.innerHTML = submissions.map(sub => {
                const isGraded = sub.score !== null && sub.score !== undefined;
                const studentName = sub.student_name || 'Sinh viên';
                const studentCode = sub.student_code || ('SV' + sub.student_id);
                const studentClass = sub.student_class || 'Lớp học';
                const subj = sub.subject_name || '';
                const title = sub.assignment_title || '';
                const file = sub.submission_file || '';
                const note = sub.submission_note || '';
                const score = isGraded ? sub.score : '';
                const feedback = sub.feedback || '';

                return `
                    <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="px-6 py-3.5">
                            <div class="font-bold text-slate-900">${studentName}</div>
                            <div class="text-[11px] text-slate-400 font-mono">${studentCode}</div>
                        </td>
                        <td class="px-6 py-3.5 font-semibold text-slate-600">${studentClass}</td>
                        <td class="px-6 py-3.5">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/60 block w-fit mb-1">${subj}</span>
                            <span class="font-medium text-slate-800 text-xs">${title}</span>
                        </td>
                        <td class="px-6 py-3.5 text-slate-500 font-medium whitespace-nowrap">${sub.submitted_at || 'Vừa xong'}</td>
                        <td class="px-6 py-3.5">
                            <div class="font-mono text-xs text-indigo-600 font-bold truncate max-w-[160px]">${file}</div>
                            ${note ? `<div class="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">${note}</div>` : ''}
                        </td>
                        <td class="px-6 py-3.5 text-center">
                            ${isGraded ? `
                                <div class="inline-block px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200 text-xs">${score}/10</div>
                                ${feedback ? `<div class="text-[10px] text-slate-500 line-clamp-1 max-w-[140px] mx-auto mt-0.5" title="${feedback}">${feedback}</div>` : ''}
                            ` : `
                                <span class="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[11px]">Chờ chấm</span>
                            `}
                        </td>
                        <td class="px-6 py-3.5 text-right whitespace-nowrap">
                            <button type="button" onclick="window.openTeacherGradeSubModal(${sub.id}, '${studentName.replace(/'/g, "\'")}', '${studentCode}', '${studentClass.replace(/'/g, "\'")}', '${subj.replace(/'/g, "\'")}', '${title.replace(/'/g, "\'")}', '${file.replace(/'/g, "\'")}', '${note.replace(/'/g, "\'")}', '${score}', '${feedback.replace(/'/g, "\'")}')" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ml-auto cursor-pointer">
                                <span class="material-symbols-outlined text-[15px]">rate_review</span>
                                <span>${isGraded ? 'Sửa điểm' : 'Chấm bài'}</span>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}

function renderLecturerThesesSection(data) {
    const theses = data.theses || [];
    const internships = data.internships || [];

    const thBadge = document.getElementById('lecturerThesesCountBadge');
    if (thBadge) thBadge.textContent = `${theses.length} đề tài`;
    const inBadge = document.getElementById('lecturerInternshipsCountBadge');
    if (inBadge) inBadge.textContent = `${internships.length} sinh viên`;

    const thTbody = document.getElementById('lecturerThesesTableBody');
    if (thTbody) {
        if (theses.length === 0) {
            thTbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">Chưa có đề tài đồ án tốt nghiệp được phân công</td></tr>';
        } else {
            thTbody.innerHTML = theses.map(th => {
                const statusBadge = th.status === 'Chấp nhận' 
                    ? '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Chấp nhận</span>'
                    : (th.status === 'Từ chối'
                        ? '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Từ chối</span>'
                        : '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">Chờ duyệt</span>');

                const progressBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">${th.progress || 'Chưa bắt đầu'}</span>`;
                const isPending = (th.status === 'Chờ duyệt');

                return `
                    <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="px-4 py-3.5 font-mono text-xs font-bold text-slate-600">${th.project_code || ('DA' + th.id)}</td>
                        <td class="px-6 py-3.5">
                            <div class="font-bold text-slate-900">${th.name}</div>
                            ${th.description ? `<div class="text-[11px] text-slate-400 line-clamp-1 italic mt-0.5">${th.description}</div>` : ''}
                        </td>
                        <td class="px-4 py-3.5 font-semibold text-slate-800">${th.student_name || 'Sinh viên'}</td>
                        <td class="px-4 py-3.5 text-xs text-slate-600">${th.student_class || 'Lớp sinh hoạt'}</td>
                        <td class="px-4 py-3.5 text-center">${statusBadge}</td>
                        <td class="px-4 py-3.5 text-center">${progressBadge}</td>
                        <td class="px-6 py-3.5 text-right whitespace-nowrap">
                            <div class="flex items-center justify-end gap-1.5">
                                ${isPending ? `
                                    <button type="button" onclick="window.approveLecturerThesis(${th.id})" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer">
                                        Chấp nhận
                                    </button>
                                    <button type="button" onclick="window.rejectLecturerThesis(${th.id})" class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer">
                                        Từ chối
                                    </button>
                                ` : ''}
                                <button type="button" onclick="window.openLecturerProgressModal(${th.id}, '${th.name.replace(/'/g, "\'")}', '${th.progress || 'Chưa bắt đầu'}')" class="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-all shadow-xs cursor-pointer">
                                    Tiến độ
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    const inTbody = document.getElementById('lecturerInternshipsTableBody');
    if (inTbody) {
        if (internships.length === 0) {
            inTbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">Chưa có sinh viên nào trong danh sách thực tập doanh nghiệp</td></tr>';
        } else {
            inTbody.innerHTML = internships.map(inItem => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-4 py-3.5 font-mono text-xs font-bold text-slate-600">${inItem.internship_code || ('TT' + inItem.id)}</td>
                    <td class="px-6 py-3.5 font-bold text-slate-900">${inItem.student_name || 'Sinh viên'}</td>
                    <td class="px-4 py-3.5 text-xs text-slate-600">${inItem.student_class || 'Lớp sinh hoạt'}</td>
                    <td class="px-6 py-3.5 font-semibold text-slate-800">${inItem.company_name}</td>
                    <td class="px-4 py-3.5 text-slate-700">${inItem.position || 'Thực tập sinh'}</td>
                    <td class="px-4 py-3.5 text-center text-xs text-slate-500">${inItem.start_date || 'HK1'} - ${inItem.end_date || 'HK2'}</td>
                    <td class="px-4 py-3.5 text-center">
                        <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">${inItem.evaluation || 'Tốt'}</span>
                    </td>
                </tr>
            `).join('');
        }
    }
}

window.approveLecturerThesis = async function(id) {
    if (!confirm('Xác nhận CHẤP NHẬN đề tài đồ án tốt nghiệp này của sinh viên?')) return;
    try {
        const res = await fetch(`/projects/${id}/approve`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message || 'Đã chấp nhận hướng dẫn đề tài đồ án!', 'success');
            loadLecturerPortal();
        } else {
            showToast(data.error || 'Thao tác thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi kết nối máy chủ', 'error');
    }
};

window.rejectLecturerThesis = async function(id) {
    if (!confirm('Xác nhận TỪ CHỐI đề tài đồ án tốt nghiệp này?')) return;
    try {
        const res = await fetch(`/projects/${id}/reject`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message || 'Đã từ chối đề tài đồ án', 'info');
            loadLecturerPortal();
        } else {
            showToast(data.error || 'Thao tác thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi kết nối máy chủ', 'error');
    }
};

window.openLecturerProgressModal = function(id, title, currentProgress) {
    const modal = document.getElementById('lecturerUpdateProgressModal');
    if (!modal) return;
    document.getElementById('lecturerProgressProjectId').value = id;
    document.getElementById('lecturerProgressProjectTitle').textContent = title;
    const sel = document.getElementById('lecturerProgressSelect');
    if (sel) sel.value = currentProgress || 'Chưa bắt đầu';
    modal.classList.add('active');
};

function renderLecturerDocsSection(data) {
    const grid = document.getElementById('lecturerDocsGrid');
    if (!grid) return;
    const schedules = data.teaching_schedule || [];
    const subjects = Array.from(new Set(schedules.map(s => s.subject_name).filter(Boolean)));

    if (subjects.length === 0) {
        grid.innerHTML = '<div class="col-span-3 text-center py-8 text-slate-400 text-xs">Chưa có học phần nào được phân công tải tài liệu</div>';
        return;
    }

    grid.innerHTML = subjects.map((subj, idx) => {
        const sc = schedules.find(s => s.subject_name === subj) || {};
        return `
            <div class="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3 hover:shadow-sm transition-all">
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <span class="text-[10px] font-mono font-bold text-ictu-600 block">${sc.subject_code || ('HP' + (idx+1))}</span>
                        <h4 class="text-xs font-extrabold text-slate-900 mt-0.5">${subj}</h4>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Đã đồng bộ LMS</span>
                </div>
                <div class="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                    <div class="flex items-center justify-between">
                        <span class="text-slate-400">Đề cương chi tiết:</span>
                        <strong class="text-slate-700">Phiên bản 2025.1 (PDF)</strong>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-slate-400">Bộ Slide bài giảng:</span>
                        <strong class="text-slate-700">8 Chương / PPTX</strong>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-slate-400">Bài tập &amp; Case-study:</span>
                        <strong class="text-slate-700">4 Bài thực hành</strong>
                    </div>
                </div>
                <div class="pt-2 flex items-center justify-between">
                    <span class="text-[10px] text-slate-400 font-semibold">Cập nhật: Học kỳ 1</span>
                    <button type="button" onclick="showToast('Học liệu số của học phần đã đồng bộ hoàn chỉnh trên máy chủ LMS.', 'info')" class="text-xs font-bold text-ictu-600 hover:text-ictu-700 flex items-center gap-1 cursor-pointer">
                        <span class="material-symbols-outlined text-[15px]">cloud_sync</span>
                        <span>Đồng bộ LMS</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderLecturerProfile(lec) {
    const avatar = document.getElementById('lecturerProfileAvatar');
    if (avatar) avatar.textContent = getInitials(lec.name || 'Giảng viên');

    const nameEl = document.getElementById('lecturerProfileName');
    if (nameEl) nameEl.textContent = lec.name || 'TS. Trần Văn Thầy';

    const codeEl = document.getElementById('lecturerProfileCode');
    if (codeEl) codeEl.textContent = lec.lecturer_code || ('GV' + (lec.id || '0064'));

    const facultyEl = document.getElementById('lecturerProfileFaculty');
    if (facultyEl) facultyEl.textContent = (lec.faculty_name || 'Khoa Công nghệ thông tin') + ' • ' + (lec.department_name || 'Bộ môn Kỹ thuật phần mềm');

    const degreeEl = document.getElementById('lecturerProfileDegree');
    if (degreeEl) degreeEl.textContent = (lec.degree || 'Tiến sĩ') + ' (' + (lec.position || 'Giảng viên chính') + ')';

    const userEl = document.getElementById('lecturerProfileUsername');
    if (userEl) userEl.textContent = (currentUser ? currentUser.username : 'gv1');

    const emailEl = document.getElementById('lecturerProfileEmail');
    if (emailEl) emailEl.textContent = lec.email || (currentUser ? currentUser.email : 'gv1@qlsv.edu.vn');

    const resEl = document.getElementById('lecturerProfileResearch');
    if (resEl) resEl.textContent = lec.specialization || lec.research_direction || 'Kỹ thuật phần mềm & Hệ thống phân tán';
}

window.switchLecturerTab = function(tabName) {
    currentLecturerTab = tabName;
    if (window.history && window.history.replaceState && (window.location.pathname === '/' || window.location.pathname === '/index.html')) {
        window.history.replaceState(null, '', `/?tab=${tabName}`);
    }
    const tabs = ['overview', 'schedule', 'students', 'grades', 'assignments', 'theses', 'docs', 'profile'];
    const tabMap = {
        'overview': { btn: 'btnLecturerTabOverview', pane: 'paneLecturerOverview', nav: 'sideNavLecturerOverview' },
        'schedule': { btn: 'btnLecturerTabSchedule', pane: 'paneLecturerSchedule', nav: 'sideNavLecturerSchedule' },
        'students': { btn: 'btnLecturerTabStudents', pane: 'paneLecturerStudents', nav: 'sideNavLecturerStudents' },
        'grades': { btn: 'btnLecturerTabGrades', pane: 'paneLecturerGrades', nav: 'sideNavLecturerGrades' },
        'assignments': { btn: 'btnLecturerTabAssignments', pane: 'paneLecturerAssignments', nav: 'sideNavLecturerAssignments' },
        'theses': { btn: 'btnLecturerTabTheses', pane: 'paneLecturerTheses', nav: 'sideNavLecturerTheses' },
        'docs': { btn: 'btnLecturerTabDocs', pane: 'paneLecturerDocs', nav: 'sideNavLecturerDocs' },
        'profile': { btn: 'btnLecturerTabProfile', pane: 'paneLecturerProfile', nav: 'sideNavLecturerProfile' }
    };

    tabs.forEach(key => {
        const item = tabMap[key];
        const btn = document.getElementById(item.btn);
        const pane = document.getElementById(item.pane);
        const nav = document.getElementById(item.nav);

        if (key === tabName) {
            if (btn) btn.className = 'tab-btn-lecturer px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-ictu-600 text-white shadow-sm shadow-ictu-600/30';
            if (pane) pane.classList.remove('hidden');
            if (nav) nav.className = 'lecturer-sidebar-nav flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-ictu-50 text-ictu-700 shadow-xs border border-ictu-100 lecturer-strict-only';
        } else {
            if (btn) btn.className = 'tab-btn-lecturer px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 text-slate-600 hover:text-ictu-600 hover:bg-slate-50';
            if (pane) pane.classList.add('hidden');
            if (nav) nav.className = 'lecturer-sidebar-nav flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-ictu-700 hover:bg-slate-50 transition-colors lecturer-strict-only';
        }
    });

    if (typeof renderDynamicSidebar === 'function' && typeof currentUser !== 'undefined' && currentUser) {
        renderDynamicSidebar(currentUser);
    }
};

async function loadTeacherPortal() {
    try {
        const res = await fetch('/api/lecturer/portal');
        if (!res.ok) return;
        teacherPortalData = await res.json();
        renderTeacherPortal();
    } catch (e) {
    }
}

function renderTeacherPortal() {
    if (!teacherPortalData) return;
    renderTeacherScheduleTable(teacherPortalData.teaching_schedule || []);
    renderTeacherAssignmentsTable(teacherPortalData.assignments || []);
    renderTeacherSubmissionsTable(teacherPortalData.submissions || []);
}

function renderTeacherScheduleTable(schedules) {
    const tbody = document.getElementById('teacherScheduleTableBody');
    if (!tbody) return;
    if (schedules.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">Chưa có lịch giảng dạy được xếp</td></tr>';
        return;
    }
    tbody.innerHTML = schedules.map(sc => `
        <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="px-6 py-3.5 font-bold text-ictu-700 whitespace-nowrap">${sc.day_of_week}</td>
            <td class="px-6 py-3.5 font-semibold text-slate-700 whitespace-nowrap">${sc.period}</td>
            <td class="px-6 py-3.5 font-bold text-slate-900">${sc.class_name || sc.class_code || 'Toàn khóa'}</td>
            <td class="px-6 py-3.5 font-bold text-slate-900">${sc.subject_name}</td>
            <td class="px-6 py-3.5 text-center font-bold text-slate-600">${sc.credits} TC</td>
            <td class="px-6 py-3.5 font-semibold text-slate-700">${sc.room}</td>
            <td class="px-6 py-3.5 text-slate-600">${sc.study_type}</td>
        </tr>
    `).join('');
}

function renderTeacherAssignmentsTable(assignments) {
    const tbody = document.getElementById('teacherAssignmentsTableBody');
    if (!tbody) return;
    if (assignments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Chưa giao bài tập nào cho lớp</td></tr>';
        return;
    }
    tbody.innerHTML = assignments.map(b => `
        <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="px-6 py-3.5 font-bold text-slate-900">${b.title}</td>
            <td class="px-6 py-3.5 text-slate-700">${b.subject_name}</td>
            <td class="px-6 py-3.5 text-slate-600">${b.class_name || 'Toàn khóa'}</td>
            <td class="px-6 py-3.5 font-semibold text-rose-600">${b.deadline}</td>
            <td class="px-6 py-3.5 text-center font-bold text-emerald-600">${b.submission_count || 0} bài</td>
        </tr>
    `).join('');
}

function renderTeacherSubmissionsTable(submissions) {
    const tbody = document.getElementById('teacherSubmissionsTableBody');
    const badge = document.getElementById('teacherSubmissionsCountBadge');
    if (badge) badge.textContent = `${submissions.length} bài nộp`;
    if (!tbody) return;
    if (submissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">Chưa có sinh viên nào nộp bài tập cho các học phần của Thầy/Cô</td></tr>';
        return;
    }
    tbody.innerHTML = submissions.map(sub => {
        const isGraded = sub.score !== null && sub.score !== undefined;
        const studentName = sub.student_name || 'Sinh viên';
        const studentCode = sub.student_code || 'SV' + sub.student_id;
        const studentClass = sub.student_class || 'Lớp học';
        const subj = sub.subject_name || '';
        const title = sub.assignment_title || '';
        const file = sub.submission_file || '';
        const note = sub.submission_note || '';
        const score = isGraded ? sub.score : '';
        const feedback = sub.feedback || '';

        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-6 py-3.5">
                    <div class="font-bold text-slate-900">${studentName}</div>
                    <div class="text-[11px] text-slate-400 font-mono">${studentCode}</div>
                </td>
                <td class="px-6 py-3.5 font-semibold text-slate-600">${studentClass}</td>
                <td class="px-6 py-3.5">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/60 block w-fit mb-1">${subj}</span>
                    <span class="font-medium text-slate-800 text-xs">${title}</span>
                </td>
                <td class="px-6 py-3.5 text-slate-500 font-medium whitespace-nowrap">${sub.submitted_at || 'Vừa xong'}</td>
                <td class="px-6 py-3.5">
                    <div class="font-mono text-xs text-indigo-600 font-bold truncate max-w-[160px]">${file}</div>
                    ${note ? `<div class="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">${note}</div>` : ''}
                </td>
                <td class="px-6 py-3.5 text-center">
                    ${isGraded ? `
                        <div class="inline-block px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200 text-xs">${score}/10</div>
                        ${feedback ? `<div class="text-[10px] text-slate-500 line-clamp-1 max-w-[140px] mx-auto mt-0.5" title="${feedback}">${feedback}</div>` : ''}
                    ` : `
                        <span class="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[11px]">Chờ chấm</span>
                    `}
                </td>
                <td class="px-6 py-3.5 text-right whitespace-nowrap">
                    <button type="button" onclick="window.openTeacherGradeSubModal(${sub.id}, '${studentName.replace(/'/g, "\\'")}', '${studentCode}', '${studentClass.replace(/'/g, "\\'")}', '${subj.replace(/'/g, "\\'")}', '${title.replace(/'/g, "\\'")}', '${file.replace(/'/g, "\\'")}', '${note.replace(/'/g, "\\'")}', '${score}', '${feedback.replace(/'/g, "\\'")}')" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ml-auto cursor-pointer">
                        <span class="material-symbols-outlined text-[15px]">rate_review</span>
                        <span>${isGraded ? 'Sửa điểm' : 'Chấm bài'}</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

window.openTeacherGradeSubModal = function(subId, studentName, studentCode, studentClass, subject, title, file, note, currentScore, currentFeedback) {
    const modal = document.getElementById('teacherGradeSubmissionModal');
    if (!modal) return;
    document.getElementById('teacherGradeSubId').value = subId;
    document.getElementById('gradeSubStudentName').textContent = studentName;
    document.getElementById('gradeSubStudentMeta').textContent = `Mã SV: ${studentCode} • Lớp: ${studentClass}`;
    document.getElementById('gradeSubSubject').textContent = subject;
    document.getElementById('gradeSubAssignmentTitle').textContent = title;
    document.getElementById('gradeSubFile').textContent = file || 'Không có tệp đính kèm';
    document.getElementById('gradeSubNote').textContent = note || 'Không có ghi chú';
    document.getElementById('gradeSubScore').value = (currentScore !== null && currentScore !== undefined) ? currentScore : '';
    document.getElementById('gradeSubFeedback').value = currentFeedback || '';
    modal.classList.add('active');
};

window.switchTeacherTab = function(tabName) {
    currentTeacherTab = tabName;
    const tabStudents = document.getElementById('paneTeacherStudents');
    const tabSchedule = document.getElementById('paneTeacherSchedule');
    const tabAssignments = document.getElementById('paneTeacherAssignments');

    const btnStudents = document.getElementById('btnTeacherTabStudents');
    const btnSchedule = document.getElementById('btnTeacherTabSchedule');
    const btnAssignments = document.getElementById('btnTeacherTabAssignments');

    if (tabStudents) tabStudents.classList.toggle('hidden', tabName !== 'students');
    if (tabSchedule) tabSchedule.classList.toggle('hidden', tabName !== 'schedule');
    if (tabAssignments) tabAssignments.classList.toggle('hidden', tabName !== 'assignments');

    if (btnStudents) {
        btnStudents.className = tabName === 'students' 
            ? 'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-ictu-600 text-white shadow-xs'
            : 'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 text-slate-600 hover:text-ictu-600 hover:bg-slate-50';
    }
    if (btnSchedule) {
        btnSchedule.className = tabName === 'schedule' 
            ? 'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-ictu-600 text-white shadow-xs'
            : 'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 text-slate-600 hover:text-ictu-600 hover:bg-slate-50';
    }
    if (btnAssignments) {
        btnAssignments.className = tabName === 'assignments' 
            ? 'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-ictu-600 text-white shadow-xs'
            : 'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 text-slate-600 hover:text-ictu-600 hover:bg-slate-50';
    }
};

window.openTeacherGradeModal = function(gradeId, studentName, subject, cc, gk, ck, absences) {
    const modal = document.getElementById('teacherGradeModal');
    if (!modal) return;
    document.getElementById('teacherGradeId').value = gradeId;
    document.getElementById('teacherGradeStudentName').textContent = studentName;
    document.getElementById('teacherGradeSubject').textContent = subject;
    document.getElementById('teacherGradeAttendance').value = (cc !== null && cc !== undefined) ? cc : '';
    document.getElementById('teacherGradeMidterm').value = (gk !== null && gk !== undefined) ? gk : '';
    document.getElementById('teacherGradeFinalExam').value = (ck !== null && ck !== undefined) ? ck : '';
    document.getElementById('teacherGradeAbsences').value = (absences !== null && absences !== undefined) ? absences : 0;
    
    updateTeacherGradePreview();
    modal.classList.add('active');
};

function updateTeacherGradePreview() {
    const cc = parseFloat(document.getElementById('teacherGradeAttendance')?.value) || 0;
    const gk = parseFloat(document.getElementById('teacherGradeMidterm')?.value) || 0;
    const ck = parseFloat(document.getElementById('teacherGradeFinalExam')?.value) || 0;
    const preview = document.getElementById('teacherGradePreview');
    if (!preview) return;
    const total = (cc * 0.1) + (gk * 0.3) + (ck * 0.6);
    preview.textContent = `${total.toFixed(2)} / 10.0`;
}


async function loadLopCatalog() {
    try {
        const res = await fetch('/lop', { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
            catalogLops = await res.json();
            const dl = document.getElementById('classListData');
            if (dl) {
                dl.innerHTML = catalogLops.map(l => `<option value="${l.class_code} - ${l.name}">`).join('');
            }
        }
    } catch (e) {
        console.error('Lỗi tải danh mục lớp:', e);
    }
}


async function loadStudents() {
    try {
        await loadLopCatalog();
        const res = await fetch('/students');
        if (!res.ok) throw new Error('Không thể tải dữ liệu sinh viên');
        allStudents = await res.json();
        updateStats();
        populateClassFilter();
        renderStudents();
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}


function updateStats() {
    const total = allStudents.length;
    const statTotalEl = document.getElementById('statTotalStudents');
    if (statTotalEl) statTotalEl.textContent = total;

    if (total === 0) {
        const avgEl = document.getElementById('statAvgScore');
        if (avgEl) avgEl.textContent = '0.0';
        const topEl = document.getElementById('statTopStudents');
        if (topEl) topEl.textContent = '0';
        const classEl = document.getElementById('statTotalClasses');
        if (classEl) classEl.textContent = '0';
        return;
    }

    const sumScore = allStudents.reduce((acc, s) => acc + (s.score || 0), 0);
    const avg = (sumScore / total).toFixed(2);
    const avgEl = document.getElementById('statAvgScore');
    if (avgEl) avgEl.textContent = avg;

    const topCount = allStudents.filter(s => s.score >= 8.0).length;
    const topEl = document.getElementById('statTopStudents');
    if (topEl) topEl.textContent = topCount;

    const classes = new Set(allStudents.map(s => s.class || s.class_name).filter(Boolean));
    const classEl = document.getElementById('statTotalClasses');
    if (classEl) classEl.textContent = classes.size;
}


function populateClassFilter() {
    const filter = document.getElementById('classFilter');
    if (!filter) return;
    const currentVal = filter.value;
    const classes = Array.from(new Set(allStudents.map(s => s.class || s.class_name).filter(Boolean))).sort();

    filter.innerHTML = '<option value="ALL">Tất cả các lớp</option>';
    classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = `Lớp ${c}`;
        filter.appendChild(opt);
    });
    if (classes.includes(currentVal)) {
        filter.value = currentVal;
    }
}


function renderStudents() {
    const searchInput = document.getElementById('searchInput');
    const classFilter = document.getElementById('classFilter');
    const rankFilter = document.getElementById('rankFilter');
    const sortByEl = document.getElementById('sortBy');

    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const classVal = classFilter ? classFilter.value : 'ALL';
    const rankVal = rankFilter ? rankFilter.value : 'ALL';
    const sortBy = sortByEl ? sortByEl.value : 'ID_DESC';

    let filtered = allStudents.filter(s => {
        const nameMatch = s.name.toLowerCase().includes(search);
        const codeMatch = (s.student_code || '').toLowerCase().includes(search);
        const classMatch = (s.class || s.class_name || '').toLowerCase().includes(search);
        const matchesSearch = !search || nameMatch || codeMatch || classMatch;

        const matchesClass = (classVal === 'ALL') || (s.class || s.class_name) === classVal;

        const rank = getAcademicRank(s.score);
        const matchesRank = (rankVal === 'ALL') || (rank.code === rankVal);

        return matchesSearch && matchesClass && matchesRank;
    });


    filtered.sort((a, b) => {
        if (sortBy === 'ID_DESC') return b.id - a.id;
        if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name, 'vi');
        if (sortBy === 'SCORE_DESC') return b.score - a.score;
        if (sortBy === 'SCORE_ASC') return a.score - b.score;
        return 0;
    });

    const tbody = document.getElementById('studentTableBody');
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
        const rank = getAcademicRank(s.score);
        const initials = getInitials(s.name);
        const avatarBg = getAvatarGradient(s.name);
        const className = s.class || s.class_name || 'Chưa xếp lớp';

        return `
            <tr>
                <td>
                    <strong style="color: var(--text-dim); font-size: 13px;">${s.student_code || 'Chưa có'}</strong>
                </td>
                <td>
                    <div class="student-info">
                        <div class="avatar" style="background: ${avatarBg};">${initials}</div>
                        <div>
                            <div class="student-name">${s.name}</div>
                            <div class="student-id">${s.gender ? s.gender + ' | ' : ''}${s.dob || 'Chưa cập nhật ngày sinh'}</div>
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
                                <button class="btn-secondary" style="padding: 2px 8px; font-size: 11px; color: var(--primary); border-color: rgba(99, 102, 241, 0.4);" onclick="quickCreateStudentAccount(${s.id}, '${s.name.replace(/'/g, "\\'")}', '${s.student_code || ''}')" title="Cấp ngay tài khoản đăng nhập cho sinh viên này">
                                    <i class="fa-solid fa-key"></i> Cấp tài khoản
                                </button>
                            ` : '')}
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge-class">${className}</span>
                </td>
                <td>
                    <span class="badge-score ${rank.css}">
                        <i class="fa-solid ${rank.icon}"></i> ${s.score.toFixed(1)}
                    </span>
                </td>
                <td>
                    <span style="font-weight: 600; font-size: 13px;">${rank.label}</span>
                </td>
                ${isAdmin ? `
                <td style="text-align: right;">
                    <div class="action-btns" style="justify-content: flex-end;">
                        <button class="btn-action edit" onclick="editStudent(${s.id})" title="Chỉnh sửa" aria-label="Sửa sinh viên ${s.name}">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-action delete" onclick="openDeleteModal(${s.id}, '${s.name.replace(/'/g, "\\'")}')" title="Xóa" aria-label="Xóa sinh viên ${s.name}">
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
    const studentModal = document.getElementById('studentModal');
    const studentForm = document.getElementById('studentForm');
    const deleteModal = document.getElementById('deleteConfirmModal');

    const scoreInput = document.getElementById('studentScore');
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
        if (!currentUser || currentUser.role !== 2) {
            openAddBtn.style.setProperty('display', 'none', 'important');
        }
        openAddBtn.addEventListener('click', () => {
            if (!currentUser || currentUser.role !== 2) {
                showToast('Chỉ Quản trị viên mới có quyền thêm sinh viên', 'error');
                return;
            }
            document.getElementById('modalTitle').textContent = 'Thêm Sinh Viên Mới';
            document.getElementById('studentId').value = '';
            studentForm.reset();
            const statusContainer = document.getElementById('accountStatusContainer');
            if (statusContainer) {
                statusContainer.innerHTML = `
                    <label style="display: flex; align-items: center; gap: 8px; font-weight: 500; cursor: pointer; margin: 0;">
                        <input type="checkbox" id="autoCreateAccountCheckbox" checked style="width: 16px; height: 16px;">
                        <span>Tự động cấp tài khoản đăng nhập (Tên đăng nhập & Mật khẩu theo Mã SV)</span>
                    </label>
                `;
            }
            document.getElementById('studentAccountId').value = '';
            document.getElementById('scoreRatingPreview').textContent = '--';
            studentModal.classList.add('active');
        });
    }

    function closeModal() {
        if (studentModal) studentModal.classList.remove('active');
    }

    const modalCloseBtn = document.getElementById('modalCloseBtn');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);

    if (studentForm) {
        studentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('studentId').value;
            const name = document.getElementById('studentName').value.trim();
            const class_name = document.getElementById('studentClass').value.trim();
            const score = parseFloat(document.getElementById('studentScore').value);
            const student_code = document.getElementById('studentCode').value.trim() || null;
            const gender = document.getElementById('studentGender').value || null;
            const dob = document.getElementById('studentDob').value || null;
            const email = document.getElementById('studentEmail').value.trim() || null;
            const account_id = document.getElementById('studentAccountId').value ? parseInt(document.getElementById('studentAccountId').value) : null;

            if (!name || !class_name || isNaN(score) || score < 0 || score > 10) {
                showToast('Vui lòng kiểm tra lại thông tin hợp lệ!', 'error');
                return;
            }

            const auto_create_account = document.getElementById('autoCreateAccountCheckbox')?.checked || false;

            const payload = {
                name,
                class: class_name,
                score,
                student_code,
                gender,
                dob,
                email,
                account_id,
                auto_create_account
            };

            const submitBtn = studentForm.querySelector('button[type="submit"]');
            const origHtml = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
            }

            try {
                let res;
                if (id) {
                    res = await fetch(`/students/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    res = await fetch('/students', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                const resData = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(resData.error || resData.message || 'Thao tác không thành công');
                }

                showToast(id ? 'Đã cập nhật sinh viên thành công!' : 'Đã thêm sinh viên thành công!', 'success');
                closeModal();
                loadStudents();
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
        studentToDeleteId = null;
    }

    const delCloseBtn = document.getElementById('deleteModalCloseBtn');
    if (delCloseBtn) delCloseBtn.addEventListener('click', closeDeleteModal);
    const delCancelBtn = document.getElementById('deleteCancelBtn');
    if (delCancelBtn) delCancelBtn.addEventListener('click', closeDeleteModal);

    const confirmDelBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDelBtn) {
        confirmDelBtn.addEventListener('click', async () => {
            if (!studentToDeleteId) return;
            try {
                const res = await fetch(`/students/${studentToDeleteId}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Không thể xóa sinh viên');
                showToast('Đã xóa sinh viên thành công!', 'info');
                closeDeleteModal();
                loadStudents();
            } catch (err) {
                console.error(err);
                showToast(err.message, 'error');
            }
        });
    }

    const searchEl = document.getElementById('searchInput');
    if (searchEl) searchEl.addEventListener('input', renderStudents);
    const classF = document.getElementById('classFilter');
    if (classF) classF.addEventListener('change', renderStudents);
    const rankF = document.getElementById('rankFilter');
    if (rankF) rankF.addEventListener('change', renderStudents);
    const sortF = document.getElementById('sortBy');
    if (sortF) sortF.addEventListener('change', renderStudents);

    const submitModal = document.getElementById('submitAssignmentModal');
    const submitForm = document.getElementById('submitAssignmentForm');
    const closeSubmitBtn = document.getElementById('closeSubmitModalBtn');
    const cancelSubmitBtn = document.getElementById('cancelSubmitModalBtn');

    if (closeSubmitBtn && submitModal) closeSubmitBtn.addEventListener('click', () => submitModal.classList.remove('active'));
    if (cancelSubmitBtn && submitModal) cancelSubmitBtn.addEventListener('click', () => submitModal.classList.remove('active'));

    if (submitForm && submitModal) {
        submitForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('submitAssignmentId').value;
            const file = document.getElementById('submitFileUrl').value.trim();
            const notes = document.getElementById('submitNotes').value.trim();
            if (!file) {
                showToast('Vui lòng nhập tệp bài làm hoặc liên kết nộp bài', 'error');
                return;
            }
            try {
                const res = await fetch(`/api/student/assignments/${id}/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ submission_file: file, submission_note: notes })
                });
                const data = await res.json();
                if (res.ok) {
                    showToast(data.message || 'Nộp bài tập thành công!', 'success');
                    submitModal.classList.remove('active');
                    loadStudentPortal();
                } else {
                    showToast(data.error || 'Nộp bài thất bại', 'error');
                }
            } catch (err) {
                showToast('Lỗi mạng khi nộp bài tập', 'error');
            }
        });
    }

    const teacherGradeModal = document.getElementById('teacherGradeModal');
    const teacherGradeForm = document.getElementById('teacherGradeForm');
    const closeTeacherGradeBtn = document.getElementById('closeTeacherGradeModalBtn');
    const cancelTeacherGradeBtn = document.getElementById('cancelTeacherGradeModalBtn');

    if (closeTeacherGradeBtn && teacherGradeModal) closeTeacherGradeBtn.addEventListener('click', () => teacherGradeModal.classList.remove('active'));
    if (cancelTeacherGradeBtn && teacherGradeModal) cancelTeacherGradeBtn.addEventListener('click', () => teacherGradeModal.classList.remove('active'));

    ['teacherGradeAttendance', 'teacherGradeMidterm', 'teacherGradeFinalExam'].forEach(id => {
        const inp = document.getElementById(id);
        if (inp) inp.addEventListener('input', updateTeacherGradePreview);
    });

    if (teacherGradeForm && teacherGradeModal) {
        teacherGradeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('teacherGradeId').value;
            const cc = document.getElementById('teacherGradeAttendance').value;
            const gk = document.getElementById('teacherGradeMidterm').value;
            const ck = document.getElementById('teacherGradeFinalExam').value;
            const absences = document.getElementById('teacherGradeAbsences').value;
            try {
                const res = await fetch(`/api/lecturer/grades/${id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        diem_chuyen_can: cc ? parseFloat(cc) : null,
                        diem_giua_ky: gk ? parseFloat(gk) : null,
                        diem_cuoi_ky: ck ? parseFloat(ck) : null,
                        so_buoi_nghi: absences ? parseInt(absences) : 0
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    showToast(data.message || 'Cập nhật điểm và số buổi nghỉ thành công!', 'success');
                    teacherGradeModal.classList.remove('active');
                    loadTeacherPortal();
                    if (currentUser && currentUser.role === 0) loadStudentPortal();
                } else {
                    showToast(data.error || 'Lỗi cập nhật', 'error');
                }
            } catch (err) {
                showToast('Lỗi kết nối máy chủ', 'error');
            }
        });
    }

    const openCreateAssignBtn = document.getElementById('openCreateAssignmentBtn');
    const createAssignModal = document.getElementById('teacherCreateAssignmentModal');
    const createAssignForm = document.getElementById('createAssignmentForm');
    const closeCreateAssignBtn = document.getElementById('closeCreateAssignModalBtn');
    const cancelCreateAssignBtn = document.getElementById('cancelCreateAssignModalBtn');

    if (openCreateAssignBtn && createAssignModal) openCreateAssignBtn.addEventListener('click', () => createAssignModal.classList.add('active'));
    if (closeCreateAssignBtn && createAssignModal) closeCreateAssignBtn.addEventListener('click', () => createAssignModal.classList.remove('active'));
    if (cancelCreateAssignBtn && createAssignModal) cancelCreateAssignBtn.addEventListener('click', () => createAssignModal.classList.remove('active'));

    if (createAssignForm && createAssignModal) {
        createAssignForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('createAssignTitle').value.trim();
            const subject = document.getElementById('createAssignSubject').value.trim();
            const deadline = document.getElementById('createAssignDeadline').value.trim();
            const desc = document.getElementById('createAssignDesc').value.trim();
            try {
                const res = await fetch('/api/lecturer/assignments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: title,
                        subject_name: subject,
                        deadline: deadline,
                        description: desc
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    showToast(data.message || 'Giao bài tập mới thành công!', 'success');
                    createAssignModal.classList.remove('active');
                    createAssignForm.reset();
                    loadTeacherPortal();
                } else {
                    showToast(data.error || 'Lỗi giao bài tập', 'error');
                }
            } catch (err) {
                showToast('Lỗi kết nối máy chủ', 'error');
            }
        });
    }

    const teacherGradeSubModal = document.getElementById('teacherGradeSubmissionModal');
    const teacherGradeSubForm = document.getElementById('teacherGradeSubmissionForm');
    const closeTeacherGradeSubBtn = document.getElementById('closeTeacherGradeSubModalBtn');
    const cancelTeacherGradeSubBtn = document.getElementById('cancelTeacherGradeSubModalBtn');

    if (closeTeacherGradeSubBtn && teacherGradeSubModal) closeTeacherGradeSubBtn.addEventListener('click', () => teacherGradeSubModal.classList.remove('active'));
    if (cancelTeacherGradeSubBtn && teacherGradeSubModal) cancelTeacherGradeSubBtn.addEventListener('click', () => teacherGradeSubModal.classList.remove('active'));

    if (teacherGradeSubForm && teacherGradeSubModal) {
        teacherGradeSubForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('teacherGradeSubId').value;
            const score = document.getElementById('gradeSubScore').value;
            const feedback = document.getElementById('gradeSubFeedback').value.trim();
            try {
                const res = await fetch(`/api/lecturer/submissions/${id}/grade`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ score: score, feedback: feedback })
                });
                const data = await res.json();
                if (res.ok) {
                    showToast(data.message || 'Chấm điểm bài nộp thành công!', 'success');
                    teacherGradeSubModal.classList.remove('active');
                    loadTeacherPortal();
                    if (currentUser && currentUser.role === 0) loadStudentPortal();
                } else {
                    showToast(data.error || 'Lỗi chấm bài', 'error');
                }
            } catch (err) {
                showToast('Lỗi kết nối máy chủ', 'error');
            }
        });
    }

    const progForm = document.getElementById('lecturerUpdateProgressForm');
    if (progForm) {
        progForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const projId = document.getElementById('lecturerProgressProjectId').value;
            const newProg = document.getElementById('lecturerProgressSelect').value;
            try {
                const res = await fetch(`/projects/${projId}/progress`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ progress: newProg })
                });
                const data = await res.json();
                if (res.ok) {
                    showToast(data.message || 'Cập nhật tiến độ đồ án thành công!', 'success');
                    document.getElementById('lecturerUpdateProgressModal').classList.remove('active');
                    loadLecturerPortal();
                } else {
                    showToast(data.error || 'Cập nhật tiến độ thất bại', 'error');
                }
            } catch (err) {
                showToast('Lỗi kết nối máy chủ', 'error');
            }
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const targetTab = urlParams.get('tab');

    if (currentUser && currentUser.role === 0) {
        await loadStudentPortal();
        if (targetTab && typeof window.switchStudentTab === 'function') {
            window.switchStudentTab(targetTab);
        }
    } else if (currentUser && currentUser.role === 1) {
        await loadLecturerPortal();
        if (targetTab && typeof window.switchLecturerTab === 'function') {
            window.switchLecturerTab(targetTab);
        }
    } else {
        await loadStudents();
    }

    checkHealth();
    setInterval(checkHealth, 15000);
});

window.editStudent = function(id) {
    if (!currentUser || currentUser.role !== 2) {
        showToast('Chỉ Quản trị viên mới có quyền chỉnh sửa sinh viên', 'error');
        return;
    }
    const s = allStudents.find(item => item.id === id);
    if (!s) return;

    document.getElementById('modalTitle').textContent = `Chỉnh Sửa Sinh Viên #${s.id}`;
    document.getElementById('studentId').value = s.id;
    document.getElementById('studentName').value = s.name;
    document.getElementById('studentClass').value = s.class || s.class_name;
    document.getElementById('studentScore').value = s.score;
    document.getElementById('studentCode').value = s.student_code || '';
    document.getElementById('studentGender').value = s.gender || '';
    document.getElementById('studentDob').value = s.dob || '';
    document.getElementById('studentEmail').value = s.email || '';
    const statusContainer = document.getElementById('accountStatusContainer');
    if (statusContainer) {
        if (s.account_username) {
            statusContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <i class="fa-solid fa-circle-check" style="color: var(--success); font-size: 15px;"></i>
                        <span style="font-size: 13px; margin-left: 6px;">Đã liên kết tài khoản: <strong>${s.account_username}</strong></span>
                    </div>
                    <button type="button" class="btn-secondary" style="font-size: 11px; padding: 3px 8px; color: var(--danger); border-color: rgba(239, 68, 68, 0.4);" onclick="unlinkStudentAccount(${s.id})">
                        <i class="fa-solid fa-link-slash"></i> Hủy liên kết
                    </button>
                </div>
            `;
        } else {
            statusContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--text-muted); font-size: 13px;"><i class="fa-solid fa-circle-xmark" style="color: var(--warning);"></i> Chưa có tài khoản đăng nhập</span>
                    <button type="button" class="btn-primary" style="font-size: 12px; padding: 4px 10px;" onclick="quickCreateStudentAccount(${s.id}, '${s.name.replace(/'/g, "\\'")}', '${s.student_code || ''}')">
                        <i class="fa-solid fa-key"></i> Cấp tài khoản ngay
                    </button>
                </div>
            `;
        }
    }

    const rank = getAcademicRank(s.score);
    const preview = document.getElementById('scoreRatingPreview');
    if (preview) {
        preview.textContent = `${rank.label} (${s.score.toFixed(1)})`;
        preview.style.color = s.score >= 8 ? 'var(--success)' : (s.score >= 6.5 ? 'var(--info)' : (s.score >= 5 ? 'var(--warning)' : 'var(--danger)'));
    }

    const modal = document.getElementById('studentModal');
    if (modal) modal.classList.add('active');
};

window.quickCreateStudentAccount = async function(id, name, code) {
    if (!confirm(`Xác nhận cấp tài khoản đăng nhập cho sinh viên "${name}" (Tên đăng nhập & Mật khẩu mặc định là "${code || 'Mã SV'}")?`)) return;
    try {
        const res = await fetch(`/students/${id}/create_account`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message || 'Cấp tài khoản thành công!', 'success');
            loadStudents();
            const modal = document.getElementById('studentModal');
            if (modal && modal.classList.contains('active')) {
                editStudent(id);
            }
        } else {
            showToast(data.error || 'Cấp tài khoản thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi mạng', 'error');
    }
};

window.unlinkStudentAccount = async function(id) {
    if (!confirm('Bạn có chắc muốn hủy liên kết tài khoản này khỏi hồ sơ sinh viên không?')) return;
    try {
        const res = await fetch(`/students/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ account_id: null })
        });
        if (res.ok) {
            showToast('Đã hủy liên kết tài khoản', 'success');
            loadStudents();
            editStudent(id);
        } else {
            showToast('Lỗi khi hủy liên kết', 'error');
        }
    } catch (e) {
        showToast('Lỗi mạng', 'error');
    }
};

window.openDeleteModal = function(id, name) {
    if (!currentUser || currentUser.role !== 2) {
        showToast('Chỉ Quản trị viên mới có quyền xóa sinh viên', 'error');
        return;
    }
    studentToDeleteId = id;
    const nameEl = document.getElementById('deleteStudentName');
    if (nameEl) nameEl.textContent = name;
    const idEl = document.getElementById('deleteStudentId');
    if (idEl) idEl.textContent = id;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.classList.add('active');
};

window.quickCreateStudentAccount = async function(id, name, code) {
    const defaultUsername = (code || `sv${id}`).toLowerCase().trim();
    const promptMsg = `Cấp tài khoản đăng nhập cho sinh viên "${name}":\n\nNhập tên đăng nhập:`;
    const inputUsername = prompt(promptMsg, defaultUsername);
    if (inputUsername === null) return;
    const username = inputUsername.trim() || defaultUsername;

    try {
        const res = await fetch(`/students/${id}/create_account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message || 'Cấp tài khoản thành công!', 'success');
            loadStudents();
        } else {
            showToast(data.error || 'Lỗi khi cấp tài khoản', 'error');
        }
    } catch (e) {
        showToast('Lỗi máy chủ khi cấp tài khoản', 'error');
    }
};
