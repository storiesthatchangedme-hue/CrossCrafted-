import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, MapPin, Users, Plus, Check, X, Clock, Filter, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_STATES, LANGUAGES } from '@/constants/india';
import { MultiSelect } from '@/components/MultiSelect';
import { GRADIENTS } from '@/lib/constants';

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ church_id: '', title: '', description: '', date: '', location: '', state: '', city: '', languages: [], category: '' });
  const [filterState, setFilterState] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const EVENT_CATEGORIES = ['Worship', 'Bible Study', 'Conference', 'Retreat', 'Youth', 'Outreach', 'Fellowship', 'Concert'];

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterState) params.append('state', filterState);
      if (filterLanguage) params.append('language', filterLanguage);
      if (filterCategory) params.append('category', filterCategory);
      if (searchQuery) params.append('search', searchQuery);
      const { data } = await api.get(`/api/events?${params}`);
      setEvents(Array.isArray(data) ? data : data.events || []);
    } catch (_) { toast.error('Failed to load'); } finally { setLoading(false); }
  }, [filterState, filterLanguage, filterCategory, searchQuery]);

  const fetchChurches = useCallback(async () => {
    try { const { data } = await api.get('/api/churches'); setChurches(data); } catch (_) { /* non-critical */ }
  }, []);

  useEffect(() => { fetchEvents(); fetchChurches(); }, [fetchEvents, fetchChurches]);
  useEffect(() => { if (location.state?.openCreate) { setShowCreateModal(true); window.history.replaceState({}, ''); } }, [location.state]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/events', formData);
      toast.success('Event created!'); setShowCreateModal(false); setFormData({ church_id: '', title: '', description: '', date: '', location: '', state: '', city: '', languages: [] });
      navigate(`/app/events/${data._id}`);
    } catch (_) { toast.error('Failed'); }
  };

  const activeFilters = [filterState, filterLanguage, filterCategory, searchQuery].filter(Boolean).length;

  const handleRegister = async (e, eventId, isRegistered) => {
    e.stopPropagation();
    try {
      if (isRegistered) { await api.delete(`/api/events/${eventId}/register`); toast.success('Cancelled'); }
      else { await api.post(`/api/events/${eventId}/register`, {}); toast.success("You're going!"); }
      fetchEvents();
    } catch (e) {
      if (e.response?.data?.detail === 'Already registered') toast.info('Already registered');
    }
  };

  if (loading && events.length === 0) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#EC4899] animate-spin" aria-label="Loading" />
    </div>
  );

  const featured = events.slice(0, 2);
  const rest = events.slice(2);

  return (
    <div className="max-w-[640px] mx-auto px-4 py-5" data-testid="events-page">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-white">Events</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              activeFilters > 0 ? 'bg-[#EC4899]/15 border-[#EC4899]/30 text-[#EC4899]' : 'bg-white/[0.04] border-white/[0.06] text-[#94A3B8] hover:text-white'
            }`}
            data-testid="events-filter-toggle">
            <Filter size={14} />
            {activeFilters > 0 && <span className="w-4 h-4 rounded-full bg-[#EC4899] text-white text-[9px] flex items-center justify-center">{activeFilters}</span>}
          </button>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }} data-testid="create-event-button">
            <Plus size={14} /> Create
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 overflow-hidden"
            data-testid="events-filters-panel">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Search</label>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Title, location..." className="neo-input w-full text-sm" data-testid="events-search-input" aria-label="Search events" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1"><MapPin size={10} className="inline mr-0.5" />State</label>
                <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="neo-input w-full text-sm" data-testid="events-state-filter" aria-label="Filter by state">
                  <option value="">All States</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1"><Globe size={10} className="inline mr-0.5" />Language</label>
                <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)} className="neo-input w-full text-sm" data-testid="events-language-filter" aria-label="Filter by language">
                  <option value="">All Languages</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Category</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="neo-input w-full text-sm" data-testid="events-category-filter" aria-label="Filter by category">
                  <option value="">All Categories</option>
                  {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setFilterState(''); setFilterLanguage(''); setFilterCategory(''); setSearchQuery(''); }} className="mt-3 text-xs text-[#94A3B8] hover:text-white transition-colors" data-testid="events-clear-filters">Clear all filters</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured Events — large cards */}
      {featured.length > 0 && (
        <div className="space-y-3 mb-4">
          {featured.map((event, i) => (
            <motion.div key={event._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => navigate(`/app/events/${event._id}`)}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/app/events/${event._id}`); }}
              className="relative rounded-2xl overflow-hidden cursor-pointer group min-h-[200px] border border-white/[0.06]"
              data-testid="event-card">
              {/* Background */}
              {event.cover_image ? (
                <img src={event.cover_image} alt={`${event.title} event cover`} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
              ) : (
                <div className="absolute inset-0" style={{ background: GRADIENTS[i % GRADIENTS.length] }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />

              {/* Date badge */}
              <div className="absolute top-3 left-3 w-14 h-14 rounded-xl flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm border border-white/[0.12]"
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                <span className="text-[9px] font-bold text-white/70 uppercase">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                <span className="text-xl font-bold text-white leading-none">{new Date(event.date).getDate()}</span>
              </div>

              {/* RSVP button */}
              <div className="absolute top-3 right-3">
                <button onClick={(e) => handleRegister(e, event._id, event.is_registered)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                    event.is_registered
                      ? 'bg-white/[0.15] backdrop-blur-sm text-white border border-white/[0.15]'
                      : 'text-white hover:-translate-y-px'
                  }`}
                  style={!event.is_registered ? { background: 'linear-gradient(135deg, #EC4899, #F97316)', boxShadow: '0 4px 12px rgba(236,72,153,0.3)' } : {}}
                  data-testid="event-register-button">
                  {event.is_registered ? <><Check size={13} /> Going</> : 'RSVP'}
                </button>
              </div>

              {/* Content at bottom */}
              <div className="absolute bottom-0 inset-x-0 p-4">
                <h3 className="text-lg font-bold text-white leading-tight mb-1">{event.title}</h3>
                <p className="text-[11px] text-white/60 mb-2">{event.church_name}</p>
                <div className="flex items-center gap-4 text-[10px] text-white/50">
                  <span className="flex items-center gap-1"><Clock size={10} />{new Date(event.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                  <span className="flex items-center gap-1"><MapPin size={10} />{event.location?.split(',')[0]}</span>
                  <span className="flex items-center gap-1"><Users size={10} />{event.attendees_count || 0} going</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Rest — compact list */}
      {rest.length > 0 && (
        <div className="space-y-2.5">
          {rest.map((event, i) => (
            <motion.div key={event._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i + 2) * 0.04 }}
              onClick={() => navigate(`/app/events/${event._id}`)}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/app/events/${event._id}`); }}
              className="flex gap-3.5 items-center p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:bg-white/[0.06] transition-all"
              data-testid="event-card">
              {/* Date block */}
              <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                style={{ background: GRADIENTS[(i + 2) % GRADIENTS.length], boxShadow: '0 4px 12px rgba(168,85,247,0.2)' }}>
                <span className="text-[9px] font-bold text-white/80 uppercase">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                <span className="text-xl font-bold text-white leading-none">{new Date(event.date).getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-white truncate">{event.title}</p>
                <p className="text-[11px] text-[#64748B] truncate mt-0.5">{event.church_name || event.location}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-[#94A3B8]">
                  <span className="flex items-center gap-1"><Users size={10} />{event.attendees_count || 0}</span>
                  <span className="flex items-center gap-1"><Clock size={10} />{new Date(event.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              </div>
              <button onClick={(e) => handleRegister(e, event._id, event.is_registered)}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-bold flex-shrink-0 transition-all ${
                  event.is_registered ? 'bg-white/[0.06] text-[#94A3B8]' : 'text-white'
                }`}
                style={!event.is_registered ? { background: 'linear-gradient(135deg, #EC4899, #F97316)' } : {}}
                data-testid="event-register-button">
                {event.is_registered ? 'Going' : 'RSVP'}
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center py-16 px-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
          <div className="w-14 h-14 bg-[#EC4899]/10 border border-[#EC4899]/25 rounded-full flex items-center justify-center mx-auto mb-4 text-[#EC4899]">
            <CalendarIcon size={24} />
          </div>
          <h3 className="text-white font-bold text-base mb-1">Seek, and You Shall Find</h3>
          <p className="text-[#64748B] text-xs max-w-sm mx-auto mb-5 leading-relaxed">
            There are no upcoming fellowship events scheduled here yet. Be the first to start a gather circle or Bible study in your region! 🙏
          </p>
          <button onClick={() => setShowCreateModal(true)}
            className="px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest text-white shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }}>
            Host a Gathering
          </button>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center z-50"
            onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)} data-testid="create-event-modal" role="dialog" aria-modal="true" aria-labelledby="create-event-modal-title">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="bg-[#1E293B] border-t md:border border-white/[0.08] rounded-t-[28px] md:rounded-[24px] w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 id="create-event-modal-title" className="text-lg font-bold gradient-text">Create Event</h2>
                <button onClick={() => { setShowCreateModal(false); setFormData({ church_id: '', title: '', description: '', date: '', location: '' }); }} className="text-[#64748B] hover:text-white p-1" aria-label="Close"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateEvent} className="space-y-3">
                {churches.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Church (optional)</label>
                    <select value={formData.church_id} onChange={(e) => setFormData({ ...formData, church_id: e.target.value })}
                      className="neo-input w-full text-sm" data-testid="event-church-select">
                      <option value="">No church</option>
                      {churches.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="neo-input w-full text-sm" required data-testid="event-title-input" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Date & Time</label>
                  <input type="datetime-local" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="neo-input w-full text-sm" required data-testid="event-date-input" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="neo-input w-full text-sm" required data-testid="event-location-input" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">State</label>
                    <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="neo-input w-full text-sm" data-testid="event-state-select">
                      <option value="">Select state</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">City</label>
                    <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="neo-input w-full text-sm" placeholder="City" data-testid="event-city-input" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Languages</label>
                  <MultiSelect options={LANGUAGES} value={formData.languages} onChange={(langs) => setFormData({ ...formData, languages: langs })} placeholder="Select languages" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="neo-input w-full h-20 resize-none text-sm" required data-testid="event-description-input" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => { setShowCreateModal(false); setFormData({ church_id: '', title: '', description: '', date: '', location: '' }); }} className="neo-button-outline flex-1 py-2.5 text-sm" data-testid="cancel-event-button">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:-translate-y-px"
                    style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }} data-testid="submit-event-button">Create</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Events;
