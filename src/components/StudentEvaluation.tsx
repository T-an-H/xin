import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store';
import { AlertTriangle, User, Users, Building2, GraduationCap, Briefcase, CheckCircle, XCircle, ChevronDown, ChevronUp, Bell, Clock, RefreshCw } from 'lucide-react';
import type { EvalType, EvalAnomaly, EvalFrequency } from '@/types';
import { EvalTypeLabels, EvalTypeColors, EvalTemplateLabels, EvalTemplateDescs, EvalFrequencyLabels, EvalFrequencyDescs, TEMPLATE_EVAL_TYPES } from '@/types';

interface Props {
  courseId: string;
  studentId: string;
  studentName: string;
}

const evalIcons: Record<EvalType, typeof User> = {
  self: User,
  intra_group: Users,
  inter_group: Building2,
  teacher: GraduationCap,
  mentor: Briefcase,
};

export default function StudentEvaluation({ courseId, studentId, studentName }: Props) {
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const {
    evaluations, evalConfigs, courses, detectAnomalies,
    getEvalSessions, hasGroups, generateEvalReminders,
    evalReminders, processSessionOverdue,
  } = useStore();

  const course = courses.find((c) => c.id === courseId);
  const config = evalConfigs.find((c) => c.courseId === courseId);
  const totalSessions = getEvalSessions(courseId);

  // 生成提醒（首次加载时）
  useEffect(() => {
    generateEvalReminders(courseId);
  }, [courseId]);

  // 自动隐藏逻辑：无分组→隐藏互评；无企业导师→隐藏导师评价
  const courseHasGroups = hasGroups(courseId);
  const baseEnabledTypes: EvalType[] = config ? TEMPLATE_EVAL_TYPES[config.template] : [];
  const enabledTypes = baseEnabledTypes.filter((t) => {
    if ((t === 'intra_group' || t === 'inter_group') && !courseHasGroups) return false;
    if (t === 'mentor' && !config?.hasMentor) return false;
    return true;
  });

  // 逾期提醒
  const studentReminders = evalReminders.filter(
    (r) => r.courseId === courseId && r.studentId === studentId
  );

  const anomalies = useMemo(() => {
    const results: EvalAnomaly[] = [];
    for (let s = 1; s <= totalSessions; s++) {
      results.push(...detectAnomalies(courseId, s));
    }
    return results;
  }, [courseId, evaluations, detectAnomalies]);

  const getEvalForType = (sessionNumber: number, type: EvalType) => {
    return evaluations.find(
      (e) => e.courseId === courseId && e.studentId === studentId && e.sessionNumber === sessionNumber && e.type === type
    );
  };

  const handleSelfSubmit = (sessionNumber: number, score: number) => {
    const existing = getEvalForType(sessionNumber, 'self');
    const ev = {
      id: existing ? existing.id : `ev-${Date.now()}`,
      courseId,
      studentId,
      sessionNumber,
      type: 'self' as EvalType,
      score,
      evaluatorId: studentId,
      evaluatorName: studentName,
      createdAt: new Date().toISOString().split('T')[0],
    };
    if (existing) {
      useStore.getState().updateEvaluation(ev.id, { score, createdAt: ev.createdAt });
    } else {
      useStore.getState().addEvaluation(ev);
    }
    // 提交后移除提醒
    const reminder = evalReminders.find(
      (r) => r.courseId === courseId && r.studentId === studentId && r.sessionNumber === sessionNumber
    );
    if (reminder) {
      const updated = evalReminders.map((r) =>
        r.id === reminder.id ? { ...r, status: 'completed' as const } : r
      );
      useStore.setState({ evalReminders: updated });
    }
  };

  const handleProcessOverdue = () => {
    // 为逾期未评的轮次自动处理
    for (const r of studentReminders) {
      if (r.status === 'overdue') {
        processSessionOverdue(courseId, r.sessionNumber);
      }
    }
  };

  // 未配置时
  if (!config) {
    return (
      <div className="px-5 pb-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-400">
          该课程尚未配置评价方案
        </div>
      </div>
    );
  }

  // 所有评价类型都被隐藏时
  if (enabledTypes.length === 0) {
    return (
      <div className="px-5 pb-4">
        <div className="bg-amber-50 rounded-lg p-4 text-center text-sm text-amber-500">
          当前课程配置下无可用的评价类型
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-4 space-y-3">
      {/* 评价方案与频率 */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
          {EvalTemplateLabels[config.template]}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-200">
          {EvalFrequencyLabels[config.frequency]}
          <span className="ml-1 text-[10px] text-cyan-400">（共{totalSessions}次）</span>
        </span>
        {/* 自动隐藏提示 */}
        {!courseHasGroups && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">
            组内/组间互评自动隐藏（未分组）
          </span>
        )}
        {!config.hasMentor && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">
            企业导师评价自动隐藏（无企业参与）
          </span>
        )}
      </div>

      {/* 逾期提醒 */}
      {studentReminders.length > 0 && (
        <div className={`rounded-lg p-3 border ${
          studentReminders.some((r) => r.status === 'overdue')
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <Bell className="w-4 h-4 text-amber-500" />
              <span className={studentReminders.some((r) => r.status === 'overdue') ? 'text-red-600' : 'text-amber-600'}>
                待办提醒
              </span>
              <span className="text-xs text-gray-400">（{studentReminders.filter((r) => r.status !== 'completed').length}项待处理）</span>
            </div>
            <button onClick={handleProcessOverdue}
              className="text-xs flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
              <RefreshCw className="w-3 h-3" />
              逾期自动处理
            </button>
          </div>
          <div className="space-y-1">
            {studentReminders.filter((r) => r.status !== 'completed').map((r) => (
              <p key={r.id} className={`text-xs flex items-center gap-2 ${r.status === 'overdue' ? 'text-red-500' : 'text-amber-500'}`}>
                <Clock className="w-3 h-3" />
                第{r.sessionNumber}次评价 截止{r.deadline}
                {r.status === 'overdue' && <span className="text-red-400">（已逾期）</span>}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 异常预警 */}
      {anomalies.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-600 text-sm font-medium mb-1">
            <AlertTriangle className="w-4 h-4" />
            异常预警 ({anomalies.length}条)
          </div>
          {anomalies.map((a) => (
            <p key={a.id} className="text-xs text-red-500 ml-6">{a.warning}</p>
          ))}
        </div>
      )}

      {/* 历次评价列表 */}
      <div className="space-y-2">
        {Array.from({ length: totalSessions }, (_, i) => i + 1).map((session) => {
          const isExpanded = expandedSession === session;
          const sessionEvals = enabledTypes.map((type) => ({
            type,
            record: getEvalForType(session, type),
            icon: evalIcons[type],
          }));
          const submittedCount = sessionEvals.filter((e) => e.record).length;
          const sessionReminder = studentReminders.find((r) => r.sessionNumber === session);

          return (
            <div key={session} className={`border rounded-lg overflow-hidden ${
              sessionReminder?.status === 'overdue' ? 'border-red-200' : 'border-gray-100'
            }`}>
              <button
                onClick={() => setExpandedSession(isExpanded ? null : session)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-800">第{session}次评价</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    sessionReminder?.status === 'overdue'
                      ? 'bg-red-100 text-red-600'
                      : sessionReminder?.status === 'pending'
                        ? 'bg-amber-100 text-amber-600'
                        : 'text-gray-400'
                  }`}>
                    {sessionReminder?.status === 'overdue' ? '已逾期' : sessionReminder?.status === 'pending' ? '待评价' : ''}
                  </span>
                  <span className="text-xs text-gray-500">
                    {submittedCount}/{sessionEvals.length} 项已评
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {submittedCount === sessionEvals.length && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 space-y-2">
                  {sessionEvals.map(({ type, record, icon: Icon }) => {
                    const isSelf = type === 'self';
                    const isViewOnly = type === 'teacher' || type === 'mentor';
                    const colorClass = EvalTypeColors[type];

                    if (isSelf) {
                      return <SelfEvalCard
                        key={type}
                        record={record}
                        onSubmit={(score) => handleSelfSubmit(session, score)}
                        colorClass={colorClass}
                        Icon={Icon}
                        type={type}
                      />;
                    }

                    if (isViewOnly) {
                      return <ViewEvalCard
                        key={type}
                        record={record}
                        colorClass={colorClass}
                        Icon={Icon}
                        type={type}
                      />;
                    }

                    // 互评类（intra_group, inter_group）
                    return <PeerEvalCard
                      key={type}
                      record={record}
                      courseId={courseId}
                      studentId={studentId}
                      studentName={studentName}
                      sessionNumber={session}
                      type={type}
                      colorClass={colorClass}
                      Icon={Icon}
                    />;
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 自评卡片 */
function SelfEvalCard({ record, onSubmit, colorClass, Icon, type }: {
  record: import('@/types').Evaluation | undefined;
  onSubmit: (score: number) => void;
  colorClass: string;
  Icon: React.ComponentType<{ className?: string }>;
  type: string;
}) {
  const [editing, setEditing] = useState(false);
  const [score, setScore] = useState(record?.score ?? 75);

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${colorClass}`}>
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium min-w-[5em]">{EvalTypeLabels[type as EvalType]}</span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          <input type="range" min={0} max={100} value={score} onChange={(e) => setScore(Number(e.target.value))}
            className="w-24 h-1.5" />
          <span className="text-xs font-bold w-8">{score}</span>
          <button onClick={() => { onSubmit(score); setEditing(false); }}
            className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded">确认</button>
          <button onClick={() => { setEditing(false); setScore(record?.score ?? 75); }}
            className="text-xs px-2 py-0.5 text-gray-400">取消</button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-bold">{record ? `${record.score}分` : '未评价'}</span>
          {record && <span className="text-[10px] text-gray-400">{record.createdAt}</span>}
          <button onClick={() => { setEditing(true); setScore(record?.score ?? 75); }}
            className="text-xs text-blue-500 ml-auto hover:underline">
            {record ? '修改' : '评价'}
          </button>
        </div>
      )}
    </div>
  );
}

/** 查看评价卡片 */
function ViewEvalCard({ record, colorClass, Icon, type }: {
  record: import('@/types').Evaluation | undefined;
  colorClass: string;
  Icon: React.ComponentType<{ className?: string }>;
  type: string;
}) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${colorClass}`}>
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium min-w-[5em]">{EvalTypeLabels[type as EvalType]}</span>
      {record ? (
        <div className="flex-1">
          <span className="text-sm font-bold">{record.score}分</span>
          <span className="text-[10px] text-gray-400 ml-2">—— {record.evaluatorName}</span>
          {record.comment && <p className="text-[11px] text-gray-500 mt-0.5">"{record.comment}"</p>}
        </div>
      ) : (
        <span className="text-xs text-gray-400">待评价</span>
      )}
    </div>
  );
}

/** 互评卡片（查看收到的评价 + 给他人评价） */
function PeerEvalCard({ record, courseId, studentId, studentName, sessionNumber, type, colorClass, Icon }: {
  record: import('@/types').Evaluation | undefined;
  courseId: string;
  studentId: string;
  studentName: string;
  sessionNumber: number;
  type: string;
  colorClass: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const { evaluations: allEvals, studentGroups, students, addEvaluation, updateEvaluation } = useStore();
  const [showGive, setShowGive] = useState(false);
  const [peerScores, setPeerScores] = useState<Record<string, number>>({});

  // 收到的互评
  const receivedEvals = allEvals.filter(
    (e) => e.courseId === courseId && e.studentId === studentId && e.sessionNumber === sessionNumber && e.type === type && e.evaluatorId !== studentId
  );
  const avgScore = receivedEvals.length > 0
    ? Math.round(receivedEvals.reduce((s, e) => s + e.score, 0) / receivedEvals.length)
    : null;

  // 该课程的现有分组
  const groups = studentGroups.filter((g) => g.courseId === courseId);
  const myGroup = groups.find((g) => g.memberIds.includes(studentId));

  // 我需要进行互评的对象
  const isIntraGroup = type === 'intra_group';

  // 组内互评目标（个人）
  const intraTargets = useMemo(() => {
    if (!isIntraGroup || !myGroup) return [];
    return myGroup.memberIds
      .filter((id) => id !== studentId)
      .map((id) => {
        const s = students.find((st) => st.id === id);
        return { studentId: id, studentName: s?.name || '未知', groupName: myGroup.name };
      });
  }, [myGroup, students, studentId]);

  // 组间互评目标（整个组）
  const interGroupTargets = useMemo(() => {
    if (isIntraGroup || !myGroup) return [];
    return groups
      .filter((g) => g.id !== myGroup.id)
      .map((g) => ({
        groupId: g.id,
        groupName: g.name,
        memberIds: g.memberIds,
        memberNames: g.memberIds.map((id) => students.find((s) => s.id === id)?.name || '未知'),
      }));
  }, [myGroup, groups, students]);

  // 检查某组是否已被评价过（组间互评）
  const hasSubmittedGroupEval = (groupId: string) => {
    if (!myGroup) return false;
    const targetGroup = groups.find((g) => g.id === groupId);
    if (!targetGroup) return false;
    // 检查是否已对该组任意成员提交过互评
    return targetGroup.memberIds.some((mid) =>
      allEvals.some(
        (e) => e.courseId === courseId && e.studentId === mid && e.sessionNumber === sessionNumber && e.type === type && e.evaluatorId === studentId
      )
    );
  };

  // 提交对某个组的组间互评（对整个组统一打分）
  const handleSubmitGroupEval = (groupId: string, groupName: string) => {
    const score = peerScores[groupId];
    if (score === undefined || score < 0 || score > 100) return;
    const targetGroup = groups.find((g) => g.id === groupId);
    if (!targetGroup) return;

    targetGroup.memberIds.forEach((mid) => {
      const existing = allEvals.find(
        (e) => e.courseId === courseId && e.studentId === mid && e.sessionNumber === sessionNumber && e.type === type && e.evaluatorId === studentId
      );
      const ev = {
        id: existing ? existing.id : `ev-peer-${Date.now()}-${groupId}-${mid}`,
        courseId,
        studentId: mid,
        sessionNumber,
        type: type as import('@/types').EvalType,
        score,
        evaluatorId: studentId,
        evaluatorName: studentName,
        createdAt: new Date().toISOString().split('T')[0],
      };
      if (existing) {
        updateEvaluation(ev.id, { score, createdAt: ev.createdAt });
      } else {
        addEvaluation(ev);
      }
    });
  };

  // 检查是否已经提交了对某人的互评（组内互评用）
  const hasSubmittedPeerEval = (targetId: string) => {
    return allEvals.some(
      (e) => e.courseId === courseId && e.studentId === targetId && e.sessionNumber === sessionNumber && e.type === type && e.evaluatorId === studentId
    );
  };

  const handleSubmitPeerEval = (targetId: string) => {
    const score = peerScores[targetId];
    if (score === undefined || score < 0 || score > 100) return;

    const existing = allEvals.find(
      (e) => e.courseId === courseId && e.studentId === targetId && e.sessionNumber === sessionNumber && e.type === type && e.evaluatorId === studentId
    );

    const ev = {
      id: existing ? existing.id : `ev-peer-${Date.now()}-${targetId}`,
      courseId,
      studentId: targetId,
      sessionNumber,
      type: type as import('@/types').EvalType,
      score,
      evaluatorId: studentId,
      evaluatorName: studentName,
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (existing) {
      updateEvaluation(ev.id, { score, createdAt: ev.createdAt });
    } else {
      addEvaluation(ev);
    }
  };

  const handleSubmitAll = () => {
    if (isIntraGroup) {
      intraTargets.forEach((t) => {
        if (peerScores[t.studentId] !== undefined && !hasSubmittedPeerEval(t.studentId)) {
          handleSubmitPeerEval(t.studentId);
        }
      });
    } else {
      interGroupTargets.forEach((t) => {
        if (peerScores[t.groupId] !== undefined && !hasSubmittedGroupEval(t.groupId)) {
          handleSubmitGroupEval(t.groupId, t.groupName);
        }
      });
    }
    setShowGive(false);
    setPeerScores({});
  };

  const currentTargets = isIntraGroup ? intraTargets : interGroupTargets;
  const submittedCount = isIntraGroup
    ? intraTargets.filter((t) => hasSubmittedPeerEval(t.studentId)).length
    : interGroupTargets.filter((t) => hasSubmittedGroupEval(t.groupId)).length;

  const peerLabel = isIntraGroup ? '组内同学' : '其他小组';
  const peerTitle = isIntraGroup ? '评测同组同学' : '评价其他小组';

  return (
    <div className="space-y-1">
      {/* 收到的互评 */}
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${colorClass}`}>
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium min-w-[5em]">{EvalTypeLabels[type as EvalType]}</span>
        <div className="flex-1">
          {receivedEvals.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{avgScore}分</span>
              <span className="text-[10px] text-gray-400">(来自{receivedEvals.length}人)</span>
              <div className="flex gap-1 ml-1">
                {receivedEvals.map((e) => (
                  <span key={e.id} className="text-[10px] px-1.5 py-0.5 bg-white rounded border text-gray-500"
                    title={`${e.evaluatorName}: ${e.score}分`}>
                    {e.evaluatorName}:{e.score}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <span className="text-xs text-gray-400">暂无互评数据</span>
          )}
        </div>
      </div>

      {/* 给他人/他组评价 */}
      {myGroup && currentTargets.length > 0 && (
        <div className="ml-8">
          <button
            onClick={() => setShowGive(!showGive)}
            className="text-xs flex items-center gap-1 text-blue-500 hover:text-blue-600"
          >
            {showGive ? '收起' : `给${peerLabel}评价 (${submittedCount}/${currentTargets.length})`}
          </button>

          {showGive && (
            <div className={`mt-1.5 p-2 rounded-lg border space-y-2 ${isIntraGroup ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100'}`}>
              <p className="text-[10px] text-gray-500">{peerTitle}：{isIntraGroup ? '请为以下同学打分' : '请为以下小组统一打分'}</p>

              {isIntraGroup ? (
                // 组内互评：逐个评价个人
                intraTargets.map((target) => {
                  const alreadySubmitted = hasSubmittedPeerEval(target.studentId);
                  const existingEval = alreadySubmitted ? allEvals.find(
                    (e) => e.courseId === courseId && e.studentId === target.studentId && e.sessionNumber === sessionNumber && e.type === type && e.evaluatorId === studentId
                  ) : null;

                  return (
                    <div key={target.studentId} className="flex items-center gap-2 px-2 py-1.5 bg-white rounded border border-blue-50">
                      <span className="text-xs font-medium text-gray-700 min-w-[4em]">{target.studentName}</span>
                      {alreadySubmitted ? (
                        <span className="text-[10px] text-emerald-500 ml-auto">已评 {existingEval?.score}分</span>
                      ) : (
                        <div className="flex items-center gap-1 ml-auto">
                          <input type="range" min={0} max={100}
                            value={peerScores[target.studentId] ?? 75}
                            onChange={(e) => setPeerScores({ ...peerScores, [target.studentId]: Number(e.target.value) })}
                            className="w-20 h-1" />
                          <span className="text-xs font-bold w-8 text-center">{peerScores[target.studentId] ?? 75}</span>
                          <button onClick={() => handleSubmitPeerEval(target.studentId)}
                            className="text-[10px] px-1.5 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600">提交</button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                // 组间互评：按组评价，统一打分
                interGroupTargets.map((target) => {
                  const alreadySubmitted = hasSubmittedGroupEval(target.groupId);
                  const sampleMember = target.memberIds[0];
                  const existingEval = alreadySubmitted && sampleMember ? allEvals.find(
                    (e) => e.courseId === courseId && e.studentId === sampleMember && e.sessionNumber === sessionNumber && e.type === type && e.evaluatorId === studentId
                  ) : null;

                  return (
                    <div key={target.groupId} className="px-2 py-2 bg-white rounded border border-purple-50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700 min-w-[4em]">{target.groupName}</span>
                        <span className="text-[10px] text-gray-400">成员：{target.memberNames.join('、')}</span>
                        {alreadySubmitted ? (
                          <span className="text-[10px] text-emerald-500 ml-auto">已评 {existingEval?.score}分</span>
                        ) : (
                          <div className="flex items-center gap-1 ml-auto">
                            <input type="range" min={0} max={100}
                              value={peerScores[target.groupId] ?? 75}
                              onChange={(e) => setPeerScores({ ...peerScores, [target.groupId]: Number(e.target.value) })}
                              className="w-20 h-1" />
                            <span className="text-xs font-bold w-8 text-center">{peerScores[target.groupId] ?? 75}</span>
                            <button onClick={() => handleSubmitGroupEval(target.groupId, target.groupName)}
                              className="text-[10px] px-1.5 py-0.5 bg-purple-500 text-white rounded hover:bg-purple-600">提交</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {submittedCount < currentTargets.length && (
                <button onClick={handleSubmitAll}
                  className="text-[10px] px-2 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 w-full">
                  一键提交全部 ({currentTargets.length - submittedCount}组未评)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
