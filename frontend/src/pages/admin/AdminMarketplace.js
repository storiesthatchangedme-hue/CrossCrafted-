import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Store, Plus, X, Trash2, Search, Tag, MessageCircle, DollarSign } from 'lucide-react';

const CATEGORIES = ['Books', 'Bibles', 'Music', 'Apparel', 'Gifts', 'Handmade', 'Events', 'Services', 'Free Items'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Free'];

const MOCK_LISTINGS = [
  { _id: 'm1', title: 'Study Bible - ESV', price: 1200, category: 'Bibles', condition: 'New', description: 'ESV Study Bible, hardcover.', whatsapp: '919876543210', seller: 'Shepherd Bookstore', status: 'active' },
  { _id: 'm2', title: 'Worship Guitar - Yamaha', price: 8500, category: 'Music', condition: 'Like New', description: 'Yamaha acoustic guitar.', whatsapp: '919876511111', seller: 'Praise Music', status: 'active' },
  { _id: 'm3', title: 'Christian T-Shirt Set', price: 450, category: 'Apparel', condition: 'New', description: 'Set of 3 Christian t-shirts.', whatsapp: '919876522222', seller: 'Faith Wear', status: 'pending' },
  { _id: 'm4', title: 'Free: Devotional Bundle', price: 0, category: 'Free Items', condition: 'Free', description: '5 gently used devotional books.', whatsapp: '919876533333', seller: 'Grace Community', status: 'active' },
];

export default function AdminMarketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', price: '', category: 'Books', condition: 'New', description: '', whatsapp: '', seller: '' });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/marketplace');
      setListings(Array.isArray(data) ? data : (Array.isArray(data.listings) ? data.listings : MOCK_LISTINGS));
    } catch (_) {
      setListings(MOCK_LISTINGS);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/marketplace', { ...form, price: parseFloat(form.price) || 0 });
      toast.success('Listing added!');
      setShowForm(false);
      setForm({ title: '', price: '', category: 'Books', condition: 'New', description: '', whatsapp: '', seller: '' });
      fetchListings();
    } catch (_) { toast.error('Failed to add listing'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await api.delete(`/api/admin/marketplace/${id}`);
      toast.success('Listing deleted');
      fetchListings();
    } catch (_) { toast.error('Failed to delete'); }
  };

  const filtered = (Array.isArray(listings) ? listings : []).filter(l =>
    !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.seller?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[#A855F7] animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A855F7)' }}>
          <Plus size={16} /> Add Listing
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search listings..." className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#A855F7]/40" />
      </div>

      <div className="text-sm text-[#94A3B8]">{filtered.length} listings</div>

      <div className="space-y-3">
        {filtered.map(l => (
          <div key={l._id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Store size={16} className="text-[#8B5CF6]" /> {l.title}
                </h3>
                <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-[#94A3B8]">
                  <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/10 text-[#8B5CF6]">{l.category}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.04]">{l.condition}</span>
                  <span className="flex items-center gap-1 font-bold text-[#22C55E]"><DollarSign size={10} />₹{l.price}</span>
                  {l.seller && <span>by {l.seller}</span>}
                  {l.whatsapp && <a href={`https://wa.me/${l.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#22C55E] hover:underline"><MessageCircle size={10} />WhatsApp</a>}
                </div>
                <p className="text-xs text-[#94A3B8] mt-1.5">{l.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${l.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{l.status || 'active'}</span>
                <button onClick={() => handleDelete(l._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#94A3B8] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-[#1E293B] border border-white/[0.08] rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Add Listing</h2>
              <button onClick={() => setShowForm(false)} className="text-[#64748B] hover:text-white p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Price (₹)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Condition</label>
                  <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white">
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Seller Name</label>
                <input type="text" value={form.seller} onChange={(e) => setForm({ ...form, seller: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">WhatsApp Number</label>
                <input type="text" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="919876543210" className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white h-20 resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-white/[0.08] text-[#94A3B8] hover:text-white">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A855F7)' }}>Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
