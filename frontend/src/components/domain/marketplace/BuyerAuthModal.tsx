import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectIsAuthModalOpen,
  selectAuthModalMode,
  selectAuthLoading,
  selectAuthError,
  closeAuthModal,
  sendBuyerVerificationThunk,
  verifyBuyerTokenThunk,
} from '../../../store/slices/authSlice';
import type { AppDispatch } from '../../../store/index';

export const BuyerAuthModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isOpen = useSelector(selectIsAuthModalOpen);
  const mode = useSelector(selectAuthModalMode);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [token, setToken] = useState('');
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setSentNotice(null);
    if (!email) return;

    const resultAction = await dispatch(sendBuyerVerificationThunk({ email, companyName }));
    if (sendBuyerVerificationThunk.fulfilled.match(resultAction)) {
      const devOtp = resultAction.payload.devOtp;
      if (devOtp) {
        setSentNotice(`[Dev Mode] Verification code generated: ${devOtp}`);
      }
    }
  };

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token) return;
    await dispatch(verifyBuyerTokenThunk({ email, token }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">
              Buyer Authentication & Verification
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify your business email to unlock marketplace bidding
            </p>
          </div>
          <button
            onClick={() => dispatch(closeAuthModal())}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {error}
            </div>
          )}

          {sentNotice && (
            <div className="p-3 text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
              {sentNotice}
            </div>
          )}

          {mode !== 'verify' ? (
            <form onSubmit={handleSendToken} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Business Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="buyer@company.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Company / Business Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company / Business Name"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending Verification...' : 'Send Verification Code'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyToken} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Enter 6-Digit OTP / Verification Token
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-center text-lg font-mono tracking-widest text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Verifying...' : 'Verify & Log In'}
                </button>

                <button
                  type="button"
                  onClick={() => dispatch(sendBuyerVerificationThunk({ email, companyName }))}
                  className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Resend Verification Code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerAuthModal;
