import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { useRealtime } from './api/realtime';
import Layout from './components/Layout';
import PublicPortal from './pages/PublicPortal';
import LoginPage from './pages/Login';
import OperationsDashboard from './pages/OperationsDashboard';
import LiveMapPage from './pages/LiveMap';
import TriagePage from './pages/Triage';
import IncidentDetailPage from './pages/IncidentDetail';
import IntelligenceFeed from './pages/IntelligenceFeed';
import AnalyticsPage from './pages/Analytics';
import RespondersPage from './pages/Responders';
import SituationMonitor from './pages/SituationMonitor';
import C2VideoWall from './pages/C2VideoWall';
import PlaybookEngine from './pages/PlaybookEngine';

function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useRealtime();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useRealtime();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Routes>
      {/* Public Landing & Citizen Early Warning Portal */}
      <Route path="/" element={<PublicPortal />} />
      <Route path="/portal" element={<PublicPortal />} />

      {/* Operator Authentication */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/app" replace /> : <LoginPage />} />

      {/* Full-screen C2 Video Wall — no sidebar layout */}
      <Route path="/c2" element={<ProtectedRoute><C2VideoWall /></ProtectedRoute>} />
      <Route path="/monitor" element={<ProtectedRoute><SituationMonitor /></ProtectedRoute>} />

      {/* Authenticated C2 Situation Room Console */}
      <Route element={<ProtectedLayout />}>
        <Route path="/app" element={<OperationsDashboard />} />
        <Route path="/map" element={<LiveMapPage />} />
        <Route path="/intel" element={<IntelligenceFeed />} />
        <Route path="/triage" element={<TriagePage />} />
        <Route path="/incidents/:id" element={<IncidentDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/responders" element={<RespondersPage />} />
        <Route path="/playbook" element={<PlaybookEngine />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
