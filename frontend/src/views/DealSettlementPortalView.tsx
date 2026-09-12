import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Package, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  DollarSign,
  Building,
  PenTool,
  Type,
  ShieldCheck,
  Download,
  Truck
} from 'lucide-react';
import { dealService, type DealData } from '../services/dealService';
import { API_BASE_URL } from '../services/networkService';

interface DealSettlementPortalViewProps {
  dealId: string;
  token?: string | null;
}

export const DealSettlementPortalView: React.FC<DealSettlementPortalViewProps> = ({ dealId, token }) => {
  const [deal, setDeal] = useState<DealData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const isPaymentConfirmed = deal?.paymentStatus === 'confirmed';
  const isExecuted = deal?.signatureStatus === 'executed';

  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [signerName, setSignerName] = useState<string>('');
  const [signerTitle, setSignerTitle] = useState<string>('');
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [signError, setSignError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    dealService.getDeal(dealId, token)
      .then((data) => {
        if (isMounted) {
          setDeal(data);
          if (data.buyer?.companyName && !signerName) {
            setSignerName('');
          }
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || 'Unauthorized deal access. A valid HMAC dealToken or matching authorized session is required.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [dealId, token]);

  useEffect(() => {
    if (!deal) return;
    if (typeof window !== 'undefined' && window.location.hash === '#payment') {
      const targetId = isPaymentConfirmed ? 'step-2-agreement' : 'payment';
      const el = document.getElementById(targetId) || document.getElementById('payment');
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [deal, isPaymentConfirmed]);

  const handleConfirmPayment = async () => {
    if (!deal || isConfirmingPayment) return;
    setIsConfirmingPayment(true);
    setPaymentError(null);

    try {
      const updatedDeal = await dealService.confirmPayment(dealId, token);
      setDeal((prev) => (prev ? { ...prev, ...updatedDeal, paymentStatus: 'confirmed' } : updatedDeal));
    } catch (err: any) {
      setPaymentError(err.message || 'Payment confirmation failed. Please try again.');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    isDrawingRef.current = true;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#6366f1';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setDrawnSignature(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setDrawnSignature(null);
  };

  const handleSignAgreement = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!deal || isSigning) return;

    const signatureData = signatureMode === 'draw' ? (drawnSignature || '') : signerName.trim();

    if (!signerName.trim()) {
      setSignError('Full Legal Name is required.');
      return;
    }
    if (!signerTitle.trim()) {
      setSignError('Corporate Title is required.');
      return;
    }
    if (!authorized) {
      setSignError('Please confirm legal authorization by checking the box.');
      return;
    }
    if (!signatureData) {
      setSignError('Please provide a signature (draw on the canvas or type your name).');
      return;
    }

    setIsSigning(true);
    setSignError(null);

    try {
      const updatedDeal = await dealService.signDeal(
        dealId,
        {
          signerName: signerName.trim(),
          signerTitle: signerTitle.trim(),
          authorized,
          signatureType: signatureMode,
          signatureData
        },
        token
      );
      setDeal((prev) => (prev ? { ...prev, ...updatedDeal, signatureStatus: 'executed' } : updatedDeal));
    } catch (err: any) {
      setSignError(err.message || 'Failed to execute agreement. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  if (loading) {
    return (
      <div 
        data-testid="deal-loading-state"
        className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 font-sans"
      >
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Verifying deal authorization…</p>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div 
        data-testid="deal-access-denied"
        className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans"
      >
        <div className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-sm text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5 text-red-400">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Access Denied</h1>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            {error || 'Unauthorized deal access. A valid HMAC dealToken or matching authorized session is required.'}
          </p>
          <div className="text-xs text-slate-400 bg-slate-950/60 rounded-xl p-4 border border-slate-800 text-left">
            <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
              <AlertCircle size={14} className="text-amber-400" />
              <span>Authorization Notice</span>
            </div>
            <p>
              External liquidators must access this settlement portal using the cryptographic link received in your award notification email. Alternatively, sign in with the buyer account associated with this award.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const productName = deal.product?.name || 'Surplus Lot Settlement';
  const sku = deal.product?.sku || 'N/A';
  const formattedUnitPrice = `$${deal.price.toFixed(2)}`;
  const formattedTotal = `$${deal.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div 
      data-testid="deal-settlement-portal"
      className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white"
    >
      {/* Distraction-Free External Portal Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/20">
              ⚡
            </div>
            <div>
              <span className="text-sm font-semibold tracking-wide text-white uppercase">
                Deal Settlement Portal
              </span>
              <div className="text-xs text-slate-400">
                Deal ID: <span className="font-mono text-slate-300">{deal._id}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              <CheckCircle2 size={13} className="text-indigo-400" />
              Verified Deal Access
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Deal Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
                <Tag size={13} />
                <span>Awarded Inventory Lot</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {productName}
              </h1>
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-3">
                <span>SKU: <strong className="font-mono text-slate-200">{sku}</strong></span>
                {deal.lot?.lotNumber && (
                  <span>Lot #: <strong className="font-mono text-slate-200">{deal.lot.lotNumber}</strong></span>
                )}
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Settlement Value</span>
              <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                {formattedTotal}
              </span>
              <span className="text-xs text-slate-400 mt-0.5">
                {deal.awardedQty} cases @ {formattedUnitPrice}/case
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Commercial Terms Summary */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Package size={18} className="text-indigo-400" />
                Awarded Commercial Terms
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                FOB Origin
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                <dt className="text-xs text-slate-400">Awarded Quantity</dt>
                <dd className="text-base font-bold text-white mt-1">{deal.awardedQty} Cases</dd>
              </div>

              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                <dt className="text-xs text-slate-400">Unit Price</dt>
                <dd className="text-base font-bold text-white mt-1">{formattedUnitPrice} / case</dd>
              </div>

              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                <dt className="text-xs text-slate-400">Payment Status</dt>
                <dd className={`text-sm font-semibold capitalize mt-1 ${isPaymentConfirmed ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {deal.paymentStatus || 'pending'}
                </dd>
              </div>

              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                <dt className="text-xs text-slate-400">Agreement Status</dt>
                <dd className="text-sm font-semibold capitalize mt-1 text-slate-300">
                  {deal.signatureStatus || 'pending'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Warehouse DC Pickup Logistics */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <MapPin size={18} className="text-rose-400" />
                Distribution Center Logistics
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Dock Pickup
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                <MapPin size={18} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-400 font-medium">Depot Pickup Location</div>
                  <div className="text-slate-100 font-semibold mt-0.5">
                    {deal.pickupLocation || 'Warehouse DC Location'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                <Clock size={18} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-400 font-medium">Warehouse Dock Receiving Hours</div>
                  <div className="text-slate-100 font-semibold mt-0.5">
                    {deal.pickupHours || 'Standard Operating Hours (Mon-Fri)'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progression Stepper Indicator */}
        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              isPaymentConfirmed 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            }`}>
              {isPaymentConfirmed ? '✓' : '1'}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Step 1: Payment Gate</div>
              <div className="text-xs text-slate-400">
                {isPaymentConfirmed ? 'Funds cleared and verified' : 'Wire / ACH settlement simulation'}
              </div>
            </div>
          </div>

          <div className="h-0.5 flex-1 mx-4 bg-slate-800 hidden sm:block">
            <div className={`h-full transition-all duration-500 ${isPaymentConfirmed ? 'bg-emerald-500' : 'bg-transparent'}`} />
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              isExecuted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : isPaymentConfirmed 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}>
              {isExecuted ? '✓' : '2'}
            </div>
            <div>
              <div className={`text-sm font-semibold ${isPaymentConfirmed ? 'text-white' : 'text-slate-500'}`}>
                Step 2: Agreement & E-Sign
              </div>
              <div className="text-xs text-slate-500">
                {isExecuted 
                  ? 'Agreement executed & fulfillment scheduled'
                  : isPaymentConfirmed 
                  ? 'Ready for legal execution' 
                  : 'Locked until payment confirmation'}
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Payment Gate Section */}
        {!isExecuted && (
          <section 
            id="payment"
            data-testid="step-1-payment-gate"
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl"
          >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
                <DollarSign size={14} />
                <span>Financial Settlement Gateway</span>
              </div>
              <h2 className="text-xl font-bold text-white">Step 1: Payment Gate</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate wire/ACH transfer or scan the settlement QR code to clear funds.
              </p>
            </div>
            <div>
              {isPaymentConfirmed ? (
                <span 
                  data-testid="payment-cleared-badge"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                >
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  Payment Cleared & Confirmed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  <Clock size={15} className="text-amber-400" />
                  Awaiting Settlement Clearance
                </span>
              )}
            </div>
          </div>

          {/* Payment Value Display */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400 font-medium">Required Payment Amount</div>
              <div 
                data-testid="payment-gate-total"
                className="text-2xl md:text-3xl font-extrabold text-emerald-400 mt-0.5 font-mono"
              >
                {formattedTotal}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Net 0 / FOB Origin Surplus Liquidation Settlement
              </div>
            </div>
            {isPaymentConfirmed ? (
              <div className="text-right">
                <div className="text-xs text-emerald-400 font-medium">Cleared for Agreement</div>
                <div className="text-xs text-slate-400 mt-0.5">Status: Confirmed</div>
              </div>
            ) : (
              <button
                type="button"
                data-testid="simulate-payment-button"
                onClick={handleConfirmPayment}
                disabled={isConfirmingPayment}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isConfirmingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Confirmation…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Pay Now (Simulate Payment Confirmation)</span>
                  </>
                )}
              </button>
            )}
          </div>

          {paymentError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* Wire Instructions & Scan-to-pay QR grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Wire / ACH instructions */}
            <div className="md:col-span-2 bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Building size={16} className="text-indigo-400" />
                Wire / ACH Settlement Instructions
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                For commercial surplus lots, bank wire or ACH clearance is strictly required prior to releasing legal custody and scheduling DC dock transport.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800/60 font-mono">
                <div>
                  <span className="text-slate-400 block font-sans">Beneficiary Bank:</span>
                  <span className="text-slate-200">First Commercial Surplus Bank</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Account Title:</span>
                  <span className="text-slate-200">IndSpoiler Settlement Escrow</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Routing (ABA):</span>
                  <span className="text-slate-200">121000358</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Reference Deal ID:</span>
                  <span className="text-indigo-400 font-bold">{deal._id}</span>
                </div>
              </div>
            </div>

            {/* Scan to Pay QR Code */}
            <div 
              data-testid="scan-to-pay-qr"
              className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-3"
            >
              <div className="w-28 h-28 bg-white p-2 rounded-xl shadow-inner flex items-center justify-center">
                {/* SVG Visual QR Graphic */}
                <svg 
                  className="w-full h-full text-slate-900" 
                  viewBox="0 0 100 100" 
                  fill="currentColor"
                  role="img"
                  aria-label="Scan-to-pay QR code"
                >
                  {/* Outer corner boxes */}
                  <rect x="5" y="5" width="28" height="28" rx="2" fill="currentColor" />
                  <rect x="9" y="9" width="20" height="20" rx="1" fill="white" />
                  <rect x="13" y="13" width="12" height="12" fill="currentColor" />

                  <rect x="67" y="5" width="28" height="28" rx="2" fill="currentColor" />
                  <rect x="71" y="9" width="20" height="20" rx="1" fill="white" />
                  <rect x="75" y="13" width="12" height="12" fill="currentColor" />

                  <rect x="5" y="67" width="28" height="28" rx="2" fill="currentColor" />
                  <rect x="9" y="71" width="20" height="20" rx="1" fill="white" />
                  <rect x="13" y="75" width="12" height="12" fill="currentColor" />

                  {/* QR Pattern dots */}
                  <rect x="38" y="10" width="8" height="8" />
                  <rect x="50" y="10" width="8" height="8" />
                  <rect x="38" y="24" width="8" height="8" />
                  <rect x="50" y="24" width="8" height="8" />

                  <rect x="10" y="38" width="8" height="8" />
                  <rect x="24" y="38" width="8" height="8" />
                  <rect x="38" y="38" width="8" height="8" />
                  <rect x="50" y="38" width="8" height="8" />
                  <rect x="64" y="38" width="8" height="8" />
                  <rect x="78" y="38" width="8" height="8" />

                  <rect x="10" y="50" width="8" height="8" />
                  <rect x="38" y="50" width="8" height="8" />
                  <rect x="64" y="50" width="8" height="8" />
                  <rect x="78" y="50" width="8" height="8" />

                  <rect x="38" y="64" width="8" height="8" />
                  <rect x="50" y="64" width="8" height="8" />
                  <rect x="64" y="64" width="8" height="8" />
                  <rect x="78" y="64" width="8" height="8" />

                  <rect x="38" y="78" width="8" height="8" />
                  <rect x="64" y="78" width="8" height="8" />
                  <rect x="78" y="78" width="8" height="8" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-semibold text-white block">Scan to Pay (ACH/Wire)</span>
                <span className="text-[11px] text-slate-400">Scan using banking app or mobile terminal</span>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Executed Dashboard Certificate when signatureStatus === 'executed' */}
        {isExecuted && (
          <section
            id="agreement-executed-section"
            data-testid="executed-deal-dashboard"
            className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl"
          >
            <div data-testid="agreement-executed-certificate" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Tamper-Evident ESIGN Record</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Executed & Verified
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mt-0.5">Agreement Executed & Sealed</h2>
                </div>
              </div>
              <div>
                <a
                  href={`${API_BASE_URL}/deals/${deal._id}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="download-pdf-button"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Agreement PDF</span>
                </a>
              </div>
            </div>

            {/* Execution Audit Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1 font-medium">Authorized Signatory</span>
                <span className="text-sm font-bold text-white block">{deal.executionAudit?.signerName || signerName || 'Authorized Signer'}</span>
                <span className="text-slate-400 text-[11px] block mt-0.5">{deal.executionAudit?.signerTitle || signerTitle || 'Signatory'}</span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1 font-medium">Executed Timestamp</span>
                <span className="text-sm font-bold text-white block">
                  {deal.executionAudit?.signedAt ? new Date(deal.executionAudit.signedAt).toLocaleString() : new Date().toLocaleString()}
                </span>
                <span className="text-slate-400 text-[11px] block mt-0.5">ESIGN / UETA Compliant</span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1 font-medium">Verification Hash</span>
                <span className="font-mono text-emerald-400 block truncate" title={deal.executionAudit?.verificationHash || 'VERIFIED-IMMUTABLE'}>
                  {deal.executionAudit?.verificationHash || 'SHA-256: 4f8d9b2e...'}
                </span>
                <span className="text-slate-500 text-[10px] block mt-0.5">Cryptographically Sealed Audit Trail</span>
              </div>
            </div>

            {/* Downstream Logistics Handoff Box */}
            <div 
              data-testid="executed-logistics-summary"
              className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <Truck size={18} />
                <span>Downstream Warehouse Fulfillment Provisioned</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your surplus lot agreement has been executed and transferred to warehouse dispatch. A shipment record has been automatically scheduled for dock pickup:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-indigo-500/20">
                <div>
                  <span className="text-slate-400 block">Freight Carrier:</span>
                  <span className="text-slate-100 font-semibold">Buyer Arranged Freight (FOB Origin)</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Dock Pickup Depot:</span>
                  <span className="text-slate-100 font-semibold">{deal.pickupLocation || 'Warehouse DC Location'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Receiving Operating Hours:</span>
                  <span className="text-slate-100 font-semibold">{deal.pickupHours || 'Standard Operating Hours'}</span>
                </div>
              </div>
            </div>
            </div>
          </section>
        )}

        {/* Step 2: Agreement & E-Sign Container */}
        {!isExecuted && (
          <section
            id="step-2-agreement"
            data-testid="step-2-agreement-container"
            data-locked={isPaymentConfirmed ? 'false' : 'true'}
            className={`border rounded-2xl p-6 md:p-8 space-y-6 transition-all duration-300 ${
              isPaymentConfirmed 
                ? 'bg-slate-900/90 border-slate-700 shadow-xl' 
                : 'bg-slate-900/40 border-slate-800/60 opacity-60'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  isPaymentConfirmed ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500'
                }`}>
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Step 2: Agreement & E-Sign</h2>
                  <div className="text-xs text-slate-400">
                    B2B Surplus Asset Purchase Agreement execution
                  </div>
                </div>
              </div>

              {isPaymentConfirmed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  Step 2 Unlocked: Ready for Agreement Execution
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  Locked until payment is confirmed
                </span>
              )}
            </div>

            {isPaymentConfirmed ? (
              <div className="space-y-6">
                {/* Formal B2B Surplus Asset Purchase Agreement Document Card */}
                <div
                  data-testid="legal-agreement-document"
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 md:p-6 space-y-4 font-sans text-xs text-slate-300 shadow-inner"
                >
                  <div className="border-b border-slate-800/80 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-wide">
                        B2B Surplus Asset Purchase Agreement
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Formal Surplus Asset Transfer Agreement • Standard Commercial Terms & Salvage Provisions
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-indigo-400 font-mono">
                      Deal Ref: #{deal._id}
                    </div>
                  </div>

                  {/* Summary Table of Parties and Commercial Terms */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Buyer:</span>
                      <strong className="text-white font-medium">{deal.buyer?.companyName || 'Authorized Commercial Buyer'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Inventory Product:</span>
                      <strong className="text-white font-medium">{productName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Quantity & Terms:</span>
                      <strong className="text-white font-medium">{deal.awardedQty} Cases (FOB Origin)</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Settlement Amount:</span>
                      <strong className="text-emerald-400 font-medium font-mono">{formattedTotal}</strong>
                    </div>
                  </div>

                  {/* Contract Clauses */}
                  <div className="space-y-3 bg-slate-900/30 p-4 rounded-lg border border-slate-800/60 max-h-56 overflow-y-auto leading-relaxed text-[11px] text-slate-300 scrollbar-thin">
                    <div>
                      <strong className="text-white block font-semibold mb-0.5">1. Commercial Terms & Title Transfer</strong>
                      <p>
                        This B2B Surplus Asset Purchase Agreement constitutes a legally binding agreement between Seller and Buyer ({deal.buyer?.companyName || 'Buyer'}). 
                        Buyer agrees to purchase {deal.awardedQty} cases of {productName} (SKU: {sku}) for a total purchase price of {formattedTotal} ({formattedUnitPrice}/case). 
                        Title and risk of loss pass to Buyer FOB Origin upon physical release at Seller's designated distribution center dock.
                      </p>
                    </div>

                    <div>
                      <strong className="text-white block font-semibold mb-0.5">2. As-Is, Where-Is & Non-Returnable Salvage Clauses</strong>
                      <p>
                        All inventory covered under this agreement is sold strictly on an "As-Is, Where-Is" basis. Buyer acknowledges and agrees that goods transferred represent surplus, excess, closeout, or non-returnable salvage inventory. 
                        Seller makes no representations or warranties, express or implied, regarding merchantability, shelf life, packaging condition, or fitness for a particular purpose. 
                        All sales are final, and non-returnable salvage terms apply. No post-delivery adjustments, refunds, returns, or chargebacks shall be permitted.
                      </p>
                    </div>

                    <div>
                      <strong className="text-white block font-semibold mb-0.5">3. Distribution Center Logistics & Dock Receiving Hours</strong>
                      <p>
                        Collection and freight transport must be completed from the designated facility at <strong>{deal.pickupLocation || 'Warehouse DC Location'}</strong>. 
                        Dock operating hours for carrier check-in are <strong>{deal.pickupHours || 'Standard Operating Hours (Mon-Fri)'}</strong>. 
                        Transportation is provisioned as Buyer Arranged Freight (FOB Origin). Buyer's chosen freight carrier must present valid authorization matching this Deal ID upon dock check-in.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dual-Mode Interactive Signature Pad Container */}
                <div
                  data-testid="signature-pad-container"
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 md:p-6 space-y-5 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <PenTool size={16} className="text-indigo-400" />
                        Digital Signature Capture
                      </h3>
                      <p className="text-xs text-slate-400">
                        Choose your preferred signing mode: interactive canvas drawing or cursive legal script.
                      </p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
                      <button
                        type="button"
                        data-testid="signature-mode-draw"
                        onClick={() => setSignatureMode('draw')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                          signatureMode === 'draw'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <PenTool size={13} />
                        <span>Draw</span>
                      </button>
                      <button
                        type="button"
                        data-testid="signature-mode-type"
                        onClick={() => setSignatureMode('type')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                          signatureMode === 'type'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Type size={13} />
                        <span>Type</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: Draw on HTML5 Canvas */}
                  {signatureMode === 'draw' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Draw your legal signature inside the box using your mouse, trackpad, or finger:</span>
                        <button
                          type="button"
                          data-testid="clear-canvas-button"
                          onClick={clearCanvas}
                          className="text-indigo-400 hover:text-indigo-300 font-medium underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="border border-slate-700 bg-slate-900 rounded-xl overflow-hidden shadow-inner flex justify-center p-2">
                        <canvas
                          ref={canvasRef}
                          data-testid="signature-canvas"
                          width={480}
                          height={140}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="bg-slate-900 cursor-crosshair touch-none w-full max-w-lg h-32 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Type Cursive Legal Script */}
                  {signatureMode === 'type' && (
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400">
                        Rendered cursive signature script preview based on your legal name:
                      </div>
                      <div className="border border-slate-700 bg-slate-900 rounded-xl p-5 shadow-inner flex items-center justify-center min-h-[120px]">
                        <div
                          data-testid="typed-signature-preview"
                          className="font-serif italic text-3xl md:text-4xl text-indigo-300 tracking-wide select-none"
                          style={{ fontFamily: "'Brush Script MT', 'Dancing Script', 'Caveat', cursive, serif" }}
                        >
                          {signerName.trim() || 'Your Legal Signature'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mandatory Legal Execution Form Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label htmlFor="signer-name" className="block text-xs font-medium text-slate-300 mb-1">
                        Full Legal Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="signer-name"
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        placeholder="e.g. Jane Doe"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="signer-title" className="block text-xs font-medium text-slate-300 mb-1">
                        Corporate Title <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="signer-title"
                        type="text"
                        value={signerTitle}
                        onChange={(e) => setSignerTitle(e.target.value)}
                        placeholder="e.g. VP Procurement / General Counsel"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Authorization Confirmation Checkbox */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                    <label htmlFor="signer-authorized" className="flex items-start gap-3 cursor-pointer text-xs text-slate-300">
                      <input
                        id="signer-authorized"
                        type="checkbox"
                        checked={authorized}
                        onChange={(e) => setAuthorized(e.target.checked)}
                        className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>
                        I confirm that I am legally authorized to execute this agreement on behalf of my organization and that this electronic signature carries the same legal validity as a handwritten signature under ESIGN and UETA.
                      </span>
                    </label>
                  </div>

                  {signError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0 text-red-400" />
                      <span>{signError}</span>
                    </div>
                  )}

                  {/* Submission Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      data-testid="signature-submit-button"
                      onClick={() => handleSignAgreement()}
                      disabled={isSigning}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 cursor-pointer"
                    >
                      {isSigning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting Legal Signature…</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Sign & Execute Agreement</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-500 flex items-center gap-3">
                <span>🔒 Step 2 will unlock automatically once Step 1 payment receipt is confirmed above.</span>
              </div>
            )}
          </section>
        )}
      </main>

      {/* External Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-400">
        Distraction-Free Buyer Settlement Environment • Secured by IndSpoiler Alert Hybrid Token Authorization
      </footer>
    </div>
  );
};

export default DealSettlementPortalView;
