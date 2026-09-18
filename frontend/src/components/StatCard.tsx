import React from 'react';
import { DollarSign, ShoppingBag, Package, Users, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon
}) => {
  const getIcon = () => {
    const iconClass = "w-5 h-5";
    switch (icon) {
      case 'DollarSign':
        return <DollarSign className={iconClass} />;
      case 'ShoppingBag':
        return <ShoppingBag className={iconClass} />;
      case 'Package':
        return <Package className={iconClass} />;
      case 'Users':
        return <Users className={iconClass} />;
      default:
        return <DollarSign className={iconClass} />;
    }
  };

  const getIconBg = () => {
    switch (icon) {
      case 'DollarSign':
        return 'bg-violet-50 text-brand-600 border-brand-100';
      case 'ShoppingBag':
        return 'bg-pink-50 text-accent-pink border-pink-100';
      case 'Package':
        return 'bg-cyan-50 text-accent-cyan border-cyan-100';
      case 'Users':
        return 'bg-blue-50 text-accent-blue border-blue-100';
      default:
        return 'bg-brand-50 text-brand-600 border-brand-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${getIconBg()}`}>
          {getIcon()}
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
      </div>
      <div className="mt-2.5 flex items-center text-xs font-medium">
        {isPositive ? (
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600 mr-1 shrink-0" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-rose-600 mr-1 shrink-0" />
        )}
        <span className={isPositive ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
          {change}
        </span>
      </div>
    </div>
  );
};
