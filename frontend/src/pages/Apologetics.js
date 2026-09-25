import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, Heart, MessageCircle, Share2,
  Shield, BookOpen, Cross, Globe, Sparkles, ChevronDown,
  Upload, Image as ImageIcon, ThumbsUp, Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import api from '@/lib/api';

const TOPICS = [
  { id: 'gods_existence', label: "God's Existence", icon: Globe, color: '#A855F7' },
  { id: 'problem_of_evil', label: 'Problem of Evil', icon: Shield, color: '#EF4444' },
  { id: 'resurrection', label: 'Resurrection', icon: Cross, color: '#22C55E' },
  { id: 'bible_reliability', label: 'Bible Reliability', icon: BookOpen, color: '#3B82F6' },
  { id: 'science_faith', label: 'Science & Faith', icon: Sparkles, color: '#F59E0B' },
  { id: 'world_religions', label: 'World Religions', icon: Globe, color: '#EC4899' },
];

const GRADIENTS = [
  'linear-gradient(135deg, #A855F7, #3B82F6)',
  'linear-gradient(135deg, #EC4899, #A855F7)',
  'linear-gradient(135deg, #3B82F6, #6366F1)',
  'linear-gradient(135deg, #F97316, #EC4899)',
  'linear-gradient(135deg, #22C55E, #3B82F6)',
  'linear-gradient(135deg, #F59E0B, #EF4444)',
];

const MOCK_POSTS = [
  {
    _id: 'ap1', title: 'How do we know God exists?',
    body: "The existence of God can be argued through multiple lines of reasoning: the cosmological argument (everything that begins to exist has a cause), the teleological argument (the fine-tuning of the universe points to a Designer), the moral argument (objective moral values require a moral lawgiver), and personal experience (millions of people throughout history have experienced God's presence).",
    author: 'Dr. William Craig', topic: 'gods_existence',
    image: '', date: '2025-01-15', likes: 142, comments: 28,
  },
  {
    _id: 'ap2', title: 'Why does God allow suffering?',
    body: "The problem of evil is one of the most challenging questions in philosophy of religion. However, several responses have been offered: (1) Free Will Defense — God allows evil because He values genuine free will; (2) Soul-Making Theodicy — Suffering can produce character growth; (3) Greater Good — Some evils may be necessary for greater goods we cannot yet see; (4) Eternal Perspective — This life is temporary; eternal justice will be served.",
    author: 'Pastor Ravi Zacharias', topic: 'problem_of_evil',
    image: '', date: '2025-01-12', likes: 98, comments: 45,
  },
  {
    _id: 'ap3', title: 'Evidence for the Resurrection of Jesus',
    body: "The resurrection is supported by: (1) The empty tomb — even opponents acknowledged it; (2) Post-resurrection appearances to over 500 witnesses; (3) The sudden transformation of the disciples from fearful to bold; (4) The origin of the Christian faith itself, which began in Jerusalem where it could have been easily falsified; (5) The early creeds in 1 Corinthians 15, dated within years of the event.",
    author: 'Dr. Gary Habermas', topic: 'resurrection',
    image: '', date: '2025-01-10', likes: 210, comments: 36,
  },
  {
    _id: 'ap4', title: 'Is the Bible historically reliable?',
    body: "The Bible's historical reliability is supported by: (1) Manuscript evidence — over 5,800 Greek manuscripts of the NT, far more than any other ancient text; (2) Archaeological confirmation — numerous discoveries validate biblical accounts; (3) Internal consistency — 66 books by 40+ authors over 1,500 years with a unified message; (4) Fulfilled prophecy — hundreds of prophecies fulfilled in detail.",
    author: 'Dr. Norman Geisler', topic: 'bible_reliability',
    image: '', date: '2025-01-08', likes: 167, comments: 22,
  },
  {
    _id: 'ap5', title: 'Can science and faith coexist?',
    body: "Science and faith are not inherently in conflict. Many of history's greatest scientists were people of faith — Newton, Pascal, Faraday, Mendel. Science answers 'how' questions about the natural world, while faith addresses 'why' questions about meaning and purpose. The Big Bang theory itself was proposed by a Catholic priest (Georges Lemaître). The fine-tuning of physical constants continues to point beyond mere chance.",
    author: 'Dr. John Lennox', topic: 'science_faith',
    image: '', date: '2025-01-05', likes: 185, comments: 31,
  },
  {
    _id: 'ap6', title: 'What makes Christianity unique among world religions?',
    body: "Christianity is unique in several key ways: (1) Grace over works — salvation is a gift, not earned; (2) God became human — the incarnation is unique to Christianity; (3) A resurrection — no other religion claims its founder rose from the dead; (4) A personal God — God is relational and loving, not distant; (5) Falsifiable claims — Christianity makes historical claims that can be investigated.",
    author: 'Dr. Tim Keller', topic: 'world_religions',
    image: '', date: '2025-01-02', likes: 156, comments: 42,
  },
];

const Apologetics = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', body: '', topic: '', image: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTopic) params.append('topic', filterTopic);
      if (search) params.append('search', search);
      const { data } = await api.get(`/api/apologetics?${params}`);
      setPosts(Array.isArray(data) ? data : MOCK_POSTS);
    } catch (_) {
      // Fallback to mock data
      setPosts(MOCK_POSTS);
    } finally {
      setLoading(false);
    }
  }, [filterTopic, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = '';
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        const { data: uploaded } = await api.post('/api/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = uploaded.url;
      }
      await api.post('/api/apologetics', { ...formData, image: imageUrl });
      toast.success('Question posted!');
      setShowCreateModal(false);
      setFormData({ title: '', body: '', topic: '', image: '' });
      setImageFile(null);
      setImagePreview('');
      fetchPosts();
    } catch (_) {
      toast.error('Failed to post question');
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/api/apologetics/${postId}/like`);
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
    } catch (_) {
      // Optimistic
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const filteredPosts = (Array.isArray(posts) ? posts : []).filter(p => {
    const matchTopic = !filterTopic || p.topic === filterTopic;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.body.toLowerCase().includes(search.toLowerCase());
    return matchTopic && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#A855F7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="feed-container px-4 py-6" data-testid="apologetics-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="gradient-text">Apologetics</span>
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">Defend your faith with knowledge</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="neo-button-primary flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}
        >
          <Plus size={18} strokeWidth={2.5} /> Ask a Question
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={18} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="neo-input w-full pl-12"
          />
        </div>
      </div>

      {/* Topic Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        <button
          onClick={() => setFilterTopic('')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
            !filterTopic
              ? 'bg-gradient-to-r from-[#A855F7] to-[#EC4899] text-white border-transparent shadow-lg'
              : 'bg-white/[0.04] text-[#94A3B8] border-white/[0.08] hover:bg-white/[0.08]'
          }`}
        >
          All Topics
        </button>
        {TOPICS.map(topic => (
          <button
            key={topic.id}
            onClick={() => setFilterTopic(prev => prev === topic.id ? '' : topic.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
              filterTopic === topic.id
                ? 'border-transparent shadow-lg'
                : 'bg-white/[0.04] text-[#94A3B8] border-white/[0.08] hover:bg-white/[0.08]'
            }`}
            style={filterTopic === topic.id ? { background: `${topic.color}20`, color: topic.color, borderColor: `${topic.color}40` } : {}}
          >
            <topic.icon size={12} /> {topic.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <Shield size={48} strokeWidth={2} className="mx-auto mb-4 text-[#94A3B8] opacity-40" />
          <p className="text-[#94A3B8] mb-4">
            {search || filterTopic ? 'No questions found matching your filters.' : 'No questions yet. Be the first to ask!'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="neo-button-primary"
            style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}
          >
            Ask a Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post, i) => {
            const topic = TOPICS.find(t => t.id === post.topic);
            return (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-[24px] overflow-hidden"
              >
                {/* Gradient Header */}
                <div className="h-2" style={{ background: GRADIENTS[i % GRADIENTS.length] }} />

                <div className="p-5">
                  {/* Topic Badge + Date */}
                  <div className="flex items-center gap-2 mb-3">
                    {topic && (
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${topic.color}15`, color: topic.color }}
                      >
                        {topic.label}
                      </span>
                    )}
                    <span className="text-[10px] text-[#64748B]">
                      {new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-lg mb-3 leading-snug">{post.title}</h3>

                  {/* Image */}
                  {post.image && (
                    <div className="rounded-xl overflow-hidden mb-3">
                      <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
                    </div>
                  )}

                  {/* Body */}
                  <p className="text-sm text-[#94A3B8] leading-relaxed line-clamp-4 mb-4">{post.body}</p>

                  {/* Author */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#A855F7] to-[#EC4899] flex items-center justify-center text-white text-xs font-bold">
                      {post.author?.[0] || '?'}
                    </div>
                    <span className="text-xs text-[#94A3B8]">{post.author}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(post._id)}
                      className="flex items-center gap-1.5 text-[#94A3B8] hover:text-[#EC4899] transition-colors text-sm"
                    >
                      <ThumbsUp size={14} /> {post.likes || 0}
                    </button>
                    <div className="flex items-center gap-1.5 text-[#94A3B8] text-sm">
                      <MessageCircle size={14} /> {post.comments || 0}
                    </div>
                    <button className="flex items-center gap-1.5 text-[#94A3B8] hover:text-white transition-colors text-sm ml-auto">
                      <Share2 size={14} /> Share
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Question Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="bg-[#1E293B] border border-white/[0.08] rounded-[24px] w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold gradient-text">Ask a Question</h2>
                <button onClick={() => { setShowCreateModal(false); setImageFile(null); setImagePreview(''); }} className="text-[#64748B] hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Question Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="neo-input w-full text-sm"
                    required
                    placeholder="e.g. How do we know God exists?"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Topic</label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="neo-input w-full text-sm"
                    required
                  >
                    <option value="">Select topic</option>
                    {TOPICS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Your Answer / Explanation</label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    className="neo-input w-full h-32 resize-none text-sm"
                    required
                    placeholder="Provide your answer or explanation..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Image (Optional)</label>
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/[0.08]">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(''); }}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/90 p-1.5 rounded-full"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-white/[0.08] rounded-xl flex flex-col items-center gap-2 text-[#94A3B8] hover:bg-white/[0.04] transition-colors"
                    >
                      <Upload size={20} /> <span className="text-xs">Upload Image</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => { setShowCreateModal(false); setImageFile(null); setImagePreview(''); }} className="neo-button-outline flex-1 py-2.5 text-sm">Cancel</button>
                  <button type="submit" className="neo-button-primary flex-1 py-2.5 text-sm" style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>Post Question</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Apologetics;
