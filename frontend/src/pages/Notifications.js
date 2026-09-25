import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Heart, MessageCircle, UserPlus, Bell, ShieldCheck,
  Check, CheckCheck, Mail, Tag, Calendar, Church
} from 'lucide-react';
import { toast } from 'sonner';
import { timeAgo } from '@/lib/formatters';


const typeConfig = {
  like: { icon: Heart, color: '#EC4899', bg: '#EC4899', category: 'Engagement' },
  comment: { icon: MessageCircle, color: '#3B82F6', bg: '#3B82F6', category: 'Engagement' },
  follow: { icon: UserPlus, color: '#A855F7', bg: '#A855F7', category: 'Social' },
  admin: { icon: ShieldCheck, color: '#10B981', bg: '#10B981', category: 'System' },
  message: { icon: Mail, color: '#F59E0B', bg: '#F59E0B', category: 'Messages' },
  prayer_support: { icon: Heart, color: '#10B981', bg: '#10B981', category: 'Prayer' },
  marketplace: { icon: Tag, color: '#F97316', bg: '#F97316', category: 'Marketplace' },
  event: { icon: Calendar, color: '#38BDF8', bg: '#38BDF8', category: 'System' },
  friend_request: { icon: UserPlus, color: '#A855F7', bg: '#A855F7', category: 'Social' },
  church_update: { icon: Church, color: '#EC4899', bg: '#EC4899', category: 'System' },
};

// Unique tabs for the filter bar
const UNIQUE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'Engagement', label: 'Likes' },
  { key: 'Engagement', label: 'Comments' },
  { key: 'Messages', label: 'Messages' },
  { key: 'Social', label: 'Follows' },
  { key: 'Prayer', label: 'Prayer' },
  { key: 'Marketplace', label: 'Marketplace' },
];

// Tab mapping from label to type/category filter
const TAB_FILTER_MAP = {
  'All': { types: null, categories: null },
  'Likes': { types: ['like'], categories: null },
  'Comments': { types: ['comment'], categories: null },
  'Messages': { types: ['message'], categories: null },
  'Follows': { types: ['follow', 'friend_request'], categories: null },
  'Prayer': { types: ['prayer_support'], categories: null },
  'Marketplace': { types: ['marketplace'], categories: null },
};

const getDateGroup = (dateStr) => {
  if (!dateStr) return 'Earlier';
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (notifDate.getTime() === today.getTime()) return 'Today';
  if (notifDate.getTime() === yesterday.getTime()) return 'Yesterday';
  if (notifDate >= weekStart) return 'Earlier this week';
  return 'Earlier';
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/api/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Poll for new notifications every 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get('/api/notifications/unread-count');
        if (data.unread_count !== unreadCount) fetchNotifications();
      } catch (_) {}
    }, 10000);
    return () => clearInterval(interval);
  }, [unreadCount, fetchNotifications]);

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (_) { toast.error('Failed'); }
  };

  const handleClick = async (notif) => {
    if (!notif.read) {
      await api.put(`/api/notifications/${notif._id}/read`, {});
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    // Navigate based on type
    if (notif.type === 'like' || notif.type === 'comment') navigate('/app/feed');
    else if (notif.type === 'follow') navigate(`/app/profile/${notif.sender_id}`);
    else if (notif.type === 'message') navigate('/app/messages');
    else if (notif.type === 'prayer_support') navigate('/app/prayer');
    else if (notif.type === 'marketplace') navigate('/app/shop');
    else if (notif.type === 'event') navigate('/app/events');
    else if (notif.type === 'friend_request') navigate(`/app/profile/${notif.sender_id}`);
    else if (notif.type === 'church_update') navigate('/app/churches');
  };

  // Filtered notifications based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'All') return notifications;
    const filter = TAB_FILTER_MAP[activeFilter];
    if (!filter) return notifications;
    if (filter.types) {
      return notifications.filter(n => filter.types.includes(n.type));
    }
    return notifications;
  }, [notifications, activeFilter]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups = { 'Today': [], 'Yesterday': [], 'Earlier this week': [], 'Earlier': [] };
    filteredNotifications.forEach(notif => {
      const group = getDateGroup(notif.created_at);
      groups[group].push(notif);
    });
    return groups;
  }, [filteredNotifications]);

  const renderNotification = (notif, i) => {
    const cfg = typeConfig[notif.type] || typeConfig.admin;
    const Icon = cfg.icon;
    return (
      <motion.div
        key={notif._id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.02 }}
        onClick={() => handleClick(notif)}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(notif); } }}
        role="button"
        aria-label={`Notification: ${notif.message}`}
        className={`flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer transition-all ${
          notif.read
            ? 'bg-transparent hover:bg-white/[0.03]'
            : 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06]'
        }`}
        data-testid="notification-item"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          {notif.sender_image ? (
            <img src={notif.sender_image} alt={`${notif.sender_name || 'User'}'s profile picture`} className="w-10 h-10 rounded-full object-cover border border-white/[0.1]" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border border-white/[0.1]"
              style={{ backgroundColor: cfg.bg + '20', color: cfg.color }}>
              {notif.sender_name?.charAt(0) || '?'}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: cfg.bg + '30' }}>
            <Icon size={11} strokeWidth={2.5} style={{ color: cfg.color }} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-relaxed ${notif.read ? 'text-[#94A3B8]' : 'text-white'}`}>
            {notif.message}
          </p>
          <p className="text-[11px] text-[#475569] mt-1">{timeAgo(notif.created_at)}</p>
        </div>

        {/* Unread dot */}
        {!notif.read && (
          <div className="w-2.5 h-2.5 rounded-full bg-[#A855F7] shrink-0 mt-1.5" data-testid="unread-dot" />
        )}
      </motion.div>
    );
  };

  return (
    <div className="max-w-[640px] mx-auto px-4 py-5" data-testid="notifications-page" role="main" aria-label="Notifications">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#EC4899] text-white text-xs font-bold" data-testid="unread-badge" aria-live="polite" role="status" aria-label={`${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`}>
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-xs font-medium text-[#94A3B8] hover:text-white transition-colors"
            data-testid="mark-all-read-btn">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-5 scrollbar-hide" data-testid="notification-filter-tabs" role="tablist" aria-label="Filter notifications">
        {UNIQUE_TABS.map(tab => (
          <button
            key={tab.label}
            onClick={() => setActiveFilter(tab.label)}
            role="tab"
            aria-selected={activeFilter === tab.label}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeFilter === tab.label
                ? 'bg-gradient-to-r from-[#FF90E8] to-[#A855F7] text-white border-transparent shadow-lg'
                : 'bg-white/[0.04] text-[#94A3B8] border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
            }`}
            data-testid={`notif-filter-${tab.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16" aria-busy="true">
          <div className="w-8 h-8 border-2 border-[#A855F7] border-r-transparent rounded-full animate-spin" aria-label="Loading" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-16" data-testid="empty-notifications">
          <Bell size={40} className="mx-auto mb-3 text-[#334155]" />
          <p className="text-[#64748B] font-medium text-sm">
            {activeFilter !== 'All' ? `No ${activeFilter.toLowerCase()} notifications` : 'No notifications yet'}
          </p>
          <p className="text-[#475569] text-xs mt-1">
            {activeFilter !== 'All'
              ? 'Try selecting a different category'
              : 'When people interact with you, you\'ll see it here'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today */}
          {groupedNotifications['Today'].length > 0 && (
            <div data-testid="notif-group-today">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2 px-1">Today</h3>
              <div className="space-y-1">
                {groupedNotifications['Today'].map((notif, i) => renderNotification(notif, i))}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {groupedNotifications['Yesterday'].length > 0 && (
            <div data-testid="notif-group-yesterday">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2 px-1">Yesterday</h3>
              <div className="space-y-1">
                {groupedNotifications['Yesterday'].map((notif, i) => renderNotification(notif, i))}
              </div>
            </div>
          )}

          {/* Earlier this week */}
          {groupedNotifications['Earlier this week'].length > 0 && (
            <div data-testid="notif-group-earlier-this-week">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2 px-1">Earlier this week</h3>
              <div className="space-y-1">
                {groupedNotifications['Earlier this week'].map((notif, i) => renderNotification(notif, i))}
              </div>
            </div>
          )}

          {/* Earlier */}
          {groupedNotifications['Earlier'].length > 0 && (
            <div data-testid="notif-group-earlier">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2 px-1">Earlier</h3>
              <div className="space-y-1">
                {groupedNotifications['Earlier'].map((notif, i) => renderNotification(notif, i))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;