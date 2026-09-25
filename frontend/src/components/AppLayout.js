import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Calendar, User, LogOut, Compass, ShoppingBag, Shield, Plus, Search, Bell, MessageCircle, Heart, Sparkles, Award, HeartHandshake, BookOpen, Building2, Store } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import LanguageSwitcher from '@/components/LanguageSwitcher';


const AppLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [headerVisible, setHeaderVisible] = useState(true);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const lastScrollY = useRef(0);

  const handleLogout = async () => { await logout(); window.location.href = '/'; };
  const isActive = (path) => {
    if (path.includes('tab=discover')) {
      return location.pathname === '/app/feed' && !location.search.includes('tab=connections');
    }
    if (path.includes('tab=connections')) {
      return location.pathname === '/app/feed' && location.search.includes('tab=connections');
    }
    const cleanPath = path.split('?')[0];
    return location.pathname === cleanPath || location.pathname.startsWith(cleanPath + '/');
  };

  // Fetch unread counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [notifRes, msgRes] = await Promise.all([
          api.get('/api/notifications/unread-count'),
          api.get('/api/messages/unread-count')
        ]);
        setUnreadNotifs(notifRes.data.unread_count || 0);
        setUnreadMessages(msgRes.data.unread_count || 0);
      } catch (_) {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Auto-hide header on scroll down, show on scroll up (mobile only)
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 10) { setHeaderVisible(true); }
      else if (y > lastScrollY.current + 8) { setHeaderVisible(false); }
      else if (y < lastScrollY.current - 8) { setHeaderVisible(true); }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reset header on route change
  useEffect(() => { setHeaderVisible(true); lastScrollY.current = 0; }, [location.pathname]);

  const sidebarLinks = [
    { to: '/app/churches', icon: Search, label: 'Churches' },
    { to: '/app/events', icon: Calendar, label: 'Events' },
    { to: '/app/trivia', icon: Award, label: 'Bible Trivia' },
    { to: '/app/apologetics', icon: BookOpen, label: 'Apologetics' },
    { to: '/app/list-church', icon: Building2, label: 'List Your Church' },
    { to: '/app/marketplace', icon: Store, label: 'Marketplace' },
    { to: '/app/prayer-wall', icon: HeartHandshake, label: 'Prayer Wall' },
  ];

  return (
    <div className="min-h-screen bg-[#12101A]">
      {/* Header — auto-hides on mobile scroll */}
      <header
        className={`sticky top-0 z-50 bg-[#12101A]/80 backdrop-blur-2xl border-b border-white/[0.04] transition-transform duration-300 ${
          headerVisible ? 'translate-y-0' : 'md:translate-y-0 -translate-y-full'
        }`}
        data-testid="app-header"
      >
        <div className="flex justify-between items-center h-12 md:h-14 px-4 md:px-5">
          <Link to="/app/feed" className="flex items-center gap-2" data-testid="app-logo">
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
            
            {/* Logo Text */}
            <h1 className="text-base md:text-lg font-black tracking-tight text-white flex items-center">
              crosscrafted
            </h1>
          </Link>
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <span className="text-sm text-[#94A3B8]" data-testid="user-name-display">{user?.name}</span>
            <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-white/5 transition-colors" data-testid="logout-button">
              <LogOut size={18} strokeWidth={1.8} className="text-[#64748B]" />
            </button>
          </div>
          {/* Mobile: minimal right side */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            {user?.role === 'admin' && (
              <Link to="/app/admin" data-testid="mobile-admin-link">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06]">
                  <Shield size={14} className="text-[#A855F7]" />
                </div>
              </Link>
            )}
            <button onClick={handleLogout} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06]" data-testid="mobile-logout-button">
              <LogOut size={14} className="text-[#64748B]" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r border-white/[0.04] min-h-[calc(100vh-56px)] sticky top-[56px] bg-[#0B1120] px-3 pt-6" data-testid="desktop-sidebar">
          <nav className="space-y-1">
            {sidebarLinks.map(({ to, icon: Icon, label, badge }) => (
              <Link to={to} key={to} data-testid={`nav-${label.toLowerCase().replace(' ', '-')}-link`}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-[14px] transition-all duration-200 ${
                  isActive(to)
                    ? 'bg-[#7C3AED]/15 text-white border border-[#7C3AED]/30 shadow-[0_0_15px_rgba(124,58,237,0.1)]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}>
                  <div className="relative">
                    <Icon size={18} strokeWidth={isActive(to) ? 2.4 : 1.8} className={isActive(to) ? "text-[#7C3AED]" : ""} />
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#FB7185] flex items-center justify-center text-[9px] font-extrabold text-white" data-testid={`${label.toLowerCase()}-badge`}>
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </div>
                  {label}
                  {isActive(to) && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />}
                </div>
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link to="/app/admin" data-testid="nav-admin-link">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-[14px] transition-all duration-200 ${
                  location.pathname.startsWith('/app/admin')
                    ? 'bg-white/[0.08] text-white border border-white/10'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}>
                  <Shield size={18} strokeWidth={1.8} />
                  Admin
                </div>
              </Link>
            )}
          </nav>
        </aside>

        <main className="flex-1 pb-24 md:pb-6 scroll-smooth bg-[#0B1120]"><Outlet /></main>
      </div>

      {/* ========== MOBILE BOTTOM NAV ========== */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 rounded-[20px] bg-[#111827]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.6)]" data-testid="mobile-bottom-nav">
        <div className="flex items-center justify-around h-14 px-1">
          <NavItem to="/app/churches" icon={Search} label="Churches" active={isActive('/app/churches')} />
          <NavItem to="/app/trivia" icon={Award} label="Trivia" active={isActive('/app/trivia')} />
          <NavItem to="/app/apologetics" icon={BookOpen} label="Apologetics" active={isActive('/app/apologetics')} />
          <NavItem to="/app/list-church" icon={Building2} label="Church" active={isActive('/app/list-church')} />
          <NavItem to="/app/marketplace" icon={Store} label="Shop" active={isActive('/app/marketplace')} />
        </div>
      </nav>
    </div>
  );
};

/* Compact nav item with filled active icon */
const NavItem = ({ to, icon: Icon, label, active, badge }) => (
  <Link to={to} className="nav-item-mobile flex flex-col items-center justify-center relative py-1" data-testid={`mobile-nav-${label.toLowerCase().replace(' ', '-')}`}>
    <div className="relative flex items-center justify-center">
      <Icon
        size={20}
        strokeWidth={active ? 2.2 : 1.6}
        fill={active ? 'currentColor' : 'none'}
        className={`transition-all duration-200 ${active ? 'text-[#38BDF8] scale-110 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]' : 'text-[#94A3B8] hover:text-white'}`}
      />
      {badge > 0 && (
        <span className="absolute -top-1.5 -right-2.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-[#FB7185] flex items-center justify-center text-[8px] font-extrabold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      {active && (
        <motion.div
          layoutId="mobile-nav-indicator"
          className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </div>
    <span className={`text-[9px] font-bold tracking-wide mt-1 transition-all ${active ? 'text-white font-extrabold' : 'text-[#94A3B8]'}`}>
      {label}
    </span>
  </Link>
);

export default AppLayout;
