import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, MapPin, Phone, Mail, Globe, Clock,
  Church, Upload, Image as ImageIcon, Filter, Users, Home
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import api from '@/lib/api';
import { INDIAN_STATES } from '@/constants/india';

const DENOMINATIONS = [
  'Baptist', 'Methodist', 'Pentecostal', 'Lutheran', 'Presbyterian',
  'Catholic', 'Non-Denominational', 'Evangelical', 'Anglican', 'Other',
];

const GRADIENTS = [
  'linear-gradient(135deg, #A855F7, #3B82F6)',
  'linear-gradient(135deg, #EC4899, #A855F7)',
  'linear-gradient(135deg, #3B82F6, #6366F1)',
  'linear-gradient(135deg, #F97316, #EC4899)',
  'linear-gradient(135deg, #6366F1, #A855F7)',
  'linear-gradient(135deg, #22C55E, #3B82F6)',
];

const MOCK_CHURCHES = [
  {
    _id: 'lc1', name: 'Grace Community Church', denomination: 'Non-Denominational',
    pastor: 'Pastor Abraham Thomas', address: '123 MG Road', city: 'Bangalore', state: 'Karnataka',
    phone: '+91 98765 43210', email: 'info@gracecommunity.in', website: 'https://gracecommunity.in',
    service_times: 'Sun 9:00 AM & 11:00 AM, Wed 7:00 PM',
    description: 'A vibrant community church focused on worship, fellowship, and outreach.',
    image: '',
  },
  {
    _id: 'lc2', name: 'New Life Assembly of God', denomination: 'Pentecostal',
    pastor: 'Pastor Samuel Raj', address: '456 Anna Nagar', city: 'Chennai', state: 'Tamil Nadu',
    phone: '+91 98765 12345', email: 'newlife@assembly.in', website: '',
    service_times: 'Sun 8:30 AM & 10:30 AM, Fri 7:30 PM',
    description: 'Spirit-filled worship and Bible teaching for the whole family.',
    image: '',
  },
  {
    _id: 'lc3', name: 'St. Mary\'s Cathedral', denomination: 'Catholic',
    pastor: 'Fr. Joseph D\'Souza', address: '789 Church Street', city: 'Mumbai', state: 'Maharashtra',
    phone: '+91 98765 67890', email: 'stmarys@cathedral.in', website: 'https://stmaryscathedral.in',
    service_times: 'Sat 6:00 PM, Sun 7:00 AM, 9:00 AM & 11:00 AM',
    description: 'A historic Catholic cathedral serving the community since 1850.',
    image: '',
  },
];

const initialFormData = {
  name: '', denomination: '', pastor: '', address: '', city: '', state: '',
  phone: '', email: '', website: '', service_times: '', description: '',
};

const ListYourChurch = () => {
  const { user } = useAuth();
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterDenom, setFilterDenom] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchChurches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterState) params.append('state', filterState);
      if (filterCity) params.append('city', filterCity);
      if (filterDenom) params.append('denomination', filterDenom);
      if (search) params.append('search', search);
      const { data } = await api.get(`/api/church-directory?${params}`);
      setChurches(Array.isArray(data) ? data : MOCK_CHURCHES);
    } catch (_) {
      setChurches(MOCK_CHURCHES);
    } finally {
      setLoading(false);
    }
  }, [filterState, filterCity, filterDenom, search]);

  useEffect(() => { fetchChurches(); }, [fetchChurches]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
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
      await api.post('/api/church-directory', { ...formData, image: imageUrl });
      toast.success('Church listed successfully!');
      setShowForm(false);
      setFormData(initialFormData);
      setImageFile(null);
      setImagePreview('');
      fetchChurches();
    } catch (_) {
      toast.error('Failed to list church');
    } finally {
      setSubmitting(false);
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

  const filtered = (Array.isArray(churches) ? churches : []).filter(c => {
    const matchState = !filterState || c.state === filterState;
    const matchCity = !filterCity || c.city?.toLowerCase().includes(filterCity.toLowerCase());
    const matchDenom = !filterDenom || c.denomination === filterDenom;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.city?.toLowerCase().includes(search.toLowerCase());
    return matchState && matchCity && matchDenom && matchSearch;
  });

  const activeFilters = [filterState, filterCity, filterDenom].filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#A855F7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="feed-container px-4 py-6" data-testid="list-church-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="gradient-text">List Your Church</span>
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">Help believers find your church</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="neo-button-primary flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}
        >
          <Plus size={18} strokeWidth={2.5} /> Add Church
        </button>
      </div>

      {/* Search + Filters Toggle */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={18} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search churches..."
            className="neo-input w-full pl-12"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
            activeFilters > 0 ? 'bg-[#A855F7]/15 border-[#A855F7]/30 text-[#A855F7]' : 'bg-white/[0.04] border-white/[0.06] text-[#94A3B8]'
          }`}
        >
          <Filter size={16} />
          {activeFilters > 0 && <span className="ml-1">({activeFilters})</span>}
        </button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">State</label>
                <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="neo-input w-full text-sm">
                  <option value="">All States</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">City</label>
                <input
                  type="text"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  placeholder="Filter by city"
                  className="neo-input w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Denomination</label>
                <select value={filterDenom} onChange={(e) => setFilterDenom(e.target.value)} className="neo-input w-full text-sm">
                  <option value="">All Denominations</option>
                  {DENOMINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            {activeFilters > 0 && (
              <button
                onClick={() => { setFilterState(''); setFilterCity(''); setFilterDenom(''); }}
                className="mt-3 text-xs text-[#94A3B8] hover:text-white transition-colors"
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Church Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Church size={48} className="mx-auto mb-4 text-[#94A3B8] opacity-40" />
          <p className="text-[#94A3B8] mb-4">No churches found.</p>
          <button onClick={() => setShowForm(true)} className="neo-button-primary" style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>
            List Your Church
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((church, i) => (
            <motion.div
              key={church._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-[24px] overflow-hidden"
            >
              {/* Image / Gradient Header */}
              <div className="relative h-[140px]">
                {church.image ? (
                  <img src={church.image} alt={church.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ background: GRADIENTS[i % GRADIENTS.length] }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/30 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <h3 className="text-lg font-bold text-white">{church.name}</h3>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white mt-1 inline-block">{church.denomination}</span>
                </div>
              </div>

              <div className="p-4 space-y-2">
                {church.pastor && (
                  <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                    <Users size={14} className="text-[#A855F7] shrink-0" /> {church.pastor}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                  <MapPin size={14} className="text-[#A855F7] shrink-0" /> {church.address}{church.city ? `, ${church.city}` : ''}{church.state ? `, ${church.state}` : ''}
                </div>
                {church.service_times && (
                  <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                    <Clock size={14} className="text-[#A855F7] shrink-0" /> {church.service_times}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-2">
                  {church.phone && (
                    <a href={`tel:${church.phone}`} className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-white transition-colors">
                      <Phone size={12} /> Call
                    </a>
                  )}
                  {church.email && (
                    <a href={`mailto:${church.email}`} className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-white transition-colors">
                      <Mail size={12} /> Email
                    </a>
                  )}
                  {church.website && (
                    <a href={church.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-white transition-colors">
                      <Globe size={12} /> Website
                    </a>
                  )}
                </div>
                {church.description && (
                  <p className="text-xs text-[#64748B] mt-2 line-clamp-2">{church.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Church Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="bg-[#1E293B] border border-white/[0.08] rounded-[24px] w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold gradient-text">List Your Church</h2>
                <button onClick={() => { setShowForm(false); setImageFile(null); setImagePreview(''); }} className="text-[#64748B] hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Church Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="neo-input w-full text-sm" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Denomination *</label>
                    <select value={formData.denomination} onChange={(e) => setFormData({ ...formData, denomination: e.target.value })} className="neo-input w-full text-sm" required>
                      <option value="">Select</option>
                      {DENOMINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Pastor</label>
                    <input type="text" value={formData.pastor} onChange={(e) => setFormData({ ...formData, pastor: e.target.value })} className="neo-input w-full text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Address</label>
                  <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="neo-input w-full text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">City *</label>
                    <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="neo-input w-full text-sm" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">State *</label>
                    <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="neo-input w-full text-sm" required>
                      <option value="">Select state</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Phone</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="neo-input w-full text-sm" placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="neo-input w-full text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Website</label>
                  <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="neo-input w-full text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Service Times</label>
                  <input type="text" value={formData.service_times} onChange={(e) => setFormData({ ...formData, service_times: e.target.value })} className="neo-input w-full text-sm" placeholder="Sun 9AM & 11AM" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="neo-input w-full h-20 resize-none text-sm" />
                </div>
                {/* Image Upload */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Church Image</label>
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/[0.08]">
                      <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover" />
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }} className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full">
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-full py-6 border-2 border-dashed border-white/[0.08] rounded-xl flex flex-col items-center gap-1 text-[#94A3B8] hover:bg-white/[0.04]">
                      <Upload size={18} /> <span className="text-xs">Upload Image</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); setImageFile(null); setImagePreview(''); }} className="neo-button-outline flex-1 py-2.5 text-sm">Cancel</button>
                  <button type="submit" disabled={submitting} className="neo-button-primary flex-1 py-2.5 text-sm" style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>
                    {submitting ? 'Submitting...' : 'List Church'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ListYourChurch;
