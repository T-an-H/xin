import { useMemo, useState } from 'react';
import { useStore } from '@/store';
import { Search, BookOpen, Users, TrendingUp, Award } from 'lucide-react';

const getAcademicYear = (dateStr: string) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

export default function Courses() {
  const { courses, categories, enrollments, students, teachers, grades } = useStore();
  const [courseNameFilter, setCourseNameFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  const academicYears = useMemo(() => {
    return Array.from(new Set(courses.map((course) => getAcademicYear(course.createdAt)))).sort();
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses
      .filter((course) => course.status === 'active')
      .filter((course) => {
        const teacher = teachers.find((item) => item.name === course.teacher || item.courseIds.includes(course.id));
        const matchCourse = course.title.toLowerCase().includes(courseNameFilter.toLowerCase());
        const matchTeacher = teacherFilter === '' || (teacher?.name || course.teacher).toLowerCase().includes(teacherFilter.toLowerCase());
        const matchCategory = categoryFilter === 'all' || course.categoryId === categoryFilter;
        const matchYear = yearFilter === 'all' || getAcademicYear(course.createdAt) === yearFilter;
        return matchCourse && matchTeacher && matchCategory && matchYear;
      });
  }, [courses, categoryFilter, courseNameFilter, teacherFilter, teachers, yearFilter]);

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || '未分类';
  const getCategoryColor = (id: string) => categories.find((c) => c.id === id)?.color || '#94a3b8';

  const getCourseStats = (courseId: string) => {
    const courseEnrollments = enrollments.filter((e) => e.courseId === courseId);
    const courseGrades = grades.filter((g) => g.courseId === courseId);
    const avgProgress = courseEnrollments.length > 0
      ? Math.round(courseEnrollments.reduce((sum, e) => sum + e.progress, 0) / courseEnrollments.length)
      : 0;
    const avgScore = courseGrades.length > 0
      ? Math.round(courseGrades.reduce((sum, g) => sum + g.score, 0) / courseGrades.length)
      : 0;
    return {
      studentCount: courseEnrollments.length,
      averageProgress: avgProgress,
      averageScore: avgScore,
      completionCount: courseEnrollments.filter((e) => e.status === 'completed').length,
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">课程管理</h1>
        <p className="text-gray-500 mt-1">按学年、课程名和老师名查询已开设课程，查看相关学生学习情况和教师教学情况</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={courseNameFilter}
            onChange={(e) => setCourseNameFilter(e.target.value)}
            placeholder="按课程名查询"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm"
          />
        </div>
        <input
          type="text"
          value={teacherFilter}
          onChange={(e) => setTeacherFilter(e.target.value)}
          placeholder="按老师名查询"
          className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm min-w-[180px]"
        />
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 outline-none text-sm bg-white"
        >
          <option value="all">全部学年</option>
          {academicYears.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 outline-none text-sm bg-white"
        >
          <option value="all">全部分类</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const stats = getCourseStats(course.id);
          const teacher = teachers.find((item) => item.name === course.teacher || item.courseIds.includes(course.id));
          const student = students.find((item) => item.name === course.teacher);

          return (
            <div key={course.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(course.categoryId) }} />
                    <span className="text-xs text-gray-500">{getCategoryName(course.categoryId)}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 whitespace-nowrap">已开设</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Users className="w-4 h-4" /> 学员数
                  </div>
                  <div className="mt-1 font-semibold text-gray-900">{stats.studentCount}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <TrendingUp className="w-4 h-4" /> 平均进度
                  </div>
                  <div className="mt-1 font-semibold text-gray-900">{stats.averageProgress}%</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 col-span-2">
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Award className="w-4 h-4" /> 平均成绩
                  </div>
                  <div className="mt-1 font-semibold text-gray-900">{stats.averageScore} 分</div>
                  <div className="text-xs text-gray-400 mt-1">已完成 {stats.completionCount} 人</div>
                </div>
              </div>

              <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">教师教学情况</span>
                </div>
                <p className="mt-2 text-sm text-amber-800">{teacher?.name || course.teacher || '待安排'}</p>
                <p className="text-xs text-amber-700/80">{teacher?.email || student?.email || '可继续补充授课信息'}</p>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
          暂无匹配的已开设课程
        </div>
      )}
    </div>
  );
}