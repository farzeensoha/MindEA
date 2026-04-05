import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import { initializeAuth } from '@/utils/api';
import Layout from '@/components/Layout';
import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Wellness from '@/pages/Wellness';
import Community from '@/pages/Community';
import SocialBubble from '@/pages/SocialBubble';
import Learning from '@/pages/Learning';
import Settings from '@/pages/Settings';
import '@/App.css';

function App() {
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="wellness" element={<Wellness />} />
            <Route path="community" element={<Community />} />
            <Route path="social-bubble" element={<SocialBubble />} />
            <Route path="learning" element={<Learning />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;