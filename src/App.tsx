import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';

// 管理员端
import AdminCourses from '@/pages/admin/Courses';
import AdminStatistics from '@/pages/admin/Statistics';

// 教师端
import TeacherDashboard from '@/pages/teacher/Dashboard';
import TeacherCourses from '@/pages/teacher/Courses';
import TeacherStudents from '@/pages/teacher/Students';
import TeacherGrades from '@/pages/teacher/Grades';
import TeacherExtra from '@/pages/teacher/Extra';

// 学生端
import StudentDashboard from '@/pages/student/Dashboard';
import StudentCourses from '@/pages/student/Courses';
import StudentSchedule from '@/pages/student/Schedule';
import StudentProgress from '@/pages/student/Progress';
import StudentProfile from '@/pages/student/Profile';
import StudentGrades from '@/pages/student/Grades';
import StudentExtra from '@/pages/student/Extra';
import StudentCourseLearn from '@/pages/student/CourseLearn';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* 管理员端 */}
        <Route element={<Layout />}>
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/statistics" element={<AdminStatistics />} />
          <Route path="/admin" element={<Navigate to="/admin/courses" replace />} />
        </Route>

        {/* 教师端 */}
        <Route element={<Layout />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/courses" element={<TeacherCourses />} />
          <Route path="/teacher/students" element={<TeacherStudents />} />
          <Route path="/teacher/grades" element={<TeacherGrades />} />
          <Route path="/teacher/extra" element={<TeacherExtra />} />
          <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
        </Route>

        {/* 学生端 */}
        <Route element={<Layout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/courses" element={<StudentCourses />} />
          <Route path="/student/schedule" element={<StudentSchedule />} />
          <Route path="/student/progress" element={<StudentProgress />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/grades" element={<StudentGrades />} />
          <Route path="/student/extra" element={<StudentExtra />} />
          <Route path="/student/courses/:id" element={<StudentCourseLearn />} />
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}