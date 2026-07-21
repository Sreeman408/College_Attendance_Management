// app.js - Application Controller for Annamalai University College Management System

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let currentUser = null;
  let currentRole = null; // 'admin', 'staff', 'student'
  let activeTab = '';
  let isDarkMode = false;

  // Cache elements
  const loginScreen = document.getElementById('login-screen');
  const appContainer = document.getElementById('app-container');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');
  
  // Theme & logout controls
  const themeToggle = document.getElementById('theme-toggle');
  const logoutBtn = document.getElementById('logout-btn');

  // Sidebar elements
  const navAdminSection = document.getElementById('nav-admin-section');
  const navStaffSection = document.getElementById('nav-staff-section');
  const navStudentSection = document.getElementById('nav-student-section');
  const userAvatar = document.getElementById('user-display-avatar');
  const userName = document.getElementById('user-display-name');
  const userRole = document.getElementById('user-display-role');

  // Modals
  const studentModal = document.getElementById('student-modal');
  const staffModal = document.getElementById('staff-modal');

  // --- INITIALIZE ---
  function init() {
    setupTheme();
    setupEventListeners();
    checkActiveSession();
  }

  function setupTheme() {
    const savedTheme = localStorage.getItem('au_theme') || 'light';
    isDarkMode = savedTheme === 'dark';
    updateThemeUI();
  }

  function updateThemeUI() {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('au_theme', isDarkMode ? 'dark' : 'light');
    updateThemeUI();
    if (currentUser) renderActiveView();
  }

  function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);
    logoutBtn.addEventListener('click', handleLogout);

    // Portal Card selections
    document.querySelectorAll('.portal-card').forEach(card => {
      card.addEventListener('click', () => {
        const portal = card.getAttribute('data-portal');
        showLoginForm(portal);
      });
    });

    // Back Link buttons
    document.querySelectorAll('.back-link').forEach(link => {
      link.addEventListener('click', () => {
        showPortalHub();
      });
    });

    // Form submissions
    const studentLoginForm = document.getElementById('student-login-form');
    if (studentLoginForm) studentLoginForm.addEventListener('submit', (e) => handleFormSubmit(e, 'student'));
    
    const staffLoginForm = document.getElementById('staff-login-form');
    if (staffLoginForm) staffLoginForm.addEventListener('submit', (e) => handleFormSubmit(e, 'staff'));
    
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) adminLoginForm.addEventListener('submit', (e) => handleFormSubmit(e, 'admin'));

    // Sidebar navigation tabs click delegation
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        setActiveTab(tab);
      });
    });

    // Modal forms submission
    const studentFormEl = document.getElementById('student-form');
    if (studentFormEl) studentFormEl.addEventListener('submit', handleStudentModalSubmit);
    
    const staffFormEl = document.getElementById('staff-form');
    if (staffFormEl) staffFormEl.addEventListener('submit', handleStaffModalSubmit);

    // Smart marker controllers
    const selectCourse = document.getElementById('staff-marker-course');
    const markerDate = document.getElementById('staff-marker-date');
    if (selectCourse && markerDate) {
      selectCourse.addEventListener('change', loadStaffMarkerGrid);
      markerDate.addEventListener('change', loadStaffMarkerGrid);
    }

    const saveMarkerBtn = document.getElementById('save-staff-marker-btn');
    if (saveMarkerBtn) {
      saveMarkerBtn.addEventListener('click', saveStaffAttendance);
    }

    // Modal Cancelers
    const closeStudentModal = document.getElementById('close-student-modal');
    if (closeStudentModal) closeStudentModal.onclick = () => studentModal.classList.remove('active');
    
    const cancelStudentModal = document.getElementById('cancel-student-modal');
    if (cancelStudentModal) cancelStudentModal.onclick = () => studentModal.classList.remove('active');
    
    const closeStaffModal = document.getElementById('close-staff-modal');
    if (closeStaffModal) closeStaffModal.onclick = () => staffModal.classList.remove('active');
    
    const cancelStaffModal = document.getElementById('cancel-staff-modal');
    if (cancelStaffModal) cancelStaffModal.onclick = () => staffModal.classList.remove('active');

    // Developer Console Drawer toggle
    const devToggle = document.getElementById('dev-console-toggle');
    const devDrawer = document.getElementById('dev-console-drawer');
    const devClose = document.getElementById('dev-console-close');

    if (devToggle && devDrawer) {
      devToggle.addEventListener('click', () => {
        devDrawer.classList.toggle('active');
      });
    }

    if (devClose && devDrawer) {
      devClose.addEventListener('click', () => {
        devDrawer.classList.remove('active');
      });
    }
  }

  // --- PORTAL HUB ANIMATION ROUTINES ---
  function showPortalHub() {
    document.getElementById('portal-hub').classList.remove('hidden');
    document.getElementById('student-login-card').classList.add('hidden');
    document.getElementById('staff-login-card').classList.add('hidden');
    document.getElementById('admin-login-card').classList.add('hidden');
    hideErrorBanners();
  }

  function showLoginForm(portalType) {
    document.getElementById('portal-hub').classList.add('hidden');
    
    // Hide all forms
    document.getElementById('student-login-card').classList.add('hidden');
    document.getElementById('staff-login-card').classList.add('hidden');
    document.getElementById('admin-login-card').classList.add('hidden');
    
    // Show selected form
    document.getElementById(`${portalType}-login-card`).classList.remove('hidden');
    hideErrorBanners();
  }

  function hideErrorBanners() {
    document.querySelectorAll('.alert-banner').forEach(b => b.classList.add('hidden'));
  }

  // --- SESSION CONTROLLER ---
  function checkActiveSession() {
    const session = sessionStorage.getItem('au_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        // Verify credentials with database
        const authenticated = window.CollegeDB.authenticate(parsed.loginId, parsed.password, parsed.role);
        if (authenticated) {
          loginUser(authenticated.user, parsed.role);
          return;
        }
      } catch (e) {
        console.error("Session corrupted", e);
      }
    }
    // No valid session, force clean login page
    wipeDOMData();
    showPortalHub();
    loginScreen.style.display = 'flex';
    appContainer.classList.remove('active');
  }

  function handleFormSubmit(e, portalType) {
    e.preventDefault();
    hideErrorBanners();

    let id, pass;
    if (portalType === 'student') {
      id = document.getElementById('student-id').value.trim();
      pass = document.getElementById('student-password').value;
    } else if (portalType === 'staff') {
      id = document.getElementById('staff-id').value.trim();
      pass = document.getElementById('staff-password').value;
    } else if (portalType === 'admin') {
      id = document.getElementById('admin-id').value.trim();
      pass = document.getElementById('admin-password').value;
    }

    const auth = window.CollegeDB.authenticate(id, pass, portalType);
    if (auth) {
      sessionStorage.setItem('au_session', JSON.stringify({ loginId: id, password: pass, role: portalType }));
      loginUser(auth.user, portalType);
    } else {
      // Show form-specific alert banner
      const banner = document.querySelector(`#${portalType}-login-card .alert-banner`);
      if (banner) banner.classList.remove('hidden');
    }
  }

  function loginUser(userObj, role) {
    currentUser = userObj;
    currentRole = role;

    loginScreen.style.display = 'none';
    appContainer.classList.add('active');

    // Populate Sidebar profile details
    userAvatar.innerText = userObj.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
    userName.innerText = userObj.name;
    userRole.innerText = role === 'admin' ? 'Administrator' : role === 'staff' ? 'Faculty Professor' : 'Student Registry';

    // Show menu links matching role
    navAdminSection.style.display = role === 'admin' ? 'block' : 'none';
    navStaffSection.style.display = role === 'staff' ? 'block' : 'none';
    navStudentSection.style.display = role === 'student' ? 'block' : 'none';

    // Route to default tab
    if (role === 'admin') setActiveTab('admin-dashboard');
    else if (role === 'staff') setActiveTab('staff-dashboard');
    else if (role === 'student') setActiveTab('student-dashboard');
  }

  function handleLogout() {
    sessionStorage.removeItem('au_session');
    currentUser = null;
    currentRole = null;
    
    // Clear forms values
    document.getElementById('student-login-form').reset();
    document.getElementById('staff-login-form').reset();
    document.getElementById('admin-login-form').reset();

    checkActiveSession();
  }

  // --- DATA SANITIZATION WIPE ON LOGOUT ---
  function wipeDOMData() {
    // Reset static texts to generic placeholders
    userAvatar.innerText = '-';
    userName.innerText = '-';
    userRole.innerText = '-';
    pageTitle.innerText = '-';
    pageSubtitle.innerText = '-';

    // Clear Admin elements
    const adminMetrics = ['admin-stat-students', 'admin-stat-staff', 'admin-stat-schedule', 'admin-stat-avg'];
    adminMetrics.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerText = '-';
    });
    const adTbody = document.getElementById('admin-dept-summary-table')?.querySelector('tbody');
    if (adTbody) adTbody.innerHTML = '';
    const stdTbody = document.getElementById('admin-students-editor-table')?.querySelector('tbody');
    if (stdTbody) stdTbody.innerHTML = '';
    const stfTbody = document.getElementById('admin-staff-editor-table')?.querySelector('tbody');
    if (stfTbody) stfTbody.innerHTML = '';

    // Clear Staff elements
    const dashboardCourses = document.getElementById('staff-dashboard-courses-list');
    if (dashboardCourses) dashboardCourses.innerHTML = '';
    const markerGrid = document.getElementById('staff-marker-grid');
    if (markerGrid) markerGrid.innerHTML = '';
    const pctTbody = document.getElementById('staff-student-pct-table')?.querySelector('tbody');
    if (pctTbody) pctTbody.innerHTML = '';

    // Clear Student elements
    const studentMetrics = ['student-stat-present', 'student-stat-late', 'student-stat-absent', 'student-overall-percentage-val'];
    studentMetrics.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerText = '-';
    });
    const stdDetailTbody = document.getElementById('student-subject-details-table')?.querySelector('tbody');
    if (stdDetailTbody) stdDetailTbody.innerHTML = '';
    const stdTtableTbody = document.getElementById('student-timetable-table')?.querySelector('tbody');
    if (stdTtableTbody) stdTtableTbody.innerHTML = '';

    // Destroy charts
    const pieCanvas = document.getElementById('studentOverallPieChart');
    if (pieCanvas) {
      const chartInstance = Chart.getChart(pieCanvas);
      if (chartInstance) chartInstance.destroy();
    }
    const barCanvas = document.getElementById('studentSubjectBarChart');
    if (barCanvas) {
      const chartInstance = Chart.getChart(barCanvas);
      if (chartInstance) chartInstance.destroy();
    }
  }

  // --- TAB ROUTING ---
  function setActiveTab(tabId) {
    activeTab = tabId;

    // Update active nav links style
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
      if (link.getAttribute('data-tab') === tabId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Toggle View panels
    document.querySelectorAll('.view-panel').forEach(panel => {
      if (panel.id === `view-${tabId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Update Top Header Titles
    const titleMap = {
      'admin-dashboard': { title: 'University Overview', subtitle: 'Global academic logs & configurations' },
      'admin-edit-student': { title: 'Manage Students Registry', subtitle: 'Register, edit details, or remove student profiles' },
      'admin-edit-staff': { title: 'Manage Faculty Registry', subtitle: 'Register, edit details, or remove staff profiles' },
      
      'staff-dashboard': { title: 'Faculty Dashboard', subtitle: 'Allocated classes & academic overview' },
      'staff-marker': { title: 'Smart Session Marker', subtitle: 'Mark student attendance allocations' },
      'staff-view-pct': { title: 'Student Subject Metrics', subtitle: 'Individual percentage indicators for your subjects' },
      
      'student-dashboard': { title: 'Student Academic Dashboard', subtitle: 'Personalized attendance rates & charts' },
      'student-timetable': { title: 'My Lecture Timetable', subtitle: 'Enrolled subjects weekly schedule grid' }
    };

    const header = titleMap[tabId] || { title: 'Annamalai University CMS', subtitle: 'College Portal' };
    pageTitle.innerText = header.title;
    pageSubtitle.innerText = header.subtitle;

    renderActiveView();
  }

  function renderActiveView() {
    // Prevent rendering if not authenticated
    if (!currentUser) return;

    switch (activeTab) {
      // Admin
      case 'admin-dashboard':
        renderAdminDashboard();
        break;
      case 'admin-edit-student':
        renderAdminStudentEditor();
        break;
      case 'admin-edit-staff':
        renderAdminStaffEditor();
        break;
      
      // Staff
      case 'staff-dashboard':
        renderStaffDashboard();
        break;
      case 'staff-marker':
        renderStaffMarker();
        break;
      case 'staff-view-pct':
        renderStaffStudentMetrics();
        break;

      // Student
      case 'student-dashboard':
        renderStudentDashboard();
        break;
      case 'student-timetable':
        renderStudentTimetable();
        break;
    }
  }

  // ==========================================
  // --- ADMIN RENDER ROUTINES ---
  // ==========================================

  function renderAdminDashboard() {
    const students = window.CollegeDB.getStudents();
    const staff = window.CollegeDB.getStaff();
    const schedule = window.CollegeDB.getTimetable();
    const attendance = window.CollegeDB.getAttendance();

    // Stats
    document.getElementById('admin-stat-students').innerText = students.length;
    document.getElementById('admin-stat-staff').innerText = staff.length;
    document.getElementById('admin-stat-schedule').innerText = `${schedule.length} Lectures`;

    // Overall Average Attendance rate calculation
    const present = attendance.filter(x => x.status === 'present').length;
    const late = attendance.filter(x => x.status === 'late').length;
    const total = attendance.length;
    const avg = total > 0 ? Math.round(((present + (late * 0.8)) / total) * 100) : 100;
    
    document.getElementById('admin-stat-avg').innerText = `${avg}%`;

    // Department Distribution Table
    const depts = window.CollegeDB.getDepartments();
    const tbody = document.getElementById('admin-dept-summary-table').querySelector('tbody');
    tbody.innerHTML = '';

    depts.forEach(d => {
      const deptStudents = students.filter(s => s.deptId === d.id);
      const studentIds = deptStudents.map(s => s.id);
      const deptAtt = attendance.filter(a => studentIds.includes(a.studentId));
      
      const dTotal = deptAtt.length;
      const dPres = deptAtt.filter(x => x.status === 'present').length;
      const dLate = deptAtt.filter(x => x.status === 'late').length;
      const dPct = dTotal > 0 ? Math.round(((dPres + (dLate * 0.8)) / dTotal) * 100) : 100;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${d.name}</strong></td>
        <td><code>${d.code}</code></td>
        <td>${deptStudents.length} Students</td>
        <td><strong>${dPct}%</strong></td>
        <td><span class="badge ${dPct >= 75 ? 'badge-present' : 'badge-absent'}">${dPct >= 75 ? 'Optimal' : 'Shortage'}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderAdminStudentEditor() {
    const students = window.CollegeDB.getStudents();
    const courses = window.CollegeDB.getCourses();
    const tbody = document.getElementById('admin-students-editor-table').querySelector('tbody');
    tbody.innerHTML = '';

    students.forEach(s => {
      const sCourses = s.courses.map(cId => {
        const cObj = courses.find(c => c.id === cId);
        return cObj ? cObj.code : cId;
      }).join(', ');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${s.name}</strong></td>
        <td><code>${s.roll}</code></td>
        <td>${s.email}</td>
        <td style="text-transform: uppercase;">${s.deptId}</td>
        <td><span style="font-size:0.78rem; color:var(--text-muted);">${sCourses || 'None'}</span></td>
        <td><code>${s.loginId}</code></td>
        <td>
          <div style="display:flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm edit-btn"><i class="fa-solid fa-user-pen"></i></button>
            <button class="btn btn-danger btn-sm delete-btn"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;

      tr.querySelector('.edit-btn').onclick = () => openStudentModal(s);
      tr.querySelector('.delete-btn').onclick = () => {
        if (confirm(`Remove student ${s.name}? This deletes all their attendance logs.`)) {
          window.CollegeDB.deleteStudent(s.id);
          renderAdminStudentEditor();
        }
      };

      tbody.appendChild(tr);
    });

    document.getElementById('open-add-student-btn').onclick = () => openStudentModal();
  }

  function openStudentModal(student = null) {
    const courses = window.CollegeDB.getCourses();
    const chkList = document.getElementById('form-courses-checklist');
    chkList.innerHTML = '';

    courses.forEach(c => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.gap = '8px';
      div.innerHTML = `
        <input type="checkbox" id="std-chk-${c.id}" value="${c.id}" name="std-enrolled-courses">
        <label for="std-chk-${c.id}" style="font-size:0.8rem; font-weight:500;"><strong>${c.code}</strong> - ${c.name}</label>
      `;
      chkList.appendChild(div);
    });

    if (student) {
      document.getElementById('student-modal-title').innerText = 'Modify Student Details';
      document.getElementById('form-student-id').value = student.id;
      document.getElementById('form-student-name').value = student.name;
      document.getElementById('form-student-roll').value = student.roll;
      document.getElementById('form-student-email').value = student.email;
      document.getElementById('form-student-dept').value = student.deptId;
      document.getElementById('form-student-login').value = student.loginId;
      document.getElementById('form-student-pass').value = student.password;

      student.courses.forEach(cId => {
        const chk = document.getElementById(`std-chk-${cId}`);
        if (chk) chk.checked = true;
      });
    } else {
      document.getElementById('student-modal-title').innerText = 'Add New Student';
      document.getElementById('student-form').reset();
      document.getElementById('form-student-id').value = '';
    }

    studentModal.classList.add('active');
  }

  function handleStudentModalSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('form-student-id').value;
    const name = document.getElementById('form-student-name').value;
    const roll = document.getElementById('form-student-roll').value;
    const email = document.getElementById('form-student-email').value;
    const deptId = document.getElementById('form-student-dept').value;
    const loginId = document.getElementById('form-student-login').value.trim();
    const password = document.getElementById('form-student-pass').value;

    const checked = Array.from(document.querySelectorAll('input[name="std-enrolled-courses"]:checked')).map(x => x.value);

    window.CollegeDB.addOrUpdateStudent({ id, name, roll, email, deptId, loginId, password, courses: checked });
    alert('Student saved successfully.');
    studentModal.classList.remove('active');
    renderAdminStudentEditor();
  }

  function renderAdminStaffEditor() {
    const staff = window.CollegeDB.getStaff();
    const courses = window.CollegeDB.getCourses();
    const tbody = document.getElementById('admin-staff-editor-table').querySelector('tbody');
    tbody.innerHTML = '';

    staff.forEach(s => {
      const sCourses = s.courses.map(cId => {
        const cObj = courses.find(c => c.id === cId);
        return cObj ? cObj.code : cId;
      }).join(', ');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${s.name}</strong></td>
        <td>${s.email}</td>
        <td style="text-transform: uppercase;">${s.deptId}</td>
        <td><span style="font-size:0.78rem; color:var(--text-muted);">${sCourses || 'None'}</span></td>
        <td><code>${s.loginId}</code></td>
        <td>
          <div style="display:flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm edit-btn"><i class="fa-solid fa-user-pen"></i></button>
            <button class="btn btn-danger btn-sm delete-btn"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;

      tr.querySelector('.edit-btn').onclick = () => openStaffModal(s);
      tr.querySelector('.delete-btn').onclick = () => {
        if (confirm(`Remove professor ${s.name}?`)) {
          window.CollegeDB.deleteStaff(s.id);
          renderAdminStaffEditor();
        }
      };

      tbody.appendChild(tr);
    });

    document.getElementById('open-add-staff-btn').onclick = () => openStaffModal();
  }

  function openStaffModal(prof = null) {
    const courses = window.CollegeDB.getCourses();
    const chkList = document.getElementById('form-staff-courses-checklist');
    chkList.innerHTML = '';

    courses.forEach(c => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.gap = '8px';
      div.innerHTML = `
        <input type="checkbox" id="prof-chk-${c.id}" value="${c.id}" name="prof-allocated-courses">
        <label for="prof-chk-${c.id}" style="font-size:0.8rem; font-weight:500;"><strong>${c.code}</strong> - ${c.name}</label>
      `;
      chkList.appendChild(div);
    });

    if (prof) {
      document.getElementById('staff-modal-title').innerText = 'Modify Faculty Details';
      document.getElementById('form-staff-id').value = prof.id;
      document.getElementById('form-staff-name').value = prof.name;
      document.getElementById('form-staff-email').value = prof.email;
      document.getElementById('form-staff-dept').value = prof.deptId;
      document.getElementById('form-staff-login').value = prof.loginId;
      document.getElementById('form-staff-pass').value = prof.password;

      prof.courses.forEach(cId => {
        const chk = document.getElementById(`prof-chk-${cId}`);
        if (chk) chk.checked = true;
      });
    } else {
      document.getElementById('staff-modal-title').innerText = 'Add Faculty Professor';
      document.getElementById('staff-form').reset();
      document.getElementById('form-staff-id').value = '';
    }

    staffModal.classList.add('active');
  }

  function handleStaffModalSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('form-staff-id').value;
    const name = document.getElementById('form-staff-name').value;
    const email = document.getElementById('form-staff-email').value;
    const deptId = document.getElementById('form-staff-dept').value;
    const loginId = document.getElementById('form-staff-login').value.trim();
    const password = document.getElementById('form-staff-pass').value;

    const checked = Array.from(document.querySelectorAll('input[name="prof-allocated-courses"]:checked')).map(x => x.value);

    window.CollegeDB.addOrUpdateStaff({ id, name, email, deptId, loginId, password, courses: checked });
    alert('Faculty saved successfully.');
    staffModal.classList.remove('active');
    renderAdminStaffEditor();
  }

  // ==========================================
  // --- STAFF RENDER ROUTINES ---
  // ==========================================

  function renderStaffDashboard() {
    const prof = window.CollegeDB.getStaff().find(s => s.id === currentUser.id);
    if (!prof) return;

    const courses = window.CollegeDB.getCourses().filter(c => prof.courses.includes(c.id));
    const listGroup = document.getElementById('staff-dashboard-courses-list');
    listGroup.innerHTML = '';

    if (courses.length === 0) {
      listGroup.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">You are not allocated to any active subjects currently.</p>';
      return;
    }

    courses.forEach(c => {
      const enrolled = window.CollegeDB.getStudents().filter(s => s.courses.includes(c.id)).length;
      
      const div = document.createElement('div');
      div.style.padding = '12px';
      div.style.border = '1px solid var(--border-color)';
      div.style.borderRadius = 'var(--radius-sm)';
      div.style.marginBottom = '10px';
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';

      div.innerHTML = `
        <div>
          <h4 style="font-size:0.9rem; font-weight:700; color:var(--primary);"><strong>${c.code}</strong> - ${c.name}</h4>
          <span style="font-size:0.75rem; color:var(--text-muted);">Enrolled: ${enrolled} Students</span>
        </div>
        <button class="btn btn-primary btn-sm mark-btn" data-id="${c.id}"><i class="fa-solid fa-check"></i> Mark Attendance</button>
      `;

      div.querySelector('.mark-btn').onclick = () => {
        setActiveTab('staff-marker');
        document.getElementById('staff-marker-course').value = c.id;
        loadStaffMarkerGrid();
      };

      listGroup.appendChild(div);
    });
  }

  function renderStaffMarker() {
    const prof = window.CollegeDB.getStaff().find(s => s.id === currentUser.id);
    if (!prof) return;

    const courseSelect = document.getElementById('staff-marker-course');
    courseSelect.innerHTML = '';

    prof.courses.forEach(cId => {
      const course = window.CollegeDB.getCourses().find(c => c.id === cId);
      if (course) {
        const opt = document.createElement('option');
        opt.value = cId;
        opt.innerText = `${course.code} - ${course.name}`;
        courseSelect.appendChild(opt);
      }
    });

    const dateInput = document.getElementById('staff-marker-date');
    if (!dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    loadStaffMarkerGrid();
  }

  function loadStaffMarkerGrid() {
    const courseId = document.getElementById('staff-marker-course').value;
    const date = document.getElementById('staff-marker-date').value;
    const grid = document.getElementById('staff-marker-grid');
    grid.innerHTML = '';

    if (!courseId || !date) return;

    const students = window.CollegeDB.getStudents().filter(s => s.courses.includes(courseId));
    const existing = window.CollegeDB.getAttendance().filter(a => a.courseId === courseId && a.date === date);

    if (students.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:32px; color:var(--text-muted);">No student is enrolled in this subject.</div>';
      return;
    }

    students.forEach(s => {
      const record = existing.find(r => r.studentId === s.id);
      const activeStatus = record ? record.status : 'present';

      const card = document.createElement('div');
      card.className = 'attendance-card';
      card.setAttribute('data-student-id', s.id);

      card.innerHTML = `
        <div class="attendance-card-header">
          <div class="attendance-avatar">${s.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</div>
          <div class="attendance-meta">
            <span class="attendance-name">${s.name}</span>
            <span class="attendance-roll">Roll: ${s.roll}</span>
          </div>
        </div>
        <div class="attendance-actions">
          <button class="attendance-btn present ${activeStatus === 'present' ? 'active' : ''}" data-status="present">Present</button>
          <button class="attendance-btn late ${activeStatus === 'late' ? 'active' : ''}" data-status="late">Late</button>
          <button class="attendance-btn absent ${activeStatus === 'absent' ? 'active' : ''}" data-status="absent">Absent</button>
        </div>
      `;

      const btns = card.querySelectorAll('.attendance-btn');
      btns.forEach(btn => {
        btn.onclick = () => {
          btns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        };
      });

      grid.appendChild(card);
    });
  }

  function saveStaffAttendance() {
    const courseId = document.getElementById('staff-marker-course').value;
    const date = document.getElementById('staff-marker-date').value;
    
    if (!courseId || !date) return;

    const cards = document.querySelectorAll('#staff-marker-grid .attendance-card');
    const records = [];

    cards.forEach(card => {
      const studentId = card.getAttribute('data-student-id');
      const activeBtn = card.querySelector('.attendance-btn.active');
      const status = activeBtn ? activeBtn.getAttribute('data-status') : 'present';
      records.push({ studentId, status });
    });

    window.CollegeDB.saveAttendanceSession(courseId, date, records);
    alert(`Attendance roster for ${date} saved.`);
    loadStaffMarkerGrid();
  }

  function renderStaffStudentMetrics() {
    const prof = window.CollegeDB.getStaff().find(s => s.id === currentUser.id);
    if (!prof) return;

    const tbody = document.getElementById('staff-student-pct-table').querySelector('tbody');
    tbody.innerHTML = '';

    const students = window.CollegeDB.getStudents().filter(s => 
      s.courses.some(cId => prof.courses.includes(cId))
    );

    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No student is enrolled in your courses.</td></tr>';
      return;
    }

    students.forEach(s => {
      const stats = window.CollegeDB.getStudentStats(s.id);
      
      stats.courseStats.forEach(cs => {
        if (prof.courses.includes(cs.courseId)) {
          const tr = document.createElement('tr');
          const badgeClass = cs.percentage >= 75 ? 'badge-present' : 'badge-absent';
          
          tr.innerHTML = `
            <td><strong>${s.name}</strong></td>
            <td><code>${s.roll}</code></td>
            <td><code>${cs.courseCode}</code> - ${cs.courseName}</td>
            <td><strong>${cs.percentage}%</strong></td>
            <td><span class="badge ${badgeClass}">${cs.percentage >= 75 ? 'Optimal' : 'Shortage'}</span></td>
          `;
          tbody.appendChild(tr);
        }
      });
    });
  }

  // ==========================================
  // --- STUDENT RENDER ROUTINES ---
  // ==========================================

  function renderStudentDashboard() {
    const stats = window.CollegeDB.getStudentStats(currentUser.id);
    if (!stats) return;

    const threshold = window.CollegeDB.getSettings().minAttendancePct;

    const banner = document.getElementById('student-shortage-banner');
    if (stats.overallPercentage < threshold) {
      banner.style.display = 'flex';
      document.getElementById('student-shortage-pct').innerText = threshold;
    } else {
      banner.style.display = 'none';
    }

    document.getElementById('student-stat-present').innerText = stats.present;
    document.getElementById('student-stat-late').innerText = stats.late;
    document.getElementById('student-stat-absent').innerText = stats.absent;
    document.getElementById('student-overall-percentage-val').innerText = `${stats.overallPercentage}%`;

    // 1. Overall Pie Chart
    window.CollegeCharts.renderOverallPie('studentOverallPieChart', stats.present, stats.late, stats.absent);

    // 2. Subject-wise Bar Chart
    const barLabels = stats.courseStats.map(cs => cs.courseCode);
    const barValues = stats.courseStats.map(cs => cs.percentage);
    window.CollegeCharts.renderSubjectBars('studentSubjectBarChart', barLabels, barValues, threshold);

    // Subject Breakdown Details Table
    const tbody = document.getElementById('student-subject-details-table').querySelector('tbody');
    tbody.innerHTML = '';

    stats.courseStats.forEach(cs => {
      const tr = document.createElement('tr');
      const badgeClass = cs.percentage >= threshold ? 'badge-present' : 'badge-absent';
      
      tr.innerHTML = `
        <td><code>${cs.courseCode}</code></td>
        <td><strong>${cs.courseName}</strong></td>
        <td>${cs.total} Lectures Held</td>
        <td>${cs.present} Present / ${cs.late} Late / ${cs.absent} Absent</td>
        <td><strong>${cs.percentage}%</strong></td>
        <td><span class="badge ${badgeClass}">${cs.percentage >= threshold ? 'On Track' : 'Shortage'}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderStudentTimetable() {
    const timetable = window.CollegeDB.getTimetable();
    const student = window.CollegeDB.getStudents().find(s => s.id === currentUser.id);
    const courses = window.CollegeDB.getCourses();
    
    const tbody = document.getElementById('student-timetable-table').querySelector('tbody');
    tbody.innerHTML = '';

    const enrolledCodes = student.courses.map(cId => {
      const c = courses.find(x => x.id === cId);
      return c ? c.code : '';
    });

    const filteredLectures = timetable.filter(lec => enrolledCodes.includes(lec.courseCode));

    if (filteredLectures.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No scheduled lectures found.</td></tr>';
      return;
    }

    filteredLectures.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${l.day}</strong></td>
        <td><code>${l.time}</code></td>
        <td><code>${l.courseCode}</code> - ${l.courseName}</td>
        <td>${l.classroom}</td>
        <td><em>${l.professor}</em></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- START APP ---
  init();
});
