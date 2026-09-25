import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Filter, Users, FileText, Church, Calendar, ShoppingBag, Shield, ChevronDown } from 'lucide-react';


const ACTION_CONFIG = {
  ROLE_CHANGE: { color: '#F59E0B', icon: Users, label: 'Role Change' },
  DELETE_USER: { color: '#EF4444', icon: Users, label: 'Delete User' },
  DELETE_POST: { color: '#EC4899', icon: FileText, label: 'Delete Post' },
  CHURCH_APPROVED: { color: '#10B981', icon: Church, label: 'Church Approved' },
  CHURCH_REJECTED: { color: '#EF4444', icon: Church, label: 'Church Rejected' },
  CHURCH_PENDING: { color: '#F59E0B', icon: Church, label: 'Church Pending' },
  DELETE_CHURCH: { color: '#EF4444', icon: Church, label: 'Delete Church' },
  DELETE_EVENT: { color: '#F59E0B', icon: Calendar, label: 'Delete Event' },
  DELETE_PRODUCT: { color: '#8B5CF6', icon: ShoppingBag, label: 'Delete Product' },
};

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action_type', actionFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      const { data } = await api.get('/api/admin/logs?${params}');
      setLogs(data.logs);
      setTotal(data.total);
    } catch (_) {
      /* logs load error */
    } finally {
      setLoading(false);
    }
  }, [actionFilter, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const clearFilters = () => { setActionFilter(''); setDateFrom(''); setDateTo(''); };

  const actionTypes = [...new Set(Object.keys(ACTION_CONFIG))];

  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div data-testid="admin-logs-page">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Activity Logs <span className="text-base text-[#94A3B8] font-normal">({total})</span>
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${
            showFilters || actionFilter || dateFrom || dateTo
              ? 'bg-[#A855F7]/15 border-[#A855F7]/30 text-[#A855F7]'
              : 'bg-white/[0.06] border-white/[0.08] hover:bg-white/[0.1]'
          }`}
          data-testid="admin-logs-filter-toggle"
        >
          <Filter size={16} strokeWidth={2.5} />
          Filters
          {(actionFilter || dateFrom || dateTo) && (
            <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
          )}
          <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 mb-6"
          data-testid="admin-logs-filters"
        >
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">Action Type</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-[#1E293B] border border-white/[0.1] rounded-lg text-sm py-2 px-3 text-white focus:outline-none min-w-[180px]"
                data-testid="admin-logs-action-filter"
              >
                <option value="">All Actions</option>
                {actionTypes.map((t) => (
                  <option key={t} value={t}>{ACTION_CONFIG[t]?.label || t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-[#1E293B] border border-white/[0.1] rounded-lg text-sm py-2 px-3 text-white focus:outline-none"
                data-testid="admin-logs-date-from"
              />
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-[#1E293B] border border-white/[0.1] rounded-lg text-sm py-2 px-3 text-white focus:outline-none"
                data-testid="admin-logs-date-to"
              />
            </div>
            {(actionFilter || dateFrom || dateTo) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-[#94A3B8] hover:text-white border border-white/[0.08] rounded-lg transition-colors"
                data-testid="admin-logs-clear-filters"
              >
                Clear
              </button>
            )}
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#A855F7] border-r-transparent mx-auto" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.04] border border-white/[0.08] rounded-2xl">
          <Shield size={48} strokeWidth={1.5} className="mx-auto mb-4 text-[#94A3B8] opacity-40" />
          <p className="text-[#94A3B8]">No activity logged yet.</p>
          <p className="text-xs text-[#64748B] mt-1">Actions like role changes and deletions will appear here.</p>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          {logs.map((log, i) => {
            const cfg = ACTION_CONFIG[log.action_type] || { color: '#94A3B8', icon: Shield, label: log.action_type };
            const LogIcon = cfg.icon;
            return (
              <motion.div
                key={`${log.timestamp}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-4 p-4 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.03] transition-colors"
                data-testid="admin-log-row"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cfg.color + '18' }}
                >
                  <LogIcon size={18} strokeWidth={2.5} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{log.admin_name}</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-white/[0.1]"
                      style={{ backgroundColor: cfg.color + '18', color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-[#CBD5E1] truncate">{log.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-[#94A3B8]">{timeAgo(log.timestamp)}</p>
                  <p className="text-[10px] text-[#64748B]">
                    {new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
