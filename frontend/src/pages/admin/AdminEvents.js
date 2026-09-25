import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Trash2, Calendar, MapPin, Users, Plus, X, Globe,
  Video, Radio, Ticket, Edit3, Eye, EyeOff, Download, Upload,
  Filter, ChevronDown, Check, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_STATES, LANGUAGES } from '@/constants/india';
import { MultiSelect } from '@/components/MultiSelect';

const EVENT_CATEGORIES = [
  { value: 'worship', label: 'Worship Service', color: '#EC4899' },
  { value: 'bible-study', label: 'Bible Study', color: '#6366F1' },
  { value: 'conference', label: 'Conference', color: '#F59E0B' },
  { value: 'retreat', label: 'Retreat', color: '#10B981' },
  { value: 'youth', label: 'Youth Event', color: '#3B82F6' },
  { value: 'outreach', label: 'Outreach', color: '#8B5CF6' },
  { value: 'fellowship', label: 'Fellowship', color: '#14B8A6' },
  { value: 'concert', label: 'Concert', color: '#F43F5E' },
  { value: 'prayer', label: 'Prayer Meeting', color: '#A855F7' },
  { value: 'seminar', label: 'Seminar', color: '#0EA5E9' },
  { value: 'livestream', label: 'Live Stream', color: '#EF4444' },
  { value: 'workshop', label: 'Workshop', color: '#D946EF' },
];

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [formData, setFormData] = useState({
    title: '', description: '', date: '', end_date: '', location: '',
    state: '', city: '', languages: [], category: 'worship',
    is_online: false, stream_url: '', is_free: true, price: 0,
    max_attendees: '', tags: []
  });

  const fetchEvents = useCallback(async (q = '') => {
    try {
      const { data } = await api.get(`/api/admin/events?search=${encodeURIComponent(q)}`);
      let eventList = Array.isArray(data?.events) ? data.events : [];
      if (filterCategory) eventList = eventList.filter(e => e.category === filterCategory);
      setEvents(eventList);
      setTotal(data?.total || 0);
    } catch (_) { toast.error('Failed to load events'); } finally { setLoading(false); }
  }, [filterCategory]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleSearch = (e) => { e.preventDefault(); setLoading(true); fetchEvents(search); };

  const handleDelete = async (eventId, title) => {
    if (!window.confirm(`Delete event "${title}" and all registrations?`)) return;
    try {
      await api.delete(`/api/admin/events/${eventId}`);
      toast.success('Event deleted');
      fetchEvents(search);
    } catch (_) { toast.error('Failed to delete event'); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedEvents.size} selected events?`)) return;
    try {
      for (const id of selectedEvents) { await api.delete(`/api/admin/events/${id}`); }
      toast.success(`${selectedEvents.size} events deleted`);
      setSelectedEvents(new Set());
      fetchEvents(search);
    } catch (_) { toast.error('Bulk delete failed'); }
  };

  const toggleSelect = (eventId) => {
    const next = new Set(selectedEvents);
    if (next.has(eventId)) next.delete(eventId); else next.add(eventId);
    setSelectedEvents(next);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.is_free) payload.price = 0;
      if (!payload.is_online) payload.stream_url = '';
      if (payload.max_attendees) payload.max_attendees = parseInt(payload.max_attendees);
      await api.post('/api/admin/events', payload);
      toast.success('Event created!');
      setShowCreate(false);
      setFormData({ title: '', description: '', date: '', end_date: '', location: '', state: '', city: '', languages: [], category: 'worship', is_online: false, stream_url: '', is_free: true, price: 0, max_attendees: '', tags: [] });
      fetchEvents(search);
    } catch (_) { toast.error('Failed to create event'); }
  };

  const isLive = (event) => {
    if (!event.date) return false;
    const now = new Date();
    const start = new Date(event.date);
    const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return now >= start && now <= end;
  };

  const catColor = (cat) => EVENT_CATEGORIES.find(c => c.value === cat)?.color || '#EC4899';
  const catLabel = (cat) => EVENT_CATEGORIES.find(c => c.value === cat)?.label || cat;

  return (
    <div data-testid="admin-events-page">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Events <span className="text-base text-[#94A3B8] font-normal">({total})</span>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">Manage all community events and gatherings</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events..." className="bg-white/[0.06] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-[#94A3B8] w-52 focus:outline-none focus:border-[#F59E0B]" />
            </div>
            <button type="submit" className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm font-medium hover:bg-white/[0.1] transition-colors">Search</button>
          </form>
          {/* Category filter */}
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#F59E0B]">
            <option value="">All Categories</option>
            {EVENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {selectedEvents.size > 0 && (
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/30 transition-colors">
              <Trash2 size={14} /> Delete ({selectedEvents.size})
            </button>
          )}
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#F59E0B] text-black rounded-xl text-sm font-bold hover:bg-[#F59E0B]/90 transition-colors" data-testid="admin-create-event">
            <Plus size={14} /> Create
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
          <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Total Events</p>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
        </div>
        <div className="p-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
          <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Live Now</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{events.filter(isLive).length}</p>
        </div>
        <div className="p-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
          <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Online Events</p>
          <p className="text-2xl font-bold text-[#6366F1] mt-1">{events.filter(e => e.is_online).length}</p>
        </div>
        <div className="p-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
          <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Total Attendees</p>
          <p className="text-2xl font-bold text-[#10B981] mt-1">{events.reduce((s, e) => s + (e.attendees_count || 0), 0)}</p>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="bg-[#1E293B] border border-white/[0.08] rounded-[24px] w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">Create Event</h2>
                <button onClick={() => setShowCreate(false)} className="text-[#64748B] hover:text-white p-1"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="neo-input w-full text-sm" required />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="neo-input w-full text-sm">
                    {EVENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Start Date</label>
                    <input type="datetime-local" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="neo-input w-full text-sm" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">End Date</label>
                    <input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="neo-input w-full text-sm" />
                  </div>
                </div>
                {/* Online toggle */}
                <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <span className="text-xs font-semibold text-white flex items-center gap-2"><Video size={14} className="text-[#6366F1]" /> Online / Live Stream</span>
                  <button type="button" onClick={() => setFormData({ ...formData, is_online: !formData.is_online })}
                    className={`w-10 h-5 rounded-full transition-all ${formData.is_online ? 'bg-[#6366F1]' : 'bg-white/[0.1]'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.is_online ? 'ml-[22px]' : 'ml-[2px]'}`} />
                  </button>
                </div>
                {formData.is_online && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Stream URL</label>
                    <input type="url" value={formData.stream_url} onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })} className="neo-input w-full text-sm" placeholder="https://..." />
                  </div>
                )}
                {!formData.is_online && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Location</label>
                    <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="neo-input w-full text-sm" required />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">State</label>
                    <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="neo-input w-full text-sm">
                      <option value="">Select state</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">City</label>
                    <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="neo-input w-full text-sm" placeholder="City" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Languages</label>
                  <MultiSelect options={LANGUAGES} value={formData.languages} onChange={(langs) => setFormData({ ...formData, languages: langs })} placeholder="Select languages" />
                </div>
                {/* Pricing */}
                <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <span className="text-xs font-semibold text-white flex items-center gap-2"><Ticket size={14} className="text-[#10B981]" /> Free Event</span>
                  <button type="button" onClick={() => setFormData({ ...formData, is_free: !formData.is_free })}
                    className={`w-10 h-5 rounded-full transition-all ${formData.is_free ? 'bg-[#10B981]' : 'bg-white/[0.1]'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.is_free ? 'ml-[22px]' : 'ml-[2px]'}`} />
                  </button>
                </div>
                {!formData.is_free && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Price (₹)</label>
                    <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} min="0" className="neo-input w-full text-sm" />
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="neo-input w-full h-20 resize-none text-sm" required />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowCreate(false)} className="neo-button-outline flex-1 py-2.5 text-sm">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-black rounded-xl bg-[#F59E0B] hover:bg-[#F59E0B]/90 transition-all">Create Event</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event List */}
      {loading ? (
        <div className="text-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F59E0B] border-r-transparent mx-auto" /></div>
      ) : (
        <div className="space-y-3">
          {events.map((event, i) => {
            const live = isLive(event);
            return (
              <motion.div key={event._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 hover:bg-white/[0.06] transition-colors"
                data-testid="admin-event-row">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1 min-w-0">
                    {/* Checkbox */}
                    <label className="flex items-center">
                      <input type="checkbox" checked={selectedEvents.has(event._id)} onChange={() => toggleSelect(event._id)}
                        className="w-4 h-4 rounded border-white/[0.12] bg-white/[0.04] accent-[#F59E0B]" />
                    </label>
                    {/* Date block */}
                    <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                      style={{ background: `${catColor(event.category)}20`, border: `1px solid ${catColor(event.category)}30` }}>
                      <p className="text-[10px] font-bold uppercase" style={{ color: catColor(event.category) }}>{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                      <p className="text-lg font-bold leading-none text-white">{new Date(event.date).getDate()}</p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: catColor(event.category) }} />
                        <span className="text-[10px] font-bold text-[#94A3B8]">{catLabel(event.category)}</span>
                        {live && <span className="flex items-center gap-1 text-[10px] font-bold text-red-400"><Radio size={9} className="animate-pulse" />LIVE</span>}
                        {event.is_online && <span className="flex items-center gap-1 text-[10px] font-bold text-[#6366F1]"><Video size={9} />Online</span>}
                        {!event.is_free && event.price && <span className="text-[10px] font-bold text-[#F59E0B]">₹{event.price}</span>}
                      </div>
                      <h3 className="font-bold text-base truncate text-white">{event.title}</h3>
                      <p className="text-sm text-[#CBD5E1] line-clamp-1 mb-1">{event.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-[#94A3B8]">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(event.date).toLocaleDateString()}</span>
                        {!event.is_online && <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>}
                        <span className="flex items-center gap-1"><Users size={12} /> {event.attendees_count || 0}</span>
                        <span>by {event.creator_name || 'Unknown'}</span>
                        {event.state && <span>{event.state}</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(event._id, event.title)}
                    className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-colors text-sm font-medium flex-shrink-0"
                    data-testid="admin-delete-event">
                    <Trash2 size={14} strokeWidth={2.5} /> Remove
                  </button>
                </div>
              </motion.div>
            );
          })}
          {events.length === 0 && <div className="text-center py-10 text-[#94A3B8]">No events found.</div>}
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
