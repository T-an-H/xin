<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">分类管理</h1>
        <p class="text-gray-500 mt-1">管理课程分类信息</p>
      </div>
      <button @click="showModal = true; editingCat = null; form = { name: '', color: '#3b82f6' }" class="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
        <Plus class="w-4 h-4" /> 新建分类
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="cat in store.categories" :key="cat.id" class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-3">
          <div :class="`w-10 h-10 rounded-lg flex items-center justify-center`" :style="{ backgroundColor: cat.color }">
            <BookOpen class="w-5 h-5 text-white" />
          </div>
          <button @click="handleEdit(cat)" class="text-xs text-blue-500 hover:underline">编辑</button>
        </div>
        <h3 class="font-semibold text-gray-900">{{ cat.name }}</h3>
        <p class="text-xs text-gray-400 mt-1">{{ store.courses.filter(c => c.categoryId === cat.id).length }} 门课程</p>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showModal = false" />
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ editingCat ? '编辑分类' : '新建分类' }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">分类名称</label>
              <input v-model="form.name" type="text" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <div class="flex gap-2">
                <input v-model="form.color" type="color" class="w-10 h-10 rounded cursor-pointer" />
                <span class="text-sm text-gray-500 self-center">{{ form.color }}</span>
              </div>
            </div>
            <div class="flex gap-3 pt-2">
              <button @click="handleSave" class="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">保存</button>
              <button @click="showModal = false" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">取消</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { Plus, BookOpen } from 'lucide-vue-next'

const store = useAppStore()
const showModal = ref(false)
const editingCat = ref<any>(null)
const form = ref({ name: '', color: '#3b82f6' })

const handleEdit = (cat: any) => {
  editingCat.value = cat
  form.value = { name: cat.name, color: cat.color }
  showModal.value = true
}

const handleSave = () => {
  if (editingCat.value) {
    store.updateCategory(editingCat.value.id, { name: form.value.name, color: form.value.color })
  } else {
    store.addCategory({ id: Date.now().toString(), name: form.value.name, color: form.value.color, courseCount: 0 })
  }
  showModal.value = false
}
</script>