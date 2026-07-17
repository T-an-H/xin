import { useStore } from '@/store';
import StatCard from '@/components/StatCard';
import { BookOpen, TrendingUp, Award, ArrowRight, Clock3, Sparkles, BellRing } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { students, enrollments, courses, schedules, grades, currentUser } = useStore();
  const student = students.find((s) => s.name === currentUser);
  const myEnrollments = student ? enrollments.filter((e) => e.studentId === student.id) : [];
  const myGrades = student ? grades.filter((g) => g.studentId === student.id) : [];
  const completed = myEnrollments.filter((e) => e.status === 'completed').length;
  const inProgress = myEnrollments.filter((e) => e.status === 'in_progress').length;
  const avgProgress = myEnrollments.length > 0
    ? Math.round(myEnrollments.reduce((sum, e) => sum + e.progress, 0) / myEnrollments.length)
    : 0;
  const averageScore = myGrades.length > 0 ? Math.round(myGrades.reduce((sum, g) => sum + g.score, 0) / myGrades.length) : 0;
  const upcomingCourses = schedules
    .filter((schedule) => myEnrollments.some((enr) => enr.courseId === schedule.courseId))
    .slice(0, 3);
  const recentActivity = [
    { title: 'AI 生成式应用开发', detail: '新增学习任务已发布', time: '2小时前' },
    { title: '数据可视化与商业分析', detail: '课程资源更新完成', time: '昨日' },
    { title: '课程学习提醒', detail: '今日有 2 门课程待完成任务', time: '今天' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">学习仪表盘</h1>
        <p className="text-gray-500 mt-1">欢迎回来，{currentUser}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={BookOpen} label="已报名课程" value={myEnrollments.length} color="bg-blue-500" />
        <StatCard icon={TrendingUp} label="平均进度" value={`${avgProgress}%`} color="bg-emerald-500" />
        <StatCard icon={Award} label="已完成" value={completed} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">我的课程</h3>
            <Link to="/student/courses" className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {myEnrollments.map((enr) => {
              const course = courses.find((c) => c.id === enr.courseId);
              return (
                <div key={enr.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <img src={course?.cover} alt={course?.title} className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{course?.title || '未知课程'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[200px]">
                        <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${enr.progress}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{enr.progress}%</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    enr.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                    enr.status === 'in_progress' ? 'bg-amber-50 text-amber-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {enr.status === 'completed' ? '已完成' : enr.status === 'in_progress' ? '学习中' : '已报名'}
                  </span>
                </div>
              );
            })}
            {myEnrollments.length === 0 && <p className="text-gray-400 text-center py-4">暂未报名课程</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock3 className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900">近期课程安排</h3>
            </div>
            <div className="space-y-3">
              {upcomingCourses.map((schedule) => {
                const course = courses.find((c) => c.id === schedule.courseId);
                return (
                  <div key={schedule.id} className="rounded-lg bg-gray-50 p-3">
                    <p className="font-medium text-gray-900">{course?.title || '未知课程'}</p>
                    <p className="text-sm text-gray-500 mt-1">{schedule.startDate} · {schedule.timeSlot}</p>
                  </div>
                );
              })}
              {upcomingCourses.length === 0 && <p className="text-sm text-gray-400">暂无近期安排</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900">学习反馈</h3>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 text-sm text-purple-700">
              平均成绩 {averageScore} 分，当前有 {inProgress} 门课程正在推进，建议继续保持高频练习。
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BellRing className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">平台动态</h3>
        </div>
        <div className="space-y-3">
          {recentActivity.map((item) => (
            <div key={item.title} className="flex items-start justify-between rounded-lg border border-gray-100 px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500">{item.detail}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}