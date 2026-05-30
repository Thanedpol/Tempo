import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { I18nProvider } from '@/lib/I18nContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import AIAssistant from '@/pages/AIAssistant';
import Dashboard from '@/pages/Dashboard';
import Events from '@/pages/Events';
import Bookings from '@/pages/Bookings';
import Hotels from '@/pages/Hotels';
import CalendarPage from '@/pages/CalendarPage';
import Notifications from '@/pages/Notifications';
import Admin from '@/pages/Admin';
import AdminRoute from '@/components/AdminRoute';
import EventDetail from '@/pages/EventDetail';
import HotelDetail from '@/pages/HotelDetail';
import FAQs from '@/pages/FAQs';
import Settings from '@/pages/Settings';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-muted-foreground font-syne">Agentic AI Loading...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<AIAssistant />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/events" element={<Events />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/hotels/:id" element={<HotelDetail />} />
        <Route path="/faqs" element={<FAQs />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </I18nProvider>
  )
}

export default App