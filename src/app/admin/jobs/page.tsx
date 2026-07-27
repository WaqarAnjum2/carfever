'use client';

import { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  MapPin,
  Clock,
  DollarSign,
  ExternalLink,
  MessageSquare,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  getAllJobsAdmin,
  createJob,
  updateJob,
  deleteJob,
  type JobInput,
} from '@/lib/job-actions';
import type { DbJob } from '@/lib/supabase/types';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<DbJob | null>(null);
  const [deleteModalJob, setDeleteModalJob] = useState<DbJob | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<JobInput>({
    title: '',
    department: 'Sales & Dealership',
    location: 'Bristol, United Kingdom',
    type: 'Full-time',
    salary: '£35,000 - £45,000 / year',
    description: '',
    requirements: [],
    apply_google_form_url: '',
    apply_whatsapp_number: '07507696334',
    status: 'active',
  });

  const [reqInput, setReqInput] = useState('');

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await getAllJobsAdmin();
      setJobs(data);
    } catch (err: any) {
      toast.error(`Failed to load job postings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const openCreateModal = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      department: 'Sales & Dealership',
      location: 'Bristol, United Kingdom',
      type: 'Full-time',
      salary: '£35,000 - £45,000 / year',
      description: '',
      requirements: ['2+ years experience in automotive industry', 'Valid UK driving license', 'Excellent customer communication skills'],
      apply_google_form_url: '',
      apply_whatsapp_number: '07507696334',
      status: 'active',
    });
    setReqInput('');
    setModalOpen(true);
  };

  const openEditModal = (job: DbJob) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location || 'Bristol, United Kingdom',
      type: job.type,
      salary: job.salary || '',
      description: job.description,
      requirements: job.requirements || [],
      apply_google_form_url: job.apply_google_form_url || '',
      apply_whatsapp_number: job.apply_whatsapp_number || '',
      status: job.status,
    });
    setReqInput('');
    setModalOpen(true);
  };

  const handleAddRequirement = () => {
    if (!reqInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      requirements: [...(prev.requirements || []), reqInput.trim()],
    }));
    setReqInput('');
  };

  const handleRemoveRequirement = (req: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements?.filter(r => r !== req) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.department.trim()) {
      toast.error('Job Title, Department, and Description are required.');
      return;
    }

    if (!formData.apply_google_form_url && !formData.apply_whatsapp_number) {
      toast.error('Please provide at least a Google Form URL or a WhatsApp Number for candidate applications.');
      return;
    }

    setActionLoading(true);
    try {
      if (editingJob) {
        await updateJob(editingJob.id, formData);
        toast.success('Job posting updated successfully!');
      } else {
        await createJob(formData);
        toast.success('New job opening published successfully!');
      }
      setModalOpen(false);
      loadJobs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save job posting.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalJob) return;
    setActionLoading(true);
    try {
      await deleteJob(deleteModalJob.id);
      toast.success('Job posting deleted successfully!');
      setDeleteModalJob(null);
      loadJobs();
    } catch (err: any) {
      toast.error(`Failed to delete job: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0055FE] uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Recruitment & Hiring</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Careers & Job Openings</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Post job vacancies and configure Google Form or WhatsApp application channels for candidates.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-3 bg-[#0055FE] hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Job Opening</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, department, location…"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0055FE]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['all', 'active', 'closed'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-50 text-[#0055FE] border border-blue-200 shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 text-[#0055FE] animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading job vacancies…</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No job openings found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Post a new job vacancy to start receiving applications.</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#0055FE] text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post Job</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map(job => (
            <div
              key={job.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#0055FE] text-[10px] font-extrabold uppercase tracking-wider">
                      {job.department}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 leading-snug mt-1">
                      {job.title}
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                      job.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.type}</span>
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-1 text-emerald-600 font-bold">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{job.salary}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 font-medium leading-relaxed">
                  {job.description}
                </p>

                {/* Application Channels Badge */}
                <div className="flex items-center gap-2 pt-1">
                  {job.apply_google_form_url && (
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      Google Form
                    </span>
                  )}
                  {job.apply_whatsapp_number && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      WhatsApp ({job.apply_whatsapp_number})
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href="/jobs"
                    target="_blank"
                    className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    title="View on Careers Page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => openEditModal(job)}
                    className="p-2 rounded-xl bg-blue-50 text-[#0055FE] hover:bg-blue-100 transition-colors cursor-pointer"
                    title="Edit Job"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteModalJob(job)}
                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    title="Delete Job"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Job Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {editingJob ? 'Edit Job Vacancy' : 'Post New Job Vacancy'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Configure position details and application channels.</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Senior Car Sales Executive"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0055FE]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g. Sales, Marketing, Inspection"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0055FE]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Bristol, United Kingdom"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Remote">Remote</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={formData.salary || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                    placeholder="e.g. £35,000 - £45,000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Description *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe key responsibilities and expectations for this role…"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0055FE]"
                />
              </div>

              {/* Requirements List */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Key Requirements / Qualifications</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={reqInput}
                    onChange={(e) => setReqInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
                    placeholder="Add requirement & press Enter"
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddRequirement}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1.5">
                  {formData.requirements?.map((req, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium">
                      <span>• {req}</span>
                      <button type="button" onClick={() => handleRemoveRequirement(req)} className="text-slate-400 hover:text-rose-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Application Channels Config */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                  <ExternalLink className="w-4 h-4 text-[#0055FE]" />
                  <span>Candidate Application Channels</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Google Form Link (Optional)</label>
                  <input
                    type="url"
                    value={formData.apply_google_form_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, apply_google_form_url: e.target.value }))}
                    placeholder="https://docs.google.com/forms/d/e/..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">WhatsApp Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.apply_whatsapp_number || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, apply_whatsapp_number: e.target.value }))}
                    placeholder="07507696334"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              {/* Status Select */}
              <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-bold text-slate-700">Posting Status:</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="active">Active (Receiving Applications)</option>
                  <option value="closed">Closed (Hidden)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-[#0055FE] hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingJob ? 'Update Job' : 'Publish Job'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Delete Job Posting?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Are you sure you want to remove <span className="font-bold text-slate-900">"{deleteModalJob.title}"</span>?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModalJob(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
