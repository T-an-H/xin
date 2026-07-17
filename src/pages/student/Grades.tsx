import { useState } from 'react';
import { useStore } from '@/store';
import { Award, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import ScoreDetail from '@/components/ScoreDetail';

const scoreFieldMeta: { key: string; label: string; group: string }[] = [
  { key: 'selfEvalScore', label: '自评', group: '平时成绩' },
  { key: 'peerReviewScore', label: '组内互评', group: '平时成绩' },
  { key: 'interGroupScore', label: '组间互评', group: '平时成绩' },
  { key: 'teacherScore', label: '教师评价', group: '平时成绩' },
  { key: 'mentorScore', label: '企业导师评价', group: '平时成绩' },
  { key: 'midtermExamScore', label: '期中考试', group: '期中成绩' },
  { key: 'midtermProjectScore', label: '项目成绩(期中)', group: '期中成绩' },
  { key: 'finalExamScore', label: '期末测试', group: '期末成绩' },
  { key: 'finalProjectScore', label: '项目成绩(期末)', group: '期末成绩' },
];

export default function StudentGrades() {
  const { students, enrollments, courses, detailedGrades, grades, currentUser, getGradeConfig } = useStore();
  const [semester, setSemester] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<{ courseId: string } | null>(null);

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
    : myEnrollments.filter((enr) => getSemester(myGrades.find((g) => g.courseId === enr.courseId)?.gradedAt || enr.enrollDate) === semester);

  const getCourseTitle = (id: string) => courses.find((c) => c.id === id)?.title || '未知';
  const getCourseCredit = (id: string) => courses.find((c) => c.id === id)?.credits || 0;
  const getGrade = (courseId: string) => myGrades.find((g) => g.courseId === courseId);
  const getDetailed = (courseId: string) => detailedGrades.find((d) => d.studentId === student?.id && d.courseId === courseId);
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
        <p className="text-gray-500 mt-1">查看各课程分项成绩与总分</p>
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
      <div className="space-y-4">
        {filtered.map((enr) => {
          const grade = getGrade(enr.courseId);
          const detail = getDetailed(enr.courseId);
          const cfg = getGradeConfig(enr.courseId);
          const credit = getCourseCredit(enr.courseId);
          const gp = grade ? getGradePoint(grade.score) : 0;
          const isExpanded = expanded === enr.courseId;

          return (
            <div key={enr.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* 课程行 */}
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : enr.courseId)}>
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{getCourseTitle(enr.courseId)}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{credit} 学分</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {grade ? (
                    <button
                      onClick={() => setDetailTarget({ courseId: enr.courseId })}
                      className={`text-lg font-bold px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors ${
                        grade.score >= 90 ? 'text-emerald-600' :
                        grade.score >= 80 ? 'text-blue-600' :
                        grade.score >= 70 ? 'text-amber-600' :
                        grade.score >= 60 ? 'text-orange-600' : 'text-red-600'
                      }`}
                    >{grade.score} 分</button>
                  ) : <span className="text-gray-400 text-sm">未录入</span>}
                  {grade && <span className="text-sm text-gray-400">GPA {gp.toFixed(1)}</span>}
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-300" /> : <ChevronDown className="w-5 h-5 text-gray-300" />}
                </div>
              </div>

              {/* 展开明细 */}
              {isExpanded && detail && (
                <div className="border-t border-gray-50 px-4 py-4 bg-gray-50/50 space-y-4">
                  {/* 权重信息 */}
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p>权重配置：平时 {cfg.regularWeight}% + 期中 {cfg.midtermWeight}% + 期末 {cfg.finalWeight}%</p>
                    <p>平时构成：自评 {cfg.selfEvalWeight}% · 组内互评 {cfg.peerReviewWeight}% · 组间互评 {cfg.interGroupEvalWeight}% · 教师 {cfg.teacherScoreWeight}% · 企业导师 {cfg.mentorScoreWeight}%</p>
                  </div>

                  {/* 分项成绩 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {scoreFieldMeta.map((meta) => {
                      const val = detail[meta.key as keyof typeof detail] as number | undefined;
                      if (val == null) return null;
                      return (
                        <div key={meta.key} className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                          <p className="text-xs text-gray-400 mb-1">{meta.group}</p>
                          <p className="text-sm font-semibold text-gray-900">{val}</p>
                          <p className="text-xs text-gray-500">{meta.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* 评语 */}
                  {grade?.comment && (
                    <div className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-100">
                      <span className="text-gray-400">评语：</span>{grade.comment}
                    </div>
                  )}
                </div>
              )}

              {/* 展开但无明细 */}
              {isExpanded && !detail && (
                <div className="border-t border-gray-50 px-4 py-6 text-center text-sm text-gray-400">
                  {grade ? '暂无分项成绩明细' : '成绩尚未录入'}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-8 text-gray-400">暂无成绩数据</div>}
      </div>

      {detailTarget && (
        <ScoreDetail
          open={!!detailTarget}
          onClose={() => setDetailTarget(null)}
          studentName={currentUser || ''}
          courseTitle={getCourseTitle(detailTarget.courseId)}
          detail={getDetailed(detailTarget.courseId)}
          cfg={getGradeConfig(detailTarget.courseId)}
          totalScore={getGrade(detailTarget.courseId)?.score ?? 0}
        />
      )}
    </div>
  );
}
