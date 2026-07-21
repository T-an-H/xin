import { ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  Course, Category, Student, Schedule, Enrollment, Teacher, Grade,
  CloudFile, TodoItem, OnlineDoc, Note, Evaluation, EvaluationConfig,
  StudentGroup, EvalAnomaly, EvalReminder, GradeWeightConfig, DetailedGrade
} from '@/types'
import { getDefaultGradeConfig, TEMPLATE_EVAL_TYPES } from '@/types'
import {
  courses as mockCourses,
  categories as mockCategories,
  students as mockStudents,
  schedules as mockSchedules,
  enrollments as mockEnrollments,
  teachers as mockTeachers,
  grades as mockGrades,
  evaluationConfigs as mockEvalConfigs,
  evaluations as mockEvaluations,
  studentGroups as mockStudentGroups,
  detailedGrades as mockDetailedGrades
} from '@/data/mockData'

type UserRole = 'admin' | 'teacher' | 'student' | null

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

const saveToStorage = (key: string, data: unknown) => {
  localStorage.setItem(key, JSON.stringify(data))
}

export const useAppStore = defineStore('app', () => {
  // ====== State ======
  const courses = ref<Course[]>(loadFromStorage('courses', mockCourses))
  const categories = ref<Category[]>(loadFromStorage('categories', mockCategories))
  const students = ref<Student[]>(loadFromStorage('students', mockStudents))
  const schedules = ref<Schedule[]>(loadFromStorage('schedules', mockSchedules))
  const enrollments = ref<Enrollment[]>(loadFromStorage('enrollments', mockEnrollments))
  const teachers = ref<Teacher[]>(loadFromStorage('teachers', mockTeachers))
  const grades = ref<Grade[]>(loadFromStorage('grades', mockGrades))
  const cloudFiles = ref<CloudFile[]>(loadFromStorage<CloudFile[]>('cloudFiles', []))
  const todos = ref<TodoItem[]>(loadFromStorage<TodoItem[]>('todos', []))
  const onlineDocs = ref<OnlineDoc[]>(loadFromStorage<OnlineDoc[]>('onlineDocs', []))
  const notes = ref<Note[]>(loadFromStorage<Note[]>('notes', []))
  const evaluations = ref<Evaluation[]>(loadFromStorage<Evaluation[]>('evaluations', mockEvaluations))
  const evalConfigs = ref<EvaluationConfig[]>(loadFromStorage<EvaluationConfig[]>('evalConfigs', mockEvalConfigs))
  const studentGroups = ref<StudentGroup[]>(loadFromStorage<StudentGroup[]>('studentGroups', mockStudentGroups))
  const evalReminders = ref<EvalReminder[]>(loadFromStorage<EvalReminder[]>('evalReminders', []))
  const gradeConfigs = ref<Record<string, GradeWeightConfig>>(loadFromStorage<Record<string, GradeWeightConfig>>('gradeConfigs', {}))
  const detailedGrades = ref<DetailedGrade[]>(loadFromStorage<DetailedGrade[]>('detailedGrades', mockDetailedGrades))
  const isLoggedIn = ref<boolean>(loadFromStorage<boolean>('isLoggedIn', false))
  const currentUser = ref<string | null>(loadFromStorage<string | null>('currentUser', null))
  const currentRole = ref<UserRole>(loadFromStorage<UserRole>('currentRole', null))
  const hasEvalReminders = ref<boolean>(false)

  // ====== Actions ======

  function login(username: string, role: UserRole) {
    localStorage.setItem('isLoggedIn', JSON.stringify(true))
    localStorage.setItem('currentUser', JSON.stringify(username))
    localStorage.setItem('currentRole', JSON.stringify(role))
    isLoggedIn.value = true
    currentUser.value = username
    currentRole.value = role
  }

  function logout() {
    localStorage.setItem('isLoggedIn', JSON.stringify(false))
    localStorage.setItem('currentUser', JSON.stringify(null))
    localStorage.setItem('currentRole', JSON.stringify(null))
    isLoggedIn.value = false
    currentUser.value = null
    currentRole.value = null
  }

  function addCourse(course: Course) {
    courses.value = [...courses.value, course]
    saveToStorage('courses', courses.value)
    // 同步分类课程数量
    categories.value = categories.value.map((cat) =>
      cat.id === course.categoryId ? { ...cat, courseCount: cat.courseCount + 1 } : cat
    )
    saveToStorage('categories', categories.value)
    // 同步教师 courseIds
    teachers.value = teachers.value.map((t) =>
      t.name === course.teacher && !t.courseIds.includes(course.id)
        ? { ...t, courseIds: [...t.courseIds, course.id] }
        : t
    )
    saveToStorage('teachers', teachers.value)
  }

  function updateCourse(id: string, data: Partial<Course>) {
    const old = courses.value.find((c) => c.id === id)
    courses.value = courses.value.map((c) => (c.id === id ? { ...c, ...data } : c))
    saveToStorage('courses', courses.value)
    // 如果分类发生变化，同步分类课程数量
    if (old && data.categoryId && data.categoryId !== old.categoryId) {
      categories.value = categories.value.map((cat) => {
        if (cat.id === old.categoryId) return { ...cat, courseCount: Math.max(0, cat.courseCount - 1) }
        if (cat.id === data.categoryId) return { ...cat, courseCount: cat.courseCount + 1 }
        return cat
      })
      saveToStorage('categories', categories.value)
    }
    // 如果教师发生变化，同步教师 courseIds
    if (old && data.teacher && data.teacher !== old.teacher) {
      // 从旧教师中移除
      teachers.value = teachers.value.map((t) =>
        t.name === old.teacher ? { ...t, courseIds: t.courseIds.filter((cid) => cid !== id) } : t
      )
      // 添加到新教师
      teachers.value = teachers.value.map((t) =>
        t.name === data.teacher && !t.courseIds.includes(id)
          ? { ...t, courseIds: [...t.courseIds, id] }
          : t
      )
      saveToStorage('teachers', teachers.value)
    }
  }

  function deleteCourse(id: string) {
    const old = courses.value.find((c) => c.id === id)
    courses.value = courses.value.filter((c) => c.id !== id)
    saveToStorage('courses', courses.value)
    if (old) {
      // 同步分类课程数量
      categories.value = categories.value.map((cat) =>
        cat.id === old.categoryId ? { ...cat, courseCount: Math.max(0, cat.courseCount - 1) } : cat
      )
      saveToStorage('categories', categories.value)
      // 同步教师 courseIds
      teachers.value = teachers.value.map((t) =>
        t.name === old.teacher ? { ...t, courseIds: t.courseIds.filter((cid) => cid !== id) } : t
      )
      saveToStorage('teachers', teachers.value)
    }
  }

  function addCategory(category: Category) {
    categories.value = [...categories.value, category]
    saveToStorage('categories', categories.value)
  }

  function updateCategory(id: string, data: Partial<Category>) {
    categories.value = categories.value.map((c) => (c.id === id ? { ...c, ...data } : c))
    saveToStorage('categories', categories.value)
  }

  function deleteCategory(id: string) {
    categories.value = categories.value.filter((c) => c.id !== id)
    saveToStorage('categories', categories.value)
  }

  function addSchedule(schedule: Schedule) {
    schedules.value = [...schedules.value, schedule]
    saveToStorage('schedules', schedules.value)
  }

  function updateSchedule(id: string, data: Partial<Schedule>) {
    schedules.value = schedules.value.map((s) => (s.id === id ? { ...s, ...data } : s))
    saveToStorage('schedules', schedules.value)
  }

  function deleteSchedule(id: string) {
    schedules.value = schedules.value.filter((s) => s.id !== id)
    saveToStorage('schedules', schedules.value)
  }

  function updateEnrollment(id: string, data: Partial<Enrollment>) {
    enrollments.value = enrollments.value.map((e) => (e.id === id ? { ...e, ...data } : e))
    saveToStorage('enrollments', enrollments.value)
  }

  function addGrade(grade: Grade) {
    const course = courses.value.find(c => c.id === grade.courseId)
    if (course && course.status === 'inactive') {
      console.warn('Cannot modify ended course')
      return
    }
    grades.value = [...grades.value, grade]
    saveToStorage('grades', grades.value)
  }

  function updateGrade(id: string, data: Partial<Grade>) {
    const grade = grades.value.find(g => g.id === id)
    if (grade) {
      const course = courses.value.find(c => c.id === grade.courseId)
      if (course && course.status === 'inactive') {
        console.warn('Cannot modify ended course')
        return
      }
    }
    grades.value = grades.value.map((g) => (g.id === id ? { ...g, ...data } : g))
    saveToStorage('grades', grades.value)
  }

  function deleteGrade(id: string) {
    grades.value = grades.value.filter((g) => g.id !== id)
    saveToStorage('grades', grades.value)
  }

  function addCloudFile(file: CloudFile) {
    cloudFiles.value = [...cloudFiles.value, file]
    saveToStorage('cloudFiles', cloudFiles.value)
  }

  function deleteCloudFile(id: string) {
    cloudFiles.value = cloudFiles.value.filter((f) => f.id !== id)
    saveToStorage('cloudFiles', cloudFiles.value)
  }

  function addTodo(todo: TodoItem) {
    todos.value = [...todos.value, { ...todo, createdBy: currentUser.value || '未知' }]
    saveToStorage('todos', todos.value)
  }

  function updateTodo(id: string, data: Partial<TodoItem>) {
    todos.value = todos.value.map((t) => (t.id === id ? { ...t, ...data } : t))
    saveToStorage('todos', todos.value)
  }

  function deleteTodo(id: string) {
    todos.value = todos.value.filter((t) => t.id !== id)
    saveToStorage('todos', todos.value)
  }

  function addOnlineDoc(doc: OnlineDoc) {
    onlineDocs.value = [...onlineDocs.value, doc]
    saveToStorage('onlineDocs', onlineDocs.value)
  }

  function updateOnlineDoc(id: string, data: Partial<OnlineDoc>) {
    onlineDocs.value = onlineDocs.value.map((d) => (d.id === id ? { ...d, ...data } : d))
    saveToStorage('onlineDocs', onlineDocs.value)
  }

  function deleteOnlineDoc(id: string) {
    onlineDocs.value = onlineDocs.value.filter((d) => d.id !== id)
    saveToStorage('onlineDocs', onlineDocs.value)
  }

  function addNote(note: Note) {
    notes.value = [...notes.value, { ...note, createdBy: currentUser.value || '未知' }]
    saveToStorage('notes', notes.value)
  }

  function updateNote(id: string, data: Partial<Note>) {
    notes.value = notes.value.map((n) => (n.id === id ? { ...n, ...data } : n))
    saveToStorage('notes', notes.value)
  }

  function deleteNote(id: string) {
    notes.value = notes.value.filter((n) => n.id !== id)
    saveToStorage('notes', notes.value)
  }

  // ====== 评价系统 ======

  function addEvaluation(ev: Evaluation) {
    const course = courses.value.find(c => c.id === ev.courseId)
    if (course && course.status === 'inactive') {
      console.warn('Cannot modify ended course')
      return
    }
    evaluations.value = [...evaluations.value, ev]
    saveToStorage('evaluations', evaluations.value)
  }

  function updateEvaluation(id: string, data: Partial<Evaluation>) {
    const ev = evaluations.value.find(e => e.id === id)
    if (ev) {
      const course = courses.value.find(c => c.id === ev.courseId)
      if (course && course.status === 'inactive') {
        console.warn('Cannot modify ended course')
        return
      }
    }
    evaluations.value = evaluations.value.map((e) => (e.id === id ? { ...e, ...data } : e))
    saveToStorage('evaluations', evaluations.value)
  }

  function deleteEvaluation(id: string) {
    evaluations.value = evaluations.value.filter((e) => e.id !== id)
    saveToStorage('evaluations', evaluations.value)
  }

  function setEvalConfig(config: EvaluationConfig) {
    const existing = evalConfigs.value.findIndex((c) => c.courseId === config.courseId)
    if (existing >= 0) {
      evalConfigs.value = evalConfigs.value.map((c) => (c.courseId === config.courseId ? config : c))
    } else {
      evalConfigs.value = [...evalConfigs.value, config]
    }
    saveToStorage('evalConfigs', evalConfigs.value)
  }

  function addStudentGroup(group: StudentGroup) {
    studentGroups.value = [...studentGroups.value, group]
    saveToStorage('studentGroups', studentGroups.value)
  }

  function detectAnomalies(courseId: string, sessionNumber: number): EvalAnomaly[] {
    const course = courses.value.find((c) => c.id === courseId)
    if (!course) return []
    const anomalies: EvalAnomaly[] = []
    // 找出该课程此轮的所有自评
    const selfEvals = evaluations.value.filter(
      (e) => e.courseId === courseId && e.sessionNumber === sessionNumber && e.type === 'self'
    )
    // 找出所有非自评的评价
    const otherEvals = evaluations.value.filter(
      (e) => e.courseId === courseId && e.sessionNumber === sessionNumber && e.type !== 'self'
    )
    for (const self of selfEvals) {
      // 计算其他评价的平均分
      const related = otherEvals.filter((e) => e.studentId === self.studentId)
      if (related.length === 0) continue
      const avgScore = Math.round(related.reduce((s, e) => s + e.score, 0) / related.length)
      const diff = Math.abs(self.score - avgScore)
      if (diff > 20) {
        const student = students.value.find((s) => s.id === self.studentId)
        anomalies.push({
          id: `anomaly-${courseId}-${self.studentId}-${sessionNumber}`,
          courseId,
          studentId: self.studentId,
          studentName: student?.name || '未知',
          sessionNumber,
          type: 'self',
          selfScore: self.score,
          avgScore,
          diff,
          warning: `自评(${self.score}分)与其他评价平均分(${avgScore}分)相差${diff}分，差异过大！`,
        })
      }
    }
    return anomalies
  }

  function getEvalSessions(courseId: string): number {
    const course = courses.value.find((c) => c.id === courseId)
    if (!course) return 1
    const config = evalConfigs.value.find((c) => c.courseId === courseId)
    if (!config) return Math.max(1, Math.floor(course.duration / 2))
    switch (config.frequency) {
      case 'biweekly':
        return Math.max(1, Math.ceil(course.duration / 4))
      case 'per_unit':
        return 3
      case 'project_milestone':
        return 3
      case 'custom':
        return config.customSessions || 3
      default:
        return Math.max(1, Math.floor(course.duration / 2))
    }
  }

  function hasGroups(courseId: string): boolean {
    return studentGroups.value.some((g) => g.courseId === courseId)
  }

  function generateEvalReminders(courseId: string) {
    const course = courses.value.find((c) => c.id === courseId)
    const config = evalConfigs.value.find((c) => c.courseId === courseId)
    if (!course || !config) return
    const totalSessions = getEvalSessions(courseId)
    const courseEnrollments = enrollments.value.filter(
      (e) => e.courseId === courseId && e.status !== 'dropped'
    )
    const startDate = new Date(course.createdAt || new Date())
    const reminders: EvalReminder[] = []

    const enabledTypes = TEMPLATE_EVAL_TYPES[config.template] || []

    for (const enr of courseEnrollments) {
      for (let s = 1; s <= totalSessions; s++) {
        // 检查学生是否已提交自评
        const hasSelf = evaluations.value.some(
          (e) => e.courseId === courseId && e.studentId === enr.studentId && e.sessionNumber === s && e.type === 'self'
        )
        if (hasSelf) continue

        // 计算截止时间
        const weekOffset = s * 2
        const deadline = new Date(startDate)
        deadline.setDate(deadline.getDate() + weekOffset * 7)
        const deadlineStr = deadline.toISOString().split('T')[0]

        // 检查是否已有提醒
        const exists = evalReminders.value.some(
          (r) => r.courseId === courseId && r.studentId === enr.studentId && r.sessionNumber === s
        )
        if (exists) continue

        reminders.push({
          id: `reminder-${courseId}-${enr.studentId}-${s}`,
          courseId,
          courseTitle: course.title,
          studentId: enr.studentId,
          sessionNumber: s,
          deadline: deadlineStr,
          status: new Date(deadlineStr) < new Date() ? 'overdue' : 'pending',
        })
      }
    }
    if (reminders.length > 0) {
      evalReminders.value = [...evalReminders.value, ...reminders]
      saveToStorage('evalReminders', evalReminders.value)
    }
  }

  function pushNearDeadlineEvalReminders() {
    const now = new Date()
    const oneWeekLater = new Date(now)
    oneWeekLater.setDate(oneWeekLater.getDate() + 7)

    const student = students.value.find((s) => s.name === currentUser.value)
    const pendingReminders = evalReminders.value.filter((r) => {
      if (r.status === 'completed') return false
      if (student && r.studentId !== student.id) return false
      const deadline = new Date(r.deadline)
      return deadline >= now && deadline <= oneWeekLater
    })

    const existingTodoKeys = new Set(todos.value.map((t) => t.title))
    let newCount = 0

    for (const r of pendingReminders) {
      const todoTitle = `📋 ${r.courseTitle} 第${r.sessionNumber}次评价即将截止（${r.deadline}）`
      if (existingTodoKeys.has(todoTitle)) continue
      todos.value.push({
        id: `todo-eval-${Date.now()}-${r.id}`,
        title: todoTitle,
        completed: false,
        createdAt: now.toISOString().split('T')[0],
        dueDate: r.deadline,
        createdBy: currentUser.value || 'system',
      })
      existingTodoKeys.add(todoTitle)
      newCount++
    }

    if (newCount > 0) {
      saveToStorage('todos', todos.value)
      // trigger reactivity
      todos.value = [...todos.value]
    }
  }

  function processSessionOverdue(courseId: string, sessionNumber: number) {
    const config = evalConfigs.value.find((c) => c.courseId === courseId)
    if (!config || config.overdueRule !== 'average') return

    const courseEnrollments = enrollments.value.filter(
      (e) => e.courseId === courseId && e.status !== 'dropped'
    )
    const newEvals: Evaluation[] = []

    for (const enr of courseEnrollments) {
      const hasSelf = evaluations.value.some(
        (e) => e.courseId === courseId && e.studentId === enr.studentId && e.sessionNumber === sessionNumber && e.type === 'self'
      )
      if (hasSelf) continue

      const historyEvals = evaluations.value.filter(
        (e) => e.courseId === courseId && e.studentId === enr.studentId && e.type === 'self' && e.sessionNumber < sessionNumber
      )
      if (historyEvals.length === 0) continue

      const avgScore = Math.round(historyEvals.reduce((s, e) => s + e.score, 0) / historyEvals.length)
      const student = students.value.find((s) => s.id === enr.studentId)

      newEvals.push({
        id: `auto-${courseId}-${enr.studentId}-${sessionNumber}-${Date.now()}`,
        courseId,
        studentId: enr.studentId,
        sessionNumber,
        type: 'self',
        score: avgScore,
        evaluatorId: enr.studentId,
        evaluatorName: student?.name || '未知',
        comment: `自动取历史平均分（逾期未评，${avgScore}分）`,
        createdAt: new Date().toISOString().split('T')[0],
      })
    }

    if (newEvals.length > 0) {
      evaluations.value = [...evaluations.value, ...newEvals]
      saveToStorage('evaluations', evaluations.value)
    }
  }

  function checkEvalReminders() {
    const now = new Date()
    const hasUpcoming = evalReminders.value.some((r) => {
      if (r.status === 'completed') return false
      const deadline = new Date(r.deadline)
      return deadline >= now
    })
    hasEvalReminders.value = hasUpcoming
  }

  function recalculateProgress(courseId: string, studentId: string) {
    const courseSchedules = schedules.value.filter((s) => s.courseId === courseId)
    const now = new Date()
    const pastSchedules = courseSchedules.filter((s) => new Date(s.startDate) < now).length
    const totalSchedules = courseSchedules.length
    const timeElapsedRatio = totalSchedules > 0 ? Math.round((pastSchedules / totalSchedules) * 100) : 0

    enrollments.value = enrollments.value.map((e) => {
      if (e.courseId === courseId && e.studentId === studentId) {
        const newProgress = Math.round((timeElapsedRatio + e.progress) / 2)
        return { ...e, progress: newProgress }
      }
      return e
    })
    saveToStorage('enrollments', enrollments.value)
  }

  // ====== 成绩权重配置 ======

  function saveGradeConfig(config: GradeWeightConfig) {
    gradeConfigs.value = { ...gradeConfigs.value, [config.courseId]: config }
    saveToStorage('gradeConfigs', gradeConfigs.value)
  }

  function getGradeConfig(courseId: string): GradeWeightConfig {
    return gradeConfigs.value[courseId] || getDefaultGradeConfig(courseId)
  }

  function addDetailedGrade(dg: DetailedGrade) {
    detailedGrades.value = [...detailedGrades.value, dg]
    saveToStorage('detailedGrades', detailedGrades.value)
  }

  function updateDetailedGrade(id: string, data: Partial<DetailedGrade>) {
    detailedGrades.value = detailedGrades.value.map((d) => (d.id === id ? { ...d, ...data } : d))
    saveToStorage('detailedGrades', detailedGrades.value)
  }

  function getDetailedGrades(courseId: string): DetailedGrade[] {
    return detailedGrades.value.filter((d) => d.courseId === courseId)
  }

  function calcTotalScore(courseId: string, dg: DetailedGrade): number {
    const cfg = gradeConfigs.value[courseId] || getDefaultGradeConfig(courseId)
    const regular =
      (dg.selfEvalScore ?? 0) * cfg.selfEvalWeight / 100 +
      (dg.peerReviewScore ?? 0) * cfg.peerReviewWeight / 100 +
      (dg.interGroupScore ?? 0) * cfg.interGroupEvalWeight / 100 +
      (dg.teacherScore ?? 0) * cfg.teacherScoreWeight / 100 +
      (dg.mentorScore ?? 0) * cfg.mentorScoreWeight / 100
    const midterm = ((dg.midtermExamScore ?? 0) * cfg.midtermExamWeight + (dg.midtermProjectScore ?? 0) * cfg.midtermProjectWeight) / 100
    const final = ((dg.finalExamScore ?? 0) * cfg.finalExamWeight + (dg.finalProjectScore ?? 0) * cfg.finalProjectWeight) / 100
    return Math.round(regular * cfg.regularWeight / 100 + midterm * cfg.midtermWeight / 100 + final * cfg.finalWeight / 100)
  }

  return {
    // state
    courses, categories, students, schedules, enrollments, teachers, grades,
    cloudFiles, todos, onlineDocs, notes,
    evaluations, evalConfigs, studentGroups, evalReminders,
    gradeConfigs, detailedGrades,
    isLoggedIn, currentUser, currentRole,
    hasEvalReminders,
    // actions
    login, logout,
    addCourse, updateCourse, deleteCourse,
    addCategory, updateCategory, deleteCategory,
    addSchedule, updateSchedule, deleteSchedule,
    updateEnrollment,
    addGrade, updateGrade, deleteGrade,
    addCloudFile, deleteCloudFile,
    addTodo, updateTodo, deleteTodo,
    addOnlineDoc, updateOnlineDoc, deleteOnlineDoc,
    addNote, updateNote, deleteNote,
    addEvaluation, updateEvaluation, deleteEvaluation,
    setEvalConfig, addStudentGroup,
    detectAnomalies, getEvalSessions, hasGroups,
    generateEvalReminders, pushNearDeadlineEvalReminders, processSessionOverdue,
    checkEvalReminders,
    recalculateProgress,
    saveGradeConfig, getGradeConfig,
    addDetailedGrade, updateDetailedGrade, getDetailedGrades,
    calcTotalScore,
  }
})