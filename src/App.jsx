import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
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
        <Route path="/device-allocation" element={<DeviceAllocation />} />
        <Route path="/delivery" element={<Delivery />} />
        <Route path="/operations" element={<Operations />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/retirement" element={<Retirement />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
