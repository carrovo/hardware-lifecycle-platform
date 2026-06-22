import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { RoleProvider } from './context/RoleContext';
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
import Delivery from './pages/Delivery';
import WorkOrders from './pages/WorkOrders';
import Users from './pages/Users';
import Roles from './pages/Roles';

function RequireAuth({ children }) {
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function AppRoutes() {
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
        <Route path="/delivery" element={<Delivery />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/operations" element={<Navigate to="/devices" replace />} />
        <Route path="/alerts" element={<Navigate to="/devices?tab=alerts" replace />} />
        <Route path="/device-allocation" element={<Navigate to="/projects" replace />} />
        <Route path="/retirement" element={<Navigate to="/devices" replace />} />
        <Route path="/users" element={<Users />} />
        <Route path="/roles" element={<Roles />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<RequireAuth><AppRoutes /></RequireAuth>} />
          </Routes>
        </AppProvider>
      </RoleProvider>
    </BrowserRouter>
  );
}

export default App;
