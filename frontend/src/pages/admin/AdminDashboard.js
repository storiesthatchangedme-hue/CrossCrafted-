import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Clock, Church, Calendar, ShoppingBag, TrendingUp } from 'lucide-react';


const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/stats');
      setStats(data);
    } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#A855F7] border-r-transparent" />
    </div>
  );

  if (!stats) return <p className="text-center text-[#94A3B8]">Failed to load stats.</p>;

  const cards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: '#3B82F6', link: '/app/admin/users' },
    { label: 'Pending Approvals', value: stats.pending_users || 0, icon: Clock, color: '#F59E0B', link: '/app/admin/approvals' },
    { label: 'Total Churches', value: stats.churches, icon: Church, color: '#10B981', link: '/app/admin/churches' },
    { label: 'Total Events', value: stats.events, icon: Calendar, color: '#EC4899', link: '/app/admin/events' },
    { label: 'Total Products', value: stats.products, icon: ShoppingBag, color: '#8B5CF6', link: '/app/admin/products' },
  ];

  return (
    <div data-testid="admin-dashboard">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map((card, i) => (
          <Link to={card.link} key={card.label}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.06] transition-colors cursor-pointer"
              data-testid={`stat-card-${card.label.toLowerCase().replace(/ /g, '-')}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.color + '20' }}>
                  <card.icon size={20} strokeWidth={2.5} style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{card.value}</p>
              <p className="text-sm text-[#94A3B8]">{card.label}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Users by Role */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6"
          data-testid="role-breakdown"
        >
          <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <TrendingUp size={18} strokeWidth={2.5} className="text-[#A855F7]" /> Users by Role
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.role_counts || {}).map(([role, count]) => {
              const colors = { user: '#3B82F6', church: '#10B981', creator: '#EC4899', admin: '#F59E0B' };
              const pct = stats.users > 0 ? (count / stats.users) * 100 : 0;
              return (
                <div key={role}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize font-medium">{role}</span>
                    <span className="text-[#94A3B8]">{count}</span>
                  </div>
                  <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colors[role] || '#3B82F6' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6"
          data-testid="recent-users"
        >
          <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Signups</h3>
          {stats.recent_users?.length > 0 ? (
            <div className="space-y-2">
              {stats.recent_users.map((u) => (
                <div key={u._id} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{u.name}</p>
                    <p className="text-xs text-[#94A3B8] truncate">{u.email}</p>
                  </div>
                  <p className="text-xs text-[#94A3B8] shrink-0 ml-2">{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#475569]">No recent signups</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
