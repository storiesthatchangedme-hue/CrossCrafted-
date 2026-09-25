import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, MapPin, Clock, Globe, Filter, X,
  BookOpen, Heart, Sparkles, UserPlus, UserMinus, Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_STATES, LANGUAGES } from '@/constants/india';

const CATEGORIES = [
  'Bible Study', 'Prayer Group', 'Youth', 'Worship Team',
  'Fellowship', 'Outreach', 'Support Group',
];

const CATEGORY_COLORS = {
  'Bible Study': { bg: 'bg-[#A855F7]/15', text: 'text-[#A855F7]', border: 'border-[#A855F7]/20' },
  'Prayer Group': { bg: 'bg-[#EC4899]/15', text: 'text-[#EC4899]', border: 'border-[#EC4899]/20' },
  'Youth': { bg: 'bg-[#3B82F6]/15', text: 'text-[#3B82F6]', border: 'border-[#3B82F6]/20' },
  'Worship Team': { bg: 'bg-[#F59E0B]/15', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
  'Fellowship': { bg: 'bg-[#10B981]/15', text: 'text-[#10B981]', border: 'border-[#10B981]/20' },
  'Outreach': { bg: 'bg-[#F97316]/15', text: 'text-[#F97316]', border: 'border-[#F97316]/20' },
  'Support Group': { bg: 'bg-[#06B6D4]/15', text: 'text-[#06B6D4]', border: 'border-[#06B6D4]/20' },
};

const TABS = [
  { key: 'discover', label: 'Discover' },
  { key: 'my-groups', label: 'My Groups' },
];

const SmallGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myGroupsLoading, setMyGroupsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterState) params.append('state', filterState);
      if (filterLanguage) params.append('language', filterLanguage);
      if (filterCategory) params.append('category', filterCategory);
      const { data } = await api.get(`/api/small-groups?${params}`);
      setGroups(Array.isArray(data) ? data : data?.groups || []);
    } catch (_) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterState, filterLanguage, filterCategory]);

  const fetchMyGroups = useCallback(async () => {
    if (!user) return;
    setMyGroupsLoading(true);
    try {
      const { data } = await api.get('/api/small-groups/my-groups');
      setMyGroups(Array.isArray(data) ? data : data?.groups || []);
    } catch (_) {
      toast.error('Failed to load your groups');
    } finally {
      setMyGroupsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);
  useEffect(() => { if (activeTab === 'my-groups') fetchMyGroups(); }, [activeTab, fetchMyGroups]);

  const handleJoin = async (groupId) => {
    try {
      await api.post(`/api/small-groups/${groupId}/join`);
      toast.success('Joined group!');
      fetchGroups();
      if (activeTab === 'my-groups') fetchMyGroups();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to join group');
    }
  };

  const handleLeave = async (groupId) => {
    try {
      await api.delete(`/api/small-groups/${groupId}/join`);
      toast.success('Left group');
      fetchGroups();
      if (activeTab === 'my-groups') fetchMyGroups();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to leave group');
    }
  };

  const activeFilters = [filterState, filterLanguage, filterCategory].filter(Boolean).length;

  const renderGroupCard = (group, index) => {
    const catColor = CATEGORY_COLORS[group.category] || { bg: 'bg-white/[0.06]', text: 'text-[#94A3B8]', border: 'border-white/[0.08]' };
    const isFull = group.max_members && group.member_count >= group.max_members;

    return (
      <motion.div
        key={group._id || group.id || index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 hover:bg-white/[0.06] transition-colors"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-[14px] font-bold text-white flex-1 min-w-0">{group.name}</h3>
          {group.category && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex-shrink-0 ${catColor.bg} ${catColor.text} ${catColor.border}`}>
              {group.category}
            </span>
          )}
        </div>

        <p className="text-[12px] text-[#94A3B8] leading-relaxed line-clamp-2 mb-3">{group.description}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-[#64748B] mb-3">
          {group.location && (
            <span className="flex items-center gap-1"><MapPin size={10} />{group.location}</span>
          )}
          {group.meeting_time && (
            <span className="flex items-center gap-1"><Clock size={10} />{group.meeting_time}</span>
          )}
          {group.language && (
            <span className="flex items-center gap-1"><Globe size={10} />{group.language}</span>
          )}
          <span className="flex items-center gap-1">
            <Users size={10} />
            {group.member_count || 0}{group.max_members ? ` / ${group.max_members}` : ''}
          </span>
        </div>

        <div className="flex items-center justify-between">
          {/* Member bar */}
          {group.max_members && (
            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden mr-3">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, ((group.member_count || 0) / group.max_members) * 100)}%`,
                  background: isFull ? '#EF4444' : 'linear-gradient(135deg, #A855F7, #EC4899)',
                }}
              />
            </div>
          )}

          {group.is_member ? (
            <button
              onClick={() => handleLeave(group._id || group.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-white/[0.06] text-[#94A3B8] hover:text-white hover:bg-white/[0.1] border border-white/[0.08] transition-all flex-shrink-0"
            >
              <UserMinus size={12} /> Leave
            </button>
          ) : (
            <button
              onClick={() => handleJoin(group._id || group.id)}
              disabled={isFull}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-50 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }}
            >
              <UserPlus size={12} /> {isFull ? 'Full' : 'Join'}
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#EC4899] animate-spin" />
      </div>
    );
  }

  const displayGroups = activeTab === 'my-groups' ? myGroups : groups;
  const displayLoading = activeTab === 'my-groups' ? myGroupsLoading : false;

  return (
    <div className="max-w-[640px] mx-auto px-4 py-5" data-testid="small-groups-page">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }}>
          <Users size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Small Groups</h1>
          <p className="text-[11px] text-[#94A3B8]">Find your community, grow together</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white/[0.04] rounded-2xl p-1 border border-white/[0.06]">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'text-white shadow-lg'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
            }`}
            style={activeTab === tab.key ? { background: 'linear-gradient(135deg, #EC4899, #F97316)' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Filters (Discover tab only) */}
      {activeTab === 'discover' && (
        <>
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#EC4899]/40 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                activeFilters > 0 ? 'bg-[#EC4899]/15 border-[#EC4899]/30 text-[#EC4899]' : 'bg-white/[0.04] border-white/[0.06] text-[#94A3B8] hover:text-white'
              }`}
            >
              <Filter size={14} />
              {activeFilters > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#EC4899] text-white text-[9px] flex items-center justify-center">{activeFilters}</span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                      <MapPin size={10} className="inline mr-0.5" /> State
                    </label>
                    <select
                      value={filterState}
                      onChange={(e) => setFilterState(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#EC4899]/40"
                    >
                      <option value="">All States</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                      <Globe size={10} className="inline mr-0.5" /> Language
                    </label>
                    <select
                      value={filterLanguage}
                      onChange={(e) => setFilterLanguage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#EC4899]/40"
                    >
                      <option value="">All Languages</option>
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                      <Tag size={10} className="inline mr-0.5" /> Category
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#EC4899]/40"
                    >
                      <option value="">All Categories</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                {activeFilters > 0 && (
                  <button
                    onClick={() => { setFilterState(''); setFilterLanguage(''); setFilterCategory(''); }}
                    className="mt-3 text-xs text-[#94A3B8] hover:text-white transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Group List */}
      {displayLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[#EC4899] animate-spin" />
        </div>
      ) : displayGroups.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
          <div className="w-14 h-14 bg-[#EC4899]/10 border border-[#EC4899]/25 rounded-full flex items-center justify-center mx-auto mb-4 text-[#EC4899]">
            <Users size={24} />
          </div>
          <h3 className="text-white font-bold text-base mb-1">
            {activeTab === 'my-groups' ? 'No Groups Joined' : 'No Groups Found'}
          </h3>
          <p className="text-[#64748B] text-xs max-w-sm mx-auto leading-relaxed">
            {activeTab === 'my-groups'
              ? 'Join a small group to start growing in community.'
              : 'No groups match your search or filters. Try adjusting them.'}
          </p>
          {activeTab === 'my-groups' && (
            <button
              onClick={() => setActiveTab('discover')}
              className="mt-4 px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:-translate-y-px"
              style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }}
            >
              Discover Groups
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayGroups.map((group, i) => renderGroupCard(group, i))}
        </div>
      )}
    </div>
  );
};

export default SmallGroups;
