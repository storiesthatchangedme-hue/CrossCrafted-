import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import {
  LayoutDashboard, Users, FileText, Church, Calendar,
  ShoppingBag, ArrowLeft, Shield, ScrollText, UserCheck, MessageCircle, HelpCircle, ShieldAlert, Building2, Store
} from 'lucide-react';

const AdminLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/app/feed');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/app/admin', icon: LayoutDashboard, label: 'Dashboard', color: '#A855F7' },
    { path: '/app/admin/approvals', icon: UserCheck, label: 'Approvals', color: '#F59E0B' },
    { path: '/app/admin/users', icon: Users, label: 'Users', color: '#3B82F6' },
    { path: '/app/admin/churches', icon: Church, label: 'Churches', color: '#10B981' },
    { path: '/app/admin/events', icon: Calendar, label: 'Events', color: '#F59E0B' },
    { path: '/app/admin/businesses', icon: Building2, label: 'Businesses', color: '#06B6D4' },
    { path: '/app/admin/marketplace', icon: Store, label: 'Marketplace', color: '#8B5CF6' },
    { path: '/app/admin/products', icon: ShoppingBag, label: 'Products', color: '#EC4899' },
    { path: '/app/admin/trivia', icon: HelpCircle, label: 'Trivia', color: '#FBBF24' },
    { path: '/app/admin/posts', icon: FileText, label: 'Posts', color: '#EC4899' },
    { path: '/app/admin/reports', icon: ShieldAlert, label: 'Reports', color: '#EF4444' },
    { path: '/app/admin/comments', icon: MessageCircle, label: 'Comments', color: '#06B6D4' },
    { path: '/app/admin/logs', icon: ScrollText, label: 'Activity', color: '#F97316' },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white" data-testid="admin-layout">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur-xl border-b border-white/[0.06] py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A855F7] to-[#EC4899] flex items-center justify-center">
              <Shield size={18} strokeWidth={2.5} />
            </div>
            <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Admin Panel
            </h1>
          </div>
          <Link
            to="/app/churches"
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-full text-sm font-medium transition-all"
            data-testid="admin-back-to-app"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            Back to App
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-60 border-r border-white/[0.06] min-h-[calc(100vh-65px)] sticky top-[65px] bg-[#0F172A] p-4 gap-1" data-testid="admin-sidebar">
          {navItems.map((item) => (
            <Link to={item.path} key={item.path} data-testid={`admin-nav-${item.label.toLowerCase()}`}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  isActive(item.path)
                    ? 'bg-white/[0.08] text-white border border-white/[0.1]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <item.icon
                  size={18}
                  strokeWidth={2.5}
                  style={isActive(item.path) ? { color: item.color } : {}}
                />
                {item.label}
              </div>
            </Link>
          ))}
        </aside>

        {/* Mobile Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-xl border-t border-white/[0.06] flex justify-around items-center py-2 px-1">
          {navItems.map((item) => (
            <Link to={item.path} key={item.path} className="flex flex-col items-center p-1.5">
              <item.icon
                size={20}
                strokeWidth={2.5}
                style={isActive(item.path) ? { color: item.color } : {}}
                className={isActive(item.path) ? '' : 'text-[#94A3B8]'}
              />
              <span className={`text-[9px] mt-0.5 font-medium ${isActive(item.path) ? 'text-white' : 'text-[#94A3B8]'}`}>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 p-6 pb-24 md:pb-6 min-h-[calc(100vh-65px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
