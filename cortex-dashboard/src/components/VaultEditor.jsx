import { useState, useEffect } from 'react';
import { FileCode2, Save, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import jsYaml from 'js-yaml';
import './VaultEditor.css';

const DEFAULT_YAML = `# CORTEX Context Vault
# Edit your context facts below and click Save

identity:
  name: "John Doe"
  age: 28
  location: "New York City, NY"
  pronouns: "he/him"

profession:
  title: "Software Engineer"
  specialization: "React Developer"
  experience_years: 5

skills:
  - D3.js
  - React
  - Python
  - System Design
  - Machine Learning

preferences:
  theme: dark
  editor: vim
  work_style: remote
`;

export default function VaultEditor() {
  const [yaml, setYaml] = useState(DEFAULT_YAML);
  const [parseError, setParseError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      jsYaml.load(yaml);
      setParseError(null);
    } catch (e) {
      setParseError(e.message);
    }
  }, [yaml]);

  const handleSave = async () => {
    if (parseError) return;
    setIsSaving(true);
    // Mock save
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="vault-editor animate-fadeIn">
      <div className="editor-header">
        <div className="header-info">
          <FileCode2 size={24} color="#7c6aff" />
          <div>
            <h2>Vault Editor</h2>
            <p>Manually edit your context beliefs in YAML format</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => setYaml(DEFAULT_YAML)}>
            <RotateCcw size={16} /> Reset
          </button>
          <button 
            className={`btn-primary ${saved ? 'success' : ''}`}
            onClick={handleSave}
            disabled={!!parseError || isSaving}
          >
            {saved ? <CheckCircle size={16} /> : <Save size={16} />}
            {isSaving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="editor-body card">
        <div className="validation-bar">
          {parseError ? (
            <div className="status error"><AlertCircle size={14} /> {parseError}</div>
          ) : (
            <div className="status success"><CheckCircle size={14} /> Valid YAML - {yaml.split('\n').length} lines</div>
          )}
        </div>
        <div className="editor-wrapper">
          <div className="line-nums">
            {yaml.split('\n').map((_, i) => <div key={i}>{i+1}</div>)}
          </div>
          <textarea
            className="yaml-input"
            value={yaml}
            onChange={e => setYaml(e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
