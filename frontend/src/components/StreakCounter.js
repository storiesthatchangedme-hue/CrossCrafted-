import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

const STREAK_COLORS = {
  prayer: { icon: '#EC4899', text: 'text-[#EC4899]', bg: 'bg-[#EC4899]/15', border: 'border-[#EC4899]/20', glow: '#EC489940' },
  bible_reading: { icon: '#3B82F6', text: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]/15', border: 'border-[#3B82F6]/20', glow: '#3B82F640' },
  attendance: { icon: '#10B981', text: 'text-[#10B981]', bg: 'bg-[#10B981]/15', border: 'border-[#10B981]/20', glow: '#10B98140' },
  default: { icon: '#F97316', text: 'text-[#F97316]', bg: 'bg-[#F97316]/15', border: 'border-[#F97316]/20', glow: '#F9731640' },
};

const StreakCounter = ({ streak }) => {
  const { streak_type, current_count, longest_count, last_date } = streak;
  const colors = STREAK_COLORS[streak_type] || STREAK_COLORS.default;

  const isActive = last_date && (() => {
    const last = new Date(last_date);
    const now = new Date();
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${colors.bg} ${colors.border}`}
    >
      {/* Fire icon */}
      <div className="relative">
        {isActive && current_count > 0 && (
          <div
            className="absolute -inset-1 rounded-full blur-sm opacity-60"
            style={{ backgroundColor: colors.glow }}
          />
        )}
        <Flame
          size={16}
          style={{ color: colors.icon }}
          className={current_count > 0 && isActive ? 'animate-pulse' : ''}
        />
      </div>

      {/* Count */}
      <span className={`text-sm font-bold ${colors.text}`}>
        {current_count || 0}
      </span>

      {/* Longest subtext */}
      {longest_count > 0 && (
        <span className="text-[9px] text-[#64748B] font-medium">
          Longest: {longest_count}
        </span>
      )}
    </motion.div>
  );
};

export default StreakCounter;
