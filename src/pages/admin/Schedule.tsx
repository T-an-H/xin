import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { Schedule } from '@/types';

const locales = { 'zh-CN': zhCN };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const messages = {
  next: '下一页', previous: '上一页', today: '今天', month: '月', week: '周', day: '日',
  agenda: '日程', date: '日期', time: '时间', event: '事件', noEventsInRange: '该时间段没有课程',
  showMore: (total: number) => `+${total} 更多`,
};

export default function SchedulePage() {
  const { schedules, courses, addSchedule, deleteSchedule } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    courseId: '', startDate: '', endDate: '', timeSlot: '09:00-11:00', room: '', teacher: '',
  });

  const events = useMemo(() => schedules.map((s) => {
    const [startH, startM] = s.timeSlot.split('-')[0].split(':').map(Number);
    const [endH, endM] = s.timeSlot.split('-')[1].split(':').map(Number);
    const start = new Date(s.startDate);
    start.setHours(startH, startM);
    const end = new Date(s.endDate);
    end.setHours(endH, endM);
    const course = courses.find((c) => c.id === s.courseId);
    return {
      id: s.id,
      title: `${s.title} (${s.room} · ${s.teacher})`,
      start,
      end,
      resource: s,
    };
  }), [schedules, courses]);

  const eventPropGetter = () => ({
    style: {
      backgroundColor: '#f59e0b',
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
      padding: '2px 6px',
    },
  });

  const handleCreate = () => {
    if (!newSchedule.courseId || !newSchedule.startDate || !newSchedule.room || !newSchedule.teacher) return;
    const course = courses.find((c) => c.id === newSchedule.courseId);
    if (!course) return;
    const schedule: Schedule = {
      id: `sch-${Date.now()}`,
      courseId: newSchedule.courseId,
      title: course.title,
      startDate: newSchedule.startDate,
      endDate: newSchedule.endDate || newSchedule.startDate,
      timeSlot: newSchedule.timeSlot,
      room: newSchedule.room,
      teacher: newSchedule.teacher,
    };
    addSchedule(schedule);
    setModalOpen(false);
    setNewSchedule({ courseId: '', startDate: '', endDate: '', timeSlot: '09:00-11:00', room: '', teacher: '' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除此排课吗？')) {
      deleteSchedule(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">排课管理</h1>
          <p className="text-gray-500 mt-1">查看和管理课程排课安排</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-lg shadow-amber-500/25">
          <Plus className="w-5 h-5" />
          <span>新建排课</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            defaultView={Views.MONTH}
            messages={messages}
            eventPropGetter={eventPropGetter}
            onSelectEvent={(event) => handleDelete(event.id as string)}
            style={{ height: '100%' }}
          />
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="新建排课">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择课程</label>
            <select value={newSchedule.courseId} onChange={(e) => setNewSchedule({ ...newSchedule, courseId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-500 outline-none text-sm bg-white">
              <option value="">选择课程</option>
              {courses.filter((c) => c.status === 'active').map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input type="date" value={newSchedule.startDate} onChange={(e) => setNewSchedule({ ...newSchedule, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input type="date" value={newSchedule.endDate} onChange={(e) => setNewSchedule({ ...newSchedule, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">时间段</label>
            <select value={newSchedule.timeSlot} onChange={(e) => setNewSchedule({ ...newSchedule, timeSlot: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-500 outline-none text-sm bg-white">
              <option value="09:00-11:00">09:00 - 11:00</option>
              <option value="09:00-12:00">09:00 - 12:00</option>
              <option value="14:00-16:00">14:00 - 16:00</option>
              <option value="14:00-17:00">14:00 - 17:00</option>
              <option value="19:00-21:00">19:00 - 21:00</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">教室</label>
              <input type="text" value={newSchedule.room} onChange={(e) => setNewSchedule({ ...newSchedule, room: e.target.value })}
                placeholder="如: A101" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">教师</label>
              <input type="text" value={newSchedule.teacher} onChange={(e) => setNewSchedule({ ...newSchedule, teacher: e.target.value })}
                placeholder="如: 王老师" className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
            <button onClick={handleCreate} className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors">创建</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}