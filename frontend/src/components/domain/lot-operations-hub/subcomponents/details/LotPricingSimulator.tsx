import React from 'react';
import { Zap } from 'lucide-react';
import type { useLotPricingSimulator } from '../../hooks/useLotPricingSimulator';

interface LotPricingSimulatorProps {
  lot: any;
  riskProfile: any;
  drawerLoading?: boolean;
  simulator: ReturnType<typeof useLotPricingSimulator>;
}

export const LotPricingSimulator: React.FC<LotPricingSimulatorProps> = ({
  lot,
  riskProfile,
  drawerLoading,
  simulator,
}) => {
  const {
    currentDays,
    currentQty,
    originalPrice,
    handleSliderDaysChange,
    handleSliderQtyChange,
    handleSlidersCommit,
    svgDimensions,
    pricePath,
    revPath,
    currentX,
    pricingData,
  } = simulator;

  const basePrice = originalPrice > 0 ? originalPrice : 13.0;
  const days = typeof currentDays === 'number' ? currentDays : 0;
  const qty = typeof currentQty === 'number' ? currentQty : (lot?.quantityCases || 3000);

  // Compute clearing price and gross expected yield
  const simClearingPrice = pricingData?.recommendedPrice ?? (basePrice * (0.25 + (days / 60) * 0.7));
  const simExpectedYield = pricingData?.expectedRevenue ?? (simClearingPrice * qty);
  const discountVsBase = basePrice > 0 ? Math.round(((basePrice - simClearingPrice) / basePrice) * 100) : 0;

  const riskScore = riskProfile?.score ?? (days === 0 ? 45 : Math.round(88 - (days / 60) * 75));
  const urgencyLabel = riskProfile?.urgency ?? (days <= 10 ? 'Critical Urgency' : 'Monitored Urgency');
  const suggestedRoute = riskProfile?.suggestedRoute?.toUpperCase() || 'MARKETPLACE LIQUIDATION';
  const rationaleText =
    riskProfile?.rationale || 'Optimal clearing window is <72 hrs to prevent total inventory write-off.';

  return (
    <article
      className="bg-white border border-surface-border rounded-xl p-5 shadow-subtle-card relative font-sans"
      data-purpose="ai-risk-simulator"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-5 flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
            <Zap className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              AI Distressed Risk Engine
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-100 text-brand-900 font-bold">
                NEURAL SIM
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Dynamic clearance yield and price decay curves
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {drawerLoading && <span className="text-xs font-mono text-slate-400">Simulating...</span>}
          <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot"></span>
        </div>
      </div>

      {drawerLoading ? (
        <div className="py-12 text-center font-mono">
          <div className="loader mx-auto mb-3" />
          <p className="text-xs text-slate-400">Synthesizing dynamic risk &amp; yield profile...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Risk Telemetry & Route Prescription */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-xl bg-slate-50/80 items-center border border-slate-100">
            {/* Gauge */}
            <div className="sm:col-span-4 flex flex-col items-center justify-center">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-slate-200"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                  />
                  <circle
                    className="transition-all duration-1000 ease-out"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="url(#riskGradientLight)"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * riskScore) / 100}
                    strokeLinecap="round"
                    strokeWidth="8"
                  />
                  <defs>
                    <linearGradient id="riskGradientLight" x1="0%" x2="100%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                  <span className="text-3xl font-black text-slate-900 tracking-tighter" id="riskScoreDisplay">
                    {riskScore}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
                    RISK INDX
                  </span>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono mt-1 uppercase font-bold tracking-wider ${
                  riskScore > 40 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {urgencyLabel}
              </span>
            </div>

            {/* Route Prescription */}
            <div className="sm:col-span-8 border-t sm:border-t-0 sm:border-l border-slate-200/80 sm:pl-4">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                AI Prescription
              </div>
              <div className="text-sm font-bold text-slate-900 tracking-tight mt-0.5">
                {urgencyLabel}
              </div>
              <div className="mt-2 text-xs font-mono bg-white p-3 rounded-lg shadow-2xs border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Suggested Route:</span>
                <span className="font-bold text-brand-900">{suggestedRoute}</span>
                <p className="text-[11px] text-slate-500 mt-1 font-sans leading-relaxed">{rationaleText}</p>
              </div>
            </div>
          </div>

          {/* Interactive Sliders */}
          <div className="space-y-4 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-slate-600 font-medium">Shelf Life (Days Left):</span>
                <span
                  className={`font-bold bg-white px-2 py-0.5 rounded shadow-2xs text-[11px] border ${
                    days === 0
                      ? 'text-rose-700 border-rose-200'
                      : 'text-brand-900 border-brand-200'
                  }`}
                  id="shelfLifeVal"
                >
                  {days === 0 ? '0 Days (Immediate)' : `${days} Days`}
                </span>
              </div>
              <input
                id="shelfLifeSlider"
                type="range"
                min="0"
                max="60"
                value={days}
                onChange={(e) => handleSliderDaysChange(Number(e.target.value))}
                onMouseUp={() => handleSlidersCommit(days, qty)}
                onTouchEnd={() => handleSlidersCommit(days, qty)}
                className="w-full cursor-pointer accent-brand-500"
              />
            </div>

            <div className="pt-1">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-slate-600 font-medium">Liquidation Volume (Cases):</span>
                <span
                  className="text-brand-900 font-bold bg-white px-2 py-0.5 rounded shadow-2xs text-[11px] border border-brand-200"
                  id="volumeVal"
                >
                  {qty.toLocaleString()} Cases
                </span>
              </div>
              <input
                id="volumeSlider"
                type="range"
                min="100"
                max={lot?.quantityCases ? Math.max(lot.quantityCases, 3000) : 3000}
                step="50"
                value={qty}
                onChange={(e) => handleSliderQtyChange(Number(e.target.value))}
                onMouseUp={() => handleSlidersCommit(days, qty)}
                onTouchEnd={() => handleSlidersCommit(days, qty)}
                className="w-full cursor-pointer accent-brand-500"
              />
            </div>
          </div>

          {/* Cleared Price & Yield Decay Chart */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                Cleared Price &amp; Yield Decay
              </span>
              <span className="text-[10px] text-slate-400">X-Axis: Days to Expiry</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 relative overflow-hidden">
              <div className="h-40 w-full relative">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 160">
                  {/* Grid Lines */}
                  <line stroke="#e2e8f0" strokeDasharray="3,3" x1="40" x2="390" y1="20" y2="20" />
                  <line stroke="#e2e8f0" strokeDasharray="3,3" x1="40" x2="390" y1="60" y2="60" />
                  <line stroke="#e2e8f0" strokeDasharray="3,3" x1="40" x2="390" y1="100" y2="100" />
                  <line stroke="#cbd5e1" strokeWidth="1.5" x1="40" x2="390" y1="140" y2="140" />
                  <line stroke="#cbd5e1" strokeWidth="1.5" x1="40" x2="40" y1="20" y2="140" />
                  <line stroke="#e2e8f0" strokeDasharray="3,3" x1="160" x2="160" y1="20" y2="140" />
                  <line stroke="#e2e8f0" strokeDasharray="3,3" x1="280" x2="280" y1="20" y2="140" />
                  <line stroke="#e2e8f0" strokeDasharray="3,3" x1="390" x2="390" y1="20" y2="140" />

                  {/* Y-Axis Labels */}
                  <text fill="#94a3b8" fontFamily="monospace" fontSize="9" x="5" y="24">
                    ${Math.round(basePrice)}
                  </text>
                  <text fill="#94a3b8" fontFamily="monospace" fontSize="9" x="12" y="80">
                    ${Math.round(basePrice / 2)}
                  </text>
                  <text fill="#94a3b8" fontFamily="monospace" fontSize="9" x="12" y="138">
                    $0
                  </text>

                  {/* Expected Yield Curve (Green) */}
                  <path
                    d={revPath || 'M 40 140 Q 140 110, 240 50 T 390 45'}
                    fill="none"
                    stroke="#059669"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />
                  <path
                    d={`${revPath || 'M 40 140 Q 140 110, 240 50 T 390 45'} L 390 140 L 40 140 Z`}
                    fill="url(#emeraldAreaLight)"
                    opacity="0.15"
                  />

                  {/* Unit Price Line (Blue) */}
                  <path
                    d={pricePath || 'M 40 135 C 100 120, 200 85, 300 68 L 390 65'}
                    fill="none"
                    stroke="#2196f3"
                    strokeWidth="2.5"
                  />

                  {/* Current Days Marker */}
                  {currentX !== undefined && (
                    <>
                      <line
                        stroke="#dc2626"
                        strokeDasharray="2,2"
                        strokeWidth="2"
                        x1={Math.max(45, Math.min(385, (currentX / svgDimensions.width) * 390))}
                        x2={Math.max(45, Math.min(385, (currentX / svgDimensions.width) * 390))}
                        y1="15"
                        y2="140"
                      />
                      <circle
                        className="pulse-dot"
                        cx={Math.max(45, Math.min(385, (currentX / svgDimensions.width) * 390))}
                        cy={133}
                        fill="#dc2626"
                        r="5"
                      />
                      <circle
                        cx={Math.max(45, Math.min(385, (currentX / svgDimensions.width) * 390))}
                        cy={133}
                        fill="#ffffff"
                        r="2.5"
                      />
                    </>
                  )}

                  <defs>
                    <linearGradient id="emeraldAreaLight" x1="0%" x2="0%" y1="0%" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="flex justify-between text-[9px] font-mono text-slate-400 px-8 mt-1">
                  <span>0d (Exp)</span>
                  <span>15d</span>
                  <span>30d</span>
                  <span>45d+</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-2 pt-2 border-t border-slate-200/70 text-[11px] font-mono">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-0.5 bg-brand-500 inline-block"></span>
                  <span className="text-slate-600">Unit Price ($)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-0.5 bg-emerald-600 inline-block"></span>
                  <span className="text-slate-600">Expected Yield ($)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
                  <span className="text-red-700 font-semibold">Current ({days}d)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stat Summary Cards */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Simulated Clearing Price
              </div>
              <div className="text-xl font-mono font-bold text-slate-900 mt-0.5" id="simClearingPrice">
                ${simClearingPrice.toFixed(2)}
                <span className="text-xs text-slate-400 font-normal"> /cs</span>
              </div>
              <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                {discountVsBase > 0 ? `-${discountVsBase}% vs Base` : 'Optimal Parity'}
              </span>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Gross Expected Recovery
              </div>
              <div className="text-xl font-mono font-bold text-emerald-600 mt-0.5" id="simExpectedYield">
                ${simExpectedYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                Capital Protected
              </span>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
