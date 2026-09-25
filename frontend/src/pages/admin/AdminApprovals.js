import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Check, X, UserCheck, Clock, MapPin, Globe, BookOpen, Church } from 'lucide-react';


const FAITH_LABELS = {
  faith_belief: { yes: 'Yes', exploring: "Exploring", not_sure: 'Not sure' },
  faith_journey: { christian: 'Christian', new_believer: 'New believer', exploring_christianity: 'Exploring Christianity', other: 'Other' },
  church_member: { yes: 'Yes', no: 'No', looking_for_one: 'Looking for one' },
};

const AdminApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const { user } = useAuth();

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/api/admin/pending-users');
      setPendingUsers(data);
    } catch (err) {
      console.error('Failed to fetch pending users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (userId, status) => {
    setActionLoading((prev) => ({ ...prev, [userId]: status }));
    try {
      await api.put('/api/admin/users/${userId}/status', { status });
      setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error('Failed to update user status:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: null }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#A855F7] border-r-transparent" />
      </div>
    );
  }

  return (
    <div data-testid="admin-approvals-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Pending Approvals
          </h1>
          <p className="text-[#64748B] text-sm mt-1">{pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} awaiting review</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Clock size={14} className="text-amber-400" />
          <span className="text-amber-400 text-xs font-bold">{pendingUsers.length} PENDING</span>
        </div>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
          <UserCheck className="mx-auto mb-3 text-emerald-400" size={40} />
          <p className="text-[#94A3B8] font-medium">All caught up! No pending approvals.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((u) => (
            <div key={u._id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5" data-testid={`pending-user-${u._id}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {u.profile_image ? (
                    <img src={u.profile_image} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#A855F7]/20 flex items-center justify-center text-[#A855F7] font-bold text-lg shrink-0">
                      {(u.name || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{u.name || 'No name'}</p>
                    <p className="text-[#64748B] text-sm truncate">@{u.username || '—'} &middot; {u.email}</p>
                    {u.phone && <p className="text-[#64748B] text-xs">{u.phone}</p>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(u._id, 'active')}
                    disabled={!!actionLoading[u._id]}
                    className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors"
                    data-testid={`approve-${u._id}`}
                  >
                    <Check size={16} /> {actionLoading[u._id] === 'active' ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleAction(u._id, 'rejected')}
                    disabled={!!actionLoading[u._id]}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors"
                    data-testid={`reject-${u._id}`}
                  >
                    <X size={16} /> {actionLoading[u._id] === 'rejected' ? '...' : 'Reject'}
                  </button>
                </div>
              </div>

              {/* User Details */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                {u.role && (
                  <div className="flex items-center gap-1.5 text-[#94A3B8]">
                    <UserCheck size={13} /> <span className="capitalize">{u.role.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {u.state && (
                  <div className="flex items-center gap-1.5 text-[#94A3B8]">
                    <MapPin size={13} /> {u.city ? `${u.city}, ` : ''}{u.state}
                  </div>
                )}
                {u.languages?.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[#94A3B8]">
                    <Globe size={13} /> {u.languages.join(', ')}
                  </div>
                )}
                {u.church_name && (
                  <div className="flex items-center gap-1.5 text-[#94A3B8]">
                    <Church size={13} /> {u.church_name}
                  </div>
                )}
              </div>

              {/* Faith Answers */}
              {(u.faith_belief || u.faith_journey || u.church_member) && (
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider mb-2">Faith Profile</p>
                  <div className="flex flex-wrap gap-2">
                    {u.faith_belief && (
                      <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-300 text-[11px]">
                        Believes: {FAITH_LABELS.faith_belief[u.faith_belief] || u.faith_belief}
                      </span>
                    )}
                    {u.faith_journey && (
                      <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-300 text-[11px]">
                        Journey: {FAITH_LABELS.faith_journey[u.faith_journey] || u.faith_journey}
                      </span>
                    )}
                    {u.church_member && (
                      <span className="px-2 py-1 rounded-lg bg-teal-500/10 text-teal-300 text-[11px]">
                        Church: {FAITH_LABELS.church_member[u.church_member] || u.church_member}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {u.bio && (
                <p className="mt-3 text-[#94A3B8] text-xs italic">"{u.bio}"</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
