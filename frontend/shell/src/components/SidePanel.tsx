import React from 'react';
import { FederatedNameChangeApp } from '../federation/RemoteLoader';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (requestId: string) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose, onComplete }) => {
  if (!isOpen) return null;

  const handleComplete = (requestId: string) => {
    onComplete(requestId);
    // Auto-close after a short delay so the user sees the success state
    setTimeout(onClose, 2500);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 100,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 480,
          background: '#fff',
          zIndex: 101,
          overflowY: 'auto',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              HR Self-Service
            </div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>
              Name Change Request
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            style={{
              border: 'none',
              background: '#e5e7eb',
              borderRadius: '50%',
              width: 32,
              height: 32,
              fontSize: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#374151',
            }}
          >
            ×
          </button>
        </div>

        {/* Federated micro-app — rendered directly as a React component */}
        <div style={{ padding: '1.5rem', flexGrow: 1 }}>
          <FederatedNameChangeApp onComplete={handleComplete} />
        </div>
      </div>
    </>
  );
};
