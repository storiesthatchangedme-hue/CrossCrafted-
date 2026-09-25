import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api, { uploadConfig } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Upload, Image as ImageIcon, Video, X } from 'lucide-react';
import { toast } from 'sonner';


const Feed = () => {
  const { user } = useAuth();
  const [testimonies, setTestimonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTestimonies();
  }, []);

  const fetchTestimonies = async () => {
    try {
      const { data } = await api.get('/api/testimonies');
      setTestimonies(data);
    } catch (_) {
      toast.error('Failed to load testimonies');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = () => setMediaPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateTestimony = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let mediaPath = '';
      let mediaType = '';

      if (mediaFile) {
        const formData = new FormData();
        formData.append('file', mediaFile);
        const uploadResponse = await api.post('/api/upload', formData, uploadConfig());
        mediaPath = uploadResponse.data.path;
        mediaType = mediaFile.type.startsWith('video') ? 'video' : 'image';
      }

      await api.post(
        '/api/testimonies',
        { content, media_path: mediaPath, media_type: mediaType }
      );

      toast.success('Testimony shared!');
      setShowCreateModal(false);
      setContent('');
      setMediaFile(null);
      setMediaPreview(null);
      fetchTestimonies();
    } catch (_) {
      toast.error('Failed to share testimony');
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (testimonyId, isLiked) => {
    try {
      if (isLiked) {
        await api.delete(`/api/testimonies/${testimonyId}/like`);
      } else {
        await api.post(`/api/testimonies/${testimonyId}/like`, {});
      }
      fetchTestimonies();
    } catch (_) {
      toast.error('Like failed');
    }
  };

  const bgColors = ['bg-white', 'bg-[#FF90E8]/10', 'bg-[#B4FF39]/10', 'bg-[#FFD800]/10', 'bg-[#80C4E9]/10'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#FF90E8] border-r-transparent"></div>
          <p className="mt-4 text-[#0A0A0A] font-medium">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-container px-4 py-6" data-testid="feed-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          Testimonies Feed
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="neo-button-primary flex items-center gap-2"
          data-testid="create-testimony-button"
        >
          <Upload size={20} strokeWidth={2.5} />
          Share
        </button>
      </div>

      <AnimatePresence>
        {testimonies.map((testimony, index) => {
          const isLiked = testimony.likes?.includes(user?._id);
          return (
            <motion.div
              key={testimony._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
              className={`${bgColors[index % bgColors.length]} border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0_0_#0A0A0A] p-6 mb-4 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0A0A0A] transition-all`}
              data-testid="testimony-card"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#E5E5E5] border-2 border-[#0A0A0A] flex items-center justify-center font-bold">
                  {testimony.user_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold">{testimony.user_name}</p>
                  <p className="text-sm text-[#52525B]">
                    {new Date(testimony.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p className="text-base leading-relaxed mb-4">{testimony.content}</p>

              {testimony.media_path && (
                <div className="mb-4 border-2 border-[#0A0A0A] rounded-lg overflow-hidden">
                  {testimony.media_type === 'video' ? (
                    <video
                      src={'/api/files/${testimony.media_path}'}
                      controls
                      className="w-full"
                      data-testid="testimony-video"
                    />
                  ) : (
                    <img
                      src={'/api/files/${testimony.media_path}'}
                      alt="Testimony media"
                      className="w-full h-auto"
                      data-testid="testimony-image"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(testimony._id, isLiked)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[#0A0A0A] font-medium transition-colors ${
                    isLiked ? 'bg-[#FF90E8]' : 'bg-white hover:bg-[#E5E5E5]'
                  }`}
                  data-testid="like-button"
                >
                  <Heart size={18} strokeWidth={2.5} fill={isLiked ? '#0A0A0A' : 'none'} />
                  {testimony.likes_count || 0}
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[#0A0A0A] bg-white hover:bg-[#E5E5E5] font-medium transition-colors"
                  data-testid="comment-button"
                >
                  <MessageCircle size={18} strokeWidth={2.5} />
                  {testimony.comments_count || 0}
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {testimonies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#52525B] mb-4">No testimonies yet. Be the first to share!</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="neo-button-primary"
          >
            Share Your Story
          </button>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="create-testimony-modal">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[8px_8px_0_0_#0A0A0A] p-6 w-full max-w-lg"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Share Your Testimony
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setContent('');
                  setMediaFile(null);
                  setMediaPreview(null);
                }}
                className="text-[#52525B] hover:text-[#0A0A0A]"
                data-testid="close-modal-button"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleCreateTestimony}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your faith journey..."
                className="neo-input w-full h-32 resize-none mb-4"
                required
                data-testid="testimony-content-input"
              />

              {mediaPreview && (
                <div className="mb-4 relative border-2 border-[#0A0A0A] rounded-lg overflow-hidden">
                  {mediaFile?.type.startsWith('video') ? (
                    <video src={mediaPreview} controls className="w-full" />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-full h-auto" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-white border-2 border-[#0A0A0A] rounded-full p-2"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="neo-button-outline flex items-center gap-2"
                  data-testid="upload-media-button"
                >
                  <ImageIcon size={20} strokeWidth={2.5} />
                  {mediaFile ? 'Change Media' : 'Add Photo/Video'}
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="neo-button-primary flex-1"
                  data-testid="submit-testimony-button"
                >
                  {uploading ? 'Sharing...' : 'Share Testimony'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Feed;
