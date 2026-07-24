<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">我的课程</h1>
      <p class="text-gray-400 mt-1">管理课程、查看学员进度和评价</p>
    </div>

    <!-- 课程卡片网格：2 列 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div
        v-for="course in myCourses" :key="course.id"
        @click="goDetail(course.id)"
        :class="[
          'group bg-white rounded-xl border shadow-sm transition-all duration-200 overflow-hidden cursor-pointer',
          course.status === 'active'
            ? 'border-brand-400/20 hover:shadow-lg'
            : 'border-brand-400/30 opacity-60 hover:opacity-70'
        ]"
      >
        <!-- 封面渐变区域 -->
        <div class="relative h-[136px]" :style="{ background: getCourseGradient(course.id) }">
          <!-- 封面图 -->
          <img
            v-if="course.cover"
            :src="course.cover"
            :alt="course.title"
            :class="[
              'w-full h-full object-cover transition-transform duration-300',
              course.status === 'active' ? 'group-hover:scale-105' : 'grayscale'
            ]"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          <!-- 已结束水印 -->
          <div v-if="course.status !== 'active'" class="absolute inset-0 flex items-center justify-center">
            <span class="text-white/50 text-lg font-bold tracking-widest -rotate-12 select-none">已结束</span>
          </div>

          <!-- 状态标签 - 右上角叠加 -->
          <span :class="`absolute top-3 right-3 z-10 text-xs px-2.5 py-1 rounded-full font-medium ${
            course.status === 'active'
              ? 'bg-brand-400/10 text-gray-800 backdrop-blur-sm'
              : 'bg-brand-400/10 text-gray-400 backdrop-blur-sm'
          }`">
            <span class="inline-block w-1.5 h-1.5 rounded-full mr-1" :class="course.status === 'active' ? 'bg-brand-600' : 'bg-brand-400'"></span>
            {{ course.status === 'active' ? '进行中' : '已结束' }}
          </span>

          <!-- 课程标题 & 统计信息叠加 -->
          <div class="absolute bottom-3 left-4 right-4">
            <h3 class="text-white font-bold text-lg leading-tight truncate">{{ course.title }}</h3>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <Users class="w-3 h-3 inline mr-0.5 -mt-0.5" />
                {{ studentCount(course.id) }} 名学生
              </span>
              <span class="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {{ course.duration || '-' }} 课时
              </span>
            </div>
          </div>
        </div>

        <!-- 卡片内容区域 -->
        <div class="p-4 space-y-3">
          <!-- 课程简介 -->
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">课程简介</p>
            <p class="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {{ course.description || '暂无描述' }}
            </p>
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
          @click="activeTab = 'resources'"
          :class="`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${activeTab === 'resources' ? 'bg-white text-blue-600 border border-b-0 border-gray-200 -mb-px' : 'text-gray-500 hover:text-gray-700'}`"
        >
          <FileText class="w-4 h-4 inline mr-1.5" />课程资源
        </button>
        <button
          @click="activeTab = 'evaluation'"
          :class="`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${activeTab === 'evaluation' ? 'bg-white text-blue-600 border border-b-0 border-gray-200 -mb-px' : 'text-gray-500 hover:text-gray-700'}`"
        >
          <ClipboardCheck class="w-4 h-4 inline mr-1.5" />评价管理
        </button>
      </div>

          <!-- 底部操作 -->
          <div class="flex items-center justify-between pt-1">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
              :class="course.status === 'active' ? 'bg-brand-600/10 text-gray-600 border-brand-400' : 'bg-brand-400/10 text-gray-400 border-brand-400/30'">
              <BookOpen class="w-3.5 h-3.5" />
              {{ course.status === 'active' ? '教学进行中' : '课程已结束' }}
            </span>

            <span class="inline-flex items-center gap-1 text-xs font-medium transition-colors"
              :class="course.status === 'active' ? 'text-gray-600 group-hover:text-gray-800' : 'text-gray-400'">
              {{ course.status === 'active' ? '管理课程' : '查看详情' }}
              <ArrowRight class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>


      <div v-if="myCourses.length === 0" class="col-span-2 text-center py-16 text-gray-400">
        <BookOpen class="w-12 h-12 mx-auto mb-4 text-gray-200" />
        <p>暂无课程</p>

      <!-- Tab 2: 课程资源 -->
      <div v-if="activeTab === 'resources'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-gray-900">课程资源管理</h2>
            <p class="text-xs text-gray-400">上传的资源将在学生端课程学习页面展示</p>
          </div>
          <label class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors">
            <Upload class="w-4 h-4" />
            <span>上传文件</span>
            <input type="file" @change="handleFileUpload" class="hidden" />
          </label>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="file in courseResources" :key="file.id" class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                  <FileText class="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ file.name }}</p>
                  <p class="text-xs text-gray-400">{{ formatFileSize(file.size) }} · {{ file.uploadedAt }}</p>
                </div>
              </div>
              <button @click="handleDeleteFile(file.id)" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除文件">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <div v-if="courseResources.length === 0" class="col-span-full text-center py-8 text-gray-400">暂无课程资源，点击上方按钮上传</div>
          </div>
        </div>
      </div>

      <!-- Tab 3: 评价管理 -->
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

import { BookOpen, Users, ArrowRight } from 'lucide-vue-next'

import {
  BookOpen, ChevronDown, ChevronUp, Users, ClipboardCheck,
  Search, Settings, RefreshCw, AlertTriangle, Eye, EyeOff,
  FileText, Upload, Trash2
} from 'lucide-vue-next'
import {
  EvalTemplateLabels, EvalTemplateDescs, TEMPLATE_EVAL_TYPES,
  EvalTypeLabels, EvalTypeColors,
  EvalFrequencyLabels, EvalFrequencyDescs, OverdueRuleLabels
} from '@/types'
import type { EvalTemplate, EvalType, Evaluation, EvalFrequency, OverdueRule } from '@/types'


const router = useRouter()
const store = useAppStore()

const isMentor = computed(() => store.currentRole === 'mentor')

const myCourses = computed(() => {
  if (isMentor.value) {
    const mentorCourseIds = store.getMentorCourseIds(store.currentUser || '')
    return store.courses.filter((c) => mentorCourseIds.includes(c.id))
  }
  return store.courses.filter((c) => c.teacher === store.currentUser)
})

/** 根据课程 ID 分配不同的渐变配色 */
const gradients = [
  'linear-gradient(135deg, #4F46E5, #429fc4)',
  'linear-gradient(135deg, #429fc4, #429fc4)',
  'linear-gradient(135deg, #429fc4, #429fc4)',
  'linear-gradient(135deg, #DC2626, #429fc4)',
  'linear-gradient(135deg, #429fc4, #429fc4)',
  'linear-gradient(135deg, #429fc4, #429fc4)',
  'linear-gradient(135deg, #0891B2, #22D3EE)',
  'linear-gradient(135deg, #BE123C, #FB7185)',
]


function getCourseGradient(courseId: string): string {
  let hash = 0
  for (let i = 0; i < courseId.length; i++) {
    hash = ((hash << 5) - hash) + courseId.charCodeAt(i)
    hash |= 0

const ALL_EVAL_TYPES: EvalType[] = ['self', 'intra_group', 'inter_group', 'teacher', 'mentor']
const EVAL_TEMPLATE_KEYS = Object.keys(EvalTemplateLabels) as EvalTemplate[]
const EVAL_FREQUENCY_KEYS = Object.keys(EvalFrequencyLabels) as EvalFrequency[]
const OVERDUE_RULE_KEYS = Object.keys(OverdueRuleLabels) as OverdueRule[]

// 课程选择 & Tab
const selectedCourseId = ref<string | null>(null)
const activeTab = ref<'progress' | 'resources' | 'evaluation'>('progress')

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

const courseResources = computed(() => {
  if (!selectedCourseId.value) return []
  return store.getCourseCloudFiles(selectedCourseId.value)
})

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const handleFileUpload = (event: Event) => {
  if (!selectedCourseId.value) {
    alert('请先选择一门课程')
    return
  }
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  store.addCloudFile({
    id: `file-${Date.now()}`,
    name: file.name,
    size: file.size,
    type: file.type,
    dataUrl: 'https://example.com/files/' + file.name,
    uploadedAt: new Date().toISOString().split('T')[0],
    uploadedBy: store.currentUser || '教师',
    courseId: selectedCourseId.value,
  })

  target.value = ''
  alert('文件上传成功！学生可在课程学习页面查看')
}

const handleDeleteFile = (fileId: string) => {
  if (confirm('确定要删除这个文件吗？')) {
    store.deleteCloudFile(fileId)
    alert('文件已删除')
  }
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
  return gradients[Math.abs(hash) % gradients.length]
}

function studentCount(courseId: string) {
  return store.enrollments.filter((e) => e.courseId === courseId && e.status !== 'dropped').length
}

function goDetail(courseId: string) {
  router.push(`${isMentor.value ? '/mentor' : '/teacher'}/courses/${courseId}`)
}
</script>
