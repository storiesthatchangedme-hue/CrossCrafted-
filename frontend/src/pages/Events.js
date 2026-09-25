import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, MapPin, Users, Plus, Check, X, Clock, Filter, Globe,
  Search, Heart, Share2, Video, Radio, Bookmark, BookmarkCheck, ChevronDown,
  Sparkles, Ticket, Mic, BookOpen, HandHelping, Music, Flame, TrendingUp,
  ArrowUpRight, LayoutGrid, List, SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_STATES, LANGUAGES } from '@/constants/india';
import { MultiSelect } from '@/components/MultiSelect';
import { GRADIENTS } from '@/lib/constants';

const EVENT_CATEGORIES = [
  { value: 'worship', label: 'Worship Service', icon: Music, color: '#EC4899' },
  { value: 'bible-study', label: 'Bible Study', icon: BookOpen, color: '#6366F1' },
  { value: 'conference', label: 'Conference', icon: Sparkles, color: '#F59E0B' },
  { value: 'retreat', label: 'Retreat', icon: Flame, color: '#10B981' },
  { value: 'youth', label: 'Youth Event', icon: TrendingUp, color: '#3B82F6' },
  { value: 'outreach', label: 'Outreach', icon: HandHelping, color: '#8B5CF6' },
  { value: 'fellowship', label: 'Fellowship', icon: Users, color: '#14B8A6' },
  { value: 'concert', label: 'Concert', icon: Mic, color: '#F43F5E' },
  { value: 'prayer', label: 'Prayer Meeting', icon: Heart, color: '#A855F7' },
  { value: 'seminar', label: 'Seminar', icon: BookOpen, color: '#0EA5E9' },
  { value: 'livestream', label: 'Live Stream', icon: Radio, color: '#EF4444' },
  { value: 'workshop', label: 'Workshop', icon: LayoutGrid, color: '#D946EF' },
];

const getCategoryMeta = (cat) => EVENT_CATEGORIES.find(c => c.value === cat) || EVENT_CATEGORIES[0];

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [savedEvents, setSavedEvents] = useState(new Set());
  const [formData, setFormData] = useState({
    church_id: '', title: '', description: '', date: '', end_date: '',
    location: '', state: '', city: '', languages: [], category: 'worship',
    is_online: false, stream_url: '', is_free: true, price: 0,
    max_attendees: '', cover_image: '', tags: []
  });
  const [filterState, setFilterState] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [tagInput, setTagInput] = useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterState) params.append('state', filterState);
      if (filterLanguage) params.append('language', filterLanguage);
      if (filterCategory) params.append('category', filterCategory);
      if (searchQuery) params.append('search', searchQuery);
      const { data } = await api.get(`/api/events?${params}`);
      let eventList = Array.isArray(data) ? data : data.events || [];
      // Client-side date filtering
      if (dateFilter !== 'all') {
        const now = new Date();
        eventList = eventList.filter(e => {
          const ed = new Date(e.date);
          if (dateFilter === 'today') return ed.toDateString() === now.toDateString();
          if (dateFilter === 'week') {
            const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
            return ed >= now && ed <= weekEnd;
          }
          if (dateFilter === 'month') {
            const monthEnd = new Date(now); monthEnd.setMonth(now.getMonth() + 1);
            return ed >= now && ed <= monthEnd;
          }
          return true;
        });
      }
      setEvents(eventList);
    } catch (_) { toast.error('Failed to load events'); } finally { setLoading(false); }
  }, [filterState, filterLanguage, filterCategory, searchQuery, dateFilter]);

  const fetchChurches = useCallback(async () => {
    try { const { data } = await api.get('/api/churches'); setChurches(data); } catch (_) {}
  }, []);

  useEffect(() => { fetchEvents(); fetchChurches(); }, [fetchEvents, fetchChurches]);
  useEffect(() => {
    if (location.state?.openCreate) { setShowCreateModal(true); window.history.replaceState({}, ''); }
  }, [location.state]);

  // Load saved events from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedEvents') || '[]');
      setSavedEvents(new Set(saved));
    } catch (_) {}
  }, []);

  const toggleSaveEvent = (e, eventId) => {
    e.stopPropagation();
    const newSaved = new Set(savedEvents);
    if (newSaved.has(eventId)) { newSaved.delete(eventId); toast.success('Removed from saved'); }
    else { newSaved.add(eventId); toast.success('Event saved!'); }
    setSavedEvents(newSaved);
    localStorage.setItem('savedEvents', JSON.stringify([...newSaved]));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.is_free) { payload.price = 0; }
      if (!payload.is_online) { payload.stream_url = ''; }
      if (payload.max_attendees) { payload.max_attendees = parseInt(payload.max_attendees); }
      const { data } = await api.post('/api/events', payload);
      toast.success('Event created!');
      setShowCreateModal(false);
      setFormData({ church_id: '', title: '', description: '', date: '', end_date: '', location: '', state: '', city: '', languages: [], category: 'worship', is_online: false, stream_url: '', is_free: true, price: 0, max_attendees: '', cover_image: '', tags: [] });
      navigate(`/app/events/${data._id}`);
    } catch (_) { toast.error('Failed to create event'); }
  };

  const handleRegister = async (e, eventId, isRegistered) => {
    e.stopPropagation();
    try {
      if (isRegistered) { await api.delete(`/api/events/${eventId}/register`); toast.success('Registration cancelled'); }
      else { await api.post(`/api/events/${eventId}/register`, {}); toast.success("You're going!"); }
      fetchEvents();
    } catch (err) {
      if (err.response?.data?.detail === 'Already registered') toast.info('Already registered');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && formData.tags.length < 5) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const activeFilters = [filterState, filterLanguage, filterCategory, searchQuery].filter(Boolean).length + (dateFilter !== 'all' ? 1 : 0);

  // Group events by category for the grid view
  const categorizedEvents = useMemo(() => {
    const groups = {};
    events.forEach(e => {
      const cat = e.category || 'worship';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(e);
    });
    return groups;
  }, [events]);

  // Featured = events with most attendees
  const featured = useMemo(() =>
    [...events].sort((a, b) => (b.attendees_count || 0) - (a.attendees_count || 0)).slice(0, 3),
    [events]
  );

  const upcomingEvents = useMemo(() =>
    events.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [events]
  );

  if (loading && events.length === 0) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#EC4899] animate-spin" aria-label="Loading" />
    </div>
  );

  const isLive = (event) => {
    if (!event.date) return false;
    const now = new Date();
    const start = new Date(event.date);
    const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return now >= start && now <= end;
  };

  const formatDateBadge = (dateStr) => {
    const d = new Date(dateStr);
    return { month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(), day: d.getDate() };
  };

  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="max-w-[640px] mx-auto px-4 py-5" data-testid="events-page">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-xl font-bold text-white">Events</h1>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">{events.length} gatherings near you</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] hover:text-white transition-all"
            aria-label="Toggle view">
            {viewMode === 'grid' ? <List size={14} /> : <LayoutGrid size={14} />}
          </button>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              activeFilters > 0 ? 'bg-[#EC4899]/15 border-[#EC4899]/30 text-[#EC4899]' : 'bg-white/[0.04] border-white/[0.06] text-[#94A3B8] hover:text-white'
            }`} data-testid="events-filter-toggle">
            <SlidersHorizontal size={14} />
            {activeFilters > 0 && <span className="w-4 h-4 rounded-full bg-[#EC4899] text-white text-[9px] flex items-center justify-center">{activeFilters}</span>}
          </button>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }} data-testid="create-event-button">
            <Plus size={14} /> Create
          </button>
        </div>
      </div>

      {/* Category Quick Filters - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-4 px-4 scrollbar-hide">
        <button onClick={() => setFilterCategory('')}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all border ${
            !filterCategory ? 'bg-[#EC4899]/20 border-[#EC4899]/30 text-[#EC4899]' : 'bg-white/[0.03] border-white/[0.06] text-[#94A3B8] hover:text-white'
          }`}>
          All
        </button>
        {EVENT_CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setFilterCategory(filterCategory === cat.value ? '' : cat.value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all border ${
              filterCategory === cat.value ? `border-opacity-30` : 'bg-white/[0.03] border-white/[0.06] text-[#94A3B8] hover:text-white'
            }`}
            style={filterCategory === cat.value ? { background: `${cat.color}20`, borderColor: `${cat.color}50`, color: cat.color } : {}}>
            <cat.icon size={12} /> {cat.label}
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 overflow-hidden" data-testid="events-filters-panel">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1"><Search size={10} className="inline mr-0.5" />Search</label>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search events..." className="neo-input w-full text-sm" data-testid="events-search-input" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1"><MapPin size={10} className="inline mr-0.5" />State</label>
                <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="neo-input w-full text-sm" data-testid="events-state-filter">
                  <option value="">All States</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1"><Globe size={10} className="inline mr-0.5" />Language</label>
                <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)} className="neo-input w-full text-sm" data-testid="events-language-filter">
                  <option value="">All Languages</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1"><Clock size={10} className="inline mr-0.5" />When</label>
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="neo-input w-full text-sm">
                  <option value="all">Any time</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                </select>
              </div>
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setFilterState(''); setFilterLanguage(''); setFilterCategory(''); setSearchQuery(''); setDateFilter('all'); }}
                className="mt-3 text-xs text-[#94A3B8] hover:text-white transition-colors" data-testid="events-clear-filters">
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured Events - large hero cards */}
      {featured.length > 0 && !filterCategory && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-[#F59E0B]" />
            <h2 className="text-sm font-bold text-white">Featured</h2>
          </div>
          <div className="space-y-3">
            {featured.map((event, i) => {
              const cat = getCategoryMeta(event.category);
              const live = isLive(event);
              const { month, day } = formatDateBadge(event.date);
              return (
                <motion.div key={event._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => navigate(`/app/events/${event._id}`)}
                  className="relative rounded-2xl overflow-hidden cursor-pointer group min-h-[220px] border border-white/[0.06]"
                  data-testid="event-card">
                  {/* Background */}
                  {event.cover_image ? (
                    <img src={event.cover_image} alt={`${event.title} cover`} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                  ) : (
                    <div className="absolute inset-0" style={{ background: GRADIENTS[i % GRADIENTS.length] }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/50 to-transparent" />

                  {/* Live badge */}
                  {live && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur-sm">
                      <Radio size={10} className="animate-pulse" /> <span className="text-[10px] font-bold text-white">LIVE</span>
                    </div>
                  )}

                  {/* Category badge */}
                  <div className="absolute top-3 left-3" style={live ? { left: '80px' } : {}}>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm border border-white/[0.12]"
                      style={{ background: `${cat.color}30`, color: cat.color }}>
                      {React.createElement(cat.icon, { size: 10 })} {cat.label}
                    </span>
                  </div>

                  {/* Save + Share */}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <button onClick={(e) => toggleSaveEvent(e, event._id)}
                      className="p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/[0.12] hover:bg-black/60 transition-all"
                      aria-label="Save event">
                      {savedEvents.has(event._id) ? <BookmarkCheck size={14} className="text-[#F59E0B]" /> : <Bookmark size={14} className="text-white/70" />}
                    </button>
                  </div>

                  {/* Date badge */}
                  <div className="absolute bottom-16 left-3 w-14 h-14 rounded-xl flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm border border-white/[0.12]"
                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                    <span className="text-[9px] font-bold text-white/70 uppercase">{month}</span>
                    <span className="text-xl font-bold text-white leading-none">{day}</span>
                  </div>

                  {/* RSVP button */}
                  <div className="absolute bottom-16 right-3">
                    <button onClick={(e) => handleRegister(e, event._id, event.is_registered)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                        event.is_registered ? 'bg-white/[0.15] backdrop-blur-sm text-white border border-white/[0.15]' : 'text-white hover:-translate-y-px'
                      }`}
                      style={!event.is_registered ? { background: 'linear-gradient(135deg, #EC4899, #F97316)', boxShadow: '0 4px 12px rgba(236,72,153,0.3)' } : {}}
                      data-testid="event-register-button">
                      {event.is_registered ? <><Check size={13} /> Going</> : 'RSVP'}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 inset-x-0 p-4">
                    <h3 className="text-lg font-bold text-white leading-tight mb-1">{event.title}</h3>
                    <p className="text-[11px] text-white/60 mb-2">{event.church_name}{event.is_online && <span className="ml-2 inline-flex items-center gap-1"><Video size={10} /> Online</span>}</p>
                    <div className="flex items-center gap-4 text-[10px] text-white/50">
                      <span className="flex items-center gap-1"><Clock size={10} />{formatTime(event.date)}</span>
                      {!event.is_online && event.location && <span className="flex items-center gap-1"><MapPin size={10} />{event.location?.split(',')[0]}</span>}
                      <span className="flex items-center gap-1"><Users size={10} />{event.attendees_count || 0} going</span>
                      {!event.is_free && <span className="flex items-center gap-1"><Ticket size={10} />₹{event.price}</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Upcoming Events */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon size={14} className="text-[#6366F1]" />
            <h2 className="text-sm font-bold text-white">{filterCategory ? getCategoryMeta(filterCategory).label : 'Upcoming Events'}</h2>
            <span className="text-[10px] text-[#94A3B8]">({upcomingEvents.length})</span>
          </div>
        </div>

        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2.5' : 'space-y-2.5'}>
          {upcomingEvents.map((event, i) => {
            const cat = getCategoryMeta(event.category);
            const live = isLive(event);
            const { month, day } = formatDateBadge(event.date);
            return (
              <motion.div key={event._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/app/events/${event._id}`)}
                className={`relative group cursor-pointer transition-all ${
                  viewMode === 'grid'
                    ? 'rounded-2xl overflow-hidden border border-white/[0.06] min-h-[180px]'
                    : 'flex gap-3.5 items-center p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
                }`} data-testid="event-card">

                {viewMode === 'grid' ? (
                  <>
                    {/* Grid card background */}
                    <div className="absolute inset-0" style={{ background: GRADIENTS[(i + 2) % GRADIENTS.length] }} />
                    {event.cover_image && <img src={event.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />

                    {/* Live indicator */}
                    {live && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/90">
                        <Radio size={8} className="animate-pulse" /> <span className="text-[8px] font-bold text-white">LIVE</span>
                      </div>
                    )}

                    {/* Save button */}
                    <button onClick={(e) => toggleSaveEvent(e, event._id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm"
                      aria-label="Save event">
                      {savedEvents.has(event._id) ? <BookmarkCheck size={11} className="text-[#F59E0B]" /> : <Bookmark size={11} className="text-white/50" />}
                    </button>

                    {/* Content */}
                    <div className="absolute bottom-0 inset-x-0 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
                        <span className="text-[9px] font-bold text-white/70">{cat.label}</span>
                        {event.is_online && <Video size={8} className="text-white/50 ml-1" />}
                      </div>
                      <h3 className="text-[13px] font-bold text-white leading-tight line-clamp-2 mb-1">{event.title}</h3>
                      <div className="flex items-center gap-2 text-[9px] text-white/50">
                        <span className="font-bold">{month} {day}</span>
                        <span>•</span>
                        <span>{formatTime(event.date)}</span>
                        <span>•</span>
                        <span>{event.attendees_count || 0} going</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* List card */}
                    <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                      style={{ background: GRADIENTS[(i + 2) % GRADIENTS.length], boxShadow: '0 4px 12px rgba(168,85,247,0.2)' }}>
                      <span className="text-[9px] font-bold text-white/80 uppercase">{month}</span>
                      <span className="text-xl font-bold text-white leading-none">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                        <span className="text-[9px] font-semibold text-[#94A3B8]">{cat.label}</span>
                        {live && <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-400"><Radio size={8} className="animate-pulse" />LIVE</span>}
                        {event.is_online && <Video size={10} className="text-[#6366F1] ml-0.5" />}
                      </div>
                      <p className="text-[14px] font-bold text-white truncate">{event.title}</p>
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">{event.church_name || event.location}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-[#94A3B8]">
                        <span className="flex items-center gap-1"><Users size={10} />{event.attendees_count || 0}</span>
                        <span className="flex items-center gap-1"><Clock size={10} />{formatTime(event.date)}</span>
                        {!event.is_free && <span className="flex items-center gap-1"><Ticket size={10} />₹{event.price}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      <button onClick={(e) => toggleSaveEvent(e, event._id)} className="p-1" aria-label="Save">
                        {savedEvents.has(event._id) ? <BookmarkCheck size={14} className="text-[#F59E0B]" /> : <Bookmark size={14} className="text-[#94A3B8]" />}
                      </button>
                      <button onClick={(e) => handleRegister(e, event._id, event.is_registered)}
                        className={`px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all ${
                          event.is_registered ? 'bg-white/[0.06] text-[#94A3B8]' : 'text-white'
                        }`}
                        style={!event.is_registered ? { background: 'linear-gradient(135deg, #EC4899, #F97316)' } : {}}
                        data-testid="event-register-button">
                        {event.is_registered ? 'Going' : 'RSVP'}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {events.length === 0 && (
        <div className="text-center py-16 px-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
          <div className="w-14 h-14 bg-[#EC4899]/10 border border-[#EC4899]/25 rounded-full flex items-center justify-center mx-auto mb-4 text-[#EC4899]">
            <CalendarIcon size={24} />
          </div>
          <h3 className="text-white font-bold text-base mb-1">Seek, and You Shall Find</h3>
          <p className="text-[#64748B] text-xs max-w-sm mx-auto mb-5 leading-relaxed">
            No events match your current filters. Try adjusting your search or be the first to host a gathering in your area!
          </p>
          <button onClick={() => setShowCreateModal(true)}
            className="px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest text-white shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }}>
            Host a Gathering
          </button>
        </div>
      )}

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center z-50"
            onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)} data-testid="create-event-modal" role="dialog" aria-modal="true">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="bg-[#1E293B] border-t md:border border-white/[0.08] rounded-t-[28px] md:rounded-[24px] w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold gradient-text">Create Event</h2>
                <button onClick={() => { setShowCreateModal(false); }} className="text-[#64748B] hover:text-white p-1" aria-label="Close"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateEvent} className="space-y-3">
                {churches.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Church (optional)</label>
                    <select value={formData.church_id} onChange={(e) => setFormData({ ...formData, church_id: e.target.value })} className="neo-input w-full text-sm">
                      <option value="">No church</option>
                      {churches.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="neo-input w-full text-sm" required />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {EVENT_CATEGORIES.map(cat => (
                      <button key={cat.value} type="button" onClick={() => setFormData({ ...formData, category: cat.value })}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[10px] font-semibold transition-all border ${
                          formData.category === cat.value ? '' : 'bg-white/[0.03] border-white/[0.06] text-[#94A3B8]'
                        }`}
                        style={formData.category === cat.value ? { background: `${cat.color}20`, borderColor: `${cat.color}50`, color: cat.color } : {}}>
                        <cat.icon size={11} /> {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Start Date & Time</label>
                    <input type="datetime-local" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="neo-input w-full text-sm" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">End Date & Time</label>
                    <input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="neo-input w-full text-sm" />
                  </div>
                </div>
                {/* Online toggle */}
                <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <div className="flex items-center gap-2">
                    <Video size={14} className="text-[#6366F1]" />
                    <span className="text-xs font-semibold text-white">Online / Live Stream</span>
                  </div>
                  <button type="button" onClick={() => setFormData({ ...formData, is_online: !formData.is_online })}
                    className={`w-10 h-5 rounded-full transition-all ${formData.is_online ? 'bg-[#6366F1]' : 'bg-white/[0.1]'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.is_online ? 'translate-x-5.5 ml-[22px]' : 'ml-[2px]'}`} />
                  </button>
                </div>
                {formData.is_online && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Stream URL</label>
                    <input type="url" value={formData.stream_url} onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })} placeholder="https://youtube.com/live/..." className="neo-input w-full text-sm" />
                  </div>
                )}
                {!formData.is_online && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Location</label>
                    <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="neo-input w-full text-sm" required />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">State</label>
                    <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="neo-input w-full text-sm">
                      <option value="">Select state</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">City</label>
                    <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="neo-input w-full text-sm" placeholder="City" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Languages</label>
                  <MultiSelect options={LANGUAGES} value={formData.languages} onChange={(langs) => setFormData({ ...formData, languages: langs })} placeholder="Select languages" />
                </div>
                {/* Pricing */}
                <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <div className="flex items-center gap-2">
                    <Ticket size={14} className="text-[#10B981]" />
                    <span className="text-xs font-semibold text-white">Free Event</span>
                  </div>
                  <button type="button" onClick={() => setFormData({ ...formData, is_free: !formData.is_free })}
                    className={`w-10 h-5 rounded-full transition-all ${formData.is_free ? 'bg-[#10B981]' : 'bg-white/[0.1]'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.is_free ? 'translate-x-5.5 ml-[22px]' : 'ml-[2px]'}`} />
                  </button>
                </div>
                {!formData.is_free && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Price (₹)</label>
                    <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} min="0" className="neo-input w-full text-sm" />
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Max Attendees (optional)</label>
                  <input type="number" value={formData.max_attendees} onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })} min="1" placeholder="Unlimited" className="neo-input w-full text-sm" />
                </div>
                {/* Tags */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Tags (max 5)</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {formData.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#6366F1]/20 text-[#6366F1] text-[10px] font-semibold">
                        {tag} <button type="button" onClick={() => removeTag(tag)}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tag..." className="neo-input flex-1 text-sm" />
                    <button type="button" onClick={addTag} className="px-3 py-2 rounded-xl bg-white/[0.06] text-[#94A3B8] hover:text-white text-xs">Add</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="neo-input w-full h-24 resize-none text-sm" required />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="neo-button-outline flex-1 py-2.5 text-sm">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:-translate-y-px"
                    style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }}>Create Event</button>
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
