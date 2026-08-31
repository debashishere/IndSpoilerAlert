import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { 
  DollarSign, 
  Package, 
  CheckCircle2, 
  XCircle, 
  Send, 
  RefreshCw, 
  X,
  ShieldCheck,
  ShieldAlert,
  Clock,
  MapPin,
  Building2,
  Tag,
  ArrowRight,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { setBuyerAuth } from '../store/slices/authSlice';
import { setSelectedBuyerEmail } from '../store/slices/inventorySlice';
import { areBuyerEmailsMatching } from '../utils/emailValidation';

interface LotDetails {
  _id?: string;
  lotNumber?: string;
  availableQty?: number;
  totalCases?: number;
  costPerCase?: number;
  standardSellPrice?: number;
  expirationDate?: string | Date;
  remainingShelfLife?: number;
  status?: string;
  product?: {
    description?: string;
    sku?: string;
    brand?: string;
    category?: string;
    imageUrl?: string;
    allergens?: string[];
    certifications?: string[];
  } | null;
  warehouse?: string;
}

interface QuickBidModalProps {
  token: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

export const QuickBidModal: React.FC<QuickBidModalProps> = ({ token, onClose, onSuccess }) => {
  let dispatch: any = null;
  try {
    dispatch = useDispatch();
  } catch {}

  let auth: any = null;
  try {
    auth = useAuth();
  } catch {}

  const currentUserEmail = auth?.user?.email;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  // Quick bid data
  const [buyerEmail, setBuyerEmail] = useState('');
  const [listingId, setListingId] = useState('');
  const [supplierName, setSupplierName] = useState('IndSpoiler Alert Operations');
  const [lotDetails, setLotDetails] = useState<LotDetails | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [cases, setCases] = useState<number>(100);

  // Check account mismatch (supports base email and sub-email aliases)
  const isAccountMismatch = Boolean(
    currentUserEmail &&
    buyerEmail &&
    !areBuyerEmailsMatching(currentUserEmail, buyerEmail)
  );

  useEffect(() => {
    fetchTokenInfo();
  }, [token]);

  /** Strip quick-bid token params from the browser URL without triggering a navigation */
  const cleanTokenFromUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    url.searchParams.delete('quickBidToken');
    window.history.replaceState({}, document.title, url.pathname + (url.search !== '?' ? url.search : ''));
  };

  const fetchTokenInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bids/quick-bid-info?token=${token}`);
      const data = await res.json();
      if (res.ok) {
        setBuyerEmail(data.buyerEmail);
        setListingId(data.listingId);
        if (data.supplierName) setSupplierName(data.supplierName);
        if (data.lot) {
          setLotDetails(data.lot);
          if (data.lot.availableQty) {
            setCases(Math.min(100, data.lot.availableQty));
          }
        }
        setAmount(data.defaultAmount || 15.00);

        // Only sync buyer context with Redux if there's no mismatch with active user
        const activeUserEmail = auth?.user?.email;
        const mismatch = Boolean(
          activeUserEmail &&
          data.buyerEmail &&
          !areBuyerEmailsMatching(activeUserEmail, data.buyerEmail)
        );

        if (!mismatch && dispatch && data.buyerEmail) {
          dispatch(setSelectedBuyerEmail(data.buyerEmail));
          dispatch(setBuyerAuth({
            buyer: {
              id: data.buyerEmail,
              email: data.buyerEmail,
              companyName: data.buyerEmail.split('@')[0],
              isVerified: true,
            },
            token: token,
          }));
        }
      } else {
        setError(data.error || 'Invalid or expired quick bid token.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quick bid details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    // Mark switching state first — the UI will render an explicit login prompt
    setIsSwitchingAccount(true);
    if (auth?.logout) {
      await auth.logout();
    }
    // URL cleanup so the token doesn't persist after the account switch flow
    cleanTokenFromUrl();
  };

  const handleClose = () => {
    cleanTokenFromUrl();
    if (onClose) onClose();
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAccountMismatch) {
      setError(`Cannot place bid: Logged in as ${currentUserEmail}, but this offer was sent to ${buyerEmail}.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (auth?.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }

      const res = await fetch('/api/bids/quick-submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          token,
          amount,
          cases,
          activeBuyerEmail: currentUserEmail || buyerEmail
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        // Strip token from URL on successful submission
        cleanTokenFromUrl();
        if (onSuccess) onSuccess();
      } else {
        setError(data.error || 'Failed to submit quick bid.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error submitting bid.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRSL = (rsl?: number) => {
    if (rsl === undefined || rsl === null) return 'Active';
    const pct = Math.round(rsl > 1 ? rsl : rsl * 100);
    return `${pct}% RSL`;
  };

  const getRSLBadgeColor = (rsl?: number) => {
    if (rsl === undefined || rsl === null) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    const pct = rsl > 1 ? rsl : rsl * 100;
    if (pct >= 70) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    if (pct >= 40) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
  };

  const totalOfferValue = (amount * cases).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden text-slate-900 dark:text-slate-100 font-sans my-8">
        {onClose && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 dark:text-emerald-400 mx-auto" />
            <p className="text-xs text-slate-600 dark:text-slate-400">Verifying signed quick-bid token...</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto">
              <XCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick-Bid Token Expired or Invalid</h3>
              <p className="text-xs text-rose-600 dark:text-rose-300 max-w-sm mx-auto leading-relaxed">{error}</p>
            </div>
            {onClose && (
              <button
                onClick={handleClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Go to Public Marketplace
              </button>
            )}
          </div>
        ) : isAccountMismatch ? (
          isSwitchingAccount ? (
            /* Post-logout: explicit login prompt — blocks unauthenticated guest submission */
            <div className="py-10 text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <LogOut className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold uppercase tracking-wider">
                  Authentication Required
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Sign In to Continue</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  This private bid offer was issued exclusively to{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{buyerEmail}</strong>.
                  Please log in with that account to place your bid.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-left max-w-md mx-auto text-xs text-slate-500 dark:text-slate-400">
                  <p className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>
                      Your session has been cleared. Please authenticate as{' '}
                      <strong>{buyerEmail}</strong> and re-open the bid link.
                    </span>
                  </p>
                </div>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  Close
                </button>
              )}
            </div>
          ) : (
            /* Original mismatch warning — user hasn't clicked Switch Account yet */
            <div className="py-8 text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">
                  Account Mismatch Detected
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Account Mismatch</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  This private bid offer was issued to <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{buyerEmail}</strong>, but you are currently signed in as <strong className="text-slate-800 dark:text-slate-200 font-semibold">{currentUserEmail}</strong>.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-left max-w-md mx-auto text-xs text-slate-500 dark:text-slate-400">
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>To place this bid, please switch accounts and log in with <strong>{buyerEmail}</strong>.</span>
                  </p>
                </div>
              </div>
              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Switch Account</span>
                </button>
                {onClose && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )
        ) : success ? (
          <div className="py-10 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                Private Offer Logged
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Bid Submitted Successfully!</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                Your bid offer of <strong className="text-emerald-600 dark:text-emerald-400 font-bold">${amount.toFixed(2)}/case</strong> for listing #{listingId} ({cases} cases • Total: ${totalOfferValue}) has been logged for <strong className="text-slate-800 dark:text-slate-200">{buyerEmail}</strong>.
              </p>
            </div>
            {onClose && (
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                >
                  <span>Explore Buyer Marketplace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmitBid} className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3.5 border-b border-slate-200 dark:border-slate-800 pb-4 pr-8">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-500/20 mt-0.5">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">1-Click Buyer Quick Bid</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Private Workflow Allocation
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate">
                  <span>Authenticated via signed email token •</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-semibold">{buyerEmail}</strong>
                </p>
              </div>
            </div>

            {/* Inventory Bid Card View */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{supplierName}</span>
                    <span>•</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">Listing #{listingId}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {lotDetails?.product?.description || lotDetails?.product?.brand || 'Surplus Liquidation Inventory Lot'}
                  </h4>
                  {lotDetails?.product?.sku && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                      SKU: {lotDetails.product.sku}
                    </span>
                  )}
                </div>

                {lotDetails?.remainingShelfLife !== undefined && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 whitespace-nowrap ${getRSLBadgeColor(lotDetails.remainingShelfLife)}`}>
                    <Clock className="w-3 h-3" />
                    {formatRSL(lotDetails.remainingShelfLife)}
                  </span>
                )}
              </div>

              {/* Spec Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Available</span>
                    <span className="font-bold text-slate-900 dark:text-white">{lotDetails?.availableQty || 500} cs</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Standard</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ${lotDetails?.standardSellPrice ? lotDetails.standardSellPrice.toFixed(2) : '20.00'}/cs
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2 col-span-2 sm:col-span-1">
                  <MapPin className="w-4 h-4 text-purple-500 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-500 uppercase block">Location</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">{lotDetails?.warehouse || 'Midwest DC'}</span>
                  </div>
                </div>
              </div>

              {lotDetails?.product?.allergens && lotDetails.product.allergens.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-slate-500 font-medium">Allergens:</span>
                  {lotDetails.product.allergens.map((a: string) => (
                    <span key={a} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Form Inputs */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bid Offer Price per Case ($)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500 font-bold text-sm">$</span>
                  <input
                    type="number"
                    step="0.25"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quantity of Cases Desired</label>
                <div className="relative">
                  <Package className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
                  <input
                    type="number"
                    required
                    min={1}
                    max={lotDetails?.availableQty || 10000}
                    value={cases}
                    onChange={(e) => setCases(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div className="p-3 bg-indigo-500/5 dark:bg-indigo-950/20 rounded-xl border border-indigo-500/20 flex items-center justify-between text-xs">
                <div className="text-slate-600 dark:text-slate-400">
                  <span>Calculated Total Commitment:</span>
                  <div className="text-[11px] text-slate-500">
                    {cases} cases × ${amount.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                    ${totalOfferValue}
                  </span>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Private Allocation</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              {onClose && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting || amount <= 0 || cases <= 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Confirm & Submit Bid</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
