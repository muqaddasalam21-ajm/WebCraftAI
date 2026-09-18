import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  User,
  ShieldCheck,
  TrendingUp,
  ListTodo,
  Flag,
  History,
  Info,
  ExternalLink,
  FileCheck,
  RotateCcw,
  Send,
  Globe
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';
import {
  WebsiteProject,
  ProjectTask,
  ProjectMilestone,
  ProjectStatusHistory,
  ProjectStatus,
  TaskStatus,
  MilestoneStatus,
  PriorityLevel,
  ProjectVersion,
  ProjectRevision,
  ProjectApproval,
  ProjectDelivery,
  User as UserType
} from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, currentUser } = useAuth();

  const isAdmin = role === 'Admin';
  const isManager = role === 'Manager';
  const isStaff = isAdmin || isManager;

  const [project, setProject] = useState<WebsiteProject | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [history, setHistory] = useState<ProjectStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'review' | 'tasks' | 'milestones' | 'history'>('overview');
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [revisions, setRevisions] = useState<ProjectRevision[]>([]);
  const [approval, setApproval] = useState<ProjectApproval | null>(null);
  const [delivery, setDelivery] = useState<ProjectDelivery | null>(null);

  // Version modal
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionForm, setVersionForm] = useState({
    title: '',
    description: '',
    previewUrl: '',
    submitForReview: true
  });

  // Revision modal
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionForm, setRevisionForm] = useState({
    requestedChanges: ''
  });

  // Approval modal
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState('');

  // Delivery modal
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    deliveredUrl: '',
    deliveryNotes: ''
  });

  // Staff options for assignment
  const [staffUsers, setStaffUsers] = useState<UserType[]>([]);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // New task modal / form state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as PriorityLevel,
    assignedTo: '',
    dueDate: ''
  });

  // Edit task modal state
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

  // New milestone modal / form state
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    description: '',
    dueDate: '',
    sortOrder: 1
  });

  // Edit milestone state
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);

  const loadProject = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const data = await projectService.getProjectById(id);
      setProject(data.project);
      setTasks(data.tasks);
      setMilestones(data.milestones);
      setHistory(data.history);
      setVersions(data.versions || []);
      setRevisions(data.revisions || []);
      setApproval(data.approval || null);
      setDelivery(data.delivery || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  useEffect(() => {
    if (isStaff) {
      userService.getUsers({ limit: 50 }).then((res) => {
        const staff = res.users.filter((u) => u.role === 'Admin' || u.role === 'Manager');
        setStaffUsers(staff);
      }).catch(() => {});
    }
  }, [isStaff]);

  // Handle Project Status Change
  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (!project) return;
    try {
      setActionLoading(true);
      await projectService.updateProjectStatus(project.id, newStatus, statusUpdateNote || undefined);
      setStatusUpdateNote('');
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Project Assignment Change
  const handleAssignChange = async (staffId: string) => {
    if (!project) return;
    try {
      setActionLoading(true);
      await projectService.assignProject(project.id, staffId || null);
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Failed to update assignment');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Project Progress Update
  const handleProgressChange = async (val: number) => {
    if (!project) return;
    try {
      await projectService.updateProject(project.id, { progress: val });
      setProject({ ...project, progress: val });
    } catch (err: any) {
      alert(err.message || 'Failed to update progress');
    }
  };

  // Task Handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      setActionLoading(true);
      await projectService.createTask(project.id, {
        title: taskForm.title,
        description: taskForm.description || undefined,
        priority: taskForm.priority,
        assignedTo: taskForm.assignedTo || undefined,
        dueDate: taskForm.dueDate || undefined
      });
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', assignedTo: '', dueDate: '' });
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await projectService.updateTaskStatus(taskId, newStatus);
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await projectService.deleteTask(taskId);
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  // Milestone Handlers
  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      setActionLoading(true);
      await projectService.createMilestone(project.id, {
        name: milestoneForm.name,
        description: milestoneForm.description || undefined,
        dueDate: milestoneForm.dueDate || undefined,
        sortOrder: Number(milestoneForm.sortOrder)
      });
      setShowMilestoneModal(false);
      setMilestoneForm({ name: '', description: '', dueDate: '', sortOrder: milestones.length + 2 });
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Failed to create milestone');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId: string, status: MilestoneStatus) => {
    try {
      await projectService.updateMilestoneStatus(milestoneId, status);
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Failed to update milestone status');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;
    try {
      await projectService.deleteMilestone(milestoneId);
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Failed to delete milestone');
    }
  };

  // Phase 13 Handlers
  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      setActionLoading(true);
      await projectService.createVersion(project.id, {
        title: versionForm.title,
        description: versionForm.description || undefined,
        previewUrl: versionForm.previewUrl,
        submitForReview: versionForm.submitForReview
      });
      setShowVersionModal(false);
      setVersionForm({ title: '', description: '', previewUrl: '', submitForReview: true });
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Failed to create version');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      setActionLoading(true);
      await projectService.requestRevision(project.id, {
        requestedChanges: revisionForm.requestedChanges
      });
      setShowRevisionModal(false);
      setRevisionForm({ requestedChanges: '' });
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Failed to request revision');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      setActionLoading(true);
      await projectService.approveProject(project.id, {
        feedback: approvalFeedback || undefined
      });
      setShowApprovalModal(false);
      setApprovalFeedback('');
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Failed to approve project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliverProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      setActionLoading(true);
      await projectService.deliverProject(project.id, {
        deliveredUrl: deliveryForm.deliveredUrl,
        deliveryNotes: deliveryForm.deliveryNotes || undefined
      });
      setShowDeliveryModal(false);
      setDeliveryForm({ deliveredUrl: '', deliveryNotes: '' });
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Failed to deliver project');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading website project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error || 'Project not found.'}</p>
        </div>
      </div>
    );
  }

  const assignedUserObj = staffUsers.find((u) => u.id === project.assignedTo);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(isStaff ? '/dashboard/projects' : '/dashboard/my-projects')}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md">
                {project.projectNumber}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {project.packageName}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              {project.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/orders/${project.customWebsiteOrderId}`)}
            className="text-xs"
          >
            View Origin Order
          </Button>
        </div>
      </div>

      {/* Phase 13: Review, Approval & Delivery Status Banners */}
      {project.status === 'REVIEW' && (
        <div className="bg-linear-to-r from-purple-500/10 via-indigo-500/10 to-brand-500/10 border border-purple-200 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 uppercase tracking-wide">
                  Review & Approval Stage
                </span>
                <span className="text-xs text-slate-500">
                  Revisions used: {project.revisionCount ?? 0} of {project.revisionLimit ?? 3}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {isStaff ? 'Project is Pending Customer Review' : 'Your Website is Ready for Review!'}
              </h2>
              <p className="text-sm text-slate-600">
                {isStaff
                  ? 'The customer has been notified to review the latest preview and either approve or request changes.'
                  : 'Please inspect the preview. If everything looks good, approve the build. If changes are needed, submit a revision request.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {versions.find((v) => v.isCurrent)?.previewUrl && (
                <a
                  href={versions.find((v) => v.isCurrent)?.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-700 text-sm font-semibold rounded-xl hover:bg-purple-50 transition shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" /> Preview Website
                </a>
              )}

              {!isStaff ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowRevisionModal(true)}
                    disabled={(project.revisionCount ?? 0) >= (project.revisionLimit ?? 3)}
                    className="flex items-center gap-2 text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    <RotateCcw className="w-4 h-4" /> Request Revision
                  </Button>
                  <Button
                    onClick={() => setShowApprovalModal(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <FileCheck className="w-4 h-4" /> Approve Website
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowVersionModal(true)}
                  className="flex items-center gap-2 text-xs"
                >
                  <Plus className="w-4 h-4" /> Upload New Version
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {project.status === 'COMPLETED' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                Customer Approved
              </span>
            </div>
            <h2 className="text-lg font-bold text-emerald-950">Website Approved & Ready for Final Delivery</h2>
            <p className="text-sm text-emerald-800">
              {isStaff
                ? 'Customer approval has been recorded. Provide the production deployment URL to complete final delivery.'
                : 'Thank you for approving your website! Our engineering team is completing production deployment now.'}
            </p>
          </div>
          {isStaff && (
            <Button
              onClick={() => setShowDeliveryModal(true)}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <Send className="w-4 h-4" /> Deliver Project
            </Button>
          )}
        </div>
      )}

      {project.status === 'DELIVERED' && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 uppercase tracking-wide">
                Project Delivered & Live
              </span>
            </div>
            <h2 className="text-lg font-bold text-teal-950">Website Successfully Delivered!</h2>
            <p className="text-sm text-teal-800">
              Your custom website is live and operational. You can visit your website at any time using the link below.
            </p>
          </div>
          {(project.deliveredUrl || delivery?.deliveredUrl) && (
            <a
              href={project.deliveredUrl || delivery?.deliveredUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 text-white font-semibold rounded-xl hover:bg-teal-800 transition shadow-xs text-sm"
            >
              <Globe className="w-4 h-4" /> Visit Live Website
            </a>
          )}
        </div>
      )}

      {/* Progress & Quick Stats Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              Project Completion
            </span>
            <span className="text-brand-600 font-bold">{project.progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          {isStaff && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-slate-400">Quick adjust:</span>
              {[0, 25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  onClick={() => handleProgressChange(p)}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded transition"
                >
                  {p}%
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-400 block">Status & Priority</span>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700">
              {project.status}
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded">
              Priority: {project.priority}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-400 block">Lead Assigned Staff</span>
          <div className="flex items-center gap-2 pt-1">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-800">
              {assignedUserObj ? assignedUserObj.name : project.assignedTo ? 'Staff Member' : 'Unassigned'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Info className="w-4 h-4" /> Overview
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'review'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" /> Versions & Revisions ({versions.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'tasks'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ListTodo className="w-4 h-4" /> Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'milestones'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Flag className="w-4 h-4" /> Milestones ({milestones.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" /> Activity History ({history.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description & Scope */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900">Project Description & Scope</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {project.description || 'No detailed description set for this project.'}
              </p>
            </div>

            {/* Target Dates */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900">Key Timeline Dates</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium block">Start Date</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">
                    {project.startDate || 'Not scheduled'}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium block">Target Delivery</span>
                  <span className="text-sm font-bold text-brand-700 mt-1 block">
                    {project.estimatedDeliveryDate || 'TBD'}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium block">Completed Date</span>
                  <span className="text-sm font-bold text-emerald-700 mt-1 block">
                    {project.completedDate ? project.completedDate.split('T')[0] : 'In Progress'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Side Controls (Admin / Manager) */}
          <div className="space-y-6">
            {isStaff ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <h2 className="text-base font-bold text-slate-900">Project Controls</h2>

                {/* Status transition */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Transition Status</label>
                  <select
                    value={project.status}
                    disabled={actionLoading}
                    onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="PLANNING">PLANNING</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="ON_HOLD">ON_HOLD</option>
                    <option value="REVIEW">REVIEW</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                {/* Status change note */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Status Change Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Milestone 1 passed quality review"
                    value={statusUpdateNote}
                    onChange={(e) => setStatusUpdateNote(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                {/* Staff Assignment */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-semibold text-slate-700 block">Assign Staff Lead</label>
                  <select
                    value={project.assignedTo || ''}
                    disabled={actionLoading}
                    onChange={(e) => handleAssignChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">Unassigned</option>
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-slate-900">Your WebCraft Team</h2>
                <p className="text-xs text-slate-500">
                  Our professional website development engineering team is managing the delivery of your custom website.
                </p>
                <div className="p-3 bg-brand-50 rounded-xl text-xs text-brand-800 font-medium">
                  Have questions regarding this build? Feel free to reference Project Number{' '}
                  <strong className="font-mono">{project.projectNumber}</strong>.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: VERSIONS & REVISIONS */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {/* Header with staff upload action */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Project Versions & Feedback</h2>
              <p className="text-xs text-slate-500">
                Track deliverables, preview URLs, client feedback, and revision cycles.
              </p>
            </div>
            {isStaff && (
              <Button
                onClick={() => setShowVersionModal(true)}
                className="flex items-center gap-2 text-xs"
              >
                <Plus className="w-4 h-4" /> New Version
              </Button>
            )}
          </div>

          {/* Versions List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Deliverable Versions ({versions.length})
            </h3>
            {versions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-sm">
                No versions uploaded yet. Staff will upload build previews as development progresses.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {versions.map((v) => (
                  <div key={v.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Version {v.versionNumber}: {v.title}</span>
                        {v.isCurrent && (
                          <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs font-semibold rounded-md">
                            Current Active
                          </span>
                        )}
                      </div>
                      {v.description && (
                        <p className="text-xs text-slate-600 mt-1">{v.description}</p>
                      )}
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Uploaded by {v.createdByName || 'Staff'} on {v.createdAt.split('T')[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={v.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Preview URL
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revisions History */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Revision Requests ({revisions.length})
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Limit: {project.revisionLimit ?? 3} allowed ({project.revisionCount ?? 0} used)
              </span>
            </div>
            {revisions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-sm">
                No revision requests submitted.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {revisions.map((r) => (
                  <div key={r.id} className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">
                        Revision #{r.revisionNumber}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl whitespace-pre-wrap">
                      {r.requestedChanges}
                    </p>
                    <span className="text-[11px] text-slate-400 block">
                      Requested by {r.customerName || 'Customer'} on {r.createdAt.split('T')[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approval & Delivery Cards if available */}
          {(approval || delivery) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approval && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Customer Approval Record
                  </div>
                  <p className="text-xs text-emerald-900">
                    Approved Version v{approval.versionNumber} on {approval.approvedAt.split('T')[0]}
                  </p>
                  {approval.feedback && (
                    <p className="text-xs text-emerald-800 italic">"{approval.feedback}"</p>
                  )}
                </div>
              )}
              {delivery && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                    <Globe className="w-4 h-4" /> Final Delivery Record
                  </div>
                  <p className="text-xs text-teal-900">
                    Delivered by {delivery.deliveredByName} on {delivery.deliveredAt.split('T')[0]}
                  </p>
                  <a
                    href={delivery.deliveredUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-teal-700 underline block"
                  >
                    {delivery.deliveredUrl}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Project Tasks</h2>
              <p className="text-xs text-slate-500">Breakdown of operational tasks and development status.</p>
            </div>
            {isStaff && (
              <Button onClick={() => setShowTaskModal(true)} size="sm" className="flex items-center gap-1.5 text-xs">
                <Plus className="w-4 h-4" /> Add Task
              </Button>
            )}
          </div>

          {tasks.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
              <ListTodo className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No tasks created yet</p>
              <p className="text-xs text-slate-400">Tasks will appear as development sprints are set up.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
              {tasks.map((t) => (
                <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{t.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {t.priority}
                      </span>
                    </div>
                    {t.description && <p className="text-xs text-slate-500">{t.description}</p>}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      {t.dueDate && <span>Due: {t.dueDate}</span>}
                      {t.completedAt && <span className="text-emerald-600 font-semibold">Completed: {t.completedAt.split('T')[0]}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isStaff ? (
                      <>
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value as TaskStatus)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 border-0 focus:ring-1 focus:ring-brand-500"
                        >
                          <option value="TODO">TODO</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="BLOCKED">BLOCKED</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                        {t.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Project Milestones</h2>
              <p className="text-xs text-slate-500">Key deliverable gates and checkpoints.</p>
            </div>
            {isStaff && (
              <Button onClick={() => setShowMilestoneModal(true)} size="sm" className="flex items-center gap-1.5 text-xs">
                <Plus className="w-4 h-4" /> Add Milestone
              </Button>
            )}
          </div>

          {milestones.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
              <Flag className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No milestones scheduled yet</p>
              <p className="text-xs text-slate-400">Milestones will track major delivery progress.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map((m) => (
                <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center">
                        {m.sortOrder}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{m.name}</h3>
                    </div>
                    {m.description && <p className="text-xs text-slate-500 pl-8">{m.description}</p>}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pl-8 pt-0.5">
                      {m.dueDate && <span>Target: {m.dueDate}</span>}
                      {m.completedAt && <span className="text-emerald-600 font-semibold">Completed: {m.completedAt.split('T')[0]}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-8 sm:pl-0">
                    {isStaff ? (
                      <>
                        <select
                          value={m.status}
                          onChange={(e) => handleUpdateMilestoneStatus(m.id, e.target.value as MilestoneStatus)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 border-0 focus:ring-1 focus:ring-brand-500"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="BLOCKED">BLOCKED</option>
                        </select>
                        <button
                          onClick={() => handleDeleteMilestone(m.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700">
                        {m.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACTIVITY / STATUS HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Project Status History</h2>
          {history.length === 0 ? (
            <p className="text-xs text-slate-400">No status logs recorded yet.</p>
          ) : (
            <div className="space-y-4 border-l-2 border-slate-100 pl-4 ml-2">
              {history.map((h) => (
                <div key={h.id} className="relative space-y-1">
                  <div className="w-2.5 h-2.5 bg-brand-600 rounded-full absolute -left-[21px] top-1.5 ring-4 ring-white" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{h.status}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(h.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {h.note && <p className="text-xs text-slate-600">{h.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Project Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design homepage hero wireframe"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional details or specifications"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as PriorityLevel })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Assignee</label>
                <select
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Unassigned</option>
                  {staffUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW VERSION MODAL */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Upload / Register Version</h3>
            <form onSubmit={handleCreateVersion} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Version Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Initial Draft Preview"
                  value={versionForm.title}
                  onChange={(e) => setVersionForm({ ...versionForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Preview URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://preview.webcraft.ai/site-xyz"
                  value={versionForm.previewUrl}
                  onChange={(e) => setVersionForm({ ...versionForm, previewUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Version Notes</label>
                <textarea
                  rows={3}
                  placeholder="Key features included in this build..."
                  value={versionForm.description}
                  onChange={(e) => setVersionForm({ ...versionForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="submitReviewCheck"
                  checked={versionForm.submitForReview}
                  onChange={(e) => setVersionForm({ ...versionForm, submitForReview: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="submitReviewCheck" className="text-xs text-slate-700 font-medium">
                  Transition project to REVIEW status
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowVersionModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Version'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST REVISION MODAL */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Request Revisions</h3>
              <p className="text-xs text-slate-500">
                You have used {project.revisionCount ?? 0} of {project.revisionLimit ?? 3} allowed revisions.
              </p>
            </div>
            <form onSubmit={handleRequestRevision} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Changes Requested *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please describe the changes you would like made to the design or content..."
                  value={revisionForm.requestedChanges}
                  onChange={(e) => setRevisionForm({ ...revisionForm, requestedChanges: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowRevisionModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {actionLoading ? 'Submitting...' : 'Submit Revision'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVAL MODAL */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Approve Website</h3>
              <p className="text-xs text-slate-500">
                Approving this version moves the project to COMPLETED status and signals the team to deliver.
              </p>
            </div>
            <form onSubmit={handleApproveProject} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Feedback / Testimonial (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Tell us what you love about the website..."
                  value={approvalFeedback}
                  onChange={(e) => setApprovalFeedback(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowApprovalModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {actionLoading ? 'Approving...' : 'Confirm Approval'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELIVERY MODAL */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Deliver Completed Project</h3>
              <p className="text-xs text-slate-500">
                Provide the live deployment URL to finalize project delivery.
              </p>
            </div>
            <form onSubmit={handleDeliverProject} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Production URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://clientdomain.com"
                  value={deliveryForm.deliveredUrl}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveredUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Delivery Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="DNS records transferred, hosting configured, etc."
                  value={deliveryForm.deliveryNotes}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowDeliveryModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading} className="bg-teal-700 hover:bg-teal-800 text-white">
                  {actionLoading ? 'Delivering...' : 'Complete Delivery'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MILESTONE MODAL */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Milestone</h3>
            <form onSubmit={handleCreateMilestone} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Milestone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Approval & Prototype"
                  value={milestoneForm.name}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Scope or criteria for this milestone"
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Order #</label>
                  <input
                    type="number"
                    min="1"
                    value={milestoneForm.sortOrder}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, sortOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={milestoneForm.dueDate}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowMilestoneModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Creating...' : 'Create Milestone'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailsPage;
