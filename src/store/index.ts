import { create } from 'zustand';
import type { Course, Category, Student, Schedule, Enrollment, Teacher, Grade, CloudFile, TodoItem, OnlineDoc, Note } from '@/types';
import { courses as mockCourses, categories as mockCategories, students as mockStudents, schedules as mockSchedules, enrollments as mockEnrollments, teachers as mockTeachers, grades as mockGrades } from '@/data/mockData';

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
  isLoggedIn: loadFromStorage<boolean>('isLoggedIn', false),
  currentUser: loadFromStorage<string | null>('currentUser', null),
  currentRole: loadFromStorage<UserRole>('currentRole', null),

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
    set({ courses });
  },
  updateCourse: (id, data) => {
    const courses = get().courses.map((c) => (c.id === id ? { ...c, ...data } : c));
    saveToStorage('courses', courses);
    set({ courses });
  },
  deleteCourse: (id) => {
    const courses = get().courses.filter((c) => c.id !== id);
    saveToStorage('courses', courses);
    set({ courses });
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
    const grades = [...get().grades, grade];
    saveToStorage('grades', grades);
    set({ grades });
  },
  updateGrade: (id, data) => {
    const grades = get().grades.map((g) => (g.id === id ? { ...g, ...data } : g));
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
    const todos = [...get().todos, todo];
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
    const notes = [...get().notes, note];
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
}));