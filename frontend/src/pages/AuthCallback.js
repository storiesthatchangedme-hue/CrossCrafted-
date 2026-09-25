import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      // Only process SIGNED_IN or TOKEN_REFRESHED events from the OAuth redirect
      if (event !== 'SIGNED_IN' && event !== 'TOKEN_REFRESHED') return;

      if (!session?.user) {
        navigate('/login', { replace: true, state: { error: 'Authentication failed. Please try again.' } });
        return;
      }

      // Check if public user profile exists
      const { data: publicUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!publicUser) {
        // New user from Google — create a minimal profile
        const meta = session.user.user_metadata || {};
        const emailLocal = session.user.email?.split('@')[0] || '';
        const baseUsername = (meta.preferred_username || emailLocal).replace(/[^a-z0-9_]/gi, '_').toLowerCase();
        const uniqueSuffix = Date.now().toString(36).slice(-4);
        const fallbackUsername = baseUsername ? `${baseUsername}_${uniqueSuffix}` : `user_${uniqueSuffix}`;

        const { error: insertError } = await supabase.from('users').insert({
          id: session.user.id,
          email: session.user.email,
          name: meta.full_name || meta.name || '',
          username: fallbackUsername,
          profile_image: meta.avatar_url || '',
          status: 'needs_onboarding',
          onboarding_complete: false,
          role: 'user',
        });

        if (insertError && insertError.code !== '23505') {
          navigate('/login', { replace: true, state: { error: 'Failed to create profile. Please try again.' } });
          return;
        }
        navigate('/onboarding', { replace: true });
      } else if (!publicUser.onboarding_complete) {
        navigate('/onboarding', { replace: true });
      } else if (publicUser.status === 'rejected') {
        navigate('/login', { replace: true, state: { error: 'Your account has been rejected.' } });
      } else {
        navigate('/app/churches', { replace: true });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#A855F7] border-r-transparent" />
        <p className="mt-4 text-[#94A3B8] font-medium">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;