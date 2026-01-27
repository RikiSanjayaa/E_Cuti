import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function AdminLayout() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Admin Operator - Polda NTB</h1>
        <Button variant="destructive" size="sm" onClick={handleLogout}>Logout</Button>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
