import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { User, Mail, Edit2, Save, X, MapPin, Globe, Heart, Church, ShieldCheck, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_STATES, LANGUAGES } from '@/constants/india';
import { MultiSelect } from '@/components/MultiSelect';


const Profile = () => {
  const { user, checkAuth } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    state: user?.state || '',
    city: user?.city || '',
    languages: user?.languages || [],
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/users/me', formData);
      toast.success('Profile updated!');
      setEditing(false);
      await checkAuth();
    } catch (_) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[640px] mx-auto px-4 py-6" data-testid="profile-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#111827] border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.3)] rounded-3xl p-6 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/10 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] border-2 border-white/[0.1] shadow-lg flex items-center justify-center text-2xl font-black text-white">
              {user?.profile_image ? <img src={user.profile_image} alt={`${user?.name || 'Your'} profile picture`} className="w-full h-full rounded-2xl object-cover" /> : user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-black flex items-center gap-2 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {user?.name}
                {user?.is_verified && (
                  <ShieldCheck size={16} strokeWidth={2.5} className="text-[#3B82F6] drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" title="Verified Account" />
                )}
              </h1>
              <p className="text-sm text-[#94A3B8] font-medium">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 bg-[#7C3AED]/15 text-[#7C3AED] border border-[#7C3AED]/30 rounded-lg text-[10px] font-black uppercase tracking-widest">{user?.role || 'user'}</span>
                {user?.state && <span className="flex items-center gap-1 text-[11px] font-bold text-[#94A3B8]"><MapPin size={10} className="text-[#38BDF8]" /> {user.city ? `${user.city}, ` : ''}{user.state}</span>}
              </div>
            </div>
          </div>
          {!editing && (
            <button onClick={() => { setEditing(true); setFormData({ name: user?.name || '', bio: user?.bio || '', state: user?.state || '', city: user?.city || '', languages: user?.languages || [] }); }}
              className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs font-bold hover:bg-[#1F2937] hover:border-[#38BDF8]/30 transition-all shadow-sm text-white" data-testid="edit-profile-button">
              <Edit2 size={14} strokeWidth={2.5} className="text-[#38BDF8]" /> Edit
            </button>
          )}
        </div>

        {/* ── Trust & Safety Module ── */}
        <div className="flex items-center gap-4 mb-6 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-[10px] font-bold text-[#94A3B8] relative z-10 uppercase tracking-widest overflow-hidden">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-[#10B981]" />
            <span className="text-white">Safety Verified</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-[#7C3AED]" />
            <span>Member since {new Date(user?.created_at || Date.now()).getFullYear()}</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-[#38BDF8]" />
            <span>Responds quickly</span>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} data-testid="profile-edit-form" className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-1.5 text-[#38BDF8]">Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="neo-input w-full bg-[#1F2937] border-white/[0.1] text-white" required data-testid="profile-name-input" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-1.5 text-[#38BDF8]">Bio</label>
              <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="neo-input w-full h-20 resize-none bg-[#1F2937] border-white/[0.1] text-white" placeholder="Tell us about yourself..." data-testid="profile-bio-input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-1.5 text-[#38BDF8]"><MapPin size={10} className="inline mr-1" />State</label>
                <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="neo-input w-full bg-[#1F2937] border-white/[0.1] text-white" data-testid="profile-state-select">
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-1.5 text-[#38BDF8]"><MapPin size={10} className="inline mr-1" />City</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="neo-input w-full bg-[#1F2937] border-white/[0.1] text-white" placeholder="Your city" data-testid="profile-city-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-1.5 text-[#38BDF8]"><Globe size={10} className="inline mr-1" />Languages</label>
              <MultiSelect options={LANGUAGES} value={formData.languages} onChange={(langs) => setFormData({ ...formData, languages: langs })} placeholder="Select languages" />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setEditing(false)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm font-bold text-white hover:bg-white/[0.1] transition-all flex-1" data-testid="cancel-edit-button">
                <X size={16} strokeWidth={2.5} /> Cancel
              </button>
              <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_15px_rgba(124,58,237,0.3)] flex-1" style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }} data-testid="save-profile-button">
                <Save size={16} strokeWidth={2.5} /> {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 relative z-10">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-1.5">Bio</h3>
              <p className="text-sm leading-relaxed text-[#CBD5E1] font-medium" data-testid="profile-bio-display">{user?.bio || 'No bio added yet.'}</p>
            </div>

            {user?.languages?.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-2">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {user.languages.map(l => (
                    <span key={l} className="px-3 py-1 bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 rounded-lg text-xs font-bold">{l}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Spiritual Alignment & Fellowship Goals Section */}
            <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#1F2937] border border-white/[0.06] p-5 rounded-2xl shadow-inner" id="my-spiritual-fellowship-profile">
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-[#38BDF8] mb-3 flex items-center gap-1.5">
                  <Church size={14} className="text-[#38BDF8]" /> Spiritual Alignment
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {user?.denomination && <li className="flex items-center gap-2">⛪ <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">Denomination:</span> <strong className="text-white">{user.denomination}</strong></li>}
                  {user?.church_name && <li className="flex items-center gap-2">💒 <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">Home Church:</span> <strong className="text-white">{user.church_name}</strong></li>}
                  {user?.baptized && <li className="flex items-center gap-2">💧 <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">Baptized:</span> <strong className="text-white">{user.baptized}</strong></li>}
                  {user?.church_attendance && <li className="flex items-center gap-2">📅 <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">Attendance:</span> <strong className="text-white">{user.church_attendance}</strong></li>}
                  {user?.age && <li className="flex items-center gap-2">🎂 <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">Age:</span> <strong className="text-white">{user.age}</strong></li>}
                  {user?.gender && <li className="flex items-center gap-2">👥 <span className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">Gender:</span> <strong className="text-white">{user.gender}</strong></li>}
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-[#7C3AED] mb-3 flex items-center gap-1.5">
                  <Heart size={14} className="text-[#7C3AED]" /> Fellowship Goals
                </h4>
                <div className="flex flex-wrap gap-2">
                  {user?.looking_for && user.looking_for.length > 0 ? (
                    user.looking_for.map(goal => (
                      <span key={goal} className="px-3 py-1 bg-[#7C3AED]/15 text-[#7C3AED] border border-[#7C3AED]/30 rounded-lg text-[9px] font-black tracking-widest uppercase shadow-sm">
                        {goal}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic text-xs">No fellowship goals set yet</span>
                  )}
                </div>
                
                {user?.favorite_verse && (
                  <div className="mt-4 p-4 bg-[#111827] rounded-xl border border-white/[0.04] relative shadow-inner">
                    <span className="text-[9px] uppercase tracking-widest font-black text-[#64748B] block mb-1.5">Favorite Scripture</span>
                    <p className="text-xs font-bold italic text-white leading-relaxed">"{user.favorite_verse}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Interests & Hobbies Tags */}
            {user?.interests && user.interests.length > 0 && (
              <div className="mb-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-2.5">Interests & Spiritual Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map(interest => (
                    <span key={interest} className="px-3 py-1.5 bg-white/[0.03] text-slate-200 border border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.06] transition-colors cursor-default rounded-xl text-[11px] font-bold shadow-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 p-5 bg-[#1F2937] border border-white/[0.08] rounded-2xl shadow-inner mt-6">
              <div className="text-center border-r border-white/[0.08]">
                <p className="text-3xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{user?.followers?.length || 0}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mt-1">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{user?.following?.length || 0}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mt-1">Following</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
