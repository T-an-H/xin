<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">学员进度</h1>
      <p class="text-gray-400 mt-1">查看和管理学员学习进度</p>
    </div>

    <div class="flex flex-wrap gap-4">
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input v-model="search" type="text" placeholder="搜索学员..."
          class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-400/30 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none text-sm" />
      </div>
      <select v-model="selectedCourse" @change="onCourseChange"
        class="px-4 py-2.5 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm bg-white">
        <option value="all">全部课程</option>
        <option v-for="c in myCourses" :key="c.id" :value="c.id">{{ c.title }}</option>
      </select>
    </div>

    <div class="bg-white rounded-xl border border-brand-400/20 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-brand-400/10 border-b border-brand-400/20">
              <th class="text-left px-6 py-3 text-sm font-medium text-gray-400">学员</th>
              <th class="text-left px-6 py-3 text-sm font-medium text-gray-400">课程</th>
              <th class="text-left px-6 py-3 text-sm font-medium text-gray-400">状态</th>
              <th class="text-left px-6 py-3 text-sm font-medium text-gray-400">学习进度</th>
              <th class="text-left px-6 py-3 text-sm font-medium text-gray-400">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-400/20">
            <tr v-for="enr in displayEnrollments" :key="enr.id" class="hover:bg-brand-400/10 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-brand-600/15 flex items-center justify-center">
                    <span class="text-xs font-medium text-gray-600">{{ getStudentName(enr.studentId).charAt(0) }}</span>
                  </div>
                  <span class="font-medium text-gray-900">{{ getStudentName(enr.studentId) }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ getCourseTitle(enr.courseId) }}</td>
              <td class="px-6 py-4">
                <span :class="`text-xs px-2 py-1 rounded-full font-medium ${statusColors[enr.status]}`">
                  {{ statusLabels[enr.status] }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex-1 bg-brand-400/10 rounded-full h-2 max-w-[120px]">
                    <div class="h-full rounded-full bg-brand-600 transition-all" :style="{ width: `${enr.progress}%` }" />
                  </div>
                  <span class="text-xs font-medium text-gray-600 w-10">{{ enr.progress }}%</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1">
                  <button @click="handleProgressUpdate(enr.id, enr.progress - 10)"
                    class="px-2 py-1 text-xs text-gray-400 hover:bg-brand-400/10 rounded transition-colors">-10</button>
                    <button @click="handleProgressUpdate(enr.id, enr.progress + 10)"
                    class="px-2 py-1 text-xs text-gray-400 hover:bg-brand-400/10 rounded transition-colors">+10</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="displayEnrollments.length === 0" class="text-center py-8 text-gray-400">暂无数据</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { Search } from 'lucide-vue-next'

const store = useAppStore()
const selectedCourse = ref('all')
const search = ref('')

const myCourses = computed(() => store.courses.filter((c) => c.teacher === store.currentUser))
const myCourseIds = computed(() => myCourses.value.map((c) => c.id))

const filteredEnrollments = computed(() => {
  return store.enrollments.filter((e) => {
    const matchCourse = selectedCourse.value === 'all' || e.courseId === selectedCourse.value
    const matchTeacher = myCourseIds.value.includes(e.courseId)
    return matchCourse && matchTeacher
  })
})

const displayEnrollments = computed(() => {
  return filteredEnrollments.value.filter((e) => {
    const student = store.students.find((s) => s.id === e.studentId)
    return !search.value || student?.name.includes(search.value)
  })
})

const getCourseTitle = (id: string) => store.courses.find((c) => c.id === id)?.title || '未知'
const getStudentName = (id: string) => store.students.find((s) => s.id === id)?.name || '未知'

const handleProgressUpdate = (enrollmentId: string, progress: number) => {
  const newProgress = Math.min(100, Math.max(0, progress))
  store.updateEnrollment(enrollmentId, { progress: newProgress })
}

const statusLabels: Record<string, string> = {
  enrolled: '已报名', in_progress: '学习中', completed: '已完成', dropped: '已退课',
}
const statusColors: Record<string, string> = {
  enrolled: 'bg-brand-600/10 text-gray-600', in_progress: 'bg-brand-400/10 text-gray-600',
  completed: 'bg-brand-400/10 text-gray-600', dropped: 'bg-brand-600/10 text-gray-600',
}

function onCourseChange() {
  // noop - v-model handles the value
}
</script>