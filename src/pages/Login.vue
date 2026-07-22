<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center p-4">
    <div class="flex w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
      <!-- Left brand panel -->
      <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-500 to-amber-700 p-12 flex-col justify-between">
        <div>
          <div class="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
            <GraduationCap class="w-12 h-12 text-white" />
          </div>
          <h1 class="text-3xl font-bold text-white mb-3">EduManage</h1>
          <p class="text-white/70 text-lg">课程管理实施平台 · 高效协同管理</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <div class="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-sm">管理员端</div>
          <div class="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-sm">教师端</div>
          <div class="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-sm">学生端</div>
        </div>
      </div>

      <!-- Right login form -->
      <div class="w-full lg:w-1/2 p-8">
        <div class="text-center mb-8 lg:hidden">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mx-auto mb-4">
            <GraduationCap class="w-8 h-8 text-white" />
          </div>
          <h2 class="text-xl font-bold text-gray-900">EduManage</h2>
        </div>

        <h2 class="text-2xl font-bold text-gray-900 mb-2 hidden lg:block">欢迎登录</h2>
        <p class="text-gray-500 mb-6 hidden lg:block">请选择角色并输入账号信息</p>

        <!-- Role selection -->
        <div class="grid grid-cols-3 gap-3 mb-6">
          <button
            v-for="r in roles"
            :key="r.id"
            @click="selectedRole = r.id"
            :class="['p-3 rounded-xl border-2 text-center transition-all', selectedRole === r.id ? r.color + ' shadow-md' : 'border-gray-100 hover:border-gray-200 bg-white']"
          >
            <component :is="r.icon" :class="['w-6 h-6 mx-auto mb-1', selectedRole === r.id ? 'text-gray-900' : 'text-gray-400']" />
            <span :class="['text-sm font-medium block', selectedRole === r.id ? 'text-gray-900' : 'text-gray-500']">{{ r.label }}</span>
          </button>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                v-model="username"
                type="text"
                placeholder="请输入用户名"
                class="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                @input="error = ''"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                placeholder="请输入密码"
                class="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                @input="error = ''"
              />
              <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <component :is="showPassword ? EyeOff : Eye" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

          <button
            type="submit"
            class="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
          >
            <LogIn class="w-5 h-5" />
            登录
          </button>

          <p class="text-center text-xs text-gray-400">
            演示账号：任意用户名和密码即可登录体验
          </p>

          <!-- 教师角色提示 -->
          <div v-if="selectedRole === 'teacher'" class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-600">
            <p>授课导师：王老师、李老师、陈老师 ……</p>
            <p>企业导师：张导师、李导师</p>
            <p>学院领导：刘院长、陈院长</p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { User, Lock, Eye, EyeOff, LogIn, GraduationCap, Users, UserCog } from 'lucide-vue-next'

type LoginRole = 'admin' | 'teacher' | 'student'

const router = useRouter()
const store = useAppStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const selectedRole = ref<LoginRole>('admin')
const error = ref('')

const roles: { id: LoginRole; label: string; icon: any; desc: string; color: string }[] = [
  { id: 'admin', label: '管理员', icon: UserCog, desc: '课程、学员、排课、数据管理', color: 'ring-amber-500 border-amber-500 bg-amber-50' },
  { id: 'teacher', label: '教师', icon: GraduationCap, desc: '授课导师 / 企业导师 / 学院领导', color: 'ring-emerald-500 border-emerald-500 bg-emerald-50' },
  { id: 'student', label: '学生', icon: Users, desc: '我的课程、课表、学习进度', color: 'ring-blue-500 border-blue-500 bg-blue-50' },
]

/**
 * 根据用户名自动检测教师类别的具体角色
 * 优先级：teacher > mentor > leader
 */
function detectTeacherRole(username: string): { role: 'teacher' | 'mentor' | 'leader'; portal: string } {
  if (store.teachers.some((t) => t.name === username)) {
    return { role: 'teacher', portal: '/teacher/courses' }
  }
  if (store.mentors.some((m) => m.name === username)) {
    return { role: 'mentor', portal: '/mentor/courses' }
  }
  if (store.leaders.some((l) => l.name === username)) {
    return { role: 'leader', portal: '/leader/courses' }
  }
  // 兜底：当作授课导师
  return { role: 'teacher', portal: '/teacher/courses' }
}

const handleLogin = () => {
  if (!username.value.trim() || !password.value.trim()) {
    error.value = '请输入用户名和密码'
    return
  }

  switch (selectedRole.value) {
    case 'admin': {
      store.login(username.value, 'admin')
      router.push('/admin/categories')
      break
    }
    case 'teacher': {
      const { role, portal } = detectTeacherRole(username.value)
      store.login(username.value, role)
      router.push(portal)
      break
    }
    case 'student': {
      store.login(username.value, 'student')
      router.push('/student/courses')
      break
    }
  }
}
</script>
