import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { Save, TrendingUp, Award, AlertTriangle, BarChart3, ChevronDown, ChevronUp, Trash2, Edit3 } from 'lucide-react';

const GRADE_COLORS = [
  { range: [90, 100], label: '优秀', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', bar: 'bg-emerald-400' },
  { range: [80, 89], label: '良好', color: 'bg-blue-100 text-blue-700 border-blue-300', bar: 'bg-blue-400' },
  { range: [70, 79], label: '中等', color: 'bg-amber-100 text-amber-700 border-amber-300', bar: 'bg-amber-400' },
  { range: [60, 69], label: '及格', color: 'bg-orange-100 text-orange-700 border-orange-300', bar: 'bg-orange-400' },
  { range: [0, 59], label: '不及格', color: 'bg-red-100 text-red-700 border-red-300', bar: 'bg-red-400' },
];

const PASS_THRESHOLD = 60;

const SEMESTERS = [
  { label: '2026年春季', start: '2026-02-01', end: '2026-06-30' },
  { label: '2026年秋季(当前)', start: '2026-09-01', end: '2027-01-31' },
  { label: '全部学期', start: '', end: '' },
];

export default function TeacherGrades() {
  const { courses, students, enrollments, grades, currentUser, addGrade, updateGrade, deleteGrade } = useStore();
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('all');

  const myCourses = courses.filter((c) => c.teacher === currentUser);
  const myCourseIds = myCourses.map((c) => c.id);

  const filteredEnrollments = enrollments.filter((e) => {
    const matchCourse = selectedCourse === 'all' || e.courseId === selectedCourse;
    return matchCourse && myCourseIds.includes(e.courseId);
  });

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.name || '未知';
  const getCourseTitle = (id: string) => courses.find((c) => c.id === id)?.title || '未知';
  const getGrade = (studentId: string, courseId: string) => grades.find((g) => g.studentId === studentId && g.courseId === courseId);

  // 统计数据
  const stats = useMemo(() => {
    let courseGrades = selectedCourse === 'all'
      ? grades.filter((g) => myCourseIds.includes(g.courseId))
      : grades.filter((g) => g.courseId === selectedCourse);

    // 按学期过滤
    if (selectedSemester !== 'all') {
      const sem = SEMESTERS[parseInt(selectedSemester)];
      if (sem && sem.start) {
        courseGrades = courseGrades.filter((g) => g.gradedAt >= sem.start && g.gradedAt <= sem.end);
      }
    }

    const scoresList = courseGrades.map((g) => g.score);
    const avg = scoresList.length > 0 ? Math.round(scoresList.reduce((a, b) => a + b, 0) / scoresList.length) : null;
    const max = scoresList.length > 0 ? Math.max(...scoresList) : null;
    const min = scoresList.length > 0 ? Math.min(...scoresList) : null;
    const passed = courseGrades.filter((g) => g.score >= PASS_THRESHOLD).length;
    const passRate = scoresList.length > 0 ? Math.round((passed / scoresList.length) * 100) : null;
    const totalGraded = scoresList.length;
    const totalStudents = selectedCourse === 'all'
      ? enrollments.filter((e) => myCourseIds.includes(e.courseId) && e.status !== 'dropped').length
      : enrollments.filter((e) => e.courseId === selectedCourse && e.status !== 'dropped').length;

    return { avg, max, min, passRate, totalGraded, totalStudents, scoresList };
  }, [selectedCourse, selectedSemester, grades, enrollments, myCourseIds]);

  // 成绩分布
  const distribution = useMemo(() => {
    return GRADE_COLORS.map((g) => {
      const count = stats.scoresList.filter((s) => s >= g.range[0] && s <= g.range[1]).length;
      const pct = stats.scoresList.length > 0 ? Math.round((count / stats.scoresList.length) * 100) : 0;
      return { ...g, count, pct };
    });
  }, [stats.scoresList]);

  const handleSave = () => {
    for (const enr of filteredEnrollments) {
      // 检查课程是否已结束
      const course = courses.find(c => c.id === enr.courseId);
      if (course && course.status === 'inactive') {
        alert(`课程「${course.title}」已结束，无法修改成绩`);
        return;
      }
      const score = parseInt(scores[enr.id]);
      if (isNaN(score)) continue;
      const existing = getGrade(enr.studentId, enr.courseId);
      if (existing) {
        updateGrade(existing.id, {
          score,
          comment: comments[enr.id] !== undefined ? comments[enr.id] : existing.comment,
          gradedAt: new Date().toISOString().slice(0, 10),
        });
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
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteGrade = (gradeId: string) => {
    if (confirm('确定删除此成绩记录？')) {
      deleteGrade(gradeId);
    }
  };

  const getGradeLevel = (score: number) => {
    const level = GRADE_COLORS.find((g) => score >= g.range[0] && score <= g.range[1]);
    return level || GRADE_COLORS[GRADE_COLORS.length - 1];
  };

  const selectedCourseTitle = selectedCourse === 'all' ? '全部课程' : getCourseTitle(selectedCourse);

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">成绩管理</h1>
          <p className="text-gray-500 mt-1">录入与查看课程成绩，了解学生学习成果</p>
        </div>
        <button onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-lg shadow-emerald-500/25">
          <Save className="w-5 h-5" />
          <span>{saved ? '已保存 ✓' : '保存成绩'}</span>
        </button>
      </div>

      {/* 筛选器 */}
      <div className="flex flex-wrap gap-4 items-center">
        <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm bg-white min-w-[200px]">
          <option value="all">全部课程</option>
          {myCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm bg-white min-w-[160px]">
          {SEMESTERS.map((sem, idx) => (
            <option key={idx} value={idx === SEMESTERS.length - 1 ? 'all' : idx.toString()}>{sem.label}</option>
          ))}
        </select>
        <button
          onClick={() => setShowStats(!showStats)}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg border border-gray-200 bg-white"
        >
          <BarChart3 className="w-4 h-4" />
          统计概览
          {showStats ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <span className="text-sm text-gray-400">
          已评 {stats.totalGraded}/{stats.totalStudents} 人
        </span>
      </div>

      {/* 统计概览 */}
      {showStats && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          {/* 关键指标 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-500 mb-0.5">平均分</p>
              <p className="text-xl font-bold text-blue-700">{stats.avg ?? '-'}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-xs text-emerald-500 mb-0.5">最高分</p>
              <p className="text-xl font-bold text-emerald-700">{stats.max ?? '-'}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-amber-500 mb-0.5">最低分</p>
              <p className="text-xl font-bold text-amber-700">{stats.min ?? '-'}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-purple-500 mb-0.5">及格率</p>
              <p className="text-xl font-bold text-purple-700">{stats.passRate !== null ? `${stats.passRate}%` : '-'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">已评人数</p>
              <p className="text-xl font-bold text-gray-700">{stats.totalGraded}</p>
            </div>
          </div>

          {/* 成绩分布条形图 */}
          {stats.scoresList.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">成绩分布（{selectedCourseTitle}）</p>
              <div className="space-y-1.5">
                {distribution.map((d) => (
                  <div key={d.label} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-8 text-right">{d.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${d.bar}`}
                        style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-12">{d.count}人 ({d.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 知识掌握热力图 */}
          {selectedCourse !== 'all' && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">知识掌握热力图（{getCourseTitle(selectedCourse)}）</p>
              <div className="grid grid-cols-5 gap-1.5 max-w-md">
                {(() => {
                  const courseGrades = grades.filter(g => g.courseId === selectedCourse);
                  const sortedScores = courseGrades.map(g => g.score).sort((a, b) => a - b);
                  const getMastery = (idx: number) => {
                    if (sortedScores.length === 0) return 60;
                    const p = Math.floor((idx / 4) * (sortedScores.length - 1));
                    return Math.min(100, Math.max(20, sortedScores[p]));
                  };
                  return ['基础概念', '核心算法', '应用实践', '项目开发', '前沿探索'].map((kp, i) => {
                    const mastery = getMastery(i);
                    const color = mastery >= 85 ? 'bg-emerald-400' : mastery >= 70 ? 'bg-blue-400' : mastery >= 60 ? 'bg-amber-400' : 'bg-red-400';
                    return (
                      <div key={kp} className="flex flex-col items-center gap-1">
                        <div className={`w-full aspect-square rounded-lg ${color} flex items-center justify-center text-white text-xs font-bold`}>
                          {mastery}%
                        </div>
                        <span className="text-[9px] text-gray-500 text-center leading-tight">{kp}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 成绩表格 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">#</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">学员</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">课程</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">已有成绩</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">成绩</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">评语</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEnrollments.map((enr, idx) => {
                const existing = getGrade(enr.studentId, enr.courseId);
                const level = existing ? getGradeLevel(existing.score) : null;
                const course = courses.find(c => c.id === enr.courseId);
                const isInactive = course?.status === 'inactive';

                return (
                  <tr key={enr.id} className={`hover:bg-gray-50 transition-colors ${isInactive ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 text-sm text-gray-400">{idx + 1}</td>
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
                      {existing ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${level?.color || 'bg-gray-100 text-gray-500'}`}>
                          {existing.score}分 · {level?.label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">未录入</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" max="100" placeholder="0-100"
                          value={scores[enr.id] ?? existing?.score ?? ''}
                          onChange={(e) => setScores({ ...scores, [enr.id]: e.target.value })}
                          disabled={isInactive}
                          className={`w-20 px-3 py-1.5 rounded-lg border border-gray-200 outline-none text-sm ${isInactive ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'}`} />
                        {scores[enr.id] && parseInt(scores[enr.id]) >= 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            getGradeLevel(parseInt(scores[enr.id])).color
                          }`}>
                            {getGradeLevel(parseInt(scores[enr.id])).label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input type="text" placeholder="评语" value={comments[enr.id] ?? existing?.comment ?? ''}
                        onChange={(e) => setComments({ ...comments, [enr.id]: e.target.value })}
                        disabled={isInactive}
                        className={`w-full min-w-[120px] px-3 py-1.5 rounded-lg border border-gray-200 outline-none text-sm ${isInactive ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'}`} />
                    </td>
                    <td className="px-6 py-4">
                      {existing && (
                        <button onClick={() => handleDeleteGrade(existing.id)}
                          className="text-red-400 hover:text-red-600 transition-colors p-1"
                          title="删除成绩">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
