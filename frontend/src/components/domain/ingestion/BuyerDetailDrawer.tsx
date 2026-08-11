import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  ShieldAlert, 
  Lock, 
  Check, 
  Power, 
  RotateCcw, 
  ExternalLink,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { type Buyer, selectBuyerLists, setBuyers, setBuyerLists } from '../../../store/slices/coreSlice';
import networkService, { type EmailThread } from '../../../services/networkService';

export interface BuyerDetailDrawerProps {
  buyer: Buyer | null;
  isOpen: boolean;
  onClose: () => void;
  onBuyerUpdated?: (updatedBuyer: Buyer) => void;
}

export const BuyerDetailDrawer: React.FC<BuyerDetailDrawerProps> = ({
  buyer,
  isOpen,
  onClose,
  onBuyerUpdated,
}) => {
  const dispatch = useAppDispatch();
  const allBuyers = useAppSelector((state) => state.core.buyers);
  const buyerLists = useAppSelector(selectBuyerLists);

  const [activeTab, setActiveTab] = useState<'profile' | 'communications'>('profile');

  // Form State
  const [formData, setFormData] = useState<Partial<Buyer>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Opt-in Toggles
  const [optInBidding, setOptInBidding] = useState<boolean>(true);
  const [optInSales, setOptInSales] = useState<boolean>(true);

  // Deactivate Flow
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Communications Tab
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [threadsError, setThreadsError] = useState<string | null>(null);

  // Sync state on drawer open or buyer change
  useEffect(() => {
    if (buyer) {
      setFormData({
        companyName: buyer.companyName || buyer.name || '',
        email: buyer.email || '',
        tier: buyer.tier || 'tier1',
        phone: buyer.phone || '',
        address: buyer.address || '',
        notes: buyer.notes || '',
        acceptsShortDated: buyer.acceptsShortDated ?? true,
        minShelfLife: buyer.minShelfLife ?? 7,
        transportRadius: buyer.transportRadius ?? 50,
      });
      setOptInBidding(buyer.optInBidding ?? true);
      setOptInSales(buyer.optInSales ?? true);
      setShowDeactivateConfirm(false);
      setDeactivateReason('');
      setSaveSuccessMsg(null);
      setSaveErrorMsg(null);
    }
  }, [buyer]);

  // Fetch email threads when switching to communications tab
  useEffect(() => {
    if (isOpen && activeTab === 'communications' && buyer?.email) {
      setLoadingThreads(true);
      setThreadsError(null);
      networkService
        .getEmailThreadsByBuyerEmail(buyer.email)
        .then((data) => {
          setThreads(data || []);
        })
        .catch((err) => {
          console.error('Failed to load buyer email threads:', err);
          setThreadsError('Failed to load email history for this buyer.');
        })
        .finally(() => {
          setLoadingThreads(false);
        });
    }
  }, [isOpen, activeTab, buyer?.email]);

  if (!isOpen || !buyer) return null;

  const isActive = buyer.isActive !== false;

  const handleInputChange = (field: keyof Buyer, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!buyer._id && !buyer.id) return;
    const targetId = (buyer._id || buyer.id) as string;

    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    const payload = {
      ...formData,
      optInBidding,
      optInSales,
    };

    try {
      const updated = await networkService.updateBuyer(targetId, payload);
      const mergedBuyer: Buyer = { ...buyer, ...updated, ...payload };

      // Update core slice state
      const updatedBuyers = allBuyers.map((b) => ((b._id || b.id) === targetId ? mergedBuyer : b));
      dispatch(setBuyers(updatedBuyers));

      if (onBuyerUpdated) {
        onBuyerUpdated(mergedBuyer);
      }

      setSaveSuccessMsg('Buyer profile updated successfully');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Failed to update buyer profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleOptIn = async (type: 'bidding' | 'sales', currentVal: boolean) => {
    if (!buyer._id && !buyer.id) return;
    const targetId = (buyer._id || buyer.id) as string;
    const newVal = !currentVal;

    if (type === 'bidding') setOptInBidding(newVal);
    if (type === 'sales') setOptInSales(newVal);

    try {
      const payload = {
        [type === 'bidding' ? 'optInBidding' : 'optInSales']: newVal,
      };
      const updated = await networkService.updateBuyer(targetId, payload);
      const mergedBuyer: Buyer = { ...buyer, ...updated };
      const updatedBuyers = allBuyers.map((b) => ((b._id || b.id) === targetId ? mergedBuyer : b));
      dispatch(setBuyers(updatedBuyers));
      if (onBuyerUpdated) onBuyerUpdated(mergedBuyer);
    } catch (err) {
      console.error('Failed to update opt-in state:', err);
      // Rollback
      if (type === 'bidding') setOptInBidding(currentVal);
      if (type === 'sales') setOptInSales(currentVal);
    }
  };

  const handleToggleListMember = async (listId: string, currentMember: boolean) => {
    if (!buyer._id && !buyer.id) return;
    const targetBuyerId = (buyer._id || buyer.id) as string;

    const list = buyerLists.find((l) => l._id === listId);
    if (!list) return;

    let updatedBuyerIds: string[] = (list.buyerIds || []).map((b: any) =>
      typeof b === 'object' ? b._id || b.id : b
    );

    if (currentMember) {
      updatedBuyerIds = updatedBuyerIds.filter((id) => id !== targetBuyerId);
    } else {
      if (!updatedBuyerIds.includes(targetBuyerId)) {
        updatedBuyerIds.push(targetBuyerId);
      }
    }

    try {
      const updatedList = await networkService.updateBuyerListMembers(listId, updatedBuyerIds);
      const updatedLists = buyerLists.map((l) => (l._id === listId ? updatedList : l));
      dispatch(setBuyerLists(updatedLists));
    } catch (err) {
      console.error('Failed to update list membership:', err);
    }
  };

  const handleDeactivateBuyer = async () => {
    if (!buyer._id && !buyer.id) return;
    const targetId = (buyer._id || buyer.id) as string;

    setIsDeactivating(true);
    try {
      const updated = await networkService.deactivateBuyer(targetId, deactivateReason || 'Deactivated by supplier');
      const mergedBuyer: Buyer = { 
        ...buyer, 
        ...updated, 
        isActive: false, 
        deactivatedReason: deactivateReason || 'Deactivated by supplier',
        deactivatedAt: new Date().toISOString()
      };

      const updatedBuyers = allBuyers.map((b) => ((b._id || b.id) === targetId ? mergedBuyer : b));
      dispatch(setBuyers(updatedBuyers));
      if (onBuyerUpdated) onBuyerUpdated(mergedBuyer);
      setShowDeactivateConfirm(false);
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Failed to deactivate buyer');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleReactivateBuyer = async () => {
    if (!buyer._id && !buyer.id) return;
    const targetId = (buyer._id || buyer.id) as string;

    setIsDeactivating(true);
    try {
      const updated = await networkService.reactivateBuyer(targetId);
      const mergedBuyer: Buyer = { 
        ...buyer, 
        ...updated, 
        isActive: true, 
        deactivatedReason: undefined,
        deactivatedAt: undefined 
      };

      const updatedBuyers = allBuyers.map((b) => ((b._id || b.id) === targetId ? mergedBuyer : b));
      dispatch(setBuyers(updatedBuyers));
      if (onBuyerUpdated) onBuyerUpdated(mergedBuyer);
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Failed to reactivate buyer');
    } finally {
      setIsDeactivating(false);
    }
  };

  const truncateSnippet = (text: string | undefined, maxLen = 120): string => {
    if (!text) return 'No content snippet available.';
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen) + '...';
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Overlay Backdrop */}
      <div
        data-testid="buyer-drawer-backdrop"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'hsl(var(--bg-card) / 0.75)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.2s ease-in-out',
        }}
      />

      {/* Slide-Over Drawer Container */}
      <div
        data-testid="buyer-detail-drawer"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '680px',
          height: '100%',
          background: 'hsl(var(--bg-card))',
          borderLeft: '1px solid hsl(var(--primary) / 0.3)',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'hsl(var(--bg-card))',
            borderBottom: '1px solid hsl(var(--border-color))',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: isActive ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--error) / 0.15)',
                  border: `1px solid ${isActive ? 'hsl(var(--primary) / 0.35)' : 'hsl(var(--error) / 0.35)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '18px',
                  color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--error))',
                }}
              >
                {(buyer.companyName || buyer.name || 'B').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
                    {buyer.companyName || buyer.name}
                  </h2>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: isActive ? 'hsl(var(--success) / 0.15)' : 'hsl(var(--error) / 0.15)',
                      color: isActive ? 'hsl(var(--success))' : 'hsl(var(--error))',
                      border: `1px solid ${isActive ? 'hsl(var(--success) / 0.3)' : 'hsl(var(--error) / 0.3)'}`,
                    }}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                  {buyer.email}
                </div>
              </div>
            </div>

            <button
              type="button"
              data-testid="buyer-drawer-close-btn"
              onClick={onClose}
              style={{
                background: 'hsl(var(--bg-card))',
                border: '1px solid hsl(var(--border-color))',
                borderRadius: '8px',
                color: 'hsl(var(--text-muted))',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: activeTab === 'profile' ? 'hsl(var(--primary) / 0.2)' : 'transparent',
                color: activeTab === 'profile' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <User size={15} /> Profile & Settings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('communications')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: activeTab === 'communications' ? 'hsl(var(--primary) / 0.2)' : 'transparent',
                color: activeTab === 'communications' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <MessageSquare size={15} /> Communications
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {saveSuccessMsg && (
            <div
              style={{
                background: 'hsl(var(--success) / 0.1)',
                border: '1px solid hsl(var(--success) / 0.3)',
                color: 'hsl(var(--success))',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Check size={16} /> {saveSuccessMsg}
            </div>
          )}

          {saveErrorMsg && (
            <div
              style={{
                background: 'hsl(var(--error) / 0.1)',
                border: '1px solid hsl(var(--error) / 0.3)',
                color: 'hsl(var(--error))',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} /> {saveErrorMsg}
            </div>
          )}

          {/* TAB 1: Profile & Settings */}
          {activeTab === 'profile' && (
            <div data-testid="buyer-drawer-tab-profile" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Profile Details & Inline Edit Form */}
              <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'white' }}>
                  Profile Information
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '4px' }}>
                      Company Name
                    </label>
                    <input
                      type="text"
                      data-testid="input-companyName"
                      value={formData.companyName || ''}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'hsl(var(--bg-card))',
                        border: '1px solid hsl(var(--border-color))',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '4px' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      data-testid="input-email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'hsl(var(--bg-card))',
                        border: '1px solid hsl(var(--border-color))',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '4px' }}>
                      Buyer Tier
                    </label>
                    <select
                      data-testid="select-tier"
                      value={formData.tier || 'tier1'}
                      onChange={(e) => handleInputChange('tier', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'hsl(var(--bg-card))',
                        border: '1px solid hsl(var(--border-color))',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="tier1">Tier 1 Retailer</option>
                      <option value="tier2">Tier 2 Regional</option>
                      <option value="liquidator">Liquidator</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '4px' }}>
                      Phone
                    </label>
                    <input
                      type="text"
                      data-testid="input-phone"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="e.g. 555-0199"
                      style={{
                        width: '100%',
                        background: 'hsl(var(--bg-card))',
                        border: '1px solid hsl(var(--border-color))',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '4px' }}>
                    Address
                  </label>
                  <input
                    type="text"
                    data-testid="input-address"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="e.g. 100 Main Street, Suite 400"
                    style={{
                      width: '100%',
                      background: 'hsl(var(--bg-card))',
                      border: '1px solid hsl(var(--border-color))',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: 'white',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '4px' }}>
                      Accepts Short-Dated
                    </label>
                    <select
                      data-testid="select-acceptsShortDated"
                      value={formData.acceptsShortDated ? 'true' : 'false'}
                      onChange={(e) => handleInputChange('acceptsShortDated', e.target.value === 'true')}
                      style={{
                        width: '100%',
                        background: 'hsl(var(--bg-card))',
                        border: '1px solid hsl(var(--border-color))',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '13px',
                      }}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '4px' }}>
                      Min Shelf Life (Days)
                    </label>
                    <input
                      type="number"
                      data-testid="input-minShelfLife"
                      value={formData.minShelfLife ?? 7}
                      onChange={(e) => handleInputChange('minShelfLife', parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        background: 'hsl(var(--bg-card))',
                        border: '1px solid hsl(var(--border-color))',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '4px' }}>
                      Transport Radius (mi)
                    </label>
                    <input
                      type="number"
                      data-testid="input-transportRadius"
                      value={formData.transportRadius ?? 50}
                      onChange={(e) => handleInputChange('transportRadius', parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        background: 'hsl(var(--bg-card))',
                        border: '1px solid hsl(var(--border-color))',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginBottom: '4px' }}>
                    Internal Notes
                  </label>
                  <textarea
                    rows={2}
                    data-testid="input-notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Buyer preferences, negotiation terms, key contacts..."
                    style={{
                      width: '100%',
                      background: 'hsl(var(--bg-card))',
                      border: '1px solid hsl(var(--border-color))',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: 'white',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        companyName: buyer.companyName || buyer.name || '',
                        email: buyer.email || '',
                        tier: buyer.tier || 'tier1',
                        phone: buyer.phone || '',
                        address: buyer.address || '',
                        notes: buyer.notes || '',
                        acceptsShortDated: buyer.acceptsShortDated ?? true,
                        minShelfLife: buyer.minShelfLife ?? 7,
                        transportRadius: buyer.transportRadius ?? 50,
                      });
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border-color))',
                      background: 'hsl(var(--bg-card))',
                      color: 'hsl(var(--text-muted))',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    data-testid="save-profile-btn"
                    disabled={isSaving}
                    onClick={handleSaveProfile}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)))',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {isSaving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </div>

              {/* Opt-Out Controls */}
              <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'white' }}>
                    Opt-Out Controls
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                    Independent session activity preferences for workflow automated targeting.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Bidding Sessions Pill Toggle */}
                  <div
                    style={{
                      background: 'hsl(var(--bg-card))',
                      border: '1px solid hsl(var(--border-color))',
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                        Bidding Sessions
                      </span>
                      <button
                        type="button"
                        data-testid="toggle-opt-in-bidding"
                        onClick={() => handleToggleOptIn('bidding', optInBidding)}
                        style={{
                          width: '44px',
                          height: '24px',
                          borderRadius: '12px',
                          background: optInBidding ? 'hsl(var(--success))' : 'hsl(var(--border-color))',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s',
                          padding: '2px',
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'white',
                            transform: optInBidding ? 'translateX(20px)' : 'translateX(0)',
                            transition: 'transform 0.2s',
                          }}
                        />
                      </button>
                    </div>

                    {!optInBidding && (
                      <div
                        data-testid="badge-skipped-bidding"
                        title="Excluded from automated bidding workflows"
                        style={{
                          background: 'hsl(var(--warning) / 0.15)',
                          color: 'hsl(var(--warning))',
                          border: '1px solid hsl(var(--warning) / 0.3)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <ShieldAlert size={13} /> Currently skipped
                      </div>
                    )}
                  </div>

                  {/* Sales Sessions Pill Toggle */}
                  <div
                    style={{
                      background: 'hsl(var(--bg-card))',
                      border: '1px solid hsl(var(--border-color))',
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                        Sales Sessions
                      </span>
                      <button
                        type="button"
                        data-testid="toggle-opt-in-sales"
                        onClick={() => handleToggleOptIn('sales', optInSales)}
                        style={{
                          width: '44px',
                          height: '24px',
                          borderRadius: '12px',
                          background: optInSales ? 'hsl(var(--success))' : 'hsl(var(--border-color))',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s',
                          padding: '2px',
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'white',
                            transform: optInSales ? 'translateX(20px)' : 'translateX(0)',
                            transition: 'transform 0.2s',
                          }}
                        />
                      </button>
                    </div>

                    {!optInSales && (
                      <div
                        data-testid="badge-skipped-sales"
                        title="Excluded from automated sales workflows"
                        style={{
                          background: 'hsl(var(--warning) / 0.15)',
                          color: 'hsl(var(--warning))',
                          border: '1px solid hsl(var(--warning) / 0.3)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <ShieldAlert size={13} /> Currently skipped
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* List Memberships */}
              <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'white' }}>
                    Buyer List Memberships
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                    Manage which buyer lists this contact belongs to.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {buyerLists.map((list) => {
                    const targetBuyerId = buyer._id || buyer.id;
                    const isMember = (list.buyerIds || []).some((b: any) =>
                      typeof b === 'object' ? (b._id || b.id) === targetBuyerId : b === targetBuyerId
                    );
                    const isSystemList = list.type === 'primary' || list.type === 'secondary';

                    return (
                      <div
                        key={list._id}
                        style={{
                          background: 'hsl(var(--bg-card))',
                          border: '1px solid hsl(var(--border-color))',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            data-testid={`checkbox-list-${list._id}`}
                            checked={isMember}
                            onChange={() => handleToggleListMember(list._id, isMember)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>
                            {list.name}
                          </span>
                        </div>

                        {isSystemList && (
                          <span
                            title="System list — name locked"
                            style={{ display: 'flex', alignItems: 'center', color: 'hsl(var(--text-muted))' }}
                          >
                            <Lock size={13} data-testid={`lock-icon-${list._id}`} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deactivation Zone */}
              <div
                style={{
                  background: isActive ? 'hsl(var(--error) / 0.05)' : 'hsl(var(--warning) / 0.08)',
                  border: `1px solid ${isActive ? 'hsl(var(--error) / 0.3)' : 'hsl(var(--warning) / 0.3)'}`,
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: isActive ? 'hsl(var(--error))' : 'hsl(var(--warning))' }}>
                    {isActive ? 'Danger Zone — Deactivation' : 'Buyer Status — Inactive'}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                    {isActive
                      ? 'Deactivating a buyer will exclude them from all automated broadcast flows and active bids.'
                      : `Deactivated on ${buyer.deactivatedAt ? new Date(buyer.deactivatedAt).toLocaleDateString() : 'N/A'}: ${buyer.deactivatedReason || 'No reason specified'}`}
                  </p>
                </div>

                {isActive ? (
                  showDeactivateConfirm ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input
                        type="text"
                        data-testid="input-deactivate-reason"
                        placeholder="Reason for deactivation..."
                        value={deactivateReason}
                        onChange={(e) => setDeactivateReason(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'hsl(var(--bg-card))',
                          border: '1px solid hsl(var(--error) / 0.5)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: 'white',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          data-testid="confirm-deactivate-btn"
                          disabled={isDeactivating}
                          onClick={handleDeactivateBuyer}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'hsl(var(--error))',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {isDeactivating ? 'Deactivating...' : 'Confirm Deactivate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeactivateConfirm(false)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: '1px solid hsl(var(--border-color))',
                            background: 'hsl(var(--bg-card))',
                            color: 'hsl(var(--text-muted))',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      data-testid="deactivate-buyer-btn"
                      onClick={() => setShowDeactivateConfirm(true)}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--error) / 0.5)',
                        background: 'hsl(var(--error) / 0.15)',
                        color: 'hsl(var(--error))',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Power size={14} /> Deactivate Buyer
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    data-testid="reactivate-buyer-btn"
                    disabled={isDeactivating}
                    onClick={handleReactivateBuyer}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'hsl(var(--success))',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <RotateCcw size={14} /> {isDeactivating ? 'Reactivating...' : 'Reactivate Buyer'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Communications */}
          {activeTab === 'communications' && (
            <div data-testid="buyer-drawer-tab-communications" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'white' }}>
                    Email Communication History
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                    Scoped threads for {buyer.email}
                  </p>
                </div>
              </div>

              {loadingThreads ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                  <div className="loader" style={{ margin: '0 auto 12px' }} />
                  Fetching email threads...
                </div>
              ) : threadsError ? (
                <div style={{ color: 'hsl(var(--error))', fontSize: '13px', padding: '16px' }}>
                  {threadsError}
                </div>
              ) : threads.length === 0 ? (
                <div
                  data-testid="comms-empty-state"
                  style={{
                    padding: '36px',
                    textAlign: 'center',
                    background: 'hsl(var(--bg-card))',
                    borderRadius: '12px',
                    border: '1px dashed hsl(var(--border-color))',
                    color: 'hsl(var(--text-muted))',
                    fontSize: '13px',
                  }}
                >
                  <MessageSquare size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No communication history found for this buyer.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {threads.map((thread) => (
                    <div
                      key={thread._id}
                      data-testid={`email-thread-${thread._id}`}
                      style={{
                        background: 'hsl(var(--bg-card))',
                        border: '1px solid hsl(var(--border-color))',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {thread.unread && (
                            <span
                              data-testid="unread-indicator"
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: 'hsl(var(--primary))',
                              }}
                            />
                          )}
                          <span style={{ fontWeight: 700, fontSize: '13px', color: 'white' }}>
                            {thread.subject}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                          {thread.updatedAt ? new Date(thread.updatedAt).toLocaleDateString() : ''}
                        </span>
                      </div>

                      <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>
                        {truncateSnippet(thread.lastMessageSnippet || thread.snippet || thread.body, 120)}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <a
                          href={`#inbox?threadId=${thread._id}`}
                          data-testid={`open-in-hub-${thread._id}`}
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'hsl(var(--primary))',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          Open in Hub <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
