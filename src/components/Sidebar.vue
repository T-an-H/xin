<template>
  <aside class="w-64 bg-[#0f172a] text-white flex flex-col h-screen sticky top-0">
    <div class="p-6 border-b border-white/10">
      <div class="flex items-center gap-3">
        <div :class="`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`">
          <GraduationCap class="w-6 h-6 text-[#0f172a]" />
        </div>
        <div>
          <h1 class="font-bold text-lg">课程实施管理</h1>
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
        <span>{{ item.label }}</span>
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
  LayoutDashboard,
  BookOpen,
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
  { to: '/admin/courses', icon: BookOpen, label: '课程实施' },
  { to: '/admin/students', icon: Users, label: '学员管理' },
  { to: '/admin/statistics', icon: Award, label: '实施成绩' },
]

const teacherNavItems = [
  { to: '/teacher/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/teacher/courses', icon: BookOpen, label: '我的课程' },
  { to: '/teacher/grades', icon: Award, label: '实施成绩' },
  { to: '/teacher/extra', icon: Lightbulb, label: '额外功能' },
]

const studentNavItems = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/student/profile', icon: User, label: '个人画像' },
  { to: '/student/courses', icon: BookOpen, label: '我的课程' },
  { to: '/student/grades', icon: Award, label: '实施成绩' },
  { to: '/student/schedule', icon: Calendar, label: '我的课表' },
  { to: '/student/extra', icon: Lightbulb, label: '额外功能' },
]

const roleConfig: Record<string, { items: typeof adminNavItems; color: string; label: string }> = {
  admin: { items: adminNavItems, color: 'bg-amber-500', label: '管理员端' },
  teacher: { items: teacherNavItems, color: 'bg-emerald-500', label: '教师端' },
  student: { items: studentNavItems, color: 'bg-blue-500', label: '学生端' },
}

const config = computed(() => roleConfig[store.currentRole || 'admin'])

const handleLogout = () => {
  store.logout()
  router.replace('/login')
}
</script>