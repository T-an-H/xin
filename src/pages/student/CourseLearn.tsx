import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '@/store';
import { ArrowLeft, User, ClipboardList, BookOpen, Award, FileText, Bot, CheckCircle, Clock, Star, Bell } from 'lucide-react';
import type { LearningTier } from '@/types';

const TIER_CONFIG: Record<LearningTier, { label: string; color: string; border: string; desc: string; minScore: number }> = {
  basic: { label: '基础层', color: 'bg-blue-500', border: 'border-blue-200', desc: '掌握课程核心基础知识，打好学习根基', minScore: 0 },
  advanced: { label: '进阶层', color: 'bg-amber-500', border: 'border-amber-200', desc: '深入学习核心知识，提升应用能力', minScore: 70 },
  excellent: { label: '卓越层', color: 'bg-purple-500', border: 'border-purple-200', desc: '挑战高阶内容，追求卓越表现', minScore: 85 },
};

const layerTasks: Record<LearningTier, { id: string; title: string; deadline: string }[]> = {
  basic: [
    { id: 't1', title: '观看入门视频教程', deadline: '2026-07-20' },
    { id: 't2', title: '阅读核心概念文档', deadline: '2026-07-22' },
    { id: 't3', title: '完成基础练习题', deadline: '2026-07-25' },
  ],
  advanced: [
    { id: 't4', title: '完成进阶项目实践', deadline: '2026-07-28' },
    { id: 't5', title: '参与小组讨论', deadline: '2026-07-30' },
    { id: 't6', title: '撰写学习总结报告', deadline: '2026-08-01' },
  ],
  excellent: [
    { id: 't7', title: '完成创新项目设计', deadline: '2026-08-05' },
    { id: 't8', title: '论文阅读与点评', deadline: '2026-08-08' },
    { id: 't9', title: '参加能力测评', deadline: '2026-08-10' },
  ],
};

const layerResources: Record<LearningTier, { title: string; type: string; size: string }[]> = {
  basic: [
    { title: '入门指南PDF', type: '文档', size: '2.3MB' },
    { title: '基础概念讲解视频', type: '视频', size: '156MB' },
    { title: '常见问题FAQ', type: '文档', size: '0.5MB' },
  ],
  advanced: [
    { title: '进阶实战案例集', type: '文档', size: '4.1MB' },
    { title: '项目模板代码', type: '代码', size: '12MB' },
    { title: '专家讲座视频', type: '视频', size: '280MB' },
  ],
  excellent: [
    { title: '前沿论文合集', type: '文档', size: '8.5MB' },
    { title: '高级算法实现', type: '代码', size: '3.2MB' },
    { title: '行业专家访谈', type: '视频', size: '320MB' },
  ],
};

const homeworkAssignments: Record<LearningTier, { id: string; title: string; submitted: boolean; score: number | null; feedback: string; aiGraded: boolean }[]> = {
  basic: [
    { id: 'a1', title: '基础练习-数据结构', submitted: true, score: 85, feedback: '代码规范，逻辑清晰，建议优化算法复杂度', aiGraded: true },
    { id: 'a2', title: '基础概念测试', submitted: true, score: 90, feedback: '概念掌握扎实，继续保持', aiGraded: true },
    { id: 'a3', title: '常见问题解答练习', submitted: false, score: null, feedback: '', aiGraded: false },
  ],
  advanced: [
    { id: 'a4', title: '项目实践-小型应用开发', submitted: true, score: 78, feedback: '功能完整，界面美观，可增加单元测试覆盖', aiGraded: true },
    { id: 'a5', title: '进阶作业-性能优化', submitted: false, score: null, feedback: '', aiGraded: false },
  ],
  excellent: [
    { id: 'a6', title: '创新项目设计', submitted: false, score: null, feedback: '', aiGraded: false },
    { id: 'a7', title: '技术论文阅读报告', submitted: false, score: null, feedback: '', aiGraded: false },
  ],
};

const TIER_ORDER: LearningTier[] = ['basic', 'advanced', 'excellent'];

/**
 * AI根据学生成绩/入学成绩自动判定层级
 */
function determineTier(studentId: string, grades: { courseId: string; score: number }[], enrollmentScore?: number): LearningTier {
  // 优先用上学期课程成绩均值
  if (grades.length > 0) {
    const avgScore = grades.reduce((s, g) => s + g.score, 0) / grades.length;
    if (avgScore >= TIER_CONFIG.excellent.minScore) return 'excellent';
    if (avgScore >= TIER_CONFIG.advanced.minScore) return 'advanced';
    return 'basic';
  }
  // 无成绩则用高考/入学成绩
  const score = enrollmentScore ?? 500; // 默认500
  if (score >= 620) return 'excellent';
  if (score >= 530) return 'advanced';
  return 'basic';
}

export default function CourseLearn() {
  const { id } = useParams();
  const { courses, students, enrollments, grades, currentUser, evalReminders, pushNearDeadlineEvalReminders, evaluations, studentGroups } = useStore();
  const course = courses.find((c) => c.id === id);
  const [activeTab, setActiveTab] = useState('preview');
  const [showAIFeedback, setShowAIFeedback] = useState<string | null>(null);

  const student = students.find((s) => s.name === currentUser);
  const studentGrades = student ? grades.filter((g) => g.studentId === student.id) : [];
  const studentEnrollments = student ? enrollments.filter((e) => e.studentId === student.id) : [];

  // AI判定层级（固定不可修改）
  const assignedTier = determineTier(student?.id || '', studentGrades, student?.enrollmentScore);

  // 进入课程时推送待办提醒
  useEffect(() => {
    if (student?.id) {
      pushNearDeadlineEvalReminders();
    }
  }, [assignedTier, student?.id]);

  const [homeworkData, setHomeworkData] = useState(homeworkAssignments[assignedTier]);

  const getBaseLevel = (score: number) => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '中等';
    if (score >= 60) return '及格';
    return '待提高';
  };

  const getStdDev = (values: number[]) => {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  };

  const getScoreForCourse = (courseId: string) => studentGrades.find((g) => g.courseId === courseId)?.score ?? null;

  const relatedCourseIds = (() => {
    const matched = courses.filter((c) => c.id !== course?.id && (c.categoryId === course?.categoryId || c.teacher === course?.teacher));
    return matched.slice(0, 4).map((c) => c.id);
  })();

  const relatedScores = relatedCourseIds.map((courseId) => getScoreForCourse(courseId)).filter((score): score is number => score !== null);
  const currentCourseScore = course ? getScoreForCourse(course.id) : null;
  const averageRelatedScore = relatedScores.length > 0 ? relatedScores.reduce((sum, score) => sum + score, 0) / relatedScores.length : (currentCourseScore ?? 0);
  const baseLevel = getBaseLevel(averageRelatedScore || 0);

  const masteredPrereqCount = relatedCourseIds.filter((courseId) => (getScoreForCourse(courseId) ?? 0) >= 70).length;
  const prereqStatus = relatedCourseIds.length === 0
    ? '暂无前序课程数据'
    : `${masteredPrereqCount}/${relatedCourseIds.length} 门相关课程达标`;
  const prereqWarning = masteredPrereqCount < Math.ceil(relatedCourseIds.length / 2)
    ? '前序课程掌握偏弱，建议先补齐基础再进入高阶内容'
    : '前序课程掌握较好，可顺利衔接当前学习';

  const stabilityValues = relatedScores.length > 0 ? relatedScores : (currentCourseScore !== null ? [currentCourseScore] : []);
  const stabilityStd = getStdDev(stabilityValues);
  const stabilityLevel = stabilityStd <= 5 ? '稳定' : stabilityStd <= 10 ? '一般' : '波动较大';
  const stabilityHint = stabilityLevel === '稳定'
    ? '成绩波动较小，学习状态较稳定'
    : stabilityLevel === '一般'
      ? '成绩有轻微波动，建议稳步提升'
      : '成绩波动较大，建议加强复盘与练习';

  const theoryCourseIds = ['course-2', 'course-5', 'course-6', 'course-10', 'course-12'];
  const practiceCourseIds = ['course-1', 'course-3', 'course-4', 'course-9', 'course-11'];
  const theoryScores = studentGrades.filter((g) => theoryCourseIds.includes(g.courseId)).map((g) => g.score);
  const practiceScores = studentGrades.filter((g) => practiceCourseIds.includes(g.courseId)).map((g) => g.score);
  const theoryAvg = theoryScores.length > 0 ? theoryScores.reduce((sum, score) => sum + score, 0) / theoryScores.length : 0;
  const practiceAvg = practiceScores.length > 0 ? practiceScores.reduce((sum, score) => sum + score, 0) / practiceScores.length : 0;
  const abilityTendency = practiceAvg > theoryAvg + 5
    ? '实践能力更强'
    : theoryAvg > practiceAvg + 5
      ? '理论能力更强'
      : '理论与实践能力较均衡';
  const abilityHint = practiceAvg > theoryAvg + 5
    ? '当前更适合通过项目实战提升理论理解'
    : theoryAvg > practiceAvg + 5
      ? '当前更适合继续强化知识体系与表达能力'
      : '理论与实践都值得继续均衡发展';

  const preLearningProfile = {
    baseLevel,
    learningStyle: '视觉型 + 实践型',
    recommendedPath: currentCourseScore !== null
      ? `以 ${course?.title} 课程为中心，建议先完成 ${prereqStatus}`
      : '建议从基础层开始，逐步进阶',
    strengths: [
      averageRelatedScore >= 80 ? '基础知识掌握较扎实' : '具备较强的自学习惯',
      abilityTendency === '实践能力更强' ? '动手实践能力较强' : '理论分析能力较好',
    ],
    weaknesses: [
      prereqWarning.includes('偏弱') ? '前序课程关联度偏弱' : '仍需持续巩固高阶任务',
      stabilityLevel !== '稳定' ? '学习稳定性有待提升' : '可进一步提升综合迁移能力',
    ],
    prereqStatus,
    prereqWarning,
    stabilityLevel,
    stabilityStd,
    stabilityHint,
    abilityTendency,
    abilityHint,
  };

  const dynamicRadarData = useMemo(() => {
    const theoryCourseIds = ['course-2', 'course-5', 'course-6', 'course-10', 'course-12'];
    const practiceCourseIds = ['course-1', 'course-3', 'course-4', 'course-9', 'course-11'];
    const tScores = studentGrades.filter((g) => theoryCourseIds.includes(g.courseId)).map((g) => g.score);
    const pScores = studentGrades.filter((g) => practiceCourseIds.includes(g.courseId)).map((g) => g.score);
    const tAvg = tScores.length > 0 ? tScores.reduce((s, v) => s + v, 0) / tScores.length : 0;
    const pAvg = pScores.length > 0 ? pScores.reduce((s, v) => s + v, 0) / pScores.length : 0;

    // 理论学习
    const theory = Math.round(tAvg);
    // 实践能力
    const practice = Math.round(pAvg);
    // 创新思维: 50 + (avg theory - 70) * 1.5, capped 0-100
    const innovation = Math.max(0, Math.min(100, Math.round(50 + (tAvg - 70) * 1.5)));
    // 团队协作: 60 + (number of group-related enrollments * 5), capped 0-100
    const groupCount = student ? studentGroups.filter((g) => g.memberIds.includes(student.id)).length : 0;
    const collaboration = Math.max(0, Math.min(100, Math.round(60 + groupCount * 5)));
    // 自主学习: use self-evaluation scores if available, otherwise 65 + (enrollmentScore/10 - 50)
    let selfLearning: number;
    if (student) {
      const selfEvals = evaluations.filter((e) => e.studentId === student.id && e.type === 'self');
      if (selfEvals.length > 0) {
        selfLearning = Math.round(selfEvals.reduce((s, e) => s + e.score, 0) / selfEvals.length);
      } else {
        selfLearning = Math.max(0, Math.min(100, Math.round(65 + ((student.enrollmentScore || 500) / 10 - 50))));
      }
    } else {
      selfLearning = 65;
    }
    // 问题解决: 当前学生该层级已提交作业的平均分
    const hwScores = homeworkData
      .filter((hw) => hw.submitted && hw.score !== null)
      .map((hw) => hw.score as number);
    const problemSolving = hwScores.length > 0
      ? Math.round(hwScores.reduce((s, v) => s + v, 0) / hwScores.length)
      : 0;

    return [
      { name: '理论学习', value: theory },
      { name: '实践能力', value: practice },
      { name: '创新思维', value: innovation },
      { name: '团队协作', value: collaboration },
      { name: '自主学习', value: selfLearning },
      { name: '问题解决', value: problemSolving },
    ];
  }, [studentGrades, evaluations, studentGroups, student, homeworkData, assignedTier]);

  if (!course) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">课程不存在</p>
        <Link to="/student/courses" className="text-blue-500 hover:text-blue-600 mt-4 inline-block">返回课程列表</Link>
      </div>
    );
  }

  const handleDownload = (title: string, type: string, size: string) => {
    const content = `${title} - 资源文件\n类型: ${type}\n大小: ${size}\n下载时间: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitHomework = (hwId: string) => {
    const updatedAssignments = { ...homeworkAssignments };
    const tierAssignments = updatedAssignments[assignedTier].map((a) =>
      a.id === hwId ? { ...a, submitted: true, score: Math.round(65 + Math.random() * 25), feedback: 'AI已批改，建议继续优化细节', aiGraded: true } : a
    );
    updatedAssignments[assignedTier] = tierAssignments;
    setHomeworkData(updatedAssignments[assignedTier]);
  };

  const currentConfig = TIER_CONFIG[assignedTier];
  const tasks = layerTasks[assignedTier] || [];
  const resources = layerResources[assignedTier] || [];
  const assignments = homeworkAssignments[assignedTier] || [];

  const tabs = [
    { id: 'preview', label: '学前画像', icon: User },
    { id: 'tasks', label: '学习任务', icon: ClipboardList },
    { id: 'resources', label: '资源库', icon: BookOpen },
    { id: 'evaluation', label: '综合评价', icon: Award },
    { id: 'homework', label: '作业批改', icon: FileText },
  ];

  // 当前学生的待办提醒
  const studentReminders = evalReminders.filter(
    (r) => r.studentId === student?.id && r.status !== 'completed' && r.courseId === course.id
  );

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/student/courses" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{course.teacher} · {course.duration}课时</p>
          </div>
        </div>
      </div>

      {/* 评价待办提醒（截止前1周） */}
      {studentReminders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
            <Bell className="w-5 h-5" />
            评价提醒（即将截止）
          </div>
          <div className="space-y-1">
            {studentReminders.map((r) => (
              <p key={r.id} className="text-sm text-amber-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                第{r.sessionNumber}次评价截止于 {r.deadline}
                {r.status === 'overdue' && <span className="text-red-500 font-medium">（已逾期）</span>}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* AI分层信息栏 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                AI智能分层 · 已为您分配层级
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  assignedTier === 'excellent' ? 'bg-purple-100 text-purple-700' :
                  assignedTier === 'advanced' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{TIER_CONFIG[assignedTier].label}</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {grades.length > 0
                  ? `基于上学期 ${grades.length} 门课程成绩综合判定`
                  : `基于入学成绩(${student?.enrollmentScore || '无'}分)判定层级`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 固定层级显示 */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-100 shadow-sm">
        <span className="text-sm text-gray-500">当前层级：</span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${
          assignedTier === 'excellent' ? 'bg-purple-500' :
          assignedTier === 'advanced' ? 'bg-amber-500' : 'bg-blue-500'
        }`}>{currentConfig.label}</span>
      </div>

      <p className="text-sm text-gray-500">{currentConfig.desc}</p>

      {/* 分层内容卡片 */}
      <div className={`bg-white rounded-xl border ${currentConfig.border} shadow-sm overflow-hidden`}>
        <div className={`px-6 py-3 ${currentConfig.color.replace('bg-', 'bg-').replace('-500', '-50')} border-b ${currentConfig.border}`}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">当前层级：</span>
            <span className={`text-sm font-semibold ${currentConfig.color.replace('bg-', 'text-')}`}>{currentConfig.label}</span>
          </div>
        </div>

        {/* Tab 导航 */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 内容 */}
        <div className="p-6">
          {/* 学前画像 */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">学前画像</h3>
                <span className="text-xs text-gray-400">（基于AI分析）</span>
              </div>

              {/* AI层级判定说明 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">AI层级判定依据</span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  {grades.length > 0 ? (
                    <>
                      <p>· 参考上学期 {grades.length} 门课程成绩，平均分约 {Math.round(studentGrades.reduce((s, g) => s + g.score, 0) / studentGrades.length)}</p>
                      <p>· AI判定层级：<strong className={assignedTier === 'excellent' ? 'text-purple-600' : assignedTier === 'advanced' ? 'text-amber-600' : 'text-blue-600'}>{TIER_CONFIG[assignedTier].label}</strong></p>
                      <p>· 固定层级，不可手动切换</p>
                    </>
                  ) : (
                    <>
                      <p>· 无上学期课程成绩数据，基于入学成绩（{student?.enrollmentScore || '无'}分）判定</p>
                      <p>· AI判定层级：<strong className={assignedTier === 'excellent' ? 'text-purple-600' : assignedTier === 'advanced' ? 'text-amber-600' : 'text-blue-600'}>{TIER_CONFIG[assignedTier].label}</strong></p>
                      <p>· 固定层级，不可手动切换</p>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-sm text-blue-700">基础水平</p>
                  <p className="font-semibold text-gray-900 mt-1">{preLearningProfile.baseLevel}</p>
                  <p className="text-xs text-gray-500 mt-2">参考相关课程成绩综合判断</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                  <p className="text-sm text-amber-700">课程关联度</p>
                  <p className="font-semibold text-gray-900 mt-1">{preLearningProfile.prereqStatus}</p>
                  <p className="text-xs text-gray-500 mt-2">{preLearningProfile.prereqWarning}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                  <p className="text-sm text-emerald-700">学习稳定性</p>
                  <p className="font-semibold text-gray-900 mt-1">{preLearningProfile.stabilityLevel}</p>
                  <p className="text-xs text-gray-500 mt-2">标准差 {preLearningProfile.stabilityStd.toFixed(1)} · {preLearningProfile.stabilityHint}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-sm text-purple-700">能力倾向</p>
                  <p className="font-semibold text-gray-900 mt-1">{preLearningProfile.abilityTendency}</p>
                  <p className="text-xs text-gray-500 mt-2">{preLearningProfile.abilityHint}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">学习风格</p>
                  <p className="font-semibold text-gray-900">{preLearningProfile.learningStyle}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">推荐路径</p>
                  <p className="font-semibold text-gray-900">{preLearningProfile.recommendedPath}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">{currentConfig.label}目标</p>
                  <p className="font-semibold text-gray-900">{currentConfig.desc}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">学习轨迹</p>
                  <p className="font-semibold text-gray-900">已参与 {studentEnrollments.length} 门课程 · 现有成绩 {studentGrades.length} 条</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                  <p className="text-sm font-medium text-emerald-700 mb-2">优势</p>
                  <ul className="space-y-1">
                    {preLearningProfile.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                  <p className="text-sm font-medium text-amber-700 mb-2">待提升</p>
                  <ul className="space-y-1">
                    {preLearningProfile.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-amber-600 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 学习能力雷达图 */}
              <div className="bg-white rounded-lg border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-700 mb-4">学习能力雷达图</p>
                <div className="flex justify-center">
                  <svg viewBox="0 0 600 600" className="w-full max-w-sm">
                    {(() => {
                      const cx = 300, cy = 300, maxR = 190, levels = 5, step = maxR / levels;
                      const angles = dynamicRadarData.map((_, i) => (i * 2 * Math.PI / dynamicRadarData.length - Math.PI / 2));
                      const getPoint = (r: number, angle: number) => `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
                      return (
                        <g>
                          {/* Grid levels */}
                          {[1, 2, 3, 4, 5].map((level) => {
                            const r = level * step;
                            const points = angles.map((a) => getPoint(r, a)).join(' ');
                            return <polygon key={level} points={points} fill="none" stroke={level === 5 ? '#93c5fd' : '#e5e7eb'} strokeWidth={level === 5 ? 1.5 : 1} />;
                          })}
                          {/* Axis lines */}
                          {angles.map((angle, i) => (
                            <line key={i} x1={cx} y1={cy} x2={getPoint(maxR, angle).split(',')[0]} y2={getPoint(maxR, angle).split(',')[1]} stroke="#e5e7eb" strokeWidth={1} />
                          ))}
                          {/* Data polygon */}
                          <polygon
                            points={dynamicRadarData.map((d, i) => {
                              const r = d.value * 1.5;
                              return getPoint(r, angles[i]);
                            }).join(' ')}
                            fill="rgba(59, 130, 246, 0.2)"
                            stroke="#3b82f6"
                            strokeWidth={2}
                          />
                          {/* Data points */}
                          {dynamicRadarData.map((d, i) => {
                            const r = d.value * 1.5;
                            const [x, y] = getPoint(r, angles[i]).split(',').map(Number);
                            return <circle key={i} cx={x} cy={y} r={4} fill="#3b82f6" />;
                          })}
                          {/* Labels with offset adjustments */}
                          {dynamicRadarData.map((d, i) => {
                            const angle = angles[i];
                            const labelR = maxR + 22;
                            const x = cx + labelR * Math.cos(angle);
                            const y = cy + labelR * Math.sin(angle);
                            let anchor: 'start' | 'middle' | 'end' = 'middle';
                            if (Math.abs(Math.cos(angle)) < 0.1) anchor = 'middle';
                            else if (Math.cos(angle) > 0) anchor = 'start';
                            else anchor = 'end';
                            return (
                              <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize={11} fill="#6b7280">
                                {d.name} ({d.value})
                              </text>
                            );
                          })}
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* 学习任务 */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-gray-900">{currentConfig.label}学习任务</h3>
                <span className="text-xs text-gray-400">共 {tasks.length} 项</span>
              </div>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-500">截止日期：{task.deadline}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">待完成</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 资源库 */}
          {activeTab === 'resources' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">{currentConfig.label}资源库</h3>
                <span className="text-xs text-gray-400">{resources.length}项资源</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {resources.map((res, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      res.type === '文档' ? 'bg-blue-100 text-blue-600' :
                      res.type === '视频' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{res.title}</p>
                      <p className="text-xs text-gray-500">{res.type} · {res.size}</p>
                    </div>
                    <span className="text-xs text-blue-500 hover:text-blue-600 cursor-pointer" onClick={() => handleDownload(res.title, res.type, res.size)}>下载</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 综合评价 */}
          {activeTab === 'evaluation' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900">综合评价</h3>
              </div>
              <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600">82</p>
                  <p className="text-sm text-gray-500 mt-1">综合评分</p>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {[
                    { name: '知识掌握', score: 85 },
                    { name: '实践能力', score: 78 },
                    { name: '创新思维', score: 72 },
                    { name: '学习态度', score: 90 },
                  ].map((dim) => (
                    <div key={dim.name} className="bg-white/80 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">{dim.name}</span>
                        <span className="text-sm font-semibold text-gray-900">{dim.score}</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-1.5">
                        <div className="h-full rounded-full bg-purple-400" style={{ width: `${dim.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                整体表现良好，知识掌握扎实。建议在创新思维方面多加练习，积极参与项目实践。
              </p>
            </div>
          )}

          {/* 作业(AI批改) */}
          {activeTab === 'homework' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold text-gray-900">{currentConfig.label}作业 (AI批改)</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">AI智能批改</span>
              </div>
              <div className="space-y-3">
                {homeworkData.map((hw) => (
                  <div key={hw.id} className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{hw.title}</p>
                          <p className="text-xs text-gray-500">
                            {hw.submitted ? `已提交 · AI批改完成` : '未提交'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hw.submitted && hw.score !== null && (
                          <span className="font-semibold text-emerald-600">{hw.score}分</span>
                        )}
                        <button onClick={() => hw.submitted ? setShowAIFeedback(showAIFeedback === hw.id ? null : hw.id) : handleSubmitHomework(hw.id)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            hw.submitted
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}>
                          {hw.submitted ? '查看批改' : '提交作业'}
                        </button>
                      </div>
                    </div>
                    {showAIFeedback === hw.id && hw.submitted && (
                      <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4 border border-emerald-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Bot className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-medium text-emerald-700">AI批改反馈</span>
                          </div>
                          <p className="text-sm text-gray-600">{hw.feedback}</p>
                          <div className="flex items-center gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-4 h-4 ${star <= Math.round(hw.score! / 20) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
