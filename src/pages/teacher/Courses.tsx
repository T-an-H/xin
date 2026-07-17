import { useStore } from '@/store';

export default function TeacherCourses() {
  const courses = useStore((s) => s.courses);
  const currentUser = useStore((s) => s.currentUser);
  const myCourses = courses.filter((c) => c.teacher === currentUser);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">我的课程</h1>
        <p className="text-gray-500 mt-1">查看您所教授的课程</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {myCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
            <div className="h-40 overflow-hidden">
              <img src={course.cover} alt={course.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{course.duration}课时</span>
                <span className="text-emerald-600 font-medium">¥{course.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}