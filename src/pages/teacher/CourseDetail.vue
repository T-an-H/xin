<template>
  <div id="teacher-course-detail-root"></div>
  <GradeConfig
    :course-id="courseId || ''"
    :open="showGradeConfig"
    :on-close="() => { showGradeConfig = false; if (pendingFinalExamSelect) { selectedExam = pendingFinalExamSelect; pendingFinalExamSelect = ''; } }"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import GradeConfig from '@/components/GradeConfig.vue'
import * as d3 from 'd3'
import { renderIcon } from '@/utils/d3-renderer'
import {
  EvalTemplateLabels, EvalTemplateDescs, TEMPLATE_EVAL_TYPES,
  EvalTypeLabels, EvalTypeColors, EvalFrequencyLabels,
  EvalFrequencyDescs, OverdueRuleLabels
} from '@/types'
import type { EvalTemplate, EvalType, Evaluation, EvalFrequency, OverdueRule } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const courseId = computed(() => route.params.id as string)
const course = computed(() => store.courses.find((c) => c.id === courseId.value))
const isReadOnly = computed(() => course.value?.status !== 'active')
const isMentor = computed(() => store.currentRole === 'mentor')

// ---- Tab 配置 ----
const tabList = [
  { key: 'comments',  label: '评论管理', icon: 'clipboardCheck' as const },
  { key: 'grades',    label: '成绩管理', icon: 'trendingUp' as const },
  { key: 'students',  label: '学生管理', icon: 'users' as const },
]

// ---- 常量 ----
const LEVEL_OPTIONS = [
  { label: 'A (优秀)', range: [90, 100], color: 'bg-brand-600/15 text-brand-800 border-brand-600' },
  { label: 'B (良好)', range: [80, 89],  color: 'bg-brand-600/15 text-brand-800 border-brand-600' },
  { label: 'C (中等)', range: [70, 79],  color: 'bg-brand-600/15 text-brand-800 border-brand-600' },
  { label: 'D (及格)', range: [60, 69],  color: 'bg-brand-600/15 text-brand-800 border-brand-600' },
]
const ALL_EVAL_TYPES: EvalType[] = ['self', 'intra_group', 'inter_group', 'teacher', 'mentor']
const EVAL_TEMPLATE_KEYS = Object.keys(EvalTemplateLabels) as EvalTemplate[]
const EVAL_FREQUENCY_KEYS = Object.keys(EvalFrequencyLabels) as EvalFrequency[]
const OVERDUE_RULE_KEYS = Object.keys(OverdueRuleLabels) as OverdueRule[]
const ExamTypeLabels: Record<string, string> = {
  midterm_exam: '期中考试',
  midterm_project: '期中项目',
  final_exam: '期末考试',
  final_project: '期末项目',
  quiz: '隨堂测验',
  assignment: '课后作业',
}

// ---- 配置锁定状态 ----
const evalConfigLocked = computed(() => {
  if (!courseId.value) return true
  return !store.isEvalConfigEditable(courseId.value)
})
const isWeightLocked = computed(() => {
  if (!courseId.value) return true
  return !store.isWeightConfigEditable(courseId.value)
})

// ---- 状态 ----
const activeTab = ref<string>('comments')
const showSettings = ref(false)
const studentSearch = ref('')

// ---- 学生管理 ----
const showAddStudentModal = ref(false)
const newStudentName = ref('')
const newStudentId = ref('')
let studentExcelInput: HTMLInputElement | null = null
let groupExcelInput: HTMLInputElement | null = null
const showGroupModal = ref(false)
const editingGroup = ref<import('@/types').StudentGroup | null>(null)
const groupFormName = ref('')
const groupFormMembers = ref<string[]>([])
const showEditStudentModal = ref(false)
const editingStudent = ref<import('@/types').Student | null>(null)
const editStudentName = ref('')
const editStudentIdField = ref('')
const editStudentGroupId = ref('')

// ---- 成绩管理 ----
const showNewExamModal = ref(false)
const showGradeConfig = ref(false)
const newExamName = ref('')
const newExamFullScore = ref(100)
const newExamType = ref<'midterm_exam' | 'midterm_project' | 'final_exam' | 'final_project' | 'quiz' | 'assignment'>('midterm_exam')
const selectedExam = ref('')
const gradeSearch = ref('')
const totalSearch = ref('')
const showWeightReminderModal = ref(false)
const pendingFinalExamSelect = ref('')

function getStudentInitial(name: string): string {
  const ch = name.charAt(0)
  if (/[a-zA-Z]/.test(ch)) return ch.toUpperCase()
  return ch
}

const studentGradeGroups = computed(() => {
  const enrolled = enrolledStudents.value
    .map((e) => e.student)
    .filter(Boolean) as NonNullable<(typeof enrolledStudents.value)[number]['student']>[]

  const q = totalSearch.value.trim().toLowerCase()
  const filtered = q
    ? enrolled.filter((s) => s.name.toLowerCase().includes(q))
    : enrolled

  const groups = new Map<string, typeof filtered>()
  for (const student of filtered) {
    const initial = getStudentInitial(student.name)
    if (!groups.has(initial)) groups.set(initial, [])
    groups.get(initial)!.push(student)
  }

  const sorted = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
  return sorted.map(([initial, students]) => ({
    initial,
    students: students.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
  }))
})

const examInputs = ref<Record<string, number>>({})
const selectedStudentIds = ref<string[]>([])
const evalScoreInputs = ref<Record<string, number>>({})
const evalStudentSearch = ref('')
const selectedBatchSession = ref(1)

const myCourses = computed(() => store.courses.filter((c) => c.teacher === store.currentUser))
const selectedConfig = computed(() => courseId.value ? store.evalConfigs.find((c) => c.courseId === courseId.value) : null)
const baseEnabledTypes = computed<EvalType[]>(() => selectedConfig.value ? TEMPLATE_EVAL_TYPES[selectedConfig.value.template] : [])
const totalSessions = computed(() => courseId.value ? store.getEvalSessions(courseId.value) : 1)
const courseHasGroups = computed(() => courseId.value ? store.hasGroups(courseId.value) : false)

// ---- 评价管理 ----
const evalTableSections = computed(() => {
  if (!courseId.value) return []
  const session = selectedBatchSession.value
  const search = evalStudentSearch.value.trim().toLowerCase()

  const enrolled = store.enrollments
    .filter((e) => e.courseId === courseId.value && e.status !== 'dropped')
    .map((e) => store.students.find((s) => s.id === e.studentId))
    .filter(Boolean) as NonNullable<ReturnType<typeof store.students.find>>[]

  const filtered = search
    ? enrolled.filter((s) => s.name.toLowerCase().includes(search))
    : enrolled

  const groups = store.studentGroups.filter((g) => g.courseId === courseId.value)
  const memberToGroup = new Map<string, string>()
  for (const g of groups) {
    for (const mid of g.memberIds) {
      memberToGroup.set(mid, g.name)
    }
  }

  const groupedMap = new Map<string, typeof filtered>()
  const ungrouped: typeof filtered = []
  for (const s of filtered) {
    const groupName = memberToGroup.get(s.id)
    if (groupName) {
      if (!groupedMap.has(groupName)) groupedMap.set(groupName, [])
      groupedMap.get(groupName)!.push(s)
    } else {
      ungrouped.push(s)
    }
  }

  function buildRow(student: typeof filtered[number]) {
    const evals = store.evaluations.filter(
      (e) => e.courseId === courseId.value && e.studentId === student.id && e.sessionNumber === session
    )
    const getScore = (type: EvalType) => {
      const found = evals.filter((e) => e.type === type)
      if (found.length === 0) return null
      return Math.round(found.reduce((a, e) => a + e.score, 0) / found.length)
    }
    const evalTypeForMentor: EvalType = 'mentor'
    const submitted = store.isSessionLocked(courseId.value || '', session) ||
      store.isTeacherEvalSubmitted(courseId.value || '', student.id, session, isMentor.value ? evalTypeForMentor : 'teacher')
    const draftEvals = evals.filter((e) => e.type === (isMentor.value ? evalTypeForMentor : 'teacher'))
    return {
      student,
      selfScore: getScore('self'),
      intraScore: getScore('intra_group'),
      interScore: getScore('inter_group'),
      teacherScore: getScore('teacher'),
      mentorScore: getScore('mentor'),
      submitted,
      hasDraft: !submitted && draftEvals.length > 0,
      finalScore: store.getSubmittedTeacherScore(courseId.value || '', student.id, session, isMentor.value ? evalTypeForMentor : 'teacher') ?? '-',
    }
  }

  const sections: { groupName: string; students: ReturnType<typeof buildRow>[] }[] = []
  for (const [name, members] of groupedMap) {
    sections.push({ groupName: name, students: members.map(buildRow) })
  }
  if (ungrouped.length > 0) {
    sections.push({ groupName: '未分组', students: ungrouped.map(buildRow) })
  }
  return sections
})

const hasEvalInputs = computed(() => Object.keys(evalScoreInputs.value).length > 0)

const isAllSelected = computed(() => {
  const total = evalTableSections.value.reduce((a, s) => a + s.students.length, 0)
  return total > 0 && selectedStudentIds.value.length === total
})

// ---- 成绩管理 computed ----
const examNames = computed(() => {
  if (!courseId.value) return []
  return store.getExamNames(courseId.value)
})

const examsByType = computed(() => {
  if (!courseId.value) return []
  const names = examNames.value
  const map = new Map<string, string[]>()
  for (const name of names) {
    const type = getExamTypeForName(name)
    if (!map.has(type)) map.set(type, [])
    map.get(type)!.push(name)
  }
  return Array.from(map.entries()).map(([type, exams]) => ({ type, exams }))
})

function getTypeWeightLabel(type: string): string {
  if (!courseId.value) return '-'
  const cfg = store.getGradeConfig(courseId.value)
  if (type === 'midterm_exam' || type === 'midterm_project') {
    return `${cfg.midtermWeight}%`
  }
  if (type === 'final_exam' || type === 'final_project') {
    return `${cfg.finalWeight}%`
  }
  return `${cfg.regularWeight}%`
}

const currentExamFullScore = computed(() => {
  if (!courseId.value || !selectedExam.value) return 100
  const scores = store.getExamScoresForCourse(courseId.value, selectedExam.value)
  return scores.length > 0 ? scores[0].fullScore : 100
})

const currentExamWeight = computed(() => {
  if (!courseId.value || !selectedExam.value) return 0
  return store.getExamWeight(courseId.value, selectedExam.value)
})

const filteredGradeStudents = computed(() => {
  if (!selectedExam.value) return []
  let list = enrolledStudents.value
  if (gradeSearch.value.trim()) {
    const q = gradeSearch.value.trim().toLowerCase()
    list = list.filter(({ student }) =>
      student && (student.name.toLowerCase().includes(q) || student.id.toLowerCase().includes(q))
    )
  }
  return list
})

const hasExamInputs = computed(() => Object.keys(examInputs.value).length > 0)

const submittedExamCount = computed(() => {
  if (!courseId.value || !selectedExam.value) return 0
  return store.getExamScoresForCourse(courseId.value, selectedExam.value)
    .filter((s) => s.status === 'submitted').length
})

const pendingExamSubmits = computed(() => {
  if (!courseId.value || !selectedExam.value) return 0
  return filteredGradeStudents.value.filter(({ student }) => {
    if (!student) return false
    const score = store.getExamScoresForCourse(courseId.value, selectedExam.value)
      .find((s) => s.studentId === student.id)
    return score && score.status === 'draft'
  }).length
})

function getStudentExamScore(studentId: string): number | null {
  if (!courseId.value || !selectedExam.value) return null
  const score = store.getExamScoresForCourse(courseId.value, selectedExam.value)
    .find((s) => s.studentId === studentId)
  return score?.score ?? null
}

function isExamSubmitted(studentId: string): boolean {
  if (!courseId.value || !selectedExam.value) return false
  const score = store.getExamScoresForCourse(courseId.value, selectedExam.value)
    .find((s) => s.studentId === studentId)
  return score?.status === 'submitted'
}

function getStudentExamPercent(studentId: string): string {
  if (!courseId.value || !selectedExam.value) return '-'
  const score = store.getExamScoresForCourse(courseId.value, selectedExam.value)
    .find((s) => s.studentId === studentId)
  if (!score) return '-'
  return `${Math.round((score.score / score.fullScore) * 100)}分`
}

function getExamWeightFromConfig(examName: string): number {
  if (!courseId.value) return 0
  return store.getExamWeight(courseId.value, examName)
}

const examWeightTotal = computed(() => {
  if (!courseId.value) return 0
  const cfg = store.getGradeConfig(courseId.value)
  return cfg.midtermWeight + cfg.finalWeight + cfg.regularWeight
})

function handleWeightChange(examName: string, weight: number) {
  if (!courseId.value || isReadOnly.value) return
  store.setExamWeight(courseId.value, examName, weight)
}

function getExamTypeForName(examName: string): string {
  if (!courseId.value) return 'midterm_exam'
  const scores = store.getExamScoresForCourse(courseId.value, examName)
  return scores.length > 0 ? scores[0].type : 'midterm_exam'
}

function isFinalExamType(examName: string): boolean {
  const type = getExamTypeForName(examName)
  return type === 'final_exam' || type === 'final_project'
}

function handleSelectExam(name: string) {
  if (!courseId.value) return
  if (isFinalExamType(name) && !isWeightLocked.value) {
    const gradeConfig = store.getGradeConfig(courseId.value)
    const isConfigDefault =
      gradeConfig.regularWeight === 40 && gradeConfig.midtermWeight === 0 && gradeConfig.finalWeight === 60
    if (isConfigDefault) {
      showWeightReminderModal.value = true
      pendingFinalExamSelect.value = name
      render()
      return
    }
  }
  selectedExam.value = name
  render()
}

function handleOpenGradeConfigFromReminder() {
  showWeightReminderModal.value = false
  showGradeConfig.value = true
  render()
}

function handleAddExam() {
  if (!courseId.value || !newExamName.value.trim()) return
  const name = newExamName.value.trim()
  const type = newExamType.value

  if (type === 'midterm_exam' || type === 'final_exam') {
    const existing = store.getExamScoresForCourse(courseId.value)
      .filter((s) => s.type === type)
    if (existing.length > 0) {
      alert(`${type === 'midterm_exam' ? '期中考试' : '期末考试'}已存在，每个学期仅可创建一次`)
      return
    }
  }

  for (const { student } of enrolledStudents.value) {
    if (!student) continue
    const id = `exam-${courseId.value}-${student.id}-${name}-${Date.now()}`
    store.addExamScore({
      id,
      courseId: courseId.value,
      studentId: student.id,
      examName: name,
      score: 0,
      fullScore: newExamFullScore.value,
      weight: 0,
      type,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      gradedAt: '',
    })
  }

  if (type === 'midterm_project' || type === 'final_project') {
    const sameTypeExams = store.getExamScoresForCourse(courseId.value)
      .filter((s) => s.type === type)
    const uniqueNames = Array.from(new Set(sameTypeExams.map((s) => s.examName)))
    const typeWeight = type === 'midterm_project'
      ? store.getGradeConfig(courseId.value).midtermWeight
      : store.getGradeConfig(courseId.value).finalWeight
    if (uniqueNames.length > 0 && typeWeight > 0) {
      const eachWeight = Math.floor(typeWeight / uniqueNames.length)
      uniqueNames.forEach((examName) => store.setExamWeight(courseId.value!, examName, eachWeight))
    }
  }

  showNewExamModal.value = false
  selectedExam.value = name
  newExamName.value = ''
  render()
}

function handleSaveExamScores() {
  if (!courseId.value || !selectedExam.value) return
  const existingScores = store.getExamScoresForCourse(courseId.value, selectedExam.value)
  const examType = existingScores.length > 0
    ? existingScores[0].type
    : 'midterm_exam'
  const examWeight = store.getExamWeight(courseId.value, selectedExam.value)
  Object.entries(examInputs.value).forEach(([studentId, score]) => {
    const existing = existingScores.find((s) => s.studentId === studentId)
    if (existing && existing.status !== 'submitted') {
      store.updateExamScore(existing.id, { score, gradedAt: new Date().toISOString().split('T')[0] })
    } else if (!existing) {
      const id = `exam-${courseId.value}-${studentId}-${selectedExam.value}-${Date.now()}`
      store.addExamScore({
        id,
        courseId: courseId.value,
        studentId,
        examName: selectedExam.value,
        score,
        fullScore: currentExamFullScore.value,
        weight: examWeight,
        type: examType,
        status: 'draft',
        createdAt: new Date().toISOString().split('T')[0],
        gradedAt: '',
      })
    }
  })
  examInputs.value = {}
  render()
}

function handleSubmitExamScores() {
  if (!courseId.value || !selectedExam.value) return
  handleSaveExamScores()
  store.submitExamScores(courseId.value, selectedExam.value)
  render()
}

function getStudentTotalScore(studentId: string): string | number {
  if (!courseId.value) return '-'
  const scores = store.getExamScoresForCourse(courseId.value)
    .filter((s) => s.studentId === studentId && s.status === 'submitted')
  if (scores.length === 0) return '-'
  const gradeConfig = store.getGradeConfig(courseId.value)
  let weightedSum = 0
  let totalWeight = 0
  const typeGroups = new Map<string, { count: number; sumPercent: number }>()
  for (const s of scores) {
    const w = store.getExamWeight(courseId.value, s.examName)
    const percent = (s.score / s.fullScore) * 100
    if (w > 0) {
      weightedSum += percent * w
      totalWeight += w
    } else {
      if (!typeGroups.has(s.type)) typeGroups.set(s.type, { count: 0, sumPercent: 0 })
      const g = typeGroups.get(s.type)!
      g.count++
      g.sumPercent += percent
    }
  }
  for (const [type, g] of typeGroups) {
    let typeWeight = 0
    if (type === 'midterm_exam' || type === 'midterm_project') typeWeight = gradeConfig.midtermWeight
    else if (type === 'final_exam' || type === 'final_project') typeWeight = gradeConfig.finalWeight
    else typeWeight = gradeConfig.regularWeight
    if (typeWeight > 0 && g.count > 0) {
      const avgPercent = g.sumPercent / g.count
      weightedSum += avgPercent * typeWeight
      totalWeight += typeWeight
    }
  }
  if (totalWeight === 0) return '0'
  return Math.round(weightedSum / totalWeight)
}

function getStudentExamCount(studentId: string): number {
  if (!courseId.value) return 0
  return store.getExamScoresForCourse(courseId.value)
    .filter((s) => s.studentId === studentId).length
}

function getStudentAvgScore(studentId: string): string | number {
  if (!courseId.value) return '-'
  const allEvals = store.evaluations.filter(
    (e) => e.courseId === courseId.value && e.studentId === studentId
  )
  if (allEvals.length === 0) return '-'
  const maxSession = Math.max(...allEvals.map((e) => e.sessionNumber))
  const relevantEvals = allEvals.filter((e) => e.sessionNumber <= maxSession)
  const sum = relevantEvals.reduce((a, e) => a + e.score, 0)
  return Math.round(sum / relevantEvals.length)
}

function getStudentScoreForExam(studentId: string, examName: string): string | number {
  if (!courseId.value) return '-'
  const score = store.getExamScoresForCourse(courseId.value, examName)
    .find((s) => s.studentId === studentId && s.status === 'submitted')
  return score?.score ?? '-'
}

async function handleExcelImport(event: Event) {
  if (!courseId.value || !selectedExam.value) return
  const existingScores = store.getExamScoresForCourse(courseId.value, selectedExam.value)
  const examType = existingScores.length > 0
    ? existingScores[0].type
    : 'midterm_exam'
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  try {
    const buf = await file.arrayBuffer()
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data: Record<string, string>[] = XLSX.utils.sheet_to_json(ws)
    const keys = Object.keys(data[0] || {})
    if (keys.length < 2) {
      alert('Excel 格式不正确，请确保第一列为学生姓名/学号，第二列为成绩')
      return
    }
    const nameKey = keys[0]
    const scoreKey = keys[1]
    let imported = 0
    for (const row of data) {
      const name = String(row[nameKey] || '').trim().toLowerCase()
      const rawScore = parseFloat(String(row[scoreKey] || '').trim())
      if (isNaN(rawScore) || !name) continue
      const student = store.students.find(
        (s) => s.name.toLowerCase() === name || s.id.toLowerCase() === name
      )
      if (!student) continue
      const existing = existingScores.find((s) => s.studentId === student.id)
      const score = Math.min(currentExamFullScore.value, Math.max(0, rawScore))
      if (existing && existing.status !== 'submitted') {
        store.updateExamScore(existing.id, { score, gradedAt: new Date().toISOString().split('T')[0] })
      } else if (!existing) {
        store.addExamScore({
          id: `exam-${courseId.value}-${student.id}-${selectedExam.value}-${Date.now()}`,
          courseId: courseId.value,
          studentId: student.id,
          examName: selectedExam.value,
          score,
          fullScore: currentExamFullScore.value,
          weight: currentExamWeight.value,
          type: examType,
          status: 'draft',
          createdAt: new Date().toISOString().split('T')[0],
          gradedAt: '',
        })
      }
      imported++
    }
    alert(`导入成功！共导入 ${imported} 名学生的成绩`)
    input.value = ''
  } catch (err) {
    console.error('Excel 导入失败:', err)
    alert('Excel 导入失败，请检查文件格式')
    input.value = ''
  }
}

async function handleDownloadTemplate() {
  if (!courseId.value || !selectedExam.value) {
    alert('请先选择一个考试/项目')
    return
  }
  try {
    const XLSX = await import('xlsx')
    const data = enrolledStudents.value.map(({ student }) => ({
      '学生姓名': student!.name,
      '学生学号': student!.id,
      [selectedExam.value]: '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '成绩')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buf], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedExam.value}-成绩模板.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('下载模板失败:', err)
    alert('下载模板失败')
  }
}

const enabledTypes = computed(() => baseEnabledTypes.value.filter((t) => {
  if ((t === 'intra_group' || t === 'inter_group') && !courseHasGroups.value) return false
  if (t === 'mentor' && !selectedConfig.value?.hasMentor) return false
  return true
}))

const filteredEvalTypes = computed(() => enabledTypes.value.filter((t) => true))

const displaySessions = computed(() => {
  const count = Math.min(totalSessions.value, 3)
  return Array.from({ length: count }, (_, i) => i + 1)
})

const enrolledStudents = computed(() => {
  if (!courseId.value) return []
  return store.enrollments
    .filter((e) => e.courseId === courseId.value && e.status !== 'dropped')
    .map((e) => ({
      enrollmentId: e.id,
      student: store.students.find((s) => s.id === e.studentId),
    }))
    .filter((e) => e.student)
})

const studentSections = computed(() => {
  if (!courseId.value) return []
  const search = studentSearch.value.trim().toLowerCase()

  const enrolled = store.enrollments
    .filter((e) => e.courseId === courseId.value && e.status !== 'dropped')
    .map((e) => ({
      enrollmentId: e.id,
      student: store.students.find((s) => s.id === e.studentId),
    }))
    .filter((e) => e.student) as { enrollmentId: string; student: NonNullable<ReturnType<typeof store.students.find>> }[]

  const filtered = search
    ? enrolled.filter(({ student }) => student.name.toLowerCase().includes(search) || student.id.includes(search))
    : enrolled

  const groups = store.studentGroups.filter((g) => g.courseId === courseId.value)
  const memberToGroup = new Map<string, string>()
  const groupIdMap = new Map<string, string>()
  for (const g of groups) {
    for (const mid of g.memberIds) {
      memberToGroup.set(mid, g.name)
      groupIdMap.set(mid, g.id)
    }
  }

  const groupedMap = new Map<string, { groupId: string; students: typeof filtered }>()
  const ungrouped: typeof filtered = []
  for (const item of filtered) {
    const groupName = memberToGroup.get(item.student.id)
    const groupId = groupIdMap.get(item.student.id) || ''
    if (groupName && groupId) {
      if (!groupedMap.has(groupName)) groupedMap.set(groupName, { groupId, students: [] })
      groupedMap.get(groupName)!.students.push(item)
    } else {
      ungrouped.push(item)
    }
  }

  const sections: { groupId: string; groupName: string; students: typeof filtered }[] = []
  for (const g of groups) {
    const entry = groupedMap.get(g.name)
    if (entry) {
      sections.push({ groupId: g.id, groupName: g.name, students: entry.students })
      groupedMap.delete(g.name)
    } else {
      sections.push({ groupId: g.id, groupName: g.name, students: [] })
    }
  }
  if (ungrouped.length > 0) {
    sections.push({ groupId: '', groupName: '未分组', students: ungrouped })
  }
  return sections
})

function getStudentEvals(studentId: string, sessionNumber?: number, type?: EvalType): Evaluation[] {
  return store.evaluations.filter((e) => {
    if (e.courseId !== courseId.value || e.studentId !== studentId) return false
    if (sessionNumber && e.sessionNumber !== sessionNumber) return false
    if (type && e.type !== type) return false
    return true
  })
}

function getStudentEvalCount(studentId: string): number {
  return store.evaluations.filter((e) => e.courseId === courseId.value && e.studentId === studentId && e.type === 'self').length
}

function getAvgScore(studentId: string, sessionNumber: number, type: EvalType): number | null {
  const evals = getStudentEvals(studentId, sessionNumber, type)
  if (evals.length === 0) return null
  return Math.round(evals.reduce((a, e) => a + e.score, 0) / evals.length)
}

function getScoreDisplay(studentId: string, sessionNumber: number, type: EvalType): string {
  const v = getAvgScore(studentId, sessionNumber, type)
  return v !== null ? `${v}分` : '-'
}

function scoreCellClass(studentId: string, sessionNumber: number, type: EvalType): string {
  const v = getAvgScore(studentId, sessionNumber, type)
  if (v === null) return 'text-brand-400/60'
  if (v >= 85) return 'text-brand-600'
  if (v >= 60) return 'text-brand-600'
  return 'text-brand-600'
}

function getStudentTotalAvg(studentId: string): string {
  let total = 0; let count = 0
  displaySessions.value.forEach((s) => {
    filteredEvalTypes.value.forEach((t) => {
      const v = getAvgScore(studentId, s, t)
      if (v !== null) { total += v; count++ }
    })
  })
  return count > 0 ? `${Math.round(total / count)}分` : '-'
}

function totalScoreColor(val: string | number): string {
  if (val === '-') return '#9ca3af'
  const n = parseInt(String(val))
  if (n >= 85) return '#1E88E5'
  if (n >= 60) return '#1E88E5'
  return '#1E88E5'
}

function getEnrollStatus(studentId: string): { label: string; color: string; progress: number } {
  const enr = store.enrollments.find((e) => e.courseId === courseId.value && e.studentId === studentId)
  if (!enr) return { label: '未知', color: 'bg-brand-400/10 text-brand-400', progress: 0 }
  const map: Record<string, { label: string; color: string }> = {
    enrolled:     { label: '已报名',    color: 'bg-brand-600/10 text-brand-600' },
    in_progress:  { label: '学习中',    color: 'bg-brand-400/10 text-brand-600' },
    completed:    { label: '已完成',    color: 'bg-brand-400/10 text-brand-600' },
    dropped:      { label: '已退课',    color: 'bg-brand-600/10 text-brand-600' },
  }
  return { ...map[enr.status] || { label: '未知', color: 'bg-brand-400/10 text-brand-400' }, progress: enr.progress || 0 }
}

const handleSetConfig = (updates: Partial<import('@/types').EvaluationConfig>) => {
  if (!courseId.value) return
  const existing = store.evalConfigs.find((c) => c.courseId === courseId.value)
  const config = {
    courseId: courseId.value,
    template: existing?.template || 'standard',
    frequency: existing?.frequency || 'biweekly',
    hasMentor: existing?.hasMentor ?? false,
    overdueRule: existing?.overdueRule || 'average',
    ...existing,
    ...updates,
  }
  store.setEvalConfig(config)
  store.markConfigCompleted(courseId.value, 'evalConfig')
}

const handleBatchEval = (level: string) => {
  if (!courseId.value) return
  const range = LEVEL_OPTIONS.find((o) => o.label === level)?.range
  if (!range) return
  const score = Math.round((range[0] + range[1]) / 2)
  const session = selectedBatchSession.value
  const type: EvalType = isMentor.value ? 'mentor' : 'teacher'

  selectedStudentIds.value.forEach((studentId) => {
    if (store.isSessionLocked(courseId.value || '', session) ||
        store.isTeacherEvalSubmitted(courseId.value || '', studentId, session, type)) return
    const existing = store.evaluations.find(
      (e) => e.courseId === courseId.value && e.studentId === studentId && e.type === type && e.sessionNumber === session
    )
    const ev: Evaluation = {
      id: existing ? existing.id : `ev-batch-${Date.now()}-${studentId}-${type}`,
      courseId: courseId.value,
      studentId,
      sessionNumber: session,
      type,
      score,
      evaluatorId: store.currentUser || '',
      evaluatorName: store.currentUser || (isMentor.value ? '企业导师' : '教师'),
      comment: level,
      createdAt: new Date().toISOString().split('T')[0],
    }
    if (existing) {
      store.updateEvaluation(ev.id, { score, comment: level, createdAt: ev.createdAt })
    } else {
      store.addEvaluation(ev)
    }
  })
  evalScoreInputs.value = {}
  store.markSessionEvalRemindersCompleted(courseId.value, session)
  render()
}

function handleSaveEvalScores() {
  if (!courseId.value) return
  const session = selectedBatchSession.value
  const type: EvalType = isMentor.value ? 'mentor' : 'teacher'
  Object.entries(evalScoreInputs.value).forEach(([studentId, score]) => {
    if (store.isSessionLocked(courseId.value || '', session) ||
        store.isTeacherEvalSubmitted(courseId.value || '', studentId, session, type)) return
    const existing = store.evaluations.find(
      (e) => e.courseId === courseId.value && e.studentId === studentId && e.type === type && e.sessionNumber === session
    )
    const ev: Evaluation = {
      id: existing ? existing.id : `ev-manual-${Date.now()}-${studentId}-${type}`,
      courseId: courseId.value,
      studentId,
      sessionNumber: session,
      type,
      score,
      evaluatorId: store.currentUser || '',
      evaluatorName: store.currentUser || (isMentor.value ? '企业导师' : '教师'),
      createdAt: new Date().toISOString().split('T')[0],
    }
    if (existing) {
      store.updateEvaluation(ev.id, { score, createdAt: ev.createdAt })
    } else {
      store.addEvaluation(ev)
    }
  })
  evalScoreInputs.value = {}
  render()
}

function handleSubmitAll() {
  if (!courseId.value) return
  const session = selectedBatchSession.value
  const type: EvalType = isMentor.value ? 'mentor' : 'teacher'

  handleSaveEvalScores()

  const allStudents = store.enrollments
    .filter((e) => e.courseId === courseId.value && e.status !== 'dropped')
    .map((e) => e.studentId)
  for (const studentId of allStudents) {
    if (store.isSessionLocked(courseId.value || '', session) ||
        store.isTeacherEvalSubmitted(courseId.value || '', studentId, session, type)) continue
    const hasEval = store.evaluations.some(
      (e) => e.courseId === courseId.value && e.studentId === studentId && e.type === type && e.sessionNumber === session
    )
    if (hasEval) {
      store.submitTeacherEval(courseId.value, studentId, session, type)
    }
  }

  store.markSessionEvalRemindersCompleted(courseId.value, session)
  render()
}

const toggleAll = () => {
  if (isAllSelected.value) {
    selectedStudentIds.value = []
  } else {
    const allIds: string[] = []
    for (const section of evalTableSections.value) {
      for (const s of section.students) {
        if (!s.submitted) allIds.push(s.student.id)
      }
    }
    selectedStudentIds.value = allIds
  }
  render()
}

const selectedUnsubmittedCount = computed(() => {
  return selectedStudentIds.value.length
})

function handleSessionSelect(session: number) {
  if (!courseId.value) return
  store.autoLockPreviousSession(courseId.value, session)
  selectedBatchSession.value = session
  render()
}

function isSessionDisabled(session: number): boolean {
  if (!courseId.value) return true
  if (store.isSessionLocked(courseId.value, session)) return true
  if (!store.isSessionTime(courseId.value, session)) return true
  if (session === totalSessions.value && isFinalSessionExpired.value) return true
  return false
}

function isSessionTime(session: number): boolean {
  if (!courseId.value) return true
  return store.isSessionTime(courseId.value, session)
}

const isFinalSessionExpired = computed(() => {
  if (!courseId.value) return false
  return store.isFinalSessionDeadlinePassed(courseId.value, totalSessions.value)
})

function getSessionTitle(session: number): string {
  if (!courseId.value) return ''
  if (store.isSessionLocked(courseId.value, session)) return '该轮次已锁定，不可修改'
  if (!store.isSessionTime(courseId.value, session)) return session === 1 ? '第一节课尚未开始' : '该轮次尚未到开启时间'
  if (session === totalSessions.value && isFinalSessionExpired.value) return '课程已结束，最终评价已截止'
  return ''
}

const hasSubmittable = computed(() => submittableCount.value > 0)

const submittableCount = computed(() => {
  const session = selectedBatchSession.value
  let count = 0
  for (const section of evalTableSections.value) {
    for (const s of section.students) {
      if (s.submitted) continue
      if (s.hasDraft) count++
    }
  }
  return count
})

const handleProcessOverdue = () => {
  if (!courseId.value) return
  for (let s = 1; s <= totalSessions.value; s++) {
    store.processSessionOverdue(courseId.value, s)
  }
  const students = enrolledStudents.value.map(({ student }) => student).filter(Boolean)
  for (const s of students) {
    for (let sn = 1; sn <= totalSessions.value; sn++) {
      store.markEvalReminderCompleted(courseId.value, s!.id, sn)
    }
  }
  render()
}

function getStudentName(studentId: string): string {
  const student = store.students.find((s) => s.id === studentId)
  return student?.name || studentId
}

function getStudentGroupId(studentId: string): string | null {
  for (const g of store.studentGroups) {
    if (g.memberIds.includes(studentId)) return g.id
  }
  return null
}

function handleRemoveStudentFromGroup(studentId: string) {
  for (const g of store.studentGroups) {
    if (g.memberIds.includes(studentId)) {
      store.updateStudentGroup(g.id, {
        memberIds: g.memberIds.filter((id) => id !== studentId),
      })
      break
    }
  }
  render()
}

function handleEditStudent(student: import('@/types').Student) {
  editingStudent.value = student
  editStudentName.value = student.name
  editStudentIdField.value = student.id
  const group = store.studentGroups.find(g => g.courseId === courseId.value && g.memberIds.includes(student.id))
  editStudentGroupId.value = group?.id || ''
  showEditStudentModal.value = true
  render()
}

function handleSaveEditStudent() {
  if (!editingStudent.value || !editStudentName.value.trim()) return
  const student = editingStudent.value
  const newId = editStudentIdField.value.trim() || student.id
  if (newId !== student.id && store.students.some((s) => s.id === newId)) {
    alert('该学号已被其他学生使用')
    return
  }
  const oldId = student.id
  store.updateStudent(oldId, { name: editStudentName.value.trim(), id: newId })

  if (newId !== oldId) {
    store.enrollments.forEach((e) => {
      if (e.studentId === oldId) {
        store.updateEnrollment(e.id, { studentId: newId })
      }
    })
    store.evaluations.forEach((ev) => {
      if (ev.studentId === oldId) {
        store.updateEvaluation(ev.id, { studentId: newId })
      }
      if (ev.evaluatorId === oldId) {
        store.updateEvaluation(ev.id, { evaluatorId: newId })
      }
    })
    const examScores = (store as any).examScores?.value || []
    examScores.forEach((s: any) => {
      if (s.studentId === oldId) {
        ;(store as any).examScores.value = examScores.map((es: any) =>
          es.id === s.id ? { ...es, studentId: newId } : es
        )
      }
    })
    const evalReminders = (store as any).evalReminders?.value || []
    ;(store as any).evalReminders.value = evalReminders.map((r: any) => {
      if (r.studentId === oldId) return { ...r, studentId: newId }
      return r
    })
    store.studentGroups.forEach((g) => {
      if (g.memberIds.includes(oldId)) {
        store.updateStudentGroup(g.id, {
          memberIds: g.memberIds.map((id) => (id === oldId ? newId : id)),
        })
      }
    })
    try {
      localStorage.setItem('examScores', JSON.stringify((store as any).examScores?.value || []))
      localStorage.setItem('evalReminders', JSON.stringify((store as any).evalReminders?.value || []))
    } catch {}
  }

  const currentGroup = store.studentGroups.find(g => g.courseId === courseId.value && g.memberIds.includes(newId))
  const currentGroupId = currentGroup?.id || ''
  if (currentGroupId !== editStudentGroupId.value) {
    if (currentGroupId) {
      store.updateStudentGroup(currentGroupId, {
        memberIds: currentGroup!.memberIds.filter((id) => id !== newId),
      })
    }
    if (editStudentGroupId.value) {
      const newGroup = store.studentGroups.find((g) => g.id === editStudentGroupId.value)
      if (newGroup) {
        store.updateStudentGroup(newGroup.id, {
          memberIds: [...newGroup.memberIds, newId],
        })
      }
    }
  }

  showEditStudentModal.value = false
  editingStudent.value = null
  editStudentName.value = ''
  editStudentIdField.value = ''
  editStudentGroupId.value = ''
  render()
}

function handleRemoveStudent(studentId: string) {
  if (!courseId.value) return
  if (!confirm('确定将该学生删除并从课程中移除？')) return
  handleRemoveStudentFromGroup(studentId)
  const enrollment = store.enrollments.find(
    (e) => e.courseId === courseId.value && e.studentId === studentId && e.status !== 'dropped'
  )
  if (enrollment) {
    store.deleteEnrollment(enrollment.id)
  }
  render()
}

function handleAddSingleStudent() {
  if (!courseId.value || !newStudentName.value.trim()) return
  const name = newStudentName.value.trim()
  let student = store.students.find((s) => s.name === name || (newStudentId.value.trim() && s.id === newStudentId.value.trim()))
  if (!student) {
    const id = newStudentId.value.trim() || `stu-${Date.now()}`
    store.addStudent({ id, name, phone: '', email: '', avatar: '', joinDate: new Date().toISOString().split('T')[0], status: 'active' })
    student = store.students.find((s) => s.id === id)!
  }
  const exists = store.enrollments.some(
    (e) => e.courseId === courseId.value && e.studentId === student!.id && e.status !== 'dropped'
  )
  if (exists) {
    alert('该学生已在课程中')
    return
  }
  store.addEnrollment({
    id: `enr-${courseId.value}-${student!.id}-${Date.now()}`,
    courseId: courseId.value,
    studentId: student!.id,
    scheduleId: '',
    status: 'enrolled',
    progress: 0,
    enrollDate: new Date().toISOString().split('T')[0],
  })
  showAddStudentModal.value = false
  newStudentName.value = ''
  newStudentId.value = ''
  render()
}

async function handleImportStudentsExcel(event: Event) {
  if (!courseId.value) return
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  try {
    const buf = await file.arrayBuffer()
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data: Record<string, string>[] = XLSX.utils.sheet_to_json(ws)
    const keys = Object.keys(data[0] || {})
    if (keys.length < 1) {
      alert('Excel 格式不正确，请确保第一列为学生姓名')
      return
    }
    const nameKey = keys[0]
    const idKey = keys.length >= 2 ? keys[1] : null
    let imported = 0
    for (const row of data) {
      const name = String(row[nameKey] || '').trim()
      if (!name) continue
      const rawId = idKey ? String(row[idKey] || '').trim() : ''
      let student = rawId
        ? store.students.find((s) => s.id === rawId || s.name === name)
        : store.students.find((s) => s.name === name)
      if (!student) {
        const id = rawId || `stu-${Date.now()}-${imported}`
        store.addStudent({ id, name, phone: '', email: '', avatar: '', joinDate: new Date().toISOString().split('T')[0], status: 'active' })
        student = store.students.find((s) => s.id === id)!
      }
      const exists = store.enrollments.some(
        (e) => e.courseId === courseId.value && e.studentId === student!.id && e.status !== 'dropped'
      )
      if (exists) continue
      store.addEnrollment({
        id: `enr-${courseId.value}-${student!.id}-${Date.now()}-${imported}`,
        courseId: courseId.value,
        studentId: student!.id,
        scheduleId: '',
        status: 'enrolled',
        progress: 0,
        enrollDate: new Date().toISOString().split('T')[0],
      })
      imported++
    }
    alert(`导入成功！共导入 ${imported} 名学生`)
  } catch (err) {
    console.error('Excel 导入失败:', err)
    alert('Excel 导入失败，请检查文件格式')
  }
  input.value = ''
}

function openNewGroupModal() {
  editingGroup.value = null
  groupFormName.value = ''
  groupFormMembers.value = []
  showGroupModal.value = true
  render()
}

function openEditGroupModal(group: import('@/types').StudentGroup) {
  editingGroup.value = group
  groupFormName.value = group.name
  groupFormMembers.value = [...group.memberIds]
  showGroupModal.value = true
  render()
}

function handleSaveGroup() {
  if (!courseId.value || !groupFormName.value.trim()) {
    alert('请输入组名')
    return
  }
  const name = groupFormName.value.trim()
  if (editingGroup.value) {
    store.updateStudentGroup(editingGroup.value.id, {
      name,
      memberIds: groupFormMembers.value,
    })
  } else {
    store.addStudentGroup({
      id: `group-${courseId.value}-${Date.now()}`,
      courseId: courseId.value,
      name,
      memberIds: groupFormMembers.value,
    })
  }
  showGroupModal.value = false
  editingGroup.value = null
  groupFormName.value = ''
  groupFormMembers.value = []
  render()
}

function handleDeleteGroup(groupId: string) {
  if (!confirm('确定删除该分组？')) return
  store.deleteStudentGroup(groupId)
  render()
}

async function handleImportGroupsExcel(event: Event) {
  if (!courseId.value) return
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  const file = input.files[0]
  try {
    const buf = await file.arrayBuffer()
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data: Record<string, string>[] = XLSX.utils.sheet_to_json(ws)
    const keys = Object.keys(data[0] || {})
    if (keys.length < 2) {
      alert('Excel 格式不正确，请确保第一列为组名，第二列及之后为学生姓名/学号')
      return
    }
    const groupNameKey = keys[0]
    const groupMap = new Map<string, string[]>()
    for (const row of data) {
      const groupName = String(row[groupNameKey] || '').trim()
      if (!groupName) continue
      for (let i = 1; i < keys.length; i++) {
        const studentRef = String(row[keys[i]] || '').trim()
        if (!studentRef) continue
        if (!groupMap.has(groupName)) groupMap.set(groupName, [])
        const student = store.students.find(
          (s) => s.name === studentRef || s.id === studentRef
        )
        if (student) {
          groupMap.get(groupName)!.push(student.id)
        }
      }
    }
    let imported = 0
    for (const [name, memberIds] of groupMap) {
      const existing = store.studentGroups.find(
        (g) => g.courseId === courseId.value && g.name === name
      )
      if (existing) {
        const merged = Array.from(new Set([...existing.memberIds, ...memberIds]))
        store.updateStudentGroup(existing.id, { memberIds: merged })
      } else {
        store.addStudentGroup({
          id: `group-${courseId.value}-${Date.now()}-${imported}`,
          courseId: courseId.value,
          name,
          memberIds: Array.from(new Set(memberIds)),
        })
      }
      imported++
    }
    alert(`导入成功！共导入 ${imported} 个分组`)
  } catch (err) {
    console.error('Excel 导入失败:', err)
    alert('Excel 导入失败，请检查文件格式')
  }
  input.value = ''
}

// ====== D3 渲染函数 ======

function renderFileSpreadsheetIcon(parent: d3.Selection<any, any, any, any>, className?: string) {
  const svg = parent.append('svg')
    .attr('viewBox', '0 0 24 24')
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', '2')
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
  if (className) svg.attr('class', className)
  svg.html('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 12h8"/><path d="M8 16h8"/><path d="M8 20h8"/>')
  return svg
}

function renderPlusIconSvg(parent: d3.Selection<any, any, any, any>, className?: string) {
  const svg = parent.append('svg')
    .attr('viewBox', '0 0 24 24')
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', '2')
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
  if (className) svg.attr('class', className)
  svg.html('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>')
  return svg
}

function render() {
  const root = document.getElementById('teacher-course-detail-root')
  if (!root) return
  const sel = d3.select(root)
  sel.selectAll('*').remove()

  const container = sel.append('div').attr('class', 'space-y-6')

  // ===== 返回按钮 + 课程信息 =====
  renderHeader(container)

  // ===== 已结束只读提示 =====
  if (isReadOnly.value) {
    renderReadOnlyBanner(container)
  }

  // ===== Tab 切换 =====
  renderTabBar(container)

  // ===== Tab 内容 =====
  if (activeTab.value === 'comments') {
    renderCommentsTab(container)
  } else if (activeTab.value === 'grades') {
    // 成绩管理 Tab - 显示提示
    const panel = container.append('div')
      .attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-6 text-center text-brand-400')
    panel.append('p').text('成绩管理内容加载中...')
  } else if (activeTab.value === 'students') {
    // 学员管理 Tab - 显示提示
    const panel = container.append('div')
      .attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-6 text-center text-brand-400')
    panel.append('p').text('学员管理内容加载中...')
  }
}

function renderHeader(container: d3.Selection<any, any, any, any>) {
  const topRow = container.append('div').attr('class', 'flex items-center gap-3')

  const backBtn = topRow.append('button')
    .attr('class', 'p-2 rounded-lg hover:bg-brand-400/10 transition-colors')
    .on('click', () => router.back())
  renderIcon(backBtn, 'arrowLeft', 'w-5 h-5 text-brand-400')

  const infoDiv = topRow.append('div').attr('class', 'flex-1')
  infoDiv.append('h1').attr('class', 'text-2xl font-bold text-brand-900').text(course.value?.title || '课程详情')
  infoDiv.append('p').attr('class', 'text-brand-400 mt-1').text(`${course.value?.id} · ${course.value?.duration}课时`)

  const statusClass = course.value?.status === 'active' ? 'bg-brand-600/10 text-brand-600' : 'bg-brand-400/10 text-brand-400'
  topRow.append('span')
    .attr('class', `text-xs px-2 py-0.5 rounded-full ${statusClass}`)
    .text(course.value?.status === 'active' ? '进行中' : '已结束')
}

function renderReadOnlyBanner(container: d3.Selection<any, any, any, any>) {
  const banner = container.append('div').attr('class', 'flex items-center gap-2 px-4 py-3 bg-brand-400/10 border border-brand-400/30 rounded-xl text-sm text-brand-400')
  renderIcon(banner, 'eye', 'w-4 h-4 text-brand-400')
  banner.append('span').html('该课程已结束，当前为<strong>只读查看</strong>模式，无法进行配置修改操作')
}

function renderTabBar(container: d3.Selection<any, any, any, any>) {
  const tabBar = container.append('div').attr('class', 'flex gap-1 border-b border-brand-400/30')
  tabList.forEach((tab) => {
    const isActive = activeTab.value === tab.key
    const btn = tabBar.append('button')
      .attr('class', `px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${isActive ? 'bg-white text-brand-600 border border-b-0 border-brand-400/30 -mb-px' : 'text-brand-400 hover:text-brand-800'}`)
      .on('click', () => { activeTab.value = tab.key; render() })
    renderIcon(btn, tab.icon, 'w-4 h-4 inline mr-1.5')
    btn.append('span').text(tab.label)
  })
}

function renderCommentsTab(container: d3.Selection<any, any, any, any>) {
  const tabContent = container.append('div').attr('class', 'space-y-6')

  // 评价方案配置
  renderEvalConfigCard(tabContent)

  // 评价管理
  if (!isReadOnly.value) {
    renderEvalManagementCard(tabContent)
  }
}

function renderEvalManagementCard(container: d3.Selection<any, any, any, any>) {
  const card = container.append('div')
    .attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-5')
  card.append('h3').attr('class', 'text-sm font-semibold text-brand-900 mb-3').text('评价管理')
  card.append('p').attr('class', 'text-sm text-brand-400').text('评价管理功能内容加载中...')
}

function renderEvalConfigCard(container: d3.Selection<any, any, any, any>) {
  const card = container.append('div').attr('class', 'bg-white rounded-xl border border-brand-400/20 shadow-sm p-5')

  const headerBtn = card.append('button')
    .attr('class', 'w-full flex items-center justify-between')
    .on('click', () => {
      if (isReadOnly.value || evalConfigLocked.value || isMentor.value) return
      showSettings.value = !showSettings.value
      render()
    })

  const left = headerBtn.append('div').attr('class', 'flex items-center gap-2')
  renderIcon(left, 'settings', 'w-5 h-5 text-brand-400')
  left.append('h2').attr('class', 'font-semibold text-brand-900').text('评价方案配置')

  const right = headerBtn.append('div').attr('class', 'flex items-center gap-3')

  // 锁定标签
  if (evalConfigLocked.value || isMentor.value) {
    const lockSpan = right.append('span').attr('class', 'text-xs px-2 py-0.5 rounded-full bg-brand-400/10 text-brand-400 border border-brand-400/30')
    renderIcon(lockSpan, 'lock', 'w-3 h-3 inline mr-0.5')
    lockSpan.append('span').text('仅查看')
  }

  right.append('span').attr('class', 'text-xs text-brand-400')
    .text(`${selectedConfig.value ? EvalTemplateLabels[selectedConfig.value.template] : '默认方案'} · ${selectedConfig.value ? EvalFrequencyLabels[selectedConfig.value.frequency] : '默认频率'}`)

  if (!isReadOnly.value && !evalConfigLocked.value && !isMentor.value) {
    right.append('span').attr('class', 'text-xs text-brand-400 hover:text-brand-600')
      .text(showSettings.value ? '收起 ▲' : '展开 ▼')
  }
  if (isReadOnly.value || evalConfigLocked.value || isMentor.value) {
    right.append('span').attr('class', 'text-xs text-brand-400/60').text('仅查看')
  }

  // 锁定提示
  if (evalConfigLocked.value) {
    const lockHint = card.append('div').attr('class', 'mt-3 flex items-center gap-2 px-3 py-2 bg-brand-400/10 border border-brand-400/30 rounded-lg text-xs text-brand-400')
    renderIcon(lockHint, 'lock', 'w-3.5 h-3.5 text-brand-400')
    if (selectedConfig.value) {
      lockHint.append('span').text('评价方案已在第一节课开始前配置完成，已锁定不可修改。')
    } else {
      lockHint.append('span').text('第一节课已开始，评价方案未配置，现按默认方案实施，已锁定不可修改。')
    }
  }

  // 评价类型标签
  const tagWrap = card.append('div').attr('class', 'flex flex-wrap gap-2 mt-3 mb-1')
  ALL_EVAL_TYPES.forEach((t) => {
    if (!selectedConfig.value || !TEMPLATE_EVAL_TYPES[selectedConfig.value.template].includes(t)) {
      tagWrap.append('span')
        .attr('class', 'text-xs px-2.5 py-1 rounded-full bg-brand-400/10 text-brand-400/60 border border-brand-400/30')
        .text(`${EvalTypeLabels[t]} ✗`)
    } else if (((t === 'intra_group' || t === 'inter_group') && !courseHasGroups.value) || (t === 'mentor' && selectedConfig.value && !selectedConfig.value.hasMentor)) {
      const span = tagWrap.append('span')
        .attr('class', 'text-xs px-2.5 py-1 rounded-full bg-brand-400/10 text-brand-400 border border-brand-400/50')
      renderIcon(span, 'eyeOff', 'w-3 h-3 inline mr-0.5')
      span.append('span').text(`${EvalTypeLabels[t]}（自动隐藏）`)
    } else {
      const span = tagWrap.append('span')
        .attr('class', `text-xs px-2.5 py-1 rounded-full border ${EvalTypeColors[t]}`)
      renderIcon(span, 'eye', 'w-3 h-3 inline mr-0.5')
      span.append('span').text(EvalTypeLabels[t])
    }
  })

  // 配置编辑区域
  if (showSettings.value && !isReadOnly.value && !evalConfigLocked.value && !isMentor.value) {
    renderEvalSettings(card)
  } else if ((isReadOnly.value || evalConfigLocked.value) && showSettings.value) {
    const readonlyArea = card.append('div').attr('class', 'border-t border-brand-400/20 mt-3 pt-4 text-sm text-brand-400 text-center py-4')
    renderIcon(readonlyArea, 'eyeOff', 'w-5 h-5 inline mr-1')
    readonlyArea.append('span').text(isReadOnly.value ? '已结束课程不可修改配置' : '第一节课已开始，评价方案已锁定不可修改')
  }
}

function renderEvalSettings(card: d3.Selection<any, any, any, any>) {
  const area = card.append('div').attr('class', 'border-t border-brand-400/20 mt-3 pt-4 space-y-4')

  // 评价模板
  const tplDiv = area.append('div')
  tplDiv.append('p').attr('class', 'text-sm font-medium text-brand-800 mb-2').text('评价模板')
  const tplGrid = tplDiv.append('div').attr('class', 'grid grid-cols-1 md:grid-cols-2 gap-2')

  EVAL_TEMPLATE_KEYS.forEach((tpl) => {
    const isSelected = selectedConfig.value?.template === tpl
    const btn = tplGrid.append('button')
      .attr('class', `text-left p-3 rounded-lg border transition-all ${isSelected ? 'border-brand-600 bg-brand-400/10' : 'border-brand-400/30 bg-white hover:border-brand-400'}`)
      .on('click', () => { handleSetConfig({ template: tpl }); render() })

    btn.append('span').attr('class', 'text-sm font-medium text-brand-900').text(EvalTemplateLabels[tpl])
    btn.append('p').attr('class', 'text-xs text-brand-400 mt-0.5').text(EvalTemplateDescs[tpl])

    const tagRow = btn.append('div').attr('class', 'flex gap-1 mt-1')
    TEMPLATE_EVAL_TYPES[tpl].forEach((et) => {
      tagRow.append('span').attr('class', 'text-[10px] px-1.5 py-0.5 rounded bg-brand-400/10 text-brand-400').text(EvalTypeLabels[et])
    })
  })

  // 评价频率
  const freqDiv = area.append('div')
  freqDiv.append('p').attr('class', 'text-sm font-medium text-brand-800 mb-2').text('评价频率')
  const freqGrid = freqDiv.append('div').attr('class', 'grid grid-cols-1 md:grid-cols-2 gap-2')

  EVAL_FREQUENCY_KEYS.forEach((freq) => {
    const isSelected = selectedConfig.value?.frequency === freq
    const btn = freqGrid.append('button')
      .attr('class', `text-left p-3 rounded-lg border transition-all ${isSelected ? 'border-brand-600 bg-brand-400/10' : 'border-brand-400/30 bg-white hover:border-brand-400'}`)
      .on('click', () => { handleSetConfig({ frequency: freq }); render() })

    btn.append('span').attr('class', 'text-sm font-medium text-brand-900').text(EvalFrequencyLabels[freq])
    btn.append('p').attr('class', 'text-xs text-brand-400 mt-0.5').text(EvalFrequencyDescs[freq])
    btn.append('span').attr('class', 'text-xs text-brand-400 mt-0.5 block')
      .text(`共 ${courseId.value ? store.getEvalSessions(courseId.value) : 0} 次评价`)
  })

  // 自定义次数
  if (selectedConfig.value?.frequency === 'custom') {
    const customDiv = area.append('div').attr('class', 'mt-2')
    customDiv.append('label').attr('class', 'text-xs text-brand-400').text('自定义评价次数：')
    customDiv.append('input')
      .attr('type', 'number').attr('min', '1').attr('max', '20')
      .attr('class', 'ml-2 w-16 px-2 py-1 border border-brand-400/30 rounded-lg text-sm')
      .property('value', selectedConfig.value?.customSessions || 3)
      .on('change', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value) || 3
        handleSetConfig({ customSessions: val })
        render()
      })
  }

  // 企业导师开关
  const mentorRow = area.append('div').attr('class', 'flex items-center gap-3')
  mentorRow.append('label').attr('class', 'text-sm font-medium text-brand-800').text('企业导师参与评价')
  const toggle = mentorRow.append('input')
    .attr('type', 'checkbox')
    .attr('class', 'w-4 h-4 text-brand-600 border-brand-400/50 rounded focus:ring-brand-600')
    .property('checked', selectedConfig.value?.hasMentor ?? false)
    .on('change', (e) => {
      handleSetConfig({ hasMentor: (e.target as HTMLInputElement).checked })
      render()
    })
  mentorRow.append('label').attr('class', 'ml-2 text-sm text-brand-400').text('(企业导师可以对学员进行评价)')
}

// ===== 生命周期 =====
function renderPage() {
  const el = document.getElementById('teacher-course-detail-root')
  if (el) render()
}

onMounted(renderPage)
watch(activeTab, renderPage)
watch(showSettings, renderPage)
</script>
