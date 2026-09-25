import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, MapPin, Users, ArrowLeft, Check, X,
  User, Clock, ChevronRight, Heart, Share2, Video,
  Radio, Bookmark, BookmarkCheck, Ticket, MessageCircle,
  Globe, ExternalLink, Flag, Copy, Sparkles, BookOpen,
  Music, Mic, HandHelping, TrendingUp, Flame, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_META = {
  worship: { label: 'Worship Service', icon: Music, color: '#EC4899' },
  'bible-study': { label: 'Bible Study', icon: BookOpen, color: '#6366F1' },
  conference: { label: 'Conference', icon: Sparkles, color: '#F59E0B' },
  retreat: { label: 'Retreat', icon: Flame, color: '#10B981' },
  youth: { label: 'Youth Event', icon: TrendingUp, color: '#3B82F6' },
  outreach: { label: 'Outreach', icon: HandHelping, color: '#8B5CF6' },
  fellowship: { label: 'Fellowship', icon: Users, color: '#14B8A6' },
  concert: { label: 'Concert', icon: Mic, color: '#F43F5E' },
  prayer: { label: 'Prayer Meeting', icon: Heart, color: '#A855F7' },
  seminar: { label: 'Seminar', icon: BookOpen, color: '#0EA5E9' },
  livestream: { label: 'Live Stream', icon: Radio, color: '#EF4444' },
  workshop: { label: 'Workshop', icon: MessageSquare, color: '#D946EF' },
};

const getCatMeta = (cat) => CATEGORY_META[cat] || CATEGORY_META.worship;

const EventDetail = () => {
  const { user } = useAuth();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/events/${eventId}`);
      setEvent(data);
    } catch (_) {
      toast.error('Event not found');
      navigate('/app/events');
    } finally {
      setLoading(false);
    }
  }, [eventId, navigate]);

  const fetchAttendees = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/events/${eventId}/attendees`);
      setAttendees(Array.isArray(data) ? data : []);
    } catch (_) {}
  }, [eventId]);

  useEffect(() => { fetchEvent(); fetchAttendees(); }, [fetchEvent, fetchAttendees]);

  // Check if saved
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedEvents') || '[]');
      setIsSaved(saved.includes(eventId));
    } catch (_) {}
  }, [eventId]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      if (event.is_registered) {
        await api.delete(`/api/events/${eventId}/register`);
        toast.success('Registration cancelled');
      } else {
        await api.post(`/api/events/${eventId}/register`, {});
        toast.success("You're going!");
      }
      fetchEvent();
      fetchAttendees();
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (detail === 'Already registered') toast.info('Already registered');
      else toast.error('Action failed');
    } finally {
      setRegistering(false);
    }
  };

  const toggleSave = () => {
    try {
      const saved = new Set(JSON.parse(localStorage.getItem('savedEvents') || '[]'));
      if (saved.has(eventId)) { saved.delete(eventId); toast.success('Removed from saved'); }
      else { saved.add(eventId); toast.success('Event saved!'); }
      localStorage.setItem('savedEvents', JSON.stringify([...saved]));
      setIsSaved(saved.has(eventId));
    } catch (_) {}
  };

  const handleShare = async (platform) => {
    const url = window.location.href;
    const text = `Check out "${event?.title}" on CrossCrafted!`;
    if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
    }
    setShowShareMenu(false);
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const isLive = () => {
    if (!event?.date) return false;
    const now = new Date();
    const start = new Date(event.date);
    const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return now >= start && now <= end;
  };

  const isUpcoming = () => event?.date && new Date(event.date) > new Date();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#EC4899] border-r-transparent"></div>
        <p className="mt-4 text-white font-medium">Loading event...</p>
      </div>
    </div>
  );

  if (!event) return null;

  const cat = getCatMeta(event.category);
  const CatIcon = cat.icon;
  const live = isLive();

  return (
    <div className="feed-container px-4 py-6" data-testid="event-detail-page">
      {/* Back Button */}
      <button onClick={() => navigate('/app/events')} className="flex items-center gap-2 text-[#94A3B8] hover:text-white mb-4 font-medium transition-colors" data-testid="back-to-events">
        <ArrowLeft size={20} strokeWidth={2.5} /> Back to Events
      </button>

      {/* Event Hero Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.04] rounded-[20px] backdrop-blur-sm border border-white/[0.06] overflow-hidden mb-6">

        {/* Cover / Banner */}
        <div className="h-56 md:h-64 relative" style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}80, #1E293B)` }}>
          {event.cover_image ? (
            <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <CatIcon size={80} strokeWidth={0.8} className="opacity-15 text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent" />

          {/* Top bar with badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            {/* Category badge */}
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-sm border border-white/[0.15]"
              style={{ background: `${cat.color}40`, color: '#fff' }}>
              <CatIcon size={12} /> {cat.label}
            </span>
            {/* Live badge */}
            {live && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur-sm text-[11px] font-bold text-white">
                <Radio size={11} className="animate-pulse" /> LIVE NOW
              </span>
            )}
            {/* Online badge */}
            {event.is_online && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6366F1]/60 backdrop-blur-sm text-[11px] font-bold text-white border border-white/[0.15]">
                <Video size={11} /> Online
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={toggleSave} className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/[0.12] hover:bg-black/60 transition-all" aria-label="Save event">
              {isSaved ? <BookmarkCheck size={16} className="text-[#F59E0B]" /> : <Bookmark size={16} className="text-white/70" />}
            </button>
            <div className="relative">
              <button onClick={() => setShowShareMenu(!showShareMenu)} className="p-2.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/[0.12] hover:bg-black/60 transition-all" aria-label="Share event">
                <Share2 size={16} className="text-white/70" />
              </button>
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute top-12 right-0 bg-[#1E293B] border border-white/[0.08] rounded-xl p-2 min-w-[140px] z-10">
                    <button onClick={() => handleShare('whatsapp')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-white/[0.06] rounded-lg transition-colors">
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                    <button onClick={() => handleShare('copy')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-white/[0.06] rounded-lg transition-colors">
                      <Copy size={14} /> Copy Link
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Date badge */}
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-2xl border border-white/[0.12] p-3 text-center min-w-[70px]"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <p className="text-[10px] font-bold uppercase text-white/70">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</p>
            <p className="text-2xl font-bold text-white leading-none">{new Date(event.date).getDate()}</p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Title + Register */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" data-testid="event-title">{event.title}</h1>
              {(event.church_name || event.creator_name) && (
                <p className="text-base text-[#94A3B8]">
                  Hosted by{' '}
                  {event.church_obj_id ? (
                    <Link to={`/app/churches/${event.church_obj_id}`} className="font-bold text-white hover:text-[#A855F7] transition-colors">{event.church_name}</Link>
                  ) : (
                    <span className="font-bold">{event.creator_name}</span>
                  )}
                </p>
              )}
              {/* Tags */}
              {event.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {event.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full bg-[#6366F1]/15 text-[#6366F1] text-[10px] font-semibold border border-[#6366F1]/20">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {/* Live Stream Button */}
              {(live || event.is_online) && event.stream_url && (
                <a href={event.stream_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/30 transition-all">
                  <Radio size={16} className={live ? 'animate-pulse' : ''} /> Watch Live
                </a>
              )}
              {/* RSVP/Register */}
              <button onClick={handleRegister} disabled={registering}
                className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  event.is_registered ? 'bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981]' : 'text-white hover:-translate-y-0.5'
                }`}
                style={!event.is_registered ? { background: 'linear-gradient(135deg, #EC4899, #F97316)', boxShadow: '0 4px 20px rgba(236,72,153,0.3)' } : {}}
                data-testid="register-button">
                {event.is_registered ? <><Check size={18} strokeWidth={2.5} /> Going</> : registering ? 'Registering...' : 'RSVP'}
              </button>
            </div>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="flex items-center gap-3 p-4 bg-[#EC4899]/8 border border-white/[0.06] rounded-2xl">
              <Calendar size={20} strokeWidth={2.5} className="text-[#EC4899] flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Date</p>
                <p className="text-sm font-semibold text-white" data-testid="event-date">{formatDate(event.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#6366F1]/8 border border-white/[0.06] rounded-2xl">
              <Clock size={20} strokeWidth={2.5} className="text-[#6366F1] flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Time</p>
                <p className="text-sm font-semibold text-white" data-testid="event-time">{formatTime(event.date)}</p>
                {event.end_date && <p className="text-[10px] text-[#94A3B8]">to {formatTime(event.end_date)}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#3B82F6]/8 border border-white/[0.06] rounded-2xl">
              {event.is_online ? <Video size={20} strokeWidth={2.5} className="text-[#3B82F6] flex-shrink-0" /> : <MapPin size={20} strokeWidth={2.5} className="text-[#3B82F6] flex-shrink-0" />}
              <div>
                <p className="text-[10px] font-bold uppercase text-[#94A3B8]">{event.is_online ? 'Online' : 'Location'}</p>
                <p className="text-sm font-semibold text-white truncate" data-testid="event-location">{event.is_online ? 'Live Stream' : event.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#10B981]/8 border border-white/[0.06] rounded-2xl">
              <Ticket size={20} strokeWidth={2.5} className="text-[#10B981] flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Price</p>
                <p className="text-sm font-semibold text-white">{event.is_free !== false && !event.price ? 'Free' : `₹${event.price}`}</p>
              </div>
            </div>
          </div>

          {/* State / City / Language info */}
          {(event.state || event.city || event.languages?.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {event.state && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-full text-xs text-[#94A3B8]"><MapPin size={12} /> {event.state}</span>}
              {event.city && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-full text-xs text-[#94A3B8]">{event.city}</span>}
              {event.languages?.map(l => <span key={l} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-full text-xs text-[#94A3B8]"><Globe size={12} /> {l}</span>)}
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3 text-[#94A3B8]">About this event</h3>
            <p className="text-base leading-relaxed text-white/90 whitespace-pre-wrap" data-testid="event-description">{event.description}</p>
          </div>

          {/* Attendee count + capacity */}
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-full text-sm font-bold text-[#6366F1]">
              <Users size={14} /> {event.attendees_count || 0} going
            </div>
            {event.max_attendees && (
              <span className="text-xs text-[#94A3B8]">
                {event.max_attendees - (event.attendees_count || 0)} spots left
              </span>
            )}
            {event.is_free !== false && !event.price && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#10B981]/10 border border-[#10B981]/20 rounded-full text-sm font-bold text-[#10B981]">
                Free Event
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Attendees Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white/[0.04] rounded-[20px] backdrop-blur-sm border border-white/[0.06] p-6 md:p-8" data-testid="attendees-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <Users size={24} strokeWidth={2.5} />
            Attendees ({event.attendees_count || 0})
          </h3>
          {event.is_registered && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-[#10B981]/15 text-[#10B981] rounded-full text-xs font-bold">
              <Check size={12} /> You're going
            </span>
          )}
        </div>

        {attendees.length === 0 ? (
          <div className="text-center py-8">
            <Users size={40} strokeWidth={2} className="mx-auto mb-3 text-[#94A3B8] opacity-40" />
            <p className="text-[#94A3B8] mb-3">No one has registered yet. Be the first!</p>
            {!event.is_registered && (
              <button onClick={handleRegister} className="px-5 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }}>
                RSVP Now
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {attendees.map((attendee) => (
              <div key={attendee._id} onClick={() => navigate(`/app/profile/${attendee._id}`)}
                className="flex items-center gap-3 p-3 bg-[#0F172A] border border-white/[0.08] rounded-2xl hover:bg-white/[0.06] transition-colors cursor-pointer"
                data-testid="attendee-card">
                {attendee.profile_image ? (
                  <img src={attendee.profile_image} alt={attendee.name} className="w-10 h-10 rounded-full border border-white/[0.08] object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#A855F7] border border-white/[0.08] flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {attendee.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="font-bold text-sm truncate text-white">{attendee.name}</p>
                  <p className="text-xs text-[#94A3B8] truncate">@{attendee.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EventDetail;
