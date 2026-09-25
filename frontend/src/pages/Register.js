import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, MapPin, Globe, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { INDIAN_STATES, LANGUAGES } from '@/constants/india';
import { MultiSelect } from '@/components/MultiSelect';

const FAITH_BELIEF_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'exploring', label: "I'm exploring" },
  { value: 'not_sure', label: 'Not sure' },
];

const FAITH_JOURNEY_OPTIONS = [
  { value: 'christian', label: 'Christian' },
  { value: 'new_believer', label: 'New believer' },
  { value: 'exploring_christianity', label: 'Exploring Christianity' },
  { value: 'other', label: 'Other' },
];

const CHURCH_MEMBER_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'looking_for_one', label: 'Looking for one' },
];

const Register = () => {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('user');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [languages, setLanguages] = useState([]);
  const [faithBelief, setFaithBelief] = useState('');
  const [faithJourney, setFaithJourney] = useState('');
  const [churchMember, setChurchMember] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  // After registration or login, redirect based on onboarding status
  useEffect(() => {
    if (user && user !== false && user.onboarding_complete) {
      navigate('/app/feed', { replace: true });
    } else if (user && user !== false && !user.onboarding_complete) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, navigate]);

  const steps = [
    { title: 'Your Faith', subtitle: 'Tell us about your journey' },
    { title: 'Account', subtitle: 'Create your login' },
    { title: 'Location', subtitle: 'Connect with your community' },
  ];

  const canAdvance = () => {
    if (step === 0) return faithBelief && faithJourney && churchMember;
    if (step === 1) return name.trim() && email.trim() && username.trim() && password.length >= 6;
    if (step === 2) return state && city.trim() && languages.length > 0;
    return false;
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    const result = await register(email, password, name, username, role, state, city, languages, faithBelief, faithJourney, churchMember);
    setLoading(false);
    if (result.success) {
      // AuthContext onAuthStateChange will update user; useEffect handles redirect
    } else {
      setError(result.error);
    }
  };

  const RadioGroup = ({ options, value, onChange, name: groupName }) => (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          data-testid={`reg-${groupName}-${opt.value}`}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${
            value === opt.value
              ? 'border-[#A855F7] bg-[#A855F7]/10 text-white'
              : 'border-white/[0.08] bg-white/[0.03] text-[#CBD5E1] hover:border-white/[0.15]'
          }`}
        >
          <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
            value === opt.value ? 'border-[#A855F7]' : 'border-white/20'
          }`} style={{ width: 18, height: 18 }}>
            {value === opt.value && <div className="w-2 h-2 rounded-full bg-[#A855F7]" />}
          </div>
          <span className="text-sm font-medium">{opt.label}</span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4" role="main">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-[24px] shadow-2xl p-8">
          {/* Progress */}
          <div className="flex gap-2 mb-5" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={3}>
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-[#A855F7]' : 'bg-white/10'}`} />
            ))}
          </div>

          <h1 className="text-3xl font-bold mb-1 gradient-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {steps[step].title}
          </h1>
          <p className="text-[#94A3B8] mb-5">{steps[step].subtitle}</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl" data-testid="register-error" role="alert" aria-live="assertive">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 0: Faith Questions */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[#94A3B8]">
                      Do you believe in Jesus Christ as your Lord and Savior?
                    </label>
                    <RadioGroup options={FAITH_BELIEF_OPTIONS} value={faithBelief} onChange={setFaithBelief} name="faith-belief" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[#94A3B8]">
                      Which best describes your faith journey?
                    </label>
                    <RadioGroup options={FAITH_JOURNEY_OPTIONS} value={faithJourney} onChange={setFaithJourney} name="faith-journey" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[#94A3B8]">
                      Are you part of a church or Christian community?
                    </label>
                    <RadioGroup options={CHURCH_MEMBER_OPTIONS} value={churchMember} onChange={setChurchMember} name="church-member" />
                  </div>
                </div>
              )}

              {/* Step 1: Account Details */}
              {step === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                      <input data-testid="register-name-input" type="text" value={name} onChange={(e) => setName(e.target.value)} className="neo-input w-full pl-11" placeholder="Your name" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                      <input data-testid="register-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="neo-input w-full pl-11" placeholder="your@email.com" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm font-bold">@</span>
                      <input data-testid="register-username-input" type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))} className="neo-input w-full pl-11" placeholder="username" required pattern="[a-z0-9_]+" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                      <input data-testid="register-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="neo-input w-full pl-11" placeholder="Min 6 characters" required minLength={6} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">I am a</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className="neo-input w-full" data-testid="register-role-select">
                      <option value="user">Believer</option>
                      <option value="creator">Content Creator</option>
                      <option value="church">Church Leader</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">
                      <MapPin size={12} className="inline mr-1" />State
                    </label>
                    <select value={state} onChange={(e) => setState(e.target.value)} className="neo-input w-full" data-testid="register-state-select">
                      <option value="">Select your state</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">
                      <MapPin size={12} className="inline mr-1" />City
                    </label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="neo-input w-full" placeholder="Your city" data-testid="register-city-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5">
                      <Globe size={12} className="inline mr-1" />Languages
                    </label>
                    <MultiSelect options={LANGUAGES} value={languages} onChange={setLanguages} placeholder="Select languages" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-5">
            {step > 0 && (
              <button onClick={() => { setError(''); setStep(step - 1); }} className="neo-button flex-1 flex items-center justify-center gap-2" data-testid="register-back">
                <ChevronLeft size={18} /> Back
              </button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => canAdvance() && setStep(step + 1)} disabled={!canAdvance()}
                className="neo-button-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40" data-testid="register-next">
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!canAdvance() || loading}
                className="neo-button-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40" data-testid="register-submit-button">
                {loading ? 'Creating...' : <><Check size={18} /> Create Account</>}
              </button>
            )}
          </div>

          <p className="mt-5 text-center text-[#94A3B8] text-sm">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-white hover:text-[#A855F7]" data-testid="login-link">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;