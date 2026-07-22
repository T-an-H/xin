<template>
  <div class="text-center py-12 text-brand-400">
    <Inbox class="w-12 h-12 mx-auto mb-3 opacity-50" />
    <p>{{ message }}</p>
  </div>
</template>
<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

withDefaults(defineProps<{
  message?: string
}>(), {
  message: '暂无数据',
})
</script>