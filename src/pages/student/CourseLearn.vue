<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <button @click="router.back()" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ArrowLeft class="w-5 h-5 text-gray-500" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ course?.title }}</h1>
        <p class="text-gray-500 mt-1">{{ course?.id }} · {{ course?.teacher }}</p>
      </div>
    </div>

    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :class="`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`">
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-3">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <!-- ===== 任务 ===== -->
          <div v-if="activeTab === 'tasks'" class="space-y-4">
            <h3 class="text-sm font-semibold text-gray-800">课程任务</h3>
            <div class="space-y-2">
              <div v-for="task in courseTasks" :key="task.id"
                class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div class="flex items-center gap-3">
                  <CheckCircle v-if="task.completed" class="w-5 h-5 text-emerald-500" />
                  <Circle v-else class="w-5 h-5 text-gray-300" />
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ task.title }}</p>
                    <p v-if="task.dueDate" class="text-xs text-gray-400">截止：{{ task.dueDate }}</p>
                  </div>
                </div>
                <span v-if="task.score !== undefined" class="text-sm font-bold text-blue-600">{{ task.score }}分</span>
              </div>
              <div v-if="courseTasks.length === 0" class="text-center py-8 text-gray-400">暂无任务</div>
            </div>
          </div>

          <!-- ===== 资源 ===== -->
          <div v-if="activeTab === 'resources'" class="space-y-4">
            <h3 class="text-sm font-semibold text-gray-800">课程资源</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div v-for="res in courseResources" :key="res.id"
                class="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div class="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                  <FileText class="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ res.title }}</p>
                  <p class="text-xs text-gray-400">{{ res.type }} · {{ res.size }}</p>
                </div>
              </div>
              <div v-if="courseResources.length === 0" class="col-span-full text-center py-8 text-gray-400">暂无资源</div>
            </div>
          </div>

          <!-- ===== 评价 ===== -->
          <div v-if="activeTab === 'evaluations'" class="space-y-4">
            <h3 class="text-sm font-semibold text-gray-800">课程评价</h3>
            <StudentEvaluation :course-id="courseId" :student-id="myStudent?.id || ''"
              :student-name="myStudent?.name || store.currentUser || ''" />
          </div>

          <!-- ===== 作业 ===== -->
          <div v-if="activeTab === 'homework'" class="space-y-4">
            <h3 class="text-sm font-semibold text-gray-800">课程作业</h3>
            <div class="space-y-2">
              <div v-for="hw in courseHomework" :key="hw.id"
                class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div class="flex items-center gap-3">
                  <FileText class="w-5 h-5 text-blue-500" />
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ hw.title }}</p>
                    <p class="text-xs text-gray-400">截止：{{ hw.dueDate }}</p>
                  </div>
                </div>
                <span v-if="hw.submitted" class="text-xs text-emerald-500">已提交</span>
                <span v-else class="text-xs text-amber-500">未提交</span>
              </div>
              <div v-if="courseHomework.length === 0" class="text-center py-8 text-gray-400">暂无作业</div>
            </div>
          </div>

          <!-- ===== AI 分层 ===== -->
          <div v-if="activeTab === 'ai_tier'" class="space-y-6">
            <!-- 当前层级 -->
            <div>
              <h3 class="text-sm font-semibold text-gray-800 mb-3">AI 学习层级评估</h3>
              <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <p class="text-xs text-gray-500 mb-1">当前学习层级</p>
                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                      :class="tierBadgeClass">
                      <Layers class="w-4 h-4" />
                      {{ tierLabel }}
                    </span>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-gray-500">综合评分</p>
                    <p class="text-2xl font-bold" :class="myGrade ? 'text-blue-600' : 'text-gray-400'">
                      {{ myGrade?.score ?? '-' }}
                    </p>
                  </div>
                </div>
                <!-- 能力雷达图 -->
                <div class="flex justify-center">
                  <svg viewBox="0 0 210 210" class="w-56 h-56">
                    <polygon v-for="level in 5" :key="level" :points="gridPoints(level)"
                      fill="none" stroke="#cbd5e1" stroke-width="0.8" />
                    <line v-for="(_, i) in radarData" :key="'axis-' + i"
                      :x1="105" :y1="105" :x2="axisEndX(i)" :y2="axisEndY(i)"
                      stroke="#cbd5e1" stroke-width="0.8" />
                    <polygon :points="dataPolygonPoints"
                      fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" stroke-width="2" />
                    <g v-for="(d, i) in radarData" :key="'point-' + i">
                      <circle :cx="dataPointX(i)" :cy="dataPointY(i)" r="4" fill="#3b82f6" stroke="white" stroke-width="2" />
                      <text :x="dataLabelX(i)" :y="dataLabelY(i)"
                        :text-anchor="dataLabelAnchor(i)" font-size="10" fill="#64748b">
                        {{ d.label }} {{ d.value }}分
                      </text>
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            <!-- AI 学习建议 -->
            <div>
              <h3 class="text-sm font-semibold text-gray-800 mb-3">AI 学习建议</h3>
              <div class="space-y-3">
                <div v-for="(tip, i) in aiTips" :key="i"
                  class="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                  <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="text-xs font-bold text-blue-600">{{ i + 1 }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ tip.title }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">{{ tip.desc }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分层对比 -->
            <div>
              <h3 class="text-sm font-semibold text-gray-800 mb-3">层级对照</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div v-for="tier in tierComparison" :key="tier.level"
                  class="p-3 rounded-lg border"
                  :class="tier.level === myTier ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200' : 'border-gray-100'">
                  <p class="text-xs font-semibold mb-1" :class="tier.color">{{ tier.label }}</p>
                  <p class="text-xs text-gray-500">{{ tier.desc }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== 知识图谱 ===== -->
          <div v-if="activeTab === 'knowledge_graph'" class="space-y-6">
            <div>
              <h3 class="text-sm font-semibold text-gray-800 mb-3">知识点掌握图谱</h3>
              <p class="text-xs text-gray-400 mb-4">基于学习进度与评价数据，展示各知识点的掌握程度</p>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <div v-for="kp in knowledgePoints" :key="kp.label"
                  class="flex flex-col items-center gap-2 p-4 rounded-xl border"
                  :class="kp.borderColor">
                  <div class="w-full aspect-square rounded-lg flex items-center justify-center text-white text-lg font-bold"
                    :class="kp.bgColor">
                    {{ kp.mastery }}%
                  </div>
                  <span class="text-xs font-medium text-gray-700 text-center">{{ kp.label }}</span>
                  <div class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500" :class="kp.barColor"
                      :style="{ width: kp.mastery + '%' }" />
                  </div>
                </div>
              </div>
            </div>

            <div class="border-t border-gray-100 pt-4">
              <h3 class="text-sm font-semibold text-gray-800 mb-3">章节学习进度</h3>
              <div class="space-y-3">
                <div v-for="ch in chapterProgress" :key="ch.label" class="flex items-center gap-3">
                  <span class="text-xs text-gray-500 w-16 flex-shrink-0">{{ ch.label }}</span>
                  <div class="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500"
                      :class="ch.mastery >= 80 ? 'bg-emerald-500' : ch.mastery >= 50 ? 'bg-blue-500' : 'bg-amber-500'"
                      :style="{ width: ch.mastery + '%' }" />
                  </div>
                  <span class="text-xs font-medium text-gray-600 w-8 text-right">{{ ch.mastery }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ===== 综合评价 ===== -->
          <div v-if="activeTab === 'eval_overview'" class="space-y-6">
            <!-- 综合成绩卡片 -->
            <div>
              <h3 class="text-sm font-semibold text-gray-800 mb-3">综合评价</h3>
              <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <p class="text-xs text-gray-500 mb-1">课程总评</p>
                    <p class="text-3xl font-bold text-blue-600">{{ totalScore ?? '-' }}<span class="text-base text-gray-400">分</span></p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-gray-500">班级平均</p>
                    <p class="text-xl font-semibold text-gray-600">{{ classAvgScore }}分</p>
                  </div>
                </div>
                <!-- 分数条对比 -->
                <div class="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div class="absolute top-0 h-full w-0.5 bg-red-400 z-10" :style="{ left: classAvgScore + '%' }" />
                  <div v-if="totalScore" class="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                    :style="{ width: Math.min(totalScore, 100) + '%' }" />
                </div>
                <div class="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span>
                  <span class="text-red-400">平均{{ classAvgScore }}</span>
                  <span>100</span>
                </div>
              </div>
            </div>

            <!-- 评价细分 -->
            <div>
              <h3 class="text-sm font-semibold text-gray-800 mb-3">评价维度细分</h3>
              <div class="space-y-3">
                <div v-for="dim in evalDimensions" :key="dim.label"
                  class="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    :class="dim.iconBg">
                    <component :is="dim.icon" class="w-4 h-4" :class="dim.iconColor" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">{{ dim.label }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500" :class="dim.barColor"
                          :style="{ width: (dim.score / (dim.maxScore || 100) * 100) + '%' }" />
                      </div>
                      <span class="text-xs font-medium text-gray-600 w-12 text-right">
                        {{ dim.score }}<span class="text-gray-400">/{{ dim.maxScore || 100 }}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="evalDimensions.length === 0" class="text-center py-6 text-gray-400">暂无评价数据</div>
              </div>
            </div>

            <!-- 成绩权重说明 -->
            <div v-if="currentCfg" class="bg-amber-50 rounded-xl p-4 border border-amber-200 text-sm text-amber-800">
              <p class="font-medium mb-1">成绩构成</p>
              <p>总成绩 = 平时成绩({{ currentCfg.regularWeight }}%) + 期中成绩({{ currentCfg.midtermWeight }}%) + 期末成绩({{ currentCfg.finalWeight }}%)</p>
              <p class="text-xs text-amber-600 mt-1">
                平时成绩构成：自评({{ currentCfg.selfEvalWeight }}%) + 互评({{ currentCfg.peerReviewWeight }}%) + 组间评({{ currentCfg.interGroupEvalWeight }}%) + 教师({{ currentCfg.teacherScoreWeight }}%) + 导师({{ currentCfg.mentorScoreWeight }}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 右侧栏 ===== -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 class="text-sm font-semibold text-gray-800 mb-3">AI 学习助手</h3>
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 text-xs text-blue-600">
            <p class="font-medium mb-1">智能推荐</p>
            <p>{{ aiAssistantTip }}</p>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 class="text-sm font-semibold text-gray-800 mb-3">预习画像</h3>
          <div class="space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">预习完成度</span>
              <span class="font-medium">{{ previewProfile.previewComplete }}%</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-blue-500" :style="{ width: previewProfile.previewComplete + '%' }" />
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">知识点掌握</span>
              <span class="font-medium">{{ previewProfile.knowledgeMastery }}%</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-emerald-500" :style="{ width: previewProfile.knowledgeMastery + '%' }" />
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">学习时长</span>
              <span class="font-medium">{{ previewProfile.studyHours }}h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import {
  ArrowLeft, BookOpen, FileText, ClipboardCheck, Edit3,
  CheckCircle, Circle, Layers, GitBranch, BarChart3, Award, Sparkles, UserCheck, Users, MessageSquare
} from 'lucide-vue-next'
import StudentEvaluation from '@/components/StudentEvaluation.vue'
import type { Evaluation } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const courseId = route.params.id as string
const myStudent = computed(() => store.students.find((s) => s.name === store.currentUser))
const activeTab = ref('tasks')

const tabs = [
  { id: 'tasks', label: '任务', icon: Edit3 },
  { id: 'resources', label: '资源', icon: FileText },
  { id: 'evaluations', label: '评价', icon: ClipboardCheck },
  { id: 'homework', label: '作业', icon: BookOpen },
  { id: 'eval_overview', label: '综合评价', icon: Award },
  { id: 'knowledge_graph', label: '知识图谱', icon: GitBranch },
  { id: 'ai_tier', label: 'AI分层', icon: Layers },
]

const course = computed(() => store.courses.find((c) => c.id === courseId))
const myEnrollment = computed(() =>
  store.enrollments.find((e) => e.courseId === courseId && e.studentId === myStudent.value?.id)
)
const myGrade = computed(() =>
  store.grades.find((g) => g.courseId === courseId && g.studentId === myStudent.value?.id)
)

// ===== 任务 =====
const courseTasks = computed(() => [
  { id: '1', title: '完成第1章学习', dueDate: '2025-03-15', completed: true, score: 85 },
  { id: '2', title: '完成第2章学习', dueDate: '2025-03-22', completed: true, score: 78 },
  { id: '3', title: '完成第3章学习', dueDate: '2025-03-29', completed: false },
  { id: '4', title: '完成第4章学习', dueDate: '2025-04-05', completed: false },
])

// ===== 资源 =====
const courseResources = computed(() => [
  { id: '1', title: '课程大纲.pdf', type: 'PDF', size: '2.3 MB' },
  { id: '2', title: '第1章课件.pptx', type: 'PPT', size: '5.1 MB' },
  { id: '3', title: '参考书目.pdf', type: 'PDF', size: '1.8 MB' },
  { id: '4', title: '练习题集.docx', type: 'DOC', size: '0.5 MB' },
])

// ===== 作业 =====
const courseHomework = computed(() => [
  { id: '1', title: '第1章课后作业', dueDate: '2025-03-20', submitted: true },
  { id: '2', title: '第2章课后作业', dueDate: '2025-03-27', submitted: true },
  { id: '3', title: '第3章课后作业', dueDate: '2025-04-03', submitted: false },
])

// ===== AI 分层 =====
const myTier = computed(() => {
  const progress = myEnrollment.value?.progress ?? 0
  const score = myGrade.value?.score ?? 0
  if (score >= 85 || progress >= 80) return 'excellent' as const
  if (score >= 70 || progress >= 50) return 'advanced' as const
  return 'basic' as const
})

const tierLabel = computed(() => {
  const map = { basic: '基础层', advanced: '进阶层', excellent: '卓越层' }
  return map[myTier.value]
})

const tierBadgeClass = computed(() => {
  const map = {
    basic: 'bg-amber-50 text-amber-600 border border-amber-200',
    advanced: 'bg-blue-50 text-blue-600 border border-blue-200',
    excellent: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  }
  return map[myTier.value]
})

const tierComparison = computed(() => [
  { level: 'basic' as const, label: '基础层', color: 'text-amber-600', desc: '初步掌握课程基础知识，建议加强练习与复习' },
  { level: 'advanced' as const, label: '进阶层', color: 'text-blue-600', desc: '较好掌握课程核心知识，可尝试拓展深入学习' },
  { level: 'excellent' as const, label: '卓越层', color: 'text-emerald-600', desc: '全面掌握课程内容，具备独立项目实践能力' },
])

const radarData = computed(() => {
  const evals = store.evaluations.filter((e) => e.courseId === courseId && e.studentId === myStudent.value?.id)
  const selfScore = evals.filter((e) => e.type === 'self').reduce((s, e) => s + e.score, 0) /
    Math.max(1, evals.filter((e) => e.type === 'self').length)
  const teacherScore = evals.filter((e) => e.type === 'teacher').reduce((s, e) => s + e.score, 0) /
    Math.max(1, evals.filter((e) => e.type === 'teacher').length)
  const peerScore = evals.filter((e) => e.type === 'intra_group').reduce((s, e) => s + e.score, 0) /
    Math.max(1, evals.filter((e) => e.type === 'intra_group').length)
  const progress = myEnrollment.value?.progress ?? 50
  const gradeScore = myGrade.value?.score ?? 70
  return [
    { label: '自主学习', value: Math.round(selfScore) || 75 },
    { label: '教师评价', value: Math.round(teacherScore) || 70 },
    { label: '协作互评', value: Math.round(peerScore) || 65 },
    { label: '学习进度', value: Math.round(progress) },
    { label: '考试成绩', value: Math.round(gradeScore) },
    { label: '问题解决', value: Math.round((gradeScore + progress) / 2) || 70 },
  ]
})

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

// 雷达图计算
function gridPoints(level: number): string {
  const r = level * 24
  return radarData.value.map((_, i) => {
    const angle = (i * 60 - 90) * Math.PI / 180
    return `${105 + r * Math.cos(angle)},${105 + r * Math.sin(angle)}`
  }).join(' ')
}

function axisEndX(i: number): number {
  const angle = (i * 60 - 90) * Math.PI / 180
  return 105 + 120 * Math.cos(angle)
}

function axisEndY(i: number): number {
  const angle = (i * 60 - 90) * Math.PI / 180
  return 105 + 120 * Math.sin(angle)
}

const dataPolygonPoints = computed(() => {
  return radarData.value.map((d, i) => {
    const angle = (i * 60 - 90) * Math.PI / 180
    const r = d.value * 1.2
    return `${105 + r * Math.cos(angle)},${105 + r * Math.sin(angle)}`
  }).join(' ')
})

function dataPointX(i: number): number {
  const angle = (i * 60 - 90) * Math.PI / 180
  const r = radarData.value[i].value * 1.2
  return 105 + r * Math.cos(angle)
}

function dataPointY(i: number): number {
  const angle = (i * 60 - 90) * Math.PI / 180
  const r = radarData.value[i].value * 1.2
  return 105 + r * Math.sin(angle)
}

function dataLabelX(i: number): number {
  const angle = (i * 60 - 90) * Math.PI / 180
  const r = radarData.value[i].value * 1.2
  const x = 105 + r * Math.cos(angle)
  return x + (x > 105 ? 10 : -10)
}

function dataLabelY(i: number): number {
  const angle = (i * 60 - 90) * Math.PI / 180
  const r = radarData.value[i].value * 1.2
  return 105 + r * Math.sin(angle) + 4
}

function dataLabelAnchor(i: number): string {
  const angle = (i * 60 - 90) * Math.PI / 180
  const r = radarData.value[i].value * 1.2
  const x = 105 + r * Math.cos(angle)
  return x > 105 ? 'start' : 'end'
}

// ===== 知识图谱 =====
const knowledgePoints = computed(() => {
  const progress = myEnrollment.value?.progress ?? 50
  const evals = store.evaluations.filter(
    (e) => e.courseId === courseId && e.studentId === myStudent.value?.id
  )
  const avgEvalScore = evals.length > 0
    ? Math.round(evals.reduce((s, e) => s + e.score, 0) / evals.length)
    : 60

  const labels = ['基础概念', '核心算法', '应用实践', '项目开发', '前沿探索', '综合能力']
  return labels.map((label, i) => {
    const seed = (progress + avgEvalScore + i * 10) % 100
    const mastery = Math.min(95, Math.max(20, seed))
    const color =
      mastery >= 80 ? 'emerald' :
      mastery >= 60 ? 'blue' :
      mastery >= 40 ? 'amber' : 'red'
    return {
      label,
      mastery,
      bgColor: `bg-${color}-400`,
      barColor: `bg-${color}-400`,
      borderColor: `border-${color}-100`,
    }
  })
})

const chapterProgress = computed(() => {
  const progress = myEnrollment.value?.progress ?? 50
  const gradeScore = myGrade.value?.score ?? 70
  return [
    { label: '第1章', mastery: Math.min(95, Math.round(progress * 1.1)) },
    { label: '第2章', mastery: Math.min(90, Math.round(progress * 0.9)) },
    { label: '第3章', mastery: Math.min(85, Math.round(progress * 0.7)) },
    { label: '第4章', mastery: Math.min(80, Math.round(gradeScore * 0.6)) },
    { label: '第5章', mastery: Math.min(75, Math.round(gradeScore * 0.5)) },
  ]
})

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

  const dims: { label: string; icon: any; iconBg: string; iconColor: string; barColor: string; score: number; maxScore: number }[] = []
  const selfScore = calcAvg('self')
  if (selfScore !== null) dims.push({ label: '自评', icon: UserCheck, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', barColor: 'bg-blue-500', score: selfScore, maxScore: 100 })
  const peerScore = calcAvg('intra_group')
  if (peerScore !== null) dims.push({ label: '组内互评', icon: Users, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', barColor: 'bg-emerald-500', score: peerScore, maxScore: 100 })
  const interScore = calcAvg('inter_group')
  if (interScore !== null) dims.push({ label: '组间互评', icon: MessageSquare, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', barColor: 'bg-purple-500', score: interScore, maxScore: 100 })
  const teacherScore = calcAvg('teacher')
  if (teacherScore !== null) dims.push({ label: '教师评价', icon: Award, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', barColor: 'bg-amber-500', score: teacherScore, maxScore: 100 })

  return dims
})

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
</script>
