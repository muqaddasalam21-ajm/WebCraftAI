import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomWebsitePackage } from '../../types';
import { servicePackageService } from '../../services/servicePackageService';
import { useAuth } from '../../contexts/AuthContext';

const ServicePackagesPage: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<CustomWebsitePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isAdminOrManager = role === 'Admin' || role === 'Manager';

  useEffect(() => {
    if (!isAdminOrManager) { navigate('/dashboard'); return; }
    loadPackages();
  }, [isAdminOrManager]);

  async function loadPackages() {
    setLoading(true); setError('');
    try {
      const res = await servicePackageService.getAll();
      setPackages(res.packages);
    } catch (e: any) { setError(e.message || 'Failed to load packages'); }
    finally { setLoading(false); }
  }

  async function handleToggleStatus(pkg: CustomWebsitePackage) {
    setActionLoading(pkg.id); setActionMsg('');
    try {
      await servicePackageService.setStatus(pkg.id, !pkg.isActive);
      setActionMsg(`Package "${pkg.name}" ${pkg.isActive ? 'deactivated' : 'activated'}.`);
      await loadPackages();
    } catch (e: any) { setActionMsg(`Error: ${e.message}`); }
    finally { setActionLoading(null); }
  }

  async function handleDelete(id: string) {
    setActionLoading(id); setActionMsg('');
    try {
      await servicePackageService.deletePackage(id);
      setActionMsg('Package deleted successfully.');
      setDeleteConfirm(null);
      await loadPackages();
    } catch (e: any) { setActionMsg(`Error: ${e.message}`); setDeleteConfirm(null); }
    finally { setActionLoading(null); }
  }

  const supportColor = (level: string) => {
    const m: Record<string, string> = {
      basic: 'bg-gray-100 text-gray-700',
      standard: 'bg-blue-100 text-blue-700',
      priority: 'bg-purple-100 text-purple-700',
      dedicated: 'bg-amber-100 text-amber-700',
    };
    return m[level] || 'bg-gray-100 text-gray-700';
  };

  if (!isAdminOrManager) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Packages</h1>
          <p className="text-gray-500 mt-1">Manage custom website service packages offered to customers.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/service-packages/new')}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Package
        </button>
      </div>

      {actionMsg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${actionMsg.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {actionMsg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-500 font-medium">{error}</p>
          <button onClick={loadPackages} className="mt-4 text-indigo-600 hover:underline">Retry</button>
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Service Packages Yet</h3>
          <p className="text-gray-400 mb-6">Create your first package to offer custom website services to customers.</p>
          <button
            onClick={() => navigate('/dashboard/service-packages/new')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Create First Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <div key={pkg.id} className={`bg-white rounded-2xl border-2 shadow-sm flex flex-col ${pkg.isActive ? 'border-gray-200' : 'border-gray-100 opacity-70'} ${pkg.featured ? 'ring-2 ring-indigo-500' : ''}`}>
              {pkg.featured && (
                <div className="bg-indigo-600 text-white text-xs font-bold text-center py-1 rounded-t-xl tracking-wide uppercase">
                  Featured
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{pkg.name}</h3>
                    <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{pkg.description}</p>
                  </div>
                  <span className={`ml-2 shrink-0 text-xs px-2 py-1 rounded-full font-semibold ${pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {pkg.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="text-3xl font-extrabold text-gray-900 mb-1">
                  ${pkg.price.toLocaleString()}
                  <span className="text-base font-normal text-gray-400 ml-1">{pkg.currency}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-gray-800">{pkg.pageLimit}</div>
                    <div className="text-xs text-gray-500">Pages</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-gray-800">{pkg.revisionLimit}</div>
                    <div className="text-xs text-gray-500">Revisions</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-gray-800">{pkg.deliveryDays}d</div>
                    <div className="text-xs text-gray-500">Delivery</div>
                  </div>
                </div>

                <span className={`text-xs px-2 py-1 rounded-full font-medium self-start mb-4 ${supportColor(pkg.supportLevel)}`}>
                  {pkg.supportLevel.charAt(0).toUpperCase() + pkg.supportLevel.slice(1)} Support
                </span>

                {pkg.features.length > 0 && (
                  <ul className="space-y-1 mb-4">
                    {pkg.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                    {pkg.features.length > 4 && (
                      <li className="text-xs text-gray-400 pl-6">+{pkg.features.length - 4} more</li>
                    )}
                  </ul>
                )}

                <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/dashboard/service-packages/${pkg.id}/edit`)}
                    className="flex-1 text-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(pkg)}
                    disabled={actionLoading === pkg.id}
                    className={`flex-1 text-sm px-3 py-2 rounded-lg font-medium transition ${pkg.isActive ? 'bg-amber-100 hover:bg-amber-200 text-amber-700' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}
                  >
                    {actionLoading === pkg.id ? '...' : pkg.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  {role === 'Admin' && (
                    deleteConfirm === pkg.id ? (
                      <div className="w-full flex gap-2 mt-1">
                        <button onClick={() => handleDelete(pkg.id)} disabled={actionLoading === pkg.id}
                          className="flex-1 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium">
                          Confirm Delete
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="flex-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(pkg.id)}
                        className="text-sm bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg font-medium transition">
                        Delete
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicePackagesPage;
