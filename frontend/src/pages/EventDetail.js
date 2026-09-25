import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Calendar, MapPin, Users, ArrowLeft, Check, X,
  User, Clock, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';


const EventDetail = () => {
  const { user } = useAuth();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      const { data } = await api.get('/api/events/${eventId}');
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
      const { data } = await api.get('/api/events/${eventId}/attendees');
      setAttendees(data);
    } catch (_) {
      /* attendees fetch non-critical */
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
    fetchAttendees();
  }, [fetchEvent, fetchAttendees]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      if (event.is_registered) {
        await api.delete('/api/events/${eventId}/register');
        toast.success('Registration cancelled');
      } else {
        await api.post('/api/events/${eventId}/register', {});
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

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#EC4899] border-r-transparent"></div>
          <p className="mt-4 text-white font-medium">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="feed-container px-4 py-6" data-testid="event-detail-page">
      {/* Back Button */}
      <button
        onClick={() => navigate('/app/events')}
        className="flex items-center gap-2 text-[#94A3B8] hover:text-white mb-4 font-medium transition-colors"
        data-testid="back-to-events"
      >
        <ArrowLeft size={20} strokeWidth={2.5} /> Back to Events
      </button>

      {/* Event Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.04] rounded-[20px] bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] overflow-hidden mb-6"
      >
        {/* Cover / Date Banner */}
        <div className="h-48 md:h-56 bg-gradient-to-br from-[#A855F7] via-[#EC4899] to-[#3B82F6] border-b border-white/[0.06] flex items-center justify-center relative">
          {event.cover_image ? (
            <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <Calendar size={64} strokeWidth={1.5} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold opacity-40">EVENT</p>
            </div>
          )}
          {/* Date badge */}
          <div className="absolute top-4 left-4 bg-white/[0.04] rounded-[20px] border border-white/[0.06] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.2)] text-center min-w-[70px]">
            <p className="text-xs font-bold uppercase text-[#94A3B8]">
              {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
            </p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {new Date(event.date).getDate()}
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Title + Register */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="event-title">
                {event.title}
              </h1>
              {(event.church_name || event.creator_name) && (
                <p className="text-base text-[#94A3B8]">
                  Hosted by{' '}
                  {event.church_obj_id ? (
                    <Link
                      to={`/app/churches/${event.church_obj_id}`}
                      className="font-bold text-white hover:text-[#A855F7] transition-colors"
                      data-testid="event-church-link"
                    >
                      {event.church_name}
                    </Link>
                  ) : (
                    <span className="font-bold">{event.creator_name}</span>
                  )}
                </p>
              )}
            </div>

            <button
              onClick={handleRegister}
              disabled={registering}
              className={`flex items-center gap-2 px-8 py-4 rounded-full border border-white/[0.08] font-bold text-lg transition-all whitespace-nowrap ${
                event.is_registered
                  ? 'bg-[#3B82F6] shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
                  : 'bg-[#EC4899] shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 hover:shadow-xl'
              }`}
              data-testid="register-button"
            >
              {event.is_registered ? (
                <><Check size={22} strokeWidth={2.5} /> Going</>
              ) : (
                registering ? 'Registering...' : 'Register'
              )}
            </button>
          </div>

          {/* Event Details Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-[#EC4899]/10 border border-white/[0.08] rounded-2xl">
              <Calendar size={24} strokeWidth={2.5} className="flex-shrink-0" />
              <div>
                <p className="text-sm font-bold">Date</p>
                <p className="text-sm text-[#94A3B8]" data-testid="event-date">{formatDate(event.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#6366F1]/10 border border-white/[0.08] rounded-2xl">
              <Clock size={24} strokeWidth={2.5} className="flex-shrink-0" />
              <div>
                <p className="text-sm font-bold">Time</p>
                <p className="text-sm text-[#94A3B8]" data-testid="event-time">{formatTime(event.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#3B82F6]/10 border border-white/[0.08] rounded-2xl">
              <MapPin size={24} strokeWidth={2.5} className="flex-shrink-0" />
              <div>
                <p className="text-sm font-bold">Location</p>
                <p className="text-sm text-[#94A3B8]" data-testid="event-location">{event.location}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-2 text-[#94A3B8]">About this event</h3>
            <p className="text-base leading-relaxed" data-testid="event-description">{event.description}</p>
          </div>

          {/* Free badge */}
          <div className="inline-block px-4 py-2 bg-[#3B82F6] border border-white/[0.08] rounded-full text-sm font-bold">
            Free Event
          </div>
        </div>
      </motion.div>

      {/* Attendees Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/[0.04] rounded-[20px] bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] p-6 md:p-8"
        data-testid="attendees-section"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Users size={24} strokeWidth={2.5} />
            Attendees ({event.attendees_count || 0})
          </h3>
        </div>

        {attendees.length === 0 ? (
          <div className="text-center py-8">
            <Users size={40} strokeWidth={2} className="mx-auto mb-3 text-[#94A3B8] opacity-40" />
            <p className="text-[#94A3B8]">No one has registered yet. Be the first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {attendees.map((attendee) => (
              <div
                key={attendee._id}
                onClick={() => navigate(`/app/profile/${attendee._id}`)}
                className="flex items-center gap-3 p-3 bg-[#0F172A] border border-white/[0.08] rounded-2xl hover:bg-white/[0.08]/[0.08] transition-colors cursor-pointer"
                data-testid="attendee-card"
              >
                {attendee.profile_image ? (
                  <img src={attendee.profile_image} alt={attendee.name} className="w-10 h-10 rounded-full border border-white/[0.08] object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#A855F7] border border-white/[0.08] flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {attendee.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="font-bold text-sm truncate">{attendee.name}</p>
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
