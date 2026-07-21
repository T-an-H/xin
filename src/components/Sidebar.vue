<template>
  <aside class="w-64 bg-[#0f172a] text-white flex flex-col h-screen sticky top-0">
    <div class="p-6 border-b border-white/10">
      <div class="flex items-center gap-3">
        <div :class="`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`">
          <GraduationCap class="w-6 h-6 text-[#0f172a]" />
        </div>
        <div>
          <h1 class="font-bold text-lg">课程管理</h1>
          <p class="text-xs text-white/50">{{ config.label }}</p>
        </div>
      </div>
    </div>

    <nav class="flex-1 p-4 space-y-1">
      <router-link
        v-for="item in config.items"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200"
        :class="$route.path.startsWith(item.to) ? 'bg-white/15 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/5'"
      >
        <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span class="relative">
          {{ item.label }}
          <span v-if="showExtraBadge(item)" class="absolute -top-2 -right-3 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[#0f172a]" />
        </span>
      </router-link>
    </nav>

    <div class="p-4 border-t border-white/10">
      <button
        @click="handleLogout"
        class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 w-full"
      >
        <LogOut class="w-5 h-5 flex-shrink-0" />
        <span>退出登录</span>
      </button>
    </div>
  </aside>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import {
  BookOpen,
  BarChart3,
  LogOut,
  GraduationCap,
  ClipboardCheck,
  Award,
  User,
  Lightbulb,
  Users,
  Calendar,
} from 'lucide-vue-next'

const store = useAppStore()
const route = useRoute()
const router = useRouter()

const adminNavItems = [
  { to: '/admin/courses', icon: BookOpen, label: '课程管理' },
  { to: '/admin/categories', icon: BarChart3, label: '分类管理' },
  { to: '/admin/schedule', icon: Calendar, label: '排课管理' },
  { to: '/admin/students', icon: Users, label: '学员管理' },
  { to: '/admin/statistics', icon: BarChart3, label: '成绩管理' },
]

const teacherNavItems = [
  { to: '/teacher/courses', icon: BookOpen, label: '我的课程' },
  { to: '/teacher/grades', icon: Award, label: '成绩管理' },
  { to: '/teacher/extra', icon: Lightbulb, label: '额外功能' },
]

const studentNavItems = [
  { to: '/student/profile', icon: User, label: '个人画像' },
  { to: '/student/courses', icon: BookOpen, label: '我的课程' },
  { to: '/student/grades', icon: Award, label: '成绩管理' },
  { to: '/student/schedule', icon: Calendar, label: '我的课表' },
  { to: '/student/extra', icon: Lightbulb, label: '额外功能' },
]

const roleConfig: Record<string, { items: typeof adminNavItems; color: string; label: string }> = {
  admin: { items: adminNavItems, color: 'bg-amber-500', label: '管理员端' },
  teacher: { items: teacherNavItems, color: 'bg-emerald-500', label: '教师端' },
  student: { items: studentNavItems, color: 'bg-blue-500', label: '学生端' },
}

const config = computed(() => roleConfig[store.currentRole || 'admin'])

/** 当前用户是否有未完成的评价待办任务 */
const hasPendingEvalTodos = computed(() => {
  if (store.currentRole === 'student') {
    const student = store.students.find((s) => s.name === store.currentUser)
    if (!student) return false
    return store.evalReminders.some(
      (r) => r.studentId === student.id && r.status !== 'completed'
    )
  }
  if (store.currentRole === 'teacher') {
    return store.evalReminders.some(
      (r) => r.studentId === store.currentUser && r.status !== 'completed'
    )
  }
  return false
})

/** 判断是否为额外功能菜单项且需要显示红点 */
const showExtraBadge = (item: { to: string; label: string }) => {
  if (item.label !== '额外功能') return false
  // 评价代办红点
  if (hasPendingEvalTodos.value) return true
  // 配置提醒红点（教师端）
  if (store.currentRole === 'teacher' && store.getPendingConfigCourses().length > 0) return true
  return false
}

const handleLogout = () => {
  store.logout()
  router.replace('/login')
}
</script>