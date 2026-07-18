import { create } from 'zustand';
import type { Course, Category, Student, Schedule, Enrollment, Teacher, Grade, CloudFile, TodoItem, OnlineDoc, Note, Evaluation, EvaluationConfig, StudentGroup, EvalAnomaly, EvalType, EvalTemplate, EvalReminder, EvalFrequency, OverdueRule, GradeWeightConfig, DetailedGrade } from '@/types';
import { getDefaultGradeConfig } from '@/types';
import { courses as mockCourses, categories as mockCategories, students as mockStudents, schedules as mockSchedules, enrollments as mockEnrollments, teachers as mockTeachers, grades as mockGrades, evaluationConfigs as mockEvalConfigs, evaluations as mockEvaluations, studentGroups as mockStudentGroups } from '@/data/mockData';

interface AppState {
  courses: Course[];
  categories: Category[];
  students: Student[];
  schedules: Schedule[];
  enrollments: Enrollment[];
  teachers: Teacher[];
  grades: Grade[];
  cloudFiles: CloudFile[];
  todos: TodoItem[];
  onlineDocs: OnlineDoc[];
  notes: Note[];
  evaluations: Evaluation[];
  evalConfigs: EvaluationConfig[];
  studentGroups: StudentGroup[];
  evalReminders: EvalReminder[];
  gradeConfigs: Record<string, GradeWeightConfig>;
  detailedGrades: DetailedGrade[];
  isLoggedIn: boolean;
  currentUser: string | null;
  currentRole: UserRole;

  login: (username: string, role: UserRole) => void;
  logout: () => void;

  addCourse: (course: Course) => void;
  updateCourse: (id: string, data: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  addCategory: (category: Category) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (id: string, data: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;

  updateEnrollment: (id: string, data: Partial<Enrollment>) => void;
  addGrade: (grade: Grade) => void;
  updateGrade: (id: string, data: Partial<Grade>) => void;
  deleteGrade: (id: string) => void;

  addCloudFile: (file: CloudFile) => void;
  deleteCloudFile: (id: string) => void;

  addTodo: (todo: TodoItem) => void;
  updateTodo: (id: string, data: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;

  addOnlineDoc: (doc: OnlineDoc) => void;
  updateOnlineDoc: (id: string, data: Partial<OnlineDoc>) => void;
  deleteOnlineDoc: (id: string) => void;

  addNote: (note: Note) => void;
  updateNote: (id: string, data: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // 评价系统
  addEvaluation: (ev: Evaluation) => void;
  updateEvaluation: (id: string, data: Partial<Evaluation>) => void;
  deleteEvaluation: (id: string) => void;
  setEvalConfig: (config: EvaluationConfig) => void;
  addStudentGroup: (group: StudentGroup) => void;
  /** 检测某课程某次评价的异常（自评分与平均分差异 > 20） */
  detectAnomalies: (courseId: string, sessionNumber: number) => EvalAnomaly[];
  /** 根据频率计算评价总次数 */
  getEvalSessions: (courseId: string) => number;
  /** 生成评价待办提醒 */
  generateEvalReminders: (courseId: string) => void;
  /** 评价截止前1周推送待办提醒 */
  pushNearDeadlineEvalReminders: () => void;
  /** 处理逾期评价（取历史平均分） */
  processSessionOverdue: (courseId: string, sessionNumber: number) => void;
  /** 检查某课程是否有分组 */
  hasGroups: (courseId: string) => boolean;
  /** 是否有临近截止的评价待办 */
  hasEvalReminders: boolean;
  /** 检查并更新 evalReminders 标记 */
  checkEvalReminders: () => void;
  /** 根据时间进度重新计算学生学习进度 */
  recalculateProgress: (courseId: string, studentId: string) => void;
  saveGradeConfig: (config: GradeWeightConfig) => void;
  getGradeConfig: (courseId: string) => GradeWeightConfig;
  addDetailedGrade: (dg: DetailedGrade) => void;
  updateDetailedGrade: (id: string, data: Partial<DetailedGrade>) => void;
  getDetailedGrades: (courseId: string) => DetailedGrade[];
  calcTotalScore: (courseId: string, dg: DetailedGrade) => number;
}

type UserRole = 'admin' | 'teacher' | 'student' | null;

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key: string, data: unknown) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const useStore = create<AppState>((set, get) => ({
  courses: loadFromStorage('courses', mockCourses),
  categories: loadFromStorage('categories', mockCategories),
  students: loadFromStorage('students', mockStudents),
  schedules: loadFromStorage('schedules', mockSchedules),
  enrollments: loadFromStorage('enrollments', mockEnrollments),
  teachers: loadFromStorage('teachers', mockTeachers),
  grades: loadFromStorage('grades', mockGrades),
  cloudFiles: loadFromStorage<CloudFile[]>('cloudFiles', []),
  todos: loadFromStorage<TodoItem[]>('todos', []),
  onlineDocs: loadFromStorage<OnlineDoc[]>('onlineDocs', []),
  notes: loadFromStorage<Note[]>('notes', []),
  evaluations: loadFromStorage<Evaluation[]>('evaluations', mockEvaluations),
  evalConfigs: loadFromStorage<EvaluationConfig[]>('evalConfigs', mockEvalConfigs),
  studentGroups: loadFromStorage<StudentGroup[]>('studentGroups', mockStudentGroups),
  evalReminders: loadFromStorage<EvalReminder[]>('evalReminders', []),
  gradeConfigs: loadFromStorage<Record<string, GradeWeightConfig>>('gradeConfigs', {}),
  detailedGrades: loadFromStorage<DetailedGrade[]>('detailedGrades', []),
  isLoggedIn: loadFromStorage<boolean>('isLoggedIn', false),
  currentUser: loadFromStorage<string | null>('currentUser', null),
  currentRole: loadFromStorage<UserRole>('currentRole', null),
  hasEvalReminders: false,

  login: (username, role) => {
    localStorage.setItem('isLoggedIn', JSON.stringify(true));
    localStorage.setItem('currentUser', JSON.stringify(username));
    localStorage.setItem('currentRole', JSON.stringify(role));
    set({ isLoggedIn: true, currentUser: username, currentRole: role });
  },
  logout: () => {
    localStorage.setItem('isLoggedIn', JSON.stringify(false));
    localStorage.setItem('currentUser', JSON.stringify(null));
    localStorage.setItem('currentRole', JSON.stringify(null));
    set({ isLoggedIn: false, currentUser: null, currentRole: null });
  },

  addCourse: (course) => {
    const courses = [...get().courses, course];
    saveToStorage('courses', courses);
    // 同步分类课程数量
    const categories = get().categories.map((cat) =>
      cat.id === course.categoryId ? { ...cat, courseCount: cat.courseCount + 1 } : cat
    );
    saveToStorage('categories', categories);
    // 同步教师 courseIds
    const teachers = get().teachers.map((t) =>
      t.name === course.teacher && !t.courseIds.includes(course.id)
        ? { ...t, courseIds: [...t.courseIds, course.id] }
        : t
    );
    saveToStorage('teachers', teachers);
    set({ courses, categories, teachers });
  },
  updateCourse: (id, data) => {
    const old = get().courses.find((c) => c.id === id);
    const courses = get().courses.map((c) => (c.id === id ? { ...c, ...data } : c));
    saveToStorage('courses', courses);
    let categories = get().categories;
    let teachers = get().teachers;
    // 如果分类发生变化，同步分类课程数量
    if (old && data.categoryId && data.categoryId !== old.categoryId) {
      categories = categories.map((cat) => {
        if (cat.id === old.categoryId) return { ...cat, courseCount: Math.max(0, cat.courseCount - 1) };
        if (cat.id === data.categoryId) return { ...cat, courseCount: cat.courseCount + 1 };
        return cat;
      });
      saveToStorage('categories', categories);
    }
    // 如果教师发生变化，同步教师 courseIds
    if (old && data.teacher && data.teacher !== old.teacher) {
      // 从旧教师中移除
      teachers = teachers.map((t) =>
        t.name === old.teacher ? { ...t, courseIds: t.courseIds.filter((cid) => cid !== id) } : t
      );
      // 添加到新教师
      teachers = teachers.map((t) =>
        t.name === data.teacher && !t.courseIds.includes(id)
          ? { ...t, courseIds: [...t.courseIds, id] }
          : t
      );
      saveToStorage('teachers', teachers);
    }
    set({ courses, categories, teachers });
  },
  deleteCourse: (id) => {
    const old = get().courses.find((c) => c.id === id);
    const courses = get().courses.filter((c) => c.id !== id);
    saveToStorage('courses', courses);
    let categories = get().categories;
    let teachers = get().teachers;
    if (old) {
      // 同步分类课程数量
      categories = categories.map((cat) =>
        cat.id === old.categoryId ? { ...cat, courseCount: Math.max(0, cat.courseCount - 1) } : cat
      );
      saveToStorage('categories', categories);
      // 同步教师 courseIds
      teachers = teachers.map((t) =>
        t.name === old.teacher ? { ...t, courseIds: t.courseIds.filter((cid) => cid !== id) } : t
      );
      saveToStorage('teachers', teachers);
    }
    set({ courses, categories, teachers });
  },

  addCategory: (category) => {
    const categories = [...get().categories, category];
    saveToStorage('categories', categories);
    set({ categories });
  },
  updateCategory: (id, data) => {
    const categories = get().categories.map((c) => (c.id === id ? { ...c, ...data } : c));
    saveToStorage('categories', categories);
    set({ categories });
  },
  deleteCategory: (id) => {
    const categories = get().categories.filter((c) => c.id !== id);
    saveToStorage('categories', categories);
    set({ categories });
  },

  addSchedule: (schedule) => {
    const schedules = [...get().schedules, schedule];
    saveToStorage('schedules', schedules);
    set({ schedules });
  },
  updateSchedule: (id, data) => {
    const schedules = get().schedules.map((s) => (s.id === id ? { ...s, ...data } : s));
    saveToStorage('schedules', schedules);
    set({ schedules });
  },
  deleteSchedule: (id) => {
    const schedules = get().schedules.filter((s) => s.id !== id);
    saveToStorage('schedules', schedules);
    set({ schedules });
  },

  updateEnrollment: (id, data) => {
    const enrollments = get().enrollments.map((e) => (e.id === id ? { ...e, ...data } : e));
    saveToStorage('enrollments', enrollments);
    set({ enrollments });
  },
  addGrade: (grade) => {
    const course = get().courses.find(c => c.id === grade.courseId);
    if (course && course.status === 'inactive') {
      console.warn('Cannot modify ended course');
      return;
    }
    const grades = [...get().grades, grade];
    saveToStorage('grades', grades);
    set({ grades });
  },
  updateGrade: (id, data) => {
    const grade = get().grades.find(g => g.id === id);
    if (grade) {
      const course = get().courses.find(c => c.id === grade.courseId);
      if (course && course.status === 'inactive') {
        console.warn('Cannot modify ended course');
        return;
      }
    }
    const grades = get().grades.map((g) => (g.id === id ? { ...g, ...data } : g));
    saveToStorage('grades', grades);
    set({ grades });
  },
  deleteGrade: (id) => {
    const grades = get().grades.filter((g) => g.id !== id);
    saveToStorage('grades', grades);
    set({ grades });
  },

  addCloudFile: (file) => {
    const cloudFiles = [...get().cloudFiles, file];
    saveToStorage('cloudFiles', cloudFiles);
    set({ cloudFiles });
  },
  deleteCloudFile: (id) => {
    const cloudFiles = get().cloudFiles.filter((f) => f.id !== id);
    saveToStorage('cloudFiles', cloudFiles);
    set({ cloudFiles });
  },

  addTodo: (todo) => {
    const todos = [...get().todos, { ...todo, createdBy: get().currentUser || '未知' }];
    saveToStorage('todos', todos);
    set({ todos });
  },
  updateTodo: (id, data) => {
    const todos = get().todos.map((t) => (t.id === id ? { ...t, ...data } : t));
    saveToStorage('todos', todos);
    set({ todos });
  },
  deleteTodo: (id) => {
    const todos = get().todos.filter((t) => t.id !== id);
    saveToStorage('todos', todos);
    set({ todos });
  },

  addOnlineDoc: (doc) => {
    const onlineDocs = [...get().onlineDocs, doc];
    saveToStorage('onlineDocs', onlineDocs);
    set({ onlineDocs });
  },
  updateOnlineDoc: (id, data) => {
    const onlineDocs = get().onlineDocs.map((d) => (d.id === id ? { ...d, ...data } : d));
    saveToStorage('onlineDocs', onlineDocs);
    set({ onlineDocs });
  },
  deleteOnlineDoc: (id) => {
    const onlineDocs = get().onlineDocs.filter((d) => d.id !== id);
    saveToStorage('onlineDocs', onlineDocs);
    set({ onlineDocs });
  },

  addNote: (note) => {
    const notes = [...get().notes, { ...note, createdBy: get().currentUser || '未知' }];
    saveToStorage('notes', notes);
    set({ notes });
  },
  updateNote: (id, data) => {
    const notes = get().notes.map((n) => (n.id === id ? { ...n, ...data } : n));
    saveToStorage('notes', notes);
    set({ notes });
  },
  deleteNote: (id) => {
    const notes = get().notes.filter((n) => n.id !== id);
    saveToStorage('notes', notes);
    set({ notes });
  },

  // ====== 评价系统 ======
  addEvaluation: (ev) => {
    const course = get().courses.find(c => c.id === ev.courseId);
    if (course && course.status === 'inactive') {
      console.warn('Cannot modify ended course');
      return;
    }
    const evaluations = [...get().evaluations, ev];
    saveToStorage('evaluations', evaluations);
    set({ evaluations });
  },
  updateEvaluation: (id, data) => {
    const ev = get().evaluations.find(e => e.id === id);
    if (ev) {
      const course = get().courses.find(c => c.id === ev.courseId);
      if (course && course.status === 'inactive') {
        console.warn('Cannot modify ended course');
        return;
      }
    }
    const evaluations = get().evaluations.map((e) => (e.id === id ? { ...e, ...data } : e));
    saveToStorage('evaluations', evaluations);
    set({ evaluations });
  },
  deleteEvaluation: (id) => {
    const evaluations = get().evaluations.filter((e) => e.id !== id);
    saveToStorage('evaluations', evaluations);
    set({ evaluations });
  },
  setEvalConfig: (config) => {
    const existing = get().evalConfigs.findIndex((c) => c.courseId === config.courseId);
    let evalConfigs: EvaluationConfig[];
    if (existing >= 0) {
      evalConfigs = get().evalConfigs.map((c) => (c.courseId === config.courseId ? config : c));
    } else {
      evalConfigs = [...get().evalConfigs, config];
    }
    saveToStorage('evalConfigs', evalConfigs);
    set({ evalConfigs });
  },
  addStudentGroup: (group) => {
    const studentGroups = [...get().studentGroups, group];
    saveToStorage('studentGroups', studentGroups);
    set({ studentGroups });
  },
  detectAnomalies: (courseId, sessionNumber) => {
    const { evaluations, students, studentGroups, courses } = get();
    const course = courses.find((c) => c.id === courseId);
    if (!course) return [];
    const anomalies: EvalAnomaly[] = [];
    // 找出该课程此轮的所有自评
    const selfEvals = evaluations.filter(
      (e) => e.courseId === courseId && e.sessionNumber === sessionNumber && e.type === 'self'
    );
    // 找出所有非自评的评价
    const otherEvals = evaluations.filter(
      (e) => e.courseId === courseId && e.sessionNumber === sessionNumber && e.type !== 'self'
    );
    for (const self of selfEvals) {
      // 计算其他评价的平均分
      const related = otherEvals.filter((e) => e.studentId === self.studentId);
      if (related.length === 0) continue;
      const avgScore = Math.round(related.reduce((s, e) => s + e.score, 0) / related.length);
      const diff = Math.abs(self.score - avgScore);
      if (diff > 20) {
        const student = students.find((s) => s.id === self.studentId);
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
        });
      }
    }
    return anomalies;
  },
  getEvalSessions: (courseId) => {
    const { courses, evalConfigs } = get();
    const course = courses.find((c) => c.id === courseId);
    if (!course) return 1;
    const config = evalConfigs.find((c) => c.courseId === courseId);
    if (!config) return Math.max(1, Math.floor(course.duration / 2));
    switch (config.frequency) {
      case 'biweekly':
        // 假设每周2课时，每2周评价一次
        return Math.max(1, Math.ceil(course.duration / 4));
      case 'per_unit':
        return 3; // 默认3个知识单元
      case 'project_milestone':
        return 3; // 默认3个节点：初期+中期+终期
      case 'custom':
        return config.customSessions || 3;
      default:
        return Math.max(1, Math.floor(course.duration / 2));
    }
  },
  hasGroups: (courseId) => {
    return get().studentGroups.some((g) => g.courseId === courseId);
  },
  generateEvalReminders: (courseId) => {
    const { courses, evalConfigs, enrollments, evaluations, studentGroups } = get();
    const course = courses.find((c) => c.id === courseId);
    const config = evalConfigs.find((c) => c.courseId === courseId);
    if (!course || !config) return;
    const totalSessions = get().getEvalSessions(courseId);
    const courseEnrollments = enrollments.filter(
      (e) => e.courseId === courseId && e.status !== 'dropped'
    );
    // 默认截止日期：每2周作为一个session周期
    const startDate = new Date(course.createdAt || new Date());
    const reminders: EvalReminder[] = [];

    const hasGroups = get().hasGroups(courseId);
    const enabledTypes = (globalThis as any).TEMPLATE_EVAL_TYPES?.[config.template] || [];

    for (const enr of courseEnrollments) {
      for (let s = 1; s <= totalSessions; s++) {
        // 检查学生是否已提交自评
        const hasSelf = evaluations.some(
          (e) => e.courseId === courseId && e.studentId === enr.studentId && e.sessionNumber === s && e.type === 'self'
        );
        if (hasSelf) continue;

        // 计算截止时间
        const weekOffset = s * 2;
        const deadline = new Date(startDate);
        deadline.setDate(deadline.getDate() + weekOffset * 7);
        const deadlineStr = deadline.toISOString().split('T')[0];

        // 检查是否已有提醒
        const exists = get().evalReminders.some(
          (r) => r.courseId === courseId && r.studentId === enr.studentId && r.sessionNumber === s
        );
        if (exists) continue;

        reminders.push({
          id: `reminder-${courseId}-${enr.studentId}-${s}`,
          courseId,
          courseTitle: course.title,
          studentId: enr.studentId,
          sessionNumber: s,
          deadline: deadlineStr,
          status: new Date(deadlineStr) < new Date() ? 'overdue' : 'pending',
        });
      }
    }
    if (reminders.length > 0) {
      const all = [...get().evalReminders, ...reminders];
      saveToStorage('evalReminders', all);
      set({ evalReminders: all });
    }
  },
  pushNearDeadlineEvalReminders: () => {
    const { evalReminders, todos, students, currentUser, currentRole } = get();
    const now = new Date();
    const oneWeekLater = new Date(now);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);

    const student = students.find((s) => s.name === currentUser);
    const pendingReminders = evalReminders.filter((r) => {
      if (r.status === 'completed') return false;
      if (student && r.studentId !== student.id) return false;
      const deadline = new Date(r.deadline);
      // 在截止前1周内 且 未过期
      return deadline >= now && deadline <= oneWeekLater;
    });

    const existingTodoKeys = new Set(todos.map((t) => t.title));
    let newCount = 0;

    for (const r of pendingReminders) {
      const todoTitle = `📋 ${r.courseTitle} 第${r.sessionNumber}次评价即将截止（${r.deadline}）`;
      if (existingTodoKeys.has(todoTitle)) continue;
      todos.push({
        id: `todo-eval-${Date.now()}-${r.id}`,
        title: todoTitle,
        completed: false,
        createdAt: now.toISOString().split('T')[0],
        dueDate: r.deadline,
        createdBy: currentUser || 'system',
      });
      existingTodoKeys.add(todoTitle);
      newCount++;
    }

    if (newCount > 0) {
      saveToStorage('todos', todos);
      set({ todos: [...todos] });
    }
  },
  processSessionOverdue: (courseId, sessionNumber) => {
    const { evalConfigs, evaluations, students, enrollments, courses } = get();
    const config = evalConfigs.find((c) => c.courseId === courseId);
    if (!config || config.overdueRule !== 'average') return;

    const courseEnrollments = enrollments.filter(
      (e) => e.courseId === courseId && e.status !== 'dropped'
    );
    const newEvals: Evaluation[] = [];

    for (const enr of courseEnrollments) {
      const hasSelf = evaluations.some(
        (e) => e.courseId === courseId && e.studentId === enr.studentId && e.sessionNumber === sessionNumber && e.type === 'self'
      );
      if (hasSelf) continue;

      // 获取学生历史自评平均分
      const historyEvals = evaluations.filter(
        (e) => e.courseId === courseId && e.studentId === enr.studentId && e.type === 'self' && e.sessionNumber < sessionNumber
      );
      if (historyEvals.length === 0) continue;

      const avgScore = Math.round(historyEvals.reduce((s, e) => s + e.score, 0) / historyEvals.length);
      const student = students.find((s) => s.id === enr.studentId);

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
      });
    }

    if (newEvals.length > 0) {
      const allEvals = [...evaluations, ...newEvals];
      saveToStorage('evaluations', allEvals);
      set({ evaluations: allEvals });
    }
  },
  checkEvalReminders: () => {
    const { evalReminders } = get();
    const now = new Date();
    const hasUpcoming = evalReminders.some((r) => {
      if (r.status === 'completed') return false;
      const deadline = new Date(r.deadline);
      return deadline >= now;
    });
    set({ hasEvalReminders: hasUpcoming });
  },
  recalculateProgress: (courseId, studentId) => {
    const { schedules, enrollments } = get();
    const courseSchedules = schedules.filter((s) => s.courseId === courseId);
    const now = new Date();
    const pastSchedules = courseSchedules.filter((s) => new Date(s.startDate) < now).length;
    const totalSchedules = courseSchedules.length;
    const timeElapsedRatio = totalSchedules > 0 ? Math.round((pastSchedules / totalSchedules) * 100) : 0;

    const updated = enrollments.map((e) => {
      if (e.courseId === courseId && e.studentId === studentId) {
        const newProgress = Math.round((timeElapsedRatio + e.progress) / 2);
        return { ...e, progress: newProgress };
      }
      return e;
    });
    saveToStorage('enrollments', updated);
    set({ enrollments: updated });
  },
  // ====== 成绩权重配置 ======
  saveGradeConfig: (config) => {
    const gradeConfigs = { ...get().gradeConfigs, [config.courseId]: config };
    saveToStorage('gradeConfigs', gradeConfigs);
    set({ gradeConfigs });
  },
  getGradeConfig: (courseId) => {
    return get().gradeConfigs[courseId] || getDefaultGradeConfig(courseId);
  },
  addDetailedGrade: (dg) => {
    const detailedGrades = [...get().detailedGrades, dg];
    saveToStorage('detailedGrades', detailedGrades);
    set({ detailedGrades });
  },
  updateDetailedGrade: (id, data) => {
    const detailedGrades = get().detailedGrades.map((d) => (d.id === id ? { ...d, ...data } : d));
    saveToStorage('detailedGrades', detailedGrades);
    set({ detailedGrades });
  },
  getDetailedGrades: (courseId) => {
    return get().detailedGrades.filter((d) => d.courseId === courseId);
  },
  calcTotalScore: (courseId, dg) => {
    const cfg = get().gradeConfigs[courseId] || getDefaultGradeConfig(courseId);
    const sumW = (a: number | undefined, b: number) => (a ?? 0) * b / 100;
    const regular = (dg.selfEvalScore ?? 0) * cfg.selfEvalWeight / 100
      + (dg.peerReviewScore ?? 0) * cfg.peerReviewWeight / 100
      + (dg.interGroupScore ?? 0) * cfg.interGroupEvalWeight / 100
      + (dg.teacherScore ?? 0) * cfg.teacherScoreWeight / 100
      + (dg.mentorScore ?? 0) * cfg.mentorScoreWeight / 100;
    const midterm = ((dg.midtermExamScore ?? 0) * cfg.midtermExamWeight + (dg.midtermProjectScore ?? 0) * cfg.midtermProjectWeight) / 100;
    const final = ((dg.finalExamScore ?? 0) * cfg.finalExamWeight + (dg.finalProjectScore ?? 0) * cfg.finalProjectWeight) / 100;
    return Math.round(regular * cfg.regularWeight / 100 + midterm * cfg.midtermWeight / 100 + final * cfg.finalWeight / 100);
  },
}));