<template>
  <div id="d3-layout-root" class="flex min-h-screen bg-white">
    <Sidebar />
    <main class="flex-1 overflow-auto">
      <div class="p-6 max-w-7xl mx-auto">
        <router-view />
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useRouter } from 'vue-router'
import Sidebar from './Sidebar.vue'

const store = useAppStore()
const router = useRouter()

if (!store.isLoggedIn) router.replace('/login')

onMounted(() => {
  store.checkAndGenerateSessionReminders()
})
</script>
