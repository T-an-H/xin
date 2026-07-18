<template>
  <div v-if="!config" class="px-5 pb-4">
    <div class="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-400">该课程尚未配置评价方案</div>
  </div>
  <div v-else-if="enabledTypes.length === 0" class="px-5 pb-4">
    <div class="bg-amber-50 rounded-lg p-4 text-center text-sm text-amber-500">当前课程配置下无可用的评价类型</div>
  </div>
  <div v-else class="px-5 pb-4 space-y-3">
    <div class="flex items-center gap-2 flex-wrap mb-2">
      <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">{{ EvalTemplateLabels[config.template] }}</span>
      <span class="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-200">
        {{ EvalFrequencyLabels[config.frequency] }}
        <span class="ml-1 text-[10px] text-cyan-400">（共{{ totalSessions }}次）</span>
      </span>
      <span v-if="!courseHasGroups" class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">组内/组间互评自动隐藏（未分组）</span>
      <span v-if="!config.hasMentor" class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">企业导师评价自动隐藏（无企业参与）</span>
    </div>

    <div v-if="studentReminders.length > 0" :class="`rounded-lg p-3 border ${studentReminders.some(r => r.status === 'overdue') ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm font-medium mb-1">
          <Bell class="w-4 h-4 text-amber-500" />
          <span :class="studentReminders.some(r => r.status === 'overdue') ? 'text-red-600' : 'text-amber-600'">待办提醒</span>
          <span class="text-xs text-gray-400">（{{ studentReminders.filter(r => r.status !== 'completed').length }}项待处理）</span>
        </div>
        <button @click="handleProcessOverdue" class="text-xs flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
          <RefreshCw class="w-3 h-3" />逾期自动处理
        </button>
      </div>
      <div class="space-y-1">
        <p v-for="r in studentReminders.filter(r => r.status !== 'completed')" :key="r.id" :class="`text-xs flex items-center gap-2 ${r.status === 'overdue' ? 'text-red-500' : 'text-amber-500'}`">
          <Clock class="w-3 h-3" />
          第{{ r.sessionNumber }}次评价 截止{{ r.deadline }}
          <span v-if="r.status === 'overdue'" class="text-red-400">（已逾期）</span>
        </p>
      </div>
    </div>

    <div v-if="anomalies.length > 0" class="bg-red-50 border border-red-200 rounded-lg p-3">
      <div class="flex items-center gap-2 text-red-600 text-sm font-medium mb-1">
        <AlertTriangle class="w-4 h-4" />
        异常预警 ({{ anomalies.length }}条)
      </div>
      <p v-for="a in anomalies" :key="a.id" class="text-xs text-red-500 ml-6">{{ a.warning }}</p>
    </div>

    <div class="space-y-2">
      <div v-for="session in totalSessions" :key="session" :class="`border rounded-lg overflow-hidden ${sessionReminders[session]?.status === 'overdue' ? 'border-red-200' : 'border-gray-100'}`">
        <button @click="expandedSession = expandedSession === session ? null : session" class="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
          <div class="flex items-center gap-3">
            <span class="font-medium text-gray-800">第{{ session }}次评价</span>
            <span :class="`text-xs px-1.5 py-0.5 rounded-full ${sessionReminders[session]?.status === 'overdue' ? 'bg-red-100 text-red-600' : sessionReminders[session]?.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'text-gray-400'}`">
              {{ sessionReminders[session]?.status === 'overdue' ? '已逾期' : sessionReminders[session]?.status === 'pending' ? '待评价' : '' }}
            </span>
            <span class="text-xs text-gray-500">{{ getSessionEvals(session).filter(e => e.record).length }}/{{ enabledTypes.length }} 项已评</span>
          </div>
          <div class="flex items-center gap-2">
            <CheckCircle v-if="getSessionEvals(session).filter(e => e.record).length === enabledTypes.length" class="w-3.5 h-3.5 text-emerald-500" />
            <ChevronUp v-if="expandedSession === session" class="w-4 h-4 text-gray-400" />
            <ChevronDown v-else class="w-4 h-4 text-gray-400" />
          </div>
        </button>

        <div v-if="expandedSession === session" class="px-4 pb-3 space-y-2">
          <template v-for="{ type, record, icon: Icon } in getSessionEvals(session)" :key="type">
            <SelfEvalCard
              v-if="type === 'self'"
              :record="record"
              :color-class="EvalTypeColors[type]"
              :icon="Icon"
              :type-label="EvalTypeLabels[type]"
              @submit="(score: number) => handleSelfSubmit(session, score)"
            />
            <ViewEvalCard
              v-else-if="type === 'teacher' || type === 'mentor'"
              :record="record"
              :color-class="EvalTypeColors[type]"
              :icon="Icon"
              :type-label="EvalTypeLabels[type]"
            />
            <PeerEvalCard
              v-else
              :record="record"
              :course-id="courseId"
              :student-id="studentId"
              :student-name="studentName"
              :session-number="session"
              :type="type"
              :color-class="EvalTypeColors[type]"
              :icon="Icon"
              :type-label="EvalTypeLabels[type]"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import {
  AlertTriangle, User, Users, Building2, GraduationCap, Briefcase,
  CheckCircle, ChevronDown, ChevronUp, Bell, Clock, RefreshCw
} from 'lucide-vue-next'
import type { EvalType, EvalAnomaly } from '@/types'
import { EvalTypeLabels, EvalTypeColors, EvalTemplateLabels, EvalTemplateDescs, EvalFrequencyLabels, EvalFrequencyDescs, TEMPLATE_EVAL_TYPES } from '@/types'
import SelfEvalCard from './StudentEvaluation/SelfEvalCard.vue'
import ViewEvalCard from './StudentEvaluation/ViewEvalCard.vue'
import PeerEvalCard from './StudentEvaluation/PeerEvalCard.vue'

const props = defineProps<{
  courseId: string
  studentId: string
  studentName: string
}>()

const store = useAppStore()
const expandedSession = ref<number | null>(null)

const course = computed(() => store.courses.find((c) => c.id === props.courseId))
const config = computed(() => store.evalConfigs.find((c) => c.courseId === props.courseId))
const totalSessions = computed(() => store.getEvalSessions(props.courseId))
const courseHasGroups = computed(() => store.hasGroups(props.courseId))

watch(() => props.courseId, () => {
  store.generateEvalReminders(props.courseId)
}, { immediate: true })

const baseEnabledTypes = computed(() => config.value ? TEMPLATE_EVAL_TYPES[config.value.template] : [])
const enabledTypes = computed(() =>
  baseEnabledTypes.value.filter((t) => {
    if ((t === 'intra_group' || t === 'inter_group') && !courseHasGroups.value) return false
    if (t === 'mentor' && !config.value?.hasMentor) return false
    return true
  })
)

const studentReminders = computed(() =>
  store.evalReminders.filter((r) => r.courseId === props.courseId && r.studentId === props.studentId)
)

const sessionReminders = computed(() => {
  const map: Record<number, any> = {}
  for (const r of studentReminders.value) {
    map[r.sessionNumber] = r
  }
  return map
})

const anomalies = computed(() => {
  const results: EvalAnomaly[] = []
  for (let s = 1; s <= totalSessions.value; s++) {
    results.push(...store.detectAnomalies(props.courseId, s))
  }
  return results
})

const getEvalForType = (sessionNumber: number, type: EvalType) => {
  return store.evaluations.find(
    (e) => e.courseId === props.courseId && e.studentId === props.studentId && e.sessionNumber === sessionNumber && e.type === type
  )
}

const getSessionEvals = (session: number) => {
  return enabledTypes.value.map((type) => {
    const icons: Record<EvalType, any> = {
      self: User, intra_group: Users, inter_group: Building2, teacher: GraduationCap, mentor: Briefcase,
    }
    return { type, record: getEvalForType(session, type), icon: icons[type] }
  })
}

const handleSelfSubmit = (sessionNumber: number, score: number) => {
  const existing = getEvalForType(sessionNumber, 'self')
  const ev = {
    id: existing ? existing.id : `ev-${Date.now()}`,
    courseId: props.courseId,
    studentId: props.studentId,
    sessionNumber,
    type: 'self' as EvalType,
    score,
    evaluatorId: props.studentId,
    evaluatorName: props.studentName,
    createdAt: new Date().toISOString().split('T')[0],
  }
  if (existing) {
    store.updateEvaluation(ev.id, { score, createdAt: ev.createdAt })
  } else {
    store.addEvaluation(ev)
  }
  const reminder = store.evalReminders.find(
    (r) => r.courseId === props.courseId && r.studentId === props.studentId && r.sessionNumber === sessionNumber
  )
  if (reminder) {
    const updated = store.evalReminders.map((r) =>
      r.id === reminder.id ? { ...r, status: 'completed' as const } : r
    )
    store.evalReminders.splice(0, store.evalReminders.length, ...updated)
  }
}

const handleProcessOverdue = () => {
  for (const r of studentReminders.value) {
    if (r.status === 'overdue') {
      store.processSessionOverdue(props.courseId, r.sessionNumber)
    }
  }
}
</script>