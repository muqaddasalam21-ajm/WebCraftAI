import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Store, Star, ArrowUpRight, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { vendorService } from '../../services/vendorService';
import { Vendor } from '../../types';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';

export const VendorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await vendorService.getVendors();
      setVendors(res.vendors || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load verified vendors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const filteredVendors = vendors.filter((v) =>
    (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.company || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verified Template Vendors</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Partner studios and design creators selling on the WebCraftAI marketplace
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchVendors}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-slate-200/80 p-8">
          <RefreshCw className="w-7 h-7 text-brand-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading verified vendor partners...</p>
        </div>
      ) : error ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-rose-100 p-8 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="text-xs font-bold text-slate-800">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchVendors}>
            Retry
          </Button>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
          <Store className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No verified vendors found</p>
          <p className="text-xs text-slate-400 max-w-sm">
            {searchQuery ? `No vendors match "${searchQuery}".` : 'There are currently no active vendor accounts registered.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Vendor</th>
                <th className="py-3.5 px-4">Catalog Products</th>
                <th className="py-3.5 px-4">Total Sales</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          {vendor.name}
                          <CheckCircle className="w-3.5 h-3.5 text-brand-600" />
                        </p>
                        <p className="text-[11px] text-slate-400 font-normal">{vendor.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                    {vendor.productsCount} live {vendor.productsCount === 1 ? 'item' : 'items'}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-bold text-slate-900">
                    ${(vendor.totalSales ?? 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-bold text-amber-500">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{vendor.rating ? vendor.rating.toFixed(1) : '5.0'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={vendor.status === 'Verified' ? 'success' : 'neutral'} size="sm">
                      {vendor.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/dashboard/vendors/${vendor.id}`)}
                        className="px-2.5 py-1 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>View Profile</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/templates?vendorId=${vendor.id}`)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Catalog</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
