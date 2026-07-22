<template>
  <div class="flex items-center gap-3 px-3 py-2 rounded-lg border" :class="colorClass">
    <component :is="icon" class="w-4 h-4" />
    <span class="text-xs font-medium min-w-[5em]">{{ typeLabel }}</span>
    <div v-if="editing" class="flex items-center gap-2 flex-1">
      <input type="range" min="0" max="100" v-model.number="score" class="w-24 h-1.5" />
      <span class="text-xs font-bold w-8">{{ score }}</span>
      <button @click="handleConfirm" class="text-xs px-2 py-0.5 bg-blue-500 text-white rounded">确认</button>
      <button @click="handleCancel" class="text-xs px-2 py-0.5 text-brand-400">取消</button>
    </div>
    <div v-else class="flex items-center gap-2 flex-1">
      <span class="text-sm font-bold">{{ record ? `${record.score}分` : '未评价' }}</span>
      <span v-if="record" class="text-[10px] text-brand-400">{{ record.createdAt }}</span>
      <button @click="startEdit" class="text-xs text-blue-500 ml-auto hover:underline">
        {{ record ? '修改' : '评价' }}
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, type Component } from 'vue'
import type { Evaluation } from '@/types'

const props = defineProps<{
  record: Evaluation | undefined
  colorClass: string
  icon: Component
  typeLabel: string
}>()

const emit = defineEmits<{
  submit: [score: number]
}>()

const editing = ref(false)
const score = ref(75)

const startEdit = () => {
  editing.value = true
  score.value = props.record?.score ?? 75
}

const handleConfirm = () => {
  emit('submit', score.value)
  editing.value = false
}

const handleCancel = () => {
  editing.value = false
  score.value = props.record?.score ?? 75
}
</script>