import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './Pages/Auth/Login';
import AdminDashboard from './Pages/Admin/Dashboard';
import LeaveRecords from './Pages/Admin/LeaveRecords';
import Personel from './Pages/Admin/Personel';
import Analytics from './Pages/Admin/Analytics';
import AuditLogs from './Pages/Admin/AuditLogs';
import UserManagement from './Pages/Admin/UserManagement';
import LeaveTypeManagement from './Pages/Admin/LeaveTypeManagement';
import AtasanDashboard from './Pages/Atasan/Dashboard';
import Reports from './Pages/Atasan/Reports';
import AdminLayout from './Layouts/AdminLayout';
import AtasanLayout from './Layouts/AtasanLayout';

// Mock Auth Guard (Replace with real JWT logic later)
const ProtectedRoute = ({ role, children }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;
  if (role && userRole !== role) return <Navigate to="/login" replace />;

  return children || <Outlet />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route element={<ProtectedRoute role="super_admin"><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/leaves" element={<LeaveRecords />} />
          <Route path="/admin/personel" element={<Personel />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/audit" element={<AuditLogs />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/leave-types" element={<LeaveTypeManagement />} />
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Atasan Routes */}
        <Route element={<ProtectedRoute role="atasan"><AtasanLayout /></ProtectedRoute>}>
          <Route path="/atasan" element={<AtasanDashboard />} />
          <Route path="/atasan/leaves" element={<LeaveRecords />} />
          <Route path="/atasan/personel" element={<Personel />} />
          <Route path="/atasan/analytics" element={<Analytics />} />
          <Route path="/atasan/reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
