import { useStore } from '@/store';
import StatCard from '@/components/StatCard';
import { BookOpen, Users, ClipboardCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  const courses = useStore((s) => s.courses);
  const enrollments = useStore((s) => s.enrollments);
  const currentUser = useStore((s) => s.currentUser);

  const myCourses = courses.filter((c) => c.teacher === currentUser);
  const myCourseIds = myCourses.map((c) => c.id);
  const myStudents = enrollments.filter((e) => myCourseIds.includes(e.courseId));
  const pendingGrades = myStudents.filter((e) => e.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">教师仪表盘</h1>
        <p className="text-gray-500 mt-1">欢迎回来，{currentUser}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={BookOpen} label="授课课程" value={myCourses.length} color="bg-emerald-500" />
        <StatCard icon={Users} label="学员总数" value={myStudents.length} color="bg-blue-500" />
        <StatCard icon={ClipboardCheck} label="待批改" value={pendingGrades} color="bg-amber-500" />
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">我的课程</h3>
          <Link to="/teacher/courses" className="text-sm text-emerald-500 hover:text-emerald-600 flex items-center gap-1">
            查看全部 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {myCourses.map((course) => (
            <div key={course.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <img src={course.cover} alt={course.title} className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{course.title}</p>
                <p className="text-sm text-gray-500">{course.duration}课时 · ¥{course.price}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${course.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}>
                {course.status === 'active' ? '授课中' : '已结束'}
              </span>
            </div>
          ))}
          {myCourses.length === 0 && <p className="text-gray-400 text-center py-4">暂无授课课程</p>}
        </div>
      </div>
    </div>
  );
}