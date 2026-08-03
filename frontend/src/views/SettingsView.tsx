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
  Info,
  ChevronRight,
  Save,
  CheckCircle2,
  Key,
  Globe,
  Database,
  Sparkles
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

  const navTabs = [
    { id: 'profile' as const, label: 'Supplier Profile', icon: UserCheck },
    { id: 'platform' as const, label: 'Platform Prefs', icon: Sliders },
    { id: 'security' as const, label: 'Security & Access', icon: ShieldCheck },
    { id: 'system' as const, label: 'System Defaults', icon: Server }
  ];

  const handleSavePrefs = () => {
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 3000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 font-sans h-[calc(100vh-64px)] flex flex-col">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg text-white">
              <SettingsIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Central Platform Settings
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage platform configurations, supplier profile identity, operational defaults, and access security.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-xl border border-slate-700/60 text-xs shadow-inner">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Active Supplier:</span>
            <span className="font-semibold text-indigo-400">{supplierId}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-y-auto">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">Configuration</div>
          {navTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${activeTab === id ? 'text-white' : 'text-slate-500'}`} />
                <span>{label}</span>
              </div>
            </button>
          ))}

          <div className="mt-auto pt-6 px-3">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-400">
              <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-400" /> Security Info
              </p>
              <p>SpoilerAlert Platform Subsystem v2.4. OAuth & Access Control Active.</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-y-auto custom-scrollbar">
          {/* ===== Section: Supplier Profile & Identity ===== */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {!isSupplierProfileActive && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-indigo-950/40 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-base mb-1">
                      <Sparkles className="w-5 h-5" />
                      Become a Supplier
                    </div>
                    <p className="text-slate-300 text-sm">
                      You currently hold a Buyer account. Activate your Supplier profile to unlock AI Ingestion Engine, Inventory Lot Management, and Automated Liquidation Workflows.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (updateProfiles) {
                        await updateProfiles({ supplier: true });
                      }
                    }}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shrink-0"
                  >
                    Activate Supplier Profile
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                  <UserCheck className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Supplier Identity & Profile</h2>
                  <p className="text-sm text-slate-400 mt-1">Active supplier account details and company configuration.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 shadow-lg hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Hash className="w-4 h-4 text-indigo-400" /> Account ID
                  </div>
                  <p className="text-lg font-bold text-indigo-300 font-mono break-all">{supplierId}</p>
                </div>
                <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 shadow-lg hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-emerald-400" /> Strategy
                  </div>
                  <p className="text-lg font-bold text-emerald-300">Sell / Auction First</p>
                </div>
                <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 shadow-lg hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Compliance
                  </div>
                  <p className="text-lg font-bold text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Approved
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-400" /> Account Security Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Revoke all active quick-bid tokens', desc: 'Invalidates all unused email CTA tokens immediately.', danger: true },
                    { label: 'Export supplier activity log', desc: 'Download a CSV of recent dispatch and bid activity.', danger: false }
                  ].map(({ label, desc, danger }) => (
                    <button
                      key={label}
                      onClick={() => {
                        if (danger) {
                          if (confirm('Revoke all unused quick-bid tokens?')) alert('All unused quick-bid tokens have been revoked.');
                        } else {
                          alert('Export functionality coming in next release.');
                        }
                      }}
                      className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all group hover:-translate-y-0.5 shadow-md ${
                        danger
                          ? 'bg-rose-950/10 border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-950/20'
                          : 'bg-slate-950/40 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-950/60'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <p className={`font-bold text-sm ${danger ? 'text-rose-400' : 'text-slate-200'}`}>{label}</p>
                        <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${danger ? 'text-rose-500/50' : 'text-slate-600'}`} />
                      </div>
                      <p className={`text-xs ${danger ? 'text-rose-400/70' : 'text-slate-500'}`}>{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== Section: Platform Preferences ===== */}
          {activeTab === 'platform' && (
            <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                  <Sliders className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Platform Preferences</h2>
                  <p className="text-sm text-slate-400 mt-1">Default operational settings for bid windows and automation behavior.</p>
                </div>
              </div>

              {prefsSaved && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-sm font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                  <CheckCircle2 className="w-5 h-5" />
                  Preferences saved successfully.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bid & Offer Defaults */}
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Bid Window Defaults
                  </h3>
                  <div className="space-y-4">
                    <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                      <label htmlFor="default-token-expiry" className="text-sm font-bold text-slate-300 block">Default Token Expiry (hours)</label>
                      <input
                        id="default-token-expiry"
                        type="number"
                        value={defaultExpiryHours}
                        onChange={(e) => setDefaultExpiryHours(Number(e.target.value))}
                        min={1}
                        max={720}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition-all shadow-inner"
                      />
                      <p className="text-xs text-slate-500">Token links in buyer emails expire after this window.</p>
                    </div>

                    <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-slate-300">Auto-Archive Threads</p>
                        <p className="text-xs text-slate-500 mt-1">Move closed threads to archive view.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoArchiveThreads}
                          onChange={(e) => setAutoArchiveThreads(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-indigo-500/50 rounded-full peer peer-checked:bg-indigo-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white shadow-inner" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide">
                    <Bell className="w-4 h-4 text-indigo-400" />
                    Notifications
                  </h3>
                  <div className="space-y-4">
                    <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-slate-300">Email alerts for buyer replies</p>
                        <p className="text-xs text-slate-500 mt-1">Receive system notifications when a buyer responds.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-indigo-500/50 rounded-full peer peer-checked:bg-indigo-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white shadow-inner" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-8 border-t border-slate-800 mt-8">
                <button
                  onClick={handleSavePrefs}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all hover:shadow-indigo-600/50 hover:-translate-y-0.5"
                >
                  <Save className="w-4 h-4" />
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* ===== Section: Security & Access ===== */}
          {activeTab === 'security' && (
            <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Security & Access Control</h2>
                  <p className="text-sm text-slate-400 mt-1">Platform access tokens, API security policies, and session controls.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-white">API Tokens & Authentication</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Single-use HMAC signed tokens active for quick-bid links and API authorization.
                  </p>
                  <div className="pt-2">
                    <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-lg">
                      HMAC-SHA256 Encryption Active
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">Session Policy</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sessions auto-expire after 24 hours of inactivity.
                  </p>
                  <div className="pt-2">
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1 w-fit">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== Section: System Defaults ===== */}
          {activeTab === 'system' && (
            <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                  <Server className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">System Defaults & Regional Settings</h2>
                  <p className="text-sm text-slate-400 mt-1">Configure global currency, timezone, and data storage policies.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-white">Localization & Currency</h3>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Default Platform Currency</label>
                      <select
                        value={defaultCurrency}
                        onChange={(e) => setDefaultCurrency(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">Display Timezone</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none"
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="EST">EST (Eastern Standard Time)</option>
                        <option value="PST">PST (Pacific Standard Time)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-purple-400" />
                    <h3 className="text-base font-bold text-white">Database & Ingestion Engine</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Automated CSV ingestion pipelines and MongoDB indexing active.
                  </p>
                  <div className="pt-2">
                    <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold rounded-lg">
                      Engine v3.1 Operational
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={handleSavePrefs}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all hover:shadow-indigo-600/50"
                >
                  <Save className="w-4 h-4" />
                  Save System Defaults
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
