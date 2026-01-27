import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function AtasanLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold">Monitoring Polda NTB</h1>
          <nav className="flex gap-4">
            <Link to="/atasan" className={`text-sm hover:text-blue-300 ${isActive('/atasan') ? 'text-blue-400 font-bold' : ''}`}>Dashboard</Link>
            <Link to="/atasan/reports" className={`text-sm hover:text-blue-300 ${isActive('/atasan/reports') ? 'text-blue-400 font-bold' : ''}`}>Laporan</Link>
          </nav>
        </div>
        <Button variant="ghost" className="text-white hover:bg-slate-800" onClick={handleLogout}>Logout</Button>
      </header>
      <main className="p-6 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
