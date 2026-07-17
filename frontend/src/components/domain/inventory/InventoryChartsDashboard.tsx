import React, { useState } from 'react';
import { BarChart3, TrendingUp, PieChart, Sparkles, Clock, Layers, Filter, ShieldAlert } from 'lucide-react';

export const InventoryChartsDashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedDc, setSelectedDc] = useState<string>('all');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Coming Soon Feature Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 15%), hsl(var(--secondary) / 10%))',
          border: '1px solid hsl(var(--primary) / 35%)',
          borderRadius: '16px',
          padding: '24px 28px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 400px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              color: '#fff',
              boxShadow: '0 4px 16px hsl(var(--primary) / 40%)',
              flexShrink: 0,
            }}
          >
            <BarChart3 size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'hsl(var(--text-primary))', margin: 0 }}>
                Inventory Performance & Analytics Suite
              </h3>
              <span
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 8px hsl(var(--primary) / 40%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={12} /> Coming Soon
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'hsl(var(--text-secondary))', margin: 0, lineHeight: 1.4 }}>
              Interactive visual analytics, real-time AI yield forecasting, and dynamic COGS expiration trendlines replacing legacy static tables. Raw lot records are now managed under the <strong>Ingestion Pipeline</strong>.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'hsl(var(--bg-card) / 80%)',
              border: '1px solid hsl(var(--border))',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '0.8rem',
              color: 'hsl(var(--text-muted))',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={14} style={{ color: 'hsl(var(--primary))' }} />
            <span>Target Release: Q3 2026</span>
          </div>
        </div>
      </div>

      {/* Global Interactive Filter Bar */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'hsl(var(--bg-card))',
          padding: '14px 20px',
          borderRadius: '12px',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} /> Timeframe:
          </span>
          <div style={{ display: 'flex', gap: '4px', background: 'hsl(var(--bg-app))', padding: '3px', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}>
            {(['7d', '30d', '90d', 'ytd'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: timeframe === t ? 700 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  background: timeframe === t ? 'hsl(var(--primary))' : 'transparent',
                  color: timeframe === t ? '#fff' : 'hsl(var(--text-muted))',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textTransform: 'uppercase',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              background: 'hsl(var(--bg-app))',
              color: 'hsl(var(--text-primary))',
              border: '1px solid hsl(var(--border))',
              fontSize: '0.8rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Categories</option>
            <option value="Dry Goods">Dry Goods</option>
            <option value="Dairy">Dairy</option>
            <option value="Frozen">Frozen</option>
            <option value="Beverages">Beverages</option>
          </select>

          <select
            value={selectedDc}
            onChange={(e) => setSelectedDc(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              background: 'hsl(var(--bg-app))',
              color: 'hsl(var(--text-primary))',
              border: '1px solid hsl(var(--border))',
              fontSize: '0.8rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Distribution Centers</option>
            <option value="dc-chicago">DC - Chicago</option>
            <option value="dc-dallas">DC - Dallas</option>
            <option value="dc-atlanta">DC - Atlanta</option>
          </select>
        </div>
      </div>

      {/* Grid of 4 Interactive Visual Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
        
        {/* Chart 1: COGS & Expiration Risk Trajectory */}
        <div
          style={{
            background: 'hsl(var(--bg-card))',
            borderRadius: '16px',
            border: '1px solid hsl(var(--border))',
            padding: '24px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: 'hsl(var(--primary))' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>
                  COGS & Expiration Risk Trajectory
                </h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', margin: '4px 0 0 0' }}>
                Total COGS ($) vs. High Expiration Risk COGS over time
              </p>
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'hsl(var(--warning) / 15%)',
                color: 'hsl(var(--warning))',
                border: '1px solid hsl(var(--warning) / 30%)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Coming Soon
            </span>
          </div>

          {/* SVG Visual Representation */}
          <div style={{ height: '220px', width: '100%', position: 'relative', background: 'hsl(var(--bg-app))', borderRadius: '12px', border: '1px solid hsl(var(--border) / 50%)', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <svg viewBox="0 0 500 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="gradCogs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0, 84%, 60%)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="hsl(var(--border))" strokeDasharray="4 4" opacity="0.5" />
              <line x1="0" y1="70" x2="500" y2="70" stroke="hsl(var(--border))" strokeDasharray="4 4" opacity="0.5" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="hsl(var(--border))" strokeDasharray="4 4" opacity="0.5" />

              {/* Area 1: Total COGS */}
              <path d="M 0,130 Q 100,60 200,90 T 400,40 L 500,70 L 500,150 L 0,150 Z" fill="url(#gradCogs)" />
              <path d="M 0,130 Q 100,60 200,90 T 400,40 L 500,70" fill="none" stroke="hsl(217, 91%, 60%)" strokeWidth="3" />

              {/* Area 2: Risk COGS */}
              <path d="M 0,145 Q 100,120 200,130 T 400,95 L 500,110 L 500,150 L 0,150 Z" fill="url(#gradRisk)" />
              <path d="M 0,145 Q 100,120 200,130 T 400,95 L 500,110" fill="none" stroke="hsl(0, 84%, 60%)" strokeWidth="2.5" strokeDasharray="6 3" />

              {/* Interactive Nodes */}
              <circle cx="200" cy="90" r="5" fill="hsl(217, 91%, 60%)" stroke="#fff" strokeWidth="2" />
              <circle cx="400" cy="40" r="5" fill="hsl(217, 91%, 60%)" stroke="#fff" strokeWidth="2" />
              <circle cx="400" cy="95" r="5" fill="hsl(0, 84%, 60%)" stroke="#fff" strokeWidth="2" />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'hsl(var(--text-muted))', borderTop: '1px solid hsl(var(--border))', paddingTop: '8px' }}>
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
              <span>Week 5</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'hsl(var(--text-secondary))' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'hsl(217, 91%, 60%)' }} /> Total COGS ($248,500)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'hsl(0, 84%, 60%)' }} /> At-Risk COGS ($42,100)
              </span>
            </div>
          </div>
        </div>

        {/* Chart 2: Remaining Shelf Life & Category Breakdown */}
        <div
          style={{
            background: 'hsl(var(--bg-card))',
            borderRadius: '16px',
            border: '1px solid hsl(var(--border))',
            padding: '24px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={18} style={{ color: 'hsl(var(--secondary))' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>
                  Remaining Shelf Life (RSL) Tiers
                </h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', margin: '4px 0 0 0' }}>
                Inventory lot distribution categorized by days to expiry
              </p>
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'hsl(var(--warning) / 15%)',
                color: 'hsl(var(--warning))',
                border: '1px solid hsl(var(--warning) / 30%)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Coming Soon
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '20px', alignItems: 'center', background: 'hsl(var(--bg-app))', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border) / 50%)', minHeight: '220px' }}>
            {/* Donut Chart Visual */}
            <div style={{ width: '140px', height: '140px', position: 'relative', margin: '0 auto' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                {/* < 10 Days (Red) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(0, 84%, 60%)" strokeWidth="4" strokeDasharray="15 85" strokeDashoffset="0" />
                {/* 10-30 Days (Yellow) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(45, 93%, 47%)" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="-15" />
                {/* 30-60 Days (Blue) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(217, 91%, 60%)" strokeWidth="4" strokeDasharray="35 65" strokeDashoffset="-40" />
                {/* 60+ Days (Green) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(142, 76%, 46%)" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="-75" />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--text-primary))', display: 'block' }}>100%</span>
                <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>Active Lots</span>
              </div>
            </div>

            {/* Legend Progress Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                  <span style={{ color: 'hsl(0, 84%, 60%)', fontWeight: 600 }}>&lt; 10 Days (Critical)</span>
                  <span style={{ color: 'hsl(var(--text-primary))', fontWeight: 700 }}>15% (12 lots)</span>
                </div>
                <div style={{ height: '6px', width: '100%', background: 'hsl(var(--border))', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '15%', background: 'hsl(0, 84%, 60%)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                  <span style={{ color: 'hsl(45, 93%, 47%)', fontWeight: 600 }}>10 – 30 Days (At Risk)</span>
                  <span style={{ color: 'hsl(var(--text-primary))', fontWeight: 700 }}>25% (20 lots)</span>
                </div>
                <div style={{ height: '6px', width: '100%', background: 'hsl(var(--border))', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '25%', background: 'hsl(45, 93%, 47%)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                  <span style={{ color: 'hsl(217, 91%, 60%)', fontWeight: 600 }}>30 – 60 Days (Moderate)</span>
                  <span style={{ color: 'hsl(var(--text-primary))', fontWeight: 700 }}>35% (28 lots)</span>
                </div>
                <div style={{ height: '6px', width: '100%', background: 'hsl(var(--border))', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '35%', background: 'hsl(217, 91%, 60%)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                  <span style={{ color: 'hsl(142, 76%, 46%)', fontWeight: 600 }}>60+ Days (Optimal)</span>
                  <span style={{ color: 'hsl(var(--text-primary))', fontWeight: 700 }}>25% (20 lots)</span>
                </div>
                <div style={{ height: '6px', width: '100%', background: 'hsl(var(--border))', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '25%', background: 'hsl(142, 76%, 46%)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Landfill Diversion & Channel Yield Velocity */}
        <div
          style={{
            background: 'hsl(var(--bg-card))',
            borderRadius: '16px',
            border: '1px solid hsl(var(--border))',
            padding: '24px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} style={{ color: 'hsl(142, 76%, 46%)' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>
                  Landfill Diversion & Channel Yield
                </h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', margin: '4px 0 0 0' }}>
                Case volume distribution across closeouts, food banks, and recycling
              </p>
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'hsl(var(--warning) / 15%)',
                color: 'hsl(var(--warning))',
                border: '1px solid hsl(var(--warning) / 30%)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Coming Soon
            </span>
          </div>

          <div style={{ height: '220px', background: 'hsl(var(--bg-app))', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border) / 50%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '16px' }}>
            {[
              { month: 'Jan', sold: 60, donated: 25, recycled: 10, pending: 5 },
              { month: 'Feb', sold: 65, donated: 20, recycled: 8, pending: 7 },
              { month: 'Mar', sold: 70, donated: 15, recycled: 10, pending: 5 },
              { month: 'Apr', sold: 75, donated: 15, recycled: 5, pending: 5 },
              { month: 'May', sold: 80, donated: 12, recycled: 5, pending: 3 },
            ].map((col, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', maxWidth: '40px', height: '150px', display: 'flex', flexDirection: 'column-reverse', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ height: `${col.sold}%`, background: 'hsl(142, 76%, 46%)' }} title={`Sold: ${col.sold}%`} />
                  <div style={{ height: `${col.donated}%`, background: 'hsl(217, 91%, 60%)' }} title={`Donated: ${col.donated}%`} />
                  <div style={{ height: `${col.recycled}%`, background: 'hsl(45, 93%, 47%)' }} title={`Recycled: ${col.recycled}%`} />
                  <div style={{ height: `${col.pending}%`, background: 'hsl(0, 84%, 60%)' }} title={`Pending: ${col.pending}%`} />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>{col.month}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'hsl(142, 76%, 46%)' }} /> Sold (68%)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'hsl(217, 91%, 60%)' }} /> Donated (18%)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'hsl(45, 93%, 47%)' }} /> Recycled (8%)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'hsl(0, 84%, 60%)' }} /> At Risk (6%)</span>
          </div>
        </div>

        {/* Chart 4: Buyer Bidding Demand & Market Heatmap */}
        <div
          style={{
            background: 'hsl(var(--bg-card))',
            borderRadius: '16px',
            border: '1px solid hsl(var(--border))',
            padding: '24px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} style={{ color: 'hsl(45, 93%, 47%)' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>
                  Buyer Bid Density & Category Demand
                </h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', margin: '4px 0 0 0' }}>
                Bidding intensity and average COGS recovery % by product category
              </p>
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'hsl(var(--warning) / 15%)',
                color: 'hsl(var(--warning))',
                border: '1px solid hsl(var(--warning) / 30%)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Coming Soon
            </span>
          </div>

          <div style={{ height: '220px', background: 'hsl(var(--bg-app))', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border) / 50%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '10px' }}>
            {[
              { category: 'Dry Goods', bids: '42 Bids', recovery: '78% COGS', width: '85%', color: 'hsl(var(--primary))' },
              { category: 'Dairy', bids: '28 Bids', recovery: '65% COGS', width: '65%', color: 'hsl(142, 76%, 46%)' },
              { category: 'Frozen Food', bids: '19 Bids', recovery: '58% COGS', width: '50%', color: 'hsl(45, 93%, 47%)' },
              { category: 'Beverages', bids: '35 Bids', recovery: '72% COGS', width: '75%', color: 'hsl(217, 91%, 60%)' },
            ].map((cat, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ fontWeight: 700, color: 'hsl(var(--text-primary))' }}>{cat.category}</span>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>{cat.bids} • <strong style={{ color: cat.color }}>{cat.recovery}</strong></span>
                </div>
                <div style={{ height: '8px', width: '100%', background: 'hsl(var(--border))', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: cat.width, background: cat.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', textAlign: 'right' }}>
            <span>Updated in real-time from active secondary buyer bids</span>
          </div>
        </div>

      </div>
    </div>
  );
};
