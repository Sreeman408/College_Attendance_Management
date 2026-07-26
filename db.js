// db.js - Enhanced Mock Database Engine with Transaction Support & Schema Validation

(function (window) {
  const DB_KEY = 'annamalai_cms_db';

  // Helper to generate past date strings (weekdays only)
  function getPastWeekday(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const day = d.getDay();
    if (day === 0) d.setDate(d.getDate() - 2); // Sun -> Fri
    else if (day === 6) d.setDate(d.getDate() - 1); // Sat -> Fri
    return d.toISOString().split('T')[0];
  }

  // Pre-configured default database schema and data
  const DEFAULT_DB = {
    departments: [
      { id: 'cse', name: 'Computer Science & Engineering', code: 'CSE' },
      { id: 'it', name: 'Information Technology', code: 'IT' },
      { id: 'ece', name: 'Electronics & Communication', code: 'ECE' }
    ],
    courses: [
      { id: 'cs101', name: 'Data Structures & Algorithms', code: 'CS-101', deptId: 'cse' },
      { id: 'cs102', name: 'Database Management Systems', code: 'CS-102', deptId: 'cse' },
      { id: 'cs103', name: 'Advanced Web Development', code: 'CS-103', deptId: 'cse' },
      { id: 'it101', name: 'Information Security', code: 'IT-101', deptId: 'it' },
      { id: 'ec101', name: 'Digital Logic Circuits', code: 'EC-101', deptId: 'ece' }
    ],
    admin: {
      loginId: 'admin101',
      password: 'adminpassword',
      name: 'Registrar (Admin Office)'
    },
    staff: [
      { id: 'prof1', name: 'Dr. Alan Turing', email: 'a.turing@annamalai.edu', deptId: 'cse', courses: ['cs101', 'cs102'], loginId: 'staff_alan', password: 'staffpassword' },
      { id: 'prof2', name: 'Prof. Grace Hopper', email: 'g.hopper@annamalai.edu', deptId: 'cse', courses: ['cs103'], loginId: 'staff_grace', password: 'staffpassword' },
      { id: 'prof3', name: 'Dr. Edgar Codd', email: 'e.codd@annamalai.edu', deptId: 'it', courses: ['it101'], loginId: 'staff_codd', password: 'staffpassword' },
      { id: 'prof4', name: 'Prof. Claude Shannon', email: 'c.shannon@annamalai.edu', deptId: 'ece', courses: ['ec101'], loginId: 'staff_shannon', password: 'staffpassword' }
    ],
    students: [
      { id: 'std1', name: 'Alice Smith', roll: 'CSE-2026-01', email: 'alice.s@annamalai.edu', deptId: 'cse', courses: ['cs101', 'cs102', 'cs103'], loginId: 'student_alice', password: 'studentpassword' },
      { id: 'std2', name: 'Bob Johnson', roll: 'CSE-2026-02', email: 'bob.j@annamalai.edu', deptId: 'cse', courses: ['cs101', 'cs103'], loginId: 'student_bob', password: 'studentpassword' },
      { id: 'std3', name: 'Charlie Brown', roll: 'CSE-2026-03', email: 'charlie.b@annamalai.edu', deptId: 'cse', courses: ['cs101', 'cs102'], loginId: 'student_charlie', password: 'studentpassword' },
      { id: 'std4', name: 'Diana Prince', roll: 'CSE-2026-04', email: 'diana.p@annamalai.edu', deptId: 'cse', courses: ['cs102', 'cs103'], loginId: 'student_diana', password: 'studentpassword' },
      { id: 'std5', name: 'Evan Wright', roll: 'CSE-2026-05', email: 'evan.w@annamalai.edu', deptId: 'cse', courses: ['cs101', 'cs102', 'cs103'], loginId: 'student_evan', password: 'studentpassword' }
    ],
    timetable: [
      { id: 'tt1', day: 'Monday', time: '09:00 AM - 10:30 AM', courseId: 'cs101', classroom: 'Lecture Hall 101', staffId: 'prof1' },
      { id: 'tt2', day: 'Monday', time: '11:00 AM - 12:30 PM', courseId: 'cs103', classroom: 'Computer Lab 3', staffId: 'prof2' },
      { id: 'tt3', day: 'Tuesday', time: '09:00 AM - 10:30 AM', courseId: 'cs102', classroom: 'Lecture Hall 204', staffId: 'prof1' },
      { id: 'tt4', day: 'Tuesday', time: '11:00 AM - 12:30 PM', courseId: 'it101', classroom: 'Lecture Hall 102', staffId: 'prof3' },
      { id: 'tt5', day: 'Wednesday', time: '09:00 AM - 10:30 AM', courseId: 'ec101', classroom: 'ECE Lab A', staffId: 'prof4' },
      { id: 'tt6', day: 'Wednesday', time: '11:00 AM - 12:30 PM', courseId: 'cs101', classroom: 'Lecture Hall 101', staffId: 'prof1' },
      { id: 'tt7', day: 'Thursday', time: '09:00 AM - 10:30 AM', courseId: 'cs103', classroom: 'Computer Lab 3', staffId: 'prof2' },
      { id: 'tt8', day: 'Thursday', time: '11:00 AM - 12:30 PM', courseId: 'cs102', classroom: 'Lecture Hall 204', staffId: 'prof1' },
      { id: 'tt9', day: 'Friday', time: '09:00 AM - 10:30 AM', courseId: 'ec101', classroom: 'ECE Lab A', staffId: 'prof4' },
      { id: 'tt10', day: 'Friday', time: '11:00 AM - 12:30 PM', courseId: 'it101', classroom: 'Lecture Hall 102', staffId: 'prof3' }
    ],
    attendance: [],
    leaveRequests: [
      { id: 'leave1', studentId: 'std1', courseId: 'cs101', date: getPastWeekday(1), reason: 'Medical appointment', status: 'approved', submittedAt: getPastWeekday(2) },
      { id: 'leave2', studentId: 'std2', courseId: 'cs103', date: getPastWeekday(0), reason: 'Family event', status: 'pending', submittedAt: getPastWeekday(1) }
    ],
    substitutes: [],
    cancelledClasses: [],
    auditLogs: [],
    settings: {
      minAttendancePct: 75
    }
  };

  // Pre-populate mock historical attendance records for the last 6 weekdays
  const statuses = ['present', 'present', 'present', 'absent', 'present', 'late', 'present'];
  let attCounter = 1;

  for (let daysAgo = 6; daysAgo >= 1; daysAgo--) {
    const dateStr = getPastWeekday(daysAgo);
    DEFAULT_DB.courses.forEach(course => {
      const students = DEFAULT_DB.students.filter(s => s.courses.includes(course.id));
      students.forEach((student, sIdx) => {
        const status = statuses[(sIdx + daysAgo) % statuses.length];
        DEFAULT_DB.attendance.push({
          id: 'att_' + attCounter++,
          date: dateStr,
          courseId: course.id,
          studentId: student.id,
          status: status
        });
      });
    });
  }

  // Pre-populate initial audit logs
  DEFAULT_DB.auditLogs.push({
    id: 'log_1',
    timestamp: new Date().toISOString(),
    userId: 'admin101',
    userName: 'Registrar (Admin Office)',
    role: 'ADMIN',
    action: 'SYSTEM_INIT',
    details: 'Database schema initialized with default academic records.'
  });

  class CollegeCMSDB {
    constructor() {
      this.load();
      this.migrateToHashedPasswords().catch(console.error);
    }

    async hashPassword(password) {
      if (!password) return '';
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async migrateToHashedPasswords() {
      let migrated = false;
      const isHash = (str) => /^[a-f0-9]{64}$/i.test(str);

      // Admin
      if (this.data.admin && !isHash(this.data.admin.password)) {
        this.data.admin.password = await this.hashPassword(this.data.admin.password);
        migrated = true;
      }
      if (this.data.admin && (!this.data.admin.question || !this.data.admin.answer)) {
        this.data.admin.question = "What is your mother's maiden name?";
        this.data.admin.answer = await this.hashPassword("smith");
        migrated = true;
      }

      // Staff
      if (this.data.staff) {
        for (let st of this.data.staff) {
          if (!isHash(st.password)) {
            st.password = await this.hashPassword(st.password);
            migrated = true;
          }
          if (!st.question) {
            st.question = "What is your mother's maiden name?";
            st.answer = await this.hashPassword("smith");
            migrated = true;
          }
        }
      }

      // Students
      if (this.data.students) {
        for (let s of this.data.students) {
          if (!isHash(s.password)) {
            s.password = await this.hashPassword(s.password);
            migrated = true;
          }
          if (!s.question) {
            s.question = "What is your mother's maiden name?";
            s.answer = await this.hashPassword("smith");
            migrated = true;
          }
        }
      }

      // Parents
      if (!this.data.parents) {
        this.data.parents = [];
        if (this.data.students) {
          for (let s of this.data.students) {
            const parentPass = await this.hashPassword('parentpassword');
            const parentAns = await this.hashPassword('smith');
            this.data.parents.push({
              id: 'parent_' + s.id,
              name: `Parent of ${s.name}`,
              studentId: s.id,
              loginId: 'parent_' + s.loginId.replace('student_', ''),
              password: parentPass,
              question: "What is your mother's maiden name?",
              answer: parentAns
            });
          }
        }
        migrated = true;
      } else {
        for (let p of this.data.parents) {
          if (!isHash(p.password)) {
            p.password = await this.hashPassword(p.password);
            migrated = true;
          }
          if (!p.question) {
            p.question = "What is your mother's maiden name?";
            p.answer = await this.hashPassword("smith");
            migrated = true;
          }
        }
      }

      if (migrated) {
        this.save();
      }
    }

    load() {
      const stored = localStorage.getItem(DB_KEY);
      if (stored) {
        try {
          this.data = JSON.parse(stored);
          // Ensure arrays exist for newly added features
          this.data.leaveRequests = this.data.leaveRequests || [];
          this.data.substitutes = this.data.substitutes || [];
          this.data.cancelledClasses = this.data.cancelledClasses || [];
          this.data.auditLogs = this.data.auditLogs || [];
        } catch (e) {
          console.error("Local database corrupted, resetting to defaults", e);
          this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
          this.save();
        }
      } else {
        this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
        this.save();
      }

      this.migrateTimetableData();
    }

    migrateTimetableData() {
      if (!Array.isArray(this.data.timetable)) {
        this.data.timetable = [];
        return;
      }
      let changed = false;
      this.data.timetable.forEach((slot, idx) => {
        if (!slot.id) {
          slot.id = 'tt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
          changed = true;
        }

        // Migrate courseCode/courseName -> courseId
        if (!slot.courseId && slot.courseCode) {
          const course = (this.data.courses || []).find(c => 
            c.code.toLowerCase() === slot.courseCode.toLowerCase() ||
            (slot.courseName && c.name.toLowerCase() === slot.courseName.toLowerCase())
          );
          if (course) {
            slot.courseId = course.id;
            changed = true;
          }
        }

        // Migrate professor -> staffId
        if (!slot.staffId && slot.professor) {
          const staff = (this.data.staff || []).find(st => 
            st.name.toLowerCase() === slot.professor.toLowerCase() ||
            (st.loginId && st.loginId.toLowerCase() === slot.professor.toLowerCase())
          );
          if (staff) {
            slot.staffId = staff.id;
            changed = true;
          }
        }
      });

      if (changed) {
        this.save();
      }
    }

    save() {
      localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    }

    reset() {
      this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
      this.save();
    }

    // --- TRANSACTIONAL SUPPORT & ROLLBACK ---
    createSnapshot() {
      return JSON.stringify(this.data);
    }

    restoreSnapshot(snapshotJSON) {
      try {
        this.data = JSON.parse(snapshotJSON);
        this.save();
        return true;
      } catch (e) {
        console.error("Failed to restore snapshot", e);
        return false;
      }
    }

    // --- AUDIT LOGGING ---
    logAudit(userId, userName, role, action, details) {
      const logEntry = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toISOString(),
        userId: userId || 'SYSTEM',
        userName: userName || 'System Process',
        role: (role || 'SYSTEM').toUpperCase(),
        action: action,
        details: details
      };
      this.data.auditLogs.unshift(logEntry);
      if (this.data.auditLogs.length > 200) {
        this.data.auditLogs = this.data.auditLogs.slice(0, 200); // cap to recent 200 logs
      }
      this.save();
    }

    getAuditLogs() {
      return this.data.auditLogs || [];
    }

    // --- SCHEMA VALIDATION & BULK UPLOAD VALIDATOR LAYER ---
    validateStudentSchema(record) {
      const errors = [];
      if (!record.name || typeof record.name !== 'string' || !record.name.trim()) errors.push("Missing or invalid Student Name");
      if (!record.roll || typeof record.roll !== 'string' || !record.roll.trim()) errors.push("Missing or invalid Roll Number");
      if (!record.email || typeof record.email !== 'string' || !record.email.includes('@')) errors.push("Invalid Email Address");
      
      const validDepts = this.getDepartments().map(d => d.id);
      if (!record.deptId || !validDepts.includes(record.deptId.toLowerCase())) {
        errors.push(`Invalid Department ID '${record.deptId}'. Valid choices: ${validDepts.join(', ')}`);
      }
      if (!record.loginId || typeof record.loginId !== 'string') errors.push("Missing Login ID");
      if (!record.password || typeof record.password !== 'string') errors.push("Missing Password");

      return errors;
    }

    validateTimetableSchema(record) {
      const errors = [];
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      if (!record.day || !validDays.includes(record.day)) errors.push(`Invalid Day '${record.day}'`);
      if (!record.time || typeof record.time !== 'string') errors.push("Missing Time slot");
      if (!record.classroom || typeof record.classroom !== 'string') errors.push("Missing Classroom");

      // Resolve Course
      let course = null;
      if (record.courseId) {
        course = this.getCourses().find(c => c.id === record.courseId || c.code.toLowerCase() === record.courseId.toLowerCase());
      }
      if (!course && record.courseCode) {
        course = this.getCourses().find(c => c.code.toLowerCase() === record.courseCode.toLowerCase() || c.name.toLowerCase() === record.courseCode.toLowerCase());
      }
      if (!course && record.courseName) {
        course = this.getCourses().find(c => c.name.toLowerCase() === record.courseName.toLowerCase());
      }
      if (!course) {
        errors.push(`Unresolved Course '${record.courseId || record.courseCode || record.courseName || ''}'`);
      }

      // Resolve Faculty
      let staff = null;
      if (record.staffId) {
        staff = this.getStaff().find(st => st.id === record.staffId || st.loginId.toLowerCase() === record.staffId.toLowerCase());
      }
      if (!staff && (record.professor || record.faculty || record.loginId)) {
        const q = (record.professor || record.faculty || record.loginId).trim().toLowerCase();
        staff = this.getStaff().find(st => st.name.toLowerCase() === q || st.loginId.toLowerCase() === q || st.email.toLowerCase() === q);
      }
      if (!staff) {
        errors.push(`Unresolved Faculty '${record.staffId || record.professor || record.faculty || ''}'`);
      }

      // Check allocation
      if (course && staff) {
        const isAllocated = Array.isArray(staff.courses) && staff.courses.includes(course.id);
        if (!isAllocated) {
          errors.push(`Faculty '${staff.name}' is not allocated to teach course '${course.code}' (${course.name})`);
        }
      }

      return errors;
    }

    validateStaffSchema(record) {
      const errors = [];
      if (!record.name || typeof record.name !== 'string') errors.push("Missing Professor Name");
      if (!record.email || typeof record.email !== 'string' || !record.email.includes('@')) errors.push("Invalid Email");
      const validDepts = this.getDepartments().map(d => d.id);
      if (!record.deptId || !validDepts.includes(record.deptId.toLowerCase())) errors.push(`Invalid Dept ID '${record.deptId}'`);
      if (!record.loginId || typeof record.loginId !== 'string') errors.push("Missing Login ID");
      if (!record.password || typeof record.password !== 'string') errors.push("Missing Password");

      return errors;
    }

    validateBatch(type, records) {
      const results = { valid: [], errors: [], duplicates: [], conflicts: [] };
      if (!Array.isArray(records)) {
        results.errors.push({ row: 0, record: null, error: 'Input data is not an array' });
        return results;
      }

      records.forEach((rec, idx) => {
        const rowNum = idx + 1;
        let schemaErrors = [];

        if (type === 'students') {
          schemaErrors = this.validateStudentSchema(rec);
          const isDuplicate = this.getStudents().some(s => s.roll === rec.roll || s.loginId === rec.loginId);
          if (isDuplicate) {
            results.duplicates.push({ row: rowNum, record: rec, reason: `Duplicate Roll '${rec.roll}' or Login '${rec.loginId}'` });
          }
        } else if (type === 'timetable') {
          schemaErrors = this.validateTimetableSchema(rec);
          // Check room/time conflicts
          const conflict = this.getTimetable().some(t => t.day === rec.day && t.time === rec.time && t.classroom === rec.classroom);
          if (conflict) {
            results.conflicts.push({ row: rowNum, record: rec, reason: `Room Conflict: ${rec.classroom} occupied on ${rec.day} ${rec.time}` });
          }
        } else if (type === 'staff') {
          schemaErrors = this.validateStaffSchema(rec);
          const isDuplicate = this.getStaff().some(s => s.loginId === rec.loginId);
          if (isDuplicate) {
            results.duplicates.push({ row: rowNum, record: rec, reason: `Duplicate Staff Login '${rec.loginId}'` });
          }
        }

        if (schemaErrors.length > 0) {
          results.errors.push({ row: rowNum, record: rec, error: schemaErrors.join('; ') });
        } else {
          results.valid.push({ row: rowNum, record: rec });
        }
      });

      return results;
    }

    // --- GETTERS ---
    getDepartments() { return this.data.departments; }
    getCourses() { return this.data.courses; }
    getAdmin() { return this.data.admin; }
    getStaff() { return this.data.staff; }
    getStudents() { return this.data.students; }
    getTimetable() {
      return (this.data.timetable || []).map(slot => {
        const course = (this.data.courses || []).find(c => c.id === slot.courseId);
        const staff = (this.data.staff || []).find(st => st.id === slot.staffId);
        return {
          ...slot,
          courseCode: course ? course.code : (slot.courseCode || 'N/A'),
          courseName: course ? course.name : (slot.courseName || 'Unknown Course'),
          professor: staff ? staff.name : (slot.professor || 'Unassigned Professor'),
          staffName: staff ? staff.name : (slot.professor || 'Unassigned Professor'),
          staffLoginId: staff ? staff.loginId : ''
        };
      });
    }
    getAttendance() { return this.data.attendance; }
    getLeaveRequests() { return this.data.leaveRequests || []; }
    getSubstitutes() { return this.data.substitutes || []; }
    getCancelledClasses() { return this.data.cancelledClasses || []; }
    getSettings() { return this.data.settings; }

    // --- AUTHENTICATION ---
    async authenticate(loginId, password, category) {
      const hashedPassword = await this.hashPassword(password);
      
      if (category === 'admin') {
        const ad = this.getAdmin();
        if (ad.loginId === loginId && ad.password === hashedPassword) {
          return { role: 'admin', user: ad };
        }
      } else if (category === 'staff') {
        const prof = this.getStaff().find(s => s.loginId === loginId && s.password === hashedPassword);
        if (prof) {
          return { role: 'staff', user: prof };
        }
      } else if (category === 'student') {
        const student = this.getStudents().find(s => s.loginId === loginId && s.password === hashedPassword);
        if (student) {
          return { role: 'student', user: student };
        }
      } else if (category === 'parent') {
        return this.authenticateParent(loginId, hashedPassword);
      }
      return null;
    }

    authenticateParent(loginId, hashedPassword) {
      const parent = this.data.parents.find(p => 
        p.loginId.toLowerCase() === loginId.toLowerCase() && 
        p.password === hashedPassword
      );

      if (parent) {
        const student = this.getStudents().find(s => s.id === parent.studentId);
        return {
          role: 'parent',
          user: {
            id: parent.id,
            name: parent.name,
            email: `guardian.${student ? student.email : 'parent@annamalai.edu'}`,
            wardStudentId: parent.studentId,
            ward: student
          }
        };
      }
      return null;
    }

    getSecurityQuestion(category, loginId) {
      const id = loginId.trim().toLowerCase();
      let user = null;
      if (category === 'student') {
        user = this.data.students.find(x => x.loginId.toLowerCase() === id || x.email.toLowerCase() === id);
      } else if (category === 'staff') {
        user = this.data.staff.find(x => x.loginId.toLowerCase() === id || x.email.toLowerCase() === id);
      } else if (category === 'parent') {
        user = this.data.parents.find(x => x.loginId.toLowerCase() === id);
      } else if (category === 'admin') {
        user = this.data.admin.loginId.toLowerCase() === id ? this.data.admin : null;
      }
      return user ? user.question || "What is your mother's maiden name?" : null;
    }

    async verifySecurityAnswer(category, loginId, answer) {
      const id = loginId.trim().toLowerCase();
      let user = null;
      if (category === 'student') {
        user = this.data.students.find(x => x.loginId.toLowerCase() === id || x.email.toLowerCase() === id);
      } else if (category === 'staff') {
        user = this.data.staff.find(x => x.loginId.toLowerCase() === id || x.email.toLowerCase() === id);
      } else if (category === 'parent') {
        user = this.data.parents.find(x => x.loginId.toLowerCase() === id);
      } else if (category === 'admin') {
        user = this.data.admin.loginId.toLowerCase() === id ? this.data.admin : null;
      }
      if (!user) return false;
      const hashedAns = await this.hashPassword(answer.trim().toLowerCase());
      const storedAns = user.answer;
      return storedAns === hashedAns || storedAns === answer.trim().toLowerCase();
    }

    async resetPassword(category, loginId, newPassword) {
      const hashedPassword = await this.hashPassword(newPassword);
      const id = loginId.trim().toLowerCase();
      if (category === 'student') {
        const s = this.data.students.find(x => x.loginId.toLowerCase() === id || x.email.toLowerCase() === id);
        if (s) {
          s.password = hashedPassword;
          this.save();
          this.logAudit(s.id, s.name, 'STUDENT', 'PASSWORD_RESET', 'Password reset performed.');
          return true;
        }
      } else if (category === 'staff') {
        const prof = this.data.staff.find(x => x.loginId.toLowerCase() === id || x.email.toLowerCase() === id);
        if (prof) {
          prof.password = hashedPassword;
          this.save();
          this.logAudit(prof.id, prof.name, 'STAFF', 'PASSWORD_RESET', 'Faculty password reset performed.');
          return true;
        }
      } else if (category === 'admin') {
        if (this.data.admin.loginId.toLowerCase() === id) {
          this.data.admin.password = hashedPassword;
          this.save();
          this.logAudit(this.data.admin.loginId, this.data.admin.name, 'ADMIN', 'PASSWORD_RESET', 'Admin password reset performed.');
          return true;
        }
      } else if (category === 'parent') {
        const p = this.data.parents.find(x => x.loginId.toLowerCase() === id);
        if (p) {
          p.password = hashedPassword;
          this.save();
          this.logAudit(p.id, p.name, 'PARENT', 'PASSWORD_RESET', 'Parent password reset performed.');
          return true;
        }
      }
      return false;
    }

    // --- LEAVE MANAGEMENT ---
    addLeaveRequest(studentId, courseId, date, reason) {
      const student = this.getStudents().find(s => s.id === studentId);
      const req = {
        id: 'leave_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        studentId: studentId,
        studentName: student ? student.name : 'Unknown',
        courseId: courseId,
        date: date,
        reason: reason,
        status: 'pending',
        submittedAt: new Date().toISOString().split('T')[0]
      };
      this.data.leaveRequests.unshift(req);
      this.save();
      this.logAudit(studentId, student ? student.name : 'Student', 'STUDENT', 'LEAVE_SUBMIT', `Submitted leave application for ${date}`);
      return req;
    }

    updateLeaveStatus(leaveId, status, updatedByUser) {
      const req = this.data.leaveRequests.find(l => l.id === leaveId);
      if (req) {
        req.status = status;
        if (status === 'approved') {
          // Check existing attendance for this student on this course and date
          const existingIdx = this.data.attendance.findIndex(
            a => a.studentId === req.studentId && a.courseId === req.courseId && a.date === req.date
          );
          if (existingIdx !== -1) {
            // Only convert absent -> excused, don't overwrite if present
            if (this.data.attendance[existingIdx].status === 'absent') {
              this.data.attendance[existingIdx].status = 'excused';
            }
          } else {
            // If no record exists, create one as excused
            this.data.attendance.push({
              id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              date: req.date,
              courseId: req.courseId,
              studentId: req.studentId,
              status: 'excused'
            });
          }
        }
        this.save();
        this.logAudit(updatedByUser ? updatedByUser.id : 'ADMIN', updatedByUser ? updatedByUser.name : 'Admin', 'FACULTY', 'LEAVE_STATUS', `Leave ${leaveId} marked ${status}`);
        return true;
      }
      return false;
    }

    // --- CLASS CANCELLATION & SUBSTITUTES ---
    markClassCancelled(courseId, date, reason, user) {
      const cancelEntry = {
        id: 'cancel_' + Date.now(),
        courseId: courseId,
        date: date,
        reason: reason,
        markedBy: user ? user.name : 'Staff'
      };
      this.data.cancelledClasses.push(cancelEntry);
      this.save();
      this.logAudit(user ? user.id : 'STAFF', user ? user.name : 'Staff', 'STAFF', 'CLASS_CANCELLED', `Class ${courseId} cancelled on ${date}`);
      return cancelEntry;
    }

    addSubstitute(originalProfId, substituteProfId, courseId, date, notes, user) {
      const subEntry = {
        id: 'sub_' + Date.now(),
        originalProfId,
        substituteProfId,
        courseId,
        date,
        notes: notes || 'Assigned substitute',
        assignedBy: user ? user.name : 'Admin'
      };
      this.data.substitutes.push(subEntry);
      this.save();
      this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'SUBSTITUTE_ASSIGN', `Substitute assigned for course ${courseId} on ${date}`);
      return subEntry;
    }

    // --- ADMIN WRITE & BULK ACTIONS ---
    uploadTimetable(timetableList, user) {
      const snapshot = this.createSnapshot();
      try {
        if (Array.isArray(timetableList)) {
          this.data.timetable = timetableList;
          this.save();
          this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'BULK_TIMETABLE', `Uploaded ${timetableList.length} timetable entries`);
          return true;
        }
        return false;
      } catch (e) {
        this.restoreSnapshot(snapshot);
        return false;
      }
    }

    uploadStudents(studentList, resolutionMode = 'merge', user) {
      const snapshot = this.createSnapshot();
      try {
        if (Array.isArray(studentList)) {
          studentList.forEach(s => {
            const exists = this.data.students.findIndex(x => x.roll === s.roll || x.loginId === s.loginId);
            if (exists !== -1) {
              if (resolutionMode === 'overwrite' || resolutionMode === 'merge') {
                this.data.students[exists] = { ...this.data.students[exists], ...s };
              }
              // If 'skip', do nothing
            } else {
              s.id = s.id || 'std_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
              s.courses = s.courses || ['cs101', 'cs103'];
              this.data.students.push(s);
            }
          });
          this.save();
          this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'BULK_STUDENTS', `Imported ${studentList.length} student records (Mode: ${resolutionMode})`);
          return true;
        }
        return false;
      } catch (e) {
        this.restoreSnapshot(snapshot);
        return false;
      }
    }

    async addOrUpdateStudent(s, user) {
      const isHash = (str) => /^[a-f0-9]{64}$/i.test(str);
      if (s.password && !isHash(s.password)) {
        s.password = await this.hashPassword(s.password);
      }
      if (s.answer && !isHash(s.answer)) {
        s.answer = await this.hashPassword(s.answer.trim().toLowerCase());
      } else if (!s.answer) {
        s.question = s.question || "What is your mother's maiden name?";
        s.answer = await this.hashPassword("smith");
      }

      if (s.id) {
        const idx = this.data.students.findIndex(x => x.id === s.id);
        if (idx !== -1) {
          if (!s.password) s.password = this.data.students[idx].password;
          this.data.students[idx] = { ...this.data.students[idx], ...s };
          
          // Also update linked parent account name/login if student login changes
          const parent = this.data.parents.find(p => p.studentId === s.id);
          if (parent) {
            parent.name = `Parent of ${s.name}`;
            parent.loginId = 'parent_' + s.loginId.replace('student_', '');
          }
        }
      } else {
        s.id = 'std_' + Date.now();
        if (!s.password) s.password = await this.hashPassword('studentpassword');
        this.data.students.push(s);

        // Dynamically create separate parent account linked to this student
        const parentPass = await this.hashPassword('parentpassword');
        const parentAns = await this.hashPassword('smith');
        this.data.parents.push({
          id: 'parent_' + s.id,
          name: `Parent of ${s.name}`,
          studentId: s.id,
          loginId: 'parent_' + s.loginId.replace('student_', ''),
          password: parentPass,
          question: "What is your mother's maiden name?",
          answer: parentAns
        });
      }
      this.save();
      this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'STUDENT_UPDATE', `Saved student ${s.name}`);
    }

    deleteStudent(studentId, user) {
      const s = this.data.students.find(x => x.id === studentId);
      this.data.students = this.data.students.filter(x => x.id !== studentId);
      this.data.attendance = this.data.attendance.filter(x => x.studentId !== studentId);
      this.data.parents = this.data.parents.filter(x => x.studentId !== studentId); // delete parent account as well
      this.save();
      this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'STUDENT_DELETE', `Deleted student ${s ? s.name : studentId}`);
    }

    async addOrUpdateStaff(s, user) {
      const isHash = (str) => /^[a-f0-9]{64}$/i.test(str);
      if (s.password && !isHash(s.password)) {
        s.password = await this.hashPassword(s.password);
      }
      if (s.answer && !isHash(s.answer)) {
        s.answer = await this.hashPassword(s.answer.trim().toLowerCase());
      } else if (!s.answer) {
        s.question = s.question || "What is your mother's maiden name?";
        s.answer = await this.hashPassword("smith");
      }

      if (s.id) {
        const idx = this.data.staff.findIndex(x => x.id === s.id);
        if (idx !== -1) {
          if (!s.password) s.password = this.data.staff[idx].password;
          this.data.staff[idx] = { ...this.data.staff[idx], ...s };
        }
      } else {
        s.id = 'prof_' + Date.now();
        if (!s.password) s.password = await this.hashPassword('staffpassword');
        this.data.staff.push(s);
      }
      this.save();
      this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'STAFF_UPDATE', `Saved faculty ${s.name}`);
    }

    deleteStaff(staffId, user) {
      const st = this.data.staff.find(x => x.id === staffId);
      this.data.staff = this.data.staff.filter(x => x.id !== staffId);
      this.save();
      this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'STAFF_DELETE', `Deleted staff ${st ? st.name : staffId}`);
    }

    // --- QR CODE ATTENDANCE VERIFICATION ---
    markStudentPresentViaQR(studentId, courseId, date, token) {
      const qrTime = parseInt(token);
      if (isNaN(qrTime)) return { success: false, message: "Invalid QR code token." };

      // Time-window check: ±30 minutes (1800000 ms)
      const diffMs = Math.abs(Date.now() - qrTime);
      if (diffMs > 30 * 60 * 1000) {
        return { success: false, message: "QR Code has expired (outside 30-minute window)." };
      }

      // Check if student is enrolled in the course
      const student = this.getStudents().find(s => s.id === studentId);
      if (!student || !student.courses.includes(courseId)) {
        return { success: false, message: "You are not enrolled in this course." };
      }

      // Look for existing attendance record for this student on this course and date
      const existingIdx = this.data.attendance.findIndex(
        a => a.studentId === studentId && a.courseId === courseId && a.date === date
      );

      if (existingIdx !== -1) {
        const currentStatus = this.data.attendance[existingIdx].status;
        if (currentStatus === 'present' || currentStatus === 'excused') {
          return { success: true, message: `Already marked as ${currentStatus}.` };
        }
        // Update status to 'present'
        this.data.attendance[existingIdx].status = 'present';
      } else {
        // Create new record
        this.data.attendance.push({
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          date: date,
          courseId: courseId,
          studentId: studentId,
          status: 'present'
        });
      }

      this.save();
      this.logAudit(studentId, student ? student.name : 'Student', 'STUDENT', 'QR_ATTENDANCE', `Marked present via QR for course ${courseId} on ${date}`);
      return { success: true, message: "Attendance marked present successfully." };
    }

    // --- COURSE MANAGEMENT ---
    addOrUpdateCourse(c, user) {
      if (c.id) {
        const idx = this.data.courses.findIndex(x => x.id === c.id);
        if (idx !== -1) {
          this.data.courses[idx] = { ...this.data.courses[idx], ...c };
        }
      } else {
        c.id = 'course_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        this.data.courses.push(c);
      }
      this.save();
      this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'COURSE_UPDATE', `Saved course ${c.code} (${c.name})`);
    }

    deleteCourse(courseId, user) {
      const c = this.data.courses.find(x => x.id === courseId);
      this.data.courses = this.data.courses.filter(x => x.id !== courseId);
      this.data.students.forEach(s => {
        if (s.courses) s.courses = s.courses.filter(id => id !== courseId);
      });
      this.data.staff.forEach(st => {
        if (st.courses) st.courses = st.courses.filter(id => id !== courseId);
      });
      this.save();
      this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'COURSE_DELETE', `Deleted course ${c ? c.code : courseId}`);
    }

    // --- DEPARTMENT MANAGEMENT ---
    addOrUpdateDepartment(d, user) {
      if (!d.name || !d.code) {
        return { success: false, message: 'Department name and code are required.' };
      }
      
      const cleanCode = d.code.trim().toUpperCase();
      const cleanName = d.name.trim();

      if (d.id) {
        const idx = this.data.departments.findIndex(x => x.id === d.id);
        if (idx !== -1) {
          const dup = this.data.departments.find(x => x.id !== d.id && x.code.toUpperCase() === cleanCode);
          if (dup) return { success: false, message: `Department code '${cleanCode}' is already used by another department.` };
          
          this.data.departments[idx] = { ...this.data.departments[idx], name: cleanName, code: cleanCode };
        }
      } else {
        const cleanId = d.code.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const existingId = this.data.departments.find(x => x.id === cleanId || x.code.toUpperCase() === cleanCode);
        if (existingId) return { success: false, message: `Department code '${cleanCode}' already exists.` };

        const newDept = {
          id: cleanId || ('dept_' + Date.now()),
          name: cleanName,
          code: cleanCode
        };
        this.data.departments.push(newDept);
        d.id = newDept.id;
      }

      this.save();
      this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'DEPT_UPDATE', `Saved department ${cleanCode} (${cleanName})`);
      return { success: true, department: d };
    }

    deleteDepartment(deptId, user) {
      const dept = this.data.departments.find(x => x.id === deptId);
      if (!dept) return { success: false, message: 'Department not found.' };

      const studentCount = this.getStudents().filter(s => s.deptId === deptId).length;
      const staffCount = this.getStaff().filter(st => st.deptId === deptId).length;
      const courseCount = this.getCourses().filter(c => c.deptId === deptId).length;

      if (studentCount > 0 || staffCount > 0 || courseCount > 0) {
        return {
          success: false,
          message: `Cannot delete department '${dept.code}'. It is linked to ${studentCount} student(s), ${staffCount} faculty, and ${courseCount} course(s). Reassign them first.`
        };
      }

      this.data.departments = this.data.departments.filter(x => x.id !== deptId);
      this.save();
      this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'DEPT_DELETE', `Deleted department ${dept.code}`);
      return { success: true };
    }

    // --- TIMETABLE MANAGEMENT ---
    addOrUpdateTimetableSlot(slot, user) {
      if (!slot.day || !slot.time || !slot.classroom || !slot.courseId || !slot.staffId) {
        return { success: false, message: 'Day, Time, Classroom, Course, and Faculty are all required.' };
      }

      const course = this.getCourses().find(c => c.id === slot.courseId);
      if (!course) return { success: false, message: 'Invalid course selected.' };

      const staff = this.getStaff().find(st => st.id === slot.staffId);
      if (!staff) return { success: false, message: 'Invalid faculty selected.' };

      // Allocation check: verify faculty is assigned to course
      if (!Array.isArray(staff.courses) || !staff.courses.includes(slot.courseId)) {
        return { success: false, message: `Faculty '${staff.name}' is not allocated to teach '${course.code} - ${course.name}'.` };
      }

      // Classroom conflict check: same day, time, classroom
      const classroomConflict = (this.data.timetable || []).find(t => 
        t.id !== slot.id &&
        t.day === slot.day &&
        t.time.trim().toLowerCase() === slot.time.trim().toLowerCase() &&
        t.classroom.trim().toLowerCase() === slot.classroom.trim().toLowerCase()
      );
      if (classroomConflict) {
        const confCourse = this.getCourses().find(c => c.id === classroomConflict.courseId);
        return { 
          success: false, 
          message: `Classroom conflict: '${slot.classroom}' is already booked on ${slot.day} (${slot.time}) for ${confCourse ? confCourse.code : 'another lecture'}.` 
        };
      }

      // Faculty time conflict check: same day, time, staffId
      const facultyConflict = (this.data.timetable || []).find(t => 
        t.id !== slot.id &&
        t.day === slot.day &&
        t.time.trim().toLowerCase() === slot.time.trim().toLowerCase() &&
        t.staffId === slot.staffId
      );
      if (facultyConflict) {
        const confCourse = this.getCourses().find(c => c.id === facultyConflict.courseId);
        return { 
          success: false, 
          message: `Faculty conflict: '${staff.name}' is already scheduled to teach on ${slot.day} (${slot.time}) for ${confCourse ? confCourse.code : 'another lecture'}.` 
        };
      }

      if (slot.id) {
        const idx = this.data.timetable.findIndex(x => x.id === slot.id);
        if (idx !== -1) {
          this.data.timetable[idx] = { 
            id: slot.id,
            day: slot.day,
            time: slot.time,
            classroom: slot.classroom,
            courseId: slot.courseId,
            staffId: slot.staffId
          };
        }
      } else {
        slot.id = 'tt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        this.data.timetable.push({
          id: slot.id,
          day: slot.day,
          time: slot.time,
          classroom: slot.classroom,
          courseId: slot.courseId,
          staffId: slot.staffId
        });
      }

      this.save();
      this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'TIMETABLE_UPDATE', `Saved timetable slot for ${course.code} on ${slot.day} (${slot.time}) assigned to ${staff.name}`);
      return { success: true, slot: slot };
    }

    deleteTimetableSlot(slotId, user) {
      const slot = this.data.timetable.find(x => x.id === slotId || (typeof slotId === 'object' && x.id === slotId.id));
      const targetId = slot ? slot.id : (typeof slotId === 'string' ? slotId : slotId.id);
      this.data.timetable = (this.data.timetable || []).filter(x => x.id !== targetId);
      this.save();
      this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'TIMETABLE_DELETE', `Deleted timetable slot ${targetId}`);
      return { success: true };
    }

    // --- STAFF ACTIONS ---
    saveAttendanceSession(courseId, date, records, user) {
      this.data.attendance = this.data.attendance.filter(
        a => !(a.courseId === courseId && a.date === date)
      );

      records.forEach(rec => {
        this.data.attendance.push({
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          date: date,
          courseId: courseId,
          studentId: rec.studentId,
          status: rec.status
        });
      });

      this.save();
      this.logAudit(user ? user.id : 'STAFF', user ? user.name : 'Staff', 'FACULTY', 'ATTENDANCE_SAVE', `Saved attendance roster for course ${courseId} on ${date} (${records.length} students)`);
    }

    // --- DATABASE BACKUP & RESTORE ---
    exportDatabaseJSON() {
      return JSON.stringify(this.data, null, 2);
    }

    importDatabaseJSON(jsonString, user) {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed.departments || !parsed.students || !parsed.staff || !parsed.courses) {
          throw new Error("Invalid database schema structure");
        }
        this.data = parsed;
        this.save();
        this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'DB_RESTORE', 'Full database state restored from backup.');
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    // --- METRIC & STATISTICAL CALCULATORS ---
    getStudentStats(studentId) {
      const student = this.data.students.find(s => s.id === studentId);
      if (!student) return null;

      // Exclude attendance records corresponding to cancelled lectures
      const attRecords = this.data.attendance.filter(a => {
        if (a.studentId !== studentId) return false;
        const isCancelled = (this.data.cancelledClasses || []).some(
          c => c.courseId === a.courseId && c.date === a.date
        );
        return !isCancelled;
      });
      const totalSessions = attRecords.length;

      const present = attRecords.filter(a => a.status === 'present').length;
      const late = attRecords.filter(a => a.status === 'late').length;
      const absent = attRecords.filter(a => a.status === 'absent').length;
      const excused = attRecords.filter(a => a.status === 'excused').length;

      // Late counts as 0.8 attendance credit, absent 0.0, present 1.0, excused 1.0
      const adjustedPresent = present + excused + (late * 0.8);
      const overallPercentage = totalSessions > 0 ? Math.round((adjustedPresent / totalSessions) * 100) : 100;

      // Helper to count remaining occurrences of week days between today and semester end (Nov 30, 2026)
      const getRemainingOccurrences = (dayOfWeekStr, endDateStr) => {
        const daysMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
        const targetDay = daysMap[dayOfWeekStr.toLowerCase()];
        if (targetDay === undefined) return 0;
        
        let count = 0;
        let current = new Date();
        const end = new Date(endDateStr);
        current.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        while (current <= end) {
          if (current.getDay() === targetDay) {
            count++;
          }
          current.setDate(current.getDate() + 1);
        }
        return count;
      };

      const semesterEndDate = "2026-11-30";

      // Map course specific percentages
      const courseStats = student.courses.map(courseId => {
        const course = this.data.courses.find(c => c.id === courseId);
        const courseAtt = attRecords.filter(a => a.courseId === courseId);
        
        const cTotal = courseAtt.length;
        const cPresent = courseAtt.filter(a => a.status === 'present').length;
        const cLate = courseAtt.filter(a => a.status === 'late').length;
        const cAbsent = courseAtt.filter(a => a.status === 'absent').length;
        const cExcused = courseAtt.filter(a => a.status === 'excused').length;
        
        const cAdjusted = cPresent + cExcused + (cLate * 0.8);
        const cPct = cTotal > 0 ? Math.round((cAdjusted / cTotal) * 100) : 100;

        // Calculate dynamic remaining lectures based on weekly timetable
        const courseTimetable = (this.data.timetable || []).filter(t => t.courseId === courseId);
        let remainingClasses = 0;
        courseTimetable.forEach(slot => {
          remainingClasses += getRemainingOccurrences(slot.day, semesterEndDate);
        });

        // Subtract future scheduled classes that are already cancelled
        const futureCancelledCount = (this.data.cancelledClasses || []).filter(c => {
          if (c.courseId !== courseId) return false;
          const cancelDate = new Date(c.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return cancelDate >= today && cancelDate <= new Date(semesterEndDate);
        }).length;
        
        remainingClasses = Math.max(0, remainingClasses - futureCancelledCount);
        const estimatedSemesterTotal = cTotal + remainingClasses;
        const neededFor75 = Math.max(0, Math.ceil(0.75 * estimatedSemesterTotal - cAdjusted));

        return {
          courseId: courseId,
          courseCode: course ? course.code : 'UNKNOWN',
          courseName: course ? course.name : 'Unknown Subject',
          total: cTotal,
          present: cPresent,
          late: cLate,
          absent: cAbsent,
          excused: cExcused,
          percentage: cPct,
          neededFor75: neededFor75,
          remainingClasses: remainingClasses
        };
      });;

      return {
        student,
        totalSessions,
        present,
        late,
        absent,
        excused,
        overallPercentage,
        courseStats
      };
    }
  }

  // Bind to global window scope
  window.CollegeDB = new CollegeCMSDB();

})(window);
