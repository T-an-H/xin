<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <button @click="router.back()" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ArrowLeft class="w-5 h-5 text-gray-500" />
      </button>
      <div class="flex-1">
        <h1 class="text-2xl font-bold text-gray-900">{{ course?.title }}</h1>
        <p class="text-gray-500 mt-1">{{ course?.id }} · {{ course?.teacher }}</p>
      </div>
      <span v-if="isReadOnly" class="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
        <Eye class="w-3 h-3 inline mr-1 -mt-0.5" />课程已结束
      </span>
    </div>

    <!-- 已结束只读提示 -->
    <div v-if="isReadOnly" class="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
      <Eye class="w-4 h-4 text-gray-400" />
      <span>该课程已结束，当前为<strong>只读查看</strong>模式</span>
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

          <!-- ===== 知识图谱 (泡泡图) ===== -->
          <div v-if="activeTab === 'knowledge_graph'" class="space-y-5">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-semibold text-gray-800">知识点掌握图谱</h3>
                <p class="text-xs text-gray-400">基于学习进度与评价数据自动生成 · 泡泡越大、颜色越深表示掌握度越高</p>
              </div>
              <button @click="toggleGraphView" class="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                {{ graphViewMode === 'bubble' ? '查看 JSON' : '泡泡视图' }}
              </button>
            </div>

            <!-- 泡泡视图 -->
            <template v-if="graphViewMode === 'bubble'">
              <!-- 分类图例 -->
              <div class="flex flex-wrap gap-3 text-xs text-gray-500">
                <span v-for="cat in categoryColors" :key="cat.key" class="flex items-center gap-1.5">
                  <span class="w-3 h-3 rounded-full" :style="{ background: cat.light }" />
                  {{ cat.label }}
                </span>
              </div>

              <!-- 泡泡容器 -->
              <div class="flex flex-wrap justify-center gap-4 py-6 min-h-[200px] items-center">
                <div v-for="node in kgNodes" :key="node.id"
                  @click="selectedBubble = selectedBubble === node.id ? null : node.id"
                  class="relative rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110"
                  :style="bubbleStyle(node)"
                  :title="`${node.label}\n${node.description}\n掌握度: ${node.mastery}%`">
                  <span class="text-white font-bold leading-tight text-center" :class="bubbleTextClass(node)">{{ node.shortLabel }}</span>
                  <span class="text-white/90 text-[10px] leading-tight" :class="bubbleTextClass(node)">{{ node.mastery }}%</span>
                </div>
              </div>

              <!-- 选中泡泡的详情 -->
              <div v-if="selectedBubble" class="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full" :style="{ background: bubbleColor(bubbleNode(selectedBubble)?.mastery ?? 50, bubbleNode(selectedBubble)?.category ?? 'foundation') }" />
                  <p class="text-sm font-bold text-gray-800">{{ bubbleNode(selectedBubble)?.label }}</p>
                  <span class="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{{ bubbleNode(selectedBubble)?.chapter }}</span>
                </div>
                <p class="text-xs text-gray-500">{{ bubbleNode(selectedBubble)?.description }}</p>
                <div class="flex items-center gap-3 text-xs">
                  <span class="text-gray-400">掌握度</span>
                  <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full rounded-full" :style="{ width: (bubbleNode(selectedBubble)?.mastery ?? 0) + '%', background: bubbleColor(bubbleNode(selectedBubble)?.mastery ?? 50, bubbleNode(selectedBubble)?.category ?? 'foundation') }" />
                  </div>
                  <span class="font-bold" :style="{ color: bubbleColor(bubbleNode(selectedBubble)?.mastery ?? 50, bubbleNode(selectedBubble)?.category ?? 'foundation') }">{{ bubbleNode(selectedBubble)?.mastery }}%</span>
                </div>
                <!-- 选中节点的关联 -->
                <div v-if="bubbleEdges(selectedBubble).length > 0" class="pt-1 border-t border-gray-200">
                  <p class="text-[11px] text-gray-400 mb-1">关联关系</p>
                  <div v-for="edge in bubbleEdges(selectedBubble)" :key="edge.source + edge.target"
                    class="text-xs text-gray-600 flex items-center gap-1.5">
                    <span :class="edge.source === selectedBubble ? 'font-semibold' : ''">{{ nodeLabel(edge.source) }}</span>
                    <ArrowRight class="w-3 h-3 text-gray-400" />
                    <span class="px-1 py-0.5 rounded text-[10px]" :class="relationChipClass(edge.relation)">{{ edge.label }}</span>
                    <ArrowRight class="w-3 h-3 text-gray-400" />
                    <span :class="edge.target === selectedBubble ? 'font-semibold' : ''">{{ nodeLabel(edge.target) }}</span>
                  </div>
                </div>
              </div>

              <!-- 全部关联关系 -->
              <div class="space-y-1">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">全部知识关联（{{ kgEdges.length }}条）</p>
                <div class="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                  <div v-for="(edge, i) in kgEdges" :key="i"
                    class="flex items-center gap-1.5 px-4 py-2 text-xs">
                    <span class="font-medium text-gray-700">{{ nodeLabel(edge.source) }}</span>
                    <ArrowRight class="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span class="px-1.5 py-0.5 rounded text-[10px] flex-shrink-0" :class="relationChipClass(edge.relation)">{{ edge.label }}</span>
                    <ArrowRight class="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span class="font-medium text-gray-700">{{ nodeLabel(edge.target) }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- JSON 视图 -->
            <pre v-if="graphViewMode === 'json'"
              class="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono">{{ knowledgeGraphJson }}</pre>
          </div>

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

          <!-- ===== 评价填写 ===== -->
          <div v-if="activeTab === 'evaluations'" class="space-y-4">
            <h3 class="text-sm font-semibold text-gray-800">课程评价</h3>
            <div v-if="isReadOnly" class="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
              <Eye class="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>课程已结束，评价填写功能已关闭</p>
              <p class="text-xs mt-1">如需查看评价记录，请在"综合评价"中查看</p>
            </div>
            <StudentEvaluation v-else :course-id="courseId" :student-id="myStudent?.id || ''"
              :student-name="myStudent?.name || store.currentUser || ''" />
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import {
  ArrowLeft, BookOpen, FileText, ClipboardCheck, Edit3,
  CheckCircle, Circle, Layers, GitBranch, BarChart3, Award, Sparkles, UserCheck, Users, MessageSquare, ArrowRight, Eye
} from 'lucide-vue-next'
import StudentEvaluation from '@/components/StudentEvaluation.vue'
import type { Evaluation } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const courseId = route.params.id as string
const myStudent = computed(() => store.students.find((s) => s.name === store.currentUser))
const activeTab = ref('tasks')

onMounted(() => {
  store.pushNearDeadlineEvalReminders()
})

const tabs = [
  { id: 'ai_tier', label: 'AI分层', icon: Layers },
  { id: 'knowledge_graph', label: '知识图谱', icon: GitBranch },
  { id: 'tasks', label: '任务', icon: Edit3 },
  { id: 'resources', label: '资源', icon: FileText },
  { id: 'homework', label: '作业', icon: BookOpen },
  { id: 'evaluations', label: '评价填写', icon: ClipboardCheck },
  { id: 'eval_overview', label: '综合评价', icon: Award },
]

const course = computed(() => store.courses.find((c) => c.id === courseId))
const isReadOnly = computed(() => course.value?.status !== 'active')
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

// ===== 知识图谱 (节点 + 边) =====
interface KnowledgeNode {
  id: string
  label: string
  mastery: number
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

  // 各课程有不同的知识体系
  const graphs: Record<string, { nodes: Omit<KnowledgeNode, 'mastery'>[]; edges: KnowledgeEdge[] }> = {
    // 编程类课程知识图谱
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
    // 数据科学类课程
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
    // AI/生成式课程
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
    // UI/UX 设计课程
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

  const nodes: KnowledgeNode[] = courseGraph.nodes.map((n) => ({
    ...n,
    mastery: masteryFor(
      n.category === 'foundation' ? 70 + Math.floor(Math.random() * 20) :
      n.category === 'core' ? 50 + Math.floor(Math.random() * 30) :
      n.category === 'advanced' ? 30 + Math.floor(Math.random() * 35) :
      20 + Math.floor(Math.random() * 50)
    ),
  }))

  return { nodes, edges: courseGraph.edges }
}

// 当前课程的知识图谱 (响应式)
const knowledgeGraphData = computed<KnowledgeGraph>(() =>
  generateKnowledgeGraph(courseId, myStudent.value?.id || '')
)

// ===== 知识图谱泡泡可视化辅助 =====
const graphViewMode = ref<'bubble' | 'json'>('bubble')

function toggleGraphView() {
  graphViewMode.value = graphViewMode.value === 'bubble' ? 'json' : 'bubble'
}

// 提取节点基本信息
const kgNodes = computed(() =>
  knowledgeGraphData.value.nodes.map((n) => ({
    ...n,
    shortLabel: n.label.length > 4 ? n.label.slice(0, 2) : n.label.slice(0, 2),
  }))
)

const kgEdges = computed(() => knowledgeGraphData.value.edges)

function nodeLabel(id: string): string {
  const n = knowledgeGraphData.value.nodes.find((n) => n.id === id)
  return n ? n.label : id
}

// 泡泡尺寸 = 60px ~ 130px (基于 mastery 缩放)
const MIN_BUBBLE = 60
const MAX_BUBBLE = 130
function bubbleSize(mastery: number): number {
  return MIN_BUBBLE + (mastery / 100) * (MAX_BUBBLE - MIN_BUBBLE)
}

// 分类颜色配置 (light 用于图例, deep 用于深色高掌握度)
const categoryColors = [
  { key: 'foundation', label: '基础知识', light: '#93c5fd', mid: '#3b82f6', deep: '#1d4ed8' },
  { key: 'core', label: '核心能力', light: '#6ee7b7', mid: '#10b981', deep: '#047857' },
  { key: 'advanced', label: '进阶能力', light: '#fcd34d', mid: '#f59e0b', deep: '#b45309' },
  { key: 'comprehensive', label: '综合能力', light: '#c4b5fd', mid: '#8b5cf6', deep: '#6d28d9' },
]

function categoryColorMap(cat: string): { light: string; mid: string; deep: string } {
  return categoryColors.find((c) => c.key === cat) || categoryColors[0]
}

// 计算泡泡颜色：掌握度越高 -> 越深 (light -> mid -> deep 渐变)
function bubbleColor(mastery: number, category: string): string {
  const cc = categoryColorMap(category)
  if (mastery >= 80) return cc.deep
  if (mastery >= 50) return cc.mid
  return cc.light
}

// 泡泡样式
function bubbleStyle(node: { mastery: number; category: string }): Record<string, string> {
  const size = bubbleSize(node.mastery)
  return {
    width: `${size}px`,
    height: `${size}px`,
    background: bubbleColor(node.mastery, node.category),
    boxShadow: node.mastery >= 80 ? `0 4px 14px ${bubbleColor(node.mastery, node.category)}66` : 'none',
  }
}

// 泡泡字体大小：大泡泡用大字体
function bubbleTextClass(node: { mastery: number }): string {
  if (node.mastery >= 80) return 'text-sm'
  if (node.mastery >= 50) return 'text-xs'
  return 'text-[10px]'
}

// 选中的泡泡节点
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
    prerequisite: 'bg-blue-50 text-blue-600',
    related_to: 'bg-gray-100 text-gray-600',
    extends: 'bg-purple-50 text-purple-600',
    part_of: 'bg-amber-50 text-amber-600',
  }
  return map[relation] || 'bg-gray-50 text-gray-500'
}

const copied = ref(false)

const knowledgeGraphJson = computed(() => {
  const course = store.courses.find((c) => c.id === courseId)
  const data = {
    course: { id: courseId, title: course?.title || '未知课程' },
    student: { id: myStudent.value?.id || '', name: myStudent.value?.name || store.currentUser },
    generatedAt: new Date().toISOString().split('T')[0],
    graph: knowledgeGraphData.value,
  }
  return JSON.stringify(data, null, 2)
})

async function copyKnowledgeGraphJson() {
  try {
    await navigator.clipboard.writeText(knowledgeGraphJson.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // fallback
    const ta = document.createElement('textarea')
    ta.value = knowledgeGraphJson.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
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
