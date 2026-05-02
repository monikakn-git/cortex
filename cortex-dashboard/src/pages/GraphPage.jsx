import { useState } from 'react';
import KnowledgeGraph from '../components/KnowledgeGraph';
import NodeDetail from '../components/NodeDetail';
import { mockVault } from '../data/mockData';
import { BrainCircuit, Filter, Search, RotateCcw } from 'lucide-react';
import './GraphPage.css';

const CATEGORIES = ['all', 'identity', 'profession', 'project', 'skill', 'preference', 'context'];

export default function GraphPage() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showConflicts, setShowConflicts] = useState(false);

  const filteredNodes = mockVault.nodes.filter(n => {
    if (filter !== 'all' && n.category !== filter) return false;
    if (showConflicts && !n.conflict) return false;
    if (search && !n.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = mockVault.edges.filter(e =>
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
