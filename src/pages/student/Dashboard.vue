<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">学习仪表盘</h1>
      <p class="text-gray-500 mt-1">欢迎回来，{{ store.currentUser }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard :icon="BookOpen" label="已报名课程" :value="myEnrollments.length" color="bg-blue-500" />
      <StatCard :icon="TrendingUp" label="平均进度" :value="`${avgProgress}%`" color="bg-emerald-500" />
      <StatCard :icon="Award" label="已完成" :value="completed" color="bg-amber-500" />
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm xl:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">我的课程</h3>
          <router-link to="/student/courses" class="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
            查看全部 <ArrowRight class="w-4 h-4" />
          </router-link>
        </div>
        <div class="space-y-3">
          <div v-for="enr in myEnrollments" :key="enr.id" class="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <img :src="getCourse(enr.courseId)?.cover" :alt="getCourse(enr.courseId)?.title" class="w-16 h-12 rounded-lg object-cover flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate">{{ getCourse(enr.courseId)?.title || '未知课程' }}</p>
              <div class="flex items-center gap-3 mt-1">
                <div class="flex-1 bg-gray-100 rounded-full h-2 max-w-[200px]">
                  <div class="h-full rounded-full bg-blue-400 transition-all" :style="{ width: `${enr.progress}%` }" />
                </div>
                <span class="text-xs font-medium text-gray-600">{{ enr.progress }}%</span>
              </div>
            </div>
            <span :class="`text-xs px-2 py-1 rounded-full font-medium ${
              enr.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
              enr.status === 'in_progress' ? 'bg-amber-50 text-amber-600' :
              'bg-blue-50 text-blue-600'
            }`">
              {{ enr.status === 'completed' ? '已完成' : enr.status === 'in_progress' ? '学习中' : '已报名' }}
            </span>
          </div>
          <p v-if="myEnrollments.length === 0" class="text-gray-400 text-center py-4">暂未报名课程</p>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div class="flex items-center gap-2 mb-4">
            <Clock3 class="w-5 h-5 text-amber-500" />
            <h3 class="text-lg font-semibold text-gray-900">近期课程安排</h3>
          </div>
          <div class="space-y-3">
            <div v-for="schedule in upcomingCourses" :key="schedule.id" class="rounded-lg bg-gray-50 p-3">
              <p class="font-medium text-gray-900">{{ getCourse(schedule.courseId)?.title || '未知课程' }}</p>
              <p class="text-sm text-gray-500 mt-1">{{ schedule.startDate }} · {{ schedule.timeSlot }}</p>
            </div>
            <p v-if="upcomingCourses.length === 0" class="text-sm text-gray-400">暂无近期安排</p>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div class="flex items-center gap-2 mb-4">
            <Sparkles class="w-5 h-5 text-purple-500" />
            <h3 class="text-lg font-semibold text-gray-900">学习反馈</h3>
          </div>
          <div class="rounded-lg bg-purple-50 p-4 text-sm text-purple-700">
            平均成绩 {{ averageScore }} 分，当前有 {{ inProgress }} 门课程正在推进，建议继续保持高频练习。
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <div class="flex items-center gap-2 mb-4">
        <BellRing class="w-5 h-5 text-blue-500" />
        <h3 class="text-lg font-semibold text-gray-900">平台动态</h3>
      </div>
      <div class="space-y-3">
        <div v-for="item in recentActivity" :key="item.title" class="flex items-start justify-between rounded-lg border border-gray-100 px-4 py-3">
          <div>
            <p class="font-medium text-gray-900">{{ item.title }}</p>
            <p class="text-sm text-gray-500">{{ item.detail }}</p>
          </div>
          <span class="text-xs text-gray-400 whitespace-nowrap">{{ item.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { BookOpen, TrendingUp, Award, ArrowRight, Clock3, Sparkles, BellRing } from 'lucide-vue-next'
import StatCard from '@/components/StatCard.vue'

const store = useAppStore()
const student = computed(() => store.students.find((s) => s.name === store.currentUser))
const myEnrollments = computed(() => (student.value ? store.enrollments.filter((e) => e.studentId === student.value!.id) : []))
const myGrades = computed(() => (student.value ? store.grades.filter((g) => g.studentId === student.value!.id) : []))

const completed = computed(() => myEnrollments.value.filter((e) => e.status === 'completed').length)
const inProgress = computed(() => myEnrollments.value.filter((e) => e.status === 'in_progress').length)

const avgProgress = computed(() => {
  if (myEnrollments.value.length === 0) return 0
  return Math.round(myEnrollments.value.reduce((sum, e) => sum + e.progress, 0) / myEnrollments.value.length)
})

const averageScore = computed(() => {
  if (myGrades.value.length === 0) return 0
  return Math.round(myGrades.value.reduce((sum, g) => sum + g.score, 0) / myGrades.value.length)
})

const upcomingCourses = computed(() => {
  return store.schedules
    .filter((s) => myEnrollments.value.some((enr) => enr.courseId === s.courseId))
    .slice(0, 3)
})

const recentActivity = [
  { title: 'AI 生成式应用开发', detail: '新增学习任务已发布', time: '2小时前' },
  { title: '数据可视化与商业分析', detail: '课程资源更新完成', time: '昨日' },
  { title: '课程学习提醒', detail: '今日有 2 门课程待完成任务', time: '今天' },
]

const getCourse = (id: string) => store.courses.find((c) => c.id === id)

onMounted(() => {
  store.pushNearDeadlineEvalReminders()
})
</script>