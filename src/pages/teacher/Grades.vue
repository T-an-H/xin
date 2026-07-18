<template>
  <div class="space-y-6">
    <!-- 页面头部 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">成绩录入</h1>
        <p class="text-gray-500 mt-1">按分项录入，系统自动按权重计算总分</p>
      </div>
      <div class="flex gap-3">
        <button @click="configOpen = true" class="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors text-sm font-medium">
          <Settings class="w-4 h-4" />
          权重配置
        </button>
        <button @click="handleSave" class="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-lg shadow-emerald-500/25 text-sm font-medium">
          <Save class="w-5 h-5" />
          {{ saved ? '已保存' : '保存成绩' }}
        </button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="flex flex-wrap gap-4">
      <select v-model="selectedCourse" @change="scores = {}"
        class="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm bg-white">
        <option value="all">全部课程</option>
        <option v-for="c in myCourses" :key="c.id" :value="c.id">{{ c.title }}</option>
      </select>
      <select v-model="selectedSemester"
        class="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm bg-white min-w-[160px]">
        <option v-for="(sem, idx) in SEMESTERS" :key="idx" :value="idx === SEMESTERS.length - 1 ? 'all' : String(idx)">{{ sem.label }}</option>
      </select>
      <button @click="showStats = !showStats"
        class="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg border border-gray-200 bg-white">
        <BarChart3 class="w-4 h-4" />
        统计概览
        <ChevronUp v-if="showStats" class="w-3 h-3" />
        <ChevronDown v-else class="w-3 h-3" />
      </button>
      <span class="text-sm text-gray-400">
        已评 {{ stats.totalGraded }}/{{ stats.totalStudents }} 人
      </span>
    </div>

    <!-- 统计概览 -->
    <div v-if="showStats" class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <!-- 关键指标 -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="bg-blue-50 rounded-lg p-3">
          <p class="text-xs text-blue-500 mb-0.5">平均分</p>
          <p class="text-xl font-bold text-blue-700">{{ stats.avg ?? '-' }}</p>
        </div>
        <div class="bg-emerald-50 rounded-lg p-3">
          <p class="text-xs text-emerald-500 mb-0.5">最高分</p>
          <p class="text-xl font-bold text-emerald-700">{{ stats.max ?? '-' }}</p>
        </div>
        <div class="bg-amber-50 rounded-lg p-3">
          <p class="text-xs text-amber-500 mb-0.5">最低分</p>
          <p class="text-xl font-bold text-amber-700">{{ stats.min ?? '-' }}</p>
        </div>
        <div class="bg-purple-50 rounded-lg p-3">
          <p class="text-xs text-purple-500 mb-0.5">及格率</p>
          <p class="text-xl font-bold text-purple-700">{{ stats.passRate !== null ? `${stats.passRate}%` : '-' }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-xs text-gray-500 mb-0.5">已评人数</p>
          <p class="text-xl font-bold text-gray-700">{{ stats.totalGraded }}</p>
        </div>
      </div>

      <!-- 成绩分布条形图 -->
      <div v-if="stats.scoresList.length > 0">
        <p class="text-xs font-medium text-gray-500 mb-2">成绩分布（{{ selectedCourseTitle }}）</p>
        <div class="space-y-1.5">
          <div v-for="d in distribution" :key="d.label" class="flex items-center gap-2">
            <span class="text-xs text-gray-500 w-8 text-right">{{ d.label }}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500" :class="d.bar" :style="{ width: `${d.pct}%` }" />
            </div>
            <span class="text-xs text-gray-500 w-12">{{ d.count }}人 ({{ d.pct }}%)</span>
          </div>
        </div>
      </div>

      <!-- 知识掌握热力图 -->
      <div v-if="selectedCourse !== 'all'" class="mt-4 border-t border-gray-100 pt-4">
        <p class="text-xs font-medium text-gray-500 mb-2">知识掌握热力图（{{ getCourseTitle(selectedCourse) }}）</p>
        <div class="grid grid-cols-5 gap-1.5 max-w-md">
          <div v-for="kp in knowledgePoints" :key="kp.label" class="flex flex-col items-center gap-1">
            <div class="w-full aspect-square rounded-lg flex items-center justify-center text-white text-xs font-bold" :class="kp.color">
              {{ kp.mastery }}%
            </div>
            <span class="text-[9px] text-gray-500 text-center leading-tight">{{ kp.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 权重摘要 -->
    <div v-if="currentCfg" class="bg-amber-50 rounded-xl p-4 border border-amber-200 text-sm text-amber-800 flex flex-wrap gap-x-6 gap-y-1">
      <span>总成绩 = 平时 {{ currentCfg.regularWeight }}% + 期中 {{ currentCfg.midtermWeight }}% + 期末 {{ currentCfg.finalWeight }}%</span>
      <span>平时 = 自评 {{ currentCfg.selfEvalWeight }}% + 组内互评 {{ currentCfg.peerReviewWeight }}% + 组间互评 {{ currentCfg.interGroupEvalWeight }}% + 教师 {{ currentCfg.teacherScoreWeight }}% + 企业导师 {{ currentCfg.mentorScoreWeight }}%</span>
    </div>

    <!-- 成绩录入表 -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[1200px]">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-4 py-3 text-sm font-medium text-gray-500 sticky left-0 bg-gray-50 z-10">学员</th>
              <th class="text-left px-4 py-3 text-sm font-medium text-gray-500">课程</th>
              <th v-for="f in scoreFields" :key="f.key" class="text-center px-2 py-3 text-xs font-medium text-gray-500 min-w-[80px]">
                <span class="block">{{ f.label }}</span>
                <span class="text-[10px] text-gray-400">{{ groupLabels[f.group] }}</span>
              </th>
              <th class="text-center px-4 py-3 text-sm font-medium text-gray-500 min-w-[70px]">总分</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="enr in filteredEnrollments" :key="enr.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 sticky left-0 bg-white hover:bg-gray-50 z-10">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span class="text-xs font-medium text-emerald-600">{{ getStudentName(enr.studentId).charAt(0) }}</span>
                  </div>
                  <span class="text-sm font-medium text-gray-900 whitespace-nowrap">{{ getStudentName(enr.studentId) }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{{ getCourseTitle(enr.courseId) }}</td>
              <td v-for="f in scoreFields" :key="f.key" class="px-2 py-3 text-center">
                <input type="number" min="0" max="100" placeholder="0"
                  :value="getScoreInputValue(enr.id, f.key)"
                  :readonly="f.readonly"
                  @input="(e) => !f.readonly && handleScoreInput(enr.id, f.key, (e.target as HTMLInputElement).value)"
                  class="w-16 px-2 py-1.5 rounded border border-gray-200 text-sm text-center"
                  :class="f.readonly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none'" />
              </td>
              <td class="px-4 py-3 text-center">
                <template v-if="getRowTotal(enr) != null">
                  <button @click="openDetail(enr)"
                    class="font-semibold text-sm px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                    :class="getTotalColorClass(getRowTotal(enr)!)">
                    {{ getRowTotal(enr) }}
                  </button>
                </template>
                <span v-else class="text-gray-300">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredEnrollments.length === 0" class="text-center py-8 text-gray-400">暂无数据</div>
    </div>

    <!-- ScoreDetail Modal -->
    <ScoreDetail v-if="detailTarget"
      :open="true"
      :on-close="() => detailTarget = null"
      :student-name="detailTarget.studentName"
      :course-title="detailTarget.courseTitle"
      :detail="detailTargetDetail"
      :cfg="detailTargetCfg"
      :total-score="detailTargetTotalScore"
    />

    <!-- GradeConfig Modal -->
    <GradeConfig v-if="activeCourseId"
      :course-id="activeCourseId"
      :open="configOpen"
      :on-close="() => configOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { Settings, Save, BarChart3, ChevronDown, ChevronUp } from 'lucide-vue-next'
import GradeConfig from '@/components/GradeConfig.vue'
import ScoreDetail from '@/components/ScoreDetail.vue'
import type { DetailedGrade, Enrollment } from '@/types'

const store = useAppStore()

const GRADE_COLORS = [
  { range: [90, 100], label: '优秀', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', bar: 'bg-emerald-400' },
  { range: [80, 89], label: '良好', color: 'bg-blue-100 text-blue-700 border-blue-300', bar: 'bg-blue-400' },
  { range: [70, 79], label: '中等', color: 'bg-amber-100 text-amber-700 border-amber-300', bar: 'bg-amber-400' },
  { range: [60, 69], label: '及格', color: 'bg-orange-100 text-orange-700 border-orange-300', bar: 'bg-orange-400' },
  { range: [0, 59], label: '不及格', color: 'bg-red-100 text-red-700 border-red-300', bar: 'bg-red-400' },
]

const PASS_THRESHOLD = 60

const SEMESTERS = [
  { label: '2026年春季', start: '2026-02-01', end: '2026-06-30' },
  { label: '2026年秋季(当前)', start: '2026-09-01', end: '2027-01-31' },
  { label: '全部学期', start: '', end: '' },
]

const scoreFields: { key: keyof Omit<DetailedGrade, 'id' | 'studentId' | 'courseId' | 'gradedAt'>; label: string; group: 'regular' | 'midterm' | 'final'; readonly?: boolean }[] = [
  { key: 'selfEvalScore', label: '自评', group: 'regular', readonly: true },
  { key: 'peerReviewScore', label: '组内互评', group: 'regular' },
  { key: 'interGroupScore', label: '组间互评', group: 'regular' },
  { key: 'teacherScore', label: '教师评价', group: 'regular' },
  { key: 'mentorScore', label: '企业导师评价', group: 'regular' },
  { key: 'midtermExamScore', label: '期中考试', group: 'midterm' },
  { key: 'midtermProjectScore', label: '项目成绩(期中)', group: 'midterm' },
  { key: 'finalExamScore', label: '期末测试', group: 'final' },
  { key: 'finalProjectScore', label: '项目成绩(期末)', group: 'final' },
]

const groupLabels: Record<string, string> = {
  regular: '平时成绩',
  midterm: '期中成绩',
  final: '期末成绩',
}

// ====== State ======
const selectedCourse = ref('all')
const scores = ref<Record<string, Record<string, string>>>({})
const saved = ref(false)
const showStats = ref(true)
const selectedSemester = ref('all')
const configOpen = ref(false)
const detailTarget = ref<{ studentName: string; courseTitle: string; courseId: string; studentId: string } | null>(null)

// ====== Computed ======
const myCourses = computed(() => store.courses.filter((c) => c.teacher === store.currentUser))
const myCourseIds = computed(() => myCourses.value.map((c) => c.id))

const filteredEnrollments = computed(() => {
  return store.enrollments.filter((e) => {
    const matchCourse = selectedCourse.value === 'all' || e.courseId === selectedCourse.value
    return matchCourse && myCourseIds.value.includes(e.courseId)
  })
})

const getStudentName = (id: string) => store.students.find((s) => s.id === id)?.name || '未知'
const getCourseTitle = (id: string) => store.courses.find((c) => c.id === id)?.title || '未知'
const getExisting = (studentId: string, courseId: string) =>
  store.detailedGrades.find((d) => d.studentId === studentId && d.courseId === courseId)

const getScore = (enrId: string, field: string) => {
  const enrollment = store.enrollments.find((e) => e.id === enrId)
  if (!enrollment) return ''
  const existing = getExisting(enrollment.studentId, enrollment.courseId)
  if (!existing) return ''
  const val = existing[field as keyof typeof existing]
  return val != null ? String(val) : ''
}

const cfg = computed(() => selectedCourse.value !== 'all' ? store.getGradeConfig(selectedCourse.value) : null)

const stats = computed(() => {
  let courseGrades = selectedCourse.value === 'all'
    ? store.grades.filter((g) => myCourseIds.value.includes(g.courseId))
    : store.grades.filter((g) => g.courseId === selectedCourse.value)

  // 按学期过滤
  if (selectedSemester.value !== 'all') {
    const sem = SEMESTERS[parseInt(selectedSemester.value)]
    if (sem && sem.start) {
      courseGrades = courseGrades.filter((g) => g.gradedAt >= sem.start && g.gradedAt <= sem.end)
    }
  }

  const scoresList = courseGrades.map((g) => g.score)
  const avg = scoresList.length > 0 ? Math.round(scoresList.reduce((a, b) => a + b, 0) / scoresList.length) : null
  const max = scoresList.length > 0 ? Math.max(...scoresList) : null
  const min = scoresList.length > 0 ? Math.min(...scoresList) : null
  const passed = courseGrades.filter((g) => g.score >= PASS_THRESHOLD).length
  const passRate = scoresList.length > 0 ? Math.round((passed / scoresList.length) * 100) : null
  const totalGraded = scoresList.length
  const totalStudents = selectedCourse.value === 'all'
    ? store.enrollments.filter((e) => myCourseIds.value.includes(e.courseId) && e.status !== 'dropped').length
    : store.enrollments.filter((e) => e.courseId === selectedCourse.value && e.status !== 'dropped').length

  return { avg, max, min, passRate, totalGraded, totalStudents, scoresList }
})

const distribution = computed(() => {
  return GRADE_COLORS.map((g) => {
    const count = stats.value.scoresList.filter((s) => s >= g.range[0] && s <= g.range[1]).length
    const pct = stats.value.scoresList.length > 0 ? Math.round((count / stats.value.scoresList.length) * 100) : 0
    return { ...g, count, pct }
  })
})

const selectedCourseTitle = computed(() => selectedCourse.value === 'all' ? '全部课程' : getCourseTitle(selectedCourse.value))

const activeCourseId = computed(() => selectedCourse.value !== 'all' ? selectedCourse.value : myCourses.value[0]?.id)

const currentCfg = computed(() => activeCourseId.value ? store.getGradeConfig(activeCourseId.value) : null)

const knowledgePoints = computed(() => {
  if (selectedCourse.value === 'all') return []
  const courseGrades = store.grades.filter(g => g.courseId === selectedCourse.value)
  const sortedScores = courseGrades.map(g => g.score).sort((a, b) => a - b)
  const getMastery = (idx: number) => {
    if (sortedScores.length === 0) return 60
    const p = Math.floor((idx / 4) * (sortedScores.length - 1))
    return Math.min(100, Math.max(20, sortedScores[p]))
  }
  const labels = ['基础概念', '核心算法', '应用实践', '项目开发', '前沿探索']
  return labels.map((label, i) => {
    const mastery = getMastery(i)
    const color = mastery >= 85 ? 'bg-emerald-400' : mastery >= 70 ? 'bg-blue-400' : mastery >= 60 ? 'bg-amber-400' : 'bg-red-400'
    return { label, mastery, color }
  })
})

// ====== Detail target helpers ======
const detailTargetDetail = computed(() => {
  if (!detailTarget.value) return null
  return store.detailedGrades.find((d) => d.studentId === detailTarget.value!.studentId && d.courseId === detailTarget.value!.courseId) || null
})

const detailTargetCfg = computed(() => {
  if (!detailTarget.value) return null
  return store.getGradeConfig(detailTarget.value!.courseId)
})

const detailTargetTotalScore = computed(() => {
  if (!detailTarget.value) return 0
  return store.grades.find((g) => g.studentId === detailTarget.value!.studentId && g.courseId === detailTarget.value!.courseId)?.score ?? 0
})

// ====== Functions ======
const handleSave = () => {
  const now = new Date().toISOString().slice(0, 10)
  for (const enr of filteredEnrollments.value) {
    // 检查课程是否已结束
    const course = store.courses.find(c => c.id === enr.courseId)
    if (course && course.status === 'inactive') {
      alert(`课程「${course.title}」已结束，无法修改成绩`)
      return
    }
    const rowScores = scores.value[enr.id]
    if (!rowScores) continue
    const existing = getExisting(enr.studentId, enr.courseId)
    const detail: Record<string, number | undefined> = {}
    scoreFields.forEach((f) => {
      if (f.readonly) return
      const v = parseInt(rowScores[f.key])
      detail[f.key] = isNaN(v) ? undefined : v
    })
    const hasAny = Object.values(detail).some((v) => v !== undefined)
    if (!hasAny) continue

    const dgData = {
      selfEvalScore: existing?.selfEvalScore,
      peerReviewScore: detail.peerReviewScore as number | undefined,
      interGroupScore: detail.interGroupScore as number | undefined,
      teacherScore: detail.teacherScore as number | undefined,
      mentorScore: detail.mentorScore as number | undefined,
      midtermExamScore: detail.midtermExamScore as number | undefined,
      midtermProjectScore: detail.midtermProjectScore as number | undefined,
      finalExamScore: detail.finalExamScore as number | undefined,
      finalProjectScore: detail.finalProjectScore as number | undefined,
      gradedAt: now,
    }

    const totalScore = store.calcTotalScore(enr.courseId, dgData as DetailedGrade)

    if (existing) {
      store.updateDetailedGrade(existing.id, dgData)
      const g = store.grades.find((g) => g.studentId === enr.studentId && g.courseId === enr.courseId)
      if (g) store.updateGrade(g.id, { score: totalScore, gradedAt: now })
    } else {
      store.addDetailedGrade({
        id: `dg-${Date.now()}-${enr.id}`,
        studentId: enr.studentId,
        courseId: enr.courseId,
        ...dgData,
      } as DetailedGrade)
      store.addGrade({
        id: `g-${Date.now()}-${enr.id}`,
        studentId: enr.studentId,
        courseId: enr.courseId,
        score: totalScore,
        comment: '',
        gradedAt: now,
      })
    }
  }
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}

const handleDeleteGrade = (gradeId: string) => {
  if (confirm('确定删除此成绩记录？')) {
    store.deleteGrade(gradeId)
  }
}

const getGradeLevel = (score: number) => {
  const level = GRADE_COLORS.find((g) => score >= g.range[0] && score <= g.range[1])
  return level || GRADE_COLORS[GRADE_COLORS.length - 1]
}

const handleScoreInput = (enrId: string, field: string, value: string) => {
  scores.value = {
    ...scores.value,
    [enrId]: { ...(scores.value[enrId] || {}), [field]: value },
  }
}

const getScoreInputValue = (enrId: string, field: string) => {
  const enrollment = store.enrollments.find((e) => e.id === enrId)
  if (!enrollment) return ''
  const existing = getExisting(enrollment.studentId, enrollment.courseId)
  const val = scores.value[enrId]?.[field]
  if (val !== undefined) return val
  if (existing) {
    const existingVal = existing[field as keyof typeof existing]
    return existingVal != null ? String(existingVal) : ''
  }
  return ''
}

const getRowTotal = (enr: Enrollment) => {
  const existing = getExisting(enr.studentId, enr.courseId)
  const rowScore: Partial<DetailedGrade> = {}
  scoreFields.forEach((f) => {
    const v = scores.value[enr.id]?.[f.key]
    rowScore[f.key] = v !== undefined ? parseInt(v) : (existing?.[f.key as keyof DetailedGrade] as number | undefined)
  })
  if (!isNaN(rowScore.selfEvalScore as number)) {
    return store.calcTotalScore(enr.courseId, rowScore as DetailedGrade)
  } else if (existing) {
    return store.grades.find((g) => g.studentId === enr.studentId && g.courseId === enr.courseId)?.score
  }
  return undefined
}

const getTotalColorClass = (total: number) => {
  if (total >= 90) return 'text-emerald-600'
  if (total >= 80) return 'text-blue-600'
  if (total >= 70) return 'text-amber-600'
  if (total >= 60) return 'text-orange-600'
  return 'text-red-600'
}

const openDetail = (enr: Enrollment) => {
  detailTarget.value = {
    studentName: getStudentName(enr.studentId),
    courseTitle: getCourseTitle(enr.courseId),
    courseId: enr.courseId,
    studentId: enr.studentId,
  }
}
</script>