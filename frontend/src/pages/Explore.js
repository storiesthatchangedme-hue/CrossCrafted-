import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MapPin, Calendar, Users, TrendingUp, Sparkles,
  UserPlus, Filter, Globe, Search, X, ShieldCheck, FileText,
  Church, Film, Image as ImageIcon, Clock, Crown, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_STATES, LANGUAGES } from '@/constants/india';
import { GRADIENTS } from '@/lib/constants';

const Explore = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState({ posts: [], churches: [], events: [], trending_users: [] });
  const [searchResults, setSearchResults] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('community_hub');
  const [filterState, setFilterState] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [prayers, setPrayers] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState({});
  const [studyGroups, setStudyGroups] = useState([
    { id: 'bs1', title: 'Pune Young Believers Circle', timing: 'Thursdays, 7:30 PM', topic: 'Ephesians Study', location: 'Pune / Zoom', members: 28 },
    { id: 'bs2', title: 'South India Theological Fellowship', timing: 'Saturdays, 6:00 PM', topic: 'Grace & Truth', location: 'Bangalore / Hybrid', members: 45 },
    { id: 'bs3', title: 'Working Professionals Bible Hour', timing: 'Fridays, 8:00 PM', topic: 'Faith in the Workplace', location: 'Mumbai / Virtual', members: 32 },
    { id: 'bs4', title: 'Sisters Grace & Devotion Circle', timing: 'Mondays, 5:30 PM', topic: 'Women of the Bible', location: 'Delhi / Zoom', members: 19 }
  ]);
  const [prayerSupports, setPrayerSupports] = useState({});
  const searchTimerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchPrayers = async () => {
      try {
        const { data } = await api.get('/api/prayers');
        setPrayers(data.slice(0, 3));
      } catch (_) {}
    };
    fetchPrayers();
  }, []);

  const isSearching = searchQuery.trim().length >= 2;

  // Fetch default explore content
  const fetchExploreContent = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterState) params.append('state', filterState);
      if (filterLanguage) params.append('language', filterLanguage);
      const { data } = await api.get(`/api/explore?${params}`);
      setContent(data);
    } catch (_) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filterState, filterLanguage]);

  // Fetch recent searches
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const { data } = await api.get('/api/search/recent');
        setRecentSearches(data.queries || []);
      } catch (_) {}
    };
    fetchRecent();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!isSearching) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=8`);
        setSearchResults(data);
        // Save to recent searches
        api.post('/api/search/recent', { query: searchQuery.trim() }).catch(() => {});
      } catch (_) { toast.error('Search failed'); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQuery, isSearching]);

  useEffect(() => { fetchExploreContent(); }, [fetchExploreContent]);

  const handleFollowUser = async (userId) => {
    try {
      await api.post(`/api/users/${userId}/follow`, {});
      toast.success('Following!');
      if (isSearching) {
        // Refresh search
        const { data } = await api.get(`/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=8`);
        setSearchResults(data);
      } else {
        fetchExploreContent();
      }
    } catch (_) { toast.error('Follow failed'); }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    inputRef.current?.focus();
  };

  const handleJoinGroup = (groupId) => {
    if (joinedGroups[groupId]) {
      setJoinedGroups(prev => ({ ...prev, [groupId]: false }));
      setStudyGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: g.members - 1 } : g));
      toast.success('Left study group fellowship.');
    } else {
      setJoinedGroups(prev => ({ ...prev, [groupId]: true }));
      setStudyGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: g.members + 1 } : g));
      toast.success('Joined study group! Check your calendar for details.');
    }
  };

  const handleSupportPrayer = (prayerId) => {
    setPrayerSupports(prev => ({ ...prev, [prayerId]: !prev[prayerId] }));
    toast.success('Amen! Thank you for lifting this request in prayer.');
  };

  const tabs = [
    { key: 'community_hub', label: 'Community Hub 🌟', color: '#80C4E9' },
    { key: 'all', label: 'All', color: '#A855F7' },
    { key: 'users', label: 'People', color: '#3B82F6' },
    { key: 'posts', label: 'Posts', color: '#EC4899' },
    { key: 'churches', label: 'Churches', color: '#10B981' },
    { key: 'events', label: 'Events', color: '#6366F1' },
  ];

  const counts = searchResults?.counts || {};
  const activeFilters = [filterState, filterLanguage].filter(Boolean).length;

  const displayData = isSearching && searchResults ? searchResults : content;
  const displayUsers = isSearching ? (searchResults?.users || []) : (content.trending_users || []);
  const displayPosts = displayData.posts || [];
  const displayChurches = displayData.churches || [];
  const displayEvents = displayData.events || [];

  const totalResults = isSearching ? (counts.posts || 0) + (counts.churches || 0) + (counts.events || 0) + (counts.users || 0) : 0;

  return (
    <div className="max-w-[640px] mx-auto px-4 py-5" data-testid="explore-page">
      {/* Search Bar — always visible */}
      <div className="relative mb-4" data-testid="search-bar">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search people, posts, churches, events..."
          className="w-full bg-white/[0.06] border border-white/[0.08] rounded-2xl pl-11 pr-10 py-3.5 text-[15px] text-white placeholder:text-[#475569] outline-none focus:border-[#A855F7]/50 focus:bg-white/[0.08] transition-all"
          data-testid="search-input"
        />
        {searchQuery && (
          <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/[0.1] rounded-full transition-colors" data-testid="clear-search">
            <X size={16} className="text-[#64748B]" />
          </button>
        )}
        {searching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#A855F7] border-r-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Recently Searched */}
      {!isSearching && recentSearches.length > 0 && (
        <div className="mb-4" data-testid="recent-searches">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <Clock size={12} /> <span className="font-semibold uppercase tracking-wider">Recent</span>
            </div>
            <button onClick={async () => {
              await api.delete('/api/search/recent').catch(() => {});
              setRecentSearches([]);
            }} className="text-[10px] text-[#475569] hover:text-white transition-colors" data-testid="clear-recent-btn">Clear all</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {recentSearches.map((q, i) => (
              <button key={i} onClick={() => setSearchQuery(q.text)}
                className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-full text-xs text-[#CBD5E1] hover:bg-white/[0.08] hover:text-white transition-all"
                data-testid="recent-search-chip">
                <Search size={10} className="inline mr-1 text-[#64748B]" />{q.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search results summary */}
      {isSearching && searchResults && (
        <p className="text-xs text-[#64748B] mb-3" data-testid="search-results-count">
          {totalResults} result{totalResults !== 1 ? 's' : ''} for "<span className="text-[#A855F7] font-medium">{searchQuery.trim()}</span>"
        </p>
      )}

      {/* Header + Filter Toggle (only when not searching) */}
      {!isSearching && (
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Explore</h1>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              activeFilters > 0 ? 'bg-[#A855F7]/15 border-[#A855F7]/30 text-[#A855F7]' : 'bg-white/[0.04] border-white/[0.06] text-[#94A3B8] hover:text-white'
            }`} data-testid="explore-filter-toggle">
            <Filter size={14} />
            {activeFilters > 0 && <span className="w-4 h-4 rounded-full bg-[#A855F7] text-white text-[9px] flex items-center justify-center">{activeFilters}</span>}
          </button>
        </div>
      )}

      {/* Filters */}
      <AnimatePresence>
        {showFilters && !isSearching && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 overflow-hidden" data-testid="explore-filters-panel">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1"><MapPin size={10} className="inline mr-0.5" />State</label>
                <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="neo-input w-full text-sm" data-testid="explore-state-filter">
                  <option value="">All States</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1"><Globe size={10} className="inline mr-0.5" />Language</label>
                <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)} className="neo-input w-full text-sm" data-testid="explore-language-filter">
                  <option value="">All Languages</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setFilterState(''); setFilterLanguage(''); }} className="mt-3 text-xs text-[#94A3B8] hover:text-white transition-colors" data-testid="explore-clear-filters">Clear all filters</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-4 scrollbar-none">
        {tabs.map(t => {
          const count = isSearching ? (t.key === 'all' ? null : (counts[t.key === 'users' ? 'users' : t.key] || 0)) : null;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-full text-[12px] font-bold transition-all whitespace-nowrap ${
                activeTab === t.key ? 'text-white' : 'text-[#64748B] bg-white/[0.04] border border-white/[0.06]'
              }`}
              style={activeTab === t.key ? { background: t.color, boxShadow: `0 4px 16px ${t.color}30` } : {}}
              data-testid={`tab-${t.key}`}>
              {t.label}{isSearching && count !== null ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* Loading Skeletons */}
      {(loading && !isSearching) && (
        <div className="space-y-6 animate-pulse" data-testid="explore-loading-skeleton">
          {/* Welcome Card Skeleton */}
          <div className="h-32 rounded-2xl bg-white/[0.02] border border-white/[0.04]" />
          
          {/* Section 1 Skeleton */}
          <div className="space-y-3">
            <div className="h-4 w-32 bg-white/[0.04] rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="h-28 bg-white/[0.02] border border-white/[0.04] rounded-xl" />
              <div className="h-28 bg-white/[0.02] border border-white/[0.04] rounded-xl" />
            </div>
          </div>

          {/* Section 2 Skeleton */}
          <div className="space-y-3">
            <div className="h-4 w-24 bg-white/[0.04] rounded" />
            <div className="h-24 bg-white/[0.02] border border-white/[0.04] rounded-xl" />
            <div className="h-24 bg-white/[0.02] border border-white/[0.04] rounded-xl" />
          </div>
        </div>
      )}

      {/* ── Community Hub Tab ── */}
      {!loading && activeTab === 'community_hub' && !isSearching && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6" id="community-hub-section">
          {/* Welcome Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/10 border border-white/[0.06] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={120} />
            </div>
            <span className="px-2.5 py-1 bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#7C3AED] rounded-lg text-[10px] font-extrabold uppercase tracking-widest">India Fellowship Hub</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-white mt-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Welcome to the Family
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed mt-2.5">
              Connect with fellow believers in India. Join Bible study circles, intercede on the Prayer Wall, and participate in local Christian events. 
            </p>
          </div>

          {/* Bento Categories Grid */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#7C3AED]" /> Fellowship Directories
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3" id="community-categories">
              {/* Prayer Wall */}
              <div 
                onClick={() => navigate('/app/prayer-wall')}
                className="group relative p-4 rounded-2xl bg-gradient-to-br from-[#FB7185]/10 to-[#FB7185]/5 border border-[#FB7185]/15 hover:border-[#FB7185]/50 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg shadow-black/10"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#FB7185]/10 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-all" />
                <div className="w-8 h-8 rounded-xl bg-[#FB7185]/25 text-[#FB7185] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Heart size={16} fill="currentColor" />
                </div>
                <h4 className="text-xs font-black tracking-wide uppercase text-[#FB7185]">Prayer Wall</h4>
                <p className="text-[10px] text-slate-400 mt-1">Intercede & share needs</p>
              </div>

              {/* Bible Study */}
              <div 
                onClick={() => toast.success('Showing local Bible Study Circles below!')}
                className="group relative p-4 rounded-2xl bg-gradient-to-br from-[#FBBF24]/10 to-[#FBBF24]/5 border border-[#FBBF24]/15 hover:border-[#FBBF24]/50 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg shadow-black/10"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#FBBF24]/10 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-all" />
                <div className="w-8 h-8 rounded-xl bg-[#FBBF24]/25 text-[#FBBF24] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users size={16} />
                </div>
                <h4 className="text-xs font-black tracking-wide uppercase text-[#FBBF24]">Bible Study</h4>
                <p className="text-[10px] text-slate-400 mt-1">Join local study circles</p>
              </div>

              {/* Church Events */}
              <div 
                onClick={() => navigate('/app/events')}
                className="group relative p-4 rounded-2xl bg-gradient-to-br from-[#2563EB]/10 to-[#2563EB]/5 border border-[#2563EB]/15 hover:border-[#2563EB]/50 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg shadow-black/10"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#2563EB]/10 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-all" />
                <div className="w-8 h-8 rounded-xl bg-[#2563EB]/25 text-[#2563EB] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Calendar size={16} />
                </div>
                <h4 className="text-xs font-black tracking-wide uppercase text-[#2563EB]">Church Events</h4>
                <p className="text-[10px] text-slate-400 mt-1">Schedules & fellowship</p>
              </div>

              {/* Volunteer Opportunities */}
              <div 
                onClick={() => toast.success('Volunteer module loaded! More listings coming soon.')}
                className="group relative p-4 rounded-2xl bg-gradient-to-br from-[#10B981]/10 to-[#10B981]/5 border border-[#10B981]/15 hover:border-[#10B981]/50 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg shadow-black/10"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#10B981]/10 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-all" />
                <div className="w-8 h-8 rounded-xl bg-[#10B981]/25 text-[#10B981] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Crown size={16} />
                </div>
                <h4 className="text-xs font-black tracking-wide uppercase text-[#10B981]">Volunteer</h4>
                <p className="text-[10px] text-slate-400 mt-1">Serve India communities</p>
              </div>

              {/* Youth Groups */}
              <div 
                onClick={() => toast.success('Showing local Youth Fellowships below!')}
                className="group relative p-4 rounded-2xl bg-gradient-to-br from-[#7C3AED]/10 to-[#7C3AED]/5 border border-[#7C3AED]/15 hover:border-[#7C3AED]/50 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg shadow-black/10"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#7C3AED]/10 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-all" />
                <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/25 text-[#7C3AED] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Sparkles size={16} />
                </div>
                <h4 className="text-xs font-black tracking-wide uppercase text-[#7C3AED]">Youth Groups</h4>
                <p className="text-[10px] text-slate-400 mt-1">Connect with Gen Z</p>
              </div>

              {/* Prayer Meetings */}
              <div 
                onClick={() => toast.success('Discover local intercession circles below!')}
                className="group relative p-4 rounded-2xl bg-gradient-to-br from-[#38BDF8]/10 to-[#38BDF8]/5 border border-[#38BDF8]/15 hover:border-[#38BDF8]/50 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg shadow-black/10"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#38BDF8]/10 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-all" />
                <div className="w-8 h-8 rounded-xl bg-[#38BDF8]/25 text-[#38BDF8] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Clock size={16} />
                </div>
                <h4 className="text-xs font-black tracking-wide uppercase text-[#38BDF8]">Prayer Meetings</h4>
                <p className="text-[10px] text-slate-400 mt-1">Weekly intercession</p>
              </div>
            </div>
          </div>

          {/* Section 1: Bible Study Circles */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
                <Users size={12} className="text-[#38BDF8]" /> Bible Study & Small Groups
              </h3>
              <span className="text-[11px] text-slate-500 font-bold">4 Active Circles</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {studyGroups.map((group) => {
                const isJoined = joinedGroups[group.id];
                return (
                  <div key={group.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-[#1F2937] hover:border-[#7C3AED]/30 transition-all flex flex-col justify-between shadow-[0_4px_15px_rgba(0,0,0,0.15)] group relative">
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <span className="px-2 py-0.5 bg-[#7C3AED]/15 text-[#7C3AED] border border-[#7C3AED]/30 rounded-md text-[9px] font-black uppercase tracking-wider">
                          {group.location}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] font-bold flex items-center gap-1">
                          <Users size={10} className="text-[#38BDF8]" /> {group.members} believers
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1.5 leading-snug group-hover:text-[#38BDF8] transition-colors">{group.title}</h4>
                      <p className="text-[11px] text-slate-300 mb-0.5 font-medium"><span className="text-slate-500">Topic:</span> {group.topic}</p>
                      <p className="text-[11px] text-[#94A3B8] mb-4 font-medium"><span className="text-slate-500">When:</span> {group.timing}</p>
                    </div>
                    <button
                      onClick={() => handleJoinGroup(group.id)}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-all border ${
                        isJoined 
                          ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]' 
                          : 'bg-white/5 border-white/10 text-white hover:bg-gradient-to-r hover:from-[#7C3AED] hover:to-[#2563EB] hover:border-transparent hover:shadow-[0_4px_15px_rgba(124,58,237,0.3)]'
                      }`}
                    >
                      {isJoined ? 'Joined Fellowship ✓' : 'Join Circle'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Prayer Wall Teaser */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#EC4899] flex items-center gap-1.5">
                <Heart size={14} className="text-[#EC4899]" /> Active Prayer Wall
              </h3>
              <button 
                onClick={() => navigate('/app/prayer-wall')}
                className="text-[11px] text-[#EC4899] font-bold hover:underline"
              >
                Go to Prayer Wall →
              </button>
            </div>

            <div className="space-y-2.5">
              {prayers.length > 0 ? (
                prayers.map((prayer) => {
                  const isSupported = prayerSupports[prayer._id];
                  return (
                    <div key={prayer._id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 bg-[#EC4899]/10 text-[#EC4899] border border-[#EC4899]/20 rounded text-[9px] font-bold uppercase tracking-wide">
                          {prayer.category || "Faith"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          by {prayer.is_anonymous ? 'Anonymous' : (prayer.user_name || 'Family Member')}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-white mb-1 leading-snug">{prayer.title}</h4>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mb-3">"{prayer.content}"</p>
                      <div className="flex items-center justify-between border-t border-white/[0.03] pt-2.5">
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          🙏 {prayer.pray_count + (isSupported ? 1 : 0)} prayers offered
                        </span>
                        <button
                          onClick={() => handleSupportPrayer(prayer._id)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 border ${
                            isSupported 
                              ? 'bg-[#EC4899]/20 border-[#EC4899]/30 text-[#EC4899]' 
                              : 'bg-white/5 border-white/10 text-white hover:bg-[#EC4899]/10'
                          }`}
                        >
                          {isSupported ? 'Amen, Lifting! 🙏' : 'Offer Prayer'}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Fallback prayers for gorgeous UI */
                [
                  { id: 'm1', category: 'Healing', title: "Elder's Surgical Recovery", content: "Lifting up my grandmother in Chennai who is undergoing minor heart surgery tomorrow. Praying for the surgeon's steady hands and full recovery.", author: "Brother Daniel" },
                  { id: 'm2', category: 'Guidance', title: "College Career Path Guidance", content: "Graduating from college in Pune next month. Seeking prayers for God's wisdom in choosing a job offer that aligns with His purpose.", author: "Sister Rachel" },
                  { id: 'm3', category: 'Faith', title: "Monsoon Harvest in Kerala", content: "Praying for our agricultural community in Kerala during this monsoon season. May God keep them safe and bless their fields.", author: "Anonymous" }
                ].map((prayer) => {
                  const isSupported = prayerSupports[prayer.id];
                  return (
                    <div key={prayer.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 bg-[#EC4899]/10 text-[#EC4899] border border-[#EC4899]/20 rounded text-[9px] font-bold uppercase tracking-wide">
                          {prayer.category}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          by {prayer.author}
                        </span>
                      </div>
                      <h4 className="text-xs font-extrabold text-white mb-1 leading-snug">{prayer.title}</h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed mb-3">"{prayer.content}"</p>
                      <div className="flex items-center justify-between border-t border-white/[0.03] pt-2.5">
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          🙏 {isSupported ? '18' : '17'} prayers offered
                        </span>
                        <button
                          onClick={() => handleSupportPrayer(prayer.id)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 border ${
                            isSupported 
                              ? 'bg-[#EC4899]/20 border-[#EC4899]/30 text-[#EC4899]' 
                              : 'bg-white/5 border-white/10 text-white hover:bg-[#EC4899]/10'
                          }`}
                        >
                          {isSupported ? 'Amen, Lifting! 🙏' : 'Offer Prayer'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 3: Upcoming Church Gatherings Spotlights */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5">
                <Calendar size={14} className="text-[#38BDF8]" /> Highlighted Community Events
              </h3>
              <button 
                onClick={() => setActiveTab('events')}
                className="text-[11px] text-[#38BDF8] font-bold hover:underline"
              >
                View All Events →
              </button>
            </div>

            <div className="space-y-3">
              {displayEvents.length > 0 ? (
                displayEvents.slice(0, 2).map((event, idx) => (
                  <div 
                    key={event._id} 
                    onClick={() => navigate(`/app/events/${event._id}`)}
                    className="flex gap-4 items-center p-4 rounded-2xl bg-[#111827] border border-white/[0.08] cursor-pointer hover:bg-[#1F2937] hover:border-[#38BDF8]/30 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.15)] group relative"
                  >
                    <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 group-hover:scale-105 transition-transform">
                      <span className="text-[10px] font-black uppercase tracking-widest">{event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short' }) : ''}</span>
                      <span className="text-xl font-black leading-none mt-1">{event.date ? new Date(event.date).getDate() : ''}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate group-hover:text-[#38BDF8] transition-colors">{event.title}</p>
                      <p className="text-[11px] text-[#94A3B8] truncate mt-1 font-medium flex items-center gap-1">
                        <MapPin size={10} className="text-[#38BDF8]" />
                        {event.church_name || event.location}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-[#475569] group-hover:text-[#38BDF8] transition-colors shrink-0" />
                  </div>
                ))
              ) : (
                <div className="p-6 text-center rounded-2xl bg-[#111827] border border-white/[0.08] shadow-[0_4px_15px_rgba(0,0,0,0.15)]">
                  <p className="text-xs text-[#94A3B8] font-medium">No featured events listed at this moment.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── People Section ── */}
      {!loading && (activeTab === 'all' || activeTab === 'users') && displayUsers.length > 0 && (
        <section className="mb-8" data-testid="people-section">
          <div className="flex items-center gap-2 mb-3">
            {isSearching ? <Users size={16} className="text-[#3B82F6]" /> : <TrendingUp size={16} className="text-[#FBBF24]" />}
            <h2 className="text-[15px] font-bold text-white">{isSearching ? 'People' : 'Trending Believers'}</h2>
          </div>
          {activeTab === 'users' ? (
            /* List view for People tab */
            <div className="space-y-3">
              {displayUsers.map((u, i) => (
                <motion.div key={u._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 p-4 rounded-3xl bg-[#111827] border border-white/[0.08] hover:bg-[#1F2937] hover:border-[#38BDF8]/30 transition-all cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.15)] group"
                  data-testid="user-result-card"
                  onClick={() => navigate(`/app/profile/${u._id}`)}>
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 border-white/[0.1] shadow-inner group-hover:scale-105 transition-transform"
                    style={!u.profile_image ? { background: GRADIENTS[i % GRADIENTS.length] } : {}}>
                    {u.profile_image
                      ? <img src={u.profile_image} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">{u.name?.charAt(0)}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-black text-white truncate group-hover:text-[#38BDF8] transition-colors">{u.name}</p>
                      {u.is_verified && u.role === 'admin' ? (
                        <Crown size={14} strokeWidth={2.5} className="shrink-0" style={{ color: '#FFFBEB', fill: '#F59E0B' }} data-testid="admin-crown-badge" />
                      ) : u.is_verified ? (
                        <ShieldCheck size={14} strokeWidth={2.5} className="shrink-0 drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]" style={{ color: 'white', fill: '#3B82F6' }} data-testid="verified-badge" />
                      ) : null}
                    </div>
                    <p className="text-[11px] text-[#94A3B8] font-medium truncate mt-0.5">@{u.username}{u.bio ? ` · ${u.bio}` : ''}</p>
                    <p className="text-[10px] text-[#475569] font-bold mt-1 uppercase tracking-wider">{u.followers_count || 0} followers · {u.role}</p>
                  </div>
                  {u._id !== user?._id && (
                    <button onClick={(e) => { e.stopPropagation(); handleFollowUser(u._id); }}
                      className="px-4 py-2 bg-[#7C3AED]/15 border border-[#7C3AED]/30 rounded-xl text-xs font-bold text-[#7C3AED] hover:bg-[#7C3AED]/25 hover:shadow-[0_4px_15px_rgba(124,58,237,0.2)] transition-all shrink-0 shadow-sm"
                      data-testid="follow-user-btn">
                      <UserPlus size={14} className="inline mr-1" />Follow
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            /* Carousel view for All tab */
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
              {displayUsers.map((u, i) => (
                <motion.div key={u._id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/app/profile/${u._id}`)}
                  className="flex-shrink-0 w-[140px] snap-start cursor-pointer group" data-testid="trending-user-card">
                  <div className="relative rounded-3xl overflow-hidden h-[180px] border border-white/[0.08] group-hover:border-[#7C3AED]/40 hover:shadow-[0_8px_25px_rgba(124,58,237,0.2)] transition-all">
                    <div className="absolute inset-0" style={{ background: GRADIENTS[i % GRADIENTS.length] }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    {u.profile_image && (
                      <img src={u.profile_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
                    )}
                    <div className="absolute bottom-0 inset-x-0 p-4">
                      <div className="w-10 h-10 rounded-xl mb-2 overflow-hidden border-2 border-white/20 shadow-inner group-hover:border-[#7C3AED]/60 transition-colors"
                        style={!u.profile_image ? { background: GRADIENTS[i % GRADIENTS.length] } : {}}>
                        {u.profile_image
                          ? <img src={u.profile_image} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{u.name?.charAt(0)}</div>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-black text-white truncate drop-shadow-md">{u.name}</p>
                        {u.is_verified && u.role === 'admin' ? (
                          <Crown size={12} strokeWidth={2.5} className="shrink-0 drop-shadow-md" style={{ color: '#FFFBEB', fill: '#F59E0B' }} />
                        ) : u.is_verified ? (
                          <ShieldCheck size={12} strokeWidth={2.5} className="shrink-0 drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]" style={{ color: 'white', fill: '#3B82F6' }} />
                        ) : null}
                      </div>
                      <p className="text-[10px] text-slate-300 font-bold tracking-wide">{u.followers_count || 0} followers</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Posts Section ── */}
      {!loading && (activeTab === 'all' || activeTab === 'posts') && displayPosts.length > 0 && (
        <section className="mb-8" data-testid="posts-section">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={16} className="text-[#EC4899]" />
            <h2 className="text-[15px] font-bold text-white">{isSearching ? 'Posts' : 'Latest Posts'}</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {displayPosts.map((post, i) => (
              <motion.div key={post._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate('/app/feed')}
                className="relative rounded-2xl overflow-hidden cursor-pointer group aspect-[3/4] border border-white/[0.06] group-hover:border-white/[0.15]"
                data-testid="post-preview-card">
                {post.image_url ? (
                  <>
                    <img src={post.image_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </>
                ) : post.video_url && post.thumbnail_url ? (
                  <>
                    <img src={post.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-2 right-2 z-10"><Film size={14} className="text-white/70" /></div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0" style={{ background: GRADIENTS[i % GRADIENTS.length] }} />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-0 p-4 flex items-center">
                      <p className="text-[13px] text-white/90 leading-[1.4] line-clamp-5">{post.content_text}</p>
                    </div>
                  </>
                )}
                <div className="absolute bottom-0 inset-x-0 p-3 z-10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                      {post.user_image ? <img src={post.user_image} alt="" className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-white font-bold">{post.user_name?.charAt(0)}</div>}
                    </div>
                    <span className="text-[11px] font-semibold text-white truncate">{post.user_name}</span>
                    {post.user_is_verified && post.user_role === 'admin' ? (
                      <Crown size={11} strokeWidth={2.5} className="shrink-0" style={{ color: '#FFFBEB', fill: '#F59E0B' }} />
                    ) : post.user_is_verified ? (
                      <ShieldCheck size={11} strokeWidth={2.5} className="shrink-0" style={{ color: 'white', fill: '#3B82F6' }} />
                    ) : null}
                  </div>
                  {post.image_url && post.content_text && (
                    <p className="text-[10px] text-white/70 line-clamp-2 leading-[1.3]">{post.content_text}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-0.5"><Heart size={10} fill="#EC4899" className="text-[#EC4899]" /><span className="text-[10px] text-white/60">{post.likes_count || 0}</span></span>
                    {(post.comments_count > 0) && <span className="text-[10px] text-white/40">{post.comments_count} comments</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Churches Section ── */}
      {!loading && (activeTab === 'all' || activeTab === 'churches') && displayChurches.length > 0 && (
        <section className="mb-8" data-testid="churches-section">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-[#10B981]" />
            <h2 className="text-[15px] font-bold text-white">{isSearching ? 'Churches' : 'Discover Churches'}</h2>
          </div>
          {activeTab === 'churches' ? (
            /* List view for Churches tab */
            <div className="space-y-2">
              {displayChurches.map((church, i) => (
                <motion.div key={church._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/app/churches/${church._id}`)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all cursor-pointer"
                  data-testid="church-result-card">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/[0.1]"
                    style={!church.cover_image ? { background: GRADIENTS[i % GRADIENTS.length] } : {}}>
                    {church.cover_image
                      ? <img src={church.cover_image} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">{church.name?.charAt(0)}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white truncate">{church.name}</p>
                      {church.status === 'verified' && <ShieldCheck size={14} strokeWidth={2.5} className="shrink-0" style={{ color: 'white', fill: '#3B82F6' }} data-testid="verified-badge" />}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#64748B]">
                      <MapPin size={10} /><span className="truncate">{church.city ? `${church.city}, ` : ''}{church.state || church.location}</span>
                    </div>
                    <p className="text-[10px] text-[#475569] mt-0.5">{church.followers_count || 0} members</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Carousel for All tab */
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
              {displayChurches.map((church, i) => (
                <motion.div key={church._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => navigate(`/app/churches/${church._id}`)}
                  className="flex-shrink-0 w-[220px] snap-start rounded-2xl overflow-hidden cursor-pointer group border border-white/[0.06]"
                  data-testid="church-preview-card">
                  <div className="relative h-[130px]">
                    {church.cover_image ? (
                      <img src={church.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full" style={{ background: GRADIENTS[i % GRADIENTS.length] }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent" />
                  </div>
                  <div className="p-3 bg-white/[0.03]">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold text-white truncate">{church.name}</p>
                      {church.status === 'verified' && <ShieldCheck size={12} strokeWidth={2.5} className="shrink-0" style={{ color: 'white', fill: '#3B82F6' }} />}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={10} className="text-[#64748B]" />
                      <span className="text-[10px] text-[#64748B] truncate">{church.location}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Users size={10} className="text-[#64748B]" />
                      <span className="text-[10px] text-[#64748B]">{church.followers_count || 0} members</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Events Section ── */}
      {!loading && (activeTab === 'all' || activeTab === 'events') && displayEvents.length > 0 && (
        <section className="mb-8" data-testid="events-section">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-[#38BDF8]" />
            <h2 className="text-[15px] font-bold text-white">{isSearching ? 'Events' : 'Upcoming Events'}</h2>
          </div>
          <div className="space-y-3">
            {displayEvents.map((event, i) => (
              <motion.div key={event._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/app/events/${event._id}`)}
                className="flex gap-4 items-center p-4 rounded-3xl bg-[#111827] border border-white/[0.08] cursor-pointer hover:bg-[#1F2937] hover:border-[#38BDF8]/30 transition-all group shadow-[0_4px_15px_rgba(0,0,0,0.15)]"
                data-testid="event-preview-card">
                <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20 border border-[#7C3AED]/30 group-hover:scale-105 transition-transform shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)]">
                  <span className="text-[11px] font-black tracking-widest text-[#38BDF8] uppercase">{event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short' }) : ''}</span>
                  <span className="text-2xl font-black text-white leading-none mt-1">{event.date ? new Date(event.date).getDate() : ''}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate group-hover:text-[#38BDF8] transition-colors">{event.title}</p>
                  <p className="text-xs text-[#94A3B8] font-medium truncate mt-1 flex items-center gap-1.5"><MapPin size={10} className="text-[#7C3AED]" />{event.church_name || event.location}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-[#94A3B8] font-bold flex items-center gap-1.5 bg-[#1F2937] px-2 py-0.5 rounded-md border border-white/[0.05]"><Users size={10} className="text-[#38BDF8]" />{event.attendees_count || 0} going</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && isSearching && searchResults && totalResults === 0 && (
        <div className="text-center py-16" data-testid="no-results">
          <Search size={40} className="mx-auto mb-3 text-[#334155]" />
          <p className="text-[#64748B] font-medium text-sm">No results for "{searchQuery.trim()}"</p>
          <p className="text-[#475569] text-xs mt-1">Try different keywords or check the spelling</p>
        </div>
      )}
    </div>
  );
};

export default Explore;
