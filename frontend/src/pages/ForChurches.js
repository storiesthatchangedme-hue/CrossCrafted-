import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, Bell, MapPin, BarChart, Smartphone, ArrowRight } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const CHURCH_IMG = 'https://images.unsplash.com/photo-1610429306561-e97267dd9b0a?w=1000&q=80';
const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

const ForChurches = () => (
  <div className="min-h-screen bg-[#0F172A] text-white">
    <PublicNav />

    {/* Hero */}
    <section className="relative pt-28 pb-20 px-6" data-testid="churches-hero">
      <div className="absolute inset-0 opacity-10">
        <img src={CHURCH_IMG} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-[#0F172A]/80 to-[#0F172A]" />
      <div className="relative container mx-auto">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="text-[#3B82F6] text-xs font-semibold tracking-widest uppercase mb-5">For Churches</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
              Your congregation<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #3B82F6, #A855F7)' }}>
                is already online.
              </span>
            </h1>
            <p className="text-base text-[#94A3B8] leading-relaxed mb-8 max-w-md">
              Reach your people where they are. Build digital community that extends beyond Sunday morning. Free, forever.
            </p>
            <Link to="/register">
              <button className="px-8 py-4 rounded-2xl font-semibold text-white flex items-center gap-2.5 transition-all hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #A855F7)', boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}>
                Create Church Profile
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-5">Churches on Cross Crafted</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[{ n: '500+', l: 'Churches' }, { n: '10K+', l: 'Members' }, { n: '1K+', l: 'Events' }].map((s) => (
                <div key={s.l} className="text-center">
                  <p className="text-xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #3B82F6, #A855F7)' }}>{s.n}</p>
                  <p className="text-[11px] text-[#64748B] mt-1">{s.l}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-[#94A3B8] leading-relaxed italic">
              "Cross Crafted helped us connect with 200+ members who never made it to Sunday service. It's been a game-changer for our outreach."
            </p>
            <p className="text-xs text-[#64748B] mt-2">— Pastor James, Grace Community</p>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="py-20 px-6 border-t border-white/[0.04]">
      <div className="container mx-auto">
        <motion.div {...fadeUp} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything your church needs</h2>
          <p className="text-sm text-[#94A3B8] mt-3">All free. No hidden fees. No premium tiers.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Users, title: 'Build Community', desc: 'Connect with your congregation beyond Sunday. Share updates, celebrate wins, support each other.', color: '#3B82F6' },
            { icon: Calendar, title: 'Organize Events', desc: 'Create worship nights, Bible studies, gatherings. Track RSVPs and manage attendance effortlessly.', color: '#A855F7' },
            { icon: Bell, title: 'Share Updates', desc: 'Post announcements, sermon highlights, and testimonies. Keep your community engaged and informed.', color: '#EC4899' },
            { icon: MapPin, title: 'Get Discovered', desc: 'Help people in your area find your church. Make it effortless for visitors to connect.', color: '#F97316' },
            { icon: BarChart, title: 'Track Growth', desc: 'See how your community grows with followers, attendance, and engagement insights.', color: '#3B82F6' },
            { icon: Smartphone, title: 'Mobile-First', desc: 'Your congregation accesses everything from their phones. Designed for Gen Z and beyond.', color: '#A855F7' },
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
      <div className="container mx-auto">
        <motion.div {...fadeUp} className="text-center mb-14">
          <h2 className="text-3xl font-bold">Get started in minutes</h2>
        </motion.div>
        <div className="grid md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {['Create Profile', 'Post Events', 'Engage Members', 'Watch Growth'].map((step, i) => (
            <motion.div key={step} {...fadeUp} transition={{ delay: i * 0.08 }} className="text-center">
              <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${['#3B82F6','#A855F7','#EC4899','#F97316'][i]}, ${['#A855F7','#EC4899','#F97316','#3B82F6'][i]})` }}>
                {i + 1}
              </div>
              <p className="text-sm font-semibold">{step}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="relative py-24 px-6">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />
      <div className="relative container mx-auto text-center max-w-xl">
        <motion.div {...fadeUp}>
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-5">
            Ready to meet your people
            <span className="bg-clip-text text-transparent ml-1" style={{ backgroundImage: 'linear-gradient(135deg, #3B82F6, #A855F7)' }}>
              where they are?
            </span>
          </h2>
          <p className="text-[15px] text-[#94A3B8] mb-8">100% free. Set up in under 5 minutes.</p>
          <Link to="/register">
            <button className="px-8 py-4 rounded-2xl font-semibold text-white transition-all hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #A855F7)', boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}>
              Create Your Church Profile
            </button>
          </Link>
        </motion.div>
      </div>
    </section>

    <PublicFooter />
  </div>
);

export default ForChurches;
