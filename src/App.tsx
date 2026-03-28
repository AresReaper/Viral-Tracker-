/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/sonner';
import { AnimatePresence } from 'motion/react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import About from './pages/About';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isGuest } = useAuth();
  return (user || isGuest) ? <>{children}</> : <Navigate to="/login" />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="viral-tracker-theme">
      <AuthProvider>
        <Router>
          <AnimatedRoutes />
        </Router>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
