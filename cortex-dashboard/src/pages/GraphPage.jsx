import { useState, useEffect } from 'react';
import KnowledgeGraph from '../components/KnowledgeGraph';
import NodeDetail from '../components/NodeDetail';
import { api } from '../services/api';
import { BrainCircuit, Filter, Search, RotateCcw } from 'lucide-react';
import './GraphPage.css';

const CATEGORIES = ['all', 'identity', 'profession', 'project', 'skill', 'preference', 'context'];

export default function GraphPage() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showConflicts, setShowConflicts] = useState(false);
  const [vaultData, setVaultData] = useState({ nodes: [], edges: [] });

  useEffect(() => {
    const loadRealData = async () => {
      const [vault, conversations] = await Promise.all([
        api.getVault(),
        api.getConversations()
      ]);

      const nodes = [];
      const edges = [];

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
      });

      // 2. Add Signal Nodes from Vault
      if (vault) {
        Object.entries(vault).forEach(([key, data]) => {
          if (key.endsWith('-contexts') && data.contexts) {
            data.contexts.forEach((ctx, ctxIdx) => {
              const platform = key.split('-')[0];
              const conv = (conversations || []).find(c => 
                Math.abs(new Date(c.extracted_at).getTime() - new Date(ctx.extracted_at).getTime()) < 5000
              );

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
    };
    loadRealData();
  }, []);

  const filteredNodes = vaultData.nodes.filter(n => {
    if (filter !== 'all' && n.category !== filter) return false;
    if (showConflicts && !n.conflict) return false;
    if (search && !n.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = vaultData.edges.filter(e =>
    filteredIds.has(e.source) && filteredIds.has(e.target)
  );

  return (
    <div className="graph-page">
      {/* Header */}
      <div className="gp-header">
        <div className="gp-title-wrap">
          <BrainCircuit size={20} color="#7c6aff" />
          <div>
            <h1 className="gp-title">Knowledge Graph</h1>
            <p className="gp-sub">Force-directed map of all context facts · {filteredNodes.length} nodes visible</p>
          </div>
        </div>

        <div className="gp-controls">
          {/* Search */}
          <div className="gp-search">
            <Search size={13} />
            <input
              placeholder="Search nodes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Conflict toggle */}
          <button
            className={`gp-toggle ${showConflicts ? 'active' : ''}`}
            onClick={() => setShowConflicts(!showConflicts)}
          >
            ⚠ Conflicts only
          </button>

          {/* Reset */}
          <button className="gp-reset" onClick={() => { setFilter('all'); setSearch(''); setShowConflicts(false); }}>
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="gp-filters">
        <Filter size={12} color="#5a5a7a" />
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`cat-filter ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Graph */}
      <div className="gp-graph-area" style={{ position: 'relative' }}>
        <KnowledgeGraph
          nodes={filteredNodes}
          edges={filteredEdges}
          onNodeClick={setSelectedNode}
        />
        {selectedNode && (
          <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </div>
    </div>
  );
}
