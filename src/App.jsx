import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { RoleProvider, useRole } from './context/RoleContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FEISHU_USERS } from './data/mockData';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductionPlan from './pages/ProductionPlan';
import DeviceTypes from './pages/DeviceTypes';
import Materials from './pages/Materials';
import Assembly from './pages/Assembly';
import Tests from './pages/Tests';
import Devices from './pages/Devices';
import DeviceDetail from './pages/DeviceDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import DeviceAllocation from './pages/DeviceAllocation';
import Delivery from './pages/Delivery';
import Operations from './pages/Operations';
import Alerts from './pages/Alerts';
import WorkOrders from './pages/WorkOrders';
import Retirement from './pages/Retirement';
import Users from './pages/Users';
import Roles from './pages/Roles';

function AppRoutes() {
  const { dispatch } = useApp();
  const { setCurrentRole } = useRole();
  const { userId } = useAuth();

  useEffect(() => {
    if (userId) {
      dispatch({ type: 'SET_CURRENT_USER', payload: userId });
      const user = FEISHU_USERS.find((u) => u.id === userId);
      if (user?.role) setCurrentRole(user.role);
    }
  }, [userId]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/production-plan" element={<ProductionPlan />} />
        <Route path="/device-types" element={<DeviceTypes />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/assembly" element={<Assembly />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/devices/:id" element={<DeviceDetail />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/device-allocation" element={<DeviceAllocation />} />
        <Route path="/delivery" element={<Delivery />} />
        <Route path="/operations" element={<Operations />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/retirement" element={<Retirement />} />
        <Route path="/users" element={<Users />} />
        <Route path="/roles" element={<Roles />} />
      </Routes>
    </Layout>
  );
}

function PrivateRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoleProvider>
          <AppProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<PrivateRoute><AppRoutes /></PrivateRoute>} />
            </Routes>
          </AppProvider>
        </RoleProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
