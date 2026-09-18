import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Calendar,
  Sparkles,
  Plus,
  ArrowRight,
  ExternalLink,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { customWebsiteOrderService } from '../../services/customWebsiteOrderService';
import { CustomWebsiteOrder } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../contexts/AuthContext';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, currentUser } = useAuth();
  const isAdmin = role === 'Admin';
  const isManager = role === 'Manager';
  const isStaff = isAdmin || isManager;
  const isUser = role === 'User';

  const [orders, setOrders] = useState<CustomWebsiteOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [assignedOnly, setAssignedOnly] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      if (isStaff) {
        const res = await customWebsiteOrderService.getAllOrders({
          search: searchQuery,
          status: selectedStatus,
          assignedOnly: isManager && assignedOnly
        });
        setOrders(res.orders);
        setTotal(res.total);
      } else {
        const res = await customWebsiteOrderService.getMyOrders({
          search: searchQuery,
          status: selectedStatus
        });
        setOrders(res.orders);
        setTotal(res.total);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [isStaff, isManager, assignedOnly, searchQuery, selectedStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const statuses = [
    'All',
    'NEW',
    'REQUIREMENTS_REVIEW',
    'CONFIRMED',
    'ASSIGNED',
    'IN_PROGRESS',
    'PREVIEW_READY',
    'REVISION_REQUESTED',
    'REVISED',
    'CUSTOMER_APPROVED',
    'COMPLETED',
    'DELIVERED',
    'CANCELLED'
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isUser ? 'My Service Orders' : 'Custom Website Orders'}
            </h2>
            <span className="px-2.5 py-0.5 bg-brand-100 text-brand-700 text-xs font-bold rounded-full">
              {total} Real {total === 1 ? 'Order' : 'Orders'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isUser
              ? 'Real-time production progress and milestone deliverables for your custom websites'
              : 'Production queue, staff assignments, and client milestone delivery'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/dashboard/orders/new-website')}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-brand-600 hover:bg-brand-700 font-bold shadow-sm"
          >
            Order Custom Website
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, business name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {isManager && (
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="checkbox"
                checked={assignedOnly}
                onChange={(e) => setAssignedOnly(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Assigned to me only</span>
            </label>
          )}

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl outline-none"
          >
            {statuses.map((st) => (
              <option key={st} value={st}>
                Status: {st.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content: Real Database Orders Table or Clean Empty State */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-slate-200/80">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Querying real database records...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs">
          <EmptyState
            title="No orders yet"
            description={
              isUser
                ? 'You have not submitted any custom website service requests yet. Choose a package to get a bespoke site built for your business.'
                : 'There are currently zero real custom website orders in the queue. New client submissions will appear here live.'
            }
            actionText={isUser ? 'Order a Custom Website' : undefined}
            onAction={isUser ? () => navigate('/dashboard/orders/new-website') : undefined}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Order Details</th>
                  <th className="py-3 px-4">Business &amp; Goal</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Status</th>
                  {isStaff && <th className="py-3 px-4">Assigned Staff</th>}
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {orders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => navigate(`/dashboard/orders/${ord.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-brand-700 block">
                          {ord.orderNumber}
                        </span>
                        <p className="text-[11px] text-slate-500">{ord.customerName}</p>
                      </div>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 truncate">
                        {ord.type === 'template'
                          ? (ord.templateDetails?.templateName || 'Website Template')
                          : (ord.businessInfo?.businessName || 'Custom Website')}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {ord.type === 'template'
                          ? `Template: ${ord.templateDetails?.templateCategory || 'Marketplace'}`
                          : (ord.businessInfo?.websitePurpose || 'Custom Website Build')}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block">
                          {ord.type === 'template'
                            ? 'Template License'
                            : (ord.package?.packageName || 'Custom Package')}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-600">
                          ${ord.amount} USD
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <OrderStatusBadge status={ord.status} size="sm" />
                    </td>

                    {isStaff && (
                      <td className="py-4 px-4">
                        {ord.assignedStaffName ? (
                          <span className="text-xs font-semibold text-slate-800">
                            {ord.assignedStaffName}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </td>
                    )}

                    <td className="py-4 px-4 text-slate-500 text-[11px]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/orders/${ord.id}`);
                        }}
                        rightIcon={<ArrowRight className="w-3 h-3" />}
                      >
                        View Order
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

