import { useState, useEffect, useCallback } from 'react';

export type OAuthStatus = 'connected' | 'missing' | 'expired' | 'loading';

export function useOAuthMailbox(supplierId: string) {
  const [status, setStatus] = useState<OAuthStatus>('loading');
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!supplierId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/oauth/status?supplierId=${supplierId}`);
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
      } else {
        setStatus('missing');
      }
    } catch (err) {
      console.error('Failed to fetch OAuth status', err);
      setStatus('missing');
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    checkStatus();

    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'oauth-connected') {
        checkStatus();
      }
    };
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [checkStatus]);

  const connectMailbox = () => {
    if (!supplierId) return;
    const popup = window.open(
      `/api/oauth/start?supplierId=${supplierId}`,
      'OAuthConnect',
      'width=600,height=700,left=200,top=100'
    );

    if (popup) {
      const timer = setInterval(() => {
        checkStatus();
        if (popup.closed) {
          clearInterval(timer);
        }
      }, 1000);
    }
  };

  return {
    status,
    loading,
    connectMailbox,
    refreshStatus: checkStatus
  };
}
