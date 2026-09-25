import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ShieldAlert, Check, X, AlertTriangle, UserMinus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';


const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/reports');
      setReports(data.reports || []);
      setTotal(data.total || 0);
    } catch (_) {
      toast.error('Failed to load safety reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async (reportId, action) => {
    const confirmMsg = action === 'ban_user'
      ? 'Are you sure you want to ban the reported user? This will set their account status to banned and restrict their access.'
      : action === 'dismiss'
      ? 'Are you sure you want to dismiss this report?'
      : 'Are you sure you want to resolve this report?';

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.post('/api/admin/reports/${reportId}/resolve', { action });
      toast.success(action === 'ban_user' ? 'User banned and report resolved!' : 'Report resolved successfully');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#EF4444] border-r-transparent" />
      </div>
    );
  }

  return (
    <div data-testid="admin-reports">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <ShieldAlert className="text-[#EF4444]" size={24} />
            Safety & Harassment Reports
          </h1>
          <p className="text-sm text-[#94A3B8]">
            Manage user reports and moderate reported harassment or community policy violations.
          </p>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-2xl text-sm font-semibold">
          Total Reports: {total}
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-3xl">
          <ShieldCheck size={48} className="mx-auto text-emerald-500 mb-4" />
          <h3 className="text-lg font-bold mb-1 text-white">All Clear!</h3>
          <p className="text-sm text-[#94A3B8]">No safety reports have been submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              key={report._id}
              className={`border rounded-3xl p-6 bg-white/[0.02] ${
                report.status === 'pending'
                  ? 'border-amber-500/20 bg-amber-500/[0.01]'
                  : report.status === 'dismissed'
                  ? 'border-white/[0.06] opacity-60'
                  : 'border-emerald-500/20 bg-emerald-500/[0.01]'
              }`}
              data-testid={`report-card-${report._id}`}
            >
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-rose-500/10 text-rose-400 border border-rose-500/10">
                      Reason: {report.reason.replace('_', ' ')}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                      report.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                        : report.status === 'dismissed'
                        ? 'bg-white/[0.04] text-gray-400 border-white/[0.06]'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] pt-0.5">
                    Filed on {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>

                {report.status === 'pending' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleResolve(report._id, 'dismiss')}
                      className="flex items-center gap-1 px-4 py-2 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-[#CBD5E1] rounded-full text-xs font-bold transition-all"
                      data-testid={`dismiss-btn-${report._id}`}
                    >
                      <X size={14} /> Dismiss
                    </button>
                    <button
                      onClick={() => handleResolve(report._id, 'resolve')}
                      className="flex items-center gap-1 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold transition-all"
                      data-testid={`resolve-btn-${report._id}`}
                    >
                      <Check size={14} /> Mark Resolved
                    </button>
                    {report.target_type === 'user' && (
                      <button
                        onClick={() => handleResolve(report._id, 'ban_user')}
                        className="flex items-center gap-1 px-4 py-2 bg-rose-500/15 border border-rose-500/25 hover:bg-rose-500/25 text-rose-400 rounded-full text-xs font-bold transition-all"
                        data-testid={`ban-btn-${report._id}`}
                      >
                        <UserMinus size={14} /> Ban User
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6 p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04]">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Reporter</h4>
                  <p className="text-sm font-semibold text-white">{report.reporter_name}</p>
                  <p className="text-xs text-[#64748B]">ID: {report.reporter_id}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                    Reported Target ({report.target_type})
                  </h4>
                  <p className="text-sm font-semibold text-white">{report.target_name}</p>
                  <p className="text-xs text-[#64748B]">ID: {report.target_id}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.04]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Report details</h4>
                <div className="bg-black/25 rounded-2xl p-4 border border-white/[0.02]">
                  <p className="text-sm text-[#E2E8F0] whitespace-pre-line leading-relaxed">
                    {report.details}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
