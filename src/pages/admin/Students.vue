<template>
  <div id="admin-students-root"></div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'

const router = useRouter()
const store = useAppStore()
const searchText = ref('')
const currentPage = ref(1)
const pageSize = 10

const filteredStudents = computed(() => {
  if (!searchText.value) return store.students
  return store.students.filter((s) => s.name.includes(searchText.value) || s.studentId.includes(searchText.value))
})

const totalPages = computed(() => Math.ceil(filteredStudents.value.length / pageSize))
const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredStudents.value.slice(start, start + pageSize)
})

const getEnrolledCount = (studentId: string) => store.enrollments.filter((e) => e.studentId === studentId).length

function renderAdminStudents(root: HTMLElement) {
  root.innerHTML = ''
  const container = d3.select(root)

  const wrapper = container.append('div').attr('class', 'space-y-6')

  // ---- 页面头部 ----
  const header = wrapper.append('div')
  header.append('h1').attr('class', 'text-2xl font-bold text-brand-900').text('学员管理')
  header.append('p').attr('class', 'text-brand-400 mt-1').text('管理所有学员信息')

  // ---- 搜索栏 ----
  const filterRow = wrapper.append('div').attr('class', 'flex gap-3')
  const searchWrap = filterRow.append('div').attr('class', 'relative flex-1')
  renderIcon(searchWrap, 'search', 'w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400')
  searchWrap.append('input')
    .attr('type', 'text')
    .attr('placeholder', '搜索学员姓名或学号...')
    .attr('class', 'w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-400/30 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none text-sm')
    .property('value', searchText.value)
    .on('input', (e: any) => { searchText.value = e.target.value; currentPage.value = 1 })

  // ---- 表格 ----
  const tableWrap = wrapper.append('div')
    .attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm overflow-hidden')
  const table = tableWrap.append('table').attr('class', 'w-full')
  const thead = table.append('thead')
  const headRow = thead.append('tr').attr('class', 'bg-brand-400/10 border-b border-brand-400/20')
  headRow.append('th').attr('class', 'text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('姓名')
  headRow.append('th').attr('class', 'text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('学号')
  headRow.append('th').attr('class', 'text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('班级')
  headRow.append('th').attr('class', 'text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('已选课程')
  headRow.append('th').attr('class', 'text-right px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('操作')

  const tbody = table.append('tbody')

  const students = paginatedStudents.value

  if (students.length === 0) {
    const emptyRow = tbody.append('tr')
    emptyRow.append('td')
      .attr('colspan', '5')
      .attr('class', 'px-4 py-12 text-center text-brand-400')
      .text('暂无学员数据')
  }

  students.forEach((s) => {
    const row = tbody.append('tr')
      .attr('class', 'border-b border-brand-400/10 hover:bg-brand-400/10 transition-colors')

    // 姓名
    const nameCell = row.append('td').attr('class', 'px-4 py-3')
    const nameFlex = nameCell.append('div').attr('class', 'flex items-center gap-3')
    const avatar = nameFlex.append('div')
      .attr('class', 'w-8 h-8 rounded-full bg-brand-600/15 flex items-center justify-center')
    avatar.append('span').attr('class', 'text-xs font-bold text-brand-600').text(s.name[0])
    nameFlex.append('span').attr('class', 'text-sm font-medium text-brand-900').text(s.name)

    // 学号
    row.append('td').attr('class', 'px-4 py-3 text-sm text-brand-600').text(s.studentId)
    // 班级
    row.append('td').attr('class', 'px-4 py-3 text-sm text-brand-600').text(s.className)
    // 已选课程
    row.append('td').attr('class', 'px-4 py-3 text-sm text-brand-600').text(`${getEnrolledCount(s.id)} 门`)

    // 操作
    const actionCell = row.append('td').attr('class', 'px-4 py-3 text-right')
    actionCell.append('div')
      .attr('class', 'text-xs text-brand-600 hover:underline cursor-pointer')
      .on('click', () => router.push(`/admin/students/${s.id}`))
      .text('查看详情')
  })

  // ---- 分页 ----
  if (totalPages.value > 1) {
    const pagination = wrapper.append('div').attr('class', 'flex items-center justify-between')
    pagination.append('span').attr('class', 'text-sm text-brand-400').text(`共 ${store.students.length} 名学员`)

    const pageBtns = pagination.append('div').attr('class', 'flex gap-1')

    for (let p = 1; p <= totalPages.value; p++) {
      const isCurrent = currentPage.value === p
      pageBtns.append('button')
        .attr('class', `px-3 py-1.5 rounded-lg text-sm ${isCurrent ? 'bg-brand-600 text-white' : 'bg-brand-400/10 text-brand-600 hover:bg-brand-400/10'}`)
        .on('click', () => { currentPage.value = p })
        .text(String(p))
    }
  }
}

onMounted(() => {
  const root = document.getElementById('admin-students-root')
  if (root) renderAdminStudents(root)
})

watch([searchText, currentPage, () => store.students.length, () => store.enrollments.length], () => {
  const root = document.getElementById('admin-students-root')
  if (root) renderAdminStudents(root)
})
</script>
