import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flag, Plus, X, Loader2, Settings2
} from 'lucide-react';
import { toast } from 'sonner';

const AdminFeatureFlags = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    description: '',
    enabled: false,
  });

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/feature-flags');
      setFlags(Array.isArray(data) ? data : data?.flags || []);
    } catch (_) {
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.key.trim()) {
      toast.error('Key is required');
      return;
    }
    setCreating(true);
    try {
      await api.post('/api/admin/feature-flags', {
        key: formData.key.trim(),
        description: formData.description.trim(),
        enabled: formData.enabled,
      });
      toast.success('Feature flag created!');
      setShowCreate(false);
      setFormData({ key: '', description: '', enabled: false });
      fetchFlags();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to create feature flag');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (flagId, currentEnabled) => {
    try {
      await api.post('/api/admin/feature-flags', {
        id: flagId,
        enabled: !currentEnabled,
      });
      toast.success(`Flag ${!currentEnabled ? 'enabled' : 'disabled'}`);
      fetchFlags();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to toggle flag');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#A855F7] border-r-transparent" />
      </div>
    );
  }

  return (
    <div data-testid="admin-feature-flags">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Feature Flags
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px"
          style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}
        >
          <Plus size={16} /> New Flag
        </button>
      </div>

      {/* Flags Table */}
      {flags.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
          <Flag size={40} className="mx-auto mb-3 text-[#64748B] opacity-40" />
          <p className="text-[#94A3B8]">No feature flags configured</p>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/[0.08]">
            <div className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Key</div>
            <div className="col-span-5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Description</div>
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] text-center">Status</div>
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] text-center">Toggle</div>
          </div>

          {/* Table Rows */}
          {flags.map((flag, i) => (
            <motion.div
              key={flag._id || flag.id || flag.key || i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors items-center"
            >
              <div className="col-span-3">
                <code className="text-[12px] font-mono font-bold text-white">{flag.key}</code>
              </div>
              <div className="col-span-5">
                <p className="text-[12px] text-[#94A3B8] truncate">{flag.description || '—'}</p>
              </div>
              <div className="col-span-2 text-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  flag.enabled
                    ? 'bg-[#10B981]/15 text-[#10B981]'
                    : 'bg-white/[0.06] text-[#64748B]'
                }`}>
                  {flag.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="col-span-2 flex justify-center">
                <button
                  onClick={() => handleToggle(flag._id || flag.id, flag.enabled)}
                  className="w-10 h-6 rounded-full flex items-center transition-all px-0.5"
                  style={{
                    backgroundColor: flag.enabled ? '#10B981' : 'rgba(255,255,255,0.1)',
                  }}
                  aria-label={`Toggle ${flag.key}`}
                >
                  <div
                    className="w-5 h-5 rounded-full bg-white shadow transition-transform"
                    style={{ transform: flag.enabled ? 'translateX(16px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center z-50"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="bg-[#1E293B] border border-white/[0.08] rounded-t-[28px] md:rounded-[24px] w-full max-w-lg p-5"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">New Feature Flag</h2>
                <button onClick={() => setShowCreate(false)} className="text-[#64748B] hover:text-white p-1" aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Key</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    placeholder="e.g., enable_chat_v2"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-[#64748B] font-mono focus:outline-none focus:border-[#A855F7]/40"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this flag control?"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#A855F7]/40 h-20 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <span className="text-sm text-[#94A3B8]">Enabled by default</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                    className="w-10 h-6 rounded-full flex items-center transition-all px-0.5"
                    style={{
                      backgroundColor: formData.enabled ? '#10B981' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full bg-white shadow transition-transform"
                      style={{ transform: formData.enabled ? 'translateX(16px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#94A3B8] bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}
                  >
                    {creating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminFeatureFlags;
