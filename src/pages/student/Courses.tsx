import { useState } from 'react';
import { useStore } from '@/store';
import { Search, BookOpen, ChevronDown, ChevronUp, ExternalLink, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const academicYears = ['2024-2025', '2025-2026', '2026-2027'];

// 模拟知识图谱数据 (JSON格式)
const knowledgeGraphs: Record<string, { nodes: { id: string; label: string; category: string; level: number }[]; edges: { source: string; target: string; relation: string }[] }> = {
  'course-1': {
    nodes: [
      { id: 'n1', label: 'React基础', category: '基础', level: 1 },
      { id: 'n2', label: 'JSX语法', category: '基础', level: 1 },
      { id: 'n3', label: '组件化开发', category: '基础', level: 1 },
      { id: 'n4', label: 'Hooks', category: '进阶', level: 2 },
      { id: 'n5', label: 'Context', category: '进阶', level: 2 },
      { id: 'n6', label: '性能优化', category: '卓越', level: 3 },
    ],
    edges: [
      { source: 'n1', target: 'n2', relation: '包含' },
      { source: 'n1', target: 'n3', relation: '包含' },
      { source: 'n3', target: 'n4', relation: '延伸' },
      { source: 'n4', target: 'n5', relation: '关联' },
      { source: 'n4', target: 'n6', relation: '进阶' },
    ],
  },
  'course-2': {
    nodes: [
      { id: 'n1', label: 'Python基础', category: '基础', level: 1 },
      { id: 'n2', label: 'Pandas', category: '基础', level: 1 },
      { id: 'n3', label: '数据清洗', category: '进阶', level: 2 },
      { id: 'n4', label: '数据可视化', category: '进阶', level: 2 },
      { id: 'n5', label: '机器学习', category: '卓越', level: 3 },
    ],
    edges: [
      { source: 'n1', target: 'n2', relation: '基础' },
      { source: 'n2', target: 'n3', relation: '进阶' },
      { source: 'n3', target: 'n4', relation: '关联' },
      { source: 'n4', target: 'n5', relation: '延伸' },
    ],
  },
};

const defaultGraph = {
  nodes: [
    { id: 'n1', label: '基础概念', category: '基础', level: 1 },
    { id: 'n2', label: '核心知识', category: '基础', level: 1 },
    { id: 'n3', label: '进阶应用', category: '进阶', level: 2 },
    { id: 'n4', label: '高级技巧', category: '卓越', level: 3 },
  ],
  edges: [
    { source: 'n1', target: 'n2', relation: '基础' },
    { source: 'n2', target: 'n3', relation: '进阶' },
    { source: 'n3', target: 'n4', relation: '延伸' },
  ],
};

export default function StudentCourses() {
  const { students, enrollments, courses, grades, currentUser } = useStore();
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('all');
  const [expandedGraph, setExpandedGraph] = useState<string | null>(null);
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);

  const student = students.find((s) => s.name === currentUser);
  const myEnrollments = student ? enrollments.filter((e) => e.studentId === student.id) : [];

  const getAcademicYear = (date?: string) => {
    if (!date) return '2026-2027';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '2026-2027';

    const month = parsed.getMonth() + 1;
    const academicStartYear = month >= 9 ? parsed.getFullYear() : parsed.getFullYear() - 1;
    return `${academicStartYear}-${academicStartYear + 1}`;
  };

  const filtered = myEnrollments.filter((enr) => {
    const course = courses.find((c) => c.id === enr.courseId);
    const matchSearch = course?.title.toLowerCase().includes(search.toLowerCase()) || false;
    const matchYear = year === 'all' || getAcademicYear(course?.createdAt || enr.enrollDate) === year;
    return matchSearch && matchYear;
  });

  const getCourseTitle = (id: string) => courses.find((c) => c.id === id)?.title || '未知';
  const getCourseTeacher = (id: string) => courses.find((c) => c.id === id)?.teacher || '未知';
  const getCourseDesc = (id: string) => courses.find((c) => c.id === id)?.description || '';
  const getCourseCredit = (id: string) => Math.round((courses.find((c) => c.id === id)?.duration || 0) / 8);
  const getGrade = (courseId: string) => grades.find((g) => g.studentId === student?.id && g.courseId === courseId);
  const getGraph = (courseId: string): { nodes: { id: string; label: string; category: string; level: number }[]; edges: { source: string; target: string; relation: string }[] } =>
  knowledgeGraphs[courseId] || defaultGraph;

  const statusLabels: Record<string, string> = { enrolled: '已报名', in_progress: '学习中', completed: '已完成', dropped: '已退课' };
  const statusColors: Record<string, string> = {
    enrolled: 'bg-blue-50 text-blue-600', in_progress: 'bg-amber-50 text-amber-600',
    completed: 'bg-emerald-50 text-emerald-600', dropped: 'bg-red-50 text-red-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">课程管理</h1>
        <p className="text-gray-500 mt-1">查看已报名课程，按学年查询，了解课程知识图谱与成绩</p>
      </div>

      {/* 查询区域 */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="搜索课程..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
        </div>
        <select value={year} onChange={(e) => setYear(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm bg-white">
          <option value="all">全部学年</option>
          {academicYears.map((y) => <option key={y} value={y}>{y}学年</option>)}
        </select>
      </div>

      {/* 课程列表 */}
      <div className="space-y-4">
        {filtered.map((enr) => {
          const course = courses.find((c) => c.id === enr.courseId);
          const grade = getGrade(enr.courseId);
          const graph = getGraph(enr.courseId);
          if (!course) return null;

          const levelCounts = { 1: 0, 2: 0, 3: 0 };
          graph.nodes.forEach((n: { level: number }) => { levelCounts[n.level as keyof typeof levelCounts]++; });

          return (
            <div key={enr.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* 课程头部 */}
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <img src={course.cover} alt={course.title} className="w-24 h-16 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[enr.status]}`}>
                        {statusLabels[enr.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{course.teacher} · {course.duration}课时 · {getCourseCredit(course.id)}学分</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[200px]">
                        <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${enr.progress}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{enr.progress}%</span>
                      {grade && <span className="text-xs font-medium text-emerald-600">成绩：{grade.score}分</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/student/courses/${course.id}`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4" /> 进入学习
                    </Link>
                  </div>
                </div>
              </div>

              {/* 知识图谱折叠 */}
              <div className="border-t border-gray-50">
                <button onClick={() => setExpandedGraph(expandedGraph === course.id ? null : course.id)}
                  className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    知识图谱 (JSON)
                    <span className="text-xs text-gray-400">基础({levelCounts[1]}) 进阶({levelCounts[2]}) 卓越({levelCounts[3]})</span>
                  </span>
                  {expandedGraph === course.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedGraph === course.id && (
                  <div className="px-5 pb-4">
                    <pre className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 overflow-x-auto max-h-64 overflow-y-auto">
                      {JSON.stringify(graph, null, 2)}
                    </pre>
                    {/* 知识图谱可视化 */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {graph.nodes.map((n: { id: string; label: string; category: string; level: number }) => (
                        <span key={n.id} className={`text-xs px-2.5 py-1 rounded-full ${
                          n.level === 1 ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                          n.level === 2 ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          'bg-purple-50 text-purple-600 border border-purple-200'
                        }`}>
                          {n.label} ({n.category})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 课程信息与成绩 */}
              <div className="border-t border-gray-50">
                <button onClick={() => setExpandedInfo(expandedInfo === course.id ? null : course.id)}
                  className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                    课程基础信息与成绩
                  </span>
                  {expandedInfo === course.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedInfo === course.id && (
                  <div className="px-5 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">课程信息</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">课程名称：</span>{course.title}</p>
                        <p><span className="text-gray-500">授课教师：</span>{course.teacher}</p>
                        <p><span className="text-gray-500">课时/学分：</span>{course.duration}课时 / {getCourseCredit(course.id)}学分</p>
                        <p><span className="text-gray-500">课程描述：</span>{course.description}</p>
                        <p><span className="text-gray-500">创建时间：</span>{course.createdAt}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">成绩信息</h4>
                      {grade ? (
                        <div className="space-y-2 text-sm">
                          <p><span className="text-gray-500">成绩：</span><span className="font-semibold text-lg text-emerald-600">{grade.score}分</span></p>
                          <p><span className="text-gray-500">评语：</span>{grade.comment || '无'}</p>
                          <p><span className="text-gray-500">录入时间：</span>{grade.gradedAt}</p>
                          <p><span className="text-gray-500">学习进度：</span>{enr.progress}%</p>
                          <div className="mt-2">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${enr.progress}%` }} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">成绩暂未录入</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">暂未报名课程</div>
      )}
    </div>
  );
}