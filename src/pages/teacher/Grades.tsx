import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { Save, TrendingUp, Award, AlertTriangle, BarChart3, ChevronDown, ChevronUp, Trash2, Edit3, Settings, Eye } from 'lucide-react';
import GradeConfig from '@/components/GradeConfig';
import ScoreDetail from '@/components/ScoreDetail';
import type { DetailedGrade } from '@/types';

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

const scoreFields: { key: keyof Omit<DetailedGrade, 'id' | 'studentId' | 'courseId' | 'gradedAt'>; label: string; group: 'regular' | 'midterm' | 'final' }[] = [
  { key: 'selfEvalScore', label: '自评', group: 'regular' },
  { key: 'peerReviewScore', label: '组内互评', group: 'regular' },
  { key: 'interGroupScore', label: '组间互评', group: 'regular' },
  { key: 'teacherScore', label: '教师评价', group: 'regular' },
  { key: 'mentorScore', label: '企业导师评价', group: 'regular' },
  { key: 'midtermExamScore', label: '期中考试', group: 'midterm' },
  { key: 'midtermProjectScore', label: '项目成绩(期中)', group: 'midterm' },
  { key: 'finalExamScore', label: '期末测试', group: 'final' },
  { key: 'finalProjectScore', label: '项目成绩(期末)', group: 'final' },
];

const groupLabels: Record<string, string> = {
  regular: '平时成绩',
  midterm: '期中成绩',
  final: '期末成绩',
};

export default function TeacherGrades() {
  const { courses, students, enrollments, detailedGrades, grades, currentUser, addDetailedGrade, updateDetailedGrade, addGrade, updateGrade, deleteGrade, calcTotalScore, getGradeConfig } = useStore();
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [scores, setScores] = useState<Record<string, Record<string, string>>>({});
  const [saved, setSaved] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [configOpen, setConfigOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<{ studentName: string; courseTitle: string; courseId: string; studentId: string } | null>(null);

  const myCourses = courses.filter((c) => c.teacher === currentUser);
  const myCourseIds = myCourses.map((c) => c.id);

  const filteredEnrollments = enrollments.filter((e) => {
    const matchCourse = selectedCourse === 'all' || e.courseId === selectedCourse;
    return matchCourse && myCourseIds.includes(e.courseId);
  });

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.name || '未知';
  const getCourseTitle = (id: string) => courses.find((c) => c.id === id)?.title || '未知';
  const getExisting = (studentId: string, courseId: string) =>
    detailedGrades.find((d) => d.studentId === studentId && d.courseId === courseId);
  const getScore = (enrId: string, field: string) => {
    const enrollment = enrollments.find((e) => e.id === enrId);
    if (!enrollment) return '';
    const existing = getExisting(enrollment.studentId, enrollment.courseId);
    if (!existing) return '';
    const val = existing[field as keyof typeof existing];
    return val != null ? String(val) : '';
  };

  const cfg = selectedCourse !== 'all' ? getGradeConfig(selectedCourse) : null;

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
    const now = new Date().toISOString().slice(0, 10);
    for (const enr of filteredEnrollments) {
      // 检查课程是否已结束
      const course = courses.find(c => c.id === enr.courseId);
      if (course && course.status === 'inactive') {
        alert(`课程「${course.title}」已结束，无法修改成绩`);
        return;
      }
      const rowScores = scores[enr.id];
      if (!rowScores) continue;
      const existing = getExisting(enr.studentId, enr.courseId);
      const detail: Record<string, number | undefined> = {};
      scoreFields.forEach((f) => {
        const v = parseInt(rowScores[f.key]);
        detail[f.key] = isNaN(v) ? undefined : v;
      });
      const hasAny = Object.values(detail).some((v) => v !== undefined);
      if (!hasAny) continue;

      const dgData = {
        selfEvalScore: detail.selfEvalScore as number | undefined,
        peerReviewScore: detail.peerReviewScore as number | undefined,
        interGroupScore: detail.interGroupScore as number | undefined,
        teacherScore: detail.teacherScore as number | undefined,
        mentorScore: detail.mentorScore as number | undefined,
        midtermExamScore: detail.midtermExamScore as number | undefined,
        midtermProjectScore: detail.midtermProjectScore as number | undefined,
        finalExamScore: detail.finalExamScore as number | undefined,
        finalProjectScore: detail.finalProjectScore as number | undefined,
        gradedAt: now,
      };

      const totalScore = calcTotalScore(enr.courseId, dgData as DetailedGrade);

      if (existing) {
        updateDetailedGrade(existing.id, dgData);
        const g = grades.find((g) => g.studentId === enr.studentId && g.courseId === enr.courseId);
        if (g) updateGrade(g.id, { score: totalScore, gradedAt: now });
      } else {
        addDetailedGrade({
          id: `dg-${Date.now()}-${enr.id}`,
          studentId: enr.studentId,
          courseId: enr.courseId,
          ...dgData,
        });
        addGrade({
          id: `g-${Date.now()}-${enr.id}`,
          studentId: enr.studentId,
          courseId: enr.courseId,
          score: totalScore,
          comment: '',
          gradedAt: now,
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

  const handleScoreInput = (enrId: string, field: string, value: string) => {
    setScores((prev) => ({
      ...prev,
      [enrId]: { ...(prev[enrId] || {}), [field]: value },
    }));
  };

  const activeCourseId = selectedCourse !== 'all' ? selectedCourse : myCourses[0]?.id;
  const currentCfg = activeCourseId ? getGradeConfig(activeCourseId) : null;

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">成绩录入</h1>
          <p className="text-gray-500 mt-1">按分项录入，系统自动按权重计算总分</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setConfigOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors text-sm font-medium">
            <Settings className="w-4 h-4" />
            权重配置
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-lg shadow-emerald-500/25 text-sm font-medium">
            <Save className="w-5 h-5" />
            {saved ? '已保存' : '保存成绩'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <select value={selectedCourse} onChange={(e) => { setSelectedCourse(e.target.value); setScores({}); }}
          className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm bg-white">
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

      {/* 权重摘要 */}
      {currentCfg && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-sm text-amber-800 flex flex-wrap gap-x-6 gap-y-1">
          <span>总成绩 = 平时 {currentCfg.regularWeight}% + 期中 {currentCfg.midtermWeight}% + 期末 {currentCfg.finalWeight}%</span>
          <span>平时 = 自评 {currentCfg.selfEvalWeight}% + 组内互评 {currentCfg.peerReviewWeight}% + 组间互评 {currentCfg.interGroupEvalWeight}% + 教师 {currentCfg.teacherScoreWeight}% + 企业导师 {currentCfg.mentorScoreWeight}%</span>
        </div>
      )}

      {/* 成绩录入表 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 sticky left-0 bg-gray-50 z-10">学员</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">课程</th>
                {scoreFields.map((f) => (
                  <th key={f.key} className="text-center px-2 py-3 text-xs font-medium text-gray-500 min-w-[80px]">
                    <span className="block">{f.label}</span>
                    <span className="text-[10px] text-gray-400">{groupLabels[f.group]}</span>
                  </th>
                ))}
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-500 min-w-[70px]">总分</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEnrollments.map((enr) => {
                const existing = getExisting(enr.studentId, enr.courseId);
                const rowScore: Record<string, number | undefined> = {};
                scoreFields.forEach((f) => {
                  const v = scores[enr.id]?.[f.key];
                  rowScore[f.key] = v !== undefined ? parseInt(v) : (existing?.[f.key as keyof typeof existing] as number | undefined);
                });
                const total = !isNaN(rowScore.selfEvalScore as number)
                  ? calcTotalScore(enr.courseId, rowScore as DetailedGrade)
                  : existing ? grades.find((g) => g.studentId === enr.studentId && g.courseId === enr.courseId)?.score : undefined;
                return (
                  <tr key={enr.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-white hover:bg-gray-50 z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-emerald-600">{getStudentName(enr.studentId).charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{getStudentName(enr.studentId)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{getCourseTitle(enr.courseId)}</td>
                    {scoreFields.map((f) => (
                      <td key={f.key} className="px-2 py-3 text-center">
                        <input type="number" min="0" max="100" placeholder="0"
                          value={scores[enr.id]?.[f.key] ?? (existing ? (existing[f.key as keyof typeof existing] ?? '') : '')}
                          onChange={(e) => handleScoreInput(enr.id, f.key, e.target.value)}
                          className="w-16 px-2 py-1.5 rounded border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm text-center" />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      {total != null ? (
                        <button
                          onClick={() => setDetailTarget({
                            studentName: getStudentName(enr.studentId),
                            courseTitle: getCourseTitle(enr.courseId),
                            courseId: enr.courseId,
                            studentId: enr.studentId,
                          })}
                          className={`font-semibold text-sm px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors ${
                            total >= 90 ? 'text-emerald-600' :
                            total >= 80 ? 'text-blue-600' :
                            total >= 70 ? 'text-amber-600' :
                            total >= 60 ? 'text-orange-600' : 'text-red-600'
                          }`}
                        >
                          {total}
                        </button>
                      ) : <span className="text-gray-300">-</span>}
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

      {detailTarget && (
        <ScoreDetail
          open={!!detailTarget}
          onClose={() => setDetailTarget(null)}
          studentName={detailTarget.studentName}
          courseTitle={detailTarget.courseTitle}
          detail={detailedGrades.find((d) => d.studentId === detailTarget.studentId && d.courseId === detailTarget.courseId) || null}
          cfg={getGradeConfig(detailTarget.courseId)}
          totalScore={grades.find((g) => g.studentId === detailTarget.studentId && g.courseId === detailTarget.courseId)?.score ?? 0}
        />
      )}

      {activeCourseId && (
        <GradeConfig courseId={activeCourseId} open={configOpen} onClose={() => setConfigOpen(false)} />
      )}
    </div>
  );
}
