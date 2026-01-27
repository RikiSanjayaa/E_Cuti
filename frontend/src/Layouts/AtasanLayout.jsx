import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

const AtasanLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const userRole = localStorage.getItem('role') || 'atasan';

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        role="atasan"
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
