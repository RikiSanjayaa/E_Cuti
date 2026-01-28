import { Bell, User, ChevronDown, PanelLeft, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Header({ userRole, onToggleSidebar }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-accent rounded-md transition-colors lg:block cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h2 className="text-sm text-muted-foreground hidden sm:block">Selamat datang kembali</h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-accent rounded-md transition-colors cursor-pointer">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
        </button>

        <div className="h-8 w-px bg-border"></div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 hover:bg-accent px-3 py-2 rounded-md transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium capitalize">{userRole || 'User'}</p>
              <p className="text-xs text-muted-foreground">Portal Pengguna</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-md shadow-lg py-1 z-50">
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent">Profil</button>
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-accent">Preferensi</button>
              <div className="border-t border-border my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent text-destructive flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
