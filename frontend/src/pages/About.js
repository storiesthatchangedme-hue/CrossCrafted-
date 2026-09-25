import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Target, Users, Globe } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

const About = () => (
  <div className="min-h-screen bg-[#0F172A] text-white">
    <PublicNav />

    {/* Hero */}
    <section className="pt-28 pb-20 px-6" data-testid="about-hero">
      <div className="container mx-auto text-center max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <p className="text-[#A855F7] text-xs font-semibold tracking-widest uppercase mb-5">Our story</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
            We believe every voice<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>
              carries a testimony.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-2xl mx-auto">
            Cross Crafted was born from a simple conviction: the most powerful thing you can share isn't a photo of your lunch — it's the story of how God showed up when you thought He wouldn't.
          </p>
        </motion.div>
      </div>
    </section>

    {/* Mission */}
    <section className="py-20 px-6 border-y border-white/[0.04]">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <motion.div {...fadeUp}>
            <p className="text-[#EC4899] text-xs font-semibold tracking-widest uppercase mb-4">The mission</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-6">
              A space where faith is the algorithm.
            </h2>
            <p className="text-[15px] text-[#94A3B8] leading-relaxed mb-5">
              In a world where social media rewards outrage and vanity, we built something different. Cross Crafted is a platform where authenticity isn't a strategy — it's the whole point.
            </p>
            <p className="text-[15px] text-[#94A3B8] leading-relaxed">
              Every feature we build starts with one question: <span className="text-white font-medium">does this bring people closer to God and closer to each other?</span> If the answer isn't yes, we don't build it.
            </p>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.1 }}
            className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
            <h3 className="text-lg font-bold mb-6">What drives us</h3>
            <div className="space-y-5">
              {[
                { icon: Heart, label: 'Authentic faith expression', color: '#EC4899' },
                { icon: Users, label: 'Connections that go deeper than a like', color: '#A855F7' },
                { icon: Globe, label: 'A global community united by purpose', color: '#3B82F6' },
                { icon: Target, label: 'Engagement with eternal meaning', color: '#F97316' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}12` }}>
                    <Icon size={18} style={{ color }} strokeWidth={1.8} />
                  </div>
                  <span className="text-sm text-[#CBD5E1] font-medium">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <motion.div {...fadeUp} className="text-center mb-14">
          <p className="text-[#3B82F6] text-xs font-semibold tracking-widest uppercase mb-3">What we stand for</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Our values</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            { title: 'Authenticity', desc: 'Real stories from real people. No filters, no facades — just genuine faith experiences that inspire and heal.', color: '#A855F7' },
            { title: 'Community', desc: 'Faith grows best together. We\'re building connections that go beyond the screen and into real life.', color: '#EC4899' },
            { title: 'Growth', desc: 'Every story shared and every connection made is a step forward. We celebrate progress, not perfection.', color: '#3B82F6' },
          ].map((v, i) => (
            <motion.div key={v.title} {...fadeUp} transition={{ delay: i * 0.1 }}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-7 hover:border-white/[0.1] transition-all">
              <div className="w-2 h-2 rounded-full mb-5" style={{ background: v.color, boxShadow: `0 0 12px ${v.color}` }} />
              <h3 className="text-lg font-bold mb-2">{v.title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="relative py-24 px-6">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.08) 0%, transparent 70%)' }} />
      <div className="relative container mx-auto text-center max-w-xl">
        <motion.div {...fadeUp}>
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-5">
            Be part of something
            <span className="bg-clip-text text-transparent ml-1.5" style={{ backgroundImage: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>
              bigger than yourself.
            </span>
          </h2>
          <p className="text-[15px] text-[#94A3B8] mb-8">
            This isn't a platform. It's a generation choosing faith over fear, community over clout.
          </p>
          <Link to="/register">
            <button className="px-8 py-4 rounded-2xl font-semibold text-white transition-all hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)', boxShadow: '0 8px 32px rgba(168,85,247,0.3)' }}>
              Join the Movement
            </button>
          </Link>
        </motion.div>
      </div>
    </section>

    <PublicFooter />
  </div>
);

export default About;
