import ConflictResolver from '../components/ConflictResolver';
import { mockConflicts } from '../data/mockData';
import { GitMerge, Info } from 'lucide-react';
import './ConflictsPage.css';

export default function ConflictsPage() {
  return (
    <div className="conflicts-page">
      <div className="cflp-header">
        <div className="cflp-title-wrap">
          <GitMerge size={20} color="#ff4d6a" />
          <div>
            <h1 className="cflp-title">Conflict Resolver</h1>
            <p className="cflp-sub">Side-by-side diff view of contradictions between AI beliefs</p>
          </div>
        </div>
        <div className="cflp-info glass">
          <Info size={12} color="#7c6aff" />
          <span>{mockConflicts.length} active conflicts detected across {mockConflicts.filter(c=>c.severity==='high').length} high-severity fields</span>
        </div>
      </div>

      <div className="cflp-body">
        {/* Severity legend */}
        <div className="sev-legend">
          {[['high','#ff4d6a','Critical mismatch — likely to cause AI errors'],
            ['medium','#ffb347','Moderate discrepancy — should be resolved'],
            ['low','#facc15','Minor difference — low impact']].map(([s,c,desc]) => (
            <div key={s} className="sev-legend-item">
              <div className="sev-pip" style={{background:c}} />
              <span className="sev-name" style={{color:c}}>{s}</span>
              <span className="sev-desc">{desc}</span>
            </div>
          ))}
        </div>

        <div className="cflp-resolver-wrap">
          <ConflictResolver conflicts={mockConflicts} />
        </div>
      </div>
    </div>
  );
}
