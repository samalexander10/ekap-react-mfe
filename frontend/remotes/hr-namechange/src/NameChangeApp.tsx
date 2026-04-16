import React from 'react';
import { NameChangeForm } from './components/NameChangeForm';
import './index.css';

interface Props {
  onComplete: (requestId: string) => void;
}

/**
 * NameChangeApp is the Module Federation exposed component.
 * It is loaded by the shell host at runtime via:
 *   import('hrNamechange/NameChangeApp')
 *
 * The shell passes the onComplete callback as a prop — no postMessage needed.
 */
const NameChangeApp: React.FC<Props> = ({ onComplete }) => (
  <div>
    <div style={{ marginBottom: '1.25rem' }}>
      <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 700, color: '#111827' }}>
        Legal Name Change Request
      </h2>
      <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.5 }}>
        Complete the form below to request a legal name update in our HR systems.
        Your supporting document will be verified using AI before HR processes the change.
      </p>
    </div>
    <NameChangeForm onComplete={onComplete} />
  </div>
);

export default NameChangeApp;
