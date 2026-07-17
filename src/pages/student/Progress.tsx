import { useStore } from '@/store';
import { Award } from 'lucide-react';

export default function StudentProgress() {
  const { students, enrollments, courses, grades, currentUser } = useStore();
  const student = students.find((s) => s.name === currentUser);
  const myEnrollments = student ? enrollments.filter((e) => e.studentId === student.id) : [];

  const statusLabels: Record<string, string> = { enrolled: '已报名', in_progress: '学习中', completed: '已完成', dropped: '已退课' };
  const progressColors = ['bg-red-400', 'bg-amber-400', 'bg-emerald-400'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">学习进度</h1>
        <p className="text-gray-500 mt-1">查看各课程的学习进度与成绩</p>
      </div>

      <div className="space-y-4">
        {myEnrollments.map((enr) => {
          const course = courses.find((c) => c.id === enr.courseId);
          const grade = grades.find((g) => g.studentId === student?.id && g.courseId === enr.courseId);
          if (!course) return null;
          return (
            <div key={enr.id} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{course.teacher} · {course.duration}课时</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  enr.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                  enr.status === 'in_progress' ? 'bg-amber-50 text-amber-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {statusLabels[enr.status]}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${progressColors[Math.min(Math.floor(enr.progress / 35), 2)]}`}
                    style={{ width: `${enr.progress}%` }} />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-12 text-right">{enr.progress}%</span>
              </div>

              {grade && (
                <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg">
                  <Award className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="font-semibold text-gray-900">成绩：<span className="text-amber-600 text-lg">{grade.score}</span> 分</p>
                    {grade.comment && <p className="text-sm text-gray-500 mt-0.5">评语：{grade.comment}</p>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {myEnrollments.length === 0 && (
          <div className="text-center py-16 text-gray-400">暂未报名课程</div>
        )}
      </div>
    </div>
  );
}