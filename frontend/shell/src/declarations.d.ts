declare module 'hrNamechange/NameChangeApp' {
  import React from 'react';
  const NameChangeApp: React.FC<{ onComplete: (requestId: string) => void }>;
  export default NameChangeApp;
}
