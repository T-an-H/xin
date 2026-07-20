<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">学员管理</h1>
      <p class="text-gray-500 mt-1">学员实施信息管理，基础数据由教务系统导入</p>
    </div>

    <div class="flex gap-3">
      <div class="relative flex-1">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="searchText" type="text" placeholder="搜索学员姓名或学号..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-100">
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">姓名</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">学号</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">班级</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">已选课程</th>
            <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in paginatedStudents" :key="s.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span class="text-xs font-bold text-blue-600">{{ s.name[0] }}</span>
                </div>
                <span class="text-sm font-medium text-gray-900">{{ s.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ s.studentId }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ s.className }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ getEnrolledCount(s.id) }} 门</td>
            <td class="px-4 py-3 text-right">
              <router-link :to="`/admin/students/${s.id}`" class="text-xs text-blue-500 hover:underline">查看详情</router-link>
            </td>
          </tr>
          <tr v-if="paginatedStudents.length === 0">
            <td colspan="5" class="px-4 py-12 text-center text-gray-400">暂无学员数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-between">
      <span class="text-sm text-gray-500">共 {{ store.students.length }} 名学员</span>
      <div class="flex gap-1">
        <button v-for="p in totalPages" :key="p" @click="currentPage = p" :class="`px-3 py-1.5 rounded-lg text-sm ${currentPage === p ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`">
          {{ p }}
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { Search } from 'lucide-vue-next'

const store = useAppStore()
const searchText = ref('')
const currentPage = ref(1)
const pageSize = 10

const filteredStudents = computed(() => {
  if (!searchText.value) return store.students
  return store.students.filter((s) => s.name.includes(searchText.value) || s.studentId.includes(searchText.value))
})

const totalPages = computed(() => Math.ceil(filteredStudents.value.length / pageSize))
const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredStudents.value.slice(start, start + pageSize)
})

const getEnrolledCount = (studentId: string) => store.enrollments.filter((e) => e.studentId === studentId).length
</script>