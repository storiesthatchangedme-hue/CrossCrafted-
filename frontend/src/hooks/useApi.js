import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ═══════════════════════════════════════════════════════════
// Query Keys Factory
// ═══════════════════════════════════════════════════════════

export const queryKeys = {
  posts: ['posts'],
  post: (id) => ['posts', id],
  user: (id) => ['users', id],
  prayers: ['prayers'],
  conversations: ['conversations'],
  conversationMessages: (id) => ['conversations', id, 'messages'],
  notifications: ['notifications'],
  events: (filters) => ['events', filters],
  products: (search) => ['products', search],
  churches: (filters) => ['churches', filters],
  explore: ['explore'],
  triviaQuestions: (difficulty) => ['trivia', 'questions', difficulty],
  triviaLeaderboard: ['trivia', 'leaderboard'],
};

// ═══════════════════════════════════════════════════════════
// Query Hooks
// ═══════════════════════════════════════════════════════════

export function useFeed() {
  return useQuery({
    queryKey: queryKeys.posts,
    queryFn: async () => {
      const { data } = await api.get('/api/posts');
      return data;
    },
  });
}

export function useUser(userId) {
  return useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: async () => {
      const { data } = await api.get(`/api/users/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
}

export function usePrayers() {
  return useQuery({
    queryKey: queryKeys.prayers,
    queryFn: async () => {
      const { data } = await api.get('/api/prayers');
      return data;
    },
  });
}

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: async () => {
      const { data } = await api.get('/api/conversations');
      return data.conversations;
    },
  });
}

export function useConversationMessages(convoId) {
  return useQuery({
    queryKey: queryKeys.conversationMessages(convoId),
    queryFn: async () => {
      const { data } = await api.get(`/api/conversations/${convoId}/messages`);
      return data.messages || data;
    },
    enabled: !!convoId,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const { data } = await api.get('/api/notifications');
      return data;
    },
  });
}

export function useEvents(filters = {}) {
  const params = new URLSearchParams();
  if (filters.state) params.append('state', filters.state);
  if (filters.language) params.append('language', filters.language);
  if (filters.search) params.append('search', filters.search);

  return useQuery({
    queryKey: queryKeys.events(filters),
    queryFn: async () => {
      const qs = params.toString();
      const { data } = await api.get(`/api/events${qs ? `?${qs}` : ''}`);
      return data;
    },
  });
}

export function useProducts(search = '') {
  return useQuery({
    queryKey: queryKeys.products(search),
    queryFn: async () => {
      const { data } = await api.get(`/api/products${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      return data;
    },
  });
}

export function useChurches(filters = {}) {
  const params = new URLSearchParams();
  if (filters.state) params.append('state', filters.state);
  if (filters.language) params.append('language', filters.language);
  if (filters.search) params.append('search', filters.search);

  return useQuery({
    queryKey: queryKeys.churches(filters),
    queryFn: async () => {
      const qs = params.toString();
      const { data } = await api.get(`/api/churches${qs ? `?${qs}` : ''}`);
      return data;
    },
  });
}

export function useExplore() {
  return useQuery({
    queryKey: queryKeys.explore,
    queryFn: async () => {
      const { data } = await api.get('/api/explore');
      return data;
    },
  });
}

export function useTriviaQuestions(difficulty) {
  return useQuery({
    queryKey: queryKeys.triviaQuestions(difficulty),
    queryFn: async () => {
      const { data } = await api.get(`/api/trivia/questions${difficulty ? `?difficulty=${difficulty}` : ''}`);
      return data;
    },
    enabled: !!difficulty,
  });
}

export function useTriviaLeaderboard() {
  return useQuery({
    queryKey: queryKeys.triviaLeaderboard,
    queryFn: async () => {
      const { data } = await api.get('/api/trivia/leaderboard');
      return data;
    },
  });
}

// ═══════════════════════════════════════════════════════════
// Mutation Hooks
// ═══════════════════════════════════════════════════════════

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId) => {
      const { data } = await api.post(`/api/posts/${postId}/like`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
}

export function useCommentOnPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, text }) => {
      const { data } = await api.post(`/api/posts/${postId}/comments`, { text });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postData) => {
      const { data } = await api.post('/api/posts', postData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, method = 'post' }) => {
      if (method === 'delete') {
        const { data } = await api.delete(`/api/users/${userId}/follow`);
        return data;
      }
      const { data } = await api.post(`/api/users/${userId}/follow`);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user(variables.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.explore });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, content, messageType }) => {
      const { data } = await api.post(`/api/conversations/${conversationId}/messages`, {
        content,
        message_type: messageType || 'text',
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversationMessages(variables.conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

export function usePrayFor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prayerId) => {
      const { data } = await api.post(`/api/prayers/${prayerId}/pray`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prayers });
    },
  });
}

export function useCreatePrayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prayerData) => {
      const { data } = await api.post('/api/prayers', prayerData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prayers });
    },
  });
}

export function useRegisterEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, method = 'post' }) => {
      if (method === 'delete') {
        const { data } = await api.delete(`/api/events/${eventId}/register`);
        return data;
      }
      const { data } = await api.post(`/api/events/${eventId}/register`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}