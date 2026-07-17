import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useStore } from '@/store';

export default function Layout() {
  const isLoggedIn = useStore((s) => s.isLoggedIn);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}