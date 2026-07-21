<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">课程总览</h1>
      <p class="text-gray-500 mt-1">查看管辖学院的所有课程信息</p>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
          <BookOpen class="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <p class="text-xs text-gray-500">总课程数</p>
          <p class="text-xl font-bold text-gray-900">{{ courses.length }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
          <Play class="w-5 h-5 text-green-500" />
        </div>
        <div>
          <p class="text-xs text-gray-500">进行中</p>
          <p class="text-xl font-bold text-gray-900">{{ activeCount }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
          <CheckCircle class="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <p class="text-xs text-gray-500">已结束</p>
          <p class="text-xl font-bold text-gray-900">{{ inactiveCount }}</p>
        </div>
      </div>
    </div>

    <div v-for="cat in categories" :key="cat.id" class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div :style="{ backgroundColor: cat.color }" class="w-3 h-3 rounded-full" />
        <h2 class="text-base font-semibold text-gray-900">{{ cat.name }}</h2>
        <span class="text-xs text-gray-400 ml-auto">{{ getCategoryCourseCount(cat.id) }} 门课程</span>
      </div>
      <div class="divide-y divide-gray-50">
        <div v-for="course in getCoursesByCategory(cat.id)" :key="course.id" class="px-5 py-4 hover:bg-gray-50 transition-colors">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-sm font-medium text-gray-900 truncate">{{ course.title }}</h3>
                <span :class="`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${course.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`">
                  {{ course.status === 'active' ? '进行中' : course.status === 'inactive' ? '已结束' : '草稿' }}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>导师：{{ course.teacher }}</span>
                <span v-if="course.mentor">企业导师：{{ course.mentor }}</span>
                <span>课时：{{ course.duration }}</span>
                <span>学生：{{ getStudentCount(course.id) }} 人</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="getCoursesByCategory(cat.id).length === 0" class="px-5 py-8 text-center text-sm text-gray-400">
          暂无课程
        </div>
      </div>
    </div>

    <div v-if="categories.length === 0" class="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
      <BookOpen class="w-12 h-12 mx-auto mb-3 text-gray-200" />
      <p class="text-sm">暂无管辖课程数据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { BookOpen, Play, CheckCircle } from 'lucide-vue-next'

const store = useAppStore()

const courses = computed(() => store.getLeaderCourses(store.currentUser))

const activeCount = computed(() => courses.value.filter((c) => c.status === 'active').length)
const inactiveCount = computed(() => courses.value.filter((c) => c.status === 'inactive').length)

const categories = computed(() => {
  const catIds = new Set(courses.value.map((c) => c.categoryId))
  return store.categories.filter((cat) => catIds.has(cat.id))
})

const getCoursesByCategory = (categoryId: string) => courses.value.filter((c) => c.categoryId === categoryId)
const getCategoryCourseCount = (categoryId: string) => getCoursesByCategory(categoryId).length

const getStudentCount = (courseId: string) =>
  store.enrollments.filter((e) => e.courseId === courseId).length
</script>
