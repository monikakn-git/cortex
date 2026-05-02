import CoveragePanel from '../components/CoveragePanel';
import { mockVault, mockCoverage, aiColors } from '../data/mockData';
import { ShieldCheck } from 'lucide-react';
import './CoveragePage.css';

export default function CoveragePage() {
  const total = mockVault.nodes.length;

  return (
    <div className="coverage-page">
      <div className="cvp-header">
        <div className="cvp-title-wrap">
          <ShieldCheck size={20} color="#5eead4" />
          <div>
            <h1 className="cvp-title">AI Coverage</h1>
            <p className="cvp-sub">See exactly what each AI knows and is missing about you</p>
          </div>
        </div>
      </div>

      {/* Summary bars */}
      <div className="cvp-summary">
        {Object.entries(mockCoverage).map(([ai, data]) => {
          const pct = Math.round((data.has.length / total) * 100);
          return (
            <div key={ai} className="cvp-ai-card glass">
              <div className="cvp-ai-name" style={{ color: aiColors[ai] }}>{ai}</div>
              <div className="cvp-bar-wrap">
                <div className="cvp-bar-track">
                  <div className="cvp-bar-fill" style={{ width: `${pct}%`, background: aiColors[ai] }} />
                </div>
                <span className="cvp-pct" style={{ color: aiColors[ai] }}>{pct}%</span>
              </div>
              <div className="cvp-stats">
                <span className="has">{data.has.length} known</span>
                <span className="missing">{data.missing.length} missing</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full panel */}
      <div className="cvp-panel-wrap">
        <CoveragePanel nodes={mockVault.nodes} />
      </div>
    </div>
  );
}
