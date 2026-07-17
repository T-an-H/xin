import { useMemo, useState } from 'react';
import { useStore } from '@/store';
import { Download, BarChart3, TrendingUp, CheckCircle2, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const getAcademicYear = (dateStr: string) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

export default function Statistics() {
  const { courses, grades, students, teachers } = useStore();
  const [yearFilter, setYearFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');

  const academicYears = useMemo(() => {
    return Array.from(new Set([...courses.map((course) => getAcademicYear(course.createdAt)), ...grades.map((grade) => getAcademicYear(grade.gradedAt))])).sort();
  }, [courses, grades]);

  const filteredGrades = useMemo(() => {
    return grades.filter((grade) => {
      const course = courses.find((item) => item.id === grade.courseId);
      const teacher = teachers.find((item) => item.courseIds.includes(grade.courseId));
      const matchYear = yearFilter === 'all' || getAcademicYear(grade.gradedAt) === yearFilter || (course && getAcademicYear(course.createdAt) === yearFilter);
      const matchCourse = courseFilter === '' || (course?.title || '').toLowerCase().includes(courseFilter.toLowerCase());
      const matchTeacher = teacherFilter === '' || (teacher?.name || course?.teacher || '').toLowerCase().includes(teacherFilter.toLowerCase());
      return matchYear && matchCourse && matchTeacher;
    });
  }, [courseFilter, courses, grades, teacherFilter, teachers, yearFilter]);

  const courseScoreData = useMemo(() => {
    const grouped = filteredGrades.reduce<Record<string, { name: string; total: number; count: number }>>((acc, grade) => {
      const course = courses.find((item) => item.id === grade.courseId);
      if (!course) return acc;
      if (!acc[course.id]) {
        acc[course.id] = { name: course.title.length > 8 ? `${course.title.slice(0, 8)}...` : course.title, total: 0, count: 0 };
      }
      acc[course.id].total += grade.score;
      acc[course.id].count += 1;
      return acc;
    }, {});

    return Object.values(grouped).map((item) => ({
      name: item.name,
      score: item.count > 0 ? Math.round(item.total / item.count) : 0,
    }));
  }, [courses, filteredGrades]);

  const gradeDistribution = useMemo(() => {
    const buckets = [
      { name: '60 分以下', range: [0, 59], color: '#ef4444' },
      { name: '60-79 分', range: [60, 79], color: '#f59e0b' },
      { name: '80-89 分', range: [80, 89], color: '#3b82f6' },
      { name: '90-100 分', range: [90, 100], color: '#10b981' },
    ];

    return buckets.map((bucket) => ({
      ...bucket,
      count: filteredGrades.filter((item) => item.score >= bucket.range[0] && item.score <= bucket.range[1]).length,
    }));
  }, [filteredGrades]);

  const averageScore = filteredGrades.length > 0
    ? Math.round(filteredGrades.reduce((sum, item) => sum + item.score, 0) / filteredGrades.length)
    : 0;
  const passRate = filteredGrades.length > 0
    ? Math.round((filteredGrades.filter((item) => item.score >= 60).length / filteredGrades.length) * 100)
    : 0;

  const exportGrades = () => {
    const rows = [
      ['课程', '教师', '学生', '成绩', '状态', '评语'],
      ...filteredGrades.map((grade) => {
        const course = courses.find((item) => item.id === grade.courseId);
        const teacher = teachers.find((item) => item.courseIds.includes(grade.courseId));
        const student = students.find((item) => item.id === grade.studentId);
        return [
          course?.title || '未知课程',
          teacher?.name || '待安排',
          student?.name || '未知学生',
          grade.score,
          grade.score >= 60 ? '及格' : '不及格',
          grade.comment || '',
        ];
      }),
    ];

    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '成绩导出.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">成绩管理</h1>
          <p className="text-gray-500 mt-1">按学年、课程名和老师名查询成绩统计并导出成绩数据</p>
        </div>
        <button
          onClick={exportGrades}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          导出成绩
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <BarChart3 className="w-4 h-4" /> 平均成绩
          </div>
          <div className="mt-3 text-3xl font-semibold text-gray-900">{averageScore}</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <TrendingUp className="w-4 h-4" /> 及格率
          </div>
          <div className="mt-3 text-3xl font-semibold text-gray-900">{passRate}%</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <CheckCircle2 className="w-4 h-4" /> 已筛选成绩
          </div>
          <div className="mt-3 text-3xl font-semibold text-gray-900">{filteredGrades.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">课程平均成绩</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseScoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                <Tooltip formatter={(value: number) => [`${value} 分`, '平均成绩']} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">成绩分布</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}