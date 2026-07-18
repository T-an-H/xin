<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">我的课表</h1>
      <p class="text-gray-500 mt-1">查看课程安排</p>
    </div>

    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-100">
            <th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-left">课程</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-left">教师</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-left">时间</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-left">地点</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sched in mySchedules" :key="sched.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ sched.title }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sched.teacher }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sched.timeSlot }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sched.room }}</td>
          </tr>
          <tr v-if="mySchedules.length === 0">
            <td colspan="4" class="px-4 py-12 text-center text-gray-400">暂无课程安排</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const student = computed(() => store.students.find((s) => s.name === store.currentUser))

const mySchedules = computed(() => {
  const myCourseIds = store.enrollments.filter((e) => e.studentId === student.value?.id).map((e) => e.courseId)
  return store.schedules.filter((s) => myCourseIds.includes(s.courseId))
})
</script>