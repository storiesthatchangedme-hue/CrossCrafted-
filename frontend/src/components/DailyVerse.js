import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { BookOpen, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DailyVerse = () => {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVerse = useCallback(async () => {
    try {
      const { data } = await api.get('/api/daily-verse');
      setVerse(data);
    } catch (_) {
      // Silent fail — non-critical widget
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVerse(); }, [fetchVerse]);

  const handleShare = async () => {
    if (!verse) return;
    const text = `"${verse.verse}" — ${verse.reference}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Verse copied to clipboard!');
    } catch (_) {
      toast.error('Failed to copy');
    }
  };

  if (loading) {
    return (
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 animate-pulse">
        <div className="h-3 bg-white/[0.06] rounded w-1/3 mb-3" />
        <div className="h-4 bg-white/[0.06] rounded w-full mb-2" />
        <div className="h-4 bg-white/[0.06] rounded w-3/4" />
      </div>
    );
  }

  if (!verse) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 relative overflow-hidden"
    >
      {/* Decorative gradient accent */}
      <div
        className="absolute top-0 left-0 w-24 h-24 opacity-20 blur-2xl pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>
            <BookOpen size={14} className="text-white" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Daily Verse</span>
        </div>
        <button
          onClick={handleShare}
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.06] border border-white/[0.08] text-[#94A3B8] hover:text-white hover:bg-white/[0.1] transition-all"
          aria-label="Share verse"
        >
          <Share2 size={13} />
        </button>
      </div>

      {/* Verse Text */}
      <p className="text-[13px] text-white/90 italic leading-relaxed mb-2 relative">
        "{verse.verse || verse.text}"
      </p>

      {/* Reference */}
      <p className="text-[11px] font-semibold text-[#A855F7] relative">
        — {verse.reference || verse.book_chapter}
      </p>
    </motion.div>
  );
};

export default DailyVerse;
