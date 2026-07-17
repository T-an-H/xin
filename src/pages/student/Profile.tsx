import { useStore } from '@/store';
import { User, Mail, Phone, Calendar, BookOpen, Award, TrendingUp, BarChart3 } from 'lucide-react';

export default function StudentProfile() {
  const { students, enrollments, courses, grades, currentUser } = useStore();
  const student = students.find((s) => s.name === currentUser);
  const myEnrollments = student ? enrollments.filter((e) => e.studentId === student.id) : [];
  const myGrades = student ? grades.filter((g) => g.studentId === student.id) : [];
  const completed = myEnrollments.filter((e) => e.status === 'completed').length;
  const inProgress = myEnrollments.filter((e) => e.status === 'in_progress').length;
  const avgScore = myGrades.length > 0 ? Math.round(myGrades.reduce((s, g) => s + g.score, 0) / myGrades.length) : 0;
  const totalCredits = myEnrollments.reduce((sum, e) => {
    const course = courses.find((c) => c.id === e.courseId);
    return sum + (course ? Math.round(course.duration / 8) : 0);
  }, 0);

  const radarData = [
    { label: '理论学习', value: 85 },
    { label: '实践能力', value: 70 },
    { label: '创新思维', value: 65 },
    { label: '团队协作', value: 80 },
    { label: '自主学习', value: 75 },
    { label: '问题解决', value: 78 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">个人画像</h1>
        <p className="text-gray-500 mt-1">查看个人信息与学习能力分析</p>
      </div>

      {/* 个人信息卡片 */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-blue-600">{student?.name?.charAt(0) || '?'}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{student?.name || currentUser || '未知用户'}</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-3">
              <span className="flex items-center gap-2 text-sm text-gray-500"><Mail className="w-4 h-4" /> {student?.email || '未设置'}</span>
              <span className="flex items-center gap-2 text-sm text-gray-500"><Phone className="w-4 h-4" /> {student?.phone || '未设置'}</span>
              <span className="flex items-center gap-2 text-sm text-gray-500"><Calendar className="w-4 h-4" /> 入学时间：{student?.joinDate || '未知'}</span>
              <span className="flex items-center gap-2 text-sm text-gray-500"><User className="w-4 h-4" /> 学号：{student?.id || '未知'}</span>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center px-4 py-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{myEnrollments.length}</p>
              <p className="text-xs text-gray-500 mt-1">已报名</p>
            </div>
            <div className="text-center px-4 py-3 bg-emerald-50 rounded-lg">
              <p className="text-2xl font-bold text-emerald-600">{completed}</p>
              <p className="text-xs text-gray-500 mt-1">已完成</p>
            </div>
            <div className="text-center px-4 py-3 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{avgScore}</p>
              <p className="text-xs text-gray-500 mt-1">平均分</p>
            </div>
          </div>
        </div>
      </div>

      {/* 能力雷达图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" /> 能力雷达图
          </h3>
          <div className="relative w-72 h-72 mx-auto">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* 网格 */}
              {[1, 2, 3, 4, 5].map((level) => {
                const r = level * 30;
                const points = radarData.map((_, i) => {
                  const angle = (i * 60 - 90) * Math.PI / 180;
                  return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                }).join(' ');
                return <polygon key={level} points={points} fill="none" stroke="#e2e8f0" strokeWidth="1" />;
              })}
              {/* 轴线 */}
              {radarData.map((_, i) => {
                const angle = (i * 60 - 90) * Math.PI / 180;
                return <line key={i} x1="100" y1="100" x2={100 + 150 * Math.cos(angle)} y2={100 + 150 * Math.sin(angle)} stroke="#e2e8f0" strokeWidth="1" />;
              })}
              {/* 数据区域 */}
              <polygon
                points={radarData.map((d, i) => {
                  const angle = (i * 60 - 90) * Math.PI / 180;
                  const r = d.value * 1.5;
                  return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                }).join(' ')}
                fill="rgba(59, 130, 246, 0.2)"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              {/* 数据点 */}
              {radarData.map((d, i) => {
                const angle = (i * 60 - 90) * Math.PI / 180;
                const r = d.value * 1.5;
                const x = 100 + r * Math.cos(angle);
                const y = 100 + r * Math.sin(angle);
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="#3b82f6" />
                    <text x={x + (x > 100 ? 12 : -12)} y={y + 4} textAnchor={x > 100 ? 'start' : 'end'} fontSize="10" fill="#64748b">
                      {d.label} {d.value}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 学习统计 */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" /> 学习统计
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">学习中课程</span>
              <span className="font-semibold text-gray-900">{inProgress} 门</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">已完成课程</span>
              <span className="font-semibold text-emerald-600">{completed} 门</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">总学分</span>
              <span className="font-semibold text-blue-600">{totalCredits} 学分</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">平均成绩</span>
              <span className="font-semibold text-amber-600">{avgScore} 分</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">平均进度</span>
              <span className="font-semibold text-gray-900">
                {myEnrollments.length > 0 ? Math.round(myEnrollments.reduce((s, e) => s + e.progress, 0) / myEnrollments.length) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 学习轨迹 */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-500" /> 学习轨迹
        </h3>
        <div className="relative">
          {myEnrollments.map((enr, index) => {
            const course = courses.find((c) => c.id === enr.courseId);
            return (
              <div key={enr.id} className="flex gap-4 pb-6 relative">
                {index < myEnrollments.length - 1 && <div className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-blue-200" />}
                <div className={`w-4 h-4 rounded-full mt-1 flex-shrink-0 ${
                  enr.status === 'completed' ? 'bg-emerald-500' :
                  enr.status === 'in_progress' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{course?.title || '未知课程'}</p>
                  <p className="text-sm text-gray-500">
                    {enr.enrollDate} · 进度 {enr.progress}% · 
                    {enr.status === 'completed' ? ' 已完成' : enr.status === 'in_progress' ? ' 学习中' : ' 已报名'}
                  </p>
                </div>
              </div>
            );
          })}
          {myEnrollments.length === 0 && <p className="text-gray-400 text-center py-4">暂无学习记录</p>}
        </div>
      </div>
    </div>
  );
}