import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  User,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { WebsiteProject, ProjectStatus, PriorityLevel } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All Projects', value: 'All' },
  { label: 'Planning', value: 'PLANNING' },
  { label: 'Assigned', value: 'ASSIGNED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Review', value: 'REVIEW' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Cancelled', value: 'CANCELLED' }
];

const PRIORITY_OPTIONS = ['All', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, currentUser } = useAuth();
  const isAdmin = role === 'Admin';
  const isManager = role === 'Manager';
  const isStaff = isAdmin || isManager;

  const [projects, setProjects] = useState<WebsiteProject[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [assignedOnly, setAssignedOnly] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 9;

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await projectService.getProjects({
        status: selectedStatus,
        priority: selectedPriority,
        search: searchQuery,
        assignedTo: isManager && assignedOnly ? currentUser?.id : undefined
      });
      setProjects(res.projects);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedPriority, searchQuery, assignedOnly, isManager, currentUser?.id]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'PLANNING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-700">Planning</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Assigned</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">In Progress</span>;
      case 'REVIEW':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Under Review</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Completed</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">Delivered</span>;
      case 'ON_HOLD':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">On Hold</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'LOW':
        return <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Low</span>;
      case 'MEDIUM':
        return <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Medium</span>;
      case 'HIGH':
        return <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">High</span>;
      case 'URGENT':
        return <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded animate-pulse">Urgent</span>;
    }
  };

  // Pagination slice
  const paginatedProjects = projects.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(projects.length / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FolderGit2 className="w-7 h-7 text-brand-600" />
            Website Development Projects
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real development project pipelines, milestone tracking, and staff assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/orders')}
            className="flex items-center gap-2 text-sm"
          >
            <Layers className="w-4 h-4" />
            View Orders
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by project #, title, description, package..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  Priority: {p}
                </option>
              ))}
            </select>
          </div>

          {/* Manager Assigned Toggle */}
          {isManager && (
            <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={assignedOnly}
                onChange={(e) => {
                  setAssignedOnly(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Assigned to me</span>
            </label>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === tab.value
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse space-y-4">
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-6 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-full" />
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
          title="No Projects Found"
          description="There are currently no active development projects matching your filter criteria. Projects are initiated from custom website orders."
          icon={<FolderGit2 className="w-8 h-8 text-brand-600" />}
          actionText="View Custom Orders"
          onAction={() => navigate('/dashboard/orders')}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/dashboard/projects/${p.id}`)}
                className="bg-white border border-slate-200 hover:border-brand-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                      {p.projectNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(p.priority)}
                      {getStatusBadge(p.status)}
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition text-base line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {p.description || 'No description provided.'}
                  </p>
                </div>

                {/* Package & Dates */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {p.packageName}
                    </span>
                    <span className="font-bold text-slate-900">
                      ${p.packagePrice} {p.packageCurrency}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>Overall Progress</span>
                      <span>{p.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full transition-all duration-300"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates & Assigned Lead */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due: {p.estimatedDeliveryDate || 'TBD'}
                    </span>
                    <span className="flex items-center gap-1 text-brand-600 font-semibold group-hover:translate-x-0.5 transition">
                      Details <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-xs text-slate-500 font-medium">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, projects.length)} of {projects.length} projects
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs font-semibold text-slate-700 px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
