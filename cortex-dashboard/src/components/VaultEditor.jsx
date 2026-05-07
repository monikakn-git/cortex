import { useState, useEffect } from 'react';
import { FileCode2, Save, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import jsYaml from 'js-yaml';
import { api } from '../services/api';
import './VaultEditor.css';

const DEFAULT_YAML = `# CORTEX Context Vault
# No soul.yaml found in storage. Start editing to create one.

identity:
  name: "New Agent"
`;

export default function VaultEditor() {
  const [yaml, setYaml] = useState(DEFAULT_YAML);
  const [parseError, setParseError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load real data on mount
  useEffect(() => {
    const loadData = async () => {
      const vault = await api.getVault();
      if (vault && vault.soul) {
        setYaml(jsYaml.dump(vault.soul));
      }
    };
    loadData();
  }, []);

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
    
    const parsedData = jsYaml.load(yaml);
    const success = await api.saveVault({ soul: parsedData });
    
    setIsSaving(false);
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
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
