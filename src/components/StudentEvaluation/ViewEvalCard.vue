<template>
  <div class="flex items-center gap-3 px-3 py-2 rounded-lg border" :class="colorClass">
    <component :is="icon" class="w-4 h-4" />
    <span class="text-xs font-medium min-w-[5em]">{{ typeLabel }}</span>
    <template v-if="record">
      <div class="flex-1">
        <span class="text-sm font-bold">{{ record.score }}分</span>
        <span class="text-[10px] text-gray-400 ml-2">—— {{ record.evaluatorName }}</span>
        <p v-if="record.comment" class="text-[11px] text-gray-400 mt-0.5">"{{ record.comment }}"</p>
      </div>
    </template>
    <span v-else class="text-xs text-gray-400">待评价</span>
  </div>
</template>
<script setup lang="ts">
import type { Component } from 'vue'
import type { Evaluation } from '@/types'

defineProps<{
  record: Evaluation | undefined
  colorClass: string
  icon: Component
  typeLabel: string
}>()
</script>