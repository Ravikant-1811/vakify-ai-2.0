import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Landing } from './components/Landing';
import { Login } from './components/Login';
import { GoogleCallback } from './components/GoogleCallback';
import { Onboarding } from './components/Onboarding';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AIChat } from './components/AIChat';
import { CodingLab } from './components/CodingLab';
import { TrainingCoder } from './components/TrainingCoder';
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

function LearnerRoute({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (!user.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Layout>{children}</Layout>;
}

function AdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, ready } = useAuth();

  if (!ready) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}

function RoleRoute({
  children,
  allow,
}: {
  children: React.ReactNode;
  allow: Array<'admin' | 'moderator'>;
}) {
  const { user, ready } = useAuth();

  if (!ready) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(user.role as 'admin' | 'moderator')) {
    return <Navigate to="/dashboard" replace />;
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
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Login />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="/onboarding" element={
        user && !user.onboarded && user.role !== 'admin'
          ? <Onboarding />
          : <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
      } />

      <Route path="/dashboard" element={<LearnerRoute><Dashboard /></LearnerRoute>} />
      <Route path="/chat" element={<LearnerRoute><AIChat /></LearnerRoute>} />
      <Route path="/lab" element={<LearnerRoute><CodingLab /></LearnerRoute>} />
      <Route path="/playground" element={<LearnerRoute><TrainingCoder /></LearnerRoute>} />
      <Route path="/tasks" element={<LearnerRoute><TasksQuiz /></LearnerRoute>} />
      <Route path="/rewards" element={<LearnerRoute><Rewards /></LearnerRoute>} />
      <Route path="/insights" element={<LearnerRoute><Insights /></LearnerRoute>} />
      <Route path="/moderation" element={<RoleRoute allow={['admin', 'moderator']}><Moderation /></RoleRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminConsole /></AdminRoute>} />
      <Route path="/settings" element={<LearnerRoute><Settings /></LearnerRoute>} />

      <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Landing />} />
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
