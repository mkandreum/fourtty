import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Navbar from './components/Navbar';
import Feed from './components/Feed';
import Sidebar from './components/Sidebar';
import LeftPanel from './components/LeftPanel';
import Profile from './components/Profile';
import Gallery from './components/Gallery';
import People from './components/People';
import { ViewState } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ToastProvider } from './contexts/ToastContext';
import { PhotoModalProvider } from './contexts/PhotoModalContext';
import ToastContainer from './components/ToastContainer';
import PhotoModal from './components/PhotoModal';
import Inbox from './components/Inbox';

// MainLayout is no longer used, AppContent routes directly to children within Layout

// Wrapper to handle conditional rendering based on view state
// Ideally we would use proper routes like /profile/:id, but adhering to current structure for now
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

const AnimatedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "linear" }}
    >
      {children}
    </motion.div>
  );
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[var(--bg-color)]">Cargando...</div>;
  }

  const Layout = ({ children, view }: { children: React.ReactNode, view: ViewState }) => (
    <div className="min-h-screen bg-[var(--bg-color)] transition-colors duration-200">
      <ToastContainer />
      <div className="main-content-container max-w-[1120px] mx-auto px-0 sm:px-4 pb-32">
        <div className={`flex flex-col md:flex-row md:gap-8 items-start ${view === ViewState.HOME || view === ViewState.PEOPLE ? 'md:bg-[var(--card-bg)] md:border md:border-[var(--border-color)] md:rounded-3xl md:shadow-2xl md:mt-10 transition-colors duration-200 overflow-hidden' : ''}`}>
          {view === ViewState.HOME && (
            <aside className="hidden md:block w-[260px] shrink-0 sticky top-10 border-r border-[var(--border-soft)] min-h-[calc(100vh-100px)]">
              <div className="p-4">
                <LeftPanel />
              </div>
            </aside>
          )}
          <main className={`flex-1 min-w-0 w-full bg-[var(--bg-color)] md:bg-transparent ${view === ViewState.PROFILE ? 'max-w-4xl mx-auto' : ''}`}>
            {children}
          </main>
          {(view === ViewState.HOME || view === ViewState.PEOPLE) && (
            <aside className="hidden lg:block w-[260px] shrink-0 sticky top-10 border-l border-[var(--border-soft)] min-h-[calc(100vh-100px)]">
              <div className="p-4">
                <Sidebar />
              </div>
            </aside>
          )}
        </div>
      </div>
      <Navbar />
    </div>
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : (
            <AnimatedPage>
              <Login />
            </AnimatedPage>
          )
        } />

        <Route path="/forgot-password" element={
          isAuthenticated ? <Navigate to="/" /> : (
            <AnimatedPage>
              <ForgotPassword />
            </AnimatedPage>
          )
        } />

        <Route path="/reset-password/:token" element={
          isAuthenticated ? <Navigate to="/" /> : (
            <AnimatedPage>
              <ResetPassword />
            </AnimatedPage>
          )
        } />

        <Route path="/" element={
          isAuthenticated ? (
            <AnimatedPage>
              <Layout view={ViewState.HOME}>
                <Feed />
              </Layout>
            </AnimatedPage>
          ) : <Navigate to="/login" />
        } />

        <Route path="/profile" element={
          isAuthenticated ? (
            <AnimatedPage>
              <Layout view={ViewState.PROFILE}>
                <Profile />
              </Layout>
            </AnimatedPage>
          ) : <Navigate to="/login" />
        } />

        <Route path="/profile/:id" element={
          isAuthenticated ? (
            <AnimatedPage>
              <Layout view={ViewState.PROFILE}>
                <Profile />
              </Layout>
            </AnimatedPage>
          ) : <Navigate to="/login" />
        } />

        <Route path="/profile/photos/:id" element={
          isAuthenticated ? (
            <AnimatedPage>
              <Layout view={ViewState.PROFILE}>
                <Gallery />
              </Layout>
            </AnimatedPage>
          ) : <Navigate to="/login" />
        } />

        <Route path="/profile/photos" element={
          isAuthenticated ? (
            <AnimatedPage>
              <Layout view={ViewState.PROFILE}>
                <Gallery />
              </Layout>
            </AnimatedPage>
          ) : <Navigate to="/login" />
        } />

        <Route path="/people" element={
          isAuthenticated ? (
            <AnimatedPage>
              <Layout view={ViewState.PEOPLE}>
                <People />
              </Layout>
            </AnimatedPage>
          ) : <Navigate to="/login" />
        } />

        <Route path="/messages" element={
          isAuthenticated ? (
            <AnimatedPage>
              <Layout view={ViewState.HOME}>
                <Inbox />
              </Layout>
            </AnimatedPage>
          ) : <Navigate to="/login" />
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <PhotoModalProvider>
            <ToastProvider>
              <Router>
                <AppContent />
                <PhotoModal />
              </Router>
            </ToastProvider>
          </PhotoModalProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;