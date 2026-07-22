<template>
  <div id="mentor-course-detail-root"></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'

const route = useRoute()
const store = useAppStore()

const courseId = computed(() => route.params.id as string)
const course = computed(() => store.courses.find((c) => c.id === courseId.value))

const scoreInputs = ref<Record<string, number>>({})

const enrolledStudents = computed(() => {
  if (!courseId.value) return []
  return store.enrollments
    .filter((e) => e.courseId === courseId.value && e.status !== 'dropped')
    .map((e) => ({
      enrollmentId: e.id,
      student: store.students.find((s) => s.id === e.studentId),
    }))
    .filter((e) => e.student)
})

function isSubmitted(studentId: string): boolean {
  return store.isTeacherEvalSubmitted(courseId.value || '', studentId, 1, 'mentor')
}

function getSubmittedScore(studentId: string): number | string {
  const score = store.getSubmittedTeacherScore(courseId.value || '', studentId, 1, 'mentor')
  return score !== null ? score : '-'
}

function handleSubmitEval(studentId: string) {
  if (!courseId.value) return
  const score = scoreInputs.value[studentId]
  if (score === undefined || score === null || score < 0 || score > 100) return

  const existing = store.evaluations.find(
    (e) => e.courseId === courseId.value && e.studentId === studentId && e.type === 'mentor' && e.sessionNumber === 1
  )

  const ev = {
    id: existing ? existing.id : `ev-mentor-${Date.now()}-${studentId}`,
    courseId: courseId.value,
    studentId,
    sessionNumber: 1,
    type: 'mentor' as const,
    score,
    evaluatorId: store.currentUser || '',
    evaluatorName: store.currentUser || '企业导师',
    createdAt: new Date().toISOString().split('T')[0],
  }

  if (existing) {
    store.updateEvaluation(ev.id, { score, createdAt: ev.createdAt })
  } else {
    store.addEvaluation(ev)
  }

  store.submitTeacherEval(courseId.value, studentId, 1, 'mentor')
  delete scoreInputs.value[studentId]

  const el = document.getElementById('mentor-course-detail-root')
  if (el) renderCourseDetail(el)
}

function renderCourseDetail(root: HTMLElement) {
  const container = d3.select(root)
  container.selectAll('*').remove()

  const c = course.value
  const students = enrolledStudents.value

  // 返回按钮 + 课程信息
  const headerDiv = container.append('div').attr('class', 'flex items-center gap-3')

  const backBtn = headerDiv.append('button')
    .attr('class', 'p-2 rounded-lg hover:bg-brand-400/10 transition-colors')
    .on('click', () => history.back())
  renderIcon(backBtn, 'arrowLeft').attr('class', 'w-5 h-5 text-brand-400')

  const infoDiv = headerDiv.append('div').attr('class', 'flex-1')
  infoDiv.append('h1').attr('class', 'text-2xl font-bold text-brand-900').text(c?.title || '课程详情')
  infoDiv.append('p').attr('class', 'text-brand-400 mt-1').text(`${c?.duration || ''}课时 · 授课导师：${c?.teacher || '未知'}`)

  const statusSpan = headerDiv.append('span')
    .attr('class', `text-xs px-2 py-0.5 rounded-full ${c?.status === 'active' ? 'bg-brand-600/10 text-brand-600' : 'bg-brand-400/10 text-brand-400'}`)
    .text(c?.status === 'active' ? '进行中' : '已结束')

  // 课程描述
  const descDiv = container.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-5')
  descDiv.append('h2').attr('class', 'font-semibold text-brand-900 mb-2').text('课程简介')
  descDiv.append('p').attr('class', 'text-sm text-brand-600 leading-relaxed').text(c?.description || '暂无描述')

  // 企业导师评价
  const evalDiv = container.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-5')
  const evalHeader = evalDiv.append('div').attr('class', 'flex items-center gap-2 mb-4')
  renderIcon(evalHeader, 'clipboardCheck').attr('class', 'w-5 h-5 text-brand-400')
  evalHeader.append('h2').attr('class', 'font-semibold text-brand-900').text('企业导师评价')
  evalHeader.append('span').attr('class', 'text-xs text-brand-400').text(`${students.length}名学生`)

  if (students.length === 0) {
    evalDiv.append('div').attr('class', 'text-center py-8 text-brand-400').text('该课程暂无学生')
  } else {
    const tableWrapper = evalDiv.append('div').attr('class', 'overflow-x-auto')
    const table = tableWrapper.append('table').attr('class', 'w-full text-sm')

    // thead
    const thead = table.append('thead')
    const headerRow = thead.append('tr').attr('class', 'border-b border-brand-400/20')
    headerRow.append('th').attr('class', 'text-left py-2.5 px-3 text-brand-400 font-medium').text('学生')
    headerRow.append('th').attr('class', 'text-left py-2.5 px-3 text-brand-400 font-medium').text('学号')
    headerRow.append('th').attr('class', 'text-center py-2.5 px-3 w-28 text-brand-400 font-medium').text('评分 (0-100)')
    headerRow.append('th').attr('class', 'text-center py-2.5 px-3 w-28 text-brand-400 font-medium').text('状态')
    headerRow.append('th').attr('class', 'text-center py-2.5 px-3 w-24 text-brand-400 font-medium').text('操作')

    // tbody
    const tbody = table.append('tbody')
    students.forEach((item) => {
      if (!item.student) return
      const sId = item.student.id
      const submitted = isSubmitted(sId)

      const row = tbody.append('tr')
        .attr('class', `border-b border-gray-50 hover:bg-brand-400/10 transition-colors ${submitted ? 'bg-brand-400/5' : ''}`)

      // 学生姓名
      const td1 = row.append('td').attr('class', 'py-2.5 px-3')
      const nameDiv = td1.append('div').attr('class', 'flex items-center gap-3')
      const avatar = nameDiv.append('div').attr('class', 'w-8 h-8 rounded-full bg-brand-600/15 flex items-center justify-center flex-shrink-0')
      avatar.append('span').attr('class', 'text-xs font-medium text-brand-600').text(item.student.name.charAt(0))
      nameDiv.append('span').attr('class', 'font-medium text-brand-900').text(item.student.name)

      // 学号
      row.append('td').attr('class', 'py-2.5 px-3 text-brand-400').text(item.student.id)

      // 评分
      const td3 = row.append('td').attr('class', 'py-2.5 px-3')
      const scoreDiv = td3.append('div').attr('class', 'flex items-center justify-center gap-2')

      if (!submitted) {
        const input = scoreDiv.append('input')
          .attr('type', 'number')
          .attr('min', '0')
          .attr('max', '100')
          .attr('placeholder', '0-100')
          .attr('class', 'w-20 px-2 py-1.5 border border-brand-400/30 rounded-lg text-xs text-center focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none')
          .property('value', scoreInputs.value[sId] !== undefined ? scoreInputs.value[sId] : '')
          .on('input', (event) => {
            const val = (event.target as HTMLInputElement).value
            scoreInputs.value[sId] = val ? Number(val) : undefined as any
          })
        // dispatchEvent for reactivity
      } else {
        scoreDiv.append('span').attr('class', 'text-sm font-semibold text-brand-600').text(`${getSubmittedScore(sId)}分`)
      }

      // 状态
      const td4 = row.append('td').attr('class', 'py-2.5 px-3 text-center')
      if (submitted) {
        const badge = td4.append('span')
          .attr('class', 'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-400/10 text-brand-600 border border-brand-400')
        renderIcon(badge, 'checkCircle').attr('class', 'w-3 h-3')
        badge.append('span').text('已评分')
      } else {
        const badge = td4.append('span')
          .attr('class', 'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-400/10 text-brand-400 border border-brand-400/30')
        renderIcon(badge, 'clock').attr('class', 'w-3 h-3')
        badge.append('span').text('待评价')
      }

      // 操作
      const td5 = row.append('td').attr('class', 'py-2.5 px-3 text-center')
      if (!submitted) {
        const submitBtn = td5.append('button')
          .attr('class', 'flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors mx-auto bg-brand-400/10 text-brand-400 cursor-not-allowed')
          .on('click', () => handleSubmitEval(sId))

        const hasScore = scoreInputs.value[sId] !== undefined && scoreInputs.value[sId] !== null
        if (hasScore) {
          submitBtn
            .attr('class', 'flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors mx-auto bg-brand-600 text-white hover:bg-brand-800')
        }
        renderIcon(submitBtn, 'checkCircle').attr('class', 'w-3.5 h-3.5')
        submitBtn.append('span').text('提交评分')
      } else {
        td5.append('span').attr('class', 'text-xs text-brand-400').text('已提交')
      }
    })
  }
}

onMounted(() => {
  const el = document.getElementById('mentor-course-detail-root')
  if (el) renderCourseDetail(el)
})

watch([courseId, enrolledStudents], () => {
  const el = document.getElementById('mentor-course-detail-root')
  if (el) renderCourseDetail(el)
}, { deep: true })
</script>
