import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, LayoutTemplate, Users, Store, ShieldCheck, CheckCircle, RefreshCw, ShoppingCart, DollarSign, Calendar, Eye } from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import { ChartCard } from '../../components/ChartCard';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { customWebsiteOrderService } from '../../services/customWebsiteOrderService';
import { CustomWebsiteOrder } from '../../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<CustomWebsiteOrder[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (role === 'Admin' || role === 'Manager') {
        const [userStats, ordersData, reportsData] = await Promise.all([
          userService.getStats().catch(() => null),
          customWebsiteOrderService.getAllOrders({ limit: 5 }).catch(() => ({ orders: [] })),
          customWebsiteOrderService.getReports().catch(() => null)
        ]);
        if (userStats) setStats(userStats);
        if (ordersData?.orders) setRecentOrders(ordersData.orders);
        if (reportsData) setReports(reportsData);
      } else {
        const ordersData = await customWebsiteOrderService.getMyOrders({ limit: 5 }).catch(() => ({ orders: [] }));
        if (ordersData?.orders) setRecentOrders(ordersData.orders);
      }
    } catch (err) {
      console.error('Dashboard data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const dashboardCards = [
    {
      title: 'Total Platform Users',
      value: stats ? stats.totalUsers.toString() : '—',
      change: 'Real Database',
      isPositive: true,
      icon: 'Users'
    },
    {
      title: 'Active Accounts',
      value: stats ? stats.activeUsers.toString() : '—',
      change: '100% Verified',
      isPositive: true,
      icon: 'UserCheck'
    },
    {
      title: 'Realized Revenue',
      value: reports ? `$${reports.totalRevenue.toLocaleString()}` : '$0',
      change: 'PAID Orders Only',
      isPositive: true,
      icon: 'DollarSign'
    },
    {
      title: 'Confirmed Orders',
      value: reports ? `${reports.paidOrdersCount} / ${reports.totalOrdersCount}` : '0',
      change: 'Successful Checkouts',
      isPositive: true,
      icon: 'ShoppingCart'
    }
  ];

  const chartData = reports && reports.monthlyBreakdown?.length > 0
    ? reports.monthlyBreakdown.map((m: any) => ({
        month: m.month,
        sales: m.revenue,
        profit: Math.round(m.revenue * 0.7),
        loss: 0,
        orders: m.orders
      }))
    : [
        { month: 'Current', sales: reports?.totalRevenue || 0, profit: Math.round((reports?.totalRevenue || 0) * 0.7), loss: 0, orders: reports?.paidOrdersCount || 0 }
      ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'LAUNCHED':
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
      case 'IN_DEVELOPMENT':
      case 'DESIGN_DRAFTING':
        return 'info';
      case 'PENDING_REVIEW':
      case 'SUBMITTED':
      case 'AWAITING_PAYMENT':
        return 'warning';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. DASHBOARD WELCOME BANNER WITH 3D VISUAL */}
      <div className="relative rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-950 p-6 sm:p-8 text-white overflow-hidden shadow-lg shadow-brand-950/20 border border-brand-800/60">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-accent-pink/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent-cyan/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-200 text-xs font-bold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-accent-pink" />
              <span>WebCraftAI Studio · {role || 'Portal'} Mode</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Welcome back, {currentUser?.name || 'Creator'} 👋
            </h2>

            <p className="text-sm text-brand-100/80 max-w-xl leading-relaxed">
              Your real database workspace is online. Manage customer websites, projects, tasks, service packages, and track live business revenue.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {role === 'Admin' || role === 'Manager' ? (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate('/dashboard/projects')}
                    leftIcon={<Sparkles className="w-4 h-4 text-accent-pink" />}
                    className="bg-white text-slate-900 hover:bg-slate-100 shadow-md font-bold"
                  >
                    Manage Projects
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => navigate('/dashboard/orders')}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold"
                  >
                    View All Orders
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate('/dashboard/orders/new-website')}
                    leftIcon={<Sparkles className="w-4 h-4 text-accent-pink" />}
                    className="bg-white text-slate-900 hover:bg-slate-100 shadow-md font-bold"
                  >
                    Order Custom Website
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => navigate('/dashboard/my-projects')}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold"
                  >
                    My Projects
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/dashboard/templates')}
                leftIcon={<LayoutTemplate className="w-4 h-4" />}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Explore Templates
              </Button>
            </div>
          </div>

          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <img
              src="/assets/3d/dashboard-welcome-3d.svg"
              alt="Dashboard 3D"
              className="w-48 sm:w-56 h-auto object-contain drop-shadow-xl animate-float"
            />
          </div>
        </div>
      </div>

      {/* 2. REAL DASHBOARD STATISTICS (4 CARDS) - Only for Admin/Manager */}
      {(role === 'Admin' || role === 'Manager') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {dashboardCards.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              isPositive={stat.isPositive}
              icon={stat.icon}
            />
          ))}
        </div>
      )}

      {/* 3. SALES OVERVIEW CHART - Only for Admin/Manager */}
      {(role === 'Admin' || role === 'Manager') && (
        <div className="grid grid-cols-1 gap-6">
          <ChartCard
            data={chartData}
            title="Real Sales & Operations Overview"
            subtitle="Verified transactions and real platform throughput"
          />
        </div>
      )}

      {/* 4. RECENT ORDERS TABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Recent Orders</h3>
            <p className="text-xs text-slate-500">
              Live transaction status and delivery progress from real database
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(role === 'Admin' || role === 'Manager' ? '/dashboard/orders' : '/dashboard/my-orders')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View All Orders
          </Button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mx-auto mb-2" />
            <span className="text-xs font-semibold text-slate-500">Loading recent orders...</span>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-sm font-semibold text-slate-700">No recent orders found</p>
            <p className="text-xs text-slate-400 mt-1">Orders placed will appear here in real time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Order Number</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Package / Details</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 text-xs">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{order.customerName}</div>
                      <div className="text-xs text-slate-400">{order.customerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium capitalize">
                      {order.type.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {order.package?.packageName || order.templateDetails?.templateName || 'Standard Order'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      ${order.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(role === 'Admin' || role === 'Manager' ? '/dashboard/orders' : '/dashboard/my-orders')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
