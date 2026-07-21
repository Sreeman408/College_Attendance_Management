// app.js - Enterprise Application Controller for Annamalai University CMS

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let currentUser = null;
  let currentRole = null; // 'admin', 'staff', 'student', 'parent'
  let activeTab = '';
  let isDarkMode = false;
  let currentLang = 'en';

  // Security & Attempt Protection State
  const loginAttempts = {}; // { loginId: { count: N, lockedUntil: timestamp } }
  let sessionTimeoutTimer = null;
  const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes auto logout

  // Bulk Upload State
  let pendingParsedBatch = null;

  // Cache elements
  const loginScreen = document.getElementById('login-screen');
  const appContainer = document.getElementById('app-container');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');
  
  // Controls
  const themeToggle = document.getElementById('theme-toggle');
  const logoutBtn = document.getElementById('logout-btn');
  const langToggleBtn = document.getElementById('lang-toggle-btn');
  const langLabel = document.getElementById('lang-label');

  // Sidebar Sections
  const navAdminSection = document.getElementById('nav-admin-section');
  const navStaffSection = document.getElementById('nav-staff-section');
  const navStudentSection = document.getElementById('nav-student-section');
  const navParentSection = document.getElementById('nav-parent-section');

  const userAvatar = document.getElementById('user-display-avatar');
  const userName = document.getElementById('user-display-name');
  const userRole = document.getElementById('user-display-role');

  // Modals
  const studentModal = document.getElementById('student-modal');
  const staffModal = document.getElementById('staff-modal');
  const previewModal = document.getElementById('preview-modal');
  const forgotModal = document.getElementById('forgot-modal');
  const qrModal = document.getElementById('qr-modal');

  // --- I18N DICTIONARY ---
  const I18N = {
    en: {
      univ_title: 'Annamalai University',
      portal_subtitle: 'College Portal Gateway',
      card_student_title: 'Student Portal',
      card_student_desc: 'Log in to view subject-wise attendance percentages, grades, and lecture schedules.',
      card_parent_title: 'Parent Gateway',
      card_parent_desc: 'Monitor ward attendance rates, shortage alerts, and approved leave records.',
      card_staff_title: 'Faculty Portal',
      card_staff_desc: 'Access allocated courses, update schedules, and mark/edit student attendance rosters.',
      card_admin_title: 'Admin Registry',
      card_admin_desc: 'Upload academic registers and modify course, student, or staff databases.',
      back_portals: 'Back to Portals',
      student_login_title: 'Student Login',
      staff_login_title: 'Faculty Login',
      admin_login_title: 'Admin Registry'
    },
    ta: {
      univ_title: 'அண்ணாமலைப் பல்கலைக்கழகம்',
      portal_subtitle: 'கல்லூரி இணைய நுழைவாயில்',
      card_student_title: 'மாணவர் நுழைவாயில்',
      card_student_desc: 'பாட வாரியான வருகைப் பதிவு சதவீதங்கள் மற்றும் விரிவுரை அட்டவணையைப் பார்க்கவும்.',
      card_parent_title: 'பெற்றோர் நுழைவாயில்',
      card_parent_desc: 'மாணவர் வருகைப் பதிவு மற்றும் விடுப்புப் பதிவுகளைக் கண்காணிக்கவும்.',
      card_staff_title: 'ஆசிரியர் நுழைவாயில்',
      card_staff_desc: 'பாடங்களை அணுகவும், வருகைப் பதிவைப் புதுப்பிக்கவும் மற்றும் பதிவு செய்யவும்.',
      card_admin_title: 'நிர்வாகப் பிரிவு',
      card_admin_desc: 'கல்விப் பதிவேடுகளைப் பதிவேற்றவும் மற்றும் தரவுத்தளங்களை மாற்றியமைக்கவும்.',
      back_portals: 'திரும்பிச் செல்',
      student_login_title: 'மாணவர் உள்நுழைவு',
      staff_login_title: 'ஆசிரியர் உள்நுழைவு',
      admin_login_title: 'நிர்வாக உள்நுழைவு'
    }
  };

  // --- INITIALIZE SYSTEM ---
  function init() {
    registerServiceWorker();
    setupTheme();
    setupEventListeners();
    setupSecurityListeners();
    setupKeyboardShortcuts();
    checkActiveSession();
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('PWA Service Worker registered successfully.'))
        .catch(err => console.log('Service Worker registration skipped:', err));
    }
  }

  // --- TOAST NOTIFICATION HELPER ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    else if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    else if (type === 'danger') iconClass = 'fa-circle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // --- THEME & LANGUAGE ---
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

  function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'ta' : 'en';
    langLabel.innerText = currentLang.toUpperCase();
    applyLanguageTranslations();
    showToast(`Switched language to ${currentLang === 'en' ? 'English' : 'Tamil (தமிழ்)'}`, 'info');
  }

  function applyLanguageTranslations() {
    const dict = I18N[currentLang];
    if (!dict) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.innerText = dict[key];
      }
    });
  }

  // --- SECURITY & INACTIVITY TIMEOUT ---
  function setupSecurityListeners() {
    const resetTimer = () => {
      if (!currentUser) return;
      clearTimeout(sessionTimeoutTimer);
      sessionTimeoutTimer = setTimeout(() => {
        showToast('Session expired due to 15 minutes of inactivity.', 'warning');
        handleLogout();
      }, INACTIVITY_LIMIT_MS);
    };

    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, resetTimer, { passive: true });
    });
  }

  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.altKey) {
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          if (currentUser) setActiveTab(`${currentRole}-dashboard`);
        } else if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          toggleTheme();
        } else if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          if (currentUser) handleLogout();
        }
      }
    });
  }

  // --- PASSWORD STRENGTH METER ---
  function updatePasswordMeter(inputEl, barEl) {
    if (!inputEl || !barEl) return;
    const val = inputEl.value;
    barEl.className = 'strength-bar';
    if (!val) {
      barEl.style.width = '0%';
      return;
    }

    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    if (score <= 1) barEl.classList.add('strength-weak');
    else if (score === 2 || score === 3) barEl.classList.add('strength-medium');
    else barEl.classList.add('strength-strong');
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);
    logoutBtn.addEventListener('click', handleLogout);
    if (langToggleBtn) langToggleBtn.addEventListener('click', toggleLanguage);

    // Portal Card selections
    document.querySelectorAll('.portal-card').forEach(card => {
      card.addEventListener('click', () => {
        const portal = card.getAttribute('data-portal');
        showLoginForm(portal);
      });
    });

    // Back Link buttons
    document.querySelectorAll('.back-link').forEach(link => {
      link.addEventListener('click', () => showPortalHub());
    });

    // Forgot Password Trigger Links
    document.querySelectorAll('.forgot-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const role = link.getAttribute('data-role');
        document.getElementById('forgot-role').value = role;
        forgotModal.classList.add('active');
      });
    });

    document.getElementById('close-forgot-modal')?.addEventListener('click', () => forgotModal.classList.remove('active'));
    document.getElementById('cancel-forgot-modal')?.addEventListener('click', () => forgotModal.classList.remove('active'));
    document.getElementById('forgot-form')?.addEventListener('submit', handleForgotSubmit);

    // Form submissions
    document.getElementById('student-login-form')?.addEventListener('submit', (e) => handleFormSubmit(e, 'student'));
    document.getElementById('parent-login-form')?.addEventListener('submit', (e) => handleFormSubmit(e, 'parent'));
    document.getElementById('staff-login-form')?.addEventListener('submit', (e) => handleFormSubmit(e, 'staff'));
    document.getElementById('admin-login-form')?.addEventListener('submit', (e) => handleFormSubmit(e, 'admin'));

    // Sidebar navigation
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        setActiveTab(tab);
      });
    });

    // Modals
    const studentFormEl = document.getElementById('student-form');
    if (studentFormEl) studentFormEl.addEventListener('submit', handleStudentModalSubmit);
    
    document.getElementById('close-student-modal')?.addEventListener('click', () => studentModal.classList.remove('active'));
    document.getElementById('cancel-student-modal')?.addEventListener('click', () => studentModal.classList.remove('active'));

    const staffFormEl = document.getElementById('staff-form');
    if (staffFormEl) staffFormEl.addEventListener('submit', handleStaffModalSubmit);

    document.getElementById('close-staff-modal')?.addEventListener('click', () => staffModal.classList.remove('active'));
    document.getElementById('cancel-staff-modal')?.addEventListener('click', () => staffModal.classList.remove('active'));

    // Course & Timetable Modals
    const courseModal = document.getElementById('course-modal');
    document.getElementById('course-form')?.addEventListener('submit', handleCourseModalSubmit);
    document.getElementById('close-course-modal')?.addEventListener('click', () => courseModal.classList.remove('active'));
    document.getElementById('cancel-course-modal')?.addEventListener('click', () => courseModal.classList.remove('active'));

    const timetableModal = document.getElementById('timetable-modal');
    document.getElementById('timetable-form')?.addEventListener('submit', handleTimetableModalSubmit);
    document.getElementById('close-timetable-modal')?.addEventListener('click', () => timetableModal.classList.remove('active'));
    document.getElementById('cancel-timetable-modal')?.addEventListener('click', () => timetableModal.classList.remove('active'));

    // Password strength meters
    document.getElementById('form-student-pass')?.addEventListener('input', (e) => updatePasswordMeter(e.target, document.getElementById('std-strength-bar')));
    document.getElementById('form-staff-pass')?.addEventListener('input', (e) => updatePasswordMeter(e.target, document.getElementById('staff-strength-bar')));

    // Unified Bulk Upload & Preview Setup
    setupUnifiedBulkUploader();

    // Dev Console Drawer
    const devToggle = document.getElementById('dev-console-toggle');
    const devDrawer = document.getElementById('dev-console-drawer');
    const devClose = document.getElementById('dev-console-close');
    if (devToggle && devDrawer && devClose) {
      devToggle.addEventListener('click', () => devDrawer.classList.toggle('active'));
      devClose.addEventListener('click', () => devDrawer.classList.remove('active'));
    }

    // Reports & Export Triggers
    document.getElementById('export-student-csv-btn')?.addEventListener('click', () => exportStudentReport('csv'));
    document.getElementById('export-student-xlsx-btn')?.addEventListener('click', () => exportStudentReport('xlsx'));
    document.getElementById('export-student-pdf-btn')?.addEventListener('click', () => window.print());
    document.getElementById('export-ics-btn')?.addEventListener('click', exportCalendarICS);

    // Leave Form
    document.getElementById('student-leave-form')?.addEventListener('submit', handleLeaveFormSubmit);

    // Staff Marker triggers
    document.getElementById('marker-course-select')?.addEventListener('change', renderStaffMarkerGrid);
    document.getElementById('marker-date-select')?.addEventListener('change', renderStaffMarkerGrid);
    document.getElementById('save-attendance-btn')?.addEventListener('click', saveAttendanceMarkerSession);
    document.getElementById('generate-qr-session-btn')?.addEventListener('click', generateQRSessionCode);
    document.getElementById('mark-class-cancelled-btn')?.addEventListener('click', handleCancelClassClick);
    document.getElementById('close-qr-modal')?.addEventListener('click', () => qrModal.classList.remove('active'));

    // Admin DB Operations
    document.getElementById('export-db-backup-btn')?.addEventListener('click', exportDatabaseBackup);
    document.getElementById('import-db-backup-input')?.addEventListener('change', importDatabaseBackup);
    document.getElementById('reset-system-db-btn')?.addEventListener('click', resetDatabaseSystem);
    document.getElementById('download-upload-template-btn')?.addEventListener('click', downloadCSVTemplate);
  }

  // --- PORTAL NAVIGATION & LOGIN ---
  function showPortalHub() {
    document.querySelectorAll('.login-card').forEach(card => card.classList.add('hidden'));
    document.getElementById('portal-hub').classList.remove('hidden');
  }

  function showLoginForm(portal) {
    document.getElementById('portal-hub').classList.add('hidden');
    document.querySelectorAll('.login-card').forEach(card => card.classList.add('hidden'));
    const target = document.getElementById(`${portal}-login-card`);
    if (target) target.classList.remove('hidden');
  }

  function handleFormSubmit(e, category) {
    e.preventDefault();
    let loginId = '', pass = '', errBanner = null;

    if (category === 'student') {
      loginId = document.getElementById('student-id').value.trim();
      pass = document.getElementById('student-password').value;
      errBanner = document.querySelector('.std-error');
    } else if (category === 'parent') {
      loginId = document.getElementById('parent-id').value.trim();
      pass = document.getElementById('parent-password').value;
      errBanner = document.querySelector('.parent-error');
    } else if (category === 'staff') {
      loginId = document.getElementById('staff-id').value.trim();
      pass = document.getElementById('staff-password').value;
      errBanner = document.querySelector('.staff-error');
    } else if (category === 'admin') {
      loginId = document.getElementById('admin-id').value.trim();
      pass = document.getElementById('admin-password').value;
      errBanner = document.querySelector('.admin-error');
    }

    // Brute-force lockout check
    const attempts = loginAttempts[loginId] || { count: 0, lockedUntil: 0 };
    if (Date.now() < attempts.lockedUntil) {
      const waitSec = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
      if (errBanner) {
        errBanner.querySelector('span').innerText = `Too many failed attempts. Account locked for ${waitSec}s.`;
        errBanner.classList.remove('hidden');
      }
      return;
    }

    const result = window.CollegeDB.authenticate(loginId, pass, category);

    if (result) {
      delete loginAttempts[loginId];
      if (errBanner) errBanner.classList.add('hidden');
      
      currentUser = result.user;
      currentRole = result.role;

      sessionStorage.setItem('au_session', JSON.stringify({ 
        role: currentRole, 
        id: currentUser.id,
        wardId: currentUser.ward ? currentUser.ward.id : null
      }));
      window.CollegeDB.logAudit(currentUser.id, currentUser.name, currentRole, 'LOGIN', 'Authenticated portal session successfully.');
      showToast(`Welcome back, ${currentUser.name}!`, 'success');
      showAppContainer();
    } else {
      attempts.count++;
      if (attempts.count >= 3) {
        attempts.lockedUntil = Date.now() + 30000; // 30 seconds lockout
        attempts.count = 0;
        showToast('Account locked for 30s due to 3 failed attempts.', 'danger');
      }
      loginAttempts[loginId] = attempts;

      if (errBanner) {
        const remaining = 3 - attempts.count;
        errBanner.querySelector('span').innerText = `Invalid credentials. ${remaining} attempts remaining before lockout.`;
        errBanner.classList.remove('hidden');
      }
    }
  }

  function handleForgotSubmit(e) {
    e.preventDefault();
    const role = document.getElementById('forgot-role').value;
    const loginId = document.getElementById('forgot-login-id').value.trim();
    const newPass = document.getElementById('forgot-new-pass').value;

    const success = window.CollegeDB.resetPassword(role, loginId, newPass);
    if (success) {
      showToast('Password reset successfully! Log in with your new password.', 'success');
      forgotModal.classList.remove('active');
    } else {
      showToast('Account ID or Email not found.', 'danger');
    }
  }

  function checkActiveSession() {
    const raw = sessionStorage.getItem('au_session');
    if (!raw) {
      showLoginScreen();
      return;
    }

    try {
      const sess = JSON.parse(raw);
      let userObj = null;

      if (sess.role === 'admin') {
        userObj = window.CollegeDB.getAdmin();
      } else if (sess.role === 'staff') {
        userObj = window.CollegeDB.getStaff().find(s => s.id === sess.id);
      } else if (sess.role === 'student') {
        userObj = window.CollegeDB.getStudents().find(s => s.id === sess.id);
      } else if (sess.role === 'parent') {
        const wardId = sess.wardId || (sess.id ? sess.id.replace('parent_', '') : '');
        const wardStudent = window.CollegeDB.getStudents().find(s => s.id === wardId || s.loginId === wardId || s.roll === wardId);
        if (wardStudent) {
          userObj = {
            id: 'parent_' + wardStudent.id,
            name: `Parent of ${wardStudent.name}`,
            email: `guardian.${wardStudent.email}`,
            wardStudentId: wardStudent.id,
            ward: wardStudent
          };
        }
      }

      if (userObj) {
        currentUser = userObj;
        currentRole = sess.role;
        showAppContainer();
      } else {
        showLoginScreen();
      }
    } catch (e) {
      showLoginScreen();
    }
  }

  function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    appContainer.classList.add('hidden');
    appContainer.classList.remove('active');
    showPortalHub();
    wipeDOMData();
  }

  function showAppContainer() {
    loginScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
    appContainer.classList.add('active');

    navAdminSection.style.display = 'none';
    navStaffSection.style.display = 'none';
    navStudentSection.style.display = 'none';
    if (navParentSection) navParentSection.style.display = 'none';

    if (currentRole === 'admin') {
      navAdminSection.style.display = 'block';
      userAvatar.innerText = 'AD';
      userRole.innerText = 'Registrar Admin';
      userName.innerText = currentUser.name;
      setActiveTab('admin-dashboard');
    } else if (currentRole === 'staff') {
      navStaffSection.style.display = 'block';
      userAvatar.innerText = 'ST';
      userRole.innerText = 'Faculty Professor';
      userName.innerText = currentUser.name;
      setActiveTab('staff-dashboard');
    } else if (currentRole === 'student') {
      navStudentSection.style.display = 'block';
      userAvatar.innerText = 'SD';
      userRole.innerText = `Roll: ${currentUser.roll}`;
      userName.innerText = currentUser.name;
      setActiveTab('student-dashboard');
    } else if (currentRole === 'parent') {
      if (navParentSection) navParentSection.style.display = 'block';
      userAvatar.innerText = 'PR';
      userRole.innerText = 'Guardian';
      userName.innerText = currentUser.name;
      setActiveTab('parent-dashboard');
    }
  }

  function handleLogout() {
    if (currentUser) {
      window.CollegeDB.logAudit(currentUser.id, currentUser.name, currentRole, 'LOGOUT', 'Logged out of portal.');
    }
    sessionStorage.removeItem('au_session');
    currentUser = null;
    currentRole = null;
    showToast('Logged out successfully.', 'info');
    showLoginScreen();
  }

  function wipeDOMData() {
    userAvatar.innerText = '-';
    userName.innerText = '-';
    userRole.innerText = '-';
    pageTitle.innerText = '-';
    pageSubtitle.innerText = '-';
  }

  // --- TAB ROUTING ---
  function setActiveTab(tabId) {
    activeTab = tabId;

    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
      if (link.getAttribute('data-tab') === tabId) link.classList.add('active');
      else link.classList.remove('active');
    });

    document.querySelectorAll('.view-panel').forEach(panel => {
      if (panel.id === `view-${tabId}`) panel.classList.add('active');
      else panel.classList.remove('active');
    });

    const titleMap = {
      'admin-dashboard': { title: 'University Overview', subtitle: 'Global academic logs & comparative analytics' },
      'admin-uploads': { title: 'Unified Enterprise Bulk Import', subtitle: 'Multi-format transactional data synchronization' },
      'admin-edit-student': { title: 'Manage Students Registry', subtitle: 'Register, edit details, or remove student profiles' },
      'admin-edit-staff': { title: 'Manage Faculty Registry', subtitle: 'Register, edit details, or remove staff profiles' },
      'admin-edit-course': { title: 'Manage Academic Subjects', subtitle: 'Add, edit, or remove subjects & allocate faculty' },
      'admin-edit-timetable': { title: 'Manage Master Timetable', subtitle: 'Allocate lecture slots, classrooms & faculty professors' },
      'admin-audit': { title: 'Security Audit Trail', subtitle: 'System-wide activity and security log' },
      
      'staff-dashboard': { title: 'Faculty Dashboard', subtitle: 'Allocated classes & academic overview' },
      'staff-marker': { title: 'Smart Session Marker', subtitle: 'Mark student attendance allocations & QR sessions' },
      'staff-view-pct': { title: 'Student Subject Metrics', subtitle: 'Individual percentage indicators for your subjects' },
      
      'student-dashboard': { title: 'Student Academic Dashboard', subtitle: 'Personalized attendance rates, predictions & calendar' },
      'student-timetable': { title: 'My Lecture Timetable', subtitle: 'Enrolled subjects weekly schedule grid' },
      'parent-dashboard': { title: 'Parent Ward Monitor', subtitle: 'Ward attendance progress & shortage alerts' }
    };

    const header = titleMap[tabId] || { title: 'Annamalai University CMS', subtitle: 'College Portal' };
    pageTitle.innerText = header.title;
    pageSubtitle.innerText = header.subtitle;

    renderActiveView();
  }

  function renderActiveView() {
    if (!currentUser) return;

    switch (activeTab) {
      case 'admin-dashboard': renderAdminDashboard(); break;
      case 'admin-audit': renderAdminAudit(); break;
      case 'admin-edit-student': renderAdminStudentEditor(); break;
      case 'admin-edit-staff': renderAdminStaffEditor(); break;
      case 'admin-edit-course': renderAdminCourseEditor(); break;
      case 'admin-edit-timetable': renderAdminTimetableEditor(); break;
      case 'staff-dashboard': renderStaffDashboard(); break;
      case 'staff-marker': renderStaffMarker(); break;
      case 'staff-view-pct': renderStaffStudentMetrics(); break;
      case 'student-dashboard': renderStudentDashboard(); break;
      case 'student-timetable': renderStudentTimetable(); break;
      case 'parent-dashboard': renderParentDashboard(); break;
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

    document.getElementById('admin-stat-students').innerText = students.length;
    document.getElementById('admin-stat-staff').innerText = staff.length;
    document.getElementById('admin-stat-schedule').innerText = `${schedule.length} Lectures`;

    const present = attendance.filter(x => x.status === 'present' || x.status === 'excused').length;
    const late = attendance.filter(x => x.status === 'late').length;
    const total = attendance.length;
    const avg = total > 0 ? Math.round(((present + (late * 0.8)) / total) * 100) : 100;
    document.getElementById('admin-stat-avg').innerText = `${avg}%`;

    const depts = window.CollegeDB.getDepartments();
    const tbody = document.getElementById('admin-dept-summary-table').querySelector('tbody');
    tbody.innerHTML = '';

    const deptAverages = [];

    depts.forEach(d => {
      const dStudents = students.filter(s => s.deptId === d.id);
      const dStaff = staff.filter(st => st.deptId === d.id);
      const dStudentIds = dStudents.map(s => s.id);
      const dAtt = attendance.filter(a => dStudentIds.includes(a.studentId));

      const dPres = dAtt.filter(a => a.status === 'present' || a.status === 'excused').length;
      const dLate = dAtt.filter(a => a.status === 'late').length;
      const dTot = dAtt.length;
      const dAvgPct = dTot > 0 ? Math.round(((dPres + (dLate * 0.8)) / dTot) * 100) : 100;
      deptAverages.push(dAvgPct);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${d.name} (${d.code})</strong></td>
        <td>${dStudents.length} Students</td>
        <td>${dStaff.length} Faculty</td>
        <td><strong>${dAvgPct}%</strong></td>
        <td><span class="badge ${dAvgPct >= 75 ? 'badge-success' : 'badge-danger'}">${dAvgPct >= 75 ? 'Optimal' : 'Shortage'}</span></td>
      `;
      tbody.appendChild(tr);
    });

    if (window.CollegeCharts) {
      window.CollegeCharts.renderDeptComparisonBars('adminDeptBarChart', depts.map(d => d.code), deptAverages);
    }
  }

  function renderAdminAudit() {
    const logs = window.CollegeDB.getAuditLogs();
    const tbody = document.getElementById('admin-audit-table').querySelector('tbody');
    tbody.innerHTML = '';

    logs.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span style="font-size:0.75rem; color:var(--text-muted);">${new Date(l.timestamp).toLocaleString()}</span></td>
        <td><code>${l.userId}</code></td>
        <td><span class="badge badge-info">${l.role}</span></td>
        <td><strong>${l.action}</strong></td>
        <td style="font-size:0.82rem;">${l.details}</td>
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
            <button class="btn btn-secondary btn-sm edit-btn"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-sm delete-btn"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;

      tr.querySelector('.edit-btn').onclick = () => openStudentModal(s);
      tr.querySelector('.delete-btn').onclick = () => {
        if (confirm(`Remove student profile for ${s.name}?`)) {
          window.CollegeDB.deleteStudent(s.id, currentUser);
          renderAdminStudentEditor();
          showToast('Student deleted.', 'info');
        }
      };

      tbody.appendChild(tr);
    });

    document.getElementById('open-add-student-btn').onclick = () => openStudentModal();
  }

  function openStudentModal(std = null) {
    const courses = window.CollegeDB.getCourses();
    const chkList = document.getElementById('form-courses-checklist');
    chkList.innerHTML = '';

    courses.forEach(c => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.gap = '8px';
      div.innerHTML = `
        <input type="checkbox" id="chk-${c.id}" value="${c.id}" name="allocated-courses">
        <label for="chk-${c.id}" style="font-size:0.8rem; font-weight:500;"><strong>${c.code}</strong> - ${c.name}</label>
      `;
      chkList.appendChild(div);
    });

    if (std) {
      document.getElementById('student-modal-title').innerText = 'Modify Student Details';
      document.getElementById('form-student-id').value = std.id;
      document.getElementById('form-student-name').value = std.name;
      document.getElementById('form-student-roll').value = std.roll;
      document.getElementById('form-student-email').value = std.email;
      document.getElementById('form-student-dept').value = std.deptId;
      document.getElementById('form-student-login').value = std.loginId;
      document.getElementById('form-student-pass').value = std.password;

      std.courses.forEach(cId => {
        const chk = document.getElementById(`chk-${cId}`);
        if (chk) chk.checked = true;
      });
    } else {
      document.getElementById('student-modal-title').innerText = 'Register Student';
      document.getElementById('student-form').reset();
      document.getElementById('form-student-id').value = '';
    }

    studentModal.classList.add('active');
  }

  function handleStudentModalSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('form-student-id').value;
    const name = document.getElementById('form-student-name').value;
    const roll = document.getElementById('form-student-roll').value.trim();
    const email = document.getElementById('form-student-email').value;
    const deptId = document.getElementById('form-student-dept').value;
    const loginId = document.getElementById('form-student-login').value.trim();
    const password = document.getElementById('form-student-pass').value;

    const checked = Array.from(document.querySelectorAll('input[name="allocated-courses"]:checked')).map(x => x.value);

    window.CollegeDB.addOrUpdateStudent({ id, name, roll, email, deptId, loginId, password, courses: checked }, currentUser);
    showToast('Student profile saved successfully.', 'success');
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
          window.CollegeDB.deleteStaff(s.id, currentUser);
          renderAdminStaffEditor();
          showToast('Faculty professor deleted.', 'info');
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

    window.CollegeDB.addOrUpdateStaff({ id, name, email, deptId, loginId, password, courses: checked }, currentUser);
    showToast('Faculty professor saved successfully.', 'success');
    staffModal.classList.remove('active');
    renderAdminStaffEditor();
  }

  // --- ADMIN COURSE / SUBJECT EDITOR ---
  function renderAdminCourseEditor() {
    const courses = window.CollegeDB.getCourses();
    const staff = window.CollegeDB.getStaff();
    const tbody = document.getElementById('admin-courses-editor-table').querySelector('tbody');
    tbody.innerHTML = '';

    courses.forEach(c => {
      const assignedProfNames = staff
        .filter(st => st.courses && st.courses.includes(c.id))
        .map(st => st.name)
        .join(', ');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${c.code}</code></td>
        <td><strong>${c.name}</strong></td>
        <td style="text-transform:uppercase;">${c.deptId}</td>
        <td><span style="font-size:0.8rem; color:var(--text-muted);">${assignedProfNames || 'Unassigned'}</span></td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm edit-btn"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-sm delete-btn"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;

      tr.querySelector('.edit-btn').onclick = () => openCourseModal(c);
      tr.querySelector('.delete-btn').onclick = () => {
        if (confirm(`Remove course ${c.code} - ${c.name}?`)) {
          window.CollegeDB.deleteCourse(c.id, currentUser);
          renderAdminCourseEditor();
          showToast('Subject deleted.', 'info');
        }
      };

      tbody.appendChild(tr);
    });

    document.getElementById('open-add-course-btn').onclick = () => openCourseModal();
  }

  function openCourseModal(course = null) {
    const modal = document.getElementById('course-modal');
    if (course) {
      document.getElementById('course-modal-title').innerText = 'Modify Academic Subject';
      document.getElementById('form-course-id').value = course.id;
      document.getElementById('form-course-code').value = course.code;
      document.getElementById('form-course-name').value = course.name;
      document.getElementById('form-course-dept').value = course.deptId;
    } else {
      document.getElementById('course-modal-title').innerText = 'Add Academic Subject';
      document.getElementById('course-form').reset();
      document.getElementById('form-course-id').value = '';
    }
    modal.classList.add('active');
  }

  function handleCourseModalSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('form-course-id').value;
    const code = document.getElementById('form-course-code').value.trim();
    const name = document.getElementById('form-course-name').value.trim();
    const deptId = document.getElementById('form-course-dept').value;

    window.CollegeDB.addOrUpdateCourse({ id, code, name, deptId }, currentUser);
    showToast('Subject saved successfully.', 'success');
    document.getElementById('course-modal').classList.remove('active');
    renderAdminCourseEditor();
  }

  // --- ADMIN TIMETABLE SCHEDULE EDITOR ---
  function renderAdminTimetableEditor() {
    const timetable = window.CollegeDB.getTimetable();
    const tbody = document.getElementById('admin-timetable-editor-table').querySelector('tbody');
    tbody.innerHTML = '';

    timetable.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${t.day}</strong></td>
        <td>${t.time}</td>
        <td><code>${t.courseCode}</code></td>
        <td>${t.courseName}</td>
        <td><span class="badge badge-info">${t.classroom}</span></td>
        <td><strong>${t.professor}</strong></td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm edit-btn"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-sm delete-btn"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;

      tr.querySelector('.edit-btn').onclick = () => openTimetableModal(t);
      tr.querySelector('.delete-btn').onclick = () => {
        if (confirm(`Remove timetable slot for ${t.courseCode} on ${t.day} (${t.time})?`)) {
          window.CollegeDB.deleteTimetableSlot(t, currentUser);
          renderAdminTimetableEditor();
          showToast('Lecture slot removed.', 'info');
        }
      };

      tbody.appendChild(tr);
    });

    document.getElementById('open-add-timetable-btn').onclick = () => openTimetableModal();
  }

  function openTimetableModal(slot = null) {
    const modal = document.getElementById('timetable-modal');
    const courses = window.CollegeDB.getCourses();
    const staff = window.CollegeDB.getStaff();

    const courseSel = document.getElementById('form-tt-course');
    courseSel.innerHTML = '';
    courses.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.innerText = `${c.code} - ${c.name}`;
      courseSel.appendChild(opt);
    });

    const profSel = document.getElementById('form-tt-prof');
    profSel.innerHTML = '';
    staff.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st.name;
      opt.innerText = `${st.name} (${st.deptId.toUpperCase()})`;
      profSel.appendChild(opt);
    });

    if (slot) {
      document.getElementById('timetable-modal-title').innerText = 'Modify Timetable Slot';
      document.getElementById('form-timetable-id').value = slot.id || '';
      document.getElementById('form-tt-day').value = slot.day;
      document.getElementById('form-tt-time').value = slot.time;
      document.getElementById('form-tt-course').value = slot.courseCode;
      document.getElementById('form-tt-room').value = slot.classroom;
      document.getElementById('form-tt-prof').value = slot.professor;
    } else {
      document.getElementById('timetable-modal-title').innerText = 'Allocate Timetable Lecture Slot';
      document.getElementById('timetable-form').reset();
      document.getElementById('form-timetable-id').value = '';
    }

    modal.classList.add('active');
  }

  function handleTimetableModalSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('form-timetable-id').value;
    const day = document.getElementById('form-tt-day').value;
    const time = document.getElementById('form-tt-time').value.trim();
    const courseCode = document.getElementById('form-tt-course').value;
    const classroom = document.getElementById('form-tt-room').value.trim();
    const professor = document.getElementById('form-tt-prof').value;

    const courses = window.CollegeDB.getCourses();
    const cObj = courses.find(c => c.code === courseCode);
    const courseName = cObj ? cObj.name : courseCode;

    window.CollegeDB.addOrUpdateTimetableSlot({ id, day, time, courseCode, courseName, classroom, professor }, currentUser);
    showToast('Lecture slot saved successfully.', 'success');
    document.getElementById('timetable-modal').classList.remove('active');
    renderAdminTimetableEditor();
  }

  // ==========================================
  // --- UNIFIED ENTERPRISE BULK UPLOAD SYSTEM ---
  // ==========================================
  function setupUnifiedBulkUploader() {
    const dropArea = document.getElementById('unified-upload-area');
    const fileInput = document.getElementById('unified-file-input');
    if (!dropArea || !fileInput) return;

    dropArea.addEventListener('click', () => fileInput.click());
    dropArea.addEventListener('dragover', (e) => { e.preventDefault(); dropArea.classList.add('dragover'); });
    dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));
    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) parseUploadedFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) parseUploadedFile(fileInput.files[0]);
    });

    document.getElementById('close-preview-modal')?.addEventListener('click', () => previewModal.classList.remove('active'));
    document.getElementById('cancel-preview-btn')?.addEventListener('click', () => previewModal.classList.remove('active'));
    document.getElementById('confirm-commit-upload-btn')?.addEventListener('click', commitParsedBatch);
  }

  function parseUploadedFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();

    if (ext === 'json') {
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          processPreflightBatch(parsed);
        } catch (err) {
          showToast('Invalid JSON file formatting.', 'danger');
        }
      };
      reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const parsed = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
          processPreflightBatch(parsed);
        } catch (err) {
          showToast('Error parsing Excel/CSV file format.', 'danger');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      showToast('Unsupported file type. Use .CSV, .XLSX, or .JSON.', 'warning');
    }
  }

  function processPreflightBatch(dataRows) {
    const targetType = document.getElementById('upload-target-type').value;
    const mode = document.getElementById('upload-duplicate-mode').value;

    const validation = window.CollegeDB.validateBatch(targetType, dataRows);
    pendingParsedBatch = { type: targetType, mode: mode, rows: dataRows, validation: validation };

    // Update Modal Preview Stats
    document.getElementById('preview-valid-count').innerText = `Valid: ${validation.valid.length}`;
    document.getElementById('preview-dup-count').innerText = `Duplicates: ${validation.duplicates.length}`;
    document.getElementById('preview-error-count').innerText = `Errors: ${validation.errors.length}`;

    // Render Preview Table
    const tableEl = document.getElementById('preview-data-table');
    const thead = tableEl.querySelector('thead');
    const tbody = tableEl.querySelector('tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (dataRows.length > 0) {
      const keys = Object.keys(dataRows[0]);
      const trH = document.createElement('tr');
      trH.innerHTML = `<th>Row</th><th>Status</th>` + keys.map(k => `<th>${k}</th>`).join('');
      thead.appendChild(trH);

      dataRows.forEach((r, idx) => {
        const rowNum = idx + 1;
        const isErr = validation.errors.find(e => e.row === rowNum);
        const isDup = validation.duplicates.find(d => d.row === rowNum);

        let rowClass = 'row-valid';
        let badgeHtml = '<span class="badge badge-success">Valid</span>';
        if (isErr) {
          rowClass = 'row-error';
          badgeHtml = `<span class="badge badge-danger" title="${isErr.error}">Error</span>`;
        } else if (isDup) {
          rowClass = 'row-duplicate';
          badgeHtml = `<span class="badge badge-warning" title="${isDup.reason}">Duplicate</span>`;
        }

        const tr = document.createElement('tr');
        tr.className = rowClass;
        tr.innerHTML = `<td>${rowNum}</td><td>${badgeHtml}</td>` + keys.map(k => `<td>${r[k] !== undefined ? r[k] : ''}</td>`).join('');
        tbody.appendChild(tr);
      });
    }

    previewModal.classList.add('active');
  }

  function commitParsedBatch() {
    if (!pendingParsedBatch) return;

    const { type, mode, validation } = pendingParsedBatch;
    const validRecords = validation.valid.map(v => v.record);

    if (validRecords.length === 0) {
      showToast('No valid records to import.', 'warning');
      previewModal.classList.remove('active');
      return;
    }

    let success = false;
    if (type === 'students') {
      success = window.CollegeDB.uploadStudents(validRecords, mode, currentUser);
    } else if (type === 'staff') {
      success = window.CollegeDB.uploadStaff(validRecords, currentUser);
    } else if (type === 'timetable') {
      success = window.CollegeDB.uploadTimetable(validRecords, currentUser);
    }

    if (success) {
      showToast(`Import Successful! Synchronized ${validRecords.length} records into database.`, 'success');
      previewModal.classList.remove('active');
      renderActiveView();
    } else {
      showToast('Transaction failed. Rollback executed.', 'danger');
    }
  }

  function downloadCSVTemplate() {
    const targetType = document.getElementById('upload-target-type').value;
    let data = [];
    if (targetType === 'students') {
      data = [{ name: 'Jane Doe', roll: 'CSE-2026-99', email: 'jane@annamalai.edu', deptId: 'cse', loginId: 'student_jane', password: 'studentpassword' }];
    } else if (targetType === 'staff') {
      data = [{ name: 'Dr. John Von Neumann', email: 'j.neumann@annamalai.edu', deptId: 'cse', loginId: 'staff_john', password: 'staffpassword' }];
    } else if (targetType === 'timetable') {
      data = [{ day: 'Monday', time: '09:00 AM - 10:30 AM', courseCode: 'CS-101', courseName: 'Data Structures', classroom: 'Lab 1', professor: 'Dr. Alan Turing' }];
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `${targetType}_import_template.csv`);
  }

  // --- DATABASE BACKUP & RESTORE ---
  function exportDatabaseBackup() {
    const jsonStr = window.CollegeDB.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annamalai_cms_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Database backup downloaded.', 'success');
  }

  function importDatabaseBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = window.CollegeDB.importDatabaseJSON(evt.target.result, currentUser);
      if (res.success) {
        showToast('Database restored successfully!', 'success');
        renderActiveView();
      } else {
        showToast(`Restore failed: ${res.error}`, 'danger');
      }
    };
    reader.readAsText(file);
  }

  function resetDatabaseSystem() {
    if (confirm("WARNING: Are you sure you want to reset all college records to initial defaults?")) {
      window.CollegeDB.reset();
      showToast('Database reset to factory defaults.', 'warning');
      renderActiveView();
    }
  }

  // ==========================================
  // --- STAFF RENDER ROUTINES ---
  // ==========================================

  function renderStaffDashboard() {
    const courses = window.CollegeDB.getCourses();
    const myCourseIds = currentUser.courses || [];
    const container = document.getElementById('staff-dashboard-courses-list');
    container.innerHTML = '';

    if (myCourseIds.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No subjects currently assigned to your profile.</p>';
      return;
    }

    myCourseIds.forEach(cId => {
      const course = courses.find(c => c.id === cId);
      if (!course) return;

      const card = document.createElement('div');
      card.className = 'card';
      card.style.margin = '0';
      card.innerHTML = `
        <div class="card-header">
          <h3 class="card-title">${course.code}</h3>
          <span class="badge badge-info">${course.deptId.toUpperCase()}</span>
        </div>
        <p style="font-weight:600; margin-bottom:12px; font-size:0.95rem;">${course.name}</p>
        <button class="btn btn-primary btn-sm mark-btn" data-course="${course.id}">
          <i class="fa-solid fa-check"></i> Launch Marker
        </button>
      `;

      card.querySelector('.mark-btn').onclick = () => {
        document.getElementById('marker-course-select').value = course.id;
        setActiveTab('staff-marker');
      };

      container.appendChild(card);
    });
  }

  function renderStaffMarker() {
    const courses = window.CollegeDB.getCourses();
    const myCourseIds = currentUser.courses || [];
    const select = document.getElementById('marker-course-select');
    select.innerHTML = '';

    myCourseIds.forEach(cId => {
      const c = courses.find(x => x.id === cId);
      if (c) {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.innerText = `${c.code} - ${c.name}`;
        select.appendChild(opt);
      }
    });

    const dateInput = document.getElementById('marker-date-select');
    if (!dateInput.value) dateInput.value = new Date().toISOString().split('T')[0];

    renderStaffMarkerGrid();
  }

  function renderStaffMarkerGrid() {
    const courseId = document.getElementById('marker-course-select').value;
    const date = document.getElementById('marker-date-select').value;
    if (!courseId) return;

    const students = window.CollegeDB.getStudents().filter(s => s.courses.includes(courseId));
    const attendance = window.CollegeDB.getAttendance();
    const existingForDate = attendance.filter(a => a.courseId === courseId && a.date === date);

    const tbody = document.getElementById('staff-marker-grid');
    tbody.innerHTML = '';

    students.forEach(std => {
      const existingRecord = existingForDate.find(a => a.studentId === std.id);
      const currentStatus = existingRecord ? existingRecord.status : 'present';

      const stats = window.CollegeDB.getStudentStats(std.id);
      const cStat = stats ? stats.courseStats.find(cs => cs.courseId === courseId) : null;
      const pctVal = cStat ? cStat.percentage : 100;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${std.roll}</code></td>
        <td><strong>${std.name}</strong></td>
        <td><span class="badge ${pctVal >= 75 ? 'badge-success' : 'badge-danger'}">${pctVal}%</span></td>
        <td>
          <div style="display:flex; gap:16px;">
            <label style="cursor:pointer; display:flex; align-items:center; gap:4px;">
              <input type="radio" name="att-${std.id}" value="present" ${currentStatus === 'present' ? 'checked' : ''}> Present
            </label>
            <label style="cursor:pointer; display:flex; align-items:center; gap:4px;">
              <input type="radio" name="att-${std.id}" value="late" ${currentStatus === 'late' ? 'checked' : ''}> Late
            </label>
            <label style="cursor:pointer; display:flex; align-items:center; gap:4px;">
              <input type="radio" name="att-${std.id}" value="absent" ${currentStatus === 'absent' ? 'checked' : ''}> Absent
            </label>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function saveAttendanceMarkerSession() {
    const courseId = document.getElementById('marker-course-select').value;
    const date = document.getElementById('marker-date-select').value;
    if (!courseId || !date) return;

    const students = window.CollegeDB.getStudents().filter(s => s.courses.includes(courseId));
    const records = [];

    students.forEach(std => {
      const checkedRadio = document.querySelector(`input[name="att-${std.id}"]:checked`);
      const status = checkedRadio ? checkedRadio.value : 'present';
      records.push({ studentId: std.id, status });
    });

    window.CollegeDB.saveAttendanceSession(courseId, date, records, currentUser);
    showToast(`Attendance saved for ${date}!`, 'success');
  }

  function generateQRSessionCode() {
    const courseId = document.getElementById('marker-course-select').value;
    const date = document.getElementById('marker-date-select').value;
    const qrDisplay = document.getElementById('qr-code-display');
    qrDisplay.innerHTML = '';

    const sessionToken = JSON.stringify({ courseId, date, token: Date.now() });
    new QRCode(qrDisplay, { text: sessionToken, width: 160, height: 160 });
    qrModal.classList.add('active');
  }

  function handleCancelClassClick() {
    const courseId = document.getElementById('marker-course-select').value;
    const date = document.getElementById('marker-date-select').value;
    const reason = prompt("Enter class cancellation reason:");
    if (reason) {
      window.CollegeDB.markClassCancelled(courseId, date, reason, currentUser);
      showToast(`Class marked cancelled for ${date}. Students un-penalized.`, 'warning');
    }
  }

  function renderStaffStudentMetrics() {
    const myCourseIds = currentUser.courses || [];
    const students = window.CollegeDB.getStudents();
    const courses = window.CollegeDB.getCourses();
    const tbody = document.getElementById('staff-student-pct-table').querySelector('tbody');
    tbody.innerHTML = '';

    students.forEach(std => {
      const stats = window.CollegeDB.getStudentStats(std.id);
      if (!stats) return;

      stats.courseStats.forEach(cs => {
        if (myCourseIds.includes(cs.courseId)) {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${std.name}</strong></td>
            <td><code>${std.roll}</code></td>
            <td><strong>${cs.courseCode}</strong></td>
            <td>${cs.present + cs.excused} / ${cs.total}</td>
            <td><strong>${cs.percentage}%</strong></td>
            <td><span class="badge ${cs.percentage >= 75 ? 'badge-success' : 'badge-danger'}">${cs.percentage >= 75 ? 'Eligible' : 'Shortage'}</span></td>
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

    document.getElementById('student-stat-present').innerText = stats.present;
    document.getElementById('student-stat-late').innerText = stats.late;
    document.getElementById('student-stat-absent').innerText = stats.absent;
    
    const pctVal = document.getElementById('student-overall-percentage-val');
    pctVal.innerText = `${stats.overallPercentage}%`;
    pctVal.style.color = stats.overallPercentage < 75 ? 'var(--danger)' : 'var(--success)';

    const shortageBanner = document.getElementById('student-shortage-banner');
    if (stats.overallPercentage < 75) {
      document.getElementById('student-shortage-pct').innerText = stats.overallPercentage;
      shortageBanner.style.display = 'flex';
    } else {
      shortageBanner.style.display = 'none';
    }

    if (window.CollegeCharts) {
      window.CollegeCharts.renderOverallPie('studentOverallPieChart', stats.present, stats.late, stats.absent, stats.excused);
      
      const labels = stats.courseStats.map(c => c.courseCode);
      const values = stats.courseStats.map(c => c.percentage);
      window.CollegeCharts.renderSubjectBars('studentSubjectBarChart', labels, values);

      // Render Predictive Trajectory Line
      const dates = ['W1', 'W2', 'W3', 'W4', 'W5 (Current)', 'W6 (ML Forecast)', 'W7 (ML Forecast)'];
      const actual = [90, 85, 80, 82, stats.overallPercentage, null, null];
      const predicted = [null, null, null, null, stats.overallPercentage, Math.min(100, stats.overallPercentage + 2), Math.min(100, stats.overallPercentage + 4)];
      window.CollegeCharts.renderPredictiveLine('studentPredictiveChart', dates, actual, predicted);
    }

    // Populate Leave Select
    const leaveCourseSel = document.getElementById('leave-course-select');
    if (leaveCourseSel) {
      leaveCourseSel.innerHTML = '';
      stats.courseStats.forEach(cs => {
        const opt = document.createElement('option');
        opt.value = cs.courseId;
        opt.innerText = `${cs.courseCode} - ${cs.courseName}`;
        leaveCourseSel.appendChild(opt);
      });
    }

    renderStudentCalendar();
    renderStudentLeaveHistory();

    // Roster Breakdown Table
    const tbody = document.getElementById('student-subject-details-table').querySelector('tbody');
    tbody.innerHTML = '';

    stats.courseStats.forEach(cs => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${cs.courseCode}</strong></td>
        <td>${cs.courseName}</td>
        <td>${cs.total}</td>
        <td>${cs.present + cs.excused} / ${cs.total}</td>
        <td><strong>${cs.percentage}%</strong></td>
        <td><span class="badge ${cs.percentage >= 75 ? 'badge-success' : 'badge-danger'}">${cs.percentage >= 75 ? 'Eligible' : 'Shortage'}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderStudentCalendar() {
    const grid = document.getElementById('student-calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    dayHeaders.forEach(dh => {
      const dEl = document.createElement('div');
      dEl.className = 'calendar-day-header';
      dEl.innerText = dh;
      grid.appendChild(dEl);
    });

    const attRecords = window.CollegeDB.getAttendance().filter(a => a.studentId === currentUser.id);

    for (let day = 1; day <= 28; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';
      dayEl.innerText = day;

      const rec = attRecords.length > 0 ? attRecords[day % attRecords.length] : null;
      if (rec) {
        dayEl.classList.add(`day-${rec.status}`);
        dayEl.title = `Day ${day}: ${rec.status.toUpperCase()}`;
      }

      grid.appendChild(dayEl);
    }
  }

  function handleLeaveFormSubmit(e) {
    e.preventDefault();
    const courseId = document.getElementById('leave-course-select').value;
    const date = document.getElementById('leave-date-input').value;
    const reason = document.getElementById('leave-reason-input').value.trim();

    if (!courseId) {
      showToast('Select a subject first.', 'warning');
      return;
    }

    window.CollegeDB.addLeaveRequest(currentUser.id, courseId, date, reason);
    showToast('Leave application submitted successfully.', 'success');
    document.getElementById('student-leave-form').reset();
    renderStudentLeaveHistory();
  }

  function renderStudentLeaveHistory() {
    const leaves = window.CollegeDB.getLeaveRequests().filter(l => l.studentId === currentUser.id);
    const courses = window.CollegeDB.getCourses();
    const tbody = document.getElementById('student-leave-history-table').querySelector('tbody');
    tbody.innerHTML = '';

    leaves.forEach(l => {
      const c = courses.find(x => x.id === l.courseId);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${l.date}</td>
        <td><strong>${c ? c.code : l.courseId}</strong></td>
        <td>${l.reason}</td>
        <td><span class="badge ${l.status === 'approved' ? 'badge-success' : l.status === 'rejected' ? 'badge-danger' : 'badge-warning'}">${l.status.toUpperCase()}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderStudentTimetable() {
    const timetable = window.CollegeDB.getTimetable();
    const courses = window.CollegeDB.getCourses();
    const myCourseCodes = (currentUser.courses || []).map(cId => {
      const cObj = courses.find(c => c.id === cId);
      return cObj ? cObj.code : '';
    });

    const mySlots = timetable.filter(t => myCourseCodes.includes(t.courseCode));
    const tbody = document.getElementById('student-timetable-table').querySelector('tbody');
    tbody.innerHTML = '';

    mySlots.forEach(slot => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${slot.day}</strong></td>
        <td>${slot.time}</td>
        <td><code>${slot.courseCode}</code></td>
        <td>${slot.courseName}</td>
        <td><span class="badge badge-info">${slot.classroom}</span></td>
        <td>${slot.professor}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- REPORT EXPORTERS (CSV, XLSX, .ICS) ---
  function exportStudentReport(format) {
    if (!currentUser || !currentUser.id) return;
    const stats = window.CollegeDB.getStudentStats(currentUser.id);
    if (!stats || !stats.courseStats || stats.courseStats.length === 0) {
      showToast('No course records available to export.', 'warning');
      return;
    }

    const exportData = stats.courseStats.map(cs => ({
      'Student Name': currentUser.name,
      'Roll Number': currentUser.roll,
      'Subject Code': cs.courseCode,
      'Subject Name': cs.courseName,
      'Total Sessions': cs.total,
      'Attended Sessions': cs.present + cs.excused,
      'Attendance Percentage': `${cs.percentage}%`,
      'Eligibility Status': cs.percentage >= 75 ? 'Eligible' : 'Shortage'
    }));

    if (format === 'csv' || format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
      XLSX.writeFile(wb, `${currentUser.roll || 'Student'}_Attendance_Report.${format}`);
      showToast(`Exported ${format.toUpperCase()} attendance report.`, 'success');
    }
  }

  function exportCalendarICS() {
    let timetable = window.CollegeDB.getTimetable();
    if (currentUser && currentUser.courses) {
      const courses = window.CollegeDB.getCourses();
      const myCodes = currentUser.courses.map(cId => {
        const cObj = courses.find(c => c.id === cId);
        return cObj ? cObj.code : '';
      });
      timetable = timetable.filter(t => myCodes.includes(t.courseCode));
    }

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Annamalai University//CMS Timetable//EN\n";

    timetable.forEach(slot => {
      icsContent += `BEGIN:VEVENT\nSUMMARY:${slot.courseCode} - ${slot.courseName}\nDESCRIPTION:Professor: ${slot.professor}\nLOCATION:${slot.classroom}\nEND:VEVENT\n`;
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Annamalai_Timetable.ics`;
    a.click();
    showToast('Exported Timetable to .ICS calendar format.', 'success');
  }

  // ==========================================
  // --- PARENT PORTAL ROUTINE ---
  // ==========================================
  function renderParentDashboard() {
    if (!currentUser || !currentUser.ward) return;
    const ward = currentUser.ward;
    const stats = window.CollegeDB.getStudentStats(ward.id);

    document.getElementById('parent-ward-info').innerHTML = `
      Monitoring Ward: <strong>${ward.name}</strong> (Roll: <code>${ward.roll}</code>) | Department: <strong style="text-transform:uppercase;">${ward.deptId}</strong>
      | Overall Percentage: <strong style="color:${stats.overallPercentage < 75 ? 'var(--danger)' : 'var(--success)'};">${stats.overallPercentage}%</strong>
    `;

    const tbody = document.getElementById('parent-ward-table').querySelector('tbody');
    tbody.innerHTML = '';

    stats.courseStats.forEach(cs => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${cs.courseCode}</strong></td>
        <td>${cs.courseName}</td>
        <td>${cs.present + cs.excused} / ${cs.total}</td>
        <td><strong>${cs.percentage}%</strong></td>
        <td><span class="badge ${cs.percentage >= 75 ? 'badge-success' : 'badge-danger'}">${cs.percentage >= 75 ? 'Eligible' : 'Shortage'}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // RUN INITIALIZER
  init();
});
