const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('[WARN] JWT_SECRET is not set. Authentication will fail.');
}

const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════
// Supabase Database Layer
// ═══════════════════════════════════════════════════════════
let db;
try {
  db = require('./supabase-db');
  console.log('[DB] Connected to Supabase PostgreSQL');
} catch (err) {
  console.warn('[DB] Supabase not configured, falling back to in-memory storage');
  db = null;
}

// Legacy in-memory fallback (used when Supabase is not configured)
const DATA_FILE = path.join(__dirname, 'data.json');

// --- CORS Configuration (Explicit Allowlist) ---
const parseCorsOrigins = () => {
  const raw = (process.env.CORS_ORIGINS || '').trim();
  if (!raw) {
    // Development fallback: allow localhost on common ports
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];
  }
  if (raw === '*') {
    // Wildcard: allow all origins (dev only — never use in production)
    return true;
  }
  return raw.split(',').map(s => s.trim()).filter(Boolean);
};

const corsOptions = {
  origin: parseCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// --- Security Headers (Helmet) ---
app.use(helmet({
  contentSecurityPolicy: false, // SPA requires inline scripts; configure CSP separately when ready
  crossOriginEmbedderPolicy: false, // Required for loading cross-origin images (e.g., Unsplash)
}));

// --- Disable Express Fingerprinting ---
app.disable('x-powered-by');

// --- Request Body Parsing (with size limits) ---
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: false }));
app.use(cookieParser());

// --- Rate Limiting ---
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const authLimiter = rateLimit({
  windowMs: RATE_WINDOW_MS,
  max: 10,
  message: { detail: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: RATE_WINDOW_MS,
  max: 30,
  message: { detail: 'Too many upload requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: RATE_WINDOW_MS,
  max: 20,
  message: { detail: 'Too many AI requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const messagingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { detail: 'Too many messages. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- File Upload Validation ---
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'),
        false
      );
    }
    cb(null, true);
  },
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
    files: 1,
  },
});

// --- Database Helper (In-memory + JSON File Persistence) ---
if (!db) db = {
  users: [],
  posts: [],
  churches: [],
  events: [],
  event_registrations: [],
  products: [],
  recent_searches: [],
  notifications: [],
  conversations: [],
  messages: [],
  admin_logs: [],
  login_attempts: [],
  prayers: [],
  trivia_questions: [],
  reports: []
};

// --- Supabase Synchronization Helpers ---
// Legacy in-memory fallback (used when Supabase is not configured)
function loadDbLegacy() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      db = JSON.parse(data);
      console.log('[Legacy] Local database cache loaded with', db.users.length, 'users.');
    } else {
      seedDb();
    }
    enforceAdmin();
    if (!db.prayers) db.prayers = [];
    if (!db.reports) db.reports = [];
    if (!db.trivia_questions) db.trivia_questions = [];
    if (db.prayers.length === 0) seedPrayers();
    if (db.trivia_questions.length === 0) seedTrivia();
  } catch (err) {
    console.error('[Legacy] Failed to load database. Initializing seed.', err);
    seedDb();
    enforceAdmin();
  }
}

function saveDbLegacy() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[Legacy] Failed to save database:', err);
  }
}

// ═══════════════════════════════════════════════════════════════
// Compatibility Proxy: Makes legacy array patterns work with Supabase async ops
// ═════════════════════════════════════════════════════════════════
function createLegacyProxy(table, supabaseModule) {
  if (!DB.isSupabase || !supabaseModule) return null;

  const handler = {
    get(target, prop) {
      if (prop === 'length') return new Proxy([], { get: () => 0 }); // Can't sync length
      if (typeof prop === 'string' && prop.startsWith('find')) {
        return (...args) => {
          const [queryOrId, callback] = args;
          if (typeof queryOrId === 'function') return queryOrId(callback); // .find(fn)
          // Support both .find(u => ...) and .find(id)
          const isFn = typeof queryOrId === 'function';
          const searchId = isFn ? null : queryOrId;
          return new Proxy([], {
            get: () => searchId ? [] : (isFn ? DB.users.filter(searchId) : []),
            [Symbol.iterator]: async function* () {
              let results;
              if (searchId) {
                results = [DB.users.find(u => u._id === searchId) || DB.users.find(u => u.legacy_id === searchId)].filter(Boolean);
              } else {
                results = isFn ? DB.users.filter(searchId) : [];
              }
              for (const item of results) yield item;
            },
            forEach: () => {}, // Legacy compatibility
            map: (fn) => DB.users.filter(fn), // .find(fn) pattern
            filter: (fn) => DB.users.filter(fn),
            find: (fn) => DB.users.find(fn),
            some: (fn) => DB.users.some(fn),
            every: (fn) => DB.users.every(fn),
            reduce: () => {}, // Not used
            includes: (id) => !!DB.users.find(u => u._id === id || u.legacy_id === id),
            indexOf: (id) => { const u = DB.users.find(u => u._id === id || u.legacy_id === id); return u ? 0 : -1; },
            splice: () => { console.warn('[Proxy] .splice() not supported on Supabase proxy'); },
          });
        };
      }
      // Handle .filter(q), .map(), .sort(), etc.
      return new Proxy([], {
        get: () => [],
        [Symbol.iterator]: async function* () {
          // For .map or direct iteration — just return the current array
          // The server code typically does db.posts.map(...) so DB[table] is the real array
          const arr = DB[table] || [];
          for (const item of arr) yield item;
        },
        filter: (fn) => Array.isArray(DB[table]) ? DB[table].filter(fn) : [],
        find: (fn) => Array.isArray(DB[table]) ? DB[table].find(fn) : null,
        some: (fn) => Array.isArray(DB[table]) ? DB[table].some(fn) : false,
        every: (fn) => Array.isArray(DB[table]) ? DB[table].every(fn) : true,
        includes: (id) => Array.isArray(DB[table]) ? DB[table].some(u => u._id === id || u.legacy_id === id) : false,
        indexOf: (id) => { const arr = DB[table] || []; return arr.findIndex(u => u._id === id || u.legacy_id === id); },
        length: Array.isArray(DB[table]) ? DB[table].length : 0,
        map: (fn) => Array.isArray(DB[table]) ? DB[table].map(fn) : [],
        forEach: (fn) => { if (Array.isArray(DB[table])) DB[table].forEach(fn); },
        sort: (fn) => { if (Array.isArray(DB[table])) DB[table].sort(fn); },
        unshift: (item) => { console.warn(`[Proxy] .unshift() not supported on ${table} — use db.${table}.create()`); },
        push: (item) => { console.warn(`[Proxy] .push() not supported on ${table} — use db.${table}.create()`); },
      };
    },
    set(target, prop, value) {
      if (prop === 'length' || prop === 'prototype') return true;
      return true; // Silently accept all mutations (server handles them)
    },
  };

  return new Proxy(handler, handler);
}

// Create proxies for all array-based tables
const proxyUsers = createLegacyProxy('users', db.users);
const proxyPosts = createLegacyProxy('posts', db.posts);
const proxyChurches = createLegacyProxy('churches', db.churches);
const proxyEvents = createLegacyProxy('events', db.events);
const proxyEventRegs = createLegacyProxy('event_registrations', db.event_registrations);
const proxyProducts = createLegacyProxy('products', db.products);
const proxyPrayers = createLegacyProxy('prayers', db.prayers);
const proxyNotifications = createLegacyProxy('notifications', db.notifications);
const proxyConversations = createLegacyProxy('conversations', db.conversations);
const proxyMessages = createLegacyProxy('messages', db.messages);
const proxyAdminLogs = createLegacyProxy('admin_logs', db.admin_logs);
const proxyTrivia = createLegacyProxy('trivia_questions', db.trivia_questions);
const proxyReports = createLegacyProxy('reports', db.reports);
const proxyRecentSearches = createLegacyProxy('recent_searches', db.recent_searches);
const proxyLoginAttempts = createLegacyProxy('login_attempts', db.login_attempts);

// Use proxies for legacy patterns when Supabase is active
if (DB.isSupabase) {
  console.log('[DB] Legacy proxy wrappers active for array compatibility');
  DB.users = proxyUsers;
  DB.posts = proxyPosts;
  DB.churches = proxyChurches;
  DB.events = proxyEvents;
  DB.event_registrations = proxyEventRegs;
  DB.products = proxyProducts;
  DB.prayers = proxyPrayers;
  DB.notifications = proxyNotifications;
  DB.conversations = proxyConversations;
  DB.messages = proxyMessages;
  DB.admin_logs = proxyAdminLogs;
  DB.trivia_questions = proxyTrivia;
  DB.reports = proxyReports;
  DB.recent_searches = proxyRecentSearches;
  DB.login_attempts = proxyLoginAttempts;
}

// Enforce master admin account configuration
function enforceAdmin() {
  if (!db || !db.users) return;
  
  // Ensure the user with email crosscraftedin@gmail.com is an admin
  let adminUser = db.users.find(u => u.email && u.email.toLowerCase() === 'crosscraftedin@gmail.com');
  if (!adminUser) {
    // If not found, look for bookingjosh@gmail.com or username admin and rename/update them
    adminUser = db.users.find(u => u.email && u.email.toLowerCase() === 'bookingjosh@gmail.com');
    if (!adminUser) {
      adminUser = db.users.find(u => u.username && u.username.toLowerCase() === 'admin');
    }
    
    if (adminUser) {
      adminUser.email = 'crosscraftedin@gmail.com';
      adminUser.name = 'Cross Crafted Admin';
      adminUser.username = 'admin';
      adminUser.role = 'admin';
      adminUser.status = 'active';
      adminUser.is_verified = true;
    } else {
      // Create user_admin or crosscraftedin@gmail.com admin
      adminUser = {
        _id: 'user_admin',
        name: 'Cross Crafted Admin',
        username: 'admin',
        email: 'crosscraftedin@gmail.com',
        password_hash: bcrypt.hashSync(process.env.ADMIN_SEED_PASSWORD || 'CHANGE-ME-IN-PRODUCTION', 10),
        bio: 'Platform Administrator',
        profile_image: '',
        phone: '+919052681374',
        role: 'admin',
        status: 'active',
        is_verified: true,
        followers: [],
        following: [],
        saved_posts: [],
        created_at: new Date().toISOString()
      };
      db.users.unshift(adminUser);
    }
  } else {
    // Found user with email crosscraftedin@gmail.com, make sure role is admin
    adminUser.role = 'admin';
    adminUser.status = 'active';
    adminUser.is_verified = true;
  }
}

// --- Seed Data Initialization ---
function seedDb() {
  console.log('Seeding initial database...');
  
  // Password for seed/mock users (sandbox only). Set ADMIN_SEED_PASSWORD in .env for local dev.
  const defaultHash = bcrypt.hashSync(process.env.ADMIN_SEED_PASSWORD || 'CHANGE-ME-IN-PRODUCTION', 10);

  // 8 Mock Users from seed_data.py
  const users = [
    {
      _id: 'user_sarah',
      name: 'Sarah Mitchell',
      username: 'sarah.faith',
      email: 'sarah@example.com',
      password_hash: defaultHash,
      bio: 'Worship leader. Storyteller. Saved by grace. Sharing my testimony one post at a time.',
      profile_image: 'https://images.unsplash.com/photo-1758598304332-94b40ce7c7b4?w=200&q=80',
      role: 'worship_leader',
      status: 'active',
      is_verified: true,
      completed_safe_intro: true,
      followers: [],
      following: [],
      saved_posts: [],
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    },
    {
      _id: 'user_marcus',
      name: 'Marcus Johnson',
      username: 'marcusjay',
      email: 'marcus@example.com',
      password_hash: defaultHash,
      bio: 'Found God at 19. Never looked back. Youth pastor at Hillside Church.',
      profile_image: 'https://images.unsplash.com/photo-1758874574397-e56dfcfc116d?w=200&q=80',
      role: 'youth_pastor',
      status: 'active',
      is_verified: true,
      completed_safe_intro: true,
      followers: [],
      following: [],
      saved_posts: [],
      created_at: new Date(Date.now() - 29 * 24 * 3600 * 1000).toISOString()
    },
    {
      _id: 'user_emily',
      name: 'Emily Rodriguez',
      username: 'em.restored',
      email: 'emily@example.com',
      password_hash: defaultHash,
      bio: 'Anxiety almost won. But God. Sharing my journey to help others find hope.',
      profile_image: 'https://images.unsplash.com/photo-1758523672333-12a4099a60b0?w=200&q=80',
      role: 'user',
      status: 'active',
      is_verified: false,
      followers: [],
      following: [],
      saved_posts: [],
      created_at: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString()
    },
    {
      _id: 'user_david',
      name: 'David Kim',
      username: 'dk.worship',
      email: 'david@example.com',
      password_hash: defaultHash,
      bio: 'Musician. Songwriter. Leading worship since 16. Every song is a prayer.',
      profile_image: 'https://images.unsplash.com/photo-1758598302784-42d00ce2ba8f?w=200&q=80',
      role: 'worship_leader',
      status: 'active',
      is_verified: true,
      completed_safe_intro: true,
      followers: [],
      following: [],
      saved_posts: [],
      created_at: new Date(Date.now() - 27 * 24 * 3600 * 1000).toISOString()
    },
    {
      _id: 'user_aiden',
      name: 'Aiden Brooks',
      username: 'aiden.walks',
      email: 'aiden@example.com',
      password_hash: defaultHash,
      bio: 'Seminary student. Coffee addict. Learning to trust God one chapter at a time.',
      profile_image: 'https://images.unsplash.com/photo-1618517047977-854f5c4b6976?w=200&q=80',
      role: 'user',
      status: 'active',
      is_verified: false,
      followers: [],
      following: [],
      saved_posts: [],
      created_at: new Date(Date.now() - 26 * 24 * 3600 * 1000).toISOString()
    },
    {
      _id: 'user_jasmine',
      name: 'Jasmine Carter',
      username: 'jas.beloved',
      email: 'jasmine@example.com',
      password_hash: defaultHash,
      bio: "Single mom of 2. God's faithfulness is my daily bread. He provides.",
      profile_image: 'https://images.unsplash.com/photo-1609371497456-3a55a205d5eb?w=200&q=80',
      role: 'user',
      status: 'active',
      is_verified: false,
      followers: [],
      following: [],
      saved_posts: [],
      created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString()
    },
    {
      _id: 'user_noah',
      name: 'Noah Parker',
      username: 'noah.redeemed',
      email: 'noah@example.com',
      password_hash: defaultHash,
      bio: "Former addict. 4 years clean through Christ. My story isn't pretty but it's real.",
      profile_image: 'https://images.unsplash.com/photo-1618593706014-06782cd3bb3b?w=200&q=80',
      role: 'user',
      status: 'active',
      is_verified: true,
      completed_safe_intro: true,
      followers: [],
      following: [],
      saved_posts: [],
      created_at: new Date(Date.now() - 24 * 24 * 3600 * 1000).toISOString()
    },
    {
      _id: 'user_olivia',
      name: 'Olivia Chen',
      username: 'liv.gracefully',
      email: 'olivia@example.com',
      password_hash: defaultHash,
      bio: "First-gen believer. Navigating faith in a family that doesn't understand. But God is faithful.",
      profile_image: 'https://images.unsplash.com/photo-1582070595814-fe36a8d39532?w=200&q=80',
      role: 'user',
      status: 'active',
      is_verified: false,
      followers: [],
      following: [],
      saved_posts: [],
      created_at: new Date(Date.now() - 23 * 24 * 3600 * 1000).toISOString()
    }
  ];

  // Admin account from server.py seed_admin
  const adminUser = {
    _id: 'user_admin',
    name: 'Admin',
    username: 'admin',
    email: 'crosscraftedin@gmail.com',
    password_hash: bcrypt.hashSync(process.env.ADMIN_SEED_PASSWORD || 'CHANGE-ME-IN-PRODUCTION', 10),
    bio: 'Platform Administrator',
    profile_image: '',
    phone: '+919052681374',
    role: 'admin',
    status: 'active',
    is_verified: true,
    followers: [],
    following: [],
    saved_posts: [],
    created_at: new Date().toISOString()
  };

  db.users = [adminUser, ...users];

  // 6 Churches from seed_data.py
  db.churches = [
    {
      _id: 'church_hillside',
      name: 'Hillside Community Church',
      location: 'Austin, TX',
      state: 'TX',
      city: 'Austin',
      description: 'A Christ-centered, multigenerational community rooted in worship, the Word, and real relationships. Everyone has a place here.',
      service_times: 'Sun 9:00 AM & 11:00 AM | Wed 7:00 PM',
      cover_image: 'https://images.unsplash.com/photo-1760367120345-35a4bbadf3cf?w=1000&q=80',
      languages: ['English', 'Spanish'],
      created_by: 'user_marcus',
      followers: ['user_sarah', 'user_emily'],
      status: 'verified',
      created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
    },
    {
      _id: 'church_grace',
      name: 'Grace City Fellowship',
      location: 'Nashville, TN',
      state: 'TN',
      city: 'Nashville',
      description: 'Where messy people meet a perfect God. We don\'t do religious performance — we do real life, real faith, real community.',
      service_times: 'Sun 10:00 AM & 6:00 PM',
      cover_image: 'https://images.unsplash.com/photo-1762013728525-4e093240ae7b?w=1000&q=80',
      languages: ['English'],
      created_by: 'user_sarah',
      followers: ['user_marcus', 'user_david'],
      status: 'approved',
      created_at: new Date(Date.now() - 19 * 24 * 3600 * 1000).toISOString()
    },
    {
      _id: 'church_gathering',
      name: 'The Gathering LA',
      location: 'Los Angeles, CA',
      state: 'CA',
      city: 'Los Angeles',
      description: 'A movement of young believers in the heart of LA. Worship. Discipleship. Justice. We exist to make Jesus famous in our city.',
      service_times: 'Sun 11:00 AM | Thu 7:30 PM',
      cover_image: 'https://images.unsplash.com/photo-1760367120244-8db5e65191a4?w=1000&q=80',
      languages: ['English', 'Korean'],
      created_by: 'user_david',
      followers: ['user_olivia', 'user_aiden'],
      status: 'approved',
      created_at: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString()
    }
  ];

  // Setup mutual followings
  db.users.forEach((u, idx) => {
    if (u._id !== 'user_admin') {
      const friends = db.users.filter(other => other._id !== u._id && other._id !== 'user_admin').slice(0, 3);
      friends.forEach(f => {
        u.followers.push(f._id);
        u.following.push(f._id);
      });
    }
  });

  // Post / Testimony Images
  const postImages = [
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80',
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&q=80',
    'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&q=80',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80'
  ];

  // Testimonies (from POSTS in seed_data.py)
  db.posts = [
    {
      _id: 'post_1',
      user_id: 'user_sarah',
      user_name: 'Sarah Mitchell',
      user_username: 'sarah.faith',
      user_image: 'https://images.unsplash.com/photo-1758598304332-94b40ce7c7b4?w=200&q=80',
      content_text: 'Three years ago today I was sitting in a hospital bed wondering if God even cared. Today I\'m leading worship for 300 people. He didn\'t just hear my prayer — He answered it beyond anything I imagined.',
      image_url: postImages[0],
      video_url: '',
      likes: ['user_marcus', 'user_emily', 'user_david'],
      comments: [
        {
          id: 'comment_1_1',
          user_id: 'user_marcus',
          user_name: 'Marcus Johnson',
          user_username: 'marcusjay',
          text: 'Incredible testimony, Sarah! God is so good!',
          created_at: new Date(Date.now() - 1.9 * 3600 * 1000).toISOString()
        }
      ],
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      _id: 'post_2',
      user_id: 'user_emily',
      user_name: 'Emily Rodriguez',
      user_username: 'em.restored',
      user_image: 'https://images.unsplash.com/photo-1758523672333-12a4099a60b0?w=200&q=80',
      content_text: 'I used to have panic attacks every single day. Couldn\'t leave my apartment. Couldn\'t hold a job. Then someone invited me to church and everything changed. Not overnight — but step by step, God walked me out of that darkness.',
      image_url: '',
      video_url: '',
      likes: ['user_sarah', 'user_jasmine'],
      comments: [
        {
          id: 'comment_2_1',
          user_id: 'user_jasmine',
          user_name: 'Jasmine Carter',
          user_username: 'jas.beloved',
          text: 'Thank you for sharing your heart Emily, this gives me so much hope today.',
          created_at: new Date(Date.now() - 7 * 3600 * 1000).toISOString()
        }
      ],
      created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
    },
    {
      _id: 'post_3',
      user_id: 'user_marcus',
      user_name: 'Marcus Johnson',
      user_username: 'marcusjay',
      user_image: 'https://images.unsplash.com/photo-1758874574397-e56dfcfc116d?w=200&q=80',
      content_text: 'Youth group tonight was WILD. 12 kids gave their lives to Jesus. I\'m literally crying typing this. God is moving in this generation and I\'m here for it.',
      image_url: postImages[3],
      video_url: '',
      likes: ['user_noah', 'user_olivia', 'user_david', 'user_aiden'],
      comments: [],
      created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
    }
  ];

  // Events from server.py
  db.events = [
    {
      _id: 'event_youth_night',
      title: 'Citywide Youth Revival',
      description: 'Join us for an unforgettable night of worship, dynamic teaching, and community as youth groups from across the city gather under one roof to seek God.',
      date: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0] + 'T19:00:00',
      location: 'Hillside Community Church (Main Sanctuary)',
      price: 0,
      cover_image: 'https://images.unsplash.com/photo-1760367120345-2b96c53de838?w=1000&q=80',
      church_id: 'church_hillside',
      church_name: 'Hillside Community Church',
      state: 'TX',
      city: 'Austin',
      languages: ['English'],
      created_by: 'user_marcus',
      created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    },
    {
      _id: 'event_worship_concert',
      title: 'Night of Worship & Prayer',
      description: 'An acoustic evening dedicated to seeking the Lord through song, scripture readings, and active intercessory prayer. Coffee and fellowship to follow.',
      date: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString().split('T')[0] + 'T18:30:00',
      location: 'Grace City Fellowship',
      price: 10,
      cover_image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1000&q=80',
      church_id: 'church_grace',
      church_name: 'Grace City Fellowship',
      state: 'TN',
      city: 'Nashville',
      languages: ['English'],
      created_by: 'user_sarah',
      created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()
    }
  ];

  db.event_registrations = [
    {
      id: 'reg_1',
      user_id: 'user_emily',
      event_id: 'event_youth_night',
      registered_at: new Date().toISOString()
    },
    {
      id: 'reg_2',
      user_id: 'user_david',
      event_id: 'event_youth_night',
      registered_at: new Date().toISOString()
    }
  ];

  // Merch / Products from Creator Shop
  db.products = [
    {
      _id: 'prod_bible_cover',
      title: 'Handcrafted Leather Bible Cover',
      description: 'Genuine full-grain leather cover meticulously stitched to protect your scriptures. Fits standard study Bibles. Features an embossed cross on the front.',
      price: 34.99,
      image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=500&q=80',
      created_by: 'user_noah',
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      _id: 'prod_prayer_journal',
      title: 'Daily Grace Prayer Journal',
      description: 'A 120-page linen-wrapped guided journal featuring daily scripture prompts, prayer requests sections, and gratitude tracking blocks.',
      price: 18.50,
      image: 'https://images.unsplash.com/photo-1758598302784-42d00ce2ba8f?w=500&q=80',
      created_by: 'user_sarah',
      created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
    }
  ];

  seedPrayers();
  seedTrivia();
  saveDb();
}

function seedTrivia() {
  try {
    const { INITIAL_TRIVIA } = require('./server_trivia_questions');
    db.trivia_questions = [];
    
    // Seed easy
    INITIAL_TRIVIA.easy.forEach((q, idx) => {
      db.trivia_questions.push({
        _id: `q_easy_${idx + 1}`,
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        difficulty: 'easy',
        created_at: new Date().toISOString()
      });
    });

    // Seed hard
    INITIAL_TRIVIA.hard.forEach((q, idx) => {
      db.trivia_questions.push({
        _id: `q_hard_${idx + 1}`,
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        difficulty: 'hard',
        created_at: new Date().toISOString()
      });
    });

    // Seed expert
    INITIAL_TRIVIA.expert.forEach((q, idx) => {
      db.trivia_questions.push({
        _id: `q_expert_${idx + 1}`,
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        difficulty: 'expert',
        created_at: new Date().toISOString()
      });
    });

    console.log(`Successfully seeded ${db.trivia_questions.length} trivia questions in server.`);
  } catch (err) {
    console.error('Failed to seed trivia questions:', err);
  }
}

function seedPrayers() {
  db.prayers = [
    {
      _id: 'prayer_1',
      user_id: 'user_sarah',
      user_name: 'Sarah Mitchell',
      user_username: 'sarah.faith',
      user_image: 'https://images.unsplash.com/photo-1758598304332-94b40ce7c7b4?w=200&q=80',
      category: 'Thanksgiving',
      title: 'Worship Night Praises & Unity',
      content: "Praise God! We are organizing a multi-church worship night next month! Please pray for unity among the youth groups, for the musicians, and above all, that many souls find comfort and salvation through Jesus Christ. May the Holy Spirit guide every lyric and moment.",
      praying_count: 5,
      prayers_users: ['user_marcus', 'user_emily', 'user_david'],
      comments: [
        {
          _id: 'comment_p1_1',
          user_id: 'user_marcus',
          user_name: 'Marcus Johnson',
          user_username: 'marcusjay',
          user_image: 'https://images.unsplash.com/photo-1758874574397-e56dfcfc116d?w=200&q=80',
          text: 'Amen! I will be there and am praying for a powerful evening of devotion. "Where two or three are gathered in my name..."',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ],
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      _id: 'prayer_2',
      user_id: 'user_emily',
      user_name: 'Emily Watson',
      user_username: 'emily.grace',
      user_image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
      category: 'Healing',
      title: 'Grandmother Heart Surgery Recovery',
      content: "My precious grandmother, Sarah Senior, is undergoing bypass surgery this Wednesday. She has been a pillar of prayer in our family for 50 years. Please stand with us for perfect execution by the surgical team, peace of mind for her, and a swift recovery. We know God is the Ultimate Physician!",
      praying_count: 7,
      prayers_users: ['user_sarah', 'user_marcus', 'user_aiden'],
      comments: [
        {
          _id: 'comment_p2_1',
          user_id: 'user_sarah',
          user_name: 'Sarah Mitchell',
          user_username: 'sarah.faith',
          user_image: 'https://images.unsplash.com/photo-1758598304332-94b40ce7c7b4?w=200&q=80',
          text: 'Lifting up grandmother Sarah Senior in prayer right now! Sending love and faith to your family.',
          created_at: new Date(Date.now() - 3600000 * 5).toISOString()
        }
      ],
      created_at: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      _id: 'prayer_3',
      user_id: 'user_marcus',
      user_name: 'Marcus Johnson',
      user_username: 'marcusjay',
      user_image: 'https://images.unsplash.com/photo-1758874574397-e56dfcfc116d?w=200&q=80',
      category: 'Guidance',
      title: 'Career & Calling Transition',
      content: "I am currently at a crossroads between staying in my current tech role or pursuing full-time ministry in media production. I want to walk in obedience to His call. Please pray for clarity, wisdom, and that I may trust Proverbs 3:5-6 with all my heart.",
      praying_count: 3,
      prayers_users: ['user_sarah', 'user_emily'],
      comments: [],
      created_at: new Date(Date.now() - 3600000 * 6).toISOString()
    }
  ];
}

// --- Authentication Middleware ---
// Works with both Supabase and legacy in-memory DB
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies.access_token || req.cookies.refresh_token;

  if (!token) {
    return res.status(401).json({ detail: 'Authentication token missing or invalid' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ detail: 'Invalid or expired session' });
    }

    let user;
    if (DB.isSupabase) {
      user = await db.users.findById(decoded.userId);
    } else {
      user = DB.users.find(u => u._id === decoded.userId);
    }

    if (!user) {
      return res.status(401).json({ detail: 'User account not found' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ detail: 'Your account registration was not approved.' });
    }
    req.user = user;
    next();
  });
}

// Optional Auth Middleware (doesn't fail if no token)
async function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies.access_token || req.cookies.refresh_token;

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (!err) {
      let user;
      if (DB.isSupabase) {
        user = await db.users.findById(decoded.userId);
      } else {
        user = DB.users.find(u => u._id === decoded.userId);
      }
      if (user && user.status !== 'rejected') {
        req.user = user;
      }
    }
    next();
  });
}

// Admin checking middleware
function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ detail: 'Admin access required' });
    }
  });
}

// Log admin action helper
async function logAdminAction(admin, actionType, targetType, targetId, description) {
  if (DB.isSupabase) {
    await db.adminLogs.create({
      admin_id: admin._id || admin.id,
      admin_name: admin.name,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      description,
    });
  } else {
    const log = {
      admin_id: admin._id,
      admin_name: admin.name,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      description: description,
      timestamp: new Date().toISOString()
    };
    DB.admin_logs.unshift(log);
    saveDbLegacy();
  }
}

// Helper to create notifications
async function createNotification(recipientId, senderId, senderName, senderImage, type, message, refId = '') {
  if (recipientId === senderId) return;
  if (DB.isSupabase) {
    await db.notifications.create({
      recipientId, senderId, senderName, senderImage, type, message, refId,
    });
  } else {
    const notif = {
      _id: 'notif_' + uuidv4(),
      recipient_id: recipientId,
      sender_id: senderId,
      sender_name: senderName,
      sender_image: senderImage || '',
      type: type,
      message: message,
      ref_id: refId,
      read: false,
      created_at: new Date().toISOString()
    };
    DB.notifications.unshift(notif);
    saveDbLegacy();
  }
}

// Helper to find user by ID (legacy or UUID)
async function findUser(id) {
  if (DB.isSupabase) {
    return await db.users.findById(id);
  }
  return DB.users.find(u => u._id === id);
}

// Helper to save DB (routes to correct backend)
async function saveDb() {
  if (DB.isSupabase) return; // Supabase handles its own persistence
  saveDbLegacy();
}

// --- API Endpoints ---

// Health Check
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- Google OAuth Config and Endpoints ---
const googleSessions = new Map();

const getRedirectUri = (req) => {
  let baseUrl = process.env.APP_URL;
  if (!baseUrl) {
    baseUrl = `${req.protocol}://${req.get('host')}`;
  }
  baseUrl = baseUrl.replace(/\/+$/, '');
  return `${baseUrl}/api/auth/google/callback`;
};

// Get Google login URL
app.get('/api/auth/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ detail: 'Google OAuth is not configured.' });
  }

  const redirectUri = getRedirectUri(req);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: authUrl });
});

// Google callback redirect (handles the incoming auth code from Google)
app.get(['/api/auth/google/callback', '/api/auth/google/callback/'], async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error('Google OAuth redirect error:', error);
    const frontendUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    return res.redirect(`${frontendUrl.replace(/\/+$/, '')}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.status(400).send('Authorization code is missing.');
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = getRedirectUri(req);

    if (!clientId || !clientSecret) {
      throw new Error('Google credentials are not configured.');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Failed to exchange authorization code: ${errText}`);
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    // Fetch user profile from Google
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userinfoResponse.ok) {
      throw new Error('Failed to fetch user info from Google.');
    }

    const googleUser = await userinfoResponse.json();
    const email = googleUser.email;
    const name = googleUser.name;
    const picture = googleUser.picture;

    if (!email) {
      throw new Error('Google account is missing an email address.');
    }

    const emailLower = email.toLowerCase();
    let user = db.users.find(u => u.email.toLowerCase() === emailLower);

    if (!user) {
      // Create a brand new user
      const generatedUsername = emailLower.split('@')[0].replace(/[^a-z0-9_]/g, '') + '_' + Math.floor(1000 + Math.random() * 9000);
      user = {
        _id: 'user_' + uuidv4(),
        email: emailLower,
        username: generatedUsername,
        password_hash: '', // No password for Google OAuth users
        name: name || 'Google User',
        bio: '',
        profile_image: picture || '',
        phone: '',
        role: emailLower === 'crosscraftedin@gmail.com' ? 'admin' : 'user',
        status: emailLower === 'crosscraftedin@gmail.com' ? 'active' : 'needs_onboarding', // Needs onboarding
        is_verified: emailLower === 'crosscraftedin@gmail.com' ? true : false,
        followers: [],
        following: [],
        saved_posts: [],
        state: '',
        city: '',
        languages: [],
        faith_belief: '',
        faith_journey: '',
        church_member: '',
        created_at: new Date().toISOString()
      };
      db.users.push(user);
      saveDb();
    } else if (emailLower === 'crosscraftedin@gmail.com') {
      // Ensure existing master admin user is configured correctly
      user.role = 'admin';
      user.status = 'active';
      user.is_verified = true;
      saveDb();
    }

    // Sign the JWT token — use UUID for new users
    const userId = DB.isSupabase ? user.id : user._id;
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

    // Generate a secure session ID
    const sessionId = uuidv4();

    // Store the session
    googleSessions.set(sessionId, {
      token,
      user
    });

    // Clean up session after 5 minutes to prevent memory leaks
    setTimeout(() => {
      googleSessions.delete(sessionId);
    }, 5 * 60 * 1000);

    // Redirect back to the frontend with the session_id in hash
    const frontendUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.redirect(`${frontendUrl.replace(/\/+$/, '')}/#session_id=${sessionId}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    const frontendUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.redirect(`${frontendUrl.replace(/\/+$/, '')}/login?error=${encodeURIComponent(err.message)}`);
  }
});

// Exchange session_id for user info and cookie
app.post('/api/auth/google/callback', (req, res) => {
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ detail: 'Session ID is required.' });
  }

  const session = googleSessions.get(session_id);
  if (!session) {
    return res.status(400).json({ detail: 'Session expired or invalid.' });
  }

  // Remove session from map to prevent reuse
  googleSessions.delete(session_id);

  // Set the cookie
  res.cookie('access_token', session.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 3600 * 1000
  });

  const { password_hash, ...safeUser } = session.user;
  res.json(safeUser);
});

// 1. Auth Me
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const { password_hash, ...safeUser } = req.user;
  res.json(safeUser);
});

// 2. Auth Register
app.post('/api/auth/register', (req, res) => {
  const { email, username, password, name, role, state, city, languages, faith_belief, faith_journey, church_member } = req.body;
  if (!email || !password || !username) {
    return res.status(400).json({ detail: 'Email, password, and username are required' });
  }

  const emailLower = email.toLowerCase();
  const usernameLower = username.toLowerCase();

  const existingEmail = db.users.find(u => u.email.toLowerCase() === emailLower);
  if (existingEmail) {
    return res.status(400).json({ detail: 'Email already registered' });
  }

  const existingUsername = DB.isSupabase ? await db.users.findByUsername(usernameLower) : DB.users.find(u => u.username.toLowerCase() === usernameLower);
  if (existingUsername) {
    return res.status(400).json({ detail: 'Username already taken' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = {
    _id: 'user_' + uuidv4(),
    email: emailLower,
    username: usernameLower,
    password_hash: passwordHash,
    name,
    bio: '',
    profile_image: '',
    phone: '',
    role: emailLower === 'crosscraftedin@gmail.com' ? 'admin' : (role || 'user'),
    status: 'active', // Seamless sandbox experience
    is_verified: emailLower === 'crosscraftedin@gmail.com' ? true : false,
    followers: [],
    following: [],
    saved_posts: [],
    state: state || '',
    city: city || '',
    languages: languages || [],
    faith_belief: faith_belief || '',
    faith_journey: faith_journey || '',
    church_member: church_member || '',
    created_at: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDb();

  const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('access_token', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 3600 * 1000 });
  
  const { password_hash, ...safeUser } = newUser;
  res.json(safeUser);
});

// 3. Auth Login
app.post('/api/auth/login', authLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password are required' });
  }

  const user = DB.isSupabase ? await db.users.findByEmail(email.toLowerCase()) : DB.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(400).json({ detail: 'Incorrect email or password' });
  }

  if (user.status === 'rejected') {
    return res.status(403).json({ detail: 'Your account registration was not approved.' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(400).json({ detail: 'Incorrect email or password' });
  }

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie('access_token', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 3600 * 1000 });

  const { password_hash, ...safeUser } = user;
  res.json(safeUser);
});

// 4. Auth Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('access_token');
  res.json({ message: 'Logged out successfully' });
});

// 5. Auth Onboarding
app.post('/api/auth/onboarding', authenticateToken, async (req, res) => {
  const user = await findUser(req.user._id);

  if (user) {
    // Dynamic copy of all properties sent from onboarding
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        user[key] = req.body[key];
      }
    });
    user.status = 'active';
    await db.users.update(user._id || user.id, {
      ...req.body,
      status: 'active',
    });
    const { password_hash, ...safeUser } = user;
    res.json(safeUser);
  } else {
    res.status(404).json({ detail: 'User not found' });
  }
});

// 6. Forgot and Reset Password (Mock)
app.post('/api/auth/forgot-password', authLimiter, (req, res) => {
  res.json({ message: 'Reset instructions sent to email.' });
});
app.post('/api/auth/reset-password', authLimiter, (req, res) => {
  res.json({ message: 'Password reset successfully.' });
});

// --- Testimonies / Posts API ---
async function enrichPost(post, currentUserId) {
  let author;
  if (DB.isSupabase) {
    author = await db.users.findById(post.user_id);
  } else {
    author = DB.users.find(u => u._id === post.user_id);
  }
  return {
    ...post,
    user_name: author ? author.name : post.user_name,
    user_username: author ? author.username : post.user_username,
    user_image: author ? author.profile_image : post.user_image,
    is_verified: author ? author.is_verified : false,
    likes_count: (post.likes || []).length,
    comments_count: (post.comments || []).length,
    is_liked: currentUserId ? (post.likes || []).includes(currentUserId) : false,
    is_saved: currentUserId ? (await reqUserSavedPosts(currentUserId)).includes(post._id) : false
  };
}

async function reqUserSavedPosts(userId) {
  if (DB.isSupabase) {
    const user = await db.users.findById(userId);
    return user ? user.saved_posts || [] : [];
  }
  const u = DB.users.find(x => x._id === userId);
  return u ? u.saved_posts || [] : [];
}

// GET Testimonies & Posts
app.get('/api/testimonies', optionalAuthenticateToken, (req, res) => {
  const currentUserId = req.user ? req.user._id : null;
  const enriched = db.posts.map(p => enrichPost(p, currentUserId));
  enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(enriched);
});

app.get('/api/posts', optionalAuthenticateToken, (req, res) => {
  const currentUserId = req.user ? req.user._id : null;
  const enriched = db.posts.map(p => enrichPost(p, currentUserId));
  enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(enriched);
});

// POST Testimonies & Posts
app.post('/api/testimonies', authenticateToken, (req, res) => {
  const { content_text, image_url, video_url } = req.body;
  if (!content_text) {
    return res.status(400).json({ detail: 'Content text is required' });
  }

  const newPost = {
    _id: 'post_' + uuidv4(),
    user_id: req.user._id,
    user_name: req.user.name,
    user_username: req.user.username,
    user_image: req.user.profile_image || '',
    content_text,
    image_url: image_url || '',
    video_url: video_url || '',
    likes: [],
    comments: [],
    created_at: new Date().toISOString()
  };

  db.posts.unshift(newPost);
  saveDb();

  res.status(201).json(enrichPost(newPost, req.user._id));
});

app.post('/api/posts', authenticateToken, (req, res) => {
  const { content_text, image_url, video_url } = req.body;
  if (!content_text) {
    return res.status(400).json({ detail: 'Content text is required' });
  }

  const newPost = {
    _id: 'post_' + uuidv4(),
    user_id: req.user._id,
    user_name: req.user.name,
    user_username: req.user.username,
    user_image: req.user.profile_image || '',
    content_text,
    image_url: image_url || '',
    video_url: video_url || '',
    likes: [],
    comments: [],
    created_at: new Date().toISOString()
  };

  db.posts.unshift(newPost);
  saveDb();

  res.status(201).json(enrichPost(newPost, req.user._id));
});

// LIKE Testimony / Post Toggle
app.post('/api/testimonies/:post_id/like', authenticateToken, (req, res) => {
  const post = db.posts.find(p => p._id === req.params.post_id);
  if (!post) return res.status(404).json({ detail: 'Post not found' });

  if (!post.likes) post.likes = [];
  const idx = post.likes.indexOf(req.user._id);
  if (idx > -1) {
    post.likes.splice(idx, 1);
  } else {
    post.likes.push(req.user._id);
    createNotification(post.user_id, req.user._id, req.user.name, req.user.profile_image, 'like', `${req.user.name} liked your testimony`, post._id);
  }
  saveDb();
  res.json(enrichPost(post, req.user._id));
});

app.post('/api/posts/:post_id/like', authenticateToken, (req, res) => {
  const post = db.posts.find(p => p._id === req.params.post_id);
  if (!post) return res.status(404).json({ detail: 'Post not found' });

  if (!post.likes) post.likes = [];
  const idx = post.likes.indexOf(req.user._id);
  if (idx > -1) {
    post.likes.splice(idx, 1);
  } else {
    post.likes.push(req.user._id);
    createNotification(post.user_id, req.user._id, req.user.name, req.user.profile_image, 'like', `${req.user.name} liked your post`, post._id);
  }
  saveDb();
  res.json(enrichPost(post, req.user._id));
});

// ADD Comment
app.post('/api/testimonies/:post_id/comments', authenticateToken, (req, res) => {
  const post = db.posts.find(p => p._id === req.params.post_id);
  if (!post) return res.status(404).json({ detail: 'Post not found' });

  const text = req.body.text || req.body.content;
  if (!text) return res.status(400).json({ detail: 'Comment text is required' });

  const comment = {
    id: 'comment_' + uuidv4(),
    user_id: req.user._id,
    user_name: req.user.name,
    user_username: req.user.username,
    user_image: req.user.profile_image || '',
    text: text,
    created_at: new Date().toISOString()
  };

  if (!post.comments) post.comments = [];
  post.comments.push(comment);
  saveDb();

  createNotification(post.user_id, req.user._id, req.user.name, req.user.profile_image, 'comment', `${req.user.name} commented on your testimony`, post._id);

  res.status(201).json(comment);
});

app.post('/api/posts/:post_id/comments', authenticateToken, (req, res) => {
  const post = db.posts.find(p => p._id === req.params.post_id);
  if (!post) return res.status(404).json({ detail: 'Post not found' });

  const text = req.body.text || req.body.content;
  if (!text) return res.status(400).json({ detail: 'Comment text is required' });

  const comment = {
    id: 'comment_' + uuidv4(),
    user_id: req.user._id,
    user_name: req.user.name,
    user_username: req.user.username,
    user_image: req.user.profile_image || '',
    text: text,
    created_at: new Date().toISOString()
  };

  if (!post.comments) post.comments = [];
  post.comments.push(comment);
  saveDb();

  createNotification(post.user_id, req.user._id, req.user.name, req.user.profile_image, 'comment', `${req.user.name} commented on your post`, post._id);

  res.status(201).json(comment);
});

// DELETE Comment
app.delete('/api/testimonies/:post_id/comments/:comment_id', authenticateToken, (req, res) => {
  const post = db.posts.find(p => p._id === req.params.post_id);
  if (!post) return res.status(404).json({ detail: 'Post not found' });

  const commentIdx = (post.comments || []).findIndex(c => c.id === req.params.comment_id);
  if (commentIdx === -1) return res.status(404).json({ detail: 'Comment not found' });

  const comment = post.comments[commentIdx];
  if (comment.user_id !== req.user._id && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Not authorized to delete this comment' });
  }

  post.comments.splice(commentIdx, 1);
  saveDb();
  res.json({ message: 'Comment deleted successfully' });
});

app.delete('/api/posts/:post_id/comments/:comment_id', authenticateToken, (req, res) => {
  const post = db.posts.find(p => p._id === req.params.post_id);
  if (!post) return res.status(404).json({ detail: 'Post not found' });

  const commentIdx = (post.comments || []).findIndex(c => c.id === req.params.comment_id);
  if (commentIdx === -1) return res.status(404).json({ detail: 'Comment not found' });

  const comment = post.comments[commentIdx];
  if (comment.user_id !== req.user._id && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Not authorized to delete this comment' });
  }

  post.comments.splice(commentIdx, 1);
  saveDb();
  res.json({ message: 'Comment deleted successfully' });
});

// SAVE/UNSAVE POST
app.post('/api/posts/:post_id/save', authenticateToken, (req, res) => {
  const user = db.users.find(u => u._id === req.user._id);
  if (!user.saved_posts) user.saved_posts = [];
  if (!user.saved_posts.includes(req.params.post_id)) {
    user.saved_posts.push(req.params.post_id);
    saveDb();
  }
  res.json({ message: 'Post saved' });
});

app.delete('/api/posts/:post_id/save', authenticateToken, (req, res) => {
  const user = db.users.find(u => u._id === req.user._id);
  if (user.saved_posts) {
    const idx = user.saved_posts.indexOf(req.params.post_id);
    if (idx > -1) {
      user.saved_posts.splice(idx, 1);
      saveDb();
    }
  }
  res.json({ message: 'Post unsaved' });
});

// --- Churches API ---
app.get('/api/churches', optionalAuthenticateToken, (req, res) => {
  const { state, language, search } = req.query;
  let results = [...db.churches];

  if (state) {
    results = results.filter(c => c.state && c.state.toLowerCase() === state.toLowerCase());
  }
  if (language) {
    results = results.filter(c => c.languages && c.languages.map(l => l.toLowerCase()).includes(language.toLowerCase()));
  }
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(c => 
      c.name.toLowerCase().includes(s) || 
      (c.city && c.city.toLowerCase().includes(s)) ||
      (c.description && c.description.toLowerCase().includes(s))
    );
  }

  const currentUserId = req.user ? req.user._id : null;
  const mapped = results.map(c => ({
    ...c,
    followers_count: (c.followers || []).length,
    is_following: currentUserId ? (c.followers || []).includes(currentUserId) : false
  }));

  res.json(mapped);
});

app.post('/api/churches', authenticateToken, (req, res) => {
  const { name, location, description, service_times, cover_image, state, city, languages } = req.body;
  if (!name || !location) {
    return res.status(400).json({ detail: 'Name and location are required' });
  }

  const newChurch = {
    _id: 'church_' + uuidv4(),
    name,
    location,
    state: state || '',
    city: city || '',
    description: description || '',
    service_times: service_times || '',
    cover_image: cover_image || 'https://images.unsplash.com/photo-1760367120345-35a4bbadf3cf?w=1000&q=80',
    languages: languages || [],
    created_by: req.user._id,
    followers: [],
    status: 'approved',
    created_at: new Date().toISOString()
  };

  db.churches.push(newChurch);
  saveDb();
  res.status(201).json(newChurch);
});

app.get('/api/churches/:church_id', optionalAuthenticateToken, (req, res) => {
  const church = db.churches.find(c => c._id === req.params.church_id);
  if (!church) return res.status(404).json({ detail: 'Church not found' });

  const currentUserId = req.user ? req.user._id : null;
  const owner = db.users.find(u => u._id === church.created_by);
  
  const postsCount = db.posts.filter(p => p.user_id === church.created_by).length;
  const eventsCount = db.events.filter(e => e.church_id === church._id || e.created_by === church.created_by).length;

  const result = {
    ...church,
    followers_count: (church.followers || []).length,
    is_following: currentUserId ? (church.followers || []).includes(currentUserId) : false,
    is_owner: currentUserId ? church.created_by === currentUserId : false,
    owner_name: owner ? owner.name : '',
    owner_username: owner ? owner.username : '',
    posts_count: postsCount,
    events_count: eventsCount
  };

  res.json(result);
});

app.put('/api/churches/:church_id', authenticateToken, (req, res) => {
  const church = db.churches.find(c => c._id === req.params.church_id);
  if (!church) return res.status(404).json({ detail: 'Church not found' });

  if (church.created_by !== req.user._id && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Not authorized' });
  }

  const { name, description, location, service_times, cover_image, state, city, languages } = req.body;
  if (name !== undefined) church.name = name;
  if (description !== undefined) church.description = description;
  if (location !== undefined) church.location = location;
  if (service_times !== undefined) church.service_times = service_times;
  if (cover_image !== undefined) church.cover_image = cover_image;
  if (state !== undefined) church.state = state;
  if (city !== undefined) church.city = city;
  if (languages !== undefined) church.languages = languages;

  saveDb();
  res.json(church);
});

app.get('/api/churches/:church_id/posts', (req, res) => {
  const church = db.churches.find(c => c._id === req.params.church_id);
  if (!church) return res.status(404).json({ detail: 'Church not found' });

  const posts = db.posts.filter(p => p.user_id === church.created_by);
  posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(posts.map(p => enrichPost(p, null)));
});

app.get('/api/churches/:church_id/events', optionalAuthenticateToken, (req, res) => {
  const church = db.churches.find(c => c._id === req.params.church_id);
  if (!church) return res.status(404).json({ detail: 'Church not found' });

  const currentUserId = req.user ? req.user._id : null;
  const events = db.events.filter(e => e.church_id === church._id || e.created_by === church.created_by);
  
  const mapped = events.map(e => {
    const attendeesCount = db.event_registrations.filter(r => r.event_id === e._id).length;
    const isRegistered = currentUserId ? db.event_registrations.some(r => r.event_id === e._id && r.user_id === currentUserId) : false;
    return { ...e, attendees_count: attendeesCount, is_registered: isRegistered };
  });

  res.json(mapped);
});

app.post('/api/churches/:church_id/follow', authenticateToken, (req, res) => {
  const church = db.churches.find(c => c._id === req.params.church_id);
  if (!church) return res.status(404).json({ detail: 'Church not found' });

  if (!church.followers) church.followers = [];
  if (!church.followers.includes(req.user._id)) {
    church.followers.push(req.user._id);
    saveDb();
  }
  res.json({ message: 'Followed' });
});

app.delete('/api/churches/:church_id/follow', authenticateToken, (req, res) => {
  const church = db.churches.find(c => c._id === req.params.church_id);
  if (!church) return res.status(404).json({ detail: 'Church not found' });

  if (church.followers) {
    const idx = church.followers.indexOf(req.user._id);
    if (idx > -1) {
      church.followers.splice(idx, 1);
      saveDb();
    }
  }
  res.json({ message: 'Unfollowed' });
});

app.get('/api/users/me/church', authenticateToken, (req, res) => {
  const church = db.churches.find(c => c.created_by === req.user._id);
  if (!church) return res.json({ church: null });
  res.json({
    ...church,
    followers_count: (church.followers || []).length
  });
});

// --- Events API ---
app.post('/api/events', authenticateToken, (req, res) => {
  const { title, description, date, location, price, cover_image, church_id, state, city, languages } = req.body;
  if (!title || !date || !location) {
    return res.status(400).json({ detail: 'Title, date, and location are required' });
  }

  const newEvent = {
    _id: 'event_' + uuidv4(),
    title,
    description: description || '',
    date,
    location,
    price: price || 0,
    cover_image: cover_image || 'https://images.unsplash.com/photo-1760367120345-35a4bbadf3cf?w=1000&q=80',
    church_id: church_id || '',
    state: state || '',
    city: city || '',
    languages: languages || [],
    created_by: req.user._id,
    created_at: new Date().toISOString()
  };

  if (church_id) {
    const ch = db.churches.find(c => c._id === church_id);
    if (ch) newEvent.church_name = ch.name;
  }

  db.events.push(newEvent);
  saveDb();
  res.status(201).json(newEvent);
});

app.get('/api/events', optionalAuthenticateToken, (req, res) => {
  const { state, language, search } = req.query;
  let results = [...db.events];

  if (state) {
    results = results.filter(e => e.state && e.state.toLowerCase() === state.toLowerCase());
  }
  if (language) {
    results = results.filter(e => e.languages && e.languages.map(l => l.toLowerCase()).includes(language.toLowerCase()));
  }
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(e => 
      e.title.toLowerCase().includes(s) || 
      e.location.toLowerCase().includes(s) ||
      (e.description && e.description.toLowerCase().includes(s))
    );
  }

  const currentUserId = req.user ? req.user._id : null;
  const mapped = results.map(e => {
    const attendeesCount = db.event_registrations.filter(r => r.event_id === e._id).length;
    const isRegistered = currentUserId ? db.event_registrations.some(r => r.event_id === e._id && r.user_id === currentUserId) : false;
    
    let churchName = e.church_name || '';
    if (e.church_id && !churchName) {
      const ch = db.churches.find(c => c._id === e.church_id);
      if (ch) churchName = ch.name;
    }

    const creator = db.users.find(u => u._id === e.created_by);

    return {
      ...e,
      attendees_count: attendeesCount,
      is_registered: isRegistered,
      church_name: churchName,
      creator_name: creator ? creator.name : ''
    };
  });

  res.json(mapped);
});

app.get('/api/events/:event_id', optionalAuthenticateToken, (req, res) => {
  const event = db.events.find(e => e._id === req.params.event_id);
  if (!event) return res.status(404).json({ detail: 'Event not found' });

  const currentUserId = req.user ? req.user._id : null;
  const attendeesCount = db.event_registrations.filter(r => r.event_id === event._id).length;
  const isRegistered = currentUserId ? db.event_registrations.some(r => r.event_id === event._id && r.user_id === currentUserId) : false;
  const isCreator = currentUserId ? event.created_by === currentUserId : false;

  let churchName = event.church_name || '';
  let churchObjId = '';
  if (event.church_id) {
    const ch = db.churches.find(c => c._id === event.church_id);
    if (ch) {
      churchName = ch.name;
      churchObjId = ch._id;
    }
  }

  const creator = db.users.find(u => u._id === event.created_by);

  // Registrant previews (first 10)
  const regs = db.event_registrations.filter(r => r.event_id === event._id).slice(0, 10);
  const attendeePreviews = regs.map(r => {
    const u = db.users.find(user => user._id === r.user_id);
    return u ? { _id: u._id, name: u.name, username: u.username, profile_image: u.profile_image } : null;
  }).filter(Boolean);

  res.json({
    ...event,
    attendees_count: attendeesCount,
    is_registered: isRegistered,
    is_creator: isCreator,
    church_name: churchName,
    church_obj_id: churchObjId,
    creator_name: creator ? creator.name : '',
    creator_username: creator ? creator.username : '',
    attendee_previews: attendeePreviews
  });
});

app.post('/api/events/:event_id/register', authenticateToken, (req, res) => {
  const event = db.events.find(e => e._id === req.params.event_id);
  if (!event) return res.status(404).json({ detail: 'Event not found' });

  const existing = db.event_registrations.find(r => r.event_id === req.params.event_id && r.user_id === req.user._id);
  if (existing) {
    return res.status(400).json({ detail: 'Already registered' });
  }

  db.event_registrations.push({
    id: 'reg_' + uuidv4(),
    user_id: req.user._id,
    event_id: req.params.event_id,
    registered_at: new Date().toISOString()
  });
  saveDb();

  res.json({ message: 'Registration successful' });
});

app.delete('/api/events/:event_id/register', authenticateToken, (req, res) => {
  const idx = db.event_registrations.findIndex(r => r.event_id === req.params.event_id && r.user_id === req.user._id);
  if (idx === -1) {
    return res.status(404).json({ detail: 'Registration not found' });
  }

  db.event_registrations.splice(idx, 1);
  saveDb();
  res.json({ message: 'Unregistered successfully' });
});

app.get('/api/events/:event_id/attendees', (req, res) => {
  const regs = db.event_registrations.filter(r => r.event_id === req.params.event_id);
  const list = regs.map(r => {
    const u = db.users.find(user => user._id === r.user_id);
    return u ? { _id: u._id, name: u.name, username: u.username, profile_image: u.profile_image } : null;
  }).filter(Boolean);
  res.json(list);
});

app.get('/api/events/:event_id/registrations', authenticateToken, (req, res) => {
  const event = db.events.find(e => e._id === req.params.event_id);
  if (!event) return res.status(404).json({ detail: 'Event not found' });

  if (event.created_by !== req.user._id && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Not authorized' });
  }

  const regs = db.event_registrations.filter(r => r.event_id === req.params.event_id);
  const result = regs.map(r => {
    const u = db.users.find(user => user._id === r.user_id);
    return u ? { ...r, user: { _id: u._id, name: u.name, email: u.email, username: u.username } } : null;
  }).filter(Boolean);

  res.json(result);
});

// --- File Upload APIs ---
// Task 2: Supabase Storage integration for file uploads
app.post('/api/upload', uploadLimiter, upload.single('file'), async (req, res) => {
  if (DB.isSupabase && process.env.SUPABASE_URL) {
    try {
      const { v4: uuidv4 } = require('uuid');
      const { createClient } = require('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const bucket = req.body.bucket || 'posts';
      const ext = req.file.originalname?.split('.').pop() || 'jpg';
      const filePath = `${req.body.userId || 'anon'}/${uuidv4()}.${ext}`;
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
      if (error) throw error;
      const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
      return res.json({ url: urlData.publicUrl, path: urlData.publicUrl });
    } catch (uploadErr) {
      console.error('[Upload] Supabase storage failed, using fallback:', uploadErr.message);
    }
  }
  // Fallback: return a mock Unsplash URL
  const images = [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=80',
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80',
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=500&q=80',
    'https://images.unsplash.com/photo-1758598302784-42d00ce2ba8f?w=500&q=80',
  ];
  const randomImage = images[Math.floor(Math.random() * images.length)];
  res.json({ url: randomImage, path: randomImage });
});

app.post('/api/upload/init', uploadLimiter, (req, res) => {
  res.json({ upload_id: 'mock_upload_' + uuidv4() });
});

app.post('/api/upload/chunk/:upload_id', uploadLimiter, (req, res) => {
  res.json({ status: 'chunk_received' });
});

app.post('/api/upload/finalize/:upload_id', uploadLimiter, async (req, res) => {
  if (DB.isSupabase && process.env.SUPABASE_URL) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      // For chunked uploads, the final step would reassemble chunks
      // For now, return the path that was provided
      const path = req.body.path || '';
      if (path) {
        const bucket = req.body.bucket || 'posts';
        const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
        return res.json({ url: urlData.publicUrl, path: urlData.publicUrl, thumbnail_url: urlData.publicUrl });
      }
    } catch (uploadErr) {
      console.error('[Upload] Supabase finalize failed:', uploadErr.message);
    }
  const images = [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
  ];
  const randomImage = images[Math.floor(Math.random() * images.length)];
  res.json({ url: randomImage, path: randomImage, thumbnail_url: randomImage });
});

// --- Creator Shop Products API ---
app.post('/api/products', authenticateToken, (req, res) => {
  const { title, description, price, image, images } = req.body;
  if (!title || price === undefined) {
    return res.status(400).json({ detail: 'Title and price are required' });
  }

  
  const newProduct = {
    _id: 'prod_' + uuidv4(),
    seller_id: req.user._id,
    created_by: req.user._id,
    seller_name: req.user.name,
    seller_username: req.user.username,
    seller_image: req.user.profile_image || '',
    title,
    description,
    price: Number(price),
    image: image || null,
    category: req.body.category || 'Other',
    condition: req.body.condition || 'Good',
    city: req.body.city || '',
    created_at: new Date().toISOString()
  };


  db.products.push(newProduct);
  saveDb();
  res.status(201).json(newProduct);
});

app.get('/api/products', (req, res) => {
  const { search } = req.query;
  let results = [...db.products];

  if (search) {
    const s = search.toLowerCase();
    results = results.filter(p => p.title.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s)));
  }

  const mapped = results.map(p => {
    const creator = db.users.find(u => u._id === p.created_by);
    return {
      ...p,
      seller_id: p.created_by,
      seller_name: creator ? creator.name : '',
      seller_username: creator ? creator.username : '',
      seller_image: creator ? creator.profile_image : ''
    };
  });

  res.json(mapped);
});

app.get('/api/products/:product_id', optionalAuthenticateToken, (req, res) => {
  const prod = db.products.find(p => p._id === req.params.product_id);
  if (!prod) return res.status(404).json({ detail: 'Product not found' });

  const currentUserId = req.user ? req.user._id : null;
  const creator = db.users.find(u => u._id === prod.created_by);

  res.json({
    ...prod,
    seller_id: prod.created_by,
    seller_name: creator ? creator.name : '',
    seller_username: creator ? creator.username : '',
    seller_image: creator ? creator.profile_image : '',
    seller_bio: creator ? creator.bio : '',
    seller_email: creator ? creator.email : '',
    is_owner: currentUserId ? prod.created_by === currentUserId : false,
    is_admin: req.user ? req.user.role === 'admin' : false
  });
});

app.get('/api/users/:user_id/products', (req, res) => {
  const list = db.products.filter(p => p.created_by === req.params.user_id);
  res.json(list);
});

app.put('/api/products/:product_id', authenticateToken, (req, res) => {
  const prod = db.products.find(p => p._id === req.params.product_id);
  if (!prod) return res.status(404).json({ detail: 'Product not found' });

  if (prod.created_by !== req.user._id && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Not authorized' });
  }

  const { title, description, price, image, images } = req.body;
  if (title !== undefined) prod.title = title;
  if (description !== undefined) prod.description = description;
  if (price !== undefined) prod.price = Number(price);
  if (images !== undefined) {
    prod.images = Array.isArray(images) ? images : [];
    prod.image = prod.images.length > 0 ? prod.images[0] : '';
  } else if (image !== undefined) {
    prod.image = image;
    prod.images = [image];
  }

  saveDb();
  res.json({ message: 'Product updated', product: prod });
});

app.delete('/api/products/:product_id', authenticateToken, (req, res) => {
  const idx = db.products.findIndex(p => p._id === req.params.product_id);
  if (idx === -1) return res.status(404).json({ detail: 'Product not found' });

  const prod = db.products[idx];
  if (prod.created_by !== req.user._id && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Not authorized' });
  }

  db.products.splice(idx, 1);
  saveDb();
  res.json({ message: 'Product deleted' });
});

// --- User Profile Endpoints ---
app.get('/api/users/:user_id', optionalAuthenticateToken, (req, res) => {
  const user = db.users.find(u => u._id === req.params.user_id);
  if (!user) return res.status(404).json({ detail: 'User not found' });

  const currentUserId = req.user ? req.user._id : null;
  const postsCount = db.posts.filter(p => p.user_id === user._id).length;

  const isBlocked = req.user ? (req.user.blocked_users || []).includes(user._id) : false;
  const hasBlockedMe = req.user ? (user.blocked_users || []).includes(req.user._id) : false;
  const allowDms = user.allow_dms !== false;

  res.json({
    _id: user._id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    profile_image: user.profile_image,
    role: user.role,
    is_verified: user.is_verified,
    followers_count: (user.followers || []).length,
    following_count: (user.following || []).length,
    is_following: currentUserId ? (user.followers || []).includes(currentUserId) : false,
    posts_count: postsCount,
    created_at: user.created_at,
    badges: getUserBadges(user),
    safe_intro_completed: hasCompletedSafeIntro(user),
    trivia_points: user.trivia_points || 0,
    trivia_stats: user.trivia_stats || { easyCompleted: 0, hardCompleted: 0, expertCompleted: 0, totalCorrect: 0, totalAttempted: 0 },
    is_blocked: isBlocked,
    has_blocked_me: hasBlockedMe,
    allow_dms: allowDms
  });
});

app.get('/api/users/:user_id/posts', optionalAuthenticateToken, (req, res) => {
  const posts = db.posts.filter(p => p.user_id === req.params.user_id);
  posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const currentUserId = req.user ? req.user._id : null;
  res.json(posts.map(p => enrichPost(p, currentUserId)));
});

app.get('/api/users/:user_id/saved', authenticateToken, (req, res) => {
  if (req.params.user_id !== req.user._id) {
    return res.status(403).json({ detail: 'Can only view your own saved posts' });
  }

  const savedIds = req.user.saved_posts || [];
  const posts = db.posts.filter(p => savedIds.includes(p._id));
  posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(posts.map(p => enrichPost(p, req.user._id)));
});

app.get('/api/users/:user_id/events', (req, res) => {
  const userId = req.params.user_id;
  const created = db.events.filter(e => e.created_by === userId).map(e => ({
    ...e,
    type: 'created',
    attendees_count: db.event_registrations.filter(r => r.event_id === e._id).length
  }));

  const registeredIds = db.event_registrations.filter(r => r.user_id === userId).map(r => r.event_id);
  const attending = db.events.filter(e => registeredIds.includes(e._id)).map(e => ({
    ...e,
    type: 'attending',
    attendees_count: db.event_registrations.filter(r => r.event_id === e._id).length
  }));

  res.json({ created, attending });
});

app.put('/api/users/me', authenticateToken, async (req, res) => {
  const user = await findUser(req.user._id);
  if (!user) return res.status(404).json({ detail: 'User not found' });

  const { name, bio, profile_image, state, city, languages, faith_belief, faith_journey, church_member, allow_dms } = req.body;
  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (profile_image !== undefined) user.profile_image = profile_image;
  if (state !== undefined) user.state = state;
  if (city !== undefined) user.city = city;
  if (languages !== undefined) user.languages = languages;
  if (faith_belief !== undefined) user.faith_belief = faith_belief;
  if (faith_journey !== undefined) user.faith_journey = faith_journey;
  if (church_member !== undefined) user.church_member = church_member;
  if (allow_dms !== undefined) user.allow_dms = !!allow_dms;

  if (DB.isSupabase) {
    await db.users.update(user._id || user.id, updates);
  } else {
    Object.keys(updates).forEach(k => { user[k] = updates[k]; });
    saveDbLegacy();
  }
  const { password_hash, ...safeUser } = user;
  res.json(safeUser);
});

// Follow / Unfollow User
app.post('/api/users/:user_id/follow', authenticateToken, (req, res) => {
  if (req.user._id === req.params.user_id) {
    return res.status(400).json({ detail: 'Cannot follow yourself' });
  }

  const target = db.users.find(u => u._id === req.params.user_id);
  if (!target) return res.status(404).json({ detail: 'User not found' });

  if (!req.user.following) req.user.following = [];
  if (!target.followers) target.followers = [];

  if (!req.user.following.includes(target._id)) req.user.following.push(target._id);
  if (!target.followers.includes(req.user._id)) target.followers.push(req.user._id);

  saveDb();

  createNotification(target._id, req.user._id, req.user.name, req.user.profile_image, 'follow', `${req.user.name} started following you`, req.user._id);

  res.json({ message: 'Followed successfully' });
});

app.delete('/api/users/:user_id/follow', authenticateToken, (req, res) => {
  const target = db.users.find(u => u._id === req.params.user_id);
  if (!target) return res.status(404).json({ detail: 'User not found' });

  if (req.user.following) {
    const idx = req.user.following.indexOf(target._id);
    if (idx > -1) req.user.following.splice(idx, 1);
  }
  if (target.followers) {
    const idx = target.followers.indexOf(req.user._id);
    if (idx > -1) target.followers.splice(idx, 1);
  }

  saveDb();
  res.json({ message: 'Unfollowed successfully' });
});

// --- Block / Unblock & Report Endpoints ---

// Block User
app.post('/api/users/:user_id/block', authenticateToken, (req, res) => {
  if (req.user._id === req.params.user_id) {
    return res.status(400).json({ detail: 'Cannot block yourself' });
  }

  const target = db.users.find(u => u._id === req.params.user_id);
  if (!target) return res.status(404).json({ detail: 'User not found' });

  if (!req.user.blocked_users) req.user.blocked_users = [];
  if (!req.user.blocked_users.includes(target._id)) {
    req.user.blocked_users.push(target._id);
  }

  // Auto unfollow when blocking
  if (req.user.following) {
    const idx = req.user.following.indexOf(target._id);
    if (idx > -1) req.user.following.splice(idx, 1);
  }
  if (target.followers) {
    const idx = target.followers.indexOf(req.user._id);
    if (idx > -1) target.followers.splice(idx, 1);
  }
  if (req.user.followers) {
    const idx = req.user.followers.indexOf(target._id);
    if (idx > -1) req.user.followers.splice(idx, 1);
  }
  if (target.following) {
    const idx = target.following.indexOf(req.user._id);
    if (idx > -1) target.following.splice(idx, 1);
  }

  saveDb();
  res.json({ message: 'User blocked successfully', blocked_users: req.user.blocked_users });
});

// Unblock User
app.post('/api/users/:user_id/unblock', authenticateToken, (req, res) => {
  if (!req.user.blocked_users) req.user.blocked_users = [];
  const idx = req.user.blocked_users.indexOf(req.params.user_id);
  if (idx > -1) {
    req.user.blocked_users.splice(idx, 1);
  }
  saveDb();
  res.json({ message: 'User unblocked successfully', blocked_users: req.user.blocked_users });
});

// Submit a Safety Report
app.post('/api/reports', authenticateToken, (req, res) => {
  const { target_type, target_id, reason, details } = req.body;
  if (!target_type || !target_id || !reason) {
    return res.status(400).json({ detail: 'Missing required report fields' });
  }

  let targetName = 'Unknown Target';
  if (target_type === 'user') {
    const tUser = db.users.find(u => u._id === target_id);
    if (tUser) targetName = tUser.name;
  } else if (target_type === 'post') {
    const tPost = db.posts.find(p => p._id === target_id);
    if (tPost) targetName = `Post by: ${tPost.user_name || tPost.user_id}`;
  } else if (target_type === 'prayer') {
    const tPrayer = db.prayers.find(p => p._id === target_id);
    if (tPrayer) targetName = `Prayer Request: ${tPrayer.title}`;
  } else {
    targetName = `${target_type} ID: ${target_id}`;
  }

  const newReport = {
    _id: 'report_' + uuidv4(),
    reporter_id: req.user._id,
    reporter_name: req.user.name,
    target_type,
    target_id,
    target_name: targetName,
    reason,
    details: details || '',
    status: 'pending', // 'pending', 'resolved', 'dismissed'
    created_at: new Date().toISOString()
  };

  if (!db.reports) db.reports = [];
  db.reports.unshift(newReport);

  saveDb();

  // Also log in admin logs!
  logAdminAction(req.user, 'USER_REPORTED', target_type, target_id, `Reporter ${req.user.name} reported ${target_type} (${targetName}). Reason: ${reason}`);

  res.status(201).json({ message: 'Report filed successfully', report: newReport });
});

app.get('/api/users/:user_id/followers', optionalAuthenticateToken, (req, res) => {
  const target = db.users.find(u => u._id === req.params.user_id);
  if (!target) return res.status(404).json({ detail: 'User not found' });

  const ids = target.followers || [];
  const list = db.users.filter(u => ids.includes(u._id)).map(u => ({
    _id: u._id,
    name: u.name,
    username: u.username,
    bio: u.bio,
    profile_image: u.profile_image,
    role: u.role,
    is_verified: u.is_verified,
    followers_count: (u.followers || []).length,
    is_following: req.user ? (req.user.following || []).includes(u._id) : false
  }));

  res.json({ users: list });
});

app.get('/api/users/:user_id/following-list', optionalAuthenticateToken, (req, res) => {
  const target = db.users.find(u => u._id === req.params.user_id);
  if (!target) return res.status(404).json({ detail: 'User not found' });

  const ids = target.following || [];
  const list = db.users.filter(u => ids.includes(u._id)).map(u => ({
    _id: u._id,
    name: u.name,
    username: u.username,
    bio: u.bio,
    profile_image: u.profile_image,
    role: u.role,
    is_verified: u.is_verified,
    followers_count: (u.followers || []).length,
    is_following: req.user ? (req.user.following || []).includes(u._id) : false
  }));

  res.json({ users: list });
});

// --- Explore API ---
app.get('/api/explore', optionalAuthenticateToken, (req, res) => {
  const { state, language, search } = req.query;
  const currentUserId = req.user ? req.user._id : null;

  let posts = [...db.posts];
  let churches = [...db.churches];
  let events = [...db.events];
  let products = [...db.products];

  if (state) {
    churches = churches.filter(c => c.state && c.state.toLowerCase() === state.toLowerCase());
    events = events.filter(e => e.state && e.state.toLowerCase() === state.toLowerCase());
  }
  if (language) {
    churches = churches.filter(c => c.languages && c.languages.map(l => l.toLowerCase()).includes(language.toLowerCase()));
    events = events.filter(e => e.languages && e.languages.map(l => l.toLowerCase()).includes(language.toLowerCase()));
  }
  if (search) {
    const s = search.toLowerCase();
    posts = posts.filter(p => p.content_text.toLowerCase().includes(s));
    churches = churches.filter(c => c.name.toLowerCase().includes(s) || (c.description && c.description.toLowerCase().includes(s)));
    events = events.filter(e => e.title.toLowerCase().includes(s) || e.location.toLowerCase().includes(s));
    products = products.filter(p => p.title.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s)));
  }

  const enrichedPosts = posts.slice(0, 5).map(p => ({ ...enrichPost(p, currentUserId), type: 'post' }));
  const enrichedChurches = churches.slice(0, 5).map(c => ({
    ...c,
    type: 'church',
    followers_count: (c.followers || []).length,
    is_following: currentUserId ? (c.followers || []).includes(currentUserId) : false
  }));
  const enrichedEvents = events.slice(0, 5).map(e => ({
    ...e,
    type: 'event',
    attendees_count: db.event_registrations.filter(r => r.event_id === e._id).length,
    is_registered: currentUserId ? db.event_registrations.some(r => r.event_id === e._id && r.user_id === currentUserId) : false
  }));
  const enrichedProducts = products.slice(0, 5).map(p => ({ ...p, type: 'product' }));

  // Trending users sorted by follower count
  const trendingUsers = [...db.users]
    .filter(u => u.status === 'active' && u._id !== 'user_admin')
    .sort((a, b) => (b.followers || []).length - (a.followers || []).length)
    .slice(0, 5)
    .map(u => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      bio: u.bio,
      profile_image: u.profile_image,
      role: u.role,
      type: 'user',
      followers_count: (u.followers || []).length
    }));

  res.json({
    posts: enrichedPosts,
    churches: enrichedChurches,
    events: enrichedEvents,
    products: enrichedProducts,
    trending_users: trendingUsers
  });
});

// --- Unified Search API ---
app.get('/api/search', optionalAuthenticateToken, (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  const currentUserId = req.user ? req.user._id : null;

  if (!q || q.length < 2) {
    return res.json({
      posts: [],
      churches: [],
      events: [],
      users: [],
      counts: { posts: 0, churches: 0, events: 0, users: 0 }
    });
  }

  const matchedPosts = db.posts.filter(p => p.content_text.toLowerCase().includes(q) || p.user_name.toLowerCase().includes(q));
  const matchedChurches = db.churches.filter(c => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)));
  const matchedEvents = db.events.filter(e => e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q));
  const matchedUsers = db.users.filter(u => u.status === 'active' && u._id !== 'user_admin' && (u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || (u.bio && u.bio.toLowerCase().includes(q))));

  res.json({
    posts: matchedPosts.slice(0, 8).map(p => enrichPost(p, currentUserId)),
    churches: matchedChurches.slice(0, 8).map(c => ({
      ...c,
      followers_count: (c.followers || []).length,
      is_following: currentUserId ? (c.followers || []).includes(currentUserId) : false
    })),
    events: matchedEvents.slice(0, 8).map(e => ({
      ...e,
      attendees_count: db.event_registrations.filter(r => r.event_id === e._id).length,
      is_registered: currentUserId ? db.event_registrations.some(r => r.event_id === e._id && r.user_id === currentUserId) : false
    })),
    users: matchedUsers.slice(0, 8).map(u => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      bio: u.bio,
      profile_image: u.profile_image,
      role: u.role,
      is_verified: u.is_verified,
      followers_count: (u.followers || []).length
    })),
    counts: {
      posts: matchedPosts.length,
      churches: matchedChurches.length,
      events: matchedEvents.length,
      users: matchedUsers.length
    }
  });
});

// Recent Searches (Mock)
app.get('/api/search/recent', authenticateToken, (req, res) => {
  const doc = db.recent_searches.find(r => r.user_id === req.user._id);
  res.json({ queries: doc ? doc.queries : [] });
});

app.post('/api/search/recent', authenticateToken, (req, res) => {
  const { query } = req.body;
  if (!query || query.trim().length < 2) return res.json({ message: 'Ignored' });

  let doc = db.recent_searches.find(r => r.user_id === req.user._id);
  if (!doc) {
    doc = { user_id: req.user._id, queries: [] };
    db.recent_searches.push(doc);
  }

  doc.queries = doc.queries.filter(q => q.text.toLowerCase() !== query.trim().toLowerCase());
  doc.queries.unshift({ text: query.trim(), ts: new Date().toISOString() });
  doc.queries = doc.queries.slice(0, 8);
  saveDb();

  res.json({ message: 'Saved' });
});

app.delete('/api/search/recent', authenticateToken, (req, res) => {
  db.recent_searches = db.recent_searches.filter(r => r.user_id !== req.user._id);
  saveDb();
  res.json({ message: 'Cleared' });
});

// --- Notifications API ---
app.get('/api/notifications', authenticateToken, (req, res) => {
  const notifs = db.notifications.filter(n => n.recipient_id === req.user._id);
  const unread = notifs.filter(n => !n.read).length;
  res.json({ notifications: notifs, unread_count: unread });
});

app.get('/api/notifications/unread-count', authenticateToken, (req, res) => {
  const count = db.notifications.filter(n => n.recipient_id === req.user._id && !n.read).length;
  res.json({ unread_count: count });
});

app.put('/api/notifications/read-all', authenticateToken, (req, res) => {
  db.notifications.forEach(n => {
    if (n.recipient_id === req.user._id) n.read = true;
  });
  saveDb();
  res.json({ message: 'All marked read' });
});

app.put('/api/notifications/:notif_id/read', authenticateToken, (req, res) => {
  const notif = db.notifications.find(n => n._id === req.params.notif_id && n.recipient_id === req.user._id);
  if (notif) {
    notif.read = true;
    saveDb();
  }
  res.json({ message: 'Marked read' });
});

// Check if user has completed the 'Safe Intro' prayer requirement
function hasCompletedSafeIntro(user) {
  if (!user) return false;
  if (user.completed_safe_intro) return true;
  if (db.messages) {
    return db.messages.some(m => m.sender_id === user._id && m.text && m.text.includes('SAFE INTRO'));
  }
  return false;
}

// Dynamic badge calculation for profiles
function getUserBadges(user) {
  const badges = [];
  if (!user) return badges;

  const interests = user.interests || [];
  
  // 1. Roles & Admin Verification
  if (user.role === 'admin' || user.role === 'creator') {
    badges.push({
      id: 'ministry_partner',
      name: 'Ministry Partner',
      icon: 'HeartHandshake',
      color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      description: 'Verified ministry leader, partner, or church administrator.'
    });
  }

  if (user.is_verified) {
    badges.push({
      id: 'verified_seeker',
      name: 'Verified Seeker',
      icon: 'ShieldCheck',
      color: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      description: 'Identity vetted and verified by community standards.'
    });
  }

  // 2. Prayer Warrior badge
  const messageCount = db.messages ? db.messages.filter(m => m.sender_id === user._id).length : 0;
  if (interests.includes('Prayer Partner') || messageCount >= 5) {
    badges.push({
      id: 'prayer_warrior',
      name: 'Prayer Warrior',
      icon: 'Flame',
      color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      description: 'Active in seeking prayer partnership and spiritual support.'
    });
  }

  // 3. Bible Study Leader / Theology Scholar
  const postCount = db.posts ? db.posts.filter(p => p.user_id === user._id).length : 0;
  if ((interests.includes('Bible Study') || interests.includes('Theology')) && postCount >= 2) {
    badges.push({
      id: 'bible_leader',
      name: 'Bible Study Leader',
      icon: 'BookOpen',
      color: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      description: 'Actively participates in Bible study discussions and scriptural sharing.'
    });
  } else if (interests.includes('Theology') || interests.includes('Apologetics')) {
    badges.push({
      id: 'theology_scholar',
      name: 'Theology Scholar',
      icon: 'GraduationCap',
      color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      description: 'Deeply invested in theological inquiry and apologetics.'
    });
  }

  // 4. Active Servant
  if (interests.includes('Community Service') || interests.includes('Mission Trips')) {
    badges.push({
      id: 'active_servant',
      name: 'Active Servant',
      icon: 'Sparkles',
      color: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      description: 'Committed to hands-on servant ministries and mission engagement.'
    });
  }

  // 5. Fellowship Builder
  const uniqueConversations = db.conversations ? db.conversations.filter(c => c.participants.includes(user._id)).length : 0;
  if (interests.includes('Fellowship') || uniqueConversations >= 2) {
    badges.push({
      id: 'fellowship_builder',
      name: 'Fellowship Builder',
      icon: 'Users',
      color: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
      description: 'Dedicated to cultivating meaningful Christian community.'
    });
  }

  return badges;
}

// --- Christian BFF Swiping & Matching API ---

// Lazy initializer for swipes list
function getBffSwipes() {
  if (!db.bff_swipes) {
    db.bff_swipes = [];
  }
  return db.bff_swipes;
}

// Get potential friends or matrimonial partners to swipe on
app.get('/api/bff/discover', authenticateToken, (req, res) => {
  const swipes = getBffSwipes();
  const currentUserId = req.user._id;
  const currentUser = db.users.find(u => u._id === currentUserId);
  const mode = req.query.mode || 'bff'; // 'bff' or 'matrimony'

  // Find IDs we already swiped on (likes or passes)
  const swipedIds = swipes
    .filter(s => s.swiper_id === currentUserId)
    .map(s => s.target_id);

  // List of candidate users
  let candidates = db.users.filter(u => 
    u._id !== currentUserId && 
    u.status === 'active' &&
    !swipedIds.includes(u._id)
  );

  // For Matrimony, filter by opposite gender if current user's gender is set
  if (mode === 'matrimony' && currentUser && currentUser.gender) {
    const myGender = currentUser.gender.toLowerCase();
    if (myGender === 'female') {
      candidates = candidates.filter(u => (u.gender || '').toLowerCase() === 'male' || (u.gender || '').toLowerCase() === 'm' || !u.gender);
    } else if (myGender === 'male') {
      candidates = candidates.filter(u => (u.gender || '').toLowerCase() === 'female' || (u.gender || '').toLowerCase() === 'f' || !u.gender);
    }
  }

  // Fallback defaults for user profiles to ensure they have rich Christian BFF/Matrimony tags
  const defaults = [
    {
      denomination: 'Non-denominational',
      favorite_verse: 'Proverbs 27:17 - "Iron sharpens iron, and one man sharpens another."',
      interests: ['Bible Study', 'Coffee Chat', 'Worship', 'Hiking'],
      home_church: 'Grace Community Church',
      friendship_goals: 'Looking for a prayer partner & fellow believer to grow with.',
      age: 26,
      gender: 'Female',
      state: 'Karnataka',
      city: 'Bengaluru',
      marital_status: 'Never Married',
      family_values: 'Traditional',
      marriage_timeline: 'Within 1-2 years',
      spouse_expectations: 'Seeking a God-fearing, family-oriented partner who walks in faith.'
    },
    {
      denomination: 'Baptist',
      favorite_verse: 'Philippians 4:13 - "I can do all things through Christ who strengthens me."',
      interests: ['Community Service', 'Worship Music', 'Gym', 'Theological Discussion'],
      home_church: 'First Baptist Church',
      friendship_goals: 'Seeking fellow Christian guys to keep me accountable.',
      age: 28,
      gender: 'Male',
      state: 'Maharashtra',
      city: 'Mumbai',
      marital_status: 'Never Married',
      family_values: 'Conservative',
      marriage_timeline: 'Within 1 year',
      spouse_expectations: 'Looking for a dedicated partner to start a Christ-centered family.'
    },
    {
      denomination: 'Presbyterian',
      favorite_verse: 'Romans 8:28 - "And we know that for those who love God all things work together for good..."',
      interests: ['Coffee Chat', 'Book Club', 'Theology', 'Volunteering'],
      home_church: 'Covenant Presbyterian',
      friendship_goals: 'Looking for a Sunday brunch buddy and study companion.',
      age: 24,
      gender: 'Female',
      state: 'Karnataka',
      city: 'Bengaluru',
      marital_status: 'Single',
      family_values: 'Moderate',
      marriage_timeline: 'Within 2 years',
      spouse_expectations: 'Seeking someone who loves missions and active serving.'
    },
    {
      denomination: 'Catholic',
      favorite_verse: '1 Corinthians 13:4-7 - "Love is patient, love is kind..."',
      interests: ['Apologetics', 'Hiking', 'Missions', 'Worship'],
      home_church: 'St. Mary Cathedral',
      friendship_goals: 'Looking for local friends who love volunteering and apologetics.',
      age: 27,
      gender: 'Male',
      state: 'Delhi',
      city: 'New Delhi',
      marital_status: 'Never Married',
      family_values: 'Traditional',
      marriage_timeline: 'Within 1-2 years',
      spouse_expectations: 'A believer who wants to walk hand-in-hand in faith, serving the church.'
    }
  ];

  // Current user matching fields for calculating real compatibility score
  const myInterests = currentUser ? (currentUser.interests || ['Bible Study', 'Coffee Chat', 'Worship']) : [];
  const myState = currentUser ? (currentUser.state || 'Karnataka') : '';
  const myCity = currentUser ? (currentUser.city || 'Bengaluru') : '';
  const myDenomination = currentUser ? (currentUser.denomination || 'Non-denominational') : '';
  const myHomeChurch = currentUser ? (currentUser.home_church || 'Grace Community Church') : '';
  const myGender = currentUser ? (currentUser.gender || 'Female') : '';
  const myFamilyValues = currentUser ? (currentUser.family_values || 'Traditional') : '';
  const myMarriageTimeline = currentUser ? (currentUser.marriage_timeline || 'Within 1-2 years') : '';

  const enriched = candidates.map((u, index) => {
    const d = defaults[index % defaults.length];
    
    const uAge = u.age || d.age;
    const uGender = u.gender || d.gender;
    const uDenomination = u.denomination || d.denomination;
    const uFavoriteVerse = u.favorite_verse || d.favorite_verse;
    const uInterests = u.interests || d.interests || [];
    const uHomeChurch = u.home_church || d.home_church;
    const uFriendshipGoals = u.friendship_goals || d.friendship_goals;
    const uState = u.state || d.state || 'Karnataka';
    const uCity = u.city || d.city || 'Bengaluru';
    const uMatchMode = u.match_mode || 'both';
    const uMaritalStatus = u.marital_status || d.marital_status;
    const uFamilyValues = u.family_values || d.family_values;
    const uMarriageTimeline = u.marriage_timeline || d.marriage_timeline;
    const uSpouseExpectations = u.spouse_expectations || d.spouse_expectations;

    // Matching Algorithm
    let score = 0;

    // 1. Shared Interests Match (+20 points per shared interest, up to 60 max)
    const commonInterests = uInterests.filter(i => myInterests.includes(i));
    if (commonInterests.length > 0) {
      score += Math.min(60, commonInterests.length * 20);
    }

    // 2. Location Proximity Match (City: +30 points, State: +15 points)
    if (myCity && uCity && myCity.toLowerCase() === uCity.toLowerCase()) {
      score += 30;
    } else if (myState && uState && myState.toLowerCase() === uState.toLowerCase()) {
      score += 15;
    }

    // 3. Denomination Alignment (+15 points)
    if (myDenomination && uDenomination && myDenomination.toLowerCase() === uDenomination.toLowerCase()) {
      score += 15;
    }

    // 4. Same Local Church (+20 points)
    if (myHomeChurch && uHomeChurch && myHomeChurch.toLowerCase() === uHomeChurch.toLowerCase()) {
      score += 20;
    }

    // Matrimony Specific Alignment Factors
    if (mode === 'matrimony') {
      // 5. Opposite Gender Alignment (+20 points)
      if (myGender && uGender && myGender.toLowerCase() !== uGender.toLowerCase()) {
        score += 20;
      }

      // 6. Aligned Family Values (+15 points)
      if (myFamilyValues && uFamilyValues && myFamilyValues.toLowerCase() === uFamilyValues.toLowerCase()) {
        score += 15;
      }

      // 7. Aligned Marriage Timeline (+15 points)
      if (myMarriageTimeline && uMarriageTimeline && myMarriageTimeline === uMarriageTimeline) {
        score += 15;
      }
    }

    // Cap the final compatibility score between 40% and 99%
    const finalScore = Math.min(99, Math.max(40, 40 + score));

    return {
      _id: u._id,
      name: u.name,
      username: u.username,
      bio: u.bio || 'Faith-first, community-driven.',
      profile_image: u.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      role: u.role,
      is_verified: u.is_verified,
      age: uAge,
      gender: uGender,
      denomination: uDenomination,
      favorite_verse: uFavoriteVerse,
      interests: uInterests,
      home_church: uHomeChurch,
      friendship_goals: uFriendshipGoals,
      state: uState,
      city: uCity,
      match_score: finalScore,
      match_mode: uMatchMode,
      marital_status: uMaritalStatus,
      family_values: uFamilyValues,
      marriage_timeline: uMarriageTimeline,
      spouse_expectations: uSpouseExpectations,
      badges: getUserBadges(u),
      safe_intro_completed: hasCompletedSafeIntro(u)
    };
  });

  res.json({ candidates: enriched });
});

// Perform a swipe (like or pass)
app.post('/api/bff/swipe', authenticateToken, (req, res) => {
  const { target_id, action } = req.body;
  if (!target_id || !['like', 'pass'].includes(action)) {
    return res.status(400).json({ detail: 'Invalid target_id or action' });
  }

  const currentUserId = req.user._id;
  const swipes = getBffSwipes();

  // Check if already swiped to prevent duplicate entries
  const existingIndex = swipes.findIndex(s => s.swiper_id === currentUserId && s.target_id === target_id);
  if (existingIndex > -1) {
    swipes[existingIndex].action = action;
    swipes[existingIndex].created_at = new Date().toISOString();
  } else {
    swipes.push({
      _id: 'swipe_' + uuidv4(),
      swiper_id: currentUserId,
      target_id: target_id,
      action: action,
      created_at: new Date().toISOString()
    });
  }
  saveDb();

  // If pass, no match is possible
  if (action === 'pass') {
    return res.json({ matched: false });
  }

  // Check for mutual like
  const mutual = swipes.find(s => s.swiper_id === target_id && s.target_id === currentUserId && s.action === 'like');

  if (mutual) {
    // We have a match! Let's auto-create a Conversation
    const participants = [currentUserId, target_id].sort();
    let conversation = db.conversations.find(c => 
      c.participants.length === 2 && 
      c.participants[0] === participants[0] && 
      c.participants[1] === participants[1]
    );

    if (!conversation) {
      conversation = {
        _id: 'convo_' + uuidv4(),
        participants,
        last_message: 'You connected! Say hello! 🎉',
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      db.conversations.push(conversation);
    } else {
      conversation.last_message = 'You connected! Say hello! 🎉';
      conversation.updated_at = new Date().toISOString();
    }

    // Push automatic icebreaker message
    const msg = {
      _id: 'msg_' + uuidv4(),
      conversation_id: conversation._id,
      sender_id: target_id, // Let the other user say hi
      text: "Hey there! We both swiped to connect. I see we have some mutual interests. Let's grow in faith together! 🙏",
      read: false,
      created_at: new Date().toISOString()
    };
    db.messages.push(msg);
    saveDb();

    // Create notifications for both
    const currentUser = db.users.find(u => u._id === currentUserId);
    const targetUser = db.users.find(u => u._id === target_id);

    if (currentUser && targetUser) {
      createNotification(
        target_id, 
        currentUserId, 
        currentUser.name, 
        currentUser.profile_image, 
        'match', 
        `You have a new connection with ${currentUser.name}! 🎉`, 
        conversation._id
      );
      createNotification(
        currentUserId, 
        target_id, 
        targetUser.name, 
        targetUser.profile_image, 
        'match', 
        `You have a new connection with ${targetUser.name}! 🎉`, 
        conversation._id
      );
    }

    return res.json({ 
      matched: true, 
      conversation_id: conversation._id,
      other_user: targetUser ? {
        _id: targetUser._id,
        name: targetUser.name,
        profile_image: targetUser.profile_image
      } : null
    });
  }

  res.json({ matched: false });
});

// Get matches and "Who Liked Me"
app.get('/api/bff/connections', authenticateToken, (req, res) => {
  const currentUserId = req.user._id;
  const swipes = getBffSwipes();

  // Mutual matches
  const myLikes = swipes.filter(s => s.swiper_id === currentUserId && s.action === 'like').map(s => s.target_id);
  const mutualIds = swipes
    .filter(s => s.target_id === currentUserId && s.action === 'like' && myLikes.includes(s.swiper_id))
    .map(s => s.swiper_id);

  const matches = db.users
    .filter(u => mutualIds.includes(u._id))
    .map(u => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      profile_image: u.profile_image,
      bio: u.bio,
      is_verified: u.is_verified,
      badges: getUserBadges(u),
      safe_intro_completed: hasCompletedSafeIntro(u)
    }));

  // Who Liked Me (and current user hasn't swiped on yet)
  const mySwipedIds = swipes.filter(s => s.swiper_id === currentUserId).map(s => s.target_id);
  const whoLikedMeIds = swipes
    .filter(s => s.target_id === currentUserId && s.action === 'like' && !mySwipedIds.includes(s.swiper_id))
    .map(s => s.swiper_id);

  const whoLikedMe = db.users
    .filter(u => whoLikedMeIds.includes(u._id))
    .map(u => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      profile_image: u.profile_image,
      bio: u.bio,
      age: u.age || 25,
      denomination: u.denomination || 'Christian',
      badges: getUserBadges(u),
      safe_intro_completed: hasCompletedSafeIntro(u)
    }));

  res.json({ matches, whoLikedMe });
});

// Update Christian BFF / Matrimony Profile fields
app.put('/api/bff/profile', authenticateToken, (req, res) => {
  const { 
    age, gender, denomination, home_church, favorite_verse, interests, friendship_goals, bio,
    match_mode, marital_status, family_values, marriage_timeline, spouse_expectations
  } = req.body;
  
  const user = db.users.find(u => u._id === req.user._id);
  if (!user) return res.status(404).json({ detail: 'User not found' });

  if (age) user.age = parseInt(age) || user.age;
  if (gender) user.gender = gender;
  if (denomination) user.denomination = denomination;
  if (home_church) user.home_church = home_church;
  if (favorite_verse) user.favorite_verse = favorite_verse;
  if (interests && Array.isArray(interests)) user.interests = interests;
  if (friendship_goals) user.friendship_goals = friendship_goals;
  if (bio) user.bio = bio;
  
  // Matrimony fields
  if (match_mode) user.match_mode = match_mode;
  if (marital_status) user.marital_status = marital_status;
  if (family_values) user.family_values = family_values;
  if (marriage_timeline) user.marriage_timeline = marriage_timeline;
  if (spouse_expectations) user.spouse_expectations = spouse_expectations;

  saveDb();
  res.json({ message: 'BFF/Matrimony profile updated successfully', user });
});

// Get compatible profiles based on shared interests or location (Simple Matching Algorithm)
app.get('/api/bff/compatible', authenticateToken, (req, res) => {
  const currentUserId = req.user._id;
  const currentUser = db.users.find(u => u._id === currentUserId);
  if (!currentUser) return res.status(404).json({ detail: 'User not found' });
  const mode = req.query.mode || 'bff'; // 'bff' or 'matrimony'

  // List of other active users
  let candidates = db.users.filter(u => 
    u._id !== currentUserId && 
    u.status === 'active'
  );

  // Filter out blocked/blocking users
  const myBlocked = currentUser.blocked_users || [];
  candidates = candidates.filter(u => {
    if (myBlocked.includes(u._id)) return false;
    const uBlocked = u.blocked_users || [];
    if (uBlocked.includes(currentUserId)) return false;
    return true;
  });

  // Filter opposite gender if in matrimony mode and current user's gender is set
  if (mode === 'matrimony' && currentUser && currentUser.gender) {
    const myGender = currentUser.gender.toLowerCase();
    if (myGender === 'female') {
      candidates = candidates.filter(u => (u.gender || '').toLowerCase() === 'male' || (u.gender || '').toLowerCase() === 'm' || !u.gender);
    } else if (myGender === 'male') {
      candidates = candidates.filter(u => (u.gender || '').toLowerCase() === 'female' || (u.gender || '').toLowerCase() === 'f' || !u.gender);
    }
  }

  // Fallback defaults for user profiles to ensure they have rich Christian BFF/Matrimony tags
  const defaults = [
    {
      denomination: 'Non-denominational',
      favorite_verse: 'Proverbs 27:17 - "Iron sharpens iron, and one man sharpens another."',
      interests: ['Bible Study', 'Coffee Chat', 'Worship', 'Hiking'],
      home_church: 'Grace Community Church',
      friendship_goals: 'Looking for a prayer partner & fellow believer to grow with.',
      age: 26,
      gender: 'Female',
      state: 'Karnataka',
      city: 'Bengaluru',
      marital_status: 'Never Married',
      family_values: 'Traditional',
      marriage_timeline: 'Within 1-2 years',
      spouse_expectations: 'Seeking a God-fearing, family-oriented partner who walks in faith.'
    },
    {
      denomination: 'Baptist',
      favorite_verse: 'Philippians 4:13 - "I can do all things through Christ who strengthens me."',
      interests: ['Community Service', 'Worship Music', 'Gym', 'Theology'],
      home_church: 'First Baptist Church',
      friendship_goals: 'Seeking fellow Christian guys to keep me accountable.',
      age: 28,
      gender: 'Male',
      state: 'Maharashtra',
      city: 'Mumbai',
      marital_status: 'Never Married',
      family_values: 'Conservative',
      marriage_timeline: 'Within 1 year',
      spouse_expectations: 'Looking for a dedicated partner to start a Christ-centered family.'
    },
    {
      denomination: 'Presbyterian',
      favorite_verse: 'Romans 8:28 - "And we know that for those who love God all things work together for good..."',
      interests: ['Coffee Chat', 'Book Club', 'Theology', 'Volunteering'],
      home_church: 'Covenant Presbyterian',
      friendship_goals: 'Looking for a Sunday brunch buddy and study companion.',
      age: 24,
      gender: 'Female',
      state: 'Karnataka',
      city: 'Bengaluru',
      marital_status: 'Single',
      family_values: 'Moderate',
      marriage_timeline: 'Within 2 years',
      spouse_expectations: 'Seeking someone who loves missions and active serving.'
    },
    {
      denomination: 'Catholic',
      favorite_verse: '1 Corinthians 13:4-7 - "Love is patient, love is kind..."',
      interests: ['Apologetics', 'Hiking', 'Missions', 'Worship'],
      home_church: 'St. Mary Cathedral',
      friendship_goals: 'Looking for local friends who love volunteering and apologetics.',
      age: 27,
      gender: 'Male',
      state: 'Delhi',
      city: 'New Delhi',
      marital_status: 'Never Married',
      family_values: 'Traditional',
      marriage_timeline: 'Within 1-2 years',
      spouse_expectations: 'A believer who wants to walk hand-in-hand in faith, serving the church.'
    }
  ];

  const results = candidates.map((u, index) => {
    const d = defaults[index % defaults.length];
    
    // User fields (resolved with default fallback)
    const uAge = u.age || d.age;
    const uGender = u.gender || d.gender;
    const uDenomination = u.denomination || d.denomination;
    const uFavoriteVerse = u.favorite_verse || d.favorite_verse;
    const uInterests = u.interests || d.interests || [];
    const uHomeChurch = u.home_church || d.home_church;
    const uFriendshipGoals = u.friendship_goals || d.friendship_goals;
    const uState = u.state || d.state;
    const uCity = u.city || d.city;

    // Matrimony fields fallback
    const uMatchMode = u.match_mode || 'both';
    const uMaritalStatus = u.marital_status || d.marital_status;
    const uFamilyValues = u.family_values || d.family_values;
    const uMarriageTimeline = u.marriage_timeline || d.marriage_timeline;
    const uSpouseExpectations = u.spouse_expectations || d.spouse_expectations;

    // Logged-in user's fields
    const myInterests = currentUser.interests || ['Bible Study', 'Coffee Chat', 'Worship'];
    const myState = currentUser.state || 'Karnataka';
    const myCity = currentUser.city || 'Bengaluru';
    const myDenomination = currentUser.denomination || 'Non-denominational';
    const myHomeChurch = currentUser.home_church || 'Grace Community Church';
    const myGender = currentUser.gender || 'Female';
    const myFamilyValues = currentUser.family_values || 'Traditional';
    const myMarriageTimeline = currentUser.marriage_timeline || 'Within 1-2 years';

    // Matching Algorithm
    let score = 0;
    const matchReasons = [];

    // 1. Shared Interests Match (Weighted onboarding hobbies & values: +20 points per shared interest, up to 60 max)
    const commonInterests = uInterests.filter(i => myInterests.includes(i));
    if (commonInterests.length > 0) {
      const interestPoints = Math.min(60, commonInterests.length * 20);
      score += interestPoints;
      matchReasons.push({
        type: 'interests',
        label: `${commonInterests.length} Shared Onboarding Interest${commonInterests.length > 1 ? 's' : ''}`,
        details: commonInterests.join(', '),
        points: interestPoints
      });
    }

    // 2. Location Proximity Match (City: +30 points, State: +15 points)
    if (myCity && uCity && myCity.toLowerCase() === uCity.toLowerCase()) {
      score += 30;
      matchReasons.push({
        type: 'location',
        label: `Both in ${uCity}`,
        details: 'Same City Proximity',
        points: 30
      });
    } else if (myState && uState && myState.toLowerCase() === uState.toLowerCase()) {
      score += 15;
      matchReasons.push({
        type: 'location',
        label: `Both in ${uState}`,
        details: 'Same State Location',
        points: 15
      });
    }

    // 3. Denomination Alignment (+15 points)
    if (myDenomination && uDenomination && myDenomination.toLowerCase() === uDenomination.toLowerCase()) {
      score += 15;
      matchReasons.push({
        type: 'denomination',
        label: `Same Denomination`,
        details: uDenomination,
        points: 15
      });
    }

    // 4. Same Local Church (+20 points)
    if (myHomeChurch && uHomeChurch && myHomeChurch.toLowerCase() === uHomeChurch.toLowerCase()) {
      score += 20;
      matchReasons.push({
        type: 'church',
        label: `Same Home Church`,
        details: uHomeChurch,
        points: 20
      });
    }

    // Matrimony Specific Alignment Factors
    if (mode === 'matrimony') {
      // 5. Opposite Gender Alignment (+20 points)
      if (myGender && uGender && myGender.toLowerCase() !== uGender.toLowerCase()) {
        score += 20;
        matchReasons.push({
          type: 'gender',
          label: `Complementary Gender Match`,
          details: `${myGender} seeking ${uGender}`,
          points: 20
        });
      }

      // 6. Aligned Family Values (+15 points)
      if (myFamilyValues && uFamilyValues && myFamilyValues.toLowerCase() === uFamilyValues.toLowerCase()) {
        score += 15;
        matchReasons.push({
          type: 'values',
          label: `Aligned Family Values`,
          details: `Both hold ${uFamilyValues} values`,
          points: 15
        });
      }

      // 7. Aligned Marriage Timeline (+15 points)
      if (myMarriageTimeline && uMarriageTimeline && myMarriageTimeline === uMarriageTimeline) {
        score += 15;
        matchReasons.push({
          type: 'timeline',
          label: `Aligned Marriage Timeline`,
          details: `Both aim to marry ${uMarriageTimeline}`,
          points: 15
        });
      }
    }

    // Cap the final compatibility score between 40% and 99%
    const finalScore = Math.min(99, Math.max(40, 40 + score));

    return {
      _id: u._id,
      name: u.name,
      username: u.username,
      bio: u.bio || 'Faith-first, community-driven.',
      profile_image: u.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      is_verified: u.is_verified,
      age: uAge,
      gender: uGender,
      denomination: uDenomination,
      favorite_verse: uFavoriteVerse,
      interests: uInterests,
      home_church: uHomeChurch,
      friendship_goals: uFriendshipGoals,
      state: uState,
      city: uCity,
      match_score: finalScore,
      match_reasons: matchReasons,
      match_mode: uMatchMode,
      marital_status: uMaritalStatus,
      family_values: uFamilyValues,
      marriage_timeline: uMarriageTimeline,
      spouse_expectations: uSpouseExpectations,
      badges: getUserBadges(u),
      safe_intro_completed: hasCompletedSafeIntro(u)
    };
  });

  // Sort by match_score descending
  results.sort((a, b) => b.match_score - a.match_score);

  res.json({ compatible_profiles: results });
});

app.get('/api/bff/ai-match', authenticateToken, aiLimiter, async (req, res) => {
  const { target_id } = req.query;
  const currentUserId = req.user._id;
  
  const currentUser = db.users.find(u => u._id === currentUserId);
  const targetUser = db.users.find(u => u._id === target_id);
  if (!currentUser || !targetUser) {
    return res.status(404).json({ detail: 'Users not found' });
  }

  const myInterests = currentUser.interests || [];
  const targetInterests = targetUser.interests || [];
  const commonInterests = targetInterests.filter(i => myInterests.includes(i));
  const myCity = currentUser.city || '';
  const targetCity = targetUser.city || '';
  const isLocal = myCity.toLowerCase() === targetCity.toLowerCase();
  
  let matchScore = 75;
  if (commonInterests.length > 0) matchScore += Math.min(20, commonInterests.length * 5);
  if (isLocal) matchScore += 10;
  if (currentUser.denomination === targetUser.denomination) matchScore += 10;
  if (matchScore > 99) matchScore = 99;

  const fallbackExplanations = [
    `We think you'll connect because you both share a passion for ${commonInterests.slice(0, 2).join(' and ') || 'fellowship and church community'}.`,
    `You both are dedicated believers from the ${currentUser.denomination || 'Christian'} background looking to build local connections.`,
    `Your profile alignments show deep shared priorities: you are both committed to ${currentUser.friendship_goals || 'growing together in faith'}.`
  ];
  
  const fallbackStarters = [
    `Hi ${targetUser.name}! I noticed we both attend ${targetUser.home_church || 'church'} and love ${commonInterests[0] || 'fellowship'}. How has your week been?`,
    `Peace be with you, ${targetUser.name}! I saw your favorite verse is ${targetUser.favorite_verse || 'Scripture'}. What does that verse mean to you in this season?`,
    `Hello! I'm also looking for a ${currentUser.friendship_goals || 'believer'} in ${currentUser.city || 'our city'} to share scriptures and prayer requests. Let's connect!`
  ];

  const defaultVerse = "Proverbs 27:17";
  const defaultVerseText = "Iron sharpens iron, and one man sharpens another.";

  let result = {
    match_score: matchScore,
    match_explanation: fallbackExplanations[Math.floor(Math.random() * fallbackExplanations.length)],
    compatibility_summary: `Your profiles are highly compatible in interests (${commonInterests.join(', ') || 'Faith'}) and spiritual priorities. Building a Christ-centered friendship here can help you both stay accountable and grow together in daily devotional studies and worship in ${targetUser.city || 'India'}.`,
    conversation_starters: fallbackStarters,
    shared_scripture: defaultVerse,
    shared_scripture_text: defaultVerseText,
    is_ai_generated: false
  };

  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const aiInstance = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are a warm, wise Christian relationship counselor and friendly matchmaker for CrossCrafted (a Christian friendship platform in India).
Analyze the spiritual compatibility of these two users to help them start a friendship/fellowship:

User 1 (Active User):
- Name: ${currentUser.name}
- Age: ${currentUser.age || 25}
- Gender: ${currentUser.gender || 'Not specified'}
- Denomination: ${currentUser.denomination || 'Christian'}
- Home Church: ${currentUser.home_church || 'Not specified'}
- State/City: ${currentUser.city || 'Not specified'}, ${currentUser.state || 'Not specified'}
- Favorite Scripture: "${currentUser.favorite_verse || 'Not specified'}"
- Interests: ${JSON.stringify(currentUser.interests || [])}
- Friendship Goals: ${currentUser.friendship_goals || 'Not specified'}

User 2 (Candidate Match):
- Name: ${targetUser.name}
- Age: ${targetUser.age || 25}
- Gender: ${targetUser.gender || 'Not specified'}
- Denomination: ${targetUser.denomination || 'Christian'}
- Home Church: ${targetUser.home_church || 'Not specified'}
- State/City: ${targetUser.city || 'Not specified'}, ${targetUser.state || 'Not specified'}
- Favorite Scripture: "${targetUser.favorite_verse || 'Not specified'}"
- Interests: ${JSON.stringify(targetUser.interests || [])}
- Friendship Goals: ${targetUser.friendship_goals || 'Not specified'}

Generate a JSON object with:
1. match_score (integer between 65 and 99, based on spiritual, denominational, geographic, and interest alignment)
2. match_explanation (string, around 2 sentences. Explain why they are a great match, focusing on shared interests and fellowship goals in a encouraging, faith-centric manner)
3. compatibility_summary (string, 1-2 paragraphs going deeper into their alignment and how they can lift each other up)
4. conversation_starters (array of exactly 3 highly personalized, warm icebreakers referencing their shared interests or favorite verses)
5. shared_scripture (string, e.g. "Romans 15:7" - select an encouraging Bible verse that represents their potential friendship/fellowship)
6. shared_scripture_text (string, the full text of that Bible verse)

Do not return markdown wrappers or backticks. Return ONLY the raw JSON object.`;

      const response = await aiInstance.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const textResponse = response.text;
      if (textResponse) {
        const parsed = JSON.parse(textResponse);
        result = {
          match_score: parsed.match_score || matchScore,
          match_explanation: parsed.match_explanation || result.match_explanation,
          compatibility_summary: parsed.compatibility_summary || result.compatibility_summary,
          conversation_starters: parsed.conversation_starters || result.conversation_starters,
          shared_scripture: parsed.shared_scripture || result.shared_scripture,
          shared_scripture_text: parsed.shared_scripture_text || result.shared_scripture_text,
          is_ai_generated: true
        };
      }
    } catch (apiErr) {
      // Local matchmaking fallback
    }
  }

  res.json(result);
});

// --- Messaging (DMs) API ---
app.get('/api/conversations', authenticateToken, (req, res) => {
  const myBlocked = req.user.blocked_users || [];
  const convos = db.conversations.filter(c => {
    if (!c.participants.includes(req.user._id)) return false;
    const otherId = c.participants.find(p => p !== req.user._id);
    if (otherId) {
      if (myBlocked.includes(otherId)) return false;
      const otherUser = db.users.find(u => u._id === otherId);
      if (otherUser && (otherUser.blocked_users || []).includes(req.user._id)) {
        return false;
      }
    }
    return true;
  });
  
  const mapped = convos.map(c => {
    const otherId = c.participants.find(p => p !== req.user._id);
    const otherUser = db.users.find(u => u._id === otherId);
    const unread = db.messages.filter(m => m.conversation_id === c._id && m.sender_id !== req.user._id && !m.read).length;

    return {
      _id: c._id,
      other_user: otherUser ? {
        _id: otherUser._id,
        name: otherUser.name,
        username: otherUser.username,
        profile_image: otherUser.profile_image,
        is_verified: otherUser.is_verified
      } : null,
      last_message: c.last_message,
      last_message_at: c.updated_at,
      unread_count: unread
    };
  });

  // Sort by most recent message/update
  mapped.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
  res.json({ conversations: mapped });
});

app.post('/api/conversations', authenticateToken, messagingLimiter, (req, res) => {
  const { user_id } = req.body;
  if (!user_id || user_id === req.user._id) {
    return res.status(400).json({ detail: 'Invalid target user' });
  }

  const target = db.users.find(u => u._id === user_id);
  if (!target) return res.status(404).json({ detail: 'User not found' });

  // Safety checks
  const myBlocked = req.user.blocked_users || [];
  if (myBlocked.includes(user_id)) {
    return res.status(403).json({ detail: 'You have blocked this user' });
  }
  const targetBlocked = target.blocked_users || [];
  if (targetBlocked.includes(req.user._id)) {
    return res.status(403).json({ detail: 'This user has blocked you' });
  }
  if (target.allow_dms === false) {
    return res.status(403).json({ detail: 'This user has disabled direct messages' });
  }

  const participants = [req.user._id, user_id].sort();
  let existing = db.conversations.find(c => 
    c.participants.length === 2 && 
    c.participants[0] === participants[0] && 
    c.participants[1] === participants[1]
  );

  if (existing) {
    return res.json({ conversation_id: existing._id });
  }

  const newConvo = {
    _id: 'convo_' + uuidv4(),
    participants,
    last_message: '',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  db.conversations.push(newConvo);
  saveDb();

  res.json({ conversation_id: newConvo._id });
});

app.get('/api/conversations/:convo_id/messages', authenticateToken, (req, res) => {
  const convo = db.conversations.find(c => c._id === req.params.convo_id);
  if (!convo || !convo.participants.includes(req.user._id)) {
    return res.status(403).json({ detail: 'Not authorized' });
  }

  // Safety checks on the other participant
  const otherId = convo.participants.find(p => p !== req.user._id);
  if (otherId) {
    const otherUser = db.users.find(u => u._id === otherId);
    const myBlocked = req.user.blocked_users || [];
    if (myBlocked.includes(otherId)) {
      return res.status(403).json({ detail: 'You have blocked this user' });
    }
    const otherBlocked = otherUser ? (otherUser.blocked_users || []) : [];
    if (otherBlocked.includes(req.user._id)) {
      return res.status(403).json({ detail: 'This user has blocked you' });
    }
  }

  // Mark all unread messages as read
  db.messages.forEach(m => {
    if (m.conversation_id === req.params.convo_id && m.sender_id !== req.user._id) {
      m.read = true;
    }
  });
  saveDb();

  const msgs = db.messages.filter(m => m.conversation_id === req.params.convo_id);
  msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  res.json({ messages: msgs });
});

app.post('/api/conversations/:convo_id/messages', authenticateToken, messagingLimiter, (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ detail: 'Empty message' });
  }

  const convo = db.conversations.find(c => c._id === req.params.convo_id);
  if (!convo || !convo.participants.includes(req.user._id)) {
    return res.status(403).json({ detail: 'Not authorized' });
  }

  // Safety checks on the other participant
  const otherId = convo.participants.find(p => p !== req.user._id);
  if (otherId) {
    const otherUser = db.users.find(u => u._id === otherId);
    const myBlocked = req.user.blocked_users || [];
    if (myBlocked.includes(otherId)) {
      return res.status(403).json({ detail: 'You have blocked this user' });
    }
    const otherBlocked = otherUser ? (otherUser.blocked_users || []) : [];
    if (otherBlocked.includes(req.user._id)) {
      return res.status(403).json({ detail: 'This user has blocked you' });
    }
    if (otherUser && otherUser.allow_dms === false) {
      return res.status(403).json({ detail: 'This user has disabled direct messages' });
    }
  }

  const newMsg = {
    _id: 'msg_' + uuidv4(),
    conversation_id: req.params.convo_id,
    sender_id: req.user._id,
    sender_name: req.user.name,
    text: text.trim(),
    image_url: req.body.image_url || null,
    voice_url: req.body.voice_url || null,
    prayer_request: req.body.prayer_request || null,
    scripture: req.body.scripture || null,
    reactions: req.body.reactions || [],
    read: false,
    created_at: new Date().toISOString()
  };

  db.messages.push(newMsg);

  convo.last_message = text.trim();
  convo.updated_at = newMsg.created_at;
  saveDb();

  if (otherId) {
    createNotification(otherId, req.user._id, req.user.name, req.user.profile_image, 'message', `${req.user.name} sent you a message`, convo._id);
  }

  res.json(newMsg);
});

app.post('/api/conversations/:convo_id/messages/:message_id/react', authenticateToken, (req, res) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ detail: 'Emoji required' });

  const msg = db.messages.find(m => m._id === req.params.message_id);
  if (!msg) return res.status(404).json({ detail: 'Message not found' });

  if (!msg.reactions) msg.reactions = [];

  const existingIndex = msg.reactions.findIndex(r => r.user_id === req.user._id);
  if (existingIndex > -1) {
    if (msg.reactions[existingIndex].emoji === emoji) {
      msg.reactions.splice(existingIndex, 1);
    } else {
      msg.reactions[existingIndex].emoji = emoji;
    }
  } else {
    msg.reactions.push({
      user_id: req.user._id,
      user_name: req.user.name,
      emoji
    });
  }

  saveDb();
  res.json(msg);
});

app.get('/api/messages/unread-count', authenticateToken, (req, res) => {
  const userConvoIds = db.conversations.filter(c => c.participants.includes(req.user._id)).map(c => c._id);
  const count = db.messages.filter(m => userConvoIds.includes(m.conversation_id) && m.sender_id !== req.user._id && !m.read).length;
  res.json({ unread_count: count });
});

// --- Admin Dashboard API Endpoints ---
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const roleCounts = { user: 0, church: 0, creator: 0, admin: 0 };
  db.users.forEach(u => {
    if (roleCounts[u.role] !== undefined) roleCounts[u.role]++;
  });

  const pendingUsersCount = db.users.filter(u => u.status === 'pending_approval').length;
  const churchesPending = db.churches.filter(c => c.status === 'pending').length;
  const churchesApproved = db.churches.filter(c => c.status !== 'rejected').length;
  const churchesRejected = db.churches.filter(c => c.status === 'rejected').length;

  const recentUsers = db.users.slice(0, 5).map(u => ({ _id: u._id, name: u.name, email: u.email, created_at: u.created_at }));

  res.json({
    users: db.users.length,
    posts: db.posts.length,
    churches: db.churches.length,
    events: db.events.length,
    products: db.products.length,
    registrations: db.event_registrations.length,
    role_counts: roleCounts,
    pending_users: pendingUsersCount,
    churches_pending: churchesPending,
    churches_approved: churchesApproved,
    churches_rejected: churchesRejected,
    recent_users: recentUsers
  });
});

// Admin: Get all reports
app.get('/api/admin/reports', requireAdmin, (req, res) => {
  res.json({ reports: db.reports || [], total: (db.reports || []).length });
});

// Admin: Resolve a report (dismiss or ban)
app.post('/api/admin/reports/:report_id/resolve', requireAdmin, (req, res) => {
  const { action } = req.body; // 'dismiss', 'ban_user', 'resolve'
  if (!db.reports) db.reports = [];

  const report = db.reports.find(r => r._id === req.params.report_id);
  if (!report) return res.status(404).json({ detail: 'Report not found' });

  report.status = action === 'dismiss' ? 'dismissed' : 'resolved';

  if (action === 'ban_user') {
    const targetUser = db.users.find(u => u._id === report.target_id);
    if (targetUser) {
      targetUser.status = 'banned';
      logAdminAction(req.user, 'USER_BANNED', 'user', targetUser._id, `Banned user ${targetUser.name} due to report: ${report.reason}`);
    }
  } else {
    logAdminAction(req.user, 'REPORT_RESOLVED', report.target_type, report.target_id, `Resolved report ${report._id}. Action: ${action}`);
  }

  saveDb();
  res.json({ message: 'Report handled successfully', report });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const search = (req.query.search || '').toLowerCase();
  let list = [...db.users];

  if (search) {
    list = list.filter(u => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search) || u.username.toLowerCase().includes(search));
  }

  const mapped = list.map(u => {
    const postsCount = db.posts.filter(p => p.user_id === u._id).length;
    const { password_hash, ...safe } = u;
    return { ...safe, posts_count: postsCount };
  });

  res.json({ users: mapped, total: mapped.length });
});

app.put('/api/admin/users/:user_id/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ detail: 'Role is required' });

  if (req.params.user_id === req.user._id) {
    return res.status(400).json({ detail: 'Cannot change your own role' });
  }

  const user = db.users.find(u => u._id === req.params.user_id);
  if (!user) return res.status(404).json({ detail: 'User not found' });

  user.role = role;
  saveDb();

  logAdminAction(req.user, 'ROLE_CHANGE', 'user', user._id, `Changed ${user.name} role to ${role}`);
  res.json({ message: `Role updated to ${role}` });
});

app.put('/api/admin/users/:user_id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ detail: 'Status is required' });

  const user = db.users.find(u => u._id === req.params.user_id);
  if (!user) return res.status(404).json({ detail: 'User not found' });

  user.status = status;
  saveDb();

  const action = status === 'active' ? 'USER_APPROVED' : status === 'rejected' ? 'USER_REJECTED' : 'USER_STATUS_CHANGE';
  logAdminAction(req.user, action, 'user', user._id, `${status.replace('_', ' ').toUpperCase()} user: ${user.name}`);

  if (status === 'active') {
    createNotification(user._id, req.user._id, 'Cross Crafted', '', 'admin', 'Your account has been approved! Welcome to the community.', '');
  } else if (status === 'rejected') {
    createNotification(user._id, req.user._id, 'Cross Crafted', '', 'admin', 'Your account registration was not approved.', '');
  }

  res.json({ message: `User status set to ${status}` });
});

app.put('/api/admin/users/:user_id/verify', requireAdmin, (req, res) => {
  const isVerified = !!req.body.is_verified;
  const user = db.users.find(u => u._id === req.params.user_id);
  if (!user) return res.status(404).json({ detail: 'User not found' });

  user.is_verified = isVerified;
  saveDb();

  const actionLabel = isVerified ? 'VERIFY_USER' : 'UNVERIFY_USER';
  logAdminAction(req.user, actionLabel, 'user', user._id, `${isVerified ? 'Verified' : 'Unverified'} user: ${user.name}`);

  res.json({ message: `User ${isVerified ? 'verified' : 'unverified'}` });
});

app.get('/api/admin/pending-users', requireAdmin, (req, res) => {
  const list = db.users.filter(u => u.status === 'pending_approval').map(u => {
    const { password_hash, ...safe } = u;
    return safe;
  });
  res.json(list);
});

app.delete('/api/admin/users/:user_id', requireAdmin, (req, res) => {
  if (req.params.user_id === req.user._id) {
    return res.status(400).json({ detail: 'Cannot delete yourself' });
  }

  const idx = db.users.findIndex(u => u._id === req.params.user_id);
  if (idx === -1) return res.status(404).json({ detail: 'User not found' });

  const user = db.users[idx];
  db.users.splice(idx, 1);

  // Clean up user data
  db.posts = db.posts.filter(p => p.user_id !== req.params.user_id);
  db.event_registrations = db.event_registrations.filter(r => r.user_id !== req.params.user_id);
  db.products = db.products.filter(p => p.created_by !== req.params.user_id);

  saveDb();
  logAdminAction(req.user, 'DELETE_USER', 'user', req.params.user_id, `Deleted user ${user.name}`);

  res.json({ message: 'User and related data deleted' });
});

app.get('/api/admin/posts', requireAdmin, (req, res) => {
  const search = (req.query.search || '').toLowerCase();
  let list = [...db.posts];

  if (search) {
    list = list.filter(p => p.content_text.toLowerCase().includes(search));
  }

  const mapped = list.map(p => {
    const creator = db.users.find(u => u._id === p.user_id);
    return {
      ...p,
      likes_count: (p.likes || []).length,
      comments_count: (p.comments || []).length,
      author_name: creator ? creator.name : p.user_name,
      author_username: creator ? creator.username : p.user_username
    };
  });

  res.json({ posts: mapped, total: mapped.length });
});

app.delete('/api/admin/posts/:post_id', requireAdmin, (req, res) => {
  const idx = db.posts.findIndex(p => p._id === req.params.post_id);
  if (idx === -1) return res.status(404).json({ detail: 'Post not found' });

  const post = db.posts[idx];
  db.posts.splice(idx, 1);
  saveDb();

  const snippet = post.content_text.slice(0, 40) + '...';
  logAdminAction(req.user, 'DELETE_POST', 'post', req.params.post_id, `Deleted post: ${snippet}`);

  res.json({ message: 'Post deleted' });
});

// Admin Comment Management
app.get('/api/admin/comments', requireAdmin, (req, res) => {
  const search = (req.query.search || '').toLowerCase();
  const list = [];

  db.posts.forEach(p => {
    (p.comments || []).forEach(c => {
      if (!search || c.text.toLowerCase().includes(search) || c.user_name.toLowerCase().includes(search)) {
        list.push({
          post_id: p._id,
          post_text: p.content_text.slice(0, 80),
          post_author: p.user_name,
          comment_id: c.id,
          comment_text: c.text,
          comment_user_name: c.user_name,
          comment_user_id: c.user_id,
          comment_created_at: c.created_at
        });
      }
    });
  });

  list.sort((a, b) => new Date(b.comment_created_at) - new Date(a.comment_created_at));
  res.json({ comments: list, total: list.length });
});

app.delete('/api/admin/comments/:post_id/:comment_id', requireAdmin, (req, res) => {
  const post = db.posts.find(p => p._id === req.params.post_id);
  if (!post) return res.status(404).json({ detail: 'Post not found' });

  const commentIdx = (post.comments || []).findIndex(c => c.id === req.params.comment_id);
  if (commentIdx === -1) return res.status(404).json({ detail: 'Comment not found' });

  const comment = post.comments[commentIdx];
  post.comments.splice(commentIdx, 1);
  saveDb();

  logAdminAction(req.user, 'DELETE_COMMENT', 'comment', req.params.comment_id, `Deleted comment by ${comment.user_name}: ${comment.text.slice(0, 40)}`);
  res.json({ message: 'Comment deleted successfully' });
});

// Admin Churches
app.get('/api/admin/churches', requireAdmin, (req, res) => {
  const search = (req.query.search || '').toLowerCase();
  const { status } = req.query;
  let list = [...db.churches];

  if (search) {
    list = list.filter(c => c.name.toLowerCase().includes(search));
  }
  if (status) {
    list = list.filter(c => c.status === status);
  }

  const mapped = list.map(c => {
    const creator = db.users.find(u => u._id === c.created_by);
    return {
      ...c,
      followers_count: (c.followers || []).length,
      creator_name: creator ? creator.name : ''
    };
  });

  res.json({ churches: mapped, total: mapped.length });
});

app.put('/api/admin/churches/:church_id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ detail: 'Status is required' });

  const church = db.churches.find(c => c._id === req.params.church_id);
  if (!church) return res.status(404).json({ detail: 'Church not found' });

  church.status = status;
  saveDb();

  logAdminAction(req.user, `CHURCH_${status.toUpperCase()}`, 'church', church._id, `${status.charAt(0).toUpperCase() + status.slice(1)} church: ${church.name}`);
  res.json({ message: `Church status set to ${status}` });
});

app.delete('/api/admin/churches/:church_id', requireAdmin, (req, res) => {
  const idx = db.churches.findIndex(c => c._id === req.params.church_id);
  if (idx === -1) return res.status(404).json({ detail: 'Church not found' });

  db.churches.splice(idx, 1);
  saveDb();
  res.json({ message: 'Church deleted' });
});

// Admin Events
app.get('/api/admin/events', requireAdmin, (req, res) => {
  const search = (req.query.search || '').toLowerCase();
  let list = [...db.events];

  if (search) {
    list = list.filter(e => e.title.toLowerCase().includes(search));
  }

  const mapped = list.map(e => {
    const attendeesCount = db.event_registrations.filter(r => r.event_id === e._id).length;
    const creator = db.users.find(u => u._id === e.created_by);
    return {
      ...e,
      attendees_count: attendeesCount,
      creator_name: creator ? creator.name : ''
    };
  });

  res.json({ events: mapped, total: mapped.length });
});

app.delete('/api/admin/events/:event_id', requireAdmin, (req, res) => {
  const idx = db.events.findIndex(e => e._id === req.params.event_id);
  if (idx === -1) return res.status(404).json({ detail: 'Event not found' });

  const event = db.events[idx];
  db.events.splice(idx, 1);
  db.event_registrations = db.event_registrations.filter(r => r.event_id !== req.params.event_id);
  saveDb();

  logAdminAction(req.user, 'DELETE_EVENT', 'event', req.params.event_id, `Deleted event: ${event.title}`);
  res.json({ message: 'Event and registrations deleted' });
});

// Admin Products
app.get('/api/admin/products', requireAdmin, (req, res) => {
  const search = (req.query.search || '').toLowerCase();
  let list = [...db.products];

  if (search) {
    list = list.filter(p => p.title.toLowerCase().includes(search));
  }

  const mapped = list.map(p => {
    const creator = db.users.find(u => u._id === p.created_by);
    return {
      ...p,
      seller_name: creator ? creator.name : ''
    };
  });

  res.json({ products: mapped, total: mapped.length });
});

app.delete('/api/admin/products/:product_id', requireAdmin, (req, res) => {
  const idx = db.products.findIndex(p => p._id === req.params.product_id);
  if (idx === -1) return res.status(404).json({ detail: 'Product not found' });

  const prod = db.products[idx];
  db.products.splice(idx, 1);
  saveDb();

  logAdminAction(req.user, 'DELETE_PRODUCT', 'product', req.params.product_id, `Deleted product: ${prod.title}`);
  res.json({ message: 'Product deleted' });
});

// Admin Logs
app.get('/api/admin/logs', requireAdmin, (req, res) => {
  res.json({ logs: db.admin_logs, total: db.admin_logs.length });
});


// --- Bible Trivia Challenge Endpoints ---
app.post('/api/trivia/submit', authenticateToken, (req, res) => {
  const user = db.users.find(u => u._id === req.user._id);
  if (!user) return res.status(404).json({ detail: 'User not found' });

  const { points, difficulty, correctCount, totalQuestions } = req.body;
  
  // Initialize fields if they don't exist
  if (user.trivia_points === undefined) user.trivia_points = 0;
  if (!user.trivia_stats) {
    user.trivia_stats = {
      easyCompleted: 0,
      hardCompleted: 0,
      expertCompleted: 0,
      totalCorrect: 0,
      totalAttempted: 0
    };
  }

  // Award points
  user.trivia_points += Number(points || 0);

  // Update statistics
  user.trivia_stats.totalCorrect += Number(correctCount || 0);
  user.trivia_stats.totalAttempted += Number(totalQuestions || 0);

  if (difficulty === 'easy') {
    user.trivia_stats.easyCompleted = (user.trivia_stats.easyCompleted || 0) + 1;
  } else if (difficulty === 'hard') {
    user.trivia_stats.hardCompleted = (user.trivia_stats.hardCompleted || 0) + 1;
  } else if (difficulty === 'expert') {
    user.trivia_stats.expertCompleted = (user.trivia_stats.expertCompleted || 0) + 1;
  }

  saveDb();

  const { password_hash, ...safeUser } = user;
  res.json({
    message: 'Score submitted successfully',
    user: {
      ...safeUser,
      badges: getUserBadges(user),
      safe_intro_completed: hasCompletedSafeIntro(user)
    }
  });
});

app.get('/api/trivia/leaderboard', authenticateToken, (req, res) => {
  // Hardcoded initial points for seeded users to make the leaderboard alive and fun
  const seedPoints = {
    'user_sarah': 240,
    'user_marcus': 180,
    'user_emily': 320,
    'user_david': 110,
    'user_aiden': 150,
    'user_jasmine': 280
  };

  const leaderboard = db.users
    .map(u => {
      let pts = u.trivia_points;
      if (pts === undefined) {
        pts = seedPoints[u._id] || 0;
        u.trivia_points = pts; // save back to DB
      }
      
      let stats = u.trivia_stats;
      if (!stats) {
        stats = {
          easyCompleted: Math.ceil(pts / 30),
          hardCompleted: Math.ceil(pts / 50),
          expertCompleted: Math.ceil(pts / 80),
          totalCorrect: Math.ceil(pts / 10),
          totalAttempted: Math.ceil(pts / 10) + 3
        };
        u.trivia_stats = stats;
      }

      return {
        _id: u._id,
        name: u.name,
        username: u.username,
        profile_image: u.profile_image,
        denomination: u.denomination || 'Christian',
        is_verified: u.is_verified,
        trivia_points: pts,
        trivia_stats: stats
      };
    })
    .sort((a, b) => b.trivia_points - a.trivia_points)
    .slice(0, 15);

  res.json({ leaderboard });
});


// --- Bible Trivia Backend-Driven & Admin Endpoints ---

// Get 5 random questions for gameplay (difficulty-based)
app.get('/api/trivia/questions', authenticateToken, (req, res) => {
  const difficulty = req.query.difficulty || 'easy';
  const pool = db.trivia_questions.filter(q => q.difficulty === difficulty.toLowerCase());
  
  if (pool.length === 0) {
    return res.json({ questions: [] });
  }
  
  // Shuffle pool and select 5 random questions
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  res.json({ questions: shuffled.slice(0, 5) });
});

// Admin: Get all trivia questions
app.get('/api/admin/trivia', requireAdmin, (req, res) => {
  res.json({ trivia: db.trivia_questions || [] });
});

// Admin: Add a new trivia question
app.post('/api/admin/trivia', requireAdmin, (req, res) => {
  const { question, options, answer, explanation, difficulty } = req.body;
  if (!question || !options || !answer || !difficulty) {
    return res.status(400).json({ detail: 'Missing required trivia fields' });
  }
  if (!Array.isArray(options) || options.length !== 4) {
    return res.status(400).json({ detail: 'Options must be an array of 4 items' });
  }
  if (!options.map(o => o.trim()).includes(answer.trim())) {
    return res.status(400).json({ detail: 'Correct answer must be one of the options' });
  }

  const newQuestion = {
    _id: `q_custom_${Date.now()}`,
    question: question.trim(),
    options: options.map(o => o.trim()),
    answer: answer.trim(),
    explanation: (explanation || '').trim(),
    difficulty: difficulty.trim().toLowerCase(),
    created_at: new Date().toISOString()
  };

  db.trivia_questions.push(newQuestion);
  
  logAdminAction(req.user, 'create_trivia', 'trivia_question', newQuestion._id, `Added new ${difficulty} trivia question: ${question.substring(0, 30)}...`);
  
  saveDb();
  res.status(201).json(newQuestion);
});

// Admin: Edit an existing trivia question
app.put('/api/admin/trivia/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { question, options, answer, explanation, difficulty } = req.body;

  const q = db.trivia_questions.find(item => item._id === id);
  if (!q) {
    return res.status(404).json({ detail: 'Trivia question not found' });
  }

  if (question !== undefined) q.question = question.trim();
  if (options !== undefined) {
    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ detail: 'Options must be an array of 4 items' });
    }
    q.options = options.map(o => o.trim());
  }
  if (answer !== undefined) {
    q.answer = answer.trim();
  }
  if (!q.options.includes(q.answer)) {
    return res.status(400).json({ detail: 'Correct answer must be one of the options' });
  }

  if (explanation !== undefined) q.explanation = explanation.trim();
  if (difficulty !== undefined) q.difficulty = difficulty.trim().toLowerCase();

  logAdminAction(req.user, 'update_trivia', 'trivia_question', id, `Updated ${q.difficulty} trivia question: ${q.question.substring(0, 30)}...`);
  
  saveDb();
  res.json(q);
});

// Admin: Delete a trivia question
app.delete('/api/admin/trivia/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const index = db.trivia_questions.findIndex(q => q._id === id);
  if (index === -1) {
    return res.status(404).json({ detail: 'Trivia question not found' });
  }

  const deleted = db.trivia_questions.splice(index, 1)[0];
  logAdminAction(req.user, 'delete_trivia', 'trivia_question', id, `Deleted ${deleted.difficulty} trivia question: ${deleted.question.substring(0, 30)}...`);
  
  saveDb();
  res.json({ message: 'Trivia question deleted successfully' });
});


// --- Prayer Wall Endpoints ---
app.get('/api/prayers', authenticateToken, (req, res) => {
  const currentUserId = req.user._id;
  const enrichedPrayers = db.prayers.map(p => {
    let authorName = p.user_name;
    let authorUsername = p.user_username;
    let authorImage = p.user_image;
    let authorVerified = false;

    if (p.user_id && p.user_id !== 'anonymous') {
      const u = db.users.find(user => user._id === p.user_id);
      if (u) {
        authorName = u.name;
        authorUsername = u.username;
        authorImage = u.profile_image || '';
        authorVerified = u.is_verified || false;
      }
    } else {
      // It is anonymous
      authorName = 'Anonymous Sister/Brother';
      authorUsername = 'anonymous';
      authorImage = '';
      authorVerified = false;
    }

    // Enrich comments with live author details
    const comments = (p.comments || []).map(c => {
      const cu = db.users.find(user => user._id === c.user_id);
      return {
        ...c,
        user_name: cu ? cu.name : c.user_name,
        user_username: cu ? cu.username : c.user_username,
        user_image: cu ? cu.profile_image : c.user_image
      };
    });

    return {
      ...p,
      user_name: authorName,
      user_username: authorUsername,
      user_image: authorImage,
      is_verified: authorVerified,
      comments,
      is_praying: (p.prayers_users || []).includes(currentUserId)
    };
  });

  // Sort by latest created
  enrichedPrayers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(enrichedPrayers);
});

app.post('/api/prayers', authenticateToken, (req, res) => {
  const { title, content, category, is_anonymous } = req.body;
  if (!title || !content || !category) {
    return res.status(400).json({ detail: 'Title, content, and category are required' });
  }

  const user = db.users.find(u => u._id === req.user._id);
  if (!user) return res.status(404).json({ detail: 'User not found' });

  const newPrayer = {
    _id: 'prayer_' + uuidv4(),
    user_id: is_anonymous ? 'anonymous' : user._id,
    user_name: is_anonymous ? 'Anonymous Sister/Brother' : user.name,
    user_username: is_anonymous ? 'anonymous' : user.username,
    user_image: is_anonymous ? '' : (user.profile_image || ''),
    category,
    title,
    content,
    praying_count: 0,
    prayers_users: [],
    comments: [],
    created_at: new Date().toISOString()
  };

  db.prayers.unshift(newPrayer);

  // Award +10 trivia/faith points for sharing a prayer request
  if (user.trivia_points === undefined) user.trivia_points = 0;
  user.trivia_points += 10;

  saveDb();

  res.status(201).json({
    ...newPrayer,
    is_praying: false,
    user_points: user.trivia_points
  });
});

app.post('/api/prayers/:id/pray', authenticateToken, (req, res) => {
  const prayerId = req.params.id;
  const currentUserId = req.user._id;

  const prayer = db.prayers.find(p => p._id === prayerId);
  if (!prayer) return res.status(404).json({ detail: 'Prayer request not found' });

  const user = db.users.find(u => u._id === currentUserId);
  if (!user) return res.status(404).json({ detail: 'User not found' });

  if (!prayer.prayers_users) prayer.prayers_users = [];

  const idx = prayer.prayers_users.indexOf(currentUserId);
  let newlyPraying = false;

  if (idx > -1) {
    prayer.prayers_users.splice(idx, 1);
    prayer.praying_count = Math.max(0, (prayer.praying_count || 1) - 1);
  } else {
    prayer.prayers_users.push(currentUserId);
    prayer.praying_count = (prayer.praying_count || 0) + 1;
    newlyPraying = true;

    // Send notification to the prayer creator (if not anonymous)
    if (prayer.user_id && prayer.user_id !== 'anonymous' && prayer.user_id !== currentUserId) {
      createNotification(
        prayer.user_id,
        currentUserId,
        user.name,
        user.profile_image,
        'like', // reuse notification type or custom
        `${user.name} is lifting you up in prayer for "${prayer.title}"! 🙏`,
        prayer._id
      );
    }

    // Award current user +5 points for praying!
    if (user.trivia_points === undefined) user.trivia_points = 0;
    user.trivia_points += 5;
  }

  saveDb();

  res.json({
    _id: prayer._id,
    praying_count: prayer.praying_count,
    is_praying: newlyPraying,
    user_points: user.trivia_points
  });
});

app.post('/api/prayers/:id/comments', authenticateToken, (req, res) => {
  const prayerId = req.params.id;
  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ detail: 'Comment text is required' });
  }

  const prayer = db.prayers.find(p => p._id === prayerId);
  if (!prayer) return res.status(404).json({ detail: 'Prayer request not found' });

  const user = db.users.find(u => u._id === req.user._id);
  if (!user) return res.status(404).json({ detail: 'User not found' });

  if (!prayer.comments) prayer.comments = [];

  const newComment = {
    _id: 'comment_' + uuidv4(),
    user_id: user._id,
    user_name: user.name,
    user_username: user.username,
    user_image: user.profile_image || '',
    text: text.trim(),
    created_at: new Date().toISOString()
  };

  prayer.comments.push(newComment);

  // Send notification to prayer request creator if someone else leaves a word of encouragement
  if (prayer.user_id && prayer.user_id !== 'anonymous' && prayer.user_id !== user._id) {
    createNotification(
      prayer.user_id,
      user._id,
      user.name,
      user.profile_image,
      'comment',
      `${user.name} shared a word of encouragement on your prayer request! 🕊️`,
      prayer._id
    );
  }

  saveDb();

  res.json(prayer.comments);
});


// --- Multer Error Handler (returns JSON instead of HTML for upload errors) ---
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ detail: 'File too large. Maximum size is 10 MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ detail: 'Too many files. Only one file per request.' });
    }
    return res.status(400).json({ detail: `Upload error: ${err.message}` });
  }
  if (err && err.message && err.message.includes('Invalid file type')) {
    return res.status(415).json({ detail: err.message });
  }
  next(err);
});

// --- Serve React Frontend SPA ---
const BUILD_DIR = path.join(__dirname, 'frontend', 'build');

if (fs.existsSync(BUILD_DIR)) {
  // Serve static assets with cache control
  app.use('/static', express.static(path.join(BUILD_DIR, 'static'), { maxAge: '1y' }));
  
  // Serve any other standalone files in build folder (like favicon.ico, logo.png, manifest.json)
  app.use(express.static(BUILD_DIR));

  // Catch-all: Send index.html for client-side routing on any non-API request
  app.get('*', (req, res) => {
    res.sendFile(path.join(BUILD_DIR, 'index.html'));
  });
  console.log('Production SPA delivery configured from:', BUILD_DIR);
} else {
  // Fallback if not compiled yet
  app.get('*', (req, res) => {
    res.status(200).send('Please wait, building the frontend application...');
  });
  console.log('Warning: Frontend build folder not found at', BUILD_DIR, '. Build required.');
}

// Start Server
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;
