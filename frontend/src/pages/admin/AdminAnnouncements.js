import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Plus, X, Trash2, ToggleLeft, ToggleRight,
  Info, AlertTriangle, PartyPopper, Calendar, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const TYPE_OPTIONS = [
  { value: 'info', label: 'Info', icon: Info, color: '#3B82F6' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: '#F59E0B' },
  { value: 'celebration', label: 'Celebration', icon: PartyPopper, color: '#EC4899' },
];

const TYPE_BADGE = {
  info: { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', label: 'Info' },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', label: 'Warning' },
  celebration: { color: '#EC4899', bg: 'rgba(236,72,153,0.15)', label: 'Celebration' },
};

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    active_until: '',
    is_active: true,
  });

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/announcements');
      setAnnouncements(Array.isArray(data) ? data : data?.announcements || []);
    } catch (_) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        is_active: formData.is_active,
      };
      if (formData.active_until) payload.active_until = formData.active_until;
      await api.post('/api/admin/announcements', payload);
      toast.success('Announcement created!');
      setShowCreate(false);
      setFormData({ title: '', message: '', type: 'info', active_until: '', is_active: true });
      fetchAnnouncements();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to create announcement');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.put(`/api/admin/announcements/${id}/toggle`);
      toast.success('Toggled announcement');
      fetchAnnouncements();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to toggle');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/admin/announcements/${id}`);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to delete');
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
    <div data-testid="admin-announcements">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Announcements
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px"
          style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }}
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* Announcement List */}
      {announcements.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
          <Megaphone size={40} className="mx-auto mb-3 text-[#64748B] opacity-40" />
          <p className="text-[#94A3B8]">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann, i) => {
            const badge = TYPE_BADGE[ann.type] || TYPE_BADGE.info;
            return (
              <motion.div
                key={ann._id || ann.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white truncate">{ann.title}</h3>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ color: badge.color, backgroundColor: badge.bg }}
                      >
                        {badge.label}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        ann.is_active
                          ? 'bg-[#10B981]/15 text-[#10B981]'
                          : 'bg-white/[0.06] text-[#64748B]'
                      }`}>
                        {ann.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#94A3B8] line-clamp-2 mb-1.5">{ann.message}</p>
                    {ann.active_until && (
                      <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                        <Calendar size={10} /> Expires: {new Date(ann.active_until).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(ann._id || ann.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.06] border border-white/[0.08] text-[#94A3B8] hover:text-white hover:bg-white/[0.1] transition-all"
                      aria-label={ann.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {ann.is_active ? <ToggleRight size={16} className="text-[#10B981]" /> : <ToggleLeft size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(ann._id || ann.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.06] border border-white/[0.08] text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
                      aria-label="Delete announcement"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
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
              className="bg-[#1E293B] border border-white/[0.08] rounded-t-[28px] md:rounded-[24px] w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">New Announcement</h2>
                <button onClick={() => setShowCreate(false)} className="text-[#64748B] hover:text-white p-1" aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#EC4899]/40"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#EC4899]/40 h-24 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#EC4899]/40"
                    >
                      {TYPE_OPTIONS.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Active Until</label>
                    <input
                      type="date"
                      value={formData.active_until}
                      onChange={(e) => setFormData({ ...formData, active_until: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#EC4899]/40"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <span className="text-sm text-[#94A3B8]">Active immediately</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className="w-10 h-6 rounded-full flex items-center transition-all px-0.5"
                    style={{
                      backgroundColor: formData.is_active ? '#10B981' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full bg-white shadow transition-transform"
                      style={{ transform: formData.is_active ? 'translateX(16px)' : 'translateX(0)' }}
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
                    style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }}
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

export default AdminAnnouncements;
