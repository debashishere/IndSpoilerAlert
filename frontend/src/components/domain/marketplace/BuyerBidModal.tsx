import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  ShieldCheck,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  X,
  Mail,
  Building2,
  Lock,
  ArrowRight
} from 'lucide-react';
import {
  selectIsAuthenticated,
  selectBuyer,
  selectAuthLoading,
  sendBuyerVerificationThunk,
  verifyBuyerTokenThunk,
} from '../../../store/slices/authSlice';
import type { AppDispatch } from '../../../store/index';
import type { ListingItem } from '../../../views/marketplace/MarketplaceLandingView';

export interface BuyerBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: ListingItem | null;
  onSuccess?: () => void;
  apiBaseUrl?: string;
}

export const BuyerBidModal: React.FC<BuyerBidModalProps> = ({
  isOpen,
  onClose,
  listing,
  onSuccess,
  apiBaseUrl = 'http://localhost:5001/api/v1'
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentBuyer = useSelector(selectBuyer);
  const authLoading = useSelector(selectAuthLoading);

  const [quantity, setQuantity] = useState<number>(10);
  const [price, setPrice] = useState<number>(0);

  // Verification state for unauthenticated buyers
  const [email, setEmail] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [otpToken, setOtpToken] = useState<string>('');
  const [verificationSent, setVerificationSent] = useState<boolean>(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (listing) {
      setQuantity(Math.min(20, listing.availableQuantity));
      setPrice(listing.startingPrice || listing.publicPrice || 0);
    }
  }, [listing]);

  if (!isOpen || !listing) return null;

  const totalAmount = (quantity * price) || 0;

  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid business email address.');
      return;
    }

    try {
      const result = await dispatch(sendBuyerVerificationThunk({ email, companyName }));
      if (sendBuyerVerificationThunk.fulfilled.match(result)) {
        setVerificationSent(true);
        if (result.payload.devOtp) {
          setDevOtp(result.payload.devOtp);
        }
      } else {
        setErrorMsg('Failed to send verification code. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    }
  };

  const handleVerifyAndSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!otpToken) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setSubmitting(true);
      const verifyResult = await dispatch(verifyBuyerTokenThunk({ email, token: otpToken }));
      if (verifyBuyerTokenThunk.fulfilled.match(verifyResult)) {
        const buyerPayload = verifyResult.payload.buyer;
        await submitBidApi(buyerPayload?.email || email);
      } else {
        setErrorMsg('Invalid verification token. Please check the code and try again.');
        setSubmitting(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
      setSubmitting(false);
    }
  };

  const handleDirectSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!currentBuyer || !currentBuyer.email) {
      setErrorMsg('Buyer profile not available. Please verify email.');
      return;
    }
    await submitBidApi(currentBuyer.email);
  };

  const submitBidApi = async (buyerEmailStr: string) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`${apiBaseUrl}/marketplace/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing._id,
          buyerEmail: buyerEmailStr,
          quantity,
          price,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.message || 'Failed to submit bid');
      }

      setSuccessMsg('Bid successfully submitted! Supplier Lot Operations Hub notified.');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting bid');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Submit Marketplace Bid
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Target Product Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Marketplace Lot Listing
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
              {listing.publicTitle}
            </h4>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Available Stock: <strong className="text-slate-900 dark:text-slate-200">{listing.availableQuantity} cases</strong>
              </span>
              <span>
                Floor Price: <strong className="text-emerald-600 dark:text-emerald-400">${listing.publicPrice.toFixed(2)}/cs</strong>
              </span>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quantity and Price Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="case-quantity-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Case Quantity
              </label>
              <input
                id="case-quantity-input"
                type="number"
                min={1}
                max={listing.availableQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(listing.availableQuantity, parseInt(e.target.value) || 1)))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition font-medium"
              />
            </div>

            <div>
              <label htmlFor="bid-price-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Bid Price Per Case ($)
              </label>
              <input
                id="bid-price-input"
                type="number"
                step="0.05"
                min={0.1}
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition font-medium"
              />
            </div>
          </div>

          {/* Dynamic Total Bid Display Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 dark:from-emerald-950/40 to-cyan-50 dark:to-cyan-950/40 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-600 dark:text-slate-400 block font-medium">Calculated Total Bid Offer</span>
              <span className="text-[11px] text-slate-500">({quantity} cases × ${price.toFixed(2)}/cs)</span>
            </div>
            <div data-testid="total-bid-amount" className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              ${totalAmount.toFixed(2)}
            </div>
          </div>

          {/* Authentication & Verification Section */}
          {isAuthenticated && currentBuyer ? (
            /* Logged-In Verified Buyer State */
            <form onSubmit={handleDirectSubmitBid} className="space-y-4 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    {currentBuyer.companyName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {currentBuyer.companyName}
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px]">
                        Verified Buyer
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">{currentBuyer.email}</div>
                  </div>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{submitting ? 'Submitting Bid...' : 'Confirm & Submit Bid'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Unauthenticated Visitor Bidding Verification Flow */
            <div className="space-y-4 pt-1 border-t border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Buyer Verification & ADR 0006 Auto-Registration</span>
              </div>

              {!verificationSent ? (
                <form onSubmit={handleSendVerificationCode} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Business Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="buyer@company.com"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                      />
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Company / Retailer Name (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Metro Fresh Foods"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                      />
                      <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{authLoading ? 'Sending...' : 'Send Verification Code'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyAndSubmitBid} className="space-y-3">
                  {devOtp && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-mono">
                      [Dev Mode OTP]: {devOtp}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Enter 6-Digit OTP / Verification Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-base tracking-widest font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{submitting ? 'Verifying & Submitting...' : 'Verify Email & Submit Bid'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerBidModal;
