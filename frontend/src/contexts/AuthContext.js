import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Shared logic: resolve auth session into a full user object
  const resolveUser = useCallback(async (session) => {
    if (!session?.user) {
      setUser(false);
      return;
    }

    let publicUser = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!publicUser.data) {
      // New user (e.g. first Google sign-in) — create a minimal profile
      const meta = session.user.user_metadata || {};
      const emailLocal = session.user.email?.split('@')[0] || '';
      const baseUsername = (meta.preferred_username || emailLocal).replace(/[^a-z0-9_]/gi, '_').toLowerCase();
      // Ensure uniqueness: append random suffix to avoid UNIQUE constraint violation
      const uniqueSuffix = Date.now().toString(36).slice(-4);
      const fallbackUsername = baseUsername ? `${baseUsername}_${uniqueSuffix}` : `user_${uniqueSuffix}`;

      await supabase.from('users').insert({
        id: session.user.id,
        email: session.user.email,
        name: meta.full_name || meta.name || '',
        username: fallbackUsername,
        profile_image: meta.avatar_url || '',
        status: 'needs_onboarding',
        onboarding_complete: false,
      });

      publicUser = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
    }

    if (publicUser.data) {
      setUser({ ...publicUser.data, _id: publicUser.data.id, email: session.user.email });
    } else {
      setUser({ _id: session.user.id, email: session.user.email });
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await resolveUser(session);
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await resolveUser(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [resolveUser]);

  const register = async (email, password, name, username, role = 'user', state = '', city = '', languages = [], faithBelief = '', faithJourney = '', churchMember = '') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      if (data?.user) {
        // Create user in public.users
        const { error: dbError } = await supabase.from('users').insert({
          id: data.user.id,
          email: email,
          name: name,
          username: username,
          role: role,
          state: state,
          city: city,
          languages: languages,
          faith_journey_status: faithJourney,
          denomination: faithBelief,
          status: 'needs_onboarding',
          onboarding_complete: false,
        });
        
        if (dbError && dbError.code !== '23505') {
          console.error("Error creating public user:", dbError);
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  
  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
        },
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Refresh the current user from the database
  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await resolveUser(session);
    }
  }, [resolveUser]);

  const value = {
    user,
    setUser,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
