<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-brand-900">我的课程</h1>
      <p class="text-brand-400 mt-1">管理课程、查看学员进度和评价</p>
    </div>

    <!-- 课程卡片网格：2 列 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div
        v-for="course in myCourses" :key="course.id"
        @click="goDetail(course.id)"
        :class="[
          'group bg-white rounded-xl border shadow-sm transition-all duration-200 overflow-hidden cursor-pointer',
          course.status === 'active'
            ? 'border-brand-400/20 hover:shadow-lg'
            : 'border-brand-400/30 opacity-60 hover:opacity-70'
        ]"
      >
        <!-- 封面渐变区域 -->
        <div class="relative h-[136px]" :style="{ background: getCourseGradient(course.id) }">
          <!-- 封面图 -->
          <img
            v-if="course.cover"
            :src="course.cover"
            :alt="course.title"
            :class="[
              'w-full h-full object-cover transition-transform duration-300',
              course.status === 'active' ? 'group-hover:scale-105' : 'grayscale'
            ]"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          <!-- 已结束水印 -->
          <div v-if="course.status !== 'active'" class="absolute inset-0 flex items-center justify-center">
            <span class="text-white/50 text-lg font-bold tracking-widest -rotate-12 select-none">已结束</span>
          </div>

          <!-- 状态标签 - 右上角叠加 -->
          <span :class="`absolute top-3 right-3 z-10 text-xs px-2.5 py-1 rounded-full font-medium ${
            course.status === 'active'
              ? 'bg-brand-400/10 text-brand-800 backdrop-blur-sm'
              : 'bg-brand-400/10 text-brand-400 backdrop-blur-sm'
          }`">
            <span class="inline-block w-1.5 h-1.5 rounded-full mr-1" :class="course.status === 'active' ? 'bg-brand-600' : 'bg-brand-400'"></span>
            {{ course.status === 'active' ? '进行中' : '已结束' }}
          </span>

          <!-- 课程标题 & 统计信息叠加 -->
          <div class="absolute bottom-3 left-4 right-4">
            <h3 class="text-white font-bold text-lg leading-tight truncate">{{ course.title }}</h3>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <Users class="w-3 h-3 inline mr-0.5 -mt-0.5" />
                {{ studentCount(course.id) }} 名学生
              </span>
              <span class="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {{ course.duration || '-' }} 课时
              </span>
            </div>
          </div>
        </div>

        <!-- 卡片内容区域 -->
        <div class="p-4 space-y-3">
          <!-- 课程简介 -->
          <div>
            <p class="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">课程简介</p>
            <p class="text-sm text-brand-600 line-clamp-2 leading-relaxed">
              {{ course.description || '暂无描述' }}
            </p>
          </div>


          <!-- 底部操作 -->
          <div class="flex items-center justify-between pt-1">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
              :class="course.status === 'active' ? 'bg-brand-600/10 text-brand-600 border-brand-400' : 'bg-brand-400/10 text-brand-400 border-brand-400/30'">
              <BookOpen class="w-3.5 h-3.5" />
              {{ course.status === 'active' ? '教学进行中' : '课程已结束' }}
            </span>

            <span class="inline-flex items-center gap-1 text-xs font-medium transition-colors"
              :class="course.status === 'active' ? 'text-brand-600 group-hover:text-brand-800' : 'text-brand-400'">
              {{ course.status === 'active' ? '管理课程' : '查看详情' }}
              <ArrowRight class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>

      <div v-if="myCourses.length === 0" class="col-span-2 text-center py-16 text-brand-400">
        <BookOpen class="w-12 h-12 mx-auto mb-4 text-gray-200" />
        <p>暂无课程</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { BookOpen, Users, ArrowRight } from 'lucide-vue-next'

const router = useRouter()
const store = useAppStore()

const isMentor = computed(() => store.currentRole === 'mentor')

const myCourses = computed(() => {
  if (isMentor.value) {
    const mentorCourseIds = store.getMentorCourseIds(store.currentUser || '')
    return store.courses.filter((c) => mentorCourseIds.includes(c.id))
  }
  return store.courses.filter((c) => c.teacher === store.currentUser)
})

/** 根据课程 ID 分配不同的渐变配色 */
const gradients = [
  'linear-gradient(135deg, #4F46E5, #1E88E5)',
  'linear-gradient(135deg, #1E88E5, #1E88E5)',
  'linear-gradient(135deg, #1E88E5, #1E88E5)',
  'linear-gradient(135deg, #DC2626, #1E88E5)',
  'linear-gradient(135deg, #1E88E5, #1E88E5)',
  'linear-gradient(135deg, #1E88E5, #1E88E5)',
  'linear-gradient(135deg, #0891B2, #22D3EE)',
  'linear-gradient(135deg, #BE123C, #FB7185)',
]

function getCourseGradient(courseId: string): string {
  let hash = 0
  for (let i = 0; i < courseId.length; i++) {
    hash = ((hash << 5) - hash) + courseId.charCodeAt(i)
    hash |= 0
  }
  return gradients[Math.abs(hash) % gradients.length]
}

function studentCount(courseId: string) {
  return store.enrollments.filter((e) => e.courseId === courseId && e.status !== 'dropped').length
}

function goDetail(courseId: string) {
  router.push(`${isMentor.value ? '/mentor' : '/teacher'}/courses/${courseId}`)
}
</script>
