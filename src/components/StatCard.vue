<template>
  <div class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
    <div class="flex items-start justify-between">
      <div :class="`w-12 h-12 rounded-lg ${color} flex items-center justify-center`">
        <component :is="icon" class="w-6 h-6 text-white" />
      </div>
      <span
        v-if="trend"
        :class="`text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`"
      >
        {{ trend }}
      </span>
    </div>
    <div class="mt-4">
      <p class="text-sm text-gray-500">{{ label }}</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{{ value }}</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
  color: string
}>()
</script>