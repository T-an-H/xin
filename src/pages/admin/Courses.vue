<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">课程管理</h1>
        <p class="text-gray-500 mt-1">管理课程与分类信息</p>
      </div>
      <button @click="openCourseModal(null)" class="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
        <Plus class="w-4 h-4" /> 新建课程
      </button>
    </div>

    <div class="flex gap-6">
      <!-- 左侧：课程列表 -->
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
                  <button @click="openCourseModal(course)" class="text-xs text-blue-500 hover:underline mr-3">编辑</button>
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

      <!-- 右侧：分类管理 -->
      <div class="w-72 flex-shrink-0">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-800">分类管理</h3>
            <button @click="openCategoryModal(null)" class="text-xs text-blue-500 hover:underline flex items-center gap-1">
              <Plus class="w-3 h-3" /> 新建
            </button>
          </div>
          <div class="space-y-2">
            <div v-for="cat in store.categories" :key="cat.id" class="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: cat.color }" />
                <span class="text-sm text-gray-700 truncate">{{ cat.name }}</span>
                <span class="text-xs text-gray-400 flex-shrink-0">({{ getCourseCount(cat.id) }})</span>
              </div>
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button @click="openCategoryModal(cat)" class="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-blue-500">
                  <PenLine class="w-3.5 h-3.5" />
                </button>
                <button @click="handleDeleteCategory(cat)" class="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-red-500">
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div v-if="store.categories.length === 0" class="text-center py-6 text-gray-400 text-sm">暂无分类</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 课程编辑弹窗 -->
    <Teleport to="body">
      <div v-if="showCourseModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showCourseModal = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingCourse ? '编辑课程' : '新建课程' }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">课程名称</label>
              <input v-model="courseForm.title" type="text" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">课程描述</label>
              <textarea v-model="courseForm.description" rows="2" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <select v-model="courseForm.categoryId" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm">
                <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">教师</label>
              <select v-model="courseForm.teacher" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm">
                <option v-for="t in store.teachers" :key="t.id" :value="t.name">{{ t.name }}</option>
              </select>
            </div>
            <div class="flex gap-3 pt-2">
              <button @click="handleSaveCourse" class="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">保存</button>
              <button @click="showCourseModal = false" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">取消</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 分类编辑弹窗 -->
    <Teleport to="body">
      <div v-if="showCategoryModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showCategoryModal = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingCategory ? '编辑分类' : '新建分类' }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">分类名称</label>
              <input v-model="catForm.name" type="text" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <div class="flex gap-2 items-center">
                <input v-model="catForm.color" type="color" class="w-10 h-10 rounded cursor-pointer border border-gray-200" />
                <span class="text-sm text-gray-500">{{ catForm.color }}</span>
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button @click="handleSaveCategory" class="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">保存</button>
              <button @click="showCategoryModal = false" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">取消</button>
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
import { Plus, Search, BookOpen, PenLine, X } from 'lucide-vue-next'

const store = useAppStore()
const searchText = ref('')
const filterCategory = ref('')

// ====== 课程 ======
const showCourseModal = ref(false)
const editingCourse = ref<any>(null)
const courseForm = ref({ title: '', description: '', categoryId: '', teacher: '' })

const filteredCourses = computed(() => {
  return store.courses.filter((c) => {
    if (searchText.value && !c.title.includes(searchText.value)) return false
    if (filterCategory.value && c.categoryId !== filterCategory.value) return false
    return true
  })
})

const openCourseModal = (course: any) => {
  editingCourse.value = course
  courseForm.value = course
    ? { title: course.title, description: course.description, categoryId: course.categoryId, teacher: course.teacher }
    : { title: '', description: '', categoryId: '', teacher: '' }
  showCourseModal.value = true
}

const handleSaveCourse = () => {
  if (editingCourse.value) {
    store.updateCourse(editingCourse.value.id, { title: courseForm.value.title, description: courseForm.value.description, categoryId: courseForm.value.categoryId, teacher: courseForm.value.teacher })
  } else {
    store.addCourse({ id: Date.now().toString(), title: courseForm.value.title, description: courseForm.value.description, categoryId: courseForm.value.categoryId, teacher: courseForm.value.teacher, cover: '', credits: 0, duration: 0, status: 'active', createdAt: new Date().toISOString() })
  }
  showCourseModal.value = false
  editingCourse.value = null
  courseForm.value = { title: '', description: '', categoryId: '', teacher: '' }
}

// ====== 分类 ======
const showCategoryModal = ref(false)
const editingCategory = ref<any>(null)
const catForm = ref({ name: '', color: '#3b82f6' })

const openCategoryModal = (cat: any) => {
  editingCategory.value = cat
  catForm.value = cat ? { name: cat.name, color: cat.color } : { name: '', color: '#3b82f6' }
  showCategoryModal.value = true
}

const handleSaveCategory = () => {
  if (editingCategory.value) {
    store.updateCategory(editingCategory.value.id, { name: catForm.value.name, color: catForm.value.color })
  } else {
    store.addCategory({ id: Date.now().toString(), name: catForm.value.name, color: catForm.value.color, courseCount: 0 })
  }
  showCategoryModal.value = false
}

const handleDeleteCategory = (cat: any) => {
  const count = store.courses.filter((c) => c.categoryId === cat.id).length
  if (count > 0) {
    if (!confirm(`分类"${cat.name}"下有 ${count} 门课程，确定删除？`)) return
  }
  store.deleteCategory(cat.id)
}

// ====== 辅助函数 ======
const getCategoryName = (id: string) => store.categories.find((c) => c.id === id)?.name || '未分类'
const getCategoryColor = (id: string) => store.categories.find((c) => c.id === id)?.color || 'bg-gray-500'
const getCourseCount = (id: string) => store.courses.filter((c) => c.categoryId === id).length
</script>