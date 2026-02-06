import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Header from './components/Header';
import Feed from './components/Feed';
import Sidebar from './components/Sidebar';
import LeftPanel from './components/LeftPanel';
import Profile from './components/Profile';
import Gallery from './components/Gallery';
import Inbox from './components/Inbox';
import Pages from './components/Pages';
import PageDetails from './components/PageDetails';
import ChatBar from './components/ChatBar';
import { ViewState } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';

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
      <Header currentView={currentView} />

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
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#eef4f9] text-[#005599] font-bold">Cargando Twenty...</div>;
  }

  // Common Layout with Header, ChatBar and standard 3-column or 2-column grid
  const Layout = ({ children, view }: { children: React.ReactNode, view: ViewState }) => (
    <div className="min-h-screen pb-[40px] bg-[#eef4f9]">
      <Header currentView={view} />

      <div className="max-w-[980px] mx-auto mt-[54px] px-2 flex flex-col md:flex-row gap-4 items-start">

        {/* Left Side: Visible on mobile at top if HOME, or fixed on desktop */}
        {view === ViewState.HOME && (
          <aside className="w-full md:w-[190px] shrink-0">
            <LeftPanel />
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 min-w-0 w-full ${view === ViewState.PROFILE ? 'max-w-4xl mx-auto' : ''}`}>
          {children}
        </main>

        {/* Right Side: Visible on mobile at bottom or fixed on desktop */}
        {view === ViewState.HOME && (
          <aside className="w-full md:w-[200px] shrink-0">
            <Sidebar />
          </aside>
        )}
      </div>

      <ChatBar />
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" /> : <Login />
      } />

      {/* Home Route */}
      <Route path="/" element={
        isAuthenticated ? (
          <Layout view={ViewState.HOME}>
            <Feed />
          </Layout>
        ) : <Navigate to="/login" />
      } />

      {/* Profile Routes */}
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

      <Route path="/messages" element={
        isAuthenticated ? (
          <Layout view={ViewState.PROFILE}>
            <Inbox />
          </Layout>
        ) : <Navigate to="/login" />
      } />

      <Route path="/pages" element={
        isAuthenticated ? (
          <Layout view={ViewState.HOME}>
            <Pages />
          </Layout>
        ) : <Navigate to="/login" />
      } />

      <Route path="/pages/:id" element={
        isAuthenticated ? (
          <Layout view={ViewState.HOME}>
            <PageDetails />
          </Layout>
        ) : <Navigate to="/login" />
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;