import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Search, Trash2, MessageCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';


const AdminComments = () => {
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchComments = useCallback(async (q = '') => {
    try {
      const { data } = await api.get('/api/admin/comments?search=${encodeURIComponent(q)}&limit=100');
      setComments(data.comments);
      setTotal(data.total);
    } catch (_) {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSearch = (e) => { e.preventDefault(); setLoading(true); fetchComments(search); };

  const handleDelete = async (postId, commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete('/api/admin/comments/${postId}/${commentId}');
      toast.success('Comment deleted');
      setComments(prev => prev.filter(c => c.comment_id !== commentId));
      setTotal(prev => prev - 1);
    } catch (_) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div data-testid="admin-comments-page">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Comments <span className="text-base text-[#94A3B8] font-normal">({total})</span>
        </h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search comments..."
              className="bg-[#1a2235] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-[#94A3B8] w-60 focus:outline-none focus:border-[#3B82F6]"
              data-testid="admin-comments-search" />
          </div>
          <button type="submit" className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm font-medium hover:bg-white/[0.1] transition-colors">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3B82F6] border-r-transparent mx-auto" /></div>
      ) : comments.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
          <MessageCircle className="mx-auto mb-3 text-[#475569]" size={36} />
          <p className="text-[#94A3B8] font-medium text-sm">No comments found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map((c, i) => (
            <motion.div
              key={`${c.post_id}-${c.comment_id || i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 hover:bg-white/[0.06] transition-colors"
              data-testid="admin-comment-row"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-semibold text-sm text-[#A855F7]">{c.comment_user_name || 'Unknown'}</span>
                    <span className="text-[10px] text-[#475569]">
                      {c.comment_created_at ? new Date(c.comment_created_at).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-sm text-[#E2E8F0] leading-relaxed mb-2">{c.comment_text}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#475569]">
                    <FileText size={10} />
                    <span>on post by <span className="text-[#94A3B8] font-medium">{c.post_author}</span>:</span>
                    <span className="text-[#64748B] truncate max-w-[200px]">"{c.post_text}"</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(c.post_id, c.comment_id)}
                  className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-colors text-sm font-medium shrink-0"
                  data-testid="admin-delete-comment"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminComments;
