-- ============================================================
-- ANNAMALAI UNIVERSITY COLLEGE ATTENDANCE MANAGEMENT SYSTEM
-- SUPABASE POSTGRESQL DATABASE SCHEMA & INITIAL SEED DATA
-- ============================================================

-- 1. DROP EXISTING TABLES IF EXISTS (CLEAN SLATE)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS timetable CASCADE;
DROP TABLE IF EXISTS parent_students CASCADE;
DROP TABLE IF EXISTS staff_courses CASCADE;
DROP TABLE IF EXISTS student_courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- 2. DEPARTMENTS TABLE
CREATE TABLE departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE
);

-- 3. COURSES (SUBJECTS) TABLE
CREATE TABLE courses (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    dept_id VARCHAR(50) REFERENCES departments(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'Lecture' CHECK (type IN ('Lecture', 'Practical', 'Lab', 'Tutorial'))
);

-- 4. USERS TABLE (ADMIN, STAFF, STUDENTS, PARENTS)
CREATE TABLE users (
    id VARCHAR(100) PRIMARY KEY,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff', 'student', 'parent')),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    roll VARCHAR(100),
    dept_id VARCHAR(50) REFERENCES departments(id) ON DELETE SET NULL,
    login_id VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    question VARCHAR(255) DEFAULT 'What is your mother''s maiden name?',
    answer_hash VARCHAR(255)
);

-- 5. JUNCTION TABLE: STUDENT ↔ COURSES (ENROLLMENT)
CREATE TABLE student_courses (
    student_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    course_id VARCHAR(50) REFERENCES courses(id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, course_id)
);

-- 6. JUNCTION TABLE: STAFF ↔ COURSES (FACULTY ALLOCATION)
CREATE TABLE staff_courses (
    staff_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    course_id VARCHAR(50) REFERENCES courses(id) ON DELETE CASCADE,
    PRIMARY KEY (staff_id, course_id)
);

-- 7. JUNCTION TABLE: PARENT ↔ STUDENTS (MULTI-CHILD LINKING)
CREATE TABLE parent_students (
    parent_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (parent_id, student_id)
);

-- 8. TIMETABLE TABLE
CREATE TABLE timetable (
    id VARCHAR(100) PRIMARY KEY,
    day VARCHAR(50) NOT NULL,
    time VARCHAR(100) NOT NULL,
    course_id VARCHAR(50) REFERENCES courses(id) ON DELETE CASCADE,
    classroom VARCHAR(100) NOT NULL,
    staff_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. ATTENDANCE TABLE
CREATE TABLE attendance (
    id VARCHAR(100) PRIMARY KEY,
    date VARCHAR(20) NOT NULL,
    course_id VARCHAR(50) REFERENCES courses(id) ON DELETE CASCADE,
    student_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused'))
);

-- 10. LEAVE REQUESTS TABLE
CREATE TABLE leave_requests (
    id VARCHAR(100) PRIMARY KEY,
    student_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    course_id VARCHAR(50) REFERENCES courses(id) ON DELETE CASCADE,
    date VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at VARCHAR(50) NOT NULL
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    timestamp VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT
);

-- 12. SYSTEM SETTINGS TABLE
CREATE TABLE settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable public read/write access for application operations
-- ============================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write for departments" ON departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for courses" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for student_courses" ON student_courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for staff_courses" ON staff_courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for parent_students" ON parent_students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for timetable" ON timetable FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for leave_requests" ON leave_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- INITIAL SEED DATA
-- Pre-populated academic records with SHA-256 hashed credentials
-- ============================================================

-- DEPARTMENTS SEED
INSERT INTO departments (id, name, code) VALUES
('cse', 'Computer Science & Engineering', 'CSE'),
('it', 'Information Technology', 'IT'),
('ece', 'Electronics & Communication', 'ECE');

-- COURSES SEED
INSERT INTO courses (id, name, code, dept_id, type) VALUES
('cs101', 'Data Structures & Algorithms', 'CS-101', 'cse', 'Lecture'),
('cs101p', 'Data Structures & Algorithms Lab', 'CS-101-P', 'cse', 'Practical'),
('cs102', 'Database Management Systems', 'CS-102', 'cse', 'Lecture'),
('cs103', 'Advanced Web Development', 'CS-103', 'cse', 'Lecture'),
('it101', 'Information Security', 'IT-101', 'it', 'Lecture'),
('ec101', 'Digital Logic Circuits', 'EC-101', 'ece', 'Lecture');

-- USERS SEED (ADMIN, STAFF, STUDENTS, PARENTS)
-- Passwords:
-- adminpassword  -> 749f09bade8aca755660eeb17792da880218d4fbdc4e25fbec279d7fe9f65d70
-- staffpassword  -> 7204d2b277a11cb0d2418baf7dc0554c46bca2285892222aa989e82e1637d4ed
-- studentpassword-> 68eaeeaef51a40035b5d3705c4e0ffd68036b6b821361765145f410b0f996e11
-- parentpassword -> d2a78bcdcfa6c0e4dad347d7011fab84a24405ca74932e4368541c084b34b056
-- security answer 'smith' -> f454e600fa3be15c2ec44e05bbef0fb835e0ecfa4eb77ae0f1712a4eeae587ff

INSERT INTO users (id, role, name, email, roll, dept_id, login_id, password_hash, question, answer_hash) VALUES
('admin101', 'admin', 'Registrar (Admin Office)', 'admin@annamalai.edu', NULL, 'cse', 'admin101', '749f09bade8aca755660eeb17792da880218d4fbdc4e25fbec279d7fe9f65d70', 'What is your mother''s maiden name?', 'f454e600fa3be15c2ec44e05bbef0fb835e0ecfa4eb77ae0f1712a4eeae587ff'),

('prof1', 'staff', 'Dr. Alan Turing', 'a.turing@annamalai.edu', NULL, 'cse', 'staff_alan', '7204d2b277a11cb0d2418baf7dc0554c46bca2285892222aa989e82e1637d4ed', 'What is your mother''s maiden name?', 'f454e600fa3be15c2ec44e05bbef0fb835e0ecfa4eb77ae0f1712a4eeae587ff'),
('prof2', 'staff', 'Prof. Grace Hopper', 'g.hopper@annamalai.edu', NULL, 'cse', 'staff_grace', '7204d2b277a11cb0d2418baf7dc0554c46bca2285892222aa989e82e1637d4ed', 'What is your mother''s maiden name?', 'f454e600fa3be15c2ec44e05bbef0fb835e0ecfa4eb77ae0f1712a4eeae587ff'),
('prof3', 'staff', 'Dr. Edgar Codd', 'e.codd@annamalai.edu', NULL, 'it', 'staff_codd', '7204d2b277a11cb0d2418baf7dc0554c46bca2285892222aa989e82e1637d4ed', 'What is your mother''s maiden name?', 'f454e600fa3be15c2ec44e05bbef0fb835e0ecfa4eb77ae0f1712a4eeae587ff'),
('prof4', 'staff', 'Prof. Claude Shannon', 'c.shannon@annamalai.edu', NULL, 'ece', 'staff_shannon', '7204d2b277a11cb0d2418baf7dc0554c46bca2285892222aa989e82e1637d4ed', 'What is your mother''s maiden name?', 'f454e600fa3be15c2ec44e05bbef0fb835e0ecfa4eb77ae0f1712a4eeae587ff'),

('std1', 'student', 'Alice Smith', 'alice.s@annamalai.edu', 'CSE-2026-01', 'cse', 'student_alice', '68eaeeaef51a40035b5d3705c4e0ffd68036b6b821361765145f410b0f996e11', 'What is your mother''s maiden name?', 'f454e600fa3be15c2ec44e05bbef0fb835e0ecfa4eb77ae0f1712a4eeae587ff'),
('std2', 'student', 'Bob Johnson', 'bob.j@annamalai.edu', 'CSE-2026-02', 'cse', 'student_bob', '68eaeeaef51a40035b5d3705c4e0ffd68036b6b821361765145f410b0f996e11', 'What is your mother''s maiden name?', 'f454e600fa3be15c2ec44e05bbef0fb835e0ecfa4eb77ae0f1712a4eeae587ff'),
('std3', 'student', 'Charlie Brown', 'charlie.b@annamalai.edu', 'CSE-2026-03', 'cse', 'student_charlie', '68eaeeaef51a40035b5d3705c4e0ffd68036b6b821361765145f410b0f996e11', 'What is your mother''s maiden name?', 'f454e600fa3be15c2ec44e05bbef0fb835e0ecfa4eb77ae0f1712a4eeae587ff'),
('std4', 'student', 'Diana Prince', 'diana.p@annamalai.edu', 'CSE-2026-04', 'cse', 'student_diana', '68eaeeaef51a40035b5d3705c4e0ffd68036b6b821361765145f410b0f996e11', 'What is your mother''s maiden name?', 'f454e600fa3be15c2ec44e05bbef0fb835e0ecfa4eb77ae0f1712a4eeae587ff'),
('std5', 'student', 'Evan Wright', 'evan.w@annamalai.edu', 'CSE-2026-05', 'cse', 'student_evan', '68eaeeaef51a40035b5d3705c4e0ffd68036b6b821361765145f410b0f996e11', 'What is your mother''s maiden name?', 'f454e600fa3be15c2ec44e05bbef0fb835e0ecfa4eb77ae0f1712a4eeae587ff'),

('parent1', 'parent', 'Robert Smith', 'r.smith@gmail.com', NULL, NULL, 'parent_alice', 'd2a78bcdcfa6c0e4dad347d7011fab84a24405ca74932e4368541c084b34b056', 'What is your mother''s maiden name?', 'f454e600fa3be15c2ec44e05bbef0fb835e0ecfa4eb77ae0f1712a4eeae587ff'),
('parent2', 'parent', 'Mary Johnson', 'm.johnson@gmail.com', NULL, NULL, 'parent_bob', 'd2a78bcdcfa6c0e4dad347d7011fab84a24405ca74932e4368541c084b34b056', 'What is your mother''s maiden name?', 'f454e600fa3be15c2ec44e05bbef0fb835e0ecfa4eb77ae0f1712a4eeae587ff'),
('parent3', 'parent', 'Thomas Prince', 't.prince@gmail.com', NULL, NULL, 'parent_diana', 'd2a78bcdcfa6c0e4dad347d7011fab84a24405ca74932e4368541c084b34b056', 'What is your mother''s maiden name?', 'f454e600fa3be15c2ec44e05bbef0fb835e0ecfa4eb77ae0f1712a4eeae587ff'),
('parent4', 'parent', 'Arthur Wright', 'a.wright@gmail.com', NULL, NULL, 'parent_evan', 'd2a78bcdcfa6c0e4dad347d7011fab84a24405ca74932e4368541c084b34b056', 'What is your mother''s maiden name?', 'f454e600fa3be15c2ec44e05bbef0fb835e0ecfa4eb77ae0f1712a4eeae587ff');

-- STAFF COURSES SEED
INSERT INTO staff_courses (staff_id, course_id) VALUES
('prof1', 'cs101'),
('prof1', 'cs101p'),
('prof1', 'cs102'),
('prof2', 'cs103'),
('prof3', 'it101'),
('prof4', 'ec101');

-- STUDENT COURSES SEED
INSERT INTO student_courses (student_id, course_id) VALUES
('std1', 'cs101'), ('std1', 'cs101p'), ('std1', 'cs102'), ('std1', 'cs103'),
('std2', 'cs101'), ('std2', 'cs101p'), ('std2', 'cs103'),
('std3', 'cs101'), ('std3', 'cs102'),
('std4', 'cs102'), ('std4', 'cs103'),
('std5', 'cs101'), ('std5', 'cs101p'), ('std5', 'cs102'), ('std5', 'cs103');

-- PARENT STUDENTS SEED
INSERT INTO parent_students (parent_id, student_id) VALUES
('parent1', 'std1'),
('parent2', 'std2'),
('parent2', 'std3'),
('parent3', 'std4'),
('parent4', 'std5');

-- TIMETABLE SEED
INSERT INTO timetable (id, day, time, course_id, classroom, staff_id) VALUES
('tt1', 'Monday', '09:00 AM - 10:30 AM', 'cs101', 'Lecture Hall 101', 'prof1'),
('tt2', 'Monday', '11:00 AM - 12:30 PM', 'cs103', 'Computer Lab 3', 'prof2'),
('tt3', 'Tuesday', '09:00 AM - 10:30 AM', 'cs102', 'Lecture Hall 204', 'prof1'),
('tt4', 'Tuesday', '11:00 AM - 12:30 PM', 'it101', 'Lecture Hall 102', 'prof3'),
('tt5', 'Wednesday', '09:00 AM - 10:30 AM', 'ec101', 'ECE Lab A', 'prof4'),
('tt6', 'Wednesday', '11:00 AM - 12:30 PM', 'cs101', 'Lecture Hall 101', 'prof1'),
('tt7', 'Thursday', '09:00 AM - 10:30 AM', 'cs103', 'Computer Lab 3', 'prof2'),
('tt8', 'Thursday', '11:00 AM - 12:30 PM', 'cs102', 'Lecture Hall 204', 'prof1'),
('tt9', 'Friday', '09:00 AM - 10:30 AM', 'cs101p', 'CS Hardware Lab', 'prof1'),
('tt10', 'Friday', '11:00 AM - 12:30 PM', 'it101', 'Lecture Hall 102', 'prof3');

-- LEAVE REQUESTS SEED
INSERT INTO leave_requests (id, student_id, course_id, date, reason, status, submitted_at) VALUES
('leave1', 'std1', 'cs101', '2026-07-30', 'Medical appointment', 'approved', '2026-07-29'),
('leave2', 'std2', 'cs103', '2026-08-01', 'Family event', 'pending', '2026-07-31');

-- AUDIT LOGS SEED
INSERT INTO audit_logs (id, timestamp, user_id, user_name, role, action, details) VALUES
('log_1', '2026-08-01T10:00:00.000Z', 'admin101', 'Registrar (Admin Office)', 'ADMIN', 'SYSTEM_INIT', 'Supabase PostgreSQL database schema initialized with default academic records.');

-- SETTINGS SEED
INSERT INTO settings (key, value) VALUES
('minAttendancePct', '75');
