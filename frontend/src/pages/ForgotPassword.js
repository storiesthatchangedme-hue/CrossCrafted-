import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Check } from 'lucide-react';
import api from '@/lib/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-[24px] shadow-2xl p-8">
          {sent ? (
            <div className="text-center" data-testid="forgot-success">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Check className="text-emerald-400" size={32} />
              </div>
              <h1 className="text-2xl font-bold mb-2 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Check Your Email
              </h1>
              <p className="text-[#94A3B8] mb-6">
                If an account with that email exists, we've sent password reset instructions.
              </p>
              <Link to="/login" className="neo-button-primary inline-flex items-center gap-2" data-testid="back-to-login">
                <ArrowLeft size={18} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="inline-flex items-center gap-1 text-[#94A3B8] hover:text-white text-sm mb-4 transition-colors">
                <ArrowLeft size={16} /> Back to Login
              </Link>
              <h1 className="text-3xl font-bold mb-2 gradient-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Forgot Password
              </h1>
              <p className="text-[#94A3B8] mb-6">Enter your email and we'll send you a reset link</p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
                  <p className="text-red-400 text-sm" data-testid="forgot-error">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} data-testid="forgot-form">
                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                    <input data-testid="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="neo-input w-full pl-11" placeholder="your@email.com" required />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="neo-button-primary w-full" data-testid="forgot-submit">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
