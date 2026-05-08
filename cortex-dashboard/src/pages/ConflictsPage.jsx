import { useState, useEffect } from 'react';
import ConflictResolver from '../components/ConflictResolver';
import { api } from '../services/api';
import { GitMerge, Info } from 'lucide-react';
import './ConflictsPage.css';

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConflicts = async () => {
      const vault = await api.getVault();
      if (vault && vault.realConflicts) {
        setConflicts(vault.realConflicts);
      }
      setLoading(false);
    };
    loadConflicts();
  }, []);

  const pending = conflicts.filter(c => c.status === 'pending');
  const highSeverity = pending.filter(c => c.severity === 'high').length;

  return (
    <div className="conflicts-page animate-up">
      <div className="cflp-header">
        <div className="cflp-title-wrap">
          <GitMerge size={20} color="#ff4d6a" />
          <div>
            <h1 className="cflp-title">Conflict Resolver</h1>
            <p className="cflp-sub">Side-by-side diff view of contradictions between AI beliefs</p>
          </div>
        </div>
        {!loading && (
          <div className="cflp-info glass">
            <Info size={12} color="#7c6aff" />
            <span>{pending.length} active conflicts detected across {highSeverity} high-severity fields</span>
          </div>
        )}
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
          <ConflictResolver conflicts={conflicts} />
        </div>
      </div>
    </div>
  );
}
