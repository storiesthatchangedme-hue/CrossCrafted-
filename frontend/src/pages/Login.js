import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.71 7.76 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.76 1 3.99 3.3 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle, user } = useAuth();
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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    const result = await loginWithGoogle();
    if (!result.success) {
      setError(result.error || 'Google sign-in failed');
      setGoogleLoading(false);
    }
    // If success, user will be redirected by OAuth flow
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

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 mb-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all disabled:opacity-50"
            data-testid="google-login-button">
            <GoogleIcon />
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-[11px] text-[#64748B] font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

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