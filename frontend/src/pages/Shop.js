import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { uploadConfig } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, Image as ImageIcon, DollarSign, Tag,
  Heart, Bookmark, Star, Clock, Sparkles, Flame, Package
} from 'lucide-react';
import { toast } from 'sonner';
import { SHOP_CATEGORIES as SHOP_CATS, CONDITIONS as CONDS } from '@/lib/constants';


const CATEGORIES = [
  'Books & Bibles', 'Christian Apparel', 'Church Supplies',
  'Musical Instruments', 'Handmade Crafts', 'Events & Conference Tickets',
  'Technology', 'Local Christian Businesses', 'Tutoring',
  'Photography', 'Graphic Design', 'Free Items'
];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Donate/Free'];

const CONDITION_BADGE = {
  'New': { color: '#10B981', bg: 'rgba(16,185,129,0.15)', label: 'New' },
  'Like New': { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', label: 'Like New' },
  'Good': { color: '#EAB308', bg: 'rgba(234,179,8,0.15)', label: 'Good' },
  'Fair': { color: '#F97316', bg: 'rgba(249,115,22,0.15)', label: 'Fair' },
  'Donate/Free': { color: '#A855F7', bg: 'rgba(168,85,247,0.15)', label: 'Free' },
};

const TABS = [
  { key: 'all', label: 'All Products' },
  { key: 'mine', label: 'My Listings' },
  { key: 'saved', label: 'Saved' },
];


const Shop = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const stored = localStorage.getItem('crosscrafted_saved_products');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', price: '', image: '', category: '', condition: 'Good', city: '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProducts = useCallback(async (q = '') => {
    try {
      const { data } = await api.get(`/api/products?search=${encodeURIComponent(q)}`);
      setProducts(Array.isArray(data) ? data : []);
    } catch (_) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (location.state?.openCreate) {
      setShowCreateModal(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // Persist saved IDs to localStorage
  useEffect(() => {
    localStorage.setItem('crosscrafted_saved_products', JSON.stringify(savedIds));
  }, [savedIds]);

  const toggleSave = (e, productId) => {
    e.stopPropagation();
    setSavedIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const featuredProducts = useMemo(() => {
    const featured = (Array.isArray(products) ? products : []).filter(p => p.is_featured);
    if (featured.length >= 2) return featured.slice(0, 2);
    return products.slice(0, 2);
  }, [products]);

  const recentProducts = useMemo(() => {
    return [...(Array.isArray(products) ? products : [])]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 4);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...(Array.isArray(products) ? products : [])];

    // Tab filtering
    if (activeTab === 'mine') {
      result = result.filter(p => p.created_by === user?._id || p.seller_id === user?._id || p.is_owner);
    } else if (activeTab === 'saved') {
      result = result.filter(p => savedIds.includes(p._id));
    }

    // Category filter
    if (filterCategory) {
      result = result.filter(p => p.category === filterCategory);
    }

    // City filter
    if (filterCity.trim()) {
      const cityLower = filterCity.toLowerCase().trim();
      result = result.filter(p => p.city?.toLowerCase().includes(cityLower));
    }

    return result;
  }, [products, activeTab, filterCategory, filterCity, user, savedIds]);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchProducts(search);
  };

  const handleCategoryPill = (category) => {
    setFilterCategory(prev => prev === category ? '' : category);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const availableSlots = 5 - imageFiles.length;
    if (availableSlots <= 0) {
      toast.error('You can only upload up to 5 images.');
      return;
    }
    const filesToUpload = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      toast.warning(`Only the first ${availableSlots} images were added (max 5).`);
    }

    filesToUpload.forEach(file => {
      setImageFiles(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of imageFiles) {
        const fd = new FormData();
        fd.append('file', file);
        const { data: uploaded } = await api.post('/api/upload', fd, uploadConfig());
        uploadedUrls.push(uploaded.url);
      }
      const { data } = await api.post('/api/products', {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        image: uploadedUrls[0] || '',
        images: uploadedUrls,
        category: formData.category,
        condition: formData.condition,
        city: formData.city,
      });
      toast.success('Product listed!');
      setShowCreateModal(false);
      resetForm();
      navigate(`/app/shop/${data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create product');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', price: '', image: '', category: '', condition: 'Good', city: '' });
    setImageFiles([]);
    setImagePreviews([]);
  };

  const renderConditionBadge = (condition) => {
    const badge = CONDITION_BADGE[condition];
    if (!badge) return null;
    return (
      <span
        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none"
        style={{ color: badge.color, backgroundColor: badge.bg }}
      >
        {badge.label}
      </span>
    );
  };

  const renderAvailabilityBadge = (status) => {
    if (status && status !== 'active') {
      return (
        <span className="absolute top-2 right-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/90 text-white shadow-lg">
          Sold
        </span>
      );
    }
    return (
      <span className="absolute top-2 right-2 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/80 text-white">
        Available
      </span>
    );
  };

  const renderProductCard = (product, index, featured = false) => {
    const isSaved = savedIds.includes(product._id);
    const badge = CONDITION_BADGE[product.condition];

    return (
      <motion.div
        key={product._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => navigate(`/app/shop/${product._id}`)}
        className="bg-white/[0.04] rounded-[20px] backdrop-blur-sm border border-white/[0.06] overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-all cursor-pointer relative group"
        data-testid="product-card"
      >
        {/* Availability Badge */}
        {renderAvailabilityBadge(product.status)}

        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF90E8] to-[#A855F7] text-white text-[10px] font-bold shadow-lg">
            <Sparkles size={10} strokeWidth={2.5} /> Featured
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={(e) => toggleSave(e, product._id)}
          className="absolute bottom-16 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-black/40 backdrop-blur-sm border border-white/[0.1] hover:bg-black/60"
          data-testid="save-product-button"
        >
          <Heart
            size={15}
            strokeWidth={2}
            className={`transition-colors ${isSaved ? 'fill-[#EC4899] text-[#EC4899]' : 'text-white/70'}`}
          />
        </button>

        {/* Image */}
        <div className="aspect-square bg-[#E5E5E5] border-b border-white/[0.06] overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF90E8]/20 to-[#B4FF39]/20">
              <Tag size={40} strokeWidth={2} className="text-[#94A3B8] opacity-30" />
            </div>
          )}
        </div>

        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            {product.condition && renderConditionBadge(product.condition)}
          </div>
          <h3 className="font-bold text-sm truncate mb-1" data-testid="product-card-name">{product.title}</h3>
          <p className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="product-card-price">
            ₹{product.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>

          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-[#94A3B8] truncate">by {product.seller_name || product.creator_name || 'Unknown'}</p>
            {product.city && <span className="text-[10px] bg-white/[0.1] px-2 py-0.5 rounded-full text-white">{product.city}</span>}
          </div>
          {product.category && <p className="text-[10px] text-[#38BDF8] mt-1">{product.category}</p>}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#EC4899] border-r-transparent"></div>
          <p className="mt-4 text-white font-medium">Loading shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-container px-4 py-6" data-testid="shop-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Shop
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="neo-button-primary flex items-center gap-2"
          style={{ background: '#FF90E8' }}
          data-testid="add-product-button"
        >
          <Plus size={20} strokeWidth={2.5} />
          Sell Something
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-5 bg-white/[0.04] rounded-2xl p-1 border border-white/[0.06]" data-testid="shop-tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-[#FF90E8] to-[#A855F7] text-white shadow-lg'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
            }`}
            data-testid={`shop-tab-${tab.key}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search size={18} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." aria-label="Search products" className="neo-input w-full pl-12" />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="neo-input bg-[#1E293B]" aria-label="Filter by category">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="text" value={filterCity} onChange={(e) => setFilterCity(e.target.value)} placeholder="Filter by City" aria-label="Filter by city" className="neo-input bg-[#1E293B] w-32" />
          <button type="submit" className="neo-button-outline" data-testid="shop-search-button">Search</button>
        </div>
      </form>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide" data-testid="category-pills">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryPill(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              filterCategory === cat
                ? 'bg-gradient-to-r from-[#FF90E8] to-[#A855F7] text-white border-transparent shadow-lg'
                : 'bg-white/[0.04] text-[#94A3B8] border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
            }`}
            data-testid={`category-pill-${cat.replace(/[^a-zA-Z0-9]/g, '-')}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured Products Section — only show on "All Products" tab */}
      {activeTab === 'all' && featuredProducts.length > 0 && (
        <div className="mb-8" data-testid="featured-section">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} strokeWidth={2} className="text-[#FF90E8]" />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Featured</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            {featuredProducts.map((product, index) => renderProductCard(product, index, true))}
          </div>
        </div>
      )}

      {/* Just Listed Section — only show on "All Products" tab */}
      {activeTab === 'all' && recentProducts.length > 0 && (
        <div className="mb-8" data-testid="just-listed-section">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={20} strokeWidth={2} className="text-[#F97316]" />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Just Listed</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentProducts.map((product, index) => renderProductCard(product, index, false))}
          </div>
        </div>
      )}

      {/* All Products / My Listings / Saved Grid */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Package size={20} strokeWidth={2} className="text-[#38BDF8]" />
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {activeTab === 'all' && 'All Products'}
            {activeTab === 'mine' && 'My Listings'}
            {activeTab === 'saved' && 'Saved Items'}
          </h2>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <Tag size={48} strokeWidth={2} className="mx-auto mb-4 text-[#94A3B8] opacity-40" />
          <p className="text-[#94A3B8] mb-4">
            {activeTab === 'saved'
              ? 'No saved items yet. Tap the heart icon on products to save them!'
              : search || filterCategory || filterCity
                ? 'No products found matching your filters.'
                : activeTab === 'mine'
                  ? 'You haven\'t listed anything yet.'
                  : 'No products yet. Be the first to list!'}
          </p>
          {(activeTab === 'all' || activeTab === 'mine') && (
            <button onClick={() => setShowCreateModal(true)} className="neo-button-primary" style={{ background: '#FF90E8' }}>
              Sell Something
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="product-grid">
          {filteredProducts.map((product, index) => renderProductCard(product, index, false))}
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="create-product-modal" role="dialog" aria-modal="true" aria-labelledby="create-product-modal-title">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1E293B] border border-white/[0.08] rounded-[24px] shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 id="create-product-modal-title" className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                List a Product
              </h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-[#94A3B8] hover:text-white" data-testid="close-product-modal" aria-label="Close">
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>
            <form onSubmit={handleCreateProduct}>
              {/* Image Upload */}
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Product Images (Up to 5)</label>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.02]">
                      <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-black/90 border border-white/[0.1] rounded-full p-1"
                      >
                        <X size={10} className="text-white" strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-white/[0.08] rounded-xl flex flex-col items-center justify-center gap-1 text-[#94A3B8] hover:bg-white/[0.04] transition-colors"
                      data-testid="product-image-upload"
                    >
                      <ImageIcon size={20} strokeWidth={2} />
                      <span className="text-[10px] font-semibold text-center">Add Image</span>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Product Name</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="neo-input w-full" required data-testid="product-name-input" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Price (₹)</label>
                <input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="neo-input w-full" required data-testid="product-price-input" />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wide mb-2">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="neo-input w-full" required>
                    <option value="">Select Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wide mb-2">Condition</label>
                  <select value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className="neo-input w-full" required>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">City</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="neo-input w-full" required placeholder="E.g., Mumbai, Kerala" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="neo-input w-full h-24 resize-none" required data-testid="product-description-input" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="neo-button-outline flex-1" data-testid="cancel-product-button">Cancel</button>
                <button type="submit" disabled={uploading} className="neo-button-primary flex-1 flex items-center justify-center gap-2" style={{ background: '#FF90E8' }} data-testid="submit-product-button">
                  {uploading ? 'Uploading...' : 'List Product'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Shop;