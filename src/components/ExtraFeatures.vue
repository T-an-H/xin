<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">额外功能</h1>
      <p class="text-gray-500 mt-1">云盘 · 待办 · 在线文档 · 笔记</p>
    </div>

    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        <span class="relative">
          {{ tab.label }}
          <span v-if="tab.id === 'todos' && hasPendingReminders"
            class="absolute -top-2 -right-3 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </span>
      </button>
    </div>

    <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <CloudDrive v-if="activeTab === 'cloud'" />
      <TodoList v-else-if="activeTab === 'todos'" />
      <OnlineDocs v-else-if="activeTab === 'docs'" />
      <Notes v-else-if="activeTab === 'notes'" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Cloud, CheckCircle, FileText, Edit3 } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import CloudDrive from './ExtraFeatures/CloudDrive.vue'
import TodoList from './ExtraFeatures/TodoList.vue'
import OnlineDocs from './ExtraFeatures/OnlineDocs.vue'
import Notes from './ExtraFeatures/Notes.vue'

const store = useAppStore()

/** 是否有未完成的评价待办（显示红点） */
const hasPendingReminders = computed(() => {
  const user = store.currentUser
  if (!user) return false
  if (store.currentRole === 'student') {
    const student = store.students.find((s) => s.name === user)
    if (!student) return false
    // 评价提醒
    if (store.evalReminders.some((r) => r.studentId === student.id && r.status !== 'completed')) return true
    // AI 分层测试待办
    if (store.getPendingAITierTests(student.id).length > 0) return true
    return false
  }
  if (store.currentRole === 'teacher') {
    return store.evalReminders.some((r) => r.studentId === user && r.status !== 'completed')
  }
  return false
})

const tabs = [
  { id: 'cloud', label: '云盘', icon: Cloud },
  { id: 'todos', label: '待办', icon: CheckCircle },
  { id: 'docs', label: '在线文档', icon: FileText },
  { id: 'notes', label: '笔记', icon: Edit3 },
]

const activeTab = ref('cloud')

onMounted(() => {
  store.pushNearDeadlineEvalReminders()
  // 扫描所有课程，为已到时间的评价轮次生成待办提醒
  store.checkAndGenerateSessionReminders()
  // 如果有未完成的评价代办或 AI 分层测试待办，默认切换到待办 tab
  const user = store.currentUser
  if (!user) return
  let hasPending = false
  if (store.currentRole === 'student') {
    const student = store.students.find((s) => s.name === user)
    if (student) {
      hasPending = store.evalReminders.some(
        (r) => r.studentId === student.id && r.status !== 'completed'
      )
      hasPending = hasPending || store.getPendingAITierTests(student.id).length > 0
    }
  } else if (store.currentRole === 'teacher') {
    hasPending = store.evalReminders.some(
      (r) => r.studentId === user && r.status !== 'completed'
    )
  }
  if (hasPending) {
    activeTab.value = 'todos'
  }
})
</script>