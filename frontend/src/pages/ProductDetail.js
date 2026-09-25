import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { uploadConfig } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Edit2, Trash2, Save, X, DollarSign, User,
  Mail, Image as ImageIcon, Tag, Shield, MessageSquare, Star, Eye, Calendar
} from 'lucide-react';
import { toast } from 'sonner';


const CONDITION_BADGE = {
  'New': { color: '#10B981', bg: 'rgba(16,185,129,0.15)', label: 'New' },
  'Like New': { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', label: 'Like New' },
  'Good': { color: '#EAB308', bg: 'rgba(234,179,8,0.15)', label: 'Good' },
  'Fair': { color: '#F97316', bg: 'rgba(249,115,22,0.15)', label: 'Fair' },
  'Donate/Free': { color: '#A855F7', bg: 'rgba(168,85,247,0.15)', label: 'Free' },
};

const renderStars = (rating = 4.5) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(<Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />);
    } else if (i === fullStars + 1 && hasHalf) {
      stars.push(
        <span key={i} className="relative inline-block">
          <Star size={14} className="text-[#475569]" />
          <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
          </span>
        </span>
      );
    } else {
      stars.push(<Star key={i} size={14} className="text-[#475569]" />);
    }
  }
  return stars;
};

const ProductDetail = () => {
  const { user } = useAuth();
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', price: '' });
  const [deleting, setDeleting] = useState(false);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [sellerListingsCount, setSellerListingsCount] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/api/products/${productId}`);
      setProduct(data);
      setFormData({ title: data.title, description: data.description, price: data.price });
      setActiveImageIdx(0);
      // Fetch seller listings count
      if (data.seller_id) {
        try {
          const { data: sellerProducts } = await api.get(`/api/products?search=`);
          const count = sellerProducts.filter(p => p.seller_id === data.seller_id || p.created_by === data.seller_id).length;
          setSellerListingsCount(count);
        } catch (_) {}
      }
    } catch (error) {
      toast.error('Product not found');
      navigate('/app/shop');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let uploadedUrls = [];
      if (newImages.length > 0) {
        for (const file of newImages) {
          const fd = new FormData();
          fd.append('file', file);
          const { data: uploaded } = await api.post('/api/upload', fd, uploadConfig());
          uploadedUrls.push(uploaded.url);
        }
      } else {
        uploadedUrls = product.images || (product.image ? [product.image] : []);
      }
      const payload = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        image: uploadedUrls[0] || '',
        images: uploadedUrls
      };
      await api.put(`/api/products/${productId}`, payload);
      toast.success('Product updated!');
      setEditing(false);
      setNewImages([]);
      setNewImagePreviews([]);
      fetchProduct();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setDeleting(true);
    try {
      await api.delete(`/api/products/${productId}`);
      toast.success('Product deleted');
      navigate('/app/shop');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const filesToUpload = files.slice(0, 5);
    setNewImages(filesToUpload);
    setNewImagePreviews([]);
    filesToUpload.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setNewImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleMessageSeller = async () => {
    if (!user) {
      toast.error('Please log in to message the seller');
      navigate('/login');
      return;
    }
    setMessaging(true);
    try {
      const { data } = await api.post('/api/conversations', { user_id: product.seller_id });
      navigate(`/app/messages/${data.conversation_id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start conversation');
    } finally {
      setMessaging(false);
    }
  };

  const canManage = product?.is_owner || product?.is_admin;
  const sellerSinceYear = product?.seller_created_at
    ? new Date(product.seller_created_at).getFullYear()
    : '2024';

  const conditionBadge = product?.condition ? CONDITION_BADGE[product.condition] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#EC4899] border-r-transparent"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="feed-container px-4 py-6" data-testid="product-detail-page">
      {/* Back */}
      <button onClick={() => navigate('/app/shop')} className="flex items-center gap-2 text-[#94A3B8] hover:text-white mb-4 font-medium transition-colors" data-testid="back-to-shop">
        <ArrowLeft size={20} strokeWidth={2.5} /> Back to Shop
      </button>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Product Image */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative flex flex-col gap-3">
          {/* Status Badge */}
          {product.status && product.status !== 'active' ? (
            <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-red-500/90 text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
              <X size={12} strokeWidth={3} /> Sold
            </div>
          ) : (
            <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-emerald-500/80 text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
              <Eye size={12} strokeWidth={2.5} /> Available
            </div>
          )}

          <div className="aspect-square bg-white/[0.04] rounded-[20px] backdrop-blur-sm border border-white/[0.06] overflow-hidden">
            {editing && newImagePreviews.length > 0 ? (
              <img src={newImagePreviews[activeImageIdx] || newImagePreviews[0]} alt="New" className="w-full h-full object-cover" />
            ) : product.images && product.images.length > 0 ? (
              <img src={product.images[activeImageIdx]} alt={product.title} className="w-full h-full object-cover" data-testid="product-image" />
            ) : product.image ? (
              <img src={product.image} alt={product.title} className="w-full h-full object-cover" data-testid="product-image" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF90E8]/20 to-[#B4FF39]/20">
                <Tag size={64} strokeWidth={1.5} className="text-[#94A3B8] opacity-20" />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {editing ? (
            newImagePreviews.length > 1 && (
              <div className="flex gap-2 justify-center flex-wrap">
                {newImagePreviews.map((preview, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImageIdx === idx ? 'border-[#FF90E8] scale-105' : 'border-white/[0.08] hover:border-white/30'
                    }`}
                  >
                    <img src={preview} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )
          ) : (
            product.images && product.images.length > 1 && (
              <div className="flex gap-2 justify-center flex-wrap">
                {product.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImageIdx === idx ? 'border-[#FF90E8] scale-105' : 'border-white/[0.08] hover:border-white/30'
                    }`}
                  >
                    <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )
          )}

          {editing && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mx-auto mt-2 px-4 py-2 bg-white/[0.04] backdrop-blur border border-white/[0.08] rounded-full text-xs font-bold flex items-center gap-2"
                data-testid="change-product-image"
              >
                <ImageIcon size={14} strokeWidth={2.5} /> Change Images (Up to 5)
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
            </>
          )}
        </motion.div>

        {/* Product Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          {editing ? (
            <form onSubmit={handleUpdate} className="bg-white/[0.04] rounded-[20px] backdrop-blur-sm border border-white/[0.06] p-6" data-testid="edit-product-form">
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Product Name</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="neo-input w-full" required data-testid="edit-product-name" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Price (₹)</label>
                <input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="neo-input w-full" required data-testid="edit-product-price" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="neo-input w-full h-32 resize-none" required data-testid="edit-product-description" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setEditing(false); setNewImages([]); setNewImagePreviews([]); }} className="neo-button-outline flex items-center gap-2" data-testid="cancel-product-edit">
                  <X size={16} strokeWidth={2.5} /> Cancel
                </button>
                <button type="submit" disabled={uploading} className="neo-button-primary flex items-center gap-2" style={{ background: '#B4FF39' }} data-testid="save-product-edit">
                  <Save size={16} strokeWidth={2.5} /> {uploading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white/[0.04] rounded-[20px] backdrop-blur-sm border border-white/[0.06] p-6 md:p-8">
              {/* Admin badge */}
              {canManage && product.is_admin && !product.is_owner && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EC4899] border border-white/[0.08] rounded-full text-xs font-bold mb-3" data-testid="admin-badge">
                  <Shield size={14} strokeWidth={2.5} /> Admin Access
                </div>
              )}

              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="product-title">
                {product.title}
              </h1>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="product-price">
                  ₹{product.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {conditionBadge && (
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ color: conditionBadge.color, backgroundColor: conditionBadge.bg }}
                  >
                    {conditionBadge.label}
                  </span>
                )}
                {product.category && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#38BDF8]/15 text-[#38BDF8]">
                    {product.category}
                  </span>
                )}
                {product.city && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/[0.08] text-[#94A3B8]">
                    {product.city}
                  </span>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wide mb-2 text-[#94A3B8]">Description</h3>
                <p className="text-base leading-relaxed" data-testid="product-description">{product.description}</p>
              </div>

              {/* Enhanced Seller Info */}
              <div className="p-5 bg-[#0F172A] border border-white/[0.08] rounded-2xl mb-6" data-testid="seller-info">
                <h3 className="text-sm font-bold uppercase tracking-wide mb-4 text-[#94A3B8]">Seller</h3>
                <div className="flex items-start gap-3 mb-4">
                  {product.seller_image ? (
                    <img src={product.seller_image} alt={product.seller_name} className="w-14 h-14 rounded-full border-2 border-[#A855F7]/40 object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#A855F7] to-[#FF90E8] border-2 border-[#A855F7]/40 flex items-center justify-center font-bold text-lg shrink-0">
                      {product.seller_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link to={`/app/profile/${product.seller_id}`} className="font-bold hover:text-[#A855F7] transition-colors text-base" data-testid="seller-name-link">
                      {product.seller_name}
                    </Link>
                    <p className="text-sm text-[#94A3B8]">@{product.seller_username}</p>
                    {product.seller_bio && (
                      <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{product.seller_bio}</p>
                    )}
                  </div>
                </div>

                {/* Seller meta row */}
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#64748B]" />
                    <span className="text-xs text-[#94A3B8]">Seller since {sellerSinceYear}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Tag size={13} className="text-[#64748B]" />
                    <span className="text-xs text-[#94A3B8]">{sellerListingsCount} {sellerListingsCount === 1 ? 'listing' : 'listings'}</span>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="flex items-center gap-2 mb-4" data-testid="seller-rating">
                  <div className="flex items-center gap-0.5">
                    {renderStars(4.5)}
                  </div>
                  <span className="text-sm font-bold text-white">4.5</span>
                </div>

                {/* Action Buttons */}
                {!product.is_owner && (
                  <div className="flex gap-2">
                    <Link
                      to={`/app/profile/${product.seller_id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl font-bold text-sm hover:bg-white/[0.1] transition-all"
                      data-testid="view-seller-profile"
                    >
                      <User size={16} strokeWidth={2} /> View Profile
                    </Link>
                    <button
                      onClick={handleMessageSeller}
                      disabled={messaging}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FF90E8] to-[#A855F7] text-white rounded-xl font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                      data-testid="message-seller-button"
                    >
                      <MessageSquare size={16} strokeWidth={2} /> {messaging ? 'Connecting...' : 'Message'}
                    </button>
                  </div>
                )}
              </div>

              {/* Contact Seller */}
              {!product.is_owner && (
                <div className="flex flex-col gap-2 mb-4">
                  <a
                    href={`mailto:${product.seller_email}?subject=Inquiry about: ${product.title}`}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#A855F7] rounded-2xl font-bold text-base shadow-[0_4px_24px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 hover:shadow-xl transition-all"
                    data-testid="contact-seller-button"
                  >
                    <Mail size={18} strokeWidth={2.5} /> Email Seller
                  </a>
                </div>
              )}

              {/* Manage buttons */}
              {canManage && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setEditing(true)} className="flex-1 neo-button-outline flex items-center justify-center gap-2" data-testid="edit-product-button">
                    <Edit2 size={16} strokeWidth={2.5} /> Edit
                  </button>
                  <button onClick={handleDelete} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-100 border border-white/[0.08] rounded-full font-bold text-red-700 hover:bg-red-200 transition-colors" data-testid="delete-product-button">
                    <Trash2 size={16} strokeWidth={2.5} /> {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;