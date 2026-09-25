import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { MessageCircle, Search, Plus, ShieldCheck } from 'lucide-react';
import { timeAgo } from '@/lib/formatters';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDM, setShowNewDM] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/api/conversations');
      setConversations(data.conversations);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Poll every 5s for new messages
  useEffect(() => {
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Search users for new DM
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get('/api/search?q=${encodeURIComponent(searchQuery)}&limit=8');
        setSearchResults((data.users || []).filter(u => u._id !== user?._id));
      } catch (_) {}
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  const startConversation = async (otherUserId) => {
    try {
      const { data } = await api.post('/api/conversations', { user_id: otherUserId });
      navigate(`/app/messages/${data.conversation_id}`);
    } catch (_) {}
  };

  return (
    <div className="max-w-[640px] mx-auto px-4 py-5" data-testid="messages-page" role="main">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Messages</h1>
        <button onClick={() => setShowNewDM(!showNewDM)}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#A855F7] to-[#EC4899] rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity"
          data-testid="new-dm-btn">
          <Plus size={14} strokeWidth={2.5} /> New
        </button>
      </div>

      {/* New DM search */}
      {showNewDM && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 overflow-hidden" data-testid="new-dm-panel" role="search" aria-label="Search people to message">
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people to message..."
              aria-label="Search people to message"
              className="w-full bg-[#1a2235] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-[#A855F7]/50"
              data-testid="new-dm-search" autoFocus />
          </div>
          {searching && <div className="text-center py-3" aria-busy="true"><div className="w-5 h-5 border-2 border-[#A855F7] border-r-transparent rounded-full animate-spin mx-auto" aria-label="Loading" /></div>}
          {searchResults.map(u => (
            <div key={u._id} onClick={() => startConversation(u._id)}
              role="option" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startConversation(u._id); } }}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] cursor-pointer transition-colors" data-testid="dm-user-option">
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/[0.1] bg-white/[0.06] flex items-center justify-center">
                {u.profile_image ? <img src={u.profile_image} alt={`${u.name}'s profile picture`} className="w-full h-full object-cover" />
                  : <span className="text-sm font-bold text-white">{u.name?.charAt(0)}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-white truncate">{u.name}</p>
                  {u.is_verified && <ShieldCheck size={13} strokeWidth={2.5} className="shrink-0" style={{ color: 'white', fill: '#3B82F6' }} />}
                </div>
                <p className="text-xs text-[#64748B] truncate">@{u.username}</p>
              </div>
            </div>
          ))}
          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <p className="text-center text-xs text-[#475569] py-3">No users found</p>
          )}
        </motion.div>
      )}

      {/* Conversations list */}
      {loading ? (
        <div className="flex justify-center py-16" aria-busy="true">
          <div className="w-8 h-8 border-2 border-[#A855F7] border-r-transparent rounded-full animate-spin" aria-label="Loading" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16" data-testid="empty-messages">
          <MessageCircle size={40} className="mx-auto mb-3 text-[#334155]" />
          <p className="text-[#64748B] font-medium text-sm">No conversations yet</p>
          <p className="text-[#475569] text-xs mt-1">Connect with a fellow believer</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((convo, i) => {
            const other = convo.other_user;
            return (
              <motion.div key={convo._id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/app/messages/${convo._id}`)}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/app/messages/${convo._id}`); } }}
                role="link" aria-label={`Conversation with ${other?.name || 'Unknown'}`}
                className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all ${
                  convo.unread_count > 0 ? 'bg-white/[0.04] border border-white/[0.06]' : 'hover:bg-white/[0.03]'
                }`}
                data-testid="conversation-item">
                <div className="relative shrink-0">
                  {other?.profile_image ? (
                    <img src={other.profile_image} alt={`${other?.name || 'User'}'s profile picture`} className="w-12 h-12 rounded-full object-cover border border-white/[0.1]" />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base border border-white/[0.1] bg-white/[0.06] text-white">
                      {other?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  {convo.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#A855F7] flex items-center justify-center" aria-live="polite">
                      <span className="text-[10px] font-bold text-white" aria-label={`${convo.unread_count} unread message${convo.unread_count > 1 ? 's' : ''}`}>{convo.unread_count}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-bold truncate ${convo.unread_count > 0 ? 'text-white' : 'text-[#CBD5E1]'}`}>
                      {other?.name || 'Unknown'}
                    </p>
                    {other?.is_verified && <ShieldCheck size={13} strokeWidth={2.5} className="shrink-0" style={{ color: 'white', fill: '#3B82F6' }} />}
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${convo.unread_count > 0 ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
                    {convo.last_message || 'No messages yet'}
                  </p>
                </div>
                <span className="text-[11px] text-[#475569] shrink-0">{timeAgo(convo.last_message_at)}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Messages;
