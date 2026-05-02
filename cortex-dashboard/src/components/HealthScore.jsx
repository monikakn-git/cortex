import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react';
import './HealthScore.css';

export default function HealthScore({ score = 72, conflicts = 4, totalNodes = 24 }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return 'var(--accent-secondary)';
    if (score >= 50) return 'var(--accent-warning)';
    return 'var(--accent-danger)';
  };

  return (
    <div className="health-score card">
      <div className="card-header">
        <h3>Context Health</h3>
        <Activity size={18} color={getScoreColor()} />
      </div>

      <div className="score-display">
        <svg width="120" height="120" className="score-ring">
          <circle
            className="ring-bg"
            cx="60" cy="60" r={radius}
            strokeWidth="8"
          />
          <circle
            className="ring-progress"
            cx="60" cy="60" r={radius}
            strokeWidth="8"
            strokeDasharray={circumference}
            style={{ 
              strokeDashoffset,
              stroke: getScoreColor()
            }}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="score-text">
          <span className="number">{score}</span>
          <span className="percent">%</span>
        </div>
      </div>

      <div className="score-stats">
        <div className="score-stat">
          <ShieldCheck size={14} className="icon teal" />
          <div className="stat-meta">
            <span className="label">Completeness</span>
            <span className="val">85%</span>
          </div>
        </div>
        <div className="score-stat">
          <AlertTriangle size={14} className="icon red" />
          <div className="stat-meta">
            <span className="label">Conflicts</span>
            <span className="val">{conflicts} detected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
