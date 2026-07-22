<template>
  <div id="student-course-learn-root"></div>

  <!-- AI 分层测试弹窗 -->
  <Modal :is-open="aiTestOpen" :on-close="closeAITest" title="AI 分层测试" max-width="max-w-2xl">
    <template v-if="!testSubmitted">
      <div class="space-y-6">
        <!-- 进度 -->
        <div class="flex items-center justify-between">
          <span class="text-sm text-brand-400">已答 {{ answeredCount }}/{{ totalQuestions }} 题</span>
          <span class="text-xs text-brand-400">每题 10 分，满分 {{ totalQuestions * 10 }} 分</span>
        </div>
        <div class="w-full h-1.5 bg-brand-400/10 rounded-full overflow-hidden">
          <div class="h-full bg-brand-600 rounded-full transition-all"
            :style="{ width: (answeredCount / totalQuestions * 100) + '%' }"></div>
        </div>

        <!-- 题目列表 -->
        <div v-for="(q, i) in testQuestions" :key="q.id"
          class="p-4 rounded-lg border"
          :class="testAnswers[q.id] !== undefined ? 'border-brand-400 bg-brand-600/10' : 'border-brand-400/20'">
          <p class="text-sm font-medium text-brand-900 mb-3">
            <span class="text-brand-600 font-bold">{{ i + 1 }}.</span>
            {{ q.question }}
            <span class="ml-1 text-[10px] text-brand-400">({{ q.type === 'true_false' ? '判断题' : '单选题' }})</span>
          </p>
          <div class="space-y-1.5">
            <button v-for="(opt, oi) in q.options" :key="oi"
              @click="selectAnswer(q.id, q.type === 'true_false' ? (oi === 0) : oi)"
              class="w-full text-left px-3 py-2 rounded-lg text-sm border transition-all"
              :class="testAnswers[q.id] === (q.type === 'true_false' ? (oi === 0) : oi)
                ? 'border-brand-600 bg-brand-600/15 text-brand-800 font-medium'
                : 'border-brand-400/30 hover:border-brand-400 text-brand-800'">
              {{ opt }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between mt-6 pt-4 border-t border-brand-400/20">
        <span v-if="!allAnswered" class="text-xs text-brand-600">请完成所有题目后再提交</span>
        <span v-else class="text-xs text-brand-600">所有题目已作答</span>
        <button @click="submitAITest" :disabled="!allAnswered"
          class="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="allAnswered ? 'bg-brand-600 hover:bg-brand-800 text-white' : 'bg-brand-400/10 text-brand-400 cursor-not-allowed'">
          提交并判定层级
        </button>
      </div>
    </template>

    <!-- 结果展示 -->
    <template v-else>
      <div class="text-center py-6 space-y-4">
        <div class="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
          :class="testScore >= 80 ? 'bg-brand-600/10' : testScore >= 60 ? 'bg-brand-600/15' : 'bg-brand-400/10'">
          <Award class="w-10 h-10" :class="testScore >= 80 ? 'text-brand-600' : testScore >= 60 ? 'text-brand-600' : 'text-brand-600'" />
        </div>
        <div>
          <p class="text-4xl font-bold text-brand-900">{{ testScore }}<span class="text-lg text-brand-400">/{{ totalQuestions * 10 }}</span></p>
          <p class="text-sm text-brand-400 mt-1">得分</p>
        </div>
        <div>
          <span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-base font-bold"
            :class="tierBadgeClass">
            <Layers class="w-5 h-5" />
            {{ store.determineTier(testScore) === 'excellent' ? '卓越层' : store.determineTier(testScore) === 'advanced' ? '进阶层' : '基础层' }}
          </span>
        </div>
        <p class="text-xs text-brand-400">本次分层结果已在系统中锁定，本学期不可修改</p>
        <button @click="closeAITest"
          class="px-8 py-2.5 bg-brand-600 hover:bg-brand-800 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2">
          <CheckCircle class="w-4 h-4" />
          确认并查看
        </button>
      </div>
    </template>
  </Modal>

  <!-- StudentEvaluation 子组件 -->
  <div v-if="activeTab === 'evaluations' && !isReadOnly" style="display: none;">
    <StudentEvaluation :course-id="courseId" :student-id="myStudent?.id || ''"
      :student-name="myStudent?.name || store.currentUser || ''" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { Award, CheckCircle, Layers } from 'lucide-vue-next'
import StudentEvaluation from '@/components/StudentEvaluation.vue'
import type { AITierQuestion, LearningTier } from '@/types'
import Modal from '@/components/Modal.vue'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const courseId = route.params.id as string
const myStudent = computed(() => store.students.find((s) => s.name === store.currentUser))
const activeTab = ref('knowledge_graph')

onMounted(() => {
  store.pushNearDeadlineEvalReminders()
  const el = document.getElementById('student-course-learn-root')
  if (el) renderCourseLearn(el)
})

const tabs = [
  { id: 'ai_tier', label: 'AI分层', icon: 'layers' },
  { id: 'knowledge_graph', label: '知识图谱', icon: 'gitBranch' },
  { id: 'tasks', label: '任务', icon: 'edit3' },
  { id: 'resources', label: '资源', icon: 'fileText' },
  { id: 'homework', label: '作业', icon: 'bookOpen' },
  { id: 'evaluations', label: '评价填写', icon: 'clipboardCheck' },
  { id: 'eval_overview', label: '综合评价', icon: 'award' },
]

const course = computed(() => store.courses.find((c) => c.id === courseId))
const isReadOnly = computed(() => course.value?.status !== 'active')
const myEnrollment = computed(() =>
  store.enrollments.find((e) => e.courseId === courseId && e.studentId === myStudent.value?.id)
)
const myGrade = computed(() =>
  store.grades.find((g) => g.courseId === courseId && g.studentId === myStudent.value?.id)
)

// ===== 任务（按层级区分） =====
const courseTasks = computed(() => {
  const tier = tierFinalized.value ? myTier.value : 'basic'
  const basicTasks = [
    { id: '1', title: '完成第1章基础概念学习', dueDate: '2025-03-15', completed: true, score: 85 },
    { id: '2', title: '完成第2章基础知识练习', dueDate: '2025-03-22', completed: true, score: 78 },
    { id: '3', title: '完成第3章基础巩固任务', dueDate: '2025-03-29', completed: false },
    { id: '4', title: '完成第4章基础应用练习', dueDate: '2025-04-05', completed: false },
  ]
  const advancedTasks = [
    { id: '1', title: '完成第1章核心概念深入学习', dueDate: '2025-03-15', completed: true, score: 92 },
    { id: '2', title: '完成第2章进阶实践项目', dueDate: '2025-03-22', completed: true, score: 88 },
    { id: '3', title: '完成第3章拓展分析任务', dueDate: '2025-03-29', completed: false },
    { id: '4', title: '完成第4章综合应用项目', dueDate: '2025-04-05', completed: false },
  ]
  const excellentTasks = [
    { id: '1', title: '完成第1章高阶理论探究', dueDate: '2025-03-15', completed: true, score: 97 },
    { id: '2', title: '完成第2章创新实践项目', dueDate: '2025-03-22', completed: true, score: 95 },
    { id: '3', title: '完成第3章跨章节整合任务', dueDate: '2025-03-29', completed: false },
    { id: '4', title: '完成开源项目贡献任务', dueDate: '2025-04-05', completed: false },
  ]
  if (tier === 'excellent') return excellentTasks
  if (tier === 'advanced') return advancedTasks
  return basicTasks
})

// ===== 资源（按层级区分） =====
const courseResources = computed(() => {
  const tier = tierFinalized.value ? myTier.value : 'basic'
  const basicResources = [
    { id: '1', title: '课程大纲.pdf', type: 'PDF', size: '2.3 MB' },
    { id: '2', title: '第1章课件（基础版）.pptx', type: 'PPT', size: '5.1 MB' },
    { id: '3', title: '基础参考书目.pdf', type: 'PDF', size: '1.8 MB' },
    { id: '4', title: '基础练习题集.docx', type: 'DOC', size: '0.5 MB' },
  ]
  const advancedResources = [
    { id: '1', title: '课程大纲.pdf', type: 'PDF', size: '2.3 MB' },
    { id: '2', title: '第1-3章完整课件.pptx', type: 'PPT', size: '8.5 MB' },
    { id: '3', title: '进阶参考书目及论文合集.pdf', type: 'PDF', size: '3.2 MB' },
    { id: '4', title: '项目案例分析集.docx', type: 'DOC', size: '1.1 MB' },
    { id: '5', title: '实战项目模板.zip', type: 'ZIP', size: '4.7 MB' },
  ]
  const excellentResources = [
    { id: '1', title: '课程大纲.pdf', type: 'PDF', size: '2.3 MB' },
    { id: '2', title: '全章节高阶课件合集.pptx', type: 'PPT', size: '12.3 MB' },
    { id: '3', title: '前沿领域文献综述.pdf', type: 'PDF', size: '4.1 MB' },
    { id: '4', title: '竞赛项目案例集.docx', type: 'DOC', size: '2.8 MB' },
    { id: '5', title: '开源项目代码库.zip', type: 'ZIP', size: '8.2 MB' },
    { id: '6', title: '学术论文写作指南.pdf', type: 'PDF', size: '1.5 MB' },
  ]
  if (tier === 'excellent') return excellentResources
  if (tier === 'advanced') return advancedResources
  return basicResources
})

// ===== 作业（按层级区分） =====
const courseHomework = computed(() => {
  const tier = tierFinalized.value ? myTier.value : 'basic'
  const basicHomework = [
    { id: '1', title: '基础概念填空题', dueDate: '2025-03-20', submitted: true },
    { id: '2', title: '基础代码练习题', dueDate: '2025-03-27', submitted: true },
    { id: '3', title: '基础应用题', dueDate: '2025-04-03', submitted: false },
  ]
  const advancedHomework = [
    { id: '1', title: '进阶编程作业', dueDate: '2025-03-20', submitted: true },
    { id: '2', title: '综合案例分析报告', dueDate: '2025-03-27', submitted: true },
    { id: '3', title: '小型项目开发作业', dueDate: '2025-04-03', submitted: false },
    { id: '4', title: '代码审查与重构作业', dueDate: '2025-04-10', submitted: false },
  ]
  const excellentHomework = [
    { id: '1', title: '高阶算法设计与实现', dueDate: '2025-03-20', submitted: true },
    { id: '2', title: '创新项目研究作业', dueDate: '2025-03-27', submitted: true },
    { id: '3', title: '跨学科综合应用作业', dueDate: '2025-04-03', submitted: false },
    { id: '4', title: '学术论文摘要与框架', dueDate: '2025-04-10', submitted: false },
  ]
  if (tier === 'excellent') return excellentHomework
  if (tier === 'advanced') return advancedHomework
  return basicHomework
})

// ===== AI 分层 =====
const tierRecord = computed(() =>
  myStudent.value ? store.getStudentTier(courseId, myStudent.value.id) : null
)
const myTier = computed<LearningTier>(() => tierRecord.value?.tier ?? 'basic')
const myTierScore = computed(() => tierRecord.value?.score ?? 0)
const tierFinalized = computed(() => tierRecord.value !== null)
const firstClassEnded = computed(() => store.isFirstClassStarted(courseId))

const tierLabel = computed(() => {
  const map = { basic: '基础层', advanced: '进阶层', excellent: '卓越层' }
  return tierFinalized.value ? map[myTier.value] : '未分层'
})

const tierBadgeClass = computed(() => {
  if (!tierFinalized.value) return 'bg-brand-400/10 text-brand-400 border border-brand-400/30'
  const map = {
    basic: 'bg-brand-400/10 text-brand-600 border border-brand-400',
    advanced: 'bg-brand-600/10 text-brand-600 border border-brand-400',
    excellent: 'bg-brand-600/10 text-brand-600 border border-brand-400',
  }
  return map[myTier.value]
})

const tierComparison = computed(() => [
  { level: 'basic' as const, label: '基础层', color: 'text-brand-600', desc: '初步掌握课程基础知识，建议加强练习与复习' },
  { level: 'advanced' as const, label: '进阶层', color: 'text-brand-600', desc: '较好掌握课程核心知识，可尝试拓展深入学习' },
  { level: 'excellent' as const, label: '卓越层', color: 'text-brand-600', desc: '全面掌握课程内容，具备独立项目实践能力' },
])

// ===== AI 分层测试弹窗 =====
const aiTestOpen = ref(false)
const testQuestions = ref<AITierQuestion[]>([])
const testAnswers = ref<Record<string, number | boolean>>({})
const testSubmitted = ref(false)
const testScore = ref(0)

function getMockAITierQuestions(courseId: string): AITierQuestion[] {
  const questionSets: Record<string, AITierQuestion[]> = {
    'course-1': [
      { id: 'q1', type: 'single_choice', question: 'React 中 JSX 最终会被编译成什么？', options: ['原生 HTML', 'JavaScript 函数调用', 'CSS 代码', 'XML 标记'], answer: 1, score: 10 },
      { id: 'q2', type: 'single_choice', question: '以下哪个 Hook 用于管理副作用？', options: ['useState', 'useEffect', 'useContext', 'useReducer'], answer: 1, score: 10 },
      { id: 'q3', type: 'true_false', question: 'React 组件名必须大写字母开头', options: ['正确', '错误'], answer: true, score: 10 },
      { id: 'q4', type: 'single_choice', question: 'Props 在组件间是？', options: ['可变的', '只读的', '异步的', '全局的'], answer: 1, score: 10 },
      { id: 'q5', type: 'true_false', question: 'useState 的更新是同步的', options: ['正确', '错误'], answer: false, score: 10 },
      { id: 'q6', type: 'single_choice', question: '以下哪个不是 React 生命周期方法？', options: ['componentDidMount', 'componentWillUnmount', 'componentRendered', 'componentDidUpdate'], answer: 2, score: 10 },
      { id: 'q7', type: 'true_false', question: '虚拟 DOM 可以提高页面渲染性能', options: ['正确', '错误'], answer: true, score: 10 },
      { id: 'q8', type: 'single_choice', question: 'React 中列表渲染需要使用什么属性？', options: ['id', 'key', 'ref', 'index'], answer: 1, score: 10 },
      { id: 'q9', type: 'single_choice', question: '以下哪个是受控组件的特征？', options: ['由 DOM 控制状态', '由 React state 控制表单值', '使用 ref 获取值', '无需事件处理'], answer: 1, score: 10 },
      { id: 'q10', type: 'true_false', question: 'React.Fragment 可以包含 key 属性', options: ['正确', '错误'], answer: true, score: 10 },
    ],
    'course-2': [
      { id: 'q1', type: 'single_choice', question: 'Python 中列表使用什么符号？', options: ['()', '[]', '{}', '<>'], answer: 1, score: 10 },
      { id: 'q2', type: 'single_choice', question: 'NumPy 数组相比 Python 列表的主要优势是？', options: ['支持更多数据类型', '向量化运算速度快', '占用更少内存', '以上都是'], answer: 3, score: 10 },
      { id: 'q3', type: 'true_false', question: 'Pandas 的 DataFrame 是二维数据结构', options: ['正确', '错误'], answer: true, score: 10 },
      { id: 'q4', type: 'single_choice', question: '以下哪个不是数据可视化的常用库？', options: ['Matplotlib', 'Seaborn', 'NumPy', 'Plotly'], answer: 2, score: 10 },
      { id: 'q5', type: 'true_false', question: '数据清洗是数据分析中最耗时的环节之一', options: ['正确', '错误'], answer: true, score: 10 },
      { id: 'q6', type: 'single_choice', question: '描述性统计不包括以下哪项？', options: ['均值', '标准差', '回归系数', '中位数'], answer: 2, score: 10 },
      { id: 'q7', type: 'true_false', question: '机器学习属于监督学习的一种方法', options: ['正确', '错误'], answer: false, score: 10 },
      { id: 'q8', type: 'single_choice', question: '特征工程的目的是什么？', options: ['增加数据量', '提升模型性能', '减少计算资源', '简化算法'], answer: 1, score: 10 },
      { id: 'q9', type: 'single_choice', question: '以下哪个是降维算法？', options: ['K-Means', 'PCA', '线性回归', '决策树'], answer: 1, score: 10 },
      { id: 'q10', type: 'true_false', question: '交叉验证可以有效防止过拟合', options: ['正确', '错误'], answer: true, score: 10 },
    ],
  }
  return questionSets[courseId] || questionSets['course-1']
}

function openAITest() {
  testQuestions.value = getMockAITierQuestions(courseId)
  testAnswers.value = {}
  testSubmitted.value = false
  testScore.value = 0
  aiTestOpen.value = true
}

function selectAnswer(questionId: string, answer: number | boolean) {
  testAnswers.value = { ...testAnswers.value, [questionId]: answer }
}

function submitAITest() {
  let score = 0
  for (const q of testQuestions.value) {
    const userAnswer = testAnswers.value[q.id]
    if (userAnswer === q.answer) {
      score += q.score
    }
  }
  testScore.value = score
  testSubmitted.value = true

  if (myStudent.value) {
    store.submitAITierTest(courseId, myStudent.value.id, score)
  }
}

function closeAITest() {
  aiTestOpen.value = false
}

const totalQuestions = computed(() => testQuestions.value.length)
const answeredCount = computed(() => Object.keys(testAnswers.value).length)
const allAnswered = computed(() => answeredCount.value === totalQuestions.value)

const aiTips = computed(() => {
  const tier = myTier.value
  if (tier === 'basic') {
    return [
      { title: '基础巩固', desc: '建议回看课程前3章内容，完成所有基础练习题' },
      { title: '重点突破', desc: '核心概念理解还不够深入，推荐观看配套视频讲解' },
      { title: '学习计划', desc: '建议每天安排1小时学习时间，周末可适当增加' },
    ]
  }
  if (tier === 'advanced') {
    return [
      { title: '拓展提升', desc: '基础扎实，可尝试完成课后拓展项目和实战练习' },
      { title: '查漏补缺', desc: '建议重点复习第4-5章薄弱环节，巩固整体知识体系' },
      { title: '能力进阶', desc: '推荐参加线上讨论和组队项目，提升协作实践能力' },
    ]
  }
  return [
    { title: '高阶挑战', desc: '已掌握课程核心内容，建议挑战高级项目和竞赛题目' },
    { title: '知识拓展', desc: '推荐阅读相关领域前沿资料，拓展知识深度和广度' },
    { title: '实践应用', desc: '可以尝试将所学知识应用到实际项目中，产出完整作品' },
  ]
})

// ===== 知识图谱 (节点 + 边) =====
interface KnowledgeNode {
  id: string
  label: string
  mastery: number
  importance: number
  category: 'foundation' | 'core' | 'advanced' | 'comprehensive'
  chapter: string
  description: string
}

interface KnowledgeEdge {
  source: string
  target: string
  relation: 'prerequisite' | 'related_to' | 'extends' | 'part_of'
  label: string
}

interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

function generateKnowledgeGraph(courseId: string, studentId: string): KnowledgeGraph {
  const evals = store.evaluations.filter((e) => e.courseId === courseId && e.studentId === studentId)
  const avgEvalScore = evals.length > 0
    ? Math.round(evals.reduce((s, e) => s + e.score, 0) / evals.length)
    : 60
  const progress = myEnrollment.value?.progress ?? 50

  const masteryFor = (base: number): number => Math.min(95, Math.max(20, (base + avgEvalScore + progress) / 2))

  const graphs: Record<string, { nodes: Omit<KnowledgeNode, 'mastery' | 'importance'>[]; edges: KnowledgeEdge[] }> = {
    'course-1': {
      nodes: [
        { id: 'kp-1', label: 'JS语法基础', category: 'foundation', chapter: '第1章', description: '变量、作用域、闭包、原型链等 JS 核心语法' },
        { id: 'kp-2', label: 'React核心概念', category: 'foundation', chapter: '第1章', description: 'JSX、组件化、Props、State 等 React 基础' },
        { id: 'kp-3', label: 'Hooks体系', category: 'core', chapter: '第2章', description: 'useState、useEffect、useContext 等内置 Hooks' },
        { id: 'kp-4', label: '状态管理', category: 'core', chapter: '第2章', description: 'Context API、Reducer、状态提升与共享策略' },
        { id: 'kp-5', label: '组件通信', category: 'core', chapter: '第3章', description: '父子传值、跨层通信、Event Bus 模式' },
        { id: 'kp-6', label: '路由与导航', category: 'core', chapter: '第3章', description: 'React Router 路由配置、嵌套路由、路由守卫' },
        { id: 'kp-7', label: '性能优化', category: 'advanced', chapter: '第4章', description: 'Memo、useCallback、Lazy Loading、虚拟列表' },
        { id: 'kp-8', label: '测试与调试', category: 'advanced', chapter: '第4章', description: 'Jest、React Testing Library、Debug 技巧' },
        { id: 'kp-9', label: '企业级架构', category: 'advanced', chapter: '第5章', description: 'Monorepo、微前端、CI/CD、工程化实践' },
        { id: 'kp-10', label: '综合项目实战', category: 'comprehensive', chapter: '项目', description: '从零搭建完整企业级应用的端到端能力' },
      ],
      edges: [
        { source: 'kp-1', target: 'kp-2', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-2', target: 'kp-3', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-2', target: 'kp-4', relation: 'related_to', label: '相关联' },
        { source: 'kp-3', target: 'kp-5', relation: 'extends', label: '拓展延伸' },
        { source: 'kp-4', target: 'kp-6', relation: 'related_to', label: '相关联' },
        { source: 'kp-3', target: 'kp-7', relation: 'extends', label: '深入扩展' },
        { source: 'kp-5', target: 'kp-8', relation: 'related_to', label: '实践关联' },
        { source: 'kp-7', target: 'kp-9', relation: 'extends', label: '进阶方向' },
        { source: 'kp-6', target: 'kp-9', relation: 'related_to', label: '组合构建' },
        { source: 'kp-9', target: 'kp-10', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-8', target: 'kp-10', relation: 'related_to', label: '实践关联' },
      ],
    },
    'course-2': {
      nodes: [
        { id: 'kp-1', label: 'Python基础', category: 'foundation', chapter: '第1章', description: '数据类型、控制流、函数、面向对象基础' },
        { id: 'kp-2', label: 'NumPy数组计算', category: 'foundation', chapter: '第1章', description: '多维数组、广播机制、向量化运算' },
        { id: 'kp-3', label: 'Pandas数据处理', category: 'core', chapter: '第2章', description: 'DataFrame操作、数据清洗、分组聚合' },
        { id: 'kp-4', label: '数据可视化', category: 'core', chapter: '第2章', description: 'Matplotlib、Seaborn 图表绘制' },
        { id: 'kp-5', label: '统计分析基础', category: 'core', chapter: '第3章', description: '描述统计、假设检验、相关分析' },
        { id: 'kp-6', label: '机器学习入门', category: 'advanced', chapter: '第4章', description: '监督学习、无监督学习基础算法' },
        { id: 'kp-7', label: '特征工程', category: 'advanced', chapter: '第4章', description: '特征选择、降维、数据变换' },
        { id: 'kp-8', label: '综合数据项目', category: 'comprehensive', chapter: '项目', description: '端到端数据分析项目实战能力' },
      ],
      edges: [
        { source: 'kp-1', target: 'kp-2', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-2', target: 'kp-3', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-3', target: 'kp-4', relation: 'related_to', label: '相关联' },
        { source: 'kp-3', target: 'kp-5', relation: 'extends', label: '深入方向' },
        { source: 'kp-5', target: 'kp-6', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-4', target: 'kp-7', relation: 'related_to', label: '实践关联' },
        { source: 'kp-6', target: 'kp-8', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-7', target: 'kp-8', relation: 'related_to', label: '实践关联' },
      ],
    },
    'course-14': {
      nodes: [
        { id: 'kp-1', label: '大模型基础', category: 'foundation', chapter: '第1章', description: 'Transformer 架构、预训练与微调概念' },
        { id: 'kp-2', label: 'Prompt工程', category: 'foundation', chapter: '第1章', description: '提示词设计、Few-shot、思维链技巧' },
        { id: 'kp-3', label: 'API调用集成', category: 'core', chapter: '第2章', description: 'OpenAI API、流式响应、Token管理' },
        { id: 'kp-4', label: 'RAG检索增强', category: 'core', chapter: '第2章', description: '文档索引、向量数据库、语义检索' },
        { id: 'kp-5', label: 'Agent智能体', category: 'core', chapter: '第3章', description: '函数调用、工具链、多智能体协作' },
        { id: 'kp-6', label: '微调与部署', category: 'advanced', chapter: '第3章', description: 'LoRA微调、模型量化、推理优化' },
        { id: 'kp-7', label: '应用安全与评估', category: 'advanced', chapter: '第4章', description: '内容过滤、越狱防护、效果评估' },
        { id: 'kp-8', label: 'AI应用综合开发', category: 'comprehensive', chapter: '项目', description: '打通前/后端+AI能力的完整应用构建' },
      ],
      edges: [
        { source: 'kp-1', target: 'kp-2', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-2', target: 'kp-3', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-1', target: 'kp-4', relation: 'related_to', label: '相关联' },
        { source: 'kp-3', target: 'kp-5', relation: 'extends', label: '进阶方向' },
        { source: 'kp-4', target: 'kp-5', relation: 'related_to', label: '组合构建' },
        { source: 'kp-1', target: 'kp-6', relation: 'extends', label: '深入方向' },
        { source: 'kp-5', target: 'kp-7', relation: 'related_to', label: '实践关联' },
        { source: 'kp-3', target: 'kp-8', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-5', target: 'kp-8', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-6', target: 'kp-8', relation: 'related_to', label: '实践关联' },
      ],
    },
    'course-3': {
      nodes: [
        { id: 'kp-1', label: '设计基础理论', category: 'foundation', chapter: '第1章', description: '色彩理论、排版原则、视觉层级' },
        { id: 'kp-2', label: '用户研究方法', category: 'foundation', chapter: '第1章', description: '用户访谈、问卷、可用性测试方法' },
        { id: 'kp-3', label: '信息架构', category: 'core', chapter: '第2章', description: '内容组织、导航设计、心智模型' },
        { id: 'kp-4', label: '交互设计', category: 'core', chapter: '第2章', description: '用户流程、交互模式、反馈机制' },
        { id: 'kp-5', label: '原型设计', category: 'core', chapter: '第3章', description: '线框图、高保真原型、设计系统' },
        { id: 'kp-6', label: '视觉设计进阶', category: 'advanced', chapter: '第3章', description: '动效设计、微交互、品牌视觉统一' },
        { id: 'kp-7', label: '设计交付与开发', category: 'advanced', chapter: '第4章', description: '标注切图、设计Token、开发协作' },
        { id: 'kp-8', label: '全链路设计项目', category: 'comprehensive', chapter: '项目', description: '从用户研究到上线跟踪的完整设计流程' },
      ],
      edges: [
        { source: 'kp-1', target: 'kp-3', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-2', target: 'kp-3', relation: 'related_to', label: '互补关联' },
        { source: 'kp-3', target: 'kp-4', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-4', target: 'kp-5', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-1', target: 'kp-6', relation: 'extends', label: '进阶方向' },
        { source: 'kp-5', target: 'kp-7', relation: 'related_to', label: '实践关联' },
        { source: 'kp-4', target: 'kp-8', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-5', target: 'kp-8', relation: 'prerequisite', label: '前置依赖' },
        { source: 'kp-6', target: 'kp-8', relation: 'related_to', label: '实践关联' },
      ],
    },
  }

  const defaultGraph = graphs['course-1']
  const courseGraph = graphs[courseId] || defaultGraph

  const catGroups: Record<string, typeof courseGraph.nodes> = {}
  for (const n of courseGraph.nodes) {
    if (!catGroups[n.category]) catGroups[n.category] = []
    catGroups[n.category].push(n)
  }
  const catIdx: Record<string, number> = {}

  const nodes: KnowledgeNode[] = courseGraph.nodes.map((n) => {
    const ci = catIdx[n.category] ?? 0
    catIdx[n.category] = ci + 1

    let importance = 2
    if (n.category === 'foundation' || n.category === 'comprehensive') importance = 3
    else if (n.category === 'core') importance = ci < 2 ? 3 : 2
    else if (n.category === 'advanced') importance = ci < 1 ? 2 : 1

    return {
      ...n,
      mastery: masteryFor(
        n.category === 'foundation' ? 70 + Math.floor(Math.random() * 20) :
        n.category === 'core' ? 50 + Math.floor(Math.random() * 30) :
        n.category === 'advanced' ? 30 + Math.floor(Math.random() * 35) :
        20 + Math.floor(Math.random() * 50)
      ),
      importance,
    }
  })

  return { nodes, edges: courseGraph.edges }
}

const knowledgeGraphData = computed<KnowledgeGraph>(() =>
  generateKnowledgeGraph(courseId, myStudent.value?.id || '')
)

// ===== 知识图谱 SVG 可视化 =====

function nodeLabel(id: string): string {
  const n = knowledgeGraphData.value.nodes.find((n) => n.id === id)
  return n ? n.label : id
}

const SVG_W = 900
const SVG_H = 800
const SVG_CX = SVG_W / 2
const SVG_CY = 460

const categoryRings = computed(() => {
  const rings: { rx: number; ry: number; color: string; label: string }[] = []
  const radii = [145, 240, 330, 415]
  const ringColors = ['#64B5F6', '#64B5F6', '#64B5F6', '#64B5F6']
  const ringLabels = ['基础知识', '核心知识', '进阶能力', '综合能力']
  for (let i = 0; i < radii.length; i++) {
    rings.push({ rx: radii[i], ry: radii[i] * 0.78, color: ringColors[i], label: ringLabels[i] })
  }
  return rings
})

const relationLegend = [
  { key: 'prerequisite', label: '前置依赖', color: '#1E88E5', dash: '' },
  { key: 'related_to', label: '相关联', color: '#64B5F6', dash: '5,4' },
  { key: 'extends', label: '拓展延伸', color: '#1E88E5', dash: '3,5' },
  { key: 'part_of', label: '组成关系', color: '#1E88E5', dash: '7,4' },
]

const categoryColors = [
  { key: 'foundation', label: '基础知识', light: '#aac4dd', mid: '#64B5F6', deep: '#1E88E5' },
  { key: 'core', label: '核心知识', light: '#aac4dd', mid: '#64B5F6', deep: '#1E88E5' },
  { key: 'advanced', label: '进阶能力', light: '#aac4dd', mid: '#64B5F6', deep: '#1E88E5' },
  { key: 'comprehensive', label: '综合能力', light: '#aac4dd', mid: '#64B5F6', deep: '#1E88E5' },
]

function categoryColorMap(cat: string): { light: string; mid: string; deep: string } {
  return categoryColors.find((c) => c.key === cat) || categoryColors[0]
}

function bubbleColor(mastery: number, category: string): string {
  const cc = categoryColorMap(category)
  if (mastery >= 80) return cc.deep
  if (mastery >= 50) return cc.mid
  return cc.light
}

function bubbleSize(importance: number): number {
  return importance === 3 ? 55 : importance === 2 ? 42 : 30
}

function bubbleFontSize(r: number): number {
  return r >= 50 ? 14 : r >= 38 ? 12 : 10
}

interface PositionedNode {
  x: number
  y: number
  r: number
  fill: string
  node: KnowledgeNode
}

const positionedNodes = computed<PositionedNode[]>(() => {
  const nodes = knowledgeGraphData.value.nodes
  const categoryRadius: Record<string, number> = {
    foundation: 145,
    core: 240,
    advanced: 330,
    comprehensive: 415,
  }
  const ringAngleOffsets: Record<string, number> = {
    foundation: 0,
    core: 30,
    advanced: -25,
    comprehensive: 20,
  }

  const grouped: Record<string, KnowledgeNode[]> = {}
  for (const n of nodes) {
    if (!grouped[n.category]) grouped[n.category] = []
    grouped[n.category].push(n)
  }

  const result: PositionedNode[] = []
  for (const [cat, catNodes] of Object.entries(grouped)) {
    const r = categoryRadius[cat] || 160
    const count = catNodes.length
    const arcDeg = Math.min(200, 60 + count * 30)
    const arcRad = (arcDeg * Math.PI) / 180
    const offsetRad = ((ringAngleOffsets[cat] || 0) * Math.PI) / 180
    const startAngle = -Math.PI / 2 - arcRad / 2 + offsetRad
    const step = count > 1 ? arcRad / (count - 1) : 0

    catNodes.forEach((node, i) => {
      const angle = startAngle + step * i
      const radius = bubbleSize(node.importance)
      const fill = bubbleColor(node.mastery, cat)
      result.push({
        x: SVG_CX + r * Math.cos(angle),
        y: SVG_CY + r * Math.sin(angle),
        r: radius,
        fill,
        node,
      })
    })
  }

  const MIN_GAP = 14
  for (let iter = 0; iter < 3; iter++) {
    let moved = false
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i]
        const b = result[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const minDist = a.r + b.r + MIN_GAP
        if (dist < minDist && dist > 0.01) {
          const push = (minDist - dist) / 2
          const nx = dx / dist
          const ny = dy / dist
          a.x -= nx * push
          a.y -= ny * push
          b.x += nx * push
          b.y += ny * push
          moved = true
        }
      }
    }
    if (!moved) break
  }

  return result
})

interface RenderedEdge {
  source: string
  target: string
  path: string
  arrow: string
  midX: number
  midY: number
  label: string
  color: string
  dash: string
  width: number
}

const renderedEdges = computed<RenderedEdge[]>(() => {
  const posMap = new Map<string, { x: number; y: number; r: number }>()
  for (const pn of positionedNodes.value) {
    posMap.set(pn.node.id, { x: pn.x, y: pn.y, r: pn.r })
  }

  const edgeStyles: Record<string, { color: string; dash: string; width: number }> = {
    prerequisite: { color: '#1E88E5', dash: '', width: 2 },
    related_to: { color: '#64B5F6', dash: '5,3', width: 1.5 },
    extends: { color: '#1E88E5', dash: '3,4', width: 1.5 },
    part_of: { color: '#1E88E5', dash: '7,3', width: 1.5 },
  }

  const result: RenderedEdge[] = []
  for (const edge of knowledgeGraphData.value.edges) {
    const src = posMap.get(edge.source)
    const tgt = posMap.get(edge.target)
    if (!src || !tgt) continue

    const style = edgeStyles[edge.relation] || edgeStyles.related_to

    const dx = tgt.x - src.x
    const dy = tgt.y - src.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1) continue
    const nx = dx / dist
    const ny = dy / dist

    const x1 = src.x + nx * src.r
    const y1 = src.y + ny * src.r
    const x2 = tgt.x - nx * tgt.r
    const y2 = tgt.y - ny * tgt.r

    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    const cpx = midX - ny * 20
    const cpy = midY + nx * 20
    const path = `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`

    const arrowSize = 8
    const ax = x2 - nx * arrowSize
    const ay = y2 - ny * arrowSize
    const apx = -ny * arrowSize * 0.4
    const apy = nx * arrowSize * 0.4
    const arrow = `${ax - apx},${ay - apy} ${x2},${y2} ${ax + apx},${ay + apy}`

    result.push({
      source: edge.source,
      target: edge.target,
      path,
      arrow,
      midX: (x1 + x2) / 2,
      midY: (y1 + y2) / 2 - 6,
      label: edge.label,
      color: style.color,
      dash: style.dash,
      width: style.width,
    })
  }
  return result
})

const selectedBubble = ref<string | null>(null)

function bubbleNode(id: string | null): KnowledgeNode | undefined {
  if (!id) return undefined
  return knowledgeGraphData.value.nodes.find((n) => n.id === id)
}

function bubbleEdges(id: string): KnowledgeEdge[] {
  return knowledgeGraphData.value.edges.filter((e) => e.source === id || e.target === id)
}

function relationChipClass(relation: string): string {
  const map: Record<string, string> = {
    prerequisite: 'bg-brand-600/10 text-brand-600',
    related_to: 'bg-brand-400/10 text-brand-600',
    extends: 'bg-brand-600/10 text-brand-600',
    part_of: 'bg-brand-400/10 text-brand-600',
  }
  return map[relation] || 'bg-brand-400/10 text-brand-400'
}

// ===== 综合评价 =====
const totalScore = computed(() => myGrade.value?.score ?? null)

const classAvgScore = computed(() => {
  const courseGrades = store.grades.filter((g) => g.courseId === courseId)
  if (courseGrades.length === 0) return 0
  return Math.round(courseGrades.reduce((s, g) => s + g.score, 0) / courseGrades.length)
})

const currentCfg = computed(() => store.getGradeConfig(courseId))

const evalDimensions = computed(() => {
  const evals = store.evaluations.filter(
    (e) => e.courseId === courseId && e.studentId === myStudent.value?.id
  )
  const calcAvg = (type: string) => {
    const filtered = evals.filter((e) => e.type === type)
    if (filtered.length === 0) return null
    return Math.round(filtered.reduce((s, e) => s + e.score, 0) / filtered.length)
  }

  const dims: { label: string; icon: string; iconBg: string; iconColor: string; barColor: string; score: number; maxScore: number }[] = []
  const selfScore = calcAvg('self')
  if (selfScore !== null) dims.push({ label: '自评', icon: 'userCheck', iconBg: 'bg-brand-600/15', iconColor: 'text-brand-600', barColor: 'bg-brand-600', score: selfScore, maxScore: 100 })
  const peerScore = calcAvg('intra_group')
  if (peerScore !== null) dims.push({ label: '组内互评', icon: 'users', iconBg: 'bg-brand-600/10', iconColor: 'text-brand-600', barColor: 'bg-brand-600', score: peerScore, maxScore: 100 })
  const interScore = calcAvg('inter_group')
  if (interScore !== null) dims.push({ label: '组间互评', icon: 'messageSquare', iconBg: 'bg-brand-600/10', iconColor: 'text-brand-600', barColor: 'bg-brand-600', score: interScore, maxScore: 100 })
  const teacherScore = calcAvg('teacher')
  if (teacherScore !== null) dims.push({ label: '教师评价', icon: 'award', iconBg: 'bg-brand-400/10', iconColor: 'text-brand-600', barColor: 'bg-brand-600', score: teacherScore, maxScore: 100 })

  return dims
})

// ===== 任务内容渲染 =====
function renderTasksContent(container: d3.Selection<any, any, any, any>) {
  container.append('h3').attr('class', 'text-sm font-semibold text-brand-800').text('课程任务')
  const list = container.append('div').attr('class', 'space-y-2')

  if (courseTasks.value.length === 0) {
    list.append('div').attr('class', 'text-center py-8 text-brand-400').text('暂无任务')
    return
  }

  courseTasks.value.forEach((task) => {
    const row = list.append('div').attr('class', 'flex items-center justify-between p-3 rounded-lg border border-brand-400/20 hover:bg-brand-400/5')

    const left = row.append('div').attr('class', 'flex items-center gap-3')
    if (task.completed) {
      renderIcon(left, 'checkCircle', 'w-5 h-5 text-brand-600')
    } else {
      // Empty circle
      left.append('svg').attr('class', 'w-5 h-5 text-brand-400')
        .attr('viewBox', '0 0 24 24').attr('fill', 'none').attr('stroke', 'currentColor')
        .attr('stroke-width', '2')
        .append('circle').attr('cx', '12').attr('cy', '12').attr('r', '10')
    }
    const info = left.append('div')
    info.append('p').attr('class', 'text-sm font-medium text-brand-900').text(task.title)
    if (task.dueDate) {
      info.append('p').attr('class', 'text-xs text-brand-400').text(`截止：${task.dueDate}`)
    }

    if (task.score !== undefined) {
      row.append('span').attr('class', 'text-sm font-bold text-brand-600').text(`${task.score}分`)
    }
  })
}

// ===== 资源内容渲染 =====
function renderResourcesContent(container: d3.Selection<any, any, any, any>) {
  container.append('h3').attr('class', 'text-sm font-semibold text-brand-800').text('课程资源')
  const grid = container.append('div').attr('class', 'grid grid-cols-1 md:grid-cols-2 gap-3')

  if (courseResources.value.length === 0) {
    grid.append('div').attr('class', 'col-span-full text-center py-8 text-brand-400').text('暂无资源')
    return
  }

  courseResources.value.forEach((res) => {
    const card = grid.append('div').attr('class', 'flex items-center gap-3 p-3 rounded-lg border border-brand-400/20 hover:bg-brand-400/5')
    const iconBox = card.append('div').attr('class', 'w-10 h-10 rounded-lg bg-brand-400/10 flex items-center justify-center')
    renderIcon(iconBox, 'fileText', 'w-5 h-5 text-brand-400')
    const info = card.append('div')
    info.append('p').attr('class', 'text-sm font-medium text-brand-900').text(res.title)
    info.append('p').attr('class', 'text-xs text-brand-400').text(`${res.type} · ${res.size}`)
  })
}

// ===== 作业内容渲染 =====
function renderHomeworkContent(container: d3.Selection<any, any, any, any>) {
  container.append('h3').attr('class', 'text-sm font-semibold text-brand-800').text('课程作业')
  const list = container.append('div').attr('class', 'space-y-2')

  if (courseHomework.value.length === 0) {
    list.append('div').attr('class', 'text-center py-8 text-brand-400').text('暂无作业')
    return
  }

  courseHomework.value.forEach((hw) => {
    const row = list.append('div').attr('class', 'flex items-center justify-between p-3 rounded-lg border border-brand-400/20 hover:bg-brand-400/5')
    const left = row.append('div').attr('class', 'flex items-center gap-3')
    renderIcon(left, 'fileText', 'w-5 h-5 text-brand-600')
    const info = left.append('div')
    info.append('p').attr('class', 'text-sm font-medium text-brand-900').text(hw.title)
    info.append('p').attr('class', 'text-xs text-brand-400').text(`截止：${hw.dueDate}`)

    if (hw.submitted) {
      row.append('span').attr('class', 'text-xs text-brand-600').text('已提交')
    } else {
      row.append('span').attr('class', 'text-xs text-brand-600').text('未提交')
    }
  })
}

// ===== 评价填写内容渲染 =====
function renderEvaluationsContent(container: d3.Selection<any, any, any, any>) {
  container.append('h3').attr('class', 'text-sm font-semibold text-brand-800').text('课程评价')
  if (isReadOnly.value) {
    const readOnlyBox = container.append('div').attr('class', 'bg-brand-400/10 border border-brand-400/30 rounded-xl p-6 text-center text-sm text-brand-400')
    renderIcon(readOnlyBox, 'eye', 'w-8 h-8 mx-auto mb-2 text-brand-400')
    readOnlyBox.append('p').text('课程已结束，评价填写功能已关闭')
    readOnlyBox.append('p').attr('class', 'text-xs mt-1').text('如需查看评价记录，请在"综合评价"中查看')
  }
  // StudentEvaluation is rendered in the hidden template div
}

// ===== 综合评价内容渲染 =====
function renderEvalOverviewContent(container: d3.Selection<any, any, any, any>) {
  const section1 = container.append('div')
  section1.append('h3').attr('class', 'text-sm font-semibold text-brand-800 mb-3').text('综合评价')

  const scoreCard = section1.append('div').attr('class', 'bg-gradient-to-br from-brand-400/5 to-brand-400/5 rounded-xl p-5 border border-brand-400/20')
  const scoreRow = scoreCard.append('div').attr('class', 'flex items-center justify-between mb-4')

  const scoreLeft = scoreRow.append('div')
  scoreLeft.append('p').attr('class', 'text-xs text-brand-400 mb-1').text('课程总评')
  const scoreVal = scoreLeft.append('p').attr('class', 'text-3xl font-bold text-brand-600')
  scoreVal.text(String(totalScore.value ?? '-'))
  scoreVal.append('span').attr('class', 'text-base text-brand-400').text('分')

  const scoreRight = scoreRow.append('div').attr('class', 'text-right')
  scoreRight.append('p').attr('class', 'text-xs text-brand-400').text('班级平均')
  scoreRight.append('p').attr('class', 'text-xl font-semibold text-brand-600').text(`${classAvgScore.value}分`)

  // 分数条
  const barContainer = scoreCard.append('div').attr('class', 'relative h-3 bg-brand-400/10 rounded-full overflow-hidden')
  barContainer.append('div').attr('class', 'absolute top-0 h-full w-0.5 bg-brand-600 z-10')
    .style('left', `${classAvgScore.value}%`)
  if (totalScore.value) {
    barContainer.append('div').attr('class', 'h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all')
      .style('width', `${Math.min(totalScore.value, 100)}%`)
  }
  const barLabels = scoreCard.append('div').attr('class', 'flex justify-between text-xs text-brand-400 mt-1')
  barLabels.append('span').text('0')
  barLabels.append('span').style('color', '#1E88E5').text(`平均${classAvgScore.value}`)
  barLabels.append('span').text('100')

  // 评价维度细分
  const dimSection = container.append('div')
  dimSection.append('h3').attr('class', 'text-sm font-semibold text-brand-800 mb-3').text('评价维度细分')
  const dimList = dimSection.append('div').attr('class', 'space-y-3')

  if (evalDimensions.value.length === 0) {
    dimList.append('div').attr('class', 'text-center py-6 text-brand-400').text('暂无评价数据')
  } else {
    evalDimensions.value.forEach((dim) => {
      const dimRow = dimList.append('div').attr('class', 'flex items-center gap-3 p-3 rounded-lg border border-brand-400/20')
      const iconBox = dimRow.append('div').attr('class', 'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0')
      // Parse Tailwind classes for iconBox styling
      const iconBgCls = dim.iconBg
      if (iconBgCls) iconBox.attr('class', (iconBox.attr('class') || '') + ' ' + iconBgCls)
      renderIcon(iconBox, dim.icon as any, `w-4 h-4 ${dim.iconColor}`)

      const dimInfo = dimRow.append('div').attr('class', 'flex-1 min-w-0')
      dimInfo.append('p').attr('class', 'text-sm font-medium text-brand-900').text(dim.label)

      const progressRow = dimInfo.append('div').attr('class', 'flex items-center gap-2 mt-1')
      const pct = (dim.score / (dim.maxScore || 100)) * 100
      const barBg = progressRow.append('div').attr('class', 'flex-1 bg-brand-400/10 rounded-full h-2 overflow-hidden')
      barBg.append('div').attr('class', 'h-full rounded-full transition-all duration-500')
        .style('width', `${pct}%`)
        .style('background', '#1E88E5')
      progressRow.append('span').attr('class', 'text-xs font-medium text-brand-600 w-12 text-right')
        .text(`${dim.score}/${dim.maxScore || 100}`)
    })
  }

  // 成绩权重说明
  const cfg = currentCfg.value
  if (cfg) {
    const cfgBox = container.append('div').attr('class', 'bg-brand-400/10 rounded-xl p-4 border border-brand-400/20 text-sm text-brand-800')
    cfgBox.append('p').attr('class', 'font-medium mb-1').text('成绩构成')
    cfgBox.append('p').text(`总成绩 = 平时成绩(${cfg.regularWeight}%) + 期中成绩(${cfg.midtermWeight}%) + 期末成绩(${cfg.finalWeight}%)`)
    cfgBox.append('p').attr('class', 'text-xs text-brand-600 mt-1')
      .text(`平时成绩构成：自评(${cfg.selfEvalWeight}%) + 互评(${cfg.peerReviewWeight}%) + 组间评(${cfg.interGroupEvalWeight}%) + 教师(${cfg.teacherScoreWeight}%) + 导师(${cfg.mentorScoreWeight}%)`)
  }
}

// ===== 右侧栏渲染 =====
function renderSidebar(container: d3.Selection<any, any, any, any>) {
  // AI 学习助手
  const aiCard = container.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-4')
  aiCard.append('h3').attr('class', 'text-sm font-semibold text-brand-800 mb-3').text('AI 学习助手')
  const aiBox = aiCard.append('div').attr('class', 'bg-gradient-to-br from-brand-400/5 to-brand-400/5 rounded-lg p-3 text-xs text-brand-600')
  aiBox.append('p').attr('class', 'font-medium mb-1').text('智能推荐')
  aiBox.append('p').text(aiAssistantTip.value)

  // 预习画像
  const profileCard = container.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-4')
  profileCard.append('h3').attr('class', 'text-sm font-semibold text-brand-800 mb-3').text('预习画像')
  const profileContent = profileCard.append('div').attr('class', 'space-y-2')

  const pp = previewProfile.value

  // 预习完成度
  const completeRow = profileContent.append('div')
  const completeLabel = completeRow.append('div').attr('class', 'flex justify-between text-xs')
  completeLabel.append('span').attr('class', 'text-brand-400').text('预习完成度')
  completeLabel.append('span').attr('class', 'font-medium').text(`${pp.previewComplete}%`)
  completeRow.append('div').attr('class', 'h-2 bg-brand-400/10 rounded-full overflow-hidden')
    .append('div').attr('class', 'h-full rounded-full').style('width', `${pp.previewComplete}%`).style('background', '#1E88E5')

  // 知识点掌握
  const masteryRow = profileContent.append('div')
  const masteryLabel = masteryRow.append('div').attr('class', 'flex justify-between text-xs')
  masteryLabel.append('span').attr('class', 'text-brand-400').text('知识点掌握')
  masteryLabel.append('span').attr('class', 'font-medium').text(`${pp.knowledgeMastery}%`)
  masteryRow.append('div').attr('class', 'h-2 bg-brand-400/10 rounded-full overflow-hidden')
    .append('div').attr('class', 'h-full rounded-full').style('width', `${pp.knowledgeMastery}%`).style('background', '#1E88E5')

  // 学习时长
  const hoursRow = profileContent.append('div')
  const hoursLabel = hoursRow.append('div').attr('class', 'flex justify-between text-xs')
  hoursLabel.append('span').attr('class', 'text-brand-400').text('学习时长')
  hoursLabel.append('span').attr('class', 'font-medium').text(`${pp.studyHours}h`)
}

// ===== 右侧栏 =====
const aiAssistantTip = computed(() => {
  const tier = myTier.value
  if (tier === 'basic') return '根据你的学习进度，建议重点复习第1-3章基础内容'
  if (tier === 'advanced') return '根据你的学习进度，建议重点复习第4-5章进阶内容'
  return '根据你的学习进度，建议尝试完成综合项目实践'
})

const previewProfile = computed(() => {
  const progress = myEnrollment.value?.progress ?? 50
  return {
    previewComplete: Math.min(progress + 10, 100),
    knowledgeMastery: progress,
    studyHours: Math.round(progress * 0.24),
  }
})

// ===== D3 渲染函数 =====

function renderGitBranchIcon(parent: d3.Selection<any, any, any, any>, className?: string) {
  const svg = parent.append('svg')
    .attr('viewBox', '0 0 24 24')
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', '2')
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
  if (className) svg.attr('class', className)
  svg.html('<path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>')
  return svg
}

function renderCourseLearn(root: HTMLElement) {
  const container = d3.select(root)
  container.selectAll('*').remove()

  const c = course.value
  const readOnly = isReadOnly.value

  // ---- 外层容器 ----
  const wrapper = container.append('div').attr('class', 'space-y-6')

  // ===== 头部 =====
  renderHeader(wrapper, c, readOnly)

  // ===== 已结束只读提示 =====
  if (readOnly) {
    renderReadOnlyBanner(wrapper)
  }

  // ===== Tab 栏 =====
  renderTabBar(wrapper)

  // ===== 主内容 + 侧栏网格 =====
  const grid = wrapper.append('div').attr('class', 'grid grid-cols-1 lg:grid-cols-4 gap-6')
  const mainCol = grid.append('div').attr('class', 'lg:col-span-3')
  const sideCol = grid.append('div').attr('class', 'space-y-6')

  // ---- 主内容卡片 ----
  const mainCard = mainCol.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-6')

  // 根据 activeTab 渲染不同内容
  const tabId = activeTab.value
  if (tabId === 'ai_tier') {
    renderAITierContent(mainCard)
  } else if (tabId === 'knowledge_graph') {
    renderKnowledgeGraphContent(mainCard)
  } else if (tabId === 'tasks') {
    renderTasksContent(mainCard)
  } else if (tabId === 'resources') {
    renderResourcesContent(mainCard)
  } else if (tabId === 'homework') {
    renderHomeworkContent(mainCard)
  } else if (tabId === 'evaluations') {
    renderEvaluationsContent(mainCard)
  } else if (tabId === 'eval_overview') {
    renderEvalOverviewContent(mainCard)
  }

  // ---- 右侧栏 ----
  renderSidebar(sideCol)
}

// ===== 头部渲染 =====
function renderHeader(container: d3.Selection<any, any, any, any>, c: any, readOnly: boolean) {
  const topRow = container.append('div').attr('class', 'flex items-center gap-4')

  const backBtn = topRow.append('button')
    .attr('class', 'p-2 rounded-lg hover:bg-brand-400/10 transition-colors')
    .on('click', () => router.back())
  renderIcon(backBtn, 'arrowLeft', 'w-5 h-5 text-brand-400')

  const infoDiv = topRow.append('div').attr('class', 'flex-1')
  infoDiv.append('h1').attr('class', 'text-2xl font-bold text-brand-900').text(c?.title || '')
  infoDiv.append('p').attr('class', 'text-brand-400 mt-1').text(`${c?.id || ''} · ${c?.teacher || ''}`)

  if (readOnly) {
    const badge = topRow.append('span').attr('class', 'text-xs px-3 py-1 rounded-full bg-brand-400/10 text-brand-400 border border-brand-400/30')
    const badgeIcon = badge.append('span').attr('class', 'inline-flex items-center')
    renderIcon(badgeIcon, 'eye', 'w-3 h-3 mr-1')
    badge.append('span').text('课程已结束')
  }
}

// ===== 只读提示 =====
function renderReadOnlyBanner(container: d3.Selection<any, any, any, any>) {
  const banner = container.append('div').attr('class', 'flex items-center gap-2 px-4 py-3 bg-brand-400/10 border border-brand-400/30 rounded-xl text-sm text-brand-400')
  renderIcon(banner, 'eye', 'w-4 h-4 text-brand-400')
  banner.append('span').html('该课程已结束，当前为<strong>只读查看</strong>模式')
}

// ===== Tab 栏渲染 =====
function renderTabBar(container: d3.Selection<any, any, any, any>) {
  const tabBar = container.append('div').attr('class', 'flex gap-1 bg-brand-400/10 p-1 rounded-xl overflow-x-auto')

  tabs.forEach((tab) => {
    const isActive = activeTab.value === tab.id
    const btn = tabBar.append('button')
      .attr('class', `flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-400 hover:text-brand-800'}`)
      .on('click', () => {
        activeTab.value = tab.id
        reRender()
      })

    if (tab.icon === 'gitBranch') {
      renderGitBranchIcon(btn, 'w-4 h-4')
    } else {
      renderIcon(btn, tab.icon as any, 'w-4 h-4')
    }
    btn.append('span').text(tab.label)
  })
}

// ===== AI 分层内容 =====
function renderAITierContent(container: d3.Selection<any, any, any, any>) {
  const contentDiv = container.append('div').attr('class', 'space-y-6')

  if (!firstClassEnded.value) {
    // 未到开始条件
    const box = contentDiv.append('div').attr('class', 'bg-brand-400/10 border border-brand-400/20 rounded-xl p-8 text-center')
    renderIcon(box, 'layers', 'w-12 h-12 mx-auto mb-3 text-brand-400')
    box.append('h3').attr('class', 'text-lg font-semibold text-brand-800 mb-2').text('AI 分层测试')
    box.append('p').attr('class', 'text-sm text-brand-600').text('第一节课尚未结束，AI 分层测试将在第一节课结束后开启')
    box.append('p').attr('class', 'text-xs text-brand-400 mt-1').text('届时将根据第一节课内容生成 10 道测试题，依据得分判定学习层级')
  } else if (firstClassEnded.value && !tierFinalized.value) {
    // 条件已满足但未测试
    const box = contentDiv.append('div').attr('class', 'bg-gradient-to-br from-brand-400/5 to-brand-400/5 border border-brand-400 rounded-xl p-8 text-center')
    renderIcon(box, 'sparkles', 'w-12 h-12 mx-auto mb-3 text-brand-600')
    box.append('h3').attr('class', 'text-lg font-semibold text-brand-800 mb-2').text('AI 分层测试已开放')
    box.append('p').attr('class', 'text-sm text-brand-600 mb-6').text('完成 10 道测试题（单选+判断），系统将根据得分判定你的学习层级')

    const startBtn = box.append('button')
      .attr('class', 'px-8 py-3 bg-brand-600 hover:bg-brand-800 text-white font-medium rounded-xl transition-colors shadow-lg inline-flex items-center gap-2')
      .on('click', () => openAITest())
    renderIcon(startBtn, 'helpCircle', 'w-5 h-5')
    startBtn.append('span').text('开始 AI 分层测试')
  } else {
    // 已分层 → 永久锁定展示
    renderTierFinalizedContent(contentDiv)
  }
}

function renderTierFinalizedContent(container: d3.Selection<any, any, any, any>) {
  // 当前层级
  const section1 = container.append('div')
  section1.append('h3').attr('class', 'text-sm font-semibold text-brand-800 mb-3').text('AI 学习层级评估')

  const tierCard = section1.append('div').attr('class', 'bg-gradient-to-br from-brand-400/5 to-brand-400/5 rounded-xl p-5 border border-brand-400/20')

  const tierRow = tierCard.append('div').attr('class', 'flex items-center justify-between mb-4')
  const tierLeft = tierRow.append('div')
  tierLeft.append('p').attr('class', 'text-xs text-brand-400 mb-1').text('当前学习层级')

  const tierBadge = tierLeft.append('span').attr('class', 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold')
  // Apply tierBadgeClass-like styling via D3
  if (!tierFinalized.value) {
    tierBadge.attr('class', 'bg-brand-400/10 text-brand-400 border border-brand-400/30')
  } else {
    tierBadge.attr('class', 'bg-brand-600/10 text-brand-600 border border-brand-400')
  }
  renderIcon(tierBadge, 'layers', 'w-4 h-4')
  tierBadge.append('span').text(tierLabel.value)

  tierLeft.append('span').attr('class', 'ml-2 text-[10px] text-brand-400').text('已锁定 · 该学期不可修改')

  const tierRight = tierRow.append('div').attr('class', 'text-right')
  tierRight.append('p').attr('class', 'text-xs text-brand-400').text('分层测试得分')
  tierRight.append('p').attr('class', 'text-2xl font-bold text-brand-600').text(String(myTierScore.value))
  tierRight.append('p').attr('class', 'text-xs text-brand-400').text(`/ ${totalQuestions.value * 10}分`)

  // 锁定提示
  const lockNotice = tierCard.append('div').attr('class', 'mt-3 flex items-center gap-2 px-3 py-2 bg-brand-400/10 rounded-lg text-xs text-brand-400')
  renderIcon(lockNotice, 'lock', 'w-3.5 h-3.5')
  lockNotice.append('span').text(`AI 分层结果已锁定，本学期不可更改。后续任务、资源、作业将根据 ${tierLabel.value} 进行适配`)

  // AI 学习建议
  const tipsSection = container.append('div')
  tipsSection.append('h3').attr('class', 'text-sm font-semibold text-brand-800 mb-3').text('AI 学习建议')

  const tipsList = tipsSection.append('div').attr('class', 'space-y-3')
  aiTips.value.forEach((tip, i) => {
    const tipRow = tipsList.append('div').attr('class', 'flex items-start gap-3 p-3 rounded-lg border border-brand-400/20 bg-brand-400/5')
    const numCircle = tipRow.append('div').attr('class', 'w-6 h-6 rounded-full bg-brand-600/15 flex items-center justify-center flex-shrink-0 mt-0.5')
    numCircle.append('span').attr('class', 'text-xs font-bold text-brand-600').text(String(i + 1))

    const tipContent = tipRow.append('div')
    tipContent.append('p').attr('class', 'text-sm font-medium text-brand-900').text(tip.title)
    tipContent.append('p').attr('class', 'text-xs text-brand-400 mt-0.5').text(tip.desc)
  })

  // 分层对比
  const compareSection = container.append('div')
  compareSection.append('h3').attr('class', 'text-sm font-semibold text-brand-800 mb-3').text('层级对照')

  const compareGrid = compareSection.append('div').attr('class', 'grid grid-cols-1 sm:grid-cols-3 gap-3')
  tierComparison.value.forEach((ct) => {
    const isActive = ct.level === myTier.value
    const card = compareGrid.append('div').attr('class', `p-3 rounded-lg border ${isActive ? 'border-brand-400 bg-brand-600/10 ring-1 ring-brand-400' : 'border-brand-400/20'}`)
    card.append('p').attr('class', `text-xs font-semibold mb-1 ${ct.color}`).text(ct.label)
    card.append('p').attr('class', 'text-xs text-brand-400').text(ct.desc)
  })
}

// ===== 知识图谱内容 =====
function renderKnowledgeGraphContent(container: d3.Selection<any, any, any, any>) {
  const contentDiv = container.append('div').attr('class', 'space-y-5')

  // 头部说明
  const header = contentDiv.append('div').attr('class', 'flex items-center justify-between')
  const headerLeft = header.append('div')
  headerLeft.append('h3').attr('class', 'text-base font-semibold text-brand-800').text('知识点掌握图谱')
  headerLeft.append('p').attr('class', 'text-xs text-brand-400').text('基于学习进度与评价数据自动生成 · 泡泡越大表示知识越重要 · 颜色越深表示掌握度越高')
  header.append('span').attr('class', 'text-xs text-brand-400').text('点击泡泡查看详情')

  // 图例
  renderGraphLegend(contentDiv)

  // SVG 知识图谱
  renderGraphSVG(contentDiv)

  // 选中节点的详情
  if (selectedBubble.value && bubbleNode(selectedBubble.value)) {
    renderBubbleDetail(contentDiv)
  }
}

function renderGraphLegend(container: d3.Selection<any, any, any, any>) {
  const legend = container.append('div').attr('class', 'flex flex-wrap gap-x-5 gap-y-2 text-xs text-brand-400 items-center')

  categoryColors.forEach((cat) => {
    const item = legend.append('span').attr('class', 'flex items-center gap-1.5')
    item.append('span').attr('class', 'w-3 h-3 rounded-full').style('background', cat.mid)
    item.append('span').text(cat.label)
  })

  legend.append('span').attr('class', 'text-brand-400/60').text('|')

  relationLegend.forEach((rel) => {
    const item = legend.append('span').attr('class', 'flex items-center gap-1.5')
    const svgEl = item.append('svg').attr('width', 20).attr('height', 4).attr('class', 'overflow-visible')
    svgEl.append('line')
      .attr('x1', 0).attr('y1', 2).attr('x2', 20).attr('y2', 2)
      .attr('stroke', rel.color).attr('stroke-width', 2)
      .attr('stroke-dasharray', rel.dash || 'none')
    item.append('span').text(rel.label)
  })
}

function renderGraphSVG(container: d3.Selection<any, any, any, any>) {
  const svgWrap = container.append('div').attr('class', 'relative bg-white rounded-xl border border-brand-400/20 overflow-hidden')

  const svg = svgWrap.append('svg')
    .attr('viewBox', `0 0 ${SVG_W} ${SVG_H}`)
    .attr('class', 'w-full')
    .style('min-height', '780px')

  // defs
  const defs = svg.append('defs')
  defs.append('pattern')
    .attr('id', 'kg-grid')
    .attr('width', 40).attr('height', 40)
    .attr('patternUnits', 'userSpaceOnUse')
    .append('path')
    .attr('d', 'M 40 0 L 0 0 0 40')
    .attr('fill', 'none').attr('stroke', '#64B5F6').attr('stroke-width', 0.5).attr('stroke-opacity', 0.3)

  defs.append('filter').attr('id', 'kg-glow')
    .append('feGaussianBlur').attr('stdDeviation', 3)

  svg.append('rect').attr('width', '100%').attr('height', '100%').attr('fill', 'url(#kg-grid)')

  // 分类环带
  categoryRings.value.forEach((ring) => {
    svg.append('ellipse')
      .attr('cx', SVG_CX).attr('cy', SVG_CY)
      .attr('rx', ring.rx).attr('ry', ring.ry)
      .attr('fill', 'none').attr('stroke', ring.color)
      .attr('stroke-width', 1).attr('stroke-dasharray', '4,4')
      .attr('stroke-opacity', 0.3)

    svg.append('text')
      .attr('x', SVG_CX + ring.rx - 4).attr('y', SVG_CY - ring.ry + 16)
      .attr('font-size', 10).attr('fill', ring.color)
      .attr('fill-opacity', 0.5).attr('text-anchor', 'end')
      .text(ring.label)
  })

  // 关联连线
  renderedEdges.value.forEach((edge) => {
    const edgeG = svg.append('g')
    const isHighlighted = selectedBubble.value && (edge.source === selectedBubble.value || edge.target === selectedBubble.value)

    edgeG.append('path')
      .attr('d', edge.path).attr('fill', 'none')
      .attr('stroke', edge.color).attr('stroke-width', edge.width)
      .attr('stroke-dasharray', edge.dash || 'none')
      .attr('stroke-linecap', 'round')
      .attr('opacity', isHighlighted ? 1 : 0.5)

    edgeG.append('polygon')
      .attr('points', edge.arrow).attr('fill', edge.color)
      .attr('opacity', isHighlighted ? 1 : 0.5)

    edgeG.append('text')
      .attr('x', edge.midX).attr('y', edge.midY)
      .attr('font-size', 8).attr('fill', edge.color)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('opacity', 0.6)
      .attr('class', 'pointer-events-none select-none')
      .text(edge.label)
  })

  // 知识点节点
  positionedNodes.value.forEach((pn) => {
    const nodeG = svg.append('g')
      .attr('class', 'cursor-pointer')
      .style('cursor', 'pointer')
      .on('click', () => {
        selectedBubble.value = selectedBubble.value === pn.node.id ? null : pn.node.id
        reRender()
      })

    // tooltip
    nodeG.append('title').text(`${pn.node.label} - ${pn.node.mastery}% (${pn.node.chapter})`)

    // 阴影光晕
    if (pn.node.mastery >= 75) {
      nodeG.append('circle')
        .attr('cx', pn.x).attr('cy', pn.y).attr('r', pn.r + 6)
        .attr('fill', pn.fill).attr('opacity', 0.15).attr('filter', 'url(#kg-glow)')
    }

    // 外圈（选中时高亮）
    const isSelected = selectedBubble.value === pn.node.id
    nodeG.append('circle')
      .attr('cx', pn.x).attr('cy', pn.y).attr('r', pn.r + 3)
      .attr('fill', 'none').attr('stroke', pn.fill).attr('stroke-width', 2)
      .attr('opacity', isSelected ? 1 : 0)
      .attr('class', 'transition-opacity duration-200')

    // 主体圆
    const mainCircle = nodeG.append('circle')
      .attr('cx', pn.x).attr('cy', pn.y).attr('r', pn.r)
      .attr('fill', pn.fill).attr('stroke', 'white').attr('stroke-width', 2)
      .attr('class', 'transition-all duration-200')
    if (pn.node.mastery >= 80) {
      mainCircle.style('filter', `drop-shadow(0 2px 6px ${pn.fill}66)`)
    }

    // 文字 - 知识点名称
    nodeG.append('text')
      .attr('x', pn.x).attr('y', pn.y + 1)
      .attr('font-size', bubbleFontSize(pn.r)).attr('font-weight', 700)
      .attr('fill', 'white').attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('class', 'pointer-events-none select-none')
      .text(pn.node.label)
  })

  // 无节点提示
  if (positionedNodes.value.length === 0) {
    svg.append('text')
      .attr('x', '50%').attr('y', '50%')
      .attr('font-size', 14).attr('fill', '#64B5F6')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .text('暂无知识点数据')
  }
}

// ===== 选中节点详情 =====
function renderBubbleDetail(container: d3.Selection<any, any, any, any>) {
  const node = bubbleNode(selectedBubble.value)
  if (!node) return

  const detail = container.append('div').attr('class', 'bg-brand-400/5 rounded-xl p-4 border border-brand-400/20 space-y-2')

  const headerRow = detail.append('div').attr('class', 'flex items-center gap-2')
  headerRow.append('span').attr('class', 'w-3 h-3 rounded-full').style('background', bubbleColor(node.mastery, node.category))
  headerRow.append('p').attr('class', 'text-sm font-bold text-brand-800').text(node.label)
  headerRow.append('span').attr('class', 'text-xs px-1.5 py-0.5 rounded bg-brand-400/10 text-brand-600').text(node.chapter)

  detail.append('p').attr('class', 'text-xs text-brand-400').text(node.description)

  const masteryRow = detail.append('div').attr('class', 'flex items-center gap-3 text-xs')
  masteryRow.append('span').attr('class', 'text-brand-400').text('掌握度')
  masteryRow.append('div').attr('class', 'flex-1 h-2 bg-brand-400/10 rounded-full overflow-hidden')
    .append('div').attr('class', 'h-full rounded-full')
    .style('width', `${node.mastery}%`)
    .style('background', bubbleColor(node.mastery, node.category))
  masteryRow.append('span').attr('class', 'font-bold').style('color', bubbleColor(node.mastery, node.category)).text(`${node.mastery}%`)

  // 关联关系
  const edges = bubbleEdges(selectedBubble.value!)
  if (edges.length > 0) {
    const edgeSection = detail.append('div').attr('class', 'pt-1 border-t border-brand-400/20')
    edgeSection.append('p').attr('class', 'text-[11px] text-brand-400 mb-1').text('关联关系')
    edges.forEach((edge) => {
      const edgeRow = edgeSection.append('div').attr('class', 'text-xs text-brand-600 flex items-center gap-1.5')
      const srcSpan = edgeRow.append('span').attr('class', edge.source === selectedBubble.value ? 'font-semibold' : '').text(nodeLabel(edge.source))
      edgeRow.append('span').attr('class', 'w-3 h-3 text-brand-400')
      renderIcon(edgeRow, 'arrowRight', 'w-3 h-3 text-brand-400')
      const relChip = edgeRow.append('span').attr('class', 'px-1 py-0.5 rounded text-[10px]')
      const chipClasses = relationChipClass(edge.relation).split(' ')
      chipClasses.forEach((cls) => relChip.attr('class', (relChip.attr('class') || '') + ' ' + cls))
      relChip.text(edge.label)
      edgeRow.append('span').attr('class', 'w-3 h-3 text-brand-400')
      renderIcon(edgeRow, 'arrowRight', 'w-3 h-3 text-brand-400')
      const tgtSpan = edgeRow.append('span').attr('class', edge.target === selectedBubble.value ? 'font-semibold' : '').text(nodeLabel(edge.target))
    })
  }
}

// ===== 重渲染函数 =====
function reRender() {
  const el = document.getElementById('student-course-learn-root')
  if (el) renderCourseLearn(el)
}

onMounted(() => {
  const el = document.getElementById('student-course-learn-root')
  if (el) renderCourseLearn(el)
})

watch([activeTab, course, myEnrollment, myGrade, knowledgeGraphData], () => {
  const el = document.getElementById('student-course-learn-root')
  if (el) renderCourseLearn(el)
}, { deep: true })
</script>