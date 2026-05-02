import { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { mockCoverage, aiColors, categoryColors } from '../data/mockData';
import './CoveragePanel.css';

const AI_INFO = {
  claude:  { label: 'Claude',  emoji: '🟣' },
  chatgpt: { label: 'ChatGPT', emoji: '🟢' },
  gemini:  { label: 'Gemini',  emoji: '🟡' },
};

export default function CoveragePanel({ nodes }) {
  const [activeAI, setActiveAI] = useState('claude');
  const coverage = mockCoverage[activeAI];
  const pct = Math.round((coverage.has.length / nodes.length) * 100);

  const hasNodes     = nodes.filter(n => coverage.has.includes(n.id));
  const missingNodes = nodes.filter(n => coverage.missing.includes(n.id));

  return (
    <div className="coverage-panel glass">
      <div className="cp-header">
        <ShieldCheck size={15} />
        <span>AI Coverage</span>
      </div>

      {/* AI Tab selector */}
      <div className="ai-tabs">
        {Object.entries(AI_INFO).map(([key, info]) => {
          const cov = mockCoverage[key];
          const p = Math.round((cov.has.length / nodes.length) * 100);
          return (
            <button
              key={key}
              className={`ai-tab ${activeAI === key ? 'active' : ''}`}
              style={{ '--ai-color': aiColors[key] }}
              onClick={() => setActiveAI(key)}
            >
              <span className="ai-tab-name">{info.label}</span>
              <span className="ai-tab-pct">{p}%</span>
            </button>
          );
        })}
      </div>

      {/* Coverage bar */}
      <div className="cov-bar-wrap">
        <div className="cov-bar-track">
          <div
            className="cov-bar-fill"
            style={{ width: `${pct}%`, background: aiColors[activeAI] }}
          />
        </div>
        <span className="cov-pct-label" style={{ color: aiColors[activeAI] }}>{pct}% covered</span>
      </div>

      {/* Split columns */}
      <div className="cov-columns">
        {/* Has */}
        <div className="cov-col">
          <div className="cov-col-header has">
            <Eye size={11} />
            <span>Knows ({hasNodes.length})</span>
          </div>
          <div className="cov-list">
            {hasNodes.map(n => (
              <div key={n.id} className="cov-node-chip has">
                <span className="chip-dot" style={{ background: categoryColors[n.category] }} />
                <span className="chip-label">{n.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Missing */}
        <div className="cov-col">
          <div className="cov-col-header missing">
            <EyeOff size={11} />
            <span>Missing ({missingNodes.length})</span>
          </div>
          <div className="cov-list">
            {missingNodes.map(n => (
              <div key={n.id} className="cov-node-chip missing">
                <AlertCircle size={10} color="#ff4d6a" />
                <span className="chip-label">{n.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
