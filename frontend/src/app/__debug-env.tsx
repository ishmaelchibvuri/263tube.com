'use client';

/**
 * Debug Component to Check Environment Variables
 * Add this to your login page temporarily to verify env vars are loaded
 */

export function DebugEnvVars() {
  if (process.env.NODE_ENV === 'production') return null;

  const envVars = {
    USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID,
    USER_POOL_CLIENT_ID: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
    IDENTITY_POOL_ID: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID,
    AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
    API_URL: process.env.NEXT_PUBLIC_API_URL,
  };

  const allPresent = Object.values(envVars).every(val => val && val !== 'undefined');

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: allPresent ? '#10b981' : '#ef4444',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <strong>🔍 ENV DEBUG</strong>
      <div style={{ marginTop: '5px', fontSize: '11px' }}>
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} style={{ marginTop: '3px' }}>
            <strong>{key}:</strong>{' '}
            <span style={{
              color: value ? '#d1fae5' : '#fca5a5'
            }}>
              {value ? '✓ Loaded' : '✗ Missing'}
            </span>
          </div>
        ))}
      </div>
      {!allPresent && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '4px'
        }}>
          <strong>⚠️ Action Required:</strong>
          <br />
          Restart your dev server:
          <br />
          <code>npm run dev</code>
        </div>
      )}
    </div>
  );
}
