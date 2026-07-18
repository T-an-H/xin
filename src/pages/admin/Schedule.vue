<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">排课管理</h1>
        <p class="text-gray-500 mt-1">管理课程排课信息</p>
      </div>
      <button @click="showModal = true" class="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
        <Plus class="w-4 h-4" /> 新建排课
      </button>
    </div>

    <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-100">
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">课程</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">教师</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">时间</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">地点</th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">日期</th>
            <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sched in store.schedules" :key="sched.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
              <p class="text-sm font-medium text-gray-900">{{ sched.title }}</p>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sched.teacher }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sched.timeSlot }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sched.room }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ sched.startDate }} ~ {{ sched.endDate }}</td>
            <td class="px-4 py-3 text-right">
              <button @click="store.deleteSchedule(sched.id)" class="text-xs text-red-400 hover:underline">删除</button>
            </td>
          </tr>
          <tr v-if="store.schedules.length === 0">
            <td colspan="6" class="px-4 py-12 text-center text-gray-400">暂无排课数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal :is-open="showModal" :on-close="() => showModal = false" title="新建排课">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">课程</label>
          <select v-model="form.courseId" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm">
            <option v-for="c in store.courses" :key="c.id" :value="c.id">{{ c.title }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">时间段</label>
          <select v-model="form.timeSlot" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm">
            <option v-for="slot in timeSlots" :key="slot" :value="slot">{{ slot }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">教室/地点</label>
          <input v-model="form.room" type="text" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input v-model="form.startDate" type="date" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input v-model="form.endDate" type="date" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button @click="handleSave" class="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">保存</button>
          <button @click="showModal = false" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">取消</button>
        </div>
      </div>
    </Modal>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { Plus } from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'

const store = useAppStore()
const showModal = ref(false)
const timeSlots = ['周一 08:00-09:30', '周一 09:45-11:15', '周一 14:00-15:30', '周二 08:00-09:30', '周二 09:45-11:15', '周二 14:00-15:30', '周三 08:00-09:30', '周三 09:45-11:15', '周三 14:00-15:30', '周四 08:00-09:30', '周四 09:45-11:15', '周四 14:00-15:30', '周五 08:00-09:30', '周五 09:45-11:15', '周五 14:00-15:30']
const form = ref({ courseId: '', timeSlot: '周一 08:00-09:30', room: '', startDate: '', endDate: '' })

const handleSave = () => {
  const course = store.courses.find((c) => c.id === form.value.courseId)
  if (!course) return
  store.addSchedule({
    id: Date.now().toString(),
    courseId: form.value.courseId,
    title: course.title,
    timeSlot: form.value.timeSlot,
    room: form.value.room,
    startDate: form.value.startDate,
    endDate: form.value.endDate,
    teacher: course.teacher,
  })
  showModal.value = false
}
</script>