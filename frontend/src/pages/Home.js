import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Award, BookOpen, Building2, Store, 
  Search, HeartHandshake, Globe, Sparkles
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#12101A] text-white flex flex-col justify-between overflow-x-hidden">
      <PublicNav />

      <section className="pt-28 pb-16 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F39B9B]/10 border border-[#F39B9B]/20 text-[#F39B9B] text-xs font-bold uppercase tracking-wider"
          >
            <Sparkles size={12} fill="currentColor" />
            Faith Community Platform
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-white"
          >
            crosscrafted <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F39B9B] to-[#9786E3]">Grow in Faith, Together</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-[#A09DB1] max-w-xl mx-auto leading-relaxed"
          >
            Your all-in-one Christian community platform — Bible trivia, apologetics, church directory, marketplace, and more. Built to strengthen faith and connect believers across India.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 pt-2"
          >
            <Link to="/register">
              <button className="px-8 py-3.5 bg-[#F39B9B] hover:bg-[#E27B7B] text-slate-950 font-extrabold rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-[#F39B9B]/20 flex items-center gap-2 transition-all">
                <ArrowRight size={18} /> Get Started
              </button>
            </Link>
            <Link to="/login">
              <button className="px-8 py-3.5 border border-white/[0.08] hover:border-white/[0.15] text-[#A09DB1] hover:text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider transition-all bg-white/[0.02] flex items-center gap-2">
                Sign In
              </button>
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-4 gap-6 pt-8 border-t border-white/[0.04] max-w-lg mx-auto"
          >
            <div>
              <p className="text-xl font-extrabold text-[#F39B9B]">800+</p>
              <p className="text-[10px] text-[#726E88] font-bold uppercase tracking-wider mt-0.5">Quiz Questions</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#7C3AED]">6+</p>
              <p className="text-[10px] text-[#726E88] font-bold uppercase tracking-wider mt-0.5">Prize Tiers</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#38BDF8]">3</p>
              <p className="text-[10px] text-[#726E88] font-bold uppercase tracking-wider mt-0.5">Languages</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#22C55E]">Free</p>
              <p className="text-[10px] text-[#726E88] font-bold uppercase tracking-wider mt-0.5">To Use</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 border-t border-white/[0.03] bg-[#1C1929]/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Everything for Your Faith Journey</h2>
            <p className="text-sm text-[#A09DB1]">From Bible quizzes to church listings, everything a Christian community needs — in one place.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link to="/app/trivia" className="bg-[#1C1929] border border-[#7C3AED]/20 hover:border-[#7C3AED]/40 p-6 rounded-3xl space-y-3 transition-all group">
              <div className="w-11 h-11 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/25 flex items-center justify-center"><Award className="text-[#7C3AED]" size={20} /></div>
              <h3 className="text-base font-bold text-white group-hover:text-[#7C3AED] transition-colors">Bible Trivia Challenge</h3>
              <p className="text-xs text-[#A09DB1] leading-relaxed">Test your Bible knowledge across 4 difficulty levels — Beginners, Intermediate, Skilled, Expert. Choose Full Bible, New Testament, Old Testament, or Apologetics. 800+ questions, points system, and prizes!</p>
            </Link>

            <Link to="/app/apologetics" className="bg-[#1C1929] border border-[#38BDF8]/20 hover:border-[#38BDF8]/40 p-6 rounded-3xl space-y-3 transition-all group">
              <div className="w-11 h-11 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/25 flex items-center justify-center"><BookOpen className="text-[#38BDF8]" size={20} /></div>
              <h3 className="text-base font-bold text-white group-hover:text-[#38BDF8] transition-colors">Apologetics Blog</h3>
              <p className="text-xs text-[#A09DB1] leading-relaxed">Ask questions, share answers, and defend the faith with biblical and logical reasoning. Explore topics like God’s existence, the problem of evil, resurrection evidence, and science & faith.</p>
            </Link>

            <Link to="/app/churches" className="bg-[#1C1929] border border-[#F39B9B]/20 hover:border-[#F39B9B]/40 p-6 rounded-3xl space-y-3 transition-all group">
              <div className="w-11 h-11 rounded-2xl bg-[#F39B9B]/10 border border-[#F39B9B]/25 flex items-center justify-center"><Search className="text-[#F39B9B]" size={20} /></div>
              <h3 className="text-base font-bold text-white group-hover:text-[#F39B9B] transition-colors">Church Directory</h3>
              <p className="text-xs text-[#A09DB1] leading-relaxed">Find churches across India filtered by state, city, and language. Follow churches, see service times, and connect with local congregations near you.</p>
            </Link>

            <Link to="/app/list-church" className="bg-[#1C1929] border border-[#22C55E]/20 hover:border-[#22C55E]/40 p-6 rounded-3xl space-y-3 transition-all group">
              <div className="w-11 h-11 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/25 flex items-center justify-center"><Building2 className="text-[#22C55E]" size={20} /></div>
              <h3 className="text-base font-bold text-white group-hover:text-[#22C55E] transition-colors">List Your Church</h3>
              <p className="text-xs text-[#A09DB1] leading-relaxed">Add your church to our directory and help believers find a community. Include service times, denomination, location, and contact details.</p>
            </Link>

            <Link to="/app/marketplace" className="bg-[#1C1929] border border-[#9786E3]/20 hover:border-[#9786E3]/40 p-6 rounded-3xl space-y-3 transition-all group">
              <div className="w-11 h-11 rounded-2xl bg-[#9786E3]/10 border border-[#9786E3]/25 flex items-center justify-center"><Store className="text-[#9786E3]" size={20} /></div>
              <h3 className="text-base font-bold text-white group-hover:text-[#9786E3] transition-colors">Marketplace</h3>
              <p className="text-xs text-[#A09DB1] leading-relaxed">List your Christian business or shop & sell items — Bibles, books, music, apparel, and more. Connect with buyers via WhatsApp. No payment gateway needed.</p>
            </Link>

            <Link to="/app/prayer-wall" className="bg-[#1C1929] border border-[#F59E0B]/20 hover:border-[#F59E0B]/40 p-6 rounded-3xl space-y-3 transition-all group">
              <div className="w-11 h-11 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/25 flex items-center justify-center"><HeartHandshake className="text-[#F59E0B]" size={20} /></div>
              <h3 className="text-base font-bold text-white group-hover:text-[#F59E0B] transition-colors">Prayer Wall</h3>
              <p className="text-xs text-[#A09DB1] leading-relaxed">Share prayer requests and encourage one another in faith. A community space for lifting up needs and praising God for answered prayers.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-br from-[#1C1929] to-[#2B254E] border border-[#7C3AED]/20 rounded-3xl p-8 sm:p-12 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/25 text-[#A78BFA] text-xs font-bold">
                <Award size={12} /> Bible Trivia Challenge
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">How Well Do You Know the Bible?</h2>
              <p className="text-sm text-[#A09DB1] leading-relaxed">4 difficulty levels, 4 categories, 800+ questions, points and prizes</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { label: 'Beginners', color: '#22C55E', desc: '10 pts/q' },
                  { label: 'Intermediate', color: '#3B82F6', desc: '20 pts/q' },
                  { label: 'Skilled', color: '#A855F7', desc: '30 pts/q' },
                  { label: 'Expert', color: '#EF4444', desc: '50 pts/q' },
                ].map(lvl => (
                  <div key={lvl.label} className="bg-white/[0.04] rounded-xl px-3 py-2 border border-white/[0.06]">
                    <p className="text-xs font-bold" style={{ color: lvl.color }}>{lvl.label}</p>
                    <p className="text-[10px] text-[#94A3B8]">{lvl.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Link to="/app/trivia" className="w-full">
                <button className="w-full px-8 py-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-[#7C3AED]/25 flex items-center justify-center gap-2 transition-all">
                  Start Challenge <ArrowRight size={16} strokeWidth={2.5} />
                </button>
              </Link>
              <p className="text-xs text-[#726E88] mt-3">Free to play. Earn badges and recognition</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 max-w-3xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <Globe size={20} className="text-[#38BDF8]" />
          <h2 className="text-xl font-extrabold">Available in Indian Languages</h2>
        </div>
        <div className="flex justify-center gap-4">
          {[
            { label: 'English', flag: '🇬🇧' },
            { label: 'हिन्दी', flag: '🇮🇳' },
            { label: 'తెలుగు', flag: '🇮🇳' },
            { label: 'தமிழ்', flag: '🇮🇳' },
          ].map(lang => (
            <div key={lang.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
              <span className="text-2xl">{lang.flag}</span>
              <p className="text-xs font-bold text-[#94A3B8] mt-1">{lang.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 px-6 text-center max-w-4xl mx-auto w-full">
        <div className="bg-gradient-to-tr from-[#1C1929] to-slate-900 border border-white/[0.06] rounded-3xl p-8 sm:p-12 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#F39B9B]/5 blur-2xl rounded-full" />
          <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-[#9786E3]/5 blur-2xl rounded-full" />
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">“Iron sharpens iron”</h2>
          <p className="text-xs sm:text-sm text-[#A09DB1] max-w-lg mx-auto leading-relaxed">Join the crosscrafted community — explore churches, test your Bible knowledge, list your business, and grow in faith together.</p>
          <div className="pt-2">
            <Link to="/app/churches">
              <button className="px-8 py-3.5 bg-[#F39B9B] hover:bg-[#E27B7B] text-slate-950 font-extrabold rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all inline-flex items-center gap-2">
                Enter crosscrafted <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
