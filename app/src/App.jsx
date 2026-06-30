import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Complaints from './pages/Complaints';
import HotspotAnalysis from './pages/HotspotAnalysis';
import LifestyleSimulation from './pages/LifestyleSimulation';
import PolicySimulation from './pages/PolicySimulation';
import ZoneRecommendation from './pages/ZoneRecommendation';
import InvestmentPriority from './pages/InvestmentPriority';
import Reports from './pages/Reports';
import AiAssistant from './pages/AiAssistant';
import AlertManagement from './pages/AlertManagement';
import AlertInquiry from './pages/AlertInquiry';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="analysis/hotspot" element={<HotspotAnalysis />} />
          <Route path="analysis/lifestyle-simulation" element={<LifestyleSimulation />} />
          <Route path="analysis/policy-simulation" element={<PolicySimulation />} />
          <Route path="analysis/recommendation" element={<ZoneRecommendation />} />
          <Route path="analysis/investment-priority" element={<InvestmentPriority />} />
          <Route path="reports" element={<Reports />} />
          <Route path="ai-assistant" element={<AiAssistant />} />
          <Route path="alerts/management" element={<AlertManagement />} />
          <Route path="alerts/inquiry" element={<AlertInquiry />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
