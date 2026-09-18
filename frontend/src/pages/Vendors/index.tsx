import React, { useState } from 'react';
import { Search, Store, Star, ArrowUpRight, CheckCircle } from 'lucide-react';
import { mockVendors } from '../../data/mockVendors';
import { Vendor } from '../../types';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';

export const VendorsPage: React.FC = () => {
  const [vendors] = useState<Vendor[]>(mockVendors);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.email.toLowerCase().includes(searchQuery.toLowerCase())
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
      </div>

      {/* Vendors Table */}
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
                  {vendor.productsCount} live templates
                </td>
                <td className="py-3.5 px-4 text-xs font-bold text-slate-900">
                  ${(vendor.totalSales ?? 0).toLocaleString()}
                </td>
                <td className="py-3.5 px-4 text-xs font-bold text-amber-500 flex items-center gap-1 pt-5">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{vendor.rating.toFixed(2)}</span>
                </td>
                <td className="py-3.5 px-4">
                  <Badge variant="success" size="sm">
                    {vendor.status}
                  </Badge>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => alert(`Opening vendor portal for ${vendor.name}`)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Profile</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
