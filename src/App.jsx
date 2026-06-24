import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { RoleProvider } from './context/RoleContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManufacturePage from './pages/ManufacturePage';
import Devices from './pages/Devices';
import DeviceDetail from './pages/DeviceDetail';
import ProjectsHub from './pages/ProjectsHub';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import SystemPage from './pages/SystemPage';

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
        <Route path="/manufacture" element={<ManufacturePage />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/devices/:id" element={<DeviceDetail />} />
        <Route path="/projects" element={<ProjectsHub />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/system" element={<SystemPage />} />
        {/* Legacy redirects */}
        <Route path="/production-plan" element={<Navigate to="/manufacture?tab=plan" replace />} />
        <Route path="/materials" element={<Navigate to="/manufacture?tab=materials" replace />} />
        <Route path="/tests" element={<Navigate to="/manufacture?tab=tests" replace />} />
        <Route path="/assembly" element={<Navigate to="/manufacture?tab=assembly" replace />} />
        <Route path="/work-orders" element={<Navigate to="/devices?tab=workorders" replace />} />
        <Route path="/users" element={<Navigate to="/system?tab=users" replace />} />
        <Route path="/roles" element={<Navigate to="/system?tab=roles" replace />} />
        <Route path="/delivery" element={<Navigate to="/projects?tab=delivery" replace />} />
        <Route path="/operations" element={<Navigate to="/devices" replace />} />
        <Route path="/alerts" element={<Navigate to="/devices?tab=alerts" replace />} />
        <Route path="/device-allocation" element={<Navigate to="/projects" replace />} />
        <Route path="/retirement" element={<Navigate to="/devices" replace />} />
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
