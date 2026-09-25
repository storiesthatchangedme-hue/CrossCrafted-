import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import api, { uploadConfig } from '@/lib/api';
import { motion } from 'framer-motion';
import { User, Mail, Edit2, Save, X, Heart, MessageCircle, UserPlus, UserMinus, Bookmark, Calendar, Camera, MapPin, Globe, ShieldCheck, Crown, Award, ShieldAlert, Ban, Flag, Music, Activity, Sparkles, Clock, Church } from 'lucide-react';
import { toast } from 'sonner';
import PostCard from '@/components/PostCard';
import EventCard from '@/components/EventCard';
import { INDIAN_STATES, LANGUAGES } from '@/constants/india';
import { MultiSelect } from '@/components/MultiSelect';
import { GRADIENTS } from '@/lib/constants';

const FollowList = ({ users, loading, emptyText, currentUserId, onFollow, onUnfollow, navigate }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 border-2 border-[#A855F7] border-r-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12 bg-white/[0.02] rounded-2xl border border-white/[0.06]" data-testid="follow-list-empty">
        <User size={36} className="mx-auto mb-3 text-[#334155]" />
        <p className="text-[#64748B] text-sm font-medium">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2" data-testid="follow-list">
      {users.map((u, i) => (
        <motion.div
          key={u._id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all cursor-pointer"
          onClick={() => navigate(`/app/profile/${u._id}`)}
          data-testid="follow-list-user"
        >
          <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-white/[0.1]"
            style={!u.profile_image ? { background: GRADIENTS[i % GRADIENTS.length] } : {}}>
            {u.profile_image
              ? <img src={u.profile_image} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">{u.name?.charAt(0)}</div>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-white truncate">{u.name}</p>
              {u.is_verified && u.role === 'admin' ? (
                <Crown size={14} strokeWidth={2.5} className="shrink-0" style={{ color: '#FFFBEB', fill: '#F59E0B' }} data-testid="admin-crown-badge" />
              ) : u.is_verified ? (
                <ShieldCheck size={14} strokeWidth={2.5} className="shrink-0" style={{ color: 'white', fill: '#3B82F6' }} data-testid="verified-badge" />
              ) : null}
            </div>
            <p className="text-xs text-[#64748B] truncate">@{u.username}{u.bio ? ` · ${u.bio}` : ''}</p>
          </div>
          {u._id !== currentUserId && (
            <button
              onClick={(e) => { e.stopPropagation(); u.is_following ? onUnfollow(u._id) : onFollow(u._id); }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border shrink-0 ${
                u.is_following
                  ? 'bg-white/[0.06] border-white/[0.1] text-[#94A3B8] hover:text-red-400 hover:border-red-400/30'
                  : 'bg-[#A855F7]/15 border-[#A855F7]/30 text-[#A855F7] hover:bg-[#A855F7]/25'
              }`}
              data-testid={u.is_following ? 'unfollow-btn' : 'follow-btn'}
            >
              {u.is_following ? 'Following' : 'Follow'}
            </button>
          )}
        </motion.div>
      ))}
    </div>
  );
};

const UserProfile = () => {
  const { user: currentUser, checkAuth } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [userEvents, setUserEvents] = useState({ created: [], attending: [] });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    state: '',
    city: '',
    languages: [],
    allow_dms: true,
    worship_songs: '',
    ministries: '',
    testimony_milestone: '',
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('harassment');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const fileInputRef = useRef(null);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [creatingPost, setCreatingPost] = useState(false);
  const postFileInputRef = useRef(null);

  const handlePostImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onload = () => setPostImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }
    setCreatingPost(true);
    try {
      let imageUrl = '';
      if (postImage) {
        const fData = new FormData();
        fData.append('file', postImage);
        const uploadResponse = await api.post('/api/upload', fData, uploadConfig());
        imageUrl = uploadResponse.data.url || uploadResponse.data.path || '';
      }

      await api.post('/api/posts', {
        content_text: postContent,
        image_url: imageUrl,
      });

      toast.success('Post created successfully!');
      setPostContent('');
      setPostImage(null);
      setPostImagePreview(null);
      fetchUserPosts(currentUser?._id);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create post');
    } finally {
      setCreatingPost(false);
    }
  };

  const isOwnProfile = !userId || userId === currentUser?._id;
  const displayUser = isOwnProfile ? currentUser : profileUser;

  const fetchUserPosts = useCallback(async (uid) => {
    try {
      const { data } = await api.get('/api/users/${uid}/posts');
      setUserPosts(data);
    } catch (_) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSavedPosts = useCallback(async (uid) => {
    try {
      const { data } = await api.get('/api/users/${uid}/saved');
      setSavedPosts(data);
    } catch (_) { /* saved posts non-critical */ }
  }, []);

  const fetchUserEvents = useCallback(async (uid) => {
    try {
      const { data } = await api.get('/api/users/${uid}/events');
      setUserEvents(data);
    } catch (_) { /* events non-critical */ }
  }, []);

  const fetchFollowers = useCallback(async (uid) => {
    setLoadingFollow(true);
    try {
      const { data } = await api.get('/api/users/${uid}/followers');
      setFollowersList(data.users);
    } catch (_) {}
    finally { setLoadingFollow(false); }
  }, []);

  const fetchFollowing = useCallback(async (uid) => {
    setLoadingFollow(true);
    try {
      const { data } = await api.get('/api/users/${uid}/following-list');
      setFollowingList(data.users);
    } catch (_) {}
    finally { setLoadingFollow(false); }
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/api/users/${userId}');
      setProfileUser(data);
      fetchUserPosts(userId);
    } catch (_) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId, fetchUserPosts]);

  useEffect(() => {
    if (isOwnProfile) {
      setProfileUser(currentUser);
      setFormData({
        name: currentUser?.name || '',
        bio: currentUser?.bio || '',
        state: currentUser?.state || '',
        city: currentUser?.city || '',
        languages: currentUser?.languages || [],
        allow_dms: currentUser?.allow_dms !== false,
        worship_songs: currentUser?.worship_songs || '',
        ministries: currentUser?.ministries || '',
        testimony_milestone: currentUser?.testimony_milestone || '',
      });
      fetchUserPosts(currentUser?._id);
      fetchSavedPosts(currentUser?._id);
      fetchUserEvents(currentUser?._id);
    } else {
      fetchUserProfile();
    }
  }, [userId, currentUser, isOwnProfile, fetchUserPosts, fetchSavedPosts, fetchUserEvents, fetchUserProfile]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await api.post('/api/upload', formData, uploadConfig());

      await api.put(
        '/api/users/me',
        { profile_image: uploadResponse.data.url }
      );

      toast.success('Profile image updated!');
      await checkAuth();
    } catch (_) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBlock = async () => {
    const action = profileUser?.is_blocked ? 'unblock' : 'block';
    const confirmMsg = action === 'block' 
      ? `Are you sure you want to block ${profileUser?.name || 'this user'}? You will not be able to message each other, and they will be hidden from your matches.` 
      : `Are you sure you want to unblock ${profileUser?.name || 'this user'}?`;
      
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.post('/api/users/${userId}/${action}', {});
      toast.success(action === 'block' ? 'User blocked successfully' : 'User unblocked successfully');
      fetchUserProfile();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed');
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportDetails.trim()) {
      toast.error('Please provide some details for your report');
      return;
    }
    setSubmittingReport(true);
    try {
      await api.post('/api/reports', {
        target_type: 'user',
        target_id: userId,
        reason: reportReason,
        details: reportDetails
      });
      toast.success('Thank you. Your safety report has been submitted to administrators for review.');
      setShowReportModal(false);
      setReportDetails('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/users/me', formData);
      toast.success('Profile updated!');
      setEditing(false);
      await checkAuth();
    } catch (_) {
      toast.error('Failed to update profile');
    }
  };

  const handleFollow = async () => {
    try {
      if (profileUser.is_following) {
        await api.delete('/api/users/${userId}/follow');
        toast.success('Unfollowed');
      } else {
        await api.post('/api/users/${userId}/follow', {});
        toast.success('Following!');
      }
      fetchUserProfile();
    } catch (_) {
      toast.error('Action failed');
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      if (isLiked) {
        await api.delete('/api/posts/${postId}/like');
      } else {
        await api.post('/api/posts/${postId}/like', {});
      }
      fetchUserPosts(displayUser?._id);
    } catch (_) {
      toast.error('Like failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#80C4E9] border-r-transparent"></div>
          <p className="mt-4 text-white font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-container px-3 md:px-4 py-4 md:py-6" data-testid="profile-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.04] rounded-2xl backdrop-blur-sm border border-white/[0.06] p-5 md:p-8 mb-5"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              {displayUser?.profile_image ? (
                <img
                  src={displayUser.profile_image}
                  alt={displayUser.name}
                  className="w-[72px] h-[72px] md:w-20 md:h-20 rounded-full border-2 border-white/[0.08] object-cover"
                />
              ) : (
                <div className="w-[72px] h-[72px] md:w-20 md:h-20 rounded-full bg-[#6366F1] border-2 border-white/[0.08] flex items-center justify-center text-2xl md:text-3xl font-bold">
                  {displayUser?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              {isOwnProfile && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-[#A855F7] border border-white/[0.08] rounded-full flex items-center justify-center hover:bg-[#EC4899] transition-colors"
                    data-testid="upload-image-button"
                  >
                    <Camera size={16} strokeWidth={2.5} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {displayUser?.name}
                </h1>
                {displayUser?.is_verified && displayUser?.role === 'admin' ? (
                  <Crown size={22} strokeWidth={2.5} className="shrink-0" style={{ color: '#FFFBEB', fill: '#F59E0B' }} data-testid="admin-crown-badge" />
                ) : displayUser?.is_verified ? (
                  <ShieldCheck size={22} strokeWidth={2.5} className="shrink-0" style={{ color: 'white', fill: '#3B82F6' }} data-testid="verified-badge" />
                ) : null}
              </div>
              <p className="text-sm md:text-base text-[#94A3B8] truncate">@{displayUser?.username}</p>
              {!isOwnProfile && (
                <div className="flex items-center gap-2 mt-1">
                  <Mail size={16} strokeWidth={2.5} className="text-[#94A3B8]" />
                  <span className="text-sm text-[#94A3B8]">{displayUser?.email}</span>
                </div>
              )}
              <div className="mt-2">
                <span className="inline-block px-3 py-1 bg-[#EC4899] border border-white/[0.08] rounded-full text-sm font-bold capitalize">
                  {displayUser?.role || 'user'}
                </span>
              </div>
            </div>
          </div>
          {isOwnProfile ? (
            !editing && (
              <button
                onClick={() => {
                  setEditing(true);
                  setFormData({ 
                    name: displayUser?.name || '', 
                    bio: displayUser?.bio || '', 
                    state: displayUser?.state || '', 
                    city: displayUser?.city || '', 
                    languages: displayUser?.languages || [],
                    allow_dms: displayUser?.allow_dms !== false,
                    worship_songs: displayUser?.worship_songs || '',
                    ministries: displayUser?.ministries || '',
                    testimony_milestone: displayUser?.testimony_milestone || ''
                  });
                }}
                className="neo-button-outline flex items-center gap-2"
                data-testid="edit-profile-button"
              >
                <Edit2 size={16} strokeWidth={2.5} />
                Edit Profile
              </button>
            )
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {profileUser?.has_blocked_me ? (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm font-bold text-center">
                  This user's profile is unavailable.
                </div>
              ) : (
                <>
                  {profileUser?.is_blocked && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm font-bold text-center">
                      You have blocked this user. Unblock them to follow or message them.
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    {!profileUser?.is_blocked && (
                      <>
                        <button
                          onClick={handleFollow}
                          className={`flex items-center gap-2 px-6 py-3 rounded-full border border-white/[0.08] font-bold transition-all ${
                            profileUser?.is_following
                              ? 'bg-[#0A0A0A] text-white'
                              : 'bg-[#3B82F6] hover:-translate-y-0.5'
                          }`}
                          data-testid="follow-button"
                        >
                          {profileUser?.is_following ? (
                            <>
                              <UserMinus size={20} strokeWidth={2.5} />
                              Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus size={20} strokeWidth={2.5} />
                              Follow
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={async () => {
                            if (profileUser?.allow_dms === false) {
                              toast.error('This user has disabled direct messaging');
                              return;
                            }
                            try {
                              const { data } = await api.post('/api/conversations', { user_id: userId });
                              navigate(`/app/messages/${data.conversation_id}`);
                            } catch (err) { 
                              toast.error(err.response?.data?.detail || 'Failed to start conversation'); 
                            }
                          }}
                          disabled={profileUser?.allow_dms === false}
                          className={`flex items-center gap-2 px-5 py-3 rounded-full border border-white/[0.08] font-bold transition-all ${
                            profileUser?.allow_dms === false
                              ? 'bg-white/[0.02] text-[#64748B] cursor-not-allowed'
                              : 'bg-white/[0.06] text-[#CBD5E1] hover:bg-white/[0.1]'
                          }`}
                          data-testid="message-user-btn"
                          title={profileUser?.allow_dms === false ? "DMs disabled by user" : "Send direct message"}
                        >
                          <MessageCircle size={18} strokeWidth={2.5} /> Message
                        </button>
                      </>
                    )}

                    <button
                      onClick={handleBlock}
                      className="flex items-center gap-2 px-5 py-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold hover:bg-rose-500/20 transition-all"
                      data-testid="block-user-btn"
                    >
                      <Ban size={18} strokeWidth={2.5} /> {profileUser?.is_blocked ? 'Unblock' : 'Block'}
                    </button>

                    <button
                      onClick={() => setShowReportModal(true)}
                      className="flex items-center gap-2 px-5 py-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold hover:bg-amber-500/20 transition-all"
                      data-testid="report-user-btn"
                    >
                      <Flag size={18} strokeWidth={2.5} /> Report
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} data-testid="profile-edit-form">
            <div className="mb-4">
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="neo-input w-full"
                required
                data-testid="profile-name-input"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="neo-input w-full h-24 resize-none"
                placeholder="Tell us about yourself..."
                data-testid="profile-bio-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                  <MapPin size={12} className="inline mr-1" />State
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="neo-input w-full"
                  data-testid="profile-state-select"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                  <MapPin size={12} className="inline mr-1" />City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="neo-input w-full"
                  placeholder="Your city"
                  data-testid="profile-city-input"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                <Globe size={12} className="inline mr-1" />Languages
              </label>
              <MultiSelect
                options={LANGUAGES}
                value={formData.languages}
                onChange={(langs) => setFormData({ ...formData, languages: langs })}
                placeholder="Select languages"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                <Church size={12} className="inline mr-1 text-amber-400" /> Ministries Involved (comma separated)
              </label>
              <input
                type="text"
                value={formData.ministries}
                onChange={(e) => setFormData({ ...formData, ministries: e.target.value })}
                className="neo-input w-full text-xs"
                placeholder="e.g. Worship Team, Small Group Leader, Sunday School Teacher"
                data-testid="profile-ministries-input"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                <Music size={12} className="inline mr-1 text-[#EC4899]" /> Favorite Worship Songs (comma separated)
              </label>
              <input
                type="text"
                value={formData.worship_songs}
                onChange={(e) => setFormData({ ...formData, worship_songs: e.target.value })}
                className="neo-input w-full text-xs"
                placeholder="e.g. Goodness of God, Yet Not I But Through Christ In Me, Way Maker"
                data-testid="profile-songs-input"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                <Activity size={12} className="inline mr-1 text-[#3B82F6]" /> Testimony / Faith Journey Milestone
              </label>
              <input
                type="text"
                value={formData.testimony_milestone}
                onChange={(e) => setFormData({ ...formData, testimony_milestone: e.target.value })}
                className="neo-input w-full text-xs"
                placeholder="e.g. Accepted Christ in youth retreat, baptized at Bangalore Assembly in 2020"
                data-testid="profile-testimony-input"
              />
            </div>
            <div className="mb-6 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-white mb-0.5">
                  Allow Direct Messages (DMs)
                </label>
                <p className="text-xs text-[#64748B]">
                  Toggle whether other users can message you directly.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.allow_dms !== false}
                onChange={(e) => setFormData({ ...formData, allow_dms: e.target.checked })}
                className="w-5 h-5 rounded border-white/[0.08] bg-transparent text-[#80C4E9] focus:ring-0 cursor-pointer"
                data-testid="profile-allow-dms-checkbox"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="neo-button-outline flex items-center gap-2"
                data-testid="cancel-edit-button"
              >
                <X size={16} strokeWidth={2.5} />
                Cancel
              </button>
              <button
                type="submit"
                className="neo-button-primary flex items-center gap-2"
                style={{ background: '#80C4E9' }}
                data-testid="save-profile-button"
              >
                <Save size={16} strokeWidth={2.5} />
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Bio</h3>
              <p className="text-sm md:text-base leading-relaxed text-[#94A3B8] line-clamp-4" data-testid="profile-bio-display">
                {displayUser?.bio || 'No bio added yet.'}
              </p>
            </div>

            {(displayUser?.state || displayUser?.city) && (
              <div className="mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Location</h3>
                <p className="text-sm md:text-base text-[#94A3B8] flex items-center gap-1.5" data-testid="profile-location-display">
                  <MapPin size={14} className="text-[#A855F7] shrink-0" />
                  {displayUser.city ? `${displayUser.city}, ` : ''}{displayUser.state}
                </p>
              </div>
            )}

            {displayUser?.languages?.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Languages</h3>
                <div className="flex flex-wrap gap-1.5" data-testid="profile-languages-display">
                  {displayUser.languages.map(l => (
                    <span key={l} className="px-2.5 py-1 bg-[#A855F7]/10 text-[#A855F7] rounded-lg text-xs font-medium">{l}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Spiritual Alignment & Fellowship Goals Section */}
            <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl" id="spiritual-fellowship-profile">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5 flex items-center gap-1.5">
                  <Church size={12} className="text-amber-400" /> Spiritual Alignment
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {displayUser?.denomination && <li className="flex items-center gap-2">⛪ <span className="text-slate-400 font-medium">Denomination:</span> <strong className="text-slate-200">{displayUser.denomination}</strong></li>}
                  {displayUser?.church_name && <li className="flex items-center gap-2">💒 <span className="text-slate-400 font-medium">Home Church:</span> <strong className="text-slate-200">{displayUser.church_name}</strong></li>}
                  {displayUser?.baptized && <li className="flex items-center gap-2">💧 <span className="text-slate-400 font-medium">Baptized:</span> <strong className="text-slate-200">{displayUser.baptized}</strong></li>}
                  {displayUser?.church_attendance && <li className="flex items-center gap-2">📅 <span className="text-slate-400 font-medium">Attendance:</span> <strong className="text-slate-200">{displayUser.church_attendance}</strong></li>}
                  {displayUser?.age && <li className="flex items-center gap-2">🎂 <span className="text-slate-400 font-medium">Age:</span> <strong className="text-slate-200">{displayUser.age}</strong></li>}
                  {displayUser?.gender && <li className="flex items-center gap-2">👥 <span className="text-slate-400 font-medium">Gender:</span> <strong className="text-slate-200">{displayUser.gender}</strong></li>}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#A855F7] mb-2.5 flex items-center gap-1.5">
                  <Heart size={12} className="text-[#A855F7]" /> Fellowship Goals
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {displayUser?.looking_for && displayUser.looking_for.length > 0 ? (
                    displayUser.looking_for.map(goal => (
                      <span key={goal} className="px-2.5 py-1 bg-[#A855F7]/10 text-[#A855F7] border border-[#A855F7]/20 rounded-lg text-[10px] font-extrabold tracking-wide uppercase">
                        {goal}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic text-[11px]">No fellowship goals set yet</span>
                  )}
                </div>
                
                {displayUser?.favorite_verse && (
                  <div className="mt-4 p-3 bg-slate-950/40 rounded-xl border border-white/[0.04] relative">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 block mb-1">Favorite Scripture</span>
                    <p className="text-[11px] font-bold italic text-slate-200 leading-relaxed">"{displayUser.favorite_verse}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Spiritual Profile Enhancements Block */}
            <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-4" id="spiritual-enhancements-block">
              {/* Faith Journey Timeline */}
              <div className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-1.5">
                    <Activity size={12} className="text-amber-400" /> Faith Journey Timeline
                  </h4>
                  
                  <div className="space-y-4 relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                    {/* Acceptance */}
                    <div className="relative">
                      <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-400">Decision of Faith</p>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed mt-0.5">
                        {displayUser?.testimony_milestone || "Accepted Christ & decided to live fully for Him."}
                      </p>
                    </div>

                    {/* Baptism */}
                    <div className="relative">
                      <div className={`absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full ring-4 ${displayUser?.baptized === 'Yes' ? 'bg-[#3B82F6]' : displayUser?.baptized === 'Exploring' ? 'bg-amber-400' : 'bg-slate-500'}`} style={displayUser?.baptized === 'Yes' ? { boxShadow: '0 0 12px #3B82F630' } : {}} />
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Water Baptism</p>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed mt-0.5">
                        {displayUser?.baptized === 'Yes' 
                          ? `💧 Water Baptism: Walked in public confession of faith.` 
                          : displayUser?.baptized === 'Exploring' 
                            ? `🌱 Seeking Baptism: Actively exploring spiritual depths.`
                            : `🌿 Learning and seeking truth daily.`}
                      </p>
                    </div>

                    {/* Church Fellowship */}
                    {displayUser?.church_name && (
                      <div className="relative">
                        <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-400">Home Church Fellowship</p>
                        <p className="text-xs text-slate-300 font-medium leading-relaxed mt-0.5">
                          ⛪ Regular fellowship & growing in grace at {displayUser.church_name}.
                        </p>
                      </div>
                    )}

                    {/* CrossCrafted */}
                    <div className="relative">
                      <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-[#A855F7] ring-4 ring-[#A855F7]/20 animate-pulse" />
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#A855F7]">CrossCrafted Community</p>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed mt-0.5">
                        🤝 Connected with believers in {displayUser?.state || 'India'} through CrossCrafted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Worship Songs & Ministries */}
              <div className="space-y-4">
                {/* Favorite Worship Songs */}
                <div className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#EC4899] mb-3 flex items-center gap-1.5">
                    <Music size={12} className="text-[#EC4899]" /> Favorite Worship Songs
                  </h4>
                  <div className="space-y-2">
                    {(displayUser?.worship_songs || "Goodness of God, Yet Not I But Through Christ In Me, Way Maker")
                      .split(',')
                      .map((song, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-950/40 border border-white/[0.03] rounded-xl hover:bg-slate-950/60 transition-all">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-[#EC4899]/10 border border-[#EC4899]/20 flex items-center justify-center text-[#EC4899] shrink-0 font-bold text-[9px]">
                              0{idx+1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-white truncate leading-tight">{song.trim()}</p>
                              <p className="text-[9px] text-[#64748B] font-medium leading-none mt-0.5">Anchoring Worship Melody</p>
                            </div>
                          </div>
                          <button className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-[#EC4899]/20 hover:text-[#EC4899] transition-colors shrink-0">
                            <Music size={9} />
                          </button>
                        </div>
                    ))}
                  </div>
                </div>

                {/* Ministries Involved */}
                <div className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#3B82F6] mb-3 flex items-center gap-1.5">
                    <Church size={12} className="text-[#3B82F6]" /> Active Ministries
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(displayUser?.ministries || "Worship Team, Intercessory Prayer, Youth Fellowship")
                      .split(',')
                      .map((ministry, idx) => (
                        <span key={idx} className="px-2.5 py-1.5 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-xl text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                          <Sparkles size={9} className="text-[#3B82F6]" /> {ministry.trim()}
                        </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Interests & Hobbies Tags */}
            {displayUser?.interests && displayUser.interests.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">Interests & Spiritual Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {displayUser.interests.map(interest => (
                    <span key={interest} className="px-2.5 py-1 bg-white/[0.03] text-slate-300 border border-white/[0.06] rounded-xl text-xs font-bold">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Trivia Points Banner */}
            {displayUser?.trivia_points > 0 && (
              <div className="mb-4 bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400">
                    <Award size={16} />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-amber-400 block">Bible Scholar Rank</span>
                    <span className="text-xs font-extrabold text-white">
                      {displayUser.trivia_points >= 300 ? 'Theology Scholar' : displayUser.trivia_points >= 150 ? 'Bible Teacher' : displayUser.trivia_points >= 50 ? 'Spiritual Disciple' : 'Faith Seeker'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-amber-400 block">{displayUser.trivia_points} Points</span>
                  {displayUser.trivia_stats && (
                    <span className="text-[9px] text-[#64748B] block">
                      Accuracy: {Math.round((displayUser.trivia_stats.totalCorrect / Math.max(1, displayUser.trivia_stats.totalAttempted)) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 p-3 md:p-4 bg-[#0F172A] border border-white/[0.08] rounded-2xl">
              <div className="text-center cursor-pointer" onClick={() => setActiveTab('posts')}>
                <p className="text-xl md:text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {displayUser?.posts_count || userPosts.length}
                </p>
                <p className="text-xs md:text-sm text-[#94A3B8]">Posts</p>
              </div>
              <div className="text-center cursor-pointer" onClick={() => { setActiveTab('followers'); fetchFollowers(displayUser?._id || currentUser?._id); }}>
                <p className="text-xl md:text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {displayUser?.followers_count || 0}
                </p>
                <p className="text-xs md:text-sm text-[#94A3B8]">Followers</p>
              </div>
              <div className="text-center cursor-pointer" onClick={() => { setActiveTab('following'); fetchFollowing(displayUser?._id || currentUser?._id); }}>
                <p className="text-xl md:text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {displayUser?.following_count || 0}
                </p>
                <p className="text-xs md:text-sm text-[#94A3B8]">Following</p>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-3.5 py-2 rounded-full text-[13px] font-semibold border border-white/[0.08] transition-all whitespace-nowrap ${
            activeTab === 'posts' ? 'bg-[#A855F7] text-white' : 'bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08]'
          }`}
          data-testid="posts-tab"
        >
          Posts ({userPosts.length})
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3.5 py-2 rounded-full text-[13px] font-semibold border border-white/[0.08] transition-all whitespace-nowrap ${
              activeTab === 'saved' ? 'bg-[#3B82F6] text-white' : 'bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08]'
            }`}
            data-testid="saved-tab"
          >
            <Bookmark size={14} strokeWidth={2.5} className="inline mr-1" />
            Saved ({savedPosts.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('events')}
          className={`px-3.5 py-2 rounded-full text-[13px] font-semibold border border-white/[0.08] transition-all whitespace-nowrap ${
            activeTab === 'events' ? 'bg-[#EC4899] text-white' : 'bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08]'
          }`}
          data-testid="events-tab"
        >
          <Calendar size={14} strokeWidth={2.5} className="inline mr-1" />
          Events ({(userEvents.created?.length || 0) + (userEvents.attending?.length || 0)})
        </button>
        <button
          onClick={() => { setActiveTab('followers'); fetchFollowers(displayUser?._id || currentUser?._id); }}
          className={`px-3.5 py-2 rounded-full text-[13px] font-semibold border border-white/[0.08] transition-all whitespace-nowrap ${
            activeTab === 'followers' ? 'bg-[#6366F1] text-white' : 'bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08]'
          }`}
          data-testid="followers-tab"
        >
          Followers ({displayUser?.followers_count || 0})
        </button>
        <button
          onClick={() => { setActiveTab('following'); fetchFollowing(displayUser?._id || currentUser?._id); }}
          className={`px-3.5 py-2 rounded-full text-[13px] font-semibold border border-white/[0.08] transition-all whitespace-nowrap ${
            activeTab === 'following' ? 'bg-white/[0.15] text-white' : 'bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08]'
          }`}
          data-testid="following-tab"
        >
          Following ({displayUser?.following_count || 0})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'posts' && (
        <div className="space-y-3">
          {isOwnProfile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.04] rounded-2xl border border-white/[0.06] p-4 md:p-5 mb-5"
              data-testid="create-post-card"
            >
              <form onSubmit={handleCreatePost}>
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#6366F1] shrink-0 border border-white/[0.08] flex items-center justify-center font-bold text-sm">
                    {currentUser?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="What's on your mind? Share a thought or testimony..."
                      className="w-full bg-transparent border-0 p-0 text-[15px] text-[#E2E8F0] placeholder-[#64748B] focus:ring-0 resize-none min-h-[80px]"
                      data-testid="create-post-textarea"
                    />
                  </div>
                </div>

                {postImagePreview && (
                  <div className="relative mb-4 rounded-xl overflow-hidden border border-white/[0.08] max-h-[300px]">
                    <img src={postImagePreview} alt="Selected preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPostImage(null);
                        setPostImagePreview(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                      data-testid="remove-post-image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <button
                    type="button"
                    onClick={() => postFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-xs font-semibold text-[#CBD5E1] transition-all"
                    data-testid="add-post-image-btn"
                  >
                    <Camera size={14} className="text-[#A855F7]" />
                    <span>Add Photo</span>
                  </button>
                  <input
                    ref={postFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePostImageSelect}
                    className="hidden"
                  />

                  <button
                    type="submit"
                    disabled={creatingPost || !postContent.trim()}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      postContent.trim()
                        ? 'bg-[#A855F7] text-white hover:bg-[#8B5CF6] hover:-translate-y-0.5'
                        : 'bg-white/[0.02] text-[#64748B] border border-white/[0.06] cursor-not-allowed'
                    }`}
                    data-testid="submit-post-btn"
                  >
                    {creatingPost ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {userPosts.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.04] rounded-2xl border border-white/[0.06]">
              <p className="text-[#94A3B8] text-sm">No posts yet.</p>
            </div>
          ) : (
            userPosts.map((post) => (
              <PostCard key={post._id} post={post} currentUserId={currentUser?._id} onLike={handleLike} />
            ))
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-3">
          {savedPosts.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.04] rounded-2xl border border-white/[0.06]">
              <Bookmark size={40} strokeWidth={2} className="mx-auto mb-3 text-[#475569]" />
              <p className="text-[#94A3B8] text-sm">No saved posts yet.</p>
            </div>
          ) : (
            savedPosts.map((post) => (
              <PostCard key={post._id} post={post} currentUserId={currentUser?._id} onLike={handleLike} showAuthor authorName={post.user_name} authorInitial={post.user_name?.charAt(0)} authorUsername={post.user_username} />
            ))
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-4">
          {userEvents.created && userEvents.created.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>Created Events</h3>
              <div className="space-y-3">
                {userEvents.created.map((event) => (
                  <EventCard key={event._id} event={event} showAction={false} badge={{ label: 'Created', color: 'bg-[#EC4899]' }} />
                ))}
              </div>
            </div>
          )}

          {userEvents.attending && userEvents.attending.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>Attending Events</h3>
              <div className="space-y-3">
                {userEvents.attending.map((event) => (
                  <EventCard key={event._id} event={event} showAction={false} badge={{ label: 'Attending', color: 'bg-[#3B82F6]' }} />
                ))}
              </div>
            </div>
          )}

          {(!userEvents.created || userEvents.created.length === 0) && 
           (!userEvents.attending || userEvents.attending.length === 0) && (
            <div className="text-center py-12 bg-white/[0.04] rounded-2xl border border-white/[0.06]">
              <Calendar size={40} strokeWidth={2} className="mx-auto mb-3 text-[#475569]" />
              <p className="text-[#94A3B8] text-sm">No events yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'followers' && (
        <FollowList
          users={followersList}
          loading={loadingFollow}
          emptyText="No followers yet"
          currentUserId={currentUser?._id}
          onFollow={async (uid) => {
            try {
              await api.post('/api/users/${uid}/follow', {});
              toast.success('Following!');
              fetchFollowers(displayUser?._id || currentUser?._id);
            } catch (_) { toast.error('Failed'); }
          }}
          onUnfollow={async (uid) => {
            try {
              await api.delete('/api/users/${uid}/follow');
              toast.success('Unfollowed');
              fetchFollowers(displayUser?._id || currentUser?._id);
            } catch (_) { toast.error('Failed'); }
          }}
          navigate={navigate}
        />
      )}

      {activeTab === 'following' && (
        <FollowList
          users={followingList}
          loading={loadingFollow}
          emptyText="Not following anyone yet"
          currentUserId={currentUser?._id}
          onFollow={async (uid) => {
            try {
              await api.post('/api/users/${uid}/follow', {});
              toast.success('Following!');
              fetchFollowing(displayUser?._id || currentUser?._id);
            } catch (_) { toast.error('Failed'); }
          }}
          onUnfollow={async (uid) => {
            try {
              await api.delete('/api/users/${uid}/follow');
              toast.success('Unfollowed');
              fetchFollowing(displayUser?._id || currentUser?._id);
            } catch (_) { toast.error('Failed'); }
          }}
          navigate={navigate}
        />
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" data-testid="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
          <div className="bg-[#121212] border border-white/[0.08] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <ShieldAlert className="text-amber-500" size={20} />
                Report User
              </h3>
              <button 
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.04] transition-all"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                  Why are you reporting this user?
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="neo-input w-full"
                  data-testid="report-reason-select"
                >
                  <option value="harassment">Harassment or abusive messaging</option>
                  <option value="spam">Spam or unwanted advertising</option>
                  <option value="impersonation">Impersonation or fake account</option>
                  <option value="inappropriate_content">Inappropriate profile photos or details</option>
                  <option value="other">Other safety concern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                  Details / Evidence
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="neo-input w-full h-32 resize-none"
                  placeholder="Please describe what happened. If they sent harassing messages, mention it here. Our admins will investigate immediately."
                  required
                  data-testid="report-details-input"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="neo-button-outline w-1/2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="neo-button-primary w-1/2 flex items-center justify-center gap-2"
                  style={{ background: '#F59E0B', border: 'none' }}
                  data-testid="submit-report-btn"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
