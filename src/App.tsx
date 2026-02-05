import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Header from './components/Header';
import Feed from './components/Feed';
import Sidebar from './components/Sidebar';
import LeftPanel from './components/LeftPanel';
import Profile from './components/Profile';
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
      <Header currentView={currentView} onChangeView={setCurrentView} />

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
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#eef4f9] text-[#005599] font-bold">Cargando Twenty...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" /> : <Login />
      } />

      <Route path="/*" element={
        isAuthenticated ? (
          <div className="min-h-screen pb-[40px] bg-[#eef4f9]">
            <Header currentView={currentView} onChangeView={setCurrentView} />

            <div className="max-w-[980px] mx-auto mt-[54px] px-2 flex gap-4 items-start">
              {currentView === ViewState.HOME && (
                <>
                  <aside className="w-[190px] shrink-0">
                    <LeftPanel />
                  </aside>
                  <main className="flex-1 min-w-0">
                    <Feed />
                  </main>
                  <aside className="w-[200px] shrink-0">
                    <Sidebar />
                  </aside>
                </>
              )}

              {currentView === ViewState.PROFILE && (
                <main className="w-full">
                  <Profile />
                </main>
              )}
            </div>

            <ChatBar />
          </div>
        ) : (
          <Navigate to="/login" />
        )
      } />
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