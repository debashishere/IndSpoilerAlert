import React, { useState, useEffect } from 'react';
import { Send, AlertTriangle, CheckCircle2, RefreshCw, Mail, Users, Box, Eye, Sparkles } from 'lucide-react';
import { useOAuthMailbox } from '../hooks/useOAuthMailbox';

interface SendBroadcastViewProps {
  supplierId: string;
  apiBaseUrl?: string;
  inventoryLots?: any[];
  buyers?: any[];
}

export const SendBroadcastView: React.FC<SendBroadcastViewProps> = ({
  supplierId,
  apiBaseUrl = '/api',
  inventoryLots = [],
  buyers = []
}) => {
  const oauth = useOAuthMailbox(supplierId);
  const [buyerSegment, setBuyerSegment] = useState<string>('all_buyers');
  const [selectedBuyerIds, setSelectedBuyerIds] = useState<string[]>([]);
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
  const [subject, setSubject] = useState<string>('Distressed Stock Clearance Offer for {{buyer_name}}');
  const [bodyHtml, setBodyHtml] = useState<string>(
    '<div style="font-family: sans-serif; padding: 20px;">' +
    '<h2>Clearance Opportunity</h2>' +
    '<p>Hello <strong>{{buyer_name}}</strong>,</p>' +
    '<p>We have immediate surplus inventory available for liquidation. Please review item details below:</p>' +
    '{{inventory_table}}<br/>' +
    '<p><a href="{{quick_bid_link}}" style="background-color: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Place 1-Click Quick Bid</a></p>' +
    '</div>'
  );
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [dispatchStatus, setDispatchStatus] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [previewing, setPreviewing] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  const isConnected = oauth.status === 'connected';

  const handleFetchPreview = async () => {
    setPreviewing(true);
    try {
      const res = await fetch(`${apiBaseUrl}/emails/broadcast-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          buyerSegment,
          explicitBuyerIds: selectedBuyerIds,
          lotIds: selectedLotIds,
          emailSubject: subject,
          emailBodyHtml: bodyHtml
        })
      });
      const data = await res.json();
      if (data.success) {
        setPreviewData(data);
      }
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setPreviewing(false);
    }
  };

  useEffect(() => {
    handleFetchPreview();
  }, [buyerSegment, selectedBuyerIds, selectedLotIds]);

  const handleDispatchBroadcast = async () => {
    if (!isConnected) {
      setDispatchStatus({
        success: false,
        message: 'OAuth Mailbox not connected. Please connect your email mailbox before dispatching.'
      });
      return;
    }

    setDispatching(true);
    setDispatchStatus(null);
    try {
      const res = await fetch(`${apiBaseUrl}/emails/dispatch-broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          buyerSegment,
          explicitBuyerIds: selectedBuyerIds,
          lotIds: selectedLotIds,
          emailSubject: subject,
          emailBodyHtml: bodyHtml
        })
      });

      const data = await res.json();
      if (data.success) {
        setDispatchStatus({
          success: true,
          message: `Broadcast successfully dispatched to ${data.dispatchedCount} buyers!`,
          count: data.dispatchedCount
        });
      } else {
        setDispatchStatus({
          success: false,
          message: data.message || 'Dispatch failed. Check mailbox connection.'
        });
      }
    } catch (err: any) {
      setDispatchStatus({
        success: false,
        message: err.message || 'Failed to dispatch email broadcast'
      });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Send size={18} color="hsl(var(--primary))" /> Send Broadcast Email
      </h3>
      {/* OAuth Mailbox Pre-Flight Status Banner */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          borderLeft: isConnected ? '4px solid hsl(var(--success))' : '4px solid hsl(var(--warning))',
          backgroundColor: isConnected ? 'hsl(var(--success) / 5%)' : 'hsl(var(--warning) / 5%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isConnected ? (
            <CheckCircle2 size={24} style={{ color: 'hsl(var(--success))' }} />
          ) : (
            <AlertTriangle size={24} style={{ color: 'hsl(var(--warning))' }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {isConnected ? 'OAuth Mailbox Authenticated & Connected' : 'OAuth Mailbox Unauthenticated'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
              {isConnected
                ? `Sending broadcasts via authenticated sender`
                : 'Broadcast dispatches require a connected Google OAuth2 / SendGrid mailbox for deliverability and compliance.'}
            </div>
          </div>
        </div>

        {!isConnected && (
          <button
            className="btn btn-secondary"
            onClick={oauth.connectMailbox}
            disabled={oauth.loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
          >
            <Mail size={16} />
            <span>Connect Mailbox</span>
          </button>
        )}
      </div>

      {/* Broadcast Delivery Status Alert Toast */}
      {dispatchStatus && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '8px',
            backgroundColor: dispatchStatus.success ? 'hsl(var(--success) / 10%)' : 'hsl(var(--destructive) / 10%)',
            border: `1px solid ${dispatchStatus.success ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}`,
            color: dispatchStatus.success ? 'hsl(var(--success))' : 'hsl(var(--destructive))',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {dispatchStatus.success ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            <span>{dispatchStatus.message}</span>
          </div>
          <button
            onClick={() => setDispatchStatus(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Campaign Composition Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column: Form & Targeting */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} />
            <span>Target Audience & Inventory</span>
          </h3>

          {/* Target Audience Segment */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Buyer Segment
            </label>
            <select
              value={buyerSegment}
              onChange={(e) => setBuyerSegment(e.target.value)}
              className="input"
              style={{ width: '100%' }}
            >
              <option value="all_buyers">All Retail Buyers ({buyers.length || '30+'})</option>
              <option value="short_dated_grocers">Short-Dated Grocers & Supermarkets</option>
              <option value="discount_retailers">Discount Liquidation Retailers</option>
              <option value="foodbank_donations">Foodbanks & Charitable Diversion</option>
            </select>
          </div>

          {/* Email Subject Line with Token Chips */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Email Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input"
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {['{{buyer_name}}', '{{lot_title}}', '{{supplier_name}}'].map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => setSubject((prev) => `${prev} ${token}`)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid hsl(var(--border-color))',
                    backgroundColor: 'hsl(var(--bg-card-hover))',
                    cursor: 'pointer'
                  }}
                >
                  + {token}
                </button>
              ))}
            </div>
          </div>

          {/* Email Body Content */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Email HTML Body
            </label>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={8}
              className="input"
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {['{{buyer_name}}', '{{inventory_table}}', '{{quick_bid_link}}'].map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => setBodyHtml((prev) => `${prev}\n${token}`)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid hsl(var(--border-color))',
                    backgroundColor: 'hsl(var(--bg-card-hover))',
                    cursor: 'pointer'
                  }}
                >
                  + {token}
                </button>
              ))}
            </div>
          </div>

          {/* 1-Click Launch Dispatch Button */}
          <button
            className="btn btn-primary"
            onClick={handleDispatchBroadcast}
            disabled={dispatching || !isConnected}
            style={{
              padding: '12px 20px',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginTop: '12px'
            }}
          >
            {dispatching ? (
              <>
                <RefreshCw size={18} className="spin" />
                <span>Dispatching Campaign...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Dispatch Broadcast Email Now</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Pre-Flight Recipient & Live Render Preview */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} />
            <span>Pre-Flight Live Preview</span>
          </h3>

          {/* Metrics summary */}
          {previewData && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'hsl(var(--bg-card-hover) / 50%)',
                borderRadius: '8px',
                border: '1px solid hsl(var(--border-color))'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Matched Buyers</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{previewData.recipientCount || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Total Cases Attached</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{previewData.totalCases || 0}</div>
              </div>
            </div>
          )}

          {/* Rendered Subject */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>Subject:</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>
              {previewData?.previewSubject || subject}
            </div>
          </div>

          {/* Live Compiled Preview Frame */}
          <div
            style={{
              flex: 1,
              minHeight: '300px',
              border: '1px solid hsl(var(--border-color))',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#000000',
              padding: '16px',
              overflowY: 'auto'
            }}
            dangerouslySetInnerHTML={{ __html: previewData?.previewBodyHtml || bodyHtml }}
          />
        </div>
      </div>
    </div>
  );
};
