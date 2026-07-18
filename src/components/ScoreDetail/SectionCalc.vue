<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold text-gray-800">{{ title }} <span class="text-xs text-gray-400 font-normal">(权重 {{ weight }}%)</span></h3>
      <span class="text-lg font-bold text-gray-900">{{ score }}</span>
    </div>

    <div class="space-y-1.5 mb-2">
      <div v-for="item in items" :key="item.label" class="flex items-center gap-2">
        <span class="text-xs text-gray-500 w-20 flex-shrink-0">{{ item.label }} ({{ item.weight }}%)</span>
        <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-300" :style="{ width: `${item.score ?? 0}%`, backgroundColor: item.score != null ? '#f59e0b' : '#e5e7eb' }" />
        </div>
        <span class="text-xs font-medium text-gray-700 w-8 text-right">{{ item.score ?? '-' }}</span>
      </div>
    </div>

    <p class="text-xs text-gray-400">
      {{ score }} × {{ weight }}% = {{ contribution.toFixed(1) }} 分
      <span v-if="weight > 0" class="text-gray-300">（贡献至总分）</span>
    </p>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  title: string
  weight: number
  score: number
  contribution: number
  items: { score: number | undefined; weight: number; label: string }[]
}>()
</script>