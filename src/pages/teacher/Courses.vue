<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">我的课程</h1>
      <p class="text-gray-500 mt-1">管理课程、查看学员进度和评价</p>
    </div>

    <!-- 课程卡片网格 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="course in myCourses" :key="course.id"
        @click="selectedCourseId = selectedCourseId === course.id ? null : course.id; activeTab = 'progress'"
        :class="`bg-white rounded-xl border shadow-sm p-5 transition-all cursor-pointer ${selectedCourseId === course.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100 hover:shadow-md'}`"
      >
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
            <BookOpen class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">{{ course.title }}</h3>
            <p class="text-xs text-gray-400">{{ course.id }}</p>
          </div>
        </div>
        <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span>{{ store.enrollments.filter(e => e.courseId === course.id && e.status !== 'dropped').length }} 名学生</span>
          <span :class="`text-xs px-2 py-0.5 rounded-full ${course.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`">
            {{ course.status === 'active' ? '进行中' : '已结束' }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">点击展开详情</span>
          <ChevronDown v-if="selectedCourseId !== course.id" class="w-4 h-4 text-gray-300" />
          <ChevronUp v-else class="w-4 h-4 text-blue-400" />
        </div>
      </div>
      <div v-if="myCourses.length === 0" class="col-span-full text-center py-12 text-gray-400">暂无课程</div>
    </div>

    <!-- 展开的课程详情 -->
    <div v-if="selectedCourseId && selectedCourseData" class="space-y-4">
      <!-- 当前选中课程信息栏 -->
      <div class="bg-blue-50 rounded-xl border border-blue-100 p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
            <BookOpen class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">{{ selectedCourseData.title }}</h3>
            <p class="text-xs text-gray-500">{{ selectedCourseData.id }} · {{ selectedCourseData.duration }}课时</p>
          </div>
        </div>
        <span :class="`text-xs px-2 py-0.5 rounded-full ${selectedCourseData.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`">
          {{ selectedCourseData.status === 'active' ? '进行中' : '已结束' }}
        </span>
      </div>

      <!-- Tab 切换 -->
      <div class="flex gap-1 border-b border-gray-200">
        <button
          @click="activeTab = 'progress'"
          :class="`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${activeTab === 'progress' ? 'bg-white text-blue-600 border border-b-0 border-gray-200 -mb-px' : 'text-gray-500 hover:text-gray-700'}`"
        >
          <Users class="w-4 h-4 inline mr-1.5" />学员进度
        </button>
        <button
          @click="activeTab = 'evaluation'"
          :class="`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${activeTab === 'evaluation' ? 'bg-white text-blue-600 border border-b-0 border-gray-200 -mb-px' : 'text-gray-500 hover:text-gray-700'}`"
        >
          <ClipboardCheck class="w-4 h-4 inline mr-1.5" />评价管理
        </button>
      </div>

      <!-- Tab 1: 学员进度 -->
      <div v-if="activeTab === 'progress'" class="space-y-6">
        <div class="flex flex-wrap gap-4">
          <div class="relative flex-1 min-w-[200px] max-w-sm">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input v-model="search" type="text" placeholder="搜索学员..."
              class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm" />
          </div>
          <select v-model="selectedCourseFilter"
            class="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm bg-white">
            <option value="all">全部课程</option>
            <option v-for="c in myCourses" :key="c.id" :value="c.id">{{ c.title }}</option>
          </select>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-100">
                  <th class="text-left px-6 py-3 text-sm font-medium text-gray-500">学员</th>
                  <th class="text-left px-6 py-3 text-sm font-medium text-gray-500">课程</th>
                  <th class="text-left px-6 py-3 text-sm font-medium text-gray-500">状态</th>
                  <th class="text-left px-6 py-3 text-sm font-medium text-gray-500">学习进度</th>
                  <th class="text-left px-6 py-3 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="enr in displayEnrollments" :key="enr.id" class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span class="text-xs font-medium text-emerald-600">{{ getStudentName(enr.studentId).charAt(0) }}</span>
                      </div>
                      <span class="font-medium text-gray-900">{{ getStudentName(enr.studentId) }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ getCourseTitle(enr.courseId) }}</td>
                  <td class="px-6 py-4">
                    <span :class="`text-xs px-2 py-1 rounded-full font-medium ${statusColors[enr.status]}`">
                      {{ statusLabels[enr.status] }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="flex-1 bg-gray-100 rounded-full h-2 max-w-[120px]">
                        <div class="h-full rounded-full bg-emerald-400 transition-all" :style="{ width: `${enr.progress}%` }" />
                      </div>
                      <span class="text-xs font-medium text-gray-600 w-10">{{ enr.progress }}%</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-1">
                      <button @click="handleProgressUpdate(enr.id, enr.progress - 10)"
                        class="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors">-10</button>
                      <button @click="handleProgressUpdate(enr.id, enr.progress + 10)"
                        class="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors">+10</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="displayEnrollments.length === 0" class="text-center py-8 text-gray-400">暂无数据</div>
        </div>
      </div>

      <!-- Tab 2: 评价管理 -->
      <div v-if="activeTab === 'evaluation'" class="space-y-6">
        <!-- 评价方案设置（折叠式） -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <button
            @click="showSettings = !showSettings"
            class="w-full flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <Settings class="w-5 h-5 text-gray-400" />
              <h2 class="font-semibold text-gray-900">评价方案配置</h2>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-gray-400">
                {{ selectedConfig ? EvalTemplateLabels[selectedConfig.template] : '未配置' }} ·
                {{ selectedConfig ? EvalFrequencyLabels[selectedConfig.frequency] : '默认频率' }}
              </span>
              <span class="text-xs text-gray-400 hover:text-gray-600">{{ showSettings ? '收起 ▲' : '展开 ▼' }}</span>
            </div>
          </button>

          <div class="flex flex-wrap gap-2 mt-3 mb-1">
            <template v-for="t in ALL_EVAL_TYPES" :key="t">
              <span v-if="!selectedConfig || !TEMPLATE_EVAL_TYPES[selectedConfig.template].includes(t)"
                class="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-300 border border-gray-200">
                {{ EvalTypeLabels[t] }} ✗
              </span>
              <span v-else-if="(t === 'intra_group' || t === 'inter_group') && !courseHasGroups || t === 'mentor' && selectedConfig && !selectedConfig.hasMentor"
                class="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-500 border border-amber-200">
                <EyeOff class="w-3 h-3 inline mr-0.5" />
                {{ EvalTypeLabels[t] }}（自动隐藏）
              </span>
              <span v-else
                :class="`text-xs px-2.5 py-1 rounded-full border ${EvalTypeColors[t]}`">
                <Eye class="w-3 h-3 inline mr-0.5" />
                {{ EvalTypeLabels[t] }}
              </span>
            </template>
          </div>

          <template v-if="showSettings">
            <div class="border-t border-gray-100 mt-3 pt-4 space-y-4">
              <!-- 评价模板 -->
              <div>
                <p class="text-sm font-medium text-gray-700 mb-2">评价模板</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button
                    v-for="tpl in EVAL_TEMPLATE_KEYS" :key="tpl"
                    @click="handleSetConfig({ template: tpl })"
                    :class="`text-left p-3 rounded-lg border transition-all ${selectedConfig?.template === tpl ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'}`"
                  >
                    <span class="text-sm font-medium text-gray-900">{{ EvalTemplateLabels[tpl] }}</span>
                    <p class="text-xs text-gray-400 mt-0.5">{{ EvalTemplateDescs[tpl] }}</p>
                    <div class="flex gap-1 mt-1">
                      <span v-for="et in TEMPLATE_EVAL_TYPES[tpl]" :key="et"
                        class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        {{ EvalTypeLabels[et] }}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <!-- 评价频率 -->
              <div>
                <p class="text-sm font-medium text-gray-700 mb-2">评价频率</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button
                    v-for="freq in EVAL_FREQUENCY_KEYS" :key="freq"
                    @click="handleSetConfig({ frequency: freq })"
                    :class="`text-left p-3 rounded-lg border transition-all ${selectedConfig?.frequency === freq ? 'border-cyan-300 bg-cyan-50' : 'border-gray-200 bg-white hover:border-gray-300'}`"
                  >
                    <span class="text-sm font-medium text-gray-900">{{ EvalFrequencyLabels[freq] }}</span>
                    <p class="text-xs text-gray-400 mt-0.5">{{ EvalFrequencyDescs[freq] }}</p>
                    <span class="text-xs text-cyan-500 mt-0.5 block">
                      共 {{ selectedCourseId ? store.getEvalSessions(selectedCourseId) : 0 }} 次评价
                    </span>
                  </button>
                </div>
                <div v-if="selectedConfig?.frequency === 'custom'" class="mt-2">
                  <label class="text-xs text-gray-500">自定义评价次数：</label>
                  <input type="number" min="1" max="20"
                    :value="selectedConfig?.customSessions || 3"
                    @change="(e) => handleSetConfig({ customSessions: parseInt((e.target as HTMLInputElement).value) || 3 })"
                    class="ml-2 w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>

              <!-- 企业导师参与 -->
              <div class="flex items-center gap-3">
                <label class="text-sm font-medium text-gray-700">企业导师参与评价</label>
                <button
                  @click="handleSetConfig({ hasMentor: !selectedConfig?.hasMentor })"
                  :class="`relative w-10 h-5 rounded-full transition-colors ${selectedConfig?.hasMentor ? 'bg-emerald-400' : 'bg-gray-300'}`"
                >
                  <span :class="`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${selectedConfig?.hasMentor ? 'left-5.5' : 'left-0.5'}`" />
                </button>
                <span class="text-xs text-gray-400">
                  {{ selectedConfig?.hasMentor ? '已启用' : '已禁用' }}——
                  {{ selectedConfig?.hasMentor ? '学生端将显示企业导师评价卡片' : '学生端自动隐藏企业导师评价' }}
                </span>
              </div>

              <!-- 逾期处理规则 -->
              <div>
                <p class="text-sm font-medium text-gray-700 mb-2">逾期未评处理规则</p>
                <div class="flex gap-3">
                  <button
                    v-for="rule in OVERDUE_RULE_KEYS" :key="rule"
                    @click="handleSetConfig({ overdueRule: rule })"
                    :class="`px-4 py-2 rounded-lg border text-sm transition-all ${selectedConfig?.overdueRule === rule ? 'border-purple-300 bg-purple-50 text-purple-700 font-medium' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`"
                  >
                    {{ OverdueRuleLabels[rule] }}
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 异常预警 -->
        <div v-if="anomalies.length > 0" class="bg-red-50 border border-red-200 rounded-xl p-4">
          <div class="flex items-center gap-2 text-red-600 font-medium mb-2">
            <AlertTriangle class="w-5 h-5" />
            异常预警（自评与他评差异过大）
          </div>
          <div class="space-y-1">
            <p v-for="{ session, anomaly } in anomalies" :key="anomaly.id" class="text-sm text-red-500">{{ anomaly.warning }}</p>
          </div>
        </div>

        <!-- 一键批量评价 -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <ClipboardCheck class="w-5 h-5 text-gray-400" />
              <h2 class="font-semibold text-gray-900">一键等级批量评价</h2>
              <span class="text-xs text-gray-400">（为所有学生第1次评价生成教师/导师评价）</span>
            </div>
            <button @click="handleProcessOverdue"
              class="text-xs flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100">
              <RefreshCw class="w-3 h-3" />
              处理逾期自评
            </button>
          </div>

          <div class="flex flex-wrap gap-4">
            <template v-for="type in enabledTypes.filter(t => t === 'teacher' || t === 'mentor')" :key="type">
              <div class="flex-1 min-w-[200px] p-3 rounded-lg border border-gray-100 bg-gray-50">
                <p class="text-sm font-medium text-gray-700 mb-2">{{ EvalTypeLabels[type] }}批量</p>
                <div class="flex flex-col gap-1.5">
                  <button
                    v-for="level in LEVEL_OPTIONS" :key="level.label"
                    @click="handleBatchEval(type, level.label)"
                    :class="`text-xs px-3 py-1.5 rounded-lg border transition-all ${level.color} hover:opacity-80`"
                  >
                    {{ level.label }} ({{ level.range[0] }}-{{ level.range[1] }}分)
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 学生评价详情 -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <Users class="w-5 h-5 text-gray-400" />
              <h2 class="font-semibold text-gray-900">学生评价详情</h2>
              <span class="text-xs text-gray-400">{{ enrolledStudents.length }}名学生 · 共{{ totalSessions }}次评价</span>
            </div>
            <select
              :value="evalTypeFilter"
              @change="evalTypeFilter = ($event.target as HTMLSelectElement).value as 'self' | 'intra_group' | 'inter_group' | 'teacher' | 'mentor' | 'all'"
              class="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white"
            >
              <option value="all">全部类型</option>
              <option v-for="t in enabledTypes" :key="t" :value="t">{{ EvalTypeLabels[t] }}</option>
            </select>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="text-left py-2 px-2 text-gray-500 font-medium">学生</th>
                  <th v-for="s in displaySessions" :key="s"
                    class="text-left py-2 px-2 text-gray-500 font-medium"
                    :colspan="filteredEvalTypes.length">
                    第{{ s }}次评价
                  </th>
                </tr>
                <tr class="border-b border-gray-100">
                  <th class="py-1 px-2"></th>
                  <template v-for="s in displaySessions" :key="s">
                    <th v-for="t in filteredEvalTypes" :key="`${s}-${t}`"
                      class="text-left py-1 px-2 text-[10px] text-gray-400 font-medium">
                      {{ EvalTypeLabels[t] }}
                    </th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <tr v-for="{ student } in enrolledStudents" :key="student!.id"
                  class="border-b border-gray-50 hover:bg-gray-50">
                  <td class="py-2 px-2 text-sm font-medium text-gray-700">{{ student!.name }}</td>
                  <template v-for="s in displaySessions" :key="s">
                    <td v-for="t in filteredEvalTypes" :key="`${student!.id}-${s}-${t}`" class="py-2 px-2">
                      <div :class="`text-xs px-2 py-1 rounded ${getScoreClass(student!.id, s, t)}`">
                        {{ getScoreDisplay(student!.id, s, t) }}
                        <AlertTriangle v-if="showAnomalyIcon(student!.id, s, t)" class="w-3 h-3 inline ml-1 text-red-400" />
                      </div>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import {
  BookOpen, ChevronDown, ChevronUp, Users, ClipboardCheck,
  Search, Settings, RefreshCw, AlertTriangle, Eye, EyeOff
} from 'lucide-vue-next'
import {
  EvalTemplateLabels, EvalTemplateDescs, TEMPLATE_EVAL_TYPES,
  EvalTypeLabels, EvalTypeColors,
  EvalFrequencyLabels, EvalFrequencyDescs, OverdueRuleLabels
} from '@/types'
import type { EvalTemplate, EvalType, Evaluation, EvalFrequency, OverdueRule } from '@/types'

const store = useAppStore()

const LEVEL_OPTIONS = [
  { label: 'A (优秀)', range: [90, 100], color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { label: 'B (良好)', range: [80, 89], color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { label: 'C (中等)', range: [70, 79], color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { label: 'D (及格)', range: [60, 69], color: 'bg-orange-100 text-orange-700 border-orange-300' },
]

const ALL_EVAL_TYPES: EvalType[] = ['self', 'intra_group', 'inter_group', 'teacher', 'mentor']
const EVAL_TEMPLATE_KEYS = Object.keys(EvalTemplateLabels) as EvalTemplate[]
const EVAL_FREQUENCY_KEYS = Object.keys(EvalFrequencyLabels) as EvalFrequency[]
const OVERDUE_RULE_KEYS = Object.keys(OverdueRuleLabels) as OverdueRule[]

// 课程选择 & Tab
const selectedCourseId = ref<string | null>(null)
const activeTab = ref<'progress' | 'evaluation'>('progress')

// 学员进度
const search = ref('')
const selectedCourseFilter = ref('all')

// 评价管理
const showSettings = ref(false)
const evalTypeFilter = ref<'all' | EvalType>('all')

// 计算属性
const myCourses = computed(() => store.courses.filter((c) => c.teacher === store.currentUser))
const selectedCourseData = computed(() => selectedCourseId.value ? store.courses.find((c) => c.id === selectedCourseId.value) : null)
const selectedConfig = computed(() => selectedCourseId.value ? store.evalConfigs.find((c) => c.courseId === selectedCourseId.value) : null)
const baseEnabledTypes = computed<EvalType[]>(() => selectedConfig.value ? TEMPLATE_EVAL_TYPES[selectedConfig.value.template] : [])
const totalSessions = computed(() => selectedCourseId.value ? store.getEvalSessions(selectedCourseId.value) : 1)
const courseHasGroups = computed(() => selectedCourseId.value ? store.hasGroups(selectedCourseId.value) : false)

const enabledTypes = computed(() => baseEnabledTypes.value.filter((t) => {
  if ((t === 'intra_group' || t === 'inter_group') && !courseHasGroups.value) return false
  if (t === 'mentor' && !selectedConfig.value?.hasMentor) return false
  return true
}))

const filteredEvalTypes = computed(() => enabledTypes.value.filter((t) => evalTypeFilter.value === 'all' || t === evalTypeFilter.value))

const displaySessions = computed(() => {
  const count = Math.min(totalSessions.value, 3)
  return Array.from({ length: count }, (_, i) => i + 1)
})

// 学员进度相关
const myCourseIds = computed(() => myCourses.value.map((c) => c.id))

const filteredEnrollments = computed(() => {
  return store.enrollments.filter((e) => {
    const matchCourse = selectedCourseFilter.value === 'all' || e.courseId === selectedCourseFilter.value
    const matchTeacher = myCourseIds.value.includes(e.courseId)
    return matchCourse && matchTeacher
  })
})

const displayEnrollments = computed(() => {
  return filteredEnrollments.value.filter((e) => {
    const student = store.students.find((s) => s.id === e.studentId)
    return !search.value || student?.name.includes(search.value)
  })
})

const getCourseTitle = (id: string) => store.courses.find((c) => c.id === id)?.title || '未知'
const getStudentName = (id: string) => store.students.find((s) => s.id === id)?.name || '未知'

const handleProgressUpdate = (enrollmentId: string, progress: number) => {
  const newProgress = Math.min(100, Math.max(0, progress))
  store.updateEnrollment(enrollmentId, { progress: newProgress })
}

const statusLabels: Record<string, string> = {
  enrolled: '已报名', in_progress: '学习中', completed: '已完成', dropped: '已退课',
}
const statusColors: Record<string, string> = {
  enrolled: 'bg-blue-50 text-blue-600', in_progress: 'bg-amber-50 text-amber-600',
  completed: 'bg-emerald-50 text-emerald-600', dropped: 'bg-red-50 text-red-600',
}

// 评价管理相关
const getCourseConfig = (courseId: string) => store.evalConfigs.find((c) => c.courseId === courseId)

const enrolledStudents = computed(() => {
  if (!selectedCourseId.value) return []
  return store.enrollments
    .filter((e) => e.courseId === selectedCourseId.value && e.status !== 'dropped')
    .map((e) => ({
      enrollmentId: e.id,
      student: store.students.find((s) => s.id === e.studentId),
    }))
    .filter((e) => e.student)
})

const anomalies = computed(() => {
  if (!selectedCourseId.value) return []
  const results: { session: number; anomaly: import('@/types').EvalAnomaly }[] = []
  for (let s = 1; s <= totalSessions.value; s++) {
    store.detectAnomalies(selectedCourseId.value, s).forEach((a) => results.push({ session: s, anomaly: a }))
  }
  return results
})

const handleSetConfig = (updates: Partial<import('@/types').EvaluationConfig>) => {
  if (!selectedCourseId.value) return
  const existing = store.evalConfigs.find((c) => c.courseId === selectedCourseId.value)
  const config = {
    courseId: selectedCourseId.value,
    template: existing?.template || 'standard',
    frequency: existing?.frequency || 'biweekly',
    hasMentor: existing?.hasMentor ?? false,
    overdueRule: existing?.overdueRule || 'average',
    ...existing,
    ...updates,
  }
  store.setEvalConfig(config)
}

const handleBatchEval = (type: EvalType, level: string) => {
  if (!selectedCourseId.value) return
  const range = LEVEL_OPTIONS.find((o) => o.label === level)?.range
  if (!range) return
  const score = Math.round((range[0] + range[1]) / 2)

  enrolledStudents.value.forEach(({ student }) => {
    if (!student) return
    const existing = store.evaluations.find(
      (e) => e.courseId === selectedCourseId.value && e.studentId === student.id && e.type === type && e.sessionNumber === 1 && e.evaluatorId.includes('t-')
    )
    const ev: Evaluation = {
      id: existing ? existing.id : `ev-batch-${Date.now()}-${student.id}-${type}`,
      courseId: selectedCourseId.value,
      studentId: student.id,
      sessionNumber: 1,
      type,
      score,
      evaluatorId: store.currentUser || 'teacher',
      evaluatorName: store.currentUser || '教师',
      comment: level,
      createdAt: new Date().toISOString().split('T')[0],
    }
    if (existing) {
      store.updateEvaluation(ev.id, { score, comment: level, createdAt: ev.createdAt })
    } else {
      store.addEvaluation(ev)
    }
  })
}

const getStudentEvals = (studentId: string, sessionNumber: number, type: EvalType) => {
  if (!selectedCourseId.value) return []
  return store.evaluations.filter(
    (e) => e.courseId === selectedCourseId.value && e.studentId === studentId && e.sessionNumber === sessionNumber && e.type === type
  )
}

const handleProcessOverdue = () => {
  if (!selectedCourseId.value) return
  for (let s = 1; s <= totalSessions.value; s++) {
    store.processSessionOverdue(selectedCourseId.value, s)
  }
}

const getScoreClass = (studentId: string, sessionNumber: number, type: EvalType) => {
  const evals = getStudentEvals(studentId, sessionNumber, type)
  const avgScore = evals.length > 0 ? Math.round(evals.reduce((a, e) => a + e.score, 0) / evals.length) : null
  const isSelf = type === 'self'
  const otherEvals = isSelf ? store.evaluations.filter(
    (e) => e.courseId === selectedCourseId.value && e.studentId === studentId && e.sessionNumber === sessionNumber && e.type !== 'self'
  ) : []
  const otherAvg = otherEvals.length > 0 ? Math.round(otherEvals.reduce((a, e) => a + e.score, 0) / otherEvals.length) : null
  const showAnomaly = isSelf && avgScore !== null && otherAvg !== null && Math.abs(avgScore - otherAvg) > 20

  if (showAnomaly) return 'bg-red-50 text-red-600'
  if (avgScore !== null) return isSelf ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
  return 'text-gray-300'
}

const getScoreDisplay = (studentId: string, sessionNumber: number, type: EvalType) => {
  const evals = getStudentEvals(studentId, sessionNumber, type)
  const avgScore = evals.length > 0 ? Math.round(evals.reduce((a, e) => a + e.score, 0) / evals.length) : null
  return avgScore !== null ? `${avgScore}分` : '-'
}

const showAnomalyIcon = (studentId: string, sessionNumber: number, type: EvalType) => {
  if (type !== 'self') return false
  const evals = getStudentEvals(studentId, sessionNumber, type)
  const avgScore = evals.length > 0 ? Math.round(evals.reduce((a, e) => a + e.score, 0) / evals.length) : null
  const otherEvals = store.evaluations.filter(
    (e) => e.courseId === selectedCourseId.value && e.studentId === studentId && e.sessionNumber === sessionNumber && e.type !== 'self'
  )
  const otherAvg = otherEvals.length > 0 ? Math.round(otherEvals.reduce((a, e) => a + e.score, 0) / otherEvals.length) : null
  return avgScore !== null && otherAvg !== null && Math.abs(avgScore - otherAvg) > 20
}

// 当选中课程变化时，自动同步课程筛选器
watch(selectedCourseId, (newVal) => {
  if (newVal) {
    selectedCourseFilter.value = newVal
  }
})
</script>