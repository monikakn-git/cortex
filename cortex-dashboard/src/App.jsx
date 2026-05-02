import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import GraphPage from './pages/GraphPage';
import ConflictsPage from './pages/ConflictsPage';
import CoveragePage from './pages/CoveragePage';
import VaultPage from './pages/VaultPage';
import { Search, Bell, Settings, Power, User } from 'lucide-react';
import './App.css';

const PAGES = {
  dashboard: Dashboard,
  graph:     GraphPage,
  conflicts: ConflictsPage,
  coverage:  CoveragePage,
  vault:     VaultPage,
};

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Artificial delay for 'booting' sequence feel
    const timer = setTimeout(() => setIsReady(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const PageComponent = PAGES[activePage] || Dashboard;

  if (!isReady) {
    return (
      <div className="boot-screen">
        <div className="boot-logo">
          <div className="boot-spinner"></div>
          <span className="boot-text">CORTEX v1.0 INITIALIZING...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell animate-up">
      {/* Integrated Sidebar */}
      <Sidebar activePage={activePage} onPageChange={setActivePage} />

      {/* Main Container */}
      <div className="main-wrapper">
        {/* Universal Top Header */}
        <header className="top-command-bar glass">
          <div className="header-left">
            <div className="breadcrumb">
              <span className="root">CORTEX</span>
              <span className="divider">/</span>
              <span className="current">{activePage.toUpperCase()}</span>
            </div>
          </div>

          <div className="header-center">
            <div className="global-search glass">
              <Search size={14} />
              <input placeholder="Query context nodes..." />
            </div>
          </div>

          <div className="header-right">
            <div className="sys-status">
              <div className="status-dot pulse" />
              <span>VAULT LIVE</span>
            </div>
            <div className="h-divider" />
            <button className="h-action-btn"><Bell size={18} /></button>
            <button className="h-action-btn"><Settings size={18} /></button>
            <div className="profile-pill glass">
              <div className="profile-avatar"><User size={14} /></div>
              <span className="profile-name">John Doe</span>
            </div>
          </div>
        </header>

        {/* Page Content Area */}
        <main className="page-content">
          <div className="page-scroll-area">
            <PageComponent />
          </div>
        </main>
      </div>
    </div>
  );
}
