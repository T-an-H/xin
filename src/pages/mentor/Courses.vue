<template>
  <div id="mentor-courses-root"></div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'

const router = useRouter()
const store = useAppStore()

const mentorCourseIds = computed(() => store.getMentorCourseIds(store.currentUser || ''))
const myCourses = computed(() => store.courses.filter((c) => mentorCourseIds.value.includes(c.id)))

const gradients = [
  'linear-gradient(135deg, #4F46E5, #415a77)',
  'linear-gradient(135deg, #415a77, #415a77)',
  'linear-gradient(135deg, #415a77, #415a77)',
  'linear-gradient(135deg, #DC2626, #415a77)',
  'linear-gradient(135deg, #415a77, #415a77)',
  'linear-gradient(135deg, #415a77, #415a77)',
  'linear-gradient(135deg, #0891B2, #22D3EE)',
  'linear-gradient(135deg, #BE123C, #FB7185)',
]

function getCourseGradient(courseId: string): string {
  let hash = 0
  for (let i = 0; i < courseId.length; i++) {
    hash = ((hash << 5) - hash) + courseId.charCodeAt(i)
    hash |= 0
  }
  return gradients[Math.abs(hash) % gradients.length]
}

function studentCount(courseId: string) {
  return store.enrollments.filter((e) => e.courseId === courseId && e.status !== 'dropped').length
}

function goDetail(courseId: string) {
  router.push(`/mentor/courses/${courseId}`)
}

function renderCourses(root: HTMLElement) {
  const container = d3.select(root)
  container.selectAll('*').remove()

  const courses = myCourses.value

  // 页面标题
  const headerDiv = container.append('div')
  headerDiv.append('h1').attr('class', 'text-2xl font-bold text-brand-900').text('我的课程')
  headerDiv.append('p').attr('class', 'text-brand-400 mt-1').text('查看负责课程的学生评价')

  // 课程卡片网格
  const grid = container.append('div')
    .attr('class', 'grid grid-cols-1 md:grid-cols-2 gap-5')

  if (courses.length === 0) {
    // 空状态
    const emptyDiv = grid.append('div').attr('class', 'col-span-2 text-center py-16 text-brand-400')
    renderIcon(emptyDiv, 'bookOpen').attr('class', 'w-12 h-12 mx-auto mb-4 text-brand-400/40')
    emptyDiv.append('p').text('暂无课程')
    return
  }

  courses.forEach((course) => {
    const gradient = getCourseGradient(course.id)
    const isActive = course.status === 'active'
    const sCount = studentCount(course.id)

    const card = grid.append('div')
      .attr('class', `group bg-white rounded-xl border-brand-400/20 shadow-sm transition-all duration-200 overflow-hidden cursor-pointer ${isActive ? 'border-brand-400/20 hover:shadow-lg' : 'border-brand-400/30 opacity-60 hover:opacity-70'}`)
      .on('click', () => goDetail(course.id))

    // 封面渐变区域
    const coverDiv = card.append('div')
      .attr('class', 'relative h-[136px]')
      .style('background', gradient)

    if (course.cover) {
      coverDiv.append('img')
        .attr('src', course.cover)
        .attr('alt', course.title)
        .attr('class', `w-full h-full object-cover transition-transform duration-300 ${isActive ? 'group-hover:scale-105' : 'grayscale'}`)
    }

    coverDiv.append('div').attr('class', 'absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent')

    if (!isActive) {
      const endedDiv = coverDiv.append('div').attr('class', 'absolute inset-0 flex items-center justify-center')
      endedDiv.append('span').attr('class', 'text-white/50 text-lg font-bold tracking-widest -rotate-12 select-none').text('已结束')
    }

    // 状态标签
    const statusBadge = coverDiv.append('span')
      .attr('class', `absolute top-3 right-3 z-10 text-xs px-2.5 py-1 rounded-full font-medium ${isActive ? 'bg-brand-400/10 text-brand-800 backdrop-blur-sm' : 'bg-brand-400/10 text-brand-400 backdrop-blur-sm'}`)
    statusBadge.append('span')
      .attr('class', `inline-block w-1.5 h-1.5 rounded-full mr-1 ${isActive ? 'bg-brand-600' : 'bg-gray-400'}`)
    statusBadge.append('span').text(isActive ? '进行中' : '已结束')

    // 底部信息
    const bottomDiv = coverDiv.append('div').attr('class', 'absolute bottom-3 left-4 right-4')
    bottomDiv.append('h3').attr('class', 'text-white font-bold text-lg leading-tight truncate').text(course.title)

    const infoRow = bottomDiv.append('div').attr('class', 'flex items-center gap-2 mt-1.5')
    const studentsSpan = infoRow.append('span').attr('class', 'text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm')
    renderIcon(studentsSpan, 'users').attr('class', 'w-3 h-3 inline mr-0.5 -mt-0.5')
    studentsSpan.append('span').text(` ${sCount} 名学生`)

    infoRow.append('span')
      .attr('class', 'text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm')
      .text(`${course.duration || '-'} 课时`)

    // 卡片底部
    const cardBody = card.append('div').attr('class', 'p-4 space-y-3')
    const teacherDiv = cardBody.append('div')
    teacherDiv.append('p').attr('class', 'text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1').text('授课导师')
    teacherDiv.append('p').attr('class', 'text-sm text-brand-800').text(course.teacher || '未知')

    const actionDiv = cardBody.append('div').attr('class', 'flex items-center justify-between pt-1')

    const statusTag = actionDiv.append('span')
      .attr('class', `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${isActive ? 'bg-brand-600/10 text-brand-600 border-brand-400' : 'bg-brand-400/10 text-brand-400 border-brand-400/30'}`)
    renderIcon(statusTag, 'bookOpen').attr('class', 'w-3.5 h-3.5')
    statusTag.append('span').text(isActive ? '进行中' : '已结束')

    const detailLink = actionDiv.append('span')
      .attr('class', `inline-flex items-center gap-1 text-xs font-medium transition-colors ${isActive ? 'text-brand-600 group-hover:text-brand-800' : 'text-brand-400'}`)
    detailLink.append('span').text('查看详情')
    const arrowIcon = detailLink.append('span').attr('class', 'inline-flex items-center')
    renderIcon(arrowIcon, 'arrowRight').attr('class', 'w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5')
  })
}

onMounted(() => {
  const el = document.getElementById('mentor-courses-root')
  if (el) renderCourses(el)
})

watch(myCourses, () => {
  const el = document.getElementById('mentor-courses-root')
  if (el) renderCourses(el)
}, { deep: true })
</script>
