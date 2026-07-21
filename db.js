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
      { day: 'Monday', time: '09:00 AM - 10:30 AM', courseCode: 'CS-101', courseName: 'Data Structures & Algorithms', classroom: 'Lecture Hall 101', professor: 'Dr. Alan Turing' },
      { day: 'Monday', time: '11:00 AM - 12:30 PM', courseCode: 'CS-103', courseName: 'Advanced Web Development', classroom: 'Computer Lab 3', professor: 'Prof. Grace Hopper' },
      { day: 'Tuesday', time: '09:00 AM - 10:30 AM', courseCode: 'CS-102', courseName: 'Database Management Systems', classroom: 'Lecture Hall 204', professor: 'Dr. Alan Turing' },
      { day: 'Tuesday', time: '11:00 AM - 12:30 PM', courseCode: 'IT-101', courseName: 'Information Security', classroom: 'Lecture Hall 102', professor: 'Dr. Edgar Codd' },
      { day: 'Wednesday', time: '09:00 AM - 10:30 AM', courseCode: 'EC-101', courseName: 'Digital Logic Circuits', classroom: 'ECE Lab A', professor: 'Prof. Claude Shannon' },
      { day: 'Wednesday', time: '11:00 AM - 12:30 PM', courseCode: 'CS-101', courseName: 'Data Structures & Algorithms', classroom: 'Lecture Hall 101', professor: 'Dr. Alan Turing' },
      { day: 'Thursday', time: '09:00 AM - 10:30 AM', courseCode: 'CS-103', courseName: 'Advanced Web Development', classroom: 'Computer Lab 3', professor: 'Prof. Grace Hopper' },
      { day: 'Thursday', time: '11:00 AM - 12:30 PM', courseCode: 'CS-102', courseName: 'Database Management Systems', classroom: 'Lecture Hall 204', professor: 'Dr. Alan Turing' },
      { day: 'Friday', time: '09:00 AM - 10:30 AM', courseCode: 'EC-101', courseName: 'Digital Logic Circuits', classroom: 'ECE Lab A', professor: 'Prof. Claude Shannon' },
      { day: 'Friday', time: '11:00 AM - 12:30 PM', courseCode: 'IT-101', courseName: 'Information Security', classroom: 'Lecture Hall 102', professor: 'Dr. Edgar Codd' }
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
      if (!record.courseCode || typeof record.courseCode !== 'string') errors.push("Missing Course Code");
      if (!record.courseName || typeof record.courseName !== 'string') errors.push("Missing Course Name");
      if (!record.classroom || typeof record.classroom !== 'string') errors.push("Missing Classroom");
      if (!record.professor || typeof record.professor !== 'string') errors.push("Missing Professor");

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
    getTimetable() { return this.data.timetable; }
    getAttendance() { return this.data.attendance; }
    getLeaveRequests() { return this.data.leaveRequests || []; }
    getSubstitutes() { return this.data.substitutes || []; }
    getCancelledClasses() { return this.data.cancelledClasses || []; }
    getSettings() { return this.data.settings; }

    // --- AUTHENTICATION ---
    authenticate(loginId, password, category) {
      if (category === 'admin') {
        const ad = this.getAdmin();
        if (ad.loginId === loginId && ad.password === password) {
          return { role: 'admin', user: ad };
        }
      } else if (category === 'staff') {
        const prof = this.getStaff().find(s => s.loginId === loginId && s.password === password);
        if (prof) {
          return { role: 'staff', user: prof };
        }
      } else if (category === 'student') {
        const student = this.getStudents().find(s => s.loginId === loginId && s.password === password);
        if (student) {
          return { role: 'student', user: student };
        }
      } else if (category === 'parent') {
        return this.authenticateParent(loginId, password);
      }
      return null;
    }

    authenticateParent(loginId, password) {
      // Allow parent login via parent_<roll> or parent_<loginId> or parent_alice
      const cleanId = loginId.replace(/^parent_/i, '').trim().toLowerCase();
      const student = this.getStudents().find(s => 
        s.roll.toLowerCase() === cleanId || 
        s.loginId.toLowerCase() === cleanId || 
        s.name.toLowerCase().includes(cleanId)
      );

      if (student && (student.password === password || password === 'parentpassword')) {
        return {
          role: 'parent',
          user: {
            id: 'parent_' + student.id,
            name: `Parent of ${student.name}`,
            email: `guardian.${student.email}`,
            wardStudentId: student.id,
            ward: student
          }
        };
      }
      return null;
    }

    resetPassword(category, loginId, newPassword) {
      if (category === 'student') {
        const s = this.data.students.find(x => x.loginId === loginId || x.email === loginId);
        if (s) {
          s.password = newPassword;
          this.save();
          this.logAudit(s.id, s.name, 'STUDENT', 'PASSWORD_RESET', 'Password reset performed.');
          return true;
        }
      } else if (category === 'staff') {
        const prof = this.data.staff.find(x => x.loginId === loginId || x.email === loginId);
        if (prof) {
          prof.password = newPassword;
          this.save();
          this.logAudit(prof.id, prof.name, 'STAFF', 'PASSWORD_RESET', 'Faculty password reset performed.');
          return true;
        }
      } else if (category === 'admin') {
        if (this.data.admin.loginId === loginId) {
          this.data.admin.password = newPassword;
          this.save();
          this.logAudit(this.data.admin.loginId, this.data.admin.name, 'ADMIN', 'PASSWORD_RESET', 'Admin password reset performed.');
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
        // If approved, add excused attendance record
        if (status === 'approved') {
          this.saveAttendanceSession(req.courseId, req.date, [{ studentId: req.studentId, status: 'excused' }]);
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

    addOrUpdateStudent(s, user) {
      if (s.id) {
        const idx = this.data.students.findIndex(x => x.id === s.id);
        if (idx !== -1) {
          this.data.students[idx] = { ...this.data.students[idx], ...s };
        }
      } else {
        s.id = 'std_' + Date.now();
        this.data.students.push(s);
      }
      this.save();
      this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'STUDENT_UPDATE', `Saved student ${s.name}`);
    }

    deleteStudent(studentId, user) {
      const s = this.data.students.find(x => x.id === studentId);
      this.data.students = this.data.students.filter(x => x.id !== studentId);
      this.data.attendance = this.data.attendance.filter(x => x.studentId !== studentId);
      this.save();
      this.logAudit(user ? user.id : 'ADMIN', user ? user.name : 'Admin', 'ADMIN', 'STUDENT_DELETE', `Deleted student ${s ? s.name : studentId}`);
    }

    addOrUpdateStaff(s, user) {
      if (s.id) {
        const idx = this.data.staff.findIndex(x => x.id === s.id);
        if (idx !== -1) {
          this.data.staff[idx] = { ...this.data.staff[idx], ...s };
        }
      } else {
        s.id = 'prof_' + Date.now();
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

      const attRecords = this.data.attendance.filter(a => a.studentId === studentId);
      const totalSessions = attRecords.length;

      const present = attRecords.filter(a => a.status === 'present').length;
      const late = attRecords.filter(a => a.status === 'late').length;
      const absent = attRecords.filter(a => a.status === 'absent').length;
      const excused = attRecords.filter(a => a.status === 'excused').length;

      // Late counts as 0.8 attendance credit, absent 0.0, present 1.0, excused 1.0
      const adjustedPresent = present + excused + (late * 0.8);
      const overallPercentage = totalSessions > 0 ? Math.round((adjustedPresent / totalSessions) * 100) : 100;

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

        // Attendance Prediction & Shortage Forecasting
        // Assume semester has ~20 total classes per subject.
        const estimatedSemesterTotal = Math.max(cTotal, 20);
        const remainingClasses = estimatedSemesterTotal - cTotal;
        // Classes needed to maintain 75%
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
      });

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
