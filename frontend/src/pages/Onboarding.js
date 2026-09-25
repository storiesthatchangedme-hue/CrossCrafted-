import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, MapPin, BookOpen, ChevronRight, ChevronLeft, Check,
  Camera, Heart, Church, Globe, Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { INDIAN_STATES, LANGUAGES } from '@/constants/india';
import { MultiSelect } from '@/components/MultiSelect';

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

const TOTAL_STEPS = 5;

const DENOMINATIONS = [
  'Non-denominational', 'Baptist', 'Pentecostal/Charismatic', 'Catholic',
  'Presbyterian', 'Methodist', 'Anglican/Episcopalian', 'Orthodox', 'Other'
];

const CHURCH_ATTENDANCE_OPTIONS = ['Weekly', 'Twice a month', 'Monthly', 'Rarely'];

const BAPTIZED_OPTIONS = ['Yes', 'No', 'Planning to'];

const INTEREST_OPTIONS = [
  'Bible Study', 'Prayer', 'Worship', 'Coffee', 'Reading', 'Gaming',
  'Photography', 'Travel', 'Fitness', 'Music', 'Technology', 'Business',
  'Content Creation', 'Movies', 'Sports', 'Cooking', 'Hiking',
  'Volunteering', 'Evangelism', 'Youth Ministry', 'Missions',
  'Christian Music', 'Podcasts',
];

const LOOKING_FOR_OPTIONS = [
  'Friendship', 'Dating', 'Marriage', 'Prayer', 'Bible Study', 'Fellowship',
];

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

const COUNTRY_OPTIONS = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Other'];

/* ═══════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════════ */

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? -60 : 60, opacity: 0 }),
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  // ── Form State ──
  const [form, setForm] = useState(() => ({
    profile_image: user?.profile_image || '',
    name: user?.name || '',
    gender: user?.gender || '',
    age: user?.age || '',
    country: user?.country || 'India',
    state: user?.state || '',
    city: user?.city || '',
    denomination: user?.denomination || '',
    baptized: user?.baptized || '',
    church_attendance: user?.church_attendance || '',
    languages: user?.languages || [],
    interests: user?.interests || [],
    looking_for: user?.looking_for || [],
  }));

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Progress percentage
  const progress = step === 0 ? 0 : Math.round((step / (TOTAL_STEPS - 1)) * 100);

  // ── Validation ──
  const validateStep = useCallback((s, f) => {
    const errs = {};
    if (s === 1) {
      if (!f.name?.trim()) errs.name = 'Name is required';
      if (!f.gender) errs.gender = 'Please select your gender';
      if (!f.age || f.age < 13 || f.age > 120) errs.age = 'Enter a valid age (13-120)';
      if (!f.state) errs.state = 'Please select your state';
      if (!f.city?.trim()) errs.city = 'City is required';
    }
    if (s === 4) {
      // Finish step: nothing strictly required, photo is optional
    }
    return errs;
  }, []);

  const canAdvance = useCallback(() => {
    if (step === 0) return true; // Welcome — no validation needed
    if (step === 1) return form.name?.trim() && form.gender && form.age >= 13 && form.state && form.city?.trim();
    if (step === 2) return true; // Faith — all optional
    if (step === 3) return true; // Looking For — optional
    if (step === 4) return true; // Finish
    return true;
  }, [step, form]);

  // ── Auto-save to Supabase (debounced) ──
  const autoSaveTimerRef = useRef(null);
  const autoSave = useCallback(async (currentForm) => {
    if (!user?._id) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: currentForm.name,
          gender: currentForm.gender,
          age: currentForm.age ? parseInt(currentForm.age, 10) : null,
          country: currentForm.country,
          state: currentForm.state,
          city: currentForm.city,
          denomination: currentForm.denomination,
          baptized: currentForm.baptized,
          church_attendance: currentForm.church_attendance,
          languages: currentForm.languages,
          interests: currentForm.interests,
          looking_for: currentForm.looking_for,
          onboarding_draft_step: step,
        })
        .eq('id', user._id);
      if (error && error.code !== '23505') {
        // Silent — don't interrupt
      }
    } catch {
      // Silent
    }
  }, [user, step]);

  const updateForm = useCallback((patch) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => autoSave(next), 2000);
      return next;
    });
    // Clear errors for changed fields
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  }, [autoSave]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // ── Navigation ──
  const goNext = useCallback(() => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, [step, form, validateStep]);

  const goBack = useCallback(() => {
    setErrors({});
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  // ── Photo upload to Supabase Storage ──
  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ photo: 'Image must be under 5 MB' });
      return;
    }
    if (!user?._id) return;

    setUploadProgress(0);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user._id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      updateForm({ profile_image: publicUrl });
      setUploadProgress(100);

      // Update user in context
      const { data: updatedUser } = await supabase
        .from('users')
        .update({ profile_image: publicUrl })
        .eq('id', user._id)
        .select('*')
        .single();

      if (updatedUser) {
        setUser({ ...updatedUser, _id: updatedUser.id, email: user.email });
      }
    } catch {
      setErrors({ photo: 'Failed to upload photo. Please try again.' });
    } finally {
      setUploadProgress(null);
    }
  }, [user, updateForm, setUser]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const handleFileChange = useCallback((e) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  }, [processFile]);

  // ── Chip toggle helper ──
  const toggleInArray = useCallback((key, value) => {
    setForm((prev) => {
      const arr = prev[key] || [];
      if (arr.includes(value)) return { ...prev, [key]: arr.filter((v) => v !== value) };
      return { ...prev, [key]: [...arr, value] };
    });
  }, []);

  // ── Submit (complete onboarding) ──
  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: form.name,
          gender: form.gender,
          age: form.age ? parseInt(form.age, 10) : null,
          country: form.country,
          state: form.state,
          city: form.city,
          denomination: form.denomination,
          baptized: form.baptized,
          church_attendance: form.church_attendance,
          languages: form.languages,
          interests: form.interests,
          looking_for: form.looking_for,
          onboarding_complete: true,
          status: 'active',
          onboarding_draft_step: null,
        })
        .eq('id', user._id);

      if (error) throw error;

      // Update user in context
      const { data: updatedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user._id)
        .single();

      if (updatedUser) {
        setUser({ ...updatedUser, _id: updatedUser.id, email: user.email });
      }

      navigate('/app/churches', { replace: true });
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save. Please try again.' });
    } finally {
      setLoading(false);
      setSaving(false);
    }
  }, [form, user, setUser, navigate]);

  // ── Redirect if no user ──
  useEffect(() => {
    if (user === false) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  // ── If user already completed onboarding, redirect ──
  useEffect(() => {
    if (user && user !== false && user.onboarding_complete) {
      navigate('/app/churches', { replace: true });
    }
  }, [user, navigate]);

  // Don't render until we know auth state
  const { loading: authLoading } = useAuth();
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#A855F7] border-r-transparent" />
          <p className="mt-4 text-[#94A3B8] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user === false) return null;

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      {/* ── Top Progress Bar ── */}
      {step > 0 && (
        <div className="w-full px-4 pt-4">
          <div className="flex gap-2 mb-1">
            {Array.from({ length: TOTAL_STEPS - 1 }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < step ? 'bg-[#A855F7]' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
              Step {step} of {TOTAL_STEPS - 1}
            </span>
            <span className="text-[10px] font-bold text-[#A855F7]">{progress}%</span>
          </div>
        </div>
      )}

      {/* ── Content Area ── */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {/* ═══════════════════════════════════════════
                  SCREEN 0 — WELCOME
                  ═══════════════════════════════════════════ */}
              {step === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] mb-6 shadow-[0_8px_32px_rgba(124,58,237,0.3)]">
                    <Sparkles size={36} className="text-white" />
                  </div>
                  <h1
                    className="text-4xl font-bold mb-3 gradient-text"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    Welcome to CrossCrafted
                  </h1>
                  <p className="text-[#94A3B8] text-lg mb-2">Your Christian community awaits</p>
                  <p className="text-[#64748B] text-sm mb-10 max-w-xs mx-auto">
                    Let's set up your profile in a few quick steps. You can always skip optional sections and come back later.
                  </p>

                  <div className="space-y-3 max-w-xs mx-auto">
                    <button
                      onClick={goNext}
                      className="neo-button-primary w-full py-4 text-lg"
                    >
                      Get Started <ChevronRight size={20} className="inline ml-1" />
                    </button>
                  </div>

                  <p className="mt-8 text-[10px] text-[#475569] uppercase tracking-widest">
                    Takes about 2 minutes
                  </p>
                </div>
              )}

              {/* ═══════════════════════════════════════════
                  SCREEN 1 — ABOUT YOU
                  ═══════════════════════════════════════════ */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      About You
                    </h2>
                    <p className="text-sm text-[#94A3B8]">Let's start with the basics</p>
                  </div>

                  {errors.submit && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
                      <p className="text-red-400 text-sm font-medium">{errors.submit}</p>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-[#94A3B8]">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => updateForm({ name: e.target.value })}
                        className={`neo-input w-full pl-11 ${errors.name ? 'border-red-500/50' : ''}`}
                        placeholder="Your full name"
                      />
                    </div>
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[#94A3B8]">
                      Gender <span className="text-red-400">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {GENDER_OPTIONS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => updateForm({ gender: g })}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            form.gender === g
                              ? 'bg-[#A855F7] text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]'
                              : 'bg-white/[0.04] border border-white/[0.08] text-[#CBD5E1] hover:border-white/[0.15]'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    {errors.gender && <p className="text-red-400 text-xs mt-1">{errors.gender}</p>}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-[#94A3B8]">
                      Age <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.age}
                      onChange={(e) => updateForm({ age: e.target.value })}
                      className={`neo-input w-full ${errors.age ? 'border-red-500/50' : ''}`}
                      placeholder="Your age"
                      min="13"
                      max="120"
                    />
                    {errors.age && <p className="text-red-400 text-xs mt-1">{errors.age}</p>}
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-[#94A3B8]">
                      <Globe size={12} className="inline mr-1" />Country
                    </label>
                    <select
                      value={form.country}
                      onChange={(e) => updateForm({ country: e.target.value, state: '' })}
                      className="neo-input w-full"
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-[#94A3B8]">
                      <MapPin size={12} className="inline mr-1" />State <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.state}
                      onChange={(e) => updateForm({ state: e.target.value })}
                      className={`neo-input w-full ${errors.state ? 'border-red-500/50' : ''}`}
                    >
                      <option value="">Select your state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-[#94A3B8]">
                      <MapPin size={12} className="inline mr-1" />City <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => updateForm({ city: e.target.value })}
                      className={`neo-input w-full ${errors.city ? 'border-red-500/50' : ''}`}
                      placeholder="Your city"
                    />
                    {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════
                  SCREEN 2 — FAITH
                  ═══════════════════════════════════════════ */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Your Faith
                    </h2>
                    <p className="text-sm text-[#94A3B8]">Help us understand your spiritual journey</p>
                  </div>

                  {/* Denomination */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[#94A3B8]">
                      <Church size={12} className="inline mr-1" />Denomination
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DENOMINATIONS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => updateForm({ denomination: d })}
                          className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            form.denomination === d
                              ? 'bg-[#A855F7] text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]'
                              : 'bg-white/[0.04] border border-white/[0.08] text-[#CBD5E1] hover:border-white/[0.15]'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Baptized */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[#94A3B8]">
                      Baptized
                    </label>
                    <div className="flex gap-2">
                      {BAPTIZED_OPTIONS.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => updateForm({ baptized: b })}
                          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                            form.baptized === b
                              ? 'bg-[#A855F7] text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]'
                              : 'bg-white/[0.04] border border-white/[0.08] text-[#CBD5E1] hover:border-white/[0.15]'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Church Attendance */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[#94A3B8]">
                      <BookOpen size={12} className="inline mr-1" />Church Attendance
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CHURCH_ATTENDANCE_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateForm({ church_attendance: c })}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            form.church_attendance === c
                              ? 'bg-[#A855F7] text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]'
                              : 'bg-white/[0.04] border border-white/[0.08] text-[#CBD5E1] hover:border-white/[0.15]'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[#94A3B8]">
                      <Globe size={12} className="inline mr-1" />Languages
                    </label>
                    <MultiSelect
                      options={LANGUAGES}
                      value={form.languages}
                      onChange={(langs) => updateForm({ languages: langs })}
                      placeholder="Select languages"
                    />
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[#94A3B8]">
                      Interests
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {INTEREST_OPTIONS.map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInArray('interests', interest)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            (form.interests || []).includes(interest)
                              ? 'bg-[#7C3AED]/20 text-[#A855F7] border border-[#A855F7]/40'
                              : 'bg-white/[0.03] border border-white/[0.06] text-[#94A3B8] hover:border-white/[0.15]'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════
                  SCREEN 3 — LOOKING FOR
                  ═══════════════════════════════════════════ */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Looking For
                    </h2>
                    <p className="text-sm text-[#94A3B8]">What kind of connections are you seeking?</p>
                    <p className="text-xs text-[#475569] mt-1">Select all that apply — you can change this later</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {LOOKING_FOR_OPTIONS.map((opt) => {
                      const isSelected = (form.looking_for || []).includes(opt);
                      const icons = {
                        'Friendship': Heart,
                        'Dating': Heart,
                        'Marriage': Heart,
                        'Prayer': BookOpen,
                        'Bible Study': BookOpen,
                        'Fellowship': Church,
                      };
                      const Icon = icons[opt] || Heart;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleInArray('looking_for', opt)}
                          className={`relative p-4 rounded-2xl text-left transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-[#7C3AED]/20 to-[#2563EB]/20 border-2 border-[#A855F7]/60 shadow-[0_4px_20px_rgba(124,58,237,0.2)]'
                              : 'bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15]'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#A855F7] flex items-center justify-center">
                              <Check size={12} className="text-white" strokeWidth={3} />
                            </div>
                          )}
                          <Icon size={24} className={`mb-2 ${isSelected ? 'text-[#A855F7]' : 'text-[#475569]'}`} />
                          <span className={`text-sm font-semibold block ${isSelected ? 'text-white' : 'text-[#CBD5E1]'}`}>
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {(form.looking_for || []).length === 0 && (
                    <p className="text-center text-[#475569] text-xs mt-2">
                      You can skip this and update it later in your profile
                    </p>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════
                  SCREEN 4 — FINISH
                  ═══════════════════════════════════════════ */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      All Set!
                    </h2>
                    <p className="text-sm text-[#94A3B8]">Review your profile and add a photo</p>
                  </div>

                  {errors.submit && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
                      <p className="text-red-400 text-sm font-medium">{errors.submit}</p>
                    </div>
                  )}

                  {/* Profile Preview Card */}
                  <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5">
                    <div className="flex items-center gap-4 mb-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] border-2 border-white/[0.1] shadow-lg overflow-hidden flex items-center justify-center">
                          {form.profile_image ? (
                            <img src={form.profile_image} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User size={32} className="text-white/60" />
                          )}
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#A855F7] flex items-center justify-center shadow-lg border-2 border-[#0F172A]"
                          type="button"
                        >
                          <Camera size={12} className="text-white" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {form.name || 'Your Name'}
                        </h3>
                        <p className="text-sm text-[#94A3B8]">
                          {[form.city, form.state].filter(Boolean).join(', ') || 'Location'}
                        </p>
                        {form.denomination && (
                          <p className="text-xs text-[#A855F7] font-medium mt-0.5">{form.denomination}</p>
                        )}
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white/[0.03] rounded-xl p-2">
                        <p className="text-lg font-bold text-white">{(form.interests || []).length}</p>
                        <p className="text-[9px] text-[#64748B] uppercase tracking-wider font-bold">Interests</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-2">
                        <p className="text-lg font-bold text-white">{(form.looking_for || []).length}</p>
                        <p className="text-[9px] text-[#64748B] uppercase tracking-wider font-bold">Goals</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-2">
                        <p className="text-lg font-bold text-white">{(form.languages || []).length}</p>
                        <p className="text-[9px] text-[#64748B] uppercase tracking-wider font-bold">Languages</p>
                      </div>
                    </div>
                  </div>

                  {/* Photo Upload Area */}
                  {errors.photo && (
                    <p className="text-red-400 text-xs text-center">{errors.photo}</p>
                  )}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      dragActive
                        ? 'border-[#A855F7] bg-[#A855F7]/10'
                        : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]'
                    }`}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload profile photo"
                  >
                    {uploadProgress !== null ? (
                      <div>
                        <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                          <div
                            className="bg-[#A855F7] h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#94A3B8]">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <Camera size={24} className="mx-auto mb-2 text-[#64748B]" />
                        <p className="text-sm text-[#94A3B8] font-medium">
                          Tap to upload or drag a photo
                        </p>
                        <p className="text-xs text-[#475569] mt-1">JPG, PNG up to 5 MB</p>
                      </>
                    )}
                  </div>

                  {/* Completion Indicator */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#10B981]/10 border border-[#10B981]/30 rounded-full">
                      <Check size={14} className="text-[#10B981]" />
                      <span className="text-xs font-bold text-[#10B981]">Profile ready to go</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom Navigation ── */}
      <div className="px-4 pb-6 pt-3">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 0 && (
            <button
              onClick={goBack}
              className="neo-button flex-1 flex items-center justify-center gap-2 py-3"
              type="button"
            >
              <ChevronLeft size={18} /> Back
            </button>
          )}

          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={goNext}
              disabled={!canAdvance()}
              className="neo-button-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-40"
              type="button"
            >
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || saving}
              className="neo-button-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-40"
              type="button"
            >
              {loading || saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                  Finishing up...
                </>
              ) : (
                <>
                  <Check size={18} /> Finish
                </>
              )}
            </button>
          )}
        </div>

        {/* Skip button for optional steps */}
        {step > 1 && step < TOTAL_STEPS - 1 && (
          <button
            onClick={goNext}
            className="w-full mt-3 py-2 text-[#64748B] text-xs font-medium hover:text-[#94A3B8] transition-colors"
            type="button"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;