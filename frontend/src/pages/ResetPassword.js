import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import api from '@/lib/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, new_password: password });
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. The link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-[24px] p-8 text-center max-w-md">
          <p className="text-red-400 mb-4">Invalid or missing reset token.</p>
          <Link to="/login" className="neo-button-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-[24px] shadow-2xl p-8">
          {success ? (
            <div className="text-center" data-testid="reset-success">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Check className="text-emerald-400" size={32} />
              </div>
              <h1 className="text-2xl font-bold mb-2 text-white">Password Reset!</h1>
              <p className="text-[#94A3B8]">Redirecting to login...</p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-2 gradient-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
                New Password
              </h1>
              <p className="text-[#94A3B8] mb-6">Choose a strong password for your account</p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
                  <p className="text-red-400 text-sm" data-testid="reset-error">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} data-testid="reset-form">
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                      <input data-testid="reset-password" type="password" value={password}
                        onChange={(e) => setPassword(e.target.value)} className="neo-input w-full pl-11"
                        placeholder="Min 6 characters" required minLength={6} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                      <input data-testid="reset-confirm" type="password" value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)} className="neo-input w-full pl-11"
                        placeholder="Repeat password" required />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="neo-button-primary w-full" data-testid="reset-submit">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
