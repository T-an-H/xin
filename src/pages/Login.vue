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
        <p class="text-gray-500 mb-8 hidden lg:block">输入账号密码，系统自动识别身份</p>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">账号</label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                v-model="account"
                type="text"
                placeholder="请输入账号"
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
            :disabled="loading"
            :class="['w-full py-3 font-medium rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2', loading ? 'bg-amber-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25']"
          >
            <template v-if="loading">
              <LoaderCircle class="w-5 h-5 animate-spin" />
              登录中...
            </template>
            <template v-else>
              <LogIn class="w-5 h-5" />
              登录
            </template>
          </button>

          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-600">
            <p class="font-medium mb-1">测试账号（密码统一：666666）</p>
            <p>管理员：admin</p>
            <p>教师：teacher-wang、teacher-li</p>
            <p>学生：S2024001（张明）、202511053250（李傲天）</p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { User, Lock, Eye, EyeOff, LogIn, GraduationCap, LoaderCircle } from 'lucide-vue-next'
import { unifiedLogin } from '@/api'

const router = useRouter()
const store = useAppStore()

const account = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!account.value.trim() || !password.value.trim()) {
    error.value = '请输入账号和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await unifiedLogin(account.value, password.value)

    // 保存 token
    localStorage.setItem('token', res.token)
    localStorage.setItem('userInfo', JSON.stringify(res.user))

    // 确定角色（处理教师子角色：授课导师/企业导师/学院领导）
    let role = res.user.role
    if (role === 'teacher' && res.user.sub_role) {
      role = res.user.sub_role
    }

    // 调用 store.login 让应用状态同步
    store.login(res.user.name, role)

    // 跳转到对应页面
    router.push(res.portal)
  } catch (e: any) {
    error.value = e.message || '登录失败，请检查账号和密码'
  }

  loading.value = false
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
