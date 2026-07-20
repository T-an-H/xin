<template>
  <div class="space-y-6">
    <!-- 头部 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">实施成绩</h1>
        <p class="text-gray-500 mt-1">课程实施成绩分布与统计概览，支持一键导出</p>
      </div>
      <button
        @click="exportGrades"
        class="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-lg shadow-emerald-500/25 text-sm font-medium"
      >
        <Download class="w-4 h-4" />
        导出成绩
      </button>
    </div>

    <!-- 统计卡片 -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <BookOpen class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p class="text-xs text-gray-500">总课程数</p>
          <p class="text-xl font-bold text-gray-900">{{ store.courses.length }}</p>
        </div>
      </div>
      <!-- 按学院分类的课程成绩汇总 -->
      <div class="space-y-4">
        <div v-for="section in courseSections" :key="section.categoryId" class="space-y-1.5">
          <div class="flex items-center gap-2 text-sm">
            <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: section.color }" />
            <span class="text-gray-500 text-xs font-medium">{{ section.name }}</span>
            <span class="text-gray-400 text-xs">({{ section.courses.length }}门)</span>
          </div>
          <div v-for="course in section.courses" :key="course.id" class="ml-4 space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-700">{{ course.title }}</span>
              <span class="text-gray-500 text-xs">{{ getCourseAvg(course.id) }}分</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500" :style="{ width: `${getCourseAvg(course.id)}%`, backgroundColor: section.color }" />
            </div>
          </div>
        </div>
        <div v-if="filteredCourses.length === 0" class="text-center py-4 text-gray-400">暂无数据</div>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="flex gap-3">
      <div class="relative">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="searchText" type="text" placeholder="搜索课程或学生..." class="w-64 pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
      </div>
      <select v-model="selectedCourse" class="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm bg-white">
        <option value="all">全部课程</option>
        <option v-for="c in store.courses" :key="c.id" :value="c.id">{{ c.title }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：图表区域 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 成绩分布 -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 class="text-sm font-semibold text-gray-800 mb-4">成绩分布</h3>
          <div class="space-y-2">
            <div v-for="(range, idx) in gradeRanges" :key="idx" class="flex items-center gap-3">
              <span class="text-xs text-gray-500 w-16">{{ range.label }}</span>
              <div class="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                <div class="h-full rounded transition-all duration-500" :style="{ width: `${range.percent}%`, backgroundColor: range.color }" />
              </div>
              <span class="text-xs text-gray-500 w-24 text-right">{{ range.count }}人 ({{ range.percent }}%)</span>
            </div>
            <div v-if="allScores.length === 0" class="text-center py-8 text-gray-400">暂无成绩数据</div>
          </div>
        </div>

        <!-- 成绩明细表 -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-800">成绩明细</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-100">
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">学生</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">课程</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">成绩</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">等级</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">评语</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">日期</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in filteredGrades" :key="g.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span class="text-xs font-medium text-blue-600">{{ getStudentName(g.studentId).charAt(0) }}</span>
                      </div>
                      <span class="text-sm font-medium text-gray-900">{{ getStudentName(g.studentId) }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ getCourseName(g.courseId) }}</td>
                  <td class="px-4 py-3">
                    <span class="text-sm font-semibold" :class="getGradeColor(g.totalScore)">{{ g.totalScore }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs px-2 py-1 rounded-full" :class="getGradeBadge(g.totalScore)">{{ getGradeLevel(g.totalScore) }}</span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{{ g.comment || '-' }}</td>
                  <td class="px-4 py-3 text-sm text-gray-400">{{ g.gradedAt }}</td>
                </tr>
                <tr v-if="filteredGrades.length === 0">
                  <td colspan="6" class="px-4 py-12 text-center text-gray-400">暂无成绩数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 右侧：统计概览 -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 class="text-sm font-semibold text-gray-800 mb-4">课程统计</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">进行中</span>
              <span class="text-lg font-bold text-green-600">{{ store.courses.filter(c => c.status === 'active').length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">已结束</span>
              <span class="text-lg font-bold text-gray-400">{{ store.courses.filter(c => c.status !== 'active').length }}</span>
            </div>
            <div class="border-t border-gray-100 pt-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">最高分</span>
                <span class="text-lg font-bold text-blue-600">{{ maxScore }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">最低分</span>
              <span class="text-lg font-bold text-red-500">{{ minScore }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">及格率</span>
              <span class="text-lg font-bold text-emerald-600">{{ passRate }}%</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 class="text-sm font-semibold text-gray-800 mb-3">分类统计</h3>
          <div class="space-y-2">
            <div v-for="cat in store.categories" :key="cat.id" class="flex items-center justify-between text-sm">
              <span class="text-gray-600">{{ cat.name }}</span>
              <span class="text-gray-900 font-medium">{{ store.courses.filter(c => c.categoryId === cat.id).length }}门</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { BookOpen, Download, Search } from 'lucide-vue-next'

const store = useAppStore()
const searchText = ref('')
const selectedCourse = ref('all')

// ====== 筛选 ======
const filteredCourses = computed(() => {
  if (selectedCourse.value === 'all') return store.courses
  return store.courses.filter((c) => c.id === selectedCourse.value)
})

const filteredGrades = computed(() => {
  let grades = store.grades
  if (selectedCourse.value !== 'all') {
    grades = grades.filter((g) => g.courseId === selectedCourse.value)
  }
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    grades = grades.filter((g) => {
      const student = store.students.find((s) => s.id === g.studentId)
      const course = store.courses.find((c) => c.id === g.courseId)
      return (student?.name || '').toLowerCase().includes(q) || (course?.title || '').toLowerCase().includes(q)
    })
  }
  return grades
})

// ====== 统计 ======
const allScores = computed(() => store.grades.map((g) => g.totalScore))

const maxScore = computed(() => {
  if (allScores.value.length === 0) return 0
  return Math.max(...allScores.value)
})

const minScore = computed(() => {
  if (allScores.value.length === 0) return 0
  return Math.min(...allScores.value)
})

const passRate = computed(() => {
  if (allScores.value.length === 0) return 0
  const passed = allScores.value.filter((s) => s >= 60).length
  return Math.round((passed / allScores.value.length) * 100)
})

// ====== 按学院分组 ======
const courseSections = computed(() => {
  return store.categories.map((cat) => ({
    categoryId: cat.id,
    name: cat.name,
    color: cat.color,
    courses: filteredCourses.value.filter((c) => c.categoryId === cat.id),
  }))
})

// ====== 课程成绩 ======
const getCourseAvg = (courseId: string) => {
  const grades = store.grades.filter((g) => g.courseId === courseId)
  if (grades.length === 0) return 0
  return Math.round(grades.reduce((s, g) => s + g.totalScore, 0) / grades.length)
}

// ====== 成绩分布 ======
const gradeRanges = computed(() => {
  const scores = selectedCourse.value === 'all'
    ? allScores.value
    : store.grades.filter((g) => g.courseId === selectedCourse.value).map((g) => g.totalScore)

  const ranges = [
    { label: '90-100', color: '#10b981', count: 0, percent: 0 },
    { label: '80-89', color: '#3b82f6', count: 0, percent: 0 },
    { label: '70-79', color: '#f59e0b', count: 0, percent: 0 },
    { label: '60-69', color: '#f97316', count: 0, percent: 0 },
    { label: '<60', color: '#ef4444', count: 0, percent: 0 },
  ]
  if (scores.length === 0) return ranges
  for (const s of scores) {
    if (s >= 90) ranges[0].count++
    else if (s >= 80) ranges[1].count++
    else if (s >= 70) ranges[2].count++
    else if (s >= 60) ranges[3].count++
    else ranges[4].count++
  }
  for (const r of ranges) {
    r.percent = Math.round((r.count / scores.length) * 100)
  }
  return ranges
})

// ====== 辅助函数 ======
const getStudentName = (id: string) => store.students.find((s) => s.id === id)?.name || '未知'
const getCourseName = (id: string) => store.courses.find((c) => c.id === id)?.title || '未知'

const getGradeColor = (score: number) => {
  if (score >= 90) return 'text-emerald-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 70) return 'text-amber-600'
  if (score >= 60) return 'text-orange-600'
  return 'text-red-600'
}

const getGradeLevel = (score: number) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  if (score >= 60) return '及格'
  return '不及格'
}

const getGradeBadge = (score: number) => {
  if (score >= 90) return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
  if (score >= 80) return 'bg-blue-50 text-blue-600 border border-blue-200'
  if (score >= 70) return 'bg-amber-50 text-amber-600 border border-amber-200'
  if (score >= 60) return 'bg-orange-50 text-orange-600 border border-orange-200'
  return 'bg-red-50 text-red-600 border border-red-200'
}

// ====== 导出 CSV ======
const exportGrades = () => {
  const rows = [['学生姓名', '学号', '班级', '课程', '成绩', '等级', '评语', '评分日期']]
  const grades = selectedCourse.value === 'all' ? store.grades : store.grades.filter((g) => g.courseId === selectedCourse.value)

  for (const g of grades) {
    const student = store.students.find((s) => s.id === g.studentId)
    const course = store.courses.find((c) => c.id === g.courseId)
    rows.push([
      student?.name || '未知',
      student?.studentId || '',
      student?.className || '',
      course?.title || '未知',
      String(g.totalScore),
      getGradeLevel(g.totalScore),
      g.comment || '',
      g.gradedAt,
    ])
  }

  const BOM = '\uFEFF'
  const csv = BOM + rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `成绩导出_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>