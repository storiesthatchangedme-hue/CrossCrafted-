import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, Check, X, BookOpen, Flame, GraduationCap,
  Trophy, Star, Play, RotateCcw, ArrowRight, Sparkles,
  TrendingUp, Clock, Target, Crown, Share2, BarChart3,
  Users, ChevronRight, Zap, Shield, Scroll, Cross
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  QUIZ_LEVELS, QUIZ_CATEGORIES, PRIZE_TIERS,
  getRandomQuestions, getCurrentPrize, getNextPrize
} from '@/data/bibleQuizData';

const STATS_KEY = 'crosscrafted_trivia_stats';

const TIMER_SECONDS = {
  beginners: 30,
  intermediate: 20,
  skilled: 15,
  expert: 10,
};

const CATEGORY_ICONS = {
  BookOpen, Cross, Scroll, Shield,
};

const MOCK_LEADERBOARD = [
  { name: 'Rebecca Thomas', points: 8420, rank: 1, tier: 'Word Warrior' },
  { name: 'Philip Cherian', points: 6150, rank: 2, tier: 'Word Warrior' },
  { name: 'Grace Sharma', points: 4320, rank: 3, tier: 'Theology Scholar' },
  { name: 'Daniel Kumar', points: 2800, rank: 4, tier: 'Theology Scholar' },
  { name: 'Esther Raj', points: 1650, rank: 5, tier: 'Bible Teacher' },
  { name: 'Samuel Mathew', points: 980, rank: 6, tier: 'Bible Student' },
  { name: 'Ruth Philip', points: 520, rank: 7, tier: 'Spiritual Disciple' },
  { name: 'Joshua Isaac', points: 280, rank: 8, tier: 'Bible Student' },
];

const getStats = () => {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY)) || { gamesPlayed: 0, totalPoints: 0, bestStreak: 0, rank: 0 };
  } catch { return { gamesPlayed: 0, totalPoints: 0, bestStreak: 0, rank: 0 }; }
};

const saveStats = (s) => localStorage.setItem(STATS_KEY, JSON.stringify(s));

const RANKS = ['Curious Seeker', 'Bible Reader', 'Scripture Scholar', 'Faith Champion', 'Word Warrior', 'Bible Master'];

const getRank = (points) => {
  if (points >= 5000) return 5;
  if (points >= 3000) return 4;
  if (points >= 1500) return 3;
  if (points >= 500) return 2;
  if (points >= 100) return 1;
  return 0;
};

const Trivia = () => {
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quizMode, setQuizMode] = useState(10);
  const [gameState, setGameState] = useState('setup'); // setup | playing | result
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeTab, setActiveTab] = useState('play'); // play | leaderboard | stats
  const timerRef = useRef(null);
  const [stats, setStats] = useState(getStats);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing' || showExplanation) return;
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameState, showExplanation, currentQ]);

  const handleTimeUp = () => {
    if (selectedAnswer !== null) return;
    setShowExplanation(true);
    setStreak(0);
    setTimeout(() => advanceQuestion(), 2000);
  };

  const startQuiz = () => {
    if (!selectedLevel || !selectedCategory) {
      toast.error('Please select a level and category');
      return;
    }
    const qs = getRandomQuestions(selectedLevel.id, selectedCategory.id, quizMode);
    if (qs.length === 0) {
      toast.error('No questions available for this combination');
      return;
    }
    setQuestions(qs);
    setCurrentQ(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setGameState('playing');
    setTimeLeft(TIMER_SECONDS[selectedLevel.id]);
  };

  const handleAnswer = (answerIdx) => {
    if (selectedAnswer !== null) return;
    clearInterval(timerRef.current);
    setSelectedAnswer(answerIdx);
    setShowExplanation(true);

    const q = questions[currentQ];
    const isCorrect = answerIdx === q.answer;
    if (isCorrect) {
      const streakBonus = Math.min(streak, 5);
      const points = (q.points || selectedLevel.points) + streakBonus * 2;
      setScore(prev => prev + points);
      setStreak(prev => {
        const newStreak = prev + 1;
        setBestStreak(best => Math.max(best, newStreak));
        return newStreak;
      });
      setCorrectCount(prev => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const advanceQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      finishGame();
    } else {
      setCurrentQ(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(TIMER_SECONDS[selectedLevel.id]);
    }
  };

  const finishGame = () => {
    setGameState('result');
    const newStats = {
      gamesPlayed: stats.gamesPlayed + 1,
      totalPoints: stats.totalPoints + score,
      bestStreak: Math.max(stats.bestStreak, bestStreak),
      rank: getRank(stats.totalPoints + score),
    };
    setStats(newStats);
    saveStats(newStats);
  };

  const shareResults = () => {
    const text = `🏆 Bible Trivia Challenge!\n\nScore: ${score} pts | Correct: ${correctCount}/${questions.length} | Best Streak: ${bestStreak}🔥\nLevel: ${selectedLevel.label} | Category: ${selectedCategory.label}\n\nPlay now on CrossCrafted!`;
    if (navigator.share) {
      navigator.share({ title: 'Bible Trivia Results', text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Results copied to clipboard!');
    }
  };

  const resetGame = () => {
    setGameState('setup');
    setSelectedLevel(null);
    setSelectedCategory(null);
    setQuestions([]);
    setCurrentQ(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const currentPrize = getCurrentPrize(stats.totalPoints);
  const nextPrize = getNextPrize(stats.totalPoints);
  const prizeProgress = nextPrize
    ? ((stats.totalPoints - currentPrize.minPoints) / (nextPrize.minPoints - currentPrize.minPoints)) * 100
    : 100;

  // ─── SETUP SCREEN ───
  const renderSetup = () => (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <span className="gradient-text">Bible Trivia</span> Challenge
        </h1>
        <p className="text-[#94A3B8] mt-2 text-sm">Test your Bible knowledge and earn rewards!</p>
      </motion.div>

      {/* Level Selector */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <GraduationCap size={20} className="text-[#A855F7]" /> Choose Your Level
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUIZ_LEVELS.map(level => (
            <motion.button
              key={level.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedLevel(level)}
              className={`p-4 rounded-[20px] border-2 transition-all text-left ${
                selectedLevel?.id === level.id
                  ? 'border-current shadow-lg'
                  : 'border-white/[0.06] bg-white/[0.04]'
              }`}
              style={{
                borderColor: selectedLevel?.id === level.id ? level.color : undefined,
                backgroundColor: selectedLevel?.id === level.id ? `${level.color}15` : undefined,
              }}
            >
              <span className="text-2xl">{level.icon}</span>
              <h3 className="font-bold mt-2 text-sm" style={{ color: selectedLevel?.id === level.id ? level.color : '#fff' }}>{level.label}</h3>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">{level.description}</p>
              <p className="text-[10px] text-[#64748B] mt-1">{level.points} pts · {TIMER_SECONDS[level.id]}s/q</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Category Selector */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <BookOpen size={20} className="text-[#3B82F6]" /> Choose Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUIZ_CATEGORIES.map(cat => {
            const CatIcon = CATEGORY_ICONS[cat.icon] || BookOpen;
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedCategory(cat)}
                className={`p-4 rounded-[20px] border-2 transition-all text-center ${
                  selectedCategory?.id === cat.id
                    ? 'border-current shadow-lg'
                    : 'border-white/[0.06] bg-white/[0.04]'
                }`}
                style={{
                  borderColor: selectedCategory?.id === cat.id ? cat.color : undefined,
                  backgroundColor: selectedCategory?.id === cat.id ? `${cat.color}15` : undefined,
                }}
              >
                <CatIcon size={24} style={{ color: cat.color }} className="mx-auto" />
                <h3 className="font-bold mt-2 text-sm" style={{ color: selectedCategory?.id === cat.id ? cat.color : '#fff' }}>{cat.label}</h3>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Quiz Mode */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Target size={20} className="text-[#F59E0B]" /> Questions per Session
        </h2>
        <div className="flex gap-3">
          {[10, 20].map(mode => (
            <button
              key={mode}
              onClick={() => setQuizMode(mode)}
              className={`flex-1 py-3 px-6 rounded-2xl font-bold text-sm transition-all border ${
                quizMode === mode
                  ? 'bg-gradient-to-r from-[#A855F7] to-[#EC4899] text-white border-transparent shadow-lg'
                  : 'bg-white/[0.04] text-[#94A3B8] border-white/[0.06] hover:bg-white/[0.08]'
              }`}
            >
              {mode} Questions
            </button>
          ))}
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center">
        <button
          onClick={startQuiz}
          disabled={!selectedLevel || !selectedCategory}
          className="neo-button-primary px-8 py-3 text-lg flex items-center gap-2 mx-auto disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}
        >
          <Play size={20} /> Start Challenge
        </button>
      </motion.div>

      {/* Prize Tier Preview */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-[24px] p-5">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Trophy size={16} className="text-[#F59E0B]" /> Prize Tiers
        </h3>
        <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
          {PRIZE_TIERS.map((tier, i) => (
            <div key={i} className="shrink-0 bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 text-center min-w-[120px]">
              <span className="text-xl">{tier.icon}</span>
              <p className="text-[11px] font-bold mt-1">{tier.title}</p>
              <p className="text-[9px] text-[#94A3B8]">{tier.minPoints}+ pts</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  // ─── PLAYING SCREEN ───
  const renderPlaying = () => {
    const q = questions[currentQ];
    if (!q) return null;
    const timerPercent = (timeLeft / TIMER_SECONDS[selectedLevel.id]) * 100;
    const timerColor = timeLeft > TIMER_SECONDS[selectedLevel.id] * 0.5 ? '#22C55E' : timeLeft > TIMER_SECONDS[selectedLevel.id] * 0.25 ? '#F59E0B' : '#EF4444';

    return (
      <div className="space-y-5">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <button onClick={resetGame} className="text-[#94A3B8] hover:text-white text-sm flex items-center gap-1">
            <RotateCcw size={14} /> Quit
          </button>
          <div className="flex items-center gap-4">
            {streak > 1 && (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="flex items-center gap-1 text-[#F59E0B]"
              >
                <Flame size={16} /> <span className="font-bold text-sm">{streak}x</span>
              </motion.div>
            )}
            <div className="flex items-center gap-1 text-[#A855F7]">
              <Trophy size={16} /> <span className="font-bold text-sm">{score}</span>
            </div>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: timerColor }}
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between text-xs text-[#94A3B8]">
          <span>Question {currentQ + 1} of {questions.length}</span>
          <div className="flex items-center gap-1">
            <Clock size={12} /> {timeLeft}s
          </div>
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-[24px] p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${selectedLevel.color}20`, color: selectedLevel.color }}
            >
              {selectedLevel.label}
            </span>
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${selectedCategory.color}20`, color: selectedCategory.color }}
            >
              {selectedCategory.label}
            </span>
          </div>
          <h2 className="text-lg font-bold leading-relaxed mb-6">{q.question}</h2>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              const isCorrect = idx === q.answer;
              const isSelected = idx === selectedAnswer;
              let bgClass = 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]';
              let iconEl = null;

              if (showExplanation) {
                if (isCorrect) {
                  bgClass = 'bg-emerald-500/15 border-emerald-500/30';
                  iconEl = <Check size={18} className="text-emerald-400" />;
                } else if (isSelected && !isCorrect) {
                  bgClass = 'bg-red-500/15 border-red-500/30';
                  iconEl = <X size={18} className="text-red-400" />;
                } else {
                  bgClass = 'bg-white/[0.02] border-white/[0.04] opacity-50';
                }
              }

              return (
                <motion.button
                  key={idx}
                  whileHover={!showExplanation ? { scale: 1.01 } : {}}
                  whileTap={!showExplanation ? { scale: 0.98 } : {}}
                  onClick={() => handleAnswer(idx)}
                  disabled={selectedAnswer !== null}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${bgClass}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-sm font-bold shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-medium text-sm">{opt}</span>
                  </span>
                  {iconEl}
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && q.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 bg-[#A855F7]/10 border border-[#A855F7]/20 rounded-2xl p-4 overflow-hidden"
              >
                <p className="text-xs font-bold text-[#A855F7] mb-1">Explanation</p>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{q.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Next Button */}
        {showExplanation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <button
              onClick={advanceQuestion}
              className="neo-button-primary px-6 py-2.5 flex items-center gap-2 mx-auto"
              style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}
            >
              {currentQ + 1 >= questions.length ? 'See Results' : 'Next Question'} <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
      </div>
    );
  };

  // ─── RESULT SCREEN ───
  const renderResult = () => {
    const prize = getCurrentPrize(stats.totalPoints);
    const nextP = getNextPrize(stats.totalPoints);
    const pct = nextP ? ((stats.totalPoints - prize.minPoints) / (nextP.minPoints - prize.minPoints)) * 100 : 100;
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-[24px] p-6 text-center">
          <span className="text-5xl">{prize.icon}</span>
          <h1 className="text-2xl font-black mt-3 gradient-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Challenge Complete!
          </h1>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/[0.04] rounded-2xl p-3">
              <Trophy size={20} className="text-[#A855F7] mx-auto mb-1" />
              <p className="text-xl font-black">{score}</p>
              <p className="text-[10px] text-[#94A3B8]">Points</p>
            </div>
            <div className="bg-white/[0.04] rounded-2xl p-3">
              <Target size={20} className="text-emerald-400 mx-auto mb-1" />
              <p className="text-xl font-black">{accuracy}%</p>
              <p className="text-[10px] text-[#94A3B8]">Accuracy</p>
            </div>
            <div className="bg-white/[0.04] rounded-2xl p-3">
              <Flame size={20} className="text-[#F59E0B] mx-auto mb-1" />
              <p className="text-xl font-black">{bestStreak}x</p>
              <p className="text-[10px] text-[#94A3B8]">Best Streak</p>
            </div>
          </div>

          <p className="text-sm text-[#94A3B8] mt-4">
            {correctCount} correct out of {questions.length} questions
          </p>

          {/* Prize Tier */}
          <div className="mt-6 bg-white/[0.04] rounded-2xl p-4">
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Prize Tier</p>
            <p className="font-bold text-lg">{prize.icon} {prize.title}</p>
            <p className="text-xs text-[#94A3B8] mt-1">{prize.reward}</p>
            {nextP && (
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-[#94A3B8] mb-1">
                  <span>{stats.totalPoints} pts</span>
                  <span>{nextP.minPoints} pts</span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#A855F7] to-[#EC4899] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <p className="text-[10px] text-[#94A3B8] mt-1">Next: {nextP.icon} {nextP.title}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button onClick={resetGame} className="neo-button-outline flex-1 flex items-center justify-center gap-2">
              <RotateCcw size={16} /> Play Again
            </button>
            <button onClick={shareResults} className="neo-button-primary flex-1 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>
              <Share2 size={16} /> Share
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // ─── LEADERBOARD TAB ───
  const renderLeaderboard = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <Crown size={20} className="text-[#F59E0B]" /> Leaderboard
      </h2>
      <div className="space-y-2">
        {MOCK_LEADERBOARD.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-4"
          >
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
              i === 0 ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-amber-600/20 text-amber-500' : 'bg-white/[0.06] text-[#94A3B8]'
            }`}>
              {entry.rank}
            </span>
            <div className="flex-1">
              <p className="font-bold text-sm">{entry.name}</p>
              <p className="text-[11px] text-[#94A3B8]">{entry.tier}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-[#A855F7]">{entry.points.toLocaleString()}</p>
              <p className="text-[10px] text-[#94A3B8]">points</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // ─── STATS TAB ───
  const renderStats = () => {
    const prize = getCurrentPrize(stats.totalPoints);
    const nextP = getNextPrize(stats.totalPoints);
    const pct = nextP ? ((stats.totalPoints - prize.minPoints) / (nextP.minPoints - prize.minPoints)) * 100 : 100;

    return (
      <div className="space-y-5">
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <BarChart3 size={20} className="text-[#3B82F6]" /> Your Stats
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Games Played', value: stats.gamesPlayed, icon: Play, color: '#A855F7' },
            { label: 'Total Points', value: stats.totalPoints.toLocaleString(), icon: Trophy, color: '#F59E0B' },
            { label: 'Current Rank', value: RANKS[stats.rank] || 'Curious Seeker', icon: Award, color: '#3B82F6' },
            { label: 'Best Streak', value: `${stats.bestStreak}x`, icon: Flame, color: '#EF4444' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4"
            >
              <stat.icon size={18} style={{ color: stat.color }} className="mb-2" />
              <p className="text-lg font-black">{stat.value}</p>
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Prize Progress */}
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-[#EC4899]" /> Prize Progress
          </h3>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{prize.icon}</span>
            <div className="flex-1">
              <p className="font-bold">{prize.title}</p>
              <p className="text-xs text-[#94A3B8]">{prize.reward}</p>
            </div>
          </div>
          {nextP && (
            <>
              <div className="flex justify-between text-[10px] text-[#94A3B8] mb-1">
                <span>{stats.totalPoints} pts</span>
                <span>{nextP.minPoints} pts</span>
              </div>
              <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#A855F7] to-[#EC4899] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-xs text-[#94A3B8] mt-2 flex items-center gap-1">
                <ChevronRight size={12} /> Next: {nextP.icon} {nextP.title} — {nextP.reward}
              </p>
            </>
          )}
        </div>
      </div>
    );
  };

  // ─── MAIN RENDER ───
  return (
    <div className="feed-container px-4 py-6" data-testid="trivia-page">
      {/* Tab Bar — only show when not playing */}
      {gameState !== 'playing' && (
        <div className="flex gap-1 mb-6 bg-white/[0.04] rounded-2xl p-1 border border-white/[0.06]">
          {[
            { key: 'play', label: 'Play', icon: Play },
            { key: 'leaderboard', label: 'Leaderboard', icon: Crown },
            { key: 'stats', label: 'Stats', icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-[#A855F7] to-[#EC4899] text-white shadow-lg'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {gameState === 'playing' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderPlaying()}
          </motion.div>
        )}
        {gameState === 'result' && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderResult()}
          </motion.div>
        )}
        {gameState === 'setup' && activeTab === 'play' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderSetup()}
          </motion.div>
        )}
        {gameState === 'setup' && activeTab === 'leaderboard' && (
          <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderLeaderboard()}
          </motion.div>
        )}
        {gameState === 'setup' && activeTab === 'stats' && (
          <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderStats()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Trivia;
