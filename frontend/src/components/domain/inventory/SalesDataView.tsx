import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Filter,
  BarChart3,
  PieChart,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Building2,
  Tag,
  CheckCircle2,
  Award,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import type { RootState } from '../../../store';
import { fetchSalesRecordsThunk } from '../../../store/slices/ingestionSlice';
import {
  fetchSalesAnalyticsThunk,
  selectSalesAnalytics,
  type CloseoutTransactionPoint,
} from '../../../store/slices/coreSlice';

import { TopBuyersDrilldown } from '../insights/TopBuyersDrilldown';
import { TopWarehousesDrilldown } from '../insights/TopWarehousesDrilldown';

export type SalesSubTab = 'overview' | 'buyers' | 'warehouses';

const SALES_SUB_TABS = [
  { id: 'overview' as const, label: 'Overview & Analytics', icon: BarChart3 },
  { id: 'buyers' as const, label: 'Top Buyers', icon: Users },
  { id: 'warehouses' as const, label: 'Top Warehouses / DCs', icon: Building2 },
] as const;

export interface SalesDataViewProps {
  onOpenLotHub?: (lot: any) => void;
}

export const SalesDataView: React.FC<SalesDataViewProps> = ({ onOpenLotHub }) => {
  const dispatch = useDispatch();
  const { salesRecords } = useSelector((state: RootState) => state.ingestion);
  const salesAnalytics = useSelector(selectSalesAnalytics);
  const selectedSupplier = useSelector((state: RootState) => state.ingestion?.selectedSupplier);

  // Global Interactive Filters
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dcFilter, setDcFilter] = useState<string>('all');
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'buyers' | 'dcs'>('buyers');
  const [activeScatterPoint, setActiveScatterPoint] = useState<any | null>(null);

  // Sub-Navigation State & Keyboard ARIA Tab Handling
  const [salesSubTab, setSalesSubTab] = useState<SalesSubTab>('overview');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % SALES_SUB_TABS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + SALES_SUB_TABS.length) % SALES_SUB_TABS.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = SALES_SUB_TABS.length - 1;
    } else {
      return;
    }
    const nextTab = SALES_SUB_TABS[nextIndex];
    setSalesSubTab(nextTab.id);
    tabRefs.current[nextIndex]?.focus();
  };

  useEffect(() => {
    dispatch(fetchSalesRecordsThunk() as any);
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchSalesAnalyticsThunk({
        timeframe,
        category: categoryFilter,
        warehouse: dcFilter,
        supplierId: selectedSupplier,
      }) as any
    );
  }, [dispatch, timeframe, categoryFilter, dcFilter, selectedSupplier]);

  // Extract unique categories dynamically from backend
  const uniqueCategories = useMemo(() => {
    const dynamic = [
      ...(salesAnalytics?.categories || []),
      ...(salesRecords || []).map((r: any) => r.category).filter(Boolean),
    ];
    return Array.from(new Set(dynamic));
  }, [salesAnalytics?.categories, salesRecords]);

  // Extract unique DCs dynamically from backend
  const uniqueDCs = useMemo(() => {
    const dynamic = [
      ...(salesAnalytics?.warehouses || []),
      ...(salesRecords || []).map((r: any) => r.warehouse || r.dc || r.location).filter(Boolean),
    ];
    return Array.from(new Set(dynamic));
  }, [salesAnalytics?.warehouses, salesRecords]);

  // Dynamic calculations from Redux store
  const { totalRevenue, revenueGrowthPct, totalVolume, avgPrice, reconciledCount, totalRecordsCount } = useMemo(() => {
    if (salesAnalytics) {
      return {
        totalRevenue: salesAnalytics.totalRevenue ?? 0,
        revenueGrowthPct: salesAnalytics.revenueGrowthPct ?? 0,
        totalVolume: salesAnalytics.totalVolume ?? 0,
        avgPrice: salesAnalytics.avgPrice ?? 0,
        reconciledCount: salesAnalytics.reconciledCount ?? 0,
        totalRecordsCount: salesAnalytics.totalCount ?? 0,
      };
    }

    const records = salesRecords || [];
    let rev = 0;
    let vol = 0;
    let reconciled = 0;

    records.forEach((r: any) => {
      const qty = r.quantityCases || r.quantitySold || r.quantity || r.cases || 0;
      const price = r.pricePerCase || r.unitPrice || r.price || 0;
      const recordRev = r.totalValue || r.revenue || qty * price;
      rev += recordRev;
      vol += qty;
      if (r.status === 'reconciled' || r.matchedLotId || r.lotNumber) {
        reconciled += 1;
      }
    });

    if (records.length === 0) {
      rev = 0;
      vol = 0;
      reconciled = 0;
    }

    const avg = vol > 0 ? rev / vol : 0;
    const totalCount = records.length;

    return {
      totalRevenue: rev,
      revenueGrowthPct: 0,
      totalVolume: vol,
      avgPrice: avg,
      reconciledCount: reconciled,
      totalRecordsCount: totalCount,
    };
  }, [salesAnalytics, salesRecords]);

  // Chart 1: Revenue Trajectory Data based on live backend data or timeframe fallback
  const trajectoryData = useMemo(() => {
    if (salesAnalytics?.trajectory && salesAnalytics.trajectory.length > 0) {
      return salesAnalytics.trajectory;
    }
    if (timeframe === '7d') {
      return Array.from({ length: 7 }, (_, i) => ({ period: `Day ${i + 1}`, revenue: 0, volume: 0 }));
    } else if (timeframe === '90d') {
      return Array.from({ length: 3 }, (_, i) => ({ period: `Month ${i + 1}`, revenue: 0, volume: 0 }));
    } else if (timeframe === 'ytd') {
      return [
        { period: 'Q1', revenue: 0, volume: 0 },
        { period: 'Q2', revenue: 0, volume: 0 },
        { period: 'Q3', revenue: 0, volume: 0 },
      ];
    }
    // Default 30d (5 Weeks)
    return Array.from({ length: 5 }, (_, i) => ({ period: `Week ${i + 1}`, revenue: 0, volume: 0 }));
  }, [salesAnalytics?.trajectory, timeframe]);

  const isZeroTrajectory = useMemo(() => {
    if (!trajectoryData || trajectoryData.length === 0) return true;
    const totalRev = trajectoryData.reduce((acc, d) => acc + (d.revenue || 0), 0);
    const totalVol = trajectoryData.reduce((acc, d) => acc + (d.volume || 0), 0);
    return totalRev === 0 && totalVol === 0;
  }, [trajectoryData]);

  // Dynamic SVG path calculations for Chart 1
  const { revAreaPath, revLinePath, volLinePath, revCoordinates } = useMemo(() => {
    if (!trajectoryData || trajectoryData.length === 0 || isZeroTrajectory) {
      return {
        revAreaPath: '',
        revLinePath: '',
        volLinePath: '',
        revCoordinates: [],
      };
    }

    const n = trajectoryData.length;
    const maxRev = Math.max(...trajectoryData.map((d) => d.revenue || 0), 1);
    const maxVol = Math.max(...trajectoryData.map((d) => d.volume || 0), 1);

    const revCoords = trajectoryData.map((d, i) => {
      const x = n > 1 ? (i / (n - 1)) * 500 : 250;
      const y = 140 - ((d.revenue || 0) / maxRev) * 110;
      return { x, y };
    });

    const volCoords = trajectoryData.map((d, i) => {
      const x = n > 1 ? (i / (n - 1)) * 500 : 250;
      const y = 140 - ((d.volume || 0) / maxVol) * 110;
      return { x, y };
    });

    const revLine = revCoords
      .map((pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `L ${pt.x},${pt.y}`))
      .join(' ');

    const revArea = `${revLine} L ${revCoords[revCoords.length - 1].x},140 L ${revCoords[0].x},140 Z`;

    const volLine = volCoords
      .map((pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `L ${pt.x},${pt.y}`))
      .join(' ');

    return {
      revAreaPath: revArea,
      revLinePath: revLine,
      volLinePath: volLine,
      revCoordinates: revCoords,
    };
  }, [trajectoryData, isZeroTrajectory]);

  // Chart 2: COGS vs Realized Revenue Recovery by Category
  const categoryRecoveryData = useMemo(() => {
    if (salesAnalytics?.categoryRecovery) {
      return salesAnalytics.categoryRecovery;
    }
    return [];
  }, [salesAnalytics?.categoryRecovery]);

  const isZeroCategoryRecovery = categoryRecoveryData.length === 0;

  // Chart 3: Buyer Channel Revenue Share
  const channelBreakdown = useMemo(() => {
    if (salesAnalytics?.channelDistribution) {
      return salesAnalytics.channelDistribution;
    }
    return [];
  }, [salesAnalytics?.channelDistribution]);

  const isZeroChannelDistribution = channelBreakdown.length === 0;

  // Dynamic SVG Donut calculations for Chart 3
  const channelDonutSegments = useMemo(() => {
    const palette = ['hsl(var(--primary))', 'hsl(var(--success))', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];
    let cumulative = 0;
    return channelBreakdown.map((ch, idx) => {
      const offset = -cumulative;
      cumulative += ch.pct;
      const color = palette[idx % palette.length];
      return {
        ...ch,
        offset,
        color,
      };
    });
  }, [channelBreakdown]);

  // Chart 4: Price Realization Velocity vs Remaining Shelf Life (RSL Scatter Plot Matrix)
  const closeoutPoints: CloseoutTransactionPoint[] = useMemo(() => {
    if (salesAnalytics?.recentCloseouts) {
      return salesAnalytics.recentCloseouts;
    }
    return [];
  }, [salesAnalytics?.recentCloseouts]);

  const isZeroCloseoutPoints = closeoutPoints.length === 0;

  // Compute dynamic coordinate mapping and least-squares regression line
  const { mappedPoints, regressionPath } = useMemo(() => {
    if (closeoutPoints.length === 0) {
      return { mappedPoints: [], regressionPath: '' };
    }

    const maxRsl = Math.max(90, ...closeoutPoints.map((p) => p.rslDays));
    const maxPrice = Math.max(45, ...closeoutPoints.map((p) => p.price));

    const mapped = closeoutPoints.map((pt) => {
      const cx = maxRsl > 0 ? (pt.rslDays / maxRsl) * 440 + 30 : 250;
      const cy = maxPrice > 0 ? 140 - (pt.price / maxPrice) * 120 : 70;
      return {
        ...pt,
        cx,
        cy,
      };
    });

    // Least Squares Linear Regression: y = m * x + c on canvas coordinates
    let regressionLine = '';
    const n = mapped.length;
    if (n === 1) {
      // Single point: render a flat horizontal segment across canvas
      const y = mapped[0].cy;
      regressionLine = `M 30,${y.toFixed(1)} L 470,${y.toFixed(1)}`;
    } else {
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumX2 = 0;

      for (let i = 0; i < n; i++) {
        const x = mapped[i].rslDays;
        const y = mapped[i].price;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      }

      const denominator = n * sumX2 - sumX * sumX;
      let slope = 0;
      let intercept = sumY / n;

      if (denominator !== 0) {
        slope = (n * sumXY - sumX * sumY) / denominator;
        intercept = (sumY - slope * sumX) / n;
      }

      // Compute regression line at x = 0 days and x = maxRsl days
      const rslMin = 0;
      const rslMax = maxRsl;
      const priceAtMin = Math.max(0, intercept + slope * rslMin);
      const priceAtMax = Math.max(0, intercept + slope * rslMax);

      const x1 = 30;
      const y1 = maxPrice > 0 ? 140 - (priceAtMin / maxPrice) * 120 : 70;
      const x2 = 470;
      const y2 = maxPrice > 0 ? 140 - (priceAtMax / maxPrice) * 120 : 70;

      regressionLine = `M ${x1.toFixed(1)},${y1.toFixed(1)} L ${x2.toFixed(1)},${y2.toFixed(1)}`;
    }

    return {
      mappedPoints: mapped,
      regressionPath: regressionLine,
    };
  }, [closeoutPoints]);

  // Leaderboard Data
  const topBuyers = [
    { name: 'Bargain Hunt Liquidation', totalSpent: 112400, casesPurchased: 3820, sharePct: 25.5 },
    { name: 'Grocery Outlet Bargain Market', totalSpent: 98500, casesPurchased: 3150, sharePct: 22.4 },
    { name: "Ollie's Bargain Outlet", totalSpent: 84200, casesPurchased: 2900, sharePct: 19.1 },
    { name: 'Misfits Market / Imperfect Foods', totalSpent: 67100, casesPurchased: 2400, sharePct: 15.3 },
    { name: 'Second Harvest Food Rescue', totalSpent: 41800, casesPurchased: 1800, sharePct: 9.5 },
  ];

  const topWarehouses = [
    { name: 'Unilever Midwest DC (Chicago, IL)', clearedRevenue: 154200, casesCleared: 5200, recoveryPct: 76.5 },
    { name: 'Kraft Heinz DC (Dallas, TX)', clearedRevenue: 118400, casesCleared: 4100, recoveryPct: 72.8 },
    { name: 'Mondelez Midwest DC (Atlanta, GA)', clearedRevenue: 89600, casesCleared: 3050, recoveryPct: 69.4 },
    { name: 'Danone Midwest DC (Columbus, OH)', clearedRevenue: 51250, casesCleared: 1700, recoveryPct: 71.0 },
  ];

  return (
    <div className="flex flex-col gap-5" id="insight-sales-panel">
      {/* 1. Feature Summary Banner (Matching IngestionHubConnectors Style) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  Sales Data Analytics &amp; Revenue Intelligence
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Live Sales Charts
                </span>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                Interactive revenue trajectory, COGS yield recovery, channel sales distribution, and closeout price realization charts. Raw sales tables are centralized under <strong className="text-slate-700 dark:text-slate-300">Ingestion Pipeline → Sales Ingestion</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Ingestion Sync Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Real-Time Telemetry Cards Grid (Matching Ingestion Standard) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5" id="sales-telemetry-bar">
        {/* Card 1: Total Realized Revenue */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Realized Revenue
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[20px] font-bold font-mono text-emerald-600 dark:text-emerald-400 leading-none">
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {revenueGrowthPct > 0 ? (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> +{revenueGrowthPct.toFixed(1)}%
                </span>
              ) : revenueGrowthPct < 0 ? (
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                  <ArrowDownRight className="w-3 h-3" /> {revenueGrowthPct.toFixed(1)}%
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                  0.0%
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">
              monetization_on
            </span>
            <DollarSign className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
        </div>

        {/* Card 2: Volume Sold */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Volume Sold
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-slate-100 leading-none">
                {totalVolume.toLocaleString()}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">cases</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">shopping_bag</span>
            <ShoppingBag className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
        </div>

        {/* Card 3: Average Realized Price */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Average Realized Price
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-slate-100 leading-none">
                ${avgPrice.toFixed(2)}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">/ cs</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">trending_up</span>
            <TrendingUp className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
        </div>

        {/* Card 4: Reconciled Transactions */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Reconciled Transactions
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-slate-100 leading-none">
                {reconciledCount}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
                / {totalRecordsCount}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">
              check_circle
            </span>
            <CheckCircle2 className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* 3. Global Interactive Filter Bar (Matching Ingestion Filter Bar) */}
      <div
        className="bg-slate-50/80 dark:bg-slate-900/80 rounded-xl shadow-xs p-3.5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        id="sales-filter-bar"
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
                    ? 'bg-emerald-600 text-white shadow-2xs'
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
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[12.5px] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs cursor-pointer transition-colors"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative flex items-center">
            <select
              value={dcFilter}
              onChange={(e) => setDcFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[12.5px] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs cursor-pointer transition-colors"
            >
              <option value="all">All Warehouses</option>
              {uniqueDCs.map((dc) => (
                <option key={dc} value={dc}>
                  {dc}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3.5. Segmented 3-Pill Sub-Navigation Shell */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div
          role="tablist"
          aria-label="Sales & Clearing Sub-navigation"
          className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-full border border-slate-200/80 dark:border-slate-700/80 w-fit"
          id="sales-sub-nav-strip"
        >
          {SALES_SUB_TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isSelected = salesSubTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                role="tab"
                id={`sales-tab-${tab.id}`}
                aria-controls={`sales-tabpanel-${tab.id}`}
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setSalesSubTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0f4cc9] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isSelected
                      ? 'text-white'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Sub-Tab Panels */}
      {salesSubTab === 'overview' && (
        <div
          role="tabpanel"
          id="sales-tabpanel-overview"
          aria-labelledby="sales-tab-overview"
          className="flex flex-col gap-5"
        >
          {/* Interactive Charts Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Sales Revenue & Volume Trajectory */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
                  Realized Closeout Revenue &amp; Volume Trajectory
                </h4>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                Total Revenue ($) vs. Volume (Cases Sold) over {timeframe.toUpperCase()}
              </p>
            </div>
          </div>

          {/* SVG Visual Area Chart */}
          <div className="h-[220px] w-full relative bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200/60 dark:border-slate-800/60 p-4 flex flex-col justify-between">
            {isZeroTrajectory && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none z-10">
                <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                  No closeout sales recorded for this timeframe/warehouse.
                </p>
              </div>
            )}

            <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gradSalesRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradSalesVol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="25" x2="500" y2="25" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 4" />
              <line x1="0" y1="65" x2="500" y2="65" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 4" />
              <line x1="0" y1="105" x2="500" y2="105" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 4" />

              {isZeroTrajectory ? (
                /* Flat Baseline Axis Line */
                <line
                  data-testid="trajectory-baseline-axis"
                  x1="0"
                  y1="140"
                  x2="500"
                  y2="140"
                  stroke="currentColor"
                  className="text-slate-300 dark:text-slate-700"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              ) : (
                <>
                  {/* Area 1: Revenue ($) */}
                  <path data-testid="trajectory-revenue-area" d={revAreaPath} fill="url(#gradSalesRev)" />
                  <path data-testid="trajectory-revenue-line" d={revLinePath} fill="none" stroke="hsl(var(--success))" strokeWidth="3" />

                  {/* Line 2: Volume (Cases) */}
                  <path data-testid="trajectory-volume-line" d={volLinePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="5 3" />

                  {/* Interactive Point Nodes */}
                  {revCoordinates.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill="hsl(var(--success))"
                      stroke="white"
                      strokeWidth="2"
                    />
                  ))}
                </>
              )}
            </svg>

            <div className="flex justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-2">
              {trajectoryData.map((d, i) => (
                <span key={i}>{d.period}</span>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Realized Revenue ($)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Case Volume Sold
              </span>
            </div>
          </div>
        </div>

        {/* Chart 2: Revenue Recovery vs Original COGS by Category */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
                  COGS Recovery % by Product Category
                </h4>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                Comparison of Original Ingested COGS vs. Realized Closeout Sales
              </p>
            </div>
          </div>

          {isZeroCategoryRecovery ? (
            <div className="h-[220px] bg-slate-50 dark:bg-slate-950/60 p-4 rounded-lg border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center text-center">
              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                No category recovery data recorded for this timeframe.
              </p>
            </div>
          ) : (
            <div className="h-[220px] bg-slate-50 dark:bg-slate-950/60 p-4 rounded-lg border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-around gap-2.5 overflow-y-auto">
              {categoryRecoveryData.map((cat, idx) => (
                <div key={cat.category || idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span data-testid={`category-name-${cat.category}`} className="font-semibold text-slate-900 dark:text-slate-100">{cat.category}</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      ${cat.revenue.toLocaleString()} / ${cat.cogs.toLocaleString()} COGS <span className="text-slate-300 dark:text-slate-600">·</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-200 font-mono">{cat.recoveryPct}% Recovery</strong>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      data-testid={`category-progress-${cat.category}`}
                      style={{ width: `${Math.min(cat.recoveryPct, 100)}%` }}
                      className="h-full bg-emerald-500 rounded-full transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
            <span>Target COGS recovery benchmark: <strong>65.0%</strong></span>
          </div>
        </div>

        {/* Chart 3: Buyer Channel Revenue Share */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
                  Sales Channel Revenue Share
                </h4>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                Distribution of closeout revenue across secondary buyer segments
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-5 items-center bg-slate-50 dark:bg-slate-950/60 p-4 rounded-lg border border-slate-200/60 dark:border-slate-800/60 min-h-[220px]">
            {/* SVG Donut Chart */}
            <div className="w-[130px] h-[130px] relative mx-auto">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {isZeroChannelDistribution ? (
                  <circle
                    data-testid="donut-zero-ring"
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="4"
                    strokeDasharray="100 0"
                    strokeDashoffset="0"
                  />
                ) : (
                  channelDonutSegments.map((seg, idx) => (
                    <circle
                      key={seg.channel || idx}
                      data-testid="donut-segment"
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="4"
                      strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                      strokeDashoffset={`${seg.offset}`}
                    />
                  ))
                )}
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 block leading-none">
                  {isZeroChannelDistribution ? '0%' : '100%'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Revenue Share</span>
              </div>
            </div>

            {/* Legend Progress List */}
            <div className="flex flex-col gap-2.5">
              {isZeroChannelDistribution ? (
                <div className="flex items-center justify-center p-3 text-center">
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                    No channel distribution recorded for this timeframe.
                  </p>
                </div>
              ) : (
                channelDonutSegments.map((ch, idx) => (
                  <div key={ch.channel || idx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{ch.channel}</span>
                      <span className="text-slate-600 dark:text-slate-400 font-mono">
                        {ch.pct}% (${ch.revenue.toLocaleString()})
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(ch.pct, 100)}%`, backgroundColor: ch.color }}
                        className="h-full rounded-full transition-all"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chart 4: Price Realization Velocity vs Remaining Shelf Life (RSL Decay Scatter Matrix) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
                  Price Realization vs. Days to Expiry (RSL Decay)
                </h4>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                Closeout unit price ($/cs) realization curve mapped against shelf life at sale
              </p>
            </div>
          </div>

          {isZeroCloseoutPoints ? (
            <div className="h-[220px] bg-slate-50 dark:bg-slate-950/60 p-4 rounded-lg border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center text-center">
              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                No closeout transaction points recorded.
              </p>
            </div>
          ) : (
            <div className="h-[220px] bg-slate-50 dark:bg-slate-950/60 p-4 rounded-lg border border-slate-200/60 dark:border-slate-800/60 relative flex flex-col justify-between">
              <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
                {/* Dynamic Least-Squares Regression Trendline */}
                {regressionPath && (
                  <path
                    data-testid="rsl-regression-trendline"
                    d={regressionPath}
                    fill="none"
                    stroke="hsl(45, 93%, 47%)"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    opacity="0.8"
                  />
                )}

                {/* Dynamic Scatter Nodes */}
                {mappedPoints.map((pt) => {
                  const isSelected = activeScatterPoint?.id === pt.id;

                  return (
                    <g
                      key={pt.id}
                      data-testid={`scatter-node-${pt.id}`}
                      onClick={() => setActiveScatterPoint(pt)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={pt.cx}
                        cy={pt.cy}
                        r={isSelected ? '8' : '6'}
                        fill={isSelected ? 'white' : 'hsl(45, 93%, 47%)'}
                        stroke="hsl(45, 93%, 47%)"
                        strokeWidth="2"
                      />
                      <text
                        x={pt.cx + 8}
                        y={pt.cy + 3}
                        className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono font-semibold"
                      >
                        ${pt.price.toFixed(1)}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="flex justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-2">
                <span>0 Days (Expiring)</span>
                <span>30 Days RSL</span>
                <span>60 Days RSL</span>
                <span>90+ Days RSL</span>
              </div>
            </div>
          )}

          {activeScatterPoint ? (
            <div className="bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/60 text-xs flex justify-between items-center text-slate-800 dark:text-slate-200">
              <div>
                <strong>{activeScatterPoint.product}</strong> ({activeScatterPoint.sku}) <span className="text-slate-400">·</span>{' '}
                <span className="text-amber-600 dark:text-amber-400 font-semibold">{activeScatterPoint.rslDays} Days RSL</span>
                {activeScatterPoint.buyer && (
                  <>
                    {' '}<span className="text-slate-400">·</span>{' '}
                    <span className="text-slate-500 dark:text-slate-400">{activeScatterPoint.buyer}</span>
                  </>
                )}
              </div>
              <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                ${activeScatterPoint.price.toFixed(2)}/cs ({activeScatterPoint.recoveryPct || activeScatterPoint.recovery}% COGS)
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
              Click any point on the scatter matrix to inspect transaction details.
            </div>
          )}
        </div>
      </div>

      {/* 5. Leaderboards Section: Top Buyers & Warehouses (Matching Ingestion Table Card) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden mb-6">
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> Sales Channel &amp; Fulfillment Leaderboard
            </h4>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 m-0">
              Top closeout buying partners and top performing distribution fulfillment nodes
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveLeaderboardTab('buyers')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeLeaderboardTab === 'buyers'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Top Buyers</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLeaderboardTab('dcs')}
              className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activeLeaderboardTab === 'dcs'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Top Warehouses / DCs</span>
            </button>
          </div>
        </div>

        {activeLeaderboardTab === 'buyers' ? (
          <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {topBuyers.map((b, idx) => (
              <div
                key={idx}
                className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex-wrap gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {b.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {b.casesPurchased.toLocaleString()} cases purchased
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                    ${b.totalSpent.toLocaleString()}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60">
                    {b.sharePct}% Share
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {topWarehouses.map((wh, idx) => (
              <div
                key={idx}
                className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex-wrap gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {wh.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {wh.casesCleared.toLocaleString()} cases cleared
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                    ${wh.clearedRevenue.toLocaleString()}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
                    {wh.recoveryPct}% Recovery
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </div>
      )}

      {/* Tab Panel: Top Buyers */}
      <div
        role="tabpanel"
        id="sales-tabpanel-buyers"
        aria-labelledby="sales-tab-buyers"
        data-testid="sales-subview-buyers"
        className={`flex flex-col gap-5 ${salesSubTab === 'buyers' ? '' : 'hidden'}`}
      >
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
                Top Buyers Performance &amp; Transaction Drilldown
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
                Detailed closeout ledger and purchasing volume breakdown across buyer partners.
              </p>
            </div>
          </div>
        </div>

        <TopBuyersDrilldown
          topBuyers={salesAnalytics?.topBuyers}
          onOpenLotHub={onOpenLotHub}
        />
      </div>

      {/* Tab Panel: Top Warehouses / DCs */}
      <div
        role="tabpanel"
        id="sales-tabpanel-warehouses"
        aria-labelledby="sales-tab-warehouses"
        data-testid="sales-subview-warehouses"
        className={`flex flex-col gap-5 ${salesSubTab === 'warehouses' ? '' : 'hidden'}`}
      >
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
                Top Warehouses / DCs Clearing Performance
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
                Fulfillment clearing throughput, case recovery percentages, and facility ledgers.
              </p>
            </div>
          </div>
        </div>

        <TopWarehousesDrilldown
          topWarehouses={salesAnalytics?.topWarehouses}
          onOpenLotHub={onOpenLotHub}
        />
      </div>
    </div>
  );
};


export default SalesDataView;
