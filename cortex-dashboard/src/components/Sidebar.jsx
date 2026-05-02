import { useState } from 'react';
import { 
  LayoutDashboard, BrainCircuit, GitMerge, 
  Database, FileCode2, ChevronLeft, ChevronRight,
  Shield, Zap, Radio
} from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
  { id: 'graph',     icon: BrainCircuit,     label: 'Knowledge' },
  { id: 'conflicts', icon: GitMerge,          label: 'Conflicts', badge: 4 },
  { id: 'coverage',  icon: Database,          label: 'AI Coverage' },
  { id: 'vault',     icon: FileCode2,         label: 'Direct Vault' },
];

export default function Sidebar({ activePage, onPageChange }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`sidebar-pro ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo-hex">
          <Zap size={20} fill="currentColor" />
        </div>
        {!isCollapsed && (
          <div className="brand-info">
            <span className="brand-title">CORTEX</span>
            <span className="brand-tag">ACTIVE BRIDGE</span>
          </div>
        )}
      </div>

      <nav className="sidebar-menu">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onPageChange(item.id)}
          >
            <div className="menu-icon"><item.icon size={18} /></div>
            {!isCollapsed && <span className="menu-label">{item.label}</span>}
            {item.badge && !isCollapsed && <span className="menu-badge">{item.badge}</span>}
            {activePage === item.id && <div className="active-indicator" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className={`connection-status ${isCollapsed ? 'mini' : ''}`}>
          <Radio size={14} className="pulse-icon" />
          {!isCollapsed && <span>LINKED TO OPENCLAW</span>}
        </div>
        <button className="collapse-pro" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
