import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { AuthPage } from '@/pages/AuthPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { AppLayout } from '@/components/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { MealsPage } from '@/pages/MealsPage';
import { FoodsPage } from '@/pages/FoodsPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AIAssistantPage } from '@/pages/AIAssistantPage';
import { FullPageLoader } from '@/components/ui';
import { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, needsOnboarding } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;

  return <AppLayout>{children}</AppLayout>;
}

function OnboardingRoute() {
  const { user, loading, needsOnboarding } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/" replace />;
  if (!needsOnboarding) return <Navigate to="/dashboard" replace />;

  return <OnboardingPage />;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading, needsOnboarding } = useAuth();

  if (loading) return <FullPageLoader />;
  if (user) return <Navigate to={needsOnboarding ? '/onboarding' : '/dashboard'} replace />;

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/onboarding" element={<OnboardingRoute />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/meals" element={<ProtectedRoute><MealsPage /></ProtectedRoute>} />
      <Route path="/foods" element={<ProtectedRoute><FoodsPage /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
      <Route path="/assistant" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
