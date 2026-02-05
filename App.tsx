import React, { useState } from 'react';
import Login from './components/Login';
import Header from './components/Header';
import Feed from './components/Feed';
import Sidebar from './components/Sidebar';
import LeftPanel from './components/LeftPanel';
import Profile from './components/Profile';
import ChatBar from './components/ChatBar';
import { ViewState } from './types';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView(ViewState.HOME);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-[40px]"> {/* Padding bottom for fixed chat bar */}
      <Header currentView={currentView} onChangeView={setCurrentView} />
      
      {/* Main Container */}
      <div className="max-w-[980px] mx-auto mt-[54px] px-2 flex gap-4 items-start">
        
        {/* VIEW: HOME (3 Columns) */}
        {currentView === ViewState.HOME && (
          <>
            {/* Left Column: Menu & Profile Summary */}
            <aside className="w-[190px] shrink-0">
               <LeftPanel />
            </aside>

            {/* Center Column: Feed */}
            <main className="flex-1 min-w-0">
               <Feed />
            </main>

            {/* Right Column: Sidebar */}
            <aside className="w-[200px] shrink-0">
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
}

export default App;