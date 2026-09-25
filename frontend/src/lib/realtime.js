import { supabase } from '@/lib/supabase';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Generic Supabase Realtime channel subscription.
 * Returns an unsubscribe function for useEffect cleanup.
 */
export function subscribeToChannel(channelName, callback, filter = null) {
  const channelConfig = {
    config: {
      broadcast: { self: false },
      presence: { key: '' },
    },
  };

  const channel = supabase.channel(channelName, channelConfig);

  const subscription = channel
    .on('postgres_changes', { event: '*', schema: 'public', filter }, (payload) => {
      if (IS_DEV) {
        console.log(`[Realtime] ${channelName}:`, payload.eventType, payload.new?.id || payload.old?.id);
      }
      callback(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to new messages in a specific conversation.
 */
export function subscribeToMessages(conversationId, onNewMessage) {
  return subscribeToChannel(
    `messages:${conversationId}`,
    (payload) => {
      if (payload.eventType === 'INSERT') {
        onNewMessage(payload.new);
      }
    },
    { column: 'conversation_id', value: conversationId }
  );
}

/**
 * Subscribe to new notifications for a user.
 */
export function subscribeToNotifications(userId, onNewNotification) {
  return subscribeToChannel(
    `notifications:${userId}`,
    (payload) => {
      if (payload.eventType === 'INSERT') {
        onNewNotification(payload.new);
      }
    },
    { column: 'recipient_id', value: userId }
  );
}

/**
 * Subscribe to prayer wall updates (new prayers, pray count changes).
 */
export function subscribeToPrayerUpdates(onPrayerUpdate) {
  return subscribeToChannel(
    'prayers:global',
    (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        onPrayerUpdate(payload);
      }
    }
  );
}

/**
 * Subscribe to like/unlike events on a specific post.
 */
export function subscribeToPostLikes(postId, onLikeUpdate) {
  return subscribeToChannel(
    `post-likes:${postId}`,
    (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
        onLikeUpdate(payload);
      }
    }
  );
}

/**
 * Subscribe to new comments on a specific post.
 */
export function subscribeToComments(postId, onNewComment) {
  return subscribeToChannel(
    `post-comments:${postId}`,
    (payload) => {
      if (payload.eventType === 'INSERT') {
        onNewComment(payload.new);
      }
    }
  );
}