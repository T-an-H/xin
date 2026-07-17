import { useState } from 'react';
import { useStore } from '@/store';
import { Award, Filter } from 'lucide-react';

export default function StudentGrades() {
  const { students, enrollments, courses, grades, currentUser } = useStore();
  const [semester, setSemester] = useState('all');
  const student = students.find((s) => s.name === currentUser);
  const myEnrollments = student ? enrollments.filter((e) => e.studentId === student.id) : [];
  const myGrades = student ? grades.filter((g) => g.studentId === student.id) : [];

  const semesters = ['2026-春季', '2026-夏季', '2026-秋季'];

  const getSemester = (date?: string) => {
    if (!date) return '2026-夏季';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '2026-夏季';

    const month = parsed.getMonth() + 1;
    if (month >= 2 && month <= 5) return '2026-春季';
    if (month >= 6 && month <= 8) return '2026-夏季';
    return '2026-秋季';
  };

  const filtered = semester === 'all'
    ? myEnrollments
    : myEnrollments.filter((enr) => getSemester(getGrade(enr.courseId)?.gradedAt || enr.enrollDate) === semester);

  const getCourseTitle = (id: string) => courses.find((c) => c.id === id)?.title || '未知';
  const getCourseCredit = (id: string) => Math.round((courses.find((c) => c.id === id)?.duration || 0) / 8);
  const getGrade = (courseId: string) => myGrades.find((g) => g.courseId === courseId);
  const getGradePoint = (score: number) => {
    if (score >= 90) return 4.0;
    if (score >= 85) return 3.7;
    if (score >= 80) return 3.3;
    if (score >= 75) return 3.0;
    if (score >= 70) return 2.7;
    if (score >= 65) return 2.3;
    if (score >= 60) return 2.0;
    return 0;
  };

  const totalCredits = filtered.reduce((s, e) => s + getCourseCredit(e.courseId), 0);
  const gradedEnrollments = filtered.filter((e) => getGrade(e.courseId));
  const totalPoints = gradedEnrollments.reduce((s, e) => {
    const g = getGrade(e.courseId);
    return s + (g ? g.score * getCourseCredit(e.courseId) : 0);
  }, 0);
  const weightedAvg = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(1) : '0.0';
  const gpa = gradedEnrollments.length > 0
    ? (gradedEnrollments.reduce((s, e) => {
        const g = getGrade(e.courseId);
        return s + (g ? getGradePoint(g.score) * getCourseCredit(e.courseId) : 0);
      }, 0) / gradedEnrollments.reduce((s, e) => s + getCourseCredit(e.courseId), 0)).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">成绩管理</h1>
        <p className="text-gray-500 mt-1">查看各课程成绩与学分统计</p>
      </div>

      {/* 成绩概览 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-bold text-blue-600">{weightedAvg}</p>
          <p className="text-sm text-gray-500 mt-1">加权平均分</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-bold text-emerald-600">{gpa}</p>
          <p className="text-sm text-gray-500 mt-1">绩点 (GPA)</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-bold text-amber-600">{totalCredits}</p>
          <p className="text-sm text-gray-500 mt-1">总学分</p>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-3">
        <Filter className="w-5 h-5 text-gray-400" />
        <select value={semester} onChange={(e) => setSemester(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm bg-white">
          <option value="all">全部学期</option>
          {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* 成绩列表 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">课程</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">学分</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">成绩</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">绩点</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">评语</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">录入时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((enr) => {
                const grade = getGrade(enr.courseId);
                const credit = getCourseCredit(enr.courseId);
                const gp = grade ? getGradePoint(grade.score) : 0;
                return (
                  <tr key={enr.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{getCourseTitle(enr.courseId)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{credit}</td>
                    <td className="px-6 py-4">
                      {grade ? (
                        <span className={`font-semibold ${
                          grade.score >= 90 ? 'text-emerald-600' :
                          grade.score >= 80 ? 'text-blue-600' :
                          grade.score >= 70 ? 'text-amber-600' :
                          grade.score >= 60 ? 'text-orange-600' : 'text-red-600'
                        }`}>{grade.score}</span>
                      ) : <span className="text-gray-400">未录入</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{grade ? gp.toFixed(1) : '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{grade?.comment || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{grade?.gradedAt || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="text-center py-8 text-gray-400">暂无成绩数据</div>}
      </div>
    </div>
  );
}