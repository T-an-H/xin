<template>
  <div id="student-schedule-root"></div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'

const store = useAppStore()

// ---- 周导航 ----
const weekStart = ref(getMonday(new Date()))

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  date.setHours(0, 0, 0, 0)
  return date
}

function fmtDate(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function isToday(d: Date): boolean {
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

const weekDays = computed(() => {
  const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    return { label: labels[i], date: d, dateStr: fmtDate(d), isToday: isToday(d) }
  })
})

const weekRange = computed(() => `${weekDays.value[0].dateStr} - ${weekDays.value[6].dateStr}`)

const weekNumber = computed(() => {
  const s = new Date(weekStart.value)
  const y = new Date(s.getFullYear(), 0, 1)
  return Math.ceil(((s.getTime() - y.getTime()) / 86400000 + y.getDay() + 1) / 7)
})

function prevWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() - 7); weekStart.value = d; reRender() }
function nextWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() + 7); weekStart.value = d; reRender() }
function todayFn() { weekStart.value = getMonday(new Date()); reRender() }

// ---- 学生课表数据 ----
const student = computed(() => store.students.find((s) => s.name === store.currentUser) ?? store.students[0])

const mySchedules = computed(() => {
  const ids = store.enrollments.filter((e) => e.studentId === student.value?.id).map((e) => e.courseId)
  return store.schedules.filter((s) => ids.includes(s.courseId))
})

// ---- 时间槽 ----
interface ParsedSlot { key: string; label: string }
function parseSlot(t: string): ParsedSlot {
  const [s] = t.split('-')
  const [h, m] = s.split(':').map(Number)
  return { key: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, label: `${h}:${String(m).padStart(2, '0')}` }
}

const timeSlots = computed(() => {
  const map = new Map<string, ParsedSlot>()
  mySchedules.value.forEach((s) => { const p = parseSlot(s.timeSlot); if (!map.has(p.key)) map.set(p.key, p) })
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key))
})

// ---- 颜色方案 ----
interface CourseColor {
  cellBg: string
  cardBg: string
  border: string
  text: string
}

const PALETTE: CourseColor[] = [
  { cellBg: '#bac9bd', cardBg: '#5eb6b9', border: '#429fc4', text: '#0f5073' },
  { cellBg: '#80b8d7', cardBg: '#429fc4', border: '#429fc4', text: '#0f5073' },
  { cellBg: '#bac9bd', cardBg: '#5eb6b9', border: '#429fc4', text: '#155ea0' },
  { cellBg: '#bac9bd', cardBg: '#429fc4', border: '#429fc4', text: '#0f5073' },
  { cellBg: '#80b8d7', cardBg: '#5eb6b9', border: '#429fc4', text: '#155ea0' },
  { cellBg: '#bac9bd', cardBg: '#429fc4', border: '#429fc4', text: '#0f5073' },
  { cellBg: '#bac9bd', cardBg: '#5eb6b9', border: '#429fc4', text: '#155ea0' },
  { cellBg: '#80b8d7', cardBg: '#429fc4', border: '#429fc4', text: '#0f5073' },
]

const courseColorMap = computed(() => {
  const map = new Map<string, CourseColor>()
  const ids = Array.from(new Map(mySchedules.value.map((s) => [s.courseId, s])).keys())
  ids.forEach((id, i) => map.set(id, PALETTE[i % PALETTE.length]))
  return map
})

function getCourseColor(courseId: string): CourseColor {
  return courseColorMap.value.get(courseId) ?? PALETTE[0]
}

// ---- 课程卡片 ----
interface CardItem extends CourseColor {
  id: string
  courseName: string
  teacher: string
  room: string
  timeSlot: string
}

function getCards(day: Date, slot: ParsedSlot): CardItem[] {
  return mySchedules.value
    .filter((s) => {
      const sd = new Date(s.startDate)
      const p = parseSlot(s.timeSlot)
      return sd.getFullYear() === day.getFullYear() && sd.getMonth() === day.getMonth() && sd.getDate() === day.getDate() && p.key === slot.key
    })
    .map((s) => {
      const c = getCourseColor(s.courseId)
      return { id: s.id, courseName: s.title, teacher: s.teacher, room: s.room, timeSlot: s.timeSlot, ...c }
    })
}

const allCards = computed(() => {
  const r: CardItem[] = []
  weekDays.value.forEach((d) => timeSlots.value.forEach((s) => r.push(...getCards(d.date, s))))
  return r
})

// ---- 图例 ----
const courseColorsMap = computed(() => {
  const map = new Map<string, { label: string; cardBg: string; border: string; text: string }>()
  mySchedules.value.forEach((s) => {
    if (!map.has(s.courseId)) {
      const c = getCourseColor(s.courseId)
      map.set(s.courseId, { label: s.title, cardBg: c.cardBg, border: c.border, text: c.text })
    }
  })
  return Array.from(map.values())
})

function reRender() {
  const el = document.getElementById('student-schedule-root')
  if (el) renderSchedule(el)
}

function renderSchedule(root: HTMLElement) {
  const container = d3.select(root)
  container.selectAll('*').remove()

  const days = weekDays.value
  const slots = timeSlots.value
  const cards = allCards.value
  const legends = courseColorsMap.value

  // 头部：周导航
  const headerDiv = container.append('div').attr('class', 'flex items-center justify-between')
  const titleDiv = headerDiv.append('div')
  titleDiv.append('h1').attr('class', 'text-2xl font-bold text-gray-900').text('我的课表')
  const subtitle = titleDiv.append('p').attr('class', 'text-sm text-gray-500 mt-1 flex items-center gap-2')
  subtitle.append('span').text(weekRange.value)
  subtitle.append('span').attr('class', 'w-1 h-1 rounded-full bg-brand-400/60')
  subtitle.append('span').text(`第${weekNumber.value}周`)

  const navDiv = headerDiv.append('div').attr('class', 'flex items-center gap-1 bg-white rounded-lg border border-brand-400/30 shadow-sm p-0.5')
  const prevBtn = navDiv.append('button').attr('class', 'p-2 rounded-md hover:bg-brand-400/10 transition-colors').attr('title', '上一周').on('click', prevWeek)
  renderIcon(prevBtn, 'chevronLeft').attr('class', 'w-4 h-4 text-gray-400')
  const todayBtn = navDiv.append('button').attr('class', 'px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-brand-600/10 rounded-md transition-colors').on('click', todayFn).text('今天')
  const nextBtn = navDiv.append('button').attr('class', 'p-2 rounded-md hover:bg-brand-400/10 transition-colors').attr('title', '下一周').on('click', nextWeek)
  renderIcon(nextBtn, 'chevronRight').attr('class', 'w-4 h-4 text-gray-400')

  if (cards.length === 0) {
    // 空状态
    const emptyDiv = container.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm py-20 text-center')
    const iconWrap = emptyDiv.append('div').attr('class', 'inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-400/10 mb-4')
    renderIcon(iconWrap, 'calendarDays').attr('class', 'w-8 h-8 text-gray-400/60')
    emptyDiv.append('p').attr('class', 'text-gray-800 font-medium').text('本周暂无课程安排')
    emptyDiv.append('p').attr('class', 'text-gray-400 text-sm mt-1').text(`${weekRange.value} 没有课程`)
    const backBtn = emptyDiv.append('button').attr('class', 'mt-4 text-sm text-gray-600 hover:text-gray-600 font-medium inline-flex items-center gap-1').on('click', todayFn)
    renderIcon(backBtn, 'calendarDays').attr('class', 'w-4 h-4')
    backBtn.append('span').text('返回本周')
  } else {
    // 课表主体
    const tableWrap = container.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm overflow-hidden')
    const scrollDiv = tableWrap.append('div').attr('class', 'overflow-x-auto')
    const table = scrollDiv.append('table').attr('class', 'w-full border-collapse').style('table-layout', 'fixed').style('min-width', '820px')

    // thead
    const thead = table.append('thead')
    const headRow = thead.append('tr')
    headRow.append('th').attr('class', 'w-[64px] p-2 text-xs text-gray-400 font-normal text-center bg-brand-400/10 border-r border-b border-brand-400/20 border-t-0')
    days.forEach((day) => {
      const th = headRow.append('th')
        .attr('class', 'p-2 text-center bg-brand-400/10 border-r border-b border-brand-400/20 last:border-r-0')
        .style('background', day.isToday ? '#eff6ff' : null)
      const innerDiv = th.append('div').attr('class', 'relative inline-flex flex-col items-center')
      if (day.isToday) {
        innerDiv.append('span').attr('class', 'text-[9px] font-bold text-white bg-brand-600 px-1.5 rounded-b-sm leading-4 absolute -top-3').text('今')
      }
      innerDiv.append('span').attr('class', `text-xs font-semibold ${day.isToday ? 'text-gray-600' : 'text-gray-600'}`).text(day.label)
      innerDiv.append('span').attr('class', `text-[11px] mt-0.5 ${day.isToday ? 'text-gray-600 font-semibold' : 'text-gray-400'}`).text(day.dateStr)
    })

    // tbody
    const tbody = table.append('tbody')
    slots.forEach((slot) => {
      const row = tbody.append('tr').attr('class', 'align-top')
      // 时间标签
      row.append('td').attr('class', 'w-[64px] p-2 text-[10px] text-gray-400 text-center bg-white border-r border-b border-brand-400/20 align-top pt-3').text(slot.label)

      days.forEach((day) => {
        const dayCards = getCards(day.date, slot)
        const td = row.append('td')
          .attr('class', 'p-1 border-r border-b border-brand-400/20 last:border-r-0 align-top')
          .style('background', dayCards.length > 0 ? dayCards[0].cellBg : '#ffffff')

        dayCards.forEach((card) => {
          const cardDiv = td.append('div')
            .attr('class', 'relative rounded-lg px-2.5 py-2 text-[11px] leading-tight cursor-pointer transition-all duration-150 border hover:shadow-md')
            .style('background', card.cardBg)
            .style('border-color', card.border)
          cardDiv.append('p').attr('class', 'font-semibold truncate text-[12px]').style('color', card.text).text(card.courseName)
          cardDiv.append('p').attr('class', 'text-[10px] mt-0.5 font-medium').style('color', card.text).style('opacity', 0.75).text(card.teacher)
          cardDiv.append('p').attr('class', 'text-[9px] mt-0.5').style('color', card.text).style('opacity', 0.55).text(`${card.room} · ${card.timeSlot}`)
        })
      })
    })

    // 图例
    if (legends.length > 0) {
      const legendDiv = container.append('div').attr('class', 'flex flex-wrap gap-2 text-xs')
      legends.forEach((l) => {
        const item = legendDiv.append('span')
          .attr('class', 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border')
          .style('background', l.cardBg)
          .style('border-color', l.border)
          .style('color', l.text)
        item.append('span').attr('class', 'w-2.5 h-2.5 rounded-sm').style('background', l.border)
        item.append('span').text(l.label)
      })
    }
  }
}

onMounted(() => {
  const el = document.getElementById('student-schedule-root')
  if (el) renderSchedule(el)
})

watch([mySchedules, weekStart], () => {
  const el = document.getElementById('student-schedule-root')
  if (el) renderSchedule(el)
}, { deep: true })
</script>
