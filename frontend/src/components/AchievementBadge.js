import { motion } from 'framer-motion';
import {
  BookOpen, Heart, Users, Star, Trophy, Flame, Crown,
  Calendar, CheckCircle2, MessageCircle, Music, Gift, Shield,
  Zap, Target, Award, Lock
} from 'lucide-react';

const ICON_MAP = {
  first_post: MessageCircle,
  prayer_warrior: Heart,
  bible_reader: BookOpen,
  streak_7: Flame,
  streak_30: Flame,
  streak_100: Flame,
  event_attendee: Calendar,
  group_joiner: Users,
  top_contributor: Trophy,
  verified: Shield,
  early_adopter: Star,
  community_builder: Users,
  worship_leader: Music,
  generous_giver: Gift,
  streak_master: Zap,
  goal_setter: Target,
  champion: Crown,
  completed_plan: CheckCircle2,
  default: Award,
};

const BADGE_COLORS = {
  first_post: '#3B82F6',
  prayer_warrior: '#EC4899',
  bible_reader: '#A855F7',
  streak_7: '#F97316',
  streak_30: '#F97316',
  streak_100: '#EF4444',
  event_attendee: '#10B981',
  group_joiner: '#06B6D4',
  top_contributor: '#F59E0B',
  verified: '#10B981',
  early_adopter: '#A855F7',
  community_builder: '#3B82F6',
  worship_leader: '#EC4899',
  generous_giver: '#F59E0B',
  streak_master: '#F97316',
  goal_setter: '#6366F1',
  champion: '#F59E0B',
  completed_plan: '#10B981',
  default: '#94A3B8',
};

const AchievementBadge = ({ achievement }) => {
  const { key, name, description, icon, earned, earned_at } = achievement;
  const IconComponent = ICON_MAP[key] || ICON_MAP[icon] || ICON_MAP.default;
  const color = BADGE_COLORS[key] || BADGE_COLORS[icon] || BADGE_COLORS.default;

  if (earned) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative group"
      >
        {/* Glow effect */}
        <div
          className="absolute -inset-1 rounded-2xl opacity-30 blur-md group-hover:opacity-50 transition-opacity"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
        />

        <div
          className="relative bg-white/[0.04] border rounded-2xl p-4 text-center"
          style={{ borderColor: `${color}40` }}
        >
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
            style={{ backgroundColor: `${color}20`, boxShadow: `0 0 20px ${color}30` }}
          >
            <IconComponent size={24} style={{ color }} />
          </div>

          {/* Name */}
          <h4 className="text-[12px] font-bold text-white mb-0.5">{name}</h4>

          {/* Description */}
          <p className="text-[10px] text-[#94A3B8] leading-snug mb-2">{description}</p>

          {/* Earned date + checkmark */}
          <div className="flex items-center justify-center gap-1">
            <CheckCircle2 size={11} style={{ color }} />
            <span className="text-[9px] text-[#64748B]">
              {earned_at ? new Date(earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Earned'}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Locked / unearned
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-center opacity-60">
      {/* Icon — locked */}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 bg-white/[0.06]">
        <Lock size={20} className="text-[#64748B]" />
      </div>

      {/* Name */}
      <h4 className="text-[12px] font-bold text-[#64748B] mb-0.5">{name}</h4>

      {/* Description */}
      <p className="text-[10px] text-[#475569] leading-snug">{description}</p>
    </div>
  );
};

export default AchievementBadge;
