import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Heart, MessageCircle, Image, Film, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { toast } from 'sonner';


const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedPost, setExpandedPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const fetchPosts = useCallback(async (q = '') => {
    try {
      const { data } = await api.get('/api/admin/posts?search=${encodeURIComponent(q)}');
      setPosts(data.posts);
      setTotal(data.total);
    } catch (_) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleSearch = (e) => { e.preventDefault(); setLoading(true); fetchPosts(search); };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post and all its comments?')) return;
    try {
      await api.delete('/api/admin/posts/${postId}');
      toast.success('Post deleted');
      fetchPosts(search);
    } catch (_) {
      toast.error('Failed to delete post');
    }
  };

  const toggleComments = async (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);
    setCommentsLoading(true);
    try {
      const { data } = await api.get('/api/posts/${postId}/comments');
      setPostComments(data);
    } catch (_) {
      toast.error('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete('/api/admin/comments/${postId}/${commentId}');
      toast.success('Comment deleted');
      setPostComments(prev => prev.filter(c => c.id !== commentId));
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments_count: Math.max(0, (p.comments_count || 1) - 1) } : p));
    } catch (_) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div data-testid="admin-posts-page">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Posts <span className="text-base text-[#94A3B8] font-normal">({total})</span>
        </h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts..."
              className="bg-[#1a2235] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-[#94A3B8] w-60 focus:outline-none focus:border-[#EC4899]"
              data-testid="admin-posts-search" />
          </div>
          <button type="submit" className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm font-medium hover:bg-white/[0.1] transition-colors">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#EC4899] border-r-transparent mx-auto" /></div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, i) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden hover:bg-white/[0.06] transition-colors"
              data-testid="admin-post-row"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 flex-1 min-w-0">
                    {(post.image_url || post.thumbnail_url) && (
                      <div className="w-16 h-16 rounded-xl border border-white/[0.08] overflow-hidden flex-shrink-0">
                        <img src={post.thumbnail_url || post.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-medium text-sm">{post.author_name || post.user_name || 'Unknown'}</span>
                        <span className="text-xs text-[#94A3B8]">@{post.author_username || post.user_username || '?'}</span>
                        <span className="text-xs text-[#64748B]">{post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}</span>
                      </div>
                      <p className="text-sm text-[#CBD5E1] leading-relaxed line-clamp-2 mb-2">{post.content_text}</p>
                      <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                        <span className="flex items-center gap-1"><Heart size={12} className="text-[#EC4899]" /> {post.likes_count || 0}</span>
                        <span className="flex items-center gap-1"><MessageCircle size={12} className="text-[#3B82F6]" /> {post.comments_count || 0}</span>
                        {post.image_url && <span className="flex items-center gap-1"><Image size={12} /> Photo</span>}
                        {post.video_url && <span className="flex items-center gap-1"><Film size={12} className="text-purple-400" /> Video</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(post.comments_count > 0) && (
                      <button
                        onClick={() => toggleComments(post._id)}
                        className="flex items-center gap-1.5 px-3 py-2 text-[#3B82F6] hover:bg-blue-500/10 border border-blue-500/20 rounded-xl transition-colors text-sm font-medium"
                        data-testid="toggle-comments-btn"
                      >
                        <Eye size={14} />
                        {expandedPost === post._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-colors text-sm font-medium"
                      data-testid="admin-delete-post"
                    >
                      <Trash2 size={14} strokeWidth={2.5} /> Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Comments */}
              <AnimatePresence>
                {expandedPost === post._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-white/[0.06] overflow-hidden"
                  >
                    <div className="p-4 bg-white/[0.02]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
                        Comments ({postComments.length})
                      </h4>
                      {commentsLoading ? (
                        <div className="py-4 text-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3B82F6] border-r-transparent mx-auto" /></div>
                      ) : postComments.length === 0 ? (
                        <p className="text-xs text-[#475569]">No comments</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {postComments.map((c) => (
                            <div key={c.id || c._id} className="flex items-start justify-between gap-3 p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-[#A855F7]">{c.user_name}</span>
                                  <span className="text-[10px] text-[#475569]">
                                    {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                                  </span>
                                </div>
                                <p className="text-xs text-[#CBD5E1] leading-relaxed">{c.text || c.content || ''}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteComment(post._id, c.id)}
                                className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                                data-testid="delete-comment-btn"
                                title="Delete comment"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          {posts.length === 0 && <div className="text-center py-10 text-[#94A3B8]">No posts found.</div>}
        </div>
      )}
    </div>
  );
};

export default AdminPosts;
