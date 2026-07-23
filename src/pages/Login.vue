<template>
  <div id="login-root"></div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'

type LoginRole = 'admin' | 'teacher' | 'student'

const router = useRouter()
const store = useAppStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const selectedRole = ref<LoginRole>('admin')
const error = ref('')

const roles: { id: LoginRole; label: string; desc: string; color: string }[] = [
  { id: 'admin', label: '管理员', desc: '课程、学员、排课、数据管理', color: 'ring-brand-700 border-brand-700 bg-brand-700/10' },
  { id: 'teacher', label: '教师', desc: '授课导师 / 企业导师 / 学院领导', color: 'ring-brand-700 border-brand-700 bg-brand-700/10' },
  { id: 'student', label: '学生', desc: '我的课程、课表、学习进度', color: 'ring-brand-700 border-brand-700 bg-brand-700/10' },
]

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

// ===== D3 渲染 =====

function renderLogin(root: HTMLElement) {
  root.innerHTML = ''
  const container = d3.select(root)

  // ---- 外层容器 ----
  const outer = container.append('div')
    .attr('class', 'min-h-screen bg-brand-700 flex items-center justify-center p-4')

  // ---- 内层卡片 ----
  const card = outer.append('div')
    .attr('class', 'flex w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden')

  // ========== 左侧品牌面板 ==========
  const leftPanel = card.append('div')
    .attr('class', 'hidden lg:flex lg:w-1/2 bg-brand-700 p-12 flex-col justify-between')

  const leftTop = leftPanel.append('div')

  const logoBox = leftTop.append('div')
    .attr('class', 'w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mb-6')
  renderIcon(logoBox, 'graduationCap', 'w-12 h-12 text-white')

  leftTop.append('h1').attr('class', 'text-3xl font-bold text-white mb-3').text('EduManage')
  leftTop.append('p').attr('class', 'text-white/70 text-lg').text('课程管理实施平台 · 高效协同管理')

  const badgeGroup = leftPanel.append('div').attr('class', 'flex flex-wrap gap-2')
  badgeGroup.append('div').attr('class', 'px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-sm').text('管理员端')
  badgeGroup.append('div').attr('class', 'px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-sm').text('导师端')
  badgeGroup.append('div').attr('class', 'px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-sm').text('学生端')

  // ========== 右侧登录表单 ==========
  const rightPanel = card.append('div').attr('class', 'w-full lg:w-1/2 p-8')

  // ---- 移动端品牌标识 ----
  const mobileBrand = rightPanel.append('div').attr('class', 'text-center mb-8 lg:hidden')
  const mobileLogo = mobileBrand.append('div')
    .attr('class', 'w-16 h-16 rounded-2xl bg-brand-700 flex items-center justify-center mx-auto mb-4')
  renderIcon(mobileLogo, 'graduationCap', 'w-8 h-8 text-white')
  mobileBrand.append('h2').attr('class', 'text-xl font-bold text-gray-900').text('EduManage')

  // ---- 欢迎标题 (桌面) ----
  rightPanel.append('h2').attr('class', 'text-2xl font-bold text-gray-900 mb-2 hidden lg:block').text('欢迎登录')
  rightPanel.append('p').attr('class', 'text-gray-400 mb-6 hidden lg:block').text('请选择角色并输入账号信息')

  // ===== 角色选择按钮 =====
  const roleGrid = rightPanel.append('div').attr('class', 'grid grid-cols-3 gap-3 mb-6')

  const showTeacherHint = () => selectedRole.value === 'teacher'

  roles.forEach((r) => {
    const isSelected = selectedRole.value === r.id
    const btn = roleGrid.append('button')
      .attr('class', `p-3 rounded-xl border-2 text-center transition-all ${isSelected ? r.color + ' shadow-md' : 'border-brand-400/20 hover:border-brand-400/30 bg-white'}`)
      .on('click', () => {
        selectedRole.value = r.id
        renderLogin(root) // 重新渲染整个登录页
      })

    renderIcon(btn, r.id === 'admin' ? 'userCog' : r.id === 'teacher' ? 'graduationCap' : 'users',
      `w-6 h-6 mx-auto mb-1 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`)

    btn.append('span')
      .attr('class', `text-sm font-medium block ${isSelected ? 'text-gray-900' : 'text-gray-400'}`)
      .text(r.label)
  })

  // ===== 登录表单 =====
  const form = rightPanel.append('form').attr('class', 'space-y-5')

  // 用户名
  const usernameGroup = form.append('div')
  usernameGroup.append('label').attr('class', 'block text-sm font-medium text-gray-800 mb-1.5').text('用户名')

  const usernameInputWrapper = usernameGroup.append('div').attr('class', 'relative')
  renderIcon(usernameInputWrapper, 'user', 'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400')
  usernameInputWrapper.append('input')
    .attr('type', 'text')
    .attr('placeholder', '请输入用户名')
    .attr('value', username.value)
    .attr('class', 'w-full pl-10 pr-4 py-3 rounded-lg border border-brand-400/30 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none transition-all')
    .on('input', (e) => {
      username.value = (e.target as HTMLInputElement).value
      error.value = ''
    })

  // 密码
  const passwordGroup = form.append('div')
  passwordGroup.append('label').attr('class', 'block text-sm font-medium text-gray-800 mb-1.5').text('密码')

  const passwordInputWrapper = passwordGroup.append('div').attr('class', 'relative')
  renderIcon(passwordInputWrapper, 'lock', 'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400')
  const pwInput = passwordInputWrapper.append('input')
    .attr('type', showPassword.value ? 'text' : 'password')
    .attr('placeholder', '请输入密码')
    .attr('value', password.value)
    .attr('class', 'w-full pl-10 pr-10 py-3 rounded-lg border border-brand-400/30 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none transition-all')
    .on('input', (e) => {
      password.value = (e.target as HTMLInputElement).value
      error.value = ''
    })

  const togglePwBtn = passwordInputWrapper.append('button')
    .attr('type', 'button')
    .attr('class', 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:KEEP_WARN_600')
    .on('click', () => {
      showPassword.value = !showPassword.value
      pwInput.attr('type', showPassword.value ? 'text' : 'password')
    })
  renderIcon(togglePwBtn, showPassword.value ? 'eyeOff' : 'eye', 'w-5 h-5')

  // 错误信息
  const errorEl = form.append('p')
    .attr('class', `text-brand-600 text-sm ${error.value ? '' : 'hidden'}`)
    .text(error.value)

  // 登录按钮
  const submitBtn = form.append('button')
    .attr('type', 'submit')
    .attr('class', 'w-full py-3.5 bg-brand-700 hover:bg-brand-900 text-white font-semibold text-base rounded-xl transition-all duration-200 shadow-lg shadow-brand-700/40 hover:shadow-xl hover:shadow-brand-700/50 flex items-center justify-center gap-2.5')
    .on('click', (e) => {
      e.preventDefault()
      handleLogin()
    })
  renderIcon(submitBtn, 'logIn', 'w-5 h-5')
  submitBtn.append('span').text('登录')

  // 提示文字
  form.append('p').attr('class', 'text-center text-xs text-gray-400')
    .text('演示账号：任意用户名和密码即可登录体验')

  // 教师角色提示
  if (showTeacherHint()) {
    const hintBox = form.append('div')
      .attr('class', 'bg-brand-400/10 border border-brand-400/50 rounded-lg p-3 text-xs text-brand-600')
    hintBox.append('p').text('授课导师：王老师、李老师、陈老师、张老师、刘老师、赵老师、孙老师、周老师、钱老师、吴老师、郑老师')
    hintBox.append('p').text('企业导师：张导师、李导师、王导师、陈导师')
    hintBox.append('p').text('学院领导：刘院长(授课导师+领导)、陈院长、张院长(企业导师+领导)')
  }

  // 监听 error 变化
  errorEl.text(error.value || '')
  errorEl.attr('class', `text-brand-600 text-sm ${error.value ? '' : 'hidden'}`)
}

onMounted(() => {
  renderLogin(document.getElementById('login-root') || document.body)
})

// 监听需要重新渲染的状态
watch([selectedRole, error], () => {
  const root = document.getElementById('login-root')
  if (root) renderLogin(root)
})
</script>
