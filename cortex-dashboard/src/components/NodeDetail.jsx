import { X, ExternalLink } from 'lucide-react';
import { categoryColors, aiColors } from '../data/mockData';
import './NodeDetail.css';

export default function NodeDetail({ node, onClose }) {
  if (!node) return null;

  const color = categoryColors[node.category] || '#7c6aff';

  return (
    <div className="node-detail animate-fadeUp">
      <div className="nd-header" style={{ borderColor: color + '44' }}>
        <div className="nd-title-row">
          <div className="nd-dot" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
          <div>
            <div className="nd-label">{node.label}</div>
            <div className="nd-cat" style={{ color }}>{node.category}</div>
          </div>
          <button className="nd-close" onClick={onClose}><X size={14} /></button>
        </div>
      </div>

      <div className="nd-body">
        {node.conflict && (
          <div className="nd-conflict-banner">
            ⚠ This node has a detected conflict between AI beliefs
          </div>
        )}

        <div className="nd-field">
          <span className="nd-field-label">Detail</span>
          <span className="nd-field-val">{node.detail || '—'}</span>
        </div>

        <div className="nd-field">
          <span className="nd-field-label">Sourced by</span>
          <div className="nd-ai-tags">
            {node.ai.map(a => (
              <span
                key={a}
                className="nd-ai-tag"
                style={{ color: aiColors[a], background: aiColors[a] + '18', border: `1px solid ${aiColors[a]}44` }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>

        <div className="nd-field">
          <span className="nd-field-label">Node ID</span>
          <span className="nd-field-val mono">{node.id}</span>
        </div>

        <div className="nd-field">
          <span className="nd-field-label">Status</span>
          <span className={`nd-status ${node.conflict ? 'conflict' : 'clean'}`}>
            {node.conflict ? '⚠ Conflict' : '✓ Clean'}
          </span>
        </div>
      </div>
    </div>
  );
}
