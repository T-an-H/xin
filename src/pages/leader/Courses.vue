<template>
  <div id="leader-courses-root"></div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'

const store = useAppStore()

const courses = computed(() => store.getLeaderCourses(store.currentUser))

const activeCount = computed(() => courses.value.filter((c) => c.status === 'active').length)
const inactiveCount = computed(() => courses.value.filter((c) => c.status === 'inactive').length)

const categories = computed(() => {
  const catIds = new Set(courses.value.map((c) => c.categoryId))
  return store.categories.filter((cat) => catIds.has(cat.id))
})

const getCoursesByCategory = (categoryId: string) => courses.value.filter((c) => c.categoryId === categoryId)
const getCategoryCourseCount = (categoryId: string) => getCoursesByCategory(categoryId).length

const getStudentCount = (courseId: string) =>
  store.enrollments.filter((e) => e.courseId === courseId).length

function renderLeaderCourses(root: HTMLElement) {
  const container = d3.select(root)
  container.html('')

  // Header
  const header = container.append('div')
  header.append('h1').attr('class', 'text-2xl font-bold text-brand-900').text('课程总览')
  header.append('p').attr('class', 'text-brand-400 mt-1').text('查看管辖学院的所有课程信息')

  // Stats cards
  const statsGrid = container.append('div').attr('class', 'grid grid-cols-3 gap-4')

  // Total courses
  const totalCard = statsGrid.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-4 flex items-center gap-4')
  totalCard.append('div').attr('class', 'w-10 h-10 rounded-lg bg-brand-600/10 flex items-center justify-center').call((sel) => renderIcon(sel, 'bookOpen', 'w-5 h-5 text-brand-600'))
  const totalInfo = totalCard.append('div')
  totalInfo.append('p').attr('class', 'text-xs text-brand-400').text('总课程数')
  totalInfo.append('p').attr('class', 'text-xl font-bold text-brand-900').text(String(courses.value.length))

  // Active count
  const activeCard = statsGrid.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-4 flex items-center gap-4')
  activeCard.append('div').attr('class', 'w-10 h-10 rounded-lg bg-brand-600/10 flex items-center justify-center').call((sel) => renderIcon(sel, 'play', 'w-5 h-5 text-brand-600'))
  const activeInfo = activeCard.append('div')
  activeInfo.append('p').attr('class', 'text-xs text-brand-400').text('进行中')
  activeInfo.append('p').attr('class', 'text-xl font-bold text-brand-900').text(String(activeCount.value))

  // Inactive count
  const inactiveCard = statsGrid.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-4 flex items-center gap-4')
  inactiveCard.append('div').attr('class', 'w-10 h-10 rounded-lg bg-brand-400/10 flex items-center justify-center').call((sel) => renderIcon(sel, 'checkCircle', 'w-5 h-5 text-brand-400'))
  const inactiveInfo = inactiveCard.append('div')
  inactiveInfo.append('p').attr('class', 'text-xs text-brand-400').text('已结束')
  inactiveInfo.append('p').attr('class', 'text-xl font-bold text-brand-900').text(String(inactiveCount.value))

  // Category sections
  const catList = categories.value
  if (catList.length === 0) {
    const emptyCard = container.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-12 text-center text-brand-400')
    renderIcon(emptyCard, 'bookOpen', 'w-12 h-12 mx-auto mb-3 text-gray-200')
    emptyCard.append('p').attr('class', 'text-sm').text('暂无管辖课程数据')
    return
  }

  catList.forEach((cat) => {
    const section = container.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm overflow-hidden')

    // Category header
    const catHeader = section.append('div').attr('class', 'px-5 py-4 border-b border-brand-400/20 flex items-center gap-3')
    catHeader.append('div').attr('class', 'w-3 h-3 rounded-full').style('background-color', cat.color)
    catHeader.append('h2').attr('class', 'text-base font-semibold text-brand-900').text(cat.name)
    catHeader.append('span').attr('class', 'text-xs text-brand-400 ml-auto').text(`${getCategoryCourseCount(cat.id)} 门课程`)

    // Course list
    const courseList = section.append('div').attr('class', 'divide-y divide-gray-50')
    const catCourses = getCoursesByCategory(cat.id)

    if (catCourses.length === 0) {
      courseList.append('div').attr('class', 'px-5 py-8 text-center text-sm text-brand-400').text('暂无课程')
    } else {
      catCourses.forEach((course) => {
        const row = courseList.append('div').attr('class', 'px-5 py-4 hover:bg-brand-400/10 transition-colors')
        const contentRow = row.append('div').attr('class', 'flex items-start justify-between')
        const leftCol = contentRow.append('div').attr('class', 'flex-1 min-w-0')

        // Title + status badge
        const titleRow = leftCol.append('div').attr('class', 'flex items-center gap-2 mb-1')
        titleRow.append('h3').attr('class', 'text-sm font-medium text-brand-900 truncate').text(course.title)

        let statusLabel = ''
        let statusClass = ''
        if (course.status === 'active') {
          statusLabel = '进行中'
          statusClass = 'bg-brand-600/10 text-brand-600'
        } else if (course.status === 'inactive') {
          statusLabel = '已结束'
          statusClass = 'bg-brand-400/10 text-brand-400'
        } else {
          statusLabel = '草稿'
          statusClass = 'bg-brand-400/10 text-brand-400'
        }
        titleRow.append('span').attr('class', `text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusClass}`).text(statusLabel)

        // Meta info
        const metaRow = leftCol.append('div').attr('class', 'flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-400')
        metaRow.append('span').text(`导师：${course.teacher}`)
        if (course.mentor) {
          metaRow.append('span').text(`企业导师：${course.mentor}`)
        }
        metaRow.append('span').text(`课时：${course.duration}`)
        metaRow.append('span').text(`学生：${getStudentCount(course.id)} 人`)
      })
    }
  })
}

onMounted(() => {
  const root = document.getElementById('leader-courses-root')
  if (root) renderLeaderCourses(root)
})

watch([courses, categories], () => {
  const root = document.getElementById('leader-courses-root')
  if (root) renderLeaderCourses(root)
}, { deep: true })
</script>
