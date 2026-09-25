import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Search, Trash2, CheckCircle, XCircle, Clock, MapPin, Users, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';


const TABS = [
  { key: 'pending', label: 'Pending', color: '#F59E0B' },
  { key: 'all', label: 'All', color: '#94A3B8' },
  { key: 'approved', label: 'Approved', color: '#10B981' },
  { key: 'verified', label: 'Verified', color: '#3B82F6' },
  { key: 'rejected', label: 'Rejected', color: '#EF4444' },
];

const statusConfig = {
  approved: { color: '#10B981', icon: CheckCircle, label: 'Approved' },
  pending: { color: '#F59E0B', icon: Clock, label: 'Pending' },
  rejected: { color: '#EF4444', icon: XCircle, label: 'Rejected' },
  verified: { color: '#3B82F6', icon: ShieldCheck, label: 'Verified' },
};

const AdminChurches = () => {
  const [churches, setChurches] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('pending');

  const fetchChurches = useCallback(async (q = '', statusFilter = 'pending') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      const { data } = await api.get(`/api/admin/churches?${params.toString()}`);
      setChurches(data.churches);
      setTotal(data.total);
    } catch (_) {
      toast.error('Failed to load churches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChurches(search, tab); }, [fetchChurches, tab]);

  const handleSearch = (e) => { e.preventDefault(); fetchChurches(search, tab); };

  const handleStatus = async (churchId, status) => {
    try {
      await api.put(`/api/admin/churches/${churchId}/status`, { status });
      toast.success(`Church ${status}`);
      fetchChurches(search, tab);
    } catch (_) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (churchId, name) => {
    if (!window.confirm(`Delete church "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/churches/${churchId}`);
      toast.success('Church deleted');
      fetchChurches(search, tab);
    } catch (_) {
      toast.error('Failed to delete church');
    }
  };

  return (
    <div data-testid="admin-churches-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Churches <span className="text-base text-[#94A3B8] font-normal">({total})</span>
        </h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search churches..."
              className="bg-[#1a2235] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-[#94A3B8] w-60 focus:outline-none focus:border-[#10B981]"
              data-testid="admin-churches-search" />
          </div>
          <button type="submit" className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm font-medium hover:bg-white/[0.1] transition-colors">Search</button>
        </form>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1" data-testid="church-status-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            data-testid={`church-tab-${t.key}`}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              tab === t.key
                ? 'text-white border-white/[0.15]'
                : 'text-[#94A3B8] border-transparent hover:bg-white/[0.04] hover:text-white'
            }`}
            style={tab === t.key ? { backgroundColor: t.color + '20', color: t.color, borderColor: t.color + '40' } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Church List */}
      {loading ? (
        <div className="text-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#10B981] border-r-transparent mx-auto" /></div>
      ) : churches.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
          <MapPin className="mx-auto mb-3 text-[#475569]" size={36} />
          <p className="text-[#94A3B8] font-medium text-sm">
            {tab === 'pending' ? 'No pending churches to review.' : 'No churches found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {churches.map((church, i) => {
            const status = church.status || 'pending';
            const cfg = statusConfig[status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <motion.div
                key={church._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 hover:bg-white/[0.06] transition-colors"
                data-testid="admin-church-row"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-base">{church.name}</h3>
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize border"
                        style={{ backgroundColor: cfg.color + '18', color: cfg.color, borderColor: cfg.color + '30' }}
                        data-testid="admin-church-status"
                      >
                        <StatusIcon size={12} strokeWidth={2.5} /> {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-[#CBD5E1] line-clamp-1 mb-2">{church.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-[#94A3B8]">
                      {church.location && <span className="flex items-center gap-1"><MapPin size={12} /> {church.location}</span>}
                      <span className="flex items-center gap-1"><Users size={12} /> {church.followers_count || 0} followers</span>
                      <span>by {church.creator_name || 'Unknown'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    {status !== 'approved' && status !== 'verified' && (
                      <button onClick={() => handleStatus(church._id, 'approved')}
                        className="flex items-center gap-1 px-3 py-2 bg-[#10B981]/15 border border-[#10B981]/30 rounded-xl text-xs font-bold text-[#10B981] hover:bg-[#10B981]/25 transition-colors"
                        data-testid="admin-approve-church">
                        <CheckCircle size={14} /> Approve
                      </button>
                    )}
                    {status !== 'verified' && (
                      <button onClick={() => handleStatus(church._id, 'verified')}
                        className="flex items-center gap-1 px-3 py-2 bg-[#3B82F6]/15 border border-[#3B82F6]/30 rounded-xl text-xs font-bold text-[#3B82F6] hover:bg-[#3B82F6]/25 transition-colors"
                        data-testid="admin-verify-church">
                        <ShieldCheck size={14} /> Verify
                      </button>
                    )}
                    {status !== 'rejected' && (
                      <button onClick={() => handleStatus(church._id, 'rejected')}
                        className="flex items-center gap-1 px-3 py-2 bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-xl text-xs font-bold text-[#EF4444] hover:bg-[#EF4444]/25 transition-colors"
                        data-testid="admin-reject-church">
                        <XCircle size={14} /> Reject
                      </button>
                    )}
                    <button onClick={() => handleDelete(church._id, church.name)}
                      className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      data-testid="admin-delete-church">
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminChurches;
