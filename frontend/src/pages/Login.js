import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
    }
  }, [location.state]);

  // If already logged in and onboarding complete, redirect to feed
  useEffect(() => {
    if (user && user !== false && user.onboarding_complete) {
      navigate('/app/feed', { replace: true });
    } else if (user && user !== false && !user.onboarding_complete) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!password) { setError('Please enter your password'); return; }
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      // AuthContext onAuthStateChange will update user and redirect is handled by useEffect above
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4" role="main">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-[24px] shadow-2xl p-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Welcome Back
          </h1>
          <p className="text-[#94A3B8] mb-6">Sign in to continue your journey</p>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl" data-testid="login-error" role="alert" aria-live="assertive">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} data-testid="login-form">
            <div className="mb-4">
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={20} strokeWidth={2.5} />
                <input
                  data-testid="login-email-input" aria-label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="neo-input w-full pl-12"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={20} strokeWidth={2.5} />
                <input
                  data-testid="login-password-input" aria-label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neo-input w-full pl-12"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="text-right mb-6">
              <Link to="/forgot-password" className="text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors" data-testid="forgot-password-link">
                Forgot password?
              </Link>
            </div>

            <button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="neo-button-primary w-full"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-[#94A3B8]">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-white hover:text-[#A855F7]" data-testid="register-link">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;