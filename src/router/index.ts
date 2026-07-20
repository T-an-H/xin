import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '@/components/Layout.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/Login.vue'),
    },
    {
      path: '/admin',
      component: Layout,
      redirect: '/',
      children: [
        {
          path: 'courses',
          name: 'AdminCourses',
          component: () => import('@/pages/admin/Courses.vue'),
        },
        {
          path: 'statistics',
          name: 'AdminStatistics',
          component: () => import('@/pages/admin/Statistics.vue'),
        },
        {
          path: 'categories',
          name: 'AdminCategories',
          component: () => import('@/pages/admin/Categories.vue'),
        },
        {
          path: 'schedule',
          name: 'AdminSchedule',
          component: () => import('@/pages/admin/Schedule.vue'),
        },
        {
          path: 'students',
          name: 'AdminStudents',
          component: () => import('@/pages/admin/Students.vue'),
        },
        {
          path: 'students/:id',
          name: 'AdminStudentDetail',
          component: () => import('@/pages/admin/StudentDetail.vue'),
        },
      ],
    },
    {
      path: '/teacher',
      component: Layout,
      redirect: '/',
      children: [
        {
          path: 'dashboard',
          name: 'TeacherDashboard',
          component: () => import('@/pages/teacher/Dashboard.vue'),
        },
        {
          path: 'courses',
          name: 'TeacherCourses',
          component: () => import('@/pages/teacher/Courses.vue'),
        },
        {
          path: 'students',
          name: 'TeacherStudents',
          component: () => import('@/pages/teacher/Students.vue'),
        },
        {
          path: 'grades',
          name: 'TeacherGrades',
          component: () => import('@/pages/teacher/Grades.vue'),
        },
        {
          path: 'extra',
          name: 'TeacherExtra',
          component: () => import('@/pages/teacher/Extra.vue'),
        },
        {
          path: 'evaluation',
          name: 'TeacherEvaluation',
          component: () => import('@/pages/teacher/Evaluation.vue'),
        },
      ],
    },
    {
      path: '/student',
      component: Layout,
      redirect: '/',
      children: [
        {
          path: 'dashboard',
          name: 'StudentDashboard',
          component: () => import('@/pages/student/Dashboard.vue'),
        },
        {
          path: 'courses',
          name: 'StudentCourses',
          component: () => import('@/pages/student/Courses.vue'),
        },
        {
          path: 'courses/:id',
          name: 'StudentCourseLearn',
          component: () => import('@/pages/student/CourseLearn.vue'),
        },
        {
          path: 'schedule',
          name: 'StudentSchedule',
          component: () => import('@/pages/student/Schedule.vue'),
        },
        {
          path: 'progress',
          name: 'StudentProgress',
          component: () => import('@/pages/student/Progress.vue'),
        },
        {
          path: 'profile',
          name: 'StudentProfile',
          component: () => import('@/pages/student/Profile.vue'),
        },
        {
          path: 'grades',
          name: 'StudentGrades',
          component: () => import('@/pages/student/Grades.vue'),
        },
        {
          path: 'extra',
          name: 'StudentExtra',
          component: () => import('@/pages/student/Extra.vue'),
        },
      ],
    },
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ],
})

export default router