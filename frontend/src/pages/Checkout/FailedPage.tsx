import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  RefreshCw,
  ArrowLeft,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { Button } from '../../components/Button';
import { checkoutService } from '../../services/checkoutService';
import { Payment } from '../../types';

export const CheckoutFailedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get('paymentId');

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayment = async () => {
      if (!paymentId) {
        setLoading(false);
        return;
      }
      try {
        const res = await checkoutService.getPayment(paymentId);
        setPayment(res.payment);
      } catch (err) {
        console.error('Error fetching failed payment:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPayment();
  }, [paymentId]);

  return (
    <div className="max-w-md mx-auto py-16 px-4 sm:px-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
        <AlertOctagon className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
          Transaction Failed
        </span>
        <h1 className="text-xl font-bold text-slate-900">Payment Could Not Be Completed</h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          {payment?.failureReason || 'Your card issuer or payment provider declined the charge. No funds were debited from your account.'}
        </p>
      </div>

      {payment && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1.5 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Order:</span>
            <span className="font-bold text-slate-700">#{payment.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Payment ID:</span>
            <span className="text-slate-600">{payment.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Attempted Amount:</span>
            <span className="font-bold text-slate-700">${payment.amount.toFixed(2)} USD</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {payment ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/checkout?orderId=${payment.orderId}`)}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Checkout
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/dashboard/orders')}
          >
            Back to Orders
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
