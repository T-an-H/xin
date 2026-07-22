<template>
  <div id="admin-courses-root"></div>
  <Teleport to="body">
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="showCreateModal = false" />
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <h3 class="text-lg font-semibold text-brand-900 mb-4">{{ editingCourse ? '编辑课程' : '新建课程' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-brand-800 mb-1">课程名称</label>
            <input v-model="form.title" type="text" class="w-full px-3 py-2 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-brand-800 mb-1">课程描述</label>
            <textarea v-model="form.description" rows="2" class="w-full px-3 py-2 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-brand-800 mb-1">分类</label>
            <select v-model="form.categoryId" class="w-full px-3 py-2 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm">
              <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-brand-800 mb-1">教师</label>
            <select v-model="form.teacher" class="w-full px-3 py-2 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm">
              <option v-for="t in store.teachers" :key="t.id" :value="t.name">{{ t.name }}</option>
            </select>
          </div>
          <div class="flex gap-3 pt-2">
            <button @click="handleSave" class="flex-1 py-2.5 bg-brand-600 hover:bg-brand-800 text-white rounded-lg text-sm font-medium transition-colors">保存</button>
            <button @click="showCreateModal = false" class="flex-1 py-2.5 bg-brand-400/10 hover:bg-brand-400/10 text-brand-600 rounded-lg text-sm font-medium transition-colors">取消</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'

const store = useAppStore()
const searchText = ref('')
const filterCategory = ref('')
const showCreateModal = ref(false)
const editingCourse = ref<any>(null)
const form = ref({ title: '', description: '', categoryId: '', teacher: '' })

const filteredCourses = computed(() => {
  return store.courses.filter((c) => {
    if (searchText.value && !c.title.includes(searchText.value)) return false
    if (filterCategory.value && c.categoryId !== filterCategory.value) return false
    return true
  })
})

const getCategoryName = (id: string) => store.categories.find((c) => c.id === id)?.name || '未分类'
const getCategoryColor = (id: string) => store.categories.find((c) => c.id === id)?.color || 'bg-brand-400/10'
const getCourseCount = (id: string) => store.courses.filter((c) => c.categoryId === id).length

const handleEdit = (course: any) => {
  editingCourse.value = course
  form.value = { title: course.title, description: course.description, categoryId: course.categoryId, teacher: course.teacher }
  showCreateModal.value = true
}

const handleSave = () => {
  if (editingCourse.value) {
    store.updateCourse(editingCourse.value.id, { title: form.value.title, description: form.value.description, categoryId: form.value.categoryId, teacher: form.value.teacher })
  } else {
    store.addCourse({ id: Date.now().toString(), title: form.value.title, description: form.value.description, categoryId: form.value.categoryId, teacher: form.value.teacher, cover: '', credits: 0, duration: 0, status: 'active', createdAt: new Date().toISOString() })
  }
  showCreateModal.value = false
  editingCourse.value = null
  form.value = { title: '', description: '', categoryId: '', teacher: '' }
}

function renderAdminCourses(root: HTMLElement) {
  root.innerHTML = ''
  const container = d3.select(root)

  // ---- 页面头部 ----
  const header = container.append('div').attr('class', 'space-y-6')

  const topRow = header.append('div').attr('class', 'flex items-center justify-between')
  const titleArea = topRow.append('div')
  titleArea.append('h1').attr('class', 'text-2xl font-bold text-brand-900').text('课程管理')
  titleArea.append('p').attr('class', 'text-brand-400 mt-1').text('管理所有课程信息')
  const newBtn = topRow.append('button')
    .attr('class', 'flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-800 text-white rounded-lg transition-colors text-sm font-medium')
    .on('click', () => { showCreateModal.value = true })
  renderIcon(newBtn, 'plus', 'w-4 h-4')
  newBtn.append('span').text('新建课程')

  // ---- 主区域 ----
  const mainArea = header.append('div').attr('class', 'flex gap-6')

  // 左侧表格区域
  const tableSection = mainArea.append('div').attr('class', 'flex-1 space-y-4')

  // 搜索和过滤
  const filterRow = tableSection.append('div').attr('class', 'flex gap-3')
  const searchWrap = filterRow.append('div').attr('class', 'relative flex-1')
  renderIcon(searchWrap, 'search', 'w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400')
  const searchInput = searchWrap.append('input')
    .attr('type', 'text')
    .attr('placeholder', '搜索课程名称...')
    .attr('class', 'w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-400/30 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none text-sm')
    .property('value', searchText.value)
    .on('input', (e: any) => { searchText.value = e.target.value })

  const catSelect = filterRow.append('select')
    .attr('class', 'px-3 py-2.5 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm')
    .on('change', (e: any) => { filterCategory.value = e.target.value })
  catSelect.append('option').attr('value', '').text('全部分类')
  store.categories.forEach((cat) => {
    catSelect.append('option').attr('value', cat.id).text(cat.name)
  })

  // 表格
  const tableWrap = tableSection.append('div')
    .attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm overflow-hidden')
  const table = tableWrap.append('table').attr('class', 'w-full')
  const thead = table.append('thead')
  const headRow = thead.append('tr').attr('class', 'bg-brand-400/10 border-b border-brand-400/20')
  headRow.append('th').attr('class', 'text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('课程名称')
  headRow.append('th').attr('class', 'text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('分类')
  headRow.append('th').attr('class', 'text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('教师')
  headRow.append('th').attr('class', 'text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('状态')
  headRow.append('th').attr('class', 'text-right px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('操作')

  const tbody = table.append('tbody')

  const courses = filteredCourses.value

  if (courses.length === 0) {
    const emptyRow = tbody.append('tr')
    emptyRow.append('td')
      .attr('colspan', '5')
      .attr('class', 'px-4 py-12 text-center text-brand-400')
      .text('暂无课程数据')
  }

  courses.forEach((course) => {
    const row = tbody.append('tr')
      .attr('class', 'border-b border-brand-400/10 hover:bg-brand-400/10 transition-colors')

    // 课程名称
    const nameCell = row.append('td').attr('class', 'px-4 py-3')
    const nameFlex = nameCell.append('div').attr('class', 'flex items-center gap-3')
    const iconBox = nameFlex.append('div')
      .attr('class', `w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(course.categoryId)}`)
    renderIcon(iconBox, 'bookOpen', 'w-4 h-4 text-white')
    const nameBlock = nameFlex.append('div')
    nameBlock.append('p').attr('class', 'text-sm font-medium text-brand-900').text(course.title)
    nameBlock.append('p').attr('class', 'text-xs text-brand-400').text(course.id)

    // 分类
    row.append('td').attr('class', 'px-4 py-3 text-sm text-brand-600').text(getCategoryName(course.categoryId))

    // 教师
    row.append('td').attr('class', 'px-4 py-3 text-sm text-brand-600').text(course.teacher)

    // 状态
    const statusCell = row.append('td').attr('class', 'px-4 py-3')
    const isActive = course.status === 'active'
    statusCell.append('span')
      .attr('class', `text-xs px-2 py-1 rounded-full ${isActive ? 'bg-brand-600/10 text-brand-600' : 'bg-brand-400/10 text-brand-400'}`)
      .text(isActive ? '进行中' : '已结束')

    // 操作
    const actionCell = row.append('td').attr('class', 'px-4 py-3 text-right')
    actionCell.append('button')
      .attr('class', 'text-xs text-brand-600 hover:underline mr-3')
      .on('click', () => handleEdit(course))
      .text('编辑')
    actionCell.append('button')
      .attr('class', 'text-xs text-red-400 hover:underline')
      .on('click', () => store.deleteCourse(course.id))
      .text('删除')
  })

  // ---- 右侧分类统计 ----
  const sidePanel = mainArea.append('div').attr('class', 'w-64 flex-shrink-0')
  const statCard = sidePanel.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-4')
  statCard.append('h3').attr('class', 'text-sm font-semibold text-brand-800 mb-3').text('分类统计')

  const statList = statCard.append('div').attr('class', 'space-y-2')
  store.categories.forEach((cat) => {
    const item = statList.append('div').attr('class', 'flex items-center justify-between text-sm')
    item.append('span').attr('class', 'text-brand-600').text(cat.name)
    item.append('span').attr('class', 'text-brand-900 font-medium').text(String(getCourseCount(cat.id)))
  })
  const divider = statList.append('div').attr('class', 'border-t border-brand-400/20 pt-2 flex items-center justify-between text-sm')
  divider.append('span').attr('class', 'text-brand-800 font-medium').text('总计')
  divider.append('span').attr('class', 'text-brand-900 font-bold').text(String(store.courses.length))
}

onMounted(() => {
  const root = document.getElementById('admin-courses-root')
  if (root) renderAdminCourses(root)
})

watch([searchText, filterCategory, () => store.courses.length, () => store.categories.length], () => {
  const root = document.getElementById('admin-courses-root')
  if (root) renderAdminCourses(root)
})
</script>
