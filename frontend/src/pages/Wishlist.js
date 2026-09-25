import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Heart, Trash2, ShoppingBag, Tag, Image as ImageIcon, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const Wishlist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const fetchWishlist = useCallback(async () => {
    if (!user?._id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/api/users/${user._id}/wishlist`);
      setItems(Array.isArray(data) ? data : data?.items || data?.wishlist || []);
    } catch (_) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const handleRemove = async (e, productId) => {
    e.stopPropagation();
    setRemovingId(productId);
    try {
      await api.delete(`/api/products/${productId}/wishlist`);
      toast.success('Removed from wishlist');
      setItems(prev => prev.filter(item => (item._id || item.id || item.product_id) !== productId));
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to remove');
    } finally {
      setRemovingId(null);
    }
  };

  const handleClick = (productId) => {
    navigate(`/app/shop/${productId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#EC4899] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 py-5" data-testid="wishlist-page">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }}>
          <Heart size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Wishlist</h1>
          <p className="text-[11px] text-[#94A3B8]">
            {items.length > 0 ? `${items.length} item${items.length === 1 ? '' : 's'} saved` : 'Your saved items'}
          </p>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
          <div className="w-14 h-14 bg-[#EC4899]/10 border border-[#EC4899]/25 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart size={24} className="text-[#EC4899]" />
          </div>
          <h3 className="text-white font-bold text-base mb-1">Your Wishlist is Empty</h3>
          <p className="text-[#64748B] text-xs max-w-sm mx-auto leading-relaxed mb-4">
            Tap the heart icon on products you love to save them here for later.
          </p>
          <button
            onClick={() => navigate('/app/shop')}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }}
          >
            Browse Shop
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => {
            const id = item._id || item.id || item.product_id;
            const title = item.title || item.name || 'Untitled';
            const price = item.price;
            const image = item.image || item.images?.[0];
            const seller = item.seller_name || item.creator_name || 'Unknown Seller';

            return (
              <motion.div
                key={id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleClick(id)}
                className="flex gap-3.5 items-center p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:bg-white/[0.06] transition-all group"
              >
                {/* Product Image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/[0.06] flex-shrink-0 border border-white/[0.06]">
                  {image ? (
                    <img src={image} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#EC4899]/10 to-[#A855F7]/10">
                      <Tag size={20} className="text-[#64748B] opacity-50" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-bold text-white truncate">{title}</h3>
                  <p className="text-[11px] text-[#64748B] truncate mt-0.5">by {seller}</p>
                  {price !== undefined && price !== null && (
                    <p className="text-[14px] font-bold text-white mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      ₹{Number(price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => handleRemove(e, id)}
                  disabled={removingId === id}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/[0.06] border border-white/[0.08] text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all disabled:opacity-50"
                  aria-label="Remove from wishlist"
                >
                  {removingId === id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
