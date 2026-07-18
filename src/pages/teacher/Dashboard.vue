<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">教师仪表盘</h1>
      <p class="text-gray-500 mt-1">欢迎回来，{{ store.currentUser }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard :icon="BookOpen" label="我的课程" :value="myCourses.length" color="bg-blue-500" />
      <StatCard :icon="Users" label="总学生数" :value="totalStudents" color="bg-emerald-500" />
      <StatCard :icon="Award" label="平均成绩" :value="avgScore" color="bg-amber-500" />
      <StatCard :icon="ClipboardCheck" label="待评价" :value="pendingEvals" color="bg-purple-500" />
    </div>

    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 class="text-sm font-semibold text-gray-800 mb-4">我的课程</h3>
      <div class="space-y-3">
        <div v-for="course in myCourses" :key="course.id" class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div class="flex items-center gap-3">
            <BookOpen class="w-5 h-5 text-blue-500" />
            <div>
              <p class="text-sm font-medium text-gray-900">{{ course.title }}</p>
              <p class="text-xs text-gray-400">{{ course.id }}</p>
            </div>
          </div>
          <router-link :to="`/teacher/courses`" class="text-xs text-blue-500 hover:underline">查看</router-link>
        </div>
        <div v-if="myCourses.length === 0" class="text-center py-8 text-gray-400">暂无课程</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { BookOpen, Users, Award, ClipboardCheck } from 'lucide-vue-next'
import StatCard from '@/components/StatCard.vue'

const store = useAppStore()
const myCourses = computed(() => store.courses.filter((c) => c.teacher === store.currentUser))

const totalStudents = computed(() => {
  const ids = new Set(store.enrollments.filter((e) => myCourses.value.some((c) => c.id === e.courseId)).map((e) => e.studentId))
  return ids.size
})

const avgScore = computed(() => {
  const grades = store.grades.filter((g) => myCourses.value.some((c) => c.id === g.courseId))
  if (grades.length === 0) return 0
  return Math.round(grades.reduce((s, g) => s + g.totalScore, 0) / grades.length)
})

const pendingEvals = computed(() => {
  return store.evaluations.filter((e) => myCourses.value.some((c) => c.id === e.courseId) && e.type === 'teacher' && !e.score).length
})
</script>