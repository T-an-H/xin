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
  credits: number;
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
  totalScore: number;
  semester: string;
  comment: string;
  gradedAt: string;
}

/** 学习层级 */
export type LearningTier = 'basic' | 'advanced' | 'excellent';

export const TierLabels: Record<LearningTier, string> = {
  basic: '基础层',
  advanced: '进阶层',
  excellent: '卓越层',
};

export interface Student {
  id: string;
  studentId: string;
  name: string;
  className: string;
  phone: string;
  email: string;
  avatar: string;
  joinDate: string;
  status: 'active' | 'inactive';
  /** 高考成绩或入学成绩（用于无上学期成绩时判定层级） */
  enrollmentScore?: number;
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

export interface GradeWeightConfig {
  courseId: string;
  regularWeight: number;
  midtermWeight: number;
  finalWeight: number;
  selfEvalWeight: number;
  peerReviewWeight: number;
  interGroupEvalWeight: number;
  teacherScoreWeight: number;
  mentorScoreWeight: number;
  midtermExamWeight: number;
  midtermProjectWeight: number;
  finalExamWeight: number;
  finalProjectWeight: number;
}

export function getDefaultGradeConfig(courseId: string): GradeWeightConfig {
  return {
    courseId,
    regularWeight: 40,
    midtermWeight: 0,
    finalWeight: 60,
    selfEvalWeight: 10,
    peerReviewWeight: 20,
    interGroupEvalWeight: 10,
    teacherScoreWeight: 30,
    mentorScoreWeight: 30,
    midtermExamWeight: 50,
    midtermProjectWeight: 50,
    finalExamWeight: 50,
    finalProjectWeight: 50,
  };
}

export interface DetailedGrade {
  id: string;
  studentId: string;
  courseId: string;
  selfEvalScore?: number;
  peerReviewScore?: number;
  interGroupScore?: number;
  teacherScore?: number;
  mentorScore?: number;
  midtermExamScore?: number;
  midtermProjectScore?: number;
  finalExamScore?: number;
  finalProjectScore?: number;
  gradedAt: string;
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
  createdBy: string;
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
  createdBy: string;
}

// ========== 评价系统 ==========

/** 评价类型 */
export type EvalType = 'self' | 'intra_group' | 'inter_group' | 'teacher' | 'mentor';

export const EvalTypeLabels: Record<EvalType, string> = {
  self: '自评',
  intra_group: '组内互评',
  inter_group: '组间互评',
  teacher: '教师评价',
  mentor: '企业导师评价',
};

export const EvalTypeColors: Record<EvalType, string> = {
  self: 'text-blue-600 bg-blue-50 border-blue-200',
  intra_group: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  inter_group: 'text-purple-600 bg-purple-50 border-purple-200',
  teacher: 'text-amber-600 bg-amber-50 border-amber-200',
  mentor: 'text-rose-600 bg-rose-50 border-rose-200',
};

/** 评价方案模板 */
export type EvalTemplate = 'all' | 'standard' | 'simple' | 'project';

export const EvalTemplateLabels: Record<EvalTemplate, string> = {
  all: '全评价',
  standard: '标准评价',
  simple: '简易评价',
  project: '项目制评价',
};

export const EvalTemplateDescs: Record<EvalTemplate, string> = {
  all: '5种评价全部启用：自评+组内互评+组间互评+教师评价+企业导师评价',
  standard: '自评+教师评价+组间互评',
  simple: '仅教师评价+自评',
  project: '增加企业导师+组间互评',
};

/** 模板→评价类型映射 */
export const TEMPLATE_EVAL_TYPES: Record<EvalTemplate, EvalType[]> = {
  all: ['self', 'intra_group', 'inter_group', 'teacher', 'mentor'],
  standard: ['self', 'teacher', 'inter_group'],
  simple: ['self', 'teacher'],
  project: ['self', 'intra_group', 'teacher', 'mentor', 'inter_group'],
};

/** 评价频率 */
export type EvalFrequency = 'biweekly' | 'per_unit' | 'project_milestone' | 'custom';

export const EvalFrequencyLabels: Record<EvalFrequency, string> = {
  biweekly: '每2周一次',
  per_unit: '每个知识单元',
  project_milestone: '仅项目节点',
  custom: '自定义次数',
};

export const EvalFrequencyDescs: Record<EvalFrequency, string> = {
  biweekly: '约每2周进行一次评价',
  per_unit: '每个知识单元学习完成后进行评价',
  project_milestone: '仅在项目关键节点进行评价',
  custom: '手动设置评价总次数',
};

/** 逾期处理规则 */
export type OverdueRule = 'average' | 'none';

export const OverdueRuleLabels: Record<OverdueRule, string> = {
  average: '取历史平均分',
  none: '不做处理',
};

/** 课程评价配置 */
export interface EvaluationConfig {
  courseId: string;
  template: EvalTemplate;
  frequency: EvalFrequency;
  /** 自定义评价次数（仅 custom 时有效） */
  customSessions?: number;
  /** 是否有企业导师参与 */
  hasMentor: boolean;
  /** 逾期处理规则 */
  overdueRule: OverdueRule;
}

/** 评价记录 */
export interface Evaluation {
  id: string;
  courseId: string;
  studentId: string;
  sessionNumber: number;   // 第N次评价
  type: EvalType;
  score: number;
  evaluatorId: string;
  evaluatorName: string;
  comment?: string;
  createdAt: string;
}

/** 评价待办提醒 */
export interface EvalReminder {
  id: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  sessionNumber: number;
  deadline: string;
  status: 'pending' | 'completed' | 'overdue';
}

/** 学生分组 */
export interface StudentGroup {
  id: string;
  courseId: string;
  name: string;
  memberIds: string[];
}

/** 异常预警记录 */
export interface EvalAnomaly {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  sessionNumber: number;
  type: EvalType;
  selfScore: number;
  avgScore: number;
  diff: number;
  warning: string;
}