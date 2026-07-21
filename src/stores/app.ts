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
    if (!stored) return fallback
    const parsed = JSON.parse(stored)
    // 数组类型：如果 localStorage 存的是空数组，也用 fallback（防止 stale 空数组覆盖 mock 数据）
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback)) return fallback
    return parsed
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

  // 教师已提交的评价记录（string[]，key: `${courseId}||${studentId}||${session}||${type}`）
  const teacherSubmittedEvals = ref<string[]>(
    loadFromStorage<string[]>('teacherSubmittedEvals', [])
  )

  // 考试/项目成绩
  const examScores = ref<import('@/types').ExamScore[]>(
    loadFromStorage<import('@/types').ExamScore[]>('examScores', [])
  )

  // 考试/项目权重配置 (courseId → examName → weight)
  const examWeights = ref<Record<string, Record<string, number>>>(
    loadFromStorage<Record<string, Record<string, number>>>('examWeights', {})
  )

  // 配置完成标记（权重配置 / 评价方案配置）
  const configCompleted = ref<Record<string, { weights: boolean; evalConfig: boolean }>>(
    loadFromStorage<Record<string, { weights: boolean; evalConfig: boolean }>>('configCompleted', {})
  )

  // 已锁定的评价轮次（key: `${courseId}||${sessionNumber}`）
  // 锁定后该轮次无法再修改评价
  const lockedSessions = ref<string[]>(
    loadFromStorage<string[]>('lockedSessions', [])
  )

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

  function addEnrollment(enrollment: Enrollment) {
    enrollments.value = [...enrollments.value, enrollment]
    saveToStorage('enrollments', enrollments.value)
  }

  function updateEnrollment(id: string, data: Partial<Enrollment>) {
    enrollments.value = enrollments.value.map((e) => (e.id === id ? { ...e, ...data } : e))
    saveToStorage('enrollments', enrollments.value)
  }

  function deleteEnrollment(id: string) {
    enrollments.value = enrollments.value.filter((e) => e.id !== id)
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

  function addStudent(student: Student) {
    students.value = [...students.value, student]
    saveToStorage('students', students.value)
  }

  function updateStudent(id: string, data: Partial<Student>) {
    students.value = students.value.map((s) => (s.id === id ? { ...s, ...data } : s))
    saveToStorage('students', students.value)
  }

  function updateStudentGroup(id: string, data: Partial<StudentGroup>) {
    studentGroups.value = studentGroups.value.map((g) => (g.id === id ? { ...g, ...data } : g))
    saveToStorage('studentGroups', studentGroups.value)
  }

  function deleteStudentGroup(id: string) {
    studentGroups.value = studentGroups.value.filter((g) => g.id !== id)
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

  /** 教师提交评价（提交后锁定，学生端可见） */
  function submitTeacherEval(courseId: string, studentId: string, session: number, type: string) {
    const key = `${courseId}||${studentId}||${session}||${type}`
    if (!teacherSubmittedEvals.value.includes(key)) {
      teacherSubmittedEvals.value = [...teacherSubmittedEvals.value, key]
      saveToStorage('teacherSubmittedEvals', teacherSubmittedEvals.value)
    }
  }

  /** 检查某条教师评价是否已提交 */
  function isTeacherEvalSubmitted(courseId: string, studentId: string, session: number, type: string): boolean {
    const key = `${courseId}||${studentId}||${session}||${type}`
    return teacherSubmittedEvals.value.includes(key)
  }

  /** 获取某学生当前可查看的教师最终评分 */
  function getSubmittedTeacherScore(courseId: string, studentId: string, session: number, type: string): number | null {
    if (!isTeacherEvalSubmitted(courseId, studentId, session, type)) return null
    const ev = evaluations.value.find(
      (e) => e.courseId === courseId && e.studentId === studentId && e.sessionNumber === session && e.type === type
    )
    return ev?.score ?? null
  }

  /** 考试/项目成绩操作 */
  function addExamScore(score: import('@/types').ExamScore) {
    examScores.value.push(score)
    saveToStorage('examScores', examScores.value)
  }

  function updateExamScore(id: string, updates: Partial<import('@/types').ExamScore>) {
    const idx = examScores.value.findIndex((s) => s.id === id)
    if (idx !== -1) {
      examScores.value[idx] = { ...examScores.value[idx], ...updates }
      saveToStorage('examScores', examScores.value)
    }
  }

  function submitExamScores(courseId: string, examName: string) {
    examScores.value = examScores.value.map((s) => {
      if (s.courseId === courseId && s.examName === examName && s.status === 'draft') {
        return { ...s, status: 'submitted' as const, gradedAt: new Date().toISOString().split('T')[0] }
      }
      return s
    })
    saveToStorage('examScores', examScores.value)
  }

  function getExamScoresForCourse(courseId: string, examName?: string): import('@/types').ExamScore[] {
    let result = examScores.value.filter((s) => s.courseId === courseId)
    if (examName) result = result.filter((s) => s.examName === examName)
    return result
  }

  /** 获取课程已定义的考试/项目名称列表 */
  function getExamNames(courseId: string): string[] {
    const names = new Set(examScores.value.filter((s) => s.courseId === courseId).map((s) => s.examName))
    return Array.from(names).sort()
  }

  // ====== 考试/项目权重配置 ======

  /** 设置某个考试/项目的权重 */
  function setExamWeight(courseId: string, examName: string, weight: number) {
    const courseWeights = { ...(examWeights.value[courseId] || {}) }
    courseWeights[examName] = Math.min(100, Math.max(0, weight))
    examWeights.value = { ...examWeights.value, [courseId]: courseWeights }
    saveToStorage('examWeights', examWeights.value)
  }

  /** 获取某个考试/项目的权重 */
  function getExamWeight(courseId: string, examName: string): number {
    return examWeights.value[courseId]?.[examName] ?? 0
  }

  /** 获取课程所有考试/项目的权重配置 */
  function getExamWeightsForCourse(courseId: string): Record<string, number> {
    return examWeights.value[courseId] || {}
  }

  /** 检查课程是否有已提交的期末考试成绩（期末考试/期末项目） */
  function hasFinalExamSubmitted(courseId: string): boolean {
    return examScores.value.some(
      (s) => s.courseId === courseId &&
        (s.type === 'final_exam' || s.type === 'final_project') &&
        s.status === 'submitted'
    )
  }

  /** 评价方案是否可编辑（第一节课开始前可编辑，开始后锁定） */
  function isEvalConfigEditable(courseId: string): boolean {
    return !isFirstClassStarted(courseId)
  }

  /** 成绩权重是否可编辑（期末考试成绩录入前可编辑，录入后锁定） */
  function isWeightConfigEditable(courseId: string): boolean {
    return !hasFinalExamSubmitted(courseId)
  }

  // ====== 评价轮次锁定与时机 ======

  /** 锁定某评价轮次（锁定后不可再修改评价） */
  function lockSession(courseId: string, sessionNumber: number) {
    const key = `${courseId}||${sessionNumber}`
    if (!lockedSessions.value.includes(key)) {
      lockedSessions.value = [...lockedSessions.value, key]
      saveToStorage('lockedSessions', lockedSessions.value)
    }
  }

  /** 检查某评价轮次是否已锁定 */
  function isSessionLocked(courseId: string, sessionNumber: number): boolean {
    return lockedSessions.value.includes(`${courseId}||${sessionNumber}`)
  }

  /** 
   * 获取某评价轮次对应的课次结束日期
   * 将课程的所有课次(startDate排序)按顺序映射到评价轮次
   */
  function getSessionEndDate(courseId: string, sessionNumber: number): Date | null {
    const courseSchedules = schedules.value
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    if (sessionNumber >= 1 && sessionNumber <= courseSchedules.length) {
      return new Date(courseSchedules[sessionNumber - 1].endDate)
    }
    return null
  }

  /**
   * 判断某评价轮次是否已到上课时间（上完课才能评价）
   * 所有评价轮次统一以第二节课结束为起始时间
   */
  function isSessionTime(courseId: string, _sessionNumber: number): boolean {
    const courseSchedules = schedules.value
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    if (courseSchedules.length === 0) return true // 无法判断时默认可用
    if (courseSchedules.length === 1) return new Date() >= new Date(courseSchedules[0].endDate) // 只有一节课时用第一节课
    return new Date() >= new Date(courseSchedules[1].endDate)
  }

  /**
   * 判断最终评价轮次是否已过3天截止期
   * 最后一节课结束后3天内可评价，超过3天锁定
   */
  function isFinalSessionDeadlinePassed(courseId: string, totalSessions: number): boolean {
    const endDate = getSessionEndDate(courseId, totalSessions)
    if (!endDate) return false
    const deadline = new Date(endDate)
    deadline.setDate(deadline.getDate() + 3)
    return new Date() > deadline
  }

  /**
   * 自动锁定上一轮次并处理逾期
   * 当教师开始评价第 N 轮时调用，锁定第 N-1 轮
   */
  function autoLockPreviousSession(courseId: string, currentSession: number) {
    const prevSession = currentSession - 1
    if (prevSession >= 1) {
      // 先处理逾期评价（对未评价的学生自动走逾期规则）
      processSessionOverdue(courseId, prevSession)
      // 标记该轮次的所有提醒为已完成
      markSessionEvalRemindersCompleted(courseId, prevSession)
      // 锁定该轮次
      lockSession(courseId, prevSession)
    }
  }

  // ====== 评价待办提醒生成 ======

  /** 
   * 当某评价轮次可开始评价时，生成待办提醒（教师端和学生端）
   */
  function generateSessionReminders(courseId: string, sessionNumber: number) {
    const course = courses.value.find((c) => c.id === courseId)
    const config = evalConfigs.value.find((c) => c.courseId === courseId)
    if (!course || !config) return

    const enabledTypes = TEMPLATE_EVAL_TYPES[config.template] || ['self', 'teacher']
    const courseEnrollments = enrollments.value.filter(
      (e) => e.courseId === courseId && e.status !== 'dropped'
    )
    let newEvalReminders: EvalReminder[] = []

    for (const enr of courseEnrollments) {
      for (const type of enabledTypes) {
        const targetIsTeacher = type === 'teacher' || type === 'mentor'
        // 教师/导师评价 → 提醒对象是教师，自评/互评 → 提醒对象是学生
        const targetId = targetIsTeacher ? course.teacher : enr.studentId
        const reminderId = `session-reminder-${courseId}-${targetId}-${type}-${sessionNumber}`

        // 已存在提醒则跳过
        if (evalReminders.value.some((r) => r.id === reminderId)) continue

        newEvalReminders.push({
          id: reminderId,
          courseId,
          courseTitle: course.title,
          studentId: targetId,
          sessionNumber,
          deadline: '',
          status: 'pending',
        })
      }
    }

    if (newEvalReminders.length > 0) {
      evalReminders.value = [...evalReminders.value, ...newEvalReminders]
      saveToStorage('evalReminders', evalReminders.value)
    }
  }

  /**
   * 扫描所有活跃课程，为已到上课时间的轮次生成待办提醒
   */
  function checkAndGenerateSessionReminders() {
    const activeCourses = courses.value.filter((c) => c.status === 'active')
    for (const course of activeCourses) {
      const totalSessions = getEvalSessions(course.id)
      for (let s = 1; s <= totalSessions; s++) {
        if (isSessionTime(course.id, s) && !isSessionLocked(course.id, s)) {
          generateSessionReminders(course.id, s)
        }
      }
    }
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

    const enabledTypes = TEMPLATE_EVAL_TYPES[config.template] || ['self', 'teacher']

    for (const enr of courseEnrollments) {
      for (let s = 1; s <= totalSessions; s++) {
        for (const type of enabledTypes) {
          // 教师/导师评价的提醒对象是课程教师，自评/互评的提醒对象是学生
          const targetIsTeacher = type === 'teacher' || type === 'mentor'
          const hasEval = evaluations.value.some(
            (e) => e.courseId === courseId && e.studentId === enr.studentId && e.sessionNumber === s && e.type === type
          )
          if (hasEval) continue

          const weekOffset = s * 2
          const deadline = new Date(startDate)
          deadline.setDate(deadline.getDate() + weekOffset * 7)
          const deadlineStr = deadline.toISOString().split('T')[0]

          const targetId = targetIsTeacher ? course.teacher : enr.studentId
          const reminderId = `reminder-${courseId}-${targetId}-${type}-${s}`
          const exists = evalReminders.value.some((r) => r.id === reminderId)
          if (exists) continue

          reminders.push({
            id: reminderId,
            courseId,
            courseTitle: course.title,
            studentId: targetId,
            sessionNumber: s,
            deadline: deadlineStr,
            status: new Date(deadlineStr) < new Date() ? 'overdue' : 'pending',
          })
        }
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

    const isTeacher = currentRole.value === 'teacher'
    const isStudent = currentRole.value === 'student'

    const pendingReminders = evalReminders.value.filter((r) => {
      if (r.status === 'completed') return false
      if (isTeacher && r.studentId === currentUser.value) {
        const deadline = new Date(r.deadline)
        return deadline >= now && deadline <= oneWeekLater
      }
      if (isStudent) {
        const student = students.value.find((s) => s.name === currentUser.value)
        if (student && r.studentId === student.id) {
          const deadline = new Date(r.deadline)
          return deadline >= now && deadline <= oneWeekLater
        }
      }
      return false
    })

    const existingTodoKeys = new Set(todos.value.map((t) => t.title))
    let newCount = 0

    for (const r of pendingReminders) {
      const todoTitle = `📋 评价提醒：${r.courseTitle} 第${r.sessionNumber}次评价即将截止（${r.deadline}）`
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

  function markEvalReminderCompleted(courseId: string, studentId: string, sessionNumber: number) {
    evalReminders.value = evalReminders.value.map((r) => {
      if (r.courseId === courseId && r.studentId === studentId && r.sessionNumber === sessionNumber) {
        return { ...r, status: 'completed' as const }
      }
      return r
    })
    saveToStorage('evalReminders', evalReminders.value)
  }

  /** 标记某课程某轮次所有评价提醒为已完成 */
  function markSessionEvalRemindersCompleted(courseId: string, sessionNumber: number) {
    evalReminders.value = evalReminders.value.map((r) => {
      if (r.courseId === courseId && r.sessionNumber === sessionNumber && r.status !== 'completed') {
        return { ...r, status: 'completed' as const }
      }
      return r
    })
    saveToStorage('evalReminders', evalReminders.value)
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

  // ====== 配置提醒 ======

  /** 第一节课是否已经开始（配置锁定期） */
  function isFirstClassStarted(courseId: string): boolean {
    const courseSchedules = schedules.value
      .filter((s) => s.courseId === courseId)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    if (courseSchedules.length === 0) return false
    return new Date() >= new Date(courseSchedules[0].endDate)
  }

  /** 标记某课程的某项配置已完成 */
  function markConfigCompleted(courseId: string, type: 'weights' | 'evalConfig') {
    configCompleted.value = {
      ...configCompleted.value,
      [courseId]: {
        ...(configCompleted.value[courseId] || { weights: false, evalConfig: false }),
        [type]: true,
      },
    }
    saveToStorage('configCompleted', configCompleted.value)
  }

  /** 获取有未完成配置的课程列表（排除已锁定课程，仅当前教师自己的课程） */
  function getPendingConfigCourses(): { courseId: string; courseTitle: string; missing: string[] }[] {
    const activeCourses = courses.value.filter(
      (c) => c.status === 'active' && c.teacher === currentUser.value
    )
    const result: { courseId: string; courseTitle: string; missing: string[] }[] = []
    for (const course of activeCourses) {
      if (isFirstClassStarted(course.id)) continue // 已锁定，不需要提醒
      const done = configCompleted.value[course.id]
      const missing: string[] = []
      if (!done?.weights) missing.push('成绩权重')
      if (!done?.evalConfig) missing.push('评价方案')
      if (missing.length > 0) {
        result.push({ courseId: course.id, courseTitle: course.title, missing })
      }
    }
    return result
  }

  return {
    // state
    courses, categories, students, schedules, enrollments, teachers, grades,
    cloudFiles, todos, onlineDocs, notes,
    evaluations, evalConfigs, studentGroups, evalReminders,
    gradeConfigs, detailedGrades,
    isLoggedIn, currentUser, currentRole,
    hasEvalReminders,
    examScores,
    examWeights,
    lockedSessions,
    // actions
    login, logout,
    addCourse, updateCourse, deleteCourse,
    addCategory, updateCategory, deleteCategory,
    addSchedule, updateSchedule, deleteSchedule,
    addEnrollment, updateEnrollment, deleteEnrollment,
    addGrade, updateGrade, deleteGrade,
    addCloudFile, deleteCloudFile,
    addTodo, updateTodo, deleteTodo,
    addOnlineDoc, updateOnlineDoc, deleteOnlineDoc,
    addNote, updateNote, deleteNote,
    addEvaluation, updateEvaluation, deleteEvaluation,
    setEvalConfig, addStudentGroup, addStudent, updateStudent, updateStudentGroup, deleteStudentGroup,
    detectAnomalies, getEvalSessions, hasGroups,
    submitTeacherEval, isTeacherEvalSubmitted, getSubmittedTeacherScore,
    addExamScore, updateExamScore, submitExamScores, getExamScoresForCourse, getExamNames,
    setExamWeight, getExamWeight, getExamWeightsForCourse,
    hasFinalExamSubmitted, isEvalConfigEditable, isWeightConfigEditable,
    lockSession, isSessionLocked, getSessionEndDate, isSessionTime, isFinalSessionDeadlinePassed, autoLockPreviousSession,
    generateSessionReminders, checkAndGenerateSessionReminders,
    generateEvalReminders, pushNearDeadlineEvalReminders, processSessionOverdue,
    markEvalReminderCompleted, markSessionEvalRemindersCompleted,
    isFirstClassStarted, markConfigCompleted, getPendingConfigCourses,
    checkEvalReminders,
    recalculateProgress,
    saveGradeConfig, getGradeConfig,
    addDetailedGrade, updateDetailedGrade, getDetailedGrades,
    calcTotalScore,
  }
})