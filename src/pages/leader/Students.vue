<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">学员总览</h1>
      <p class="text-gray-500 mt-1">查看管辖学院的所有学员信息</p>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
          <Users class="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <p class="text-xs text-gray-500">总学员数</p>
          <p class="text-xl font-bold text-gray-900">{{ students.length }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
          <UserCheck class="w-5 h-5 text-green-500" />
        </div>
        <div>
          <p class="text-xs text-gray-500">活跃学员</p>
          <p class="text-xl font-bold text-gray-900">{{ activeCount }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-100">
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">姓名</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">学号</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">班级</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">手机</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">邮箱</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">入学成绩</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in students" :key="s.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span class="text-xs font-bold text-blue-600">{{ s.name[0] }}</span>
                </div>
                <span class="text-sm font-medium text-gray-900">{{ s.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ s.studentId || '-' }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ s.className || '-' }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ s.phone }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ s.email }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ s.enrollmentScore ?? '-' }}</td>
            <td class="px-4 py-3">
              <span :class="`text-xs px-2 py-1 rounded-full ${s.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`">
                {{ s.status === 'active' ? '活跃' : '不活跃' }}
              </span>
            </td>
          </tr>
          <tr v-if="students.length === 0">
            <td colspan="7" class="px-4 py-12 text-center text-gray-400">暂无学员数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { Users, UserCheck } from 'lucide-vue-next'

const store = useAppStore()

const students = computed(() => store.getLeaderStudents(store.currentUser))

const activeCount = computed(() => students.value.filter((s) => s.status === 'active').length)
</script>
