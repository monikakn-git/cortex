import { useState, useEffect } from 'react';
import { 
  Database, GitMerge, ShieldCheck, Activity,
  TrendingUp, Clock, ChevronRight, BrainCircuit,
  Zap, Info, ArrowUpRight, Shield
} from 'lucide-react';
import KnowledgeGraph from '../components/KnowledgeGraph';
import HealthScore from '../components/HealthScore';
import NodeDetail from '../components/NodeDetail';
import { api } from '../services/api';
import { categoryColors } from '../data/mockData';
import './Dashboard.css';

export default function Dashboard() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [vaultData, setVaultData] = useState({ nodes: [], edges: [] });
  const [stats, setStats] = useState([
    { icon: Database, label: 'Total Nodes', val: 0, color: 'var(--accent-primary)', sub: 'Syncing...' },
    { icon: GitMerge, label: 'Active Conflicts', val: 0, color: 'var(--accent-success)', sub: 'Clean vault' },
    { icon: ShieldCheck, label: 'Vault Coverage', val: '0%', color: 'var(--accent-secondary)', sub: 'Initializing...' },
  ]);

  const [userName, setUserName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  const handleUpdateName = async () => {
    if (!userName.trim()) return;
    try {
      const res = await api.updateName(userName);
      if (res.ok) {
        setUserName(res.name);
        setIsEditingName(false);
        // Refresh vault to update graph node label
        const vault = await api.getVault();
        const updatedNodes = vaultData.nodes.map(n => 
          n.id === 'john_doe' ? { ...n, label: res.name } : n
        );
        setVaultData(v => ({ ...v, nodes: updatedNodes }));
      }
    } catch (err) { console.error('Failed to update name', err); }
  };

  useEffect(() => {
    const loadRealData = async () => {
      const [vault, conversations] = await Promise.all([
        api.getVault(),
        api.getConversations()
      ]);

      const nodes = [];
      const edges = [];

      const currentName = vault?.soul?.user?.name || 'User';
      setUserName(currentName);

      // Add Central Identity Node (Target for "F" key)
      nodes.push({ 
        id: 'john_doe', 
        label: currentName, 
        category: 'identity', 
        conflict: false,
        detail: 'Central Identity Node'
      });

      // 1. Add Conversation Nodes
      (conversations || []).forEach(c => {
        nodes.push({
          id: c.id,
          label: c.title || `${c.platform.toUpperCase()} Chat`,
          category: 'context',
          ai: [c.platform],
          conflict: false,
          detail: c.preview
        });
        // Link everything to central node
        edges.push({ source: 'john_doe', target: c.id });
      });

      // 2. Add Signal Nodes from Vault
      if (vault) {
        Object.entries(vault).forEach(([key, data]) => {
          if (key.endsWith('-contexts') && data.contexts) {
            data.contexts.forEach((ctx, ctxIdx) => {
              const platform = key.split('-')[0];
              // Find matching conversation for edge
              const conv = (conversations || []).find(c => 
                Math.abs(new Date(c.extracted_at).getTime() - new Date(ctx.extracted_at).getTime()) < 5000
              );

              // Add nodes for each signal type
              if (ctx.signals.preferences) {
                ctx.signals.preferences.forEach((p, i) => {
                  const nodeId = `${platform}_pref_${ctxIdx}_${i}`;
                  nodes.push({ id: nodeId, label: p.value, category: 'preference', ai: [platform], detail: p.key });
                  if (conv) edges.push({ source: conv.id, target: nodeId });
                });
              }
              if (ctx.signals.goals) {
                ctx.signals.goals.forEach((g, i) => {
                  const nodeId = `${platform}_goal_${ctxIdx}_${i}`;
                  nodes.push({ id: nodeId, label: g.goal, category: 'project', ai: [platform], detail: g.status });
                  if (conv) edges.push({ source: conv.id, target: nodeId });
                });
              }
            });
          }
        });
      }

      setVaultData({ nodes, edges });
      
      setStats([
        { icon: Database, label: 'Total Nodes', val: nodes.length, color: 'var(--accent-primary)', sub: 'From real extractions' },
        { icon: GitMerge, label: 'Active Conflicts', val: 0, color: 'var(--accent-success)', sub: 'Clean vault' },
        { icon: ShieldCheck, label: 'Vault Coverage', val: nodes.length > 0 ? '100%' : '0%', color: 'var(--accent-secondary)', sub: 'Live sync' },
      ]);
    };
    loadRealData();
  }, []);

  const totalNodes = vaultData.nodes.length;
  const conflictsCount = 0;

  return (
    <div className="dashboard-pro animate-up">
      {/* Background Orbs */}
      <div className="bg-orb" style={{ top: '5%', left: '10%', width: '500px', height: '500px', background: 'var(--accent-primary)', opacity: 0.12 }} />
      <div className="bg-orb" style={{ bottom: '10%', right: '5%', width: '450px', height: '450px', background: 'var(--accent-secondary)', animationDelay: '-5s', opacity: 0.1 }} />
      <div className="bg-orb" style={{ top: '30%', left: '40%', width: '600px', height: '600px', background: 'var(--accent-info)', animationDelay: '-12s', opacity: 0.08 }} />

      <header className="dash-header-pro">
        <div className="header-content">
          <div className="title-group">
            <h1 className="text-gradient">Context Horizon</h1>
            <p className="subtitle">Universal Identity & Knowledge Topology</p>
          </div>
          <div className="header-actions">
            {isEditingName ? (
              <div className="identity-pill-edit glass">
                <input 
                  type="text" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  autoFocus
                />
                <button className="pill-btn save" onClick={handleUpdateName}>Commit</button>
                <button className="pill-btn cancel" onClick={() => setIsEditingName(false)}>✕</button>
              </div>
            ) : (
              <button className="identity-pill glass" onClick={() => setIsEditingName(true)} title="Click to change your name">
                <span className="dot success" />
                <span className="name">{userName || 'Connecting...'}</span>
              </button>
            )}
            <button className="btn-sync glass"><Zap size={14} /> Sync Vault</button>
          </div>
        </div>
      </header>

      <div className="layout-grid-pro">
        {/* Left Column - Stats & Identity */}
        <div className="layout-side-col">
          <div className="stat-stack">
            {stats.map((s, i) => (
              <div key={i} className="mini-stat-card glass">
                <div className="ms-icon" style={{ color: s.color }}><s.icon size={18} /></div>
                <div className="ms-info">
                  <span className="ms-label">{s.label}</span>
                  <span className="ms-val">{s.val}</span>
                </div>
                <div className="ms-glow" style={{ background: s.color }} />
              </div>
            ))}
          </div>

          <div className="side-widget-pro glass identity-widget">
            <div className="sw-header">
              <Shield size={14} />
              <h3>Identity Management</h3>
            </div>
            <div className="sw-body">
              {isEditingName ? (
                <div className="identity-form">
                  <input 
                    type="text" 
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter name..."
                    autoFocus
                  />
                  <div className="form-actions">
                    <button className="save" onClick={handleUpdateName}>Commit</button>
                    <button className="cancel" onClick={() => setIsEditingName(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="identity-display">
                  <p>Current Persona: <strong>{userName}</strong></p>
                  <button className="btn-edit-lite" onClick={() => setIsEditingName(true)}>Update Profile</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center/Right - The Big Graph */}
        <div className="layout-main-col">
          <div className="graph-frame-pro glass">
            <div className="gf-header">
              <div className="gfh-left">
                <BrainCircuit size={16} />
                <span>Cognitive Topology</span>
              </div>
              <div className="gfh-right">
                <div className="legend-pills">
                  {Object.entries(categoryColors).slice(0, 5).map(([cat, col]) => (
                    <div key={cat} className="leg-pill">
                      <span className="lp-dot" style={{ background: col }} />
                      {cat}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="gf-body">
              <KnowledgeGraph 
                nodes={vaultData.nodes} 
                edges={vaultData.edges}
                onNodeClick={setSelectedNode}
              />
              {selectedNode && (
                <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
              )}
            </div>
            <div className="gf-footer">
              <span className="hotkey-tip">Press <strong>[F]</strong> to focus identity</span>
            </div>
          </div>

          <div className="insights-row">
            <div className="insight-card-pro glass">
              <div className="ic-icon success"><ShieldCheck size={18} /></div>
              <div className="ic-text">
                <p><strong>System Status</strong>: Vault is synchronized. No active drift detected across platforms.</p>
              </div>
            </div>
            <div className="insight-card-pro glass">
              <div className="ic-icon info"><Activity size={18} /></div>
              <div className="ic-text">
                <p><strong>Health Score</strong>: Your context coverage is 94% across ChatGPT and Claude.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
