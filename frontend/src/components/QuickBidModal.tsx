import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Package, 
  CheckCircle2, 
  XCircle, 
  Send, 
  RefreshCw,
  X
} from 'lucide-react';



interface QuickBidModalProps {
  token: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

export const QuickBidModal: React.FC<QuickBidModalProps> = ({ token, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Quick bid data
  const [buyerEmail, setBuyerEmail] = useState('');
  const [listingId, setListingId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [cases, setCases] = useState<number>(100);

  useEffect(() => {
    fetchTokenInfo();
  }, [token]);

  const fetchTokenInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bids/quick-bid-info?token=${token}`);
      const data = await res.json();
      if (res.ok) {
        setBuyerEmail(data.buyerEmail);
        setListingId(data.listingId);
        setAmount(data.defaultAmount || 15.00);
      } else {
        setError(data.error || 'Invalid or expired quick bid token.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quick bid details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/bids/quick-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, amount, cases })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden text-slate-100 font-sans">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
            <p className="text-xs text-slate-400">Verifying signed quick-bid token...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Quick-Bid Token Expired or Invalid</h3>
              <p className="text-xs text-rose-300 max-w-xs mx-auto">{error}</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            )}
          </div>
        ) : success ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Bid Submitted Successfully!</h3>
              <p className="text-xs text-slate-300">
                Your bid offer of <strong className="text-emerald-400">${amount}/case</strong> for listing #{listingId} has been logged.
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
              >
                Done
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmitBid} className="space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">1-Click Buyer Quick Bid</h3>
                <p className="text-xs text-slate-400">Authenticated via signed email token • {buyerEmail}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Target Listing ID:</span>
              <span className="font-mono font-bold text-indigo-400">#{listingId}</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Bid Offer Price per Case ($)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">$</span>
                  <input
                    type="number"
                    step="0.25"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Quantity of Cases Desired</label>
                <div className="relative">
                  <Package className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="number"
                    required
                    value={cases}
                    onChange={(e) => setCases(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold text-white outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting || amount <= 0}
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
