import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './Pages/Auth/Login';
import AdminDashboard from './Pages/Admin/Dashboard';
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
           <Route path="/" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Atasan Routes */}
        <Route element={<ProtectedRoute role="atasan"><AtasanLayout /></ProtectedRoute>}>
           <Route path="/atasan" element={<AtasanDashboard />} />
           <Route path="/atasan/reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
