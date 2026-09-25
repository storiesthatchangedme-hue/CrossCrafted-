import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import api, { uploadConfig } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Users, Clock, Edit2, Save, X, Heart, MessageCircle,
  UserPlus, UserMinus, Calendar, Camera, Plus, Send, Image as ImageIcon, ChevronRight, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import PostCard from '@/components/PostCard';
import EventCard from '@/components/EventCard';


const ChurchProfile = () => {
  const { user } = useAuth();
  const { churchId } = useParams();
  const navigate = useNavigate();
  const [church, setChurch] = useState(null);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', location: '', service_times: '' });
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', location: '' });
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const fetchPosts = useCallback(async () => {
    try {
      const { data } = await api.get('/api/churches/${churchId}/posts');
      setPosts(data);
    } catch (_) {
      /* church posts non-critical */
    }
  }, [churchId]);

  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await api.get('/api/churches/${churchId}/events');
      setEvents(data);
    } catch (_) {
      /* church events non-critical */
    }
  }, [churchId]);

  const fetchChurch = useCallback(async () => {
    try {
      const { data } = await api.get('/api/churches/${churchId}');
      setChurch(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        location: data.location || '',
        service_times: data.service_times || '',
      });
      fetchPosts();
      fetchEvents();
    } catch (_) {
      toast.error('Church not found');
      navigate('/app/churches');
    } finally {
      setLoading(false);
    }
  }, [churchId, navigate, fetchPosts, fetchEvents]);

  useEffect(() => {
    fetchChurch();
  }, [fetchChurch]);

  const handleFollow = async () => {
    try {
      if (church.is_following) {
        await api.delete('/api/churches/${churchId}/follow');
        toast.success('Unfollowed');
      } else {
        await api.post('/api/churches/${churchId}/follow', {});
        toast.success('Following!');
      }
      fetchChurch();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleUpdateChurch = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/churches/${churchId}', formData);
      toast.success('Church updated!');
      setEditing(false);
      fetchChurch();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data: uploaded } = await api.post('/api/upload', fd, uploadConfig());
      await api.put('/api/churches/${churchId}', { cover_image: uploaded.url });
      toast.success('Cover image updated!');
      fetchChurch();
    } catch (error) {
      toast.error('Failed to upload cover');
    } finally {
      setUploadingCover(false);
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

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = '';
      let videoUrl = '';
      if (mediaFile) {
        const fd = new FormData();
        fd.append('file', mediaFile);
        const { data: uploaded } = await api.post('/api/upload', fd, uploadConfig());
        if (mediaFile.type.startsWith('video')) videoUrl = uploaded.url;
        else imageUrl = uploaded.url;
      }
      await api.post('/api/posts', { content_text: postContent, image_url: imageUrl, video_url: videoUrl });
      toast.success('Post shared!');
      setShowCreatePost(false);
      setPostContent('');
      setMediaFile(null);
      setMediaPreview(null);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/events', { ...eventForm, church_id: churchId });
      toast.success('Event created!');
      setShowCreateEvent(false);
      setEventForm({ title: '', description: '', date: '', location: '' });
      fetchEvents();
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      if (isLiked) await api.delete('/api/posts/${postId}/like');
      else await api.post('/api/posts/${postId}/like', {});
      fetchPosts();
    } catch (_) {
      toast.error('Like failed');
    }
  };

  const handleRegister = async (eventId) => {
    try {
      await api.post('/api/events/${eventId}/register', {});
      toast.success('Registered!');
      fetchEvents();
    } catch (error) {
      if (error.response?.data?.detail === 'Already registered') toast.info('Already registered');
      else toast.error('Registration failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#A855F7] border-r-transparent"></div>
          <p className="mt-4 text-white font-medium">Loading church...</p>
        </div>
      </div>
    );
  }

  if (!church) return null;

  const isOwner = church.is_owner;

  return (
    <div className="feed-container px-4 py-6" data-testid="church-profile-page">
      {/* Cover Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6"
      >
        <div className="h-48 md:h-64 rounded-[20px] border border-white/[0.06] shadow-none overflow-hidden">
          {church.cover_image ? (
            <img src={church.cover_image} alt={church.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#A855F7] via-[#EC4899] to-[#3B82F6]" />
          )}
          {isOwner && (
            <>
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="absolute bottom-3 right-3 px-4 py-2 bg-white/[0.04]/90 backdrop-blur border border-white/[0.08] rounded-full text-sm font-bold flex items-center gap-2 hover:bg-white/[0.08]/[0.04] transition-colors"
                data-testid="upload-cover-button"
              >
                <Camera size={16} strokeWidth={2.5} />
                {uploadingCover ? 'Uploading...' : 'Change Cover'}
              </button>
              <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
            </>
          )}
        </div>
      </motion.div>

      {/* Church Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/[0.04] rounded-[20px] bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] p-6 md:p-8 mb-6"
      >
        {editing ? (
          <form onSubmit={handleUpdateChurch} data-testid="church-edit-form">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Church Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="neo-input w-full" required data-testid="edit-church-name" />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="neo-input w-full h-24 resize-none" required data-testid="edit-church-description" />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Location</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="neo-input w-full" required data-testid="edit-church-location" />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Service Times</label>
                <input type="text" value={formData.service_times} onChange={(e) => setFormData({ ...formData, service_times: e.target.value })} className="neo-input w-full" placeholder="e.g. Sunday 9AM & 11AM, Wednesday 7PM" data-testid="edit-church-service-times" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(false)} className="neo-button-outline flex items-center gap-2" data-testid="cancel-church-edit">
                  <X size={16} strokeWidth={2.5} /> Cancel
                </button>
                <button type="submit" className="neo-button-primary flex items-center gap-2" style={{ background: '#B4FF39' }} data-testid="save-church-edit">
                  <Save size={16} strokeWidth={2.5} /> Save Changes
                </button>
              </div>
            </div>
          </form>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="church-name">
                    {church.name}
                  </h1>
                  {church.status === 'verified' && (
                    <ShieldCheck size={24} strokeWidth={2.5} className="shrink-0" style={{ color: 'white', fill: '#3B82F6' }} data-testid="verified-badge" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 text-[#94A3B8]">
                  <MapPin size={16} strokeWidth={2.5} />
                  <span className="text-sm" data-testid="church-location">{church.location}</span>
                </div>
                {church.service_times && (
                  <div className="flex items-center gap-2 mt-1 text-[#94A3B8]">
                    <Clock size={16} strokeWidth={2.5} />
                    <span className="text-sm" data-testid="church-service-times">{church.service_times}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {isOwner ? (
                  <button onClick={() => setEditing(true)} className="neo-button-outline flex items-center gap-2" data-testid="edit-church-button">
                    <Edit2 size={16} strokeWidth={2.5} /> Edit Church
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full border border-white/[0.08] font-bold transition-all ${
                      church.is_following ? 'bg-[#0A0A0A] text-white' : 'bg-[#3B82F6] hover:-translate-y-0.5'
                    }`}
                    data-testid="follow-church-button"
                  >
                    {church.is_following ? <><UserMinus size={20} strokeWidth={2.5} /> Unfollow</> : <><UserPlus size={20} strokeWidth={2.5} /> Follow</>}
                  </button>
                )}
              </div>
            </div>

            <p className="text-base leading-relaxed text-[#94A3B8] mb-6" data-testid="church-description">
              {church.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-[#0F172A] border border-white/[0.08] rounded-2xl">
              <div className="text-center cursor-pointer" onClick={() => setActiveTab('posts')}>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{church.posts_count || 0}</p>
                <p className="text-sm text-[#94A3B8]">Posts</p>
              </div>
              <div className="text-center cursor-pointer" onClick={() => setActiveTab('events')}>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{church.events_count || 0}</p>
                <p className="text-sm text-[#94A3B8]">Events</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{church.followers_count || 0}</p>
                <p className="text-sm text-[#94A3B8]">Followers</p>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded-full font-medium border border-white/[0.08] transition-all whitespace-nowrap ${activeTab === 'posts' ? 'bg-[#A855F7]' : 'bg-white/[0.04] hover:bg-white/[0.08]/[0.08]'}`}
          data-testid="church-posts-tab"
        >
          Posts ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-full font-medium border border-white/[0.08] transition-all whitespace-nowrap ${activeTab === 'events' ? 'bg-[#EC4899]' : 'bg-white/[0.04] hover:bg-white/[0.08]/[0.08]'}`}
          data-testid="church-events-tab"
        >
          <Calendar size={16} strokeWidth={2.5} className="inline mr-2" />
          Events ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-2 rounded-full font-medium border border-white/[0.08] transition-all whitespace-nowrap ${activeTab === 'about' ? 'bg-[#6366F1]' : 'bg-white/[0.04] hover:bg-white/[0.08]/[0.08]'}`}
          data-testid="church-about-tab"
        >
          About
        </button>
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {isOwner && (
            <button
              onClick={() => setShowCreatePost(true)}
              className="w-full p-4 bg-white/[0.04] border-2 border-dashed border-white/[0.08] rounded-xl text-[#94A3B8] hover:bg-[#A855F7]/10 hover:border-solid transition-all flex items-center justify-center gap-2 font-medium"
              data-testid="church-create-post-button"
            >
              <Plus size={20} strokeWidth={2.5} /> Create a Post
            </button>
          )}

          {posts.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.04] rounded-[20px] border border-white/[0.06]">
              <p className="text-[#94A3B8]">No posts yet.</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={user?._id}
                onLike={handleLike}
                showAuthor
                authorName={church.name}
                authorInitial={church.name?.charAt(0)}
              />
            ))
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {isOwner && (
            <button
              onClick={() => setShowCreateEvent(true)}
              className="w-full p-4 bg-white/[0.04] border-2 border-dashed border-white/[0.08] rounded-xl text-[#94A3B8] hover:bg-[#EC4899]/10 hover:border-solid transition-all flex items-center justify-center gap-2 font-medium"
              data-testid="church-create-event-button"
            >
              <Plus size={20} strokeWidth={2.5} /> Create an Event
            </button>
          )}

          {events.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.04] rounded-[20px] border border-white/[0.06]">
              <Calendar size={48} strokeWidth={2.5} className="mx-auto mb-4 text-[#94A3B8]" />
              <p className="text-[#94A3B8]">No events yet.</p>
            </div>
          ) : (
            events.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                showAction
                actionType={isOwner ? 'navigate' : 'rsvp'}
                onRegister={handleRegister}
              />
            ))
          )}
        </div>
      )}

      {/* About Tab */}
      {activeTab === 'about' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.04] rounded-[20px] bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] p-6 md:p-8"
          data-testid="church-about-section"
        >
          <h3 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            About {church.name}
          </h3>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wide mb-2 text-[#94A3B8]">Description</h4>
              <p className="text-base leading-relaxed">{church.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-[#3B82F6]/10 border border-white/[0.08] rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={20} strokeWidth={2.5} />
                  <h4 className="font-bold">Location</h4>
                </div>
                <p className="text-sm text-[#94A3B8]">{church.location}</p>
              </div>

              <div className="p-4 bg-[#EC4899]/10 border border-white/[0.08] rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={20} strokeWidth={2.5} />
                  <h4 className="font-bold">Service Times</h4>
                </div>
                <p className="text-sm text-[#94A3B8]">{church.service_times || 'Not specified'}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#A855F7]/10 border border-white/[0.08] rounded-2xl text-center">
                <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{church.posts_count || 0}</p>
                <p className="text-sm text-[#94A3B8]">Posts</p>
              </div>
              <div className="p-4 bg-[#6366F1]/10 border border-white/[0.08] rounded-2xl text-center">
                <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{church.events_count || 0}</p>
                <p className="text-sm text-[#94A3B8]">Events</p>
              </div>
              <div className="p-4 bg-[#3B82F6]/10 border border-white/[0.08] rounded-2xl text-center">
                <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{church.followers_count || 0}</p>
                <p className="text-sm text-[#94A3B8]">Followers</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="church-create-post-modal">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#1E293B] border border-white/[0.08] rounded-[24px] shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Post as {church.name}</h2>
              <button onClick={() => { setShowCreatePost(false); setPostContent(''); setMediaFile(null); setMediaPreview(null); }} className="text-[#94A3B8] hover:text-white" data-testid="close-post-modal">
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>
            <form onSubmit={handleCreatePost}>
              <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Share with your congregation..." className="neo-input w-full h-32 resize-none mb-4" required data-testid="church-post-content-input" />
              {mediaPreview && (
                <div className="mb-4 relative border border-white/[0.08] rounded-2xl overflow-hidden">
                  {mediaFile?.type.startsWith('video') ? <video src={mediaPreview} controls className="w-full" /> : <img src={mediaPreview} alt="Preview" className="w-full h-auto" />}
                  <button type="button" onClick={() => { setMediaFile(null); setMediaPreview(null); }} className="absolute top-2 right-2 bg-white/[0.04] border border-white/[0.08] rounded-full p-2"><X size={16} strokeWidth={2.5} /></button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="neo-button-outline flex items-center gap-2" data-testid="church-post-media-button">
                  <ImageIcon size={20} strokeWidth={2.5} /> Add Media
                </button>
                <button type="submit" disabled={uploading} className="neo-button-primary flex-1 flex items-center justify-center gap-2" data-testid="church-post-submit-button">
                  <Send size={20} strokeWidth={2.5} /> {uploading ? 'Posting...' : 'Share Post'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="church-create-event-modal">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#1E293B] border border-white/[0.08] rounded-[24px] shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Create Event for {church.name}</h2>
              <button onClick={() => { setShowCreateEvent(false); setEventForm({ title: '', description: '', date: '', location: '' }); }} className="text-[#94A3B8] hover:text-white" data-testid="close-event-modal">
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wide mb-2">Event Title</label>
                  <input type="text" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} className="neo-input w-full" required data-testid="church-event-title-input" />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wide mb-2">Date & Time</label>
                  <input type="datetime-local" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className="neo-input w-full" required data-testid="church-event-date-input" />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wide mb-2">Location</label>
                  <input type="text" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} className="neo-input w-full" required data-testid="church-event-location-input" />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wide mb-2">Description</label>
                  <textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} className="neo-input w-full h-24 resize-none" required data-testid="church-event-description-input" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowCreateEvent(false); setEventForm({ title: '', description: '', date: '', location: '' }); }} className="neo-button-outline flex-1" data-testid="cancel-church-event">Cancel</button>
                  <button type="submit" className="neo-button-primary flex-1" style={{ background: '#FFD800' }} data-testid="submit-church-event">Create Event</button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ChurchProfile;
