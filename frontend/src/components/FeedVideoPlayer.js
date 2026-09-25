import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, TrendingUp, Play, Volume2, VolumeX, X, ChevronUp, ChevronDown } from 'lucide-react';

const FeedVideoPlayer = ({ src, thumbnail, isVisible, onDoubleTap, postId }) => {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);

  // Auto-play when visible, pause when not
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
      video.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
    }
  }, [isVisible]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPlaying(true));
    } else {
      video.pause();
      setPlaying(false);
    }
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 600);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setMuted(!muted);
  };

  return (
    <div className="relative w-full select-none cursor-pointer" onClick={() => { onDoubleTap(); togglePlay(); }}>
      <video
        ref={videoRef}
        src={src}
        poster={thumbnail || undefined}
        playsInline
        loop
        muted={muted}
        preload="metadata"
        className="w-full object-cover"
        style={{ minHeight: '400px', maxHeight: '85vh' }}
      />

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center z-20 hover:bg-black/60 transition-colors"
        data-testid="video-mute-toggle"
      >
        {muted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
      </button>

      {/* Play/Pause indicator */}
      <AnimatePresence>
        {showPlayIcon && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              {playing ? (
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-6 bg-white rounded-full" />
                  <div className="w-1.5 h-6 bg-white rounded-full" />
                </div>
              ) : (
                <Play size={28} fill="white" className="text-white ml-1" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial play overlay for paused state */}
      {!playing && !showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Play size={28} fill="white" className="text-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Full Screen Video Viewer (Reels style) ── */
export const VideoReelsViewer = ({ posts, startIndex, onClose, user, onLike, onSave, navigate }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const post = posts[currentIndex];
  if (!post) return null;

  const isLiked = post.likes?.includes(user?._id);
  const isSaved = user?.saved_posts?.includes(post._id);

  const goNext = () => { if (currentIndex < posts.length - 1) setCurrentIndex(currentIndex + 1); };
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
      data-testid="video-reels-viewer"
    >
      {/* Close button */}
      <button onClick={onClose}
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
        data-testid="close-reels">
        <X size={20} className="text-white" />
      </button>

      {/* Video */}
      <div className="relative w-full h-full max-w-lg mx-auto">
        <video
          key={post._id}
          src={post.video_url}
          poster={post.thumbnail_url || undefined}
          autoPlay playsInline loop
          className="w-full h-full object-contain"
        />

        {/* Gradient bottom */}
        <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

        {/* Author + caption */}
        <div className="absolute bottom-20 left-4 right-20 z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20 cursor-pointer"
              onClick={() => { onClose(); navigate(`/app/profile/${post.user_id}`); }}>
              {post.user_image
                ? <img src={post.user_image} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold bg-[#A855F7]">{post.user_name?.charAt(0)}</div>}
            </div>
            <span className="text-white font-bold text-sm">{post.user_name}</span>
          </div>
          {post.content_text && (
            <p className="text-white/90 text-[13px] leading-[1.5] line-clamp-3">{post.content_text}</p>
          )}
        </div>

        {/* Actions */}
        <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-10">
          <button onClick={() => onLike(post._id, isLiked)} className="flex flex-col items-center gap-1" data-testid="reels-like">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isLiked ? 'bg-pink-500/30' : 'bg-white/10'}`}>
              <Heart size={24} strokeWidth={isLiked ? 0 : 2} fill={isLiked ? '#EC4899' : 'none'} className={isLiked ? 'text-pink-400' : 'text-white'} />
            </div>
            <span className={`text-xs font-bold ${isLiked ? 'text-pink-400' : 'text-white/80'}`}>{post.likes_count || 0}</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10">
              <MessageCircle size={24} strokeWidth={2} className="text-white" />
            </div>
            <span className="text-xs font-bold text-white/80">{post.comments_count || 0}</span>
          </button>
          <button onClick={() => onSave(post._id, isSaved)} className="flex flex-col items-center gap-1" data-testid="reels-save">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSaved ? 'bg-purple-500/30' : 'bg-white/10'}`}>
              <Bookmark size={24} strokeWidth={isSaved ? 0 : 2} fill={isSaved ? '#A855F7' : 'none'} className={isSaved ? 'text-purple-400' : 'text-white'} />
            </div>
          </button>
        </div>

        {/* Nav arrows */}
        {currentIndex > 0 && (
          <button onClick={goPrev} className="absolute top-1/3 left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronUp size={24} className="text-white" />
          </button>
        )}
        {currentIndex < posts.length - 1 && (
          <button onClick={goNext} className="absolute bottom-1/3 left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronDown size={24} className="text-white" />
          </button>
        )}

        {/* Counter */}
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm z-10">
          <span className="text-white text-xs font-bold">{currentIndex + 1}/{posts.length}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default FeedVideoPlayer;
