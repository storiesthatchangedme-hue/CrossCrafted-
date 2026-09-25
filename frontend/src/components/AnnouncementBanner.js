import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, AlertTriangle, PartyPopper, X } from 'lucide-react';

const TYPE_CONFIG = {
  info: {
    icon: Info,
    bg: 'bg-[#3B82F6]/10',
    border: 'border-[#3B82F6]/30',
    text: 'text-[#3B82F6]',
    iconColor: '#3B82F6',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-[#F59E0B]/10',
    border: 'border-[#F59E0B]/30',
    text: 'text-[#F59E0B]',
    iconColor: '#F59E0B',
  },
  celebration: {
    icon: PartyPopper,
    bg: 'bg-[#EC4899]/10',
    border: 'border-[#EC4899]/30',
    text: 'text-[#EC4899]',
    iconColor: '#EC4899',
  },
  default: {
    icon: Info,
    bg: 'bg-[#3B82F6]/10',
    border: 'border-[#3B82F6]/30',
    text: 'text-[#3B82F6]',
    iconColor: '#3B82F6',
  },
};

const STORAGE_KEY = 'crosscrafted_dismissed_announcements';

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data } = await api.get('/api/announcements');
      const items = Array.isArray(data) ? data : data?.announcements || [];
      // Filter out expired and inactive
      const now = new Date();
      const active = items.filter(a => {
        if (!a.is_active) return false;
        if (a.active_until && new Date(a.active_until) < now) return false;
        return true;
      });
      setAnnouncements(active);
    } catch (_) {
      // Silent — non-critical
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const visible = announcements.filter(a => !dismissedIds.includes(a._id || a.id));

  if (visible.length === 0) return null;

  return (
    <div className="sticky top-0 z-50 w-full">
      <AnimatePresence>
        {visible.map((announcement) => {
          const config = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.default;
          const IconComp = config.icon;

          return (
            <motion.div
              key={announcement._id || announcement.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className={`w-full ${config.bg} border-b ${config.border} px-4 py-2.5`}
            >
              <div className="max-w-[1200px] mx-auto flex items-center gap-3">
                <IconComp size={16} style={{ color: config.iconColor }} className="flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  {announcement.title && (
                    <span className={`text-[12px] font-bold ${config.text} mr-2`}>
                      {announcement.title}
                    </span>
                  )}
                  <span className="text-[12px] text-white/80">
                    {announcement.message}
                  </span>
                </div>

                <button
                  onClick={() => handleDismiss(announcement._id || announcement.id)}
                  className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Dismiss announcement"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementBanner;
