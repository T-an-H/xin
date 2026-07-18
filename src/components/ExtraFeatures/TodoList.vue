<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <input type="text" v-model="title" @keydown.enter="handleAdd" placeholder="添加待办事项..." class="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm" />
      <input type="date" v-model="dueDate" class="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 outline-none text-sm" />
      <button @click="handleAdd" class="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm font-medium">
        <Plus class="w-4 h-4" /> 添加
      </button>
    </div>

    <div v-if="activeTodos.length > 0" class="space-y-1.5">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">待完成</p>
      <div v-for="t in activeTodos" :key="t.id" class="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm group">
        <button @click="store.updateTodo(t.id, { completed: true })" class="flex-shrink-0">
          <Circle class="w-5 h-5 text-gray-300 hover:text-emerald-500 transition-colors" />
        </button>
        <span class="flex-1 text-sm text-gray-900">{{ t.title }}</span>
        <span v-if="t.dueDate" class="text-xs text-gray-400">{{ t.dueDate }}</span>
        <button @click="store.deleteTodo(t.id)" class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-400 transition-all">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-if="doneTodos.length > 0" class="space-y-1.5">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wider">已完成</p>
      <div v-for="t in doneTodos" :key="t.id" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-50">
        <button @click="store.updateTodo(t.id, { completed: false })" class="flex-shrink-0">
          <CheckCircle class="w-5 h-5 text-emerald-500" />
        </button>
        <span class="flex-1 text-sm text-gray-400 line-through">{{ t.title }}</span>
        <button @click="store.deleteTodo(t.id)" class="p-1 rounded hover:bg-red-50 text-red-400 transition-colors">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-if="myTodos.length === 0" class="text-center py-12 text-gray-400">
      <CheckCircle class="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>暂无待办事项</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Circle, CheckCircle, X } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const title = ref('')
const dueDate = ref('')

const myTodos = computed(() => store.todos.filter((t) => t.createdBy === store.currentUser))
const activeTodos = computed(() => myTodos.value.filter((t) => !t.completed))
const doneTodos = computed(() => myTodos.value.filter((t) => t.completed))

const handleAdd = () => {
  if (!title.value.trim()) return
  store.addTodo({
    id: Date.now().toString(),
    title: title.value.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    dueDate: dueDate.value || undefined,
    createdBy: store.currentUser || '未知',
  })
  title.value = ''
  dueDate.value = ''
}
</script>