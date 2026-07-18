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
        {{ tab.label }}
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
import { ref } from 'vue'
import { Cloud, CheckCircle, FileText, Edit3 } from 'lucide-vue-next'
import CloudDrive from './ExtraFeatures/CloudDrive.vue'
import TodoList from './ExtraFeatures/TodoList.vue'
import OnlineDocs from './ExtraFeatures/OnlineDocs.vue'
import Notes from './ExtraFeatures/Notes.vue'

const tabs = [
  { id: 'cloud', label: '云盘', icon: Cloud },
  { id: 'todos', label: '待办', icon: CheckCircle },
  { id: 'docs', label: '在线文档', icon: FileText },
  { id: 'notes', label: '笔记', icon: Edit3 },
]

const activeTab = ref('cloud')
</script>