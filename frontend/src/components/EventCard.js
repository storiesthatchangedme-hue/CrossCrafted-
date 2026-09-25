import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EventCard = ({ event, showAction = true, actionType = 'rsvp', onRegister, badge }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      key={event._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/app/events/${event._id}`)}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/app/events/${event._id}`); }}
      className="bg-[#111827] rounded-[24px] border border-white/[0.08] p-6 cursor-pointer hover:-translate-y-1 hover:border-[#7C3AED]/40 hover:shadow-[0_8px_30px_rgba(124,58,237,0.15)] transition-all group relative overflow-hidden"
      data-testid="event-card"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/5 blur-3xl rounded-full pointer-events-none group-hover:bg-[#7C3AED]/10 transition-colors" />
      
      <div className="flex justify-between items-start relative z-10">
        <div className="flex-1">
          <h4 className="text-[17px] font-black mb-2 text-white group-hover:text-[#38BDF8] transition-colors" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {event.title}
          </h4>
          <p className="text-xs text-[#94A3B8] font-medium mb-4 line-clamp-2 leading-relaxed">{event.description}</p>
          <div className="flex flex-col gap-2.5 text-[11px] font-bold text-[#64748B]">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#38BDF8]" strokeWidth={2.5} />
              {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[#FB7185]" strokeWidth={2.5} />
              {event.location}
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#10B981]" strokeWidth={2.5} />
              {event.attendees_count || 0} attending
            </div>
          </div>
        </div>

        {showAction && actionType === 'rsvp' && onRegister ? (
          <button
            onClick={(e) => { e.stopPropagation(); onRegister(event._id); }}
            className={`px-5 py-2.5 border border-transparent rounded-xl font-black text-xs uppercase tracking-widest transition-all flex-shrink-0 ${
              event.is_registered 
                ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30 shadow-[inset_0_2px_10px_rgba(59,130,246,0.1)]' 
                : 'bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white hover:scale-[1.02] shadow-[0_4px_15px_rgba(124,58,237,0.3)]'
            }`}
            data-testid="event-register-button" aria-label="RSVP to event"
          >
            {event.is_registered ? 'Going' : 'RSVP'}
          </button>
        ) : showAction && actionType === 'navigate' ? (
          <ChevronRight size={20} strokeWidth={2.5} className="text-[#94A3B8] group-hover:text-[#38BDF8] group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
        ) : badge ? (
          <span className={`px-3 py-1 bg-white/[0.04] text-white border border-white/[0.08] rounded-lg text-[10px] font-black uppercase tracking-widest flex-shrink-0`}>
            {badge.label}
          </span>
        ) : null}
      </div>
    </motion.div>
  );
};

export default EventCard;
