import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Plus, Search, Award, Sparkles, Send,
  Globe, Lock, BookOpen, HeartHandshake, X, ChevronDown, Check, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { PRAYER_CATEGORIES as CATEGORIES } from '@/lib/constants';




const DAILY_VERSES = [
  {
    verse: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
    reference: "Philippians 4:6",
    reflection: "No matter how big or small your request, God cares for you. Sharing your heart with Him and your brothers and sisters in Christ brings peace that transcends understanding."
  },
  {
    verse: "Therefore confess your sins to each other and pray for each other so that you may be healed. The prayer of a righteous person is powerful and effective.",
    reference: "James 5:16",
    reflection: "Fellowship isn't just about sharing good times; it's about lifting each other's burdens. When we pray together, God moves in extraordinary ways."
  },
  {
    verse: "For where two or three gather in my name, there am I with them.",
    reference: "Matthew 18:20",
    reflection: "We are never alone in our faith. Even online, when we unite our spirits in prayer, Jesus Christ is right here in our midst, coordinating grace."
  },
  {
    verse: "Be joyful in hope, patient in affliction, faithful in prayer.",
    reference: "Romans 12:12",
    reflection: "Prayer is not a last resort, but our first response. Maintain steady faith and support each other through seasons of waiting and transformation."
  }
];

export default function PrayerWall() {
  const { user, setUser } = useAuth();
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Daily verse rotation
  const [dailyVerse, setDailyVerse] = useState(DAILY_VERSES[0]);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Healing');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Expanded comment states (keyed by prayer ID)
  const [expandedComments, setExpandedComments] = useState({});
  const [commentText, setCommentText] = useState({});

  useEffect(() => {
    fetchPrayers();
    // Rotate verse daily/on load randomly
    const idx = Math.floor(Math.random() * DAILY_VERSES.length);
    setDailyVerse(DAILY_VERSES[idx]);
  }, []);

  const fetchPrayers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/prayers');
      setPrayers(data);
    } catch (_) {
      toast.error('Failed to load prayer requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrayer = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Please enter a title and description for your prayer request');
      return;
    }
    setSubmitting(true);

    try {
      const { data } = await api.post('/api/prayers', {
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        is_anonymous: isAnonymous
      });

      toast.success('Prayer request shared! +10 Faith Points!');
      
      // Update local state
      setPrayers(prev => [data, ...prev]);
      
      // Update user points dynamically
      if (data.user_points !== undefined && setUser) {
        setUser(prev => prev ? { ...prev, trivia_points: data.user_points } : prev);
      }

      // Reset form
      setNewTitle('');
      setNewContent('');
      setNewCategory('Healing');
      setIsAnonymous(false);
      setShowCreateModal(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit prayer request');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrayToggle = async (prayerId) => {
    try {
      const { data } = await api.post('/api/prayers/${prayerId}/pray', {});
      
      // Feedback toast
      if (data.is_praying) {
        toast.success('Amen! Thank you for lifting your sibling in prayer! +5 Faith Points!');
      }

      // Update prayers in list
      setPrayers(prev => prev.map(p => {
        if (p._id === prayerId) {
          return {
            ...p,
            praying_count: data.praying_count,
            is_praying: data.is_praying
          };
        }
        return p;
      }));

      // Update user points
      if (data.user_points !== undefined && setUser) {
        setUser(prev => prev ? { ...prev, trivia_points: data.user_points } : prev);
      }
    } catch (_) {
      toast.error('Failed to register your prayer');
    }
  };

  const toggleComments = (prayerId) => {
    setExpandedComments(prev => ({
      ...prev,
      [prayerId]: !prev[prayerId]
    }));
  };

  const handleSendComment = async (prayerId) => {
    const text = commentText[prayerId] || '';
    if (!text.trim()) return;

    try {
      const { data } = await api.post('/api/prayers/${prayerId}/comments', {
        text: text.trim()
      });

      toast.success('Word of encouragement posted!');
      
      // Update comment list in local prayers state
      setPrayers(prev => prev.map(p => {
        if (p._id === prayerId) {
          return { ...p, comments: data };
        }
        return p;
      }));

      // Clear input
      setCommentText(prev => ({
        ...prev,
        [prayerId]: ''
      }));
    } catch (_) {
      toast.error('Failed to post encouragement');
    }
  };

  const filteredPrayers = prayers.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.user_name && p.user_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Calculate high-level stats for active intercessors
  const totalIntercessions = prayers.reduce((acc, p) => acc + (p.praying_count || 0), 0);

  const getPointsLabel = (points) => {
    if (points >= 300) return 'Theology Scholar';
    if (points >= 150) return 'Bible Teacher';
    if (points >= 50) return 'Spiritual Disciple';
    return 'Faith Seeker';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" id="prayer-wall-page">
      {/* ── Page Header & Navigation ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2 tracking-tight">
            <HeartHandshake className="text-[#FB7185]" size={28} />
            Prayer <span className="text-[#FB7185]">Wall</span>
          </h1>
          <p className="text-xs md:text-sm text-[#94A3B8] mt-1 font-medium">
            Lifting one another up in faith, hope, and love. Intercede for fellow believers.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#FB7185] to-[#E11D48] hover:scale-[1.02] active:scale-[0.98] text-white font-black text-sm px-6 py-3 rounded-2xl shadow-[0_4px_15px_rgba(251,113,133,0.3)] hover:shadow-[0_6px_20px_rgba(251,113,133,0.4)] transition-all"
          id="btn-request-prayer"
        >
          <Plus size={18} strokeWidth={2.5} />
          Request Prayer
        </button>
      </div>

      {/* ── Daily Bread Scripture Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 bg-[#111827] border border-[#FB7185]/20 p-5 rounded-3xl relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
        id="daily-devotional-card"
      >
        <div className="absolute right-0 top-0 opacity-10 blur-2xl w-32 h-32 bg-[#FB7185]/30 rounded-full pointer-events-none" />
        <div className="absolute right-3 top-3 opacity-10">
          <BookOpen size={96} className="text-[#FB7185]" />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-[#FB7185] mb-2 relative z-10">
          <Sparkles size={12} />
          Daily Devotional & Scripture
        </div>
        <blockquote className="text-sm md:text-base text-white/95 font-medium leading-relaxed italic pr-8 relative z-10">
          "{dailyVerse.verse}"
        </blockquote>
        <cite className="block text-xs text-[#FB7185] font-bold tracking-wide mt-2 not-italic relative z-10">
          — {dailyVerse.reference}
        </cite>
        <p className="text-xs text-[#64748B] mt-2 border-t border-white/[0.04] pt-2 leading-relaxed">
          {dailyVerse.reflection}
        </p>
      </motion.div>

      {/* ── Community Stat Dashboard ── */}
      <div className="grid grid-cols-3 gap-3 mb-6 bg-[#111827] border border-white/[0.08] p-3.5 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.2)]" id="prayer-stat-dashboard">
        <div className="text-center p-2 border-r border-white/[0.08]">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#64748B] block">Intercessions</span>
          <span className="text-lg font-black text-[#FB7185] block mt-0.5">{totalIntercessions + 84}</span>
          <span className="text-[8px] font-bold text-[#475569] block">Total Prayers Lifted</span>
        </div>
        <div className="text-center p-2 border-r border-white/[0.08]">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#64748B] block">Spiritual Rank</span>
          <span className="text-xs font-black text-white block mt-1 truncate drop-shadow-md">
            {getPointsLabel(user?.trivia_points || 0)}
          </span>
          <span className="text-[8px] font-bold text-[#475569] block">Based on faith points</span>
        </div>
        <div className="text-center p-2">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#64748B] block">Faith Points</span>
          <span className="text-lg font-black text-[#38BDF8] block mt-0.5 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">{user?.trivia_points || 0} XP</span>
          <span className="text-[8px] font-bold text-[#475569] block">Gain from posts & prayers</span>
        </div>
      </div>

      {/* ── Filter / Search Controls ── */}
      <div className="flex flex-col gap-3.5 mb-6" id="prayer-filters-section">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" size={16} />
          <input
            type="text"
            placeholder="Search prayers, scriptures, or names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F172A] border border-white/[0.06] text-white rounded-2xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-amber-400/50 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Categories Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none select-none">
          <button
            onClick={() => setActiveCategory('All')}
            className={`flex-shrink-0 px-5 py-2 rounded-full border text-xs font-black tracking-wide transition-all shadow-sm ${
              activeCategory === 'All'
                ? 'bg-[#FB7185] border-[#FB7185] text-slate-900 shadow-[0_4px_15px_rgba(251,113,133,0.3)]'
                : 'bg-[#111827] border-white/[0.08] text-[#94A3B8] hover:text-white hover:bg-[#1F2937]'
            }`}
          >
            All Requests
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex-shrink-0 px-5 py-2 rounded-full border text-xs font-black tracking-wide transition-all shadow-sm ${
                activeCategory === cat.value
                  ? 'bg-[#FB7185] border-[#FB7185] text-slate-900 shadow-[0_4px_15px_rgba(251,113,133,0.3)]'
                  : 'bg-[#111827] border-white/[0.08] text-[#94A3B8] hover:text-white hover:bg-[#1F2937]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Requests List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-4 border-[#FB7185] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(251,113,133,0.4)]"></div>
          <p className="text-xs text-[#94A3B8] font-black uppercase tracking-widest mt-2">Unveiling Prayer Requests...</p>
        </div>
      ) : filteredPrayers.length === 0 ? (
        <div className="bg-[#111827] border border-white/[0.08] rounded-3xl p-12 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-[#FB7185]/10 flex items-center justify-center text-[#FB7185] border border-[#FB7185]/20 mx-auto mb-4 shadow-inner">
            <HeartHandshake size={28} />
          </div>
          <h3 className="text-base font-black text-white mb-1">No requests found</h3>
          <p className="text-xs text-[#64748B] font-medium max-w-sm mx-auto leading-relaxed">
            {searchQuery 
              ? "We couldn't find any prayer requests matching your terms. Try a different keyword or category."
              : "Be the first to share your prayer request with the family and invite others to stand in faith with you!"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 text-xs font-black uppercase tracking-widest text-[#FB7185] hover:text-[#E11D48] hover:underline transition-colors"
            >
              Share Request Now
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredPrayers.map((prayer) => {
              const isCommentExpanded = !!expandedComments[prayer._id];
              const categoryDetails = CATEGORIES.find(c => c.value === prayer.category) || CATEGORIES[0];
              const authorLetter = prayer.user_name ? prayer.user_name.charAt(0).toUpperCase() : 'A';
              const dateString = prayer.created_at ? new Date(prayer.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Just now';

              return (
                <motion.div
                  key={prayer._id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#111827] border border-white/[0.08] rounded-3xl p-5 hover:border-white/[0.12] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.15)] group relative overflow-hidden"
                  data-testid="prayer-card"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#FB7185]/5 blur-3xl rounded-full pointer-events-none group-hover:bg-[#FB7185]/10 transition-colors" />
                  
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/[0.08] bg-slate-900 flex items-center justify-center font-black text-[#FB7185] shadow-inner group-hover:scale-105 transition-transform">
                        {prayer.user_image ? (
                          <img src={prayer.user_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{authorLetter}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white hover:text-[#FB7185] transition-colors cursor-pointer">
                            {prayer.user_name}
                          </span>
                          {prayer.is_verified && (
                            <span className="text-[#38BDF8] text-[9px] bg-[#38BDF8]/10 px-1.5 py-0.5 rounded-md uppercase font-black tracking-widest flex items-center gap-1" title="Verified Believer">
                              <ShieldCheck size={10} /> Verified
                            </span>
                          )}
                          {prayer.user_username === 'anonymous' && (
                            <Lock size={12} className="text-[#64748B]" title="Private Request" />
                          )}
                        </div>
                        <span className="text-[10px] text-[#94A3B8] font-bold block mt-0.5">{dateString}</span>
                      </div>
                    </div>

                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${categoryDetails.color}`}>
                      {prayer.category}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="mb-4 relative z-10">
                    <h3 className="text-[15px] font-black text-white leading-tight mb-2 group-hover:text-[#FB7185] transition-colors">{prayer.title}</h3>
                    <p className="text-xs text-[#94A3B8] font-medium leading-relaxed whitespace-pre-wrap">{prayer.content}</p>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-4 pt-4 border-t border-white/[0.08] text-xs relative z-10">
                    <button
                      onClick={() => handlePrayToggle(prayer._id)}
                      className={`flex items-center gap-2 font-black transition-all px-4 py-2 rounded-xl border ${
                        prayer.is_praying
                          ? 'bg-[#FB7185]/10 text-[#FB7185] border-[#FB7185]/30 shadow-[inset_0_2px_10px_rgba(251,113,133,0.1)]'
                          : 'text-[#94A3B8] hover:text-[#FB7185] hover:bg-white/[0.02] border-transparent hover:border-white/[0.05]'
                      }`}
                      data-testid="pray-button"
                    >
                      <HeartHandshake size={16} className={prayer.is_praying ? 'fill-[#FB7185] animate-pulse drop-shadow-[0_0_8px_rgba(251,113,133,0.6)]' : ''} />
                      <span>{prayer.is_praying ? 'I Lifted in Prayer' : 'Pray'}</span>
                      {prayer.praying_count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${prayer.is_praying ? 'bg-[#FB7185]/20' : 'bg-white/[0.04]'}`}>
                          {prayer.praying_count}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => toggleComments(prayer._id)}
                      className={`flex items-center gap-1.5 font-bold text-[#64748B] hover:text-white transition-colors px-3 py-1.5 rounded-xl ${
                        isCommentExpanded ? 'bg-white/[0.02] text-white' : ''
                      }`}
                    >
                      <MessageCircle size={15} />
                      <span>Encourage</span>
                      {prayer.comments?.length > 0 && (
                        <span className="text-[10px] bg-white/[0.04] px-1.5 py-0.5 rounded-md font-bold text-slate-400">
                          {prayer.comments.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Comments/Encouragement Section */}
                  <AnimatePresence>
                    {isCommentExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-3 pt-3 border-t border-white/[0.04]"
                      >
                        {/* List of comments */}
                        {prayer.comments && prayer.comments.length > 0 && (
                          <div className="space-y-2.5 mb-3.5 max-h-48 overflow-y-auto pr-1">
                            {prayer.comments.map((comment) => (
                              <div key={comment._id} className="bg-slate-900/40 p-2.5 rounded-2xl border border-white/[0.03]">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-800 border border-white/[0.08] flex items-center justify-center font-black text-amber-400 text-[9px]">
                                    {comment.user_image ? (
                                      <img src={comment.user_image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{comment.user_name?.charAt(0).toUpperCase() || 'A'}</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-black text-white">{comment.user_name}</span>
                                  <span className="text-[8px] text-[#475569]">
                                    {new Date(comment.created_at).toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#94A3B8] leading-normal pl-7">{comment.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Leave a scripture/word */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Share an encouraging word or favorite Scripture verse..."
                            value={commentText[prayer._id] || ''}
                            onChange={(e) => setCommentText({ ...commentText, [prayer._id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendComment(prayer._id);
                            }}
                            className="flex-1 bg-slate-900 border border-white/[0.06] text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400/50 transition-colors"
                          />
                          <button
                            onClick={() => handleSendComment(prayer._id)}
                            disabled={!(commentText[prayer._id] || '').trim()}
                            className="bg-amber-400 hover:bg-amber-500 disabled:opacity-30 disabled:hover:bg-amber-400 text-slate-900 p-2 rounded-xl flex items-center justify-center transition-colors shadow"
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── CREATE PRAYER REQUEST MODAL ── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-950 border border-white/[0.08] w-full max-w-lg rounded-3xl relative overflow-hidden z-10 shadow-2xl p-6"
              id="create-prayer-modal"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-[#64748B] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-lg font-black text-white flex items-center gap-1.5 mb-1">
                <HeartHandshake className="text-amber-400" size={20} />
                Ask for Prayer
              </h2>
              <p className="text-xs text-[#64748B] mb-5">
                Share your request with the community. You can select a focus category and decide to post anonymously.
              </p>

              <form onSubmit={handleCreatePrayer} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] block mb-1.5">
                    Prayer Focus / Brief Title
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g., Praying for family healing or guidance..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#0F172A] border border-white/[0.06] text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-400/50 transition-colors"
                  />
                </div>

                {/* Grid Category & Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] block mb-1.5">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full appearance-none bg-[#0F172A] border border-white/[0.06] text-white rounded-xl pl-4 pr-10 py-2.5 text-xs focus:outline-none focus:border-amber-400/50 transition-colors"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value} className="bg-slate-950">
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    </div>
                  </div>

                  {/* Anonymous Posting */}
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] block mb-1.5">
                      Privacy Option
                    </label>
                    <div
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={`flex items-center justify-between border rounded-xl px-4 py-2 select-none cursor-pointer h-9 transition-colors ${
                        isAnonymous
                          ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                          : 'bg-[#0F172A] border-white/[0.06] text-[#94A3B8]'
                      }`}
                    >
                      <span className="text-xs font-semibold flex items-center gap-1.5">
                        {isAnonymous ? <Lock size={12} /> : <Globe size={12} />}
                        {isAnonymous ? 'Anonymous' : 'Public Profile'}
                      </span>
                      <div className="w-4 h-4 rounded border border-current flex items-center justify-center">
                        {isAnonymous && <Check size={10} strokeWidth={3} />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] block mb-1.5">
                    Your Prayer Request Details
                  </label>
                  <textarea
                    required
                    rows={4}
                    maxLength={1000}
                    placeholder="Share your struggles, thanksgiving, or petitions. Open your heart so brothers and sisters can stand in faith and agreement with you..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-[#0F172A] border border-white/[0.06] text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-400/50 transition-colors resize-none leading-relaxed"
                  />
                  <span className="text-[9px] text-[#475569] block text-right mt-1">
                    {1000 - newContent.length} characters remaining
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-slate-900 font-extrabold text-xs py-3 rounded-2xl transition-all shadow-lg mt-2"
                >
                  {submitting ? 'Sharing Request...' : 'Share Request & Receive Intercession (+10 Pts)'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
