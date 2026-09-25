import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Heart, Users, Sparkles, MapPin, Check, BookOpen, Coffee, HelpCircle, Shield, 
  Smile, HeartHandshake, UserCheck, Star, Compass, Calendar, X
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

export default function Home() {
  const navigate = useNavigate();

  // Interactive mock cards for the visitor playground
  const mockBffs = [
    {
      name: 'Sarah Mitchell',
      age: 26,
      denomination: 'Non-denominational',
      home_church: 'Grace Community Church',
      bio: 'Worship leader. Saved by grace. Looking for a prayer partner and hiking buddy to grow in faith with!',
      favorite_verse: 'Proverbs 27:17 - "Iron sharpens iron, and one man sharpens another."',
      interests: ['Bible Study', 'Coffee Chat', 'Worship', 'Hiking'],
      image: 'https://images.unsplash.com/photo-1758598304332-94b40ce7c7b4?w=400&q=80'
    },
    {
      name: 'Marcus Johnson',
      age: 28,
      denomination: 'Baptist',
      home_church: 'Hillside Bible Church',
      bio: 'Seminary student & youth coach. Learning to trust God one chapter at a time. Let\'s play basketball and stay accountable.',
      favorite_verse: 'Philippians 4:13 - "I can do all things through Christ who strengthens me."',
      interests: ['Gym', 'Theology', 'Missions', 'Board Games'],
      image: 'https://images.unsplash.com/photo-1758874574397-e56dfcfc116d?w=400&q=80'
    },
    {
      name: 'Emily Rodriguez',
      age: 24,
      denomination: 'Catholic',
      home_church: 'St. Mary Cathedral',
      bio: 'Coffee lover. Sharing my faith journey and finding grace. Looking for local fellowship and Sunday brunch buddies!',
      favorite_verse: 'Romans 8:28 - "And we know that for those who love God all things work together for good..."',
      interests: ['Sunday Brunch', 'Book Club', 'Volunteering', 'Prayer Partner'],
      image: 'https://images.unsplash.com/photo-1758523672333-12a4099a60b0?w=400&q=80'
    }
  ];

  const [activePlaygroundIndex, setActivePlaygroundIndex] = useState(0);
  const [playgroundSwiped, setPlaygroundSwiped] = useState(null); // 'like' or 'pass'

  const handlePlaygroundSwipe = (action) => {
    setPlaygroundSwiped(action);
    setTimeout(() => {
      setActivePlaygroundIndex((prev) => (prev + 1) % mockBffs.length);
      setPlaygroundSwiped(null);
    }, 450);
  };

  const currentPlaygroundBff = mockBffs[activePlaygroundIndex];

  return (
    <div className="min-h-screen bg-[#12101A] text-white flex flex-col justify-between overflow-x-hidden">
      <PublicNav />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F39B9B]/10 border border-[#F39B9B]/20 text-[#F39B9B] text-xs font-bold uppercase tracking-wider"
          >
            <Sparkles size={12} fill="currentColor" />
            Find Your Christian Community
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none text-white"
          >
            crosscrafted <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F39B9B] to-[#9786E3]">Friendship, thoughtfully made</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-[#A09DB1] max-w-xl leading-relaxed"
          >
            Iron sharpens iron! Swipe and connect with faithful Christian friends in your local neighborhood. Filter by denomination, home church, and friendship goals.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-2"
          >
            <Link to="/register">
              <button className="px-8 py-3.5 bg-[#F39B9B] hover:bg-[#E27B7B] text-slate-950 font-extrabold rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-[#F39B9B]/20 flex items-center gap-2 transition-all">
                Find Friends <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </Link>
            <Link to="/login">
              <button className="px-8 py-3.5 border border-white/[0.08] hover:border-white/[0.15] text-[#A09DB1] hover:text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider transition-all bg-white/[0.02]">
                Open App
              </button>
            </Link>
          </motion.div>

          {/* Quick trust metrics */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-3 gap-6 pt-8 border-t border-white/[0.04] max-w-md"
          >
            <div>
              <p className="text-xl font-extrabold text-white">100%</p>
              <p className="text-[11px] text-[#726E88] font-bold uppercase tracking-wider mt-0.5">Platonic Friends</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#F39B9B]">12+</p>
              <p className="text-[11px] text-[#726E88] font-bold uppercase tracking-wider mt-0.5">Denominations</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-white">Safe</p>
              <p className="text-[11px] text-[#726E88] font-bold uppercase tracking-wider mt-0.5">Community Approved</p>
            </div>
          </motion.div>
        </div>

        {/* Dynamic Card Playground Block */}
        <div className="lg:col-span-5 flex justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="w-full max-w-sm rounded-3xl overflow-hidden bg-slate-900 border border-white/[0.06] shadow-2xl flex flex-col relative aspect-[3/4.2]"
          >
            {/* Swiping effect overlay */}
            <AnimatePresence>
              {playgroundSwiped && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`absolute inset-0 z-20 flex items-center justify-center backdrop-blur-xs font-black uppercase text-2xl tracking-widest ${
                    playgroundSwiped === 'like' ? 'bg-[#F39B9B]/25 text-[#F39B9B]' : 'bg-rose-500/25 text-rose-400'
                  }`}
                >
                  {playgroundSwiped === 'like' ? '✓ Connect' : '✕ Pass'}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative flex-1 bg-slate-950 overflow-hidden">
              <img 
                src={currentPlaygroundBff.image} 
                alt={currentPlaygroundBff.name} 
                className="w-full h-full object-cover pointer-events-none select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/20 pointer-events-none" />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-1.5 flex-wrap z-10">
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-[#F39B9B] text-slate-950 shadow-md">
                  ⛪ {currentPlaygroundBff.denomination}
                </span>
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-[#1C1929]/85 backdrop-blur-md text-white shadow-md">
                  {currentPlaygroundBff.age} y/o • Female
                </span>
              </div>

              {/* Info Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-5 pt-16 z-10">
                <h2 className="text-lg font-bold text-white flex items-baseline gap-1.5">
                  {currentPlaygroundBff.name}
                  <span className="text-[10px] font-normal text-[#A09DB1]">Friend Candidate</span>
                </h2>
                <p className="text-[11px] text-[#F39B9B] font-semibold flex items-center gap-1 mt-1">
                  📍 {currentPlaygroundBff.home_church}
                </p>
                <p className="text-[11.5px] text-slate-300 mt-2.5 leading-relaxed line-clamp-2">
                  "{currentPlaygroundBff.bio}"
                </p>
              </div>
            </div>

            {/* Sub-card Scripture */}
            <div className="bg-[#1C1929] p-4 border-t border-white/[0.04] shrink-0 space-y-2">
              <div className="bg-[#12101A]/50 p-2 rounded-xl border-l-2 border-[#F39B9B] flex gap-2">
                <BookOpen size={12} className="text-[#F39B9B] shrink-0 mt-0.5" />
                <span className="text-[10px] italic text-[#94A3B8] leading-relaxed line-clamp-1">
                  {currentPlaygroundBff.favorite_verse}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {currentPlaygroundBff.interests.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded bg-white/[0.04] text-[#94A3B8] text-[9.5px]">
                    #{tag.replace(' ', '')}
                  </span>
                ))}
              </div>
            </div>

            {/* Swiper Controls */}
            <div className="p-4 bg-[#12101A] border-t border-white/[0.04] flex justify-center gap-4">
              <button 
                onClick={() => handlePlaygroundSwipe('pass')}
                className="w-10 h-10 rounded-full bg-[#1C1929] border border-white/[0.06] text-rose-400 hover:bg-[#2B254E] flex items-center justify-center transition-all shadow-md"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
              <button 
                onClick={() => handlePlaygroundSwipe('like')}
                className="w-10 h-10 rounded-full bg-[#F39B9B] text-slate-950 hover:bg-[#E27B7B] flex items-center justify-center transition-all shadow-md"
              >
                <Heart size={18} strokeWidth={2.5} fill="currentColor" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Highlight Features Section */}
      <section className="py-20 border-t border-white/[0.03] bg-[#1C1929]/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Features Crafted for Christian Hearts</h2>
            <p className="text-sm text-[#A09DB1]">
              We believe in platonic, authentic, and safe fellowship based on biblical values.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1C1929] border border-white/[0.04] p-6 rounded-3xl space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-[#F39B9B]/10 border border-[#F39B9B]/25 flex items-center justify-center">
                <Users className="text-[#F39B9B]" size={20} />
              </div>
              <h3 className="text-base font-bold text-white">100% Platonic Friends</h3>
              <p className="text-xs text-[#A09DB1] leading-relaxed">
                No dating pressure. crosscrafted is exclusively designed to find platonic brothers and sisters in Christ for real community, sports, accountability, and bible study.
              </p>
            </div>

            <div className="bg-[#1C1929] border border-white/[0.04] p-6 rounded-3xl space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-[#9786E3]/10 border border-[#9786E3]/25 flex items-center justify-center">
                <Star className="text-[#9786E3]" size={20} />
              </div>
              <h3 className="text-base font-bold text-white">Filter by Church Circle</h3>
              <p className="text-xs text-[#A09DB1] leading-relaxed">
                Connect with members attending your local church denomination or expand your horizon to find partners from nearby Baptist, Presbyterian, Catholic, and Non-denom circles.
              </p>
            </div>

            <div className="bg-[#1C1929] border border-white/[0.04] p-6 rounded-3xl space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-[#F39B9B]/10 border border-[#F39B9B]/25 flex items-center justify-center">
                <Coffee className="text-[#F39B9B]" size={20} />
              </div>
              <h3 className="text-base font-bold text-white">Friendship Focus Tags</h3>
              <p className="text-xs text-[#A09DB1] leading-relaxed">
                Specify what you are looking for—a theology book club companion, prayer requests partner, Sunday brunch buddy, or a community service coordinator.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 px-6 text-center max-w-4xl mx-auto w-full">
        <div className="bg-gradient-to-tr from-[#1C1929] to-slate-900 border border-white/[0.06] rounded-3xl p-8 sm:p-12 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#F39B9B]/5 blur-2xl rounded-full" />
          <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-[#9786E3]/5 blur-2xl rounded-full" />

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">"Where two or three are gathered..."</h2>
          <p className="text-xs sm:text-sm text-[#A09DB1] max-w-lg mx-auto leading-relaxed">
            Find the godly community you've been praying for. Sign up for crosscrafted in less than 2 minutes and start connecting today.
          </p>
          <div className="pt-2">
            <Link to="/register">
              <button className="px-8 py-3.5 bg-[#F39B9B] hover:bg-[#E27B7B] text-slate-950 font-extrabold rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all inline-flex items-center gap-2">
                Join crosscrafted Now
              </button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
