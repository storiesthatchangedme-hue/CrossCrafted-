import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Tag, Plus, X } from 'lucide-react';
import { toast } from 'sonner';


const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', price: 0, image: '' });

  const fetchProducts = useCallback(async (q = '') => {
    try {
      const { data } = await api.get(`/api/admin/products?search=${encodeURIComponent(q)}`);
      setProducts(Array.isArray(data?.products) ? data.products : []);
      setTotal(data?.total || 0);
    } catch (_) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (e) => { e.preventDefault(); setLoading(true); fetchProducts(search); };

  const handleDelete = async (productId, title) => {
    if (!window.confirm(`Delete product "${title}"?`)) return;
    try {
      await api.delete(`/api/admin/products/${productId}`);
      toast.success('Product deleted');
      fetchProducts(search);
    } catch (_) {
      toast.error('Failed to delete product');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/products', { ...formData, price: parseFloat(formData.price) || 0 });
      toast.success('Product created!');
      setShowCreate(false);
      setFormData({ title: '', description: '', price: 0, image: '' });
      fetchProducts(search);
    } catch (_) {
      toast.error('Failed to create product');
    }
  };

  return (
    <div data-testid="admin-products-page">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Products <span className="text-base text-[#94A3B8] font-normal">({total})</span>
        </h1>
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="bg-white/[0.06] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-[#94A3B8] w-60 focus:outline-none focus:border-[#8B5CF6]" data-testid="admin-products-search" />
            </div>
            <button type="submit" className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm font-medium hover:bg-white/[0.1] transition-colors">Search</button>
          </form>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#8B5CF6] text-white rounded-xl text-sm font-bold hover:bg-[#8B5CF6]/90 transition-colors" data-testid="admin-create-product">
            <Plus size={14} /> Create
          </button>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="bg-[#1E293B] border border-white/[0.08] rounded-[24px] w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Create Product</h2>
                <button onClick={() => setShowCreate(false)} className="text-[#64748B] hover:text-white p-1"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="neo-input w-full text-sm" required />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Price ($)</label>
                  <input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="neo-input w-full text-sm" required />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Image URL (optional)</label>
                  <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="neo-input w-full text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="neo-input w-full h-20 resize-none text-sm" required />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowCreate(false)} className="neo-button-outline flex-1 py-2.5 text-sm">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 transition-all">Create Product</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#8B5CF6] border-r-transparent mx-auto" /></div>
      ) : (
        <div className="space-y-3">
          {products.map((product, i) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 hover:bg-white/[0.06] transition-colors"
              data-testid="admin-product-row"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-xl border border-white/[0.08] overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#8B5CF6]/10">
                        <Tag size={20} className="text-[#94A3B8] opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base truncate">{product.title}</h3>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-[#8B5CF6]" style={{ fontFamily: 'Outfit, sans-serif' }}>${product.price?.toFixed(2)}</span>
                      <span className="text-[#94A3B8]">by {product.seller_name || 'Unknown'}</span>
                      <span className="text-xs text-[#94A3B8]">{product.created_at ? new Date(product.created_at).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(product._id, product.title)}
                  className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-colors text-sm font-medium flex-shrink-0"
                  data-testid="admin-delete-product"
                >
                  <Trash2 size={14} strokeWidth={2.5} /> Remove
                </button>
              </div>
            </motion.div>
          ))}
          {products.length === 0 && <div className="text-center py-10 text-[#94A3B8]">No products found.</div>}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
