<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <button @click="router.back()" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ArrowLeft class="w-5 h-5 text-gray-500" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ course?.title }}</h1>
        <p class="text-gray-500 mt-1">{{ course?.id }} · {{ course?.teacher }}</p>
      </div>
    </div>

    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`">
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-3">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <!-- 任务 -->
          <div v-if="activeTab === 'tasks'" class="space-y-4">
            <h3 class="text-sm font-semibold text-gray-800">课程任务</h3>
            <div class="space-y-2">
              <div v-for="task in courseTasks" :key="task.id" class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div class="flex items-center gap-3">
                  <CheckCircle v-if="task.completed" class="w-5 h-5 text-emerald-500" />
                  <Circle v-else class="w-5 h-5 text-gray-300" />
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ task.title }}</p>
                    <p v-if="task.dueDate" class="text-xs text-gray-400">截止：{{ task.dueDate }}</p>
                  </div>
                </div>
                <span v-if="task.score !== undefined" class="text-sm font-bold text-blue-600">{{ task.score }}分</span>
              </div>
              <div v-if="courseTasks.length === 0" class="text-center py-8 text-gray-400">暂无任务</div>
            </div>
          </div>

          <!-- 资源 -->
          <div v-if="activeTab === 'resources'" class="space-y-4">
            <h3 class="text-sm font-semibold text-gray-800">课程资源</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div v-for="res in courseResources" :key="res.id" class="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div class="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                  <FileText class="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ res.title }}</p>
                  <p class="text-xs text-gray-400">{{ res.type }} · {{ res.size }}</p>
                </div>
              </div>
              <div v-if="courseResources.length === 0" class="col-span-full text-center py-8 text-gray-400">暂无资源</div>
            </div>
          </div>

          <!-- 评价 -->
          <div v-if="activeTab === 'evaluations'" class="space-y-4">
            <h3 class="text-sm font-semibold text-gray-800">课程评价</h3>
            <StudentEvaluation :course-id="courseId" :student-id="myStudent?.id || ''" :student-name="myStudent?.name || store.currentUser || ''" />
          </div>

          <!-- 作业 -->
          <div v-if="activeTab === 'homework'" class="space-y-4">
            <h3 class="text-sm font-semibold text-gray-800">课程作业</h3>
            <div class="space-y-2">
              <div v-for="hw in courseHomework" :key="hw.id" class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div class="flex items-center gap-3">
                  <FileText class="w-5 h-5 text-blue-500" />
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ hw.title }}</p>
                    <p class="text-xs text-gray-400">截止：{{ hw.dueDate }}</p>
                  </div>
                </div>
                <span v-if="hw.submitted" class="text-xs text-emerald-500">已提交</span>
                <span v-else class="text-xs text-amber-500">未提交</span>
              </div>
              <div v-if="courseHomework.length === 0" class="text-center py-8 text-gray-400">暂无作业</div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 class="text-sm font-semibold text-gray-800 mb-3">AI 学习助手</h3>
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 text-xs text-blue-600">
            <p class="font-medium mb-1">智能推荐</p>
            <p>根据你的学习进度，建议重点复习第3-5章内容</p>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 class="text-sm font-semibold text-gray-800 mb-3">预习画像</h3>
          <div class="space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">预习完成度</span>
              <span class="font-medium">60%</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-blue-500" style="width: 60%" />
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">知识点掌握</span>
              <span class="font-medium">45%</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-emerald-500" style="width: 45%" />
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">学习时长</span>
              <span class="font-medium">12h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ArrowLeft, BookOpen, FileText, ClipboardCheck, Edit3, CheckCircle, Circle, BarChart3 } from 'lucide-vue-next'
import StudentEvaluation from '@/components/StudentEvaluation.vue'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const courseId = route.params.id as string
const myStudent = computed(() => store.students.find((s) => s.name === store.currentUser))
const activeTab = ref('tasks')

const tabs = [
  { id: 'tasks', label: '任务', icon: Edit3 },
  { id: 'resources', label: '资源', icon: FileText },
  { id: 'evaluations', label: '评价', icon: ClipboardCheck },
  { id: 'homework', label: '作业', icon: BookOpen },
]

const course = computed(() => store.courses.find((c) => c.id === courseId))
const courseTasks = computed(() => {
  const tasks = [
    { id: '1', title: '完成第1章学习', dueDate: '2025-03-15', completed: true, score: 85 },
    { id: '2', title: '完成第2章学习', dueDate: '2025-03-22', completed: true, score: 78 },
    { id: '3', title: '完成第3章学习', dueDate: '2025-03-29', completed: false },
    { id: '4', title: '完成第4章学习', dueDate: '2025-04-05', completed: false },
  ]
  return tasks
})

const courseResources = computed(() => {
  const resources = [
    { id: '1', title: '课程大纲.pdf', type: 'PDF', size: '2.3 MB' },
    { id: '2', title: '第1章课件.pptx', type: 'PPT', size: '5.1 MB' },
    { id: '3', title: '参考书目.pdf', type: 'PDF', size: '1.8 MB' },
    { id: '4', title: '练习题集.docx', type: 'DOC', size: '0.5 MB' },
  ]
  return resources
})

const courseHomework = computed(() => {
  const homework = [
    { id: '1', title: '第1章课后作业', dueDate: '2025-03-20', submitted: true },
    { id: '2', title: '第2章课后作业', dueDate: '2025-03-27', submitted: true },
    { id: '3', title: '第3章课后作业', dueDate: '2025-04-03', submitted: false },
  ]
  return homework
})
</script>