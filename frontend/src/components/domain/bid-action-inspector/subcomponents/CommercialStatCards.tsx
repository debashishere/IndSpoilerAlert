import React from 'react';
import { Building2, ShieldCheck, Mail, DollarSign, Package } from 'lucide-react';

export interface CommercialStatCardsProps {
  buyerCompany: string;
  buyerEmail: string;
  hasNegotiatedSettledPrice: boolean;
  finalPrice?: number;
  unitPrice: number;
  reserveFloorPrice: number;
  allocationPct: number;
  quantity: number;
  isFullClearing: boolean;
  totalRecovery: number;
  netClearingTotal: number;
}

export const CommercialStatCards: React.FC<CommercialStatCardsProps> = ({
  buyerCompany,
  buyerEmail,
  hasNegotiatedSettledPrice,
  finalPrice,
  unitPrice,
  reserveFloorPrice,
  allocationPct,
  quantity,
  isFullClearing,
  totalRecovery,
  netClearingTotal
}) => {
  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: 'hsl(var(--bg-main) / 50%)',
        borderBottom: '1px solid hsl(var(--border-color))',
        width: '100%'
      }}
    >
      <div
        data-testid="centralized-commercial-stat-cards"
        className="relative max-w-[1100px] mx-auto w-full"
        style={{
          padding: '16px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}
      >
        {/* Card 1: Buyer Organization */}
        <div
          data-testid="summary-buyer-org"
          style={{
            position: 'relative',
            padding: '12px 16px',
            backgroundColor: 'hsl(var(--bg-card))',
            borderRadius: '10px',
            border: '1px solid hsl(var(--border-color))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={14} /> Buyer Organization
              </span>
              <span
                data-testid="buyer-verified-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(16, 185, 129, 0.25)'
                }}
              >
                <ShieldCheck size={12} /> Verified
              </span>
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '6px', color: 'hsl(var(--text-primary))' }}>
              {buyerCompany}
            </div>
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.75rem' }}>
            <a
              href={`mailto:${buyerEmail}`}
              style={{
                color: 'hsl(var(--text-muted))',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none'
              }}
            >
              <Mail size={12} /> {buyerEmail}
            </a>
          </div>
        </div>

        {/* Card 2: Unit Offer */}
        <div
          data-testid="summary-unit-offer"
          style={{
            position: 'relative',
            padding: '12px 16px',
            backgroundColor: 'hsl(var(--bg-card))',
            borderRadius: '10px',
            border: '1px solid hsl(var(--border-color))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={14} /> Unit Offer
            </div>
            {hasNegotiatedSettledPrice && finalPrice !== undefined ? (
              <div style={{ marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'hsl(var(--success))' }}>
                    ${finalPrice.toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>/case</span>
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: 'hsla(var(--success), 0.15)',
                      color: 'hsl(var(--success))',
                      border: '1px solid hsla(var(--success), 0.3)',
                      textTransform: 'uppercase'
                    }}
                  >
                    Settled
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                  Initial Bid: ${unitPrice.toFixed(2)} /case
                </div>
              </div>
            ) : (
              <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'hsl(var(--success))', marginTop: '4px' }}>
                ${unitPrice.toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>/case</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '4px', fontFamily: 'monospace' }}>
            Floor: ${reserveFloorPrice.toFixed(2)}
          </div>
        </div>

        {/* Card 3: Volume Requested */}
        <div
          data-testid="summary-volume-requested"
          style={{
            position: 'relative',
            padding: '12px 16px',
            backgroundColor: 'hsl(var(--bg-card))',
            borderRadius: '10px',
            border: '1px solid hsl(var(--border-color))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={14} /> Volume Requested
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.25)'
                }}
              >
                {allocationPct}% Lot
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '4px', color: 'hsl(var(--text-primary))' }}>
              {quantity} <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>cases</span>
            </div>
          </div>
          <div style={{ marginTop: '4px' }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: isFullClearing ? 'rgba(16, 185, 129, 0.12)' : 'hsl(var(--bg-main))',
                color: isFullClearing ? '#10b981' : 'hsl(var(--text-muted))',
                border: `1px solid ${isFullClearing ? 'rgba(16, 185, 129, 0.25)' : 'hsl(var(--border-color))'}`
              }}
            >
              {isFullClearing ? 'Full Clearing' : 'Partial Clearing'}
            </span>
          </div>
        </div>

        {/* Card 4: Gross Recovery */}
        <div
          data-testid="summary-gross-recovery"
          style={{
            position: 'relative',
            padding: '12px 16px',
            backgroundColor: 'hsl(var(--bg-card))',
            borderRadius: '10px',
            border: '1px solid hsl(var(--border-color))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={14} /> Gross Recovery
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'hsl(var(--text-primary))', marginTop: '4px' }}>
              ${totalRecovery.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '4px', fontFamily: 'monospace' }}>
            Net Est: ${netClearingTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
};
