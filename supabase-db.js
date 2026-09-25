/**
 * @module supabase-db
 * @description Server-side Supabase database layer for CrossCrafted.
 * Provides a drop-in replacement for the in-memory db operations.
 * Uses the Supabase service role key for admin-level access.
 *
 * All functions return promises. Error handling is the caller's responsibility.
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('[Supabase DB] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  console.warn('[Supabase DB] Falling back to in-memory storage.');
}

// Admin client bypasses RLS
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ═══════════════════════════════════════════════════════════
// Helper: Resolve ID (legacy string or UUID)
// ═══════════════════════════════════════════════════════════

async function resolveUserId(idOrLegacy) {
  // Try UUID first (Supabase primary key)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrLegacy)) {
    const { data } = await sb.from('users').select('id, legacy_id').eq('id', idOrLegacy).single();
    return data?.id || null;
  }
  // Try legacy_id
  const { data } = await sb.from('users').select('id, legacy_id').eq('legacy_id', idOrLegacy).single();
  return data?.id || null;
}

async function resolveId(table, idOrLegacy) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrLegacy)) {
    return idOrLegacy;
  }
  const { data } = await sb.from(table).select('id').eq('legacy_id', idOrLegacy).single();
  return data?.id || idOrLegacy;
}

function generateLegacyId(prefix) {
  return `${prefix}_${uuidv4().slice(0, 8)}`;
}

// ═══════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════

const users = {
  async findByEmail(email) {
    const { data } = await sb.from('users').select('*').ilike('email', email).single();
    return data || null;
  },

  async findByUsername(username) {
    const { data } = await sb.from('users').select('*').ilike('username', username).single();
    return data || null;
  },

  async findById(id) {
    const resolvedId = await resolveId('users', id);
    const { data } = await sb.from('users').select('*').eq('id', resolvedId).single();
    return data || null;
  },

  async findAll(opts = {}) {
    let query = sb.from('users').select('*');
    if (opts.role) query = query.eq('role', opts.role);
    if (opts.status) query = query.eq('status', opts.status);
    if (opts.search) {
      query = query.or(`name.ilike.%${opts.search}%,username.ilike.%${opts.search}%,email.ilike.%${opts.search}%`);
    }
    if (opts.limit) query = query.limit(opts.limit);
    if (opts.offset) query = query.range(opts.offset, opts.offset + (opts.limit || 20) - 1);
    const { data } = await query.order('created_at', { ascending: false });
    return data || [];
  },

  async create(userData) {
    const id = userData.id || uuidv4();
    const legacyId = userData.legacy_id || userData._id || generateLegacyId('user');
    const { password_hash, _id, ...safeFields } = userData;

    const insertData = {
      id,
      legacy_id: legacyId,
      ...safeFields,
    };

    // Map old field names to new schema
    if (insertData.faith_belief) insertData.denomination = insertData.faith_belief;
    if (insertData.faith_journey) insertData.faith_journey_status = insertData.faith_journey;

    const { data, error } = await sb.from('users').insert(insertData).select('*').single();
    if (error) throw error;
    return { ...data, _id: data.id || legacyId, legacy_id: legacyId };
  },

  async update(id, updates) {
    const resolvedId = await resolveId('users', id);
    const { password_hash, _id, id: __, legacy_id: __l, ...safeUpdates } = updates;
    const { data, error } = await sb.from('users').update(safeUpdates).eq('id', resolvedId).select('*').single();
    if (error) throw error;
    return { ...data, _id: data.id || data.legacy_id };
  },

  async count() {
    const { count, error } = await sb.from('users').select('*', { count: 'exact', head: true });
    return error ? 0 : count || 0;
  }
};

// ═══════════════════════════════════════════════════════════
// POSTS
// ═══════════════════════════════════════════════════════════

const posts = {
  async findAll(currentUserId = null) {
    const { data } = await sb.from('posts').select('*').order('created_at', { ascending: false });

    const enriched = await Promise.all((data || []).map(async (post) => {
      const author = await users.findById(post.user_id);
      const likesArr = post.likes || [];
      return {
        ...post,
        _id: post.id || post.legacy_id,
        user_name: author?.name || post.user_name || '',
        user_username: author?.username || '',
        user_image: author?.profile_image || '',
        is_verified: author?.is_verified || false,
        likes_count: likesArr.length,
        comments_count: 0, // Will be fetched from comments table
        is_liked: currentUserId ? likesArr.includes(currentUserId) : false,
        is_saved: false,
      };
    }));

    // Fetch comment counts
    for (const post of enriched) {
      const { count } = await sb.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
      post.comments_count = count || 0;
    }

    return enriched;
  },

  async findById(postId) {
    const resolvedId = await resolveId('posts', postId);
    const { data } = await sb.from('posts').select('*').eq('id', resolvedId).single();
    return data || null;
  },

  async create(postData) {
    const id = uuidv4();
    const legacyId = generateLegacyId('post');
    const { user_id, content_text, image_url, video_url } = postData;

    const { data, error } = await sb.from('posts').insert({
      id,
      legacy_id: legacyId,
      user_id,
      content_text,
      image_url: image_url || '',
      video_url: video_url || '',
      likes: [],
    }).select('*').single();

    if (error) throw error;
    return { ...data, _id: data.id || legacyId };
  },

  async toggleLike(postId, userId) {
    const resolvedId = await resolveId('posts', postId);
    const post = await this.findById(resolvedId);
    if (!post) return null;

    const likes = post.likes || [];
    const idx = likes.indexOf(userId);

    if (idx > -1) {
      likes.splice(idx, 1);
    } else {
      likes.push(userId);
    }

    const { data, error } = await sb.from('posts').update({ likes }).eq('id', resolvedId).select('*').single();
    if (error) throw error;
    return { ...data, _id: data.id || data.legacy_id };
  },

  async savePost(postId, userId) {
    const resolvedId = await resolveId('users', userId);
    const user = await users.findById(resolvedId);
    if (!user) return;

    const saved = user.saved_posts || [];
    if (!saved.includes(postId)) {
      saved.push(postId);
      await users.update(resolvedId, { saved_posts: saved });
    }
  },

  async unsavePost(postId, userId) {
    const resolvedId = await resolveId('users', userId);
    const user = await users.findById(resolvedId);
    if (!user) return;

    const saved = (user.saved_posts || []).filter(id => id !== postId);
    await users.update(resolvedId, { saved_posts: saved });
  },

  async getSavedPosts(userId) {
    const user = await users.findById(userId);
    if (!user) return [];
    const savedIds = user.saved_posts || [];
    if (savedIds.length === 0) return [];

    const allPosts = await this.findAll(userId);
    return allPosts.filter(p => savedIds.includes(p.id) || savedIds.includes(p._id));
  },

  async getByUser(userId) {
    const { data } = await sb.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []).map(p => ({ ...p, _id: p.id || p.legacy_id }));
  },

  async delete(postId) {
    const resolvedId = await resolveId('posts', postId);
    await sb.from('comments').delete().eq('post_id', resolvedId);
    const { error } = await sb.from('posts').delete().eq('id', resolvedId);
    if (error) throw error;
  }
};

// ═══════════════════════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════════════════════

const comments = {
  async create(postId, userId, text, userName, userUsername, userImage) {
    const id = uuidv4();
    const resolvedPostId = await resolveId('posts', postId);

    const { data, error } = await sb.from('comments').insert({
      id,
      post_id: resolvedPostId,
      user_id: userId,
      text,
    }).select('*').single();

    if (error) throw error;
    return {
      ...data,
      id: data.id,
      user_name: userName,
      user_username: userUsername,
      user_image: userImage,
    };
  },

  async delete(commentId) {
    const { error } = await sb.from('comments').delete().eq('id', commentId);
    if (error) throw error;
  },

  async deleteByLegacyId(legacyId) {
    const { data } = await sb.from('comments').select('id').eq('id', legacyId).single();
    if (data) {
      await sb.from('comments').delete().eq('id', data.id);
    }
  },

  async getByPost(postId) {
    const resolvedPostId = await resolveId('posts', postId);
    const { data } = await sb.from('comments').select('*').eq('post_id', resolvedPostId).order('created_at', { ascending: true });
    return data || [];
  }
};

// ═══════════════════════════════════════════════════════════
// CHURCHES
// ═══════════════════════════════════════════════════════════

const churches = {
  async findAll(opts = {}) {
    let query = sb.from('churches').select('*');
    if (opts.state) query = query.ilike('state', `%${opts.state}%`);
    if (opts.language) query = query.contains('languages', opts.language);
    if (opts.search) {
      query = query.or(`name.ilike.%${opts.search}%,city.ilike.%${opts.search}%,description.ilike.%${opts.search}%`);
    }
    const { data } = await query.order('created_at', { ascending: false });
    return (data || []).map(c => ({ ...c, _id: c.id || c.legacy_id }));
  },

  async findById(churchId) {
    const resolvedId = await resolveId('churches', churchId);
    const { data } = await sb.from('churches').select('*').eq('id', resolvedId).single();
    return data || null;
  },

  async create(churchData) {
    const id = uuidv4();
    const legacyId = generateLegacyId('church');
    const { data, error } = await sb.from('churches').insert({
      id,
      legacy_id: legacyId,
      ...churchData,
    }).select('*').single();
    if (error) throw error;
    return { ...data, _id: data.id || legacyId };
  },

  async update(churchId, updates) {
    const resolvedId = await resolveId('churches', churchId);
    const { data, error } = await sb.from('churches').update(updates).eq('id', resolvedId).select('*').single();
    if (error) throw error;
    return { ...data, _id: data.id || data.legacy_id };
  },

  async delete(churchId) {
    const resolvedId = await resolveId('churches', churchId);
    const { error } = await sb.from('churches').delete().eq('id', resolvedId);
    if (error) throw error;
  },

  async toggleFollow(churchId, userId, follow = true) {
    const resolvedId = await resolveId('churches', churchId);
    const church = await this.findById(resolvedId);
    if (!church) return;

    const followers = church.followers || [];
    if (follow) {
      if (!followers.includes(userId)) followers.push(userId);
    } else {
      const idx = followers.indexOf(userId);
      if (idx > -1) followers.splice(idx, 1);
    }

    await sb.from('churches').update({ followers }).eq('id', resolvedId);
  },

  async getByUser(userId) {
    const { data } = await sb.from('churches').select('*').eq('created_by', userId).single();
    return data || null;
  },

  async getPosts(churchId) {
    const church = await this.findById(churchId);
    if (!church) return [];
    return posts.getByUser(church.created_by);
  },

  async getEvents(churchId) {
    const resolvedId = await resolveId('churches', churchId);
    const { data } = await sb.from('events').select('*').eq('church_id', resolvedId).order('date', { ascending: true });
    return (data || []).map(e => ({ ...e, _id: e.id || e.legacy_id }));
  }
};

// ═══════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════

const events = {
  async findAll(opts = {}) {
    let query = sb.from('events').select('*');
    if (opts.state) query = query.ilike('state', `%${opts.state}%`);
    if (opts.language) query = query.contains('languages', opts.language);
    if (opts.search) {
      query = query.or(`title.ilike.%${opts.search}%,location.ilike.%${opts.search}%,description.ilike.%${opts.search}%`);
    }
    const { data } = await query.order('date', { ascending: true });

    const results = await Promise.all((data || []).map(async (event) => {
      const { count: attendeesCount } = await sb.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', event.id);
      const isRegistered = opts.currentUserId
        ? !!(await sb.from('event_registrations').select('id').eq('event_id', event.id).eq('user_id', opts.currentUserId).single()).data)
        : false;

      return {
        ...event,
        _id: event.id || event.legacy_id,
        attendees_count: attendeesCount || 0,
        is_registered: isRegistered,
      };
    }));

    return results;
  },

  async findById(eventId) {
    const resolvedId = await resolveId('events', eventId);
    const { data } = await sb.from('events').select('*').eq('id', resolvedId).single();
    if (!data) return null;

    const { count: attendeesCount } = await sb.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', resolvedId);
    const { count: regsCount } = await sb.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', resolvedId);

    return {
      ...data,
      _id: data.id || data.legacy_id,
      attendees_count: attendeesCount || 0,
    };
  },

  async create(eventData) {
    const id = uuidv4();
    const legacyId = generateLegacyId('event');
    const { data, error } = await sb.from('events').insert({
      id,
      legacy_id: legacyId,
      ...eventData,
    }).select('*').single();
    if (error) throw error;
    return { ...data, _id: data.id || legacyId };
  },

  async delete(eventId) {
    const resolvedId = await resolveId('events', eventId);
    await sb.from('event_registrations').delete().eq('event_id', resolvedId);
    const { error } = await sb.from('events').delete().eq('id', resolvedId);
    if (error) throw error;
  },

  async register(eventId, userId) {
    const resolvedId = await resolveId('events', eventId);
    const { data, error } = await sb.from('event_registrations').insert({
      user_id: userId,
      event_id: resolvedId,
    }).select('*').single();
    if (error) throw error;
    return data;
  },

  async unregister(eventId, userId) {
    const resolvedId = await resolveId('events', eventId);
    const { error } = await sb.from('event_registrations').delete()
      .eq('event_id', resolvedId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async isRegistered(eventId, userId) {
    const resolvedId = await resolveId('events', eventId);
    const { data } = await sb.from('event_registrations').select('id')
      .eq('event_id', resolvedId)
      .eq('user_id', userId)
      .single();
    return !!data;
  },

  async getAttendees(eventId) {
    const resolvedId = await resolveId('events', eventId);
    const { data } = await sb.from('event_registrations').select('user_id').eq('event_id', resolvedId);
    const userIds = (data || []).map(r => r.user_id);
    if (userIds.length === 0) return [];

    const { data: usersData } = await sb.from('users').select('id, name, username, profile_image').in('id', userIds);
    return usersData || [];
  }
};

// ═══════════════════════════════════════════════════════════
// PRODUCTS / MARKETPLACE
// ═══════════════════════════════════════════════════════════

const products = {
  async findAll(opts = {}) {
    let query = sb.from('marketplace_items').select('*').eq('status', 'active');
    if (opts.search) {
      query = query.or(`title.ilike.%${opts.search}%,description.ilike.%${opts.search}%`);
    }
    if (opts.category) query = query.eq('category', opts.category);
    if (opts.city) query = query.ilike('city', `%${opts.city}%`);

    const { data } = await query.order('created_at', { ascending: false });

    return await Promise.all((data || []).map(async (p) => {
      const creator = await users.findById(p.seller_id);
      return {
        ...p,
        _id: p.id || p.legacy_id,
        seller_name: creator?.name || p.seller_name || '',
        seller_username: creator?.username || p.seller_username || '',
        seller_image: creator?.profile_image || p.seller_image || '',
        creator_name: creator?.name || '',
      };
    }));
  },

  async findById(productId) {
    const resolvedId = await resolveId('marketplace_items', productId);
    const { data } = await sb.from('marketplace_items').select('*').eq('id', resolvedId).single();
    if (!data) return null;

    const creator = await users.findById(data.seller_id);
    return {
      ...data,
      _id: data.id || data.legacy_id,
      seller_name: creator?.name || '',
      seller_username: creator?.username || '',
      seller_image: creator?.profile_image || '',
      seller_bio: creator?.bio || '',
      seller_email: creator?.email || '',
      seller_created_at: creator?.created_at,
    };
  },

  async create(productData) {
    const id = uuidv4();
    const legacyId = generateLegacyId('prod');
    const { data, error } = await sb.from('marketplace_items').insert({
      id,
      legacy_id: legacyId,
      ...productData,
    }).select('*').single();
    if (error) throw error;
    return { ...data, _id: data.id || legacyId };
  },

  async update(productId, updates) {
    const resolvedId = await resolveId('marketplace_items', productId);
    const { data, error } = await sb.from('marketplace_items').update(updates).eq('id', resolvedId).select('*').single();
    if (error) throw error;
    return { ...data, _id: data.id || data.legacy_id };
  },

  async delete(productId) {
    const resolvedId = await resolveId('marketplace_items', productId);
    const { error } = await sb.from('marketplace_items').delete().eq('id', resolvedId);
    if (error) throw error;
  },

  async getByUser(userId) {
    const { data } = await sb.from('marketplace_items').select('*').eq('seller_id', userId).order('created_at', { ascending: false });
    return (data || []).map(p => ({ ...p, _id: p.id || p.legacy_id }));
  }
};

// ═══════════════════════════════════════════════════════════
// PRAYERS
// ═══════════════════════════════════════════════════════════

const prayers = {
  async findAll() {
    const { data } = await sb.from('prayers').select('*').order('created_at', { ascending: false });
    return await Promise.all((data || []).map(async (p) => {
      const author = await users.findById(p.user_id);
      return {
        ...p,
        _id: p.id || p.legacy_id,
        user_name: author?.name || '',
        user_username: author?.username || '',
        user_image: author?.profile_image || '',
      };
    }));
  },

  async create(prayerData) {
    const id = uuidv4();
    const legacyId = generateLegacyId('prayer');
    const { data, error } = await sb.from('prayers').insert({
      id,
      legacy_id: legacyId,
      ...prayerData,
    }).select('*').single();
    if (error) throw error;
    return { ...data, _id: data.id || legacyId };
  },

  async togglePray(prayerId, userId) {
    const resolvedId = await resolveId('prayers', prayerId);
    const prayer = await sb.from('prayers').select('*').eq('id', resolvedId).single();
    if (!prayer.data) return null;

    const prayersUsers = prayer.data.prayers_users || [];
    const count = prayer.data.praying_count || 0;

    if (!prayersUsers.includes(userId)) {
      prayersUsers.push(userId);
      await sb.from('prayers').update({
        prayers_users: prayersUsers,
        praying_count: count + 1,
      }).eq('id', resolvedId);
    }

    return { ...prayer.data, _id: prayer.data.id || prayer.data.legacy_id, praying_count: count + 1 };
  },

  async addComment(prayerId, userId, text, userName, userUsername, userImage) {
    const { data, error } = await sb.from('prayer_comments').insert({
      prayer_id: prayerId,
      user_id: userId,
      text,
    }).select('*').single();
    if (error) throw error;
    return { ...data, user_name: userName, user_username: userUsername, user_image: userImage };
  },

  async getComments(prayerId) {
    const resolvedId = await resolveId('prayers', prayerId);
    const { data } = await sb.from('prayer_comments').select('*').eq('prayer_id', resolvedId).order('created_at', { ascending: true });
    return data || [];
  }
};

// ═══════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

const notifications = {
  async create({ recipientId, senderId, senderName, senderImage, type, message, refId = '' }) {
    if (recipientId === senderId) return;
    const id = uuidv4();
    const legacyId = generateLegacyId('notif');

    const { error } = await sb.from('notifications').insert({
      id,
      legacy_id: legacyId,
      recipient_id: recipientId,
      sender_id,
      sender_name: senderName,
      sender_image: senderImage || '',
      type,
      message,
      ref_id: refId,
    });
    if (error) console.error('[DB] Notification create error:', error.message);
  },

  async findByUser(userId) {
    const { data } = await sb.from('notifications').select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    return (data || []).map(n => ({
      ...n,
      _id: n.id || n.legacy_id,
      sender_id: n.sender_id,
    }));
  },

  async getUnreadCount(userId) {
    const { count, error } = await sb.from('notifications').select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);
    return error ? 0 : count || 0;
  },

  async markAllRead(userId) {
    const { error } = await sb.from('notifications').update({ read: true })
      .eq('recipient_id', userId)
      .eq('read', false);
    if (error) console.error('[DB] Mark all read error:', error.message);
  },

  async markRead(notifId) {
    const { error } = await sb.from('notifications').update({ read: true }).eq('id', notifId);
    if (error) console.error('[DB] Mark read error:', error.message);
  }
};

// ═══════════════════════════════════════════════════════════
// CONVERSATIONS & MESSAGES
// ═══════════════════════════════════════════════════════════

const conversations = {
  async findByUser(userId) {
    const { data: participants } = await sb.from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (!participants || participants.length === 0) return [];

    const convoIds = participants.map(p => p.conversation_id);
    const results = [];

    for (const convoId of convoIds) {
      const { data: parts } = await sb.from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', convoId);

      const otherUserId = parts?.find(p => p.user_id !== userId)?.user_id;
      if (!otherUserId) continue;

      const other = await users.findById(otherUserId);
      const { data: lastMsg } = await sb.from('messages')
        .select('*')
        .eq('conversation_id', convoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const unreadCount = await sb.from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', convoId)
        .eq('is_read', false)
        .neq('sender_id', userId);

      results.push({
        _id: convoId,
        other_user: other ? {
          _id: other.id,
          name: other.name,
          username: other.username,
          profile_image: other.profile_image,
          is_verified: other.is_verified,
        } : null,
        last_message: lastMsg?.content || '',
        last_message_at: lastMsg?.created_at || '',
        unread_count: unreadCount.count || 0,
      });
    }

    results.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
    return results;
  },

  async findOrCreate(userId, otherUserId) {
    // Check existing
    const { data: myConvos } = await sb.from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    for (const { conversation_id } of myConvos || []) {
      const { data: parts } = await sb.from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversation_id);

      if (parts?.some(p => p.user_id === otherUserId)) {
        return { conversation_id, isNew: false };
      }
    }

    // Create new
    const { data, error } = await sb.from('conversations').insert({}).select('id').single();
    if (error) throw error;

    await sb.from('conversation_participants').insert([
      { conversation_id: data.id, user_id: userId },
      { conversation_id: data.id, user_id: otherUserId },
    ]);

    return { conversation_id: data.id, isNew: true };
  },

  async getMessages(convoId) {
    const { data } = await sb.from('messages')
      .select('*')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true });
    return (data || []).map(m => ({
      ...m,
      _id: m.id,
    }));
  },

  async sendMessage(convoId, senderId, content, messageType = 'text', imageUrl = '') {
    const { data, error } = await sb.from('messages').insert({
      conversation_id: convoId,
      sender_id: senderId,
      content,
      message_type: messageType,
      image_url: imageUrl,
    }).select('*').single();
    if (error) throw error;
    return data;
  },

  async getUnreadCount(userId) {
    const { data: participants } = await sb.from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (!participants || participants.length === 0) return 0;

    const convoIds = participants.map(p => p.conversation_id);
    let total = 0;
    for (const cid of convoIds) {
      const { count } = await sb.from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', cid)
        .eq('is_read', false)
        .neq('sender_id', userId);
      total += count || 0;
    }
    return total;
  }
};

// ═══════════════════════════════════════════════════════════
// TRIVIA
// ═══════════════════════════════════════════════════════════

const trivia = {
  async getQuestions(difficulty) {
    let query = sb.from('trivia_questions').select('*');
    if (difficulty) query = query.eq('difficulty', difficulty);
    const { data } = await query.order('created_at', { ascending: true });
    return (data || []).map(q => ({ ...q, _id: q.id || q.legacy_id }));
  },

  async submitScore(userId, difficulty, score, total, timeTaken) {
    const { error } = await sb.from('trivia_scores').insert({
      user_id: userId,
      difficulty,
      score,
      total_questions: total,
      time_taken: timeTaken,
    });
    if (error) console.error('[DB] Trivia score error:', error.message);
  },

  async getLeaderboard() {
    const { data } = await sb.from('trivia_scores').select('*')
      .order('score', { ascending: false })
      .limit(20);
    return data || [];
  },

  async createQuestion(questionData) {
    const id = uuidv4();
    const legacyId = generateLegacyId('q');
    const { data, error } = await sb.from('trivia_questions').insert({
      id,
      legacy_id: legacyId,
      ...questionData,
    }).select('*').single();
    if (error) throw error;
    return { ...data, _id: data.id || legacyId };
  },

  async updateQuestion(questionId, updates) {
    const resolvedId = await resolveId('trivia_questions', questionId);
    const { data, error } = await sb.from('trivia_questions').update(updates).eq('id', resolvedId).select('*').single();
    if (error) throw error;
    return data;
  },

  async deleteQuestion(questionId) {
    const resolvedId = await resolveId('trivia_questions', questionId);
    const { error } = await sb.from('trivia_questions').delete().eq('id', resolvedId);
    if (error) throw error;
  },

  async count() {
    const { count } = await sb.from('trivia_questions').select('*', { count: 'exact', head: true });
    return count || 0;
  }
};

// ═══════════════════════════════════════════════════════════
// REPORTS & ADMIN
// ═══════════════════════════════════════════════════════════

const reports = {
  async create(reportData) {
    const { data, error } = await sb.from('reports').insert({
      legacy_id: generateLegacyId('report'),
      ...reportData,
    }).select('*').single();
    if (error) throw error;
    return { ...data, _id: data.id || data.legacy_id };
  },

  async findAll() {
    const { data } = await sb.from('reports').select('*').order('created_at', { ascending: false });
    return (data || []).map(r => ({ ...r, _id: r.id || r.legacy_id }));
  },

  async resolve(reportId) {
    const resolvedId = await resolveId('reports', reportId);
    const { error } = await sb.from('reports').update({ status: 'resolved' }).eq('id', resolvedId);
    if (error) throw error;
  }
};

const adminLogs = {
  async create(logData) {
    const { error } = await sb.from('admin_logs').insert(logData);
    if (error) console.error('[DB] Admin log error:', error.message);
  },

  async findAll(limit = 100) {
    const { data } = await sb.from('admin_logs').select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    return data || [];
  }
};

// ═══════════════════════════════════════════════════════════
// SEARCHES & BLOCKS
// ═══════════════════════════════════════════════════════════

const search = {
  async global(query, limit = 10) {
    const { data: usersData } = await sb.from('users').select('id, legacy_id, name, username, profile_image, bio, role, is_verified, city, state')
      .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(limit);

    return (usersData || []).map(u => ({
      ...u,
      _id: u.id || u.legacy_id,
    }));
  },

  async saveRecent(userId, queryText) {
    const { error } = await sb.from('recent_searches').insert({
      user_id: userId,
      query: queryText,
    });
    if (error) console.error('[DB] Save search error:', error.message);
  },

  async getRecent(userId) {
    const { data } = await sb.from('recent_searches').select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    return data || [];
  },

  async clearRecent(userId) {
    const { error } = await sb.from('recent_searches').delete().eq('user_id', userId);
    if (error) console.error('[DB] Clear searches error:', error.message);
  }
};

const blocks = {
  async block(blockerId, blockedId) {
    const { error } = await sb.from('user_blocks').insert({
      blocker_id: blockerId,
      blocked_id: blockedId,
    });
    if (error) console.error('[DB] Block error:', error.message);
  },

  async unblock(blockerId, blockedId) {
    const { error } = await sb.from('user_blocks').delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);
    if (error) console.error('[DB] Unblock error:', error.message);
  },

  async isBlocked(userId, otherId) {
    const { data } = await sb.from('user_blocks').select('id')
      .eq('blocker_id', userId)
      .eq('blocked_id', otherId)
      .single();
    return !!data;
  }
};

// ═══════════════════════════════════════════════════════════
// BFF / DATING
// ═══════════════════════════════════════════════════════════

const bff = {
  async swipe(swiperId, swipedId, direction) {
    const { error } = await sb.from('bff_swipes').insert({
      swiper_id: swiperId,
      swiped_id: swipedId,
      direction,
    });
    if (error) console.error('[DB] Swipe error:', error.message);

    // Check for mutual like
    if (direction === 'right') {
      const { data } = await sb.from('bff_swipes').select('id')
        .eq('swiper_id', swipedId)
        .eq('swiped_id', swiperId)
        .eq('direction', 'right')
        .single();

      if (data) {
        await sb.from('bff_connections').insert({
          user1_id: swiperId,
          user2_id: swipedId,
        });
        return { matched: true };
      }
    }
    return { matched: false };
  },

  async getConnections(userId) {
    const { data } = await sb.from('bff_connections').select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    return (data || []).map(c => ({
      ...c,
      _id: c.id,
      other_user_id: c.user1_id === userId ? c.user2_id : c.user1_id,
    }));
  },

  async getDiscoverUsers(userId, limit = 10) {
    // Get users not yet swiped on, excluding self and blocked
    const { data: swiped } = await sb.from('bff_swipes').select('swiped_id')
      .eq('swiper_id', userId);

    const swipedIds = (swiped || []).map(s => s.swiped_id);
    swipedIds.push(userId);

    const { data } = await sb.from('users').select('id, name, username, profile_image, bio, city, state, denomination, interests, looking_for, age, gender')
      .not('id', 'in', `(${swipedIds.join(',')})`)
    .neq('status', 'rejected')
    .limit(limit);

    return (data || []).map(u => ({ ...u, _id: u.id }));
  }
};

// ═══════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════

module.exports = {
  users,
  posts,
  comments,
  churches,
  events,
  products,
  prayers,
  notifications,
  conversations,
  trivia,
  reports,
  adminLogs,
  search,
  blocks,
  bff,
  resolveUserId,
  resolveId,
  generateLegacyId,
  sb, // Expose raw client for special queries
};