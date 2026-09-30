import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";

import Landing from "./pages/Landing";
import Onboarding from "./pages/onboarding";
import Claim from "./pages/Claim";
import Privacy from "./pages/Privacy";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Updates from "./pages/Updates";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Pulse from "./pages/Pulse";
import Search from "./pages/Search";
import CreatePost from "./pages/CreatePost";
import AddPost from "./pages/AddPost";
import Gyms from "./pages/Gyms";
import Community from "./pages/Community";
import GymDetails from "./pages/GymDetails";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import ViewProfile from "./pages/ViewProfile";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import Activity from "./pages/Activity";
import AccountSettings from "./pages/AccountSettings";
import AppSettings from "./pages/AppSettings";
import PrivacySecurity from "./pages/PrivacySecurity";
import HelpSupport from "./pages/HelpSupport";
import AboutSpotMe from "./pages/AboutSpotMe";
import Notifications from "./pages/Notifications";
import NotificationSettings from "./pages/NotificationSettings";
import Followers from "./pages/Followers";
import SpotMe from "./pages/SpotMe";
import Admin from "./pages/Admin";
import PostDetail from "./pages/PostDetail";
import NotFound from "./pages/NotFound";
import SafetyGuidelines from "./pages/SafetyGuidelines";
import CommunityRules from "./pages/CommunityRules";
import MainLayout from "./components/Layout/MainLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SplashScreen } from "./components/SplashScreen";
import { ScrollToTop } from "./components/ScrollToTop";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Splash wrapper component - only shows splash for slow loads (500ms+)
// Browser PWA splash handles the initial load; this is a fallback for slow initialization
const SplashWrapper = ({ children }: { children: React.ReactNode }) => {
  const [showSplash, setShowSplash] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if we've already shown splash this session
    const splashShown = sessionStorage.getItem('splashShown');
    if (splashShown) {
      setAppReady(true);
      return;
    }

    // Only consider splash for protected routes
    const isProtectedRoute = location.pathname.startsWith('/app') || 
      location.pathname.startsWith('/gyms') || 
      location.pathname.startsWith('/messages') ||
      location.pathname.startsWith('/profile') ||
      location.pathname.startsWith('/search');

    if (isProtectedRoute) {
      setShowSplash(true);
    } else {
      setAppReady(true);
    }
  }, [location.pathname]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setAppReady(true);
    sessionStorage.setItem('splashShown', 'true');
  };

  return (
    <>
      <SplashScreen 
        show={showSplash} 
        onComplete={handleSplashComplete}
        minDelayMs={500}
      />
      {children}
    </>
  );
};

const App: React.FC = () => {
  // Enable theme transitions after initial render to prevent flash
  useEffect(() => {
    const timer = setTimeout(() => {
      document.documentElement.classList.add('theme-transition');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={0}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="spotme_theme_preference">
              <ScrollToTop />
              <SplashWrapper>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Auth />} />
                  <Route path="/claim" element={<Claim />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/updates" element={<Updates />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  
                  
                  {/* Auth routes */}
<Route
  path="/auth"
  element={
    <PublicRoute>
      <Auth />
    </PublicRoute>
  }
/>
<Route path="/reset-password" element={<ResetPassword />} />
<Route
  path="/onboarding"
  element={
    <ProtectedRoute>
      <Onboarding />
    </ProtectedRoute>
  }
/>
                  
                  {/* Protected routes - require authentication */}
                  <Route path="/app" element={<ProtectedRoute><MainLayout><Home /></MainLayout></ProtectedRoute>} />
                  <Route path="/pulse" element={<ProtectedRoute><MainLayout><Pulse /></MainLayout></ProtectedRoute>} />
                  <Route path="/search" element={<ProtectedRoute><MainLayout><Search /></MainLayout></ProtectedRoute>} />
                  <Route path="/add" element={<ProtectedRoute><MainLayout><CreatePost /></MainLayout></ProtectedRoute>} />
                  <Route path="/gyms" element={<ProtectedRoute><MainLayout><Gyms /></MainLayout></ProtectedRoute>} />
                  
                  <Route
  path="/community/:slug"
  element={
    <ProtectedRoute>
      <MainLayout>
        <Community />
      </MainLayout>
    </ProtectedRoute>
  }
/>
                  <Route path="/spotme" element={<ProtectedRoute><MainLayout><SpotMe /></MainLayout></ProtectedRoute>} />
                  <Route path="/spotters" element={<ProtectedRoute><MainLayout><Search /></MainLayout></ProtectedRoute>} />
                  <Route path="/gym/:id" element={<ProtectedRoute><MainLayout><GymDetails /></MainLayout></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><MainLayout><Messages /></MainLayout></ProtectedRoute>} />
                  <Route path="/chat/:id" element={<ProtectedRoute><MainLayout><Chat /></MainLayout></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />
                  <Route path="/profile/edit" element={<ProtectedRoute><MainLayout><EditProfile /></MainLayout></ProtectedRoute>} />
                  <Route path="/profile/:id" element={<ProtectedRoute><MainLayout><ViewProfile /></MainLayout></ProtectedRoute>} />
                  <Route path="/u/:id" element={<ProtectedRoute><MainLayout><ViewProfile /></MainLayout></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><MainLayout><Notifications /></MainLayout></ProtectedRoute>} />
                  <Route path="/notification-settings" element={<ProtectedRoute><MainLayout><NotificationSettings /></MainLayout></ProtectedRoute>} />
                  <Route path="/followers" element={<ProtectedRoute><MainLayout><Followers /></MainLayout></ProtectedRoute>} />
                  <Route path="/followers/:userId" element={<ProtectedRoute><MainLayout><Followers /></MainLayout></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>} />
                  <Route path="/activity" element={<ProtectedRoute><MainLayout><Activity /></MainLayout></ProtectedRoute>} />
                  <Route path="/account-settings" element={<ProtectedRoute><MainLayout><AccountSettings /></MainLayout></ProtectedRoute>} />
                  <Route path="/app-settings" element={<ProtectedRoute><MainLayout><AppSettings /></MainLayout></ProtectedRoute>} />
                  <Route path="/privacy-security" element={<ProtectedRoute><MainLayout><PrivacySecurity /></MainLayout></ProtectedRoute>} />
                  <Route path="/help-support" element={<ProtectedRoute><MainLayout><HelpSupport /></MainLayout></ProtectedRoute>} />
                  <Route path="/about-spotme" element={<ProtectedRoute><MainLayout><AboutSpotMe /></MainLayout></ProtectedRoute>} />
                  <Route path="/safety-guidelines" element={<ProtectedRoute><MainLayout><SafetyGuidelines /></MainLayout></ProtectedRoute>} />
                  <Route path="/community-rules" element={<ProtectedRoute><MainLayout><CommunityRules /></MainLayout></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><MainLayout><Admin /></MainLayout></ProtectedRoute>} />
                  <Route path="/post/:id" element={<ProtectedRoute><MainLayout><PostDetail /></MainLayout></ProtectedRoute>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </SplashWrapper>
              <Toaster />
              <Sonner />
            </ThemeProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
