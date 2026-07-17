import { useMemo } from 'react';
import { useStore } from '@/store';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'zh-CN': zhCN };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const messages = {
  next: '下一页', previous: '上一页', today: '今天', month: '月', week: '周', day: '日',
  agenda: '日程', date: '日期', time: '时间', event: '事件', noEventsInRange: '该时间段没有课程',
  showMore: (total: number) => `+${total} 更多`,
};

export default function StudentSchedule() {
  const { students, enrollments, schedules, currentUser } = useStore();
  const student = students.find((s) => s.name === currentUser);
  const myScheduleIds = student ? enrollments.filter((e) => e.studentId === student.id).map((e) => e.scheduleId) : [];
  const mySchedules = schedules.filter((s) => myScheduleIds.includes(s.id));

  const events = useMemo(() => mySchedules.map((s) => {
    const [startH, startM] = s.timeSlot.split('-')[0].split(':').map(Number);
    const [endH, endM] = s.timeSlot.split('-')[1].split(':').map(Number);
    const start = new Date(s.startDate);
    start.setHours(startH, startM);
    const end = new Date(s.endDate);
    end.setHours(endH, endM);
    return { id: s.id, title: `${s.title} (${s.room} · ${s.teacher})`, start, end };
  }), [mySchedules]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">我的课表</h1>
        <p className="text-gray-500 mt-1">查看个人课程安排</p>
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
            eventPropGetter={() => ({ style: { backgroundColor: '#3b82f6', border: 'none', borderRadius: '6px', fontSize: '12px', padding: '2px 6px' } })}
            style={{ height: '100%' }}
          />
        </div>
        {mySchedules.length === 0 && (
          <div className="text-center py-8 text-gray-400">暂无课程安排</div>
        )}
      </div>
    </div>
  );
}