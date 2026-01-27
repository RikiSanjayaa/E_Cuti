import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { AddLeaveModal } from '../components/AddLeaveModal';
import { Plus } from 'lucide-react';

const AdminLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAddLeaveModalOpen, setIsAddLeaveModalOpen] = useState(false);
  const userRole = localStorage.getItem('role') || 'Admin';

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userRole={userRole} onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-6 relative">
          <Outlet />

          {/* Floating Add Leave Button */}
          {(userRole === 'super_admin' || userRole === 'admin') && (
            <button
              onClick={() => setIsAddLeaveModalOpen(true)}
              className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center group z-40 cursor-pointer"
              title="Tambah Catatan Cuti"
            >
              <Plus className="w-6 h-6" />
              <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Tambah Catatan Cuti
              </span>
            </button>
          )}
        </main>
      </div>

      {/* Add Leave Modal */}
      <AddLeaveModal
        isOpen={isAddLeaveModalOpen}
        onClose={() => setIsAddLeaveModalOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;
