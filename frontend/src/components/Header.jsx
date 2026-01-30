import { Bell, User, ChevronDown, PanelLeft, LogOut, Moon, Sun } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export function Header({ userRole, onToggleSidebar }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Close user menu on route change
  useEffect(() => {
    setShowUserMenu(false);
  }, [location]);

  // Close user menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(res.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (e) => {
    e.stopPropagation(); // Prevent menu from closing if desired, or let it stay open to see toggle
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors lg:block cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h2 className="text-sm text-muted-foreground hidden sm:block">Selamat datang kembali</h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors cursor-pointer">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
        </button>

        <div className="h-8 w-px bg-border"></div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs transition-transform hover:scale-105">
              {currentUser?.full_name
                ? currentUser.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : <User className="w-4 h-4" />
              }
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-semibold capitalize text-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                {currentUser?.full_name || currentUser?.username || userRole || 'User'}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {currentUser?.role === 'super_admin' ? 'Super Admin' : currentUser?.role === 'atasan' ? 'Atasan' : 'Admin'}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground hidden md:block transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-md shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  const targetRole = localStorage.getItem('role') || userRole;
                  const profilePath = targetRole === 'atasan' ? '/atasan/profile' : '/admin/profile';
                  navigate(profilePath);
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4 text-muted-foreground" />
                Profil
              </button>

              <div
                className="w-full px-4 py-2 flex items-center gap-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                onClick={toggleTheme}
                role="button"
                tabIndex={0}
              >
                {theme === 'light' ? (
                  <Sun className="w-4 h-4 text-orange-500" />
                ) : (
                  <Moon className="w-4 h-4 text-blue-500" />
                )}
                <span className="flex-1 text-foreground">
                  {theme === 'light' ? 'Mode Terang' : 'Mode Gelap'}
                </span>
              </div>

              <div className="border-t border-border my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
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
