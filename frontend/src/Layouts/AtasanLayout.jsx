import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

const AtasanLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const userRole = localStorage.getItem('role') || 'atasan';

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true); // Default closed on mobile
      } else {
        setIsSidebarCollapsed(false); // Default open on desktop
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        role={userRole.toLowerCase()}
        isMobile={isMobile}
        onClose={() => setIsSidebarCollapsed(true)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userRole={userRole} onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AtasanLayout;
