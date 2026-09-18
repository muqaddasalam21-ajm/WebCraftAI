import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  FolderGit2,
  Globe,
  Users,
  Store,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  Filter,
  BarChart3,
  PieChart,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { reportService, DateQuery } from '../../services/reportService';
import { Button } from '../../components/Button';

export const BusinessDashboardPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const isAdmin = role === 'Admin';
  const isManager = role === 'Manager';
  const isVendor = role === 'Vendor';
  const isCustomer = role === 'User';

  // Filters state
  const [preset, setPreset] = useState<string>('last30days');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'revenue' | 'projects' | 'deployments' | 'customers' | 'vendors'>('overview');

  // Data state
  const [overview, setOverview] = useState<any>(null);
  const [sales, setSales] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [projects, setProjects] = useState<any>(null);
  const [deployments, setDeployments] = useState<any>(null);
  const [customers, setCustomers] = useState<any>(null);
  const [vendors, setVendors] = useState<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getDateParams = (): DateQuery => {
    if (preset === 'custom' && customStart) {
      return { preset: 'custom', startDate: customStart, endDate: customEnd || undefined };
    }
    return { preset };
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    const params = getDateParams();

    try {
      // Always fetch overview
      const ovData = await reportService.getOverview(params);
      setOverview(ovData);

      // Load specific tab data lazily or concurrently
      if (activeTab === 'sales') {
        const sData = await reportService.getSales(params);
        setSales(sData);
      } else if (activeTab === 'revenue') {
        const rData = await reportService.getRevenue(params);
        setRevenue(rData);
      } else if (activeTab === 'projects' && !isVendor) {
        const pData = await reportService.getProjects(params);
        setProjects(pData);
      } else if (activeTab === 'deployments' && !isVendor) {
        const dData = await reportService.getDeployments(params);
        setDeployments(dData);
      } else if (activeTab === 'customers' && !isVendor) {
        const cData = await reportService.getCustomers(params);
        setCustomers(cData);
      } else if (activeTab === 'vendors' && (isAdmin || isVendor)) {
        const vData = await reportService.getVendors(params);
        setVendors(vData);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load live database reporting data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [preset, activeTab]);

  const handleExport = async (type: 'sales' | 'revenue' | 'projects' | 'deployments') => {
    try {
      setIsExporting(true);
      await reportService.downloadExport(type, getDateParams());
    } catch (err: any) {
      alert(err.message || 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-green-200/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Intelligence &amp; Reports</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60 uppercase">
              {role || 'User'} View
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics calculated exclusively from verified database records. Zero mock data.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={preset}
              onChange={e => setPreset(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
              />
              <Button size="sm" variant="outline" onClick={loadData}>Apply</Button>
            </div>
          )}

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          {/* Export Dropdown / Trigger */}
          <div className="relative group">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 hidden group-hover:block">
              <button
                onClick={() => handleExport('sales')}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
              >
                Export Sales Report
              </button>
              <button
                onClick={() => handleExport('revenue')}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
              >
                Export Revenue Report
              </button>
              {!isVendor && (
                <>
                  <button
                    onClick={() => handleExport('projects')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Export Projects Report
                  </button>
                  <button
                    onClick={() => handleExport('deployments')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Export Deployments Report
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-red-700">
            <span className="font-semibold">Error: </span>
            {error}
          </div>
          <button onClick={loadData} className="text-xs font-semibold text-red-800 underline">
            Retry
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3.5 transition-all border-b-2 ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Executive Overview
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-3 px-3.5 transition-all border-b-2 ${
            activeTab === 'sales'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sales &amp; Orders
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`pb-3 px-3.5 transition-all border-b-2 ${
            activeTab === 'revenue'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Revenue &amp; Payments
        </button>
        {!isVendor && (
          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-3 px-3.5 transition-all border-b-2 ${
              activeTab === 'projects'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Projects &amp; Velocity
          </button>
        )}
        {!isVendor && (
          <button
            onClick={() => setActiveTab('deployments')}
            className={`pb-3 px-3.5 transition-all border-b-2 ${
              activeTab === 'deployments'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Deployments &amp; Live Sites
          </button>
        )}
        {!isVendor && (
          <button
            onClick={() => setActiveTab('customers')}
            className={`pb-3 px-3.5 transition-all border-b-2 ${
              activeTab === 'customers'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {isAdmin ? 'Customer Directory' : 'My Account Stats'}
          </button>
        )}
        {(isAdmin || isVendor) && (
          <button
            onClick={() => setActiveTab('vendors')}
            className={`pb-3 px-3.5 transition-all border-b-2 ${
              activeTab === 'vendors'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {isVendor ? 'My Vendor Performance' : 'Vendor Marketplace'}
          </button>
        )}
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue Metric */}
            <div className="bg-white p-5 rounded-2xl border border-green-200/60 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {isCustomer ? 'Total Spent' : 'Net Verified Revenue'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  ${overview?.financials?.netRevenue?.toLocaleString() ?? 0}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                  <span>Gross: ${overview?.financials?.grossRevenue?.toLocaleString() ?? 0}</span>
                  {overview?.financials?.refundedRevenue > 0 && (
                    <span className="text-red-500">(-${overview?.financials?.refundedRevenue})</span>
                  )}
                </div>
              </div>
            </div>

            {/* Paid Orders Metric */}
            <div className="bg-white p-5 rounded-2xl border border-green-200/60 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Paid Orders</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  {overview?.orders?.paid ?? 0}
                  <span className="text-xs font-normal text-slate-400 ml-1">/ {overview?.orders?.total ?? 0} total</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  AOV: ${overview?.financials?.averageOrderValue ?? 0} USD
                </div>
              </div>
            </div>

            {/* Projects Metric (or Templates for Vendor) */}
            {!isVendor ? (
              <div className="bg-white p-5 rounded-2xl border border-green-200/60 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Projects in Development</span>
                  <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">
                    {overview?.projects?.active ?? 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {overview?.projects?.delivered ?? 0} Delivered · {overview?.projects?.completed ?? 0} Approved
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-5 rounded-2xl border border-green-200/60 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Active Listings</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">
                    {overview?.vendor?.activeListings ?? 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {overview?.vendor?.templatesCount ?? 0} Total Catalog Items
                  </div>
                </div>
              </div>
            )}

            {/* Deployments Metric (or Platform Users for Admin) */}
            {isAdmin && overview?.users ? (
              <div className="bg-white p-5 rounded-2xl border border-green-200/60 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Platform Users</span>
                  <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">
                    {overview?.users?.total ?? 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    +{overview?.users?.newUsers ?? 0} new in this period
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-5 rounded-2xl border border-green-200/60 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Live Published Websites</span>
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">
                    {overview?.deployments?.published ?? 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {overview?.deployments?.failed ?? 0} Failed · {overview?.deployments?.deploying ?? 0} In Progress
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sales Breakdown by Category */}
          <div className="bg-white p-6 rounded-2xl border border-green-200/60 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              Verified Sales Breakdown by Product Type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Marketplace Templates</span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  ${overview?.financials?.salesByType?.templates?.revenue?.toLocaleString() ?? 0}
                </div>
                <span className="text-xs text-slate-400">
                  {overview?.financials?.salesByType?.templates?.count ?? 0} units purchased
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Custom Website Packages</span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  ${overview?.financials?.salesByType?.customWebsites?.revenue?.toLocaleString() ?? 0}
                </div>
                <span className="text-xs text-slate-400">
                  {overview?.financials?.salesByType?.customWebsites?.count ?? 0} custom builds commissioned
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Digital Goods &amp; Products</span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  ${overview?.financials?.salesByType?.products?.revenue?.toLocaleString() ?? 0}
                </div>
                <span className="text-xs text-slate-400">
                  {overview?.financials?.salesByType?.products?.count ?? 0} items purchased
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES & ORDERS */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {sales && (
            <>
              {/* Sales Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Total Revenue (Paid)</span>
                  <div className="text-xl font-bold text-emerald-700 mt-1">${sales.summary.totalPaidRevenue}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Paid Orders</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{sales.summary.paidOrders}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Failed / Declined</span>
                  <div className="text-xl font-bold text-red-600 mt-1">{sales.summary.failedOrders}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Refunded</span>
                  <div className="text-xl font-bold text-amber-600 mt-1">{sales.summary.refundedOrders}</div>
                </div>
              </div>

              {/* Timeline Graph */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Sales Velocity Over Time
                </h3>
                {sales.timeline.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">No orders recorded in this date range.</div>
                ) : (
                  <div className="space-y-3">
                    {sales.timeline.map((point: any) => (
                      <div key={point.date} className="flex items-center gap-4 text-xs">
                        <span className="w-24 font-mono text-slate-500 font-semibold">{point.date}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-3.5 overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (point.grossRevenue / (sales.summary.totalPaidRevenue || 1)) * 100)}%`
                            }}
                          />
                        </div>
                        <span className="w-20 font-bold text-slate-900 text-right">${point.grossRevenue}</span>
                        <span className="w-16 text-slate-400 text-right">({point.paidCount} paid)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Selling Templates */}
              {sales.salesByTemplate.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Top Performing Templates</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="pb-2">Template Name</th>
                          <th className="pb-2">Category</th>
                          <th className="pb-2">Units Sold</th>
                          <th className="pb-2 text-right">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sales.salesByTemplate.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="py-2.5 font-semibold text-slate-800">{t.name}</td>
                            <td className="py-2.5 text-slate-500">{t.category}</td>
                            <td className="py-2.5 font-medium text-slate-700">{t.unitsSold}</td>
                            <td className="py-2.5 font-bold text-emerald-700 text-right">${t.totalRevenue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 3: REVENUE & PAYMENTS */}
      {activeTab === 'revenue' && revenue && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-green-200/60">
              <span className="text-xs text-slate-500 font-semibold">Gross Processed</span>
              <div className="text-2xl font-black text-slate-900 mt-1">${revenue.financials.grossRevenue}</div>
              <span className="text-xs text-emerald-600 font-medium mt-1 block">
                {revenue.financials.paidTransactionsCount} verified successful payments
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-green-200/60">
              <span className="text-xs text-slate-500 font-semibold">Total Refunded</span>
              <div className="text-2xl font-black text-red-600 mt-1">-${revenue.financials.refundedRevenue}</div>
              <span className="text-xs text-slate-400 mt-1 block">
                {revenue.financials.refundedTransactionsCount} refund transactions
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-green-200/60">
              <span className="text-xs text-slate-500 font-semibold">Net Realized Revenue</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">${revenue.financials.netRevenue}</div>
              <span className="text-xs text-slate-400 mt-1 block">
                Excludes pending and failed payments
              </span>
            </div>
          </div>

          {/* Payment Transactions Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Verified Payment Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-2">Transaction ID</th>
                    <th className="pb-2">Order #</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Provider</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {revenue.transactions.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-mono text-slate-500">{t.id}</td>
                      <td className="py-2.5 font-semibold text-slate-800">{t.orderNumber}</td>
                      <td className="py-2.5 font-bold text-slate-900">${t.amount} {t.currency}</td>
                      <td className="py-2.5 uppercase text-slate-600 font-mono text-[11px]">{t.provider}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          t.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'REFUNDED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400 text-right">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PROJECTS & VELOCITY */}
      {activeTab === 'projects' && projects && !isVendor && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Total Projects</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{projects.totalProjects}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Overdue Deadlines</span>
              <div className="text-xl font-bold text-red-600 mt-1">{projects.overdueProjects}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Avg Completion</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{projects.averageCompletionDays} days</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Delivered</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                {projects.statusBreakdown?.DELIVERED || 0}
              </div>
            </div>
          </div>

          {/* Status Breakdown Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Project Status Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(projects.statusBreakdown).map(([status, count]) => (
                <div key={status} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">{status}</span>
                  <span className="font-bold text-xs bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-800">
                    {count as number}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Project Details Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Active Projects List</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-2">Project #</th>
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Package</th>
                    <th className="pb-2">Priority</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Delivery Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.projects.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-semibold text-slate-900">{p.projectNumber}</td>
                      <td className="py-2.5 text-slate-700">{p.name}</td>
                      <td className="py-2.5 text-slate-500">{p.packageName}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.priority === 'URGENT' || p.priority === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.priority}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400 text-right">
                        {p.estimatedDeliveryDate || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DEPLOYMENTS & LIVE SITES */}
      {activeTab === 'deployments' && deployments && !isVendor && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Total Deployments</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{deployments.totalDeployments}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Currently Published</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">{deployments.publishedCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Failed Attempts</span>
              <div className="text-xl font-bold text-red-600 mt-1">{deployments.failedCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Success Rate</span>
              <div className="text-xl font-bold text-blue-600 mt-1">{deployments.successRate}%</div>
            </div>
          </div>

          {/* Deployments History List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Deployment Records</h3>
            {deployments.deployments.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No deployment records found for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="pb-2">Deployment ID</th>
                      <th className="pb-2">Provider</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">URL / Error</th>
                      <th className="pb-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deployments.deployments.map((d: any) => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-mono text-slate-500">{d.id}</td>
                        <td className="py-2.5 uppercase font-mono text-[11px] text-slate-700">{d.provider}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            d.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="py-2.5">
                          {d.deploymentUrl ? (
                            <a
                              href={d.deploymentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:underline flex items-center gap-1 font-medium"
                            >
                              {d.deploymentUrl} <ArrowUpRight className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400">{d.errorMessage || 'N/A'}</span>
                          )}
                        </td>
                        <td className="py-2.5 text-slate-400 text-right">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: CUSTOMERS / DIRECTORY */}
      {activeTab === 'customers' && customers && !isVendor && (
        <div className="space-y-6">
          {customers.isSelfView ? (
            <div className="bg-white p-6 rounded-2xl border border-green-200/60">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Customer Account Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-500 font-medium">Total Orders Placed</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{customers.metrics.totalOrders}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-500 font-medium">Total Spent</span>
                  <div className="text-xl font-bold text-emerald-700 mt-1">${customers.metrics.totalSpent}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-500 font-medium">Custom Website Orders</span>
                  <div className="text-xl font-bold text-blue-700 mt-1">{customers.metrics.customWebsiteOrdersCount}</div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Total Customers</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{customers.summary.totalCustomers}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Active (Placed Order)</span>
                  <div className="text-xl font-bold text-emerald-700 mt-1">{customers.summary.activeCustomers}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">New Customers</span>
                  <div className="text-xl font-bold text-blue-600 mt-1">{customers.summary.newCustomersInRange}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Avg Lifetime Spend</span>
                  <div className="text-xl font-bold text-purple-700 mt-1">${customers.summary.averageSpendPerCustomer}</div>
                </div>
              </div>

              {/* Customers Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Top Customers by Lifetime Spend</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="pb-2">Name</th>
                        <th className="pb-2">Email</th>
                        <th className="pb-2">Total Orders</th>
                        <th className="pb-2">Paid Orders</th>
                        <th className="pb-2 text-right">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.topCustomers.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-semibold text-slate-800">{c.name}</td>
                          <td className="py-2.5 text-slate-500 font-mono text-[11px]">{c.email}</td>
                          <td className="py-2.5 text-slate-700">{c.totalOrders}</td>
                          <td className="py-2.5 text-emerald-700 font-semibold">{c.paidOrders}</td>
                          <td className="py-2.5 font-bold text-slate-900 text-right">${c.totalSpent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 7: VENDORS */}
      {activeTab === 'vendors' && vendors && (isAdmin || isVendor) && (
        <div className="space-y-6">
          {vendors.vendors.map((v: any) => (
            <div key={v.vendorId} className="bg-white p-6 rounded-2xl border border-green-200/60 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{v.vendorName}</h3>
                  {v.vendorEmail && <span className="text-xs text-slate-400 font-mono">{v.vendorEmail}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold">
                    {v.activeListings} Active / {v.totalTemplates} Total Listings
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold">
                    ${v.totalRevenue} Total Sales Revenue
                  </span>
                </div>
              </div>

              {/* Top Templates */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Marketplace Products
                </h4>
                {v.topTemplates.length === 0 ? (
                  <div className="text-xs text-slate-400 py-3">No templates registered yet.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {v.topTemplates.map((t: any) => (
                      <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="font-semibold text-xs text-slate-800">{t.name}</div>
                        <div className="flex items-center justify-between mt-2 text-[11px]">
                          <span className="text-slate-500">${t.price} USD</span>
                          <span className="font-bold text-emerald-700">{t.salesCount} sold (${t.revenue})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default BusinessDashboardPage;
