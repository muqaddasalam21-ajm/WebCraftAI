import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, TrendingUp, DollarSign, ShoppingBag, BarChart3, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ChartCard } from '../../components/ChartCard';
import { Button } from '../../components/Button';
import { customWebsiteOrderService } from '../../services/customWebsiteOrderService';

export const ReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<{
    totalRevenue: number;
    paidOrdersCount: number;
    totalOrdersCount: number;
    averageOrderValue: number;
    unpaidOrdersCount: number;
    monthlyBreakdown: Array<{
      month: string;
      revenue: number;
      orders: number;
      customWebsites: number;
      templates: number;
    }>;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await customWebsiteOrderService.getReports();
      setReportData(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load live database reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExport = () => {
    if (!reportData) return;
    const headers = 'Month,Revenue,Total Orders,Custom Websites,Templates\n';
    const rows = reportData.monthlyBreakdown
      .map(m => `${m.month},$${m.revenue},${m.orders},${m.customWebsites},${m.templates}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `webcraft_revenue_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = reportData && reportData.monthlyBreakdown.length > 0
    ? reportData.monthlyBreakdown.map(m => ({
        month: m.month,
        sales: m.revenue,
        profit: Math.round(m.revenue * 0.7), // 70% estimated gross margin
        loss: 0,
        orders: m.orders
      }))
    : [
        { month: 'No Data', sales: 0, profit: 0, loss: 0, orders: 0 }
      ];

  const totalCustom = reportData?.monthlyBreakdown.reduce((sum, m) => sum + m.customWebsites, 0) || 0;
  const totalTemplate = reportData?.monthlyBreakdown.reduce((sum, m) => sum + m.templates, 0) || 0;
  const totalCategorized = totalCustom + totalTemplate || 1;
  const customPct = Math.round((totalCustom / totalCategorized) * 100);
  const templatePct = 100 - customPct;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Reports &amp; Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real database metrics calculated exclusively from confirmed PAID customer transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/business"
            className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Advanced Dashboard</span>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            disabled={!reportData || reportData.monthlyBreakdown.length === 0}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm font-medium">{error}</div>
          <button onClick={fetchReports} className="ml-auto text-xs underline font-bold">Retry</button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Aggregating live platform financial reports...</p>
        </div>
      ) : reportData ? (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Realized Revenue (PAID Only)
              </span>
              <h3 className="text-2xl font-black text-brand-700">
                ${reportData.totalRevenue.toLocaleString()}
              </h3>
              <span className="text-xs text-emerald-600 font-semibold flex items-center mt-2">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified paid orders
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Paid Orders
              </span>
              <h3 className="text-2xl font-black text-emerald-600">{reportData.paidOrdersCount}</h3>
              <span className="text-xs text-slate-500 font-medium mt-2 block">
                Out of {reportData.totalOrdersCount} total orders
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Avg. Paid Order Value
              </span>
              <h3 className="text-2xl font-black text-slate-900">
                ${reportData.averageOrderValue.toLocaleString()}
              </h3>
              <span className="text-xs text-slate-500 font-medium mt-2 block">
                Per successful checkout
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Pending / Unpaid Orders
              </span>
              <h3 className="text-2xl font-black text-amber-600">{reportData.unpaidOrdersCount}</h3>
              <span className="text-xs text-slate-500 font-medium mt-2 block">
                Awaiting payment confirmation
              </span>
            </div>
          </div>

          {/* Main Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <ChartCard
                data={chartData}
                title="Monthly Realized Revenue & Volume"
                subtitle="Live monthly aggregate of paid customer purchases and estimated realized margins"
              />
            </div>

            {/* Product Category Breakdown */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Product Mix</h3>
                <p className="text-xs text-slate-500 mb-6">Real order breakdown by service offering</p>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Custom Website Projects</span>
                      <span className="text-slate-900">{totalCustom} ({customPct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div style={{ width: `${customPct}%` }} className="h-full bg-brand-600 rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Website Templates</span>
                      <span className="text-slate-900">{totalTemplate} ({templatePct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div style={{ width: `${templatePct}%` }} className="h-full bg-accent-cyan rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 text-xs text-slate-500 text-center">
                Database Source: Real Persistent Ledger (backend/data/orders.json)
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
