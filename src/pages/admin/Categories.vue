<template>
  <div id="admin-categories-root"></div>
  <Teleport to="body">
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="showModal = false" />
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h3 class="text-lg font-semibold text-brand-900 mb-4">{{ editingCat ? '编辑分类' : '新建分类' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-brand-800 mb-1">分类名称</label>
            <input v-model="form.name" type="text" class="w-full px-3 py-2 rounded-lg border border-brand-400/30 focus:border-brand-600 outline-none text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-brand-800 mb-1">颜色</label>
            <div class="flex gap-2">
              <input v-model="form.color" type="color" class="w-10 h-10 rounded cursor-pointer" />
              <span class="text-sm text-brand-400 self-center">{{ form.color }}</span>
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <button @click="handleSave" class="flex-1 py-2.5 bg-brand-600 hover:bg-brand-800 text-white rounded-lg text-sm font-medium transition-colors">保存</button>
            <button @click="showModal = false" class="flex-1 py-2.5 bg-brand-400/10 hover:bg-brand-400/10 text-brand-600 rounded-lg text-sm font-medium transition-colors">取消</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'

const store = useAppStore()
const showModal = ref(false)
const editingCat = ref<any>(null)
const form = ref({ name: '', color: '#415a77' })

const handleEdit = (cat: any) => {
  editingCat.value = cat
  form.value = { name: cat.name, color: cat.color }
  showModal.value = true
}

const handleSave = () => {
  if (editingCat.value) {
    store.updateCategory(editingCat.value.id, { name: form.value.name, color: form.value.color })
  } else {
    store.addCategory({ id: Date.now().toString(), name: form.value.name, color: form.value.color, courseCount: 0 })
  }
  showModal.value = false
}

function renderAdminCategories(root: HTMLElement) {
  root.innerHTML = ''
  const container = d3.select(root)

  const wrapper = container.append('div').attr('class', 'space-y-6')

  // ---- 页面头部 ----
  const header = wrapper.append('div').attr('class', 'flex items-center justify-between')
  const titleArea = header.append('div')
  titleArea.append('h1').attr('class', 'text-2xl font-bold text-brand-900').text('分类管理')
  titleArea.append('p').attr('class', 'text-brand-400 mt-1').text('管理课程分类信息')
  const newBtn = header.append('button')
    .attr('class', 'flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-800 text-white rounded-lg transition-colors text-sm font-medium')
    .on('click', () => {
      editingCat.value = null
      form.value = { name: '', color: '#415a77' }
      showModal.value = true
    })
  renderIcon(newBtn, 'plus', 'w-4 h-4')
  newBtn.append('span').text('新建分类')

  // ---- 卡片网格 ----
  const grid = wrapper.append('div')
    .attr('class', 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4')

  store.categories.forEach((cat) => {
    const card = grid.append('div')
      .attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-5 hover:shadow-md transition-shadow')

    const topRow = card.append('div').attr('class', 'flex items-start justify-between mb-3')

    const iconBox = topRow.append('div')
      .attr('class', 'w-10 h-10 rounded-lg flex items-center justify-center')
      .style('background-color', cat.color)
    renderIcon(iconBox, 'bookOpen', 'w-5 h-5 text-white')

    topRow.append('button')
      .attr('class', 'text-xs text-brand-600 hover:underline')
      .on('click', () => handleEdit(cat))
      .text('编辑')

    card.append('h3').attr('class', 'font-semibold text-brand-900').text(cat.name)

    const courseCount = store.courses.filter((c) => c.categoryId === cat.id).length
    card.append('p').attr('class', 'text-xs text-brand-400 mt-1').text(`${courseCount} 门课程`)
  })
}

onMounted(() => {
  const root = document.getElementById('admin-categories-root')
  if (root) renderAdminCategories(root)
})

watch([showModal, () => store.categories.length, () => store.courses.length], () => {
  const root = document.getElementById('admin-categories-root')
  if (root) renderAdminCategories(root)
})
</script>
