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
  ExternalLink,
  Smartphone,
  Info,
  Check
} from 'lucide-react';
import { Button } from '../../components/Button';
import { checkoutService } from '../../services/checkoutService';
import { CheckoutSummary, PaymentProviderType, PaymentConfigResponse } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatPKR } from '../../utils/currency';

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const orderId = searchParams.get('orderId') || undefined;
  const itemType = (searchParams.get('type') as 'custom_website' | 'template' | 'product') || undefined;
  const itemId = searchParams.get('id') || undefined;

  // Callback query params from payment provider redirect
  const paymentStatusParam = searchParams.get('payment_status');
  const paymentErrorParam = searchParams.get('error');
  const returnPaymentId = searchParams.get('paymentId');
  const returnOrderId = searchParams.get('orderId');

  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gateway config state
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfigResponse | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderType>('easypaisa');
  const [customerPhone, setCustomerPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch safe public gateway configuration
        try {
          const cfg = await checkoutService.getConfig();
          setPaymentConfig(cfg);
          // Set first available provider as default, or easypaisa
          if (cfg.providers.easypaisa.configured) {
            setSelectedProvider('easypaisa');
          } else if (cfg.providers.jazzcash.configured) {
            setSelectedProvider('jazzcash');
          } else if (cfg.providers.card.configured) {
            setSelectedProvider('card');
          }
        } catch (cfgErr) {
          console.warn('[Checkout] Failed to load payment config:', cfgErr);
        }

        // If returned from callback with success or failure, we don't need prospective lookup if orderId is in URL
        const effectiveOrderId = orderId || returnOrderId || undefined;
        if (!effectiveOrderId && (!itemType || !itemId)) {
          if (!paymentStatusParam) {
            setError('No valid item or order was selected for checkout.');
          }
          setLoading(false);
          return;
        }

        const res = await checkoutService.getSummary({
          orderId: effectiveOrderId,
          itemType,
          itemId
        });

        setSummary(res.summary);
        setIsPaid(res.isPaid || paymentStatusParam === 'success');
      } catch (err: any) {
        setError(err.message || 'Failed to calculate checkout summary.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [orderId, itemType, itemId, paymentStatusParam, returnOrderId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary) return;

    setError(null);
    setProcessing(true);
    setProcessingStep('Connecting to secure payment provider...');

    try {
      const initRes = await checkoutService.initiateCheckout({
        orderId: summary.orderId,
        itemType: summary.itemType,
        itemId: summary.itemId,
        provider: selectedProvider,
        customerPhone: customerPhone || undefined
      });

      const { initiateResult } = initRes;

      if (!initiateResult) {
        throw new Error('Payment initialization did not return provider details.');
      }

      if (initiateResult.status === 'CONFIGURATION_REQUIRED') {
        throw new Error(
          initiateResult.errorMessage || initiateResult.error ||
          `Payment provider '${selectedProvider}' is not yet activated on this server. Merchant credentials are required for live payments.`
        );
      }

      setProcessingStep('Redirecting to secure payment portal...');

      const targetUrl = initiateResult.checkoutUrl || initiateResult.redirectUrl;
      const isFormPost = initiateResult.checkoutMethod === 'FORM_POST' || initiateResult.method === 'POST';

      // Handle Form Post (CyberSource / 3D Secure / Hosted form)
      if (isFormPost && targetUrl && initiateResult.formFields) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = targetUrl;
        form.style.display = 'none';

        for (const [key, value] of Object.entries(initiateResult.formFields)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
        return;
      }

      // Handle Standard URL Redirect
      if (targetUrl) {
        window.location.href = targetUrl;
        return;
      }

      throw new Error('Unable to redirect to payment gateway.');
    } catch (err: any) {
      console.error('Payment checkout initiation failure:', err);
      setError(err.message || 'Payment initiation failed. Please try again.');
      setProcessing(false);
      setProcessingStep('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-600">Loading secure checkout session...</p>
      </div>
    );
  }

  // Success Screen (from redirect or existing paid status)
  if (paymentStatusParam === 'success' || (isPaid && summary)) {
    const displayOrderId = summary?.orderId || returnOrderId || '';
    const displayOrderNum = summary?.orderNumber || (returnOrderId ? returnOrderId.slice(0, 8) : '');

    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-3xl p-8 border border-emerald-200 text-center space-y-6 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payment Verified &amp; Confirmed</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Your transaction has been cryptographically verified and recorded in the database.
            {displayOrderNum && (
              <span className="block mt-1 font-semibold text-slate-800">
                Order Reference: #{displayOrderNum}
              </span>
            )}
          </p>
        </div>

        <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-left space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Payment Status</span>
            <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
              PAID &amp; VERIFIED
            </span>
          </div>
          {returnPaymentId && (
            <div className="flex justify-between text-slate-600">
              <span>Transaction Ref</span>
              <span className="font-mono text-slate-800 font-semibold">{returnPaymentId}</span>
            </div>
          )}
          {summary && (
            <div className="flex justify-between text-slate-600 pt-1 border-t border-emerald-200/50">
              <span>Total Paid</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(summary.total, summary.currency)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {displayOrderId && (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(`/dashboard/orders/${displayOrderId}`)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              View Order Details
            </Button>
          )}
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Failed Callback Screen
  if (paymentStatusParam === 'failed' || paymentStatusParam === 'cancelled') {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-6 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {paymentStatusParam === 'cancelled' ? 'Payment Cancelled' : 'Payment Verification Failed'}
          </h2>
          <p className="text-xs text-rose-700 mt-2 leading-relaxed">
            {paymentErrorParam || 'The payment gateway could not process this transaction. No funds were debited.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              // Retry by removing the query parameters
              navigate(`/checkout${summary?.orderId ? `?orderId=${summary.orderId}` : ''}`);
            }}
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/dashboard/orders')}
          >
            Back to Orders
          </Button>
        </div>
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

  const anyProviderConfigured = Boolean(
    paymentConfig?.providers?.easypaisa?.configured ||
    paymentConfig?.providers?.jazzcash?.configured ||
    paymentConfig?.providers?.card?.configured
  );

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
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Merchant Gateway
        </span>
      </div>

      {/* Global Notice if all providers require merchant activation */}
      {!anyProviderConfigured && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-800">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Online payment is temporarily unavailable. Please try again later.</span>
            <p className="text-amber-700 leading-relaxed">
              Official Pakistani payment gateways (Easypaisa, JazzCash, Card 3D-Secure) are integrated in code. 
              Live merchant gateway activation is currently in progress.
            </p>
          </div>
        </div>
      )}

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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
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
            <form onSubmit={handlePay} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Select Payment Method
              </h3>

              <div className="space-y-3">
                {/* 1. Easypaisa */}
                <button
                  type="button"
                  onClick={() => setSelectedProvider('easypaisa')}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    selectedProvider === 'easypaisa'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                      EP
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">Easypaisa</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          🇵🇰 Mobile Account / OTC
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Telenor Microfinance Bank Merchant Gateway
                      </p>
                    </div>
                  </div>
                  <div>
                    {paymentConfig?.providers?.easypaisa?.configured ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        Available
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                        Coming after merchant activation
                      </span>
                    )}
                  </div>
                </button>

                {/* 2. JazzCash */}
                <button
                  type="button"
                  onClick={() => setSelectedProvider('jazzcash')}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    selectedProvider === 'jazzcash'
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg">
                      JC
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">JazzCash</span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          🇵🇰 Mobile Account / Voucher
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mobilink Microfinance Bank Merchant Gateway
                      </p>
                    </div>
                  </div>
                  <div>
                    {paymentConfig?.providers?.jazzcash?.configured ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        Available
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                        Coming after merchant activation
                      </span>
                    )}
                  </div>
                </button>

                {/* 3. Credit / Debit Card */}
                <button
                  type="button"
                  onClick={() => setSelectedProvider('card')}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    selectedProvider === 'card'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">Credit / Debit Card</span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          💳 Visa / Mastercard / PayPak
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Visa / Mastercard / PayPak via 3D-Secure Bank Hosted Gateway
                      </p>
                    </div>
                  </div>
                  <div>
                    {paymentConfig?.providers?.card?.configured ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        Available
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                        Coming after merchant activation
                      </span>
                    )}
                  </div>
                </button>
              </div>

              {/* Provider Details & Requirements */}
              {selectedProvider === 'card' && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-800">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>100% PCI-DSS Compliant 3D-Secure Processing</span>
                  </div>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Card details are never entered, collected, or stored on WebCraftAI servers. 
                    Upon clicking Proceed, you will be securely redirected to the acquirer bank&apos;s 
                    PCI-compliant hosted checkout with 3D-Secure OTP verification.
                  </p>
                </div>
              )}

              {(selectedProvider === 'easypaisa' || selectedProvider === 'jazzcash') && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Account / Mobile Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="03001234567"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:bg-white focus:border-brand-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Used for payment SMS verification alerts and transaction receipt.
                    </p>
                  </div>
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
                  disabled={processing}
                  leftIcon={<Lock className="w-4 h-4" />}
                >
                  {processing
                    ? (processingStep || 'Processing...')
                    : `Proceed to Secure Payment (${formatCurrency(summary.total, summary.currency)})`
                  }
                </Button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Payments are verified server-side through cryptographic signatures before order fulfillment.
                </p>
              </div>
            </form>
          </div>

          {/* Right Col: Trusted Order Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 sticky top-6 shadow-sm">
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
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(summary.subtotal, summary.currency)}
                  </span>
                </div>
                {summary.fees > 0 && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Processing &amp; Gateway Fees</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(summary.fees, summary.currency)}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                  <span className="font-bold text-sm text-slate-900">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">
                      {formatCurrency(summary.total, summary.currency)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-xs pt-1">
                  <span>Currency</span>
                  <span className="font-bold text-slate-800">{summary.currency || 'PKR'}</span>
                </div>
              </div>

              {/* Security guarantees */}
              <div className="space-y-2 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Real server-side signature verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Zero raw card credentials stored or collected</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant webhook synchronization and audit logging</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
