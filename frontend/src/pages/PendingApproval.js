import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const PendingApproval = () => {
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    await checkAuth();
    setChecking(false);
    // If user is now active, AuthContext will update and ProtectedRoute will allow access
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-[24px] shadow-2xl p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Clock className="text-#38BDF8" size={36} />
          </div>

          <h1 className="text-3xl font-bold mb-2 gradient-text" data-testid="pending-title" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Under Review
          </h1>
          <p className="text-[#94A3B8] mb-2">
            Welcome{user?.name ? `, ${user.name}` : ''}! Your account is being reviewed by our admin team.
          </p>
          <p className="text-[#64748B] text-sm mb-8">
            This usually takes a short while. You'll get full access once approved.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="neo-button-primary w-full flex items-center justify-center gap-2"
              data-testid="check-status-btn"
            >
              <RefreshCw size={18} className={checking ? 'animate-spin' : ''} />
              {checking ? 'Checking...' : 'Check Status'}
            </button>
            <button
              onClick={handleLogout}
              className="neo-button w-full flex items-center justify-center gap-2 text-[#94A3B8]"
              data-testid="pending-logout-btn"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PendingApproval;
