import { Bell, User, ChevronDown, PanelLeft, LogOut, Moon, Sun, Check, CheckCheck, Calendar, Users, FileText, Shield, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useNotifications } from '@/lib/NotificationContext';

// Helper to format relative time
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

// Icon mapper for entity types
function getEntityIcon(entity) {
  switch (entity) {
    case 'leaves': return <Calendar className="w-4 h-4" />;
    case 'personnel': return <Users className="w-4 h-4" />;
    case 'users': return <Shield className="w-4 h-4" />;
    case 'leave_types': return <FileText className="w-4 h-4" />;
    default: return <Bell className="w-4 h-4" />;
  }
}

export function Header({ userRole, onToggleSidebar }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const { notificationHistory, unreadCount, markAsRead, markAllAsRead, clearHistory } = useNotifications();

  // Close menus on route change
  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifications(false);
  }, [location]);

  // Close user menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
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
    e.stopPropagation();
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <header className="h-16 bg-sidebar border-b border-border flex items-center justify-between px-6 transition-colors duration-300">
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
        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifikasi
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition-colors"
                      title="Tandai semua dibaca"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Baca semua</span>
                    </button>
                  )}
                  {notificationHistory.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition-colors"
                      title="Hapus semua"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto">
                {notificationHistory.length === 0 ? (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada notifikasi</p>
                  </div>
                ) : (
                  notificationHistory.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 border-b border-border last:border-b-0 hover:bg-accent/50 cursor-pointer transition-colors ${!notification.read ? 'bg-primary/5' : ''
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Unread indicator */}
                        <div className="mt-1.5">
                          {!notification.read ? (
                            <span className="w-2 h-2 bg-primary rounded-full block" />
                          ) : (
                            <span className="w-2 h-2 block" />
                          )}
                        </div>

                        {/* Icon */}
                        <div className={`p-2 rounded-lg ${notification.type === 'warning'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                          {getEntityIcon(notification.entity)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatRelativeTime(notification.receivedAt)}
                          </p>
                        </div>

                        {/* Read indicator */}
                        {notification.read && (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
