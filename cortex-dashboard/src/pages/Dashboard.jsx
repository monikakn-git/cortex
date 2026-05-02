import { useState } from 'react';
import { 
  Database, GitMerge, ShieldCheck, Activity,
  TrendingUp, Clock, ChevronRight, BrainCircuit,
  Zap, Info, ArrowUpRight
} from 'lucide-react';
import KnowledgeGraph from '../components/KnowledgeGraph';
import HealthScore from '../components/HealthScore';
import NodeDetail from '../components/NodeDetail';
import { mockVault, mockConflicts, categoryColors } from '../data/mockData';
import './Dashboard.css';

export default function Dashboard() {
  const [selectedNode, setSelectedNode] = useState(null);

  const conflicts = mockConflicts.length;
  const totalNodes = mockVault.nodes.length;

  const stats = [
    { icon: Database, label: 'Total Nodes', val: totalNodes, color: 'var(--accent-primary)', sub: '+12% from last sync' },
    { icon: GitMerge, label: 'Active Conflicts', val: conflicts, color: 'var(--accent-danger)', sub: '3 high priority' },
    { icon: ShieldCheck, label: 'Vault Coverage', val: '92%', color: 'var(--accent-secondary)', sub: 'Across 3 AI models' },
  ];

  return (
    <div className="dashboard-pro animate-up">
      {/* Hero Section */}
      <div className="dash-hero">
        <div className="hero-text">
          <h1>Universal Context Hub</h1>
          <p>Real-time knowledge synchronization across your AI ecosystem.</p>
        </div>
        <div className="hero-actions">
          <button className="btn-primary-pro"><Zap size={16} /> Force Sync All</button>
        </div>
      </div>

      {/* Modern Stats Row */}
      <div className="pro-stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="pro-stat-card glass">
            <div className="ps-header">
              <div className="ps-icon" style={{ color: s.color, background: s.color + '15' }}><s.icon size={20} /></div>
              <ArrowUpRight size={14} className="ps-trend" />
            </div>
            <div className="ps-body">
              <span className="ps-val">{s.val}</span>
              <span className="ps-label">{s.label}</span>
              <span className="ps-sub">{s.sub}</span>
            </div>
            <div className="ps-glow" style={{ background: s.color }} />
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="pro-main-grid">
        {/* Graph Section */}
        <div className="pro-graph-container glass">
          <div className="pg-header">
            <div className="pgh-left">
              <BrainCircuit size={16} />
              <span>Cognitive Topology</span>
            </div>
            <div className="pgh-right">
              <div className="legend-pills">
                {Object.entries(categoryColors).slice(0, 4).map(([cat, col]) => (
                  <div key={cat} className="leg-pill">
                    <span className="lp-dot" style={{ background: col }} />
                    {cat}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pg-body">
            <KnowledgeGraph 
              nodes={mockVault.nodes} 
              edges={mockVault.edges}
              onNodeClick={setSelectedNode}
            />
            {selectedNode && (
              <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
            )}
          </div>
        </div>

        {/* Side Panel Section */}
        <div className="pro-side-panel">
          <div className="side-widget-pro">
            <HealthScore score={72} conflicts={conflicts} totalNodes={totalNodes} />
          </div>

          <div className="side-widget-pro glass">
            <div className="sw-header">
              <h3><Info size={14} /> Quick Insights</h3>
            </div>
            <div className="sw-body">
              <div className="insight-item">
                <div className="ii-dot warning" />
                <div className="ii-text">
                  <p><strong>Drift Detected</strong>: Claude's belief on 'Salary' differs from ChatGPT by 15%.</p>
                  <span>12m ago</span>
                </div>
              </div>
              <div className="insight-item">
                <div className="ii-dot success" />
                <div className="ii-text">
                  <p><strong>Perfect Sync</strong>: Gemini knowledge vault is 100% compliant with local facts.</p>
                  <span>2h ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
