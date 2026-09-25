import { Link } from 'react-router-dom';

const PublicFooter = () => (
  <footer className="bg-[#0F172A] border-t border-white/[0.04]">
    <div className="container mx-auto px-6 py-16">
      <div className="grid md:grid-cols-4 gap-10 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>
              <span className="text-white font-bold text-sm">+</span>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Cross Crafted</span>
          </div>
          <p className="text-sm text-[#64748B] leading-relaxed">
            Where faith becomes a story,<br />and stories become a movement.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8] mb-4">Platform</h4>
          <div className="space-y-2.5">
            <Link to="/about" className="block text-sm text-[#64748B] hover:text-white transition-colors">About</Link>
            <Link to="/for-churches" className="block text-sm text-[#64748B] hover:text-white transition-colors">For Churches</Link>
            <Link to="/for-creators" className="block text-sm text-[#64748B] hover:text-white transition-colors">For Creators</Link>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8] mb-4">Connect</h4>
          <div className="space-y-2.5">
            <Link to="/contact" className="block text-sm text-[#64748B] hover:text-white transition-colors">Contact</Link>
            <a href="#" className="block text-sm text-[#64748B] hover:text-white transition-colors">Community Guidelines</a>
            <a href="#" className="block text-sm text-[#64748B] hover:text-white transition-colors">Help Center</a>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8] mb-4">Legal</h4>
          <div className="space-y-2.5">
            <a href="#" className="block text-sm text-[#64748B] hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="block text-sm text-[#64748B] hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
      <div className="pt-8 border-t border-white/[0.04] flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-[#475569]">&copy; 2026 Cross Crafted. All rights reserved.</p>
        <p className="text-xs text-[#475569]">Made with faith, for the faithful.</p>
      </div>
    </div>
  </footer>
);

export default PublicFooter;
