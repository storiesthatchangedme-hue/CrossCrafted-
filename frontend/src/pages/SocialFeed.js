import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '@/lib/api';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  Heart, X, Sparkles, MapPin, Check, MessageSquare, BookOpen, User, Users, Compass, 
  MapPin as ChurchIcon, ArrowRight, Star, Send, ShieldCheck, RefreshCw, HeartHandshake, Smile, Coffee, Feather,
  Award, Church, Sliders, Flame, GraduationCap, ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';


const BadgeIcon = ({ name, size = 11, className }) => {
  switch (name) {
    case 'HeartHandshake': return <HeartHandshake size={size} className={className} />;
    case 'ShieldCheck': return <ShieldCheck size={size} className={className} />;
    case 'Flame': return <Flame size={size} className={className} />;
    case 'BookOpen': return <BookOpen size={size} className={className} />;
    case 'GraduationCap': return <GraduationCap size={size} className={className} />;
    case 'Sparkles': return <Sparkles size={size} className={className} />;
    case 'Users': return <Users size={size} className={className} />;
    default: return <Award size={size} className={className} />;
  }
};

const CommunityBadges = ({ badges, limit = 3 }) => {
  if (!badges || !Array.isArray(badges) || badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {badges.slice(0, limit).map(badge => (
        <div 
          key={badge.id}
          title={badge.description}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all duration-200 cursor-help ${badge.color}`}
        >
          <BadgeIcon name={badge.icon} />
          <span>{badge.name}</span>
        </div>
      ))}
    </div>
  );
};

export default function SocialFeed() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation tab inside Find BFFs page
  // 'discover' (the card swiper) vs 'compatible' (simple matching algorithm) vs 'connections' (matches and who liked me)
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    return (tabParam === 'connections') ? 'connections' : 'discover';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['discover', 'compatible', 'connections'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Compatibility Matching states
  const [compatibleProfiles, setCompatibleProfiles] = useState([]);
  const [loadingCompatible, setLoadingCompatible] = useState(false);
  const [localLikedIds, setLocalLikedIds] = useState([]);

  // Discover state
  const [candidates, setCandidates] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(null); // 'like' or 'pass'
  
  // Connections/Matches State
  const [matches, setMatches] = useState([]);
  const [whoLikedMe, setWhoLikedMe] = useState([]);
  const [loadingConns, setLoadingConns] = useState(false);

  // Match Celebration Overlay State
  const [matchCelebration, setMatchCelebration] = useState(null); // { other_user, conversation_id }
  const [icebreakerText, setIcebreakerText] = useState('Hey! I see we share some great faith interests. Let\'s grab coffee sometime! ☕');
  const [sendingIcebreaker, setSendingIcebreaker] = useState(false);

  // Safe Intro State for Matrimony mode
  const [safeIntroModal, setSafeIntroModal] = useState(null); // { user_id, name }
  const [safeIntroPrompt, setSafeIntroPrompt] = useState('How can I lift you up in prayer this week? 🙏');
  const [safeIntroAnswer, setSafeIntroAnswer] = useState('');
  const [sendingSafeIntro, setSendingSafeIntro] = useState(false);

  // Match Mode state ('bff' or 'matrimony')
  const [matchMode, setMatchMode] = useState('bff');

  // Quick edit profile inside Discover state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showDeepReport, setShowDeepReport] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    age: user?.age || 26,
    gender: user?.gender || 'Male',
    denomination: user?.denomination || 'Non-denominational',
    home_church: user?.home_church || 'Grace Bible Church',
    favorite_verse: user?.favorite_verse || 'Proverbs 27:17 - "Iron sharpens iron, and one man sharpens another."',
    interests: user?.interests || ['Bible Study', 'Coffee Chat', 'Worship'],
    friendship_goals: user?.friendship_goals || 'Looking for a prayer partner & fellow believer.',
    bio: user?.bio || 'Faith-first, community-driven.',
    match_mode: user?.match_mode || 'both',
    marital_status: user?.marital_status || 'Never Married',
    family_values: user?.family_values || 'Traditional',
    marriage_timeline: user?.marriage_timeline || 'Within 1-2 years',
    spouse_expectations: user?.spouse_expectations || 'Seeking a loving partner to build a Christ-centered household.'
  });

  // Motion values for swiping/dragging
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 150], [-15, 15]);
  const yesOpacity = useTransform(x, [0, 80], [0, 1]);
  const noOpacity = useTransform(x, [-80, 0], [1, 0]);

  // Reset motion value when candidate changes
  useEffect(() => {
    x.set(0);
  }, [currentIndex, x]);

  const [aiMatchDetails, setAiMatchDetails] = useState(null);
  const [loadingAiMatch, setLoadingAiMatch] = useState(false);

  // Automatically fetch AI match compatibility for the active card
  useEffect(() => {
    if (activeTab === 'discover' && candidates && candidates.length > 0 && currentIndex < candidates.length) {
      const candidate = candidates[currentIndex];
      const fetchAiMatch = async () => {
        setLoadingAiMatch(true);
        setAiMatchDetails(null);
        try {
          const { data } = await api.get('/api/bff/ai-match?target_id=${candidate._id}');
          setAiMatchDetails(data);
        } catch (e) {
          console.error('Error fetching AI match info:', e);
        } finally {
          setLoadingAiMatch(false);
        }
      };
      fetchAiMatch();
    } else {
      setAiMatchDetails(null);
    }
  }, [currentIndex, candidates, activeTab]);

  // Fetch candidates to swipe on
  const fetchCandidates = async (currentMode = matchMode) => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/bff/discover?mode=${currentMode}');
      setCandidates(data.candidates || []);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Error fetching BFF candidates:', err);
      toast.error('Failed to load potential candidates.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch matches & likes
  const fetchConnections = async () => {
    try {
      setLoadingConns(true);
      const { data } = await api.get('/api/bff/connections');
      setMatches(data.matches || []);
      setWhoLikedMe(data.whoLikedMe || []);
    } catch (err) {
      console.error('Error fetching BFF connections:', err);
    } finally {
      setLoadingConns(false);
    }
  };

  // Fetch compatible profiles based on shared interests or location
  const fetchCompatibleProfiles = async (currentMode = matchMode) => {
    setLoadingCompatible(true);
    try {
      const { data } = await api.get('/api/bff/compatible?mode=${currentMode}');
      setCompatibleProfiles(data.compatible_profiles || []);
    } catch (err) {
      console.error('Error fetching compatible profiles:', err);
      toast.error('Failed to load compatible matches.');
    } finally {
      setLoadingCompatible(false);
    }
  };

  const getBffSwipedLikedIds = () => {
    return [...localLikedIds];
  };

  const handleCompatibleConnect = async (targetId, targetName) => {
    try {
      setLocalLikedIds(prev => [...prev, targetId]);
      
      const { data } = await api.post(
        '/api/bff/swipe',
        { target_id: targetId, action: 'like' }
      );

      if (data.matched) {
        setMatchCelebration({
          other_user: {
            _id: targetId,
            name: targetName,
            profile_image: compatibleProfiles.find(p => p._id === targetId)?.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80'
          },
          conversation_id: data.conversation_id
        });
        toast.success(`You connected with ${targetName}! 🎉`);
        fetchConnections();
      } else {
        toast.success('Connection request sent! 🙏');
      }
    } catch (err) {
      console.error('Error connecting with compatible user:', err);
      toast.error('Could not send connection request.');
    }
  };

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchCandidates(matchMode);
    }
    fetchConnections();
    if (activeTab === 'compatible') {
      fetchCompatibleProfiles(matchMode);
    }
  }, [activeTab, matchMode]);

  // Handle Swipe action (like/pass)
  const handleSwipe = async (action, targetId) => {
    if (swiping) return;
    setSwiping(action);

    try {
      // Optimistic transition
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSwiping(null);
      }, 400);

      const { data } = await api.post(
        '/api/bff/swipe',
        { target_id: targetId, action }
      );

      if (data.matched) {
        setMatchCelebration({
          other_user: data.other_user,
          conversation_id: data.conversation_id
        });
        toast.success(`You connected with ${data.other_user?.name}! 🎉`);
        fetchConnections();
      } else {
        if (action === 'like') {
          toast.info('Connection request sent! 🙏');
        }
      }
    } catch (err) {
      console.error('Error recording swipe:', err);
      toast.error('Connection failed. Please try again.');
      setSwiping(null);
    }
  };

  // Keyboard controls for swiping
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab !== 'discover' || isEditingProfile || matchCelebration) return;
      if (currentIndex >= candidates.length) return;

      const currentCandidate = candidates[currentIndex];
      if (e.key === 'ArrowRight') {
        handleSwipe('like', currentCandidate._id);
      } else if (e.key === 'ArrowLeft') {
        handleSwipe('pass', currentCandidate._id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, currentIndex, candidates, isEditingProfile, matchCelebration]);

  // Handle Match Celebration Icebreaker send
  const sendMatchIcebreaker = async () => {
    if (!matchCelebration) return;
    setSendingIcebreaker(true);
    try {
      await api.post(
        '/api/conversations/${matchCelebration.conversation_id}/messages',
        { text: icebreakerText }
      );
      toast.success('Awesome! Icebreaker sent. 👋');
      navigate(`/app/messages/${matchCelebration.conversation_id}`);
    } catch (err) {
      console.error('Error sending icebreaker:', err);
      toast.error('Could not send message, but you can message them in DMs!');
    } finally {
      setSendingIcebreaker(false);
      setMatchCelebration(null);
    }
  };

  // Safe Intro Chat initialization logic
  const handleStartChat = async (otherUserId, otherUserName) => {
    try {
      // First, see if conversation already exists & has messages
      const { data: convResponse } = await api.get('/api/conversations');
      const existingConvo = convResponse.conversations?.find(c => c.other_user?._id === otherUserId);
      
      if (matchMode === 'matrimony') {
        // If matrimony mode, see if they've had any previous messages. If not, trigger Safe Intro!
        if (!existingConvo || !existingConvo.last_message) {
          setSafeIntroModal({ user_id: otherUserId, name: otherUserName });
          setSafeIntroAnswer('');
          return;
        }
      }
      
      // If BFF mode, or already has messages, navigate directly
      const { data } = await api.post('/api/conversations', { user_id: otherUserId });
      navigate(`/app/messages/${data.conversation_id}`);
    } catch (err) {
      console.error('Error starting chat:', err);
      toast.error('Could not initiate chat.');
    }
  };

  const submitSafeIntro = async () => {
    if (!safeIntroModal || !safeIntroAnswer.trim()) return;
    if (safeIntroAnswer.trim().length < 15) {
      toast.error('Please write a slightly more detailed prayer request or response (at least 15 characters).');
      return;
    }

    setSendingSafeIntro(true);
    try {
      // Create conversation
      const { data: convoData } = await api.post(
        '/api/conversations',
        { user_id: safeIntroModal.user_id }
      );

      const conversationId = convoData.conversation_id;

      // Send Safe Intro as the first message
      const introMessage = `🕊️ [MATRIMONY SAFE INTRO]\nPrompt: "${safeIntroPrompt}"\n\n🙏 Response / Prayer Request:\n"${safeIntroAnswer.trim()}"`;
      
      await api.post(
        '/api/conversations/${conversationId}/messages',
        { text: introMessage }
      );

      toast.success('Safe Intro shared! Faith connection unlocked. 🕊️');
      setSafeIntroModal(null);
      navigate(`/app/messages/${conversationId}`);
    } catch (err) {
      console.error('Error sharing safe intro:', err);
      toast.error('Failed to submit Safe Intro.');
    } finally {
      setSendingSafeIntro(false);
    }
  };

  // Save updated user profile
  const saveBffProfile = async () => {
    try {
      const { data } = await api.put('/api/bff/profile', editedProfile);
      setUser(data.user);
      toast.success('BFF/Matrimony profile updated successfully! 🙏');
      setIsEditingProfile(false);
      // Refresh candidates list
      fetchCandidates(matchMode);
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile attributes.');
    }
  };

  const handleToggleTag = (tag) => {
    const isSelected = editedProfile.interests.includes(tag);
    const newTags = isSelected
      ? editedProfile.interests.filter(t => t !== tag)
      : [...editedProfile.interests, tag];
    setEditedProfile(prev => ({ ...prev, interests: newTags }));
  };

  const availableInterests = [
    'Bible Study', 'Coffee Chat', 'Worship Music', 'Hiking', 'Theology',
    'Community Service', 'Gym & Health', 'Sunday Brunch', 'Youth Group',
    'Mission Trips', 'Fellowship', 'Apologetics', 'Board Games', 'Prayer Partner'
  ];

  const currentCandidate = candidates[currentIndex];

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24 md:pt-6 md:pb-6 relative min-h-[calc(100vh-60px)] flex flex-col">
      {/* ── Match Mode Switcher (BFF vs. Matrimony) ── */}
      <div className="flex bg-[#111827] p-1.5 rounded-[20px] mb-4 border border-white/[0.08] items-center relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED]/10 to-[#38BDF8]/10 pointer-events-none" />
        <button
          onClick={() => setMatchMode('bff')}
          className={`flex-1 py-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-300 relative z-10 ${
            matchMode === 'bff'
              ? 'bg-[#1F2937] text-[#F9FAFB] border border-[#7C3AED]/30 shadow-[0_4px_15px_rgba(124,58,237,0.2)] font-extrabold scale-[1.02]'
              : 'text-[#94A3B8] hover:text-[#F9FAFB]'
          }`}
        >
          <Users size={14} className={matchMode === 'bff' ? 'text-[#7C3AED]' : 'text-[#64748B]'} />
          BFF Mode 🤝
        </button>
        <button
          onClick={() => setMatchMode('matrimony')}
          className={`flex-1 py-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-300 relative z-10 ${
            matchMode === 'matrimony'
              ? 'bg-[#1F2937] text-[#F9FAFB] border border-[#FB7185]/30 shadow-[0_4px_15px_rgba(251,113,133,0.2)] font-extrabold scale-[1.02]'
              : 'text-[#94A3B8] hover:text-[#F9FAFB]'
          }`}
        >
          <Heart size={14} fill={matchMode === 'matrimony' ? 'currentColor' : 'none'} className={matchMode === 'matrimony' ? 'text-[#FB7185]' : 'text-[#64748B]'} />
          Matrimony Mode 💍
        </button>
      </div>

      {/* ── Tabs Header ── */}
      <div className="flex bg-[#111827] p-1.5 rounded-[20px] mb-5 border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <button
          onClick={() => { setActiveTab('discover'); navigate('/app/feed?tab=discover', { replace: true }); }}
          className={`flex-1 py-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 ${
            activeTab === 'discover'
              ? 'bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-white shadow-[0_4px_15px_rgba(124,58,237,0.4)]'
              : 'text-[#94A3B8] hover:text-[#F9FAFB]'
          }`}
          data-testid="tab-discover"
        >
          <Sparkles size={14} />
          Discover
        </button>
        <button
          onClick={() => { setActiveTab('compatible'); navigate('/app/feed?tab=compatible', { replace: true }); }}
          className={`flex-1 py-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 ${
            activeTab === 'compatible'
              ? 'bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-white shadow-[0_4px_15px_rgba(124,58,237,0.4)]'
              : 'text-[#94A3B8] hover:text-[#F9FAFB]'
          }`}
          data-testid="tab-compatible"
        >
          <Award size={14} />
          Top Matches
        </button>
        <button
          onClick={() => { setActiveTab('connections'); navigate('/app/feed?tab=connections', { replace: true }); }}
          className={`flex-1 py-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 relative ${
            activeTab === 'connections'
              ? 'bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-white shadow-[0_4px_15px_rgba(124,58,237,0.4)]'
              : 'text-[#94A3B8] hover:text-[#F9FAFB]'
          }`}
          data-testid="tab-connections"
        >
          <HeartHandshake size={14} />
          Connections
          {whoLikedMe.length > 0 && (
            <span className="absolute top-1.5 right-1 w-4 h-4 rounded-full bg-[#FB7185] text-[9px] font-extrabold text-white flex items-center justify-center animate-bounce shadow-[0_0_10px_rgba(251,113,133,0.5)]">
              {whoLikedMe.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Active Tab Content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'discover' && (
          /* ════════════════ DISCOVER TAB (CARD SWIPER) ════════════════ */
          <motion.div
            key="discover"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col justify-between"
          >
            {/* Complete Profile Notification Bar */}
            {(!user?.denomination || !user?.favorite_verse) && !isEditingProfile && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 p-3 bg-#0284C7/10 border border-#0284C7/20 rounded-2xl flex items-center justify-between gap-3 text-#7DD3FC text-xs"
              >
                <div className="flex items-center gap-2">
                  <Feather size={14} className="shrink-0" />
                  <span>Update your Christian tags so matches find you!</span>
                </div>
                <button 
                  onClick={() => setIsEditingProfile(true)} 
                  className="px-2.5 py-1 bg-#38BDF8 text-slate-900 font-bold rounded-lg hover:bg-#0284C7 transition-colors shrink-0"
                >
                  Edit
                </button>
              </motion.div>
            )}

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-3">
                <RefreshCw className="animate-spin text-#38BDF8" size={32} />
                <p className="text-[#94A3B8] text-sm font-medium">Finding friendly Christian hearts...</p>
              </div>
            ) : isEditingProfile ? (
              /* ── INLINE PROFILE EDITOR ── */
              <div className="bg-[#1E293B] border border-white/[0.04] p-5 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Smile className="text-#38BDF8" size={16} />
                    My BFF Identity Card
                  </h3>
                  <button 
                    onClick={() => setIsEditingProfile(false)}
                    className="text-xs text-[#64748B] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1">Age</label>
                    <input 
                      type="number" 
                      value={editedProfile.age} 
                      onChange={(e) => setEditedProfile(p => ({ ...p, age: e.target.value }))}
                      className="w-full bg-slate-900 border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-#38BDF8"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1">Gender</label>
                    <select 
                      value={editedProfile.gender} 
                      onChange={(e) => setEditedProfile(p => ({ ...p, gender: e.target.value }))}
                      className="w-full bg-slate-900 border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-#38BDF8"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1">My Denomination / Faith Background</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Baptist, Non-denominational, Lutheran"
                    value={editedProfile.denomination} 
                    onChange={(e) => setEditedProfile(p => ({ ...p, denomination: e.target.value }))}
                    className="w-full bg-slate-900 border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-#38BDF8"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1">My Local Church (Home Church)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Hillside Community Church"
                    value={editedProfile.home_church} 
                    onChange={(e) => setEditedProfile(p => ({ ...p, home_church: e.target.value }))}
                    className="w-full bg-slate-900 border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-#38BDF8"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1">Favorite Scripture / Quote</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Proverbs 27:17..."
                    value={editedProfile.favorite_verse} 
                    onChange={(e) => setEditedProfile(p => ({ ...p, favorite_verse: e.target.value }))}
                    className="w-full bg-slate-900 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-#38BDF8"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1.5">Friendship Goals</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Coffee chat, Bible study partner..."
                    value={editedProfile.friendship_goals} 
                    onChange={(e) => setEditedProfile(p => ({ ...p, friendship_goals: e.target.value }))}
                    className="w-full bg-slate-900 border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-#38BDF8"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1.5">My Interests / Spiritual Focus Pill Tags (Select up to 5)</label>
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-2 bg-slate-950 rounded-xl border border-white/[0.04]">
                    {availableInterests.map(interest => {
                      const selected = editedProfile.interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleToggleTag(interest)}
                          className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg transition-all ${
                            selected 
                              ? 'bg-#38BDF8 text-slate-950'
                              : 'bg-white/[0.04] text-[#64748B] hover:text-white'
                          }`}
                        >
                          {selected ? '✓ ' : ''}{interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Matrimony Specific Profile Settings */}
                <div className="border-t border-white/[0.04] pt-4 mt-2 space-y-4">
                  <h4 className="text-xs font-bold text-#38BDF8 uppercase tracking-widest flex items-center gap-1.5">
                    💍 Matrimony & Marriage Settings
                  </h4>
                  
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1">My Matching Intent</label>
                    <select 
                      value={editedProfile.match_mode} 
                      onChange={(e) => setEditedProfile(p => ({ ...p, match_mode: e.target.value }))}
                      className="w-full bg-slate-900 border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-#38BDF8"
                    >
                      <option value="bff">Looking for Friends only (BFF Mode) 🤝</option>
                      <option value="matrimony">Looking for a Lifelong Partner (Matrimony Mode) 💍</option>
                      <option value="both">Open to both Friends & Lifelong Partner (Both Modes) ✨</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1">Marital Status</label>
                      <select 
                        value={editedProfile.marital_status} 
                        onChange={(e) => setEditedProfile(p => ({ ...p, marital_status: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-#38BDF8"
                      >
                        <option value="Never Married">Never Married</option>
                        <option value="Single">Single</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1">Family Values</label>
                      <select 
                        value={editedProfile.family_values} 
                        onChange={(e) => setEditedProfile(p => ({ ...p, family_values: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-#38BDF8"
                      >
                        <option value="Traditional">Traditional</option>
                        <option value="Conservative">Conservative</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Liberal">Liberal</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1">Marriage Timeline</label>
                    <select 
                      value={editedProfile.marriage_timeline} 
                      onChange={(e) => setEditedProfile(p => ({ ...p, marriage_timeline: e.target.value }))}
                      className="w-full bg-slate-900 border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-#38BDF8"
                    >
                      <option value="Within 1 year">Within 1 year</option>
                      <option value="Within 1-2 years">Within 1-2 years</option>
                      <option value="Within 3+ years">Within 3+ years</option>
                      <option value="Just exploring">Just exploring / Wait on God</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#64748B] mb-1">What are you seeking in a spouse?</label>
                    <textarea 
                      rows={2}
                      placeholder="e.g. A dedicated believer who loves serving and values family life..."
                      value={editedProfile.spouse_expectations} 
                      onChange={(e) => setEditedProfile(p => ({ ...p, spouse_expectations: e.target.value }))}
                      className="w-full bg-slate-900 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-#38BDF8"
                    />
                  </div>
                </div>

                <button
                  onClick={saveBffProfile}
                  className="w-full py-3 bg-#38BDF8 hover:bg-#0284C7 text-slate-900 font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all"
                >
                  Save and Discover Matches
                </button>
              </div>
            ) : currentIndex >= candidates.length ? (
              /* ── END OF CARDS ── */
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-#38BDF8/10 border border-#0284C7/25 flex items-center justify-center mb-5 animate-pulse">
                  <Coffee className="text-#38BDF8" size={28} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">You've Discovered Everyone nearby!</h3>
                <p className="text-[#64748B] text-sm max-w-xs mb-6">
                  Check back soon for new brothers and sisters. Take a moment to pray for your future connections today! 🙏
                </p>
                <div className="flex flex-col gap-2.5 w-full">
                  <button
                    onClick={fetchCandidates}
                    className="w-full py-3 bg-#38BDF8 hover:bg-#0284C7 text-slate-900 font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <RefreshCw size={14} />
                    Refresh Feed
                  </button>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="w-full py-3 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.06] font-bold rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <User size={14} />
                    Edit My BFF Tags
                  </button>
                </div>
              </div>
            ) : (
              /* ── SWIPER CARDS DECK ── */
              <div className="flex-1 flex flex-col justify-between">
                
                {/* Active Card Container with Swipe-to-Match Drag UX */}
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.8}
                  style={{ x, rotate, cursor: 'grab' }}
                  whileDrag={{ scale: 1.02 }}
                  onDragEnd={(event, info) => {
                    // If swiped right beyond 130px, register 'like' (Connect)
                    if (info.offset.x > 130) {
                      handleSwipe('like', currentCandidate._id);
                    } 
                    // If swiped left beyond -130px, register 'pass'
                    else if (info.offset.x < -130) {
                      handleSwipe('pass', currentCandidate._id);
                    }
                  }}
                  animate={
                    swiping === 'like'
                      ? { x: 500, opacity: 0, rotate: 30 }
                      : swiping === 'pass'
                      ? { x: -500, opacity: 0, rotate: -30 }
                      : { x: 0, opacity: 1, rotate: 0 }
                  }
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="relative w-full aspect-[3/4.2] rounded-3xl overflow-hidden bg-[#1F2937] border border-white/[0.08] shadow-[0_15px_35px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(124,58,237,0.2)] flex flex-col touch-none select-none active:cursor-grabbing transition-shadow duration-300"
                >
                  {/* Inner card container with vertical scroll for details */}
                  <div className="flex-1 overflow-y-auto scrollbar-thin select-none pointer-events-auto flex flex-col bg-[#1F2937]">
                    {/* Image Area */}
                    <div className="relative aspect-[4/4.5] bg-slate-950 overflow-hidden shrink-0">
                      
                      {/* AMEN Stamp (Drag Right Indicator) */}
                      <motion.div
                        style={{ opacity: yesOpacity }}
                        className="absolute top-24 left-8 z-30 border-[3px] border-emerald-500 text-emerald-500 font-black text-xs uppercase tracking-[0.2em] px-3 py-1 rounded-xl rotate-[-12deg] bg-slate-950/90 shadow-md flex items-center gap-1.5 pointer-events-none"
                      >
                        <Heart size={12} fill="currentColor" />
                        <span>AMEN</span>
                      </motion.div>

                      {/* PASS Stamp (Drag Left Indicator) */}
                      <motion.div
                        style={{ opacity: noOpacity }}
                        className="absolute top-24 right-8 z-30 border-[3px] border-rose-500 text-rose-500 font-black text-xs uppercase tracking-[0.2em] px-3 py-1 rounded-xl rotate-[12deg] bg-slate-950/90 shadow-md flex items-center gap-1.5 pointer-events-none"
                      >
                        <X size={12} strokeWidth={3} />
                        <span>PASS</span>
                      </motion.div>

                      <img 
                        src={currentCandidate.profile_image} 
                        alt={currentCandidate.name} 
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-black/20 pointer-events-none" />

                      {/* Quick Badges (Denomination, Age, Matrimony details) */}
                      <div className="absolute top-4 left-4 flex gap-1.5 flex-wrap z-10 max-w-[85%] pointer-events-none">
                        <span className="px-2 py-0.5 text-[9px] font-black tracking-wide uppercase rounded-md bg-[#7C3AED] text-white flex items-center gap-1 shadow-[0_2px_10px_rgba(124,58,237,0.4)]">
                          ⛪ {currentCandidate.denomination}
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-black/60 backdrop-blur-md text-[#F9FAFB] shadow-md border border-white/10">
                          {currentCandidate.age} y/o • {currentCandidate.gender?.charAt(0)}
                        </span>
                        {matchMode === 'matrimony' && (
                          <>
                            <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-[#10B981] text-white shadow-md flex items-center gap-1">
                              💍 {currentCandidate.marital_status || 'Never Married'}
                            </span>
                            <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-[#FB7185] text-white shadow-md flex items-center gap-1">
                              👨‍👩‍👧 {currentCandidate.family_values || 'Traditional'}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Author Verification & Compatibility Score Badge */}
                      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2 pointer-events-none">
                        {currentCandidate.is_verified && (
                          <span className="w-7 h-7 rounded-full bg-[#2563EB] flex items-center justify-center shadow-[0_2px_10px_rgba(37,99,235,0.4)] border border-white/20" title="Verified Member">
                            <ShieldCheck size={14} className="text-white" />
                          </span>
                        )}

                        {currentCandidate.safe_intro_completed && (
                          <span className="h-7 px-2.5 rounded-full bg-[#10B981] flex items-center justify-center gap-1 shadow-[0_2px_10px_rgba(16,185,129,0.4)] border border-white/20 select-none" title="Completed Safe Intro Prayer Requirement">
                            <Check size={12} className="text-white font-extrabold stroke-[3.5px]" />
                            <span className="text-[9px] font-black tracking-wider text-white uppercase">Safe Intro</span>
                          </span>
                        )}
                        
                        <div 
                          data-testid={`match-score-${currentCandidate._id}`}
                          className={`px-3 py-1.5 rounded-2xl border flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all duration-300 ${
                            (aiMatchDetails?.match_score || currentCandidate.match_score || 85) >= 85
                              ? 'bg-[#7C3AED]/25 border-[#7C3AED]/40 text-white font-extrabold shadow-[0_4px_15px_rgba(124,58,237,0.2)]'
                              : 'bg-black/60 border-white/10 text-white font-bold'
                          }`}
                        >
                          <Sparkles size={11} className={(aiMatchDetails?.match_score || currentCandidate.match_score || 85) >= 85 ? "animate-pulse text-[#38BDF8]" : "text-[#94A3B8]"} />
                          <span className="text-[10px] tracking-wider uppercase font-black">{(aiMatchDetails?.match_score || currentCandidate.match_score || 85)}% Match</span>
                        </div>
                      </div>

                      {/* Bottom overlay containing main text */}
                      <div className="absolute inset-x-0 bottom-0 p-5 pt-20 z-10 pointer-events-none">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-bold text-white flex items-baseline gap-1.5">
                              {currentCandidate.name}
                              <span className="text-xs font-normal text-[#94A3B8]">@{currentCandidate.username}</span>
                            </h2>
                            {/* Live Online Indicator */}
                            <span className="flex items-center gap-1 bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest select-none shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                              Active
                            </span>
                          </div>
                          
                          {/* Trust & Safety: Report/Block Button */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toast('Safety Center: Report or block functionality available in beta.', { icon: '🛡️' });
                            }}
                            className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-rose-400 hover:bg-black/60 transition-colors pointer-events-auto backdrop-blur-md"
                            title="Report or Block User"
                          >
                            <ShieldAlert size={14} />
                          </button>
                        </div>

                        {/* Location and Distance */}
                        <p className="text-xs text-[#CBD5E1] mt-2 flex items-center gap-1.5 font-medium">
                          <MapPin size={12} className="text-[#38BDF8]" />
                          <span>{currentCandidate.city || 'Bengaluru'}, {currentCandidate.state || 'Karnataka'}</span>
                          <span className="text-[10px] text-[#475569] font-black">•</span>
                          <span className="text-[9px] uppercase tracking-wider text-[#38BDF8] font-bold bg-[#38BDF8]/10 px-1.5 py-0.5 rounded-md border border-[#38BDF8]/20">
                            {user?.city?.toLowerCase() === currentCandidate.city?.toLowerCase() ? 'Local • 2.4 km' : '15 km away'}
                          </span>
                        </p>

                        {currentCandidate.home_church && (
                          <p className="text-xs text-[#7C3AED] font-bold flex items-center gap-1.5 mt-1.5">
                            <ChurchIcon size={12} />
                            {currentCandidate.home_church}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Secondary details scroll area */}
                    <div className="bg-[#111827] p-5 space-y-4 flex-1">
                      {/* Bio text block */}
                      <div className="bg-[#0B1120]/80 p-3 rounded-2xl border border-white/[0.03] text-xs text-slate-200 leading-relaxed italic">
                        "{currentCandidate.bio}"
                      </div>

                      {/* ✨ DYNAMIC AI MATCH EXPLANATION BOX */}
                      <div className="relative bg-gradient-to-r from-[#7C3AED]/5 to-[#2563EB]/5 rounded-2xl border border-[#7C3AED]/20 p-4 shadow-sm overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#7C3AED]/10 rounded-full blur-xl pointer-events-none" />
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles size={14} className="text-[#7C3AED] animate-pulse" />
                          <span className="text-[10px] font-black tracking-wider text-[#94A3B8] uppercase">AI Fellowship Alignment</span>
                        </div>
                        {loadingAiMatch ? (
                          <div className="space-y-2 py-1 animate-pulse">
                            <div className="h-3 bg-white/[0.04] rounded-full w-full" />
                            <div className="h-3 bg-white/[0.04] rounded-full w-[85%]" />
                          </div>
                        ) : aiMatchDetails ? (
                          <div className="space-y-3">
                            <p className="text-[11px] text-slate-200 leading-relaxed font-medium">
                              {aiMatchDetails.match_explanation}
                            </p>
                            <button
                              onClick={() => setShowDeepReport(true)}
                              className="px-3 py-1.5 bg-[#7C3AED]/15 hover:bg-[#7C3AED]/25 text-white border border-[#7C3AED]/30 text-[10px] font-extrabold rounded-lg uppercase tracking-wider flex items-center gap-1 transition-all shadow-[0_0_15px_rgba(124,58,237,0.1)] pointer-events-auto"
                            >
                              <Sparkles size={10} />
                              Deep Compatibility Report
                            </button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            We think you'll connect because you both enjoy Bible study, worship, and are looking for real direct fellowship.
                          </p>
                        )}
                      </div>

                      {/* Favorite Scripture block */}
                      {currentCandidate.favorite_verse && (
                        <div className="bg-[#1F2937] p-4 rounded-2xl border border-[#38BDF8]/20 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 text-[#111827] font-serif font-black text-6xl pointer-events-none opacity-50 select-none -mr-1 -mt-2">“</div>
                          <span className="text-[9px] uppercase tracking-wider font-black text-[#38BDF8] block mb-1">Favorite Scripture</span>
                          <p className="text-xs italic text-[#F9FAFB] leading-relaxed font-serif relative z-10 pr-4">
                            {currentCandidate.favorite_verse}
                          </p>
                        </div>
                      )}

                      {/* Community Badges */}
                      {currentCandidate.badges && currentCandidate.badges.length > 0 && (
                        <div>
                          <span className="text-[9px] uppercase tracking-wider font-black text-slate-400 block mb-1">Community Trust Badges</span>
                          <CommunityBadges badges={currentCandidate.badges} />
                        </div>
                      )}

                      {/* Mutual Interests */}
                      {(() => {
                        const commonInterests = currentCandidate.interests?.filter(i => user?.interests?.includes(i)) || [];
                        return (
                          <div className="space-y-1.5">
                            <span className="text-[9px] uppercase tracking-wider font-black text-slate-400 block">Interests & Hobbies</span>
                            <div className="flex flex-wrap gap-1.5">
                              {currentCandidate.interests?.map(interest => {
                                const isShared = user?.interests?.includes(interest);
                                return (
                                  <span 
                                    key={interest} 
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                                      isShared
                                        ? 'bg-#38BDF8/15 border border-#38BDF8/30 text-#7DD3FC shadow-sm shadow-#38BDF8/5'
                                        : 'bg-white/[0.03] border border-white/[0.05] text-[#94A3B8]'
                                    }`}
                                  >
                                    {isShared && <Sparkles size={8} className="text-#38BDF8" />}
                                    #{interest.replace(/\s+/g, '')}
                                    {isShared && <span className="text-[8px] opacity-75 font-normal">(Shared)</span>}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Fellowship Goals / Expectations */}
                      <div className="pt-2 border-t border-white/[0.04]">
                        {matchMode === 'matrimony' ? (
                          currentCandidate.spouse_expectations && (
                            <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/10 text-xs text-purple-300">
                              <span className="font-extrabold uppercase text-[9px] tracking-wider block text-purple-400 mb-1">Seeking Spouse Expectations</span>
                              "{currentCandidate.spouse_expectations}"
                            </div>
                          )
                        ) : (
                          currentCandidate.friendship_goals && (
                            <div className="p-3 bg-#38BDF8/5 rounded-xl border border-#38BDF8/10 text-xs text-#7DD3FC">
                              <span className="font-extrabold uppercase text-[9px] tracking-wider block text-#38BDF8 mb-1">Fellowship & Friendship Goals</span>
                              "{currentCandidate.friendship_goals}"
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Keyboard guide & Action Swiper Buttons */}
                <div className="mt-5 flex flex-col items-center gap-4 pb-2">
                  <div className="flex items-center gap-6 justify-center">
                    {/* Pass Button */}
                    <button
                      onClick={() => handleSwipe('pass', currentCandidate._id)}
                      disabled={!!swiping}
                      className="w-16 h-16 rounded-full flex items-center justify-center bg-[#1F2937] border border-white/[0.08] text-rose-400 hover:text-rose-300 hover:bg-[#111827] hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:border-rose-500/30 group"
                      title="Pass (Arrow Left)"
                    >
                      <X size={26} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform duration-300" />
                    </button>

                    {/* Edit BFF profile mid shortcut */}
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="w-12 h-12 rounded-full flex items-center justify-center bg-[#1F2937] border border-white/[0.05] text-[#94A3B8] hover:text-[#7C3AED] hover:border-[#7C3AED]/40 hover:bg-[#111827] hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] transition-all duration-300"
                      title="Edit My Profile"
                    >
                      <Sliders size={18} />
                    </button>

                    {/* Connect Button */}
                    <button
                      onClick={() => handleSwipe('like', currentCandidate._id)}
                      disabled={!!swiping}
                      className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#7C3AED] to-[#2563EB] text-white hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_8px_25px_rgba(124,58,237,0.35)] hover:shadow-[0_12px_35px_rgba(124,58,237,0.5)] group relative overflow-hidden border border-white/10"
                      title="Connect (Arrow Right)"
                    >
                      {/* Ripple effect */}
                      <span className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
                      <Heart size={26} strokeWidth={2.5} fill="currentColor" className="group-hover:scale-110 transition-transform duration-300" />
                    </button>
                  </div>
                  
                  <span className="text-[10px] text-[#64748B] font-bold tracking-widest uppercase hidden md:inline-block">
                    Tip: Use Left Arrow (Pass) & Right Arrow (Connect) keys!
                  </span>
                </div>

              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'compatible' && (
          /* ════════════════ COMPATIBILITY MATCHES TAB ════════════════ */
          <motion.div
            key="compatible"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col gap-4"
          >
            {/* Explainer Hero card */}
            <div className="bg-[#111827] border border-white/[0.08] p-6 rounded-3xl relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20 rounded-full blur-2xl -mr-8 -mt-8" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 bg-gradient-to-br from-[#7C3AED]/15 to-[#2563EB]/15 rounded-2xl text-[#38BDF8] shrink-0 border border-[#7C3AED]/20">
                  <Award size={20} />
                </div>
                <div>
                  <h2 className="text-white font-black tracking-wide text-sm">Faith Compatibility Matcher</h2>
                  <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                    Our simple alignment algorithm identifies fellowship partners by matching overlapping spiritual interests, location proximity, denominational ties, and local churches.
                  </p>
                </div>
              </div>

              {/* My Profile Quick Stats */}
              <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-[#64748B] font-bold flex items-center gap-1.5 bg-[#1F2937] px-2.5 py-1 rounded-xl">
                  <MapPin size={11} className="text-[#38BDF8]" />
                  <span>Loc: <strong className="text-[#F9FAFB]">{user?.city || 'Bengaluru'}, {user?.state || 'Karnataka'}</strong></span>
                </div>
                <div className="text-[11px] text-[#64748B] font-bold flex items-center gap-1.5 bg-[#1F2937] px-2.5 py-1 rounded-xl">
                  <Church size={11} className="text-[#7C3AED]" />
                  <span>Denom: <strong className="text-[#F9FAFB]">{user?.denomination || 'Non-denominational'}</strong></span>
                </div>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#94A3B8] hover:text-white rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5"
                >
                  <Sliders size={12} />
                  Adjust Profile Tags
                </button>
              </div>
            </div>

            {/* List of Compatible Matches */}
            {loadingCompatible ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw size={24} className="text-[#7C3AED] animate-spin" />
                <p className="text-xs text-[#94A3B8] font-bold">Running compatibility algorithms...</p>
              </div>
            ) : compatibleProfiles.length === 0 ? (
              <div className="p-10 text-center bg-[#111827] rounded-3xl border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center">
                <Smile size={36} className="text-[#38BDF8] mb-4 opacity-50" />
                <p className="text-sm text-white font-black">Ready to find matches?</p>
                <p className="text-xs text-[#94A3B8] max-w-xs mt-2 leading-relaxed">
                  Adjust your profile preferences or interests to discover like-minded believers in your state or city.
                </p>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="mt-5 px-5 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white font-bold rounded-xl text-xs shadow-[0_4px_15px_rgba(124,58,237,0.3)] hover:scale-105 transition-all"
                >
                  Configure My Interests
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {compatibleProfiles.map((profile, idx) => {
                  // Check connection status
                  const isMutual = matches.some(m => m._id === profile._id);
                  const hasLiked = getBffSwipedLikedIds().includes(profile._id);

                  return (
                    <motion.div
                      key={profile._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-[#111827] border border-white/[0.08] rounded-3xl p-5 hover:border-[#7C3AED]/30 hover:bg-[#1F2937] hover:shadow-[0_4px_20px_rgba(124,58,237,0.15)] transition-all flex flex-col gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)] group relative"
                    >
                      {/* Top profile banner */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 bg-slate-950 shadow-inner ${
                            profile.match_score >= 85 ? 'border-[#7C3AED]/40' : 'border-white/[0.08]'
                          }`}>
                            <img src={profile.profile_image} alt={profile.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-black text-white leading-none">{profile.name}</h3>
                              <span className="text-[10px] text-[#38BDF8] font-extrabold px-1.5 py-0.5 rounded-md bg-[#38BDF8]/10 leading-none border border-[#38BDF8]/20">{profile.age} · {profile.gender?.charAt(0)}</span>
                              {profile.is_verified && <ShieldCheck size={14} className="text-[#2563EB] shrink-0 drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]" />}
                              {profile.safe_intro_completed && (
                                <span className="flex items-center gap-1 text-[#10B981] font-extrabold text-[9px] uppercase tracking-wider bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded-md" title="Completed Safe Intro prayer requirement">
                                  <Check size={10} className="stroke-[3]" />
                                  <span>Safe Intro</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#94A3B8] flex items-center gap-1 mt-1.5 font-bold">
                              <MapPin size={11} className="text-[#38BDF8]" />
                              <span>{profile.city}, {profile.state}</span>
                            </div>
                            {matchMode === 'matrimony' && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-md">
                                  💍 {profile.marital_status || 'Never Married'}
                                </span>
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 rounded-md">
                                  👨‍👩‍👧 {profile.family_values || 'Traditional'}
                                </span>
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 rounded-md">
                                  ⏳ {profile.marriage_timeline || 'Within 1-2 years'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Compatibility score ring/badge */}
                        <div className="flex flex-col items-end">
                          <div className={`px-2.5 py-1.5 rounded-2xl border flex items-center gap-1 shadow-sm ${
                            profile.match_score >= 85 
                              ? 'bg-[#7C3AED]/10 border-[#7C3AED]/30 text-[#7C3AED] font-extrabold shadow-[0_2px_10px_rgba(124,58,237,0.15)]' 
                              : 'bg-white/[0.02] border-white/[0.06] text-[#94A3B8] font-bold'
                          }`}>
                            <Sparkles size={11} className={profile.match_score >= 85 ? "animate-pulse" : ""} />
                            <span className="text-xs">{profile.match_score}% Match</span>
                          </div>
                        </div>
                      </div>

                      {/* Bio line */}
                      <p className="text-xs text-[#94A3B8] line-clamp-2 italic leading-relaxed pl-2 border-l-2 border-[#38BDF8]/40">
                        "{profile.bio}"
                      </p>

                      {/* Community Badges */}
                      {profile.badges && profile.badges.length > 0 && (
                        <div className="mt-1">
                          <span className="text-[9px] uppercase tracking-wider font-black text-[#475569] block mb-1">Community Trust Badges</span>
                          <CommunityBadges badges={profile.badges} />
                        </div>
                      )}

                      {/* Matching breakdown reasons list */}
                      <div className="bg-[#1F2937] p-3.5 rounded-2xl border border-white/[0.05] flex flex-col gap-2.5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
                        <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Alignment Breakdown:</span>
                        
                        {profile.match_reasons.map((reason, rIdx) => {
                          const getReasonIcon = (type) => {
                            switch (type) {
                              case 'interests': return <Users size={12} className="text-[#38BDF8]" />;
                              case 'location': return <MapPin size={12} className="text-[#10B981]" />;
                              case 'denomination': return <Church size={12} className="text-[#7C3AED]" />;
                              case 'church': return <Compass size={12} className="text-[#FB7185]" />;
                              case 'gender': return <Heart size={12} fill="currentColor" className="text-[#10B981]" />;
                              case 'values': return <Compass size={12} className="text-[#7C3AED]" />;
                              case 'timeline': return <Sparkles size={12} className="text-[#2563EB]" />;
                              default: return <Sparkles size={12} className="text-[#FBBF24]" />;
                            }
                          };

                          return (
                            <div key={rIdx} className="flex items-start gap-2 text-xs">
                              <div className="p-1.5 bg-[#111827] border border-white/[0.05] rounded-lg shrink-0 mt-0.5">
                                {getReasonIcon(reason.type)}
                              </div>
                              <div>
                                <span className="font-bold text-[#F9FAFB] text-[11px] leading-tight block">{reason.label}</span>
                                <span className="text-[10px] text-[#94A3B8] leading-none block mt-0.5">{reason.details} (+{reason.points} pts)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Favorite verse preview if present */}
                      {profile.favorite_verse && (
                        <div className="text-[10px] text-[#94A3B8] flex items-center gap-1.5 italic bg-[#1F2937] p-2.5 rounded-xl border border-white/[0.05]">
                          <BookOpen size={10} className="shrink-0 text-[#38BDF8]" />
                          <span className="truncate">Fav Verse: {profile.favorite_verse}</span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-3 mt-1">
                        <button
                          onClick={() => navigate(`/app/profile/${profile._id}`)}
                          className="flex-1 py-2.5 bg-[#1F2937] hover:bg-[#374151] border border-white/[0.08] text-[#CBD5E1] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                        >
                          View Profile
                        </button>
                        
                        {isMutual ? (
                          <button
                            onClick={() => handleStartChat(profile._id, profile.name)}
                            className="flex-1 py-2.5 bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#7C3AED] hover:bg-[#7C3AED]/25 hover:shadow-[0_4px_15px_rgba(124,58,237,0.2)] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare size={13} />
                            Chat Now
                          </button>
                        ) : hasLiked ? (
                          <button
                            disabled
                            className="flex-1 py-2.5 bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-inner opacity-70"
                          >
                            <Check size={13} />
                            Requested
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCompatibleConnect(profile._id, profile.name)}
                            className="flex-1 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white hover:scale-[1.02] active:scale-[0.98] font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.4)]"
                          >
                            <Heart size={13} fill="currentColor" />
                            Connect BFF

                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'connections' && (
          /* ════════════════ CONNECTIONS TAB ════════════════ */
          <motion.div
            key="connections"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            {loadingConns ? (
              <div className="flex justify-center py-20">
                <RefreshCw className="animate-spin text-#38BDF8" size={24} />
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* ── WHO LIKED ME (SWIPE DIRECTLY TO CONNECT) ── */}
                <div>
                  <h3 className="text-white font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2 text-[#FB7185]">
                    <Star size={14} fill="currentColor" />
                    Who Liked Me ({whoLikedMe.length})
                  </h3>
                  
                  {whoLikedMe.length === 0 ? (
                    <div className="p-6 text-center bg-[#111827] rounded-3xl border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                      <p className="text-[#94A3B8] text-xs font-medium">
                        No pending friend requests. Keep swiping and matching!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {whoLikedMe.map(likedUser => (
                        <div 
                          key={likedUser._id}
                          className="bg-[#111827] border border-white/[0.08] p-4 rounded-3xl flex flex-col items-center text-center relative group shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_25px_rgba(251,113,133,0.15)] transition-all duration-300 hover:border-[#FB7185]/30"
                        >
                          <div className="w-16 h-16 rounded-2xl overflow-hidden mb-3 border-2 border-[#FB7185]/40 shadow-inner">
                            <img src={likedUser.profile_image} alt={likedUser.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <span className="text-xs font-black text-white block w-full flex items-center justify-center gap-1.5 flex-wrap">
                            {likedUser.name}
                            {likedUser.safe_intro_completed && (
                              <Check size={12} className="text-[#10B981] stroke-[3.5] shrink-0" title="Completed Safe Intro" />
                            )}
                          </span>
                          <span className="text-[10px] text-[#94A3B8] font-bold mt-0.5">{likedUser.denomination}</span>
                          
                          {likedUser.badges && likedUser.badges.length > 0 && (
                            <div className="mt-1.5 flex justify-center scale-95 origin-top">
                              <CommunityBadges badges={likedUser.badges} limit={1} />
                            </div>
                          )}
                          
                          {/* Match back button */}
                          <button
                            onClick={() => handleSwipe('like', likedUser._id)}
                            className="mt-4 w-full py-2 bg-[#FB7185]/15 border border-[#FB7185]/30 hover:bg-[#FB7185]/25 text-[#FB7185] font-black rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm"
                          >
                            <Check size={12} strokeWidth={3} />
                            Connect Back
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── MUTUAL MATCHES (CONVERT INTO DMs) ── */}
                <div className="mt-8">
                  <h3 className="text-white font-black text-xs uppercase tracking-widest mb-3 flex items-center gap-2 text-[#7C3AED]">
                    <Users size={14} />
                    My Mutual Matches ({matches.length})
                  </h3>

                  {matches.length === 0 ? (
                    <div className="p-8 text-center bg-[#111827] rounded-3xl border border-white/[0.08] flex flex-col items-center shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                      <p className="text-[#94A3B8] text-sm max-w-xs leading-relaxed font-medium">
                        No active connections yet. Swiping right on people with mutual interests is the best way to grow!
                      </p>
                      <button
                        onClick={() => { setActiveTab('discover'); navigate('/app/feed?tab=discover', { replace: true }); }}
                        className="mt-5 px-5 py-2 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] shadow-[0_4px_15px_rgba(124,58,237,0.3)]"
                      >
                        Start Finding Friends
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {matches.map(match => (
                        <div 
                          key={match._id}
                          className="bg-[#111827] border border-white/[0.08] p-4 rounded-3xl flex items-center justify-between gap-3 hover:bg-[#1F2937] transition-colors shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_25px_rgba(124,58,237,0.15)] group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-slate-950 border border-white/[0.08]">
                              <img src={match.profile_image} alt={match.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-white">{match.name}</span>
                                {match.is_verified && <ShieldCheck size={14} className="text-[#2563EB]" />}
                                {match.safe_intro_completed && (
                                  <span className="flex items-center gap-1 text-[#10B981] font-extrabold text-[8px] uppercase tracking-wider bg-[#10B981]/10 border border-[#10B981]/20 px-1.5 py-0.5 rounded-md" title="Completed Safe Intro prayer requirement">
                                    <Check size={10} className="stroke-[3]" />
                                    <span>Safe Intro</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#94A3B8] line-clamp-1 mt-0.5 font-medium">"{match.bio || 'Connected BFF'}"</p>
                              {match.badges && match.badges.length > 0 && (
                                <div className="mt-1.5">
                                  <CommunityBadges badges={match.badges} limit={2} />
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleStartChat(match._id, match.name)}
                            className="p-3 bg-[#7C3AED]/15 hover:bg-[#7C3AED]/25 border border-[#7C3AED]/30 rounded-xl text-[#7C3AED] transition-colors shadow-sm"
                            title="Message Candidate"
                          >
                            <MessageSquare size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DEEP AI COMPATIBILITY REPORT MODAL ── */}
      <AnimatePresence>
        {showDeepReport && aiMatchDetails && candidates && candidates[currentIndex] && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#1E293B] border border-white/[0.08] max-w-md w-full rounded-3xl p-6 shadow-2xl relative flex flex-col my-8 pointer-events-auto"
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setShowDeepReport(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white flex items-center justify-center transition-colors pointer-events-auto"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4 border-b border-white/[0.06] pb-4">
                <div className="w-11 h-11 rounded-2xl bg-#38BDF8/10 flex items-center justify-center text-#38BDF8 shrink-0">
                  <Sparkles size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5 leading-none">
                    AI Match Compatibility
                    <span className="text-[8px] uppercase tracking-wider font-black bg-#38BDF8 text-slate-950 px-1.5 py-0.5 rounded">Gemini</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Deep alignment report for you & {candidates[currentIndex].name}</p>
                </div>
              </div>

              {/* Score and Quick Bio */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="col-span-1 bg-slate-900/60 p-2.5 rounded-2xl border border-white/[0.04] text-center flex flex-col justify-center">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Alignment</span>
                  <span className="text-xl font-black text-#7DD3FC mt-0.5">{aiMatchDetails.match_score || 85}%</span>
                </div>
                <div className="col-span-2 bg-slate-900/60 p-2.5 rounded-2xl border border-white/[0.04] flex flex-col justify-center">
                  <p className="text-xs font-bold text-white leading-tight">{candidates[currentIndex].name}</p>
                  <p className="text-[10px] text-#38BDF8 font-semibold mt-0.5">⛪ {candidates[currentIndex].home_church || candidates[currentIndex].denomination}</p>
                </div>
              </div>

              {/* Scrollable details */}
              <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin mb-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-#38BDF8">Fellowship Compatibility</span>
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-white/[0.02]">
                    {aiMatchDetails.compatibility_summary || "We think you'll connect because you both are passionate about community service and active participation in local church events."}
                  </p>
                </div>

                {/* Suggested Conversation Starters */}
                {aiMatchDetails.conversation_starters && aiMatchDetails.conversation_starters.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-#38BDF8">Suggested Conversation Starters</span>
                    <div className="space-y-1.5">
                      {aiMatchDetails.conversation_starters.map((starter, index) => (
                        <div 
                          key={index} 
                          onClick={() => {
                            setIcebreakerText(starter);
                            setShowDeepReport(false);
                            toast.info("Conversation starter loaded into connector! 🙏");
                          }}
                          className="text-[11px] text-slate-300 bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-xl hover:bg-#38BDF8/5 hover:border-#38BDF8/20 hover:text-white transition-all cursor-pointer flex items-start gap-2 group pointer-events-auto"
                        >
                          <span className="w-4 h-4 rounded-full bg-#38BDF8/10 text-#38BDF8 text-[9px] font-black flex items-center justify-center shrink-0 group-hover:bg-#38BDF8 group-hover:text-slate-950 transition-colors">
                            {index + 1}
                          </span>
                          <p className="leading-normal flex-1">{starter}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shared Devotional Scripture */}
                {aiMatchDetails.shared_scripture && (
                  <div className="space-y-1 bg-#38BDF8/5 p-3 rounded-xl border border-#38BDF8/10">
                    <span className="text-[9px] uppercase tracking-widest font-black text-#7DD3FC block">Encouraged Scripture for Fellowship</span>
                    <p className="text-xs italic text-slate-200 font-serif leading-relaxed mt-1">
                      "{aiMatchDetails.shared_scripture_text || 'Iron sharpens iron, and one man sharpens another.'}"
                    </p>
                    <span className="text-[9px] font-bold text-#38BDF8 block mt-1.5 text-right">— {aiMatchDetails.shared_scripture}</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <button
                onClick={() => {
                  setShowDeepReport(false);
                  handleSwipe('like', candidates[currentIndex]._id);
                }}
                className="w-full py-2.5 bg-#38BDF8 hover:bg-#0284C7 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-1.5 pointer-events-auto"
              >
                <Heart size={14} fill="currentColor" />
                Connect in Fellowship
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MUTUAL CONNECTION CELEBRATION MODAL ── */}
      <AnimatePresence>
        {matchCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1E293B] border border-white/[0.08] max-w-sm w-full rounded-3xl p-6 text-center shadow-2xl relative"
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setMatchCelebration(null)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white flex items-center justify-center transition-colors pointer-events-auto"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Sparkles size={24} className="animate-pulse text-#38BDF8" />
              </div>

              <h2 className="text-lg font-black text-white mb-1">It's a Connection! 🎉</h2>
              <p className="text-xs text-#7DD3FC font-medium mb-4">
                🎉 God may have just introduced you to a new friend.
              </p>

              {/* Connected Avatars */}
              <div className="flex items-center justify-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-#38BDF8 bg-slate-950 shadow-lg shrink-0">
                  <img src={user?.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80'} alt="Me" className="w-full h-full object-cover" />
                </div>
                <div className="w-7 h-7 bg-#38BDF8 rounded-full flex items-center justify-center text-slate-950 font-black shadow-md z-10 -mx-6">
                  <Heart size={14} fill="currentColor" />
                </div>
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-#38BDF8 bg-slate-950 shadow-lg shrink-0">
                  <img src={matchCelebration.other_user?.profile_image} alt="BFF Match" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Mutual Interests Display */}
              {(() => {
                const partnerInterests = matchCelebration.other_user?.interests || [];
                const commonInterests = partnerInterests.filter(i => user?.interests?.includes(i));
                if (commonInterests.length > 0) {
                  return (
                    <div className="mb-4 text-left bg-slate-900/50 p-2.5 rounded-xl border border-white/[0.03]">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Shared Faith & Interests</span>
                      <div className="flex flex-wrap gap-1">
                        {commonInterests.slice(0, 3).map(interest => (
                          <span key={interest} className="px-2 py-0.5 rounded bg-#38BDF8/10 text-#7DD3FC text-[9px] font-bold">
                            #{interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Instant message input */}
              <div className="bg-slate-900 p-3.5 rounded-2xl border border-white/[0.06] mb-5">
                <label className="block text-[10px] text-[#64748B] font-bold uppercase mb-1.5 text-left">Suggested Connection Icebreaker</label>
                <textarea
                  rows={2}
                  value={icebreakerText}
                  onChange={(e) => setIcebreakerText(e.target.value)}
                  className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed pointer-events-auto"
                  placeholder="Type a friendly hello..."
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={sendMatchIcebreaker}
                  disabled={sendingIcebreaker}
                  className="w-full py-2.5 bg-#38BDF8 hover:bg-#0284C7 disabled:bg-[#475569] text-slate-900 font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all pointer-events-auto"
                >
                  <Send size={12} />
                  Send & Chat Now
                </button>
                <button
                  onClick={() => setMatchCelebration(null)}
                  className="w-full py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all pointer-events-auto"
                >
                  Keep Swiping
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SAFE INTRO MODAL ── */}
      <AnimatePresence>
        {safeIntroModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1E293B] border border-white/[0.08] max-w-sm w-full rounded-3xl p-6 shadow-2xl relative flex flex-col text-left"
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setSafeIntroModal(null)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="w-12 h-12 bg-#38BDF8/15 rounded-2xl flex items-center justify-center mb-4 text-#38BDF8">
                <ShieldCheck size={24} />
              </div>

              <h2 className="text-lg font-extrabold text-white mb-1.5 flex items-center gap-1.5">
                🕊️ Safe Intro Required
              </h2>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed mb-4">
                To keep our matrimonial search respectful and focused on lifelong, God-honoring companionship, please select a faith-centered prompt or submit a prayer request to unlock your chat with <span className="text-#38BDF8 font-bold">{safeIntroModal.name}</span>.
              </p>

              {/* Prompt Selection */}
              <div className="space-y-3.5 mb-4">
                <div>
                  <label className="block text-[10px] text-[#64748B] font-bold uppercase tracking-wider mb-1.5">
                    Select a faith-first prompt:
                  </label>
                  <select
                    value={safeIntroPrompt}
                    onChange={(e) => setSafeIntroPrompt(e.target.value)}
                    className="w-full bg-slate-900 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-#38BDF8"
                  >
                    <option value="How can I lift you up in prayer this week? 🙏">"How can I lift you up in prayer this week? 🙏"</option>
                    <option value="What is your testimony or favorite way to serve the community? ⛪">"What is your testimony or favorite way to serve the community? ⛪"</option>
                    <option value="What does building a Christ-centered household look like to you? 💍">"What does building a Christ-centered household look like to you? 💍"</option>
                    <option value="How has God been showing His faithfulness in your life lately? ✨">"How has God been showing His faithfulness in your life lately? ✨"</option>
                    <option value="Custom Prayer Request / Inquiry 📝">"Custom Prayer Request / Inquiry 📝"</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#64748B] font-bold uppercase tracking-wider mb-1.5">
                    Your Response or Prayer Request:
                  </label>
                  <textarea
                    rows={4}
                    value={safeIntroAnswer}
                    onChange={(e) => setSafeIntroAnswer(e.target.value)}
                    className="w-full bg-slate-900 border border-white/[0.06] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-#38BDF8 resize-none leading-relaxed"
                    placeholder="e.g. I would love for us to pray about direction for my career transition, and how I can serve more at my local church..."
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[9px] text-[#64748B]">
                      {safeIntroAnswer.trim().length >= 15 ? (
                        <span className="text-emerald-400 font-semibold">Min length met (at least 15 chars)</span>
                      ) : (
                        <span>Needs {15 - safeIntroAnswer.trim().length} more characters</span>
                      )}
                    </span>
                    <span className="text-[9px] text-[#64748B]">{safeIntroAnswer.trim().length} chars</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={submitSafeIntro}
                  disabled={sendingSafeIntro || safeIntroAnswer.trim().length < 15}
                  className="w-full py-3 bg-#38BDF8 hover:bg-#0284C7 disabled:bg-slate-800 disabled:text-[#64748B] disabled:cursor-not-allowed text-slate-900 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  {sendingSafeIntro ? (
                    <RefreshCw className="animate-spin" size={12} />
                  ) : (
                    <Send size={12} />
                  )}
                  Share Intro & Unlock Chat
                </button>
                <button
                  onClick={() => setSafeIntroModal(null)}
                  className="w-full py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-[#94A3B8] hover:text-white font-semibold rounded-2xl text-xs uppercase tracking-wider transition-all text-center"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
