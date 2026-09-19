import React from 'react';
import { Activity } from 'lucide-react';
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
    handleSuggestPricingAction,
    svgDimensions,
    plotWidth,
    plotHeight,
    pricePath,
    revPath,
    currentX,
    getYPrice,
    getYRev,
    suggestingPricing,
    pricingData,
  } = simulator;

  const renderPricingPlot = () => {
    return (
      <div className="pricing-plot-container mt-5 p-4 bg-[hsl(var(--bg-main))] rounded-lg border border-[hsl(var(--border-color))]">
        <h5 className="text-xs font-semibold mb-3 text-[hsl(var(--text-secondary))] flex justify-between">
          <span>Cleared Price & Yield Decay Curves</span>
          <span className="text-[11px] font-normal text-[hsl(var(--text-muted))]">X-Axis: Days to Expiry</span>
        </h5>

        <svg
          width="100%"
          height={svgDimensions.height}
          viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          <line
            x1={svgDimensions.paddingLeft}
            y1={svgDimensions.paddingTop}
            x2={svgDimensions.paddingLeft}
            y2={svgDimensions.paddingTop + plotHeight}
            stroke="hsl(var(--border-color))"
            strokeDasharray="2,2"
          />
          <line
            x1={svgDimensions.paddingLeft}
            y1={svgDimensions.paddingTop + plotHeight}
            x2={svgDimensions.paddingLeft + plotWidth}
            y2={svgDimensions.paddingTop + plotHeight}
            stroke="hsl(var(--border-color))"
          />
          <line
            x1={svgDimensions.paddingLeft + plotWidth}
            y1={svgDimensions.paddingTop}
            x2={svgDimensions.paddingLeft + plotWidth}
            y2={svgDimensions.paddingTop + plotHeight}
            stroke="hsl(var(--border-color))"
            strokeDasharray="2,2"
          />

          {/* Horizontal grid lines */}
          <line
            x1={svgDimensions.paddingLeft}
            y1={svgDimensions.paddingTop}
            x2={svgDimensions.paddingLeft + plotWidth}
            y2={svgDimensions.paddingTop}
            stroke="hsl(var(--border-color))"
            strokeOpacity="0.3"
            strokeDasharray="3,3"
          />
          <line
            x1={svgDimensions.paddingLeft}
            y1={svgDimensions.paddingTop + plotHeight / 2}
            x2={svgDimensions.paddingLeft + plotWidth}
            y2={svgDimensions.paddingTop + plotHeight / 2}
            stroke="hsl(var(--border-color))"
            strokeOpacity="0.3"
            strokeDasharray="3,3"
          />

          {/* Price curve (Cyan) */}
          <path
            d={pricePath}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Revenue curve (Green) */}
          <path
            d={revPath}
            fill="none"
            stroke="hsl(var(--success))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current Days Dotted Line */}
          <line
            x1={currentX}
            y1={svgDimensions.paddingTop}
            x2={currentX}
            y2={svgDimensions.paddingTop + plotHeight}
            stroke="hsl(var(--warning))"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />

          {/* Current Position Marker Dot for Price */}
          {pricingData && (
            <>
              <circle
                cx={currentX}
                cy={getYPrice(pricingData.recommendedPrice)}
                r="5"
                fill="hsl(var(--primary))"
                stroke="white"
                strokeWidth="1.5"
              />
              <circle
                cx={currentX}
                cy={getYRev(pricingData.expectedRevenue)}
                r="5"
                fill="hsl(var(--success))"
                stroke="white"
                strokeWidth="1.5"
              />
            </>
          )}

          {/* Axes labels */}
          <text
            x={svgDimensions.paddingLeft}
            y={svgDimensions.paddingTop + plotHeight + 15}
            fill="hsl(var(--text-muted))"
            fontSize="9"
            textAnchor="middle"
          >
            0d
          </text>
          <text
            x={svgDimensions.paddingLeft + plotWidth / 2}
            y={svgDimensions.paddingTop + plotHeight + 15}
            fill="hsl(var(--text-muted))"
            fontSize="9"
            textAnchor="middle"
          >
            22d
          </text>
          <text
            x={svgDimensions.paddingLeft + plotWidth}
            y={svgDimensions.paddingTop + plotHeight + 15}
            fill="hsl(var(--text-muted))"
            fontSize="9"
            textAnchor="middle"
          >
            45d
          </text>

          {/* Y Axis labels */}
          <text
            x={svgDimensions.paddingLeft - 8}
            y={svgDimensions.paddingTop + 4}
            fill="hsl(var(--text-muted))"
            fontSize="9"
            textAnchor="end"
          >
            ${(originalPrice || 0).toFixed(0)}
          </text>
          <text
            x={svgDimensions.paddingLeft - 8}
            y={svgDimensions.paddingTop + plotHeight + 4}
            fill="hsl(var(--text-muted))"
            fontSize="9"
            textAnchor="end"
          >
            $0
          </text>
        </svg>

        {/* Legend */}
        <div className="flex gap-4 justify-center mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 bg-[hsl(var(--primary))] rounded" />
            <span className="text-[hsl(var(--text-secondary))]">Unit Price ($)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 bg-[hsl(var(--success))] rounded" />
            <span className="text-[hsl(var(--text-secondary))]">Expected Yield ($)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 border-t-2 border-dotted border-[hsl(var(--warning))]" />
            <span className="text-[hsl(var(--text-secondary))]">Current ({currentDays}d)</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="lot-hub-card">
      <div className="lot-hub-card-header">
        <div className="lot-hub-card-title flex items-center gap-2 font-semibold">
          <Activity size={18} className="text-[hsl(var(--primary))]" />
          <span>AI Distressed Risk Assessment</span>
        </div>
        {drawerLoading && <span className="badge text-xs">Analyzing...</span>}
      </div>

      {drawerLoading ? (
        <div className="py-10 text-center">
          <div className="loader mx-auto mb-3" />
          <p className="text-xs text-[hsl(var(--text-muted))]">Generating risk & recovery profile...</p>
        </div>
      ) : riskProfile ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 items-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-extrabold border-2 ${
                riskProfile.score > 70
                  ? 'bg-[hsl(var(--error)/15%)] text-[hsl(var(--error))] border-[hsl(var(--error))]'
                  : 'bg-[hsl(var(--primary)/15%)] text-[hsl(var(--primary))] border-[hsl(var(--primary))]'
              }`}
            >
              {riskProfile.score || 45}
            </div>
            <div>
              <div className="text-base font-bold text-[hsl(var(--text-primary))]">
                {riskProfile.urgency || 'High Urgency Action'}
              </div>
              <div className="text-xs text-[hsl(var(--text-secondary))] mt-0.5">
                Suggested Route: <strong>{riskProfile.suggestedRoute?.toUpperCase() || 'MARKETPLACE LIQUIDATION'}</strong>
              </div>
            </div>
          </div>

          {riskProfile.rationale && (
            <p className="text-xs text-[hsl(var(--text-secondary))] leading-relaxed p-3 bg-[hsl(var(--bg-main))] rounded-lg border border-[hsl(var(--border-color))]">
              {riskProfile.rationale}
            </p>
          )}

          {/* Dynamic Pricing Simulator */}
          <div className="border-t border-[hsl(var(--border-color))] pt-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="font-semibold text-sm">AI Dynamic Pricing Simulator</div>
                <span className="text-xs text-[hsl(var(--text-muted))]">
                  Simulate clearances and expected yield decay curves
                </span>
              </div>
              {!pricingData && (
                <button
                  className="btn btn-sm btn-primary text-xs"
                  onClick={handleSuggestPricingAction}
                  disabled={suggestingPricing}
                >
                  {suggestingPricing ? 'Calculating...' : 'Generate Curve'}
                </button>
              )}
            </div>

            {suggestingPricing && (
              <div className="text-center py-4 text-xs text-[hsl(var(--text-muted))]">
                Recalculating curves...
              </div>
            )}

            {pricingData && !suggestingPricing && (
              <div className="flex flex-col gap-3.5">
                <div className="slider-group">
                  <div className="slider-header flex justify-between text-xs mb-1">
                    <span>Shelf Life (Days Left)</span>
                    <strong className="text-[hsl(var(--primary))]">{currentDays} Days</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="45"
                    value={currentDays ?? 30}
                    onChange={(e) => handleSliderDaysChange(Number(e.target.value))}
                    onMouseUp={() => handleSlidersCommit(currentDays ?? 30, currentQty ?? lot.quantityCases)}
                    onTouchEnd={() => handleSlidersCommit(currentDays ?? 30, currentQty ?? lot.quantityCases)}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-header flex justify-between text-xs mb-1">
                    <span>Liquidation Volume (Cases)</span>
                    <strong className="text-[hsl(var(--primary))]">{currentQty} Cases</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={lot.quantityCases}
                    value={currentQty ?? lot.quantityCases}
                    onChange={(e) => handleSliderQtyChange(Number(e.target.value))}
                    onMouseUp={() => handleSlidersCommit(currentDays ?? 30, currentQty ?? lot.quantityCases)}
                    onTouchEnd={() => handleSlidersCommit(currentDays ?? 30, currentQty ?? lot.quantityCases)}
                    className="w-full cursor-pointer"
                  />
                </div>

                {renderPricingPlot()}

                <div className="grid grid-cols-2 gap-3 text-xs bg-[hsl(var(--bg-main))] p-3 rounded-lg border border-[hsl(var(--border-color))]">
                  <div>
                    <span className="text-[hsl(var(--text-muted))] text-[11px]">Simulated Clearing Price</span>
                    <div className="font-bold text-[hsl(var(--primary))] text-base">
                      ${pricingData.recommendedPrice?.toFixed(2)}/cs
                    </div>
                  </div>
                  <div>
                    <span className="text-[hsl(var(--text-muted))] text-[11px]">Expected Yield</span>
                    <div className="font-bold text-[hsl(var(--success))] text-base">
                      $
                      {pricingData.expectedRevenue?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-[hsl(var(--text-muted))] text-xs italic">
          Risk profile will auto-generate upon activation or data refresh.
        </p>
      )}
    </div>
  );
};
