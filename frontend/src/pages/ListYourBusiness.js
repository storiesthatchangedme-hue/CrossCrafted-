import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, MapPin, Phone, Mail, Globe,
  Building2, ShoppingBag, Upload, Filter, MessageCircle,
  Tag, DollarSign, Image as ImageIcon, ExternalLink, Package
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import api, { uploadConfig } from '@/lib/api';
import { INDIAN_STATES } from '@/constants/india';

const BUSINESS_CATEGORIES = [
  'Bookstore', 'Café', 'Printing', 'Event Planning', 'Music',
  'Counseling', 'Education', 'Fashion', 'Health', 'Technology', 'Other',
];

const MARKETPLACE_CATEGORIES = [
  'Books', 'Bibles', 'Music', 'Apparel', 'Gifts',
  'Handmade', 'Events', 'Services', 'Free Items',
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Free'];

const DENOMINATIONS_FOR_REF = []; // not used here but kept for consistency

const GRADIENTS = [
  'linear-gradient(135deg, #A855F7, #3B82F6)',
  'linear-gradient(135deg, #EC4899, #A855F7)',
  'linear-gradient(135deg, #3B82F6, #6366F1)',
  'linear-gradient(135deg, #F97316, #EC4899)',
  'linear-gradient(135deg, #22C55E, #3B82F6)',
  'linear-gradient(135deg, #F59E0B, #EF4444)',
];

const CONDITION_BADGE = {
  'New': { color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  'Like New': { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  'Good': { color: '#EAB308', bg: 'rgba(234,179,8,0.15)' },
  'Fair': { color: '#F97316', bg: 'rgba(249,115,22,0.15)' },
  'Free': { color: '#A855F7', bg: 'rgba(168,85,247,0.15)' },
};

const MOCK_BUSINESSES = [
  {
    _id: 'b1', name: 'Shepherd Bookstore', category: 'Bookstore', owner: 'John Philip',
    address: '12 Church Street', city: 'Kochi', state: 'Kerala',
    phone: '+91 98765 11111', email: 'info@shepherdbooks.in', website: 'https://shepherdbooks.in',
    description: 'Your one-stop shop for Bibles, devotionals, and Christian literature.',
    logo: '',
  },
  {
    _id: 'b2', name: 'Grace Café', category: 'Café', owner: 'Mary Thomas',
    address: '45 MG Road', city: 'Bangalore', state: 'Karnataka',
    phone: '+91 98765 22222', email: 'hello@gracecafe.in', website: '',
    description: 'A cozy Christian café with worship nights every Friday.',
    logo: '',
  },
  {
    _id: 'b3', name: 'Praise Prints', category: 'Printing', owner: 'Daniel Raj',
    address: '78 Cross Road', city: 'Chennai', state: 'Tamil Nadu',
    phone: '+91 98765 33333', email: 'orders@praiseprints.in', website: '',
    description: 'Custom church banners, bulletins, and event materials printing.',
    logo: '',
  },
];

const MOCK_LISTINGS = [
  {
    _id: 'm1', title: 'Study Bible - ESV', price: 1200, category: 'Bibles',
    condition: 'New', description: 'ESV Study Bible, hardcover. Brand new with study notes.',
    whatsapp: '919876543210', images: [], seller: 'Shepherd Bookstore',
  },
  {
    _id: 'm2', title: 'Worship Guitar - Yamaha', price: 8500, category: 'Music',
    condition: 'Like New', description: 'Yamaha acoustic guitar, barely used. Great for worship teams.',
    whatsapp: '919876511111', images: [], seller: 'Praise Music',
  },
  {
    _id: 'm3', title: 'Christian T-Shirt Collection', price: 450, category: 'Apparel',
    condition: 'New', description: 'Set of 3 Christian themed t-shirts. Various sizes available.',
    whatsapp: '919876522222', images: [], seller: 'Faith Wear',
  },
  {
    _id: 'm4', title: 'Free: Devotional Books Bundle', price: 0, category: 'Free Items',
    condition: 'Free', description: '5 gently used devotional books. Free to a good home!',
    whatsapp: '919876533333', images: [], seller: 'Grace Community',
  },
];

const ListYourBusiness = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('directory'); // directory | marketplace
  const [businesses, setBusinesses] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Business form
  const [bizForm, setBizForm] = useState({
    name: '', category: '', owner: '', address: '', city: '', state: '',
    phone: '', email: '', website: '', description: '',
  });

  // Marketplace form
  const [mktForm, setMktForm] = useState({
    title: '', price: '', category: '', condition: 'New',
    description: '', whatsapp: '',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bizRes, mktRes] = await Promise.all([
        api.get('/api/business-directory').catch(() => ({ data: MOCK_BUSINESSES })),
        api.get('/api/marketplace').catch(() => ({ data: MOCK_LISTINGS })),
      ]);
      setBusinesses(bizRes.data);
      setListings(mktRes.data);
    } catch (_) {
      setBusinesses(MOCK_BUSINESSES);
      setListings(MOCK_LISTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBizSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/business-directory', bizForm);
      toast.success('Business listed!');
      setShowForm(false);
      setBizForm({ name: '', category: '', owner: '', address: '', city: '', state: '', phone: '', email: '', website: '', description: '' });
      fetchData();
    } catch (_) {
      toast.error('Failed to list business');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMktSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const uploadedUrls = [];
      for (const file of imageFiles) {
        const fd = new FormData();
        fd.append('file', file);
        const { data: uploaded } = await api.post('/api/upload', fd, uploadConfig());
        uploadedUrls.push(uploaded.url);
      }
      await api.post('/api/marketplace', { ...mktForm, price: parseFloat(mktForm.price) || 0, images: uploadedUrls });
      toast.success('Item listed!');
      setShowForm(false);
      setMktForm({ title: '', price: '', category: '', condition: 'New', description: '', whatsapp: '' });
      setImageFiles([]);
      setImagePreviews([]);
      fetchData();
    } catch (_) {
      toast.error('Failed to list item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const available = 5 - imageFiles.length;
    if (available <= 0) { toast.error('Max 5 images'); return; }
    const toAdd = files.slice(0, available);
    toAdd.forEach(file => {
      setImageFiles(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onload = () => setImagePreviews(prev => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const filteredBiz = businesses.filter(b => {
    const matchState = !filterState || b.state === filterState;
    const matchCity = !filterCity || b.city?.toLowerCase().includes(filterCity.toLowerCase());
    const matchCat = !filterCategory || b.category === filterCategory;
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.description?.toLowerCase().includes(search.toLowerCase());
    return matchState && matchCity && matchCat && matchSearch;
  });

  const filteredMkt = listings.filter(l => {
    const matchCat = !filterCategory || l.category === filterCategory;
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#A855F7] animate-spin" />
      </div>
    );
  }

  const currentCategories = activeTab === 'directory' ? BUSINESS_CATEGORIES : MARKETPLACE_CATEGORIES;

  return (
    <div className="feed-container px-4 py-6" data-testid="marketplace-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <span className="gradient-text">Business</span> & <span className="gradient-text">Marketplace</span>
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">Support the Christian business community</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="neo-button-primary flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}
        >
          <Plus size={18} strokeWidth={2.5} /> {activeTab === 'directory' ? 'List Business' : 'Sell Item'}
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-5 bg-white/[0.04] rounded-2xl p-1 border border-white/[0.06]">
        {[
          { key: 'directory', label: 'Business Directory', icon: Building2 },
          { key: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setFilterCategory(''); setSearch(''); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-[#A855F7] to-[#EC4899] text-white shadow-lg'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search size={18} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'directory' ? 'Search businesses...' : 'Search items...'}
            className="neo-input w-full pl-12"
          />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="neo-input bg-[#1E293B]">
          <option value="">All Categories</option>
          {currentCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {activeTab === 'directory' && (
          <>
            <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="neo-input bg-[#1E293B]">
              <option value="">All States</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="text" value={filterCity} onChange={(e) => setFilterCity(e.target.value)} placeholder="City" className="neo-input bg-[#1E293B] w-28" />
          </>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {currentCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(prev => prev === cat ? '' : cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              filterCategory === cat
                ? 'bg-gradient-to-r from-[#A855F7] to-[#EC4899] text-white border-transparent shadow-lg'
                : 'bg-white/[0.04] text-[#94A3B8] border-white/[0.08] hover:bg-white/[0.08]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Business Directory */}
      {activeTab === 'directory' && (
        filteredBiz.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={48} className="mx-auto mb-4 text-[#94A3B8] opacity-40" />
            <p className="text-[#94A3B8] mb-4">No businesses found.</p>
            <button onClick={() => setShowForm(true)} className="neo-button-primary" style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>
              List Your Business
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBiz.map((biz, i) => (
              <motion.div
                key={biz._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-[20px] overflow-hidden"
              >
                <div className="h-1.5" style={{ background: GRADIENTS[i % GRADIENTS.length] }} />
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm">{biz.name}</h3>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#A855F7]/10 text-[#A855F7]">{biz.category}</span>
                    </div>
                    {biz.logo && <img src={biz.logo} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />}
                  </div>
                  {biz.owner && <p className="text-xs text-[#94A3B8]">by {biz.owner}</p>}
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <MapPin size={12} className="text-[#A855F7] shrink-0" />
                    {biz.city}{biz.state ? `, ${biz.state}` : ''}
                  </div>
                  {biz.description && <p className="text-xs text-[#64748B] line-clamp-2">{biz.description}</p>}
                  <div className="flex items-center gap-3 pt-1">
                    {biz.phone && (
                      <a href={`tel:${biz.phone}`} className="flex items-center gap-1 text-[10px] text-[#94A3B8] hover:text-white">
                        <Phone size={10} /> Call
                      </a>
                    )}
                    {biz.email && (
                      <a href={`mailto:${biz.email}`} className="flex items-center gap-1 text-[10px] text-[#94A3B8] hover:text-white">
                        <Mail size={10} /> Email
                      </a>
                    )}
                    {biz.website && (
                      <a href={biz.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-[#94A3B8] hover:text-white">
                        <Globe size={10} /> Website
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* Marketplace */}
      {activeTab === 'marketplace' && (
        filteredMkt.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={48} className="mx-auto mb-4 text-[#94A3B8] opacity-40" />
            <p className="text-[#94A3B8] mb-4">No items found.</p>
            <button onClick={() => setShowForm(true)} className="neo-button-primary" style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>
              Sell Something
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMkt.map((item, i) => {
              const condBadge = CONDITION_BADGE[item.condition];
              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/[0.04] rounded-[20px] backdrop-blur-sm border border-white/[0.06] overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-all"
                >
                  {/* Image placeholder */}
                  <div className="aspect-square bg-gradient-to-br from-[#FF90E8]/10 to-[#A855F7]/10 border-b border-white/[0.06] flex items-center justify-center">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <Tag size={32} className="text-[#94A3B8] opacity-20" />
                    )}
                  </div>
                  <div className="p-3">
                    {/* Condition badge */}
                    {condBadge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: condBadge.color, backgroundColor: condBadge.bg }}>
                        {item.condition}
                      </span>
                    )}
                    <h3 className="font-bold text-sm truncate mt-1">{item.title}</h3>
                    <p className="text-lg font-bold mt-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {item.price === 0 ? 'Free' : `₹${item.price.toLocaleString('en-IN')}`}
                    </p>
                    <p className="text-[10px] text-[#94A3B8] mt-1">{item.category}</p>
                    {/* WhatsApp Button */}
                    <a
                      href={`https://wa.me/${item.whatsapp}?text=${encodeURIComponent(`Hi! I'm interested in "${item.title}" listed on CrossCrafted.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full py-2 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition-all hover:-translate-y-px"
                      style={{ background: '#25D366' }}
                    >
                      <MessageCircle size={12} /> Contact on WhatsApp
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {/* Form Modal */}
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
                <h2 className="text-lg font-bold gradient-text">
                  {activeTab === 'directory' ? 'List Your Business' : 'Sell an Item'}
                </h2>
                <button onClick={() => { setShowForm(false); setImageFiles([]); setImagePreviews([]); }} className="text-[#64748B] hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>

              {activeTab === 'directory' ? (
                <form onSubmit={handleBizSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Business Name *</label>
                    <input type="text" value={bizForm.name} onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })} className="neo-input w-full text-sm" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Category *</label>
                      <select value={bizForm.category} onChange={(e) => setBizForm({ ...bizForm, category: e.target.value })} className="neo-input w-full text-sm" required>
                        <option value="">Select</option>
                        {BUSINESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Owner</label>
                      <input type="text" value={bizForm.owner} onChange={(e) => setBizForm({ ...bizForm, owner: e.target.value })} className="neo-input w-full text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Address</label>
                    <input type="text" value={bizForm.address} onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })} className="neo-input w-full text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">City *</label>
                      <input type="text" value={bizForm.city} onChange={(e) => setBizForm({ ...bizForm, city: e.target.value })} className="neo-input w-full text-sm" required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">State *</label>
                      <select value={bizForm.state} onChange={(e) => setBizForm({ ...bizForm, state: e.target.value })} className="neo-input w-full text-sm" required>
                        <option value="">Select state</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Phone</label>
                      <input type="tel" value={bizForm.phone} onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })} className="neo-input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Email</label>
                      <input type="email" value={bizForm.email} onChange={(e) => setBizForm({ ...bizForm, email: e.target.value })} className="neo-input w-full text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Website</label>
                    <input type="url" value={bizForm.website} onChange={(e) => setBizForm({ ...bizForm, website: e.target.value })} className="neo-input w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Description</label>
                    <textarea value={bizForm.description} onChange={(e) => setBizForm({ ...bizForm, description: e.target.value })} className="neo-input w-full h-20 resize-none text-sm" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="neo-button-outline flex-1 py-2.5 text-sm">Cancel</button>
                    <button type="submit" disabled={submitting} className="neo-button-primary flex-1 py-2.5 text-sm" style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>
                      {submitting ? 'Submitting...' : 'List Business'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleMktSubmit} className="space-y-3">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Images (Up to 5)</label>
                    <div className="grid grid-cols-5 gap-2 mb-2">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative aspect-square border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.02]">
                          <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full">
                            <X size={8} className="text-white" />
                          </button>
                        </div>
                      ))}
                      {imagePreviews.length < 5 && (
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                          className="aspect-square border-2 border-dashed border-white/[0.08] rounded-xl flex flex-col items-center justify-center gap-1 text-[#94A3B8] hover:bg-white/[0.04]">
                          <ImageIcon size={16} /> <span className="text-[8px]">Add</span>
                        </button>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Item Title *</label>
                    <input type="text" value={mktForm.title} onChange={(e) => setMktForm({ ...mktForm, title: e.target.value })} className="neo-input w-full text-sm" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Price (₹) *</label>
                      <input type="number" min="0" value={mktForm.price} onChange={(e) => setMktForm({ ...mktForm, price: e.target.value })} className="neo-input w-full text-sm" required />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Category *</label>
                      <select value={mktForm.category} onChange={(e) => setMktForm({ ...mktForm, category: e.target.value })} className="neo-input w-full text-sm" required>
                        <option value="">Select</option>
                        {MARKETPLACE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Condition *</label>
                      <select value={mktForm.condition} onChange={(e) => setMktForm({ ...mktForm, condition: e.target.value })} className="neo-input w-full text-sm" required>
                        {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">WhatsApp Number *</label>
                      <input type="tel" value={mktForm.whatsapp} onChange={(e) => setMktForm({ ...mktForm, whatsapp: e.target.value })} className="neo-input w-full text-sm" required placeholder="919876543210" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">Description *</label>
                    <textarea value={mktForm.description} onChange={(e) => setMktForm({ ...mktForm, description: e.target.value })} className="neo-input w-full h-24 resize-none text-sm" required />
                  </div>
                  <p className="text-[10px] text-[#64748B] flex items-center gap-1">
                    <MessageCircle size={10} /> Buyers will contact you via WhatsApp. No payment gateway.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => { setShowForm(false); setImageFiles([]); setImagePreviews([]); }} className="neo-button-outline flex-1 py-2.5 text-sm">Cancel</button>
                    <button type="submit" disabled={submitting} className="neo-button-primary flex-1 py-2.5 text-sm" style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>
                      {submitting ? 'Submitting...' : 'List Item'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ListYourBusiness;
