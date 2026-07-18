<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">个人画像</h1>
      <p class="text-gray-500 mt-1">查看个人信息与学习能力分析</p>
    </div>

    <!-- 个人信息卡片 -->
    <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <div class="flex items-start gap-6">
        <div class="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <span class="text-2xl font-bold text-blue-600">{{ student?.name?.charAt(0) || '?' }}</span>
        </div>
        <div class="flex-1">
          <h2 class="text-xl font-bold text-gray-900">{{ student?.name || store.currentUser || '未知用户' }}</h2>
          <div class="grid grid-cols-2 gap-x-8 gap-y-2 mt-3">
            <span class="flex items-center gap-2 text-sm text-gray-500"><Mail class="w-4 h-4" /> {{ student?.email || '未设置' }}</span>
            <span class="flex items-center gap-2 text-sm text-gray-500"><Phone class="w-4 h-4" /> {{ student?.phone || '未设置' }}</span>
            <span class="flex items-center gap-2 text-sm text-gray-500"><Calendar class="w-4 h-4" /> 入学时间：{{ student?.joinDate || '未知' }}</span>
            <span class="flex items-center gap-2 text-sm text-gray-500"><User class="w-4 h-4" /> 学号：{{ student?.id || '未知' }}</span>
          </div>
        </div>
        <div class="flex gap-6">
          <div class="text-center px-4 py-3 bg-blue-50 rounded-lg">
            <p class="text-2xl font-bold text-blue-600">{{ myEnrollments.length }}</p>
            <p class="text-xs text-gray-500 mt-1">已报名</p>
          </div>
          <div class="text-center px-4 py-3 bg-emerald-50 rounded-lg">
            <p class="text-2xl font-bold text-emerald-600">{{ completed }}</p>
            <p class="text-xs text-gray-500 mt-1">已完成</p>
          </div>
          <div class="text-center px-4 py-3 bg-amber-50 rounded-lg">
            <p class="text-2xl font-bold text-amber-600">{{ avgScore }}</p>
            <p class="text-xs text-gray-500 mt-1">平均分</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 能力雷达图 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 class="w-5 h-5 text-blue-500" /> 能力雷达图
        </h3>
        <div class="relative w-72 h-72 mx-auto">
          <svg viewBox="0 0 200 200" class="w-full h-full">
            <!-- 网格 -->
            <polygon v-for="level in 5" :key="level" :points="gridPoints(level)" fill="none" stroke="#e2e8f0" stroke-width="1" />
            <!-- 轴线 -->
            <line v-for="(_, i) in radarData" :key="'axis-' + i" :x1="100" :y1="100" :x2="axisEndX(i)" :y2="axisEndY(i)" stroke="#e2e8f0" stroke-width="1" />
            <!-- 数据区域 -->
            <polygon :points="dataPolygonPoints" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" stroke-width="2" />
            <!-- 数据点 -->
            <g v-for="(d, i) in radarData" :key="'point-' + i">
              <circle :cx="dataPointX(i)" :cy="dataPointY(i)" r="4" fill="#3b82f6" />
              <text :x="dataLabelX(i)" :y="dataLabelY(i)" :text-anchor="dataLabelAnchor(i)" font-size="10" fill="#64748b">
                {{ d.label }} {{ d.value }}%
              </text>
            </g>
          </svg>
        </div>
      </div>

      <!-- 学习统计 -->
      <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp class="w-5 h-5 text-emerald-500" /> 学习统计
        </h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">学习中课程</span>
            <span class="font-semibold text-gray-900">{{ inProgress }} 门</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">已完成课程</span>
            <span class="font-semibold text-emerald-600">{{ completed }} 门</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">总学分</span>
            <span class="font-semibold text-blue-600">{{ totalCredits }} 学分</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">平均成绩</span>
            <span class="font-semibold text-amber-600">{{ avgScore }} 分</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">平均进度</span>
            <span class="font-semibold text-gray-900">{{ avgProgress }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习轨迹 -->
    <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BookOpen class="w-5 h-5 text-purple-500" /> 学习轨迹
      </h3>
      <div class="relative">
        <div v-for="(enr, index) in myEnrollments" :key="enr.id" class="flex gap-4 pb-6 relative">
          <div v-if="index < myEnrollments.length - 1" class="absolute left-[7px] top-4 bottom-0 w-0.5 bg-blue-200" />
          <div :class="`w-4 h-4 rounded-full mt-1 flex-shrink-0 ${
            enr.status === 'completed' ? 'bg-emerald-500' :
            enr.status === 'in_progress' ? 'bg-amber-500' : 'bg-blue-500'
          }`" />
          <div class="flex-1">
            <p class="font-medium text-gray-900">{{ getCourse(enr.courseId)?.title || '未知课程' }}</p>
            <p class="text-sm text-gray-500">
              {{ enr.enrollDate }} · 进度 {{ enr.progress }}% · 
              {{ enr.status === 'completed' ? ' 已完成' : enr.status === 'in_progress' ? ' 学习中' : ' 已报名' }}
            </p>
          </div>
        </div>
        <p v-if="myEnrollments.length === 0" class="text-gray-400 text-center py-4">暂无学习记录</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { User, Mail, Phone, Calendar, BookOpen, Award, TrendingUp, BarChart3 } from 'lucide-vue-next'

const store = useAppStore()
const student = computed(() => store.students.find((s) => s.name === store.currentUser))
const myEnrollments = computed(() => (student.value ? store.enrollments.filter((e) => e.studentId === student.value!.id) : []))
const myGrades = computed(() => (student.value ? store.grades.filter((g) => g.studentId === student.value!.id) : []))

const completed = computed(() => myEnrollments.value.filter((e) => e.status === 'completed').length)
const inProgress = computed(() => myEnrollments.value.filter((e) => e.status === 'in_progress').length)

const avgScore = computed(() => {
  if (myGrades.value.length === 0) return 0
  return Math.round(myGrades.value.reduce((s, g) => s + g.score, 0) / myGrades.value.length)
})

const totalCredits = computed(() => {
  return myEnrollments.value.reduce((sum, e) => {
    const course = store.courses.find((c) => c.id === e.courseId)
    return sum + (course ? Math.round(course.duration / 8) : 0)
  }, 0)
})

const avgProgress = computed(() => {
  if (myEnrollments.value.length === 0) return 0
  return Math.round(myEnrollments.value.reduce((s, e) => s + e.progress, 0) / myEnrollments.value.length)
})

const getCourse = (id: string) => store.courses.find((c) => c.id === id)

const radarData = [
  { label: '理论学习', value: 85 },
  { label: '实践能力', value: 70 },
  { label: '创新思维', value: 65 },
  { label: '团队协作', value: 80 },
  { label: '自主学习', value: 75 },
  { label: '问题解决', value: 78 },
]

function gridPoints(level: number): string {
  const r = level * 30
  return radarData.map((_, i) => {
    const angle = (i * 60 - 90) * Math.PI / 180
    return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`
  }).join(' ')
}

function axisEndX(i: number): number {
  const angle = (i * 60 - 90) * Math.PI / 180
  return 100 + 150 * Math.cos(angle)
}

function axisEndY(i: number): number {
  const angle = (i * 60 - 90) * Math.PI / 180
  return 100 + 150 * Math.sin(angle)
}

const dataPolygonPoints = computed(() => {
  return radarData.map((d, i) => {
    const angle = (i * 60 - 90) * Math.PI / 180
    const r = d.value * 1.5
    return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`
  }).join(' ')
})

function dataPointX(i: number): number {
  const angle = (i * 60 - 90) * Math.PI / 180
  const r = radarData[i].value * 1.5
  return 100 + r * Math.cos(angle)
}

function dataPointY(i: number): number {
  const angle = (i * 60 - 90) * Math.PI / 180
  const r = radarData[i].value * 1.5
  return 100 + r * Math.sin(angle)
}

function dataLabelX(i: number): number {
  const angle = (i * 60 - 90) * Math.PI / 180
  const r = radarData[i].value * 1.5
  const x = 100 + r * Math.cos(angle)
  return x + (x > 100 ? 12 : -12)
}

function dataLabelY(i: number): number {
  const angle = (i * 60 - 90) * Math.PI / 180
  const r = radarData[i].value * 1.5
  const y = 100 + r * Math.sin(angle)
  return y + 4
}

function dataLabelAnchor(i: number): string {
  const angle = (i * 60 - 90) * Math.PI / 180
  const r = radarData[i].value * 1.5
  const x = 100 + r * Math.cos(angle)
  return x > 100 ? 'start' : 'end'
}
</script>