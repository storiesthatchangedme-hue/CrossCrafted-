import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { toast } from 'sonner';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Message sent! We\'ll get back to you soon.');
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <PublicNav />

      {/* Hero */}
      <section className="pt-28 pb-16 px-6" data-testid="contact-hero">
        <div className="container mx-auto text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[#3B82F6] text-xs font-semibold tracking-widest uppercase mb-5">Get in touch</p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight mb-4">
              We'd love to
              <span className="bg-clip-text text-transparent ml-2" style={{ backgroundImage: 'linear-gradient(135deg, #3B82F6, #A855F7)' }}>
                hear from you.
              </span>
            </h1>
            <p className="text-base text-[#94A3B8] leading-relaxed">
              Questions, partnership ideas, or just want to say hey — we're here.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form + Info */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            <motion.div {...fadeUp}>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="contact-form">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">Your Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#A855F7]/50 transition-colors"
                    required data-testid="contact-name-input" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#A855F7]/50 transition-colors"
                    required data-testid="contact-email-input" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">Subject</label>
                  <input type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#A855F7]/50 transition-colors"
                    required data-testid="contact-subject-input" placeholder="How can we help?" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">Message</label>
                  <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#475569] outline-none focus:border-[#A855F7]/50 transition-colors h-28 resize-none"
                    required data-testid="contact-message-input" placeholder="Tell us what's on your mind..." />
                </div>
                <button type="submit" className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
                  style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)', boxShadow: '0 4px 16px rgba(168,85,247,0.25)' }}
                  data-testid="contact-submit-button">
                  <Send size={16} strokeWidth={2} />
                  Send Message
                </button>
                {submitted && (
                  <p className="text-center text-sm text-[#A855F7] font-medium" data-testid="success-message">
                    Message sent successfully!
                  </p>
                )}
              </form>
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="space-y-4">
              {[
                { icon: Mail, title: 'Email Us', desc: 'For general inquiries and support', info: 'hello@crosscrafted.com', href: 'mailto:hello@crosscrafted.com', color: '#A855F7' },
                { icon: Phone, title: 'Call Us', desc: 'Mon-Fri, 9am-5pm PST', info: '+1 (234) 567-8900', href: 'tel:+1234567890', color: '#EC4899' },
                { icon: MapPin, title: 'Visit Us', desc: '123 Faith Street\nSan Francisco, CA 94102', info: null, href: null, color: '#3B82F6' },
              ].map(({ icon: Icon, title, desc, info, href, color }) => (
                <div key={title} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.1] transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}12` }}>
                      <Icon size={18} style={{ color }} strokeWidth={1.8} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold mb-1">{title}</h3>
                      <p className="text-xs text-[#64748B] whitespace-pre-line">{desc}</p>
                      {info && href && (
                        <a href={href} className="text-sm font-semibold text-[#A855F7] hover:text-[#EC4899] mt-2 block transition-colors">{info}</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.06) 0%, transparent 70%)' }} />
        <div className="relative container mx-auto text-center max-w-xl">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl font-bold leading-tight mb-5">
              Ready to
              <span className="bg-clip-text text-transparent ml-1.5" style={{ backgroundImage: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>
                join the movement?
              </span>
            </h2>
            <p className="text-[15px] text-[#94A3B8] mb-8">Don't wait. Your story matters.</p>
            <Link to="/register">
              <button className="px-8 py-4 rounded-2xl font-semibold text-white transition-all hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)', boxShadow: '0 8px 32px rgba(168,85,247,0.3)' }}>
                Join Cross Crafted
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Contact;
