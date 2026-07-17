import { useParams, Link } from 'react-router-dom';
import { useStore } from '@/store';
import { ArrowLeft, Mail, Phone, Calendar, BookOpen, Award } from 'lucide-react';

export default function StudentDetail() {
  const { id } = useParams();
  const { students, enrollments, courses } = useStore();

  const student = students.find((s) => s.id === id);
  if (!student) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">学员不存在</p>
        <Link to="/students" className="text-amber-500 hover:text-amber-600 mt-4 inline-block">返回学员列表</Link>
      </div>
    );
  }

  const studentEnrollments = enrollments.filter((e) => e.studentId === student.id);
  const completedCount = studentEnrollments.filter((e) => e.status === 'completed').length;
  const inProgressCount = studentEnrollments.filter((e) => e.status === 'in_progress').length;

  const getCourseTitle = (courseId: string) => courses.find((c) => c.id === courseId)?.title || '未知课程';
  const getCourseCover = (courseId: string) => courses.find((c) => c.id === courseId)?.cover || '';

  const statusLabels: Record<string, { label: string; color: string }> = {
    enrolled: { label: '已报名', color: 'bg-blue-50 text-blue-600' },
    in_progress: { label: '学习中', color: 'bg-amber-50 text-amber-600' },
    completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-600' },
    dropped: { label: '已退课', color: 'bg-red-50 text-red-600' },
  };

  const progressColors = ['bg-red-400', 'bg-amber-400', 'bg-emerald-400'];

  return (
    <div className="space-y-6">
      <Link to="/students" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-amber-500 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回学员列表
      </Link>

      {/* 学员基本信息 */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-start gap-6">
          <img src={student.avatar} alt={student.name} className="w-20 h-20 rounded-full bg-gray-100" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${student.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}>
                {student.status === 'active' ? '在读' : '已结业'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mt-3">
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {student.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {student.phone}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> 加入于 {student.joinDate}</span>
            </div>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{studentEnrollments.length}</p>
              <p className="text-xs text-gray-500 mt-1">总报名</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
              <p className="text-xs text-gray-500 mt-1">已完成</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{inProgressCount}</p>
              <p className="text-xs text-gray-500 mt-1">学习中</p>
            </div>
          </div>
        </div>
      </div>

      {/* 课程列表 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" /> 已报名课程
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {studentEnrollments.length === 0 ? (
            <div className="p-6 text-center text-gray-400">暂无报名课程</div>
          ) : (
            studentEnrollments.map((enr) => {
              const course = courses.find((c) => c.id === enr.courseId);
              return (
                <div key={enr.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <img src={getCourseCover(enr.courseId)} alt={getCourseTitle(enr.courseId)} className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{getCourseTitle(enr.courseId)}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusLabels[enr.status].color}`}>
                          {statusLabels[enr.status].label}
                        </span>
                        <span className="text-xs text-gray-400">报名于 {enr.enrollDate}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${progressColors[Math.min(Math.floor(enr.progress / 35), 2)]}`}
                            style={{ width: `${enr.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600 w-10 text-right">{enr.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}