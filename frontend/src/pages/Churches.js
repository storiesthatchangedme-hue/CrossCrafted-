import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Plus, UserPlus, UserMinus, Clock, X, Filter, Globe, ChevronDown, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_STATES, LANGUAGES } from '@/constants/india';
import { MultiSelect } from '@/components/MultiSelect';

const GRADIENTS = [
  'linear-gradient(135deg, #A855F7, #3B82F6)',
  'linear-gradient(135deg, #EC4899, #A855F7)',
  'linear-gradient(135deg, #3B82F6, #6366F1)',
  'linear-gradient(135deg, #F97316, #EC4899)',
  'linear-gradient(135deg, #6366F1, #A855F7)',
  'linear-gradient(135deg, #A855F7, #EC4899)',
];

const Churches = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', location: '', service_times: '', state: '', city: '', languages: [] });
  const [filterState, setFilterState] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchChurches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterState) params.append('state', filterState);
      if (filterLanguage) params.append('language', filterLanguage);
      if (searchQuery) params.append('search', searchQuery);
      const { data } = await api.get(`/api/churches?${params}`);
      setChurches(Array.isArray(data) ? data : []);
    } catch (_) { toast.error('Failed to load'); } finally { setLoading(false); }
  }, [filterState, filterLanguage, searchQuery]);

  useEffect(() => { fetchChurches(); }, [fetchChurches]);

  const handleCreateChurch = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/churches', formData);
      toast.success('Church created!');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', location: '', service_times: '', state: '', city: '', languages: [] });
      navigate(`/app/churches/${data._id}`);
    } catch (_) { toast.error('Failed'); }
  };

  const handleFollow = async (e, churchId, isFollowing) => {
    e.stopPropagation();
    try {
      if (isFollowing) await api.delete(`/api/churches/${churchId}/follow`);
      else await api.post(`/api/churches/${churchId}/follow`, {});
      fetchChurches();
    } catch (_) { toast.error('Follow failed'); }
  };

  const activeFilters = [filterState, filterLanguage, searchQuery].filter(Boolean).length;

  if (loading && churches.length === 0) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#A855F7] animate-spin" />
    </div>
  );

  return (
    <div className="max-w-[640px] mx-auto px-4 py-5" data-testid="churches-page">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-white">Discover</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              activeFilters > 0 ? 'bg-[#A855F7]/15 border-[#A855F7]/30 text-[#A855F7]' : 'bg-white/[0.04] border-white/[0.06] text-[#94A3B8] hover:text-white'
            }`}
            data-testid="churches-filter-toggle"
          >
            <Filter size={14} />
            {activeFilters > 0 && <span className="w-4 h-4 rounded-full bg-[#A855F7] text-white text-[9px] flex items-center justify-center">{activeFilters}</span>}
          </button>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }} data-testid="create-church-button">
            <Plus size={14} /> Add Church
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 overflow-hidden"
            data-testid="churches-filters-panel"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Search</label>
                <input
                  type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="City, state, name..."
                  className="neo-input w-full text-sm"
                  data-testid="churches-search-input"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                  <MapPin size={10} className="inline mr-0.5" />State
                </label>
                <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="neo-input w-full text-sm" data-testid="churches-state-filter">
                  <option value="">All States</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                  <Globe size={10} className="inline mr-0.5" />Language
                </label>
                <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)} className="neo-input w-full text-sm" data-testid="churches-language-filter">
                  <option value="">All Languages</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setFilterState(''); setFilterLanguage(''); setSearchQuery(''); }} className="mt-3 text-xs text-[#94A3B8] hover:text-white transition-colors" data-testid="churches-clear-filters">
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {(Array.isArray(churches) ? churches : []).map((church, i) => {
          const isFollowing = church.followers?.includes(user?._id);
          return (
            <motion.div key={church._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => navigate(`/app/churches/${church._id}`)}
              className="rounded-2xl overflow-hidden cursor-pointer group border border-white/[0.06] hover:border-white/[0.12] transition-all"
              data-testid="church-card">

              <div className="relative h-[200px]">
                {church.cover_image ? (
                  <img src={church.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full" style={{ background: GRADIENTS[i % GRADIENTS.length] }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/30 to-transparent" />

                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/[0.1]">
                  <Users size={11} className="text-white/80" />
                  <span className="text-[10px] font-semibold text-white/80">{church.followers_count || 0}</span>
                </div>

                <div className="absolute bottom-0 inset-x-0 p-4">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-bold text-white leading-tight">{church.name}</h3>
                    {church.status === 'verified' && (
                      <ShieldCheck size={16} strokeWidth={2.5} className="shrink-0 drop-shadow-lg" style={{ color: 'white', fill: '#3B82F6' }} data-testid="verified-badge" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-white/60" />
                      <span className="text-[12px] text-white/60">{church.city ? `${church.city}, ` : ''}{church.state || church.location}</span>
                    </div>
                    {church.languages?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Globe size={11} className="text-white/50" />
                        <span className="text-[11px] text-white/50">{church.languages.slice(0, 2).join(', ')}{church.languages.length > 2 ? ` +${church.languages.length - 2}` : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/[0.02]">
                {church.service_times && (
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Clock size={12} className="text-[#A855F7]" />
                    <span className="text-[11px] text-[#94A3B8]">{church.service_times}</span>
                  </div>
                )}
                <p className="text-[13px] text-[#94A3B8] leading-[1.5] line-clamp-2 mb-3">{church.description}</p>
                <button onClick={(e) => handleFollow(e, church._id, isFollowing)}
                  className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                    isFollowing
                      ? 'bg-white/[0.06] text-[#94A3B8] border border-white/[0.06]'
                      : 'text-white hover:-translate-y-px'
                  }`}
                  style={!isFollowing ? { background: 'linear-gradient(135deg, #3B82F6, #A855F7)', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' } : {}}
                  data-testid="follow-church-button">
                  {isFollowing ? <><UserMinus size={13} /> Following</> : <><UserPlus size={13} /> Follow</>}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {churches.length === 0 && !loading && (
        <div className="text-center py-16">
          <p className="text-[#475569] text-sm mb-4">No churches found{activeFilters > 0 ? ' for these filters' : ''}.</p>
          {activeFilters > 0 ? (
            <button onClick={() => { setFilterState(''); setFilterLanguage(''); setSearchQuery(''); }}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>Clear Filters</button>
          ) : (
            <button onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>Add Church</button>
          )}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center z-50"
            onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)} data-testid="create-church-modal">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="bg-[#1E293B] border-t md:border border-white/[0.08] rounded-t-[28px] md:rounded-[24px] w-full max-w-lg p-5 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold gradient-text">Add a Church</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-[#64748B] hover:text-white p-1"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateChurch} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Church Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="neo-input w-full text-sm" required data-testid="church-name-input" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">State</label>
                    <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="neo-input w-full text-sm" data-testid="church-state-select">
                      <option value="">Select state</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">City</label>
                    <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="neo-input w-full text-sm" placeholder="City" data-testid="church-city-input" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Location Address</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="neo-input w-full text-sm" required data-testid="church-location-input" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Service Times</label>
                  <input type="text" value={formData.service_times} onChange={(e) => setFormData({ ...formData, service_times: e.target.value })} className="neo-input w-full text-sm" placeholder="Sun 9AM & 11AM" data-testid="church-service-times-input" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Languages</label>
                  <MultiSelect options={LANGUAGES} value={formData.languages} onChange={(langs) => setFormData({ ...formData, languages: langs })} placeholder="Select languages" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="neo-input w-full h-20 resize-none text-sm" required data-testid="church-description-input" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="neo-button-outline flex-1 py-2.5 text-sm" data-testid="cancel-button">Cancel</button>
                  <button type="submit" className="neo-button-primary flex-1 py-2.5 text-sm" data-testid="submit-church-button">Create</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Churches;
