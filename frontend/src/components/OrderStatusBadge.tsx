import React from 'react';
import { CustomWebsiteOrderStatus } from '../types';

interface OrderStatusBadgeProps {
  status: CustomWebsiteOrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getStyle = (): { bg: string; text: string; border: string; label: string } => {
    switch (status) {
      case 'NEW':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          label: 'New'
        };
      case 'REQUIREMENTS_REVIEW':
        return {
          bg: 'bg-indigo-50',
          text: 'text-indigo-700',
          border: 'border-indigo-200',
          label: 'Requirements Review'
        };
      case 'CONFIRMED':
        return {
          bg: 'bg-sky-50',
          text: 'text-sky-700',
          border: 'border-sky-200',
          label: 'Confirmed'
        };
      case 'ASSIGNED':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
          label: 'Assigned'
        };
      case 'IN_PROGRESS':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          label: 'In Progress'
        };
      case 'PREVIEW_READY':
        return {
          bg: 'bg-cyan-50',
          text: 'text-cyan-700',
          border: 'border-cyan-200',
          label: 'Preview Ready'
        };
      case 'REVISION_REQUESTED':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200',
          label: 'Revision Requested'
        };
      case 'REVISED':
        return {
          bg: 'bg-teal-50',
          text: 'text-teal-700',
          border: 'border-teal-200',
          label: 'Revised'
        };
      case 'CUSTOMER_APPROVED':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          label: 'Customer Approved'
        };
      case 'COMPLETED':
        return {
          bg: 'bg-emerald-100',
          text: 'text-emerald-800',
          border: 'border-emerald-300',
          label: 'Completed'
        };
      case 'DELIVERED':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300',
          label: 'Delivered'
        };
      case 'CANCELLED':
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-600',
          border: 'border-slate-200',
          label: 'Cancelled'
        };
      default:
        return {
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          border: 'border-slate-200',
          label: status
        };
    }
  };

  const { bg, text, border, label } = getStyle();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full border ${bg} ${text} ${border} ${sizeClasses} uppercase tracking-wider`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {label}
    </span>
  );
};
