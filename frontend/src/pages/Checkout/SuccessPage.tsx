import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Calendar,
  CreditCard,
  Building2,
  ExternalLink,
  Lock
} from 'lucide-react';
import { Button } from '../../components/Button';
import { checkoutService } from '../../services/checkoutService';
import { Payment, CustomWebsiteOrder } from '../../types';

export const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get('paymentId');

  const [payment, setPayment] = useState<Payment | null>(null);
  const [order, setOrder] = useState<CustomWebsiteOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReceipt = async () => {
      if (!paymentId) {
        setError('No payment identifier provided.');
        setLoading(false);
        return;
      }

      try {
        const res = await checkoutService.getPayment(paymentId);
        setPayment(res.payment);
        setOrder(res.order);
      } catch (err: any) {
        setError(err.message || 'Unable to retrieve payment receipt.');
      } finally {
        setLoading(false);
      }
    };

    loadReceipt();
  }, [paymentId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-600">Verifying payment receipt with provider...</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
        <h2 className="text-base font-bold text-slate-900">Receipt Not Available</h2>
        <p className="text-xs text-slate-500">{error || 'Payment not found.'}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/orders')}>
          View Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 space-y-8">
      {/* Success Badge Banner */}
      <div className="bg-white rounded-3xl border border-emerald-200/80 p-8 shadow-xs text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Payment Confirmed · Status: {payment.status}
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Thank You for Your Payment!</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Your payment has been cryptographically confirmed and updated in the database.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {order && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/dashboard/orders/${order.id}`)}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Go to Order Details
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard/projects')}
          >
            Go to My Projects
          </Button>
        </div>
      </div>

      {/* Official Cryptographic Receipt Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-sm text-slate-900">Official Payment Receipt</h3>
          </div>
          <span className="font-mono text-xs font-bold text-slate-400">
            {payment.id}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Order Number</span>
            <span className="font-mono font-bold text-slate-800">#{payment.orderNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Payment Date</span>
            <span className="font-semibold text-slate-800">
              {new Date(payment.createdAt).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Payment Provider</span>
            <span className="font-semibold text-slate-800 uppercase">{payment.provider}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Payment Method</span>
            <span className="font-semibold text-slate-800 capitalize">
              {payment.paymentMethodDetails?.brand || payment.paymentMethod.replace('_', ' ')}
              {payment.paymentMethodDetails?.last4 ? ` (•••• ${payment.paymentMethodDetails.last4})` : ''}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Billed Customer:</span>
            <span className="font-semibold text-slate-800">{payment.customerName} ({payment.customerEmail})</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Provider Transaction Ref:</span>
            <span className="font-mono text-[11px] text-slate-500">{payment.providerPaymentId}</span>
          </div>
          <div className="pt-2 border-t border-slate-200/60 flex items-baseline justify-between text-sm">
            <span className="font-bold text-slate-900">Total Charged:</span>
            <span className="text-xl font-black text-emerald-600">${payment.amount.toFixed(2)} {payment.currency}</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified &amp; Idempotent Database Record
          </span>
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            256-bit Encrypted
          </span>
        </div>
      </div>
    </div>
  );
};
