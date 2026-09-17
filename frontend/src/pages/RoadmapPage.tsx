import React, { useState, useEffect } from 'react';
import {
  Milestone,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  CircleDashed,
  UserCheck,
  ShieldCheck,
  Lock,
  Unlock,
  RefreshCw,
  Edit3,
  X,
  Filter,
  Check,
  Loader2,
  LogIn,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { RoadmapMilestone, RoadmapTask, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';

const TEAM_MEMBERS = [
  'Yuvika Nagpal',
  'Kumkum Gupta',
  'Aaneya Sabharwal',
];

export const RoadmapPage: React.FC = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Modal State
  const [selectedTask, setSelectedTask] = useState<RoadmapTask | null>(null);
  const [editStatus, setEditStatus] = useState<TaskStatus>('planned');
  const [editCompletedBy, setEditCompletedBy] = useState<string>('');
  const [editCompletedAt, setEditCompletedAt] = useState<string>('');
  const [editAssignedTo, setEditAssignedTo] = useState<string>('');
  const [modalSaving, setModalSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-progress' | 'completed' | 'planned'>('all');

  const fetchRoadmap = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getRoadmap();
      if (res.success && res.data) {
        setMilestones(res.data);
      } else {
        setError(res.message || 'Failed to load roadmap data.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching roadmap.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  // Show auto-dismissing toast message
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Quick mark task completed
  const handleQuickComplete = async (task: RoadmapTask) => {
    if (!isAuthenticated) {
      showToast('error', 'Authentication required. Please log in as a team member or administrator.');
      return;
    }

    if (updatingTaskId) return; // Prevent duplicate concurrent updates
    setUpdatingTaskId(task.id);

    try {
      const today = new Date().toISOString().split('T')[0];
      const contributor = user?.username || TEAM_MEMBERS[0];

      const res = await api.markRoadmapTaskCompleted(task.id, {
        completionDate: today,
        completedBy: contributor,
      });

      if (res.success && res.data) {
        const { task: updatedTask, milestone: updatedMilestone } = res.data;
        // Update local state without full reload
        setMilestones((prev) =>
          prev.map((m) => {
            if (m.id === updatedMilestone.id) {
              return {
                ...updatedMilestone,
                tasks: m.tasks?.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
              };
            }
            return m;
          })
        );
        showToast('success', `Task "${updatedTask.title}" marked as Completed!`);
      } else {
        showToast('error', res.message || 'Failed to mark task as completed.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Network error saving task completion.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Open edit modal
  const openEditModal = (task: RoadmapTask) => {
    setSelectedTask(task);
    setEditStatus(task.status);
    setEditCompletedBy(task.completedBy || user?.username || TEAM_MEMBERS[0]);
    setEditCompletedAt(task.completedAt || new Date().toISOString().split('T')[0]);
    setEditAssignedTo(task.assignedTo || '');
    setModalError(null);
  };

  // Save changes from edit modal
  const handleModalSave = async () => {
    if (!selectedTask) return;
    if (modalSaving) return;

    setModalSaving(true);
    setModalError(null);

    try {
      const updates: Partial<RoadmapTask> = {
        status: editStatus,
        assignedTo: editAssignedTo.trim() || null,
      };

      if (editStatus === 'completed') {
        updates.completedAt = editCompletedAt.trim() || new Date().toISOString().split('T')[0];
        updates.completedBy = editCompletedBy.trim() || user?.username || 'Team Member';
      } else {
        updates.completedAt = null;
        updates.completedBy = null;
      }

      const res = await api.updateRoadmapTask(selectedTask.id, updates);
      if (res.success && res.data) {
        const { task: updatedTask, milestone: updatedMilestone } = res.data;
        setMilestones((prev) =>
          prev.map((m) => {
            if (m.id === updatedMilestone.id) {
              return {
                ...updatedMilestone,
                tasks: m.tasks?.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
              };
            }
            return m;
          })
        );
        showToast('success', `Task "${updatedTask.title}" updated successfully.`);
        setSelectedTask(null);
      } else {
        setModalError(res.message || 'Failed to save task updates.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Network error updating task.');
    } finally {
      setModalSaving(false);
    }
  };

  const filteredMilestones = milestones.filter((m) => {
    if (statusFilter === 'all') return true;
    return m.status === statusFilter;
  });

  // Helper badge for task status
  const getTaskStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" /> Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 animate-pulse">
            <Clock className="w-3 h-3 mr-1 text-cyan-400" /> In Progress
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-700/60">
            <AlertCircle className="w-3 h-3 mr-1 text-rose-400" /> Blocked
          </span>
        );
      case 'planned':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800">
            <CircleDashed className="w-3 h-3 mr-1 text-slate-500" /> Planned
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border shadow-xl max-w-md flex items-center space-x-3 transition-all animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/95 border-rose-500 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span className="text-xs font-mono font-medium">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-auto flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <Milestone className="w-3.5 h-3.5" />
          <span>Semester Timeline (UCS503)</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
            17-Week Development Roadmap
          </h1>
          <button
            onClick={fetchRoadmap}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:border-slate-700 transition-colors w-fit"
            title="Refresh roadmap data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          Structured 17-week implementation roadmap covering research, simulator design, uncertainty modeling, calibration, and benchmarking. Fully persistent and updated in real-time.
        </p>
      </div>

      {/* Team Access & Authentication Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-2 text-emerald-400">
              <Unlock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                Editor Mode Active &bull; Logged in as <strong className="text-white">{user?.username}</strong> ({user?.role})
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-slate-400">
              <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span>
                Public View (Read-Only) &bull; Team members can log in to update task progress
              </span>
            </div>
          )}
        </div>

        {!isAuthenticated && (
          <Link
            to="/admin"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors w-fit font-bold"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Team Sign In</span>
          </Link>
        )}
      </div>

      {/* Platform Continuity Notice */}
      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono space-y-1">
        <div className="font-bold flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Platform Continuity Notice</span>
        </div>
        <p className="text-slate-300">
          The CarbonRoute website is developed and deployed from the beginning (Weeks 1–2) and operates permanently throughout the entire 17-week semester. Task statuses persist in the central database across all devices.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>Filter Phase:</span>
        </div>
        <div className="flex items-center space-x-1.5 font-mono text-xs">
          {(['all', 'in-progress', 'planned', 'completed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 rounded text-xs transition-colors capitalize ${
                statusFilter === filter
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {filter === 'in-progress' ? 'In Progress' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
              <div className="h-4 bg-slate-800 rounded w-1/4" />
              <div className="h-3 bg-slate-800/60 rounded w-3/4" />
              <div className="h-16 bg-slate-950/60 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error Banner */}
      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchRoadmap}
            className="px-2.5 py-1 rounded bg-rose-900/60 border border-rose-700 text-white hover:bg-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Roadmap Timeline */}
      {!loading && (
        <div className="relative border-l-2 border-slate-800 ml-4 sm:ml-6 space-y-8 pl-6 sm:pl-8">
          {filteredMilestones.map((item) => {
            const isActive = item.status === 'in-progress';
            const isCompleted = item.status === 'completed';

            // Calculate task completion progress
            const tasks = item.tasks || [];
            const completedTasks = tasks.filter((t) => t.status === 'completed').length;
            const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

            return (
              <div key={item.id} className="relative group">
                {/* Timeline Bullet */}
                <div
                  className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'bg-teal-400 border-teal-300 ring-4 ring-teal-500/20'
                      : isActive
                      ? 'bg-emerald-400 border-emerald-300 ring-4 ring-emerald-500/20'
                      : 'bg-slate-900 border-slate-700'
                  }`}
                />

                <div
                  className={`p-6 rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-teal-950/15 border-teal-500/40 shadow-lg shadow-teal-950/20'
                      : isActive
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/40'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  {/* Phase Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                          isCompleted
                            ? 'bg-teal-500 text-slate-950'
                            : isActive
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.weekRange}
                      </span>
                      <h3 className="font-bold text-white text-base font-mono">{item.title}</h3>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded uppercase ${
                        isCompleted
                          ? 'bg-teal-950 text-teal-300 border border-teal-800'
                          : isActive
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-950 text-slate-500 border border-slate-800'
                      }`}
                    >
                      {isCompleted ? 'Phase Completed' : isActive ? 'Current Phase' : 'Planned'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans mb-4">
                    {item.description}
                  </p>

                  {/* Phase Progress Bar */}
                  {tasks.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400 font-semibold">Phase Progress:</span>
                        <span className={isCompleted ? 'text-teal-400 font-bold' : isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {completedTasks} of {tasks.length} tasks completed ({progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-teal-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Granular Task Checklist */}
                  {tasks.length > 0 && (
                    <div className="space-y-2.5 mb-4">
                      <span className="text-[11px] text-slate-400 font-mono font-semibold uppercase tracking-wider block">
                        Tasks & Completion Status:
                      </span>
                      <div className="space-y-2">
                        {tasks.map((task) => {
                          const isTaskCompleted = task.status === 'completed';
                          const isTaskUpdating = updatingTaskId === task.id;

                          return (
                            <div
                              key={task.id}
                              className={`p-3 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isTaskCompleted
                                  ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-200'
                                  : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                              }`}
                            >
                              <div className="space-y-1 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  {getTaskStatusBadge(task.status)}
                                  <span className="font-mono text-xs font-bold text-white">
                                    {task.title}
                                  </span>
                                </div>
                                {task.description && (
                                  <p className="text-[11px] text-slate-400 leading-snug">
                                    {task.description}
                                  </p>
                                )}
                                {isTaskCompleted && task.completedAt && (
                                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono text-emerald-400">
                                    <span className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1 text-emerald-500" />
                                      Completed: {task.completedAt}
                                    </span>
                                    {task.completedBy && (
                                      <span className="flex items-center text-slate-300">
                                      &bull; Contributor: <strong className="text-white ml-1">{task.completedBy}</strong>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                                {isAuthenticated ? (
                                  <>
                                    {!isTaskCompleted && (
                                      <button
                                        onClick={() => handleQuickComplete(task)}
                                        disabled={isTaskUpdating}
                                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-[11px] font-mono font-bold transition-colors disabled:opacity-50"
                                        title="Mark as Completed"
                                      >
                                        {isTaskUpdating ? (
                                          <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                                        ) : (
                                          <Check className="w-3 h-3 text-emerald-400" />
                                        )}
                                        <span>Complete</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => openEditModal(task)}
                                      disabled={isTaskUpdating}
                                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-mono transition-colors disabled:opacity-50"
                                      title="Update Task Status & Details"
                                    >
                                      <Edit3 className="w-3 h-3 text-slate-400" />
                                      <span>Edit</span>
                                    </button>
                                  </>
                                ) : (
                                  <div className="text-[10px] font-mono text-slate-500 flex items-center">
                                    <Lock className="w-3 h-3 mr-1 text-slate-600" />
                                    <span>Read-Only</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Key Deliverables Section */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono font-semibold">Key Deliverables:</span>
                    {item.deliverables?.map((del, dIdx) => (
                      <span
                        key={dIdx}
                        className="px-2 py-0.5 rounded bg-slate-950 text-[10px] font-mono text-slate-300 border border-slate-800"
                      >
                        {del}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Task Status Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-mono text-sm font-bold text-white">Update Task Status</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono text-slate-400 font-semibold">Task:</span>
              <p className="text-sm font-mono font-bold text-white">{selectedTask.title}</p>
              {selectedTask.description && (
                <p className="text-xs text-slate-400">{selectedTask.description}</p>
              )}
            </div>

            {modalError && (
              <div className="p-3 rounded bg-rose-950/60 border border-rose-700/60 text-rose-300 text-xs font-mono flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs font-mono">
              {/* Status Selector */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Status:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['planned', 'in-progress', 'completed', 'blocked'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`p-2 rounded border text-left flex items-center space-x-2 capitalize transition-colors ${
                        editStatus === st
                          ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {getTaskStatusBadge(st)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Completion Metadata (Only if status is completed) */}
              {editStatus === 'completed' && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Completed By (Contributor):</label>
                    <div className="flex gap-2">
                      <select
                        value={TEAM_MEMBERS.includes(editCompletedBy) ? editCompletedBy : 'other'}
                        onChange={(e) => {
                          if (e.target.value !== 'other') {
                            setEditCompletedBy(e.target.value);
                          }
                        }}
                        className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs w-full font-mono"
                      >
                        {TEAM_MEMBERS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                        <option value="other">Custom Contributor...</option>
                      </select>
                    </div>
                    {!TEAM_MEMBERS.includes(editCompletedBy) && (
                      <input
                        type="text"
                        placeholder="Enter contributor name"
                        value={editCompletedBy}
                        onChange={(e) => setEditCompletedBy(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs w-full font-mono mt-1"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Completion Date:</label>
                    <input
                      type="date"
                      value={editCompletedAt}
                      onChange={(e) => setEditCompletedAt(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs w-full font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Assignee */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Assignee (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Kumkum Gupta"
                  value={editAssignedTo}
                  onChange={(e) => setEditAssignedTo(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white text-xs w-full font-mono"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleModalSave}
                disabled={modalSaving}
                className="inline-flex items-center space-x-1 px-4 py-1.5 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-mono font-bold transition-colors disabled:opacity-50"
              >
                {modalSaving && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

