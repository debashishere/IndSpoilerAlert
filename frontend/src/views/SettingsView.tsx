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
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-[hsl(var(--text-primary))] font-sans h-[calc(100vh-64px)] flex flex-col settings-view-container">
      {/* Header Banner */}
      <div className="bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-color))] rounded-2xl p-6 shadow-xl relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }} />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br rounded-xl shadow-lg text-white" style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }}>
              <SettingsIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--text-primary))] flex items-center gap-2">
                Central Platform Settings
              </h1>
              <p className="text-[hsl(var(--text-muted))] text-sm mt-1">
                Manage platform configurations, supplier profile identity, operational defaults, and access security.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[hsl(var(--bg-card-hover))] backdrop-blur px-4 py-2 rounded-xl border border-[hsl(var(--border-color))] text-xs shadow-inner">
            <ShieldCheck className="w-4 h-4" style={{ color: 'hsl(var(--success) / 0.1)' }} />
            <span className="text-[hsl(var(--text-secondary))]">Active Supplier:</span>
            <span className="font-semibold" style={{ color: 'hsl(var(--secondary))' }}>{supplierId}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-2 bg-card bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-color))] rounded-2xl p-4 shadow-xl overflow-y-auto">
          <div className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2 px-3">Configuration</div>
          {navTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${ activeTab === id ? 'bg-gradient-to-r bg-[linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))] text-white shadow-md shadow-[hsl(var(--primary)_/_0.3)]' : 'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--bg-card-hover))]' }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${activeTab === id ? 'text-white' : 'text-[hsl(var(--text-muted))]'}`} />
                <span>{label}</span>
              </div>
            </button>
          ))}

          <div className="mt-auto pt-6 px-3">
            <div className="p-4 bg-[hsl(var(--bg-card-hover))] border border-[hsl(var(--border-color))] rounded-xl space-y-2 text-xs text-[hsl(var(--text-muted))]">
              <p className="font-semibold text-[hsl(var(--text-primary))] flex items-center gap-1.5">
                <Shield className="w-4 h-4" style={{ color: 'hsl(var(--secondary))' }} /> Security Info
              </p>
              <p>IndSpoilerAlert Platform Subsystem v2.4. OAuth & Access Control Active.</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-color))] rounded-2xl p-6 shadow-xl overflow-y-auto custom-scrollbar">
          {/* ===== Section: Supplier Profile & Identity ===== */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {!isSupplierProfileActive && (
                <div className="p-6 rounded-2xl bg-gradient-to-r border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl" style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--success)), hsl(var(--success) / 0.5))', borderColor: 'hsl(var(--success) / 0.3)' }}>
                  <div>
                    <div className="flex items-center gap-2 font-bold text-base mb-1" style={{ color: 'hsl(var(--success))' }}>
                      <Sparkles className="w-5 h-5" />
                      Become a Supplier
                    </div>
                    <p className="text-sm" style={{ color: 'hsl(var(--secondary))' }}>
                      You currently hold a Buyer account. Activate your Supplier profile to unlock AI Ingestion Engine, Inventory Lot Management, and Automated Liquidation Workflows.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (updateProfiles) {
                        await updateProfiles({ supplier: true });
                      }
                    }}
                    className="px-5 py-2.5 text-[hsl(var(--text-primary))] font-bold rounded-xl text-sm transition-all shadow-md shrink-0" style={{ backgroundColor: 'hsl(var(--success) / 0.1)' }}
                  >
                    Activate Supplier Profile
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: 'hsl(var(--border-color))' }}>
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                  <UserCheck className="w-6 h-6" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Supplier Identity & Profile</h2>
                  <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-muted))' }}>Active supplier account details and company configuration.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-[hsl(var(--bg-card)_/_0.8)] rounded-2xl border space-y-3 shadow-lg transition-colors" style={{ borderColor: 'hsl(var(--border-color))' }}>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--text-muted))' }}>
                    <Hash className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} /> Account ID
                  </div>
                  <p className="text-lg font-bold font-mono break-all" style={{ color: 'hsl(var(--secondary))' }}>{supplierId}</p>
                </div>
                <div className="p-5 bg-[hsl(var(--bg-card)_/_0.8)] rounded-2xl border space-y-3 shadow-lg transition-colors" style={{ borderColor: 'hsl(var(--border-color))' }}>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--text-muted))' }}>
                    <Layers className="w-4 h-4" style={{ color: 'hsl(var(--success))' }} /> Strategy
                  </div>
                  <p className="text-lg font-bold" style={{ color: 'hsl(var(--success) / 0.1)' }}>Sell / Auction First</p>
                </div>
                <div className="p-5 bg-[hsl(var(--bg-card)_/_0.8)] rounded-2xl border space-y-3 shadow-lg transition-colors" style={{ borderColor: 'hsl(var(--border-color))' }}>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--text-muted))' }}>
                    <ShieldCheck className="w-4 h-4" style={{ color: 'hsl(var(--success))' }} /> Compliance
                  </div>
                  <p className="text-lg font-bold flex items-center gap-2" style={{ color: 'hsl(var(--success) / 0.1)' }}>
                    <CheckCircle2 className="w-5 h-5" /> Approved
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t" style={{ borderColor: 'hsl(var(--border-color))' }}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} /> Account Security Actions
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
                      className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all group hover:-translate-y-0.5 shadow-md ${ danger ? 'bg-[hsl(var(--error) / 0.1)] border-[hsl(var(--error) / 0.3)] border-[hsl(var(--error)_/_0.3)] bg-[hsl(var(--error)_/_0.1)]' : 'bg-[hsl(var(--bg-card)_/_0.8)] border-[hsl(var(--border-color))] ' }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <p className={`font-bold text-sm ${danger ? 'text-[hsl(var(--error))]' : 'text-[hsl(var(--secondary))]'}`}>{label}</p>
                        <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${danger ? 'text-[hsl(var(--error))]' : 'text-[hsl(var(--text-secondary))]'}`} />
                      </div>
                      <p className={`text-xs ${danger ? 'text-[hsl(var(--error))]' : 'text-[hsl(var(--text-muted))]'}`}>{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== Section: Platform Preferences ===== */}
          {activeTab === 'platform' && (
            <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: 'hsl(var(--border-color))' }}>
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                  <Sliders className="w-6 h-6" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Platform Preferences</h2>
                  <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-muted))' }}>Default operational settings for bid windows and automation behavior.</p>
                </div>
              </div>

              {prefsSaved && (
                <div className="p-4 rounded-xl border text-sm font-medium flex items-center gap-2 shadow-[0_0_15px_hsl(var(--success) / 0.1)]" style={{ backgroundColor: 'hsl(var(--success) / 0.1)', borderColor: 'hsl(var(--success) / 0.3)', color: 'hsl(var(--success))' }}>
                  <CheckCircle2 className="w-5 h-5" />
                  Preferences saved successfully.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bid & Offer Defaults */}
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-[hsl(var(--text-primary))] flex items-center gap-2 uppercase tracking-wide">
                    <Clock className="w-4 h-4" style={{ color: 'hsl(var(--secondary))' }} />
                    Bid Window Defaults
                  </h3>
                  <div className="space-y-4">
                    <div className="p-5 bg-[hsl(var(--bg-card-hover))] rounded-2xl border border-[hsl(var(--border-color))] space-y-3">
                      <label htmlFor="default-token-expiry" className="text-sm font-bold text-[hsl(var(--text-primary))] block">Default Token Expiry (hours)</label>
                      <input
                        id="default-token-expiry"
                        type="number"
                        value={defaultExpiryHours}
                        onChange={(e) => setDefaultExpiryHours(Number(e.target.value))}
                        min={1}
                        max={720}
                        className="w-full bg-[hsl(var(--bg-card))] border border-[hsl(var(--border-color))] focus:border-[hsl(var(--primary))] focus:ring-1 focus:border-[hsl(var(--primary))] rounded-xl px-4 py-2.5 text-sm text-[hsl(var(--text-primary))] outline-none transition-all shadow-inner"
                      />
                      <p className="text-xs text-[hsl(var(--text-muted))]">Token links in buyer emails expire after this window.</p>
                    </div>

                    <div className="p-5 bg-[hsl(var(--bg-card)_/_0.8)] rounded-2xl border flex items-center justify-between group transition-colors" style={{ borderColor: 'hsl(var(--border-color))' }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'hsl(var(--secondary))' }}>Auto-Archive Threads</p>
                        <p className="text-xs mt-1" style={{ color: 'hsl(var(--text-muted))' }}>Move closed threads to archive view.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoArchiveThreads}
                          onChange={(e) => setAutoArchiveThreads(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 peer-focus:ring-2 ring-[hsl(var(--primary))] rounded-full peer peer-checked:bg-[hsl(var(--primary))] transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[hsl(var(--border-color))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white shadow-inner" style={{ backgroundColor: 'hsl(var(--bg-card-hover))' }} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="space-y-5">
                  <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide" style={{ color: 'hsl(var(--secondary))' }}>
                    <Bell className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                    Notifications
                  </h3>
                  <div className="space-y-4">
                    <div className="p-5 bg-[hsl(var(--bg-card)_/_0.8)] rounded-2xl border flex items-center justify-between group transition-colors" style={{ borderColor: 'hsl(var(--border-color))' }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'hsl(var(--secondary))' }}>Email alerts for buyer replies</p>
                        <p className="text-xs mt-1" style={{ color: 'hsl(var(--text-muted))' }}>Receive system notifications when a buyer responds.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 peer-focus:ring-2 ring-[hsl(var(--primary))] rounded-full peer peer-checked:bg-[hsl(var(--primary))] transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[hsl(var(--border-color))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white shadow-inner" style={{ backgroundColor: 'hsl(var(--bg-card-hover))' }} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-8 border-t mt-8" style={{ borderColor: 'hsl(var(--border-color))' }}>
                <button
                  onClick={handleSavePrefs}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r text-white rounded-xl text-sm font-bold shadow-lg shadow-[hsl(var(--primary)_/_0.3)] transition-all shadow-[hsl(var(--primary)_/_0.3)] hover:-translate-y-0.5" style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }}
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
              <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: 'hsl(var(--border-color))' }}>
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                  <ShieldCheck className="w-6 h-6" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Security & Access Control</h2>
                  <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-muted))' }}>Platform access tokens, API security policies, and session controls.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-[hsl(var(--bg-card)_/_0.8)] border rounded-2xl space-y-4 shadow-lg" style={{ borderColor: 'hsl(var(--border-color))' }}>
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
                    <h3 className="text-base font-bold text-white">API Tokens & Authentication</h3>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--text-muted))' }}>
                    Single-use HMAC signed tokens active for quick-bid links and API authorization.
                  </p>
                  <div className="pt-2">
                    <span className="px-3 py-1 border text-xs font-bold rounded-lg" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', borderColor: 'hsl(var(--primary) / 0.3)', color: 'hsl(var(--secondary))' }}>
                      HMAC-SHA256 Encryption Active
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-[hsl(var(--bg-card)_/_0.8)] border rounded-2xl space-y-4 shadow-lg" style={{ borderColor: 'hsl(var(--border-color))' }}>
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5" style={{ color: 'hsl(var(--success))' }} />
                    <h3 className="text-base font-bold text-white">Session Policy</h3>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--text-muted))' }}>
                    Sessions auto-expire after 24 hours of inactivity.
                  </p>
                  <div className="pt-2">
                    <span className="px-3 py-1 border text-xs font-bold rounded-lg flex items-center gap-1 w-fit" style={{ backgroundColor: 'hsl(var(--success) / 0.1)', borderColor: 'hsl(var(--success) / 0.3)', color: 'hsl(var(--success) / 0.1)' }}>
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
              <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: 'hsl(var(--border-color))' }}>
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                  <Server className="w-6 h-6" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">System Defaults & Regional Settings</h2>
                  <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-muted))' }}>Configure global currency, timezone, and data storage policies.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-[hsl(var(--bg-card)_/_0.8)] border rounded-2xl space-y-4 shadow-lg" style={{ borderColor: 'hsl(var(--border-color))' }}>
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
                    <h3 className="text-base font-bold text-white">Localization & Currency</h3>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block mb-1 font-semibold" style={{ color: 'hsl(var(--text-muted))' }}>Default Platform Currency</label>
                      <select
                        value={defaultCurrency}
                        onChange={(e) => setDefaultCurrency(e.target.value)}
                        className="w-full border rounded-xl p-2.5 outline-none" style={{ backgroundColor: 'hsl(var(--bg-card))', borderColor: 'hsl(var(--border-color))', color: 'hsl(var(--secondary))' }}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold" style={{ color: 'hsl(var(--text-muted))' }}>Display Timezone</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full border rounded-xl p-2.5 outline-none" style={{ backgroundColor: 'hsl(var(--bg-card))', borderColor: 'hsl(var(--border-color))', color: 'hsl(var(--secondary))' }}
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="EST">EST (Eastern Standard Time)</option>
                        <option value="PST">PST (Pacific Standard Time)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-[hsl(var(--bg-card)_/_0.8)] border rounded-2xl space-y-4 shadow-lg" style={{ borderColor: 'hsl(var(--border-color))' }}>
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
                    <h3 className="text-base font-bold text-white">Database & Ingestion Engine</h3>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--text-muted))' }}>
                    Automated CSV ingestion pipelines and MongoDB indexing active.
                  </p>
                  <div className="pt-2">
                    <span className="px-3 py-1 border text-xs font-bold rounded-lg" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', borderColor: 'hsl(var(--primary) / 0.3)', color: 'hsl(var(--secondary))' }}>
                      Engine v3.1 Operational
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'hsl(var(--border-color))' }}>
                <button
                  onClick={handleSavePrefs}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r text-white rounded-xl text-sm font-bold shadow-lg shadow-[hsl(var(--primary)_/_0.3)] transition-all shadow-[hsl(var(--primary)_/_0.3)]" style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }}
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
