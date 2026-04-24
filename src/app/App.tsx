import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Onboarding } from './components/Onboarding';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AIChat } from './components/AIChat';
import { CodingLab } from './components/CodingLab';
import { TasksQuiz } from './components/TasksQuiz';
import { Rewards } from './components/Rewards';
import { Insights } from './components/Insights';
import { AdminConsole } from './components/AdminConsole';
import { Moderation } from './components/Moderation';
import { Settings } from './components/Settings';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user, ready } = useAuth();

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading Vakify...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/onboarding" element={user && !user.onboarded ? <Onboarding /> : <Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/chat" element={<PrivateRoute><AIChat /></PrivateRoute>} />
      <Route path="/lab" element={<PrivateRoute><CodingLab /></PrivateRoute>} />
      <Route path="/tasks" element={<PrivateRoute><TasksQuiz /></PrivateRoute>} />
      <Route path="/rewards" element={<PrivateRoute><Rewards /></PrivateRoute>} />
      <Route path="/insights" element={<PrivateRoute><Insights /></PrivateRoute>} />
      <Route path="/moderation" element={<PrivateRoute><Moderation /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminConsole /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
