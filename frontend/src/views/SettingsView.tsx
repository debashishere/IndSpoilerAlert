import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Server,
  UserCheck,
  Lock,
  Sliders,
  Hash,
  Layers,
  Bell,
  Clock,
  Shield,
  ChevronRight,
  Save,
  CheckCircle2,
  Key,
  Globe,
  Database,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  Activity,
  CheckCheck
} from 'lucide-react';

interface SettingsViewProps {
  supplierId?: string;
  onSupplierChange?: (id: string) => void;
  initialSubTab?: 'profile' | 'platform' | 'security' | 'system' | string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  supplierId = 'default',
  initialSubTab = 'profile'
}) => {
  let authUser = null;
  let updateProfiles: ((profiles: any) => Promise<any>) | null = null;
  try {
    const auth = useAuth();
    authUser = auth?.user;
    updateProfiles = auth?.updateProfiles || null;
  } catch {
    // optional fallback outside provider
  }

  const isSupplierProfileActive = authUser ? Boolean(authUser.profiles?.supplier) : true;
  // Map legacy sub-tabs if passed to new section tabs
  const getSanitizedTab = (tab: string): 'profile' | 'platform' | 'security' | 'system' => {
    if (tab === 'platform' || tab === 'security' || tab === 'system' || tab === 'profile') {
      return tab;
    }
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'platform' | 'security' | 'system'>(
    getSanitizedTab(initialSubTab)
  );

  // Platform Prefs State
  const [defaultExpiryHours, setDefaultExpiryHours] = useState(48);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoArchiveThreads, setAutoArchiveThreads] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [systemSaved, setSystemSaved] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const navTabs = [
    { id: 'profile' as const, label: 'Supplier Profile', icon: UserCheck, desc: 'Identity & Credentials' },
    { id: 'platform' as const, label: 'Platform Prefs', icon: Sliders, desc: 'Bidding & Notifications' },
    { id: 'security' as const, label: 'Security & Access', icon: ShieldCheck, desc: 'Tokens & Sessions' },
    { id: 'system' as const, label: 'System Defaults', icon: Server, desc: 'Regional & Ingestion' }
  ];

  const handleSavePrefs = () => {
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 3000);
  };

  const handleSaveSystem = () => {
    setSystemSaved(true);
    setTimeout(() => setSystemSaved(false), 3000);
  };

  const handleCopySupplierId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(supplierId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 text-[hsl(var(--text-primary))] font-sans h-[calc(100vh-64px)] flex flex-col settings-view-container overflow-hidden">
      {/* Viewport-Sovereign Header Banner (Compact, Institutional, No Viewport Congestion) */}
      <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-color))] rounded-2xl px-5 py-4 shadow-sm relative overflow-hidden flex-shrink-0">
        <div 
          className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40" 
          style={{ backgroundColor: 'hsl(var(--primary) / 0.15)' }} 
        />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5">
            <div 
              className="p-2.5 rounded-xl shadow-sm text-white shrink-0" 
              style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-dark)))' }}
            >
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[hsl(var(--text-primary))]">
                  Central Platform Settings
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.2)]">
                  v2.4 Core
                </span>
              </div>
              <p className="text-[hsl(var(--text-muted))] text-xs sm:text-sm mt-0.5">
                Manage platform configurations, supplier profile identity, operational defaults, and access security.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <div className="inline-flex items-center gap-2 bg-[hsl(var(--bg-card-hover))] px-3 py-1.5 rounded-xl border border-[hsl(var(--border-color))] text-xs shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[hsl(var(--text-muted))] font-medium">Active Supplier:</span>
              <span className="font-semibold text-[hsl(var(--text-primary))] font-mono">{supplierId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-1.5 bg-card bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-color))] rounded-2xl p-3 shadow-sm overflow-y-auto">
          <div className="text-[11px] font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-1 px-3 pt-1">
            Configuration
          </div>
          {navTabs.map(({ id, label, icon: Icon, desc }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white shadow-sm shadow-[hsl(var(--primary)/0.25)]'
                    : 'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bg-card-hover))]'
                }`}
              >
                <div className="flex items-center gap-2.5 text-left">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[hsl(var(--text-muted))] group-hover:text-[hsl(var(--text-primary))]'}`} />
                  <div>
                    <div className="font-semibold leading-snug">{label}</div>
                    <div className={`text-[10px] hidden sm:block ${isActive ? 'text-white/80' : 'text-[hsl(var(--text-muted))]'}`}>
                      {desc}
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'text-white/90 translate-x-0.5' : 'text-[hsl(var(--text-muted))] group-hover:translate-x-0.5'}`} />
              </button>
            );
          })}

          <div className="mt-auto pt-4 px-1">
            <div className="p-3 bg-[hsl(var(--bg-card-hover))] border border-[hsl(var(--border-color))] rounded-xl space-y-1.5 text-xs text-[hsl(var(--text-muted))]">
              <p className="font-semibold text-[hsl(var(--text-primary))] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[hsl(var(--primary))]" /> 
                <span>Security Engine</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                IndSpoilerAlert Subsystem v2.4. OAuth 2.0 & cryptographic access control active.
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-color))] rounded-2xl p-5 sm:p-6 shadow-sm overflow-y-auto custom-scrollbar">
          {/* ===== Section: Supplier Profile & Identity ===== */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {!isSupplierProfileActive && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-base text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-5 h-5 shrink-0" />
                      <span>Become a Supplier</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[hsl(var(--text-secondary))] max-w-xl leading-relaxed">
                      You currently hold a Buyer account. Activate your Supplier profile to unlock AI Ingestion Engine, Inventory Lot Management, and Automated Liquidation Workflows.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (updateProfiles) {
                        await updateProfiles({ supplier: true });
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm shrink-0 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Activate Supplier Profile</span>
                  </button>
                </div>
              )}

              {/* Section Header */}
              <div className="flex items-center gap-3 border-b border-[hsl(var(--border-color))] pb-4">
                <div className="p-2 rounded-xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[hsl(var(--text-primary))]">
                    Supplier Identity & Profile
                  </h2>
                  <p className="text-xs sm:text-sm text-[hsl(var(--text-muted))] mt-0.5">
                    Active supplier account details, verification status, and company configuration.
                  </p>
                </div>
              </div>

              {/* Overview Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Account ID Card */}
                <div className="p-4 bg-[hsl(var(--bg-card-hover))] rounded-2xl border border-[hsl(var(--border-color))] space-y-2 shadow-xs transition-colors hover:border-[hsl(var(--primary)/0.3)]">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[hsl(var(--text-muted))]">
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-[hsl(var(--primary))]" /> 
                      Account ID
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySupplierId}
                      className="p-1 rounded-md hover:bg-[hsl(var(--bg-card))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
                      title="Copy Account ID"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-sm sm:text-base font-bold font-mono text-[hsl(var(--text-primary))] break-all">
                    {supplierId}
                  </p>
                  <p className="text-[11px] text-[hsl(var(--text-muted))]">
                    Master partition key for all catalog lots.
                  </p>
                </div>

                {/* Strategy Card */}
                <div className="p-4 bg-[hsl(var(--bg-card-hover))] rounded-2xl border border-[hsl(var(--border-color))] space-y-2 shadow-xs transition-colors hover:border-[hsl(var(--primary)/0.3)]">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[hsl(var(--text-muted))]">
                    <Layers className="w-3.5 h-3.5 text-[hsl(var(--primary))]" /> 
                    Strategy
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm sm:text-base font-bold text-[hsl(var(--text-primary))]">
                      Sell / Auction First
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)]">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-[hsl(var(--text-muted))]">
                    Default automated dispatch pipeline.
                  </p>
                </div>

                {/* Compliance Card */}
                <div className="p-4 bg-[hsl(var(--bg-card-hover))] rounded-2xl border border-[hsl(var(--border-color))] space-y-2 shadow-xs transition-colors hover:border-[hsl(var(--primary)/0.3)]">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[hsl(var(--text-muted))]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> 
                    Compliance
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 
                      Approved
                    </p>
                  </div>
                  <p className="text-[11px] text-[hsl(var(--text-muted))]">
                    Enterprise Tier • KYC Verified
                  </p>
                </div>
              </div>

              {/* Account Security Actions */}
              <div className="pt-5 border-t border-[hsl(var(--border-color))]">
                <h3 className="text-sm sm:text-base font-bold text-[hsl(var(--text-primary))] mb-3.5 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[hsl(var(--primary))]" /> 
                  Account Security Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {[
                    { 
                      label: 'Revoke all active quick-bid tokens', 
                      desc: 'Invalidates all unused email CTA tokens immediately.', 
                      danger: true,
                      icon: AlertTriangle
                    },
                    { 
                      label: 'Export supplier activity log', 
                      desc: 'Download a CSV of recent dispatch and bid activity.', 
                      danger: false,
                      icon: Activity
                    }
                  ].map(({ label, desc, danger, icon: ActionIcon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        if (danger) {
                          if (confirm('Revoke all unused quick-bid tokens?')) alert('All unused quick-bid tokens have been revoked.');
                        } else {
                          alert('Export functionality coming in next release.');
                        }
                      }}
                      className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all group hover:-translate-y-0.5 active:translate-y-0 shadow-xs ${
                        danger 
                          ? 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/25 hover:border-rose-500/40 text-rose-600 dark:text-rose-400' 
                          : 'bg-[hsl(var(--bg-card-hover))] hover:bg-[hsl(var(--bg-card))] border-[hsl(var(--border-color))] hover:border-[hsl(var(--primary)/0.3)] text-[hsl(var(--text-primary))]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <div className="flex items-center gap-2">
                          <ActionIcon className={`w-4 h-4 ${danger ? 'text-rose-500' : 'text-[hsl(var(--primary))]'}`} />
                          <p className="font-bold text-xs sm:text-sm">{label}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1 opacity-75" />
                      </div>
                      <p className={`text-[11px] sm:text-xs leading-relaxed ${danger ? 'text-rose-500/80 dark:text-rose-400/80' : 'text-[hsl(var(--text-muted))]'}`}>
                        {desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== Section: Platform Preferences ===== */}
          {activeTab === 'platform' && (
            <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 border-b border-[hsl(var(--border-color))] pb-4">
                <div className="p-2 rounded-xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[hsl(var(--text-primary))]">
                    Platform Preferences
                  </h2>
                  <p className="text-xs sm:text-sm text-[hsl(var(--text-muted))] mt-0.5">
                    Default operational settings for bid windows and automation behavior.
                  </p>
                </div>
              </div>

              {prefsSaved && (
                <div className="p-3.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-top-1 duration-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Preferences saved successfully.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Bid & Offer Defaults */}
                <div className="space-y-3.5">
                  <div className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                    Bid Window Defaults
                  </div>
                  
                  <div className="p-4 bg-[hsl(var(--bg-card-hover))] rounded-2xl border border-[hsl(var(--border-color))] space-y-3 shadow-xs">
                    <div>
                      <label 
                        htmlFor="default-token-expiry" 
                        className="text-xs sm:text-sm font-semibold text-[hsl(var(--text-primary))] block mb-1.5"
                      >
                        Default Token Expiry (hours)
                      </label>
                      <div className="relative">
                        <input
                          id="default-token-expiry"
                          type="number"
                          value={defaultExpiryHours}
                          onChange={(e) => setDefaultExpiryHours(Math.max(1, Number(e.target.value)))}
                          min={1}
                          max={720}
                          className="w-full bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-color))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[hsl(var(--text-primary))] outline-none transition-all shadow-xs h-11"
                        />
                        <span className="absolute right-3.5 top-3 text-xs font-mono text-[hsl(var(--text-muted))] pointer-events-none">
                          hrs
                        </span>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-[hsl(var(--text-muted))]">Presets:</span>
                      {[24, 48, 72, 168].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setDefaultExpiryHours(hrs)}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded-md border transition-all ${
                            defaultExpiryHours === hrs
                              ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]'
                              : 'bg-[hsl(var(--bg-card))] text-[hsl(var(--text-secondary))] border-[hsl(var(--border-color))] hover:border-[hsl(var(--primary)/0.4)]'
                          }`}
                        >
                          {hrs === 168 ? '7d' : `${hrs}h`}
                        </button>
                      ))}
                    </div>

                    <p className="text-[11px] text-[hsl(var(--text-muted))] leading-relaxed">
                      Token links in buyer emails expire automatically after this duration.
                    </p>
                  </div>

                  {/* Auto-Archive Toggle Card */}
                  <div className="p-4 bg-[hsl(var(--bg-card-hover))] rounded-2xl border border-[hsl(var(--border-color))] flex items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-semibold text-[hsl(var(--text-primary))]">Auto-Archive Threads</p>
                      <p className="text-[11px] text-[hsl(var(--text-muted))]">Move concluded negotiation threads to archive automatically.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={autoArchiveThreads}
                        onChange={(e) => setAutoArchiveThreads(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 rounded-full peer peer-checked:bg-[hsl(var(--primary))] bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-color))] transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white shadow-xs" />
                    </label>
                  </div>
                </div>

                {/* Notifications */}
                <div className="space-y-3.5">
                  <div className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                    Notifications
                  </div>

                  <div className="p-4 bg-[hsl(var(--bg-card-hover))] rounded-2xl border border-[hsl(var(--border-color))] flex items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-semibold text-[hsl(var(--text-primary))]">Email alerts for buyer replies</p>
                      <p className="text-[11px] text-[hsl(var(--text-muted))]">Receive real-time system notifications when a buyer responds or counters.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 rounded-full peer peer-checked:bg-[hsl(var(--primary))] bg-[hsl(var(--bg-main))] border border-[hsl(var(--border-color))] transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white shadow-xs" />
                    </label>
                  </div>

                  {/* Secondary notification notice */}
                  <div className="p-4 bg-[hsl(var(--bg-card-hover))] rounded-2xl border border-[hsl(var(--border-color))] space-y-1 text-xs text-[hsl(var(--text-muted))] shadow-xs">
                    <p className="font-semibold text-[hsl(var(--text-primary))] flex items-center gap-1.5">
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Digest Scheduling
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Daily liquidation summaries are dispatched every morning at 08:00 {timezone}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex justify-end pt-5 border-t border-[hsl(var(--border-color))]">
                <button
                  type="button"
                  onClick={handleSavePrefs}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-[hsl(var(--primary)/0.25)] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          )}

          {/* ===== Section: Security & Access ===== */}
          {activeTab === 'security' && (
            <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 border-b border-[hsl(var(--border-color))] pb-4">
                <div className="p-2 rounded-xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[hsl(var(--text-primary))]">
                    Security & Access Control
                  </h2>
                  <p className="text-xs sm:text-sm text-[hsl(var(--text-muted))] mt-0.5">
                    Platform access tokens, cryptographic verification policies, and session lifecycle controls.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* API Tokens Card */}
                <div className="p-5 bg-[hsl(var(--bg-card-hover))] border border-[hsl(var(--border-color))] rounded-2xl space-y-3.5 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                      <Key className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[hsl(var(--text-primary))]">
                      API Tokens & Authentication
                    </h3>
                  </div>
                  <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed">
                    Single-use cryptographic HMAC signed tokens active for quick-bid links and programmatic API authorization.
                  </p>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-semibold rounded-lg bg-[hsl(var(--primary)/0.1)] border-[hsl(var(--primary)/0.25)] text-[hsl(var(--primary))]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      HMAC-SHA256 Encryption Active
                    </span>
                  </div>
                </div>

                {/* Session Policy Card */}
                <div className="p-5 bg-[hsl(var(--bg-card-hover))] border border-[hsl(var(--border-color))] rounded-2xl space-y-3.5 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[hsl(var(--text-primary))]">
                      Session Policy
                    </h3>
                  </div>
                  <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed">
                    Browser sessions auto-expire after 24 hours of inactivity to prevent unauthorized terminal access.
                  </p>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-semibold rounded-lg bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Enforced
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== Section: System Defaults ===== */}
          {activeTab === 'system' && (
            <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 border-b border-[hsl(var(--border-color))] pb-4">
                <div className="p-2 rounded-xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] shrink-0">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[hsl(var(--text-primary))]">
                    System Defaults & Regional Settings
                  </h2>
                  <p className="text-xs sm:text-sm text-[hsl(var(--text-muted))] mt-0.5">
                    Configure global currency formats, operational timezone, and data pipeline policies.
                  </p>
                </div>
              </div>

              {systemSaved && (
                <div className="p-3.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-top-1 duration-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>System defaults saved successfully.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Localization & Currency Card */}
                <div className="p-5 bg-[hsl(var(--bg-card-hover))] border border-[hsl(var(--border-color))] rounded-2xl space-y-4 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                      <Globe className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[hsl(var(--text-primary))]">
                      Localization & Currency
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block mb-1.5 font-semibold text-[hsl(var(--text-primary))]">
                        Default Platform Currency
                      </label>
                      <select
                        value={defaultCurrency}
                        onChange={(e) => setDefaultCurrency(e.target.value)}
                        className="w-full border rounded-xl px-3 py-2.5 outline-none text-xs sm:text-sm font-medium bg-[hsl(var(--bg-card))] border-[hsl(var(--border-color))] text-[hsl(var(--text-primary))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] transition-all shadow-xs h-11"
                      >
                        <option value="USD">USD ($) - United States Dollar</option>
                        <option value="EUR">EUR (€) - Eurozone</option>
                        <option value="GBP">GBP (£) - British Pound</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1.5 font-semibold text-[hsl(var(--text-primary))]">
                        Display Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full border rounded-xl px-3 py-2.5 outline-none text-xs sm:text-sm font-medium bg-[hsl(var(--bg-card))] border-[hsl(var(--border-color))] text-[hsl(var(--text-primary))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] transition-all shadow-xs h-11"
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="EST">EST (Eastern Standard Time / America/New_York)</option>
                        <option value="PST">PST (Pacific Standard Time / America/Los_Angeles)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Database & Ingestion Engine Card */}
                <div className="p-5 bg-[hsl(var(--bg-card-hover))] border border-[hsl(var(--border-color))] rounded-2xl space-y-4 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                      <Database className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[hsl(var(--text-primary))]">
                      Database & Ingestion Engine
                    </h3>
                  </div>
                  <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed">
                    Automated high-throughput CSV lot ingestion pipelines, vector embeddings, and MongoDB document indexing active.
                  </p>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-semibold rounded-lg bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Engine v3.1 Operational
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex justify-end pt-5 border-t border-[hsl(var(--border-color))]">
                <button
                  type="button"
                  onClick={handleSaveSystem}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-dark))] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-[hsl(var(--primary)/0.25)] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save System Defaults</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
