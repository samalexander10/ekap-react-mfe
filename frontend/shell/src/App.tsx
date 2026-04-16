import React from 'react';
import { ChatPanel } from './components/ChatPanel';

const App: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top nav */}
      <header
        style={{
          height: 56,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.5rem',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>EKAP</div>
            <div style={{ color: '#a5b4fc', fontSize: '0.65rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Enterprise Knowledge & Action Platform
            </div>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              background: '#22c55e',
              width: 8,
              height: 8,
              borderRadius: '50%',
              boxShadow: '0 0 6px #22c55e',
            }}
          />
          <span style={{ color: '#d1d5db', fontSize: '0.78rem' }}>Module Federation · React MFE</span>
        </div>
      </header>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#fff' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 220,
            borderRight: '1px solid #e5e7eb',
            background: '#f9fafb',
            padding: '1.25rem 0.75rem',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
            Navigation
          </div>
          {[
            { icon: '💬', label: 'HR Assistant', active: true },
            { icon: '📋', label: 'Policies', active: false },
            { icon: '🏥', label: 'Benefits', active: false },
            { icon: '🌴', label: 'Time Off', active: false },
            { icon: '✏️', label: 'Name Change', active: false },
          ].map(item => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.55rem 0.75rem',
                borderRadius: 8,
                cursor: 'pointer',
                marginBottom: '0.2rem',
                background: item.active ? '#e0e7ff' : 'transparent',
                color: item.active ? '#4338ca' : '#374151',
                fontWeight: item.active ? 600 : 400,
                fontSize: '0.85rem',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '1.5rem', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
              Architecture
            </div>
            <div style={{ padding: '0 0.5rem', fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.6 }}>
              <div style={{ marginBottom: '0.4rem' }}>
                <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>HOST</span>
                {' '}Shell (port 3000)
              </div>
              <div>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>REMOTE</span>
                {' '}hr-namechange (port 3001)
              </div>
            </div>
          </div>
        </aside>

        {/* Chat area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <ChatPanel />
        </main>
      </div>
    </div>
  );
};

export default App;
