import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, LayoutTemplate, Package, ShoppingCart, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { templateService } from '../services/templateService';
import { productService } from '../services/productService';
import { customWebsiteOrderService } from '../services/customWebsiteOrderService';
import { SearchResultItem } from '../types';
import { formatPKR, formatCurrency } from '../utils/currency';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search templates, products, orders...',
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounced search across live services
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const [templatesRes, productsRes, ordersRes] = await Promise.allSettled([
          templateService.getTemplates({ search: trimmed, limit: 4, viewAll: false }),
          productService.getProducts({ search: trimmed, limit: 4 }),
          customWebsiteOrderService.getMyOrders({ search: trimmed, limit: 4 })
        ]);

        if (!isMounted) return;

        const templateMatches: SearchResultItem[] =
          templatesRes.status === 'fulfilled' && templatesRes.value.success && templatesRes.value.templates
            ? templatesRes.value.templates.map((t: any) => ({
                id: t.id,
                title: t.name,
                category: 'Template',
                subtitle: `${t.category} · ${formatPKR(t.price)}`,
                route: `/dashboard/templates/${t.id}/preview`
              }))
            : [];

        const productMatches: SearchResultItem[] =
          productsRes.status === 'fulfilled' && productsRes.value?.products
            ? productsRes.value.products.map((p: any) => ({
                id: p.id,
                title: p.name,
                category: 'Product',
                subtitle: `${p.category} · ${formatCurrency(p.price, p.currency)}`,
                route: '/dashboard/products'
              }))
            : [];

        const orderMatches: SearchResultItem[] =
          ordersRes.status === 'fulfilled' && ordersRes.value?.orders
            ? ordersRes.value.orders.map((o: any) => ({
                id: o.id,
                title: `${o.orderNumber || o.id} - ${o.businessName || o.customerName || 'Website Order'}`,
                category: 'Order',
                subtitle: `${o.businessType || 'Custom Website'} · ${formatCurrency(o.amount, o.currency || o.package?.currency)} (${o.status})`,
                route: `/dashboard/orders/${o.id}`
              }))
            : [];

        setResults([...templateMatches, ...productMatches, ...orderMatches].slice(0, 8));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 280);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    navigate(item.route);
  };

  const getCategoryIcon = (category: 'Template' | 'Product' | 'Order') => {
    switch (category) {
      case 'Template':
        return <LayoutTemplate className="w-4 h-4 text-brand-500" />;
      case 'Product':
        return <Package className="w-4 h-4 text-cyan-500" />;
      case 'Order':
        return <ShoppingCart className="w-4 h-4 text-pink-500" />;
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full max-w-md ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              setIsOpen(false);
              navigate(`/dashboard/templates?search=${encodeURIComponent(query.trim())}`);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-transparent focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none"
        />
        {isLoading ? (
          <Loader2 className="absolute right-2.5 w-4 h-4 text-brand-600 animate-spin" />
        ) : query ? (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 flex items-center justify-between">
            <span>Search Results ({results.length})</span>
            {isLoading && <span className="text-[10px] text-brand-600 lowercase font-normal flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Searching...</span>}
          </div>

          {results.length > 0 ? (
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
              {results.map((item) => (
                <div
                  key={`${item.category}-${item.id}`}
                  onClick={() => handleSelectResult(item)}
                  className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
          ) : !isLoading ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No results found for <span className="font-semibold text-slate-800">"{query}"</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
