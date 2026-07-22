<template>
  <div id="admin-statistics-root"></div>
</template>
<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'

const store = useAppStore()

const getCourseAvg = (courseId: string) => {
  const grades = store.grades.filter((g) => g.courseId === courseId)
  if (grades.length === 0) return 0
  return Math.round(grades.reduce((s, g) => s + g.totalScore, 0) / grades.length)
}

const getChartColor = (courseId: string) => {
  const colors = ['#415a77', '#415a77', '#415a77', '#ef4444', '#415a77', '#ec4899', '#415a77', '#84cc16']
  const idx = store.courses.findIndex((c) => c.id === courseId)
  return colors[idx % colors.length]
}

const gradeRanges = computed(() => {
  const all = store.grades.map((g) => g.totalScore)
  const ranges = [
    { label: '90-100', color: '#415a77', count: 0, percent: 0 },
    { label: '80-89', color: '#415a77', count: 0, percent: 0 },
    { label: '70-79', color: '#415a77', count: 0, percent: 0 },
    { label: '60-69', color: '#f97316', count: 0, percent: 0 },
    { label: '<60', color: '#ef4444', count: 0, percent: 0 },
  ]
  if (all.length === 0) return ranges
  for (const s of all) {
    if (s >= 90) ranges[0].count++
    else if (s >= 80) ranges[1].count++
    else if (s >= 70) ranges[2].count++
    else if (s >= 60) ranges[3].count++
    else ranges[4].count++
  }
  for (const r of ranges) {
    r.percent = Math.round((r.count / all.length) * 100)
  }
  return ranges
})

function renderAdminStatistics(root: HTMLElement) {
  root.innerHTML = ''
  const container = d3.select(root)

  const wrapper = container.append('div').attr('class', 'space-y-6')

  // ---- 页面头部 ----
  const header = wrapper.append('div')
  header.append('h1').attr('class', 'text-2xl font-bold text-brand-900').text('成绩统计')
  header.append('p').attr('class', 'text-brand-400 mt-1').text('课程成绩分布与统计概览')

  // ---- 主体网格 ----
  const grid = wrapper.append('div').attr('class', 'grid grid-cols-1 lg:grid-cols-3 gap-6')

  // ---- 左侧: 两列 ----
  const leftCol = grid.append('div').attr('class', 'lg:col-span-2 space-y-6')

  // ---- 课程成绩汇总 ----
  const summaryCard = leftCol.append('div')
    .attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-6')
  summaryCard.append('h3').attr('class', 'text-sm font-semibold text-brand-800 mb-4').text('课程成绩汇总')

  const summaryList = summaryCard.append('div').attr('class', 'space-y-3')

  store.courses.forEach((course) => {
    const avg = getCourseAvg(course.id)
    const item = summaryList.append('div').attr('class', 'space-y-1.5')

    const labelRow = item.append('div').attr('class', 'flex items-center justify-between text-sm')
    labelRow.append('span').attr('class', 'text-brand-800').text(course.title)
    labelRow.append('span').attr('class', 'text-brand-400 text-xs').text(`${avg}分`)

    const barBg = item.append('div').attr('class', 'h-2 bg-brand-400/10 rounded-full overflow-hidden')
    barBg.append('div')
      .attr('class', 'h-full rounded-full')
      .style('width', `${avg}%`)
      .style('background-color', getChartColor(course.id))
  })

  // ---- 成绩分布 ----
  const distCard = leftCol.append('div')
    .attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-6')
  distCard.append('h3').attr('class', 'text-sm font-semibold text-brand-800 mb-4').text('成绩分布')

  const distList = distCard.append('div').attr('class', 'space-y-2')

  const ranges = gradeRanges.value
  ranges.forEach((range) => {
    const item = distList.append('div').attr('class', 'flex items-center gap-3')

    item.append('span').attr('class', 'text-xs text-brand-400 w-16').text(range.label)

    const barBg = item.append('div').attr('class', 'flex-1 h-5 bg-brand-400/10 rounded overflow-hidden')
    barBg.append('div')
      .attr('class', 'h-full rounded transition-all')
      .style('width', `${range.percent}%`)
      .style('background-color', range.color)

    item.append('span').attr('class', 'text-xs text-brand-400 w-10 text-right').text(`${range.count}人`)
  })

  // ---- 右侧: 统计概览 ----
  const rightCol = grid.append('div').attr('class', 'space-y-6')

  // ---- 课程统计卡片 ----
  const courseStatCard = rightCol.append('div')
    .attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-6')
  courseStatCard.append('h3').attr('class', 'text-sm font-semibold text-brand-800 mb-4').text('课程统计')

  const courseStatList = courseStatCard.append('div').attr('class', 'space-y-4')

  const courseStats = [
    { label: '总课程数', value: String(store.courses.length), color: 'text-brand-900' },
    { label: '总学生数', value: String(store.students.length), color: 'text-brand-900' },
    { label: '进行中', value: String(store.courses.filter(c => c.status === 'active').length), color: 'text-brand-600' },
    { label: '已结束', value: String(store.courses.filter(c => c.status !== 'active').length), color: 'text-brand-400' },
  ]

  courseStats.forEach((stat) => {
    const row = courseStatList.append('div').attr('class', 'flex items-center justify-between')
    row.append('span').attr('class', 'text-sm text-brand-600').text(stat.label)
    row.append('span').attr('class', `text-xl font-bold ${stat.color}`).text(stat.value)
  })

  // ---- 分类统计卡片 ----
  const catStatCard = rightCol.append('div')
    .attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-6')
  catStatCard.append('h3').attr('class', 'text-sm font-semibold text-brand-800 mb-3').text('分类统计')

  const catStatList = catStatCard.append('div').attr('class', 'space-y-2')

  store.categories.forEach((cat) => {
    const cnt = store.courses.filter((c) => c.categoryId === cat.id).length
    const row = catStatList.append('div').attr('class', 'flex items-center justify-between text-sm')
    row.append('span').attr('class', 'text-brand-600').text(cat.name)
    row.append('span').attr('class', 'text-brand-900 font-medium').text(String(cnt))
  })
}

onMounted(() => {
  const root = document.getElementById('admin-statistics-root')
  if (root) renderAdminStatistics(root)
})

watch([() => store.courses.length, () => store.students.length, () => store.grades.length, () => store.categories.length], () => {
  const root = document.getElementById('admin-statistics-root')
  if (root) renderAdminStatistics(root)
})
</script>
