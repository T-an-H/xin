<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">学习进度</h1>
      <p class="text-gray-500 mt-1">查看各课程学习进度和成绩</p>
    </div>

    <div class="space-y-4">
      <div v-for="enroll in myEnrollments" :key="enroll.courseId" class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <BookOpen class="w-5 h-5 text-blue-500" />
            <div>
              <h3 class="font-semibold text-gray-900">{{ getCourseName(enroll.courseId) }}</h3>
              <p class="text-xs text-gray-400">{{ getCourseCode(enroll.courseId) }}</p>
            </div>
          </div>
          <span class="text-lg font-bold" :class="getGradeColor(getGrade(enroll.courseId))">{{ getGrade(enroll.courseId) ?? '-' }}</span>
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500 w-16">学习进度</span>
            <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-blue-500" :style="{ width: `${getProgress(enroll.courseId)}%` }" />
            </div>
            <span class="text-xs text-gray-500 w-8">{{ getProgress(enroll.courseId) }}%</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500 w-16">平时成绩</span>
            <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-emerald-500" :style="{ width: `${getRegularScore(enroll.courseId)}%` }" />
            </div>
            <span class="text-xs text-gray-500 w-8">{{ getRegularScore(enroll.courseId) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500 w-16">期中成绩</span>
            <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-amber-500" :style="{ width: `${getMidtermScore(enroll.courseId)}%` }" />
            </div>
            <span class="text-xs text-gray-500 w-8">{{ getMidtermScore(enroll.courseId) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500 w-16">期末成绩</span>
            <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-purple-500" :style="{ width: `${getFinalScore(enroll.courseId)}%` }" />
            </div>
            <span class="text-xs text-gray-500 w-8">{{ getFinalScore(enroll.courseId) }}</span>
          </div>
        </div>
      </div>
      <div v-if="myEnrollments.length === 0" class="text-center py-12 text-gray-400">暂无课程数据</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { BookOpen } from 'lucide-vue-next'

const store = useAppStore()
const student = computed(() => store.students.find((s) => s.name === store.currentUser))
const myEnrollments = computed(() => store.enrollments.filter((e) => e.studentId === student.value?.id))

const getCourseName = (id: string) => store.courses.find((c) => c.id === id)?.title || '未知'
const getCourseCode = (id: string) => store.courses.find((c) => c.id === id)?.id || ''

const getGrade = (courseId: string) => {
  const grade = store.grades.find((g) => g.studentId === student.value?.id && g.courseId === courseId)
  return grade?.totalScore
}

const getGradeColor = (score: number | null) => {
  if (score === null || score === undefined) return 'text-gray-400'
  if (score >= 90) return 'text-emerald-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 70) return 'text-amber-600'
  if (score >= 60) return 'text-orange-600'
  return 'text-red-600'
}

const getProgress = (courseId: string) => {
  const grade = getGrade(courseId)
  return grade ? Math.min(100, Math.round(grade)) : 0
}

const getRegularScore = (courseId: string) => {
  const detail = store.detailedGrades.find((d) => d.studentId === student.value?.id && d.courseId === courseId)
  if (!detail) return 0
  const cfg = store.gradeConfigs[courseId]
  if (!cfg) return 0
  const scores = [detail.selfEvalScore || 0, detail.peerReviewScore || 0, detail.interGroupScore || 0, detail.teacherScore || 0, detail.mentorScore || 0]
  const weights = [cfg.selfEvalWeight || 0, cfg.peerReviewWeight || 0, cfg.interGroupEvalWeight || 0, cfg.teacherScoreWeight || 0, cfg.mentorScoreWeight || 0]
  const totalWeight = weights.reduce((s, w) => s + w, 0) || 1
  return Math.round(scores.reduce((s, sc, i) => s + sc * weights[i], 0) / totalWeight)
}

const getMidtermScore = (courseId: string) => {
  const detail = store.detailedGrades.find((d) => d.studentId === student.value?.id && d.courseId === courseId)
  if (!detail) return 0
  const cfg = store.gradeConfigs[courseId]
  if (!cfg) return 0
  const total = (cfg.midtermExamWeight || 0) + (cfg.midtermProjectWeight || 0) || 1
  return Math.round(((detail.midtermExamScore || 0) * (cfg.midtermExamWeight || 0) + (detail.midtermProjectScore || 0) * (cfg.midtermProjectWeight || 0)) / total)
}

const getFinalScore = (courseId: string) => {
  const detail = store.detailedGrades.find((d) => d.studentId === student.value?.id && d.courseId === courseId)
  if (!detail) return 0
  const cfg = store.gradeConfigs[courseId]
  if (!cfg) return 0
  const total = (cfg.finalExamWeight || 0) + (cfg.finalProjectWeight || 0) || 1
  return Math.round(((detail.finalExamScore || 0) * (cfg.finalExamWeight || 0) + (detail.finalProjectScore || 0) * (cfg.finalProjectWeight || 0)) / total)
}
</script>