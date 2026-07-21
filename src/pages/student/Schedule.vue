<template>
  <div class="space-y-6">
    <!-- 头部：周导航 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">我的课表</h1>
        <p class="text-sm text-gray-500 mt-1 flex items-center gap-2">
          <span>{{ weekRange }}</span>
          <span class="w-1 h-1 rounded-full bg-gray-300" />
          <span>第{{ weekNumber }}周</span>
        </p>
      </div>
      <div class="flex items-center gap-1 bg-white rounded-lg border border-gray-200 shadow-sm p-0.5">
        <button @click="prevWeek" class="p-2 rounded-md hover:bg-gray-100 transition-colors" title="上一周">
          <ChevronLeft class="w-4 h-4 text-gray-500" />
        </button>
        <button @click="today" class="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
          今天
        </button>
        <button @click="nextWeek" class="p-2 rounded-md hover:bg-gray-100 transition-colors" title="下一周">
          <ChevronRight class="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>

    <!-- 课表主体 -->
    <div v-if="allCards.length > 0" class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse" style="table-layout: fixed; min-width: 820px;">
          <thead>
            <tr>
              <th class="w-[64px] p-2 text-xs text-gray-400 font-normal text-center bg-gray-50 border-r border-b border-gray-100 border-t-0" />
              <th v-for="(day, i) in weekDays" :key="i"
                class="p-2 text-center bg-gray-50 border-r border-b border-gray-100 last:border-r-0"
                :class="i === 6 ? '' : ''"
                :style="day.isToday ? { background: '#eff6ff' } : {}">
                <div class="relative inline-flex flex-col items-center">
                  <span v-if="day.isToday" class="text-[9px] font-bold text-white bg-red-500 px-1.5 rounded-b-sm leading-4 absolute -top-3">今</span>
                  <span class="text-xs font-semibold" :class="day.isToday ? 'text-blue-600' : 'text-gray-600'">{{ day.label }}</span>
                  <span class="text-[11px] mt-0.5" :class="day.isToday ? 'text-blue-500 font-semibold' : 'text-gray-400'">{{ day.dateStr }}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(slot, sIdx) in timeSlots" :key="sIdx" class="align-top">
              <!-- 时间标签 -->
              <td class="w-[64px] p-2 text-[10px] text-gray-400 text-center bg-white border-r border-b border-gray-100 align-top pt-3">
                {{ slot.label }}
              </td>
              <!-- 每日单元格 -->
              <td v-for="(day, dIdx) in weekDays" :key="dIdx"
                class="p-1 border-r border-b border-gray-100 last:border-r-0 align-top"
                :class="day.isToday ? '' : ''"
                :style="cellStyle(day.date, slot)">
                <!-- 课程卡片 -->
                <div v-for="card in getCards(day.date, slot)" :key="card.id"
                  class="relative rounded-lg px-2.5 py-2 text-[11px] leading-tight cursor-pointer transition-all duration-150 border hover:shadow-md"
                  :style="{ background: card.cardBg, borderColor: card.border }">
                  <p class="font-semibold truncate text-[12px]" :style="{ color: card.text }">{{ card.courseName }}</p>
                  <p class="text-[10px] mt-0.5 font-medium" :style="{ color: card.text, opacity: 0.75 }">{{ card.teacher }}</p>
                  <p class="text-[9px] mt-0.5" :style="{ color: card.text, opacity: 0.55 }">{{ card.room }} · {{ card.timeSlot }}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 无课表 -->
    <div v-else class="bg-white rounded-xl border border-gray-100 shadow-sm py-20 text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
        <CalendarDays class="w-8 h-8 text-gray-300" />
      </div>
      <p class="text-gray-500 font-medium">本周暂无课程安排</p>
      <p class="text-gray-400 text-sm mt-1">{{ weekRange }} 没有课程</p>
      <button @click="today" class="mt-4 text-sm text-blue-500 hover:text-blue-600 font-medium inline-flex items-center gap-1">
        <CalendarDays class="w-4 h-4" />
        返回本周
      </button>
    </div>

    <!-- 图例 -->
    <div v-if="courseColorsMap.length > 0" class="flex flex-wrap gap-2 text-xs">
      <span v-for="(c, i) in courseColorsMap" :key="i"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
        :style="{ background: c.cardBg, borderColor: c.border, color: c.text }">
        <span class="w-2.5 h-2.5 rounded-sm" :style="{ background: c.border }" />
        {{ c.label }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-vue-next'

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

function prevWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() - 7); weekStart.value = d }
function nextWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() + 7); weekStart.value = d }
function today() { weekStart.value = getMonday(new Date()) }

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
  cellBg: string       // 单元格底色（极浅）
  cardBg: string       // 卡片底色
  border: string       // 卡片边框
  text: string         // 卡片文字
}

const PALETTE: CourseColor[] = [
  { cellBg: '#f0f7ff', cardBg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
  { cellBg: '#ecfdf5', cardBg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
  { cellBg: '#fffbeb', cardBg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  { cellBg: '#eef2ff', cardBg: '#e0e7ff', border: '#a5b4fc', text: '#3730a3' },
  { cellBg: '#fdf2f8', cardBg: '#fce7f3', border: '#f9a8d4', text: '#9d174d' },
  { cellBg: '#f5f3ff', cardBg: '#ede9fe', border: '#c4b5fd', text: '#5b21b6' },
  { cellBg: '#f0fdfa', cardBg: '#ccfbf1', border: '#5eead4', text: '#115e59' },
  { cellBg: '#fff1f2', cardBg: '#ffe4e6', border: '#fda4af', text: '#9f1239' },
]

// 每个课程唯一颜色（按课程 ID 顺序分配）
const courseColorMap = computed(() => {
  const map = new Map<string, CourseColor>()
  const ids = Array.from(new Map(mySchedules.value.map((s) => [s.courseId, s])).keys())
  ids.forEach((id, i) => map.set(id, PALETTE[i % PALETTE.length]))
  return map
})

function getCourseColor(courseId: string): CourseColor {
  return courseColorMap.value.get(courseId) ?? PALETTE[0]
}

// 获取某单元格的课程，若无课返回白色，有课返回该课程对应的极浅底色
function cellStyle(day: Date, slot: ParsedSlot): Record<string, string> {
  const cards = getCards(day, slot)
  if (cards.length === 0) return { background: '#ffffff' }
  return { background: cards[0].cellBg }
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
interface LegendItem { label: string; cardBg: string; border: string; text: string }
const courseColorsMap = computed(() => {
  const map = new Map<string, LegendItem>()
  mySchedules.value.forEach((s) => {
    if (!map.has(s.courseId)) {
      const c = getCourseColor(s.courseId)
      map.set(s.courseId, { label: s.title, cardBg: c.cardBg, border: c.border, text: c.text })
    }
  })
  return Array.from(map.values())
})
</script>
