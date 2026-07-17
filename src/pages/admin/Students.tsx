import { useState } from 'react';
import { useStore } from '@/store';
import { Search, ChevronRight, Mail, Phone, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Students() {
  const { students, enrollments, courses } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = students.filter((s) => {
    const matchSearch = s.name.includes(search) || s.phone.includes(search) || s.email.includes(search);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const getStudentEnrollments = (studentId: string) => enrollments.filter((e) => e.studentId === studentId);
  const getCourseTitle = (courseId: string) => courses.find((c) => c.id === courseId)?.title || '未知';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">学员管理</h1>
        <p className="text-gray-500 mt-1">查看和管理所有学员信息</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="搜索学员姓名/电话/邮箱..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 outline-none text-sm bg-white">
          <option value="all">全部状态</option>
          <option value="active">在读</option>
          <option value="inactive">已结业</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paged.map((student) => {
          const studentEnrollments = getStudentEnrollments(student.id);
          const completedCount = studentEnrollments.filter((e) => e.status === 'completed').length;
          return (
            <Link key={student.id} to={`/students/${student.id}`}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200 group">
              <div className="flex items-start gap-4">
                <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${student.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}>
                      {student.status === 'active' ? '在读' : '已结业'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {student.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {student.phone}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {student.joinDate}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-gray-500">已报名 <strong className="text-gray-900">{studentEnrollments.length}</strong> 门</span>
                    <span className="text-gray-500">已完成 <strong className="text-emerald-600">{completedCount}</strong> 门</span>
                  </div>
                  {studentEnrollments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {studentEnrollments.slice(0, 3).map((enr) => (
                        <span key={enr.id} className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 truncate max-w-[120px]">
                          {getCourseTitle(enr.courseId)}
                        </span>
                      ))}
                      {studentEnrollments.length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-400">+{studentEnrollments.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-amber-500 transition-colors flex-shrink-0 mt-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}