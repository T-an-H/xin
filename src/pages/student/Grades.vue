<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">成绩管理</h1>
        <p class="text-gray-500 mt-1">查看各课程成绩明细及最终成绩构成</p>
      </div>
      <select v-model="semester" class="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm">
        <option value="">全部学期</option>
        <option v-for="s in semesters" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard :icon="Award" label="平均成绩" :value="avgScore" :color="avgScore >= 60 ? 'bg-emerald-500' : 'bg-red-500'" />
      <StatCard :icon="TrendingUp" label="最高分" :value="maxScore" color="bg-blue-500" />
      <StatCard :icon="TrendingDown" label="最低分" :value="minScore" color="bg-amber-500" />
      <StatCard :icon="BookOpen" label="已评课程" :value="gradedCourses" color="bg-purple-500" />
    </div>

    <!-- 课程成绩列表 -->
    <div class="space-y-3">
      <div v-for="entry in gradeEntries" :key="entry.grade.id"
        class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        <!-- 卡片头 - 点击打开弹窗 -->
        <button @click="openModal(entry)" class="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center" :class="entry.gradient">
              <BookOpen class="w-5 h-5 text-white" />
            </div>
            <div class="text-left min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ entry.courseName }}</p>
              <p class="text-xs text-gray-400">{{ entry.teacher }} · {{ entry.semester }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 flex-shrink-0">
            <div class="text-right">
              <span class="text-lg font-bold" :class="getGradeColor(entry.totalScore)">{{ entry.totalScore }}</span>
              <span class="text-xs text-gray-400">分</span>
              <p class="text-[10px]">
                <span class="px-1.5 py-0.5 rounded" :class="getGradeBadge(entry.totalScore)">{{ getGradeLevel(entry.totalScore) }}</span>
              </p>
            </div>
            <ChevronRight class="w-4 h-4 text-gray-400" />
          </div>
        </button>
      </div>

      <div v-if="filteredGrades.length === 0" class="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
        暂无成绩数据
      </div>
    </div>

    <!-- 成绩明细弹窗 -->
    <Modal :isOpen="modalOpen" :onClose="closeModal" :title="modalTitle" maxWidth="max-w-xl">
      <div v-if="modalEntry" class="space-y-4">
        <!-- 暂无明细 -->
        <div v-if="!modalEntry.detail" class="text-center py-6 text-gray-400 text-sm">
          暂无该课程的详细成绩明细数据
        </div>

        <!-- 平时成绩明细 -->
        <div v-if="modalEntry.detail" class="space-y-3">
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList class="w-3.5 h-3.5" /> 平时成绩构成
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div v-for="item in regularItems(modalEntry)" :key="item.label"
              class="flex items-center gap-2 p-2.5 rounded-lg bg-white border" :class="item.border">
              <component :is="item.icon" class="w-4 h-4" :class="item.iconColor" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-gray-700">{{ item.label }}</span>
                  <span class="text-xs font-bold" :class="item.color">{{ item.score }}<span class="font-normal text-gray-400">/100</span></span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full" :class="item.bar" :style="{ width: item.score + '%' }" />
                  </div>
                  <span class="text-[10px] text-gray-400">权重{{ item.weight }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 期中/期末成绩 -->
        <div v-if="modalEntry.detail" class="space-y-3">
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 class="w-3.5 h-3.5" /> 大考成绩
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <template v-for="item in examItems(modalEntry)" :key="item.label">
              <div v-if="item.score !== undefined" class="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-100">
                <div class="flex items-center gap-2">
                  <FileText class="w-4 h-4 text-gray-400" />
                  <span class="text-xs text-gray-700">{{ item.label }}</span>
                  <span class="text-[10px] text-gray-400">（权重{{ item.weight }}%）</span>
                </div>
                <span class="text-sm font-bold" :class="getGradeColor(item.score)">{{ item.score }}</span>
              </div>
            </template>
          </div>
        </div>

        <!-- 最终成绩计算方式 -->
        <div class="bg-blue-50/80 border border-blue-100 rounded-lg p-3 space-y-2">
          <h4 class="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Calculator class="w-3.5 h-3.5" /> 最终成绩计算
          </h4>
          <p class="text-xs text-blue-600 leading-relaxed">
            <span class="font-medium">总成绩</span> = 
            平时成绩(×<span class="font-medium">{{ cfgMap[modalEntry.grade.courseId]?.regularWeight ?? 40 }}%</span>)
            <template v-if="(cfgMap[modalEntry.grade.courseId]?.midtermWeight ?? 0) > 0">
              + 期中成绩(×<span class="font-medium">{{ cfgMap[modalEntry.grade.courseId]?.midtermWeight }}%</span>)
            </template>
            + 期末成绩(×<span class="font-medium">{{ cfgMap[modalEntry.grade.courseId]?.finalWeight ?? 60 }}%</span>)
          </p>
          <p v-if="modalEntry.detail" class="text-xs text-blue-500 leading-relaxed">
            <span class="font-medium">平时成绩</span> = 
            <template v-for="(item, idx) in regularItems(modalEntry)" :key="item.label">
              {{ item.score }}×{{ item.weight }}%{{ idx < regularItems(modalEntry).length - 1 ? ' + ' : '' }}
            </template>
            = <span class="font-bold">{{ calcRegular(modalEntry) }}</span>
          </p>
          <div class="flex items-center gap-2 pt-1 border-t border-blue-100">
            <span class="text-xs font-bold text-blue-700">最终得分：</span>
            <span class="text-base font-bold" :class="getGradeColor(modalEntry.totalScore)">{{ modalEntry.totalScore }}</span>
          </div>
        </div>

        <!-- 教师评语 -->
        <div v-if="modalEntry.grade.comment" class="flex items-start gap-2 text-xs text-gray-500">
          <MessageSquare class="w-3.5 h-3.5 mt-0.5 text-gray-400 flex-shrink-0" />
          <span class="italic">"{{ modalEntry.grade.comment }}"</span>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import type { DetailedGrade, Grade } from '@/types'
import { getDefaultGradeConfig } from '@/types'
import { detailedGrades as mockDetailedGrades } from '@/data/mockData'
import { Award, BookOpen, TrendingUp, TrendingDown, ChevronRight, ClipboardList, BarChart3, Calculator, MessageSquare, User, Users, Building2, GraduationCap, Briefcase, FileText } from 'lucide-vue-next'
import StatCard from '@/components/StatCard.vue'
import Modal from '@/components/Modal.vue'

const store = useAppStore()
const semester = ref('')

// 弹窗状态
const modalOpen = ref(false)
const modalEntry = ref<GradeEntry | null>(null)
const modalTitle = computed(() => modalEntry.value ? `${modalEntry.value.courseName} - 成绩明细` : '成绩明细')

function openModal(entry: GradeEntry) {
  modalEntry.value = entry
  modalOpen.value = true
}
function closeModal() {
  modalOpen.value = false
  modalEntry.value = null
}

const student = computed(() => store.students.find((s) => s.name === store.currentUser) ?? store.students[0])

const myGrades = computed(() => store.grades.filter((g) => g.studentId === student.value?.id))
const semesters = computed(() => [...new Set(store.grades.map((g) => g.semester))])

const filteredGrades = computed(() => {
  if (!semester.value) return myGrades.value
  return myGrades.value.filter((g) => g.semester === semester.value)
})

const cfgMap = computed(() => store.gradeConfigs)

interface GradeEntry {
  grade: Grade & { semester?: string; totalScore?: number }
  courseName: string
  teacher: string
  semester: string
  totalScore: number
  gradient: string
  detail?: DetailedGrade
}

function getDetail(courseId: string): DetailedGrade | undefined {
  if (!student.value) return undefined
  const dg = store.detailedGrades.length > 0 ? store.detailedGrades : mockDetailedGrades
  return dg.find((d) => d.studentId === student.value!.id && d.courseId === courseId)
}

function calcRegular(entry: GradeEntry): number {
  if (!entry.detail) return 0
  const d = entry.detail
  const cfg = cfgMap.value[entry.grade.courseId] || getDefaultGradeConfig(entry.grade.courseId)
  return Math.round(
    (d.selfEvalScore ?? 0) * cfg.selfEvalWeight / 100 +
    (d.peerReviewScore ?? 0) * cfg.peerReviewWeight / 100 +
    (d.interGroupScore ?? 0) * cfg.interGroupEvalWeight / 100 +
    (d.teacherScore ?? 0) * cfg.teacherScoreWeight / 100 +
    (d.mentorScore ?? 0) * cfg.mentorScoreWeight / 100
  )
}

const gradeEntries = computed<GradeEntry[]>(() => {
  const gradients = ['from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-rose-500 to-red-500', 'from-indigo-500 to-violet-500']
  return filteredGrades.value.map((g, i) => {
    const course = store.courses.find((c) => c.id === g.courseId)
    const d = getDetail(g.courseId)
    let total = g.totalScore ?? g.score ?? 0
    if (d) {
      total = store.calcTotalScore(g.courseId, d)
    }
    const sem = g.semester ?? (course?.createdAt ? `${course.createdAt.slice(0, 4)}年` : '2026年')
    return {
      grade: { ...g, semester: sem, totalScore: total },
      courseName: course?.title || '未知课程',
      teacher: course?.teacher || '未知',
      semester: sem,
      totalScore: total,
      gradient: gradients[i % gradients.length],
      detail: d,
    }
  })
})

// 平时成绩子项
const regularItems = (entry: GradeEntry) => {
  const d = entry.detail
  const cfg = cfgMap.value[entry.grade.courseId] || getDefaultGradeConfig(entry.grade.courseId)
  const items: { label: string; score: number; weight: number; icon: any; iconColor: string; bar: string; border: string; color: string }[] = []

  if (d?.selfEvalScore !== undefined) {
    items.push({
      label: '自评', score: d.selfEvalScore, weight: cfg.selfEvalWeight,
      icon: User, iconColor: 'text-blue-500', bar: 'bg-blue-500', border: 'border-blue-100', color: 'text-blue-600',
    })
  }
  if (d?.peerReviewScore !== undefined) {
    items.push({
      label: '互评', score: d.peerReviewScore, weight: cfg.peerReviewWeight,
      icon: Users, iconColor: 'text-emerald-500', bar: 'bg-emerald-500', border: 'border-emerald-100', color: 'text-emerald-600',
    })
  }
  if (d?.interGroupScore !== undefined) {
    items.push({
      label: '组间评', score: d.interGroupScore, weight: cfg.interGroupEvalWeight,
      icon: Building2, iconColor: 'text-purple-500', bar: 'bg-purple-500', border: 'border-purple-100', color: 'text-purple-600',
    })
  }
  if (d?.teacherScore !== undefined) {
    items.push({
      label: '教师评', score: d.teacherScore, weight: cfg.teacherScoreWeight,
      icon: GraduationCap, iconColor: 'text-amber-500', bar: 'bg-amber-500', border: 'border-amber-100', color: 'text-amber-600',
    })
  }
  if (d?.mentorScore !== undefined) {
    items.push({
      label: '导师评', score: d.mentorScore, weight: cfg.mentorScoreWeight,
      icon: Briefcase, iconColor: 'text-rose-500', bar: 'bg-rose-500', border: 'border-rose-100', color: 'text-rose-600',
    })
  }
  return items
}

// 大考成绩子项
const examItems = (entry: GradeEntry) => {
  const d = entry.detail
  const cfg = cfgMap.value[entry.grade.courseId] || getDefaultGradeConfig(entry.grade.courseId)
  const items: { label: string; score?: number; weight: number }[] = [
    { label: '期中笔试', score: d?.midtermExamScore, weight: cfg.midtermExamWeight },
    { label: '期中项目', score: d?.midtermProjectScore, weight: cfg.midtermProjectWeight },
    { label: '期末笔试', score: d?.finalExamScore, weight: cfg.finalExamWeight },
    { label: '期末项目', score: d?.finalProjectScore, weight: cfg.finalProjectWeight },
  ]
  return items.filter((i) => i.score !== undefined)
}

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
  if (score >= 90) return 'bg-emerald-50 text-emerald-600'
  if (score >= 80) return 'bg-blue-50 text-blue-600'
  if (score >= 70) return 'bg-amber-50 text-amber-600'
  if (score >= 60) return 'bg-orange-50 text-orange-600'
  return 'bg-red-50 text-red-600'
}

const avgScore = computed(() => {
  if (gradeEntries.value.length === 0) return 0
  return Math.round(gradeEntries.value.reduce((s, g) => s + g.totalScore, 0) / gradeEntries.value.length)
})

const maxScore = computed(() => {
  if (gradeEntries.value.length === 0) return 0
  return Math.max(...gradeEntries.value.map((g) => g.totalScore))
})

const minScore = computed(() => {
  if (gradeEntries.value.length === 0) return 0
  return Math.min(...gradeEntries.value.map((g) => g.totalScore))
})

const gradedCourses = computed(() => gradeEntries.value.length)
</script>
