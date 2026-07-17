import { useState } from 'react';
import { useStore } from '@/store';
import { Save } from 'lucide-react';

export default function TeacherGrades() {
  const { courses, students, enrollments, grades, currentUser, addGrade, updateGrade } = useStore();
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const myCourses = courses.filter((c) => c.teacher === currentUser);
  const myCourseIds = myCourses.map((c) => c.id);

  const filteredEnrollments = enrollments.filter((e) => {
    const matchCourse = selectedCourse === 'all' || e.courseId === selectedCourse;
    return matchCourse && myCourseIds.includes(e.courseId);
  });

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.name || '未知';
  const getCourseTitle = (id: string) => courses.find((c) => c.id === id)?.title || '未知';
  const getGrade = (studentId: string, courseId: string) => grades.find((g) => g.studentId === studentId && g.courseId === courseId);

  const handleSave = () => {
    filteredEnrollments.forEach((enr) => {
      const score = parseInt(scores[enr.id]);
      if (isNaN(score)) return;
      const existing = getGrade(enr.studentId, enr.courseId);
      if (existing) {
        updateGrade(existing.id, { score, comment: comments[enr.id] || '', gradedAt: new Date().toISOString().slice(0, 10) });
      } else {
        addGrade({
          id: `g-${Date.now()}-${enr.id}`,
          studentId: enr.studentId,
          courseId: enr.courseId,
          score,
          comment: comments[enr.id] || '',
          gradedAt: new Date().toISOString().slice(0, 10),
        });
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">成绩录入</h1>
          <p className="text-gray-500 mt-1">为学员录入课程成绩</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-lg shadow-emerald-500/25">
          <Save className="w-5 h-5" />
          <span>{saved ? '已保存' : '保存成绩'}</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
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
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">已有成绩</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">成绩</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">评语</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEnrollments.map((enr) => {
                const existing = getGrade(enr.studentId, enr.courseId);
                return (
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
                    <td className="px-6 py-4 text-sm">
                      {existing ? <span className="font-medium text-emerald-600">{existing.score}分</span> : <span className="text-gray-400">未录入</span>}
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" min="0" max="100" placeholder="0-100"
                        value={scores[enr.id] ?? existing?.score ?? ''}
                        onChange={(e) => setScores({ ...scores, [enr.id]: e.target.value })}
                        className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="text" placeholder="评语" value={comments[enr.id] ?? existing?.comment ?? ''}
                        onChange={(e) => setComments({ ...comments, [enr.id]: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredEnrollments.length === 0 && (
          <div className="text-center py-8 text-gray-400">暂无数据</div>
        )}
      </div>
    </div>
  );
}