import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Users, Calendar, FileText, TrendingUp, Church, BarChart3,
  ArrowUpRight, Activity
} from 'lucide-react';
import { toast } from 'sonner';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/analytics');
      setAnalytics(data);
    } catch (_) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#A855F7] border-r-transparent" />
      </div>
    );
  }

  if (!analytics) {
    return <p className="text-center text-[#94A3B8] py-10">Failed to load analytics.</p>;
  }

  const statCards = [
    { label: 'Total Users', value: analytics.total_users || 0, icon: Users, color: '#3B82F6' },
    { label: 'Total Events', value: analytics.total_events || 0, icon: Calendar, color: '#EC4899' },
    { label: 'Total Posts', value: analytics.total_posts || 0, icon: FileText, color: '#A855F7' },
    { label: 'Engagement Rate', value: `${analytics.engagement_rate || 0}%`, icon: TrendingUp, color: '#10B981' },
  ];

  // Compute max for bar chart
  const usersOverTime = Array.isArray(analytics.users_over_time) ? analytics.users_over_time : [];
  const maxUsers = Math.max(...usersOverTime.map(d => d.count || 0), 1);

  const topChurches = Array.isArray(analytics.top_churches) ? analytics.top_churches : [];
  const topEvents = Array.isArray(analytics.top_events) ? analytics.top_events : [];

  return (
    <div data-testid="admin-analytics">
      <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
        Analytics
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.06] transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${card.color}20` }}
              >
                <card.icon size={20} strokeWidth={2.5} style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {card.value}
            </p>
            <p className="text-sm text-[#94A3B8]">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {/* Users Over Time — CSS-only bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6"
        >
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <BarChart3 size={18} strokeWidth={2.5} className="text-[#A855F7]" /> Users Over Time
          </h3>
          {usersOverTime.length > 0 ? (
            <div className="flex items-end gap-1.5 h-40">
              {usersOverTime.map((d, i) => {
                const pct = Math.max(2, ((d.count || 0) / maxUsers) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[8px] text-[#64748B] font-medium">{d.count || 0}</span>
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${pct}%`,
                        background: 'linear-gradient(to top, #A855F7, #EC4899)',
                        minHeight: '4px',
                      }}
                    />
                    <span className="text-[8px] text-[#64748B] truncate w-full text-center">
                      {d.label || d.date || d.month || ''}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#475569]">No data available</p>
          )}
        </motion.div>

        {/* Engagement Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6"
        >
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Activity size={18} strokeWidth={2.5} className="text-[#10B981]" /> Key Metrics
          </h3>
          <div className="space-y-3">
            {[
              { label: 'DAU', value: analytics.dau || 0, color: '#3B82F6' },
              { label: 'MAU', value: analytics.mau || 0, color: '#A855F7' },
              { label: 'Avg. Session', value: analytics.avg_session || '0m', color: '#10B981' },
              { label: 'Retention (7d)', value: `${analytics.retention_7d || 0}%`, color: '#EC4899' },
            ].map((metric) => (
              <div key={metric.label} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <span className="text-sm text-[#94A3B8]">{metric.label}</span>
                <span className="text-sm font-bold" style={{ color: metric.color }}>{metric.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Churches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6"
        >
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Church size={18} strokeWidth={2.5} className="text-[#10B981]" /> Top Churches
          </h3>
          {topChurches.length > 0 ? (
            <div className="space-y-2">
              {topChurches.map((church, i) => (
                <div key={church._id || i} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-bold text-[#64748B] w-5">{i + 1}</span>
                    <span className="text-sm font-medium text-white truncate">{church.name}</span>
                  </div>
                  <span className="text-xs text-[#94A3B8] shrink-0 ml-2 flex items-center gap-1">
                    <Users size={11} /> {church.members_count || church.member_count || 0}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#475569]">No church data</p>
          )}
        </motion.div>

        {/* Top Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6"
        >
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Calendar size={18} strokeWidth={2.5} className="text-[#EC4899]" /> Top Events
          </h3>
          {topEvents.length > 0 ? (
            <div className="space-y-2">
              {topEvents.map((event, i) => (
                <div key={event._id || i} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-bold text-[#64748B] w-5">{i + 1}</span>
                    <span className="text-sm font-medium text-white truncate">{event.title}</span>
                  </div>
                  <span className="text-xs text-[#94A3B8] shrink-0 ml-2 flex items-center gap-1">
                    <ArrowUpRight size={11} /> {event.attendees_count || 0}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#475569]">No event data</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
