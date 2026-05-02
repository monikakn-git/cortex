import VaultEditor from '../components/VaultEditor';
import { FileCode2, Info } from 'lucide-react';
import './VaultPage.css';

export default function VaultPage() {
  return (
    <div className="vault-page">
      <div className="vp-header">
        <div className="vp-title-wrap">
          <FileCode2 size={20} color="#7c6aff" />
          <div>
            <h1 className="vp-title">Vault Editor</h1>
            <p className="vp-sub">Manually correct your context facts in YAML · Changes sync to all AIs</p>
          </div>
        </div>
        <div className="vp-info glass">
          <Info size={12} color="#7c6aff" />
          <span>Changes are saved locally and POSTed to <code>/vault</code> when backend is running</span>
        </div>
      </div>
      <div className="vp-editor-wrap">
        <VaultEditor />
      </div>
    </div>
  );
}
