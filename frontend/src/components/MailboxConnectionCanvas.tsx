import React from 'react';
import { Mail } from 'lucide-react';

interface MailboxConnectionCanvasProps {
  onConnect: () => void;
  loading?: boolean;
}

export const MailboxConnectionCanvas: React.FC<MailboxConnectionCanvasProps> = ({ onConnect, loading }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px',
      backgroundColor: 'hsl(var(--bg-card))',
      borderRadius: '12px',
      border: '1px solid hsl(var(--border-color))',
      textAlign: 'center',
      marginTop: '24px'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: 'hsl(var(--primary) / 10%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px'
      }}>
        <Mail size={32} style={{ color: 'hsl(var(--primary))' }} />
      </div>
      
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
        Connect Your Mailbox to Build Campaigns
      </h2>
      
      <p style={{ color: 'hsl(var(--text-muted))', maxWidth: '400px', marginBottom: '32px', lineHeight: 1.5 }}>
        To ensure high deliverability and allow buyers to reply directly to you, 
        please connect your corporate email account via secure OAuth.
      </p>
      
      <button 
        className="btn btn-primary" 
        onClick={onConnect}
        disabled={loading}
        style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 600 }}
      >
        {loading ? 'Connecting...' : 'Connect Mailbox'}
      </button>
    </div>
  );
};
