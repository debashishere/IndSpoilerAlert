import React, { useState } from 'react';
import { X, Mail, Lock, Check, ShieldCheck, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CentralAuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess?: () => void;
}

export const CentralAuthModal: React.FC<CentralAuthModalProps> = ({
  isOpen,
  initialMode = 'signup',
  onClose,
  onSuccess,
}) => {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Profile selections for signup
  const [isBuyer, setIsBuyer] = useState(true);
  const [isSupplier, setIsSupplier] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    if (mode === 'signup' && !isBuyer && !isSupplier) {
      setError('Please select at least one role (Buyer or Supplier).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        await signup(email, password, { buyer: isBuyer, supplier: isSupplier });
      } else {
        await login(email, password);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      aria-label="Central Auth Modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {mode === 'signup' ? 'Create Central Account' : 'Sign In to Platform'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {mode === 'signup'
              ? 'Join SpoilerAlert with single sign-on access to all modules.'
              : 'Enter your credentials to access your organization workspace.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center space-x-2 text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Dual Profile Initial Role Selection (Signup mode only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Initial Account Roles (Dual-Profile System)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsSupplier(!isSupplier)}
                  className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                    isSupplier
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-sm">CPG Supplier</span>
                    {isSupplier && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    InventoryFlow & Liquidation
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBuyer(!isBuyer)}
                  className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                    isBuyer
                      ? 'bg-teal-500/10 border-teal-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-sm">Retail Buyer</span>
                    {isBuyer && <Check className="w-4 h-4 text-teal-400" />}
                  </div>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    Secondary Bidding & Procurement
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Select one or both roles. You can toggle profiles anytime after sign up.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-lg text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 mt-2 disabled:opacity-50"
          >
            <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 border-t border-slate-800/80 pt-4 text-center text-xs text-slate-400">
          {mode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need a new account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Create One Now
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CentralAuthModal;
