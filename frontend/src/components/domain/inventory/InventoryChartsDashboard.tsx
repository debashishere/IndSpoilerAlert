import React, { useState } from 'react';
import { BarChart3, TrendingUp, PieChart, Sparkles, Clock, Layers, Filter, ShieldAlert, ChevronDown } from 'lucide-react';

export const InventoryChartsDashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedDc, setSelectedDc] = useState<string>('all');

  return (
    <div className="flex flex-col gap-5" id="insight-charts-dashboard">
      {/* 1. Feature Summary Banner (Matching IngestionHubConnectors Style) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  Inventory Performance &amp; Analytics Suite
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Coming Soon
                </span>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                Interactive visual analytics, real-time AI yield forecasting, and dynamic COGS expiration trendlines replacing legacy static tables. Raw lot records are now managed under the <strong className="text-slate-700 dark:text-slate-300">Ingestion Pipeline</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Target Release: Q3 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Global Interactive Filter Bar (Matching Ingestion Filter Bar) */}
      <div
        className="bg-slate-50/80 dark:bg-slate-900/80 rounded-xl shadow-xs p-3.5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        id="charts-filter-bar"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Timeframe:
          </span>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {(['7d', '30d', '90d', 'ytd'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeframe(t)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md uppercase transition-all cursor-pointer ${
                  timeframe === t
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative flex items-center">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[12.5px] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs cursor-pointer transition-colors"
            >
              <option value="all">All Categories</option>
              <option value="Dry Goods">Dry Goods</option>
              <option value="Dairy">Dairy</option>
              <option value="Frozen">Frozen</option>
              <option value="Beverages">Beverages</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative flex items-center">
            <select
              value={selectedDc}
              onChange={(e) => setSelectedDc(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[12.5px] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs cursor-pointer transition-colors"
            >
              <option value="all">All Distribution Centers</option>
              <option value="dc-chicago">DC - Chicago</option>
              <option value="dc-dallas">DC - Dallas</option>
              <option value="dc-atlanta">DC - Atlanta</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3. Grid of 4 Interactive Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: COGS & Expiration Risk Trajectory */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
                  COGS &amp; Expiration Risk Trajectory
                </h4>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                Total COGS ($) vs. High Expiration Risk COGS over time
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 uppercase tracking-wider">
              Coming Soon
            </span>
          </div>

          {/* SVG Visual Representation */}
          <div className="h-[220px] w-full relative bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200/60 dark:border-slate-800/60 p-4 flex flex-col justify-between">
            <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gradCogs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--error))" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(var(--error))" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 4" />
              <line x1="0" y1="70" x2="500" y2="70" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 4" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 4" />

              {/* Area 1: Total COGS */}
              <path d="M 0,130 Q 100,60 200,90 T 400,40 L 500,70 L 500,150 L 0,150 Z" fill="url(#gradCogs)" />
              <path d="M 0,130 Q 100,60 200,90 T 400,40 L 500,70" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" />

              {/* Area 2: Risk COGS */}
              <path d="M 0,145 Q 100,120 200,130 T 400,95 L 500,110 L 500,150 L 0,150 Z" fill="url(#gradRisk)" />
              <path d="M 0,145 Q 100,120 200,130 T 400,95 L 500,110" fill="none" stroke="hsl(var(--error))" strokeWidth="2.5" strokeDasharray="6 3" />

              {/* Interactive Nodes */}
              <circle cx="200" cy="90" r="5" fill="hsl(var(--primary))" stroke="white" strokeWidth="2" />
              <circle cx="400" cy="40" r="5" fill="hsl(var(--primary))" stroke="white" strokeWidth="2" />
              <circle cx="400" cy="95" r="5" fill="hsl(var(--error))" stroke="white" strokeWidth="2" />
            </svg>
            <div className="flex justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-2">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
              <span>Week 5</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Total COGS ($248,500)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> At-Risk COGS ($42,100)
              </span>
            </div>
          </div>
        </div>

        {/* Chart 2: Remaining Shelf Life & Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
                  Remaining Shelf Life (RSL) Tiers
                </h4>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                Inventory lot distribution categorized by days to expiry
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 uppercase tracking-wider">
              Coming Soon
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-5 items-center bg-slate-50 dark:bg-slate-950/60 p-4 rounded-lg border border-slate-200/60 dark:border-slate-800/60 min-h-[220px]">
            {/* Donut Chart Visual */}
            <div className="w-[130px] h-[130px] relative mx-auto">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--error))" strokeWidth="4" strokeDasharray="15 85" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(45, 93%, 47%)" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="-15" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeDasharray="35 65" strokeDashoffset="-40" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="hsl(var(--success))" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="-75" />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 block leading-none">100%</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Active Lots</span>
              </div>
            </div>

            {/* Legend Progress Bars */}
            <div className="flex flex-col gap-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">&lt; 10 Days (Critical)</span>
                  <span className="text-slate-900 dark:text-slate-100 font-mono font-bold">15% (12 lots)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-[15%] bg-rose-500" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">10 – 30 Days (At Risk)</span>
                  <span className="text-slate-900 dark:text-slate-100 font-mono font-bold">25% (20 lots)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-[25%] bg-amber-500" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">30 – 60 Days (Moderate)</span>
                  <span className="text-slate-900 dark:text-slate-100 font-mono font-bold">35% (28 lots)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-[35%] bg-blue-500" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">60+ Days (Optimal)</span>
                  <span className="text-slate-900 dark:text-slate-100 font-mono font-bold">25% (20 lots)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-[25%] bg-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Landfill Diversion & Channel Yield */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
                  Landfill Diversion &amp; Channel Yield
                </h4>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                Case volume distribution across closeouts, food banks, and recycling
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 uppercase tracking-wider">
              Coming Soon
            </span>
          </div>

          <div className="h-[220px] bg-slate-50 dark:bg-slate-950/60 p-4 rounded-lg border border-slate-200/60 dark:border-slate-800/60 flex items-end justify-around gap-3">
            {[
              { month: 'Jan', sold: 60, donated: 25, recycled: 10, pending: 5 },
              { month: 'Feb', sold: 65, donated: 20, recycled: 8, pending: 7 },
              { month: 'Mar', sold: 70, donated: 15, recycled: 10, pending: 5 },
              { month: 'Apr', sold: 75, donated: 15, recycled: 5, pending: 5 },
              { month: 'May', sold: 80, donated: 12, recycled: 5, pending: 3 },
            ].map((col, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                <div className="w-full max-w-[36px] h-[150px] flex flex-col-reverse rounded-md overflow-hidden">
                  <div style={{ height: `${col.sold}%` }} className="bg-emerald-500" title={`Sold: ${col.sold}%`} />
                  <div style={{ height: `${col.donated}%` }} className="bg-blue-500" title={`Donated: ${col.donated}%`} />
                  <div style={{ height: `${col.recycled}%` }} className="bg-amber-500" title={`Recycled: ${col.recycled}%`} />
                  <div style={{ height: `${col.pending}%` }} className="bg-rose-500" title={`Pending: ${col.pending}%`} />
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold">{col.month}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-around text-xs text-slate-600 dark:text-slate-400 flex-wrap gap-2">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Sold (68%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Donated (18%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Recycled (8%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> At Risk (6%)</span>
          </div>
        </div>

        {/* Chart 4: Buyer Bidding Demand & Market Heatmap */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
                  Buyer Bid Density &amp; Category Demand
                </h4>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                Bidding intensity and average COGS recovery % by product category
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 uppercase tracking-wider">
              Coming Soon
            </span>
          </div>

          <div className="h-[220px] bg-slate-50 dark:bg-slate-950/60 p-4 rounded-lg border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-around gap-2.5">
            {[
              { category: 'Dry Goods', bids: '42 Bids', recovery: '78% COGS', width: '85%', color: 'bg-blue-600' },
              { category: 'Dairy', bids: '28 Bids', recovery: '65% COGS', width: '65%', color: 'bg-emerald-600' },
              { category: 'Frozen Food', bids: '19 Bids', recovery: '58% COGS', width: '50%', color: 'bg-amber-500' },
              { category: 'Beverages', bids: '35 Bids', recovery: '72% COGS', width: '75%', color: 'bg-indigo-600' },
            ].map((cat, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{cat.category}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {cat.bids} <span className="text-slate-300 dark:text-slate-600">·</span>{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">{cat.recovery}</strong>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div style={{ width: cat.width }} className={`h-full ${cat.color} rounded-full`} />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
            <span>Updated in real-time from active secondary buyer bids</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryChartsDashboard;
