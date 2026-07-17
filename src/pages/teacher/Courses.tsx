import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { BookOpen, Clock, GraduationCap, Users, BarChart3, Calendar, ChevronDown, ChevronUp, Award, TrendingUp,
  Settings, AlertTriangle, ClipboardCheck, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { EvalTemplateLabels, EvalTemplateDescs, TEMPLATE_EVAL_TYPES, EvalTypeLabels, EvalTypeColors,
  EvalFrequencyLabels, EvalFrequencyDescs, OverdueRuleLabels } from '@/types';
import type { EvalTemplate, EvalType, Evaluation, EvalFrequency, OverdueRule } from '@/types';

const LEVEL_OPTIONS = [
  { label: 'A (优秀)', range: [90, 100], color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { label: 'B (良好)', range: [80, 89], color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { label: 'C (中等)', range: [70, 79], color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { label: 'D (及格)', range: [60, 69], color: 'bg-orange-100 text-orange-700 border-orange-300' },
];

export default function TeacherCourses() {
  const { courses, currentUser } = useStore();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const myCourses = courses.filter((c) => c.teacher === currentUser);

  const toggleCourse = (courseId: string) => {
    setSelectedCourseId(selectedCourseId === courseId ? null : courseId);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">我的课程</h1>
        <p className="text-gray-500 mt-1">点击课程卡片查看详情、学生学习情况及评价管理</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {myCourses.map((course) => {
          const isSelected = selectedCourseId === course.id;
          const courseEnrollments = useStore.getState().enrollments.filter((e) => e.courseId === course.id && e.status !== 'dropped');
          const activeCount = courseEnrollments.filter((e) => e.status === 'in_progress').length;
          const completedCount = courseEnrollments.filter((e) => e.status === 'completed').length;

          return (
            <div key={course.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* 课程卡片头部 */}
              <button
                onClick={() => toggleCourse(course.id)}
                className="w-full text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex gap-4 p-4">
                  <img src={course.cover} alt={course.title}
                    className="w-28 h-20 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{course.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{course.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.duration}课时</span>
                      <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />{course.credits}学分</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{courseEnrollments.length}人</span>
                    </div>
                    {/* 进度条 */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[160px]">
                        <div className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${courseEnrollments.length > 0 ? Math.round(completedCount / courseEnrollments.length * 100) : 0}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {completedCount}/{courseEnrollments.length} 已完成
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center self-center">
                    {isSelected ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
              </button>

              {/* 展开详情 */}
              {isSelected && (
                <CourseDetail course={course} />
              )}
            </div>
          );
        })}
      </div>

      {myCourses.length === 0 && (
        <div className="text-center py-16 text-gray-400">暂无授课课程</div>
      )}
    </div>
  );
}

/** 课程详情面板（含评价管理） */
function CourseDetail({ course }: { course: import('@/types').Course }) {
  const { categories, enrollments, students, grades, schedules, evaluations, evalConfigs,
    setEvalConfig, addEvaluation, updateEvaluation, detectAnomalies, getEvalSessions, hasGroups } = useStore();
  const { currentUser } = useStore();
  const [showEvalSettings, setShowEvalSettings] = useState(false);
  const [evalTypeFilter, setEvalTypeFilter] = useState<EvalType | 'all'>('all');

  const category = categories.find((c) => c.id === course.categoryId);
  const courseSchedules = schedules.filter((s) => s.courseId === course.id);
  const courseEnrollments = enrollments.filter((e) => e.courseId === course.id && e.status !== 'dropped');
  const courseHasGroups = hasGroups(course.id);

  // 评价相关
  const config = evalConfigs.find((c) => c.courseId === course.id);
  const totalSessions = getEvalSessions(course.id);
  const baseEnabledTypes: EvalType[] = config ? TEMPLATE_EVAL_TYPES[config.template] : [];
  const enabledTypes = baseEnabledTypes.filter((t) => {
    if ((t === 'intra_group' || t === 'inter_group') && !courseHasGroups) return false;
    if (t === 'mentor' && !config?.hasMentor) return false;
    return true;
  });

  // 统计数据
  const stats = useMemo(() => {
    const active = courseEnrollments.filter((e) => e.status === 'in_progress');
    const completed = courseEnrollments.filter((e) => e.status === 'completed');
    const dropped = enrollments.filter((e) => e.courseId === course.id && e.status === 'dropped').length;
    const avgProgress = courseEnrollments.length > 0
      ? Math.round(courseEnrollments.reduce((s, e) => s + e.progress, 0) / courseEnrollments.length)
      : 0;

    const courseGrades = grades.filter((g) => g.courseId === course.id);
    const avgScore = courseGrades.length > 0
      ? Math.round(courseGrades.reduce((s, g) => s + g.score, 0) / courseGrades.length)
      : null;

    return { active: active.length, completed: completed.length, dropped, avgProgress, avgScore, total: courseEnrollments.length };
  }, [course.id, enrollments, grades]);

  // 异常检测
  const anomalies = useMemo(() => {
    const results: { session: number; anomaly: import('@/types').EvalAnomaly }[] = [];
    for (let s = 1; s <= totalSessions; s++) {
      detectAnomalies(course.id, s).forEach((a) => results.push({ session: s, anomaly: a }));
    }
    return results;
  }, [course.id, evaluations, detectAnomalies]);

  const handleSetConfig = (updates: Partial<import('@/types').EvaluationConfig>) => {
    const existing = evalConfigs.find((c) => c.courseId === course.id);
    setEvalConfig({
      courseId: course.id,
      template: existing?.template || 'standard',
      frequency: existing?.frequency || 'biweekly',
      hasMentor: existing?.hasMentor ?? false,
      overdueRule: existing?.overdueRule || 'average',
      ...existing,
      ...updates,
    });
  };

  const handleBatchEval = (type: EvalType, level: string) => {
    const range = LEVEL_OPTIONS.find((o) => o.label === level)?.range;
    if (!range) return;
    const score = Math.round((range[0] + range[1]) / 2);

    courseEnrollments.forEach(({ studentId }) => {
      const existing = evaluations.find(
        (e) => e.courseId === course.id && e.studentId === studentId && e.type === type && e.sessionNumber === 1
      );
      const ev: Evaluation = {
        id: existing ? existing.id : `ev-batch-${Date.now()}-${studentId}-${type}`,
        courseId: course.id,
        studentId,
        sessionNumber: 1,
        type,
        score,
        evaluatorId: currentUser || 'teacher',
        evaluatorName: currentUser || '教师',
        comment: level,
        createdAt: new Date().toISOString().split('T')[0],
      };
      if (existing) {
        updateEvaluation(ev.id, { score, comment: level, createdAt: ev.createdAt });
      } else {
        addEvaluation(ev);
      }
    });
  };

  const handleProcessOverdue = () => {
    for (let s = 1; s <= totalSessions; s++) {
      useStore.getState().processSessionOverdue(course.id, s);
    }
  };

  const getStudentEvals = (studentId: string, sessionNumber: number, type: EvalType) => {
    return evaluations.filter(
      (e) => e.courseId === course.id && e.studentId === studentId && e.sessionNumber === sessionNumber && e.type === type
    );
  };

  return (
    <div className="border-t border-gray-100">
      <div className="p-5 space-y-5">
        {/* ====== 课程数据摘要 ====== */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={Users} label="在学人数" value={`${stats.active}`} color="text-blue-600 bg-blue-50" />
          <StatCard icon={Award} label="已完成" value={`${stats.completed}`} color="text-emerald-600 bg-emerald-50" />
          <StatCard icon={BarChart3} label="平均进度" value={`${stats.avgProgress}%`} color="text-amber-600 bg-amber-50" />
          <StatCard icon={TrendingUp} label="平均成绩" value={stats.avgScore ? `${stats.avgScore}分` : '-'} color="text-purple-600 bg-purple-50" />
          <StatCard icon={Clock} label="退课人数" value={`${stats.dropped}`} color={stats.dropped > 0 ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-50'} />
        </div>

        {/* ====== 课程基本信息 ====== */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-400" />
            课程基本信息
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <InfoRow label="课程名称" value={course.title} />
            <InfoRow label="授课教师" value={course.teacher} />
            <InfoRow label="课程分类" value={category?.name || '未分类'} />
            <InfoRow label="总课时" value={`${course.duration}课时`} />
            <InfoRow label="学分数" value={`${course.credits}学分`} />
            <InfoRow label="创建时间" value={course.createdAt} />
            <InfoRow label="课程描述" value={course.description} className="md:col-span-2" />
          </div>
        </div>

        {/* ====== 排课信息 ====== */}
        {courseSchedules.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              课程安排 ({courseSchedules.length}节课)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-3 text-gray-500 font-medium">课时</th>
                    <th className="text-left py-2 pr-3 text-gray-500 font-medium">日期</th>
                    <th className="text-left py-2 pr-3 text-gray-500 font-medium">时间</th>
                    <th className="text-left py-2 pr-3 text-gray-500 font-medium">教室</th>
                  </tr>
                </thead>
                <tbody>
                  {courseSchedules.map((s, i) => (
                    <tr key={s.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 pr-3 text-gray-700">第{i + 1}次</td>
                      <td className="py-2 pr-3 text-gray-700">{s.startDate}</td>
                      <td className="py-2 pr-3 text-gray-700">{s.timeSlot}</td>
                      <td className="py-2 pr-3 text-gray-700">{s.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====== 学生学习情况 ====== */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            学生学习情况 ({courseEnrollments.length}人)
          </h4>

          {courseEnrollments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-3 text-gray-500 font-medium">学生</th>
                    <th className="text-left py-2 pr-3 text-gray-500 font-medium">报名时间</th>
                    <th className="text-left py-2 pr-3 text-gray-500 font-medium">学习进度</th>
                    <th className="text-left py-2 pr-3 text-gray-500 font-medium">状态</th>
                    <th className="text-left py-2 pr-3 text-gray-500 font-medium">成绩</th>
                  </tr>
                </thead>
                <tbody>
                  {courseEnrollments.map((enr) => {
                    const student = students.find((s) => s.id === enr.studentId);
                    const grade = grades.find((g) => g.studentId === enr.studentId && g.courseId === course.id);
                    const statusLabel: Record<string, string> = { enrolled: '已报名', in_progress: '学习中', completed: '已完成', dropped: '已退课' };
                    const statusColor: Record<string, string> = { enrolled: 'text-blue-600 bg-blue-50', in_progress: 'text-amber-600 bg-amber-50', completed: 'text-emerald-600 bg-emerald-50', dropped: 'text-red-500 bg-red-50' };

                    return (
                      <tr key={enr.id} className="border-b border-gray-100 last:border-0 hover:bg-white/60">
                        <td className="py-2.5 pr-3">
                          <span className="font-medium text-gray-800">{student?.name || '未知'}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-gray-500 text-xs">{enr.enrollDate}</td>
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-1.5">
                              <div className="h-full rounded-full bg-blue-400" style={{ width: `${enr.progress}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{enr.progress}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColor[enr.status] || 'text-gray-400 bg-gray-50'}`}>
                            {statusLabel[enr.status] || enr.status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">
                          {grade ? (
                            <span className={`text-xs font-semibold ${
                              grade.score >= 90 ? 'text-emerald-600' : grade.score >= 75 ? 'text-blue-600' : grade.score >= 60 ? 'text-amber-600' : 'text-red-500'
                            }`}>
                              {grade.score}分
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">暂无学生报名</p>
          )}
        </div>

        {/* ===================== 评价管理 ===================== */}
        <div className="border-t border-gray-200 pt-1">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-gray-400" />
            评价管理
            <span className="text-xs font-normal text-gray-400">
              · {config ? EvalTemplateLabels[config.template] : '未配置'} · 共{totalSessions}次评价
            </span>
          </h4>

          {/* --- 异常预警 --- */}
          {anomalies.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
                <AlertTriangle className="w-5 h-5" />
                异常预警（自评与他评差异过大）
              </div>
              <div className="space-y-1">
                {anomalies.map(({ session, anomaly }) => (
                  <p key={anomaly.id} className="text-sm text-red-500">{anomaly.warning}</p>
                ))}
              </div>
            </div>
          )}

          {/* --- 评价方案配置（折叠） --- */}
          <div className="bg-white rounded-lg border border-gray-100 mb-4">
            <button
              onClick={() => setShowEvalSettings(!showEvalSettings)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-700">评价方案配置</span>
              </div>
              <div className="flex items-center gap-3">
                {/* 当前评价类型状态 */}
                {(['self', 'intra_group', 'inter_group', 'teacher', 'mentor'] as EvalType[]).map((t) => {
                  const inTemplate = config && TEMPLATE_EVAL_TYPES[config.template].includes(t);
                  const hiddenBecauseNoGroup = (t === 'intra_group' || t === 'inter_group') && !courseHasGroups;
                  const hiddenBecauseNoMentor = t === 'mentor' && config && !config.hasMentor;
                  if (!inTemplate) return null;
                  if (hiddenBecauseNoGroup || hiddenBecauseNoMentor) {
                    return (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-400 border border-amber-100 flex items-center gap-0.5">
                        <EyeOff className="w-2.5 h-2.5" />{EvalTypeLabels[t]}
                      </span>
                    );
                  }
                  return (
                    <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${EvalTypeColors[t]}`}>
                      <Eye className="w-2.5 h-2.5" />{EvalTypeLabels[t]}
                    </span>
                  );
                })}
                <span className="text-gray-300 text-[10px]">{showEvalSettings ? '收起' : '展开'}</span>
              </div>
            </button>

            {showEvalSettings && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
                {/* 模板 */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">评价模板</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(Object.keys(EvalTemplateLabels) as EvalTemplate[]).map((tpl) => (
                      <button key={tpl} onClick={() => handleSetConfig({ template: tpl })}
                        className={`text-left p-2.5 rounded-lg border text-xs transition-all ${config?.template === tpl ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <span className="font-medium text-gray-900">{EvalTemplateLabels[tpl]}</span>
                        <p className="text-[10px] text-gray-400 mt-0.5">{EvalTemplateDescs[tpl]}</p>
                        <div className="flex gap-1 mt-1">
                          {TEMPLATE_EVAL_TYPES[tpl].map((t) => (
                            <span key={t} className="text-[9px] px-1 py-0.5 rounded bg-gray-100 text-gray-500">{EvalTypeLabels[t]}</span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                {/* 频率 */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">评价频率</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(Object.keys(EvalFrequencyLabels) as EvalFrequency[]).map((freq) => (
                      <button key={freq} onClick={() => handleSetConfig({ frequency: freq })}
                        className={`text-left p-2.5 rounded-lg border text-xs transition-all ${config?.frequency === freq ? 'border-cyan-300 bg-cyan-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <span className="font-medium text-gray-900">{EvalFrequencyLabels[freq]}</span>
                        <p className="text-[10px] text-gray-400 mt-0.5">{EvalFrequencyDescs[freq]}</p>
                        <span className="text-[10px] text-cyan-500 mt-0.5 block">共 {getEvalSessions(course.id)} 次评价</span>
                      </button>
                    ))}
                  </div>
                  {config?.frequency === 'custom' && (
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-[10px] text-gray-500">自定义次数：</label>
                      <input type="number" min={1} max={20} value={config.customSessions || 3}
                        onChange={(e) => handleSetConfig({ customSessions: parseInt(e.target.value) || 3 })}
                        className="w-16 px-2 py-1 border border-gray-200 rounded text-xs" />
                    </div>
                  )}
                </div>
                {/* 企业导师 */}
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-700">企业导师参与评价</label>
                  <button onClick={() => handleSetConfig({ hasMentor: !config?.hasMentor })}
                    className={`relative w-9 h-4.5 rounded-full transition-colors ${config?.hasMentor ? 'bg-emerald-400' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all ${config?.hasMentor ? 'left-5' : 'left-0.5'}`} />
                  </button>
                  <span className="text-[10px] text-gray-400">
                    {config?.hasMentor ? '学生端显示企业导师评价' : '学生端自动隐藏'}
                  </span>
                </div>
                {/* 逾期规则 */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">逾期未评处理</p>
                  <div className="flex gap-2">
                    {(Object.keys(OverdueRuleLabels) as OverdueRule[]).map((rule) => (
                      <button key={rule} onClick={() => handleSetConfig({ overdueRule: rule })}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${config?.overdueRule === rule ? 'border-purple-300 bg-purple-50 text-purple-700 font-medium' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>
                        {OverdueRuleLabels[rule]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* --- 一键批量评价 --- */}
          <div className="bg-white rounded-lg border border-gray-100 mb-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ClipboardCheck className="w-4 h-4 text-gray-400" />
                一键等级批量评价
                <span className="text-[10px] font-normal text-gray-400">（为所有学生第1次评价生成教师/导师评价）</span>
              </div>
              <button onClick={handleProcessOverdue}
                className="text-[10px] flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 border border-purple-200 rounded hover:bg-purple-100">
                <RefreshCw className="w-3 h-3" />处理逾期
              </button>
            </div>
            <div className="px-4 py-3">
              {enabledTypes.filter((t) => t === 'teacher' || t === 'mentor').length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {enabledTypes.filter((t) => t === 'teacher' || t === 'mentor').map((type) => (
                    <div key={type} className="flex-1 min-w-[160px] p-2.5 rounded-lg border border-gray-100 bg-gray-50">
                      <p className="text-xs font-medium text-gray-700 mb-2">{EvalTypeLabels[type]}批量</p>
                      <div className="flex flex-col gap-1">
                        {LEVEL_OPTIONS.map((level) => (
                          <button key={level.label} onClick={() => handleBatchEval(type, level.label)}
                            className={`text-[10px] px-2 py-1 rounded border transition-all ${level.color} hover:opacity-80`}>
                            {level.label} ({level.range[0]}-{level.range[1]}分)
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">
                  {courseHasGroups ? '当前方案未启用教师/导师评价' : '当前课程未启用教师/导师评价'}
                </p>
              )}
            </div>
          </div>

          {/* --- 学生评价详情表 --- */}
          <div className="bg-white rounded-lg border border-gray-100">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                学生评价详情
                <span className="text-[10px] font-normal text-gray-400">{courseEnrollments.length}名学生 · 共{totalSessions}次评价</span>
              </div>
              <select value={evalTypeFilter} onChange={(e) => setEvalTypeFilter(e.target.value as EvalType | 'all')}
                className="text-[10px] px-2 py-1 border border-gray-200 rounded bg-white">
                <option value="all">全部类型</option>
                {enabledTypes.map((t) => (<option key={t} value={t}>{EvalTypeLabels[t]}</option>))}
              </select>
            </div>
            <div className="p-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-1.5 px-1.5 text-gray-500 font-medium">学生</th>
                    {Array.from({ length: Math.min(totalSessions, 3) }, (_, i) => i + 1).map((s) => (
                      <th key={s} className="text-left py-1.5 px-1.5 text-gray-500 font-medium" colSpan={enabledTypes.length}>第{s}次评价</th>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <th className="py-1 px-1.5"></th>
                    {Array.from({ length: Math.min(totalSessions, 3) }, (_, i) => i + 1).map((s) =>
                      enabledTypes.filter((t) => evalTypeFilter === 'all' || t === evalTypeFilter).map((t) => (
                        <th key={`${s}-${t}`} className="text-left py-1 px-1.5 text-[9px] text-gray-400 font-medium">{EvalTypeLabels[t]}</th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {courseEnrollments.map(({ studentId }) => {
                    const student = students.find((s) => s.id === studentId);
                    if (!student) return null;
                    return (
                      <tr key={studentId} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-1.5 px-1.5 text-xs font-medium text-gray-700">{student.name}</td>
                        {Array.from({ length: Math.min(totalSessions, 3) }, (_, i) => i + 1).map((s) =>
                          enabledTypes.filter((t) => evalTypeFilter === 'all' || t === evalTypeFilter).map((t) => {
                            const evals = getStudentEvals(studentId, s, t);
                            const avgScore = evals.length > 0 ? Math.round(evals.reduce((a, e) => a + e.score, 0) / evals.length) : null;
                            const isSelf = t === 'self';
                            const otherEvals = isSelf ? evaluations.filter(
                              (e) => e.courseId === course.id && e.studentId === studentId && e.sessionNumber === s && e.type !== 'self'
                            ) : [];
                            const otherAvg = otherEvals.length > 0 ? Math.round(otherEvals.reduce((a, e) => a + e.score, 0) / otherEvals.length) : null;
                            const showAnomaly = isSelf && avgScore !== null && otherAvg !== null && Math.abs(avgScore - otherAvg) > 20;

                            return (
                              <td key={`${studentId}-${s}-${t}`} className="py-1.5 px-1.5">
                                <div className={`text-[10px] px-1.5 py-0.5 rounded ${showAnomaly ? 'bg-red-50 text-red-600' :
                                  avgScore !== null ? (isSelf ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600') : 'text-gray-300'
                                }`}>
                                  {avgScore !== null ? `${avgScore}分` : '-'}
                                  {showAnomaly && <AlertTriangle className="w-2.5 h-2.5 inline ml-0.5 text-red-400" />}
                                </div>
                              </td>
                            );
                          })
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 统计小卡片 */
function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg p-3 flex items-center gap-3 border border-gray-100 bg-white">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

/** 信息行 */
function InfoRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className || ''}>
      <span className="text-gray-400">{label}：</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}
