<template>
  <div id="admin-schedule-root"></div>
  <Modal :is-open="showModal" :on-close="() => showModal = false" title="新建排课">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-brand-800 mb-1">课程</label>
        <select v-model="form.courseId" class="w-full px-3 py-2 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm">
          <option v-for="c in store.courses" :key="c.id" :value="c.id">{{ c.title }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-brand-800 mb-1">时间段</label>
        <select v-model="form.timeSlot" class="w-full px-3 py-2 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm">
          <option v-for="slot in timeSlots" :key="slot" :value="slot">{{ slot }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-brand-800 mb-1">教室/地点</label>
        <input v-model="form.room" type="text" class="w-full px-3 py-2 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-brand-800 mb-1">开始日期</label>
          <input v-model="form.startDate" type="date" class="w-full px-3 py-2 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-brand-800 mb-1">结束日期</label>
          <input v-model="form.endDate" type="date" class="w-full px-3 py-2 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm" />
        </div>
      </div>
      <div class="flex gap-3 pt-2">
        <button @click="handleSave" class="flex-1 py-2.5 bg-brand-600 hover:bg-brand-800 text-white rounded-lg text-sm font-medium transition-colors">保存</button>
        <button @click="showModal = false" class="flex-1 py-2.5 bg-brand-400/10 hover:bg-brand-400/10 text-brand-600 rounded-lg text-sm font-medium transition-colors">取消</button>
      </div>
    </div>
  </Modal>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'
import Modal from '@/components/Modal.vue'

const store = useAppStore()
const showModal = ref(false)
const timeSlots = ['周一 08:00-09:30', '周一 09:45-11:15', '周一 14:00-15:30', '周二 08:00-09:30', '周二 09:45-11:15', '周二 14:00-15:30', '周三 08:00-09:30', '周三 09:45-11:15', '周三 14:00-15:30', '周四 08:00-09:30', '周四 09:45-11:15', '周四 14:00-15:30', '周五 08:00-09:30', '周五 09:45-11:15', '周五 14:00-15:30']
const form = ref({ courseId: '', timeSlot: '周一 08:00-09:30', room: '', startDate: '', endDate: '' })

const handleSave = () => {
  const course = store.courses.find((c) => c.id === form.value.courseId)
  if (!course) return
  store.addSchedule({
    id: Date.now().toString(),
    courseId: form.value.courseId,
    title: course.title,
    timeSlot: form.value.timeSlot,
    room: form.value.room,
    startDate: form.value.startDate,
    endDate: form.value.endDate,
    teacher: course.teacher,
  })
  showModal.value = false
}

function renderAdminSchedule(root: HTMLElement) {
  root.innerHTML = ''
  const container = d3.select(root)

  const wrapper = container.append('div').attr('class', 'space-y-6')

  // ---- 页面头部 ----
  const header = wrapper.append('div').attr('class', 'flex items-center justify-between')
  const titleArea = header.append('div')
  titleArea.append('h1').attr('class', 'text-2xl font-bold text-brand-900').text('排课管理')
  titleArea.append('p').attr('class', 'text-brand-400 mt-1').text('管理课程排课信息')
  const newBtn = header.append('button')
    .attr('class', 'flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-800 text-white rounded-lg transition-colors text-sm font-medium')
    .on('click', () => { showModal.value = true })
  renderIcon(newBtn, 'plus', 'w-4 h-4')
  newBtn.append('span').text('新建排课')

  // ---- 表格 ----
  const tableWrap = wrapper.append('div')
    .attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm overflow-hidden')
  const table = tableWrap.append('table').attr('class', 'w-full')
  const thead = table.append('thead')
  const headRow = thead.append('tr').attr('class', 'bg-brand-400/10 border-b border-brand-400/20')
  headRow.append('th').attr('class', 'text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('课程')
  headRow.append('th').attr('class', 'text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('教师')
  headRow.append('th').attr('class', 'text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('时间')
  headRow.append('th').attr('class', 'text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('地点')
  headRow.append('th').attr('class', 'text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('日期')
  headRow.append('th').attr('class', 'text-right px-4 py-3 text-xs font-medium text-brand-400 uppercase').text('操作')

  const tbody = table.append('tbody')

  const schedules = store.schedules

  if (schedules.length === 0) {
    const emptyRow = tbody.append('tr')
    emptyRow.append('td')
      .attr('colspan', '6')
      .attr('class', 'px-4 py-12 text-center text-brand-400')
      .text('暂无排课数据')
  }

  schedules.forEach((sched) => {
    const row = tbody.append('tr')
      .attr('class', 'border-b border-brand-400/10 hover:bg-brand-400/10 transition-colors')

    row.append('td').attr('class', 'px-4 py-3')
      .append('p').attr('class', 'text-sm font-medium text-brand-900').text(sched.title)

    row.append('td').attr('class', 'px-4 py-3 text-sm text-brand-600').text(sched.teacher)
    row.append('td').attr('class', 'px-4 py-3 text-sm text-brand-600').text(sched.timeSlot)
    row.append('td').attr('class', 'px-4 py-3 text-sm text-brand-600').text(sched.room)
    row.append('td').attr('class', 'px-4 py-3 text-sm text-brand-600').text(`${sched.startDate} ~ ${sched.endDate}`)

    const actionCell = row.append('td').attr('class', 'px-4 py-3 text-right')
    actionCell.append('button')
      .attr('class', 'text-xs text-red-400 hover:underline')
      .on('click', () => store.deleteSchedule(sched.id))
      .text('删除')
  })
}

onMounted(() => {
  const root = document.getElementById('admin-schedule-root')
  if (root) renderAdminSchedule(root)
})

watch([showModal, () => store.schedules.length, () => store.courses.length], () => {
  const root = document.getElementById('admin-schedule-root')
  if (root) renderAdminSchedule(root)
})
</script>
