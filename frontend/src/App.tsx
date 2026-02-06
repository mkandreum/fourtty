import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Header from './components/Header';
import Feed from './components/Feed';
import Sidebar from './components/Sidebar';
import LeftPanel from './components/LeftPanel';
import Profile from './components/Profile';
import Gallery from './components/Gallery';
import People from './components/People';
import ChatBar from './components/ChatBar';
import { ViewState } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ToastProvider } from './contexts/ToastContext';
import { PhotoModalProvider } from './contexts/PhotoModalContext';
import ToastContainer from './components/ToastContainer';
import PhotoModal from './components/PhotoModal';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const { isAuthenticated, isLoading } = useAuth();

  // Handlers for switching views (passed to Header, etc.)
  // In a real router app, these would just be Links

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#eef4f9]">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen pb-[40px] bg-[#eef4f9]">
      <Header />

      {/* Main Container */}
      <div className="max-w-[980px] mx-auto mt-[54px] px-2 flex gap-4 items-start">

        {/* VIEW: HOME (3 Columns) */}
        {currentView === ViewState.HOME && (
          <>
            {/* Left Column: Menu & Profile Summary */}
            <aside className="w-[190px] shrink-0 hidden md:block">
              <LeftPanel />
            </aside>

            {/* Center Column: Feed */}
            <main className="flex-1 min-w-0">
              {children}
            </main>

            {/* Right Column: Sidebar */}
            <aside className="w-[200px] shrink-0 hidden lg:block">
              <Sidebar />
            </aside>
          </>
        )}

        {/* VIEW: PROFILE (2 Columns) */}
        {currentView === ViewState.PROFILE && (
          <main className="w-full">
            <Profile />
          </main>
        )}

      </div>

      <ChatBar />
    </div>
  );
};

// Wrapper to handle conditional rendering based on view state
// Ideally we would use proper routes like /profile/:id, but adhering to current structure for now
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#eef4f9] text-[#005599] font-bold">Cargando Twentty...</div>;
  }

  const Layout = ({ children, view }: { children: React.ReactNode, view: ViewState }) => (
    <div className="min-h-screen pb-[40px] bg-[#eef4f9]">
      <Header />
      <ToastContainer />
      <div className="main-content-container max-w-[980px] mx-auto px-0 sm:px-2">
        <div className={`flex flex-col md:flex-row md:gap-0 items-start ${view === ViewState.HOME || view === ViewState.PEOPLE ? 'md:bg-white md:border md:border-[#dce5ed] md:rounded-[4px] md:shadow-sm md:mt-4' : ''}`}>
          {view === ViewState.HOME && (
            <aside className="hidden md:block w-[190px] shrink-0 sticky top-[68px] border-r border-[#eee] min-h-[calc(100vh-68px)]">
              <div className="p-3">
                <LeftPanel />
              </div>
            </aside>
          )}
          <main className={`flex-1 min-w-0 w-full bg-white md:bg-transparent ${view === ViewState.PROFILE ? 'max-w-4xl mx-auto' : ''}`}>
            {children}
          </main>
          {(view === ViewState.HOME || view === ViewState.PEOPLE) && (
            <aside className="hidden lg:block w-[200px] shrink-0 sticky top-[68px] border-l border-[#eee] min-h-[calc(100vh-68px)]">
              <div className="p-3">
                <Sidebar />
              </div>
            </aside>
          )}
        </div>
      </div>
      <ChatBar />
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : <Login />
        } />

        <Route path="/forgot-password" element={
          isAuthenticated ? <Navigate to="/" /> : <ForgotPassword />
        } />

        <Route path="/reset-password/:token" element={
          isAuthenticated ? <Navigate to="/" /> : <ResetPassword />
        } />

        <Route path="/" element={
          isAuthenticated ? (
            <Layout view={ViewState.HOME}>
              <Feed />
            </Layout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/profile" element={
          isAuthenticated ? (
            <Layout view={ViewState.PROFILE}>
              <Profile />
            </Layout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/profile/:id" element={
          isAuthenticated ? (
            <Layout view={ViewState.PROFILE}>
              <Profile />
            </Layout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/profile/photos/:id" element={
          isAuthenticated ? (
            <Layout view={ViewState.PROFILE}>
              <Gallery />
            </Layout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/profile/photos" element={
          isAuthenticated ? (
            <Layout view={ViewState.PROFILE}>
              <Gallery />
            </Layout>
          ) : <Navigate to="/login" />
        } />

        <Route path="/people" element={
          isAuthenticated ? (
            <Layout view={ViewState.PEOPLE}>
              <People />
            </Layout>
          ) : <Navigate to="/login" />
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <PhotoModalProvider>
          <ToastProvider>
            <Router>
              <AppContent />
            </Router>
          </ToastProvider>
        </PhotoModalProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;