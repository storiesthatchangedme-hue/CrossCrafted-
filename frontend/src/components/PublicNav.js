import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PublicNav = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (path) => location.pathname === path;

  const links = [
    { to: '/about', label: 'About' },
    { to: '/for-churches', label: 'Churches' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#12101A]/70 backdrop-blur-2xl border-b border-white/[0.04]" data-testid="home-nav">
      <div className="container mx-auto px-6 flex justify-between items-center h-16">
        <Link to="/" className="flex items-center gap-2">
          {/* Stacked Cards Logo Icon */}
          <div className="relative w-8 h-8 shrink-0">
            {/* Back tilted card */}
            <div className="absolute inset-0 rounded-lg bg-[#2B254E] border border-white/[0.05] shadow-sm transform -rotate-12 translate-x-[-1px] translate-y-[1px]" />
            {/* Front card */}
            <div className="absolute inset-0 rounded-lg bg-[#F39B9B] shadow-sm flex items-center justify-center">
              {/* Bold black cross inside */}
              <span className="text-slate-950 font-black text-sm select-none">+</span>
              {/* Lavender/purple star in top-right */}
              <span className="absolute top-0.5 right-0.5 text-[#9786E3] text-[6px] select-none">★</span>
            </div>
          </div>
          <span className="text-lg font-black text-white tracking-tight flex items-center gap-1">
            crosscrafted
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Link key={to} to={to} data-testid={`nav-${label.toLowerCase()}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(to) ? 'text-white bg-white/[0.08]' : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
              }`}>
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" data-testid="nav-login-button">
            <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#94A3B8] hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-all">
              Log In
            </button>
          </Link>
          <Link to="/register" data-testid="nav-register-button">
            <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-950 transition-all hover:-translate-y-px bg-[#F39B9B] hover:bg-[#E27B7B] shadow-lg shadow-[#F39B9B]/10">
              Sign Up
            </button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#12101A]/95 backdrop-blur-2xl border-b border-white/[0.04] overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {links.map(({ to, label }) => (
                <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                   className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(to) ? 'text-white bg-white/[0.08]' : 'text-[#94A3B8] hover:text-white'
                  }`}>
                  {label}
                </Link>
              ))}
              <div className="flex gap-3 pt-3">
                <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <button className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-[#94A3B8] border border-white/[0.08]">Log In</button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <button className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-950 bg-[#F39B9B] hover:bg-[#E27B7B]"
                    >Sign Up</button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default PublicNav;
