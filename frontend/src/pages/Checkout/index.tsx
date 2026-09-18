import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowLeft,
  Building2,
  Sparkles,
  Layers,
  Check
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { checkoutService } from '../../services/checkoutService';
import { CheckoutSummary, PaymentMethod } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const orderId = searchParams.get('orderId') || undefined;
  const itemType = (searchParams.get('type') as 'custom_website' | 'template' | 'product') || undefined;
  const itemId = searchParams.get('id') || undefined;

  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [nameOnCard, setNameOnCard] = useState(currentUser?.name || '');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('12');
  const [expYear, setExpYear] = useState('2028');
  const [cvc, setCvc] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!orderId && (!itemType || !itemId)) {
          setError('No valid item or order was selected for checkout.');
          setLoading(false);
          return;
        }

        const res = await checkoutService.getSummary({
          orderId,
          itemType,
          itemId
        });

        setSummary(res.summary);
        setIsPaid(res.isPaid);
      } catch (err: any) {
        setError(err.message || 'Failed to calculate checkout summary.');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [orderId, itemType, itemId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary) return;

    setError(null);
    setProcessing(true);
    setProcessingStep('Initiating trusted checkout session...');

    try {
      // 1. Initiate checkout session
      const initRes = await checkoutService.initiateCheckout({
        orderId: summary.orderId,
        itemType: summary.itemType,
        itemId: summary.itemId,
        paymentMethod
      });

      const payment = initRes.payment;
      setProcessingStep('Cryptographically verifying payment with provider...');

      // 2. Confirm payment
      const confirmRes = await checkoutService.confirmPayment({
        paymentId: payment.id,
        paymentMethod,
        cardDetails: paymentMethod === 'card' ? {
          cardNumber: cardNumber.replace(/\s+/g, ''),
          expMonth,
          expYear,
          cvc,
          nameOnCard
        } : undefined
      });

      // 3. Redirect to verified success page
      navigate(`/checkout/success?paymentId=${confirmRes.payment.id}`);
    } catch (err: any) {
      console.error('Payment failure:', err);
      setError(err.message || 'Payment failed. Please review your details and try again.');
    } finally {
      setProcessing(false);
      setProcessingStep('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-600">Calculating trusted server-side order summary...</p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Checkout Error</h2>
        <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/orders')}>
          Return to Orders
        </Button>
      </div>
    );
  }

  if (isPaid && summary) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-emerald-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Order Already Paid</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Order <span className="font-mono font-bold">#{summary.orderNumber}</span> has already been paid and verified in the database.
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate(`/dashboard/orders/${summary.orderId}`)}>
          View Order Details
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" /> Secure Checkout
            </h1>
            <p className="text-xs text-slate-500">
              Encrypted 256-bit server-side payment processing
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> WebCraft Pay Verified
        </span>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Col: Payment Method & Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                1. Customer &amp; Billing
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Full Name</span>
                  <span className="font-semibold text-slate-800">{summary.customer.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Email Address</span>
                  <span className="font-semibold text-slate-800">{summary.customer.email}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <form onSubmit={handlePay} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Select Payment Method
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'card'
                      ? 'border-brand-600 bg-brand-50/50 text-brand-900 ring-2 ring-brand-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mb-2 text-brand-600" />
                  <span className="font-bold text-xs">Credit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('digital_wallet')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'digital_wallet'
                      ? 'border-brand-600 bg-brand-50/50 text-brand-900 ring-2 ring-brand-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Sparkles className="w-5 h-5 mb-2 text-brand-600" />
                  <span className="font-bold text-xs">Digital Wallet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-brand-600 bg-brand-50/50 text-brand-900 ring-2 ring-brand-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Building2 className="w-5 h-5 mb-2 text-brand-600" />
                  <span className="font-bold text-xs">Bank Transfer</span>
                </button>
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      required
                      value={nameOnCard}
                      onChange={(e) => setNameOnCard(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 •••• •••• 4242"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:bg-white focus:border-brand-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Exp. Month
                      </label>
                      <select
                        value={expMonth}
                        onChange={(e) => setExpMonth(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                      >
                        {Array.from({ length: 12 }).map((_, i) => {
                          const m = String(i + 1).padStart(2, '0');
                          return <option key={m} value={m}>{m}</option>;
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Exp. Year
                      </label>
                      <select
                        value={expYear}
                        onChange={(e) => setExpYear(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                      >
                        {['2026', '2027', '2028', '2029', '2030'].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        CVC
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        placeholder="123"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:bg-white focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'digital_wallet' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                  <p className="font-semibold text-slate-800">Direct Express Checkout</p>
                  <p>Apple Pay and Google Pay simulation enabled for instant 1-click verification.</p>
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                  <p className="font-semibold text-slate-800">Automated Clearing House (ACH)</p>
                  <p>Real-time bank verification through secure provider rails.</p>
                </div>
              )}

              {/* Pay Button */}
              <div className="pt-4 border-t border-slate-100">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center bg-emerald-600 hover:bg-emerald-700"
                  isLoading={processing}
                  leftIcon={<Lock className="w-4 h-4" />}
                >
                  {processing ? (processingStep || 'Processing...') : `Confirm & Pay $${summary.total.toFixed(2)} USD`}
                </Button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Payment is verified server-side before updating order status to PAID.
                </p>
              </div>
            </form>
          </div>

          {/* Right Col: Trusted Order Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 sticky top-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Order Summary
              </h3>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 px-2 py-0.5 rounded bg-brand-50 border border-brand-200">
                    {summary.itemType.replace('_', ' ')}
                  </span>
                  {summary.orderNumber && (
                    <span className="font-mono text-xs text-slate-400 font-bold">
                      #{summary.orderNumber}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{summary.itemName}</h4>
                {summary.itemDescription && (
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {summary.itemDescription}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-xs border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal (Trusted server price)</span>
                  <span className="font-semibold text-slate-900">${summary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Taxes &amp; Processing Fees</span>
                  <span className="font-semibold text-slate-900">${summary.fees.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                  <span className="font-bold text-sm text-slate-900">Final Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">${summary.total.toFixed(2)}</span>
                    <span className="text-xs font-bold text-slate-400 ml-1">USD</span>
                  </div>
                </div>
              </div>

              {/* Security guarantees */}
              <div className="space-y-2 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Verified cryptographic receipt generated on completion</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>No client-side price tampering allowed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Immediate in-app payment status notification</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
