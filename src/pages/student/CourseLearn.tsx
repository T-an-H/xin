import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '@/store';
import { ArrowLeft, Layers, User, ClipboardList, BookOpen, Award, FileText, Bot, ChevronRight, CheckCircle, Clock, Star } from 'lucide-react';

const layers = [
  {
    id: 'basic', label: '基础层', icon: Layers, color: 'bg-blue-500', border: 'border-blue-200',
    desc: '掌握课程核心基础知识，打好学习根基',
    tasks: [
      { id: 't1', title: '观看入门视频教程', status: 'completed', deadline: '2026-07-20' },
      { id: 't2', title: '阅读核心概念文档', status: 'completed', deadline: '2026-07-22' },
      { id: 't3', title: '完成基础练习题', status: 'in_progress', deadline: '2026-07-25' },
    ],
    resources: [
      { title: '入门指南PDF', type: '文档', size: '2.3MB' },
      { title: '基础概念讲解视频', type: '视频', size: '156MB' },
      { title: '常见问题FAQ', type: '文档', size: '0.5MB' },
    ],
  },
  {
    id: 'advanced', label: '进阶层', icon: Layers, color: 'bg-amber-500', border: 'border-amber-200',
    desc: '深入学习核心知识，提升应用能力',
    tasks: [
      { id: 't4', title: '完成进阶项目实践', status: 'pending', deadline: '2026-07-28' },
      { id: 't5', title: '参与小组讨论', status: 'pending', deadline: '2026-07-30' },
      { id: 't6', title: '撰写学习总结报告', status: 'pending', deadline: '2026-08-01' },
    ],
    resources: [
      { title: '进阶实战案例集', type: '文档', size: '4.1MB' },
      { title: '项目模板代码', type: '代码', size: '12MB' },
      { title: '专家讲座视频', type: '视频', size: '280MB' },
    ],
  },
  {
    id: 'excellent', label: '卓越层', icon: Layers, color: 'bg-purple-500', border: 'border-purple-200',
    desc: '挑战高阶内容，追求卓越表现',
    tasks: [
      { id: 't7', title: '完成创新项目设计', status: 'locked', deadline: '2026-08-05' },
      { id: 't8', title: '论文阅读与点评', status: 'locked', deadline: '2026-08-08' },
      { id: 't9', title: '参加能力测评', status: 'locked', deadline: '2026-08-10' },
    ],
    resources: [
      { title: '前沿论文合集', type: '文档', size: '8.5MB' },
      { title: '高级算法实现', type: '代码', size: '3.2MB' },
      { title: '行业专家访谈', type: '视频', size: '320MB' },
    ],
  },
];

const assignments = [
  { id: 'a1', title: '基础练习-数据结构', submitted: true, score: 85, feedback: '代码规范，逻辑清晰，建议优化算法复杂度', aiGraded: true },
  { id: 'a2', title: '项目实践-小型应用开发', submitted: true, score: 78, feedback: '功能完整，界面美观，可增加单元测试覆盖', aiGraded: true },
  { id: 'a3', title: '进阶作业-性能优化', submitted: false, score: null, feedback: '', aiGraded: false },
];

const evaluation = {
  overall: 82,
  dimensions: [
    { name: '知识掌握', score: 85 },
    { name: '实践能力', score: 78 },
    { name: '创新思维', score: 72 },
    { name: '学习态度', score: 90 },
  ],
};

export default function CourseLearn() {
  const { id } = useParams();
  const { courses, students, enrollments, grades, currentUser } = useStore();
  const course = courses.find((c) => c.id === id);
  const [activeLayer, setActiveLayer] = useState('basic');
  const [activeTab, setActiveTab] = useState('preview');
  const [showAIFeedback, setShowAIFeedback] = useState<string | null>(null);

  const student = students.find((s) => s.name === currentUser);
  const studentGrades = student ? grades.filter((g) => g.studentId === student.id) : [];
  const studentEnrollments = student ? enrollments.filter((e) => e.studentId === student.id) : [];

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

  if (!course) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">课程不存在</p>
        <Link to="/student/courses" className="text-blue-500 hover:text-blue-600 mt-4 inline-block">返回课程列表</Link>
      </div>
    );
  }

  const currentLayer = layers.find((l) => l.id === activeLayer)!;
  const tabs = [
    { id: 'preview', label: '学前画像', icon: User },
    { id: 'tasks', label: '学习任务', icon: ClipboardList },
    { id: 'resources', label: '资源库', icon: BookOpen },
    { id: 'evaluation', label: '综合评价', icon: Award },
    { id: 'homework', label: '作业批改', icon: FileText },
  ];

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

      {/* AI分层导航 */}
      <div className="bg-white rounded-xl p-1 border border-gray-100 shadow-sm inline-flex">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;
          return (
            <button key={layer.id} onClick={() => setActiveLayer(layer.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? layer.color + ' text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              <Icon className="w-4 h-4" />
              {layer.label}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-gray-500">{currentLayer.desc}</p>

      {/* 分层内容卡片 */}
      <div className={`bg-white rounded-xl border ${currentLayer.border} shadow-sm overflow-hidden`}>
        <div className={`px-6 py-3 ${currentLayer.color.replace('bg-', 'bg-').replace('-500', '-50')} border-b ${currentLayer.border}`}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">当前层级：</span>
            <span className={`text-sm font-semibold ${currentLayer.color.replace('bg-', 'text-')}`}>{currentLayer.label}</span>
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
                  <p className="text-sm text-gray-500">{currentLayer.label}目标</p>
                  <p className="font-semibold text-gray-900">{currentLayer.desc}</p>
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
            </div>
          )}

          {/* 学习任务 */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-gray-900">{currentLayer.label}学习任务</h3>
              </div>
              <div className="space-y-3">
                {currentLayer.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                      task.status === 'in_progress' ? 'bg-amber-100 text-amber-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {task.status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
                       task.status === 'in_progress' ? <Clock className="w-4 h-4" /> :
                       <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-500">截止日期：{task.deadline}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                      task.status === 'in_progress' ? 'bg-amber-50 text-amber-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {task.status === 'completed' ? '已完成' : task.status === 'in_progress' ? '进行中' : '未开始'}
                    </span>
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
                <h3 className="font-semibold text-gray-900">{currentLayer.label}资源库</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentLayer.resources.map((res, i) => (
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
                    <span className="text-xs text-blue-500 hover:text-blue-600">下载</span>
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
                  <p className="text-4xl font-bold text-purple-600">{evaluation.overall}</p>
                  <p className="text-sm text-gray-500 mt-1">综合评分</p>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {evaluation.dimensions.map((dim) => (
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
                <h3 className="font-semibold text-gray-900">作业 (AI批改)</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">AI智能批改</span>
              </div>
              <div className="space-y-3">
                {assignments.map((hw) => (
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
                        <button onClick={() => setShowAIFeedback(showAIFeedback === hw.id ? null : hw.id)}
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