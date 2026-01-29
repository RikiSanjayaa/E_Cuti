import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  UserCog,
  BarChart3,
  Shield,
  ClipboardList,
  X
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export function Sidebar({ isCollapsed, role = 'admin', isMobile, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: role === 'atasan' ? '/atasan' : '/admin', roles: ['admin', 'super_admin', 'atasan'] },
    { id: 'requests', label: 'Riwayat Cuti', icon: Calendar, path: role === 'atasan' ? '/atasan/leaves' : '/admin/leaves', roles: ['admin', 'super_admin', 'atasan'] },
    { id: 'personel', label: 'Personel', icon: Users, path: role === 'atasan' ? '/atasan/personel' : '/admin/personel', roles: ['admin', 'super_admin', 'atasan'] },
    { id: 'analytics', label: 'Analitik', icon: BarChart3, path: role === 'atasan' ? '/atasan/analytics' : '/admin/analytics', roles: ['admin', 'super_admin', 'atasan'] },
    { id: 'audit', label: 'Log Audit', icon: Shield, path: '/admin/audit', roles: ['admin', 'super_admin'] },
    { id: 'users', label: 'Manajemen Pengguna', icon: UserCog, path: '/admin/users', roles: ['admin', 'super_admin'] },
    { id: 'leave-types', label: 'Jenis Cuti', icon: ClipboardList, path: '/admin/leave-types', roles: ['admin', 'super_admin'] },
  ];

  // Filter items based on role
  const navItems = allNavItems.filter(item => {
    if (role === 'atasan') {
      return ['dashboard', 'requests', 'personel', 'analytics'].includes(item.id);
    }
    if (item.roles) return item.roles.includes(role) || item.roles.includes('admin');
    return true;
  });

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-40' : 'relative'}
        ${isCollapsed ? (isMobile ? '-translate-x-full' : 'w-20') : 'w-72'} 
        bg-white border-r border-border h-screen flex flex-col transition-all duration-300 ease-in-out shadow-xl
      `}>
        {/* Header */}
        <div className={`h-20 flex items-center ${!isMobile && isCollapsed ? 'justify-center w-full' : 'px-6'} border-b border-border transition-all duration-300`}>
          <div className={`flex items-center overflow-hidden whitespace-nowrap w-full ${!isMobile && isCollapsed ? 'justify-center' : 'gap-4'}`}>
            <div className={`flex-shrink-0 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20 transition-all duration-300`}>
              <FileText className="w-5 h-5" />
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${!isMobile && isCollapsed ? 'opacity-0 w-0' : 'opacity-100 flex-1'}`}>
              <h1 className="font-bold text-lg text-slate-900 leading-tight">
                {role === 'atasan' ? 'Monitoring Cuti' : 'Manajemen Cuti'}
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold text-left">Polda NTB</p>
            </div>

            {/* Close button for mobile */}
            {isMobile && (
              <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      handleNavigation(item.path);
                      if (isMobile) onClose();
                    }}
                    className={`group w-full flex items-center rounded-xl transition-all duration-200 cursor-pointer overflow-hidden whitespace-nowrap relative
                      ${!isMobile && isCollapsed ? 'justify-center h-12 px-0' : 'h-11 px-4 gap-3'}
                      ${isActive
                        ? 'bg-gray-200 text-black'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                    title={!isMobile && isCollapsed ? item.label : undefined}
                  >
                    <Icon className={`flex-shrink-0 transition-transform duration-300 ${!isMobile && isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />

                    <span className={`font-medium text-sm transition-opacity duration-200 ${!isMobile && isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto block'}`}>
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t border-border overflow-hidden whitespace-nowrap transition-all duration-300 ${!isMobile && isCollapsed ? 'opacity-0 h-0 py-0' : 'opacity-100 h-auto'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Versi 1.0.0</p>
              <p className="text-[10px] text-slate-400">© 2026 Polda NTB</p>
            </div>
          </div>
        </div>
      </aside >
    </>
  );
}
