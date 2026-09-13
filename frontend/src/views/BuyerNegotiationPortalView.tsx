import React, { useState, useEffect } from 'react';
import { 
  Package, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Send, 
  X, 
  ShieldCheck, 
  Tag,
  Clock,
  MessageSquare
} from 'lucide-react';
import { API_BASE_URL } from '../services/networkService';

export interface BuyerNegotiationPortalViewProps {
  offerId: string;
  token?: string | null;
}

export const BuyerNegotiationPortalView: React.FC<BuyerNegotiationPortalViewProps> = ({ offerId, token }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form state for revised offer
  const [showRebidModal, setShowRebidModal] = useState<boolean>(false);
  const [proposedPrice, setProposedPrice] = useState<string>('');
  const [proposedQuantity, setProposedQuantity] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submittingRebid, setSubmittingRebid] = useState<boolean>(false);
  const [rebidError, setRebidError] = useState<string | null>(null);
  const [rebidSuccess, setRebidSuccess] = useState<boolean>(false);

  // Accept counter state (Slice 4 ready)
  const [acceptingCounter, setAcceptingCounter] = useState<boolean>(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const fetchNegotiationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `${API_BASE_URL}/portal/negotiation/${offerId}?token=${encodeURIComponent(token || '')}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to load negotiation session (${res.status}).`);
      }
      const json = await res.json();
      setData(json);

      // Pre-fill revised offer fields with either supplier counter or previous proposal
      const fallbackPrice = json.latestSupplierProposal?.proposedPrice ?? json.offer?.price ?? '';
      const fallbackQty = json.latestSupplierProposal?.proposedQuantity ?? json.offer?.quantity ?? '';
      setProposedPrice(fallbackPrice.toString());
      setProposedQuantity(fallbackQty.toString());
    } catch (err: any) {
      setError(err.message || 'An error occurred loading the negotiation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (offerId) {
      fetchNegotiationData();
    }
  }, [offerId, token]);

  const handleSubmitRebid = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(proposedPrice);
    const qtyNum = parseInt(proposedQuantity, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      setRebidError('Please enter a valid price per case.');
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setRebidError('Please enter a valid quantity of cases.');
      return;
    }

    setSubmittingRebid(true);
    setRebidError(null);

    try {
      const url = `${API_BASE_URL}/portal/negotiation/${offerId}/re-bid?token=${encodeURIComponent(token || '')}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposedPrice: priceNum,
          proposedQuantity: qtyNum,
          message: message.trim() || undefined
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to submit counter-bid.');
      }

      setRebidSuccess(true);
      setShowRebidModal(false);
      setMessage('');
      await fetchNegotiationData();
    } catch (err: any) {
      setRebidError(err.message || 'Failed to submit counter-bid.');
    } finally {
      setSubmittingRebid(false);
    }
  };

  const handleAcceptCounter = async () => {
    setAcceptingCounter(true);
    setAcceptError(null);
    try {
      const url = `${API_BASE_URL}/portal/negotiation/${offerId}/accept?token=${encodeURIComponent(token || '')}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to accept counter-offer.');
      }
      const json = await res.json();
      if (json.dealId) {
        window.location.href = `/deal/${json.dealId}?dealToken=${encodeURIComponent(json.dealToken || '')}`;
      } else {
        await fetchNegotiationData();
      }
    } catch (err: any) {
      setAcceptError(err.message || 'Could not accept counter-offer.');
    } finally {
      setAcceptingCounter(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--bg-main))' }}>
        <div style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto', width: '32px', height: '32px', border: '3px solid hsl(var(--border-color))', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ fontWeight: 500 }}>Loading negotiation context...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--bg-main))', padding: '24px' }}>
        <div style={{ maxWidth: '480px', width: '100%', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '12px', padding: '32px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <AlertCircle size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'hsl(var(--text-primary))' }}>Access Denied</h2>
          <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.5, marginBottom: '24px' }}>
            {error || 'Unable to verify your negotiation token. The token may be invalid, expired, or corrupted.'}
          </p>
        </div>
      </div>
    );
  }

  const { offer, lot, product, distributionCenter, latestSupplierProposal, messages } = data;
  const supplierPrice = latestSupplierProposal?.proposedPrice ?? offer?.price ?? 0;
  const supplierQty = latestSupplierProposal?.proposedQuantity ?? offer?.quantity ?? 0;
  const supplierTotal = supplierPrice * supplierQty;

  const revisedPriceNum = parseFloat(proposedPrice) || 0;
  const revisedQtyNum = parseInt(proposedQuantity, 10) || 0;
  const revisedTotal = revisedPriceNum * revisedQtyNum;

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--bg-main))', color: 'hsl(var(--text-primary))', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header style={{ borderBottom: '1px solid hsl(var(--border-color))', background: 'hsl(var(--bg-card))', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1rem' }}>
              SA
            </div>
            <div>
              <h1 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>SpoilerAlert Guest Portal</h1>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', margin: 0 }}>Direct Counter-Offer Negotiation</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', fontWeight: 600 }}>
              {offer.status === 'countered' ? 'Supplier Countered' : (offer.status === 'pending' ? 'Offer Under Review' : offer.status)}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>
              Ref: {offer._id.slice(-6).toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '24px 20px 60px 20px', flex: 1 }}>
        {rebidSuccess && (
          <div style={{ marginBottom: '20px', padding: '14px 18px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              Your counter-offer has been sent to the supplier! You will receive email notifications as soon as they respond.
            </span>
          </div>
        )}

        {acceptError && (
          <div style={{ marginBottom: '20px', padding: '14px 18px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{acceptError}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          
          {/* Left Column: Product & Terms Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Product & Lot Details */}
            <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {product?.brand || 'Offered Inventory'}
                  </span>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '4px 0 0 0', color: 'hsl(var(--text-primary))' }}>
                    {product?.description || lot?.lotNumber || 'Product Lot'}
                  </h2>
                </div>
                <div style={{ background: 'hsl(var(--bg-main))', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid hsl(var(--border-color))' }}>
                  Lot #{lot?.lotNumber || 'N/A'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid hsl(var(--border-color))' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Distribution Center</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} style={{ color: 'hsl(var(--text-secondary))' }} />
                    {distributionCenter ? `${distributionCenter.name || ''} (${distributionCenter.city}, ${distributionCenter.state})` : 'DC On File'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Lot Size</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Package size={14} style={{ color: 'hsl(var(--text-secondary))' }} />
                    {lot?.quantityCases ? `${lot.quantityCases.toLocaleString()} cases total` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Latest Supplier Counter-Proposal Card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Clock size={16} style={{ color: '#3b82f6' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Latest Supplier Counter Proposal
                </span>
              </div>

              {latestSupplierProposal?.content && (
                <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))', marginBottom: '16px', fontStyle: 'italic' }}>
                  "{latestSupplierProposal.content}"
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: 'hsl(var(--bg-card))', padding: '14px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Counter Unit Price</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'hsl(var(--success))', marginTop: '2px' }}>
                    ${supplierPrice.toFixed(2)}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(var(--text-muted))' }}>/cs</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Proposed Quantity</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px' }}>
                    {supplierQty.toLocaleString()}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(var(--text-muted))' }}> cs</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Total Settlement</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'hsl(var(--text-primary))', marginTop: '2px' }}>
                    ${supplierTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={handleAcceptCounter}
                  disabled={acceptingCounter || offer.status === 'fully_accepted'}
                  className="btn btn-primary"
                  style={{ 
                    padding: '12px 20px', 
                    fontSize: '0.95rem', 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    borderRadius: '8px',
                    background: '#10b981',
                    borderColor: '#10b981',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle2 size={18} />
                  {acceptingCounter ? 'Accepting Counter...' : `Accept Counter-Offer ($${supplierPrice.toFixed(2)}/cs • ${supplierQty} cases)`}
                </button>

                <button
                  type="button"
                  onClick={() => { setShowRebidModal(true); setRebidError(null); }}
                  className="btn btn-outline"
                  style={{ 
                    padding: '10px 16px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border-color))',
                    background: 'hsl(var(--bg-card))',
                    color: 'hsl(var(--text-primary))',
                    cursor: 'pointer'
                  }}
                >
                  <MessageSquare size={16} />
                  Propose Revised Offer
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Negotiation Thread & Transcript */}
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} style={{ color: 'hsl(var(--primary))' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Negotiation History</h3>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                {messages?.length || 0} messages
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto', maxHeight: '500px', paddingRight: '4px' }}>
              {(messages || []).map((msg: any, idx: number) => {
                const isBuyer = msg.sender === 'buyer';
                const hasTerms = msg.proposedPrice !== undefined && msg.proposedQuantity !== undefined;
                return (
                  <div
                    key={idx}
                    style={{
                      alignSelf: isBuyer ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      background: isBuyer ? 'rgba(59, 130, 246, 0.08)' : 'hsl(var(--bg-main))',
                      border: `1px solid ${isBuyer ? 'rgba(59, 130, 246, 0.25)' : 'hsl(var(--border-color))'}`,
                      borderRadius: isBuyer ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      padding: '12px 16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isBuyer ? '#2563eb' : 'hsl(var(--text-secondary))' }}>
                        {isBuyer ? 'You (Buyer)' : 'Supplier'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>

                    {hasTerms && (
                      <div style={{ display: 'inline-block', marginBottom: '8px', background: isBuyer ? '#2563eb' : '#374151', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
                        Proposed: ${msg.proposedPrice.toFixed(2)}/cs • {msg.proposedQuantity} cs
                      </div>
                    )}

                    <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-primary))', lineHeight: 1.4 }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Revised Offer Modal */}
      {showRebidModal && (
        <div 
          role="dialog" 
          aria-modal="true"
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0, 0, 0, 0.6)', 
            backdropFilter: 'blur(2px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000, 
            padding: '20px' 
          }}
        >
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Propose Revised Offer</h3>
              <button 
                type="button" 
                onClick={() => setShowRebidModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}
              >
                <X size={20} />
              </button>
            </div>

            {rebidError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px' }}>
                {rebidError}
              </div>
            )}

            <form onSubmit={handleSubmitRebid}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label htmlFor="rebid-price" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Proposed Price ($/cs)
                  </label>
                  <input
                    id="rebid-price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid hsl(var(--border-color))', background: 'hsl(var(--bg-main))', color: 'hsl(var(--text-primary))', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label htmlFor="rebid-qty" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Proposed Quantity (cs)
                  </label>
                  <input
                    id="rebid-qty"
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={proposedQuantity}
                    onChange={(e) => setProposedQuantity(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid hsl(var(--border-color))', background: 'hsl(var(--bg-main))', color: 'hsl(var(--text-primary))', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div style={{ background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>Total Proposed Recovery:</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                  ${revisedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="rebid-message" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Note or Message (Optional)
                </label>
                <textarea
                  id="rebid-message"
                  rows={3}
                  placeholder="Explain terms, pickup availability, or reasons for revision..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid hsl(var(--border-color))', background: 'hsl(var(--bg-main))', color: 'hsl(var(--text-primary))', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowRebidModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid hsl(var(--border-color))', background: 'transparent', color: 'hsl(var(--text-secondary))', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRebid}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', borderRadius: '6px', background: 'hsl(var(--primary))', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  {submittingRebid ? 'Submitting...' : 'Submit Revised Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerNegotiationPortalView;
