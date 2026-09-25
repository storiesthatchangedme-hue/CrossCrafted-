import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Search, Trash2, Calendar, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';


const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchEvents = useCallback(async (q = '') => {
    try {
      const { data } = await api.get(`/api/admin/events?search=${encodeURIComponent(q)}`);
      setEvents(data.events);
      setTotal(data.total);
    } catch (_) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleSearch = (e) => { e.preventDefault(); setLoading(true); fetchEvents(search); };

  const handleDelete = async (eventId, title) => {
    if (!window.confirm(`Delete event "${title}" and all registrations?`)) return;
    try {
      await api.delete(`/api/admin/events/${eventId}`);
      toast.success('Event deleted');
      fetchEvents(search);
    } catch (_) {
      toast.error('Failed to delete event');
    }
  };

  return (
    <div data-testid="admin-events-page">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Events <span className="text-base text-[#94A3B8] font-normal">({total})</span>
        </h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events..." className="bg-white/[0.06] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-[#94A3B8] w-60 focus:outline-none focus:border-[#F59E0B]" data-testid="admin-events-search" />
          </div>
          <button type="submit" className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm font-medium hover:bg-white/[0.1] transition-colors">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F59E0B] border-r-transparent mx-auto" /></div>
      ) : (
        <div className="space-y-3">
          {events.map((event, i) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 hover:bg-white/[0.06] transition-colors"
              data-testid="admin-event-row"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex flex-col items-center justify-center flex-shrink-0">
                    <p className="text-[10px] font-bold uppercase text-[#F59E0B]">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                    <p className="text-lg font-bold leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>{new Date(event.date).getDate()}</p>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base truncate">{event.title}</h3>
                    <p className="text-sm text-[#CBD5E1] line-clamp-1 mb-1">{event.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-[#94A3B8]">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(event.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {event.attendees_count || 0} attending</span>
                      <span>by {event.creator_name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(event._id, event.title)}
                  className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-colors text-sm font-medium flex-shrink-0"
                  data-testid="admin-delete-event"
                >
                  <Trash2 size={14} strokeWidth={2.5} /> Remove
                </button>
              </div>
            </motion.div>
          ))}
          {events.length === 0 && <div className="text-center py-10 text-[#94A3B8]">No events found.</div>}
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
