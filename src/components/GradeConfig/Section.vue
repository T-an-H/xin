<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-brand-800">{{ title }}</h3>
      <span :class="`text-xs ${valid ? 'text-brand-600' : 'text-red-400'}`">{{ hint }}</span>
    </div>
    <div class="space-y-2 pl-2">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  title: string
  hint: string
  valid: boolean
}>()
</script>