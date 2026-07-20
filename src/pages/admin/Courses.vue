<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">课程管理</h1>
        <p class="text-gray-500 mt-1">按学院划分管理课程与分类信息</p>
      </div>
      <button @click="openCourseModal(null)" class="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
        <Plus class="w-4 h-4" /> 新建课程
      </button>
    </div>

    <!-- 搜索栏 -->
    <div class="flex gap-3">
      <div class="relative flex-1 max-w-md">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="searchText" type="text" placeholder="搜索课程名称或教师..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
      </div>
      <select v-model="filterCategory" class="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm bg-white">
        <option value="">全部学院</option>
        <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <span class="text-sm text-gray-400 self-center">共 {{ filteredCourses.length }} 门课程</span>
    </div>

    <div class="flex gap-6">
      <!-- 左侧：按学院板块展示课程 -->
      <div class="flex-1 space-y-6">
        <div v-for="section in courseSections" :key="section.categoryId" v-show="section.courses.length > 0" class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <!-- 板块标题 -->
          <div class="flex items-center justify-between px-5 py-4" :style="{ borderLeft: `4px solid ${section.color}` }">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" :style="{ backgroundColor: section.color }">
                <BookOpen class="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">{{ section.name }}</h3>
                <p class="text-xs text-gray-400">{{ section.courses.length }} 门课程</p>
              </div>
            </div>
            <button @click="toggleSection(section.categoryId)" class="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
              <ChevronUp class="w-4 h-4" :class="{ 'rotate-180': collapsedSections.has(section.categoryId) }" />
            </button>
          </div>

          <!-- 课程列表 -->
          <div v-show="!collapsedSections.has(section.categoryId)" class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-gray-50 border-t border-gray-100">
                  <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">课程名称</th>
                  <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">教师</th>
                  <th class="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th class="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="course in section.courses" :key="course.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-1 h-8 rounded-full flex-shrink-0" :style="{ backgroundColor: section.color }" />
                      <div>
                        <p class="text-sm font-medium text-gray-900">{{ course.title }}</p>
                        <p class="text-xs text-gray-400">{{ course.description?.slice(0, 40) }}{{ course.description?.length > 40 ? '...' : '' }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ course.teacher }}</td>
                  <td class="px-4 py-3">
                    <span :class="`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                      course.status === 'active' ? 'bg-green-50 text-green-600' :
                      course.status === 'inactive' ? 'bg-gray-100 text-gray-500' :
                      'bg-amber-50 text-amber-600'
                    }`">
                      <span class="w-1.5 h-1.5 rounded-full" :class="{
                        'bg-green-500': course.status === 'active',
                        'bg-gray-400': course.status === 'inactive',
                        'bg-amber-500': course.status === 'draft',
                      }" />
                      {{ course.status === 'active' ? '进行中' : course.status === 'inactive' ? '已结束' : '草稿' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button @click="openCourseModal(course)" class="text-xs text-blue-500 hover:underline mr-3">编辑</button>
                    <button @click="store.deleteCourse(course.id)" class="text-xs text-red-400 hover:underline">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="filteredCourses.length === 0" class="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Search class="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p>没有找到匹配的课程</p>
        </div>
      </div>

      <!-- 右侧：分类管理面板 -->
      <div class="w-72 flex-shrink-0">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sticky top-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-800">学院管理</h3>
            <button @click="openCategoryModal(null)" class="text-xs text-blue-500 hover:underline flex items-center gap-1">
              <Plus class="w-3 h-3" /> 新建
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="cat in store.categories"
              :key="cat.id"
              class="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              :class="{ 'bg-gray-50 ring-1 ring-blue-200': filterCategory === cat.id }"
              @click="filterCategory = filterCategory === cat.id ? '' : cat.id"
            >
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: cat.color }" />
                <span class="text-sm text-gray-700 truncate">{{ cat.name }}</span>
                <span class="text-xs text-gray-400 flex-shrink-0">({{ getCourseCount(cat.id) }})</span>
              </div>
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button @click.stop="openCategoryModal(cat)" class="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-blue-500">
                  <PenLine class="w-3.5 h-3.5" />
                </button>
                <button @click.stop="handleDeleteCategory(cat)" class="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-red-500">
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
              <label class="block text-sm font-medium text-gray-700 mb-1">所属学院</label>
              <select v-model="courseForm.categoryId" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm">
                <option value="" disabled>请选择学院</option>
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
          <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingCategory ? '编辑学院' : '新建学院' }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">学院名称</label>
              <input v-model="catForm.name" type="text" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">颜色标识</label>
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
import { Plus, Search, BookOpen, PenLine, X, ChevronUp } from 'lucide-vue-next'

const store = useAppStore()
const searchText = ref('')
const filterCategory = ref('')
const collapsedSections = ref<Set<string>>(new Set())

// ====== 课程 ======
const showCourseModal = ref(false)
const editingCourse = ref<any>(null)
const courseForm = ref({ title: '', description: '', categoryId: '', teacher: '' })

const filteredCourses = computed(() => {
  return store.courses.filter((c) => {
    if (searchText.value) {
      const q = searchText.value.toLowerCase()
      if (!c.title.toLowerCase().includes(q) && !c.teacher.toLowerCase().includes(q)) return false
    }
    if (filterCategory.value && c.categoryId !== filterCategory.value) return false
    return true
  })
})

/** 按学院板块分组 */
const courseSections = computed(() => {
  const sections = store.categories.map((cat) => ({
    categoryId: cat.id,
    name: cat.name,
    color: cat.color,
    courses: filteredCourses.value.filter((c) => c.categoryId === cat.id),
  }))
  // 未分类的课程
  const uncategorized = filteredCourses.value.filter((c) => !store.categories.some((cat) => cat.id === c.categoryId))
  if (uncategorized.length > 0) {
    sections.push({
      categoryId: '__uncategorized__',
      name: '未分类',
      color: '#9ca3af',
      courses: uncategorized,
    })
  }
  return sections
})

const toggleSection = (id: string) => {
  if (collapsedSections.value.has(id)) {
    collapsedSections.value.delete(id)
  } else {
    collapsedSections.value.add(id)
  }
  // 触发响应式
  collapsedSections.value = new Set(collapsedSections.value)
}

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
    if (!confirm(`学院"${cat.name}"下有 ${count} 门课程，确定删除？`)) return
  }
  store.deleteCategory(cat.id)
}

// ====== 辅助函数 ======
const getCourseCount = (id: string) => store.courses.filter((c) => c.categoryId === id).length
</script>