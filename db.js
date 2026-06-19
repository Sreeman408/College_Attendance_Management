// db.js - Mock Database engine for Annamalai University College Management System

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
    settings: {
      minAttendancePct: 75
    }
  };

  // Pre-populate mock historical attendance records for the last 6 weekdays
  // This provides data for visual metrics out of the box
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

  class CollegeCMSDB {
    constructor() {
      this.load();
    }

    load() {
      const stored = localStorage.getItem(DB_KEY);
      if (stored) {
        try {
          this.data = JSON.parse(stored);
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

    // --- GETTERS ---
    getDepartments() { return this.data.departments; }
    getCourses() { return this.data.courses; }
    getAdmin() { return this.data.admin; }
    getStaff() { return this.data.staff; }
    getStudents() { return this.data.students; }
    getTimetable() { return this.data.timetable; }
    getAttendance() { return this.data.attendance; }
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
      }
      return null;
    }

    // --- ADMIN ACTIONS ---
    
    // 1. Timetable upload
    uploadTimetable(timetableList) {
      // Expects array of { day, time, courseCode, courseName, classroom, professor }
      if (Array.isArray(timetableList)) {
        this.data.timetable = timetableList;
        this.save();
        return true;
      }
      return false;
    }

    // 2. Student Data Upload & Management
    uploadStudents(studentList) {
      // Bulk adds students. Resolves duplicates by loginId / roll
      if (Array.isArray(studentList)) {
        studentList.forEach(s => {
          const exists = this.data.students.findIndex(x => x.roll === s.roll || x.loginId === s.loginId);
          if (exists !== -1) {
            this.data.students[exists] = { ...this.data.students[exists], ...s };
          } else {
            s.id = s.id || 'std_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            s.courses = s.courses || ['cs101', 'cs103']; // default
            this.data.students.push(s);
          }
        });
        this.save();
        return true;
      }
      return false;
    }

    addOrUpdateStudent(s) {
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
    }

    deleteStudent(studentId) {
      this.data.students = this.data.students.filter(x => x.id !== studentId);
      // Clean student attendance logs
      this.data.attendance = this.data.attendance.filter(x => x.studentId !== studentId);
      this.save();
    }

    // 3. Staff Data Upload & Management
    uploadStaff(staffList) {
      if (Array.isArray(staffList)) {
        staffList.forEach(s => {
          const exists = this.data.staff.findIndex(x => x.loginId === s.loginId);
          if (exists !== -1) {
            this.data.staff[exists] = { ...this.data.staff[exists], ...s };
          } else {
            s.id = s.id || 'prof_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            s.courses = s.courses || [];
            this.data.staff.push(s);
          }
        });
        this.save();
        return true;
      }
      return false;
    }

    addOrUpdateStaff(s) {
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
    }

    deleteStaff(staffId) {
      this.data.staff = this.data.staff.filter(x => x.id !== staffId);
      this.save();
    }

    // --- STAFF ACTIONS ---
    
    // Save or Edit Student Attendance records
    saveAttendanceSession(courseId, date, records) {
      // records: array of { studentId, status }
      // Remove any existing attendance entries for this subject + date
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
    }

    // --- METRIC CALCULATORS ---
    
    // Overall and Course-specific calculations for a specific student
    getStudentStats(studentId) {
      const student = this.data.students.find(s => s.id === studentId);
      if (!student) return null;

      const attRecords = this.data.attendance.filter(a => a.studentId === studentId);
      const totalSessions = attRecords.length;

      const present = attRecords.filter(a => a.status === 'present').length;
      const late = attRecords.filter(a => a.status === 'late').length;
      const absent = attRecords.filter(a => a.status === 'absent').length;

      // Late counts as 0.8 attendance credit, absent 0.0, present 1.0
      const adjustedPresent = present + (late * 0.8);
      const overallPercentage = totalSessions > 0 ? Math.round((adjustedPresent / totalSessions) * 100) : 100;

      // Map course specific percentages
      const courseStats = student.courses.map(courseId => {
        const course = this.data.courses.find(c => c.id === courseId);
        const courseAtt = attRecords.filter(a => a.courseId === courseId);
        
        const cTotal = courseAtt.length;
        const cPresent = courseAtt.filter(a => a.status === 'present').length;
        const cLate = courseAtt.filter(a => a.status === 'late').length;
        const cAbsent = courseAtt.filter(a => a.status === 'absent').length;
        
        const cAdjusted = cPresent + (cLate * 0.8);
        const cPct = cTotal > 0 ? Math.round((cAdjusted / cTotal) * 100) : 100;

        return {
          courseId: courseId,
          courseCode: course ? course.code : 'UNKNOWN',
          courseName: course ? course.name : 'Unknown Subject',
          total: cTotal,
          present: cPresent,
          late: cLate,
          absent: cAbsent,
          percentage: cPct
        };
      });

      return {
        student,
        totalSessions,
        present,
        late,
        absent,
        overallPercentage,
        courseStats
      };
    }
  }

  // Bind to global window scope
  window.CollegeDB = new CollegeCMSDB();

})(window);
