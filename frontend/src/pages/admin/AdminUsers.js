import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Search, Trash2, ChevronDown, ShieldCheck, Crown } from 'lucide-react';
import { toast } from 'sonner';


const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingRole, setEditingRole] = useState(null);

  const fetchUsers = useCallback(async (q = '') => {
    try {
      const { data } = await api.get('/api/admin/users?search=${encodeURIComponent(q)}');
      setUsers(data.users);
      setTotal(data.total);
    } catch (_) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e) => { e.preventDefault(); setLoading(true); fetchUsers(search); };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put('/api/admin/users/${userId}/role', { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      setEditingRole(null);
      fetchUsers(search);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleToggleVerify = async (userId, currentlyVerified) => {
    try {
      await api.put('/api/admin/users/${userId}/verify', { is_verified: !currentlyVerified });
      toast.success(currentlyVerified ? 'Verification removed' : 'User verified');
      fetchUsers(search);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update verification');
    }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}" and all their content?`)) return;
    try {
      await api.delete('/api/admin/users/${userId}');
      toast.success('User deleted');
      fetchUsers(search);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const roleColors = { user: '#3B82F6', church: '#10B981', creator: '#EC4899', admin: '#F59E0B' };

  return (
    <div data-testid="admin-users-page">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Users <span className="text-base text-[#94A3B8] font-normal">({total})</span>
        </h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
              className="bg-[#1a2235] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-[#94A3B8] w-60 focus:outline-none focus:border-[#A855F7]"
              data-testid="admin-users-search" />
          </div>
          <button type="submit" className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm font-medium hover:bg-white/[0.1] transition-colors">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#3B82F6] border-r-transparent mx-auto" /></div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-white/[0.04] border-b border-white/[0.08] text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
            <div className="col-span-3">User</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-1">Verified</div>
            <div className="col-span-1">Posts</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-1">Actions</div>
          </div>

          {users.map((u, i) => (
            <motion.div
              key={u._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors items-center"
              data-testid="admin-user-row"
            >
              <div className="col-span-3 flex items-center gap-3">
                {u.profile_image ? (
                  <img src={u.profile_image} alt={u.name} className="w-9 h-9 rounded-full border border-white/[0.1] object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full border border-white/[0.1] flex items-center justify-center font-bold text-xs flex-shrink-0" style={{ backgroundColor: (roleColors[u.role] || '#3B82F6') + '30' }}>
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm truncate">{u.name}</p>
                    {u.is_verified && u.role === 'admin' ? (
                      <Crown size={14} strokeWidth={2.5} className="shrink-0" style={{ color: '#FFFBEB', fill: '#F59E0B' }} />
                    ) : u.is_verified ? (
                      <ShieldCheck size={14} strokeWidth={2.5} className="shrink-0" style={{ color: 'white', fill: '#3B82F6' }} />
                    ) : null}
                  </div>
                  <p className="text-xs text-[#94A3B8] truncate">@{u.username}</p>
                </div>
              </div>
              <div className="col-span-2 text-sm text-[#94A3B8] truncate">{u.email}</div>
              <div className="col-span-2 relative">
                {editingRole === u._id ? (
                  <select
                    value={u.role}
                    onChange={(e) => handleChangeRole(u._id, e.target.value)}
                    onBlur={() => setEditingRole(null)}
                    autoFocus
                    className="bg-[#1E293B] border border-white/[0.15] rounded-lg text-sm py-1 px-2 w-full text-white focus:outline-none"
                    data-testid="admin-role-select"
                  >
                    <option value="user">user</option>
                    <option value="church">church</option>
                    <option value="creator">creator</option>
                    <option value="admin">admin</option>
                  </select>
                ) : (
                  <button
                    onClick={() => setEditingRole(u._id)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize cursor-pointer border border-white/[0.1] transition-colors hover:bg-white/[0.06]"
                    style={{ backgroundColor: (roleColors[u.role] || '#3B82F6') + '20', color: roleColors[u.role] || '#3B82F6' }}
                    data-testid="admin-role-badge"
                  >
                    {u.role} <ChevronDown size={12} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              <div className="col-span-1">
                <button
                  onClick={() => handleToggleVerify(u._id, u.is_verified)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    u.is_verified
                      ? 'bg-[#3B82F6]/15 border-[#3B82F6]/30 text-[#3B82F6] hover:bg-[#3B82F6]/25'
                      : 'bg-white/[0.04] border-white/[0.08] text-[#64748B] hover:text-[#3B82F6] hover:border-[#3B82F6]/30'
                  }`}
                  data-testid="admin-verify-user"
                  title={u.is_verified ? 'Remove verification' : 'Verify user'}
                >
                  <ShieldCheck size={13} strokeWidth={2.5} />
                  {u.is_verified ? 'Yes' : 'No'}
                </button>
              </div>
              <div className="col-span-1 text-sm text-[#94A3B8]">{u.posts_count || 0}</div>
              <div className="col-span-2 text-sm text-[#94A3B8]">{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</div>
              <div className="col-span-1">
                <button
                  onClick={() => handleDelete(u._id, u.name)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete user"
                  data-testid="admin-delete-user"
                >
                  <Trash2 size={16} strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-10 text-[#94A3B8]">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
