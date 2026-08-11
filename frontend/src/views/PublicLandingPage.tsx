import React, { useState } from 'react';
import {
  ArrowRight,
  Boxes,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Star,
} from 'lucide-react';
import CentralAuthModal from '../components/auth/CentralAuthModal';

interface PublicLandingPageProps {
  onAuthenticated?: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onAuthenticated }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('signup');

  const openAuthModal = (mode: 'login' | 'signup' = 'signup') => {
    setAuthInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white flex flex-col">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Boxes className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                IndSpoiler<span className="text-emerald-400">Alert</span>
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Enterprise
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#inventory-flow" className="hover:text-emerald-400 transition-colors">
              InventoryFlow
            </a>
            <a href="#ind-spoiler-alert" className="hover:text-emerald-400 transition-colors">
              IndSpoilerAlert
            </a>
            <a href="#social-proof" className="hover:text-emerald-400 transition-colors">
              Customers & Impact
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => openAuthModal('login')}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuthModal('signup')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-md shadow-emerald-500/20 hover:scale-[1.02]"
            >
              Get Started / Enter Platform
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Modern Gradient Hero Section */}
        <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-800/50">
          {/* Background Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-transparent blur-[120px] pointer-events-none rounded-full" />
          <div className="absolute bottom-0 right-10 w-[400px] h-[300px] bg-cyan-500/10 blur-[100px] pointer-events-none rounded-full" />

          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-emerald-400 text-xs font-semibold mb-8 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Enterprise Food Supply Chain Engine</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
              Eliminate Waste.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Maximize Recovery.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
              Unifying AI warehouse ingestion, automated FSMA compliance logs, dynamic secondary marketplace auctions, and tax-exempt food bank donations under one unified platform.
            </p>

            {/* Single Launch CTA */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => openAuthModal('signup')}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Get Started / Enter Platform</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center space-x-6 text-xs text-slate-400 font-medium">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Instant Dual-Profile Access</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>FSMA 204 Compliant</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Infrastructure Lock-in</span>
              </div>
            </div>
          </div>
        </section>

        {/* Product Showcase Section */}
        <section id="inventory-flow" className="py-24 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Complete Dual-System Architecture
            </h2>
            <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
              From real-time warehouse receiving to secondary liquidation, manage your entire food lifecycle seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* InventoryFlow Showcase Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Boxes className="w-6 h-6" />
                </div>
                <div className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  Upstream Logistics & AI Ingestion
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">InventoryFlow</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Automate inbound receiving with AI document OCR, ensure strict cold-chain compliance, and track shelf-life expiration risks before shrinkage occurs.
                </p>

                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Warehouse AI Ingestion</span>
                      <p className="text-slate-400 text-xs mt-0.5">Parse bill-of-lading documents, pallet tags, and lot codes instantly with zero manual entry.</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">FSMA Temp Logs</span>
                      <p className="text-slate-400 text-xs mt-0.5">Automated temperature monitoring & audit-ready FSMA Section 204 compliance reports.</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Expiration Tracking</span>
                      <p className="text-slate-400 text-xs mt-0.5">Proactive shelf-life decay modeling with automated alert triggers for short-dated stock.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* IndSpoilerAlert Showcase Card */}
            <div id="ind-spoiler-alert" className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl hover:border-teal-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="inline-block text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
                  Downstream Liquidation & Impact
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">IndSpoilerAlert</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Liquidate surplus food inventory directly to verified buyers or orchestrate automated food bank donations for full tax write-offs.
                </p>

                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Secondary Marketplace</span>
                      <p className="text-slate-400 text-xs mt-0.5">Connect CPG manufacturers directly with secondary buyers, discount grocers, and processors.</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Liquidation Automations</span>
                      <p className="text-slate-400 text-xs mt-0.5">Set rule-based workflows to auto-list surplus stock based on remaining days to expiration.</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Food Bank Donations</span>
                      <p className="text-slate-400 text-xs mt-0.5">Automated non-profit routing, tax receipt generation, and zero-landfill tracking.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Social Proof & Reviews Grid */}
        <section id="social-proof" className="py-20 bg-slate-900/30 border-t border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Trusted Across the Supply Chain
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white mt-2 sm:text-4xl">
                Verified Customer Testimonials
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Unilever */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-center space-x-1 text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm italic mb-6">
                    &ldquo;InventoryFlow reduced our warehouse intake verification time by 75% while keeping our cold-chain FSMA compliance immaculate.&rdquo;
                  </p>
                </div>
                <div className="border-t border-slate-800/80 pt-4">
                  <div className="font-bold text-white text-sm">Unilever</div>
                  <div className="text-xs text-slate-400">Enterprise CPG Supplier</div>
                </div>
              </div>

              {/* Kraft Heinz */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-center space-x-1 text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm italic mb-6">
                    &ldquo;IndSpoilerAlert's liquidation automations helped us recover over $4.2M in short-dated inventory value in our first two quarters.&rdquo;
                  </p>
                </div>
                <div className="border-t border-slate-800/80 pt-4">
                  <div className="font-bold text-white text-sm">Kraft Heinz</div>
                  <div className="text-xs text-slate-400">Global Food & Beverage Manufacturer</div>
                </div>
              </div>

              {/* Grocery Outlet */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-center space-x-1 text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm italic mb-6">
                    &ldquo;Sourcing premium surplus stock through the secondary marketplace is seamless, reliable, and backed by complete quality logs.&rdquo;
                  </p>
                </div>
                <div className="border-t border-slate-800/80 pt-4">
                  <div className="font-bold text-white text-sm">Grocery Outlet</div>
                  <div className="text-xs text-slate-400">Retail Discount Supermarket</div>
                </div>
              </div>

              {/* Misfits Market */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-center space-x-1 text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm italic mb-6">
                    &ldquo;Combining automated food bank donations with quick secondary auctions gives us full sustainability and maximum margin recovery.&rdquo;
                  </p>
                </div>
                <div className="border-t border-slate-800/80 pt-4">
                  <div className="font-bold text-white text-sm">Misfits Market</div>
                  <div className="text-xs text-slate-400">Direct-to-Consumer Surplus Retailer</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>&copy; {new Date().getFullYear()} IndSpoilerAlert Inc. All rights reserved.</div>
          <div className="flex items-center space-x-6">
            <span>FSMA 204 Compliant</span>
            <span>Enterprise Security</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </footer>

      {/* Interactive Central Auth Modal Overlay */}
      {isAuthModalOpen && (
        <CentralAuthModal
          isOpen={isAuthModalOpen}
          initialMode={authInitialMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            setIsAuthModalOpen(false);
            if (onAuthenticated) onAuthenticated();
          }}
        />
      )}
    </div>
  );
};

export default PublicLandingPage;
