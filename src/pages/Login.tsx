import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Shield, BookOpen, User } from 'lucide-react';
import { useStore } from '@/store';

type UserRole = 'admin' | 'teacher' | 'student';

const roles = [
  { id: 'admin' as UserRole, label: '管理员', icon: Shield, desc: '课程、学员、排课、数据管理', color: 'ring-amber-500 border-amber-500 bg-amber-50' },
  { id: 'teacher' as UserRole, label: '教师', icon: BookOpen, desc: '授课管理、学员进度、成绩录入', color: 'ring-emerald-500 border-emerald-500 bg-emerald-50' },
  { id: 'student' as UserRole, label: '学生', icon: User, desc: '我的课程、课表、学习进度', color: 'ring-blue-500 border-blue-500 bg-blue-50' },
];

const rolePortals: Record<UserRole, string> = {
  admin: '/admin/courses',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [error, setError] = useState('');
  const login = useStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    login(username, selectedRole);
    navigate(rolePortals[selectedRole]);
  };

  return (
    <div className="min-h-screen flex bg-[#f1f5f9]">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-amber-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center px-12">
          <div className="w-20 h-20 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
            <GraduationCap className="w-12 h-12 text-[#0f172a]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">课程管理实施平台</h1>
          <p className="text-white/60 text-lg">三大独立门户 · 高效协同管理</p>
          <div className="flex gap-4 justify-center mt-8">
            <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm">管理员端</div>
            <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm">教师端</div>
            <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm">学生端</div>
          </div>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-[#0f172a]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">课程管理实施平台</h2>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2 hidden lg:block">欢迎登录</h2>
          <p className="text-gray-500 mb-6 hidden lg:block">请选择角色并输入账号信息</p>

          {/* 角色选择 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    isSelected ? role.color + ' shadow-md' : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-1 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`} />
                  <span className={`text-xs font-medium ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{role.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
              <input
                type="text" value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="请输入用户名"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-amber-500/25"
            >
              登录
            </button>

            <p className="text-center text-xs text-gray-400">
              演示账号：任意用户名和密码即可登录体验
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}