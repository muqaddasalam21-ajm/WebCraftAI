import React, { useState, useRef, useEffect } from 'react';
import { Search, X, LayoutTemplate, Package, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockTemplates } from '../data/mockTemplates';
import { mockProducts } from '../data/mockProducts';
import { mockOrders } from '../data/mockOrders';
import { SearchResultItem } from '../types';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter local mock data across templates, products, orders
  const results: SearchResultItem[] = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const templateMatches: SearchResultItem[] = mockTemplates
      .filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q)))
      .map(t => ({
        id: t.id,
        title: t.name,
        category: 'Template',
        subtitle: `${t.category} · ${t.price}`,
        route: '/dashboard/templates'
      }));

    const productMatches: SearchResultItem[] = mockProducts
      .filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.vendorName || (p as any).vendor || '').toLowerCase().includes(q))
      .map(p => ({
        id: p.id,
        title: p.name,
        category: 'Product',
        subtitle: `${p.category} · $${p.price.toFixed(2)}`,
        route: '/dashboard/products'
      }));

    const orderMatches: SearchResultItem[] = mockOrders
      .filter(o => o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.productName.toLowerCase().includes(q))
      .map(o => ({
        id: o.id,
        title: `${o.id} - ${o.customerName}`,
        category: 'Order',
        subtitle: `${o.productName} · $${o.amount.toFixed(2)} (${o.status})`,
        route: '/dashboard/orders'
      }));

    return [...templateMatches, ...productMatches, ...orderMatches].slice(0, 8);
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
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-transparent focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3">
            Search Results ({results.length})
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
          ) : (
            <div className="p-6 text-center text-sm text-slate-500">
              No results found for <span className="font-semibold text-slate-800">"{query}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
