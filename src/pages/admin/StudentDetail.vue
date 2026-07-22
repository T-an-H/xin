<template>
  <div id="admin-student-detail-root"></div>
</template>
<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const student = computed(() => store.students.find((s) => s.id === route.params.id))
const enrolledCourses = computed(() => store.enrollments.filter((e) => e.studentId === student.value?.id))

const getCourseName = (id: string) => store.courses.find((c) => c.id === id)?.title || '未知'
const getCourseProgress = (courseId: string) => {
  const grade = store.grades.find((g) => g.studentId === student.value?.id && g.courseId === courseId)
  return grade ? Math.min(100, Math.round(grade.totalScore)) : 0
}

const avgProgress = computed(() => {
  if (enrolledCourses.value.length === 0) return 0
  const total = enrolledCourses.value.reduce((s, e) => s + getCourseProgress(e.courseId), 0)
  return Math.round(total / enrolledCourses.value.length)
})

const avgScore = computed(() => {
  const grades = store.grades.filter((g) => g.studentId === student.value?.id)
  if (grades.length === 0) return 0
  return Math.round(grades.reduce((s, g) => s + g.totalScore, 0) / grades.length)
})

function renderStudentDetail(root: HTMLElement) {
  root.innerHTML = ''
  const container = d3.select(root)

  const s = student.value
  if (!s) {
    container.append('div').attr('class', 'text-center py-12 text-gray-400').text('学生不存在')
    return
  }

  const wrapper = container.append('div').attr('class', 'space-y-6')

  // ---- 头部 ----
  const headerRow = wrapper.append('div').attr('class', 'flex items-center gap-4')

  const backBtn = headerRow.append('div')
    .attr('class', 'p-2 rounded-lg hover:bg-brand-400/10 transition-colors cursor-pointer')
    .on('click', () => router.push('/admin/students'))
  renderIcon(backBtn, 'arrowLeft', 'w-5 h-5 text-gray-400')

  const titleArea = headerRow.append('div')
  titleArea.append('h1').attr('class', 'text-2xl font-bold text-gray-900').text(s.name)
  titleArea.append('p').attr('class', 'text-gray-400 mt-1').text(`${s.studentId} · ${s.className}`)

  // ---- 主体 ----
  const grid = wrapper.append('div').attr('class', 'grid grid-cols-1 lg:grid-cols-3 gap-6')

  // ---- 左侧: 已选课程 ----
  const leftCol = grid.append('div').attr('class', 'lg:col-span-2 space-y-4')
  leftCol.append('h3').attr('class', 'text-sm font-semibold text-gray-800').text('已选课程')

  const enrollments = enrolledCourses.value

  if (enrollments.length === 0) {
    leftCol.append('div').attr('class', 'text-center py-8 text-gray-400').text('该学生尚未选课')
  }

  enrollments.forEach((enroll) => {
    const card = leftCol.append('div')
      .attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-4')

    const topRow = card.append('div').attr('class', 'flex items-center justify-between mb-2')

    const leftFlex = topRow.append('div').attr('class', 'flex items-center gap-3')
    renderIcon(leftFlex, 'bookOpen', 'w-5 h-5 text-gray-600')
    leftFlex.append('span').attr('class', 'font-medium text-gray-900').text(getCourseName(enroll.courseId))

    const progress = getCourseProgress(enroll.courseId)
    topRow.append('span').attr('class', 'text-xs text-gray-400').text(`${progress}%`)

    const barBg = card.append('div').attr('class', 'h-2 bg-brand-400/10 rounded-full overflow-hidden')
    barBg.append('div')
      .attr('class', 'h-full rounded-full bg-brand-600 transition-all')
      .style('width', `${progress}%`)
  })

  // ---- 右侧: 学习统计 ----
  const rightCol = grid.append('div')
    .attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-4 h-fit')
  rightCol.append('h3').attr('class', 'text-sm font-semibold text-gray-800 mb-3').text('学习统计')

  const statsArea = rightCol.append('div').attr('class', 'space-y-3')

  const statItems = [
    { label: '已选课程', value: `${enrolledCourses.value.length}` },
    { label: '平均进度', value: `${avgProgress.value}%` },
    { label: '平均成绩', value: `${avgScore.value}分` },
  ]

  statItems.forEach((item) => {
    const row = statsArea.append('div').attr('class', 'flex justify-between text-sm')
    row.append('span').attr('class', 'text-gray-600').text(item.label)
    row.append('span').attr('class', 'font-medium').text(item.value)
  })
}

onMounted(() => {
  const root = document.getElementById('admin-student-detail-root')
  if (root) renderStudentDetail(root)
})

watch([() => route.params.id, () => store.students.length, () => store.enrollments.length, () => store.grades.length], () => {
  const root = document.getElementById('admin-student-detail-root')
  if (root) renderStudentDetail(root)
})
</script>
