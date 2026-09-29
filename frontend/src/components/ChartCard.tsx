import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { SalesReportMonth } from '../types';

interface ChartCardProps {
  data: SalesReportMonth[];
  title?: string;
  subtitle?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  data,
  title = 'Sales Overview',
  subtitle = 'Monthly revenue performance and order volume'
}) => {
  const [activeRange, setActiveRange] = useState<'6M' | 'YTD' | '1Y'>('6M');

  const totalSales = data.reduce((sum, d) => sum + (d.sales || 0), 0);
  const totalOrders = data.reduce((sum, d) => sum + (d.orders || 0), 0);
  const totalProfit = data.reduce((sum, d) => sum + (d.profit || 0), 0);
  const avgMonthly = data.length > 0 ? Math.round(totalSales / data.length) : 0;
  const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) + '%' : '0.0%';
  const maxSales = Math.max(...data.map((d) => d.sales || 0), 1);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">{title}</h3>
            <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Live Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          {(['6M', 'YTD', '1Y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeRange === range
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Bar & Trend Visualization / Empty state */}
      {totalSales === 0 && totalOrders === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border-b border-slate-100 text-center p-6 space-y-2">
          <BarChart3 className="w-8 h-8 text-slate-300" />
          <p className="text-xs font-bold text-slate-600">No sales transactions recorded yet</p>
          <p className="text-[11px] text-slate-400 max-w-xs">
            Revenue and volume trends will render dynamically once customer orders are placed and confirmed.
          </p>
        </div>
      ) : (
        <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-100">
          {data.map((item) => {
            const heightPercent = maxSales > 0 ? Math.round(((item.sales || 0) / maxSales) * 100) : 0;
            return (
              <div key={item.month} className="flex-1 flex flex-col items-center h-full justify-end group">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-md shadow-lg pointer-events-none whitespace-nowrap">
                  ${(item.sales || 0).toLocaleString()} ({item.orders || 0} orders)
                </div>

                {/* Bar */}
                <div className="w-full max-w-[44px] bg-slate-100 rounded-t-xl overflow-hidden h-full flex items-end p-0.5">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-brand-600 to-accent-pink rounded-t-lg transition-all duration-500 group-hover:from-brand-700 group-hover:to-pink-600"
                  />
                </div>

                <span className="text-xs font-semibold text-slate-500 mt-2">
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Footer: Live Database Calculated Only */}
      <div className="grid grid-cols-3 gap-4 pt-4 mt-2 text-center sm:text-left">
        <div className="p-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Avg. Monthly Revenue
          </span>
          <span className="text-base font-bold text-slate-900">
            ${avgMonthly.toLocaleString()}
          </span>
        </div>
        <div className="p-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Orders
          </span>
          <span className="text-base font-bold text-slate-900">{totalOrders}</span>
        </div>
        <div className="p-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Profit Margin
          </span>
          <span className="text-base font-bold text-emerald-600">{profitMargin}</span>
        </div>
      </div>
    </div>
  );
};
