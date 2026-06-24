import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../utils/apiClient';
import { Menu, X, BarChart3, FileText, User, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/records', label: 'My Records', icon: FileText },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:relative lg:translate-x-0 z-30 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="hidden lg:flex items-center gap-3 p-6 border-b border-gray-200">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">StaffHub</h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(item.path) ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Icon className="w-5 h-5" /> {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="px-4 py-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Logged in as</p>
              <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500 mt-1">{user?.employeeCode}</p>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition font-medium">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold text-gray-900">Staff Dashboard</h1>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto"><Outlet /></div>
        </main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-20" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
