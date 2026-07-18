<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">我的课程</h1>
      <p class="text-gray-500 mt-1">查看已选课程的学习进度</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="enrollment in enrolledCourses"
        :key="enrollment.id"
        class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow relative"
      >
        <div v-if="hasPendingEval(enrollment)" class="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-600 font-medium">
          <AlertCircle class="w-3 h-3" />
          <span>待评价</span>
        </div>

        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
            <BookOpen class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 truncate">{{ getCourse(enrollment.courseId)?.title }}</h3>
            <p class="text-xs text-gray-400">{{ enrollment.id }}</p>
          </div>
        </div>

        <p class="text-xs text-gray-500 mb-3">{{ getCourse(enrollment.courseId)?.teacher }}</p>

        <div class="mb-3">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>学习进度</span>
            <span>{{ enrollment.progress }}%</span>
          </div>
          <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="progressBarColor(enrollment.progress)"
              :style="{ width: enrollment.progress + '%' }"
            ></div>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <span
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            :class="statusBadgeClass(enrollment.status)"
          >
            <component :is="statusIcon(enrollment.status)" class="w-3.5 h-3.5" />
            {{ statusLabel(enrollment.status) }}
          </span>

          <router-link
            :to="`/student/courses/${enrollment.courseId}`"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
          >
            进入学习
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>
      </div>

      <div v-if="enrolledCourses.length === 0" class="col-span-full text-center py-12 text-gray-400">
        暂无已选课程
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { BookOpen, ArrowRight, Clock, CheckCircle, AlertCircle } from 'lucide-vue-next'
import type { Enrollment } from '@/types'

const store = useAppStore()

const student = computed(() => store.students.find((s) => s.name === store.currentUser))

const enrolledCourses = computed(() => {
  if (!student.value) return []
  return store.enrollments.filter((e) => e.studentId === student.value!.id)
})

const getCourse = (courseId: string) => store.courses.find((c) => c.id === courseId)

const hasPendingEval = (enrollment: Enrollment) => {
  return store.evalReminders.some(
    (r) =>
      r.studentId === enrollment.studentId &&
      r.courseId === enrollment.courseId &&
      (r.status === 'pending' || r.status === 'overdue')
  )
}

const progressBarColor = (progress: number) => {
  if (progress >= 80) return 'bg-emerald-500'
  if (progress >= 40) return 'bg-blue-500'
  return 'bg-amber-500'
}

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'enrolled':
      return 'bg-blue-50 text-blue-600 border border-blue-200'
    case 'in_progress':
      return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
    case 'completed':
      return 'bg-gray-50 text-gray-600 border border-gray-200'
    case 'dropped':
      return 'bg-red-50 text-red-600 border border-red-200'
    default:
      return 'bg-gray-50 text-gray-600 border border-gray-200'
  }
}

const statusIcon = (status: string) => {
  switch (status) {
    case 'enrolled':
      return Clock
    case 'in_progress':
      return BookOpen
    case 'completed':
      return CheckCircle
    case 'dropped':
      return AlertCircle
    default:
      return Clock
  }
}

const statusLabel = (status: string) => {
  switch (status) {
    case 'enrolled':
      return '已报名'
    case 'in_progress':
      return '学习中'
    case 'completed':
      return '已完成'
    case 'dropped':
      return '已退课'
    default:
      return status
  }
}
</script>