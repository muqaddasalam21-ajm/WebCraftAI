import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Building,
  Layers,
  Palette,
  UserCheck,
  Clock,
  Send,
  CheckCircle,
  ExternalLink,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { customWebsiteOrderService } from '../../services/customWebsiteOrderService';
import { userService } from '../../services/userService';
import { CustomWebsiteOrder, CustomWebsiteOrderStatus, User } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';

export const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { role, currentUser } = useAuth();

  const [order, setOrder] = useState<CustomWebsiteOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [previewUrlInput, setPreviewUrlInput] = useState('');
  const [deliveredUrlInput, setDeliveredUrlInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Staff assignment state
  const [staffList, setStaffList] = useState<User[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const isAdmin = role === 'Admin';
  const isManager = role === 'Manager';
  const isStaff = isAdmin || isManager;
  const isOwner = currentUser?.id === order?.customerId;

  const loadOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const data = await customWebsiteOrderService.getOrderById(id);
      setOrder(data.order);
      if (data.order.previewUrl) setPreviewUrlInput(data.order.previewUrl);
      if (data.order.deliveredUrl) setDeliveredUrlInput(data.order.deliveredUrl);
      if (data.order.assignedStaffId) setSelectedStaffId(data.order.assignedStaffId);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  useEffect(() => {
    if (isStaff) {
      const loadStaff = async () => {
        try {
          const res = await userService.getUsers({ limit: 100 });
          const staff = res.users.filter((u) => u.role === 'Admin' || u.role === 'Manager');
          setStaffList(staff);
        } catch (err) {
          console.error('Failed to load staff list:', err);
        }
      };
      loadStaff();
    }
  }, [isStaff]);

  const handleUpdateStatus = async (newStatus: CustomWebsiteOrderStatus) => {
    if (!id) return;
    try {
      setActionLoading(true);
      const res = await customWebsiteOrderService.updateOrderStatus(
        id,
        newStatus,
        statusNotes,
        previewUrlInput.trim() || undefined,
        deliveredUrlInput.trim() || undefined
      );
      setOrder(res.order);
      setStatusNotes('');
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!id || !selectedStaffId) return;
    try {
      setActionLoading(true);
      const res = await customWebsiteOrderService.assignStaff(id, selectedStaffId);
      setOrder(res.order);
      alert('Staff assigned successfully.');
    } catch (err: any) {
      alert('Failed to assign staff: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Unable to Load Order</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{error || 'Order does not exist.'}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/orders')}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const justCreated = location.state?.newOrderCreated;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Back Button & Top Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/dashboard/orders')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>

        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} size="md" />
          <span className="text-xs font-bold text-slate-400">·</span>
          <span className="text-xs font-mono font-bold text-slate-700">{order.orderNumber}</span>
        </div>
      </div>

      {/* Confirmation Banner if newly submitted */}
      {justCreated && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 space-y-0.5">
            <p className="font-bold">Order Received &amp; Logged in Real Database!</p>
            <p className="text-emerald-700">
              Your custom website order <span className="font-mono font-bold">{order.orderNumber}</span> is now active in the production queue. Our engineering staff will review your specifications.
            </p>
          </div>
        </div>
      )}

      {/* Hero Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-black uppercase rounded-md">
                {order.type === 'template' ? 'Marketplace Template' : 'Custom Website Service'}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Ordered on {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {order.type === 'template'
                ? (order.templateDetails?.templateName || 'Website Template')
                : (order.businessInfo?.businessName || 'Custom Website')}
            </h1>
            <p className="text-xs text-slate-500">
              Customer: <span className="font-semibold text-slate-700">{order.customerName}</span> ({order.customerEmail})
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {order.type === 'template'
                ? 'Template License'
                : (order.package?.packageName || 'Custom Build')}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">${order.amount}</span>
              <span className="text-xs font-bold text-slate-500">USD</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                order.paymentStatus === 'PAID'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                Payment Status: {order.paymentStatus}
              </span>
              {order.paymentStatus !== 'PAID' && isOwner && (
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => navigate(`/checkout?orderId=${order.id}`)}
                >
                  Pay Now
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Deliverables / Live Links Banner (if ready) */}
        {(order.previewUrl || order.deliveredUrl) && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200 space-y-3">
            <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wider">Website Deliverables</h3>
            <div className="flex flex-wrap gap-3">
              {order.previewUrl && (
                <a
                  href={order.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-brand-300 text-brand-700 font-bold text-xs hover:bg-brand-50 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Live Preview
                </a>
              )}
              {order.deliveredUrl && (
                <a
                  href={order.deliveredUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Final Production Site
                </a>
              )}
            </div>
          </div>
        )}

        {/* Customer Approval / Revision Actions */}
        {isOwner && order.status === 'PREVIEW_READY' && (
          <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-200 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Your Website Preview is Ready for Review!</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Please inspect your live website preview. You can approve it to finalize the build, or request revisions.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Revision Notes (Optional if approving):</label>
              <textarea
                rows={2}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Mention any changes to text, images, styling, or section orders..."
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleUpdateStatus('CUSTOMER_APPROVED')}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Approve Website Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!statusNotes.trim()) {
                    alert('Please enter revision notes describing what you would like changed.');
                    return;
                  }
                  handleUpdateStatus('REVISION_REQUESTED');
                }}
                disabled={actionLoading}
                className="border-rose-300 text-rose-700 hover:bg-rose-50"
              >
                Request Revisions
              </Button>
            </div>
          </div>
        )}

        {/* Staff Assignment & Workflow Controls (Admin & Manager) */}
        {isStaff && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-brand-600" /> Staff Fulfillment &amp; Workflow Controls
              </h3>
              <span className="text-[11px] text-slate-500">
                Assigned: <strong className="text-slate-800">{order.assignedStaffName || 'Unassigned'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Assign Staff */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">Assign Manager / Admin</label>
                <div className="flex gap-2">
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                  >
                    <option value="">Select staff member...</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.role}) - {st.email}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" variant="outline" onClick={handleAssignStaff} disabled={actionLoading}>
                    Assign
                  </Button>
                </div>
              </div>

              {/* Transition Status */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">Set Order Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      'REQUIREMENTS_REVIEW',
                      'CONFIRMED',
                      'IN_PROGRESS',
                      'PREVIEW_READY',
                      'REVISED',
                      'COMPLETED',
                      'DELIVERED',
                      'CANCELLED'
                    ] as CustomWebsiteOrderStatus[]
                  ).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(st)}
                      disabled={actionLoading || order.status === st}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        order.status === st
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview & Delivery URL inputs */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preview URL (Staging link):</label>
                  <input
                    type="url"
                    value={previewUrlInput}
                    onChange={(e) => setPreviewUrlInput(e.target.value)}
                    placeholder="https://staging.preview.webcraft.ai/site-xyz"
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivered Production URL:</label>
                  <input
                    type="url"
                    value={deliveredUrlInput}
                    onChange={(e) => setDeliveredUrlInput(e.target.value)}
                    placeholder="https://clientdomain.com"
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Status Transition Notes / Reason:</label>
                <input
                  type="text"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="e.g. Prototype complete, deployed to staging sandbox"
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Order Details: Template Specific OR Custom Website Columns */}
        {order.type === 'template' && order.templateDetails ? (
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-600" /> Purchased Website Template Specs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl overflow-hidden bg-slate-200 aspect-[16/10] border border-slate-300">
                <img
                  src={order.templateDetails.templateThumbnail || '/assets/templates/placeholder.svg'}
                  alt={order.templateDetails.templateName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
              <div className="space-y-3 text-xs md:col-span-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Template Name</span>
                  <p className="font-bold text-base text-slate-900">{order.templateDetails.templateName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Vendor / Creator</span>
                  <p className="font-semibold text-slate-700">{order.templateDetails.vendorName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Category</span>
                    <p className="font-medium text-slate-700">{order.templateDetails.templateCategory}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Technology</span>
                    <p className="font-medium text-slate-700">{order.templateDetails.technology || 'React + Tailwind'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : order.businessInfo && order.requirements && order.designPreferences ? (
          /* Detailed Sections Grid for Custom Websites */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* Column 1: Business Profile */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-brand-600" /> Business Profile
              </h3>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Type &amp; Category</span>
                  <p className="font-semibold text-slate-800">
                    {order.businessInfo.businessType} · {order.businessInfo.industryCategory}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Website Purpose</span>
                  <p className="text-slate-700 font-medium">{order.businessInfo.websitePurpose}</p>
                </div>
                {order.businessInfo.businessDescription && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Description</span>
                    <p className="text-slate-600 leading-relaxed">{order.businessInfo.businessDescription}</p>
                  </div>
                )}
                {order.businessInfo.location && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Location</span>
                    <p className="text-slate-700">{order.businessInfo.location}</p>
                  </div>
                )}
                {order.businessInfo.whatsappNumber && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">WhatsApp Contact</span>
                    <p className="font-mono text-slate-800 font-semibold">{order.businessInfo.whatsappNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Scope & Requirements */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-600" /> Scope &amp; Architecture
              </h3>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Required Pages</span>
                  <div className="flex flex-wrap gap-1">
                    {order.requirements.requiredPages.map((p) => (
                      <span key={p} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-semibold text-[11px]">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                {order.requirements.requiredSections.length > 0 && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Key Sections</span>
                    <div className="flex flex-wrap gap-1">
                      {order.requirements.requiredSections.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {order.requirements.servicesOffered.length > 0 && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Services Offered</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
                      {order.requirements.servicesOffered.map((serv, idx) => (
                        <li key={idx}>{serv}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {order.requirements.additionalNotes && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Special Notes</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{order.requirements.additionalNotes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Design & Assets */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-brand-600" /> Design &amp; Brand
              </h3>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Style &amp; Mood</span>
                  <p className="font-semibold text-slate-800">{order.designPreferences.preferredStyle}</p>
                  <p className="text-slate-500 text-[11px]">{order.designPreferences.websiteMood}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Typography</span>
                  <p className="text-slate-700">{order.designPreferences.preferredTypography}</p>
                </div>
                {order.designPreferences.referenceWebsiteUrl && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Inspiration Link</span>
                    <a
                      href={order.designPreferences.referenceWebsiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 font-semibold hover:underline truncate block"
                    >
                      {order.designPreferences.referenceWebsiteUrl}
                    </a>
                  </div>
                )}
                {order.designPreferences.logoUrl && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Attached Logo</span>
                    <a
                      href={order.designPreferences.logoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-brand-600 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Uploaded Logo
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Status History Timeline */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-brand-600" /> Real Status History &amp; Audit Trail
          </h3>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {order.statusHistory.map((hist, idx) => (
              <div key={hist.id || idx} className="relative text-xs space-y-0.5">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">
                    {hist.fromStatus !== 'NONE' ? `${hist.fromStatus} → ` : ''}{hist.toStatus}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(hist.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-600">{hist.notes}</p>
                <p className="text-[10px] text-slate-400">
                  By: {hist.changedByUserName} ({hist.changedByUserRole})
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
