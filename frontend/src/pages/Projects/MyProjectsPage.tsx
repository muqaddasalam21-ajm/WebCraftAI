import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { WebsiteProject, ProjectStatus } from '../../types';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';

export const MyProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<WebsiteProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');
        const res = await projectService.getProjects();
        setProjects(res.projects);
      } catch (err: any) {
        setError(err.message || 'Failed to load your projects');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'PLANNING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-700">Planning</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Assigned</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">In Development</span>;
      case 'REVIEW':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Ready for Review</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Approved</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">Delivered & Live</span>;
      case 'ON_HOLD':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">On Hold</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FolderGit2 className="w-7 h-7 text-brand-600" />
            My Website Projects
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time delivery progress, milestones, and development updates for your custom websites.
          </p>
        </div>
        <div>
          <Button
            onClick={() => navigate('/dashboard/orders/new-website')}
            className="flex items-center gap-2 text-sm shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Order New Website
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse space-y-4">
              <div className="h-4 bg-slate-100 rounded w-1/4" />
              <div className="h-6 bg-slate-100 rounded w-2/3" />
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-2 bg-slate-100 rounded-full w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No Active Projects"
          description="You do not have any ongoing custom website projects yet. When you place a custom website order, its development project will appear here."
          icon={<FolderGit2 className="w-8 h-8 text-brand-600" />}
          actionText="Order Custom Website"
          onAction={() => navigate('/dashboard/orders/new-website')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/dashboard/projects/${p.id}`)}
              className="bg-white border border-slate-200 hover:border-brand-300 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
                    {p.projectNumber}
                  </span>
                  {getStatusBadge(p.status)}
                </div>

                <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition text-lg">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {p.description || 'Custom website project development'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Layers className="w-4 h-4 text-slate-400" />
                    Package: {p.packageName}
                  </span>
                  <span className="font-bold text-slate-900">
                    ${p.packagePrice} {p.packageCurrency}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Delivery Completion</span>
                    <span>{p.progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full transition-all duration-300"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Target Delivery: {p.estimatedDeliveryDate || 'Being scheduled'}
                  </span>
                  <span className="flex items-center gap-1 text-brand-600 font-semibold group-hover:translate-x-0.5 transition">
                    View Project <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProjectsPage;
