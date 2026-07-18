<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">成绩统计</h1>
      <p class="text-gray-500 mt-1">课程成绩分布与统计概览</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 class="text-sm font-semibold text-gray-800 mb-4">课程成绩汇总</h3>
          <div class="space-y-3">
            <div v-for="course in store.courses" :key="course.id" class="space-y-1.5">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-700">{{ course.title }}</span>
                <span class="text-gray-500 text-xs">{{ getCourseAvg(course.id) }}分</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full" :style="{ width: `${getCourseAvg(course.id)}%`, backgroundColor: getChartColor(course.id) }" />
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 class="text-sm font-semibold text-gray-800 mb-4">成绩分布</h3>
          <div class="space-y-2">
            <div v-for="(range, idx) in gradeRanges" :key="idx" class="flex items-center gap-3">
              <span class="text-xs text-gray-500 w-16">{{ range.label }}</span>
              <div class="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                <div class="h-full rounded transition-all" :style="{ width: `${range.percent}%`, backgroundColor: range.color }" />
              </div>
              <span class="text-xs text-gray-500 w-10 text-right">{{ range.count }}人</span>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 class="text-sm font-semibold text-gray-800 mb-4">课程统计</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">总课程数</span>
              <span class="text-xl font-bold text-gray-900">{{ store.courses.length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">总学生数</span>
              <span class="text-xl font-bold text-gray-900">{{ store.students.length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">进行中</span>
              <span class="text-xl font-bold text-green-600">{{ store.courses.filter(c => c.status === 'active').length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">已结束</span>
              <span class="text-xl font-bold text-gray-400">{{ store.courses.filter(c => c.status !== 'active').length }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 class="text-sm font-semibold text-gray-800 mb-3">分类统计</h3>
          <div class="space-y-2">
            <div v-for="cat in store.categories" :key="cat.id" class="flex items-center justify-between text-sm">
              <span class="text-gray-600">{{ cat.name }}</span>
              <span class="text-gray-900 font-medium">{{ store.courses.filter(c => c.categoryId === cat.id).length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()

const getCourseAvg = (courseId: string) => {
  const grades = store.grades.filter((g) => g.courseId === courseId)
  if (grades.length === 0) return 0
  return Math.round(grades.reduce((s, g) => s + g.totalScore, 0) / grades.length)
}

const getChartColor = (courseId: string) => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
  const idx = store.courses.findIndex((c) => c.id === courseId)
  return colors[idx % colors.length]
}

const gradeRanges = computed(() => {
  const all = store.grades.map((g) => g.totalScore)
  const ranges = [
    { label: '90-100', color: '#10b981', count: 0, percent: 0 },
    { label: '80-89', color: '#3b82f6', count: 0, percent: 0 },
    { label: '70-79', color: '#f59e0b', count: 0, percent: 0 },
    { label: '60-69', color: '#f97316', count: 0, percent: 0 },
    { label: '<60', color: '#ef4444', count: 0, percent: 0 },
  ]
  if (all.length === 0) return ranges
  for (const s of all) {
    if (s >= 90) ranges[0].count++
    else if (s >= 80) ranges[1].count++
    else if (s >= 70) ranges[2].count++
    else if (s >= 60) ranges[3].count++
    else ranges[4].count++
  }
  for (const r of ranges) {
    r.percent = Math.round((r.count / all.length) * 100)
  }
  return ranges
})
</script>