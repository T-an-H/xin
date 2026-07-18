<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">课程管理</h1>
        <p class="text-gray-500 mt-1">管理所有课程信息</p>
      </div>
      <button @click="showCreateModal = true" class="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
        <Plus class="w-4 h-4" /> 新建课程
      </button>
    </div>

    <div class="flex gap-6">
      <div class="flex-1 space-y-4">
        <div class="flex gap-3">
          <div class="relative flex-1">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input v-model="searchText" type="text" placeholder="搜索课程名称..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
          </div>
          <select v-model="filterCategory" class="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm">
            <option value="">全部分类</option>
            <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">课程名称</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">分类</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">教师</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
                <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="course in filteredCourses" :key="course.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div :class="'w-8 h-8 rounded-lg flex items-center justify-center ' + getCategoryColor(course.categoryId)">
                      <BookOpen class="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ course.title }}</p>
                      <p class="text-xs text-gray-400">{{ course.id }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ getCategoryName(course.categoryId) }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ course.teacher }}</td>
                <td class="px-4 py-3">
                  <span :class="`text-xs px-2 py-1 rounded-full ${course.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`">
                    {{ course.status === 'active' ? '进行中' : '已结束' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button @click="handleEdit(course)" class="text-xs text-blue-500 hover:underline mr-3">编辑</button>
                  <button @click="store.deleteCourse(course.id)" class="text-xs text-red-400 hover:underline">删除</button>
                </td>
              </tr>
              <tr v-if="filteredCourses.length === 0">
                <td colspan="5" class="px-4 py-12 text-center text-gray-400">暂无课程数据</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="w-64 flex-shrink-0">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 class="text-sm font-semibold text-gray-800 mb-3">分类统计</h3>
          <div class="space-y-2">
            <div v-for="cat in store.categories" :key="cat.id" class="flex items-center justify-between text-sm">
              <span class="text-gray-600">{{ cat.name }}</span>
              <span class="text-gray-900 font-medium">{{ getCourseCount(cat.id) }}</span>
            </div>
            <div class="border-t border-gray-100 pt-2 flex items-center justify-between text-sm">
              <span class="text-gray-800 font-medium">总计</span>
              <span class="text-gray-900 font-bold">{{ store.courses.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showCreateModal = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingCourse ? '编辑课程' : '新建课程' }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">课程名称</label>
              <input v-model="form.title" type="text" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">课程描述</label>
              <textarea v-model="form.description" rows="2" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <select v-model="form.categoryId" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm">
                <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">教师</label>
              <select v-model="form.teacher" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm">
                <option v-for="t in store.teachers" :key="t.id" :value="t.name">{{ t.name }}</option>
              </select>
            </div>
            <div class="flex gap-3 pt-2">
              <button @click="handleSave" class="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">保存</button>
              <button @click="showCreateModal = false" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">取消</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { Plus, Search, BookOpen } from 'lucide-vue-next'

const store = useAppStore()
const searchText = ref('')
const filterCategory = ref('')
const showCreateModal = ref(false)
const editingCourse = ref<any>(null)
const form = ref({ title: '', description: '', categoryId: '', teacher: '' })

const filteredCourses = computed(() => {
  return store.courses.filter((c) => {
    if (searchText.value && !c.title.includes(searchText.value)) return false
    if (filterCategory.value && c.categoryId !== filterCategory.value) return false
    return true
  })
})

const getCategoryName = (id: string) => store.categories.find((c) => c.id === id)?.name || '未分类'
const getCategoryColor = (id: string) => store.categories.find((c) => c.id === id)?.color || 'bg-gray-500'
const getCourseCount = (id: string) => store.courses.filter((c) => c.categoryId === id).length

const handleEdit = (course: any) => {
  editingCourse.value = course
  form.value = { title: course.title, description: course.description, categoryId: course.categoryId, teacher: course.teacher }
  showCreateModal.value = true
}

const handleSave = () => {
  if (editingCourse.value) {
    store.updateCourse(editingCourse.value.id, { title: form.value.title, description: form.value.description, categoryId: form.value.categoryId, teacher: form.value.teacher })
  } else {
    store.addCourse({ id: Date.now().toString(), title: form.value.title, description: form.value.description, categoryId: form.value.categoryId, teacher: form.value.teacher, cover: '', credits: 0, duration: 0, status: 'active', createdAt: new Date().toISOString() })
  }
  showCreateModal.value = false
  editingCourse.value = null
  form.value = { title: '', description: '', categoryId: '', teacher: '' }
}
</script>