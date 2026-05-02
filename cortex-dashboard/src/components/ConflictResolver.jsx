import { useState } from 'react';
import { GitMerge, CheckCheck, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { aiColors } from '../data/mockData';
import './ConflictResolver.css';

const SEVERITY_COLOR = { high: '#ff4d6a', medium: '#ffb347', low: '#facc15' };

function ConflictCard({ conflict, onResolve, resolved }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`conflict-card ${resolved ? 'resolved' : ''} sev-${conflict.severity}`}>
      <div className="cc-top" onClick={() => setExpanded(!expanded)}>
        <div className="cc-left">
          <div className="sev-dot" style={{ background: SEVERITY_COLOR[conflict.severity] }} />
          <div>
            <div className="cc-field">{conflict.field}</div>
            <div className="cc-sev" style={{ color: SEVERITY_COLOR[conflict.severity] }}>
              {conflict.severity} severity
            </div>
          </div>
        </div>
        <div className="cc-actions">
          {resolved ? (
            <span className="resolved-badge"><CheckCheck size={11} /> Resolved</span>
          ) : (
            <button className="fix-btn" onClick={e => { e.stopPropagation(); onResolve(conflict.id); }}>
              Fix
            </button>
          )}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {expanded && (
        <div className="cc-diff animate-fadeUp">
          {/* Side A */}
          <div className="diff-side side-a">
            <div className="diff-ai-tag" style={{ color: aiColors[conflict.aiA], borderColor: aiColors[conflict.aiA] + '44', background: aiColors[conflict.aiA] + '15' }}>
              {conflict.aiA}
            </div>
            <div className="diff-value">{conflict.valueA}</div>
          </div>

          {/* VS */}
          <div className="diff-vs">VS</div>

          {/* Side B */}
          <div className="diff-side side-b">
            <div className="diff-ai-tag" style={{ color: aiColors[conflict.aiB], borderColor: aiColors[conflict.aiB] + '44', background: aiColors[conflict.aiB] + '15' }}>
              {conflict.aiB}
            </div>
            <div className="diff-value">{conflict.valueB}</div>
          </div>

          {/* Suggestion */}
          {!resolved && (
            <div className="diff-suggestion">
              <Zap size={11} color="#ffb347" />
              <span>Suggested fix:</span>
              <strong>{conflict.suggestion}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConflictResolver({ conflicts }) {
  const [resolved, setResolved] = useState(new Set());
  const [fixingAll, setFixingAll] = useState(false);

  const handleResolve = (id) => setResolved(prev => new Set([...prev, id]));

  const handleFixAll = () => {
    setFixingAll(true);
    conflicts.forEach((c, i) => {
      setTimeout(() => setResolved(prev => new Set([...prev, c.id])), i * 300);
    });
    setTimeout(() => setFixingAll(false), conflicts.length * 300 + 200);
  };

  const unresolved = conflicts.filter(c => !resolved.has(c.id));

  return (
    <div className="conflict-resolver">
      <div className="cr-header">
        <div className="cr-title">
          <GitMerge size={15} />
          <span>Conflict Resolver</span>
          {unresolved.length > 0 && <span className="cr-badge">{unresolved.length}</span>}
        </div>
        {unresolved.length > 0 && (
          <button className={`fix-all-btn ${fixingAll ? 'loading' : ''}`} onClick={handleFixAll} disabled={fixingAll}>
            <Zap size={13} />
            {fixingAll ? 'Fixing…' : 'Fix All'}
          </button>
        )}
        {unresolved.length === 0 && (
          <div className="all-clear">
            <CheckCheck size={13} />
            <span>All clear!</span>
          </div>
        )}
      </div>

      <div className="cr-list">
        {conflicts.map(c => (
          <ConflictCard
            key={c.id}
            conflict={c}
            resolved={resolved.has(c.id)}
            onResolve={handleResolve}
          />
        ))}
      </div>
    </div>
  );
}
