import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Check, Video, Radio, Bookmark, BookmarkCheck, Ticket, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORY_COLORS = {
  worship: '#EC4899', 'bible-study': '#6366F1', conference: '#F59E0B', retreat: '#10B981',
  youth: '#3B82F6', outreach: '#8B5CF6', fellowship: '#14B8A6', concert: '#F43F5E',
  prayer: '#A855F7', seminar: '#0EA5E9', livestream: '#EF4444', workshop: '#D946EF',
};

const EventCard = ({ event, viewMode = 'list', onSave, isSaved = false, onRegister, showAction = true }) => {
  const navigate = useNavigate();
  const catColor = CATEGORY_COLORS[event.category] || '#EC4899';

  const isLive = () => {
    if (!event.date) return false;
    const now = new Date();
    const start = new Date(event.date);
    const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return now >= start && now <= end;
  };

  const { month, day } = (() => {
    const d = new Date(event.date);
    return { month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(), day: d.getDate() };
  })();

  const time = new Date(event.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const live = isLive();

  if (viewMode === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate(`/app/events/${event._id}`)}
        className="relative rounded-2xl overflow-hidden border border-white/[0.06] min-h-[180px] cursor-pointer group"
        data-testid="event-card">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${catColor}40, #1E293B)` }} />
        {event.cover_image && <img src={event.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />
        {live && <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/90"><Radio size={8} className="animate-pulse" /><span className="text-[8px] font-bold text-white">LIVE</span></div>}
        {onSave && (
          <button onClick={(e) => { e.stopPropagation(); onSave(event._id); }} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm" aria-label="Save">
            {isSaved ? <BookmarkCheck size={11} className="text-[#F59E0B]" /> : <Bookmark size={11} className="text-white/50" />}
          </button>
        )}
        <div className="absolute bottom-0 inset-x-0 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: catColor }} />
            <span className="text-[9px] font-bold text-white/70">{event.category || 'Event'}</span>
            {event.is_online && <Video size={8} className="text-white/50 ml-1" />}
          </div>
          <h3 className="text-[13px] font-bold text-white leading-tight line-clamp-2 mb-1">{event.title}</h3>
          <div className="flex items-center gap-2 text-[9px] text-white/50">
            <span className="font-bold">{month} {day}</span><span>•</span><span>{time}</span><span>•</span><span>{event.attendees_count || 0} going</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // List view (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/app/events/${event._id}`)}
      className="flex gap-3.5 items-center p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:bg-white/[0.06] transition-all group"
      data-testid="event-card">
      <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${catColor}, ${catColor}80)`, boxShadow: `0 4px 12px ${catColor}30` }}>
        <span className="text-[9px] font-bold text-white/80 uppercase">{month}</span>
        <span className="text-xl font-bold text-white leading-none">{day}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: catColor }} />
          <span className="text-[9px] font-semibold text-[#94A3B8]">{event.category || 'Event'}</span>
          {live && <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-400"><Radio size={8} className="animate-pulse" />LIVE</span>}
          {event.is_online && <Video size={10} className="text-[#6366F1] ml-0.5" />}
        </div>
        <p className="text-[14px] font-bold text-white truncate">{event.title}</p>
        <p className="text-[11px] text-[#64748B] truncate mt-0.5">{event.church_name || event.location}</p>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-[#94A3B8]">
          <span className="flex items-center gap-1"><Users size={10} />{event.attendees_count || 0}</span>
          <span className="flex items-center gap-1"><Clock size={10} />{time}</span>
          {!event.is_free && event.price && <span className="flex items-center gap-1"><Ticket size={10} />₹{event.price}</span>}
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        {onSave && (
          <button onClick={(e) => { e.stopPropagation(); onSave(event._id); }} className="p-1" aria-label="Save">
            {isSaved ? <BookmarkCheck size={14} className="text-[#F59E0B]" /> : <Bookmark size={14} className="text-[#94A3B8]" />}
          </button>
        )}
        {showAction && onRegister && (
          <button onClick={(e) => { e.stopPropagation(); onRegister(event._id); }}
            className={`px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all ${
              event.is_registered ? 'bg-white/[0.06] text-[#94A3B8]' : 'text-white'
            }`}
            style={!event.is_registered ? { background: 'linear-gradient(135deg, #EC4899, #F97316)' } : {}}>
            {event.is_registered ? 'Going' : 'RSVP'}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default EventCard;
