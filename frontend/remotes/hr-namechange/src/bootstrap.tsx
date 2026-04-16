import React from 'react';
import ReactDOM from 'react-dom/client';
import NameChangeApp from './NameChangeApp';
import './index.css';

// Standalone dev wrapper — provides a no-op onComplete for local development
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ maxWidth: 540, margin: '2rem auto', padding: '0 1rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', background: '#fef3c7', borderRadius: 6, fontSize: '0.78rem', color: '#92400e' }}>
        Running standalone (dev mode) — in production this component is loaded via Module Federation
      </div>
      <NameChangeApp onComplete={(id) => alert(`Request submitted: ${id}`)} />
    </div>
  </React.StrictMode>
);
