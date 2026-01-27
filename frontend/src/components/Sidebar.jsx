import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  UserCog,
  BarChart3,
  Shield
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export function Sidebar({ isCollapsed, role = 'admin' }) {
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
  ];

  // Filter items based on role
  const navItems = allNavItems.filter(item => {
    if (role === 'atasan') {
      return ['dashboard', 'requests', 'personel', 'analytics'].includes(item.id);
    }
    // Default admin/super_admin logic (show all usually, or filter based on item.roles)
    // For now assuming admin sees everything except maybe explicit super_admin only if defined
    // But original code showed all. I'll stick to original behavior for admin.
    if (item.roles) return item.roles.includes(role) || item.roles.includes('admin');
    return true;
  });

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-border h-screen flex flex-col transition-all duration-300`}>
      <div className={`${isCollapsed ? 'p-4' : 'p-6'} border-b border-border`}>
        {!isCollapsed ? (
          <>
            <h1 className="font-semibold text-lg text-foreground">
              {role === 'atasan' ? 'Monitoring Atasan' : 'Manajemen Cuti'}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Portal Pemerintah</p>
          </>
        ) : (
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        )}
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${isActive
                    ? 'bg-secondary text-secondary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>


      {!isCollapsed && (
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground">v1.0.0</p>
        </div>
      )}
    </aside >
  );
}
