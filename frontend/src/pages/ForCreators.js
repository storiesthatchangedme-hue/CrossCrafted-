import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Video, Share2, TrendingUp, Award, Shield, ArrowRight } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

const ForCreators = () => (
  <div className="min-h-screen bg-[#0F172A] text-white">
    <PublicNav />

    {/* Hero */}
    <section className="pt-28 pb-20 px-6" data-testid="creators-hero">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="text-[#EC4899] text-xs font-semibold tracking-widest uppercase mb-5">For Creators</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
              Your testimony<br />is your
              <span className="bg-clip-text text-transparent ml-2" style={{ backgroundImage: 'linear-gradient(135deg, #EC4899, #F97316)' }}>
                superpower.
              </span>
            </h1>
            <p className="text-base text-[#94A3B8] leading-relaxed mb-8 max-w-md">
              Stop curating a fake highlight reel. Start sharing the real story — the struggle, the breakthrough, the grace. That's what changes lives.
            </p>
            <Link to="/register">
              <button className="px-8 py-4 rounded-2xl font-semibold text-white flex items-center gap-2.5 transition-all hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)', boxShadow: '0 8px 32px rgba(236,72,153,0.3)' }}>
                Start Creating
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-5">The creator community</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[{ n: '5K+', l: 'Creators' }, { n: '50K+', l: 'Testimonies' }, { n: '1M+', l: 'Views' }].map((s) => (
                <div key={s.l} className="text-center">
                  <p className="text-xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #EC4899, #F97316)' }}>{s.n}</p>
                  <p className="text-[11px] text-[#64748B] mt-1">{s.l}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-[#94A3B8] leading-relaxed italic">
              "Three people DM'd me saying my story about anxiety gave them hope. On Instagram that never happened. Here, people actually listen."
            </p>
            <p className="text-xs text-[#64748B] mt-2">— @em.restored</p>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Why */}
    <section className="py-20 px-6 border-t border-white/[0.04]">
      <div className="container mx-auto">
        <motion.div {...fadeUp} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Why creators choose Cross Crafted</h2>
          <p className="text-sm text-[#94A3B8] mt-3">Built for impact, not vanity metrics.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Heart, title: 'Authentic Expression', desc: 'Share your real faith experiences. No algorithm pushing you toward fake perfection.', color: '#EC4899' },
            { icon: Video, title: 'Rich Media', desc: 'Upload photos and videos to tell your story the way it deserves to be told.', color: '#F97316' },
            { icon: Share2, title: 'Real Reach', desc: 'Your testimony reaches believers who actually need it — not bots and scrollers.', color: '#A855F7' },
            { icon: TrendingUp, title: 'Meaningful Growth', desc: 'Build a following of people who resonate with your message and cheer you on.', color: '#3B82F6' },
            { icon: Award, title: 'Supportive Community', desc: 'Connect with creators who lift each other up instead of competing for clout.', color: '#EC4899' },
            { icon: Shield, title: 'Safe Space', desc: 'No trolls, no toxicity. Just faith, hope, and love. The way it should be.', color: '#F97316' },
          ].map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div key={title} {...fadeUp} transition={{ delay: i * 0.06 }}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.1] transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}12` }}>
                <Icon size={20} style={{ color }} strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-bold mb-1.5">{title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Steps */}
    <section className="py-20 px-6 border-t border-white/[0.04]">
      <div className="container mx-auto max-w-2xl">
        <motion.div {...fadeUp} className="text-center mb-14">
          <h2 className="text-3xl font-bold">Start in 3 steps</h2>
        </motion.div>
        <div className="space-y-5">
          {[
            { step: '01', title: 'Sign Up Free', desc: 'Create your account and set up your profile in under a minute.' },
            { step: '02', title: 'Share Your Story', desc: 'Post your first testimony with text, photos, or video. Be real.' },
            { step: '03', title: 'Watch the Impact', desc: 'See your story resonate. Receive messages from people you\'ve inspired.' },
          ].map((s, i) => (
            <motion.div key={s.step} {...fadeUp} transition={{ delay: i * 0.08 }}
              className="flex gap-5 items-start bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5 hover:border-white/[0.08] transition-all">
              <span className="text-2xl font-bold bg-clip-text text-transparent flex-shrink-0"
                style={{ backgroundImage: 'linear-gradient(135deg, #EC4899, #F97316)' }}>{s.step}</span>
              <div>
                <h3 className="text-base font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="relative py-24 px-6">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(236,72,153,0.08) 0%, transparent 70%)' }} />
      <div className="relative container mx-auto text-center max-w-xl">
        <motion.div {...fadeUp}>
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-5">
            Someone out there needs to hear
            <span className="bg-clip-text text-transparent ml-1" style={{ backgroundImage: 'linear-gradient(135deg, #EC4899, #F97316)' }}>
              exactly your story.
            </span>
          </h2>
          <p className="text-[15px] text-[#94A3B8] mb-8">Don't let your testimony die in silence.</p>
          <Link to="/register">
            <button className="px-8 py-4 rounded-2xl font-semibold text-white transition-all hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, #EC4899, #F97316)', boxShadow: '0 8px 32px rgba(236,72,153,0.3)' }}>
              Start Your Creator Journey
            </button>
          </Link>
        </motion.div>
      </div>
    </section>

    <PublicFooter />
  </div>
);

export default ForCreators;
