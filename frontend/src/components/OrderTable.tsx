import React, { useState } from 'react';
import { Eye, UserCheck, CreditCard, Calendar, CheckCircle2 } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { Badge, BadgeVariant } from './Badge';
import { Button } from './Button';
import { Modal } from './Modal';

interface OrderTableProps {
  orders: Order[];
  onUpdateStatus?: (orderId: string, newStatus: OrderStatus) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({ orders }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const getStatusVariant = (status: OrderStatus): BadgeVariant => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Processing':
        return 'info';
      case 'Pending':
        return 'warning';
      case 'Cancelled':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Order ID</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Product</th>
              <th className="py-3.5 px-4">Assigned User</th>
              <th className="py-3.5 px-4">Amount</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 text-xs">
                  {order.id}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-800">{order.customerName}</div>
                  <div className="text-xs text-slate-400">{order.customerEmail}</div>
                </td>
                <td className="py-3.5 px-4 text-slate-700 font-medium">
                  {order.productName}
                </td>
                <td className="py-3.5 px-4 text-slate-600 text-xs flex items-center gap-1.5 pt-4">
                  <UserCheck className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  <span>{order.assignedUser}</span>
                </td>
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  ${order.amount.toFixed(2)}
                </td>
                <td className="py-3.5 px-4">
                  <Badge variant={getStatusVariant(order.status)} size="sm">
                    {order.status}
                  </Badge>
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-500">
                  {order.date}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details: ${selectedOrder.id}`}
          subtitle={`Placed on ${selectedOrder.date}`}
          maxWidth="lg"
        >
          <div className="space-y-4 py-1">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-xs text-slate-500 font-medium">Total Amount</span>
                <h4 className="text-2xl font-black text-slate-900">
                  ${selectedOrder.amount.toFixed(2)}
                </h4>
              </div>
              <div className="flex gap-2">
                <Badge variant={getStatusVariant(selectedOrder.status)} size="md">
                  {selectedOrder.status}
                </Badge>
                <Badge variant={selectedOrder.paymentStatus === 'Paid' ? 'success' : 'danger'} size="md">
                  {selectedOrder.paymentStatus}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Customer Info
                </span>
                <p className="font-bold text-slate-800">{selectedOrder.customerName}</p>
                <p className="text-xs text-slate-500">{selectedOrder.customerEmail}</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Assigned Staff
                </span>
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-brand-500" />
                  {selectedOrder.assignedUser}
                </p>
                <p className="text-xs text-emerald-600 font-medium">Active Assignment</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Purchased Item
              </span>
              <p className="font-bold text-slate-900">{selectedOrder.productName}</p>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Mark as Handled
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
