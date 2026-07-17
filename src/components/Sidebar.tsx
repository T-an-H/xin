import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  LogOut,
  GraduationCap,
  ClipboardCheck,
  Award,
  User,
  Lightbulb,
  Users,
  Calendar,
} from 'lucide-react';
import { useStore } from '@/store';

const adminNavItems = [
  { to: '/admin/courses', icon: BookOpen, label: '课程管理' },
  { to: '/admin/statistics', icon: BarChart3, label: '成绩管理' },
];

const teacherNavItems = [
  { to: '/teacher/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/teacher/courses', icon: BookOpen, label: '我的课程' },
  { to: '/teacher/students', icon: Users, label: '学员进度' },
  { to: '/teacher/grades', icon: ClipboardCheck, label: '成绩录入' },
  { to: '/teacher/extra', icon: Lightbulb, label: '额外功能' },
];

const studentNavItems = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/student/profile', icon: User, label: '个人画像' },
  { to: '/student/courses', icon: BookOpen, label: '课程管理' },
  { to: '/student/grades', icon: Award, label: '成绩管理' },
  { to: '/student/schedule', icon: Calendar, label: '我的课表' },
  { to: '/student/extra', icon: Lightbulb, label: '额外功能' },
];

const roleConfig: Record<string, { items: typeof adminNavItems; color: string; label: string }> = {
  admin: { items: adminNavItems, color: 'bg-amber-500', label: '管理员端' },
  teacher: { items: teacherNavItems, color: 'bg-emerald-500', label: '教师端' },
  student: { items: studentNavItems, color: 'bg-blue-500', label: '学生端' },
};

export default function Sidebar() {
  const { currentRole, logout } = useStore();
  const config = roleConfig[currentRole || 'admin'];
  const navItems = config?.items || adminNavItems;

  return (
    <aside className="w-64 bg-[#0f172a] text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${config?.color || 'bg-amber-500'} flex items-center justify-center`}>
            <GraduationCap className="w-6 h-6 text-[#0f172a]" />
          </div>
          <div>
            <h1 className="font-bold text-lg">课程管理</h1>
            <p className="text-xs text-white/50">{config?.label || '平台'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}