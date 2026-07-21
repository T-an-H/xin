<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">我的课程</h1>
      <p class="text-gray-500 mt-1">查看已选课程的学习进度</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <router-link
        v-for="enrollment in enrolledCourses"
        :key="enrollment.id"
        :to="`/student/courses/${enrollment.courseId}`"
        :class="[
          'group bg-white rounded-xl border shadow-sm transition-all duration-200 overflow-hidden relative',
          isEnded(enrollment)
            ? 'border-gray-200 opacity-60 hover:opacity-70'
            : 'border-gray-100 hover:shadow-lg'
        ]"
      >
        <!-- 待评价红点标记（一直显示直到评价完成） -->
        <div v-if="!isEnded(enrollment) && hasPendingEval(enrollment)" class="absolute top-3 right-3 z-10">
          <span class="relative inline-flex">
            <AlertCircle class="w-5 h-5 text-red-500" />
            <span class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
          </span>
        </div>
        <!-- AI 分层标记 -->
        <div v-if="getTierBadge(enrollment.courseId)" class="absolute top-3 left-3 z-10"
          :class="getTierBadge(enrollment.courseId)?.class">
          <Layers class="w-3 h-3" />
          <span>{{ getTierBadge(enrollment.courseId)?.label }}</span>
        </div>

        <!-- 封面图区域 -->
        <div class="relative h-36 bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden">
          <img
            v-if="getCourse(enrollment.courseId)?.cover"
            :src="getCourse(enrollment.courseId)?.cover"
            :alt="getCourse(enrollment.courseId)?.title"
            :class="[
              'w-full h-full object-cover transition-transform duration-300',
              isEnded(enrollment) ? 'grayscale' : 'group-hover:scale-105'
            ]"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          <!-- 已结束水印 -->
          <div v-if="isEnded(enrollment)" class="absolute inset-0 flex items-center justify-center">
            <span class="text-white/50 text-lg font-bold tracking-widest -rotate-12 select-none">已结束</span>
          </div>
          <div class="absolute bottom-3 left-4 right-4">
            <h3 class="text-white font-bold text-lg leading-tight truncate">
              {{ getCourse(enrollment.courseId)?.title }}
            </h3>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                {{ getCourse(enrollment.courseId)?.credits }} 学分
              </span>
              <span class="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                {{ getCourse(enrollment.courseId)?.duration }} 课时
              </span>
            </div>
          </div>
        </div>

        <div class="p-4 space-y-3">
          <!-- 课程大纲 -->
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">课程大纲</p>
            <p class="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {{ getCourse(enrollment.courseId)?.description || '暂无描述' }}
            </p>
          </div>

          <!-- 老师信息 -->
          <div class="flex items-center gap-3 py-2 border-t border-gray-50">
            <img
              :src="getTeacherAvatar(getCourse(enrollment.courseId)?.teacher || '')"
              :alt="getCourse(enrollment.courseId)?.teacher"
              class="w-8 h-8 rounded-full bg-gray-100 object-cover"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ getCourse(enrollment.courseId)?.teacher }}
              </p>
              <p v-if="getTeacherInfo(getCourse(enrollment.courseId)?.teacher || '')" class="text-xs text-gray-400 truncate">
                {{ getTeacherInfo(getCourse(enrollment.courseId)?.teacher || '')?.email }}
              </p>
            </div>
          </div>

          <!-- 进度条 -->
          <div>
            <div class="flex justify-between text-xs text-gray-500 mb-1">
              <span>学习进度</span>
              <span>{{ enrollment.progress }}%</span>
            </div>
            <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="progressBarColor(enrollment.progress)"
                :style="{ width: enrollment.progress + '%' }"
              />
            </div>
          </div>

          <!-- 底部状态 + 操作 -->
          <div class="flex items-center justify-between pt-1">
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              :class="statusBadgeClass(enrollment.status)"
            >
              <component :is="statusIcon(enrollment.status)" class="w-3.5 h-3.5" />
              {{ statusLabel(enrollment.status) }}
            </span>

            <span class="inline-flex items-center gap-1 text-xs font-medium transition-colors"
              :class="isEnded(enrollment) ? 'text-gray-400' : 'text-blue-600 group-hover:text-blue-700'">
              {{ isEnded(enrollment) ? '查看记录' : '进入学习' }}
              <ArrowRight class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </router-link>

      <div v-if="enrolledCourses.length === 0" class="col-span-full text-center py-16 text-gray-400">
        <BookOpen class="w-12 h-12 mx-auto mb-4 text-gray-200" />
        <p>暂无已选课程</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { BookOpen, ArrowRight, Clock, CheckCircle, AlertCircle, Layers } from 'lucide-vue-next'
import type { Enrollment } from '@/types'

const store = useAppStore()

const student = computed(() => store.students.find((s) => s.name === store.currentUser))

const enrolledCourses = computed(() => {
  if (!student.value) return []
  return store.enrollments.filter((e) => e.studentId === student.value!.id)
})

const getCourse = (courseId: string) => store.courses.find((c) => c.id === courseId)

const getTeacherInfo = (teacherName: string) => store.teachers.find((t) => t.name === teacherName)

const getTeacherAvatar = (teacherName: string) => {
  const teacher = store.teachers.find((t) => t.name === teacherName)
  return teacher?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacherName}`
}

const isEnded = (enrollment: Enrollment) => {
  const course = getCourse(enrollment.courseId)
  return course?.status !== 'active' || enrollment.status === 'completed' || enrollment.status === 'dropped'
}

const hasPendingEval = (enrollment: Enrollment) => {
  return store.evalReminders.some(
    (r) =>
      r.studentId === enrollment.studentId &&
      r.courseId === enrollment.courseId &&
      (r.status === 'pending' || r.status === 'overdue')
  )
}

const getTierBadge = (courseId: string) => {
  if (!student.value) return null
  const record = store.getStudentTier(courseId, student.value.id)
  if (!record) return null
  const map = {
    basic: { class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200', label: '基础层' },
    advanced: { class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200', label: '进阶层' },
    excellent: { class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200', label: '卓越层' },
  }
  return map[record.tier] || null
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
