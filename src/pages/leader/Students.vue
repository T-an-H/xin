<template>
  <div id="leader-students-root"></div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'

const store = useAppStore()

const students = computed(() => store.getLeaderStudents(store.currentUser))

const activeCount = computed(() => students.value.filter((s) => s.status === 'active').length)

function renderStudents(root: HTMLElement) {
  const container = d3.select(root)
  container.html('')

  // Header
  const header = container.append('div')
  header.append('h1').attr('class', 'text-2xl font-bold text-gray-900').text('学员总览')
  header.append('p').attr('class', 'text-gray-400 mt-1').text('查看管辖学院的所有学员信息')

  // Stats cards
  const statsGrid = container.append('div').attr('class', 'grid grid-cols-2 gap-4')

  // Total students card
  const totalCard = statsGrid.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-4 flex items-center gap-4')
  totalCard.append('div').attr('class', 'w-10 h-10 rounded-lg bg-brand-600/10 flex items-center justify-center')
    .call((sel) => renderIcon(sel, 'users', 'w-5 h-5 text-gray-600'))
  const totalInfo = totalCard.append('div')
  totalInfo.append('p').attr('class', 'text-xs text-gray-400').text('总学员数')
  totalInfo.append('p').attr('class', 'text-xl font-bold text-gray-900').text(String(students.value.length))

  // Active students card
  const activeCard = statsGrid.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-4 flex items-center gap-4')
  activeCard.append('div').attr('class', 'w-10 h-10 rounded-lg bg-brand-600/10 flex items-center justify-center')
    .call((sel) => renderIcon(sel, 'userCheck', 'w-5 h-5 text-gray-600'))
  const activeInfo = activeCard.append('div')
  activeInfo.append('p').attr('class', 'text-xs text-gray-400').text('活跃学员')
  activeInfo.append('p').attr('class', 'text-xl font-bold text-gray-900').text(String(activeCount.value))

  // Table
  const tableWrapper = container.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm overflow-hidden')
  const table = tableWrapper.append('table').attr('class', 'w-full')

  // Table head
  const thead = table.append('thead')
  const headerRow = thead.append('tr').attr('class', 'bg-brand-400/10 border-b border-brand-400/20')
  const headers = ['姓名', '学号', '班级', '手机', '邮箱', '入学成绩', '状态']
  headers.forEach((h) => {
    headerRow.append('th').attr('class', 'text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase').text(h)
  })

  // Table body
  const tbody = table.append('tbody')
  const studentList = students.value

  if (studentList.length === 0) {
    tbody.append('tr').append('td')
      .attr('colspan', '7')
      .attr('class', 'px-4 py-12 text-center text-gray-400')
      .text('暂无学员数据')
  } else {
    studentList.forEach((s) => {
      const row = tbody.append('tr').attr('class', 'border-b border-gray-50 hover:bg-brand-400/10 transition-colors')

      // Name column
      const nameTd = row.append('td').attr('class', 'px-4 py-3')
      const nameFlex = nameTd.append('div').attr('class', 'flex items-center gap-3')
      const avatar = nameFlex.append('div').attr('class', 'w-8 h-8 rounded-full bg-brand-600/15 flex items-center justify-center')
      avatar.append('span').attr('class', 'text-xs font-bold text-gray-600').text(s.name[0])
      nameFlex.append('span').attr('class', 'text-sm font-medium text-gray-900').text(s.name)

      // Other columns
      row.append('td').attr('class', 'px-4 py-3 text-sm text-gray-600').text(s.studentId || '-')
      row.append('td').attr('class', 'px-4 py-3 text-sm text-gray-600').text(s.className || '-')
      row.append('td').attr('class', 'px-4 py-3 text-sm text-gray-600').text(s.phone)
      row.append('td').attr('class', 'px-4 py-3 text-sm text-gray-600').text(s.email)
      row.append('td').attr('class', 'px-4 py-3 text-sm text-gray-600').text(s.enrollmentScore ?? '-')

      // Status column
      const statusTd = row.append('td').attr('class', 'px-4 py-3')
      const isActive = s.status === 'active'
      statusTd.append('span')
        .attr('class', `text-xs px-2 py-1 rounded-full ${isActive ? 'bg-brand-600/10 text-gray-600' : 'bg-brand-400/10 text-gray-400'}`)
        .text(isActive ? '活跃' : '不活跃')
    })
  }
}

onMounted(() => {
  const root = document.getElementById('leader-students-root')
  if (root) renderStudents(root)
})

watch([students], () => {
  const root = document.getElementById('leader-students-root')
  if (root) renderStudents(root)
}, { deep: true })
</script>
