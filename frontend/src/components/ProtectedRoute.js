import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#A855F7] border-r-transparent" />
          <p className="mt-4 text-[#94A3B8] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Auth gate disabled — signup/login closed for now.
  // Everyone can browse freely. Re-enable the checks below when ready.
  return children;

  // --- Original auth checks (re-enable when opening signup) ---
  // const { user } = useAuth();
  // if (!user || user === false) return <Navigate to="/login" replace />;
  // if (user.role === 'admin') return children;
  // if (user.status === 'rejected') return <Navigate to="/login" replace state={{ error: 'Your account has been rejected.' }} />;
  // if (!user.onboarding_complete) return <Navigate to="/onboarding" replace />;
  // return children;
};
