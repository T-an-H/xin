import { useState } from 'react';
import { useStore } from '@/store';
import { Search, ChevronDown } from 'lucide-react';

export default function TeacherStudents() {
  const { courses, students, enrollments, currentUser, updateEnrollment } = useStore();
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [search, setSearch] = useState('');

  const myCourses = courses.filter((c) => c.teacher === currentUser);
  const myCourseIds = myCourses.map((c) => c.id);

  const filteredEnrollments = enrollments.filter((e) => {
    const matchCourse = selectedCourse === 'all' || e.courseId === selectedCourse;
    const matchTeacher = myCourseIds.includes(e.courseId);
    return matchCourse && matchTeacher;
  });

  const displayEnrollments = filteredEnrollments.filter((e) => {
    const student = students.find((s) => s.id === e.studentId);
    return !search || student?.name.includes(search);
  });

  const getCourseTitle = (id: string) => courses.find((c) => c.id === id)?.title || '未知';
  const getStudentName = (id: string) => students.find((s) => s.id === id)?.name || '未知';

  const handleProgressUpdate = (enrollmentId: string, progress: number) => {
    const newProgress = Math.min(100, Math.max(0, progress));
    updateEnrollment(enrollmentId, { progress: newProgress });
  };

  const statusLabels: Record<string, string> = {
    enrolled: '已报名', in_progress: '学习中', completed: '已完成', dropped: '已退课',
  };
  const statusColors: Record<string, string> = {
    enrolled: 'bg-blue-50 text-blue-600', in_progress: 'bg-amber-50 text-amber-600',
    completed: 'bg-emerald-50 text-emerald-600', dropped: 'bg-red-50 text-red-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">学员进度</h1>
        <p className="text-gray-500 mt-1">查看和管理学员学习进度</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="搜索学员..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm" />
        </div>
        <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm bg-white">
          <option value="all">全部课程</option>
          {myCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">学员</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">课程</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">状态</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">学习进度</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayEnrollments.map((enr) => (
                <tr key={enr.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-emerald-600">{getStudentName(enr.studentId).charAt(0)}</span>
                      </div>
                      <span className="font-medium text-gray-900">{getStudentName(enr.studentId)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{getCourseTitle(enr.courseId)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[enr.status]}`}>
                      {statusLabels[enr.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[120px]">
                        <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${enr.progress}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-10">{enr.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleProgressUpdate(enr.id, enr.progress - 10)}
                        className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors">-10</button>
                      <button onClick={() => handleProgressUpdate(enr.id, enr.progress + 10)}
                        className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors">+10</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {displayEnrollments.length === 0 && (
          <div className="text-center py-8 text-gray-400">暂无数据</div>
        )}
      </div>
    </div>
  );
}