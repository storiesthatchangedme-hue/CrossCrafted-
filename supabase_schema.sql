-- CrossCrafted Production Schema
-- Comprehensive Supabase PostgreSQL schema for all application data

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ═══════════════════════════════════════════════════════════
-- CORE USER TABLES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    profile_image TEXT,
    bio TEXT DEFAULT '',
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    country TEXT DEFAULT 'India',
    phone TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    is_verified BOOLEAN DEFAULT false,
    gender TEXT,
    age INTEGER,
    denomination TEXT,
    baptized TEXT,
    church_attendance TEXT,
    church_name TEXT,
    favorite_verse TEXT,
    faith_journey_status TEXT,
    faith_belief TEXT,
    faith_journey TEXT,
    church_member TEXT,
    relationship_with_god TEXT,
    interests TEXT[] DEFAULT '{}',
    looking_for TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    personality_profile JSONB DEFAULT '{}',
    smoking TEXT,
    alcohol TEXT,
    occupation TEXT,
    completion_percentage INTEGER DEFAULT 0,
    followers TEXT[] DEFAULT '{}',
    following TEXT[] DEFAULT '{}',
    saved_posts TEXT[] DEFAULT '{}',
    completed_safe_intro BOOLEAN DEFAULT false,
    password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_state ON public.users(state);
CREATE INDEX idx_users_city ON public.users(city);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_legacy_id ON public.users(legacy_id);

-- Profiles (extended data, linked 1:1)
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    interests TEXT[] DEFAULT '{}',
    spiritual_gifts TEXT[] DEFAULT '{}',
    favorite_scripture TEXT,
    prayer_requests_count INTEGER DEFAULT 0,
    friends_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- POSTS / TESTIMONIES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id TEXT UNIQUE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content_text TEXT NOT NULL,
    image_url TEXT DEFAULT '',
    video_url TEXT DEFAULT '',
    likes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_legacy_id ON public.posts(legacy_id);

-- Comments (extracted from embedded arrays)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- FRIEND REQUESTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

CREATE INDEX idx_friend_requests_receiver ON public.friend_requests(receiver_id, status);
CREATE INDEX idx_friend_requests_sender ON public.friend_requests(sender_id, status);

-- ═══════════════════════════════════════════════════════════
-- MESSAGES & CONVERSATIONS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_convo_participants_user ON public.conversation_participants(user_id);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    image_url TEXT DEFAULT '',
    is_read BOOLEAN DEFAULT false,
    reactions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);

-- ═══════════════════════════════════════════════════════════
-- CHURCHES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.churches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id TEXT UNIQUE,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    state TEXT DEFAULT '',
    city TEXT DEFAULT '',
    description TEXT DEFAULT '',
    service_times TEXT DEFAULT '',
    cover_image TEXT DEFAULT '',
    languages TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    followers TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_churches_state ON public.churches(state);
CREATE INDEX idx_churches_city ON public.churches(city);
CREATE INDEX idx_churches_created_by ON public.churches(created_by);
CREATE INDEX idx_churches_legacy_id ON public.churches(legacy_id);

-- ═══════════════════════════════════════════════════════════
-- EVENTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    cover_image TEXT DEFAULT '',
    church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL,
    church_name TEXT DEFAULT '',
    state TEXT DEFAULT '',
    city TEXT DEFAULT '',
    languages TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_state ON public.events(state);
CREATE INDEX idx_events_church_id ON public.events(church_id);
CREATE INDEX idx_events_created_by ON public.events(created_by);
CREATE INDEX idx_events_legacy_id ON public.events(legacy_id);

CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

CREATE INDEX idx_event_regs_event ON public.event_registrations(event_id);

-- ═══════════════════════════════════════════════════════════
-- PRAYER WALL
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.prayers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id TEXT UNIQUE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    is_anonymous BOOLEAN DEFAULT false,
    praying_count INTEGER DEFAULT 0,
    prayers_users TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prayers_category ON public.prayers(category);
CREATE INDEX idx_prayers_user_id ON public.prayers(user_id);
CREATE INDEX idx_prayers_created_at ON public.prayers(created_at DESC);
CREATE INDEX idx_prayers_legacy_id ON public.prayers(legacy_id);

-- Prayer comments
CREATE TABLE IF NOT EXISTS public.prayer_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prayer_id UUID REFERENCES public.prayers(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prayer_comments_prayer ON public.prayer_comments(prayer_id);

-- ═══════════════════════════════════════════════════════════
-- MARKETPLACE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.marketplace_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id TEXT UNIQUE,
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    price DECIMAL(10,2) DEFAULT 0.00,
    category TEXT NOT NULL,
    condition TEXT NOT NULL DEFAULT 'Good',
    city TEXT NOT NULL DEFAULT '',
    image_url TEXT DEFAULT '',
    images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_marketplace_category ON public.marketplace_items(category);
CREATE INDEX idx_marketplace_city ON public.marketplace_items(city);
CREATE INDEX idx_marketplace_seller ON public.marketplace_items(seller_id);
CREATE INDEX idx_marketplace_status ON public.marketplace_items(status);
CREATE INDEX idx_marketplace_created_at ON public.marketplace_items(created_at DESC);
CREATE INDEX idx_marketplace_legacy_id ON public.marketplace_items(legacy_id);

-- ═══════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id TEXT UNIQUE,
    recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    sender_name TEXT DEFAULT '',
    sender_image TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT 'admin',
    message TEXT NOT NULL,
    ref_id TEXT DEFAULT '',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications(recipient_id, read);
CREATE INDEX idx_notifications_type ON public.notifications(recipient_id, type);
CREATE INDEX idx_notifications_legacy_id ON public.notifications(legacy_id);

-- ═══════════════════════════════════════════════════════════
-- TRIVIA
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.trivia_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id TEXT UNIQUE,
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT DEFAULT '',
    difficulty TEXT DEFAULT 'easy',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trivia_difficulty ON public.trivia_questions(difficulty);

CREATE TABLE IF NOT EXISTS public.trivia_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    difficulty TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    time_taken INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trivia_scores_user ON public.trivia_scores(user_id);

-- ═══════════════════════════════════════════════════════════
-- REPORTS & ADMIN
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id TEXT UNIQUE,
    reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON public.reports(status);

CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    admin_name TEXT DEFAULT '',
    action_type TEXT NOT NULL,
    target_type TEXT DEFAULT '',
    target_id TEXT DEFAULT '',
    description TEXT DEFAULT '',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_timestamp ON public.admin_logs(timestamp DESC);

-- ═══════════════════════════════════════════════════════════
-- USER BLOCKS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_blocks (
    blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);

-- ═══════════════════════════════════════════════════════════
-- BFF / DATING
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.bff_swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    swiper_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    swiped_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    direction TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(swiper_id, swiped_id)
);

CREATE INDEX idx_bff_swipes_swiper ON public.bff_swipes(swiper_id);
CREATE INDEX idx_bff_swipes_swiped ON public.bff_swipes(swiped_id);

CREATE TABLE IF NOT EXISTS public.bff_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    user2_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- ═══════════════════════════════════════════════════════════
-- RECENT SEARCHES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.recent_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    query TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recent_searches_user ON public.recent_searches(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- STORAGE BUCKETS (created via Supabase Dashboard or SQL)
-- ═══════════════════════════════════════════════════════════
-- Run these via Supabase SQL to create storage buckets:

-- INSERT INTO storage.buckets (id, name, public) VALUES
--   ('avatars', 'avatars', true),
--   ('posts', 'posts', true),
--   ('church-logos', 'church-logos', true),
--   ('events', 'events', true),
--   ('marketplace', 'marketplace', true),
--   ('prayers', 'prayers', true);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bff_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bff_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_searches ENABLE ROW LEVEL SECURITY;

-- Users: everyone can view, only self can update
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts: everyone can view, authenticated can create, owner can delete
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Post owner or admin can delete" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Comments: everyone can view, authenticated can create, owner/admin can delete
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Comment owner or admin can delete" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Messages: only participants can read/write
CREATE POLICY "Participants can read messages" ON public.messages FOR SELECT USING (
  conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

-- Notifications: only recipient can read, system creates
CREATE POLICY "Recipient can read notifications" ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Recipient can update notifications" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);

-- Prayers: everyone can view, authenticated can create
CREATE POLICY "Anyone can view prayers" ON public.prayers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create prayers" ON public.prayers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prayer comments
CREATE POLICY "Anyone can view prayer comments" ON public.prayer_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create prayer comments" ON public.prayer_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Churches: everyone can view, authenticated can create
CREATE POLICY "Anyone can view churches" ON public.churches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create churches" ON public.churches FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Church owner or admin can update" ON public.churches FOR UPDATE USING (auth.uid() = created_by);

-- Events: everyone can view, authenticated can create
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Marketplace: anyone can view active, authenticated can create/manage own
CREATE POLICY "Anyone can view active marketplace items" ON public.marketplace_items FOR SELECT USING (status = 'active');
CREATE POLICY "Users can manage own marketplace items" ON public.marketplace_items FOR ALL USING (auth.uid() = seller_id);

-- Trivia
CREATE POLICY "Anyone can view trivia questions" ON public.trivia_questions FOR SELECT USING (true);
CREATE POLICY "Users can view own scores" ON public.trivia_scores FOR SELECT USING (auth.uid() = user_id);

-- BFF
CREATE POLICY "Users can view own swipes" ON public.bff_swipes FOR SELECT USING (auth.uid() = swiper_id);
CREATE POLICY "Users can create swipes" ON public.bff_swipes FOR INSERT WITH CHECK (auth.uid() = swiper_id);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;