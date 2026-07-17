import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { BookOpen, Settings, Users, AlertTriangle, ClipboardCheck, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { EvalTemplateLabels, EvalTemplateDescs, TEMPLATE_EVAL_TYPES, EvalTypeLabels, EvalTypeColors,
  EvalFrequencyLabels, EvalFrequencyDescs, OverdueRuleLabels } from '@/types';
import type { EvalTemplate, EvalType, Evaluation, EvalFrequency, OverdueRule } from '@/types';

const LEVEL_OPTIONS = [
  { label: 'A (优秀)', range: [90, 100], color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { label: 'B (良好)', range: [80, 89], color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { label: 'C (中等)', range: [70, 79], color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { label: 'D (及格)', range: [60, 69], color: 'bg-orange-100 text-orange-700 border-orange-300' },
];

export default function TeacherEvaluation() {
  const { courses, currentUser, evalConfigs, setEvalConfig, evaluations, students, addEvaluation, detectAnomalies, getEvalSessions, hasGroups } = useStore();
  const { enrollments } = useStore();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [evalTypeFilter, setEvalTypeFilter] = useState<EvalType | 'all'>('all');

  const myCourses = courses.filter((c) => c.teacher === currentUser);
  const selectedCourseData = selectedCourse ? courses.find((c) => c.id === selectedCourse) : null;
  const selectedConfig = selectedCourse ? evalConfigs.find((c) => c.courseId === selectedCourse) : null;
  const baseEnabledTypes: EvalType[] = selectedConfig ? TEMPLATE_EVAL_TYPES[selectedConfig.template] : [];
  const totalSessions = selectedCourse ? getEvalSessions(selectedCourse) : 1;
  const courseHasGroups = selectedCourse ? hasGroups(selectedCourse) : false;

  // 应用自动隐藏
  const enabledTypes = baseEnabledTypes.filter((t) => {
    if ((t === 'intra_group' || t === 'inter_group') && !courseHasGroups) return false;
    if (t === 'mentor' && !selectedConfig?.hasMentor) return false;
    return true;
  });

  const enrolledStudents = useMemo(() => {
    if (!selectedCourse) return [];
    return enrollments
      .filter((e) => e.courseId === selectedCourse && e.status !== 'dropped')
      .map((e) => ({
        enrollmentId: e.id,
        student: students.find((s) => s.id === e.studentId),
      }))
      .filter((e) => e.student);
  }, [selectedCourse, enrollments, students]);

  // 异常检测
  const anomalies = useMemo(() => {
    if (!selectedCourse) return [];
    const results: { session: number; anomaly: import('@/types').EvalAnomaly }[] = [];
    for (let s = 1; s <= totalSessions; s++) {
      detectAnomalies(selectedCourse, s).forEach((a) => results.push({ session: s, anomaly: a }));
    }
    return results;
  }, [selectedCourse, evaluations, detectAnomalies]);

  const handleSetConfig = (updates: Partial<import('@/types').EvaluationConfig>) => {
    if (!selectedCourse) return;
    const existing = evalConfigs.find((c) => c.courseId === selectedCourse);
    const config = {
      courseId: selectedCourse,
      template: existing?.template || 'standard',
      frequency: existing?.frequency || 'biweekly',
      hasMentor: existing?.hasMentor ?? false,
      overdueRule: existing?.overdueRule || 'average',
      ...existing,
      ...updates,
    };
    setEvalConfig(config);
  };

  const handleBatchEval = (type: EvalType, level: string) => {
    if (!selectedCourse) return;
    const range = LEVEL_OPTIONS.find((o) => o.label === level)?.range;
    if (!range) return;
    const score = Math.round((range[0] + range[1]) / 2);

    enrolledStudents.forEach(({ student }) => {
      if (!student) return;
      const existing = evaluations.find(
        (e) => e.courseId === selectedCourse && e.studentId === student.id && e.type === type && e.sessionNumber === 1 && e.evaluatorId.includes('t-')
      );
      const ev: Evaluation = {
        id: existing ? existing.id : `ev-batch-${Date.now()}-${student.id}-${type}`,
        courseId: selectedCourse,
        studentId: student.id,
        sessionNumber: 1,
        type,
        score,
        evaluatorId: currentUser || 'teacher',
        evaluatorName: currentUser || '教师',
        comment: level,
        createdAt: new Date().toISOString().split('T')[0],
      };
      if (existing) {
        useStore.getState().updateEvaluation(ev.id, { score, comment: level, createdAt: ev.createdAt });
      } else {
        addEvaluation(ev);
      }
    });
  };

  const getStudentEvals = (studentId: string, sessionNumber: number, type: EvalType) => {
    return evaluations.filter(
      (e) => e.courseId === selectedCourse && e.studentId === studentId && e.sessionNumber === sessionNumber && e.type === type
    );
  };

  const handleProcessOverdue = () => {
    if (!selectedCourse) return;
    for (let s = 1; s <= totalSessions; s++) {
      useStore.getState().processSessionOverdue(selectedCourse, s);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">评价管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理课程评价方案，一键批量评价</p>
        </div>
      </div>

      {/* 课程选择 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {myCourses.map((course) => {
          const config = evalConfigs.find((c) => c.courseId === course.id);
          const totals = getEvalSessions(course.id);
          return (
            <button
              key={course.id}
              onClick={() => { setSelectedCourse(course.id); setEvalTypeFilter('all'); setShowSettings(false); }}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selectedCourse === course.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{course.title}</span>
              </div>
              <p className="text-xs text-gray-500">{course.teacher} · {course.duration}课时</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                  {config ? EvalTemplateLabels[config.template] : '未配置'}
                </span>
                {config && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-200">
                    {EvalFrequencyLabels[config.frequency]} ({totals}次)
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedCourse && selectedCourseData && (
        <div className="space-y-6">
          {/* 评价方案设置（折叠式） */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">评价方案配置</h2>
              </div>
              <div className="flex items-center gap-3">
                {/* 当前配置摘要 */}
                <span className="text-xs text-gray-400">
                  {selectedConfig ? EvalTemplateLabels[selectedConfig.template] : '未配置'} ·
                  {selectedConfig ? EvalFrequencyLabels[selectedConfig.frequency] : '默认频率'}
                </span>
                <span className="text-xs text-gray-400 hover:text-gray-600">{showSettings ? '收起 ▲' : '展开 ▼'}</span>
              </div>
            </button>

            {/* 自动隐藏信息 */}
            <div className="flex flex-wrap gap-2 mt-3 mb-1">
              {(['self', 'intra_group', 'inter_group', 'teacher', 'mentor'] as EvalType[]).map((t) => {
                const inTemplate = selectedConfig && TEMPLATE_EVAL_TYPES[selectedConfig.template].includes(t);
                const hiddenBecauseNoGroup = (t === 'intra_group' || t === 'inter_group') && !courseHasGroups;
                const hiddenBecauseNoMentor = t === 'mentor' && selectedConfig && !selectedConfig.hasMentor;

                if (!inTemplate) {
                  return (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-300 border border-gray-200">
                      {EvalTypeLabels[t]} ✗
                    </span>
                  );
                }
                if (hiddenBecauseNoGroup || hiddenBecauseNoMentor) {
                  return (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-500 border border-amber-200">
                      <EyeOff className="w-3 h-3 inline mr-0.5" />
                      {EvalTypeLabels[t]}（自动隐藏）
                    </span>
                  );
                }
                return (
                  <span key={t} className={`text-xs px-2.5 py-1 rounded-full border ${EvalTypeColors[t]}`}>
                    <Eye className="w-3 h-3 inline mr-0.5" />
                    {EvalTypeLabels[t]}
                  </span>
                );
              })}
            </div>

            {showSettings && (
              <div className="border-t border-gray-100 mt-3 pt-4 space-y-4">
                {/* 评价模板 */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">评价模板</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(Object.keys(EvalTemplateLabels) as EvalTemplate[]).map((tpl) => (
                      <button
                        key={tpl}
                        onClick={() => handleSetConfig({ template: tpl })}
                        className={`text-left p-3 rounded-lg border transition-all ${
                          selectedConfig?.template === tpl ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-900">{EvalTemplateLabels[tpl]}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{EvalTemplateDescs[tpl]}</p>
                        <div className="flex gap-1 mt-1">
                          {TEMPLATE_EVAL_TYPES[tpl].map((t) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                              {EvalTypeLabels[t]}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 评价频率 */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">评价频率</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(Object.keys(EvalFrequencyLabels) as EvalFrequency[]).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => handleSetConfig({ frequency: freq })}
                        className={`text-left p-3 rounded-lg border transition-all ${
                          selectedConfig?.frequency === freq ? 'border-cyan-300 bg-cyan-50' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <span className="text-sm font-medium text-gray-900">{EvalFrequencyLabels[freq]}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{EvalFrequencyDescs[freq]}</p>
                        <span className="text-xs text-cyan-500 mt-0.5 block">
                          共 {selectedCourse ? getEvalSessions(selectedCourse) : 0} 次评价
                        </span>
                      </button>
                    ))}
                  </div>
                  {selectedConfig?.frequency === 'custom' && (
                    <div className="mt-2">
                      <label className="text-xs text-gray-500">自定义评价次数：</label>
                      <input type="number" min={1} max={20} value={selectedConfig.customSessions || 3}
                        onChange={(e) => handleSetConfig({ customSessions: parseInt(e.target.value) || 3 })}
                        className="ml-2 w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" />
                    </div>
                  )}
                </div>

                {/* 企业导师参与 */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">企业导师参与评价</label>
                  <button
                    onClick={() => handleSetConfig({ hasMentor: !selectedConfig?.hasMentor })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${selectedConfig?.hasMentor ? 'bg-emerald-400' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${selectedConfig?.hasMentor ? 'left-5.5' : 'left-0.5'}`} />
                  </button>
                  <span className="text-xs text-gray-400">
                    {selectedConfig?.hasMentor ? '已启用' : '已禁用'}——
                    {selectedConfig?.hasMentor
                      ? '学生端将显示企业导师评价卡片'
                      : '学生端自动隐藏企业导师评价'}
                  </span>
                </div>

                {/* 逾期处理规则 */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">逾期未评处理规则</p>
                  <div className="flex gap-3">
                    {(Object.keys(OverdueRuleLabels) as OverdueRule[]).map((rule) => (
                      <button
                        key={rule}
                        onClick={() => handleSetConfig({ overdueRule: rule })}
                        className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                          selectedConfig?.overdueRule === rule ? 'border-purple-300 bg-purple-50 text-purple-700 font-medium' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {OverdueRuleLabels[rule]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 异常预警 */}
          {anomalies.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
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

          {/* 一键批量评价 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">一键等级批量评价</h2>
                <span className="text-xs text-gray-400">（为所有学生第1次评价生成教师/导师评价）</span>
              </div>
              <button onClick={handleProcessOverdue}
                className="text-xs flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100">
                <RefreshCw className="w-3 h-3" />
                处理逾期自评
              </button>
            </div>

            <div className="flex flex-wrap gap-4">
              {enabledTypes.filter((t) => t === 'teacher' || t === 'mentor').map((type) => (
                <div key={type} className="flex-1 min-w-[200px] p-3 rounded-lg border border-gray-100 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-2">{EvalTypeLabels[type]}批量</p>
                  <div className="flex flex-col gap-1.5">
                    {LEVEL_OPTIONS.map((level) => (
                      <button
                        key={level.label}
                        onClick={() => handleBatchEval(type, level.label)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${level.color} hover:opacity-80`}
                      >
                        {level.label} ({level.range[0]}-{level.range[1]}分)
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 学生评价详情 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">学生评价详情</h2>
                <span className="text-xs text-gray-400">{enrolledStudents.length}名学生 · 共{totalSessions}次评价</span>
              </div>
              <select
                value={evalTypeFilter}
                onChange={(e) => setEvalTypeFilter(e.target.value as EvalType | 'all')}
                className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white"
              >
                <option value="all">全部类型</option>
                {enabledTypes.map((t) => (
                  <option key={t} value={t}>{EvalTypeLabels[t]}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">学生</th>
                    {Array.from({ length: Math.min(totalSessions, 3) }, (_, i) => i + 1).map((s) => (
                      <th key={s} className="text-left py-2 px-2 text-gray-500 font-medium" colSpan={enabledTypes.length}>
                        第{s}次评价
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <th className="py-1 px-2"></th>
                    {Array.from({ length: Math.min(totalSessions, 3) }, (_, i) => i + 1).map((s) => (
                      enabledTypes.filter((t) => evalTypeFilter === 'all' || t === evalTypeFilter).map((t) => (
                        <th key={`${s}-${t}`} className="text-left py-1 px-2 text-[10px] text-gray-400 font-medium">
                          {EvalTypeLabels[t]}
                        </th>
                      ))
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map(({ student }) => {
                    if (!student) return null;
                    return (
                      <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-2 text-sm font-medium text-gray-700">{student.name}</td>
                        {Array.from({ length: Math.min(totalSessions, 3) }, (_, i) => i + 1).map((s) =>
                          enabledTypes.filter((t) => evalTypeFilter === 'all' || t === evalTypeFilter).map((t) => {
                            const evals = getStudentEvals(student.id, s, t);
                            const avgScore = evals.length > 0
                              ? Math.round(evals.reduce((a, e) => a + e.score, 0) / evals.length)
                              : null;
                            const isSelf = t === 'self';
                            const otherEvals = isSelf ? evaluations.filter(
                              (e) => e.courseId === selectedCourse && e.studentId === student.id && e.sessionNumber === s && e.type !== 'self'
                            ) : [];
                            const otherAvg = otherEvals.length > 0
                              ? Math.round(otherEvals.reduce((a, e) => a + e.score, 0) / otherEvals.length)
                              : null;
                            const showAnomaly = isSelf && avgScore !== null && otherAvg !== null && Math.abs(avgScore - otherAvg) > 20;

                            return (
                              <td key={`${student.id}-${s}-${t}`} className="py-2 px-2">
                                <div className={`text-xs px-2 py-1 rounded ${
                                  showAnomaly ? 'bg-red-50 text-red-600' :
                                  avgScore !== null ? (isSelf ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600') : 'text-gray-300'
                                }`}>
                                  {avgScore !== null ? `${avgScore}分` : '-'}
                                  {showAnomaly && <AlertTriangle className="w-3 h-3 inline ml-1 text-red-400" />}
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
      )}
    </div>
  );
}
