import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Building2, Plus, X, Trash2, Edit, Search, MapPin, Phone, Mail, Globe } from 'lucide-react';

const CATEGORIES = ['Bookstore', 'Café', 'Printing', 'Event Planning', 'Music', 'Counseling', 'Education', 'Fashion', 'Health', 'Technology', 'Other'];

const MOCK_BUSINESSES = [
  { _id: 'b1', name: 'Shepherd Bookstore', category: 'Bookstore', owner: 'John Philip', city: 'Kochi', state: 'Kerala', phone: '+91 98765 11111', email: 'info@shepherdbooks.in', description: 'Christian literature and Bibles.', status: 'active' },
  { _id: 'b2', name: 'Grace Café', category: 'Café', owner: 'Mary Thomas', city: 'Bangalore', state: 'Karnataka', phone: '+91 98765 22222', email: 'hello@gracecafe.in', description: 'Christian café with worship nights.', status: 'active' },
  { _id: 'b3', name: 'Praise Prints', category: 'Printing', owner: 'Daniel Raj', city: 'Chennai', state: 'Tamil Nadu', phone: '+91 98765 33333', email: 'orders@praiseprints.in', description: 'Church banners and bulletins printing.', status: 'pending' },
];

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Bookstore', owner: '', city: '', state: '', phone: '', email: '', website: '', description: '' });

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/businesses');
      setBusinesses(Array.isArray(data) ? data : (Array.isArray(data.businesses) ? data.businesses : MOCK_BUSINESSES));
    } catch (_) {
      setBusinesses(MOCK_BUSINESSES);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/businesses', form);
      toast.success('Business added!');
      setShowForm(false);
      setForm({ name: '', category: 'Bookstore', owner: '', city: '', state: '', phone: '', email: '', website: '', description: '' });
      fetchBusinesses();
    } catch (_) { toast.error('Failed to add business'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this business?')) return;
    try {
      await api.delete(`/api/admin/businesses/${id}`);
      toast.success('Business deleted');
      fetchBusinesses();
    } catch (_) { toast.error('Failed to delete'); }
  };

  const filtered = (Array.isArray(businesses) ? businesses : []).filter(b =>
    !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[#A855F7] animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Business Directory</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #06B6D4, #3B82F6)' }}>
          <Plus size={16} /> Add Business
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search businesses..." className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#A855F7]/40" />
      </div>

      <div className="text-sm text-[#94A3B8]">{filtered.length} businesses</div>

      <div className="space-y-3">
        {filtered.map(b => (
          <div key={b._id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Building2 size={16} className="text-[#06B6D4]" /> {b.name}
                </h3>
                <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-[#94A3B8]">
                  <span className="px-2 py-0.5 rounded-md bg-[#06B6D4]/10 text-[#06B6D4]">{b.category}</span>
                  {b.city && <span className="flex items-center gap-1"><MapPin size={10} />{b.city}, {b.state}</span>}
                  {b.phone && <span className="flex items-center gap-1"><Phone size={10} />{b.phone}</span>}
                </div>
                <p className="text-xs text-[#94A3B8] mt-1.5">{b.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{b.status || 'active'}</span>
                <button onClick={() => handleDelete(b._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#94A3B8] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-[#1E293B] border border-white/[0.08] rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Add Business</h2>
              <button onClick={() => setShowForm(false)} className="text-[#64748B] hover:text-white p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              {[
                { key: 'name', label: 'Business Name', required: true },
                { key: 'owner', label: 'Owner' },
                { key: 'city', label: 'City' },
                { key: 'state', label: 'State' },
                { key: 'phone', label: 'Phone' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'website', label: 'Website' },
              ].map(({ key, label, required, type }) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">{label}</label>
                  <input type={type || 'text'} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white" required={required} />
                </div>
              ))}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white h-20 resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-white/[0.08] text-[#94A3B8] hover:text-white">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #06B6D4, #3B82F6)' }}>Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
