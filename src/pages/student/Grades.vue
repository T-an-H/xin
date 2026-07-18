<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">成绩管理</h1>
        <p class="text-gray-500 mt-1">查看各课程成绩</p>
      </div>
      <select v-model="semester" class="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm">
        <option value="">全部学期</option>
        <option v-for="s in semesters" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard :icon="Award" label="平均成绩" :value="avgScore" :color="avgScore >= 60 ? 'bg-emerald-500' : 'bg-red-500'" />
      <StatCard :icon="Award" label="最高分" :value="maxScore" color="bg-blue-500" />
      <StatCard :icon="Award" label="最低分" :value="minScore" color="bg-amber-500" />
      <StatCard :icon="BookOpen" label="已评课程" :value="gradedCourses" color="bg-purple-500" />
    </div>

    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-100">
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">课程</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">教师</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">学期</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">成绩</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">等级</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in filteredGrades" :key="g.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <BookOpen class="w-5 h-5 text-blue-500" />
                <span class="text-sm font-medium text-gray-900">{{ getCourseName(g.courseId) }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ getCourseTeacher(g.courseId) }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ g.semester }}</td>
            <td class="px-4 py-3">
              <span class="text-sm font-bold" :class="getGradeColor(g.totalScore)">{{ g.totalScore }}</span>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs px-2 py-1 rounded-full" :class="getGradeBadge(g.totalScore)">{{ getGradeLevel(g.totalScore) }}</span>
            </td>
          </tr>
          <tr v-if="filteredGrades.length === 0">
            <td colspan="5" class="px-4 py-12 text-center text-gray-400">暂无成绩数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { Award, BookOpen } from 'lucide-vue-next'
import StatCard from '@/components/StatCard.vue'

const store = useAppStore()
const semester = ref('')
const student = computed(() => store.students.find((s) => s.name === store.currentUser))

const myGrades = computed(() => store.grades.filter((g) => g.studentId === student.value?.id))
const semesters = computed(() => [...new Set(store.grades.map((g) => g.semester))])

const filteredGrades = computed(() => {
  if (!semester.value) return myGrades.value
  return myGrades.value.filter((g) => g.semester === semester.value)
})

const getCourseName = (id: string) => store.courses.find((c) => c.id === id)?.title || '未知'
const getCourseTeacher = (id: string) => store.courses.find((c) => c.id === id)?.teacher || '未知'

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
  if (myGrades.value.length === 0) return 0
  return Math.round(myGrades.value.reduce((s, g) => s + g.totalScore, 0) / myGrades.value.length)
})

const maxScore = computed(() => {
  if (myGrades.value.length === 0) return 0
  return Math.max(...myGrades.value.map((g) => g.totalScore))
})

const minScore = computed(() => {
  if (myGrades.value.length === 0) return 0
  return Math.min(...myGrades.value.map((g) => g.totalScore))
})

const gradedCourses = computed(() => myGrades.value.length)
</script>