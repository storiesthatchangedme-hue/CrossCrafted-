import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Send, ShieldCheck, Mic, Image as ImageIcon, 
  BookOpen, HeartHandshake, Play, Pause, Paperclip, 
  Check, Plus, Sparkles, X
} from 'lucide-react';
import { toast } from 'sonner';
import { formatTime } from '@/lib/formatters';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessage from '@/components/chat/ChatMessage';
import MessageInput from '@/components/chat/MessageInput';


const SCRIPTURES = [
  { text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", reference: "Jeremiah 29:11" },
  { text: "As iron sharpens iron, so one person sharpens another.", reference: "Proverbs 27:17" },
  { text: "I can do all things through Christ who strengthens me.", reference: "Philippians 4:13" },
  { text: "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures...", reference: "Psalm 23:1-2" }
];

const MOCK_IMAGES = [
  { title: "Fellowship Gathering", url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500&q=80" },
  { title: "Bible Study Circle", url: "https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?w=500&q=80" },
  { title: "Morning Prayer Hike", url: "https://images.unsplash.com/photo-1507504038482-76210374c276?w=500&q=80" }
];

const Conversation = () => {
  const { convoId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Interaction States
  const [activeEmojiPickerId, setActiveEmojiPickerId] = useState(null);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showScripturePicker, setShowScripturePicker] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showPrayerPrompt, setShowPrayerPrompt] = useState(false);
  const [prayerText, setPrayerText] = useState('');

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await api.get('/api/conversations/${convoId}/messages');
      setMessages(data.messages);
    } catch (_) {}
    finally { setLoading(false); }
  }, [convoId]);

  // Get conversation info for the other user
  useEffect(() => {
    const fetchConvoInfo = async () => {
      try {
        const { data } = await api.get('/api/conversations');
        const convo = data.conversations.find(c => c._id === convoId);
        if (convo) setOtherUser(convo.other_user);
      } catch (_) {}
    };
    fetchConvoInfo();
  }, [convoId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Poll for new messages every 3s
  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;
    setSending(true);
    setNewMessage('');
    
    const optimistic = {
      _id: 'temp_' + Date.now(),
      sender_id: user._id,
      sender_name: user.name,
      text,
      image_url: null,
      voice_url: null,
      prayer_request: null,
      scripture: null,
      reactions: [],
      created_at: new Date().toISOString(),
      read: false
    };

    setMessages(prev => [...prev, optimistic]);
    try {
      const { data } = await api.post('/api/conversations/${convoId}/messages', { text });
      setMessages(prev => prev.map(m => m._id === optimistic._id ? data : m));
    } catch (_) {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      toast.error('Failed to send message');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSendRich = async (richProps) => {
    if (sending) return;
    setSending(true);
    
    const optimistic = {
      _id: 'temp_' + Date.now(),
      sender_id: user._id,
      sender_name: user.name,
      text: richProps.text || '',
      image_url: richProps.image_url || null,
      voice_url: richProps.voice_url || null,
      prayer_request: richProps.prayer_request || null,
      scripture: richProps.scripture || null,
      reactions: [],
      created_at: new Date().toISOString(),
      read: false
    };

    setMessages(prev => [...prev, optimistic]);
    try {
      const { data } = await api.post(
        '/api/conversations/${convoId}/messages', 
        {
          text: richProps.text || '',
          image_url: richProps.image_url || null,
          voice_url: richProps.voice_url || null,
          prayer_request: richProps.prayer_request || null,
          scripture: richProps.scripture || null
        }
      );
      setMessages(prev => prev.map(m => m._id === optimistic._id ? data : m));
    } catch (_) {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      toast.error('Failed to post shared content');
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (messageId, emoji) => {
    try {
      const { data } = await api.post('/api/conversations/${convoId}/messages/${messageId}/react', { emoji });
      setMessages(prev => prev.map(m => m._id === messageId ? data : m));
      setActiveEmojiPickerId(null);
    } catch (_) {
      toast.error('Failed to register reaction');
    }
  };

  const sendMockVoiceNote = () => {
    handleSendRich({
      text: '🎙️ Shared a Voice Note',
      voice_url: 'mock_audio.mp3'
    });
    toast.success('Voice note shared in fellowship!');
    setShowAttachments(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-56px)] max-w-[640px] mx-auto bg-slate-950 relative" data-testid="conversation-page">
      
      {/* ── Chat Header ── */}
      <ChatHeader otherUser={otherUser} onBack={() => navigate('/app/messages')} />

      {/* ── Messages Feed area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" data-testid="messages-area">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-amber-400 border-r-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#475569] text-sm">Say hello! Start the conversation.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMine = msg.sender_id === user?._id;
            const showTime = i === 0 || (new Date(msg.created_at) - new Date(messages[i - 1]?.created_at)) > 300000;
            const isPickerOpen = activeEmojiPickerId === msg._id;

            return (
              <div key={msg._id} className="space-y-1">
                {showTime && (
                  <p className="text-center text-[10px] text-[#475569] my-3">{formatTime(msg.created_at)}</p>
                )}
                
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2 relative group`}>
                  
                  {/* Message Bubble Column */}
                  <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[80%]`}>
                    
                    {/* Rounded Image Component */}
                    {msg.image_url && (
                      <div className="overflow-hidden rounded-2xl border border-white/[0.08] mb-1.5 shadow-lg max-w-[260px]">
                        <img src={msg.image_url} alt="Shared Photo" className="w-full h-auto object-cover max-h-48" />
                      </div>
                    )}

                    {/* Shared Golden Scripture Card */}
                    {msg.scripture && (
                      <div className="bg-[#1E1B1B] border border-amber-400/30 p-3.5 rounded-2xl text-xs text-amber-200 font-serif leading-relaxed italic mb-1.5 max-w-[260px] shadow-md relative overflow-hidden">
                        <div className="absolute right-0 top-0 text-[#2D2A29] font-serif font-black text-6xl pointer-events-none opacity-30 select-none -mr-1 -mt-2">“</div>
                        <div className="flex items-center gap-1.5 text-[9px] font-sans uppercase tracking-widest font-black text-amber-400 mb-1.5">
                          <BookOpen size={11} />
                          <span>Shared Scripture</span>
                        </div>
                        "{msg.scripture.text}"
                        <span className="block text-[9.5px] font-sans font-bold text-amber-300 text-right mt-1.5">— {msg.scripture.reference}</span>
                      </div>
                    )}

                    {/* Shared Prayer Request Card */}
                    {msg.prayer_request && (
                      <div className="bg-[#0D1F17] border border-emerald-500/20 p-3.5 rounded-2xl text-xs text-emerald-200 leading-relaxed mb-1.5 max-w-[260px] shadow-md">
                        <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-extrabold text-emerald-400 mb-1.5">
                          <HeartHandshake size={11} />
                          <span>Prayer Request</span>
                        </div>
                        "{msg.prayer_request}"
                        <span className="block text-[9px] font-black text-emerald-400 mt-2">🙏 Stand in Prayer</span>
                      </div>
                    )}

                    {/* Shared Voice Note Waveform Player */}
                    {msg.voice_url && (
                      <div className="flex items-center gap-2.5 bg-[#1E293B] border border-white/[0.06] p-3 rounded-2xl mb-1.5 min-w-[210px] shadow-md">
                        <button 
                          type="button"
                          onClick={() => setPlayingVoiceId(playingVoiceId === msg._id ? null : msg._id)}
                          className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95"
                        >
                          {playingVoiceId === msg._id ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-end gap-0.5 h-5">
                            {[2, 4, 3, 5, 2, 4, 6, 3, 5, 2, 4, 3, 5, 2, 4, 6, 3, 5, 2, 4].map((h, i) => (
                              <div 
                                key={i} 
                                className={`w-[3px] rounded-full transition-all duration-300 ${
                                  playingVoiceId === msg._id ? 'bg-amber-400 animate-pulse' : 'bg-[#475569]'
                                }`} 
                                style={{ height: playingVoiceId === msg._id ? `${h * 3}px` : `${Math.max(3, h * 1.8)}px` }} 
                              />
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-[8px] text-[#64748B] mt-1">
                            <span>0:08</span>
                            <span>Voice Note</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Standard Text Bubble */}
                    {msg.text && (!msg.scripture && !msg.prayer_request) && (
                      <div className={`max-w-full px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isMine
                          ? 'bg-gradient-to-br from-[#A855F7] to-[#7C3AED] text-white rounded-br-md'
                          : 'bg-[#1E293B] text-[#E2E8F0] border border-white/[0.06] rounded-bl-md'
                      }`}>
                        {msg.text}
                      </div>
                    )}

                    {/* Emoji Reactions List on bubble */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex items-center gap-1 bg-slate-900 border border-white/[0.08] px-2 py-0.5 rounded-full shadow-lg text-[10px] mt-1">
                        {msg.reactions.map((r, ri) => (
                          <span key={ri} title={`${r.user_name} reacted`} className="cursor-help">
                            {r.emoji}
                          </span>
                        ))}
                        <span className="text-[8px] text-[#64748B] font-bold ml-0.5">{msg.reactions.length}</span>
                      </div>
                    )}

                  </div>

                  {/* Reaction trigger controls */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setActiveEmojiPickerId(isPickerOpen ? null : msg._id)}
                      className="p-1 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-[#64748B] hover:text-white transition-all shadow"
                    >
                      <Smile size={13} />
                    </button>
                  </div>

                  {/* Reactive Quick Emoji ribbon overlay */}
                  <AnimatePresence>
                    {isPickerOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 5 }}
                        className={`absolute z-30 flex items-center gap-1 bg-slate-900 border border-white/[0.1] px-2.5 py-1.5 rounded-full shadow-2xl ${
                          isMine ? 'right-0 -top-9' : 'left-0 -top-9'
                        }`}
                      >
                        {['❤️', '🙏', '👍', '🙌', '✝️'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleReact(msg._id, emoji)}
                            className="hover:scale-135 transition-transform text-[13px] px-0.5"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Specialized Scripture / Photo / Prayer Overlays ── */}
      <AnimatePresence>
        {showScripturePicker && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="absolute bottom-[68px] inset-x-4 bg-[#1E293B] border border-white/[0.08] rounded-2xl p-4 shadow-2xl z-20"
          >
            <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-2">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <BookOpen size={13} className="text-amber-400" />
                Select fellowship scripture
              </span>
              <button onClick={() => setShowScripturePicker(false)} className="text-[#64748B] hover:text-white">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin">
              {SCRIPTURES.map((sc, sci) => (
                <div 
                  key={sci}
                  onClick={() => {
                    handleSendRich({ scripture: sc, text: `📖 Shared scripture: ${sc.reference}` });
                    setShowScripturePicker(false);
                  }}
                  className="p-2.5 rounded-xl border border-white/[0.04] bg-slate-900/40 text-[11px] text-slate-300 leading-normal hover:bg-amber-400/5 hover:border-amber-400/20 cursor-pointer transition-all"
                >
                  <p className="italic font-serif">"{sc.text}"</p>
                  <span className="block text-[10px] font-sans font-bold text-amber-400 text-right mt-1">— {sc.reference}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {showPhotoPicker && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="absolute bottom-[68px] inset-x-4 bg-[#1E293B] border border-white/[0.08] rounded-2xl p-4 shadow-2xl z-20"
          >
            <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-2">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <ImageIcon size={13} className="text-amber-400" />
                Share community moment
              </span>
              <button onClick={() => setShowPhotoPicker(false)} className="text-[#64748B] hover:text-white">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MOCK_IMAGES.map((img, imi) => (
                <div 
                  key={imi}
                  onClick={() => {
                    handleSendRich({ image_url: img.url, text: `📸 Shared a photo: ${img.title}` });
                    setShowPhotoPicker(false);
                  }}
                  className="group relative rounded-xl overflow-hidden aspect-video border border-white/[0.04] cursor-pointer"
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 flex items-end p-1.5">
                    <span className="text-[8px] font-bold text-white truncate w-full">{img.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {showPrayerPrompt && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="absolute bottom-[68px] inset-x-4 bg-[#1E293B] border border-white/[0.08] rounded-2xl p-4 shadow-2xl z-20 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <HeartHandshake size={13} className="text-emerald-400" />
                Post Prayer Request
              </span>
              <button onClick={() => setShowPrayerPrompt(false)} className="text-[#64748B] hover:text-white">
                <X size={14} />
              </button>
            </div>
            <textarea
              rows={2}
              value={prayerText}
              onChange={(e) => setPrayerText(e.target.value)}
              placeholder="How can I stand in prayer for you this week? 🙏"
              className="w-full bg-slate-900 border border-white/[0.06] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowPrayerPrompt(false)}
                className="px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold text-[#64748B] hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (!prayerText.trim()) return;
                  handleSendRich({ prayer_request: prayerText.trim(), text: '🙏 Posted a Prayer Request' });
                  setPrayerText('');
                  setShowPrayerPrompt(false);
                }}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] uppercase font-black"
              >
                Post Request
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Rich Media Selector Attachments Popover ── */}
      <AnimatePresence>
        {showAttachments && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="absolute bottom-[68px] left-4 bg-slate-900 border border-white/[0.08] rounded-2xl p-2 shadow-2xl z-20 flex gap-1"
          >
            <button 
              type="button"
              onClick={() => {
                setShowScripturePicker(true);
                setShowAttachments(false);
                setShowPhotoPicker(false);
                setShowPrayerPrompt(false);
              }}
              className="p-3 rounded-xl hover:bg-white/[0.04] text-amber-400 flex flex-col items-center gap-1 transition-all"
              title="Share Scripture"
            >
              <BookOpen size={16} />
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#64748B]">Scripture</span>
            </button>

            <button 
              type="button"
              onClick={() => {
                setShowPrayerPrompt(true);
                setShowAttachments(false);
                setShowScripturePicker(false);
                setShowPhotoPicker(false);
              }}
              className="p-3 rounded-xl hover:bg-white/[0.04] text-emerald-400 flex flex-col items-center gap-1 transition-all"
              title="Post Prayer Request"
            >
              <HeartHandshake size={16} />
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#64748B]">Prayer</span>
            </button>

            <button 
              type="button"
              onClick={() => {
                setShowPhotoPicker(true);
                setShowAttachments(false);
                setShowScripturePicker(false);
                setShowPrayerPrompt(false);
              }}
              className="p-3 rounded-xl hover:bg-white/[0.04] text-blue-400 flex flex-col items-center gap-1 transition-all"
              title="Share Photo"
            >
              <ImageIcon size={16} />
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#64748B]">Photo</span>
            </button>

            <button 
              type="button"
              onClick={sendMockVoiceNote}
              className="p-3 rounded-xl hover:bg-white/[0.04] text-pink-400 flex flex-col items-center gap-1 transition-all"
              title="Send Voice Note"
            >
              <Mic size={16} />
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#64748B]">Voice</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Active Input Footer ── */}
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-white/[0.06] shrink-0 pb-safe bg-[#0F172A] z-10">
        <div className="flex gap-2 relative">
          
          {/* Paperclip Action Toggle */}
          <button
            type="button"
            onClick={() => setShowAttachments(!showAttachments)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all border ${
              showAttachments 
                ? 'bg-amber-400 text-slate-950 border-amber-400' 
                : 'bg-white/[0.04] hover:bg-white/[0.06] border-white/[0.06] text-[#94A3B8] hover:text-white'
            }`}
          >
            <Paperclip size={18} />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message or share fellowship..."
            className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-amber-400/50"
            data-testid="message-input"
          />
          <button type="submit" disabled={!newMessage.trim() || sending}
            className="w-11 h-11 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 disabled:from-[#475569] disabled:to-[#334155] flex items-center justify-center text-slate-950 disabled:text-slate-500 hover:opacity-90 transition-all shrink-0 shadow-lg"
            data-testid="send-message-btn"
              aria-label="Send message">
            <Send size={18} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Conversation;
