import React, { useState, useEffect } from 'react';
import {
  Lock,
  UploadCloud,
  FileText,
  Users,
  Milestone,
  ShieldCheck,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  FolderDown,
  Activity,
  Layers,
  Archive,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PresentationItem, TeamMember, RoadmapMilestone } from '../types';
import { AdminUploadModal } from '../components/AdminUploadModal';

export const AdminPage: React.FC = () => {
  const { isAuthenticated, user, login, logout, loading: authLoading } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  // Admin State
  const [presentations, setPresentations] = useState<PresentationItem[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Edit Metadata Modal State
  const [editingPresentation, setEditingPresentation] = useState<PresentationItem | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editAuthors, setEditAuthors] = useState<string>('');
  const [editChangeSummary, setEditChangeSummary] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');

  const loadAdminData = async () => {
    setDataLoading(true);
    try {
      const res = await api.getAllVersions();
      if (res.success && res.data) {
        setPresentations(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    const res = await login(username, password);
    if (!res.success) {
      setLoginError(res.message || 'Invalid username or password.');
    }
    setLoginLoading(false);
  };

  const handleTogglePublish = async (p: PresentationItem) => {
    const nextStatus = p.status === 'published' ? 'draft' : 'published';
    try {
      const res = await api.updatePresentationVersion(p.id, { status: nextStatus });
      if (res.success) {
        setStatusMessage(`Presentation ${p.title} (${p.versionTag.toUpperCase()}) status updated to ${nextStatus.toUpperCase()}.`);
        loadAdminData();
      }
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  const handleArchive = async (p: PresentationItem) => {
    try {
      const res = await api.updatePresentationVersion(p.id, { status: 'archived' });
      if (res.success) {
        setStatusMessage(`Presentation ${p.title} archived.`);
        loadAdminData();
      }
    } catch (err) {
      console.error('Failed to archive presentation:', err);
    }
  };

  const handleDelete = async (p: PresentationItem) => {
    if (!confirm(`Are you sure you want to delete presentation "${p.title}" (${p.versionTag.toUpperCase()})?`)) return;

    try {
      const res = await api.deletePresentationVersion(p.id);
      if (res.success) {
        setStatusMessage(`Presentation "${p.title}" removed.`);
        loadAdminData();
      }
    } catch (err) {
      console.error('Failed to delete presentation:', err);
    }
  };

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPresentation) return;

    try {
      const res = await api.updatePresentationVersion(editingPresentation.id, {
        title: editTitle,
        presentationDate: editDate,
        authors: editAuthors.split(',').map((a) => a.trim()).filter(Boolean),
        changeSummary: editChangeSummary,
        description: editDescription,
      });

      if (res.success) {
        setStatusMessage(`Updated metadata for ${editingPresentation.title}.`);
        setEditingPresentation(null);
        loadAdminData();
      }
    } catch (err) {
      console.error('Failed to update metadata:', err);
    }
  };

  // Login Interface
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="glass-card rounded-2xl p-8 border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white font-mono">CarbonRoute Admin Login</h1>
            <p className="text-xs text-slate-400 font-mono">
              Course Deliverables &amp; Content Management Portal
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start space-x-2 font-mono">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} autoComplete="off" className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email or Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or email"
                autoComplete="off"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="new-password"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors font-mono disabled:opacity-50 shadow-sm"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In as Admin'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard Calculations
  const totalPresentations = presentations.length;
  const publishedCount = presentations.filter((p) => p.status === 'published').length;
  const draftsCount = presentations.filter((p) => p.status === 'draft').length;
  const recentUploads = presentations.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* 1. Header & Actions */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
              Authenticated Administrator
            </span>
            <span className="text-xs text-slate-400 font-mono">Session: {user?.username}</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-mono">
            CarbonRoute Content &amp; Deliverables Manager
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs font-mono hover:bg-emerald-400 transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Presentation</span>
          </button>

          <button
            onClick={logout}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-rose-300 text-xs font-mono flex items-center space-x-1"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between font-mono">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* 2. Admin Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-mono block">Total Deliverables</span>
          <div className="text-2xl font-extrabold text-white font-mono">{totalPresentations}</div>
          <span className="text-[10px] text-slate-500 font-mono">Archived across semester</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-1">
          <span className="text-xs text-emerald-400 font-mono block">Published Versions</span>
          <div className="text-2xl font-extrabold text-emerald-300 font-mono">{publishedCount}</div>
          <span className="text-[10px] text-emerald-400 font-mono">Publicly accessible</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 space-y-1">
          <span className="text-xs text-amber-400 font-mono block">Draft / Upcoming</span>
          <div className="text-2xl font-extrabold text-amber-300 font-mono">{draftsCount}</div>
          <span className="text-[10px] text-amber-400 font-mono">Unpublished releases</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-xs text-teal-400 font-mono block">Storage Retention</span>
          <div className="text-2xl font-extrabold text-white font-mono">Immutable</div>
          <span className="text-[10px] text-slate-500 font-mono">SHA-256 integrity active</span>
        </div>
      </div>

      {/* 3. Manage Presentations Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white font-mono flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Manage Presentations</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Policy: Prior published versions remain permanently preserved
          </span>
        </div>

        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Title &amp; Deliverable</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Version</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Authors</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {presentations.map((p) => {
                const isPublished = p.status === 'published';
                const isDraft = p.status === 'draft';
                const isArchived = p.status === 'archived';
                const targetUrl =
                  p.deliverableType === 'planning' && p.versionTag === 'v1'
                    ? '/presentations/planning/v1'
                    : `/presentation/${p.versionTag}`;

                return (
                  <tr key={p.id} className="hover:bg-slate-900/40 font-mono">
                    <td className="p-3.5">
                      <div className="font-bold text-white text-xs">{p.title}</div>
                      {p.changeSummary && (
                        <div className="text-[10.5px] text-slate-400 truncate max-w-xs">{p.changeSummary}</div>
                      )}
                    </td>
                    <td className="p-3.5 uppercase text-[10px] text-teal-400 font-bold">
                      {p.deliverableType}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-400">
                      {p.versionTag.toUpperCase()}
                      {p.versionTag === 'v1' && p.deliverableType === 'planning' && (
                        <span className="ml-1 text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                          Initial V1
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px]">{p.presentationDate}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPublished
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : isDraft
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {isPublished ? 'Published' : isDraft ? 'Draft' : 'Archived'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px] truncate max-w-[140px]" title={p.authors?.join(', ')}>
                      {p.authors?.join(', ') || 'Team'}
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      {isPublished && (
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-emerald-400 border border-slate-800 inline-block"
                          title="View Public Presentation Page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        onClick={() => {
                          setEditingPresentation(p);
                          setEditTitle(p.title);
                          setEditDate(p.presentationDate);
                          setEditAuthors(p.authors ? p.authors.join(', ') : '');
                          setEditChangeSummary(p.changeSummary || '');
                          setEditDescription(p.description || '');
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-teal-400 border border-slate-800 inline-block"
                        title="Edit Metadata"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleTogglePublish(p)}
                        className={`px-2 py-1 rounded-lg border text-[10px] ${
                          isPublished
                            ? 'bg-slate-900 text-amber-300 border-slate-800 hover:border-amber-500/40'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900'
                        }`}
                        title={isPublished ? 'Unpublish to Draft' : 'Publish to Public Site'}
                      >
                        {isPublished ? 'Unpublish' : 'Publish'}
                      </button>

                      {!isArchived && (
                        <button
                          onClick={() => handleArchive(p)}
                          className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 inline-block"
                          title="Archive"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(p)}
                        className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:text-rose-200 border border-rose-900/50 inline-block"
                        title="Delete Presentation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Metadata Modal */}
      {editingPresentation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-card rounded-2xl p-6 border border-slate-700 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span>Edit Metadata: {editingPresentation.versionTag.toUpperCase()}</span>
              </h3>
              <button
                onClick={() => setEditingPresentation(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveMetadata} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Presentation Date</label>
                <input
                  type="text"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Authors (comma separated)</label>
                <input
                  type="text"
                  value={editAuthors}
                  onChange={(e) => setEditAuthors(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Change Summary / Notes</label>
                <input
                  type="text"
                  value={editChangeSummary}
                  onChange={(e) => setEditChangeSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPresentation(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <AdminUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          setStatusMessage('New presentation version uploaded and registered.');
          loadAdminData();
        }}
      />
    </div>
  );
};
