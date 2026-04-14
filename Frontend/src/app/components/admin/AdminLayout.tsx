import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  Sparkles,
  MessageSquare,
  TrendingUp,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and has admin privileges
    const isAuth = localStorage.getItem('isAuthenticated');
    const userEmail = localStorage.getItem('userEmail');

    // For demo purposes, we'll allow access if authenticated
    // In production, you should check for an actual admin role
    if (!isAuth) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Staff', path: '/admin/staff' },
    { icon: TrendingUp, label: 'Inventario', path: '/admin/inventory' },
    { icon: Package, label: 'Productos', path: '/admin/products' },
    { icon: Sparkles, label: 'Servicios', path: '/admin/services' },
    { icon: MessageSquare, label: 'Comentarios', path: '/admin/comments' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div
        className="text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50"
        style={{
          backgroundColor: 'var(--color-primary)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">AutoSplash Admin</h1>
              <p className="text-xs opacity-90 hidden md:block">Panel de Administración</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/home"
            className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg transition-colors opacity-90 hover:opacity-100"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <span>Ver sitio</span>
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:sticky top-[72px] left-0 h-[calc(100vh-72px)] w-64 bg-white transition-transform duration-300 z-40 overflow-y-auto`}
          style={{ borderRight: '1px solid var(--color-border)' }}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                    color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30 top-[72px]"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 w-full min-h-[calc(100vh-72px)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
