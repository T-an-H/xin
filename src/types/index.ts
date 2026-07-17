export interface Category {
  id: string;
  name: string;
  color: string;
  courseCount: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  cover: string;
  price: number;
  duration: number;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  teacher: string;
}

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  courseIds: string[];
}

export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  score: number;
  comment: string;
  gradedAt: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  joinDate: string;
  status: 'active' | 'inactive';
}

export interface Schedule {
  id: string;
  courseId: string;
  title: string;
  startDate: string;
  endDate: string;
  timeSlot: string;
  room: string;
  teacher: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  scheduleId: string;
  enrollDate: string;
  progress: number;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
}

export interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  activeCourses: number;
  recentEnrollments: number;
}

export interface CloudFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  dueDate?: string;
}

export interface OnlineDoc {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  lastEditedAt: string;
  lastEditedBy: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}