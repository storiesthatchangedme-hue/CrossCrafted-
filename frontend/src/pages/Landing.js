import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Marquee from 'react-fast-marquee';
import { Heart, Users, Calendar, Share2, Church, Sparkles } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      <nav className="sticky top-0 z-50 bg-[#FFFDF7] border-b-2 border-[#0A0A0A] py-4" data-testid="landing-nav">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Cross Crafted
          </h1>
          <div className="flex gap-4">
            <Link to="/login" data-testid="nav-login-button">
              <button className="neo-button-outline">Sign In</button>
            </Link>
            <Link to="/register" data-testid="nav-register-button">
              <button className="neo-button-primary">Get Started</button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="py-20 px-6" data-testid="hero-section">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1
                className="text-5xl sm:text-6xl font-bold tracking-tight leading-none mb-6"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                Share Your Faith.
                <br />
                <span className="text-[#FF90E8]">Build Community.</span>
              </h1>
              <p className="text-base sm:text-lg leading-relaxed font-medium text-[#52525B] mb-8">
                Cross Crafted is where believers connect, share testimonies, discover churches, and join events—all in one vibrant community.
              </p>
              <Link to="/register" data-testid="hero-cta-button">
                <button className="neo-button-primary text-lg px-8 py-4">
                  Join the Movement
                </button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[8px_8px_0_0_#0A0A0A] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1758272133833-3a2277d426e4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzZ8MHwxfHNlYXJjaHwyfHxkaXZlcnNlJTIweW91bmclMjBwZW9wbGUlMjBzbWlsaW5nJTIwZ2F0aGVyaW5nfGVufDB8fHx8MTc3NTUzMzM4MHww&ixlib=rb-4.1.0&q=85"
                  alt="Community gathering"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="py-8">
        <Marquee gradient={false} speed={50}>
          <div className="flex gap-8 text-4xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            <span className="px-8">CONNECT</span>
            <span className="text-[#FF90E8] px-8">•</span>
            <span className="px-8">WORSHIP</span>
            <span className="text-[#B4FF39] px-8">•</span>
            <span className="px-8">SHARE</span>
            <span className="text-[#FFD800] px-8">•</span>
            <span className="px-8">DISCOVER</span>
            <span className="text-[#80C4E9] px-8">•</span>
          </div>
        </Marquee>
      </div>

      <section className="py-20 px-6" data-testid="features-section">
        <div className="container mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-center mb-12"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            Everything You Need in One Place
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-[#FF90E8] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0_0_#0A0A0A] p-8 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0A0A0A] transition-all"
              data-testid="feature-testimonies"
            >
              <Heart className="mb-4" size={48} strokeWidth={2.5} />
              <h3 className="text-2xl font-semibold leading-snug mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Share Testimonies
              </h3>
              <p className="text-base leading-relaxed font-medium">
                Post your faith journey with photos and videos. Inspire others with your story.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-[#B4FF39] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0_0_#0A0A0A] p-8 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0A0A0A] transition-all"
              data-testid="feature-churches"
            >
              <Church className="mb-4" size={48} strokeWidth={2.5} />
              <h3 className="text-2xl font-semibold leading-snug mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Discover Churches
              </h3>
              <p className="text-base leading-relaxed font-medium">
                Find and follow churches in your area or around the world. Stay connected.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-[#FFD800] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0_0_#0A0A0A] p-8 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0A0A0A] transition-all"
              data-testid="feature-events"
            >
              <Calendar className="mb-4" size={48} strokeWidth={2.5} />
              <h3 className="text-2xl font-semibold leading-snug mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Join Events
              </h3>
              <p className="text-base leading-relaxed font-medium">
                RSVP to worship nights, gatherings, and community events near you.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-[#80C4E9] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0_0_#0A0A0A] p-8 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0A0A0A] transition-all"
              data-testid="feature-connect"
            >
              <Users className="mb-4" size={48} strokeWidth={2.5} />
              <h3 className="text-2xl font-semibold leading-snug mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Connect with Believers
              </h3>
              <p className="text-base leading-relaxed font-medium">
                Follow other members, build friendships, and grow together in faith.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0_0_#0A0A0A] p-8 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0A0A0A] transition-all"
              data-testid="feature-mobile"
            >
              <Share2 className="mb-4" size={48} strokeWidth={2.5} />
              <h3 className="text-2xl font-semibold leading-snug mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Mobile-First
              </h3>
              <p className="text-base leading-relaxed font-medium">
                Designed for Gen Z. Fast, fun, and beautiful on any device.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="bg-[#E5E5E5] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0_0_#0A0A0A] p-8 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#0A0A0A] transition-all"
              data-testid="feature-community"
            >
              <Sparkles className="mb-4" size={48} strokeWidth={2.5} />
              <h3 className="text-2xl font-semibold leading-snug mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Authentic Community
              </h3>
              <p className="text-base leading-relaxed font-medium">
                A safe space for real conversations and genuine faith expressions.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#FF90E8] border-t-2 border-b-2 border-[#0A0A0A]" data-testid="cta-section">
        <div className="container mx-auto text-center">
          <h2
            className="text-4xl sm:text-5xl font-bold tracking-tight leading-none mb-6"
            style={{ fontFamily: 'Fredoka, sans-serif' }}
          >
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8 font-medium">
            Join thousands of believers sharing their faith and building community.
          </p>
          <Link to="/register" data-testid="cta-button">
            <button className="bg-[#0A0A0A] text-white font-bold border-2 border-[#0A0A0A] rounded-full px-8 py-4 text-lg shadow-[4px_4px_0_0_#FFFDF7] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#FFFDF7] transition-all">
              Join Cross Crafted Now
            </button>
          </Link>
        </div>
      </section>

      <footer className="py-8 px-6 border-t-2 border-[#0A0A0A]">
        <div className="container mx-auto text-center text-[#52525B]">
          <p>&copy; 2026 Cross Crafted. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
