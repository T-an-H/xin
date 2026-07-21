<template>
  <div class="space-y-6">
    <!-- 返回按钮 + 课程信息 -->
    <div class="flex items-center gap-3">
      <button @click="$router.back()" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ArrowLeft class="w-5 h-5 text-gray-500" />
      </button>
      <div class="flex-1">
        <h1 class="text-2xl font-bold text-gray-900">{{ course?.title || '课程详情' }}</h1>
        <p class="text-gray-500 mt-1">{{ course?.duration }}课时 · 授课导师：{{ course?.teacher || '未知' }}</p>
      </div>
      <span :class="`text-xs px-2 py-0.5 rounded-full ${course?.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`">
        {{ course?.status === 'active' ? '进行中' : '已结束' }}
      </span>
    </div>

    <!-- 课程描述 -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 class="font-semibold text-gray-900 mb-2">课程简介</h2>
      <p class="text-sm text-gray-600 leading-relaxed">{{ course?.description || '暂无描述' }}</p>
    </div>

    <!-- 企业导师评价 -->
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div class="flex items-center gap-2 mb-4">
        <ClipboardCheck class="w-5 h-5 text-gray-400" />
        <h2 class="font-semibold text-gray-900">企业导师评价</h2>
        <span class="text-xs text-gray-400">{{ enrolledStudents.length }}名学生</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left py-2.5 px-3 text-gray-500 font-medium">学生</th>
              <th class="text-left py-2.5 px-3 text-gray-500 font-medium">学号</th>
              <th class="text-center py-2.5 px-3 w-28 text-gray-500 font-medium">评分 (0-100)</th>
              <th class="text-center py-2.5 px-3 w-28 text-gray-500 font-medium">状态</th>
              <th class="text-center py-2.5 px-3 w-24 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in enrolledStudents" :key="item.student!.id"
              class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              :class="{ 'bg-emerald-50/20': isSubmitted(item.student!.id) }">
              <td class="py-2.5 px-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span class="text-xs font-medium text-blue-600">{{ item.student!.name.charAt(0) }}</span>
                  </div>
                  <span class="font-medium text-gray-900">{{ item.student!.name }}</span>
                </div>
              </td>
              <td class="py-2.5 px-3 text-gray-500">{{ item.student!.id }}</td>
              <td class="py-2.5 px-3">
                <div class="flex items-center justify-center gap-2">
                  <input v-if="!isSubmitted(item.student!.id)"
                    type="number" min="0" max="100"
                    v-model.number="scoreInputs[item.student!.id]"
                    placeholder="0-100"
                    class="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                  <span v-else class="text-sm font-semibold text-emerald-600">{{ getSubmittedScore(item.student!.id) }}分</span>
                </div>
              </td>
              <td class="py-2.5 px-3 text-center">
                <span v-if="isSubmitted(item.student!.id)" class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle class="w-3 h-3" />已评分
                </span>
                <span v-else class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-200">
                  <Clock class="w-3 h-3" />待评价
                </span>
              </td>
              <td class="py-2.5 px-3 text-center">
                <button v-if="!isSubmitted(item.student!.id)"
                  @click="handleSubmitEval(item.student!.id)"
                  :disabled="!scoreInputs[item.student!.id] && scoreInputs[item.student!.id] !== 0"
                  :class="`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors mx-auto ${scoreInputs[item.student!.id] !== undefined && scoreInputs[item.student!.id] !== null ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`">
                  <CheckCircle class="w-3.5 h-3.5" />
                  提交评分
                </button>
                <span v-else class="text-xs text-gray-400">已提交</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="enrolledStudents.length === 0" class="text-center py-8 text-gray-400">
          该课程暂无学生
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ArrowLeft, ClipboardCheck, CheckCircle, Clock } from 'lucide-vue-next'

const route = useRoute()
const store = useAppStore()

const courseId = computed(() => route.params.id as string)
const course = computed(() => store.courses.find((c) => c.id === courseId.value))

const scoreInputs = ref<Record<string, number>>({})

/** 课程所有未退课学生 */
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

/** 检查某学生的导师评价是否已提交（session 1，type mentor） */
function isSubmitted(studentId: string): boolean {
  return store.isTeacherEvalSubmitted(courseId.value || '', studentId, 1, 'mentor')
}

/** 获取已提交的评分 */
function getSubmittedScore(studentId: string): number | string {
  const score = store.getSubmittedTeacherScore(courseId.value || '', studentId, 1, 'mentor')
  return score !== null ? score : '-'
}

/** 提交企业导师评价 */
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
}
</script>
