import React, { Suspense, lazy } from 'react';

// Dynamic import triggers Module Federation to fetch the remote chunk at runtime
const NameChangeApp = lazy(() => import('hrNamechange/NameChangeApp'));

interface RemoteLoaderProps {
  onComplete: (requestId: string) => void;
}

export const FederatedNameChangeApp: React.FC<RemoteLoaderProps> = ({ onComplete }) => (
  <Suspense
    fallback={
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
        <div>Loading Name Change Form...</div>
      </div>
    }
  >
    <NameChangeApp onComplete={onComplete} />
  </Suspense>
);
