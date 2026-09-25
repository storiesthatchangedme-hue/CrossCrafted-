import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Clock, Users, CheckCircle2, Circle, Calendar,
  ChevronRight, Sparkles, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const TABS = [
  { key: 'browse', label: 'Browse Plans' },
  { key: 'progress', label: 'My Progress' },
];

const BiblePlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [myProgress, setMyProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [completingDay, setCompletingDay] = useState(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/bible-plans');
      setPlans(Array.isArray(data) ? data : data?.plans || []);
    } catch (_) {
      toast.error('Failed to load Bible plans');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyProgress = useCallback(async () => {
    if (!user) return;
    setProgressLoading(true);
    try {
      const { data } = await api.get('/api/bible-plans/my-progress');
      setMyProgress(Array.isArray(data) ? data : data?.plans || []);
    } catch (_) {
      toast.error('Failed to load your progress');
    } finally {
      setProgressLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);
  useEffect(() => { if (activeTab === 'progress') fetchMyProgress(); }, [activeTab, fetchMyProgress]);

  const handleEnroll = async (planId) => {
    try {
      await api.post(`/api/bible-plans/${planId}/enroll`);
      toast.success('Enrolled successfully!');
      fetchPlans();
      if (activeTab === 'progress') fetchMyProgress();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to enroll');
    }
  };

  const handleCompleteDay = async (planId, dayNumber) => {
    setCompletingDay(dayNumber);
    try {
      await api.post(`/api/bible-plans/${planId}/complete-day`, { day_number: dayNumber });
      toast.success('Day marked complete! 🎉');
      fetchMyProgress();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to mark day complete');
    } finally {
      setCompletingDay(null);
    }
  };

  const getProgressPercent = (plan) => {
    if (!plan.total_days || plan.total_days === 0) return 0;
    return Math.round(((plan.completed_days || 0) / plan.total_days) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#A855F7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 py-5" data-testid="bible-plans-page">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>
          <BookOpen size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Bible Plans</h1>
          <p className="text-[11px] text-[#94A3B8]">Grow in the Word, one day at a time</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white/[0.04] rounded-2xl p-1 border border-white/[0.06]">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'text-white shadow-lg'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
            }`}
            style={activeTab === tab.key ? { background: 'linear-gradient(135deg, #A855F7, #EC4899)' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <div className="space-y-3">
          {plans.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
              <div className="w-14 h-14 bg-[#A855F7]/10 border border-[#A855F7]/25 rounded-full flex items-center justify-center mx-auto mb-4 text-[#A855F7]">
                <BookOpen size={24} />
              </div>
              <h3 className="text-white font-bold text-base mb-1">No Plans Available</h3>
              <p className="text-[#64748B] text-xs max-w-sm mx-auto leading-relaxed">
                Bible reading plans will appear here once they are created. Stay tuned!
              </p>
            </div>
          ) : (
            plans.map((plan, i) => (
              <motion.div
                key={plan._id || plan.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-white mb-1">{plan.title}</h3>
                    <p className="text-[12px] text-[#94A3B8] leading-relaxed line-clamp-2 mb-3">{plan.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                      <span className="flex items-center gap-1"><Clock size={11} />{plan.duration || plan.total_days} days</span>
                      <span className="flex items-center gap-1"><Users size={11} />{plan.enrolled_count || 0} enrolled</span>
                    </div>
                  </div>
                  {plan.is_enrolled ? (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20 flex-shrink-0">
                      <CheckCircle2 size={12} /> Enrolled
                    </span>
                  ) : (
                    <button
                      onClick={() => handleEnroll(plan._id || plan.id)}
                      className="px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-all hover:-translate-y-px flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)' }}
                    >
                      Enroll
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* My Progress Tab */}
      {activeTab === 'progress' && (
        <>
          {progressLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[#A855F7] animate-spin" />
            </div>
          ) : myProgress.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
              <div className="w-14 h-14 bg-[#A855F7]/10 border border-[#A855F7]/25 rounded-full flex items-center justify-center mx-auto mb-4 text-[#A855F7]">
                <Sparkles size={24} />
              </div>
              <h3 className="text-white font-bold text-base mb-1">No Plans Yet</h3>
              <p className="text-[#64748B] text-xs max-w-sm mx-auto leading-relaxed">
                Enroll in a Bible reading plan to start tracking your progress.
              </p>
              <button
                onClick={() => setActiveTab('browse')}
                className="mt-4 px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:-translate-y-px"
                style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}
              >
                Browse Plans
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myProgress.map((plan, i) => {
                const percent = getProgressPercent(plan);
                return (
                  <motion.div
                    key={plan._id || plan.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-[15px] font-bold text-white">{plan.title}</h3>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Day {plan.completed_days || 0} of {plan.total_days}
                        </p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: percent >= 100 ? '#10B981' : '#A855F7' }}>
                        {percent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden mb-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: percent >= 100 ? 'linear-gradient(135deg, #10B981, #34D399)' : 'linear-gradient(135deg, #A855F7, #EC4899)' }}
                      />
                    </div>

                    {/* Daily Reading */}
                    {plan.today_reading && (
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar size={13} className="text-[#A855F7]" />
                          <span className="text-[12px] font-semibold text-white">Today's Reading</span>
                          <span className="text-[10px] text-[#64748B] ml-auto">Day {plan.current_day || plan.completed_days + 1}</span>
                        </div>
                        <p className="text-[12px] text-[#94A3B8] italic leading-relaxed">
                          {plan.today_reading.passage || plan.today_reading}
                        </p>
                      </div>
                    )}

                    {/* Mark Complete */}
                    {percent < 100 && plan.current_day && !plan.today_completed && (
                      <button
                        onClick={() => handleCompleteDay(plan._id || plan.id, plan.current_day)}
                        disabled={completingDay === plan.current_day}
                        className="w-full py-2.5 rounded-xl text-[12px] font-semibold text-white transition-all hover:-translate-y-px flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #10B981, #34D399)' }}
                      >
                        {completingDay === plan.current_day ? (
                          <><Loader2 size={14} className="animate-spin" /> Marking...</>
                        ) : (
                          <><CheckCircle2 size={14} /> Mark Complete</>
                        )}
                      </button>
                    )}

                    {plan.today_completed && percent < 100 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#10B981] font-semibold">
                        <CheckCircle2 size={13} /> Today's reading complete!
                      </div>
                    )}

                    {percent >= 100 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#10B981] font-semibold">
                        <Sparkles size={13} /> Plan complete! 🎉
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BiblePlans;
