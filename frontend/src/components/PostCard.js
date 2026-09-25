import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Play, ShieldCheck, Crown } from 'lucide-react';

const PostCard = ({ post, currentUserId, onLike, showAuthor = false, authorName, authorInitial, authorUsername, isVerified, userRole }) => {
  const isLiked = post.likes?.includes(currentUserId);
  const [expanded, setExpanded] = useState(false);
  const longText = post.content_text && post.content_text.length > 150;

  return (
    <motion.article
      key={post._id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111827] rounded-[24px] border border-white/[0.08] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-white/[0.12] transition-all"
      data-testid="post-card"
      role="article"
    >
      {showAuthor && (
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center font-black text-white text-sm shrink-0 shadow-inner">
            {(authorInitial || post.user_name?.charAt(0))?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-black text-[15px] text-white truncate">{authorName || post.user_name}</p>
              {((isVerified || post.user_is_verified) && (userRole === 'admin' || post.user_role === 'admin')) ? (
                <Crown size={14} strokeWidth={2.5} className="shrink-0 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]" data-testid="admin-crown-badge" />
              ) : (isVerified || post.user_is_verified) ? (
                <ShieldCheck size={14} strokeWidth={2.5} className="shrink-0 text-[#38BDF8]" data-testid="verified-badge" />
              ) : null}
            </div>
            {(authorUsername || post.user_username) && (
              <p className="text-[11px] font-bold text-[#64748B] tracking-wide truncate">@{authorUsername || post.user_username}</p>
            )}
          </div>
        </div>
      )}

      {post.content_text && (
        <div className="px-5 py-4">
          <p className="text-[14px] font-medium leading-relaxed text-[#CBD5E1]">
            {longText && !expanded ? post.content_text.slice(0, 150) + '...' : post.content_text}
          </p>
          {longText && (
            <button onClick={() => setExpanded(!expanded)} className="text-[12px] uppercase tracking-widest text-[#38BDF8] hover:text-[#7C3AED] font-black mt-2 transition-colors" data-testid="read-more-btn" aria-expanded={expanded}>
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {post.image_url && (
        <div className="w-full">
          <img src={post.image_url} alt="Post image" className="w-full h-auto max-h-[400px] object-cover" loading="lazy" />
        </div>
      )}

      {post.video_url && (
        <div className="w-full relative">
          <video src={post.video_url} poster={post.thumbnail_url || undefined} playsInline preload="metadata" muted loop
            className="w-full h-auto max-h-[400px] object-cover"
            onClick={(e) => { if (e.target.paused) e.target.play(); else e.target.pause(); }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
            <div className="w-14 h-14 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-80">
              <Play size={24} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.01]">
        <button
          onClick={() => onLike(post._id, isLiked)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-black tracking-wide transition-all ${
            isLiked ? 'bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/30' : 'bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08] hover:text-white border border-transparent'
          }`}
          data-testid="post-like-button"
        aria-label={isLiked ? "Unlike post" : "Like post"}
        >
          <Heart size={16} strokeWidth={isLiked ? 2.5 : 2.5} className={isLiked ? 'fill-[#FB7185] drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]' : ''} />
          <span>{post.likes_count || 0}</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-black tracking-wide bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08] hover:text-white transition-all border border-transparent" data-testid="post-comment-button" aria-label="View comments">
          <MessageCircle size={16} strokeWidth={2.5} />
          <span>{post.comments_count || 0}</span>
        </button>
      </div>
    </motion.article>
  );
};

export default PostCard;
